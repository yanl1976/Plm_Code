/**
 * 快照保鲜 + 在线兜底。
 *
 * 背景：查重跑的是 data/materials.ndjson 这份「快照文件」（由 extract 从 ERP 全量拉取生成），
 * 文件不变则查重结果不变 —— ERP 里后来新增的物料，本地查重看不到。
 * 本模块提供两件事：
 *   1) 快照保鲜：比对「提取时记录的 ERP 指纹」与「当前 ERP 指纹」，判断快照是否过期；
 *   2) 在线兜底：本地文件没命中时，按小类实时查 ERP 补一次（带短超时 + 内存缓存），
 *      保证新增物料环节不会因快照过期而漏判。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { executeQuery } from './db.js'
import { prefixSqlCondition } from './settings.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'data')
const NDJSON = path.join(DATA_DIR, 'materials.ndjson')
const META = path.join(DATA_DIR, 'snapshot-meta.json')

const STALE_DAYS = Number(process.env.SNAPSHOT_STALE_DAYS) || 1 // 文件超过 N 天视为可疑
const PING_TIMEOUT = Number(process.env.SNAPSHOT_PING_TIMEOUT) || 8000
const STATUS_TTL = 5 * 60 * 1000 // 状态缓存 5 分钟，避免频繁打库
const SUB_TTL = 5 * 60 * 1000 // 单小类 ERP 结果缓存 5 分钟

// ---- 本地快照信息（不连库） ----
export function localSnapshot() {
  const out = { fileExists: false, fileMtime: null, ageDays: null, extractedAt: null, total: null, erp: null }
  try {
    if (fs.existsSync(NDJSON)) {
      const st = fs.statSync(NDJSON)
      out.fileExists = true
      out.fileMtime = new Date(st.mtimeMs).toISOString()
      out.ageDays = +((Date.now() - st.mtimeMs) / 86400000).toFixed(1)
    }
  } catch (e) { /* 忽略 */ }
  try {
    if (fs.existsSync(META)) {
      const m = JSON.parse(fs.readFileSync(META, 'utf8'))
      out.extractedAt = m.extractedAt || null
      out.total = m.total != null ? m.total : null
      out.erp = m.erp || null
    }
  } catch (e) { /* 元数据损坏则按无指纹处理 */ }
  return out
}

// extract 结束时写入（记录提取时点的 ERP 指纹，作为后续比对基准）
export function writeSnapshotMeta(meta) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(META, JSON.stringify(meta, null, 2), 'utf8')
  } catch (e) {
    console.error('[snapshot] 写入 snapshot-meta.json 失败:', e.message)
  }
}

// ---- ERP 当前指纹（连库，轻量聚合） ----
export async function erpFingerprint(timeout = PING_TIMEOUT) {
  const prefixSql = prefixSqlCondition()
  const rows = await executeQuery(
    `SELECT COUNT_BIG(*) AS n, MAX(m.FMODIFYDATE) AS maxModify, MAX(m.FMATERIALID) AS maxId
       FROM T_BD_MATERIAL m
      WHERE 1=1${prefixSql}`,
    {}, { timeout }
  )
  const r = rows[0] || {}
  return {
    count: Number(r.n || 0),
    maxModify: r.maxModify ? new Date(r.maxModify).toISOString() : null,
    maxId: r.maxId != null ? Number(r.maxId) : null,
    at: new Date().toISOString(),
  }
}

let statusCache = { at: 0, value: null }

/**
 * 快照状态：本地文件年龄 + ERP 指纹对比，给出是否过期及原因
 * @param {{force?: boolean}} opts
 */
export async function snapshotStatus({ force = false } = {}) {
  if (!force && statusCache.value && Date.now() - statusCache.at < STATUS_TTL) return statusCache.value

  const local = localSnapshot()
  let erp = null
  let error = null
  try {
    erp = await erpFingerprint()
  } catch (e) {
    error = e.message // 库不可用时只按文件年龄判断
  }

  const reasons = []
  if (!local.fileExists) reasons.push('尚未提取物料数据（data/materials.ndjson 不存在）')
  if (local.ageDays != null && local.ageDays > STALE_DAYS) reasons.push(`本地快照已 ${local.ageDays} 天未更新`)
  if (erp && local.erp) {
    if (local.erp.count != null && erp.count !== local.erp.count) {
      reasons.push(`ERP 物料行数 ${local.erp.count} → ${erp.count}`)
    }
    if (local.erp.maxId != null && erp.maxId != null && erp.maxId > local.erp.maxId) {
      reasons.push(`ERP 有新物料（最大 FMATERIALID ${local.erp.maxId} → ${erp.maxId}）`)
    }
    if (local.erp.maxModify && erp.maxModify && String(erp.maxModify) > String(local.erp.maxModify)) {
      reasons.push(`ERP 物料有更新（最晚修改 ${String(local.erp.maxModify).slice(0, 10)} → ${String(erp.maxModify).slice(0, 10)}）`)
    }
  } else if (erp && !local.erp) {
    reasons.push('缺少提取时点的 ERP 指纹，无法判断增量（建议重跑一次提取）')
  }

  const value = {
    local, erp, error,
    stale: reasons.length > 0,
    reasons,
    checkedAt: new Date().toISOString(),
    autoRefresh: process.env.AUTO_REFRESH_SNAPSHOT === '1',
  }
  statusCache = { at: Date.now(), value }
  return value
}

export function invalidateSnapshotStatus() { statusCache = { at: 0, value: null } }

// ---- 在线兜底：按小类实时取 ERP 物料（短超时 + 5 分钟缓存） ----
const subCache = new Map()

export async function erpSubDocs(sub, timeout = 10000) {
  const key = String(sub || '').trim()
  if (!/^[0-9A-Za-z]{4,8}$/.test(key)) return [] // 只接受合法小类编码，避免 LIKE 被注入/扫全表
  const hit = subCache.get(key)
  if (hit && Date.now() - hit.at < SUB_TTL) return hit.rows

  const rows = await executeQuery(
    `SELECT m.FMATERIALID, m.FNUMBER, ml.FNAME, ml.FSPECIFICATION
       FROM T_BD_MATERIAL m
       LEFT JOIN T_BD_MATERIAL_L ml ON ml.FMATERIALID = m.FMATERIALID AND ml.FLOCALEID = 2052
      WHERE m.FNUMBER LIKE @p`,
    { p: key + '%' }, { timeout }
  )
  // 同一 FNUMBER 多副本 → 归并成一条（查重看编码维度，不看副本）
  const map = new Map()
  for (const r of rows) {
    const fn = String(r.FNUMBER || '')
    if (!fn) continue
    const cur = map.get(fn)
    if (!cur) {
      map.set(fn, {
        fnumber: fn,
        name: r.FNAME || '',
        spec: r.FSPECIFICATION || '',
        sub: fn.slice(0, 6),
        mid: r.FMATERIALID != null ? Number(r.FMATERIALID) : null,
      })
    } else if (!cur.spec && r.FSPECIFICATION) {
      cur.spec = r.FSPECIFICATION
      cur.mid = r.FMATERIALID != null ? Number(r.FMATERIALID) : null
    }
  }
  const list = [...map.values()]
  subCache.set(key, { at: Date.now(), rows: list })
  return list
}

export function invalidateErpSub(sub) {
  if (sub) subCache.delete(String(sub))
  else subCache.clear()
}

export default { localSnapshot, writeSnapshotMeta, erpFingerprint, snapshotStatus, invalidateSnapshotStatus, erpSubDocs, invalidateErpSub }

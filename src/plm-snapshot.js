/**
 * PLM 物料快照：接收插件上报、合并落盘、维护元数据。
 *
 * 设计前提（2026-11-14 确认）：
 *   - 3100 是独立服务，不连任何数据库（ERP 直连后期关闭）
 *   - PLM 数据由插件用标准接口（CommonGetObjectDataByFilter）采集后上报
 *   - 只收 10/11/12 前缀、STATEID='Using' 的物料
 *   - 快照字段对齐 ERP 的 materials.ndjson，便于 plm-index.js 直接加载
 *
 * 文件：
 *   data/materials-plm.ndjson      全量快照（一行一条）
 *   data/plm-snapshot-meta.json    元数据（条数、时间、上次同步 ticks、来源）
 *   data/plm-snapshot/uploading/   上报中的分片（完成后清理）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'data')
const SNAPSHOT = path.join(DATA, 'materials-plm.ndjson')
const META = path.join(DATA, 'plm-snapshot-meta.json')
const UPLOAD_DIR = path.join(DATA, 'plm-snapshot', 'uploading')
const CONFIG = path.join(ROOT, 'src', 'config')

const DEFAULT_META = {
  at: null,
  count: 0,
  source: 'PLM',
  mode: 'full',        // full | incremental
  client: '',
  scope: { prefix: ['10', '11', '12'], state: 'Using' },
  lastTicks: 0,        // 上次同步到的 UPDATETIME（.NET ticks）
  elapsedMs: 0,
  batches: 0,
}

function ensureDirs() {
  for (const d of [DATA, UPLOAD_DIR]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
  }
}

export function loadMeta() {
  try {
    return { ...DEFAULT_META, ...JSON.parse(fs.readFileSync(META, 'utf8')) }
  } catch (e) {
    return { ...DEFAULT_META }
  }
}

function saveMeta(m) {
  ensureDirs()
  fs.writeFileSync(META, JSON.stringify(m, null, 2) + '\n', 'utf8')
}

/** 快照文件是否存在、多少行、最后修改时间 */
export function snapshotStatus() {
  const m = loadMeta()
  let exists = false, lines = 0, size = 0, mtime = null
  try {
    const st = fs.statSync(SNAPSHOT)
    exists = true
    size = st.size
    mtime = st.mtimeMs
    const txt = fs.readFileSync(SNAPSHOT, 'utf8')
    for (const line of txt.split('\n')) if (line.trim()) lines++
  } catch (e) { /* 文件不存在 */ }
  return { ...m, exists, lines, size, mtime }
}

/**
 * 生成同步计划：要扫哪些小类、是否全量、上次同步到哪个 ticks
 * @param {{force?:boolean}} opt
 */
export function getPlan(opt) {
  const o = opt || {}
  const m = loadMeta()
  const isFull = !!o.force || !m.at || !m.lastTicks

  // 小类清单：从分类表取 10/11/12 开头的 6 位小类
  let subs = []
  try {
    const cls = JSON.parse(fs.readFileSync(path.join(CONFIG, 'classification.json'), 'utf8'))
    for (const big of cls.categories || []) {
      for (const mid of big.mid || []) {
        for (const sub of mid.sub || []) {
          const code = String(sub.code || '')
          if (/^1[012]\d{4}$/.test(code)) subs.push(code)
        }
      }
    }
  } catch (e) { subs = [] }
  subs.sort()

  return {
    mode: isFull ? 'full' : 'incremental',
    afterTicks: isFull ? 0 : Number(m.lastTicks || 0),
    subs,
    subCount: subs.length,
    lastAt: m.at,
    lastCount: m.count,
    prefix: ['10', '11', '12'],
    state: 'Using',
    // 每批上报多少条
    batchSize: 200,
    // 建议并发（插件侧控制）
    concurrency: 3,
  }
}

/** 清空 uploading 目录 */
export function resetUpload() {
  ensureDirs()
  for (const f of fs.readdirSync(UPLOAD_DIR)) {
    try { fs.unlinkSync(path.join(UPLOAD_DIR, f)) } catch (e) { /* 忽略 */ }
  }
}

/**
 * 接收一批数据
 * @param {{batch:number, items:Array, mode?:string}} body
 */
export function uploadBatch(body) {
  ensureDirs()
  const b = body || {}
  const items = Array.isArray(b.items) ? b.items : []
  if (!items.length) return { received: 0, batch: b.batch || 0 }

  // 只保留合法前缀 + Using（插件侧已过滤，这里二次兜底）
  const kept = []
  for (const it of items) {
    const code = String(it && (it.ECODE || '') || '').trim()
    if (!/^1[012]\d{4}/.test(code)) continue
    if (String(it.STATEID || '') !== 'Using') continue
    kept.push(it)
  }

  const file = path.join(UPLOAD_DIR, 'part-' + String(b.batch || 0).padStart(4, '0') + '.ndjson')
  const lines = kept.map((x) => JSON.stringify(x)).join('\n')
  fs.writeFileSync(file, lines ? lines + '\n' : '', 'utf8')
  return { received: kept.length, filtered: items.length - kept.length, batch: b.batch || 0 }
}

/**
 * 收尾：合并所有分片 → 全量快照
 * @param {{mode?:string, client?:string, lastTicks?:number, elapsedMs?:number, batches?:number}} body
 */
export function finishUpload(body) {
  ensureDirs()
  const b = body || {}
  const files = fs.readdirSync(UPLOAD_DIR).filter((f) => f.startsWith('part-')).sort()
  if (!files.length) return { ok: false, error: '没有收到任何分片数据' }

  // 按 ECODE 去重，保留最后出现的一条（增量场景下新数据覆盖旧数据）
  const byCode = new Map()
  for (const f of files) {
    const txt = fs.readFileSync(path.join(UPLOAD_DIR, f), 'utf8')
    for (const line of txt.split('\n')) {
      if (!line.trim()) continue
      let o
      try { o = JSON.parse(line) } catch (e) { continue }
      const code = String(o.ECODE || '')
      if (code) byCode.set(code, o)
    }
  }

  const mode = String(b.mode || 'full')
  let finalMap = byCode

  if (mode === 'incremental' && fs.existsSync(SNAPSHOT)) {
    // 增量：读旧快照 → 用新数据覆盖同名 → 移除被标为非 Using 的
    finalMap = new Map()
    const txt = fs.readFileSync(SNAPSHOT, 'utf8')
    for (const line of txt.split('\n')) {
      if (!line.trim()) continue
      let o
      try { o = JSON.parse(line) } catch (e) { continue }
      const code = String(o.ECODE || '')
      if (code) finalMap.set(code, o)
    }
    for (const [code, o] of byCode) {
      if (String(o.STATEID || '') === 'Using') finalMap.set(code, o)
      else finalMap.delete(code)   // 状态变成 Stop/GiveUp → 从快照移除
    }
  }

  const rows = [...finalMap.values()].sort((a, c) => String(a.ECODE).localeCompare(String(c.ECODE)))
  const out = rows.map((x) => JSON.stringify(x)).join('\n') + (rows.length ? '\n' : '')
  fs.writeFileSync(SNAPSHOT, out, 'utf8')

  // 记录本次同步到的最大 ticks（下次增量的起点）
  let maxTicks = Number(b.lastTicks || 0)
  for (const o of byCode.values()) {
    const t = Number(o.UPDATETIME || 0)
    if (t > maxTicks) maxTicks = t
  }

  const m = loadMeta()
  const next = {
    ...m,
    at: new Date().toISOString(),
    count: rows.length,
    mode,
    client: String(b.client || ''),
    lastTicks: maxTicks,
    elapsedMs: Number(b.elapsedMs || 0),
    batches: Number(b.batches || files.length),
  }
  saveMeta(next)
  resetUpload()

  return {
    ok: true,
    count: rows.length,
    received: byCode.size,
    mode,
    lastTicks: maxTicks,
    files: files.length,
  }
}

/** 供查重使用：读取快照为数组（按需调，不要在每请求都读） */
export function readSnapshot() {
  if (!fs.existsSync(SNAPSHOT)) return []
  const out = []
  const txt = fs.readFileSync(SNAPSHOT, 'utf8')
  for (const line of txt.split('\n')) {
    if (!line.trim()) continue
    try { out.push(JSON.parse(line)) } catch (e) { /* 跳过坏行 */ }
  }
  return out
}

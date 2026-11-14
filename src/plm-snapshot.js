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

// ============ 与 ERP 快照合并 ============
const ERP_NDJSON = path.join(DATA, 'materials.ndjson')
const MERGED = path.join(DATA, 'materials-merged.ndjson')
const DIFF = path.join(DATA, 'plm-erp-diff.json')

function readNdjson(file) {
  if (!fs.existsSync(file)) return []
  const out = []
  const txt = fs.readFileSync(file, 'utf8')
  for (const line of txt.split('\n')) {
    if (!line.trim()) continue
    try { out.push(JSON.parse(line)) } catch (e) { /* 跳过坏行 */ }
  }
  return out
}

const normStr = (s) => String(s == null ? '' : s).replace(/\s+/g, '').toUpperCase()

/**
 * 用 ERP 快照补齐 PLM 快照，并输出差异。
 *
 * 合并规则（以编码为键）：
 *   PLM 有 + ERP 有  → 用 PLM（数据更新），但记录规格/名称差异
 *   PLM 有 + ERP 无  → 用 PLM（PLM 独有，通常极少）
 *   PLM 无 + ERP 有  → 用 ERP 补齐（历史物料基线，标 SOURCE='ERP'）
 *
 * 输出：
 *   data/materials-merged.ndjson   合并后的完整快照（字段对齐 ERP 格式，plm-index 可直接读）
 *   data/plm-erp-diff.json         差异报告（erpOnly 只存前 500 条 + 总数）
 */
export function mergeWithErp() {
  const plmRows = readSnapshot()
  const erpRows = readNdjson(ERP_NDJSON)
  if (!plmRows.length && !erpRows.length) {
    return { ok: false, error: 'PLM 快照与 ERP 快照都不存在' }
  }

  const map = new Map()
  // ① 先铺 ERP 基线
  for (const e of erpRows) {
    const code = String(e.FNUMBER || '').trim()
    if (!code) continue
    map.set(code, { ...e, SOURCE: 'ERP', SOURCE_NOTE: 'ERP 快照（历史基线）' })
  }
  const erpIndex = new Map(map)

  // ② 用 PLM 覆盖 / 新增
  const plmOnly = []
  const specDiff = []
  const nameDiff = []
  let plmHit = 0
  for (const p of plmRows) {
    const code = String(p.ECODE || '').trim()
    if (!code) continue
    const rec = {
      FNUMBER: code,
      FNAME: String(p.ENAME || '').trim(),
      FSPECIFICATION: String(p.GGXH || '').trim(),
      F_ZXCV_ZYCS: String(p.ZYCS || '').trim(),
      SUBPREFIX: code.length >= 6 ? code.slice(0, 6) : null,
      FMATERIALID: p.EID || '',
      FMASTERID: p.EUID || '',
      FMODIFYDATE: p.UPDATETIME || null,
      UNITNAME: '',
      FMATERIALGROUP: '',
      SOURCE: 'PLM',
      SOURCE_NOTE: 'PLM 实时采集',
    }
    const old = erpIndex.get(code)
    if (old) {
      plmHit++
      const a = normStr(old.FSPECIFICATION)
      const b = normStr(rec.FSPECIFICATION)
      if (a && b && a !== b && specDiff.length < 500) {
        specDiff.push({ code, erp: old.FSPECIFICATION, plm: rec.FSPECIFICATION })
      }
      const na = normStr(old.FNAME)
      const nb = normStr(rec.FNAME)
      if (na && nb && na !== nb && nameDiff.length < 500) {
        nameDiff.push({ code, erp: old.FNAME, plm: rec.FNAME })
      }
    } else if (plmOnly.length < 500) {
      plmOnly.push({ code, name: rec.FNAME, spec: rec.FSPECIFICATION })
    }
    map.set(code, rec)
  }

  // ③ ERP 独有（PLM 没有的）
  const erpOnly = []
  let erpOnlyTotal = 0
  for (const [code, v] of map) {
    if (v.SOURCE !== 'ERP') continue
    erpOnlyTotal++
    if (erpOnly.length < 500) {
      erpOnly.push({ code, name: v.FNAME || '', spec: v.FSPECIFICATION || '' })
    }
  }

  // ④ 写文件
  ensureDirs()
  const merged = [...map.values()].sort((a, b) => String(a.FNUMBER).localeCompare(String(b.FNUMBER)))
  fs.writeFileSync(MERGED, merged.map((x) => JSON.stringify(x)).join('\n') + (merged.length ? '\n' : ''), 'utf8')

  const report = {
    at: new Date().toISOString(),
    counts: {
      merged: merged.length,
      plmSource: merged.filter((x) => x.SOURCE === 'PLM').length,
      erpSource: merged.filter((x) => x.SOURCE === 'ERP').length,
      plmRows: plmRows.length,
      erpRows: erpRows.length,
      plmHitErp: plmHit,
      plmOnly: plmOnly.length,
      erpOnly: erpOnlyTotal,
      specDiff: specDiff.length,
      nameDiff: nameDiff.length,
    },
    note: 'erpOnly/plmOnly/specDiff/nameDiff 均为前 500 条样本，完整数量见 counts',
    plmOnly,
    erpOnly,
    specDiff,
    nameDiff,
  }
  fs.writeFileSync(DIFF, JSON.stringify(report, null, 2) + '\n', 'utf8')

  // 元数据补记合并结果
  const m = loadMeta()
  m.merge = {
    at: report.at,
    merged: merged.length,
    plmSource: report.counts.plmSource,
    erpSource: report.counts.erpSource,
    erpOnly: erpOnlyTotal,
    specDiff: specDiff.length,
  }
  saveMeta(m)

  return { ok: true, ...report.counts, mergedFile: MERGED, diffFile: DIFF }
}

/** 合并快照是否存在 */
export function mergedStatus() {
  try {
    const st = fs.statSync(MERGED)
    let lines = 0
    const txt = fs.readFileSync(MERGED, 'utf8')
    for (const line of txt.split('\n')) if (line.trim()) lines++
    let diff = null
    try { diff = JSON.parse(fs.readFileSync(DIFF, 'utf8')) } catch (e) { diff = null }
    return { exists: true, lines, size: st.size, mtime: st.mtimeMs, counts: diff && diff.counts }
  } catch (e) {
    return { exists: false, lines: 0, counts: null }
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

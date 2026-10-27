/**
 * 物料主数据治理 Web 服务：可视化全流程（提取 -> 规格结构化/分类 -> 强制查重 -> 存量清洗）与结果。
 * 纯 Node 内置 http，无额外依赖。读取 data/ 产物，并提供映射增删、后台重跑等接口。
 *
 * 启动：node src/server.js   （默认端口 3000，可用 PORT 环境变量覆盖）
 */
import http from 'http'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { runExtract } from './extract.js'
import { runDedup } from './dedup.js'
import * as map from './mapping.js'
import * as settings from './settings.js'
import { executeQuery } from './db.js'
import { inspectRow } from './validate.js'
import { applyAiOverlay } from './ai/overlay.js'
import { getCategory } from './classify.js'
import { loadTemplates, buildTree, rebuildMid, addCustomParam, removeCustomParam, saveTemplates } from './feature-templates.js'
import { getOverride, saveOverride, deleteOverride, bulkPrefill, overrideMtime, countParamUsage } from './feature-store.js'
import XLSX from 'xlsx'
import { normalize, tokenize, jaccard, looseSignature, modelOf } from './spec.js'
import { checkMaterial, rules as materialRules, resolveNameFix, detectNameModel } from './material-rules.js'
import * as nameSyn from './name-synonyms.js'
import { snapshotStatus, invalidateSnapshotStatus, erpSubDocs, invalidateErpSub } from './snapshot.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = path.join(ROOT, 'public')
const DATA = path.join(ROOT, 'data')
const CONFIG = path.join(ROOT, 'src', 'config')

// ---- 库存/项目号本地缓存 ----
// 页面上的「现有库存 / 类似型号」直查 ERP 大表（T_STK_INVENTORY / T_HS_BALANCE 维度解码）会慢到分钟级，
// 用户只看到"卡死"。这里改为【缓存优先】：命中缓存零查询秒开；缺失项才补查，且单条查询强制超时，
// 超时只丢该项、不阻塞返回。缓存落盘 data/inv-cache.json（data/ 已 gitignore），重启不丢。
const INV_CACHE_FILE = path.join(DATA, 'inv-cache.json')
const INV_CACHE_TTL = Number(process.env.INV_CACHE_TTL) || 30 * 60 * 1000 // 默认 30 分钟
const INV_QUERY_TIMEOUT = Number(process.env.INV_QUERY_TIMEOUT) || 10000 // 单条交互查询上限 10 秒
let invCache = null
let invCacheDirty = false
let invCacheTimer = null

function loadInvCache() {
  if (invCache) return invCache
  invCache = {}
  try {
    if (fs.existsSync(INV_CACHE_FILE)) {
      const o = JSON.parse(fs.readFileSync(INV_CACHE_FILE, 'utf8'))
      if (o && o.items && typeof o.items === 'object') invCache = o.items
    }
  } catch (e) {
    console.error('[inv-cache] 读取失败，按空缓存处理:', e.message)
    invCache = {}
  }
  return invCache
}
function saveInvCache() {
  if (!invCacheDirty) return
  invCacheDirty = false
  try {
    fs.mkdirSync(DATA, { recursive: true })
    const tmp = INV_CACHE_FILE + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify({ v: 1, at: Date.now(), items: loadInvCache() }))
    fs.renameSync(tmp, INV_CACHE_FILE)
  } catch (e) {
    console.error('[inv-cache] 写入失败:', e.message)
  }
}
function scheduleInvCacheSave() {
  if (invCacheTimer) return
  invCacheTimer = setTimeout(() => { invCacheTimer = null; saveInvCache() }, 2000)
  if (typeof invCacheTimer.unref === 'function') invCacheTimer.unref()
}
// kind: 'inv'(数量/锁库) | 'hs'(项目号/计划跟踪号) | 'name'(名称)
function invCacheGet(mid, kind) {
  const c = loadInvCache()[String(mid)]
  if (!c) return null
  if (Date.now() - (Number(c[kind + 'At']) || 0) > INV_CACHE_TTL) return null
  return c
}
function invCachePut(mid, kind, patch) {
  const all = loadInvCache()
  const cur = all[String(mid)] || {}
  all[String(mid)] = { ...cur, ...patch, [kind + 'At']: Date.now() }
  invCacheDirty = true
  scheduleInvCacheSave()
}
// 项目号按「物料编码」缓存（'fn:' 前缀与按 FMATERIALID 存的库存/名称分开，避免键冲突）
function projCacheGet(fn) { return invCacheGet('fn:' + fn, 'proj') }
function projCachePut(fn, patch) { invCachePut('fn:' + fn, 'proj', patch) }

function readConfigJson(name) {
  const file = path.join(CONFIG, name)
  if (!fs.existsSync(file)) return null
  const mtime = fs.statSync(file).mtimeMs
  const hit = cache.get('cfg:' + name)
  if (hit && hit.mtime === mtime) return hit.data
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  cache.set('cfg:' + name, { mtime, data })
  return data
}

const PORT = Number(process.env.PORT) || 3000

// ---- 带 mtime 缓存的 JSON 读取 ----
const cache = new Map()
function readDataJson(name) {
  const file = path.join(DATA, name)
  if (!fs.existsSync(file)) return null
  const mtime = fs.statSync(file).mtimeMs
  const hit = cache.get(name)
  if (hit && hit.mtime === mtime) return hit.data
  const data = JSON.parse(fs.readFileSync(file, 'utf8'))
  cache.set(name, { mtime, data })
  return data
}
function invalidate(name) { cache.delete(name) }

// ---- 物料特征索引：原始信息 + 策略特征 + 校验状态 ----
// 缓存键同时依赖 原料文件 与 规则/分类配置 的 mtime：改规则或重跑提取都会触发自动重建，
// 否则前端会一直显示构建索引那一刻的旧规则结果（用户看不到规则改动）。
let matIndex = null
function getMaterialIndex() {
  const file = path.join(DATA, 'materials.ndjson')
  if (!fs.existsSync(file)) return null
  const mtime = fs.statSync(file).mtimeMs
  const ruleFile = path.join(CONFIG, 'model-semantics.json')
  const clsFile = path.join(CONFIG, 'classification.json')
  const fieldFile = path.join(CONFIG, 'spec-fields.json')
  const dedupFile = path.join(CONFIG, 'dedup-rules.json')
  const ruleMtime = fs.existsSync(ruleFile) ? fs.statSync(ruleFile).mtimeMs : 0
  const clsMtime = fs.existsSync(clsFile) ? fs.statSync(clsFile).mtimeMs : 0
  const fieldMtime = fs.existsSync(fieldFile) ? fs.statSync(fieldFile).mtimeMs : 0
  const dedupMtime = fs.existsSync(dedupFile) ? fs.statSync(dedupFile).mtimeMs : 0
  const ovMtime = overrideMtime()
  // 规则/分类配置改动也纳入签名：改 spec-fields.json（参数取值正则）或 dedup-rules.json（各中类 tokens）
  // 后无需重跑 extract / 重启，前端刷新即可按新规则重新结构化。
  const sig = Math.max(mtime, ruleMtime, clsMtime, fieldMtime, dedupMtime, ovMtime)
  if (matIndex && matIndex.mtime === sig) return matIndex
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  const items = rows.map((r) => {
    const ins = inspectRow(r)
    const ruleParams = applyAiOverlay(ins.params, r.FNUMBER)
    const ov = getOverride(r.FNUMBER)
    // 人工填报层覆盖规则层（人工值优先；空串表示人工清空）
    const params = ov ? { ...ruleParams, ...ov.params } : ruleParams
    const humanFields = ov ? Object.keys(ov.params || {}) : []
    return {
      fnumber: r.FNUMBER,
      name: r.FNAME || '',
      spec: r.FSPECIFICATION || '',
      unit: r.UNITNAME || '',
      orgId: r.FUSEORGID,
      sub: r.SUBPREFIX || '',
      subName: ins.subName,
      zycs: r.F_ZXCV_ZYCS || '',   // ERP 主要参数（客制字段，原文对照）
      jscs: r.F_ZXCV_JSCS || '',   // ERP 技术参数（客制字段，原文对照）
      params,
      ruleParams,                   // 纯规则提取结果（未叠加人工层），供录入工作台「应用自动提取」
      // AI_EXTRACT=1 时，标出 AI 叠加填补的字段（规则值为空、AI 补上），供前端加 ⚡ 角标区分来源
      aiFields: process.env.AI_EXTRACT === '1'
        ? Object.keys(applyAiOverlay(ins.params, r.FNUMBER)).filter((k) => applyAiOverlay(ins.params, r.FNUMBER)[k] && !ins.params[k])
        : [],
      humanFields,
      model: ov ? (ov.model || '') : '',
      tokens: ins.tokens || [],
      sem: ins.sem || null,
      semGaps: ins.semGaps || [],
      missing: ins.missing,
      errors: ins.errors,
      warns: ins.warns,
      status: ins.errors.length ? 'error' : (ins.missing.length ? 'missing' : 'ok'),
    }
  })
  const statusCounts = { ok: 0, missing: 0, error: 0 }
  let warnCount = 0
  const subMap = new Map()
  for (const it of items) {
    statusCounts[it.status]++
    if (it.warns.length) warnCount++
    const key = `${it.sub}|${it.subName}`
    subMap.set(key, (subMap.get(key) || 0) + 1)
  }
  const subs = [...subMap.entries()].map(([k, count]) => { const [code, name] = k.split('|'); return { code, name, count } })
    .sort((a, b) => b.count - a.count)
  matIndex = { mtime: sig, items, statusCounts, warnCount, subs, builtAt: new Date().toISOString() }
  return matIndex
}

// ---- 后台任务 ----
const jobs = new Map()
let jobSeq = 0
function startJob(label, fn) {
  const id = ++jobSeq
  const job = { id, label, status: 'running', startedAt: new Date().toISOString(), log: [], error: null }
  jobs.set(id, job)
  ;(async () => {
    try { await fn((msg) => { job.log.push(msg) }) ; job.status = 'done' }
    catch (e) { job.status = 'error'; job.error = String(e && e.stack || e) }
  })()
  return id
}

// ---- 工具 ----
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0' })
  res.end(body)
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy() })
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch (e) { reject(e) } })
    req.on('error', reject)
  })
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8' }
function serveStatic(req, res, urlPath) {
  let rel = urlPath === '/' ? '/index.html' : urlPath
  const file = path.join(PUBLIC, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''))
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); res.end('Not found'); return
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
  fs.createReadStream(file).pipe(res)
}

// ---- 阶段状态 ----
function stageStatus() {
  const checkData = (f) => fs.existsSync(path.join(DATA, f)) ? { exists: true, at: fs.statSync(path.join(DATA, f)).mtimeMs } : { exists: false }
  const checkConfig = (f) => fs.existsSync(path.join(CONFIG, f)) ? { exists: true, at: fs.statSync(path.join(CONFIG, f)).mtimeMs } : { exists: false }
  return {
    extract: { ...checkData('materials.ndjson'), note: '全量提取物料' },
    classify: { ...checkConfig('classification.json'), note: 'FNUMBER→小类 分类' },
    dedup: { ...checkData('dedup-exact.json'), note: '强制查重（一物多号）' },
    cleanup: { ...checkData('unified-materials.json'), note: '存量清洗（映射/冻结/统一视图）' },
  }
}

// ---- 新增物料（本地草稿 + 小类流水编码） ----
const NEWMAT_FILE = path.join(DATA, 'new-materials.json')
function readNewMats() {
  if (!fs.existsSync(NEWMAT_FILE)) return { items: [] }
  try {
    const d = JSON.parse(fs.readFileSync(NEWMAT_FILE, 'utf8'))
    return { items: Array.isArray(d.items) ? d.items : [] }
  } catch (e) { return { items: [] } }
}
function writeNewMats(d) {
  const tmp = NEWMAT_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2))
  fs.renameSync(tmp, NEWMAT_FILE) // 原子替换，避免半写入损坏
}
// 型号段提取缓存：spec 字符串在库内重复率高（同一规格多条物料），
// 缓存后 spec-suggest / spec-check 不必每次对 2 万多条重新跑正则。
const specModelCache = new Map()
function cachedModel(spec) {
  const k = String(spec || '')
  if (specModelCache.has(k)) return specModelCache.get(k)
  const v = modelOf(k)
  if (specModelCache.size < 30000) specModelCache.set(k, v)
  return v
}

// 物料原文轻量索引（仅编码/名称/规格/小类/单位），供流水分配与规格联想/查重
let _docsCache = null
function allDocs() {
  const file = path.join(DATA, 'materials.ndjson')
  if (!fs.existsSync(file)) return []
  const mtime = fs.statSync(file).mtimeMs
  if (_docsCache && _docsCache.mtime === mtime) return _docsCache.list
  const list = []
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      const o = JSON.parse(line)
      if (!o.FNUMBER) continue
      list.push({
        fnumber: String(o.FNUMBER), name: o.FNAME || '', spec: o.FSPECIFICATION || '',
        sub: String(o.SUBPREFIX || ''), unit: o.UNITNAME || '',
        mid: o.FMATERIALID != null ? Number(o.FMATERIALID) : null,
      })
    } catch (e) { /* 跳过坏行 */ }
  }
  _docsCache = { mtime, list }
  return list
}
// 小类内名称使用频次：一次遍历建表并按 mtime 缓存
// 用途一：录入页「本小类常用名称」参考
// 用途二：判断输入的短名是否已是「在用完整名称」，避免把「端子」误判成「端子标记」还没打完
let _nameFreqCache = null
function nameFreqTable() {
  const file = path.join(DATA, 'materials.ndjson')
  if (!fs.existsSync(file)) return new Map()
  const mtime = fs.statSync(file).mtimeMs
  if (_nameFreqCache && _nameFreqCache.mtime === mtime) return _nameFreqCache.bySub
  const bySub = new Map()
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    let o
    try { o = JSON.parse(line) } catch (e) { continue }
    const sub = String(o.SUBPREFIX || '').trim()
    const nm = String(o.FNAME || '').trim()
    if (!sub || !nm) continue
    let m = bySub.get(sub)
    if (!m) { m = new Map(); bySub.set(sub, m) }
    m.set(nm, (m.get(nm) || 0) + 1)
  }
  _nameFreqCache = { mtime, bySub }
  return bySub
}
function nameCountInSub(sub, name) {
  const m = nameFreqTable().get(String(sub || '').trim())
  return m ? (m.get(String(name || '').trim()) || 0) : 0
}
function frequentNamesInSub(sub, limit = 8) {
  const m = nameFreqTable().get(String(sub || '').trim())
  if (!m) return []
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

// 小类流水：存量物料号（小类6位 + 5位流水）与草稿中的最大流水
function maxSeqForSub(sub, drafts) {
  let max = 0
  const take = (fn) => {
    const s = String(fn || '')
    if (s.length !== 11 || !s.startsWith(sub)) return
    const tail = s.slice(6)
    if (/^\d{5}$/.test(tail)) max = Math.max(max, parseInt(tail, 10))
  }
  for (const d of allDocs()) take(d.fnumber)
  for (const d of (drafts.items || [])) take(d.code)
  return max
}
// 串行化编码分配：单进程内避免并发请求拿到同一流水
let newMatLock = Promise.resolve()
function withNewMatLock(fn) {
  const run = newMatLock.then(fn, fn)
  newMatLock = run.catch(() => {})
  return run
}
// 分类元数据：大类 → 中类 → 小类（含默认仓库），供新增物料联动下拉
function newMatMeta() {
  const map = readConfigJson('classification-map.json') || {}
  const bigs = new Map()
  for (const v of Object.values(map)) {
    if (!v || !v.big || !v.sub) continue
    let b = bigs.get(v.big)
    if (!b) { b = { big: v.big, bigName: v.bigName || '', mids: new Map() }; bigs.set(v.big, b) }
    let m = b.mids.get(v.mid)
    if (!m) { m = { midKey: v.big + v.mid, midName: v.midName || '', subs: [] }; b.mids.set(v.mid, m) }
    m.subs.push({ sub: v.sub, subName: v.subName || '', wh: v.wh || '' })
  }
  return [...bigs.values()].map((b) => ({
    big: b.big, bigName: b.bigName,
    mids: [...b.mids.values()].map((m) => ({ ...m, subs: m.subs.sort((x, y) => x.sub.localeCompare(y.sub)) })),
  }))
}
function subInfo(sub) {
  return (readConfigJson('classification-map.json') || {})[sub] || null
}

// 批量查询若干物料ID的即时库存汇总（数量/可用/锁库），用于规格联想与查重列表带出库存
async function inventoryMapByMaterialIds(ids) {
  const uniq = [...new Set((ids || []).map(Number).filter((n) => Number.isInteger(n)))]
  if (!uniq.length) return {}
  const params = {}
  const ph = uniq.map((id, i) => { params['id' + i] = id; return '@id' + i }).join(',')
  const rows = await executeQuery(
    `SELECT FMATERIALID, FBASEQTY, FBASELOCKQTY
       FROM T_STK_INVENTORY
      WHERE FMATERIALID IN (${ph}) AND ISNULL(FISEFFECTIVED, '1') = '1'`,
    params, { timeout: INV_QUERY_TIMEOUT }
  )
  const map = {}
  for (const r of rows) {
    const id = Number(r.FMATERIALID)
    const g = map[id] || (map[id] = { qty: 0, avbqty: 0, lockqty: 0 })
    const q = Number(r.FBASEQTY || 0), l = Number(r.FBASELOCKQTY || 0)
    g.qty += q; g.lockqty += l; g.avbqty += Math.max(0, q - l)
  }
  return map
}

// 按物料ID集合汇总即时库存（数量取 FBASEQTY；可用量动态计算 = 数量 - 锁库量）
async function summarizeInventory(ids, code) {
  const params = {}
  const ph = ids.map((id, i) => { params['id' + i] = Number(id); return '@id' + i }).join(',')
  const rows = await executeQuery(
    `SELECT i.FMATERIALID, i.FSTOCKORGID, i.FSTOCKID, i.FSTOCKLOCID, i.FSTOCKSTATUSID, i.FLOT,
            i.FBASEQTY, i.FBASELOCKQTY, i.FBASEUNITID, i.FPRODUCEDATE, i.FEXPIRYDATE
       FROM T_STK_INVENTORY i
      WHERE i.FMATERIALID IN (${ph}) AND ISNULL(i.FISEFFECTIVED, '1') = '1'`,
    params, { timeout: INV_QUERY_TIMEOUT }
  )
  const num = (v) => Number(v || 0)
  const unitId = (rows.find((r) => r.FBASEUNITID != null) || {}).FBASEUNITID
  let unitName = ''
  if (unitId != null) {
    try {
      const u = await executeQuery('SELECT TOP 1 FNAME FROM T_BD_UNIT_L WHERE FLOCALEID = 2052 AND FUNITID = @id', { id: unitId }, { timeout: INV_QUERY_TIMEOUT })
      unitName = (u[0] && u[0].FNAME) || ''
    } catch (e) { /* 单位名称表不可用则留空 */ }
  }
  const stockIds = [...new Set(rows.map((r) => r.FSTOCKID).filter((x) => x != null))]
    .map(Number).filter((n) => Number.isInteger(n))
  const stockNames = {}
  if (stockIds.length) {
    try {
      const list = await executeQuery(`SELECT FSTOCKID, FNAME FROM T_BD_STOCK_L WHERE FLOCALEID = 2052 AND FSTOCKID IN (${stockIds.join(',')})`, {}, { timeout: INV_QUERY_TIMEOUT })
      for (const x of list) stockNames[x.FSTOCKID] = x.FNAME
    } catch (e) { /* 仓库名称表不可用则显示仓库ID */ }
  }
  let qty = 0, avb = 0, lock = 0
  const byStock = new Map()
  const details = []
  for (const r of rows) {
    const q = num(r.FBASEQTY), l = num(r.FBASELOCKQTY)
    // 可用量动态计算：库存量 - 锁库量。
    // 注意：FBASEAVBQTY 存储列在本库未维护（金蝶运行时报表为动态计算），不能直接读取。
    const a = Math.max(0, q - l)
    qty += q; avb += a; lock += l
    const sid = r.FSTOCKID != null ? Number(r.FSTOCKID) : null
    const g = byStock.get(sid) || {
      stockId: sid, stockName: stockNames[sid] || (sid != null ? '仓库#' + sid : ''), qty: 0, avbqty: 0, lockqty: 0, lines: 0,
    }
    g.qty += q; g.avbqty += a; g.lockqty += l; g.lines++
    byStock.set(sid, g)
    if (details.length < 200) {
      details.push({
        stockId: sid, stockName: stockNames[sid] || '',
        stockLocId: r.FSTOCKLOCID != null ? Number(r.FSTOCKLOCID) : null,
        stockStatusId: r.FSTOCKSTATUSID != null ? Number(r.FSTOCKSTATUSID) : null,
        lot: r.FLOT != null ? Number(r.FLOT) : null,
        qty: q, avbqty: a, lockqty: l,
        produceDate: r.FPRODUCEDATE || null, expiryDate: r.FEXPIRYDATE || null,
      })
    }
  }
  return {
    code, available: true, found: true, unit: unitName,
    total: { qty, avbqty: avb, lockqty: lock },
    warehouses: [...byStock.values()].sort((x, y) => y.qty - x.qty),
    details, rowCount: rows.length,
  }
}

// 即时库存：按物料编码 → 本地主数据中的 FMATERIALID → T_STK_INVENTORY 汇总
async function queryInventory(code) {
  const ids = [...new Set(allDocs().filter((d) => d.fnumber === code).map((d) => d.mid).filter((x) => x != null))]
  if (!ids.length) {
    return {
      code, available: true, found: false,
      total: { qty: 0, avbqty: 0, lockqty: 0 }, unit: '', warehouses: [], details: [],
      note: '该物料尚未在 ERP 中建立，暂无库存',
    }
  }
  return summarizeInventory(ids, code)
}

// 匹配同小类「完全相同 → 高度相似 → 关键片段（牌号等）包含」的存量物料
function matchSimilarDocs(sub, spec, excludeCode) {
  const qn = normalize(spec), qt = tokenize(spec)
  // 关键片段（牌号等）：要求出现在分隔符/开头之后，避免 "T2" 误命中 "OT2.5-16"
  const frags = qn.split(/[^a-z0-9]+/).filter((x) => x.length >= 2)
  const fragRes = frags.map((f) => new RegExp('(?:^|[^a-z0-9])' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  const exact = [], similar = [], related = []
  const seen = new Set()
  for (const d of allDocs()) {
    if (!d.spec || d.mid == null) continue
    if (d.fnumber === excludeCode) continue
    if (d.sub !== sub && !d.fnumber.startsWith(sub)) continue
    if (seen.has(d.fnumber)) continue
    const dn = normalize(d.spec)
    if (!dn) continue
    if (dn === qn) { exact.push(d); seen.add(d.fnumber); continue }
    const s = jaccard(qt, tokenize(d.spec))
    if (s >= 0.5) { similar.push({ d, s }); seen.add(d.fnumber); continue }
    if (fragRes.length && fragRes.some((re) => re.test(dn))) { related.push(d); seen.add(d.fnumber) }
  }
  similar.sort((a, b) => b.s - a.s)
  return [...exact, ...similar.map((x) => x.d), ...related].slice(0, 50)
}

// 现有库存：只统计「规格完全相同」的存量物料（相似规格仅在「类似型号」弹窗展示）
async function refInventory(sub, spec, excludeCode) {
  const qn = normalize(spec)
  const seen = new Set()
  const matched = []
  for (const d of allDocs()) {
    if (!d.spec || d.mid == null) continue
    if (d.fnumber === excludeCode) continue
    if (d.sub !== sub && !d.fnumber.startsWith(sub)) continue
    if (seen.has(d.fnumber)) continue
    if (normalize(d.spec) !== qn) continue
    matched.push(d); seen.add(d.fnumber)
  }
  const base = {
    available: true, found: false, mode: 'reference',
    matched: matched.map((d) => ({ fnumber: d.fnumber, spec: d.spec })),
  }
  if (!matched.length) {
    return { ...base, total: { qty: 0, avbqty: 0, lockqty: 0 }, unit: '', warehouses: [], details: [], note: '无完全相同规格的存量物料，可点「类似型号」查看相似物料' }
  }
  const ids = [...new Set(matched.map((d) => d.mid))]
  const sum = await summarizeInventory(ids, null)
  return { ...sum, mode: 'reference', matched: base.matched }
}

// 补缓存：即时库存数量/锁库量（T_STK_INVENTORY 聚合）
async function fillInvCache(ids, timeout = INV_QUERY_TIMEOUT) {
  const params = {}
  const ph = ids.map((id, i) => { params['id' + i] = Number(id); return '@id' + i }).join(',')
  const rows = await executeQuery(
    `SELECT FMATERIALID, ISNULL(SUM(FBASEQTY), 0) AS qty,
            ISNULL(SUM(FBASELOCKQTY), 0) AS lockqty,
            MAX(NULLIF(FPROJECTNO, '')) AS projectNo
       FROM T_STK_INVENTORY
      WHERE FMATERIALID IN (${ph}) AND ISNULL(FISEFFECTIVED, '1') = '1'
      GROUP BY FMATERIALID`,
    params, { timeout }
  )
  const got = new Map()
  for (const r of rows) {
    got.set(Number(r.FMATERIALID), {
      qty: Number(r.qty || 0), lockqty: Number(r.lockqty || 0), projectNo: r.projectNo || '',
    })
  }
  for (const id of ids) {
    const g = got.get(Number(id)) || { qty: 0, lockqty: 0, projectNo: '' }
    invCachePut(id, 'inv', { qty: g.qty, lockqty: g.lockqty, projectNo: g.projectNo })
  }
}

// 补缓存：项目号（按物料编码取最近一次业务发生）
//
// 【不要再从存货收发存汇总取项目号】实测本账套：
//   T_HS_STOCKDIMENSION 全表 35503 行，FPROJECTNO / FMTONO 100% 是单个空格（DATALENGTH=2），
//   即「库存维度」根本没维护项目号/跟踪号；T_STK_INVENTORY.FPROJECTNO 同样全空。
//   且 T_HS_BALANCE 是核算引擎按「核算组织 + 会计期间」算出的余额快照（FID 与 FDIMENSIONID 一一对应），
//   直接 JOIN 维度表取业务属性本身就不是报表口径。
// 可靠来源 = 业务单据：采购入库分录 / 生产领料单头上的 F_PJQF_XMDA（存的是项目档案 FID，
//   需 JOIN PJQF_T_XMDA 取 FNUMBER），取该物料最近一次发生的那笔。
// 按 FNUMBER 归集，避免同一编码多个 FMATERIALID 副本漏数据。
async function fillProjectCache(fns, timeout = INV_QUERY_TIMEOUT) {
  const list = [...new Set(fns.map(String))]
  if (!list.length) return
  const params = {}
  const ph = list.map((f, i) => { params['f' + i] = f; return '@f' + i }).join(',')
  const rows = await executeQuery(
    `WITH src AS (
        SELECT m.FNUMBER AS fn, ic.FDATE AS d, e.F_PJQF_XMDA AS pid
          FROM T_STK_INSTOCKENTRY e
          INNER JOIN T_STK_INSTOCK ic ON ic.FID = e.FID
          INNER JOIN T_BD_MATERIAL m ON m.FMATERIALID = e.FMATERIALID
         WHERE m.FNUMBER IN (${ph}) AND ISNULL(e.F_PJQF_XMDA, 0) <> 0
        UNION ALL
        SELECT m.FNUMBER, pk.FDATE, pk.F_PJQF_XMDA
          FROM T_PRD_PICKMTRLDATA pd
          INNER JOIN T_PRD_PICKMTRL pk ON pk.FID = pd.FID
          INNER JOIN T_BD_MATERIAL m ON m.FMATERIALID = pd.FMATERIALID
         WHERE m.FNUMBER IN (${ph}) AND ISNULL(pk.F_PJQF_XMDA, 0) <> 0
     ), r AS (
        SELECT fn, d, pid, ROW_NUMBER() OVER (PARTITION BY fn ORDER BY d DESC) AS rn FROM src
     )
     SELECT r.fn AS fn, pj.FNUMBER AS projectNo, CONVERT(varchar(10), r.d, 120) AS lastDate
       FROM r INNER JOIN PJQF_T_XMDA pj ON pj.FID = r.pid
      WHERE r.rn = 1`,
    params, { timeout }
  )
  const got = new Map()
  for (const r of rows) got.set(String(r.fn), { projectNo: r.projectNo || '', lastDate: r.lastDate || '' })
  for (const fn of list) {
    const g = got.get(fn) || { projectNo: '', lastDate: '' }
    projCachePut(fn, { projectNo: g.projectNo, lastDate: g.lastDate })
  }
}

// 补缓存：物料名称（多语言表）
async function fillNameCache(ids) {
  const params = {}
  const ph = ids.map((id, i) => { params['id' + i] = Number(id); return '@id' + i }).join(',')
  const rows = await executeQuery(
    `SELECT FMATERIALID, FNAME FROM T_BD_MATERIAL_L WHERE FLOCALEID = 2052 AND FMATERIALID IN (${ph})`,
    params, { timeout: INV_QUERY_TIMEOUT }
  )
  const got = new Map()
  for (const r of rows) got.set(Number(r.FMATERIALID), r.FNAME || '')
  for (const id of ids) invCachePut(id, 'name', { name: got.get(Number(id)) || '' })
}

// 前台补查超时 → 后台用更长超时继续跑，跑完写缓存（下次打开项目号/库存自动回填）。
// 同一批物料只跑一次，避免重复扫大表把库压垮。
const bgFills = new Set()
function bgFill(kind, ids) {
  const key = kind + ':' + ids.map(String).sort().join(',')
  if (bgFills.has(key)) return
  bgFills.add(key)
  const timer = setTimeout(async () => {
    try {
      if (kind === 'proj') await fillProjectCache(ids, 60000)
      else await fillInvCache(ids, 60000)
      console.log(`[inv-cache] 后台补齐 ${kind} 成功：${ids.length} 个`)
    } catch (e) {
      console.error(`[inv-cache] 后台补齐 ${kind} 失败：${e.message}`)
    } finally {
      bgFills.delete(key)
    }
  }, 500)
  if (typeof timer.unref === 'function') timer.unref()
}

// 类似型号明细：物料号/名称/规格/当前库存数量/项目号
// 缓存优先：命中 data/inv-cache.json 直接出数；缺失项才补查，单条查询 10 秒超时，
// 超时/报错只丢该项，绝不阻塞整页（历史上这里会一直等到 120 秒 requestTimeout）。
async function similarModels(sub, spec, excludeCode, opts = {}) {
  const matched = matchSimilarDocs(sub, spec, excludeCode)
  const ids = [...new Set(matched.map((d) => d.mid))]
  if (!ids.length) return { items: [], total: { qty: 0, avbqty: 0 } }

  const fresh = !!opts.refresh
  const fns = [...new Set(matched.map((d) => d.fnumber))]
  const needInv = [], needProj = [], needName = []
  for (const id of ids) {
    if (fresh || !invCacheGet(id, 'inv')) needInv.push(id)
    if (fresh || !invCacheGet(id, 'name')) needName.push(id)
  }
  for (const fn of fns) if (fresh || !projCacheGet(fn)) needProj.push(fn)
  const tasks = []
  let invOk = true, projOk = true
  if (needInv.length) tasks.push(fillInvCache(needInv).catch((e) => { invOk = false; throw e }))
  if (needProj.length) tasks.push(fillProjectCache(needProj).catch((e) => { projOk = false; throw e }))
  if (needName.length) tasks.push(fillNameCache(needName))
  if (tasks.length) await Promise.allSettled(tasks) // 单项失败/超时不影响其它项
  // 超时项转后台继续补，页面先返回（后台跑完写缓存，下次打开即自动回填）
  if (needInv.length && !invOk) bgFill('inv', needInv)
  if (needProj.length && !projOk) bgFill('proj', needProj)

  let pending = 0
  const items = matched.map((d) => {
    const c = invCacheGet(d.mid, 'inv')
    const pj = projCacheGet(d.fnumber)
    const nm = invCacheGet(d.mid, 'name')
    if (!c || !pj) pending++
    const qty = c ? Number(c.qty || 0) : 0
    const lockqty = c ? Number(c.lockqty || 0) : 0
    return {
      fnumber: d.fnumber,
      name: (nm && nm.name) || d.name || '',
      spec: d.spec || '',
      qty,
      avbqty: Math.max(0, qty - lockqty),
      // 项目号来自该物料最近一次业务单据（采购入库/生产领料）
      projectNo: (pj && pj.projectNo) || '',
      projectLastDate: (pj && pj.lastDate) || '',
      cached: !!(c && pj),
    }
  }).sort((a, b) => b.qty - a.qty)
  const total = items.reduce((s, x) => ({ qty: s.qty + x.qty, avbqty: s.avbqty + x.avbqty }), { qty: 0, avbqty: 0 })
  return { items, total, pending, cachedCount: items.length - pending }
}

// ---- 路由 ----
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const p = url.pathname
  try {
    if (p === '/api/overview') {
      const stats = readDataJson('stats.json') || {}
      const report = readDataJson('dedup-report.json') || {}
      return sendJson(res, 200, { stages: stageStatus(), stats, report })
    }

    if (p === '/api/clusters') {
      const all = readDataJson('dedup-exact.json') || []
      const conf = url.searchParams.get('confidence') // high|low|''
      const sub = url.searchParams.get('sub') || ''
      const q = (url.searchParams.get('q') || '').trim().toLowerCase()
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
      const pageSize = Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10))
      let list = all
      if (conf) list = list.filter((c) => c.confidence === conf)
      if (sub) list = list.filter((c) => (c.sub || '').includes(sub) || (c.subName || '').includes(sub))
      if (q) list = list.filter((c) => (c.signature + '|' + (c.subName || '')).toLowerCase().includes(q) ||
        c.members.some((m) => (m.fName + '|' + m.fSpec + '|' + m.fNumber).toLowerCase().includes(q)))
      const total = list.length
      const totalMembers = list.reduce((s, c) => s + c.members.length, 0)
      const items = list.slice((page - 1) * pageSize, page * pageSize).map((c, i) => ({
        index: all.indexOf(c), sub: c.sub, subName: c.subName, signature: c.signature,
        confidence: c.confidence, distinctFNumbers: c.distinctFNumbers, memberCount: c.members.length,
        fNumbers: [...new Set(c.members.map((m) => m.fNumber))],
        sampleNames: [...new Set(c.members.map((m) => m.fName))].slice(0, 3),
      }))
      return sendJson(res, 200, { total, totalMembers, page, pageSize, items })
    }

    if (p === '/api/cluster') {
      const idx = parseInt(url.searchParams.get('index') || '-1', 10)
      const all = readDataJson('dedup-exact.json') || []
      const c = all[idx]
      if (!c) return sendJson(res, 404, { error: 'not found' })
      // 注入品牌语义（物料特征索引按编码查），供查重页对照「原始规格 ↔ 结构化参数 ↔ 生产商编码含义」
      const mi = getMaterialIndex()
      if (mi) {
        const semByNo = {}
        for (const it of mi.items) if (it.sem && !semByNo[it.fnumber]) semByNo[it.fnumber] = it.sem
        c.members = c.members.map((m) => ({ ...m, sem: semByNo[m.fNumber] || null }))
      }
      return sendJson(res, 200, c)
    }

    if (p === '/api/materials') {
      const idx = getMaterialIndex()
      if (!idx) return sendJson(res, 404, { error: 'materials.ndjson 不存在，请先运行提取' })
      const sub = (url.searchParams.get('sub') || '').trim().toLowerCase()
      const status = url.searchParams.get('status') || ''
      const q = (url.searchParams.get('q') || '').trim().toLowerCase()
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
      const pageSize = Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10))
      let list = idx.items
      if (sub) list = list.filter((m) => m.subName.toLowerCase().includes(sub) || m.sub.includes(sub))
      if (['ok', 'missing', 'error'].includes(status)) list = list.filter((m) => m.status === status)
      if (q) list = list.filter((m) => m.fnumber.toLowerCase().includes(q) || m.name.toLowerCase().includes(q) || m.spec.toLowerCase().includes(q))
      const human = url.searchParams.get('human') || ''
      if (human === '1') list = list.filter((m) => (m.humanFields || []).length > 0)
      if (human === '0') list = list.filter((m) => !(m.humanFields || []).length)
      const val = readDataJson('extract-validation.json')
      return sendJson(res, 200, {
        meta: {
          total: idx.items.length,
          filtered: list.length,
          page, pageSize,
          builtAt: idx.builtAt,
          ruleVersion: val?.ruleVersion || '',
          validationPass: val?.pass ?? null,
          statusCounts: idx.statusCounts,
          warnCount: idx.warnCount,
        },
        subs: idx.subs,
        items: list.slice((page - 1) * pageSize, page * pageSize),
      })
    }

    if (p === '/api/classification') {
      const cls = readConfigJson('classification.json') || {}
      const map2 = readConfigJson('classification-map.json') || {}
      return sendJson(res, 200, { tree: cls, subCount: Object.keys(map2).length })
    }

    if (p === '/api/settings') {
      if (req.method === 'GET') return sendJson(res, 200, settings.loadSettings())
      if (req.method === 'PUT') {
        const b = await readBody(req)
        const s = settings.saveSettings(b)
        return sendJson(res, 200, s)
      }
    }

    // 删除参数定义前：统计某中类下有多少物料已给该参数赋过值（保护物料已录入数据）
    if (p === '/api/feature-param-usage') {
      const midKey = (url.searchParams.get('midKey') || '').trim()
      const name = (url.searchParams.get('name') || '').trim()
      return sendJson(res, 200, { midKey, name, count: (midKey && name) ? countParamUsage(midKey, name) : 0 })
    }

    // ---- 特征参数录入（新增菜单）----
    if (p === '/api/feature-templates') {
      const tpl = loadTemplates()
      if (req.method === 'GET') {
        return sendJson(res, 200, { canonicalOrder: tpl.canonicalOrder, tree: buildTree(tpl.templates), templates: tpl.templates, customParams: tpl.customParams || {} })
      }
      if (req.method === 'PUT') {
        const b = await readBody(req)
        // 新增「按中类私有」的自定义参数名（作用域：仅该中类及其下小类，不共享同大类其它中类）
        if (b.action === 'addCustomParam' && b.midKey && typeof b.name === 'string') {
          const name = b.name.trim()
          if (!name) return sendJson(res, 400, { error: '参数名不能为空' })
          addCustomParam(tpl, b.midKey, name)
          saveTemplates(tpl)
          return sendJson(res, 200, { ok: true, midKey: b.midKey, customParams: tpl.customParams })
        }
        // 从某中类的自定义参数池中删除某项（仅去候选，不影响已加入该中类参数列表的值）
        if (b.action === 'removeCustomParam' && b.midKey && typeof b.name === 'string') {
          removeCustomParam(tpl, b.midKey, b.name.trim())
          saveTemplates(tpl)
          return sendJson(res, 200, { ok: true, midKey: b.midKey, customParams: tpl.customParams })
        }
        // 复位某个中类到默认（重新由 heuristics 生成）
        if (b.action === 'reset' && b.midKey) {
          const rebuilt = rebuildMid(tpl, b.midKey)
          saveTemplates(rebuilt)
          return sendJson(res, 200, { ok: true, midKey: b.midKey })
        }
        // 复位某个小类：删除其独立参数，回落到所属中类默认
        if (b.action === 'resetSub' && b.midKey && b.sub) {
          const e = tpl.templates[b.midKey]
          if (e && e.subParams) { delete e.subParams[b.sub]; if (Object.keys(e.subParams).length === 0) delete e.subParams }
          saveTemplates(tpl)
          return sendJson(res, 200, { ok: true, midKey: b.midKey, sub: b.sub })
        }
        // 更新某中类/小类参数顺序与集合（midKey=小类前4位；sub 可选，存在则保存到该小类的独立参数 subParams）
        if (b.midKey && Array.isArray(b.params)) {
          const cur = tpl.templates[b.midKey] || {}
          tpl.templates[b.midKey] = { ...cur, midKey: b.midKey }
          if (b.sub) {
            if (!tpl.templates[b.midKey].subParams) tpl.templates[b.midKey].subParams = {}
            tpl.templates[b.midKey].subParams[b.sub] = b.params
          } else {
            tpl.templates[b.midKey].params = b.params
          }
          if (b.midName) tpl.templates[b.midKey].midName = b.midName
          if (b.bigName) tpl.templates[b.midKey].bigName = b.bigName
          saveTemplates(tpl)
          return sendJson(res, 200, { ok: true, midKey: b.midKey, sub: b.sub || null })
        }
        return sendJson(res, 400, { error: '需要 {midKey, params} 或 {action:"reset", midKey}' })
      }
    }

    if (p === '/api/feature-material') {
      const fnumber = (url.searchParams.get('fnumber') || '').trim()
      const idx = getMaterialIndex()
      if (!idx) return sendJson(res, 404, { error: 'materials.ndjson 不存在' })
      const it = idx.items.find((i) => i.fnumber === fnumber)
      if (!it) return sendJson(res, 404, { error: '未找到物料 ' + fnumber })
      const info = getCategory(it.sub)
      const midKey = String(it.sub).slice(0, 4)
      const mid = info?.mid
      const tpl = loadTemplates()
      const tplEntry = tpl.templates[midKey] || null
      const subParams = tplEntry && tplEntry.subParams && tplEntry.subParams[it.sub]
      const templateParams = subParams || (tplEntry ? tplEntry.params : (it.tokens || []))
      return sendJson(res, 200, {
        fnumber: it.fnumber, name: it.name, spec: it.spec, zycs: it.zycs, jscs: it.jscs,
        sub: it.sub, subName: it.subName, midKey, mid, midName: (tplEntry && tplEntry.midName) || info?.midName || '',
        bigName: (tplEntry && tplEntry.bigName) || info?.bigName || '',
        templateParams, ruleParams: it.ruleParams, decodeSuggestions: it.sem || null,
        override: getOverride(fnumber), status: it.status, missing: it.missing,
      })
    }

    if (p === '/api/feature-override') {
      if (req.method === 'POST') {
        const b = await readBody(req)
        if (!b.fnumber) return sendJson(res, 400, { error: '缺少 fnumber' })
        // 仅保存非空值；清空某字段=从该物料覆盖层删除（回落到规则值）
        const params = {}
        for (const [k, v] of Object.entries(b.params || {})) if (String(v).trim() !== '') params[k] = String(v).trim()
        const custom = (b.custom || []).filter((c) => c && String(c.value || '').trim() !== '' && String(c.name || '').trim() !== '')
          .map((c) => ({ name: String(c.name).trim(), value: String(c.value).trim() }))
        const saved = saveOverride(b.fnumber, { mid: b.mid || '', params, custom, by: b.by || 'web', model: b.model || '' })
        invalidate('materials.ndjson') // 触发索引重建（含覆盖层 mtime）
        return sendJson(res, 200, { ok: true, saved })
      }
      if (req.method === 'DELETE') {
        const fnumber = (url.searchParams.get('fnumber') || '').trim()
        if (!fnumber) return sendJson(res, 400, { error: '缺少 fnumber' })
        const ok = deleteOverride(fnumber)
        invalidate('materials.ndjson')
        return sendJson(res, 200, { ok, fnumber })
      }
    }

    if (p === '/api/feature-bulk-apply' && req.method === 'POST') {
      const b = await readBody(req)
      const fnumbers = Array.isArray(b.fnumbers) ? b.fnumbers : []
      if (!fnumbers.length) return sendJson(res, 400, { error: '缺少 fnumbers' })
      const idx = getMaterialIndex()
      const entries = []
      for (const fn of fnumbers) {
        const it = idx.items.find((i) => i.fnumber === fn)
        if (!it) continue
        entries.push({ fnumber: fn, mid: String(it.sub).slice(0, 4), params: it.params, custom: [] })
      }
      const n = bulkPrefill(entries)
      invalidate('materials.ndjson')
      return sendJson(res, 200, { ok: true, applied: n })
    }

    if (p === '/api/orgs') {
      const list = await executeQuery(`
        SELECT o.FORGID AS id, o.FNUMBER AS number, ol.FNAME AS name, COUNT(m.FMATERIALID) AS materialCount
        FROM T_ORG_ORGANIZATIONS o
        LEFT JOIN T_ORG_ORGANIZATIONS_L ol ON ol.FORGID = o.FORGID AND ol.FLOCALEID = 2052
        LEFT JOIN T_BD_MATERIAL m ON m.FUSEORGID = o.FORGID
        GROUP BY o.FORGID, o.FNUMBER, ol.FNAME
        HAVING COUNT(m.FMATERIALID) > 0
        ORDER BY materialCount DESC
      `)
      return sendJson(res, 200, list)
    }

    if (p === '/api/mapping') {
      const mapping = map.loadMapping()
      const freeze = map.loadFreeze()
      const unified = readDataJson('unified-materials.json') || []
      const merged = unified.filter((u) => u.mergedFrom && u.mergedFrom.length > 0)
      return sendJson(res, 200, {
        mapping, freeze,
        unifiedTotal: unified.length, mergedCount: merged.length,
        merged: merged.slice(0, 200),
      })
    }

    if (p === '/api/unified') {
      const q = (url.searchParams.get('q') || '').trim().toLowerCase()
      const mergedOnly = url.searchParams.get('mergedOnly') === '1'
      const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
      const pageSize = Math.min(200, parseInt(url.searchParams.get('pageSize') || '50', 10))
      let all = readDataJson('unified-materials.json') || []
      if (mergedOnly) all = all.filter((u) => u.mergedFrom && u.mergedFrom.length > 0)
      if (q) all = all.filter((u) => (u.canonicalNo + '|' + u.name + '|' + (u.specs || []).join(' ')).toLowerCase().includes(q))
      const total = all.length
      return sendJson(res, 200, { total, page, pageSize, items: all.slice((page - 1) * pageSize, page * pageSize) })
    }

    if (p === '/api/job' && url.searchParams.get('id')) {
      const j = jobs.get(parseInt(url.searchParams.get('id'), 10))
      return sendJson(res, 200, j || { error: 'no such job' })
    }

    // ---- 写操作 ----
    if (p === '/api/mapping' && req.method === 'POST') {
      const b = await readBody(req)
      map.addMapping(b.oldNo, b.newNo, { reason: b.reason || '', by: b.by || 'web', method: b.method || 'merge' })
      const u = await map.buildUnified()
      invalidate('unified-materials.json')
      return sendJson(res, 200, { ok: true, unifiedTotal: u.length })
    }
    if (p.startsWith('/api/mapping/') && req.method === 'DELETE') {
      const no = decodeURIComponent(p.split('/').pop())
      map.removeMapping(no)
      await map.buildUnified(); invalidate('unified-materials.json')
      return sendJson(res, 200, { ok: true })
    }
    if (p === '/api/freeze' && req.method === 'POST') {
      const b = await readBody(req)
      map.freeze(b.no, { reason: b.reason || '', by: b.by || 'web' })
      return sendJson(res, 200, { ok: true })
    }
    if (p.startsWith('/api/freeze/') && req.method === 'DELETE') {
      const no = decodeURIComponent(p.split('/').pop())
      map.unfreeze(no)
      return sendJson(res, 200, { ok: true })
    }

    // 快照状态：本地 materials.ndjson 是否过期（对比 ERP 指纹）
    if (p === '/api/snapshot/status') {
      const force = url.searchParams.get('force') === '1'
      try {
        return sendJson(res, 200, await snapshotStatus({ force }))
      } catch (e) {
        return sendJson(res, 200, { stale: false, error: String((e && e.message) || e) })
      }
    }

    // 一键保鲜：重跑提取 + 查重（后台任务，前端轮询 /api/snapshot/status 看结果）
    if (p === '/api/snapshot/refresh' && req.method === 'POST') {
      const id = startJob('snapshot', async () => {
        await runExtract({})
        invalidateErpSub()
        invalidateSnapshotStatus()
        invalidate('dedup-exact.json'); invalidate('dedup-report.json')
        await runDedup({})
        invalidate('dedup-exact.json'); invalidate('dedup-report.json')
        return '快照已更新（提取 + 查重完成）'
      })
      return sendJson(res, 202, { jobId: id })
    }

    if (p === '/api/run' && req.method === 'POST') {
      const b = await readBody(req)
      const stage = b.stage
      if (stage === 'extract') {
        const id = startJob('extract', async () => { await runExtract({}) })
        return sendJson(res, 202, { jobId: id })
      }
      if (stage === 'dedup') {
        const id = startJob('dedup', async () => { await runDedup({ fuzzy: !!b.fuzzy }) })
        invalidate('dedup-exact.json'); invalidate('dedup-report.json')
        return sendJson(res, 202, { jobId: id })
      }
      return sendJson(res, 400, { error: 'unknown stage' })
    }

    // ---- 新增物料：分类元数据 / 编码生成 / 查重 / 规格联想 / 库存占位 / 草稿 / 导出 ----
    if (p === '/api/new-material/meta') {
      return sendJson(res, 200, { tree: newMatMeta() })
    }

    if (p === '/api/new-material/next-code') {
      const sub = (url.searchParams.get('sub') || '').trim()
      const info = subInfo(sub)
      if (!info) return sendJson(res, 400, { error: '小类不存在' })
      return withNewMatLock(async () => {
        const seq = maxSeqForSub(sub, readNewMats()) + 1
        if (seq > 99999) return sendJson(res, 409, { error: '该小类流水号已用尽（超过 99999）' })
        return sendJson(res, 200, { sub, subName: info.subName, wh: info.wh || '', seq, code: sub + String(seq).padStart(5, '0') })
      })
    }

    if (p === '/api/new-material/check-code') {
      const code = (url.searchParams.get('code') || '').trim()
      return sendJson(res, 200, {
        code,
        exists: allDocs().some((d) => d.fnumber === code),
        inDraft: readNewMats().items.some((d) => d.code === code),
      })
    }

    // 型号规格联想：返回同小类历史规格中包含输入内容的完整规格，并带出该规格现有库存数量
    if (p === '/api/new-material/spec-suggest') {
      const sub = (url.searchParams.get('sub') || '').trim()
      const q = (url.searchParams.get('q') || '').trim()
      const limit = Math.min(30, parseInt(url.searchParams.get('limit') || '15', 10))
      if (!sub || !q) return sendJson(res, 200, { q, items: [] })
      const qn = normalize(q)
      // 输入本身当作型号段时（iC65N / NSX / YCW），统计「包含该型号」的规格数，
      // 与 spec-check 的 series 同一口径（含 iC65N-D 这类变体），避免两处数字对不上
      const qModel = cachedModel(q)
      const qModelN = qModel ? normalize(qModel) : ''
      const qmSpecs = new Set()
      let qmItems = 0
      const counter = new Map() // spec -> { count, mids: [] }
      const modelIdx = new Map() // 型号段 -> { specs:Set, items:number }：给联想标注「同型号段 N 条规格」
      for (const d of allDocs()) {
        if (!d.spec || (d.sub !== sub && !d.fnumber.startsWith(sub))) continue
        const sn = normalize(d.spec)
        if (!sn) continue
        const md = cachedModel(d.spec)
        if (md) {
          const a = modelIdx.get(md) || { specs: new Set(), items: 0 }
          a.specs.add(sn); a.items++
          modelIdx.set(md, a)
        }
        if (qModelN.length >= 3 && sn.includes(qModelN)) { qmSpecs.add(sn); qmItems++ }
        if (!sn.includes(qn)) continue
        const g = counter.get(d.spec) || { count: 0, mids: [] }
        g.count++
        if (d.mid != null) g.mids.push(d.mid)
        counter.set(d.spec, g)
      }
      // 排序：规格以输入开头 > 型号段以输入开头 > 包含 > 频次高 > 更短
      // 只按频次排时，输入「IC65」会被一堆高频同型号规格挤到几十名开外
      const specScore = (spec) => {
        const n = normalize(spec)
        if (n.startsWith(qn)) return 0
        const md = cachedModel(spec)
        return md && normalize(md).startsWith(qn) ? 1 : 2
      }
      const top = [...counter.entries()]
        .sort((a, b) => specScore(a[0]) - specScore(b[0]) || b[1].count - a[1].count || a[0].length - b[0].length)
        .slice(0, limit)
      let items = top.map(([spec, g]) => {
        const md = cachedModel(spec)
        const mi = md ? modelIdx.get(md) : null
        return { spec, count: g.count, qty: 0, avbqty: 0, model: md, seriesSpecs: mi ? mi.specs.size : 0, seriesItems: mi ? mi.items : 0 }
      })
      try {
        const inv = await inventoryMapByMaterialIds(top.flatMap(([, g]) => g.mids))
        items = top.map(([spec, g]) => {
          let qty = 0, avb = 0
          for (const mid of g.mids) {
            const x = inv[Number(mid)]
            if (x) { qty += x.qty; avb += x.avbqty }
          }
          // 保留型号/系列信息（上面按库存重算 items 时不能丢，否则前端看不到「型号系列 N 条」）
          const md = cachedModel(spec)
          const mi = md ? modelIdx.get(md) : null
          return {
            spec, count: g.count, qty: +qty.toFixed(3), avbqty: +avb.toFixed(3),
            model: md, seriesSpecs: mi ? mi.specs.size : 0, seriesItems: mi ? mi.items : 0,
          }
        })
      } catch (e) { /* 库存查询失败时仍返回联想，仅数量为 0 */ }
      // 输入正好是一个型号段时，先说明"这个型号已有多少规格"，
      // 避免设计人员一条条翻 15 条候选还找不到（YCW 同小类有 170 条规格）
      const modelSummary = (qModel && qModel.length >= 3 && qmSpecs.size > 1)
        ? { model: qModel, specCount: qmSpecs.size, itemCount: qmItems }
        : null
      return sendJson(res, 200, { q, items, modelSummary })
    }

    // 型号规格查重：同小类内「完全相同」与「高度相似（Jaccard≥0.8）」
    if (p === '/api/new-material/spec-check') {
      const sub = (url.searchParams.get('sub') || '').trim()
      const spec = (url.searchParams.get('spec') || '').trim()
      if (!sub || !spec) return sendJson(res, 200, { exact: [], similar: [] })
      const qn = normalize(spec)
      const ql = looseSignature(spec)
      const qt = tokenize(spec)
      const exact = [], similar = [], separatorOnly = []
      const seen = new Set()
      // 同型号系列：设计人员常常先敲型号（iC65N / RT14 / 3SB6133）就想确认"这个型号建过没"，
      // 此时整条规格还不完整，exact/相似度都命中不了 —— 单独统计同型号系列，给一条"已有 N 条规格"的提示
      const qModel = modelOf(spec)
      const qModelN = qModel ? normalize(qModel) : ''
      const seriesSpecs = new Set()
      const seriesSamples = []
      let seriesItems = 0
      for (const d of allDocs()) {
        if (!d.spec || (d.sub !== sub && !d.fnumber.startsWith(sub))) continue
        const dn = normalize(d.spec)
        if (!dn) continue
        if (qModelN.length >= 3 && dn.includes(qModelN)) {
          seriesSpecs.add(dn); seriesItems++
          if (seriesSamples.length < 6 && !seriesSamples.some((x) => x.spec === d.spec)) {
            seriesSamples.push({ fnumber: d.fnumber, spec: d.spec, name: d.name })
          }
        }
        if (seen.has(d.fnumber)) continue
        if (dn === qn) {
          exact.push({ fnumber: d.fnumber, spec: d.spec, name: d.name, unit: d.unit })
          seen.add(d.fnumber)
          continue
        }
        // 仅分隔符/空格写法不同（如 IC65N C10A/2P 与 IC65N C10A 2P）：同一物，最高优先级提示
        if (ql && looseSignature(d.spec) === ql) {
          separatorOnly.push({ fnumber: d.fnumber, spec: d.spec, name: d.name, unit: d.unit })
          seen.add(d.fnumber)
          continue
        }
        const sim = jaccard(qt, tokenize(d.spec))
        if (sim >= 0.8) {
          similar.push({ fnumber: d.fnumber, spec: d.spec, name: d.name, unit: d.unit, similarity: +sim.toFixed(3) })
          seen.add(d.fnumber)
        }
      }
      // 待新增草稿同样参与查重提示，避免重复加入清单
      for (const x of readNewMats().items) {
        if (x.sub !== sub) continue
        const dn = normalize(x.spec)
        if (!dn) continue
        if (dn === qn) { exact.push({ fnumber: x.code, spec: x.spec, name: x.name, unit: x.unit, draft: true }); continue }
        if (ql && looseSignature(x.spec) === ql) { separatorOnly.push({ fnumber: x.code, spec: x.spec, name: x.name, unit: x.unit, draft: true }); continue }
        const sim = jaccard(qt, tokenize(x.spec))
        if (sim >= 0.8) similar.push({ fnumber: x.code, spec: x.spec, name: x.name, unit: x.unit, similarity: +sim.toFixed(3), draft: true })
      }
      similar.sort((a, b) => b.similarity - a.similarity)

      // 在线兜底：本地快照可能过期（ERP 后来新增的物料不在文件里）。
      // 本地没有「同一物」命中时，实时查一次该小类（短超时 + 5 分钟缓存），避免漏判。
      let erpChecked = false
      if (!exact.length && !separatorOnly.length) {
        try {
          const erpDocs = await erpSubDocs(sub)
          erpChecked = true
          for (const d of erpDocs) {
            if (!d.spec || seen.has(d.fnumber)) continue
            const dn = normalize(d.spec)
            if (!dn) continue
            if (dn === qn) { exact.push({ ...d, fromErp: true }); seen.add(d.fnumber); continue }
            if (ql && looseSignature(d.spec) === ql) { separatorOnly.push({ ...d, fromErp: true }); seen.add(d.fnumber); continue }
            const sim = jaccard(qt, tokenize(d.spec))
            if (sim >= 0.8) { similar.push({ ...d, fromErp: true, similarity: +sim.toFixed(3) }); seen.add(d.fnumber) }
          }
          similar.sort((a, b) => b.similarity - a.similarity)
        } catch (e) { /* ERP 不可用则只用本地结果 */ }
      }

      // 带出每条相同/相似物料的即时库存数量（查询失败不影响查重）
      const allHits = [...exact, ...separatorOnly, ...similar]
      try {
        const midByFn = new Map()
        for (const d of allDocs()) if (d.mid != null) midByFn.set(d.fnumber, d.mid)
        const midOf = (h) => (h.mid != null ? h.mid : midByFn.get(h.fnumber))
        const inv = await inventoryMapByMaterialIds(allHits.map(midOf))
        for (const h of allHits) {
          const g = inv[Number(midOf(h))]
          h.qty = g ? +g.qty.toFixed(3) : 0
          h.avbqty = g ? +g.avbqty.toFixed(3) : 0
        }
      } catch (e) { /* 库存查询失败不影响查重 */ }
      return sendJson(res, 200, {
        exact: exact.slice(0, 10),
        separatorOnly: separatorOnly.slice(0, 10),
        similar: similar.slice(0, 10),
        // 同型号系列（仅提示，不阻断）：model + 已有规格数/物料数 + 几条样例
        series: (qModel.length >= 3 && seriesItems)
          ? { model: qModel, specCount: seriesSpecs.size, itemCount: seriesItems, samples: seriesSamples }
          : null,
        erpChecked, // true = 本地没命中，已实时查过 ERP 兜底
      })
    }

    // 类似型号明细（弹窗用）：物料号/名称/规格/当前库存数量/项目号
    if (p === '/api/new-material/similar-models') {
      const sub = (url.searchParams.get('sub') || '').trim()
      const spec = (url.searchParams.get('spec') || '').trim()
      const code = (url.searchParams.get('code') || '').trim()
      if (!sub || !spec) return sendJson(res, 200, { items: [], total: { qty: 0, avbqty: 0 } })
      try {
        const refresh = url.searchParams.get('refresh') === '1'
        return sendJson(res, 200, await similarModels(sub, spec, code, { refresh }))
      } catch (e) {
        return sendJson(res, 200, { items: [], total: { qty: 0, avbqty: 0 }, error: String((e && e.message) || e) })
      }
    }

    // 名称/规格书写规则校验（前端实时提示 + 保存前兜底）
    if (p === '/api/new-material/validate') {
      const m = {
        name: (url.searchParams.get('name') || '').trim(),
        spec: (url.searchParams.get('spec') || '').trim(),
        sub: (url.searchParams.get('sub') || '').trim(),
      }
      // knownCount：该名称在本小类的存量出现次数，用于区分「已是在用的完整名称」与「还在打字」
      m.knownCount = nameCountInSub(m.sub, m.name)
      const verdict = checkMaterial(m)
      // 本小类常用名称（只作参考展示，不做模糊推荐：实测「子串+频次」自动推荐会误伤，
      // 例如 端子标记号→端子、动力电缆→电缆 都是不同物，故只呈现候选由人判断）
      if (m.sub) {
        try { verdict.frequentNames = frequentNamesInSub(m.sub, 8) } catch (e) { verdict.frequentNames = [] }
      }
      return sendJson(res, 200, verdict)
    }

    // 名称即时建议：纯内存匹配、毫秒级，供名称输入框边打字边弹提示（不做规格校验，避免拖慢）
    // 三层优先级：① 存量物料名称自动联想 → ② 同义词统一叫法提示 → ③ 小类标准名兜底。
    // 依据：存量名称才是本库真实在用的写法，命中即可直接沿用；小类名仅在前两层都无候选时兜底，
    // 不再「按小类硬猜名称」（小类名是分类标签，不等于该小类物料的实际叫法）。
    if (p === '/api/name-synonyms/suggest') {
      const rawName = url.searchParams.get('name') || '' // 保留首尾空格，交给格式体检
      const qname = rawName.trim()
      const sub = (url.searchParams.get('sub') || '').trim()
      let matches = []
      let knownCount = 0
      let nameMatches = []
      let subFallback = null
      let nameFormat = null
      let nameModel = null
      try {
        knownCount = nameCountInSub(sub, qname)

        // ① 存量名称联想：先本小类；本小类候选不足（含小类下查不到）时再补全库其它小类，
        //    并标注来源小类 —— 既可提示同类写法，也能暴露「可能选错了小类」。
        // 输入本身已是本小类在用的完整名称（>=3 条）时不再联想，避免写对了还弹一堆候选
        if (qname && knownCount < 3) {
          const bySub = nameFreqTable()
          const m = sub ? bySub.get(sub) : null
          const inSub = m ? [...m.entries()].map(([name, count]) => ({ name, count })) : []
          nameMatches = nameSyn.rankStockNames(qname, { inSub }, { limit: 6 })
          // 只有本小类一个候选都没有时才跨小类补（用于"该叫法在别处/可能选错小类"）：
          // 否则 2 字前缀会把「螺杆空气压缩机」这类无关名称混进来（实测「空」→「空调」）。
          if (!nameMatches.length && qname.length >= 2) {
            const clsMap0 = readConfigJson('classification-map.json') || {}
            const others = []
            for (const [sb, mm] of bySub) {
              if (sb === sub) continue
              for (const [name, count] of mm) {
                others.push({ name, count, sub: sb, subName: (clsMap0[sb] || {}).subName || '' })
              }
            }
            const exclude = new Set(nameMatches.map((x) => x.name))
            nameMatches = nameMatches.concat(
              nameSyn.rankStockNames(qname, { others }, { limit: 6 - nameMatches.length, exclude }))
          }
          // 存量名若本身是「非标准叫法」，顺带给出同义词归一后的标准名（只提示，点标准名才改）
          nameMatches = nameMatches.map((x) => {
            let std = ''
            try {
              const s0 = nameSyn.suggestName(x.name, sub, { knownCount: Math.max(3, x.count) })
              if (s0 && s0.exact) std = s0.std
            } catch (e) { std = '' }
            return { ...x, std }
          })
        }

        // ② 同义词提示：把叫法统一到标准名（存量里找不到同物写法时的主要提示来源）
        matches = nameSyn.findAllSuggestions(qname, sub, 5, { knownCount })
        // 空格/分隔符等格式问题，作为建议列表的第一条（点一下即可修正）
        // 修正后若正好命中同义词，一步给到最终标准名（「空气 开关」→「微型断路器」，不用点两次）
        nameFormat = resolveNameFix(rawName, sub, { knownCount })
        if (nameFormat && nameFormat.final) {
          // 同最终值的其它建议已被这一条覆盖，移除避免重复
          const rest = matches.filter((x) => x.std !== nameFormat.final)
          matches = [{
            std: nameFormat.final, stdName: nameFormat.final, alias: nameFormat.raw,
            scope: 'format', sub: '', exact: false, from: 'format', reasons: nameFormat.reasons,
          }, ...rest].slice(0, 6)
        }

        // 名称含型号/参数（TRVV电缆、24V电源模块、10芯电缆…）：只提示标准写法，
        // 不改写名称/规格，也不阻断保存（用户自行把型号写进规格）。
        try {
          const mg = detectNameModel(qname)
          if (mg) nameModel = mg
        } catch (e) { nameModel = null }

        // ③ 小类兜底：存量无候选、同义词也无建议、且该名称在本小类从未出现 → 提示本小类标准名。
        // knownCount>0 说明存量已有先例（属于在用写法），不应再被小类名纠正。
        if (qname && sub && knownCount === 0 && !nameMatches.length && !matches.length) {
          const clsMap1 = readConfigJson('classification-map.json') || {}
          const sn = (clsMap1[sub] || {}).subName
          if (sn && sn !== qname) subFallback = { name: sn, sub }
        }
      } catch (e) { matches = [] }
      return sendJson(res, 200, {
        name: qname, sub, knownCount,
        nameMatches, subFallback, nameModel,
        matches, nameFormat, suggestion: matches[0] || null,
        // 兼容旧字段：frequentMatches 现为「存量名称联想」的简表
        frequentMatches: nameMatches.map((x) => ({ name: x.name, count: x.count })),
      })
    }

    // 名称同义词字典维护（真源 src/config/name-synonyms.json，改动即时生效）
    if (p === '/api/name-synonyms') {
      if (req.method === 'GET') {
        const sub = (url.searchParams.get('sub') || '').trim()
        const kw = (url.searchParams.get('kw') || '').trim()
        const scope = (url.searchParams.get('scope') || '').trim()
        const clsMap = readConfigJson('classification-map.json') || {}
        const items = nameSyn.listSynonyms({ sub, kw, scope }).map((x) => ({
          ...x,
          subName: x.sub ? ((clsMap[x.sub] || {}).subName || '') : '',
        }))
        return sendJson(res, 200, { items, stats: nameSyn.stats() })
      }
      if (req.method === 'POST') {
        const b = await readBody(req)
        try {
          const r = nameSyn.setSynonym({ alias: b.alias, std: b.std, sub: b.sub })
          return sendJson(res, 200, { ...r, stats: nameSyn.stats() })
        } catch (e) {
          return sendJson(res, 400, { error: String((e && e.message) || e) })
        }
      }
      if (req.method === 'PUT') {
        const b = await readBody(req)
        try {
          const r = nameSyn.updateSynonym(b)
          return sendJson(res, 200, { ...r, stats: nameSyn.stats() })
        } catch (e) {
          return sendJson(res, 400, { error: String((e && e.message) || e) })
        }
      }
      if (req.method === 'DELETE') {
        const alias = (url.searchParams.get('alias') || '').trim()
        const sub = (url.searchParams.get('sub') || '').trim()
        try {
          const r = nameSyn.removeSynonym({ alias, sub })
          return sendJson(res, 200, { ...r, stats: nameSyn.stats() })
        } catch (e) {
          return sendJson(res, 400, { error: String((e && e.message) || e) })
        }
      }
    }
    // 规则原文（供前端展示“规则要求”）
    if (p === '/api/new-material/rules') {
      return sendJson(res, 200, materialRules())
    }

    // 清空库存/项目号本地缓存（数据已变化、或怀疑缓存陈旧时用）
    if (p === '/api/new-material/inv-cache/clear' && (req.method === 'POST' || req.method === 'GET')) {
      invCache = {}
      invCacheDirty = false
      try { if (fs.existsSync(INV_CACHE_FILE)) fs.unlinkSync(INV_CACHE_FILE) } catch (e) { /* 删除失败不影响内存已清空 */ }
      return sendJson(res, 200, { ok: true })
    }

    // 即时库存：按物料编码查询 T_STK_INVENTORY（基本单位数量/可用量/锁库量 + 分仓汇总）
    // 新增物料尚未建档时，可用 sub+spec 查询「同小类相同/相似规格」的存量参考库存
    if (p === '/api/new-material/inventory') {
      const code = (url.searchParams.get('code') || '').trim()
      const sub = (url.searchParams.get('sub') || '').trim()
      const spec = (url.searchParams.get('spec') || '').trim()
      if (!code) {
        return sendJson(res, 200, { code, available: false, found: false, total: { qty: 0, avbqty: 0, lockqty: 0 }, warehouses: [], details: [], note: '缺少物料编码' })
      }
      try {
        const inv = await queryInventory(code)
        if (inv.found === false && sub && spec) {
          return sendJson(res, 200, { ...(await refInventory(sub, spec, code)), code })
        }
        return sendJson(res, 200, inv)
      } catch (e) {
        return sendJson(res, 200, {
          code, available: false, found: false,
          total: { qty: 0, avbqty: 0, lockqty: 0 }, warehouses: [], details: [],
          note: '库存查询失败：' + String((e && e.message) || e),
        })
      }
    }

    if (p === '/api/new-material' && req.method === 'GET') {
      const d = readNewMats()
      const items = d.items.slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      return sendJson(res, 200, { items })
    }

    if (p === '/api/new-material' && req.method === 'POST') {
      const b = await readBody(req)
      const name = String(b.name || '').trim()
      const spec = String(b.spec || '').trim()
      const sub = String(b.sub || '').trim()
      if (!name) return sendJson(res, 400, { error: '物料名称不能为空' })
      if (!spec) return sendJson(res, 400, { error: '规格型号不能为空' })
      const info = subInfo(sub)
      if (!info) return sendJson(res, 400, { error: '小类不存在' })
      // 录入规则兜底：硬错误直接拒绝；提示项允许保存但随结果返回，便于前端展示
      const verdict = checkMaterial({ name, spec, sub })
      if (!verdict.ok) {
        return sendJson(res, 400, { error: '不符合录入规则：' + verdict.errors.join('；'), rule: verdict })
      }
      return withNewMatLock(async () => {
        const d = readNewMats()
        // ERP 实时小类物料（5 分钟缓存）：既用于编码防撞，也用于规格查重兜底。
        // 快照可能过期，光靠本地可能发出一个 ERP 里已存在的编码。
        let erpDocs = []
        try { erpDocs = await erpSubDocs(sub) } catch (e) { erpDocs = [] }

        // 编码分配：存量快照 + 待新增草稿 + ERP 实时，三处都没占用才发号（占用则顺延，不报错）
        const used = new Set()
        for (const x of allDocs()) if (String(x.fnumber || '').startsWith(sub)) used.add(x.fnumber)
        for (const x of d.items) if (x.sub === sub) used.add(x.code)
        for (const x of erpDocs) if (x && x.fnumber) used.add(String(x.fnumber))
        let seq = maxSeqForSub(sub, d)
        let code = ''
        for (let i = 0; i < 200; i++) {
          seq++
          if (seq > 99999) break
          const c = sub + String(seq).padStart(5, '0')
          if (!used.has(c)) { code = c; break }
        }
        if (!code) return sendJson(res, 409, { error: '该小类流水号已用尽（超过 99999）或编码连续冲突，请核对快照后重试' })

        // 强查重：同小类内型号规格归一化后完全相同则拒绝（存量 + 待新增草稿）
        const docs = allDocs().filter((x) => x.sub === sub || x.fnumber.startsWith(sub))
        const nspec = normalize(spec)
        const dup = docs.find((x) => normalize(x.spec) === nspec)
        if (dup) return sendJson(res, 409, { error: '同小类已存在相同型号规格：' + dup.fnumber, duplicate: dup.fnumber })
        // 仅分隔符/空格写法不同也算同一物：IC65N C10A/2P 与 IC65N C10A 2P
        const lspec = looseSignature(spec)
        if (lspec) {
          const dupSep = docs.find((x) => looseSignature(x.spec) === lspec)
          if (dupSep) {
            return sendJson(res, 409, {
              error: `同小类已存在仅写法不同的相同规格：${dupSep.fnumber}（${dupSep.spec}），请沿用原编码`,
              duplicate: dupSep.fnumber, separatorOnly: true,
            })
          }
        }
        const dupDraft = d.items.find((x) => x.sub === sub
          && (normalize(x.spec) === nspec || (lspec && looseSignature(x.spec) === lspec)))
        if (dupDraft) return sendJson(res, 409, { error: '待新增清单中已存在相同型号规格：' + dupDraft.code, duplicate: dupDraft.code })

        // 在线兜底：本地快照可能过期，ERP 里后来新增的同规格物料要靠这一步兜住
        {
          const hitErp = erpDocs.find((x) => {
            if (!x.spec) return false
            const xn = normalize(x.spec)
            if (xn === nspec) return true
            return !!(lspec && looseSignature(x.spec) === lspec)
          })
          if (hitErp) {
            const sepOnly = normalize(hitErp.spec) !== nspec
            return sendJson(res, 409, {
              error: (sepOnly ? 'ERP 中已存在仅写法不同的相同规格：' : 'ERP 中已存在相同型号规格：')
                + `${hitErp.fnumber}（${hitErp.spec}），请沿用原编码`,
              duplicate: hitErp.fnumber, fromErp: true, separatorOnly: sepOnly,
            })
          }
        }
        const item = {
          id: code, code, name, spec, sub, subName: info.subName || '',
          midKey: info.big + info.mid, midName: info.midName || '', big: info.big, bigName: info.bigName || '',
          wh: info.wh || '', unit: String(b.unit || '').trim(), remark: String(b.remark || '').trim(),
          by: String(b.by || 'web'), createdAt: new Date().toISOString(),
        }
        d.items.push(item)
        writeNewMats(d)
        return sendJson(res, 200, { ok: true, item, rule: verdict })
      })
    }

    if (p === '/api/new-material/delete' && req.method === 'POST') {
      const b = await readBody(req)
      const id = String(b.id || '')
      // 与新增共用同一把锁：读-改-写草稿文件必须串行，否则并发时会丢掉刚新增的条目
      return withNewMatLock(async () => {
        const d = readNewMats()
        const before = d.items.length
        d.items = d.items.filter((x) => x.id !== id && x.code !== id)
        writeNewMats(d)
        return sendJson(res, 200, { ok: true, removed: before - d.items.length })
      })
    }

    if (p === '/api/new-material/export') {
      const d = readNewMats()
      const rows = d.items.map((x) => ({
        '物料编码': x.code, '物料名称': x.name, '规格型号': x.spec, '单位': x.unit || '',
        '小类编码': x.sub, '小类名称': x.subName || '', '中类名称': x.midName || '', '大类名称': x.bigName || '',
        '默认仓库': x.wh || '', '备注': x.remark || '',
        '创建时间': String(x.createdAt || '').replace('T', ' ').slice(0, 19),
      }))
      const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ '物料编码': '', '物料名称': '', '规格型号': '' }])
      ws['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 8 }, { wch: 10 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 20 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '待新增物料')
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="new-materials.xlsx"',
        'Cache-Control': 'no-store',
      })
      return res.end(buf)
    }

    if (p === '/' || p.startsWith('/static') || p.startsWith('/index.html') || path.extname(p)) {
      return serveStatic(req, res, p)
    }
    res.writeHead(404); res.end('Not found')
  } catch (e) {
    sendJson(res, 500, { error: String(e && e.stack || e) })
  }
})

// ---- 快照保鲜：启动后自检一次 + 每小时巡检 ----
function busyJobs() {
  for (const j of jobs.values()) if (j.status === 'running') return true
  return false
}

async function autoRefreshSnapshot(st) {
  if (busyJobs()) { console.warn('[snapshot] 已有后台任务在跑，跳过自动刷新'); return }
  console.log('[snapshot] AUTO_REFRESH_SNAPSHOT=1，开始自动重跑提取 + 查重（原因：' + st.reasons.join('；') + '）')
  startJob('snapshot-auto', async () => {
    await runExtract({})
    invalidateErpSub(); invalidateSnapshotStatus()
    invalidate('dedup-exact.json'); invalidate('dedup-report.json')
    await runDedup({})
    invalidate('dedup-exact.json'); invalidate('dedup-report.json')
    console.log('[snapshot] 自动刷新完成')
  })
}

function watchSnapshot() {
  const check = async () => {
    try {
      const st = await snapshotStatus({ force: true })
      if (!st.stale) return
      console.warn('[snapshot] 快照已过期：' + st.reasons.join('；'))
      if (st.autoRefresh) await autoRefreshSnapshot(st)
    } catch (e) {
      console.warn('[snapshot] 状态检查失败：' + e.message)
    }
  }
  const first = setTimeout(check, 8000)
  if (typeof first.unref === 'function') first.unref()
  const timer = setInterval(check, Number(process.env.SNAPSHOT_CHECK_MINUTES || 60) * 60 * 1000)
  if (typeof timer.unref === 'function') timer.unref()
}

function listen(port) {
  server.listen(port)
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') { console.log(`端口 ${port} 被占用，尝试 ${port + 1}`); listen(port + 1) }
    else throw e
  })
  server.on('listening', () => {
    const addr = server.address()
    console.log(`物料治理前端已启动: http://localhost:${addr.port}`)
    watchSnapshot()
  })
}
listen(PORT)

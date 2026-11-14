/**
 * PLM 新增物料「实时联想 + 查重」内存索引。
 *
 * 与 dedup.js 的区别：
 *   dedup.js 是批处理（全量跑一遍、落盘集群结果）；
 *   本模块把 materials.ndjson 一次性载入内存并建成「小类 -> 签名 -> 物料」索引，
 *   供 PLM 前端在录入时毫秒级查询（单次 < 20ms），不落盘、不阻塞。
 *
 * 复用的既有能力（不重写业务逻辑）：
 *   classify.getCategory / chooseAttrs / chooseTokens  —— 小类定位与查重属性
 *   spec.buildSignature / looseSignature / tokenize / jaccard / modelOf
 *   struct-spec.extractParams  —— 型号规格结构化
 *   name-synonyms.findAllSuggestions  —— 名称同义词联想
 *   material-rules.checkMaterial  —— 名称/规格书写规则校验
 */
import fs from 'fs'
import readline from 'readline'
import path from 'path'
import { fileURLToPath } from 'url'
import { getCategory, chooseAttrs, chooseTokens } from './classify.js'
import { buildSignature, looseSignature, normalize, tokenize, jaccard, modelOf } from './spec.js'
import { extractParams } from './struct-spec.js'
import { findAllSuggestions } from './name-synonyms.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ERP_NDJSON = path.join(ROOT, 'data', 'materials.ndjson')
const MERGED_NDJSON = path.join(ROOT, 'data', 'materials-merged.ndjson')

/**
 * 当前生效的数据源（每次加载时求值，合并快照生成后无需重启）
 *   优先 materials-merged.ndjson（PLM 为主 + ERP 补齐，每条带 SOURCE）
 *   回退 materials.ndjson（纯 ERP，未做 PLM 合并时）
 */
function activeSource() {
  try {
    if (fs.statSync(MERGED_NDJSON).size > 0) return MERGED_NDJSON
  } catch (e) { /* 合并快照不存在 */ }
  return ERP_NDJSON
}
const FUZZY_THRESHOLD = 0.8

/** 内存状态 */
const state = {
  at: 0,          // 加载完成时间戳
  mtime: 0,       // 源文件 mtime（用于热重载判断）
  count: 0,       // 索引条数
  subs: new Map(),// subKey -> { info, attrs, tokens, bySig: Map<sig, item[]>, byLoose: Map<ls, item[]>, items: item[] }
  noSub: 0,       // 前缀未收录（不在 classification-map.json）被跳过的条数
}

let loading = null

function minimal(rec, source) {
  return {
    fNumber: rec.FNUMBER || '',
    fName: rec.FNAME || '',
    fSpec: rec.FSPECIFICATION || '',
    fZycs: rec.F_ZXCV_ZYCS || '',
    fJscs: rec.F_ZXCV_JSCS || '',
    unit: rec.UNITNAME || '',
    org: rec.FUSEORGID || '',
    materialId: rec.FMATERIALID || '',
    plm: rec.FPLMMATERIALID || '',
    source: source || 'erp',   // 'erp' | 'plm' —— 前端可据此区分"ERP 已有"与"PLM 未下发"
  }
}

/** 建桶（同一小类的索引容器） */
function ensureBucket(subs, subKey) {
  if (subs.has(subKey)) return subs.get(subKey)
  const info = getCategory(subKey)
  if (!info) return null
  const bucket = {
    info,
    attrs: chooseAttrs(info),
    tokens: chooseTokens(info),
    bySig: new Map(),
    byLoose: new Map(),
    bySpec: new Map(),      // 仅规格签名：识别「规格完全相同、名称不同」的一物多号
    items: [],
  }
  subs.set(subKey, bucket)
  return bucket
}

/**
 * 把一条物料写入索引。
 *
 * 这是唯一的数据入口：当前由 NDJSON（ERP 存量）调用；
 * 后期「直连 PLM 物料表」只需再写一个 loader 读 PSEITEM/PSEITEMBASEFORM，
 * 把行映射成同样的字段名（FNUMBER/FNAME/FSPECIFICATION/F_ZXCV_ZYCS）后调本函数即可，
 * 查重、联想、签名等核心逻辑完全不用改。
 *
 * @param {Map} subs 索引容器
 * @param {object} rec 记录（字段名沿用 ERP 口径）
 * @param {'erp'|'plm'} source 来源标记
 * @returns {'ok'|'nocat'|'nosig'}
 */
export function applyRecord(subs, rec, source) {
  const num = rec.FNUMBER || ''
  if (num.length < 6) return 'nocat'
  const subKey = num.slice(0, 6)
  const bucket = ensureBucket(subs, subKey)
  if (!bucket) return 'nocat'

  const sig = buildSignature(rec, bucket.attrs)
  if (!sig) return 'nosig'

  const item = minimal(rec, source)
  item.params = extractParams(rec.FSPECIFICATION, bucket.tokens)
  item.sig = sig
  item.loose = looseSignature(sig)
  item.tokens = tokenize((item.fName || '') + ' ' + (item.fSpec || ''))
  item.orderSig = orderSignature(item.fSpec || '')

  bucket.items.push(item)
  if (!bucket.bySig.has(sig)) bucket.bySig.set(sig, [])
  bucket.bySig.get(sig).push(item)
  if (item.loose) {
    if (!bucket.byLoose.has(item.loose)) bucket.byLoose.set(item.loose, [])
    bucket.byLoose.get(item.loose).push(item)
  }
  // 规格单独建索引：名称不同但规格一字不差，同样是「一物多号」
  const specNorm = normalize(item.fSpec || '')
  if (specNorm) {
    if (!bucket.bySpec.has(specNorm)) bucket.bySpec.set(specNorm, [])
    bucket.bySpec.get(specNorm).push(item)
  }
  return 'ok'
}

/** 索引状态（给 /api/plm/health 用） */
export function indexStatus() {
  return {
    ready: state.count > 0,
    at: state.at,
    count: state.count,
    subs: state.subs.size,
    skippedNoCategory: state.noSub,
    fuzzyThreshold: FUZZY_THRESHOLD,
    source: activeSource(),
  }
}

/**
 * 载入/重建索引。并发调用会复用同一次加载。
 * @param {{force?: boolean}} opts force=true 时忽略 mtime 强制重建
 */
export async function loadIndex({ force = false } = {}) {
  if (loading) return loading
  const src = activeSource()
  let mtime = 0
  try { mtime = fs.statSync(src).mtimeMs } catch {
    throw new Error('未找到 data/materials.ndjson，请先运行 npm run extract')
  }
  if (!force && state.count > 0 && state.mtime === mtime) return indexStatus()

  loading = (async () => {
    const subs = new Map()
    let count = 0, noSub = 0
    const rl = readline.createInterface({ input: fs.createReadStream(src, 'utf8'), crlfDelay: Infinity })
    for await (const line of rl) {
      if (!line.trim()) continue
      let rec
      try { rec = JSON.parse(line) } catch { continue }

      // 来源：合并快照里每条带 SOURCE（PLM / ERP），纯 ERP 快照则默认 erp
      const recSrc = String(rec.SOURCE || '').toUpperCase() === 'PLM' ? 'plm' : 'erp'
      const st = applyRecord(subs, rec, recSrc)
      if (st === 'ok') count++
      else if (st === 'nocat') noSub++
    }

    state.at = Date.now()
    state.mtime = mtime
    state.count = count
    state.subs = subs
    state.noSub = noSub
    return indexStatus()
  })()

  try {
    return await loading
  } finally {
    loading = null
  }
}

/**
 * 参数顺序无关签名：把规格按空格与 / 、- 等切开，各段归一化后排序拼接。
 *   IC65N 2P/C10A  → IC65N|2P|C10
 *   IC65N C10A/2P  → IC65N|2P|C10   （相同）
 *   IC65N 3P/C10A  → IC65N|3P|C10   （不同）
 * 只对「单字母+数字+单字母」去尾缀（C10A → C10），避免把 IC65N 误伤成 IC65。
 */
export function orderSignature(spec) {
  const s = String(spec || '').toUpperCase()
    .replace(/[×✕✖]/g, ' ')
    .replace(/[/\\,，、;；|·]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!s) return ''
  const parts = s.split(' ')
    .map((x) => x.replace(/[^A-Z0-9.]/g, ''))
    .filter(Boolean)
    .map((x) => x.replace(/^([A-Z]\d+)[A-Z]$/, '$1'))   // C10A → C10
  if (parts.length < 2) return ''
  const model = parts[0]
  const rest = parts.slice(1).sort()
  return model + '|' + rest.join('|')
}

/** 小类信息（给前端展示"当前小类：断路器 / 微型断路器"） */
export function categoryOf(sub) {
  return getCategory(sub) || null
}

/**
 * 查重：在同小类内找"同签名 / 仅分隔符不同 / 高相似"的既有物料。
 *
 * 三级判定与 dedup.js 口径保持一致，避免两处结论打架：
 *   exact —— 归一化签名完全相同（最强证据）
 *   sep   —— 分隔符无关签名相同（IC65N C10A/2P 与 IC65N C10A 2P）
 *   fuzzy —— token 集合 Jaccard >= 0.8 且型号段相同
 *
 * @param {{sub:string, name:string, spec:string, zycs?:string, limit?:number}} q
 * @returns {{sub:string, level:string, duplicates:Array, elapsedMs:number}}
 */
export function queryDuplicates(q) {
  const t0 = Date.now()
  const sub = String(q.sub || '').slice(0, 6)
  const bucket = state.subs.get(sub)
  const out = []
  const limit = Math.max(1, Math.min(Number(q.limit) || 20, 50))

  if (!bucket) {
    return { sub, level: 'none', duplicates: [], elapsedMs: Date.now() - t0, known: false }
  }

  // 用待录数据构造临时记录，复用同一套签名算法（保证与存量同口径）
  const probe = { FNAME: q.name || '', FSPECIFICATION: q.spec || '', F_ZXCV_ZYCS: q.zycs || '' }
  const sig = buildSignature(probe, bucket.attrs)
  const loose = looseSignature(sig)
  const seen = new Set()
  // 只回传前端需要的字段：内部字段 sig/loose/tokens(Set) 不外泄，
  // 否则 JSON 序列化后 tokens 会变成 {}，既臃肿又语义错误
  const push = (it, level, score) => {
    if (!it || seen.has(it.fNumber)) return
    seen.add(it.fNumber)
    out.push({
      fNumber: it.fNumber,
      fName: it.fName,
      fSpec: it.fSpec,
      fZycs: it.fZycs,
      fJscs: it.fJscs,
      unit: it.unit,
      org: it.org,
      materialId: it.materialId,
      plm: it.plm,
      source: it.source,
      params: it.params,
      level,
      score: Number(score.toFixed(3)),
    })
  }

  // 1) 精确签名
  if (sig) for (const it of bucket.bySig.get(sig) || []) push(it, 'exact', 1)

  // 2) 分隔符无关
  if (loose) for (const it of bucket.byLoose.get(loose) || []) push(it, 'sep', 0.95)

  // 2.5) 仅规格完全相同（名称不同）：同样属于一物多号，必须提示
  const probeSpec = normalize(q.spec || '')
  if (probeSpec) {
    for (const it of bucket.bySpec.get(probeSpec) || []) push(it, 'spec', 0.98)
  }

  // 2.8) 参数顺序无关：把规格拆成参数片段，排序后比较
  //      例：IC65N 2P/C10A 与 IC65N C10A/2P —— 同一型号规格的两种写法
  //      不能用 tokenize：它先去空格，IC65N 2P 会粘成 ic65n2p，切分点就变了
  const probeOrder = orderSignature(q.spec || '')
  if (probeOrder && probeOrder.indexOf('|') > 0 && out.length < limit) {
    for (const it of bucket.items) {
      if (seen.has(it.fNumber)) continue
      if (it.orderSig === probeOrder) push(it, 'order', 0.99)
    }
  }

  // 3) 模糊：同小类内 token Jaccard + 型号段约束，避免把"同系列不同规格"误报
  if (out.length < limit && (q.name || q.spec)) {
    const probeTokens = tokenize(String(q.name || '') + ' ' + String(q.spec || ''))
    const probeModel = modelOf(q.spec || '')
    if (probeTokens.size) {
      // 候选收敛：优先同型号段，其次全小类（小类通常几百条，可接受）
      const pool = bucket.items
      const scored = []
      for (const it of pool) {
        if (seen.has(it.fNumber)) continue
        if (probeModel && it.fSpec && modelOf(it.fSpec) !== probeModel) continue
        const j = jaccard(probeTokens, it.tokens)
        if (j >= FUZZY_THRESHOLD) scored.push([j, it])
      }
      scored.sort((a, b) => b[0] - a[0])
      for (const [j, it] of scored.slice(0, limit)) push(it, 'fuzzy', j)
    }
  }

  // 排序：等级优先，其次相似度
  const rank = { exact: 0, sep: 1, order: 2, spec: 3, fuzzy: 4 }
  out.sort((a, b) => (rank[a.level] - rank[b.level]) || (b.score - a.score))

  const level = out.length === 0 ? 'none' : out[0].level
  return { sub, level, duplicates: out.slice(0, limit), elapsedMs: Date.now() - t0, known: true }
}

/**
 * 名称联想：同义词字典（name-synonyms.json）+ 存量高频名称两条来源合并。
 * 同义词优先（可信度高），存量名称用于"我们库里实际怎么命名"。
 */
export function suggestNames(q) {
  const sub = String(q.sub || '').slice(0, 6)
  const raw = String(q.value || q.name || '')
  const limit = Math.max(1, Math.min(Number(q.limit) || 8, 20))
  const out = []
  const seen = new Set()

  // 1) 同义词三级匹配（exact / contains / prefix —— 支持"边打字边提示"）
  try {
    for (const s of findAllSuggestions(raw, sub, limit)) {
      const v = s.std || s.stdName
      if (!v || seen.has(v)) continue
      seen.add(v)
      out.push({ value: v, from: 'synonym', match: s.from, alias: s.alias || '', score: s.exact ? 1 : 0.9 })
    }
  } catch (e) { /* 字典异常不影响存量联想 */ }

  // 2) 存量名称（同小类内按命中次数排序，前缀优先）
  const bucket = state.subs.get(sub)
  if (bucket && raw) {
    const key = normalize(raw)
    const freq = new Map()
    for (const it of bucket.items) {
      const n = it.fName
      if (!n) continue
      const k = normalize(n)
      if (!k || seen.has(n)) continue
      if (!k.includes(key)) continue
      freq.set(n, (freq.get(n) || 0) + 1)
    }
    for (const [n, c] of [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit)) {
      seen.add(n)
      out.push({ value: n, from: 'stock', count: c, score: 0.8 })
    }
  }

  return out.slice(0, limit)
}

/**
 * 规格联想：同小类内、型号段相同（或包含输入）的既有规格，按使用次数排序。
 * 场景：用户输入 "NXB-63" 时提示库里已有的写法 "NXB-63 C16 3P"。
 */
export function suggestSpecs(q) {
  const sub = String(q.sub || '').slice(0, 6)
  const raw = String(q.value || q.spec || '').trim()
  const limit = Math.max(1, Math.min(Number(q.limit) || 8, 20))
  const bucket = state.subs.get(sub)
  if (!bucket || !raw) return []

  const key = normalize(raw)
  const model = modelOf(raw)
  const freq = new Map()
  for (const it of bucket.items) {
    const spec = it.fSpec
    if (!spec) continue
    const n = normalize(spec)
    if (!n) continue
    const hit = model ? (modelOf(spec) === model || n.includes(key)) : n.includes(key)
    if (!hit) continue
    const k = spec.trim()
    freq.set(k, (freq.get(k) || 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count, score: 0.8 }))
}

/** 供 /api/plm/check 使用：某小类的特征参数名（用于提示"该填哪些参数"） */
export function tokensOf(sub) {
  const b = state.subs.get(String(sub || '').slice(0, 6))
  return b ? b.tokens : []
}

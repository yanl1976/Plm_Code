/**
 * 参数标准库 · 构建脚本（v0.2，按小类隔离）
 *
 * 核心原则（用户明确要求）：
 *   **参数按小类抽取，只用于该小类 —— 绝不跨小类共用候选。**
 *   反例：电容的「额定电压」是 63V/100V/250V，断路器的「额定电压」是 220V/380V/690V。
 *        若全局合并，就会把 63V 推荐给断路器 —— 业务上完全错误。
 *
 * 因此库结构：subs[小类] → params[参数] → accepted / pending / suspected
 * 标准序列也按小类族区分（电容耐压 / 电缆电压 / 配电电压 / E 系列）。
 *
 * 输入：data/materials.ndjson
 * 输出：src/config/param-standard.json（草稿 draft=true）
 *       data/param-standard-pending.json（待人工确认）
 *
 * 与现有库的关系：只读 spec-fields / naming-guide / dedup-rules，不修改任何现有文件。
 */
import fs from 'fs'
import path from 'path'
import { getCategory, chooseTokens } from '../classify.js'
import { extractParams } from '../struct-spec.js'
import { loadIndex } from '../plm-index.js'
import { detectSubMismatch } from '../material-rules.js'
import { normalize } from './normalize.js'

const ROOT = path.resolve(process.cwd())
const NDJSON = path.join(ROOT, 'data/materials.ndjson')
const OUT_LIB = path.join(ROOT, 'src/config/param-standard.json')
const OUT_PENDING = path.join(ROOT, 'data/param-standard-pending.json')
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/classification-map.json'), 'utf8'))
// 模板与占位符别名：用于给「存量样本不足」的小类按模板补空参数声明
const GUIDE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/naming-guide.json'), 'utf8'))
const FIELDMAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/guide-field-map.json'), 'utf8'))
const ALIAS = FIELDMAP.alias || {}
const NAMEONLY = new Set(FIELDMAP.nameOnly || [])
// 逐小类的 tokens 增减：
//   subAddTokens    —— 模板里有、中类通用 tokens 没有的，要补进来
//   subRemoveTokens —— 中类通用 tokens 带了、但该小类语义上不该有的，要排掉
// 典型：1201 紧固件的「型号/材质/头型」、1103 电缆的「颜色」，
// 都是中类通用 tokens 的副作用（同一中类下不同小类字段需求不同）。
const DEDUP = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/dedup-rules.json'), 'utf8'))
// 参数定义库：只用来判断「范式库声明的字段是否真的有提取规则」，
// 没有定义的字段加进 tokens 也提不出值。
const SFFIELDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/spec-fields.json'), 'utf8').replace(/^\uFEFF/, '')).library || {}
// 厂家公开样本参数（施耐德/ABB/西门子/正泰/常熟等），
// 与存量无关，直接并入 accepted，source=manufacturer，重建不会丢。
const MFR = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/manufacturer-params.json'), 'utf8'))

await loadIndex({ force: true })

// ============ 标准序列（仅用于"是否为标准值"判定，不作为候选来源）============
const R10 = [1, 1.25, 1.6, 2, 2.5, 3.15, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80,
  100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300]
const CB_CURRENT = [1, 2, 3, 4, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600]
const CB_BREAK = [3, 4.5, 6, 8, 10, 12.5, 15, 16, 20, 25, 31.5, 35, 40, 50, 63, 65, 80, 100]

// 电压：三套体系，按小类族选择 —— 这是"按类隔离"的关键
const VOLT_GRID = ['24V', '36V', '48V', '110V', '127V', '220V', '380V', '400V', '415V', '440V', '500V', '660V', '690V', '1000V', '1140V', '6KV', '10KV', '20KV', '35KV', '66KV', '110KV', '220KV']
const VOLT_CAP = ['6.3V', '10V', '16V', '25V', '35V', '50V', '63V', '100V', '160V', '200V', '250V', '400V', '450V', '630V']  // 电容耐压
const VOLT_CABLE = ['300/500V', '450/750V', '0.6/1KV', '3.6/6KV', '6/10KV', '8.7/15KV', '12/20KV', '26/35KV']              // 电缆
const RATIO = ['50/5', '75/5', '100/5', '150/5', '200/5', '250/5', '300/5', '400/5', '500/5', '600/5',
  '750/5', '800/5', '1000/5', '1200/5', '1500/5', '2000/5', '2500/5', '3000/5', '4000/5', '5000/5', '6000/5']
const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]
const E6 = [1.0, 1.5, 2.2, 3.3, 4.7, 6.8]
const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]

function mantissa(n) {
  if (!(n > 0)) return 0
  let x = n
  while (x >= 10) x /= 10
  while (x < 1) x *= 10
  return Math.round(x * 100) / 100
}
const inE = (set) => (v) => {
  const m = /^([\d.]+)/.exec(String(v))
  if (!m) return false
  const base = mantissa(parseFloat(m[1]))
  return set.some((e) => Math.abs(e - base) < 0.05)
}

/**
 * 取「该小类族」的标准序列。第二个参数 sub 决定用哪套体系 ——
 * 不同小类同一参数可以有完全不同的值域（电容 63V vs 配电 380V）。
 * @returns {{list:string[], series:string}|null} null 表示该参数无标准序列
 */
function seriesOf(param, sub) {
  const s6 = String(sub || '').slice(0, 6)
  switch (param) {
    // 开关电器（1001-1014 区间的主体）用固定电流档位；
    // 不用 R10 合并 —— R10 的 1.25/1.6/2.5/3.15/6.3 不是断路器/接触器规格，混进来会误导。
    case '额定电流':
      return { list: CB_CURRENT.map(String), series: '开关电器电流档位' }
    case '分断能力':
      return { list: CB_BREAK.map(String), series: '断路器分断值' }
    case '变比':
      return { list: RATIO, series: 'GB 1207 变比' }
    case '额定电压': {
      if (/^1014/.test(s6)) return { list: VOLT_CAP, series: '电容耐压' }        // 6.3V…630V
      if (/^1103/.test(s6)) return { list: VOLT_CABLE, series: '电缆电压等级' }   // 300/500V…26/35kV
      return { list: VOLT_GRID, series: 'GB/T 156' }                             // 24V…220kV
    }
    // E 系列（阻值/容值）是「基准 × 数量级」，组合无穷，不能枚举补充 —— 只校验不扩展
    case '阻值':
      return { list: [], series: 'E24', testOnly: true }
    case '容值':
      return { list: [], series: 'E6/E12', testOnly: true }
    default:
      return null
  }
}

/** 序列判定：该值是否属于本小类族的标准值 */
function checkSeries(param, value, sub) {
  const s6 = String(sub || '').slice(0, 6)
  switch (param) {
    case '额定电流':
      return { ok: CB_CURRENT.includes(parseFloat(value)), series: '开关电器电流档位' }
    case '分断能力':
      return { ok: CB_BREAK.includes(parseFloat(value)), series: '断路器分断值' }
    case '变比':
      return { ok: RATIO.includes(String(value)), series: 'GB 1207 变比' }
    case '额定电压': {
      if (/^1014/.test(s6)) return { ok: VOLT_CAP.includes(String(value)), series: '电容耐压' }
      if (/^1103/.test(s6)) return { ok: VOLT_CABLE.includes(String(value)), series: '电缆电压等级' }
      return { ok: VOLT_GRID.includes(String(value)), series: 'GB/T 156' }
    }
    case '阻值':
      return { ok: inE(E24)(value), series: 'E24' }
    case '容值':
      return { ok: inE(E6)(value) || inE(E12)(value), series: 'E6/E12' }
    default:
      return null
  }
}



// ============ 主流程 ============
const rows = fs.readFileSync(NDJSON, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
// 构建范围：默认 1001-1014（历史口径），可传参扩大，例如
//   node src/param-lib/build.mjs 1204,1202    只构建两个中类
//   node src/param-lib/build.mjs all          全部中类
const RANGE_ARG = String(process.argv[2] || '').trim()
const RANGE = (() => {
  if (!RANGE_ARG) return { from: '1001', to: '1014' }
  if (RANGE_ARG === 'all') return { from: '0000', to: '9999' }
  const mids = RANGE_ARG.split(',').map((x) => x.trim()).filter(Boolean)
  return { mids }
})()
const inScope = (sub) => {
  const m = sub.slice(0, 4)
  if (RANGE.mids) return RANGE.mids.includes(m)
  return m >= RANGE.from && m <= RANGE.to
}
const scopeLabel = RANGE.mids ? RANGE.mids.join(',') : (RANGE.from + '-' + RANGE.to)
const SUBS = Object.keys(MAP).filter(inScope).sort()

// 人工确认清单：meta.confirmed = { "100101|额定电流": ["3200", ...] }
// 这些值不在标准序列里，但业务已确认是本小类真实规格（如 3200A、600V）。
// 判定时直接归 accepted，否则每次重建都会退回 pending。
let CONFIRMED = {}
try {
  const old = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/param-standard.json'), 'utf8'))
  CONFIRMED = (old.meta && old.meta.confirmed) || {}
} catch (e) { CONFIRMED = {} }
const isConfirmed = (sub, param, v) => {
  const list = CONFIRMED[sub + '|' + param]
  return Array.isArray(list) && list.map(String).includes(String(v))
}

// 剔除疑似错类（只算一遍）
const suspect = new Set()
for (const r of rows) {
  const s = String(r.FNUMBER || '').slice(0, 6)
  if (!s.startsWith('10')) continue
  const n = String(r.FNAME || '').trim()
  if (n && detectSubMismatch(n, s)) suspect.add(r.FNUMBER)
}
console.log('物料 ' + rows.length + ' 条 ｜ 范围 ' + scopeLabel + '（' + SUBS.length + ' 小类）')
console.log('剔除疑似错类 ' + suspect.size + ' 条（全库口径）\n')

const out = { subs: {} }
const pendingRows = []
let usedRows = 0, droppedRows = 0
const stat = { subs: 0, params: 0, accepted: 0, pending: 0, suspected: 0 }

for (const sub of SUBS) {
  const info = getCategory(sub) || {}
  // tokens 来源（按优先级合并，最后减去排除项）：
  //   ① 范式库 fields —— 这是「这个小类应该有哪些参数」的权威定义（国标字段）
  //   ② 中类通用 chooseTokens —— 兜底（范式库没定义字段时用）
  //   ③ subAddTokens —— 范式外但确实要提的补充
  //   ④ subRemoveTokens —— 中类通用带进来、但该小类语义上不该有的
  // 之前只看 ②③，导致范式库定义了 268 个字段却完全没被提取。
  const gx = (GUIDE.subs || {})[sub] || {}
  const tokFields = (Array.isArray(gx.fields) ? gx.fields : [])
    .map((f) => ALIAS[String(f.key || '').trim()] || String(f.key || '').trim())
    .filter((k) => k && SFFIELDS[k])
  const tokAdd = (DEDUP.subAddTokens || {})[sub] || []
  const tokDel = (DEDUP.subRemoveTokens || {})[sub] || []
  // 厂家样本里出现过的参数名也要进 tokens，否则参数根本不会被创建
  const tokMfr = Object.keys((MFR.subs || {})[sub] || {})
  // 有范式字段就以范式为准（规范驱动）；没有才回落到中类通用 tokens。
  // 之前把两者叠加，导致 108 个小类凭空多出 224 个规范外的参数 ——
  // 例如仪表类普遍多出「变比/频率」、传感器多出「额定电压」，
  // 都是 1009/1005 中类 chooseTokens 的副作用，与这个小类的国标字段无关。
  const tokens = tokFields.length
    ? [...new Set([...tokFields, ...tokAdd, ...tokMfr])].filter((t) => !tokDel.includes(t))
    : [...new Set([...chooseTokens(info), ...tokAdd, ...tokMfr])].filter((t) => !tokDel.includes(t))
  if (!tokens.length) continue
  const list = rows.filter((r) => String(r.FNUMBER || '').startsWith(sub) && String(r.FSPECIFICATION || '').trim())
  const clean = list.filter((r) => !suspect.has(r.FNUMBER))
  droppedRows += list.length - clean.length
  usedRows += clean.length
  if (!clean.length) continue

  // 该小类内逐参数统计 —— 只在这一层做聚合，绝不跨小类
  const perParam = new Map()   // 参数 → { raw:Map, norm:Map, aliasMap:Map }
  for (const t of tokens) perParam.set(t, { raw: new Map(), norm: new Map(), aliasMap: new Map() })

  for (const r of clean) {
    const vals = extractParams(String(r.FSPECIFICATION), tokens)
    for (const t of tokens) {
      const v = vals[t]
      if (!v) continue
      const acc = perParam.get(t)
      acc.raw.set(v, (acc.raw.get(v) || 0) + 1)
      const nv = normalize(t, v)
      if (nv == null) continue
      acc.norm.set(nv, (acc.norm.get(nv) || 0) + 1)
      if (nv !== String(v).trim()) acc.aliasMap.set(String(v).trim(), nv)
    }
  }

  const params = {}
  for (const [name, acc] of perParam) {
    if (!acc.norm.size) continue
    const ranked = [...acc.norm.entries()].sort((a, b) => b[1] - a[1])
    const ser = checkSeries(name, ranked[0][0], sub)   // 先探一次，判断该参数在此类是否有序列
    const hasSeries = !!ser
    const normCount = ranked.length
    // 类型按"该小类内"的取值种数判定，不看别的类
    const kind = hasSeries ? 'series' : (normCount <= 15 ? 'enum' : normCount <= 50 ? 'semi' : 'free')

    const aliases = {}
    for (const [k, v] of acc.aliasMap) aliases[k] = v
    const base = {
      type: kind,
      series: hasSeries ? ser.series : '',
      rawCount: acc.raw.size,
      normCount,
      aliases,
    }

    if (kind === 'free') {
      params[name] = {
        ...base,
        reference: ranked.slice(0, 5).map(([value, count]) => ({ value, count })),
        note: '取值过多，不推荐值；仅保留 Top5 作"本小类常见写法"参考',
      }
      continue
    }

    const accepted = [], pending = [], suspected = []
    for (const [v, c] of ranked) {
      const chk = hasSeries ? checkSeries(name, v, sub) : null
      // 序列内，或业务已确认过 → 都算标准值
      const inSeries = (chk ? chk.ok : true) || isConfirmed(sub, name, v)
      if (inSeries && c >= 2) accepted.push({ value: v, count: c, source: 'stock' })
      else if (!inSeries && c >= 5) {
        pending.push({ value: v, count: c, reason: '不在本小类标准序列但出现 ≥5 次，需确认是否为行业惯例/特殊规格' })
        pendingRows.push({ 小类: sub, 小类名: info.subName || '', 参数: name, 值: v, 条数: c, 类型: '标准外高频' })
      } else {
        suspected.push({ value: v, count: c })
      }
    }

    // 人工确认过的值：即使这一轮存量里没出现，也保留在 accepted（业务已认可，
    // 不能因为某批数据缺失就丢掉）。source=confirmed 便于和存量值区分。
    const confList = CONFIRMED[sub + '|' + name] || []
    for (const cv of confList) {
      const sv = String(cv)
      if (accepted.some((x) => String(x.value) === sv)) continue
      if (pending.some((x) => String(x.value) === sv)) continue
      if (suspected.some((x) => String(x.value) === sv)) continue
      accepted.push({ value: sv, count: 0, source: 'confirmed' })
    }

    // 厂家样本参数：存量里没写、但厂家产品确有这个规格（如 MTZ 的 6300A、iC65 的 D 曲线）。
    // 直接并入 accepted，标 source=manufacturer，与存量值区分开。
    const mfrVals = ((MFR.subs || {})[sub] || {})[name] || []
    for (const mv of mfrVals) {
      const sv = String(mv)
      if (accepted.some((x) => String(x.value) === sv)) continue
      if (pending.some((x) => String(x.value) === sv)) continue
      accepted.push({ value: sv, count: 0, source: 'manufacturer' })
    }

    // 方案 B：候选 = 本小类存量（带频次） + 本小类族的标准序列（count=0，标 source=series）
    // 只扩展枚举型序列；E 系列（阻值/容值）是"基准×数量级"，组合无穷，不扩展（testOnly）。
    // 注意：序列仍按小类族取（电容耐压 / 电缆 / 配电），所以不会出现"断路器推荐 63V"。
    const serInfo = hasSeries ? seriesOf(name, sub) : null
    if (serInfo && !serInfo.testOnly && serInfo.list.length) {
      const have = new Set(accepted.map((x) => String(x.value)))
      for (const sv of serInfo.list) {
        if (have.has(String(sv))) continue
        accepted.push({ value: String(sv), count: 0, source: 'series' })
      }
      // 存量支持的排在前（按频次降序），序列补充的排后
      accepted.sort((a, b) => (b.count || 0) - (a.count || 0))
    }

    stat.accepted += accepted.length
    stat.pending += pending.length
    stat.suspected += suspected.length
    stat.params++

    params[name] = {
      ...base,
      accepted: accepted.slice(0, 60),
      pending,
      suspected: suspected.slice(0, 20),
    }
  }

  // 存量样本不足（物料太少或全是型号）的小类，提取不出任何取值 —— 但按
  // 「参数内容必须全」的原则，仍要按模板占位符建立参数声明（值为空，后续录入自然填充）。
  // 否则这些小类在参数标准库里完全不存在，界面上看不到它有哪几个参数。
  if (!Object.keys(params).length) {
    const g = (GUIDE.subs || {})[sub] || {}
    const ph = (String(g.specPattern || '').match(/\{[^}]+\}/g) || []).map((x) => x.slice(1, -1))
    for (const raw of ph) {
      if (NAMEONLY.has(raw)) continue
      const name = ALIAS[raw] || raw
      if (params[name]) continue
      params[name] = {
        type: 'free',
        accepted: [], pending: [], suspected: [],
        note: '模板声明但暂无取值（该小类存量样本不足）',
      }
    }
    if (Object.keys(params).length) stat.paramOnly = (stat.paramOnly || 0) + 1
  }

  if (!Object.keys(params).length) continue
  stat.subs++
  out.subs[sub] = {
    subName: info.subName || '',
    midName: info.midName || '',
    rowCount: clean.length,
    droppedCount: list.length - clean.length,
    params,
  }
}

// 收尾：有模板、但因存量样本不足没走到上面的小类，按模板补一份空参数声明。
// 这样「参数内容必须全」——值可以后补，但每个小类该有哪些参数在库里是明确的。
for (const [sub, g] of Object.entries(GUIDE.subs || {})) {
  if (out.subs[sub]) continue
  if (!inScope(sub)) continue
  const ph = (String(g.specPattern || '').match(/\{[^}]+\}/g) || []).map((x) => x.slice(1, -1))
  const params = {}
  for (const raw of ph) {
    if (NAMEONLY.has(raw)) continue
    const name = ALIAS[raw] || raw
    if (params[name]) continue
    params[name] = {
      type: 'free', accepted: [], pending: [], suspected: [],
      note: '模板声明但暂无取值（该小类存量样本不足）',
    }
  }
  if (!Object.keys(params).length) continue
  out.subs[sub] = {
    subName: g.subName || '',
    midName: '',
    rowCount: 0,
    droppedCount: 0,
    params,
  }
  stat.subs++
  stat.paramOnly = (stat.paramOnly || 0) + 1
}

// 合并：分批构建时只覆盖本次范围内的小类，其余小类保持原样。
// 否则「只构建 1204」会把整库写成只剩 1204 的内容。
try {
  const OUT_FILE = path.join(ROOT, 'src/config/param-standard.json')
  if (fs.existsSync(OUT_FILE)) {
    const old = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8')) || {}
    const merged = { ...(old.subs || {}) }
    for (const [k, v] of Object.entries(out.subs || {})) merged[k] = v
    out.subs = merged
  }
} catch (e) { console.warn('  合并旧库失败（将只写本次范围）:', e.message) }

out.meta = {
  version: '0.2.0',
  generatedAt: new Date().toISOString(),
  draft: true,
  structure: 'subs[小类] → params[参数] → {type, accepted, pending, suspected, aliases}',
  principle: '参数值按小类隔离：某小类的候选只来自该小类的存量，不跨小类共用',
  scope: scopeLabel + ' 中类',
  sourceRows: usedRows,
  droppedRows,
  note: '由 src/param-lib/build.mjs 生成。accepted=可推荐；pending=待确认；suspected=疑似笔误/提取错误。人工确认后把 draft 改为 false。',
  // 保留人工确认清单：这些值不在标准序列里但业务认可，
  // 下次重建时仍会归 accepted（不能丢，否则一重建就退回 pending）
  confirmed: CONFIRMED,
}

fs.writeFileSync(OUT_LIB, JSON.stringify(out, null, 2) + '\n', 'utf8')
fs.writeFileSync(OUT_PENDING, JSON.stringify(pendingRows, null, 2) + '\n', 'utf8')

// ============ 输出摘要 ============
console.log('=== 输出 ===')
console.log('  库: src/config/param-standard.json')
console.log('  小类 ' + stat.subs + ' 个 ｜ 参数条目 ' + stat.params + ' ｜ accepted ' + stat.accepted + ' ｜ pending ' + stat.pending + ' ｜ suspected ' + stat.suspected)
console.log('  待确认清单: data/param-standard-pending.json（' + pendingRows.length + ' 条，均标注所属小类）')

console.log('\n=== 按小类抽样（验证隔离性）===')
const sample = ['100105', '101301', '110302', '101401', '101410'].filter((s) => out.subs[s])
for (const s of sample) {
  const o = out.subs[s]
  console.log('\n  ' + s + ' ' + o.subName + '（' + o.rowCount + ' 条）')
  for (const [name, p] of Object.entries(o.params)) {
    const top = (p.accepted || p.reference || []).slice(0, 4).map((x) => x.value + '(' + x.count + ')').join(' ')
    if (top) console.log('    ' + name.padEnd(10) + p.type.padEnd(7) + top)
  }
}

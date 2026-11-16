/**
 * 规格型号「分段补全」——按范式模板推断当前在填哪个参数，给出该参数的取值候选。
 *
 * 设计依据（实测数据，见讨论记录）：
 *   1. 按空格拆整句的候选质量差（Top5 覆盖 2%~34%，因用户写法与模板不齐），
 *      而按「参数」拆的候选质量好得多：
 *        枚举型（极数/脱扣曲线/精度/分断等级）：Top5 覆盖 91%~100%
 *        半枚举型（额定电压/芯数/功率/截面）：Top5 覆盖 43%~76%
 *        自由型（型号/阻值）：取值上百种 → 不猜值，只补单位
 *   2. 因此本模块只做「模板里能对齐到参数库」的段，对齐不上的段直接跳过（绝不猜）。
 *
 * 关键机制：
 *   - 模板占位符 → 参数名：用 config/guide-field-map.json 的 alias 翻译
 *     （如 {脱扣特性} → 脱扣曲线；{额定功率} → 功率）
 *   - 相邻占位符合并成一段：`{脱扣特性}{额定电流}A` 是一个补全单元，候选为 `C16A`、`C10A`
 *   - 候选值来自本小类存量规格的参数提取结果，按频次排序
 *   - 段尾单位（A/Ω/W/mm^2）用于「数字后自动补单位」
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getCategory, chooseTokens } from './classify.js'
import { extractParams } from './struct-spec.js'
import { loadGuide } from './guide-fields.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP_FILE = path.join(ROOT, 'src/config/guide-field-map.json')

// 模板占位符 → 参数名（只读翻译层，60 秒缓存，改文件即时生效）
let _alias = null
let _aliasAt = 0
function aliasMap() {
  if (_alias && Date.now() - _aliasAt < 60000) return _alias
  _aliasAt = Date.now()
  try { _alias = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')).alias || {} }
  catch (e) { _alias = {} }
  return _alias
}

/**
 * 把 specPattern 拆成「补全段」。
 *
 * 一个「段」= 空格分隔的一段，内部可能含多个占位符（如 `{脱扣特性}{额定电流}A`、`{芯数}*{截面}mm^2`）。
 * 段内保留 `tpl`（占位符原样）与分隔符，拼值时按位替换 ——
 * 否则 `3` 和 `2.5` 会拼成 `32.5`（丢了 `*`），候选就全错了。
 * @returns {{segments: Array<{key:string, params:string[], rawNames:string[], tpl:string, unit:string}>, tokens:string[], pattern:string}}
 */
export function patternSegments(sub) {
  const s = String(sub || '').slice(0, 6)
  const pat = (((loadGuide().subs || {})[s] || {}).specPattern) || ''
  const info = getCategory(s)
  const tokens = chooseTokens(info)
  const al = aliasMap()
  const out = []
  for (const seg of String(pat).split(/\s+/).filter(Boolean)) {
    const rawNames = [...seg.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].trim())
    if (!rawNames.length) continue
    // 翻译成参数名；参数库里没有的（如 设备类型/关键参数/端头类型）直接跳过 —— 不猜
    const params = rawNames.map((n) => al[n] || (tokens.includes(n) ? n : ''))
    if (params.some((p) => !p)) continue
    let unit = seg.replace(/\{[^}]+\}/g, '').replace(/^[*×·]+/, '').trim()
    if (!/^[A-Za-zΩ℃°%μ0-9^]+$/.test(unit)) unit = ''
    // tpl：去掉尾部单位后的段模板（保留参数间分隔符）
    const tpl = unit ? seg.slice(0, seg.lastIndexOf(unit)) : seg
    out.push({ key: params.join('+'), params, rawNames, tpl, unit })
  }
  return { segments: out, tokens, pattern: pat }
}

/** 按段模板拼值：{脱扣特性}{额定电流} + {脱扣曲线:C, 额定电流:16A} → C16A */
function fillTpl(seg, vals) {
  let i = 0
  return seg.tpl.replace(/\{[^}]+\}/g, () => {
    const p = seg.params[i++]
    return vals[p] || ''
  })
}

// 每小类的「段 → 取值频次」表，5 分钟缓存（存量变了不用重启）
const CACHE = new Map()
const TTL = 5 * 60 * 1000

/**
 * @param {string} sub 小类
 * @param {Array<{fSpec?:string, spec?:string, fnumber?:string, FNUMBER?:string}>} [items]
 *        该小类的物料（由调用方提供 —— 3130 用 allDocs()，3100 用 plm-index 的 bucketItems）。
 *        不传则仅返回模板结构、无候选。
 */
function statOf(sub, items) {
  const src = items || []
  const hit = CACHE.get(sub)
  // 数据源变了（条数不同）也要重建，避免缓存住空表
  if (hit && Date.now() - hit.at < TTL && hit.srcCount === src.length) return hit
  const meta = patternSegments(sub)
  const table = new Map()
  for (const it of src) {
    // 调用方可以传"该小类"或"全量"：这里统一按小类过滤
    // 三处来源字段命名不同：plm-index 的 minimal() 用 fNumber，看板 allDocs() 用 fnumber，快照用 FNUMBER
    const sn = String(it.sub || it.SUB || '').slice(0, 6)
    const fn = String(it.fnumber || it.FNUMBER || it.fNumber || '')
    if (sn ? sn !== sub : !fn.startsWith(sub)) continue
    const spec = String(it.fSpec || it.spec || '')
    if (!spec) continue
    const vals = extractParams(spec, meta.tokens)
    for (const sg of meta.segments) {
      if (!sg.params.every((p) => vals[p])) continue   // 参数不全 → 该段不算有效取值
      const v = fillTpl(sg, vals)
      if (!v) continue
      if (!table.has(sg.key)) table.set(sg.key, new Map())
      const m = table.get(sg.key)
      m.set(v, (m.get(v) || 0) + 1)
    }
  }
  const ranked = new Map()
  for (const [k, m] of table) {
    ranked.set(k, [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count })))
  }
  const st = { at: Date.now(), ...meta, ranked, total: src.length, srcCount: src.length }
  CACHE.set(sub, st)
  return st
}

/**
 * 规格输入补全。
 * @param {string} sub 小类 6 位
 * @param {string} q   当前已输入内容
 * @returns 当前段、已填段、候选（带频次）与模板
 */
export function complete(sub, q, items) {
  const s6 = String(sub || '').slice(0, 6)
  const raw = String(q || '')
  const st = statOf(s6, items)

  if (!st.segments.length) {
    return { ok: false, reason: '该小类模板无法对齐参数库', param: '', prefix: '', options: [], segments: [], pattern: st.pattern, sampleSize: st.total }
  }

  const vals = extractParams(raw, st.tokens)
  // 当前段 = 第一个尚未填全的段；都填了则停在最后一段（便于修改）
  let idx = st.segments.findIndex((sg) => !sg.params.every((p) => vals[p]))
  if (idx < 0) idx = st.segments.length - 1
  const seg = st.segments[idx]

  // 正在输入的片段 = 最后一个空格后的内容；只有它确实属于本段参数时才当prefix
  const tail = (/([^\s]*)$/.exec(raw) || [, ''])[1]
  const tailVals = tail ? extractParams(tail, seg.params) : {}
  const belongs = !!(tail && seg.params.some((p) => tailVals[p]))
  const prefix = belongs ? tail : ''

  const all = st.ranked.get(seg.key) || []
  const key = prefix.toLowerCase()
  let opts = key
    ? all.filter((x) => x.value.toLowerCase().startsWith(key) || x.value.toLowerCase().includes(key))
    : all

  // 单位补全：本段带单位、输入是「数字（可带 k/M/μ 倍率）」→ 优先给「数字+单位」
  // 例：电阻段输入 10k → 10kΩ；电缆截面输入 2.5 → 2.5mm^2
  const unitHit = seg.unit && /^[\d.]+\s*[kKmMμuGg]?$/.test(prefix)
  if (unitHit) {
    const withUnit = prefix + seg.unit
    opts = [{ value: withUnit, count: 0, kind: 'unit' }, ...opts.filter((x) => x.value !== withUnit)]
  }

  return {
    ok: true,
    param: seg.key,
    unit: seg.unit,
    prefix,
    index: idx,
    total: st.segments.length,
    filled: st.segments.slice(0, idx).map((x) => x.key),
    segments: st.segments.map((x) => x.key + (x.unit ? x.unit : '')),
    options: opts.slice(0, 8),
    pattern: st.pattern,
    sampleSize: st.total,
  }
}

/** 清缓存（测试或数据刷新时用） */
export function clearCompleteCache() { CACHE.clear() }

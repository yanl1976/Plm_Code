/**
 * 参数标准库 · 读取层（独立于现有规则库）
 *
 * **核心原则：参数按小类隔离。**
 * 所有查询接口的第一个参数都是 sub（小类），不存在"全局参数表"：
 *   电容的「额定电压」是 63V/100V/250V，断路器的「额定电压」是 220V/380V/690V。
 *   若提供全局接口，调用方很容易误用，导致把 63V 推荐给断路器。
 *
 * 设计约束：
 *   1. 只读 —— 现有库（spec-fields / naming-guide / dedup-rules）一律不修改
 *   2. 可关闭 —— config/param-lib-rules.json 的 enabled=false 时，所有查询返回空
 *   3. 影子模式 —— shadow=true 时只产出"如果启用会推荐什么"，不影响校验结果
 *
 * 数据文件：src/config/param-standard.json（由 src/param-lib/build.mjs 生成草稿）
 * 结构：subs[小类] → params[参数] → {type, accepted, pending, suspected, aliases}
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { normalize } from './normalize.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const CONF_FILE = path.join(ROOT, 'src/config/param-lib-rules.json')
const LIB_FILE = path.join(ROOT, 'src/config/param-standard.json')

let _conf = null
let _confAt = 0
let _lib = null
let _libAt = 0

/** 开关配置（5 秒缓存，改文件即生效） */
export function config() {
  const now = Date.now()
  if (_conf && now - _confAt < 5000) return _conf
  _confAt = now
  try { _conf = JSON.parse(fs.readFileSync(CONF_FILE, 'utf8')) }
  catch (e) { _conf = { enabled: false, subs: [], useFor: {}, level: 'warn' } }
  return _conf
}

/** 该小类是否启用（enabled + subs 白名单） */
export function enabled(sub) {
  const c = config()
  if (!c.enabled) return false
  const subs = Array.isArray(c.subs) ? c.subs : []
  if (!subs.length) return true
  return subs.includes(String(sub || '').slice(0, 6))
}

export function isShadow() {
  return config().shadow !== false
}

/** 整库（5 秒缓存） */
export function library() {
  const now = Date.now()
  if (_lib && now - _libAt < 5000) return _lib
  _libAt = now
  try { _lib = JSON.parse(fs.readFileSync(LIB_FILE, 'utf8')) }
  catch (e) { _lib = { subs: {} } }
  return _lib
}

/** 某小类的参数定义集合（未收录返回 {} ） */
export function subParams(sub) {
  const s6 = String(sub || '').slice(0, 6)
  const node = (library().subs || {})[s6]
  return (node && node.params) || {}
}

/** 某小类下某参数的定义（未收录返回 null） */
export function paramDef(sub, name) {
  return subParams(sub)[name] || null
}

/**
 * 把参数值换算成可比较的数值（基本单位），用于"按值递增"排序。
 * 复合电压 450/750V 取额定值（后一个数）；无法解析的返回 NaN（走字典序）。
 */
export function numericOf(param, value) {
  const s = String(value || '').toUpperCase().replace(/\s/g, '')
  if (param === '额定电压') {
    const m = /^(\d+(?:\.\d+)?)(?:\/(\d+(?:\.\d+)?))?(KV|V)$/.exec(s)
    if (!m) return NaN
    const base = m[2] ? parseFloat(m[2]) : parseFloat(m[1])
    return base * (m[3] === 'KV' ? 1000 : 1)
  }
  if (param === '容值') {
    // 注意：toUpperCase() 会把 μ(U+03BC) 变成希腊大写 Μ(U+039C)，不是 ASCII 的 M。
    // 若按 MF 处理会被当成毫法（1e-3），与微法（1e-6）差 1000 倍 —— 实测导致 2200μF 排在 220μF 之前。
    // 故先把 μ/Μ 统一成 u，再解析。
    const u = String(value || '').replace(/\s/g, '').replace(/[\u03BC\u039C]/g, 'u')
    const m = /^(\d+(?:\.\d+)?)(uF|nF|pF|mF|F)$/i.exec(u)
    if (!m) return NaN
    const unit = m[2].toLowerCase()
    const mult = unit === 'f' ? 1 : unit === 'uf' ? 1e-6 : unit === 'nf' ? 1e-9 : unit === 'pf' ? 1e-12 : 1e-3
    return parseFloat(m[1]) * mult
  }
  if (param === '阻值') {
    const m = /^(\d+(?:\.\d+)?)(MΩ|KΩ|Ω)$/.exec(s)
    if (!m) return NaN
    const mult = { 'MΩ': 1e6, 'KΩ': 1e3, 'Ω': 1 }[m[2]] || 1
    return parseFloat(m[1]) * mult
  }
  // 功率：支持分数写法 1/2W、1/4W（=0.5W、0.25W）与 kW
  // 不处理的话，1/2W 会被当成"1"，排到 1W 之后 —— 电阻功率档位里这两个写法很常见
  if (param === '功率') {
    const frac = /^(\d+)\/(\d+)\s*(KW|W)$/i.exec(s)
    if (frac) {
      const v = parseFloat(frac[1]) / parseFloat(frac[2])
      return v * (frac[3].toUpperCase() === 'KW' ? 1000 : 1)
    }
    const num = /^([\d.]+)\s*(KW|W)$/i.exec(s)
    if (num) return parseFloat(num[1]) * (num[2].toUpperCase() === 'KW' ? 1000 : 1)
  }
  // 通用：取首个数字（极数 3P→3、电流 10→10、精度 ±1%→1、分断能力 6→6、变比 200/5→200）
  const m = /(-?\d+(?:\.\d+)?)/.exec(s)
  return m ? parseFloat(m[1]) : NaN
}

/**
 * 单位等级（用于"按单位递增"排序）：
 *   容值 pF(1) → nF(2) → μF(3) → mF(4) → F(5)
 *   阻值 Ω(1) → kΩ(2) → MΩ(3)
 * 同一等级内再按数量递增。
 * 这样得到的是「表格序」——同一单位排在一起，扫一眼就能定位。
 */
const UNIT_RANK = {
  容值: [
    [/^pF$/, 1], [/^nF$/, 2],
    [/^[\u03BC\u039Cu]F$/, 3],   // μF(U+03BC) / ΜF(U+039C 希腊大写) / uF(ASCII)
    [/^mF$/, 4], [/^F$/, 5],
  ],
  阻值: [[/^Ω$/, 1], [/^kΩ$/, 2], [/^MΩ$/, 3]],
  // 注意顺序：KV 必须先于 V 判断，否则 0.6/1KV 会被当成 V 组
  额定电压: [[/KV$/, 2], [/V$/, 1]],
  // 功率不进这张表：电阻功率有分数写法 1/2W、1/4W，
  // 而 unitParts 对「a/b」的约定是"复合值取后一个"（电压 450/750V 取 750），
  // 于是 1/2W 会被取成 2，排到 2W 旁边。功率的分数换算统一交给 numericOf 处理。
}

/** 拆出「单位等级 + 数量」，用于按单位递增排序；无法解析返回 null */
function unitParts(param, value) {
  const s = String(value || '').replace(/\s/g, '')
  const rules = UNIT_RANK[param]
  if (!rules) return null
  // 数值（含 450/750 这种复合）在前、单位在后。
  // 必须用贪婪的 [\d./]+ —— 非贪婪会把 27Ω 拆成 2 + 7Ω，解析失败后落到队首（实测踩过）
  const m = /^([\d./]+)([A-Za-zΩμΜ%]+)$/.exec(s)
  if (!m) return null
  let num = parseFloat(m[1].split('/').pop())
  if (!isFinite(num)) num = parseFloat(m[1])
  const unit = m[2]
  for (const [re, rank] of rules) {
    if (re.test(unit)) return { rank, num: isFinite(num) ? num : 0 }
  }
  return null
}

/** 按值递增排序；带单位的参数按「单位等级 → 数量」，其余按数值，非数值按字典序 */
export function sortByValue(param, arr) {
  const useUnit = !!UNIT_RANK[param]
  return arr.slice().sort((a, b) => {
    if (useUnit) {
      const pa = unitParts(param, a.value)
      const pb = unitParts(param, b.value)
      if (pa && pb) {
        if (pa.rank !== pb.rank) return pa.rank - pb.rank
        return pa.num - pb.num
      }
      if (pa) return -1
      if (pb) return 1
    }
    const na = numericOf(param, a.value)
    const nb = numericOf(param, b.value)
    const fa = isFinite(na)
    const fb = isFinite(nb)
    if (fa && fb) return na - nb
    if (fa) return -1
    if (fb) return 1
    return String(a.value).localeCompare(String(b.value), 'zh')
  })
}

/**
 * 某小类下某参数的标准取值候选 —— **按值递增排序**（便于扫视定位）。
 * 频次只作为附注返回，不参与排序。
 * @returns {Array<{value:string, count:number, source?:string}>}
 */
export function standardValues(sub, name, limit) {
  const d = paramDef(sub, name)
  if (!d) return []
  const max = limit || config().limit || 12
  return sortByValue(name, d.accepted || []).slice(0, max)
}

/**
 * 判断「某小类下的某参数值」是否标准。
 * @returns {{ok:boolean, normalized:string, reason:string}}
 *   reason: standard / pending / unknown / no-def
 */
export function checkValue(sub, name, value) {
  const d = paramDef(sub, name)
  if (!d) return { ok: true, normalized: String(value || ''), reason: 'no-def' }
  const raw = String(value || '').trim()
  // 先归一再比对：调用方给的是原始写法（220kV / 4极 / 10k），
  // 库里的键是归一键（220KV / 4P / 10kΩ）。不归一就会把合法值判成"非标"。
  const nv = normalize(name, raw)
  const base = nv == null ? raw : nv
  const al = d.aliases || {}
  const alias = al[raw] != null ? al[raw] : al[base]
  const v = alias != null ? String(alias) : base
  if ((d.accepted || []).some((x) => String(x.value) === v)) return { ok: true, normalized: v, reason: 'standard' }
  if ((d.pending || []).some((x) => String(x.value) === v)) return { ok: true, normalized: v, reason: 'pending' }
  return { ok: false, normalized: v, reason: 'unknown' }
}

/** 某小类已收录多少参数（诊断用） */
export function subSize(sub) {
  return Object.keys(subParams(sub)).length
}

/** 清缓存（构建后或测试用） */
export function clearCache() {
  _conf = null
  _lib = null
  _confAt = 0
  _libAt = 0
}

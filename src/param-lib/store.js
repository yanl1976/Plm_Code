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
 * 某小类下某参数的标准取值候选（按本小类存量频次降序，只返回 accepted）
 * @returns {Array<{value:string, count:number}>}
 */
export function standardValues(sub, name, limit) {
  const d = paramDef(sub, name)
  if (!d) return []
  const max = limit || config().limit || 8
  return (d.accepted || []).slice(0, max)
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

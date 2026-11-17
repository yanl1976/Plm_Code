/**
 * 参数标准库 · 读取层（独立于现有规则库）
 *
 * 设计原则：
 *   1. 只读 —— 现有库（spec-fields / naming-guide / dedup-rules）一律不修改，本模块只读它们做构建输入
 *   2. 可关闭 —— config/param-lib-rules.json 的 enabled=false 时，所有查询返回空，调用方自然回退到原有逻辑
 *   3. 影子模式 —— shadow=true 时只产出"如果启用会推荐什么"，不影响用户的校验结果
 *
 * 数据文件：src/config/param-standard.json（由 src/param-lib/build.mjs 生成草稿，人工确认后定稿）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const CONF_FILE = path.join(ROOT, 'src/config/param-lib-rules.json')
const LIB_FILE = path.join(ROOT, 'src/config/param-standard.json')

let _conf = null
let _confAt = 0
let _lib = null
let _libAt = 0

/** 开关配置（5 秒缓存，改文件即生效，无需重启） */
export function config() {
  const now = Date.now()
  if (_conf && now - _confAt < 5000) return _conf
  _confAt = now
  try { _conf = JSON.parse(fs.readFileSync(CONF_FILE, 'utf8')) }
  catch (e) { _conf = { enabled: false, subs: [], useFor: {}, level: 'warn' } }
  return _conf
}

/** 该小类是否启用新库（enabled + subs 白名单） */
export function enabled(sub) {
  const c = config()
  if (!c.enabled) return false
  const subs = Array.isArray(c.subs) ? c.subs : []
  if (!subs.length) return true                 // 空 = 全部小类
  return subs.includes(String(sub || '').slice(0, 6))
}

/** 是否处于影子模式（只记录不生效） */
export function isShadow() {
  return config().shadow !== false
}

/** 参数标准库内容（5 秒缓存） */
export function library() {
  const now = Date.now()
  if (_lib && now - _libAt < 5000) return _lib
  _libAt = now
  try { _lib = JSON.parse(fs.readFileSync(LIB_FILE, 'utf8')) }
  catch (e) { _lib = { params: {} } }
  return _lib
}

/** 取某参数的标准定义 */
export function paramDef(name) {
  return (library().params || {})[name] || null
}

/**
 * 某参数的标准取值候选（按存量频次降序，只返回已确认收录的 accepted）
 * @returns {Array<{value:string, count:number}>}
 */
export function standardValues(name, limit) {
  const d = paramDef(name)
  if (!d) return []
  const max = limit || config().limit || 8
  return (d.accepted || []).slice(0, max)
}

/**
 * 判断一个值是否在标准内（accepted 或 aliases 归一后命中）
 * @returns {{ok:boolean, normalized:string, reason:string}}
 */
export function checkValue(name, value) {
  const d = paramDef(name)
  if (!d) return { ok: true, normalized: String(value || ''), reason: 'no-def' }
  const raw = String(value || '').trim()
  const alias = (d.aliases || {})[raw]
  const v = alias != null ? String(alias) : raw
  const hit = (d.accepted || []).some((x) => String(x.value) === v)
  if (hit) return { ok: true, normalized: v, reason: 'standard' }
  const pend = (d.pending || []).some((x) => String(x.value) === v)
  if (pend) return { ok: true, normalized: v, reason: 'pending' }
  return { ok: false, normalized: v, reason: 'unknown' }
}

/** 清缓存（构建后或测试用） */
export function clearCache() {
  _conf = null
  _lib = null
  _confAt = 0
  _libAt = 0
}

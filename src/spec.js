/**
 * 型号规格 / 名称 归一化与结构化工具。
 * 目标：把书写混乱的「型号规格」统一为标准签名，使同一实物的不同写法能被识别为同一签名。
 * 全部规则来自 config/dedup-rules.json 的 normalize 段，保持灵活可配。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RULES = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/dedup-rules.json'), 'utf8'))
const N = RULES.normalize

const FW = '０１２３４５６７８９ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ．，／－（）：；'
const HW = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,/-():;'

export function fullwidthToHalf(s) {
  let out = ''
  for (const ch of s) {
    const i = FW.indexOf(ch)
    out += i >= 0 ? HW[i] : ch
  }
  return out
}

export function normalize(raw, opts = {}) {
  if (raw == null) return ''
  let s = String(raw).trim()
  if (!s) return ''
  if (N.fullwidthToHalf) s = fullwidthToHalf(s)
  if (N.lowercase) s = s.toLowerCase()
  if (N.unifySeparators && N.unifySeparators.length) {
    const re = new RegExp('[' + N.unifySeparators.map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('') + ']', 'g')
    s = s.replace(re, N.separatorTo || '/')
  }
  if (N.removeSpaces) s = s.replace(/\s+/g, '')
  return s
}

// 用于模糊相似度的 token 集合：保留连续字母数字片段 + 单个汉字
export function tokenize(s) {
  const n = normalize(s)
  if (!n) return new Set()
  const tokens = new Set()
  const alnum = n.match(/[a-z0-9]+/g) || []
  for (const a of alnum) if (a.length >= 1) tokens.add(a)
  for (const ch of n) if (/[一-龥]/.test(ch)) tokens.add(ch)
  return tokens
}

export function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  return inter / (a.size + b.size - inter)
}

// 构造同小类内的查重签名：名称 + 规格（含主要参数/技术参数）归一化拼接
export function buildSignature(rec, attrs) {
  const parts = []
  for (const f of attrs) {
    const v = rec[f]
    if (v) parts.push(normalize(v))
  }
  return parts.filter(Boolean).join('|')
}

// 分隔符无关签名：识别「仅分隔符/空格写法不同」的同一物料
// 例：IC65N C10A/2P 与 IC65N C10A 2P、YCW-2000V-1*185 与 YCW 2000V 1*185
// 关键：只删分隔符与空格，**保留小数点**——否则 3*25 与 3*2.5 会被误判为同一物
export function looseSignature(s) {
  return normalize(s).replace(/[\s/\\*+×()（）[\]{}\-,，、;；:－—·_]/g, '')
}

// 轻量文本归一：只做全角→半角、去空格、小写。
// 不能直接用 normalize()：它把 x/X 当乘号统一成 /（3x25 与 3*25 同物），
// 会把型号 NSX100F 变成 ns/100f、LXK-Φ300 变成 l/k-φ300，型号段就被切碎了。
function halfWidth(s) {
  return String(s == null ? '' : s)
    .replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\u3000/g, ' ')
}

export function looseText(s) {
  return halfWidth(s).replace(/\s+/g, '').toLowerCase()
}

// 型号段：规格开头的第一段字母数字串（用于「同型号系列」聚合与联想排序）
// 例：iC65N 1P C1A -> ic65n ; DZX7-2501 F21 -> dzx7-2501 ; NSX100F 3P -> nsx100f
export function modelOf(s) {
  // 空格是天然分隔符，不能先去掉，否则型号会和后面的参数粘成一串
  const m = halfWidth(s).toLowerCase().match(/[a-z0-9][a-z0-9._\-]*/)
  return m ? m[0].replace(/[-._]+$/, '') : ''
}

export { RULES }

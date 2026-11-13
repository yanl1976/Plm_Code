/**
 * 电缆专项规格提示（仅对 110302 小类）
 *
 * 为什么单独一个模块：电压写法的规范只对电缆成立（450/750V、0.6/1kV），
 * 若放进 material-rules 通用引擎，会给电容「500V」、电源「24V」等正常写法误报。
 *
 * 数据依赖：src/config/cable-codes.json（型号代码表，46 个型号，热更新）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'src', 'config', 'cable-codes.json')

let cache = null
let cacheMtime = 0

function loadCodes() {
  try {
    const st = fs.statSync(FILE)
    if (cache && cacheMtime === st.mtimeMs) return cache
    cache = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    cacheMtime = st.mtimeMs
    return cache
  } catch (e) {
    return { codes: {}, prefixes: [] }
  }
}

/** 从规格里识别型号代码；型号可能在开头，也可能被写在末尾 */
export function detectCableCode(spec) {
  const cfg = loadCodes()
  const codes = cfg.codes || {}
  const externs = cfg.externSystems || []
  const keys = Object.keys(codes).sort((a, b) => b.length - a.length)
  const prefixes = (cfg.prefixes || []).slice().sort((a, b) => b.length - a.length)

  let s = String(spec || '').toUpperCase().replace(/\s+/g, '')
  if (!s) return null
  const raw = s

  // 先认「外部体系」（IEEE 45、WDZ-OIL 等）：这类不是国标型号，单独归类不混淆
  for (const e of externs) {
    try {
      if (new RegExp(e.re, 'i').test(raw)) {
        return { code: String(e.std || '外部体系'), info: e, from: 'extern', system: e.system || 'other', raw }
      }
    } catch (err) { /* 正则写错不影响主流程 */ }
  }

  for (const p of prefixes) {
    if (s.startsWith(p)) { s = s.slice(p.length); break }
  }
  s = s.replace(/^[-/_]+/, '')
  for (const k of keys) {
    if (s.startsWith(k)) return { code: k, info: codes[k], from: 'prefix', system: codes[k].system || 'GB', raw }
  }
  for (const k of keys) {
    const i = s.indexOf(k)
    if (i <= 0) continue
    const prev = s[i - 1]
    // 前面是字母时跳过（避免把 ZRYJV 里的 YJV 之外的东西误判）；
    // 例外：+P / -P 这类护套标记后跟型号，如 3*25+1*16+P YCW
    if (/[A-Z]/.test(prev) && !/[+-]P$/.test(s.slice(0, i))) continue
    return { code: k, info: codes[k], from: 'middle', system: codes[k].system || 'GB', raw }
  }
  return null
}

/**
 * 电缆规格提示：返回 warnings 数组（不阻断）
 * 只有识别出**国标型号**时才检查，非标（IEEE 45、WTTC、订货号）不提示
 */
export function cableSpecHints(spec, sub) {
  const out = []
  if (!String(sub || '').startsWith('110302')) return out
  const s = String(spec || '').trim()
  if (!s) return out

  const hit = detectCableCode(s)
  if (!hit) {
    // 识别不出：若开头像型号（2~10 位字母数字，且非纯数字规格），提示「未收录」
    const cfg = loadCodes()
    // 按空格切段再取首段，避免把芯数（WTTC 3*1.5 里的 3）当成型号后缀
    let t = String(s).trim().toUpperCase().split(/\s+/)[0] || ''
    t = t.replace(/^[-/_]+/, '')
    for (const p of (cfg.prefixes || []).slice().sort((a, b) => b.length - a.length)) {
      if (t.startsWith(p + '-') || t.startsWith(p + '/')) { t = t.slice(p.length).replace(/^[-/_]+/, ''); break }
      if (t.startsWith(p) && /[A-Z]/.test(t.charAt(p.length) || '')) { t = t.slice(p.length); break }
    }
    const m = t.match(/^([A-Z][A-Z0-9]{0,9})/)
    if (m && m[1].length >= 2 && !/^(KV|MM|V|A|W|HZ|DC|AC|IP|GB)\d*$/.test(m[1])) {
      out.push('型号「' + m[1] + '」未收录，请确认是「非标产品」还是「型号写法有误」')
    }
    return out
  }
  // 只有国标体系才做「电压写法」检查；IEEE/EN/MT 等电压规范不同，不套用国标口径
  if (String(hit.system || 'GB') !== 'GB') return out

  // ① 电压写法：单值 500V/1000V 不是国标电压等级，建议斜杠式
  const hasSlashV = /\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*k?V/i.test(s)
  const singleV = /(^|[^\d./])(\d{3,4})\s*V\b/i.test(s)
  if (singleV && !hasSlashV) {
    const m = s.match(/(^|[^\d./])(\d{3,4})\s*V\b/i)
    const v = m ? m[2] : ''
    out.push('额定电压建议写斜杠式（如 450/750V、0.6/1kV）；' + (v ? v + 'V ' : '') + '不是国标电压等级')
  }

  // ② 型号与电压等级明显不符（YJV/VV 系列为 1kV 起；KVV/YC/BV 为 450/750V 及以下）
  const std = String((hit.info && hit.info.std) || '')
  if (std === 'GB/T 12706' && /(^|[^\d./])[1-9]\d{1,2}\s*V\b/i.test(s) && !hasSlashV) {
    out.push('该型号（' + hit.code + '）属 1kV 及以上电力电缆，请确认电压等级')
  }

  return out
}

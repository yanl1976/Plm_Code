/**
 * 型号规格「特征参数」结构化提取。
 * 输入：规格文本 + 该小类需要提取的参数名列表（来自 dedup-rules.json 的 heuristics[].tokens）。
 * 输出：{ 参数名: 提取值 }（提取不到则为 ''）。
 * 每个参数的取值正则定义在 src/config/spec-fields.json 的 library 段，保持灵活可配。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CFG = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/spec-fields.json'), 'utf8')) || {} }
  catch { return {} }
})()
const LIB = CFG.library || {}
const DECODERS = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/brand-decode.json'), 'utf8')).decoders || [] }
  catch { return [] }
})()
const SEMANTICS = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/model-semantics.json'), 'utf8')) }
  catch { return { decoders: [] } }
})()

// 型号编码解码：文本正则提取为空时，按品牌前缀识别型号编码并解出参数（fill-when-empty，绝不覆盖文本值）。
function decodeParams(spec, tokens, out) {
  for (const dec of DECODERS) {
    let det
    try { det = new RegExp(dec.detect, 'i') } catch { continue }
    if (!det.test(spec)) continue
    for (const rule of dec.rules || []) {
      if (rule.param === '型号') continue
      if (!tokens.includes(rule.param)) continue
      if ((out[rule.param] || '') !== '') continue
      let re
      try { re = new RegExp(rule.regex, 'i') } catch { continue }
      const m = re.exec(spec)
      if (!m) continue
      let val
      if (rule.table) {
        const key = m.slice(1).join('')
        val = rule.table[key]
        if (!val && rule.stripZeros) {
          let k = key
          while (k.length > 1 && k.endsWith('0') && !rule.table[k]) k = k.slice(0, -1)
          val = rule.table[k]
        }
      }
      if (!val && rule.else) val = rule.else.replace(/\{\{(\d+)\}\}/g, (_, n) => m[+n] || '')
      if (val && CFG.decoderFill) out[rule.param] = val
    }
  }
}

// 段匹配：带 ratings 白名单时逐个候选校验（如 C65 的 C 会伪装成曲线，65 非标准额定值则跳过）
function segMatch(re, s, seg) {
  const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  let m
  while ((m = g.exec(s)) !== null) {
    if (seg.ratings) {
      const v = m[seg.ratingsCap || seg.cap || 1]
      if (v === undefined || !seg.ratings.includes(String(v))) {
        if (m.index === g.lastIndex) g.lastIndex++
        continue
      }
    }
    return m
  }
  return null
}

// 品牌型号编码语义解码：对照生产商编码表（model-semantics.json）逐段解释型号。
// detect 首个命中品牌即用；segment.key 与特征参数同名时按 fill-when-empty 回填 out（绝不覆盖文本提取值）。
// 返回 { brand, series, features:[{key,value,meaning}] }；无命中品牌返回 null。
export function decodeSemantics(spec, tokens = [], out = null) {
  const s = String(spec || '')
  for (const d of SEMANTICS.decoders || []) {
    let det
    try { det = new RegExp(d.detect, 'i') } catch { continue }
    if (!det.test(s)) continue
    const feats = []
    const seen = new Set()
    for (const seg of d.segments || []) {
      if (seen.has(seg.key)) continue
      let re
      try { re = new RegExp(seg.regex, 'i') } catch { continue }
      const m = segMatch(re, s, seg)
      if (!m) continue
      const capIdx = seg.cap || 1
      let value, meaning
      if (seg.table) {
        const cap = m[capIdx] ?? m[0]
        const e = seg.table[cap] || seg.table[String(cap).toUpperCase()] || seg.table[String(cap).toLowerCase()]
        if (!e) continue
        value = e.value; meaning = e.meaning
      } else {
        const tpl = (t) => String(t || '').replace(/\{\{(\d+)\}\}/g, (_, n) => m[+n] ?? '')
        value = seg.valueTemplate ? tpl(seg.valueTemplate) : (m[capIdx] ?? m[0])
        meaning = tpl(seg.meaning)
      }
      if (!value) continue
      // 原文位置：整段匹配去掉前导分隔符，供覆盖率校验（原文↔参数双向对账）
      let at = m.index, text = m[0]
      if (/^[-\s]/.test(text)) { const cut = text.length - text.replace(/^[-\s]+/, '').length; at += cut; text = text.slice(cut) }
      const src = { at, text }
      // 原文代号保留：如 iC65N → 分断等级=N（与解码值 分断能力=6kA 并列，保证可反向拼回）
      if (seg.table && seg.literalKey) feats.push({ key: seg.literalKey, value: String(m[capIdx] ?? m[0]), meaning: '型号原文代号「' + (m[capIdx] ?? m[0]) + '」→ ' + value + '。' + (meaning || ''), src })
      // 字面代号（如分断等级 N/F/H）属表层原文，不反推；即使 decoderFill=false 也按 fill-when-empty 回填 params
      if (seg.literalKey && out && tokens.includes(seg.literalKey) && (out[seg.literalKey] || '') === '') out[seg.literalKey] = String(m[capIdx] ?? m[0])
      seen.add(seg.key)
      feats.push({ key: seg.key, value: String(value), meaning: String(meaning || ''), src })
      if (CFG.decoderFill && out && tokens.includes(seg.key) && (out[seg.key] || '') === '') out[seg.key] = String(value)
    }
    return { brand: d.brand, series: d.series, features: feats }
  }
  return null
}

// 单位归一化：把各种平方毫米写法规范成 mm²，普通毫米写成 mm；原文无单位则返回空（绝不补）。
function normUnit(u) {
  if (!u) return ''
  const s = String(u).replace(/\s+/g, '')
  if (/[²平方]|mm2|㎜2|\^2|2\s*mm|mm\s*2|MM\^2|MM\s*2/i.test(s)) return 'mm²'
  if (/mm/i.test(s)) return 'mm'
  return s
}
// 截面值尾部单位归一化（保留原文单位，只规范写法，不补原文没有的）
function normCrossSection(v) {
  return String(v).replace(/\s*(mm²|mm2|㎜2|平方|MM\^2|MM\^|MM\s*2|\^2\s*m*|²\s*m*|mm)\s*$/i, (m) => normUnit(m))
}

// 从一条规格文本里按参数定义提取值；多捕获组用 join 连接，多匹配去重后用 join 连接。
// def.firstOnly 为真时只取首个匹配（如额定电流，一个物料仅一个额定值，避免把脱扣器编号/多段规格拼接进来）。
function extractOne(spec, def) {
  if (!def || !def.patterns) return ''
  const join = def.join || '/'
  const found = []
  for (const p of def.patterns) {
    let re
    try { re = new RegExp(p, 'gi') } catch { continue }
    let m
    while ((m = re.exec(spec)) !== null) {
      const groups = m.slice(1).filter((x) => x !== undefined)
      let val = (groups.length ? groups.join(join) : m[0]).trim()
      if (def.normalizeUnit) val = normCrossSection(val)
      if (def.suffix && val && !val.endsWith(def.suffix)) val += def.suffix
      if (val) {
        if (def.firstOnly) return val
        if (!found.includes(val)) found.push(val)
      }
      if (m.index === re.lastIndex) re.lastIndex++ // 防零宽死循环
    }
    if (found.length) break
  }
  return found.join(join)
}

export function extractParams(spec, tokens = [], lib = LIB) {
  // 抗干扰：把干扰分隔符 _ \ 归一成空格（型号内部保留 - / . ；/ 参与电压范围与型号，不归一化）
  const s = spec == null ? '' : String(spec).replace(/[_\\]/g, ' ')
  const out = {}
  for (const t of tokens) {
    if (!lib[t]) { out[t] = ''; continue }
    // 型号：取规格首词（多数物料规格以型号/系列代号开头；兼容西门子 3RT、小写 iC65N 等带前缀/小写情形），避免过度捕获
    if (t === '型号') {
      // 跳过前置中文/空格/分隔符，遇 _ \ 或中文标点断词；模型内部保留 - / .（如 BVR-500V、AD11-22/41 整体保留）
      const m = s.match(/(?:^|[\s/_\\，、；;。:：（）()【】—－])([A-Za-z0-9][A-Za-z0-9.\-/]*[A-Za-z0-9])/)
      let model = m ? m[1] : ''
      if (!/[A-Za-z]/.test(model)) model = ''          // 必须含字母，纯数字不是型号
      // 纯数字或 数字+单位（尺寸/数值，如 500mm、2200、100）→ 不是型号
      if (/^[\d.]+(?:mm|cm|m|kV|V|A|W|Ω|kA|mA|µm|um)?$/i.test(model)) model = ''
      // 单字母 + 后接 =/:/* 或 空格+数字 → 是尺寸变量前缀（L=7 / L:3m），不是型号
      if (/^[A-Za-z]$/.test(model) && /^[=:*]|\s\d/.test(s.slice(m ? m.index + m[0].length : 0))) model = ''
      // 型号结尾若粘连极数/电流（如 IC65N-2P-6A、ABB-1P3A），拆解：型号取到首个 -[1-4]P 之前，极数与电流由各自正则另行捕获
      const pm = model.match(/^(.*?)-([1-4]P)(?:-?(\d+\.?\d*A?))?/)
      if (pm && pm[2]) model = pm[1]
      out[t] = model
      continue
    }
    out[t] = extractOne(s, lib[t])
  }
  decodeParams(s, tokens, out)
  decodeSemantics(s, tokens, out) // 语义段值：decoderFill=false 时仅作校验，不反推回填
  // 参数排列顺序：按全局 order 排序（未知参数保持原插入序追加在末尾）
  if (CFG.order && CFG.order.length) {
    const rank = new Map(CFG.order.map((k, i) => [k, i]))
    const keys = Object.keys(out)
    keys.sort((a, b) => {
      const ra = rank.has(a) ? rank.get(a) : Infinity
      const rb = rank.has(b) ? rank.get(b) : Infinity
      return ra - rb
    })
    const sorted = {}
    for (const k of keys) sorted[k] = out[k]
    return sorted
  }
  return out
}

export { LIB }

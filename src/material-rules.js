/**
 * 物料「名称 + 型号规格」书写/录入规则引擎（基本版 v1）。
 *
 * 规则全部来自 src/config/material-rules.json，改配置即可调整，无需改代码。
 * 分两级：
 *   error —— 硬错误，阻断保存（项目号混入、占位词、全角、无字母数字等）
 *   warn  —— 提示，允许保存，但给出规范写法建议（同名异写、单位大小写、名称含材质等）
 *
 * 依据（本库 22459 条实测）：
 *   - 61.4% 规格归一化后会变化（书写噪声普遍）
 *   - 528 个一物多号簇 100% 为纯字面差异：47.7% 仅规格写法不同、52.3% 仅名称不同
 * 因此本规则的重点不是「写得好不好看」，而是「同一实物只允许一种写法」。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fullwidthToHalf } from './spec.js'
import { getCategory, chooseTokens, MAP } from './classify.js'
import { extractParams } from './struct-spec.js'
import { suggestName } from './name-synonyms.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RULE_FILE = path.join(ROOT, 'src', 'config', 'material-rules.json')

let cached = null
let cachedMtime = 0
export function rules() {
  try {
    const mt = fs.statSync(RULE_FILE).mtimeMs
    if (!cached || mt !== cachedMtime) {
      cached = JSON.parse(fs.readFileSync(RULE_FILE, 'utf8'))
      cachedMtime = mt
    }
  } catch (e) {
    if (!cached) throw new Error('无法读取 material-rules.json：' + e.message)
  }
  return cached
}

const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// 只把「全角字母数字与运算符」视为需要半角化；
// 中文标点（：；！？，。、（））属正常书写，附件描述里大量出现，不应报错
const hasFullWidth = (s) => /[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\u3000／＼－＋＊＝％＆＠＃．｜～＜＞]/.test(s)
// 中文没有 \b，用分隔符/首尾做词边界，避免「无」误命中「无锡」
const wordBound = (w) => new RegExp('(?:^|[\\s+*/·\\-,()、，。])' + esc(w) + '(?:$|[\\s+*/·\\-,()、，。])')
const num = (o, k, d) => (o && o[k] != null && !Number.isNaN(Number(o[k])) ? Number(o[k]) : d)

// ---------------- 名称 ↔ 小类 一致性 ----------------
// 用字符二元组衡量名称与小类标准名的相似度：中文名称短，二元组比 token 稳；
// 「断路器」与「三相电抗器」共享 0 个二元组，「电抗器」与「三相电抗器」共享 2 个。
function bigramsOf(s) {
  const t = String(s == null ? '' : s).replace(/\s+/g, '')
  const m = new Map()
  if (!t) return m
  if (t.length === 1) { m.set(t, 1); return m }
  for (let i = 0; i < t.length - 1; i++) {
    const g = t.slice(i, i + 2)
    m.set(g, (m.get(g) || 0) + 1)
  }
  return m
}

function diceOf(ga, gb) {
  let ta = 0
  let tb = 0
  for (const n of ga.values()) ta += n
  for (const n of gb.values()) tb += n
  if (!ta || !tb) return 0
  let inter = 0
  for (const [g, n] of ga) {
    const m = gb.get(g)
    if (m) inter += Math.min(n, m)
  }
  return (2 * inter) / (ta + tb)
}

// 模块加载时把小类名称的二元组算好，避免每次按键校验都重算 200 多次
const SUB_GRAMS = Object.entries(MAP).map(([sub, it]) => ({
  sub,
  subName: it.subName || '',
  midName: it.midName || '',
  grams: bigramsOf(it.subName || ''),
}))

/**
 * 名称与所选小类是否明显不符（如小类「三相电抗器」却把名称写成「断路器」）。
 *
 * 三个条件同时满足才判定，尽量避免误伤同族简称：
 *   1) 与当前小类标准名相似度 < minCurrent（默认 0.4）
 *   2) 另有小类相似度 >= minBest（默认 0.6）
 *   3) 两者差距 >= minGap（默认 0.25）
 *
 * 例：三相电抗器 + 断路器   → 当前 0，最佳「微型断路器」0.67 → 判定不符
 *    三相电抗器 + 电抗器   → 当前 0.67                     → 不判定（同族简称）
 *
 * @returns {null | {name, current, best, candidates, msg}}
 */
export function detectSubMismatch(rawName, sub) {
  const R = (rules().name || {}).subMismatch || {}
  if (R.enabled === false) return null
  const name = String(rawName == null ? '' : rawName).trim()
  if (!name || !sub) return null
  const info = getCategory(sub)
  if (!info || !info.subName) return null

  const gq = bigramsOf(name)
  if (!gq.size) return null
  const curScore = diceOf(gq, bigramsOf(info.subName))
  if (curScore >= num(R, 'minCurrent', 0.4)) return null

  // 短标准名兜底：像「端子」这种 1 个二元组的标准名，Dice 会被长名字稀释，
  // 导致「端子标记号」这类明显同族的写法漏判。名称以其它小类标准名开头时直接命中。
  const pref = SUB_GRAMS
    .filter((x) => x.sub !== sub && x.subName && x.subName.length >= 2
      && name.indexOf(x.subName) === 0
      && name.indexOf(info.subName) !== 0)   // 当前小类名本身就是前缀时不判（避免误伤自身）
    .sort((a, b) => b.subName.length - a.subName.length)[0]
  if (pref) {
    const cand0 = { sub: pref.sub, subName: pref.subName, midName: pref.midName, score: 1 }
    return {
      name,
      current: { sub, subName: info.subName, score: +curScore.toFixed(3) },
      best: cand0,
      candidates: [cand0],
      msg: `名称「${name}」与所选小类「${info.subName}」不匹配，更像 ${pref.sub} ${pref.subName}，请确认小类是否选错`,
    }
  }

  const ranked = SUB_GRAMS
    .filter((x) => x.sub !== sub && x.subName)
    .map((x) => ({ sub: x.sub, subName: x.subName, midName: x.midName, score: diceOf(gq, x.grams) }))
    .sort((a, b) => b.score - a.score)
  const best = ranked[0]
  if (!best) return null
  if (best.score < num(R, 'minBest', 0.6)) return null
  if (best.score - curScore < num(R, 'minGap', 0.25)) return null

  // 同分候选一起列出：断路器会同时命中「微型断路器/漏电断路器/塑壳断路器」
  const cands = ranked.filter((x) => x.score >= best.score - 0.05).slice(0, 3)
  const list = cands.map((x) => `${x.sub} ${x.subName}`).join(' / ')
  return {
    name,
    current: { sub, subName: info.subName, score: +curScore.toFixed(3) },
    best: { ...best, score: +best.score.toFixed(3) },
    candidates: cands.map((x) => ({ ...x, score: +x.score.toFixed(3) })),
    msg: `名称「${name}」与所选小类「${info.subName}」不匹配，更像 ${list}，请确认小类是否选错`,
  }
}

/**
 * 规范写法建议：只做可机械统一的处理，保留原有的语义与大小写结构
 * 半角化 → 多空格合并 → 乘号统一 * → 括号半角 → 单位大小写 → 数值与单位去空格
 */
export function suggestSpec(raw) {
  const R = rules().spec
  let s = fullwidthToHalf(String(raw == null ? '' : raw))
  s = s.replace(/[\u3000]/g, ' ')
  s = s.replace(/\s+/g, ' ').trim()
  if (!s) return ''
  // 乘号：数字之间的 x/X/× → *
  s = s.replace(/(\d)\s*[×xX]\s*(?=\d)/g, '$1*')
  s = s.replace(/[×✕✖]/g, '*')
  s = s.replace(/[－—–]/g, '-') // 全角/长横线统一半角连接符
  // 单位大小写（按配置逐项替换，前面不能紧邻字母，避免破坏型号）
  for (const [k, v] of Object.entries(R.unitCase || {})) {
    s = s.replace(new RegExp('(^|[^A-Za-z])' + esc(k) + '(?![A-Za-z])', 'g'), (m, p1) => p1 + v)
  }
  // 数值与「已知单位」之间不留空格：25 A → 25A、1.5 mm² → 1.5mm²
  // 只认单位白名单，避免把 "6*80 S2026005"、"NXB-63 C16" 这类参数分隔也吞掉
  const UNITS = 'kV|kVA|kW|kA|mA|VA|kHz|MHz|Hz|mm²|mm2|mm|kg|ms|μF|uF|nF|pF|MΩ|KΩ|Ω|V|A|W|F|H|s'
  s = s.replace(new RegExp('(\\d)\\s+(?=(?:' + UNITS + ')(?![A-Za-z]))', 'g'), '$1')
  // 运算符两侧不留空格
  s = s.replace(/\s*([+*/])\s*/g, '$1')
  return s.trim()
}

/**
 * 校验型号规格
 * @param {string} raw 规格原文
 * @param {string} [sub] 小类编码（6 位），给出时额外校验该小类关键参数是否命中
 */
export function checkSpec(raw, sub) {
  const R = rules().spec
  const errors = []
  const warnings = []
  const s = String(raw == null ? '' : raw).trim()
  const sug = suggestSpec(s)
  // 空格体检用原文：s 已 trim，首尾空格到这一步就看不到了
  const fmt = fixSpecFormat(raw)

  if (!s) {
    errors.push('型号规格不能为空')
    return { ok: false, errors, warnings, suggestion: '', specFormat: null }
  }
  if (s.length < (R.minLen || 2)) errors.push(`型号规格过短（至少 ${R.minLen || 2} 个字符）`)
  if (s.length > (R.maxLen || 64)) errors.push(`型号规格过长（最多 ${R.maxLen || 64} 个字符）`)
  if (R.halfWidthOnly && hasFullWidth(s)) errors.push(R.halfWidthMsg || '请使用半角字符')
  // 用规范写法判断是否含字母数字：纯全角输入半角化后是合法的，不应重复报错
  if (R.requireAlnum && !/[A-Za-z0-9]/.test(sug || s)) errors.push(R.requireAlnumMsg || '规格必须包含字母或数字')
  for (const p of R.forbidPatterns || []) {
    if (new RegExp(p.re).test(s)) errors.push(p.msg)
  }
  for (const w of R.forbidWords || []) {
    if (wordBound(w).test(s)) {
      errors.push((R.forbidWordMsg || '规格不能写占位内容').replace('{w}', w))
      break
    }
  }
  // 只把「数字之间的 x/X/×」当乘号；型号里的 X 不算（NXB-63、NSX100F、CJX4 曾全部误报）
  const mult = (R.multiplyChars || []).filter((c) => new RegExp('\\d\\s*' + esc(c) + '\\s*(?=\\d)').test(s))
  if (mult.length) warnings.push(R.multiplyMsg || '乘号统一用 *')
  // 规格里允许中文括号（附件描述常用），由 bracketToHalf 控制是否提示
  const cnBracket = /[（）]/.test(s)
  if (R.bracketToHalf && cnBracket) warnings.push('括号请使用半角 ()')
  // 空格：首尾只能从原文看出来（s 已 trim），中间连续空格/非常规空白沿用原提示
  if (fmt && fmt.reasons.includes('首尾有空格')) {
    warnings.push('规格首尾有多余空格，建议去除')
  }
  if (fmt && (fmt.reasons.includes('中间有连续空格') ||
              fmt.reasons.includes('含制表符或全角空格'))) {
    warnings.push('规格里有连续空格，请用单个空格分隔参数')
  }
  // 说明性提示（乘号/括号/空格）已在上面分别给出；
  // 完整写法统一由 specFormat.fixed 承载（见下方 return），这里不再 push「规范写法」，
  // 否则会与「建议改为」重复显示同一段内容。

  // 该小类关键参数至少命中 N 个，否则无法与相似物料区分
  if (sub) {
    try {
      const tokens = chooseTokens(getCategory(sub)) || []
      if (tokens.length) {
        const params = extractParams(s, tokens) || {}
        const hit = Object.values(params).filter((v) => v != null && String(v).trim() !== '').length
        const need = Number(R.requireParamHit) || 1
        if (hit < need) {
          warnings.push((R.requireParamMsg || '关键参数未识别').replace('{tokens}', tokens.slice(0, 6).join('/')))
        }
      }
    } catch (e) { /* 分类信息缺失时跳过参数校验 */ }
  }

  // 「建议改为」必须给完整规范写法：
  // 原来的 fixSpecFormat 只去空格，用户照着改完乘号/括号仍是错的，还得再改一次。
  // 这里直接用 suggestSpec 的结果，一次点到位（空格 + 乘号 + 括号 + 单位 + 全角统一处理）。
  const rawS = String(raw == null ? '' : raw)
  const fmtFinal = (sug && sug !== rawS)
    ? {
        raw: rawS,
        fixed: sug,
        reasons: (fmt && fmt.reasons && fmt.reasons.length) ? fmt.reasons.slice() : ['存在不规范写法'],
      }
    : fmt
  return { ok: errors.length === 0, errors, warnings, suggestion: sug, specFormat: fmtFinal }
}

/**
 * 名称格式体检：首尾空格、中间空格、分隔符
 *
 * 这些字符删掉不会改变语义，所以直接给出可一键采用（且可自动采用）的修正值。
 * 括号不在此列 —— 括号里的内容往往有意义（如「柜体（宽*高*深）」），需要人工移到规格。
 *
 * @returns {null | {raw:string, fixed:string, reasons:string[]}}
 */
export function fixNameFormat(raw) {
  const R = rules().name
  const s = String(raw == null ? '' : raw)
  if (!s) return null
  const reasons = []
  let fixed = s

  if (fixed !== fixed.trim()) {
    reasons.push('首尾有空格')
    fixed = fixed.trim()
  }
  // 中间空格：\s 已覆盖全角空格 U+3000 与不间断空格
  if (/\s/.test(fixed)) {
    reasons.push('中间有空格')
    fixed = fixed.replace(/\s+/g, '')
  }
  // 分隔符：全部删掉（空白类已在上面处理，这里跳过）
  const strip = (R.stripChars || []).filter((c) => !/\s/.test(c) && fixed.includes(c))
  if (strip.length) {
    reasons.push('含分隔符 ' + strip.join(' '))
    for (const c of strip) fixed = fixed.split(c).join('')
  }
  if (!reasons.length || fixed === s) return null
  return { raw: s, fixed, reasons: [...new Set(reasons)] }
}

/**
 * 规格格式体检：首尾空格、连续空格、非常规空白
 *
 * 与 fixNameFormat 对称，但**只处理空白** —— 乘号（×/x/X → *）属于语义改写，
 * 待确认「数字之间的 x 是否都是乘号」（如 LAY3x2 的 x 是乘号还是型号分隔符）后再决定，
 * 暂不纳入自动修正，见 README「待决事项」。
 *
 * 这些空白去掉/合并不会改变语义，所以直接给出可一键采用（且可自动采用）的修正值。
 * 覆盖 U+3000 全角空格与 Tab：二者既会被 halfWidthOnly 判为全角，也会让签名算错。
 *
 * @returns {null | {raw:string, fixed:string, reasons:string[]}}
 */
export function fixSpecFormat(raw) {
  const s = String(raw == null ? '' : raw)
  if (!s) return null
  const reasons = []
  let fixed = s

  if (fixed !== fixed.trim()) {
    reasons.push('首尾有空格')
    fixed = fixed.trim()
  }
  // 非普通空格的空白（Tab / 换行 / 全角空格 U+3000 / 不间断空格）统一成半角空格
  if (/[^\S ]/.test(fixed)) {
    reasons.push('含制表符或全角空格')
    fixed = fixed.replace(/[^\S ]/g, ' ')
  }
  if (/ {2,}/.test(fixed)) {
    reasons.push('中间有连续空格')
    fixed = fixed.replace(/ {2,}/g, ' ')
  }
  if (!reasons.length || fixed === s) return null
  return { raw: s, fixed, reasons: [...new Set(reasons)] }
}

/**
 * 名称格式修正的最终结果：先修格式，再顺带过一遍同义词
 * 目的是一次点到位，避免「空气 开关」先改成「空气开关」、再点一次才成「微型断路器」。
 * 底部提示与输入框浮层共用这一份结果，保证两处口径一致。
 * @returns {null | {raw:string, fixed:string, final:string, reasons:string[]}}
 */
export function resolveNameFix(raw, sub, opts = {}) {
  const fmt = fixNameFormat(raw)
  if (!fmt) return null
  const after = suggestName(fmt.fixed, sub, opts)
  const final = (after && after.exact) ? after.std : fmt.fixed
  const reasons = [...fmt.reasons]
  if (final !== fmt.fixed) reasons.push('并统一叫法')
  return { raw: fmt.raw, fixed: fmt.fixed, final, reasons }
}

/**
 * 名称里的「型号 / 参数」识别 —— 仅用于「提示标准写法」，不阻断、不自动改写任何字段。
 *
 * 场景：新增物料时人习惯直接敲「TRVV电缆」「24V电源模块」「10芯电缆」，
 * 我们只提示「建议名称用标准写法「电缆」，型号/参数请写进规格」，改不改、怎么改由用户决定。
 *
 * 判定方式：按「字母数字串」切 token 再分类（比堆正则稳，型号往往是整串）：
 *   - 含数字的 token（ACS880/RS485/DB9/M20/2P/24V/120KW/10）→ 型号/参数
 *   - 纯字母 token：长度 >= minLetterModelLen 且不在 allowAbbr → 型号（TRVV/SITOP/COMBICON）
 *                    在 allowAbbr 或 <=2 字母 → 视为通用缩写（PE端子/AI模块/UPS电源），不算型号
 *   - 数字 token 紧跟单位（芯/路/位/V/A/KW/P/型…）时，单位一并作为提示片段（10芯 而不是 10）
 * 白名单：allowNames 整名放行（IGBT / UPS电源 / PLC模块 本身即实物名）。
 *
 * @returns {null | {hits:string[], core:string, moved:string[], msg:string, level:'warning'}}
 */
export function detectNameModel(raw) {
  const R = rules().name
  const G = R.modelGuard || {}
  if (G.enabled === false) return null
  const s = String(raw == null ? '' : raw).trim()
  if (!s) return null

  if ((G.allowNames || []).some((x) => String(x).toUpperCase() === s.toUpperCase())) return null

  const abbr = new Set((G.allowAbbr || []).map((x) => String(x).toUpperCase()))
  const units = (G.unitSuffixes || []).map((x) => String(x).toUpperCase()).sort((a, b) => b.length - a.length)
  const minLetter = Number(G.minLetterModelLen || 3)

  const moved = []
  let core = s
  // 匹配连续字母数字串（型号通常是一个整串，含 . - _ 的也整体算一个）
  const tokenRe = /[A-Za-z0-9][A-Za-z0-9._-]*/g
  let m
  while ((m = tokenRe.exec(s))) {
    const tok = m[0]
    const hasDigit = /\d/.test(tok)
    const isAbbr = !hasDigit && abbr.has(tok.toUpperCase())
    const isModel = hasDigit || (!isAbbr && tok.length >= minLetter)
    if (!isModel) continue
    let piece = tok
    // 数字 token 后面紧跟单位 → 单位一起作为提示片段（10芯 / 8路 / 24V）
    if (/^\d+(\.\d+)?$/.test(tok)) {
      const rest = s.slice(m.index + tok.length)
      const u = units.find((x) => rest.toUpperCase().startsWith(x))
      if (u) piece = tok + rest.slice(0, u.length)
    }
    moved.push(piece)
    core = core.split(piece).join('')
  }
  if (!moved.length) return null

  core = core.replace(/[\s\-_、,，;；|·.。:：()（）]+/g, '').trim()
  // 剥离后没有实物名（整名就是型号）→ 不给「建议名称」，只提示"写实物名"，
  // 避免出现「建议写法（实物名）」这类占位文案
  const msg = core
    ? String(G.hintMsg || '名称建议用标准写法「{core}」；型号/参数（{moved}）请写进规格')
      .replace('{core}', core)
      .replace('{moved}', moved.join(' '))
    : String(G.hintMsgNoCore || '名称里不要写型号/参数（{moved}），请补上实物名、把型号写进规格')
      .replace('{moved}', moved.join(' '))
  return { hits: moved, core: core.length >= 2 ? core : '', moved, msg, level: 'warning' }
}

/** 校验物料名称 */
export function checkName(raw, spec, sub, opts = {}) {
  const R = rules().name
  const errors = []
  const warnings = []
  const s = String(raw == null ? '' : raw).trim()

  if (!s) {
    errors.push('物料名称不能为空')
    return { ok: false, errors, warnings, nameSynonym: null, nameFormat: null, subMismatch: null }
  }
  if (s.length < (R.minLen || 2)) errors.push(`名称过短（至少 ${R.minLen || 2} 个字）`)
  if (s.length > (R.maxLen || 24)) errors.push(`名称过长（最多 ${R.maxLen || 24} 个字），细节请写进规格`)
  // 全角字母/数字：名称以中文为主，全角多由输入法误切产生，存库后按半角检索不到
  // 复用规格的 halfWidthOnly 开关，保持两端同口径；hasFullWidth 不含汉字与中文括号，不会误伤
  if (rules().spec.halfWidthOnly && hasFullWidth(s)) {
    errors.push('名称不能包含全角字母/数字（会导致同物不同码，按半角 ABC 搜不到这条）')
  }

  for (const p of R.forbidPatterns || []) {
    if (new RegExp(p.re).test(s)) errors.push(p.msg)
  }
  const badChars = (R.forbidChars || []).filter((c) => s.includes(c))
  if (badChars.length) errors.push(`名称不能包含 ${badChars.join(' ')}（这些是规格符号，请写入规格）`)

  if (spec && String(spec).trim()) {
    const a = s.toLowerCase().replace(/\s+/g, '')
    const b = String(spec).trim().toLowerCase().replace(/\s+/g, '')
    if (a === b) errors.push(rules().material?.nameEqualsSpecMsg || '名称与规格不能完全相同')
  }

  // 名称含型号/参数：只提示标准写法（warning，允许保存），不阻断、不自动改写
  const nameModel = detectNameModel(s)
  if (nameModel) warnings.push(nameModel.msg)
  else if (R.warnIfContainsDigit && /\d/.test(s)) warnings.push(R.digitMsg || '名称里不要写数字参数')
  const warnChars = (R.warnChars || []).filter((c) => s.includes(c))
  if (warnChars.length) warnings.push(R.warnCharMsg || '名称里不要加括号等附加说明')
  const mat = (R.materialWords || []).filter((w) => s.includes(w))
  if (mat.length) warnings.push((R.materialMsg || '材质/表面处理请写入规格') + `（检测到：${mat.join('、')}）`)
  const brand = (R.brandWords || []).filter((w) => s.includes(w))
  if (brand.length) warnings.push((R.brandMsg || '品牌请写入品牌字段') + `（检测到：${brand.join('、')}）`)

  // 同义词规范化：字典见 src/config/name-synonyms.json（可在「系统设置」页维护）
  // 只提示不阻断 —— 真正的重复新增由保存链路的「同小类+同规格」409 拦截。
  // 注意：这里只通过 nameSynonym 结构化字段返回，不写入 warnings，
  // 因为该提示由名称输入框的浮层即时展示，写进 warnings 会在表单底部重复出现。
  const syn = suggestName(s, sub, opts)
  // 名称格式：空格/分隔符（可自动修正），输入框浮层里给一键修正，这里同步给文字提醒
  const nameFormat = resolveNameFix(raw, sub, opts)
  if (nameFormat) {
    const why = nameFormat.reasons.filter((r) => r !== '并统一叫法').join('、')
    warnings.push(`名称里有空格/分隔符（${why}），建议改为「${nameFormat.final}」`)
  }

  // 名称 ↔ 小类一致性：先在本小类内做同义词归一，再比标准名，
  // 避免「空气开关 → 微型断路器」这种正确写法被误判成类别不符。
  const canonical = (syn && syn.exact && syn.std) ? syn.std : s
  const subMismatch = detectSubMismatch(canonical, sub)
  if (subMismatch) {
    // 两档处理：名称与别的小类标准名几乎完全一致（>= blockBest）才硬阻断；
    // 其余仅提示 —— 交界情况（熔芯座/熔座、插头座/接插件）不该挡人录入。
    const conf = R.subMismatch || {}
    const lv = subMismatch.best.score >= num(conf, 'blockBest', 0.9)
      ? 'error'
      : (conf.level || 'warn')
    subMismatch.level = lv
    if (lv === 'error') errors.push(subMismatch.msg)
    else warnings.push(subMismatch.msg)
  }

  return {
    ok: errors.length === 0, errors, warnings, nameSynonym: syn || null, nameFormat,
    nameModel: nameModel || null, subMismatch,
  }
}

/**
 * 物料整体校验（保存前调用）
 * @param {{name:string, spec:string, sub?:string}} m
 */
export function checkMaterial(m = {}) {
  const n = checkName(m.name, m.spec, m.sub, { knownCount: m.knownCount })
  const sp = checkSpec(m.spec, m.sub)
  const errors = [...n.errors, ...sp.errors]
  const warnings = [...n.warnings, ...sp.warnings]
  const syn = n.nameSynonym || null
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    // 名称同义词建议（结构化，供前端渲染「采纳」按钮）：
    //   exact=true  → std 为整体改名后的名称
    //   exact=false → std 为片段替换后的完整名称，stdName 为标准叫法本身
    nameSynonym: syn,
    // 名称格式体检（空格/分隔符），供浮层给一键修正
    nameFormat: n.nameFormat || null,
    // 规格格式体检（空格），供浮层给一键修正 / 保存前自动应用
    specFormat: sp.specFormat || null,
    // 名称含型号/参数：仅提示标准写法（含建议实物名 core 与型号片段 moved），不改写任何字段
    nameModel: n.nameModel || null,
    // 名称与所选小类不符（疑似选错小类），结构化返回供前端提示候选类别
    subMismatch: n.subMismatch || null,
    suggestion: {
      name: syn && syn.exact ? syn.std : '',
      spec: sp.suggestion && sp.suggestion !== String(m.spec || '').trim() ? sp.suggestion : '',
    },
    rulesVersion: rules().meta?.version || '',
  }
}

export default { rules, checkName, checkSpec, checkMaterial, suggestSpec, fixNameFormat, fixSpecFormat, resolveNameFix, detectNameModel, detectSubMismatch }

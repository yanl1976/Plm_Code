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
import { getCategory, chooseTokens } from './classify.js'
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
const hasFullWidth = (s) => /[\uFF01-\uFF5E\u3000]/.test(s)
// 中文没有 \b，用分隔符/首尾做词边界，避免「无」误命中「无锡」
const wordBound = (w) => new RegExp('(?:^|[\\s+*/·\\-,()、，。])' + esc(w) + '(?:$|[\\s+*/·\\-,()、，。])')

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

  if (!s) {
    errors.push('型号规格不能为空')
    return { ok: false, errors, warnings, suggestion: '' }
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
  if (/[（）]/.test(s)) warnings.push('括号请使用半角 ()')
  if (/[\s]{2,}/.test(s)) warnings.push('规格里有连续空格，请用单个空格分隔参数')
  if (sug && sug !== s) warnings.push('规范写法：' + sug)

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

  return { ok: errors.length === 0, errors, warnings, suggestion: sug }
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
    return { ok: false, errors, warnings, nameSynonym: null, nameFormat: null }
  }
  if (s.length < (R.minLen || 2)) errors.push(`名称过短（至少 ${R.minLen || 2} 个字）`)
  if (s.length > (R.maxLen || 24)) errors.push(`名称过长（最多 ${R.maxLen || 24} 个字），细节请写进规格`)

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

  return { ok: errors.length === 0, errors, warnings, nameSynonym: syn || null, nameFormat, nameModel: nameModel || null }
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
    // 名称含型号/参数：仅提示标准写法（含建议实物名 core 与型号片段 moved），不改写任何字段
    nameModel: n.nameModel || null,
    suggestion: {
      name: syn && syn.exact ? syn.std : '',
      spec: sp.suggestion && sp.suggestion !== String(m.spec || '').trim() ? sp.suggestion : '',
    },
    rulesVersion: rules().meta?.version || '',
  }
}

export default { rules, checkName, checkSpec, checkMaterial, suggestSpec, fixNameFormat, resolveNameFix, detectNameModel }

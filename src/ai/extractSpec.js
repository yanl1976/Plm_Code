// 抽取提示词 + 调用 + JSON 归一 + 证据校验。规则先跑，LLM 仅补缺项。
import { callChat } from './client.js'

const SYS = '你是一名电气物料型号规格结构化抽取专家。你只做抽取，不做推断。'

const SCHEMA_ECHO = '<参数名>'

// 平衡括号取最后一个完整 {} 对象（MiniMax 会在 JSON 前塞 <think> 思考链）
export function stripJson(s) {
  if (!s) return null
  s = s.replace(/<\/?think>/gi, '')
  let depth = 0, start = -1, end = -1
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') { if (depth === 0) start = i; depth++ }
    else if (s[i] === '}') { depth--; if (depth === 0 && start >= 0) { end = i; break } }
  }
  if (start >= 0 && end > start) { try { return JSON.parse(s.slice(start, end + 1)) } catch { /* fallthrough */ } }
  const f = s.indexOf('{'), l = s.lastIndexOf('}')
  if (f >= 0 && l > f) { try { return JSON.parse(s.slice(f, l + 1)) } catch { return null } }
  return null
}

// 仅接受有可靠佐证（evidence 子串确实出现在原文）的填空 → 天然防反推
export function validateEvidence(params, evidence, spec) {
  const fills = {}
  const rejected = []
  for (const [k, v] of Object.entries(params || {})) {
    if (v == null || v === 'null' || v === '') continue
    const ev = evidence?.[k]
    if (!ev || !spec.includes(String(ev))) { rejected.push(k); continue }
    fills[k] = { value: String(v).trim(), evidence: String(ev).trim() }
  }
  return { fills, rejected }
}

export function isSchemaEcho(parsed) {
  if (!parsed || !parsed.params) return true
  const keys = Object.keys(parsed.params)
  return keys.includes(SCHEMA_ECHO) || keys.some((k) => String(parsed.params[k]).includes('<值>'))
}

export async function aiFillGaps(spec, subName, tokens, missingTokens, opts = {}) {
  const allTokens = tokens.join('、')
  const miss = (missingTokens && missingTokens.length) ? missingTokens.join('、') : '（无）'
  const user = `物料中类：${subName}
需要抽取的参数白名单（只能输出这些键）：
${allTokens}

其中规格原文【未提供】、需要你尝试补出的参数为：
${miss}

规格原文：<<<SPEC_BEGIN>>>${spec}<<<SPEC_END>>>

要求：
1. 仅抽取规格原文【显式写出】的参数值；原文未写出的参数值一律写 null。
2. 严禁反推/推断：不得从型号代号推导额定电流、分断能力、壳架电流等未显式写出的量。
3. 每个有值的参数必须提供 evidence：原文中支撑该值的连续子串（逐字）；无依据则值必须为 null。
4. 只输出一个 JSON 对象，不要 Markdown 围栏、不要任何前后缀：
{"params":{"<参数名>":"<值>|null"},"evidence":{"<参数名>":"<原文子串>"}}
输出：`
  const messages = [
    { role: 'system', content: SYS },
    { role: 'user', content: user },
  ]
  let r = await callChat(messages, opts)
  let parsed = stripJson(r.content)
  // MiniMax 偶发回显占位符模板 → 强化重试一次
  if (!parsed || isSchemaEcho(parsed)) {
    const reinforced = user + '\n\n注意：上一次你返回了 <参数名>/<值> 这样的占位符模板，这是错误的。请直接给出真实参数值，禁止输出任何占位符。'
    r = await callChat([{ role: 'system', content: SYS }, { role: 'user', content: reinforced }], opts)
    parsed = stripJson(r.content)
  }
  if (!parsed || isSchemaEcho(parsed)) return { ok: false, reason: 'schema-echo/解析失败', raw: r.content }
  const allowed = new Set(missingTokens)
  const pass = {}
  for (const [k, v] of Object.entries(parsed.params || {})) if (allowed.has(k)) pass[k] = v
  const { fills, rejected } = validateEvidence(pass, parsed.evidence, spec)
  return { ok: true, fills, rejected, raw: r.content }
}

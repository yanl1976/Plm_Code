// PoC：用 MiniMax（cloud 档案）对若干中类的物料规格做结构化抽取，与规则引擎基线对比。
// 仅本地脚本，不并入正式流程。验证点：①是否严格按 tokens 白名单输出；②是否不反推；
// ③分断能力/频率等卡点能否给出带 evidence 的合理值或 null；④是否可稳定返回 JSON。
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { getCategory, chooseTokens } from '../src/classify.js'
import { extractParams } from '../src/struct-spec.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: path.join(ROOT, '.env') })

const URL = process.env.MINIMAX_API_URL
const KEY = process.env.MINIMAX_API_KEY
const MODEL = process.env.TOKENHUB_MODEL || 'MiniMax-M2.5-highspeed'

if (!URL || !KEY) { console.error('缺少 MINIMAX_API_URL / MINIMAX_API_KEY'); process.exit(1) }

function stripJson(s) {
  if (!s) return null
  s = s.replace(/<\/?think>/gi, '') // 去掉 MiniMax 思考链
  // 取最后一个完整 {} 块（模型常把 JSON 放在末尾）
  let depth = 0, start = -1, end = -1
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '{') { if (depth === 0) start = i; depth++ }
    else if (s[i] === '}') { depth--; if (depth === 0 && start >= 0) { end = i; break } }
  }
  if (start >= 0 && end > start) {
    try { return JSON.parse(s.slice(start, end + 1)) } catch { /* fallthrough */ }
  }
  const f = s.indexOf('{'), l = s.lastIndexOf('}')
  if (f >= 0 && l > f) { try { return JSON.parse(s.slice(f, l + 1)) } catch { return null } }
  return null
}

async function callLLM(spec, subName, tokens) {
  const sys = '你是一名电气物料型号规格结构化抽取专家。你只做抽取，不做推断。'
  const user = `物料中类：${subName}
需要抽取的参数白名单（只能输出这些键，未显式写出的置 null）：
${tokens.join('、')}

规格原文：<<<SPEC_BEGIN>>>${spec}<<<SPEC_END>>>

要求：
1. 仅抽取规格原文【显式写出】的参数值；原文未写出的参数值一律写 null。
2. 严禁反推/推断：不得从型号代号推导额定电流、分断能力、壳架电流等未显式写出的量（例如 NSX400N 的 400 不能当作额定电流；iC65N 的 N 不能当作分断能力；LC1D09 的 09 不能当作额定电流）。
3. 每个有值的参数必须提供 evidence：原文中支撑该值的连续子串（逐字，可含前后少量字符）；无依据则值必须为 null。
4. 只输出一个 JSON 对象，不要 Markdown 围栏、不要任何前后缀：
{"params":{"<参数名>":"<值>|null"},"evidence":{"<参数名>":"<原文子串>"}}
输出：`
  const body = {
    model: MODEL,
    messages: [{ role: 'system', content: sys }, { role: 'user', content: user }],
    temperature: 0,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  }
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) { const t = await res.text(); throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`) }
  const j = await res.json()
  const content = j?.choices?.[0]?.message?.content || ''
  return { raw: content, parsed: stripJson(content) }
}

// 选样：每类中类取 5 条非空规格
const targets = ['微型断路器', '交流接触器', '电缆', '电流互感器']
const rows = fs.readFileSync(path.join(ROOT, 'data/materials.ndjson'), 'utf8')
  .split('\n').filter(Boolean).map((l) => JSON.parse(l))
const picked = []
for (const kw of targets) {
  let cnt = 0
  for (const r of rows) {
    const i = getCategory(r.SUBPREFIX)
    const s = (r.FSPECIFICATION || '').trim()
    if (i && (i.subName || '').includes(kw) && s.length >= 6) {
      picked.push({ kw, f: r.FNUMBER, spec: s, info: i })
      if (++cnt >= 5) break
    }
  }
}

console.log(`模型: ${MODEL} | 测试样本: ${picked.length} 条\n`)
let ok = 0, bad = 0
for (const p of picked) {
  const tokens = chooseTokens(p.info)
  const rule = extractParams(p.spec, tokens)
  let llm = null, err = null
  try { const r = await callLLM(p.spec, p.info.subName || p.kw, tokens); llm = r.parsed; if (!llm) err = 'JSON解析失败: ' + r.raw.slice(0, 120) }
  catch (e) { err = e.message }
  console.log(`【${p.kw}】${p.f}\n  规格: ${p.spec}\n  tokens[${tokens.length}]: ${tokens.join('/')}\n  规则: ${JSON.stringify(rule)}`)
  if (err) { console.log(`  ⚠ LLM错误: ${err}`); bad++; }
  else {
    const params = llm.params || {}
    const ev = llm.evidence || {}
    // evidence 校验：有值但 evidence 不在原文 → 标记可疑(反推风险)
    const suspect = Object.entries(params).filter(([k, v]) => v && v !== 'null' && !(ev[k] && p.spec.includes(String(ev[k]))))
    console.log(`  LLM : ${JSON.stringify(params)}`)
    console.log(`  EVID: ${JSON.stringify(ev)}`)
    if (suspect.length) console.log(`  ⚠ 反推风险(无可靠evidence): ${suspect.map(([k]) => k).join(',')}`)
    ok++
  }
  console.log('')
}
console.log(`\n汇总: 成功解析 ${ok} / 失败 ${bad}`)

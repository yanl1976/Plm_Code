// ai-extract 命令：规则先行，LLM 仅补「缺项」token，证据校验防反推，结果烘焙到 data/ai-overlay.json。
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { inspectRow } from '../validate.js'
import { aiFillGaps } from './extractSpec.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DATA = path.join(ROOT, 'data')

function mapLimit(items, limit, fn) {
  const ret = new Array(items.length)
  let i = 0
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (i < items.length) { const idx = i++; ret[idx] = await fn(items[idx], idx) }
  })
  return Promise.all(workers).then(() => ret)
}

export async function runAiExtract(opts = {}) {
  const cats = (opts.cats || '断路器,电缆').split(',').map((s) => s.trim()).filter(Boolean)
  const limit = opts.limit || 60
  const profile = opts.profile || 'cloud'
  const concurrency = opts.concurrency || 4

  const rows = fs.readFileSync(path.join(DATA, 'materials.ndjson'), 'utf8')
    .split('\n').filter(Boolean).map((l) => JSON.parse(l))

  const picked = []
  for (const r of rows) {
    const ins = inspectRow(r)
    const hay = [ins.subName, ''].join(' ')
    if (cats.some((c) => hay.includes(c)) || (ins.subName && cats.some((c) => ins.subName.includes(c)))) {
      picked.push(r)
      if (picked.length >= limit) break
    }
  }
  console.log(`范围: ${cats.join('/')} | 选取物料: ${picked.length} | 模型档案: ${profile} | 并发: ${concurrency}`)

  let done = 0
  const total = picked.length
  const results = await mapLimit(picked, concurrency, async (r) => {
    const ins = inspectRow(r)
    const missing = ins.missing || []
    const base = { fNumber: r.FNUMBER, subName: ins.subName, spec: r.FSPECIFICATION || '', tokens: ins.tokens, ruleParams: ins.params, missing }
    if (!missing.length) return { ...base, skipped: true }
    let llm = null, error = null
    try { llm = await aiFillGaps(r.FSPECIFICATION || '', ins.subName, ins.tokens, missing, { profile }) }
    catch (e) { error = e.message }
    done++
    if (done % 25 === 0) console.error(`进度 ${done}/${total} (成功 ${(done)} 处理中)`)
    return { ...base, llm, error }
  })

  // 聚合
  let withGap = 0, calls = 0, ok = 0, failed = 0, schemaEcho = 0, gapsBefore = 0, gapsFilled = 0
  const byCat = {}
  const detailed = []
  const overlay = []
  const samples = []
  for (const it of results) {
    if (it.skipped) continue
    const c = it.subName || '未知'
    byCat[c] = byCat[c] || { total: 0, calls: 0, filled: 0, before: 0 }
    byCat[c].total++
    gapsBefore += it.missing.length
    byCat[c].before += it.missing.length
    if (it.error || !it.llm || !it.llm.ok) {
      failed++
      if (it.llm && !it.llm.ok) schemaEcho++
      detailed.push({ ...it, fills: {}, rejected: [] })
      continue
    }
    calls++; ok++
    byCat[c].calls++
    const fills = it.llm.fills || {}
    const fillTokens = Object.keys(fills)
    gapsFilled += fillTokens.length
    byCat[c].filled += fillTokens.length
    const merged = { ...it.ruleParams }
    for (const t of fillTokens) merged[t] = fills[t].value
    overlay.push({ fNumber: it.fNumber, merged })
    detailed.push({ fNumber: it.fNumber, subName: it.subName, spec: it.spec, ruleParams: it.ruleParams, missing: it.missing, fills, rejected: it.llm.rejected, merged })
    if (samples.length < 12) samples.push({ spec: it.spec, subName: it.subName, missing: it.missing, fills })
  }

  // 写盘
  fs.writeFileSync(path.join(DATA, 'ai-extract.json'), JSON.stringify(detailed, null, 2))
  if (!opts.dry) fs.writeFileSync(path.join(DATA, 'ai-overlay.json'), JSON.stringify(overlay, null, 2))

  // 报告
  console.log(`\n=== 增益报告（规则优先 + LLM 补缺项）===`)
  console.log(`有缺项的物料: ${withGap = results.filter((r) => !r.skipped).length} 条`)
  console.log(`LLM 调用: ${calls} 成功 / ${failed} 失败(含 schema-echo ${schemaEcho})`)
  console.log(`缺项总数(规则空): ${gapsBefore} → LLM 补回: ${gapsFilled} (填充率 ${gapsBefore ? Math.round(gapsFilled / gapsBefore * 100) : 0}%)`)
  console.log(`\n分中类:`)
  for (const [c, s] of Object.entries(byCat)) console.log(`  ${c}: 物料${s.total} 缺项${s.before} → 补回${s.filled} (${s.before ? Math.round(s.filled / s.before * 100) : 0}%)`)
  console.log(`\n抽样(规格 | 缺项→补回):`)
  for (const s of samples) {
    const fillStr = Object.entries(s.fills).map(([k, v]) => `${k}=${v.value}`).join(', ') || '—'
    console.log(`  [${s.subName}] ${s.spec}\n    缺:${s.missing.join('/')} → 补:${fillStr}`)
  }
  console.log(`\n明细已写 data/ai-extract.json；${opts.dry ? '(dry 未写回灌)' : '回灌已写 data/ai-overlay.json'}`)
  if (!opts.dry) console.log(`烘焙到正式流程：重跑 \`npm run dedup\` 与前端（server.js）时置 AI_EXTRACT=1 即可叠加，默认关闭不扰动基线。`)
  return { gapsBefore, gapsFilled, calls, failed }
}

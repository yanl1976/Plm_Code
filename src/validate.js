/**
 * 特征参数提取「校验模块」——对应《AI开发标准模板》的归一化/校验层思想：
 *  - 规则输出一律不可信：每条提取值都过格式契约（类型/形状/边界），违规进缺陷清单；
 *  - 契约版本化：黄金样例 extract-cases.json + spec-fields.json version 双版本；
 *  - 校验永不抛错：任何异常记入 dropped，返回部分可用结果 + 诊断清单；
 *  - 新旧规则对比：与上一版规则快照（data/rules-prev/）双跑 diff；无快照时与结果基线
 *    （data/extract-baseline.json）diff；首次运行建立基线。
 * 四段报告（golden / defects / coverage / oldVsNew）落盘 data/extract-validation.json。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractParams, LIB, decodeSemantics } from './struct-spec.js'
import { getCategory, chooseTokens } from './classify.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CASES_PATH = path.join(ROOT, 'src/config/extract-cases.json')
const RULES_PATH = path.join(ROOT, 'src/config/spec-fields.json')
const BASELINE_PATH = path.join(ROOT, 'data/extract-baseline.json')
const PREV_RULES_PATH = path.join(ROOT, 'data/rules-prev/spec-fields.json')

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

/* ---------- 1. 黄金样例（提取契约断言） ---------- */

export function runGoldenCases(lib = LIB) {
  let cases = []
  try { cases = readJson(CASES_PATH).cases || [] } catch (e) {
    return { total: 0, passed: 0, failed: 1, failures: [{ name: '_cases_load', error: String(e) }] }
  }
  const failures = []
  let passed = 0
  for (const c of cases) {
    const problems = []
    let params = {}
    try { params = extractParams(c.spec, c.tokens, lib) } catch (e) { problems.push(`提取抛错: ${e}`) }
    for (const [k, want] of Object.entries(c.expect || {})) {
      const got = params[k] === undefined ? '<未请求token>' : params[k]
      if (got !== want) problems.push(`${k}: 期望 ${JSON.stringify(want)} 实得 ${JSON.stringify(got)}`)
    }
    for (const k of c.expectEmpty || []) {
      if (!(k in (c.expect || {})) && (params[k] || '') !== '') problems.push(`${k}: 期望为空 实得 ${JSON.stringify(params[k])}`)
    }
    if (problems.length) failures.push({ name: c.name, spec: c.spec, problems })
    else passed++
  }
  return { total: cases.length, passed, failed: failures.length, failures }
}

/* ---------- 2. 格式契约（缺陷扫描） ---------- */

// 每个参数的取值形状契约：返回 null=通过，字符串=违规说明
const FORMAT_CONTRACT = {
  '额定电压': (v) => /\d/.test(v) ? null : '电压值不含数字（疑似裸AC/DC/单位）',
  '线圈电压': (v) => /\d/.test(v) ? null : '电压值不含数字',
  '额定电流': (v) => /\d/.test(v) ? null : '电流值不含数字',
  '分断能力': (v) => /\d/.test(v) ? null : '分断能力值不含数字',
  '截面':     (v) => /^[\d.]+(?:mm²|mm)?(?:\+[\d.]+(?:mm²|mm)?)*$/i.test(v) ? null : '截面应为 数字(可带mm²/mm，多芯用+连接)',
  '芯数':     (v) => /^[\d.]+(\+[\d.]+)*$/.test(v) ? null : '芯数应为 数字(用+连接多芯)',
  '功率':     (v) => /^[0-9./]+[kK]?[Ww](\/[0-9./]+[kK]?[Ww])*$/.test(v) ? null : '功率应为 数字(+/数字)+W/kW（含 / 连接的多段功率，如电阻箱 460kW/10kW/5kW）',
  '阻值':     (v) => /(Ω|OHM|K|M)$/i.test(v) ? null : '阻值应以 Ω/K/M/OHM 结尾',
  '容值':     (v) => /[Fupnm]F$|F$/i.test(v) ? null : '容值应以 F 族单位结尾',
  '电感量':   (v) => /(μH|uH|UH|mH|MH|H)$/i.test(v) ? null : '电感量应以 H 族单位结尾',
  '精度':     (v) => /(级|%|±|\d\.\dS?|\dP\d+|[Ⅰ-Ⅲ])/.test(v) ? null : '精度应为 级/%/±/CT精度(0.2S/5P20/Ⅰ) 形态',
  '直径':     (v) => /^[\d.]+(?:[\/-][\d.]+)*$/.test(v) ? null : '直径应为 纯数字(允许/或-表示内外径)',
  '间距':     (v) => /^[\d.]+(?:[\/-][\d.]+)*$/.test(v) ? null : '间距应为 纯数字(允许/或-表示间距范围)',
  '位数':     (v) => /^\d+$/.test(v) ? null : '位数应为 纯数字',
  '电抗率':   (v) => /%$/.test(v) ? null : '电抗率应以 % 结尾',
  '长度':     (v) => /(mm|cm|米)$/i.test(v) ? null : '长度应以 mm/cm/米 结尾',
  '型号': (v, spec) => {
    if (!/^[A-Za-z0-9][A-Za-z0-9./\-]*$/.test(v) || !/[A-Za-z]/.test(v)) return '型号形态异常（含非法字符/无字母）'
    if (v.length >= 2) return null
    // 单字母：规格中 X型/X类 形态视为形状型号（L型母排/T型/U型卡），放行
    const c = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(c + '[型类]').test(spec) ? null : '单字母型号且无「型/类」佐证（疑似品牌前缀/变量），需人工核查'
  },
}
const LEADING_BOUNDARY = /^[\s\-+/（(，、；;：:·）)]/u

// 完整性覆盖率：语义段原文位置 + 参数值回查原文，合并覆盖区间，返回未被覆盖的字母数字片段
const COV_UNIT_SUF = ['mm²', 'mm', 'kA', 'kW', 'OHM', 'KΩ', 'MΩ', 'Ω', 'μF', 'nF', 'pF', 'mF', 'uF', 'KV', 'kV', '芯', '位', '级', 'V', 'A', 'W', 'K', '%']
// 片段是否算「参数遗漏」：ASCII 字母数字须占非空白字符的一半以上（中文描述性文字不算）
function isGappy(frag) {
  const ascii = (frag.match(/[A-Za-z0-9]/g) || []).length
  const body = frag.replace(/\s/g, '')
  return ascii > 0 && ascii >= body.length * 0.5
}
function semCoverageGaps(spec, feats, params) {
  const s = String(spec || '')
  if (!s) return []
  const lower = s.toLowerCase()
  const ranges = []
  for (const f of feats || []) if (f.src) ranges.push([f.src.at, f.src.at + f.src.text.length])
  for (const v of Object.values(params || {})) {
    if (!v) continue
    for (const part of String(v).split(/[/+]/)) {
      let cand = part.trim()
      if (!cand) continue
      let i = lower.indexOf(cand.toLowerCase())
      if (i < 0) {
        const up = cand.toUpperCase()
        for (const suf of COV_UNIT_SUF) {
          if (up.endsWith(suf.toUpperCase()) && cand.length > suf.length) {
            const core = cand.slice(0, cand.length - suf.length)
            i = lower.indexOf(core.toLowerCase())
            if (i >= 0) cand = core
            break
          }
        }
      }
      {
        let idx = -1
        for (;;) {
          idx = lower.indexOf(cand.toLowerCase(), idx + 1)
          if (idx < 0) break
          ranges.push([idx, idx + cand.length])
        }
      }
    }
  }
  ranges.sort((a, b) => a[0] - b[0])
  const gaps = []
  let pos = 0
  for (const [st, en] of ranges) {
    if (st > pos) {
      const frag = s.slice(pos, st)
      const f2 = frag.replace(/(In|Ie|Ue|Icu|Ics)\\s*[=:]/gi, '').trim(); if (isGappy(f2)) gaps.push(f2)
    }
    pos = Math.max(pos, en)
  }
  if (pos < s.length) {
    const frag = s.slice(pos)
    if (/[A-Za-z0-9]/.test(frag)) gaps.push(frag.trim())
  }
  const values = new Set((feats || []).map((f) => String(f.value)))
  const gaps2 = gaps.filter((g) => !values.has(g)).filter((g) => !/^[AVWK]$/.test(g))
  return [...new Set(gaps2.map((g) => g.replace(/^[\s\-+/，,、;；]+|[\s\-+/]+$/g, '')).filter(Boolean))]
}

// 单条物料检验：提取参数 + 缺项清单 + 契约违规清单（命令行全量校验与前端「物料特征」视图共用，保证同一口径）
// errors=硬缺陷（阻断级）；warns=待人工核查（型号首词启发式等，不阻断）——与 scanCorpus 的 error/warn 分级一致
export function inspectRow(rec) {
  const info = getCategory(rec.SUBPREFIX)
  const tokens = chooseTokens(info)
  const spec = rec.FSPECIFICATION || ''
  const out = {
    subName: info ? (info.subName || info.midName || info.bigName || '') : '',
    tokens, params: {}, missing: [], errors: [], warns: [],
  }
  if (!tokens.length) return out
  try { out.params = extractParams(spec, tokens) }
  catch (e) { out.errors.push({ param: '_extract', value: '', reason: `抛错:${e.message}` }) }
  try { out.sem = decodeSemantics(spec) } catch { out.sem = null } // 品牌编码语义（对照生产商编码表）
  // 完整性校验（仅对已解码品牌物料）：原文↔参数双向对账
  //   遗漏 = 原文中未被任何参数覆盖的字母数字片段（semGaps）；多余/篡改 = 参数值无法在原文中定位（前端 ⚠）
  if (out.sem) {
    try { out.semGaps = semCoverageGaps(spec, out.sem.features, out.params) }
    catch { out.semGaps = [] }
  }
  for (const t of tokens) {
    const v = out.params[t] || ''
    if (!v) { out.missing.push(t); continue } // 策略期望但原文未提供 → 缺项（信息性，非错误）
    const common = LEADING_BOUNDARY.test(v) ? '值以分隔符/空白起始' : (/\s$/.test(v) ? '值以空白结尾' : null)
    const fmt = FORMAT_CONTRACT[t] ? FORMAT_CONTRACT[t](v, spec) : null
    if (common || fmt) {
      const entry = { param: t, value: v, reason: [common, fmt].filter(Boolean).join('；') }
      if (t === '型号') out.warns.push(entry)
      else out.errors.push(entry)
    }
  }
  return out
}

// 全量扫描：返回 { errors, warns, coverage }
export function scanCorpus(rows) {
  const errors = []
  const warns = []
  const cov = new Map() // subName|token -> {total, hit}
  const semGapRows = []
  for (const rec of rows) {
    const ins = inspectRow(rec)
    for (const e of ins.errors) errors.push({ fnumber: rec.FNUMBER, spec: (rec.FSPECIFICATION || '').slice(0, 60), ...e })
    for (const w of ins.warns) warns.push({ fnumber: rec.FNUMBER, spec: (rec.FSPECIFICATION || '').slice(0, 60), ...w })
    if (ins.semGaps?.length && semGapRows.length < 20) semGapRows.push({ fnumber: rec.FNUMBER, spec: (rec.FSPECIFICATION || '').slice(0, 60), gaps: ins.semGaps })
    if (!ins.tokens.length) continue
    const spec = rec.FSPECIFICATION || ''
    for (const t of ins.tokens) {
      const stat = cov.get(`${ins.subName}|${t}`) || { total: 0, hit: 0 }
      if (spec.trim()) {
        stat.total++
        if ((ins.params[t] || '') !== '') stat.hit++
      }
      cov.set(`${ins.subName}|${t}`, stat)
    }
  }
  // 覆盖率缺失清单：该小类非空规格物料中某参数命中率 < 30% 且样本 >= 20 → 疑似系统性漏提取
  const coverage = []
  for (const [key, s] of cov) {
    if (s.total >= 20 && s.hit / s.total < 0.3) {
      const [subName, token] = key.split('|')
      coverage.push({ subName, token, total: s.total, hit: s.hit, coverage: +(s.hit / s.total).toFixed(3) })
    }
  }
  coverage.sort((a, b) => a.coverage - b.coverage)
  return { errors, warns, coverage: coverage.slice(0, 30), coverageAll: cov.size, semGapRows }
}

/* ---------- 3. 新旧对比 ---------- */

function loadMaterials() {
  const p = path.join(ROOT, 'data/materials.ndjson')
  if (!fs.existsSync(p)) throw new Error('未找到 data/materials.ndjson，请先 npm run extract')
  return fs.readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
}

// 与旧规则双跑：按 (物料×参数) 级 diff。返回 { changed, added, lost, samples }
function diffByRules(rows, prevLib) {
  let changed = 0, added = 0, lost = 0
  const samples = { changed: [], added: [], lost: [] }
  for (const rec of rows) {
    const info = getCategory(rec.SUBPREFIX)
    const tokens = chooseTokens(info)
    if (!tokens.length) continue
    const spec = rec.FSPECIFICATION || ''
    const cur = extractParams(spec, tokens)
    const old = extractParams(spec, tokens, prevLib)
    for (const t of tokens) {
      const a = old[t] || '', b = cur[t] || ''
      if (a === b) continue
      const s = { fnumber: rec.FNUMBER, spec: spec.slice(0, 60), param: t, old: a, new: b }
      if (a && b) { changed++; if (samples.changed.length < 30) samples.changed.push(s) }
      else if (!a && b) { added++; if (samples.added.length < 30) samples.added.push(s) }
      else { lost++; if (samples.lost.length < 30) samples.lost.push(s) }
    }
  }
  return { changed, added, lost, samples }
}

// 与结果基线 diff（规则快照缺失时的降级路径）
function diffByBaseline(rows) {
  const base = readJson(BASELINE_PATH)
  const oldMap = base.items || {}
  let changed = 0, added = 0, lost = 0
  const samples = { changed: [], added: [], lost: [] }
  const curMap = {}
  for (const rec of rows) {
    const info = getCategory(rec.SUBPREFIX)
    const tokens = chooseTokens(info)
    if (!tokens.length) continue
    const spec = rec.FSPECIFICATION || ''
    curMap[rec.FNUMBER] = extractParams(spec, tokens)
  }
  const keys = new Set([...Object.keys(oldMap), ...Object.keys(curMap)])
  for (const k of keys) {
    const a = oldMap[k], b = curMap[k]
    const aj = JSON.stringify(a), bj = JSON.stringify(b)
    if (aj === bj) continue
    if (a && b) { changed++; if (samples.changed.length < 30) samples.changed.push({ fnumber: k, old: a, new: b }) }
    else if (!a && b) { added++; if (samples.added.length < 30) samples.added.push({ fnumber: k, new: b }) }
    else { lost++; if (samples.lost.length < 30) samples.lost.push({ fnumber: k, old: a }) }
  }
  return { mode: 'baseline', baselineVersion: base.ruleVersion, baselineAt: base.savedAt, changed, added, lost, samples }
}

/* ---------- 4. 编排：runValidation（永不抛错） ---------- */

export async function runValidation({ accept = false } = {}) {
  const report = { generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19), dropped: [] }
  const step = (name, fn) => {
    try { return fn() } catch (e) { report.dropped.push(`${name}: ${e.message}`); return null }
  }

  let ruleVersion = 'unknown'
  step('读规则版本', () => { ruleVersion = readJson(RULES_PATH).version || 'unknown' })
  report.ruleVersion = ruleVersion
  let semVersion = 'unknown'
  step('读语义表版本', () => { semVersion = readJson(path.join(ROOT, 'src/config/model-semantics.json')).version || 'unknown' })
  report.semVersion = semVersion

  // ① 黄金样例
  report.golden = step('黄金样例', () => runGoldenCases()) || { total: 0, passed: 0, failed: 0, failures: [] }

  // ②③④ 全量扫描 + 新旧对比（共用一次物料加载）
  const rows = step('加载物料', () => loadMaterials()) || []
  report.materials = rows.length

  report.defects = step('缺陷扫描', () => {
    const { errors, warns, coverage, semGapRows } = scanCorpus(rows)
    return {
      error: errors.length, warn: warns.length,
      samples: errors.slice(0, 50), warnSamples: warns.slice(0, 20),
      coverageMissing: coverage,
      semGapRows,
    }
  }) || { error: 0, warn: 0, samples: [], warnSamples: [], coverageMissing: [] }

  report.oldVsNew = step('新旧对比', () => {
    if (fs.existsSync(PREV_RULES_PATH)) {
      const prevLib = readJson(PREV_RULES_PATH).library || {}
      const d = diffByRules(rows, prevLib)
      return { mode: 'rules', prevVersion: readJson(PREV_RULES_PATH).version || 'unknown', ...d, note: 'rules 模式仅对比 spec-fields.json；语义表/代码层变更请对照 extract-baseline 核查' }
    }
    if (fs.existsSync(BASELINE_PATH)) return diffByBaseline(rows)
    return { mode: 'first-run', note: '首次运行：本次结果将作为基线，请用 --accept 固化' }
  }) || { mode: 'error' }

  report.pass = report.golden.failed === 0 && report.defects.error === 0 && report.dropped.length === 0

  step('写报告', () => { fs.writeFileSync(path.join(ROOT, 'data/extract-validation.json'), JSON.stringify(report, null, 2)) })

  // ⑤ 固化：更新基线 + 快照当前规则为「旧规则」
  if (accept) {
    step('固化基线', () => {
      const items = {}
      for (const rec of rows) {
        const info = getCategory(rec.SUBPREFIX)
        const tokens = chooseTokens(info)
        if (!tokens.length) continue
        items[rec.FNUMBER] = extractParams(rec.FSPECIFICATION || '', tokens)
      }
      fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true })
      fs.writeFileSync(BASELINE_PATH, JSON.stringify({ ruleVersion, savedAt: report.generatedAt, items }))
      fs.mkdirSync(path.dirname(PREV_RULES_PATH), { recursive: true })
      fs.copyFileSync(RULES_PATH, PREV_RULES_PATH)
    })
  }

  // 控制台摘要
  console.log('=== 特征参数提取校验 ===')
  console.log(`规则版本: ${report.ruleVersion} | 物料: ${report.materials}`)
  console.log(`① 黄金样例: ${report.golden.passed}/${report.golden.total} 通过`)
  for (const f of (report.golden.failures || []).slice(0, 10))
    console.log(`   ✗ [${f.name}] ${f.spec}\n     ${f.problems.join(' | ')}`)
  console.log(`② 格式契约缺陷: error=${report.defects.error} warn=${report.defects.warn}`)
  for (const s of (report.defects.samples || []).slice(0, 10))
    console.log(`   ✗ ${s.fnumber} | ${s.spec} -> ${s.param}=${JSON.stringify(s.value)} (${s.reason})`)
  const sg = report.defects.semGapRows || []
  console.log(`③ 覆盖率缺失(疑似系统性漏提取): ${report.defects.coverageMissing.length} 项；品牌物料完整性遗漏(原文片段未被参数覆盖): ${sg.length} 条${sg.length ? '（明细见报告 semGapRows）' : ''}`)
  for (const c of report.defects.coverageMissing.slice(0, 10))
    console.log(`   ! ${c.subName} × ${c.token}: ${c.hit}/${c.total} (${Math.round(c.coverage * 100)}%)`)
  const o = report.oldVsNew
  if (o.mode === 'first-run') console.log(`④ 新旧对比: 首次运行，--accept 固化基线`)
  else console.log(`④ 新旧对比(${o.mode}, 旧版=${o.prevVersion || o.baselineVersion || '?'}): 变更${o.changed} 新增${o.added} 丢失${o.lost}`)
  console.log(`结论: ${report.pass ? 'PASS' : 'FAIL'}${accept ? '（已固化基线+规则快照）' : ''} | 报告: data/extract-validation.json`)
  if (report.dropped.length) console.log('dropped:', report.dropped)
  return report
}

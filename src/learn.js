/**
 * 自学习编排：把「校验对比」发现的差异聚合成可外查的待学习清单，并把确认后的定义写回规则表。
 *
 * 闭环：validate 发现差异（semGaps 原文未覆盖 / 缺项 / 覆盖率低 / 无品牌语义）
 *        → learn 聚合成清单 + 生成外网检索词（data/learn-todo.json）
 *        → 外网检索确认含义
 *        → learn --apply <plan.json> 写回 src/config/model-semantics.json（版本自增、写入前校验 JSON）
 *        → validate 复验差异是否收敛
 *
 * 原则：只写回「有据可查」的定义；未确认的一律留在清单里继续查，绝不臆造。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getCategory, chooseTokens } from './classify.js'
import { inspectRow } from './validate.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SEM_PATH = path.join(ROOT, 'src/config/model-semantics.json')
const TODO_PATH = path.join(ROOT, 'data/learn-todo.json')

// ---------- ① 差异采集：把校验发现的未知项聚合成清单 ----------
export function collectUnknowns() {
  const file = path.join(ROOT, 'data/materials.ndjson')
  if (!fs.existsSync(file)) throw new Error('未找到 data/materials.ndjson')
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))

  const gapMap = new Map()      // 原文未覆盖片段
  const missMap = new Map()     // 小类×参数 缺项
  const noSemMap = new Map()    // 无品牌语义的型号前缀（待识别品牌/系列）
  const covMap = new Map()      // 小类×参数 覆盖率

  for (const rec of rows) {
    const info = getCategory(rec.SUBPREFIX)
    const tokens = chooseTokens(info)
    const spec = (rec.FSPECIFICATION || '').trim()
    const ins = inspectRow(rec)
    const subName = ins.subName || ''

    for (const g of ins.semGaps || []) {
      const key = String(g).trim().toUpperCase()
      if (!key || key.length > 24) continue
      const e = gapMap.get(key) || { count: 0, samples: [], brands: new Set() }
      e.count++
      if (e.samples.length < 3) e.samples.push(spec)
      if (ins.sem?.brand) e.brands.add(ins.sem.brand)
      gapMap.set(key, e)
    }
    for (const m of ins.missing || []) {
      if (!spec) continue
      const k = `${subName}|${m}`
      const e = missMap.get(k) || { count: 0, samples: [] }
      e.count++
      if (e.samples.length < 3) e.samples.push(spec)
      missMap.set(k, e)
    }
    if (!ins.sem && spec) {
      const m = spec.match(/^\s*([A-Za-z][A-Za-z0-9.\-]{1,12})/)
      const k = m ? m[1].toUpperCase() : `(${subName || '其他'})`
      const e = noSemMap.get(k) || { count: 0, samples: [], sub: new Set() }
      e.count++
      if (e.samples.length < 3) e.samples.push(spec)
      e.sub.add(subName)
      noSemMap.set(k, e)
    }
    for (const t of tokens) {
      if (!spec) continue
      const k = `${subName}|${t}`
      const e = covMap.get(k) || { total: 0, hit: 0 }
      e.total++
      if ((ins.params[t] || '') !== '') e.hit++
      covMap.set(k, e)
    }
  }

  const mk = (type, key, e, extra = {}) => ({
    type, key, count: e.count,
    samples: e.samples,
    ...(e.brands ? { brands: [...e.brands] } : {}),
    ...(e.sub ? { subNames: [...e.sub] } : {}),
    ...extra,
  })

  const gaps = [...gapMap.entries()].map(([k, v]) => mk('gap', k, v))
    .sort((a, b) => b.count - a.count)
  const missing = [...missMap.entries()].map(([k, v]) => mk('missing', k, v))
    .sort((a, b) => b.count - a.count)
  const noSem = [...noSemMap.entries()].map(([k, v]) => mk('noBrand', k, v))
    .sort((a, b) => b.count - a.count)
  const coverage = [...covMap.entries()].map(([k, v]) => {
    const [subName, token] = k.split('|')
    return { type: 'coverage', key: k, subName, token, total: v.total, hit: v.hit, rate: +(v.hit / Math.max(1, v.total)).toFixed(3) }
  }).filter((x) => x.total >= 20 && x.rate < 0.3).sort((a, b) => a.rate - b.rate)

  return { gaps, missing, noBrand: noSem, coverage }
}

// ---------- ② 检索词生成 ----------
export function buildQueries(inv, topN = 20) {
  const items = []
  const pick = (arr, n) => arr.slice(0, n)
  for (const g of pick(inv.gaps, topN)) {
    const b = (g.brands || [])[0] || ''
    items.push({
      id: `gap:${g.key}`, type: 'gap', key: g.key, count: g.count, samples: g.samples, brand: b,
      queries: [
        `${b} ${g.key} 含义 型号 命名`.trim(),
        `电气 型号 ${g.key} 代表什么`,
        `${g.samples[0] || ''} 型号含义`,
      ].filter(Boolean),
    })
  }
  for (const m of pick(inv.missing, Math.ceil(topN / 2))) {
    const [subName, token] = m.key.split('|')
    items.push({
      id: `missing:${m.key}`, type: 'missing', key: m.key, count: m.count, samples: m.samples,
      queries: [`${subName} 型号规格 如何表示${token}`, `${subName} ${token} 命名规则 样本`],
    })
  }
  for (const n of pick(inv.noBrand, Math.ceil(topN / 2))) {
    items.push({
      id: `brand:${n.key}`, type: 'noBrand', key: n.key, count: n.count, samples: n.samples,
      subNames: n.subNames,
      queries: [`${n.key} 是什么品牌 电气元件 型号命名规则`, `${n.key} 系列 ${(n.subNames || [''])[0]} 厂家`],
    })
  }
  return items
}

// ---------- ③ 写回：把外网确认的定义并入规则表 ----------
export function applyLearned(plan) {
  const sem = JSON.parse(fs.readFileSync(SEM_PATH, 'utf8'))
  let added = 0
  const notes = []
  for (const op of plan.ops || []) {
    if (!op.confirmed) { notes.push(`跳过(未确认): ${op.id || ''}`); continue }
    // 新增解码器（品牌族 或 行业/国标命名规则族）
    if (op.addDecoder) {
      const d = op.addDecoder
      sem.decoders = sem.decoders || []
      if (sem.decoders.some((x) => x.id === d.id)) { notes.push(`跳过(已存在): ${d.id}`); continue }
      sem.decoders.push({ ...d, ...(d.src ? { _src: d.src } : {}) })
      added++
      notes.push(`新增解码器 ${d.id}（${d.brand || '行业/国标规则'}）：${(d.segments || []).map((s) => s.key).join('、')}`)
      continue
    }
    const dec = (sem.decoders || []).find((d) => d.id === op.decoderId)
    if (!dec) { notes.push(`跳过(无此解码器): ${op.decoderId}`); continue }
    if (op.addSegment) {
      dec.segments = dec.segments || []
      const segs = Array.isArray(op.addSegment) ? op.addSegment : [op.addSegment]
      for (const sg of segs) { dec.segments.push(sg); added++; notes.push(`新增段 ${op.decoderId}:${sg.key}`) }
    }
    if (op.addTable) {
      const seg = (dec.segments || []).find((s) => s.key === op.addTable.segKey)
      if (!seg) { notes.push(`跳过(无此段): ${op.decoderId}/${op.addTable.segKey}`); continue }
      seg.table = seg.table || {}
      let n = 0
      for (const [code, def] of Object.entries(op.addTable.entries)) {
        if (seg.table[code]) continue
        seg.table[code] = { value: def.value, meaning: def.meaning, ...(def.src ? { _src: def.src } : {}) }
        n++
      }
      added += n; notes.push(`新增码 ${op.decoderId}/${op.addTable.segKey}: ${n} 条`)
    }
  }
  if (added) {
    const v = String(sem.version || 'v1')
    const num = parseInt(v.replace(/\D/g, ''), 10) || 1
    sem.version = 'v' + (num + 1)
  }
  fs.writeFileSync(SEM_PATH, JSON.stringify(sem, null, 2))
  JSON.parse(fs.readFileSync(SEM_PATH, 'utf8')) // 落盘前自检
  return { added, version: sem.version, notes }
}

// ---------- 编排 ----------
export async function runLearn({ topN = 20, applyFile = '' } = {}) {
  if (applyFile) {
    const plan = JSON.parse(fs.readFileSync(path.resolve(ROOT, applyFile), 'utf8'))
    const r = applyLearned(plan)
    console.log('=== 自学习·写回 ===')
    console.log(`新增条目 ${r.added}，规则表版本 → ${r.version}`)
    r.notes.forEach((n) => console.log('  ' + n))
    return r
  }
  const inv = collectUnknowns()
  const items = buildQueries(inv, topN)
  const out = {
    generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    summary: {
      gapKinds: inv.gaps.length, gapMaterials: inv.gaps.reduce((a, b) => a + b.count, 0),
      noBrandKinds: inv.noBrand.length, noBrandMaterials: inv.noBrand.reduce((a, b) => a + b.count, 0),
      missingKinds: inv.missing.length, lowCoverageKinds: inv.coverage.length,
    },
    items,
    inventory: inv,
  }
  fs.writeFileSync(TODO_PATH, JSON.stringify(out, null, 2))
  console.log('=== 自学习·差异清单 ===')
  console.log(`原文未覆盖片段 ${out.summary.gapKinds} 种（${out.summary.gapMaterials} 条物料）`)
  console.log(`无品牌语义型号前缀 ${out.summary.noBrandKinds} 种（${out.summary.noBrandMaterials} 条物料）`)
  console.log(`缺项(小类×参数) ${out.summary.missingKinds} 种；低覆盖率 ${out.summary.lowCoverageKinds} 种`)
  console.log('\n待外网确认 TOP:')
  for (const it of items.slice(0, 15)) {
    console.log(`  [${it.type}] ${it.key} ×${it.count}  例: ${(it.samples || [])[0] || '-'}`)
    console.log(`      检索: ${it.queries[0]}`)
  }
  console.log(`\n清单已写入: data/learn-todo.json`)
  return out
}

/**
 * 选型库 ↔ 命名范式的字段映射体检
 *
 * 目的：composeSpecByGuide 按范式 specPattern 拼装规格时，
 *       需要把 {字段名} 映射到选型库的实际列名。
 *       本脚本列出每个小类的映射情况，找出会退回 suggestSpec 的缺口。
 *
 * 输出：
 *   ① 每个有选型库的小类：范式字段 vs 选型列名，逐项标出「直接命中/别名命中/缺失」
 *   ② 缺口汇总：哪些小类无法按范式拼装
 *   ③ 可直接粘贴到 naming-guide.json 的 selectMap 建议
 *
 * 用法：node scripts/analyze-select-map.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GUIDE = path.join(ROOT, 'src', 'config', 'naming-guide.json')
const SERIES_DIR = path.join(ROOT, 'data', 'selection', 'series')

// 别名表与 plm-server.js 共用同一份配置，避免两处维护
const ALIAS_FILE = path.join(ROOT, 'src', 'config', 'select-field-alias.json')
function loadAlias() {
  try {
    const j = JSON.parse(fs.readFileSync(ALIAS_FILE, 'utf8'))
    return j.alias || {}
  } catch (e) {
    return {}
  }
}
const ALIAS = loadAlias()

function loadGuide() {
  try { return JSON.parse(fs.readFileSync(GUIDE, 'utf8')) } catch (e) { return { subs: {} } }
}

/** 收集选型库所有小类的列名（多个 series 取并集） */
function loadSelectColumns() {
  const out = new Map()   // sub → { cols:Set, series:[], files:[] }
  if (!fs.existsSync(SERIES_DIR)) return out
  for (const sub of fs.readdirSync(SERIES_DIR)) {
    if (sub.startsWith('.') || !/^\d{6}$/.test(sub)) continue   // 跳过 .history 等非小类目录
    const dir = path.join(SERIES_DIR, sub)
    let st
    try { st = fs.statSync(dir) } catch (e) { continue }
    if (!st.isDirectory()) continue
    const rec = { cols: new Set(), series: [], files: [] }
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.json')) continue
      const full = path.join(dir, f)
      let j
      try { j = JSON.parse(fs.readFileSync(full, 'utf8')) } catch (e) { continue }
      for (const s of (j.series || [])) {
        rec.series.push(s.id || f)
        rec.files.push(f)
        for (const c of (s.columns || [])) {
          const k = String(c.key || '').trim()
          if (k) rec.cols.add(k)
        }
        // 没有 columns 定义时，用首行键名兜底
        if (!(s.columns || []).length && Array.isArray(s.rows) && s.rows.length) {
          for (const k of Object.keys(s.rows[0])) rec.cols.add(k)
        }
      }
    }
    if (rec.cols.size) out.set(sub, rec)
  }
  return out
}

function fieldsOf(pattern) {
  const out = []
  const re = /\{([^}]+)\}/g
  let m
  while ((m = re.exec(String(pattern || '')))) out.push(String(m[1]).trim())
  return out
}

function main() {
  const guide = loadGuide()
  const subs = guide.subs || {}
  const selects = loadSelectColumns()

  console.log('='.repeat(70))
  console.log('选型库 ↔ 命名范式 字段映射体检')
  console.log('='.repeat(70))
  console.log(`范式库小类：${Object.keys(subs).length}`)
  console.log(`选型库小类：${selects.size}${selects.size ? '（' + [...selects.keys()].join(', ') + '）' : '（本机无选型数据）'}`)
  console.log('')

  if (!selects.size) {
    console.log('本机没有选型库数据（data/selection/series 为空或不存在）。')
    console.log('请在部署机上执行本脚本，才能看到真实映射缺口。')
    return
  }

  const problems = []
  const ready = []

  for (const [sub, rec] of selects) {
    const g = subs[sub] || {}
    const pattern = String(g.specPattern || '').trim()
    if (!pattern) {
      problems.push({ sub, name: g.subName || '', pattern: '(无)', miss: 1, detail: [], cols: [...rec.cols] })
      continue
    }
    const fs2 = fieldsOf(pattern)
    const detail = []
    let miss = 0
    for (const f of fs2) {
      const mapCfg = (g && g.selectMap) || {}
      if (mapCfg[f] && rec.cols.has(mapCfg[f])) {
        detail.push({ f, via: 'selectMap', col: mapCfg[f] }); continue
      }
      if (rec.cols.has(f)) { detail.push({ f, via: '直接', col: f }); continue }
      const alias = ALIAS[f] || []
      let hit = ''
      for (const a of alias) {
        if (rec.cols.has(a)) { hit = a; break }
      }
      if (hit) { detail.push({ f, via: '别名', col: hit }); continue }
      // 产品名称可回退到「型号」首词
      if (f === '产品名称' && (rec.cols.has('型号') || rec.cols.has('规格型号'))) {
        detail.push({ f, via: '型号首词', col: '型号' }); continue
      }
      detail.push({ f, via: '缺失', col: '' })
      miss++
    }
    const item = { sub, name: g.subName || '', pattern, detail, miss, cols: [...rec.cols] }
    if (miss) problems.push(item); else ready.push(item)
  }

  console.log(`可完整拼装：${ready.length} 个小类`)
  console.log(`存在缺口：${problems.length} 个小类`)
  console.log('')

  if (ready.length) {
    console.log('-' .repeat(70))
    console.log('✅ 可完整拼装（范式字段全部能映射到选型列）')
    console.log('-'.repeat(70))
    for (const r of ready) {
      const viaList = r.detail.map((d) => `${d.f}${d.via === '直接' ? '' : '←' + d.col}`).join(' / ')
      console.log(`  ${r.sub} ${r.name}`)
      console.log(`      ${viaList}`)
    }
    console.log('')
  }

  if (problems.length) {
    console.log('-'.repeat(70))
    console.log('⚠ 存在缺口（缺字段会退回 suggestSpec 机械规范化）')
    console.log('-'.repeat(70))
    for (const p of problems) {
      console.log(`  ${p.sub} ${p.name}   缺 ${p.miss} 个字段`)
      console.log(`      范式：${p.pattern}`)
      for (const d of p.detail) {
        console.log(`      ${d.via === '缺失' ? '✗' : '✓'} ${d.f.padEnd(12)} ${d.via}${d.col && d.col !== d.f ? ' ← ' + d.col : ''}`)
      }
      console.log(`      选型库实际列：${p.cols.join(' / ')}`)
      console.log('')
    }

    // 给出 selectMap 建议
    console.log('-'.repeat(70))
    console.log('建议的 selectMap（粘到 naming-guide.json 对应小类的 selectMap 字段）')
    console.log('-'.repeat(70))
    for (const p of problems) {
      const map = {}
      for (const d of p.detail) {
        if (d.via === '别名' && d.col && d.col !== d.f) map[d.f] = d.col
      }
      if (!Object.keys(map).length) continue
      console.log(`  "${p.sub}": ${JSON.stringify(map)},`)
    }
  }

  console.log('')
  console.log('='.repeat(70))
}

main()

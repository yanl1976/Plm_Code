#!/usr/bin/env node
/**
 * 三方对齐自检（参数库 ↔ 范式库 ↔ tokens）
 *
 * 检查三件事：
 *   ① 每个小类模板里的占位符，都有参数定义（或经 guide-field-map 别名映射到已定义参数）
 *   ② 该参数确实在该小类的 tokens 里（否则 extractParams 不会提取）
 *   ③ 已收录的 accepted 值能通过自己的归一（防止脏值入库）
 *
 * 用途：每补一批参数就跑一次，确认真的对齐了，而不是"定义了但提取不到"。
 *
 * 用法：
 *   node scripts/verify-align.mjs            # 汇总 + 未对齐 Top N
 *   node scripts/verify-align.mjs --sub 1005 # 只看某个中类/小类
 *   node scripts/verify-align.mjs --strict   # 有未对齐项时返回非 0（可用于 CI）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { chooseTokens, getCategory } from '../src/classify.js'
import { normalize } from '../src/param-lib/normalize.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))

const GUIDE = readJson('src/config/naming-guide.json')
const FIELDS = readJson('src/config/spec-fields.json')
const STD = readJson('src/config/param-standard.json')
const MAP = readJson('src/config/classification-map.json')
const ALIAS = readJson('src/config/guide-field-map.json').alias || {}

const LIB = FIELDS.library || {}
const STD_SUBS = Object.keys(STD.subs || {})
const only = (() => {
  const i = process.argv.indexOf('--sub')
  return i > 0 ? String(process.argv[i + 1] || '') : ''
})()
const strict = process.argv.includes('--strict')

const placeholderOf = (sub) => {
  const pat = String(((GUIDE.subs || {})[sub] || {}).specPattern || '')
  return [...pat.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].trim())
}

// 占位符 → 参数名（direct 或 alias）
function resolveParam(ph) {
  if (LIB[ph]) return ph
  const a = ALIAS[ph]
  if (a && LIB[a]) return a
  return ''
}

const rows = {
  missingDef: [],      // ① 占位符无参数定义
  missingToken: [],    // ② 有定义但小类 tokens 里没有
  badValue: [],        // ③ accepted 值归一失败
  ok: [],
}

const subs = STD_SUBS.filter((s) => (only ? s.startsWith(only) : true)).sort()

for (const sub of subs) {
  const info = getCategory(sub) || {}
  const subName = (STD.subs[sub] || {}).subName || info.subName || ''
  const tokens = chooseTokens(info)
  const phs = placeholderOf(sub)
  const segOk = { total: phs.length, usable: 0 }

  for (const ph of phs) {
    const param = resolveParam(ph)
    if (!param) {
      rows.missingDef.push({ sub, subName, ph })
      continue
    }
    segOk.usable++
    if (!tokens.includes(param)) {
      rows.missingToken.push({ sub, subName, ph, param })
    }
  }

  // ③ accepted 值归一检查
  for (const [name, d] of Object.entries((STD.subs[sub] || {}).params || {})) {
    if (d.type === 'free') continue
    for (const v of d.accepted || []) {
      if (!v.count) continue            // 序列补充项，跳过
      const nv = normalize(name, String(v.value))
      if (nv == null) rows.badValue.push({ sub, subName, param: name, value: v.value })
    }
  }

  if (!rows.missingDef.some((x) => x.sub === sub) && !rows.missingToken.some((x) => x.sub === sub)) {
    rows.ok.push({ sub, subName, total: segOk.total })
  }
}

// —— 输出 ——
const totalSubs = subs.length
const fullOk = rows.ok.length
console.log('=== 三方对齐自检 ===')
console.log('  检查小类:', totalSubs, only ? '（过滤: ' + only + '）' : '')
console.log('  完全对齐:', fullOk, '（' + Math.round(fullOk / totalSubs * 100) + '%）')
console.log('  占位符缺定义:', rows.missingDef.length, '处')
console.log('  参数未进 tokens:', rows.missingToken.length, '处')
console.log('  值归一失败:', rows.badValue.length, '处')

const groupBy = (arr, key) => {
  const m = new Map()
  for (const x of arr) {
    const k = key(x)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(x)
  }
  return [...m.entries()].sort((a, b) => b[1].length - a[1].length)
}

if (rows.missingDef.length) {
  console.log('\n--- ① 占位符缺参数定义（按占位符聚合）---')
  for (const [ph, list] of groupBy(rows.missingDef, (x) => x.ph).slice(0, 20)) {
    console.log('  ' + ph.padEnd(14) + list.length + ' 个小类: ' + list.slice(0, 4).map((x) => x.sub + ' ' + x.subName).join(' / '))
  }
}

if (rows.missingToken.length) {
  console.log('\n--- ② 有定义但未进 tokens（跑了也提取不到）---')
  for (const x of rows.missingToken.slice(0, 20)) {
    console.log('  ' + x.sub + ' ' + x.subName.padEnd(12) + x.ph + ' → ' + x.param)
  }
  if (rows.missingToken.length > 20) console.log('  … 共 ' + rows.missingToken.length + ' 处')
}

if (rows.badValue.length) {
  console.log('\n--- ③ accepted 值归一失败 ---')
  for (const x of rows.badValue.slice(0, 15)) {
    console.log('  ' + x.sub + ' ' + x.param + ' = ' + JSON.stringify(x.value))
  }
  if (rows.badValue.length > 15) console.log('  … 共 ' + rows.badValue.length + ' 处')
}

if (fullOk === totalSubs && !rows.badValue.length) {
  console.log('\n结果：✓ 三方完全对齐')
} else {
  console.log('\n结果：✗ 存在未对齐项（见上）')
}
process.exit(strict && (rows.missingDef.length || rows.missingToken.length) ? 1 : 0)

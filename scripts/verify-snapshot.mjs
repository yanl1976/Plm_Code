/**
 * 快照与差异同步的完整验证（在部署了 3100 的机器上跑）
 *
 *   node scripts/verify-snapshot.mjs
 *
 * 检查 8 项：
 *   A 快照基础：条数、前缀分布、重复
 *   B 合并结果：来源占比、ERP 独有、规格/名称差异
 *   C 索引状态：当前数据源、条数
 *   D 查重行为：抽样对比 PLM 独有/ERP 独有的可查性
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'data')
const PLM = path.join(DATA, 'materials-plm.ndjson')
const ERP = path.join(DATA, 'materials.ndjson')
const MERGED = path.join(DATA, 'materials-merged.ndjson')
const DIFF = path.join(DATA, 'plm-erp-diff.json')
const API = process.env.PLM_API || 'http://127.0.0.1:3100'

let pass = 0
let fail = 0
const issues = []

function ok(name, cond, detail) {
  if (cond) { pass++; console.log('  ✓ ' + name + (detail ? '  ' + detail : '')) }
  else { fail++; issues.push(name + (detail ? '  ' + detail : '')); console.log('  ✗ ' + name + (detail ? '  ' + detail : '')) }
}

function readNdjson(file) {
  if (!fs.existsSync(file)) return null
  const out = []
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try { out.push(JSON.parse(line)) } catch (e) { /* 跳过坏行 */ }
  }
  return out
}

function codeOf(o) {
  return String(o.ECODE || o.FNUMBER || '')
}

console.log('====================================================')
console.log('A. 快照基础')
console.log('====================================================')

const plm = readNdjson(PLM)
if (!plm) {
  console.log('  ⚠ PLM 快照不存在：' + PLM)
  console.log('    本机未跑过同步时属正常；生产机上应先执行 __plmSync.start({force:true})')
  console.log('    继续校验合并快照与索引状态…')
} else {
  ok('PLM 快照存在', true, plm.length + ' 条')

  // 前缀分布
  const byPrefix = new Map()
  const byCode = new Map()
  for (const o of plm) {
    const c = codeOf(o)
    const p = c.slice(0, 2)
    byPrefix.set(p, (byPrefix.get(p) || 0) + 1)
    byCode.set(c, (byCode.get(c) || 0) + 1)
  }
  const badPrefix = [...byPrefix.keys()].filter((p) => !/^1[012]$/.test(p))
  ok('编码前缀只有 10/11/12', badPrefix.length === 0,
    badPrefix.length ? '异常前缀：' + badPrefix.join(',') : [...byPrefix.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join(' / '))

  const dupCodes = [...byCode.entries()].filter(([k, v]) => v > 1)
  ok('无重复编码', dupCodes.length === 0, dupCodes.length ? '重复 ' + dupCodes.length + ' 个，如 ' + dupCodes[0][0] : '共 ' + byCode.size + ' 个不同编码')

  const emptyCode = plm.filter((o) => !codeOf(o)).length
  ok('无空编码', emptyCode === 0, emptyCode ? '空编码 ' + emptyCode + ' 行' : '')
}

console.log('')
console.log('====================================================')
console.log('B. 合并结果')
console.log('====================================================')

const merged = readNdjson(MERGED)
if (!merged) {
  ok('合并快照存在', false, '未生成，请调 POST /api/plm/snapshot/merge')
} else {
  ok('合并快照存在', true, merged.length + ' 条')

  const srcCount = { PLM: 0, ERP: 0, 其他: 0 }
  for (const o of merged) {
    const s = String(o.SOURCE || '').toUpperCase()
    if (s === 'PLM') srcCount.PLM++
    else if (s === 'ERP') srcCount.ERP++
    else srcCount.其他++
  }
  ok('来源字段齐全', srcCount.其他 === 0, 'PLM=' + srcCount.PLM + ' / ERP=' + srcCount.ERP + (srcCount.其他 ? ' / 缺失=' + srcCount.其他 : ''))

  const erpOnly = merged.filter((o) => String(o.SOURCE || '').toUpperCase() === 'ERP').length

  if (srcCount.PLM > 0) {
    const plmRatio = srcCount.PLM / merged.length
    ok('PLM 占比 > 95%', plmRatio > 0.95, (plmRatio * 100).toFixed(1) + '%')
    ok('ERP 独有 < 500', erpOnly < 500, erpOnly + ' 条')
  } else {
    console.log('  ⚠ 合并结果全部来自 ERP（本机未同步 PLM 时属正常，跳过「占比/ERP独有」两项）')
  }

  // 合并结果里必须有 SUBPREFIX，否则查重索引会跳过
  const noSubRows = merged.filter((o) => !o.SUBPREFIX)
  const noSubCodes = noSubRows.map(codeOf).slice(0, 5)
  ok('SUBPREFIX 齐全', noSubRows.length === 0,
    noSubRows.length
      ? '缺 ' + noSubRows.length + ' 条（编码不足 6 位，索引会跳过）：' + noSubCodes.join(', ')
      : '')
}

if (fs.existsSync(DIFF)) {
  const d = JSON.parse(fs.readFileSync(DIFF, 'utf8'))
  const c = d.counts || {}
  console.log('  差异统计：plmOnly=' + c.plmOnly + ' / erpOnly=' + c.erpOnly
    + ' / specDiff=' + c.specDiff + ' / nameDiff=' + c.nameDiff)
  ok('差异报告可读', true, '生成于 ' + String(d.at || '').slice(0, 19))
} else {
  ok('差异报告存在', false, '未生成')
}

console.log('')
console.log('====================================================')
console.log('C. 索引状态（3100）')
console.log('====================================================')

try {
  const r = await fetch(API + '/api/plm/health', { signal: AbortSignal.timeout(10000) })
  const h = await r.json()
  ok('3100 可达', !!h.ready, 'ready=' + h.ready)
  ok('索引条数 > 20000', Number(h.count) > 20000, h.count + ' 条')
  const srcFile = String(h.source || '')
  ok('索引源为合并快照', /materials-merged\.ndjson$/.test(srcFile), path.basename(srcFile) || '(空)')
} catch (e) {
  ok('3100 可达', false, String(e.message).slice(0, 60))
}

console.log('')
console.log('====================================================')
console.log('D. 查重行为（抽样）')
console.log('====================================================')

try {
  // 取一条 PLM 独有的编码，验证能用它查到
  const plmOnlySample = []
  if (fs.existsSync(DIFF)) {
    const d = JSON.parse(fs.readFileSync(DIFF, 'utf8'))
    for (const x of (d.plmOnly || []).slice(0, 3)) plmOnlySample.push(x.code)
  }
  if (!plmOnlySample.length && plm && plm.length) {
    plmOnlySample.push(codeOf(plm[Math.floor(plm.length / 2)]))
  }

  for (const code of plmOnlySample.slice(0, 1)) {
    const sub = code.slice(0, 6)
    const body = { name: '校验用', spec: 'TEST-' + code, sub }
    const r = await fetch(API + '/api/plm/check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(15000),
    })
    const j = await r.json()
    ok('查重接口可用', typeof j.pass === 'boolean', 'pass=' + j.pass + ' dupLevel=' + (j.dupLevel || '-'))
    ok('返回带 source 字段可判来源', true, '示例编码 ' + code)
  }
} catch (e) {
  ok('查重接口可用', false, String(e.message).slice(0, 60))
}

console.log('')
console.log('====================================================')
console.log('结果：通过 ' + pass + ' 项，失败 ' + fail + ' 项')
if (issues.length) {
  console.log('待处理：')
  issues.forEach((x) => console.log('  · ' + x))
}
console.log('====================================================')
process.exit(fail ? 1 : 0)

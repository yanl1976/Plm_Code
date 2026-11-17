/**
 * 参数标准库 · 影子数据统计
 *
 * 用途：判断「是否值得正式启用」。读 data/param-shadow-log.ndjson，输出：
 *   · 每条录入的参数填充率、标准率
 *   · 按参数汇总：填充率 / 标准率 / 最常见的非标值
 *   · 按小类汇总：哪些小类的录入最不规范
 *
 * 用法：node scripts/param-shadow-stats.mjs [--top 15]
 */
import fs from 'fs'
import path from 'path'

const FILE = path.join(process.cwd(), 'data', 'param-shadow-log.ndjson')
if (!fs.existsSync(FILE)) {
  console.log('尚无影子日志（data/param-shadow-log.ndjson）。')
  console.log('说明：需开启 param-lib-rules.json 的 enabled=true 且 shadow=true，并产生若干次校验。')
  process.exit(0)
}

const rows = fs.readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => {
  try { return JSON.parse(l) } catch (e) { return null }
}).filter(Boolean)

if (!rows.length) { console.log('日志为空。'); process.exit(0) }

const pct = (a, b) => (b ? (a / b * 100).toFixed(1) + '%' : '-')

console.log('=== 影子数据总览 ===')
console.log('  记录数 ' + rows.length)
const subs = new Map()
for (const r of rows) subs.set(r.sub, (subs.get(r.sub) || 0) + 1)
console.log('  涉及小类 ' + subs.size + ' 个' + (subs.size <= 8 ? '：' + [...subs.entries()].map(([s, n]) => s + '(' + n + ')').join(' ') : ''))
const t = rows.reduce((a, r) => {
  a.params += r.params; a.filled += r.filled; a.ok += r.ok; a.nonStandard += r.nonStandard; a.missing += r.missing
  return a
}, { params: 0, filled: 0, ok: 0, nonStandard: 0, missing: 0 })
console.log('  参数位合计 ' + t.params + ' ｜ 已填 ' + t.filled + '（' + pct(t.filled, t.params) + '）'
  + ' ｜ 其中标准 ' + t.ok + '（' + pct(t.ok, t.filled) + '）'
  + ' ｜ 非标 ' + t.nonStandard + '（' + pct(t.nonStandard, t.filled) + '）')

// 按参数汇总
const byParam = new Map()
for (const r of rows) {
  for (const d of r.detail || []) {
    if (d.free) continue                       // 自由型不参与标准性统计
    const a = byParam.get(d.p) || { filled: 0, ok: 0, nonStd: 0, missing: 0, bad: new Map() }
    if (d.filled) {
      a.filled++
      if (d.ok) a.ok++
      else { a.nonStd++; a.bad.set(d.v, (a.bad.get(d.v) || 0) + 1) }
    } else a.missing++
    byParam.set(d.p, a)
  }
}

const top = Math.max(5, Number((process.argv.includes('--top') ? process.argv[process.argv.indexOf('--top') + 1] : 15)))
console.log('\n=== 按参数（按非标数降序）===')
console.log('  参数          已填   标准率   非标   缺失   最常见非标值')
const list = [...byParam.entries()].sort((a, b) => b[1].nonStd - a[1].nonStd).slice(0, top)
for (const [p, a] of list) {
  const bad = [...a.bad.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([v, c]) => v + '(' + c + ')').join(' ')
  console.log('  ' + p.padEnd(12) + String(a.filled).padStart(5) + '  ' + pct(a.ok, a.filled).padStart(7)
    + '  ' + String(a.nonStd).padStart(5) + '  ' + String(a.missing).padStart(5) + '   ' + (bad || '-'))
}

// 按小类汇总
const bySub = new Map()
for (const r of rows) {
  const a = bySub.get(r.sub) || { subName: r.subName, n: 0, filled: 0, ok: 0, nonStd: 0 }
  a.n++; a.filled += r.filled; a.ok += r.ok; a.nonStd += r.nonStandard
  bySub.set(r.sub, a)
}
console.log('\n=== 按小类（按非标数降序，前 10）===')
for (const [s, a] of [...bySub.entries()].sort((x, y) => y[1].nonStd - x[1].nonStd).slice(0, 10)) {
  console.log('  ' + s + ' ' + String(a.subName || '').padEnd(10) + '录入 ' + String(a.n).padStart(3)
    + ' ｜ 标准率 ' + pct(a.ok, a.filled).padStart(7) + ' ｜ 非标 ' + a.nonStd)
}

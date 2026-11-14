import fs from 'fs'

const rows = fs.readFileSync('data/materials.ndjson', 'utf8').split('\n').filter(Boolean).map((l) => {
  try { return JSON.parse(l) } catch { return null }
}).filter(Boolean)

// 小类 → 数量
const cnt = new Map()
for (const r of rows) {
  const sub = String(r.SUBPREFIX || String(r.FNUMBER || '').slice(0, 6)).slice(0, 6)
  const name = String(r.FNAME || '').trim()
  if (!sub) continue
  if (!cnt.has(sub)) cnt.set(sub, { n: 0, names: new Map() })
  const o = cnt.get(sub)
  o.n++
  if (name) o.names.set(name, (o.names.get(name) || 0) + 1)
}

// 分类表：拿小类标准名
let cls = {}
try {
  const j = JSON.parse(fs.readFileSync('src/config/classification.json', 'utf8'))
  const walk = (nodes) => {
    for (const n of nodes || []) {
      if (n.sub) cls[String(n.sub)] = n.subName || n.name || ''
      if (n.subs) walk(n.subs)
      if (n.children) walk(n.children)
      if (n.mids) walk(n.mids)
    }
  }
  walk(j.tree || j.bigs || j.nodes || [])
} catch (e) { /* 忽略 */ }

const arr = [...cnt.entries()].sort((a, b) => b[1].n - a[1].n)
console.log('小类总数: ' + arr.length + '，物料 ' + rows.length + ' 行')
console.log('')
console.log('TOP 40 小类（按物料数）')
console.log('小类号  物料数  标准名        前 3 个名称')
arr.slice(0, 40).forEach(([sub, o]) => {
  const top = [...o.names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([n, c]) => n + '(' + c + ')').join(' ')
  console.log(sub + '  ' + String(o.n).padStart(5) + '  ' + String(cls[sub] || '?').padEnd(14) + top)
})

// 覆盖率：TOP N 占比
const total = rows.length
let acc = 0
const cuts = [10, 20, 30, 50, 100]
const out = []
for (let i = 0; i < arr.length; i++) {
  acc += arr[i][1].n
  if (cuts.includes(i + 1)) out.push('TOP ' + (i + 1) + ' 覆盖 ' + (acc / total * 100).toFixed(1) + '%')
}
console.log('')
console.log('累计覆盖: ' + out.join(' | '))
process.exit(0)

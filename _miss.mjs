import fs from 'fs'

const guide = JSON.parse(fs.readFileSync('src/config/naming-guide.json', 'utf8'))
const sf = JSON.parse(fs.readFileSync('src/config/spec-fields.json', 'utf8'))
const map = JSON.parse(fs.readFileSync('src/config/guide-field-map.json', 'utf8'))

const alias = map.alias || {}
const nameOnly = new Set(map.nameOnly || [])
const defLib = sf.library || {}

const mids = (process.argv[2] || '1204,1202').split(',')
const miss = new Map()

for (const [sub, g] of Object.entries(guide.subs || {})) {
  if (!mids.some((m) => sub.startsWith(m))) continue
  const ph = (String(g.specPattern || '').match(/\{[^}]+\}/g) || []).map((x) => x.slice(1, -1))
  for (const p of ph) {
    if (nameOnly.has(p)) continue
    const real = alias[p] || p
    if (defLib[real]) continue
    if (!miss.has(p)) miss.set(p, [])
    miss.get(p).push(sub)
  }
}

console.log('缺定义占位符:', miss.size, '种')
for (const [p, subs] of [...miss.entries()].sort((a, b) => b[1].length - a[1].length)) {
  console.log('  ' + p.padEnd(14) + subs.length + ' 处: ' + subs.join(','))
}

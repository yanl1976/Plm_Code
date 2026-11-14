/**
 * 对比「PLM 库内条数」与「快照文件条数」，按小类定位缺失。
 *
 * 用法（在部署了 3100 且生成了快照的机器上执行）：
 *   node scripts/compare-snapshot.mjs
 *
 * 数据源：
 *   - 库：.env 的 DB_* 指向的实例上的 TCPLM.dbo.PSEITEM（只读，不碰 198.168.6.15）
 *   - 快照：data/materials-plm.ndjson
 *
 * 口径：LEFT(ECODE,6) 为小类；库内只算 EID=ELASTINSERT 且 STATEID='Using'
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { executeQuery } from '../src/db.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SNAPSHOT = path.join(ROOT, 'data', 'materials-plm.ndjson')

async function dbCounts() {
  const rows = await executeQuery(`
    SELECT LEFT(ECODE, 6) AS sub, COUNT(DISTINCT ECODE) AS n
      FROM TCPLM.dbo.PSEITEM
     WHERE EID = ELASTINSERT
       AND LEFT(ECODE, 2) IN ('10','11','12')
       AND STATEID = 'Using'
       AND LEN(ECODE) >= 6
     GROUP BY LEFT(ECODE, 6)
  `, {}, { timeout: 90000 })
  const m = new Map()
  let total = 0
  for (const r of rows) {
    const n = Number(r.n || 0)
    m.set(String(r.sub), n)
    total += n
  }
  return { map: m, total }
}

function snapCounts() {
  if (!fs.existsSync(SNAPSHOT)) {
    console.log('❌ 快照文件不存在：' + SNAPSHOT)
    console.log('   请先执行同步：PLM 页面 Console → __plmSync.start()')
    process.exit(1)
  }
  const m = new Map()
  let total = 0
  const txt = fs.readFileSync(SNAPSHOT, 'utf8')
  for (const line of txt.split('\n')) {
    if (!line.trim()) continue
    let o
    try { o = JSON.parse(line) } catch (e) { continue }
    const code = String(o.ECODE || '')
    if (!code) continue
    const sub = code.slice(0, 6)
    m.set(sub, (m.get(sub) || 0) + 1)
    total++
  }
  return { map: m, total }
}

const t0 = Date.now()
console.log('== 读取库内条数（TCPLM）==')
const db = await dbCounts()
console.log('  库内合计 ' + db.total + ' 条，' + db.map.size + ' 个小类')

console.log('== 读取快照 ==')
const sn = snapCounts()
console.log('  快照合计 ' + sn.total + ' 条，' + sn.map.size + ' 个小类')

console.log('')
console.log('== 总览 ==')
console.log('  库内 ' + db.total + '  →  快照 ' + sn.total + '  差 ' + (db.total - sn.total)
  + '（覆盖 ' + (db.total ? (sn.total / db.total * 100).toFixed(1) : 0) + '%）')

// 小类级对比
const allSubs = new Set([...db.map.keys(), ...sn.map.keys()])
const missing = []   // 库内有、快照少
const extra = []     // 快照有、库内无
const exact = []

for (const sub of [...allSubs].sort()) {
  const d = db.map.get(sub) || 0
  const s = sn.map.get(sub) || 0
  if (d > 0 && s === 0) missing.push({ sub, db: d, snap: 0, diff: d })
  else if (d > s) missing.push({ sub, db: d, snap: s, diff: d - s })
  else if (d === s) exact.push(sub)
  else extra.push({ sub, db: d, snap: s, diff: s - d })
}

console.log('')
if (missing.length) {
  console.log('== 缺失的小类（' + missing.length + ' 个，共缺 ' + missing.reduce((a, b) => a + b.diff, 0) + ' 条）==')
  missing.sort((a, b) => b.diff - a.diff)
  console.log('  小类号   库内   快照   缺')
  for (const x of missing) {
    console.log('  ' + x.sub + '  ' + String(x.db).padStart(5) + '  ' + String(x.snap).padStart(5) + '  ' + String(x.diff).padStart(5))
  }
  const list = missing.map((x) => x.sub)
  console.log('')
  console.log('  补跑命令（复制到 PLM 页面 Console）：')
  console.log('  __plmSync.retry(' + JSON.stringify(list) + ')')
} else {
  console.log('== 没有缺失的小类 ✅ ==')
}

if (extra.length) {
  console.log('')
  console.log('== 快照多出的小类（' + extra.length + ' 个）==')
  for (const x of extra.slice(0, 10)) {
    console.log('  ' + x.sub + '  库内 ' + x.db + '  快照 ' + x.snap + '  多 ' + x.diff)
  }
}

console.log('')
console.log('完全一致的小类：' + exact.length + ' 个')
console.log('耗时 ' + Math.round((Date.now() - t0) / 1000) + ' 秒')
process.exit(0)

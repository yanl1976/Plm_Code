/**
 * 国标命名范式库 · 自检
 *
 * 用法：node scripts/test-naming-guide.mjs（或 npm run test:guide）
 * 每批小类建完后必须跑到 0 失败，才进入下一批。
 *
 * 检查：
 *   ① 结构完整：subName / source / specPattern / example 非空
 *   ② 字段可读：fields ≥ 1 且每项有 key
 *   ③ 占位符一致：specPattern 里的 {xxx} 都能在 fields 找到
 *   ④ 小类合法：小类号存在于 classification.json
 *   ⑤ 示例可解析：example 按空格切分后的段数与 specPattern 段数相符
 *   ⑥ 接口可达：/api/naming-guide 返回非空（服务在线时）
 *   ⑦ 覆盖率统计
 */
import fs from 'fs'

const GUIDE = 'src/config/naming-guide.json'
const CLS = 'src/config/classification.json'
const API = 'http://127.0.0.1:3100'
const WEB = 'http://127.0.0.1:3130'

let pass = 0
const fails = []

function ok(name, cond, detail) {
  if (cond) pass++
  else fails.push(name + (detail ? '  → ' + detail : ''))
}

// ── 读取
let guide = { subs: {} }
let cls = { categories: [] }
try { guide = JSON.parse(fs.readFileSync(GUIDE, 'utf8')) } catch (e) {
  fails.push('naming-guide.json 无法解析：' + e.message)
}
try { cls = JSON.parse(fs.readFileSync(CLS, 'utf8')) } catch (e) {
  fails.push('classification.json 无法解析：' + e.message)
}

const subs = guide.subs || {}
const codes = Object.keys(subs)
const validCodes = new Set()
for (const big of cls.categories || []) {
  for (const mid of big.mid || []) {
    for (const s of mid.sub || []) validCodes.add(s.code)
  }
}

console.log('范式库：' + codes.length + ' 个小类 / 全库 ' + validCodes.size + ' 个')

// ── ① ~ ⑤ 逐条检查
for (const code of codes) {
  const g = subs[code] || {}
  const tag = '[' + code + ']'

  ok(tag + ' subName 非空', !!String(g.subName || '').trim())
  ok(tag + ' source 非空', !!String(g.source || '').trim())

  // 标准必须带年份（如 GB/T 14048.2-2020），且不得引用已废止版本。
  // 例外：明确标注「无对应国标」的条目（兜底小类/行业惯例类），必须写明依据来源
  const src = String(g.source || '')
  const noStd = /^无对应国标/.test(src)
  ok(tag + ' source 含标准年份', noStd || /-[12]\d{3}/.test(src), src.slice(0, 60))
  ok(tag + ' 无国标时写明来源',
    !noStd || /[（(]/.test(src), '需在括号里说明依据（如「按行业惯例：…」）')

  const BANNED = [
    'GB/T 1984-2014',      // 已于 2025-04-01 废止，被 2024 版代替
    'GB/T 14048.3-2017',   // 被 2025 版代替
    'GB/T 14048.2-2008',   // 被 2020 版代替
    'GB/T 14048.4-2010',   // 被 2020 版代替
    'GB/T 10963.1-2014',   // 被 2020 版代替
    'GB/T 14048.5-2008',   // 被 2017 版代替
    'GB/T 13850-1998',     // 被 2025 版代替（2026-05-01 实施）
    'GB/T 11032-2010',     // 被 2020 版代替
    'GB/T 1226-2010',      // 被 2017 版代替
    'GB/T 7676.1-1998',    // 被 2017 版代替
    'GB/T 2693-2001',      // 2024-03-15 废止，被 GB/T 6346.1-2024 代替
  ]
  // 只检查「依据」位置（每个 / 分隔段的开头），不误伤括号里的「代替 xxx」
  const segs = src.split(' / ').map((x) => x.trim())
  const badVer = segs.filter((seg) => BANNED.some((b) => seg.startsWith(b)))
  ok(tag + ' 未引用废止版本', noStd || badVer.length === 0, badVer.join('；'))
  ok(tag + ' specPattern 非空', !!String(g.specPattern || '').trim())
  ok(tag + ' example 非空', !!String(g.example || '').trim())
  ok(tag + ' 小类号存在', validCodes.has(code))

  const fields = Array.isArray(g.fields) ? g.fields : []
  ok(tag + ' fields ≥ 1', fields.length >= 1, '实际 ' + fields.length)
  ok(tag + ' fields 每项有 key',
    fields.every((f) => f && String(f.key || '').trim()),
    JSON.stringify(fields.map((f) => f && f.key)))

  // 占位符一致性：{xxx} 必须在 fields 里能找到对应 key（模糊匹配：key 或 key 的前缀）
  const holders = [...String(g.specPattern || '').matchAll(/\{([^}]+)\}/g)].map((m) => m[1])
  const keys = fields.map((f) => String(f.key || ''))
  const missing = holders.filter((h) => !keys.some((k) => k === h || k.indexOf(h) >= 0 || h.indexOf(k) >= 0))
  ok(tag + ' 占位符都能在 fields 找到', missing.length === 0, '缺 ' + JSON.stringify(missing))

  // 示例段数（宽松）：example 用空格分段，段数不少于 pattern 的段数 - 1
  const patSeg = String(g.specPattern || '').trim().split(/\s+/).length
  const egSeg = String(g.example || '').trim().split(/\s+/).length
  ok(tag + ' example 段数合理', egSeg >= Math.max(1, patSeg - 1),
    'pattern ' + patSeg + ' 段 / example ' + egSeg + ' 段')
}

// ── ⑥ 接口可达（服务未起则跳过）
console.log('\n接口检查：')
for (const code of codes.slice(0, 3)) {
  try {
    const r = await fetch(WEB + '/api/naming-guide?sub=' + code, { cache: 'no-store' }).then((x) => x.json())
    ok('3130 返回 ' + code, !!(r && r.guide && r.guide.subName), JSON.stringify(r).slice(0, 80))
  } catch (e) {
    console.log('  （3130 未启动，跳过）')
    break
  }
}
try {
  const r = await fetch(API + '/api/plm/check', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '测试', spec: 'TEST-1', sub: codes[0] || '100105' }),
  }).then((x) => x.json())
  ok('3100 check 带 guide 字段', r && 'guide' in r, JSON.stringify(r && Object.keys(r)))
} catch (e) {
  console.log('  （3100 未启动，跳过）')
}

// ── ⑦ 覆盖统计
const covered = codes.length
const total = validCodes.size
console.log('\n覆盖：' + covered + ' / ' + total + '（' + (covered / total * 100).toFixed(1) + '%）')

console.log('\n' + '='.repeat(50))
console.log('通过 ' + pass + ' 项，失败 ' + fails.length + ' 项')
if (fails.length) {
  console.log('\n失败明细：')
  fails.forEach((f) => console.log('  ✗ ' + f))
}
process.exitCode = fails.length ? 1 : 0

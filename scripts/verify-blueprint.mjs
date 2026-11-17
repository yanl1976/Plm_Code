/**
 * 蓝图体检：确保《系统业务蓝图》不与代码脱节。
 *
 * 做三件事：
 *   1. 章节完整性：必备章节是否都在（改结构后忘了同步会立刻暴露）
 *   2. 数字对照：文档里声明的关键数字 vs 代码/数据的实际值
 *   3. 时效提醒：文首「最后核对」距今超过 90 天则提示
 *
 * 用法：node scripts/verify-blueprint.mjs
 *      退出码 0=一致，1=有不一致（可用于 CI）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { LIBS } from '../src/backup.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOC = path.join(ROOT, 'docs', '系统业务蓝图.md')

if (!fs.existsSync(DOC)) {
  console.error('✗ 未找到 docs/系统业务蓝图.md')
  process.exit(1)
}
const doc = fs.readFileSync(DOC, 'utf8')

// ---- 1. 必备章节 ----
const MUST_HAVE = [
  '全景分层图', '三条主链路', '录入校验的规则链', '规格分段补全',
  '规则协作矩阵', '数据产物与依赖关系', '生效方式',
  '单位与字符规范', '名称归一的三个层次', '扩展指引', '维护约定', '当前边界',
]
const missing = MUST_HAVE.filter((s) => !doc.includes(s))
console.log('=== 章节完整性 ===')
if (missing.length) {
  console.log('  ✗ 缺失章节：' + missing.join('、'))
} else {
  console.log('  ✓ ' + MUST_HAVE.length + ' 个必备章节齐全')
}

// ---- 2. 数字对照 ----
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8')) } catch { return null } }
const idx = readJson('data/name-sub-index.json') || {}
const sym = readJson('src/config/spec-symbols.json') || {}
const map = readJson('src/config/classification-map.json') || {}

const actual = {
  index: Object.keys(idx.index || {}).length,
  dist: Object.keys(idx.dist || {}).length,
  must: (sym.replace || []).length,
  should: (sym.alias || []).length,
  white: (sym.whitelist || []).length,
  subs: Object.keys(map).length,
  libs: LIBS.length,
}

// 文档里应当出现的数字（与正文措辞对应）
const EXPECT = [
  ['名称索引 index', String(actual.index), actual.index > 0],
  ['名称分布 dist', String(actual.dist), actual.dist > 0],
  ['must 条数', String(actual.must), actual.must > 0],
  ['should 条数', String(actual.should), actual.should > 0],
  ['小类数', String(actual.subs), actual.subs > 0],
  ['数据集数', String(actual.libs), actual.libs > 0],
]

console.log('\n=== 数字对照（文档中是否写了实际值）===')
let bad = 0
for (const [name, val, nonZero] of EXPECT) {
  const hits = doc.includes(val)
  if (!nonZero) { console.log('  ⚠ ' + name + ' 实际为 0（数据缺失或未生成）'); bad++; continue }
  if (hits) console.log('  ✓ ' + name + ' = ' + val)
  else { console.log('  ✗ ' + name + ' = ' + val + ' —— 文档中未出现，可能已过时'); bad++ }
}

// ---- 3. 时效提醒 ----
const m = /最后核对\s*(\d{4})-(\d{2})-(\d{2})/.exec(doc)
if (m) {
  const days = Math.round((Date.now() - new Date(m[1] + '-' + m[2] + '-' + m[3]).getTime()) / 86400000)
  console.log('\n=== 时效 ===')
  console.log('  最后核对：' + m[0].replace('最后核对', '').trim() + '（距今 ' + days + ' 天）')
  if (days > 90) console.log('  ⚠ 超过 90 天未核对，建议按「11.5 每次改动必跑」复核一遍')
} else {
  console.log('\n=== 时效 ===')
  console.log('  ⚠ 文首未找到「最后核对 YYYY-MM-DD」标记')
}

console.log('\n结果：' + (bad === 0 && !missing.length ? '✓ 蓝图与代码一致' : '✗ 存在 ' + (bad + missing.length) + ' 项不一致，请更新文档'))
process.exit(bad === 0 && !missing.length ? 0 : 1)

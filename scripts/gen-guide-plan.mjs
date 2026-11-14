/**
 * 生成 / 更新《国标命名范式库 · 建设计划》
 *
 * 用法：node scripts/gen-guide-plan.mjs
 * 数据来源：classification.json（小类清单）、naming-guide.json（已建范式 + batchLog）
 * 每次完成一批后跑一次，文档进度自动刷新。
 */
import fs from 'fs'

const cls = JSON.parse(fs.readFileSync('src/config/classification.json', 'utf8'))
const guide = JSON.parse(fs.readFileSync('src/config/naming-guide.json', 'utf8'))
const done = new Set(Object.keys(guide.subs || {}))
const batchLog = (guide.meta && guide.meta.batchLog) || []

const cnt = new Map()
try {
  for (const l of fs.readFileSync('data/materials.ndjson', 'utf8').split('\n').filter(Boolean)) {
    let o = null
    try { o = JSON.parse(l) } catch (e) { continue }
    const sub = String(o.SUBPREFIX || String(o.FNUMBER || '').slice(0, 6)).slice(0, 6)
    if (sub) cnt.set(sub, (cnt.get(sub) || 0) + 1)
  }
} catch (e) { /* 无数据时不统计 */ }

const subs = []
for (const big of cls.categories || []) {
  for (const mid of big.mid || []) {
    for (const s of mid.sub || []) subs.push({ sub: s.code, name: s.name, mid: mid.name })
  }
}
subs.sort((a, b) => a.sub.localeCompare(b.sub))

const BATCH = 10
const rows = subs.map((s) => ({ ...s, n: cnt.get(s.sub) || 0, ok: done.has(s.sub) }))
const batches = []
for (let i = 0; i < rows.length; i += BATCH) {
  batches.push({ no: Math.floor(i / BATCH) + 1, list: rows.slice(i, i + BATCH) })
}

const totalDone = rows.filter((x) => x.ok).length
const withData = rows.filter((x) => x.n > 0).length
const finished = batches.filter((b) => b.list.every((x) => x.ok)).length
const running = batches.filter((b) => b.list.some((x) => x.ok) && !b.list.every((x) => x.ok)).length

let md = `# 国标命名范式库 · 建设计划

> 更新：${new Date().toISOString().slice(0, 10)}　｜　数据源：\`classification.json\`（${subs.length} 个小类）、\`materials.ndjson\`
> 库文件：\`src/config/naming-guide.json\`　｜　测试：\`npm run test:guide\`

---

## 一、目标

为每个小类建立一份**国标规定的名称定义与规格书写格式**，录入时提示设计人员按标准写法填报。

**只提示，不阻断保存。**

---

## 二、方法（每个小类固定五步）

| 步 | 动作 | 产出 |
|---|---|---|
| ① 查标准 | 检索该小类对应的国标（GB / GB/T / JB/T） | \`source\` |
| ② 定名称 | 取国标术语；**\`subName\` 必须与 \`classification.json\` 一致** | \`nameRule\` + \`nameAliases\` |
| ③ 定结构 | 按国标规定的参数顺序 | \`specPattern\` |
| ④ 定字段 | 每参数的含义、单位、示例；\`key\` 要对得上占位符 | \`fields\` |
| ⑤ 写示例 | 一条合规 + 一条典型错误 | \`example\` + \`avoid\` |
| ⑥ 核版本 | 在全国标准信息公共服务平台（std.samr.gov.cn）核实是否为**现行有效**版本 | \`source\` 必须带年份 |

**约束**

- 名称与规格以查到的国标原文为依据
- **只引用现行有效标准**，格式统一为「标准号-年份《标准名称》」，已废止版本不得引用
- 多标准并存时用 \` / \` 分隔，每个分段都要带年份
- 查不到国标的标注 \`source: "无对应国标"\`，写明行业通行写法，不编造标准号
- 系统内乘号用 \`*\`、单位 \`mm²\`、电压用斜杠式

---

## 三、验收标准（每批必过）

| 项 | 要求 |
|---|---|
| 结构完整 | \`subName / source / specPattern / fields / example\` 非空 |
| 字段可读 | \`fields\` ≥ 1，每项有 \`key\` |
| 占位符一致 | \`specPattern\` 的 \`{xxx}\` 都能在 \`fields.key\` 找到 |
| 小类合法 | 小类号存在于 \`classification.json\` |
| 示例合理 | \`example\` 段数不少于结构段数 - 1 |
| 接口可达 | \`GET /api/naming-guide?sub=<小类>\` 非空 |

\`\`\`powershell
npm run test:guide      # 必须 0 失败才进入下一批
\`\`\`

---

## 四、进度总览

| 指标 | 数值 |
|---|---:|
| 小类总数 | ${subs.length} |
| 有物料的小类 | ${withData} |
| 已建范式 | **${totalDone}**（${(totalDone / subs.length * 100).toFixed(1)}%） |
| 分批数 | ${batches.length}（每批 ${BATCH} 个） |
| 已完成批次 | ${finished} |
| 进行中批次 | ${running} |

**推进顺序**：严格按小类号升序，一批做完 + 测试通过 + 自动提交，再做下一批。

---

## 五、分批明细
`

for (const b of batches) {
  const list = b.list
  const okN = list.filter((x) => x.ok).length
  const dataN = list.filter((x) => x.n > 0).length
  const status = okN === list.length ? '✅ 已完成' : (okN > 0 ? '🔄 进行中 ' + okN + '/' + list.length : '⬜ 未开始')

  md += `\n### 第 ${b.no} 批（${list[0].sub} ~ ${list[list.length - 1].sub}）　${status}\n\n`
  md += '| 小类号 | 名称 | 中类 | 物料数 | 状态 |\n|---|---|---|---:|---|\n'
  for (const x of list) {
    const st = x.ok ? '✅ 已完成' : (x.n === 0 ? '⚪ 无物料（可跳过）' : '⬜ 待建')
    md += `| \`${x.sub}\` | ${x.name} | ${x.mid} | ${x.n} | ${st} |\n`
  }
  md += `\n> 本批：${dataN}/${list.length} 个有物料，合计 ${list.reduce((a, x) => a + x.n, 0)} 条物料\n`
}

md += `
---

## 六、执行要求

1. **按批推进**：一批 10 个小类，做完再开下一批，不跳批、不按物料量挑
2. **每批必测**：\`npm run test:guide\` 必须 0 失败
3. **测试通过自动提交**：\`git commit\` 只包含 \`naming-guide.json\` 与本文件
4. **无物料的小类**：仍写范式，优先级最低
5. **查不到国标的**：标注 \`source: "无对应国标"\`，不编造标准号

---

## 七、执行记录

| 批次 | 完成日期 | 范围 | 新增 | 累计 | 测试 |
|---:|---|---|---:|---:|---|
`

for (const b of batchLog) {
  md += `| ${b.no} | ${b.date} | ${b.range} | ${b.added} | ${b.total || ''} | ✅ ${b.test || ''} |\n`
}

if (!batchLog.length) md += '| — | — | — | — | — | — |\n'

md += `
> 明细见第五章各批表格，\`naming-guide.json\` 的 \`meta.batchLog\` 为唯一数据源。
`

fs.writeFileSync('doc/国标命名范式库_建设计划.md', md, 'utf8')
console.log('已更新：doc/国标命名范式库_建设计划.md（' + md.split('\n').length + ' 行）')
console.log('已建 ' + totalDone + '/' + subs.length + '，完成批次 ' + finished + '，进行中 ' + running)
process.exit(0)

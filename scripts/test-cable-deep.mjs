/**
 * 电缆规范改造 · 深度测试
 *
 * 用法：node scripts/test-cable-deep.mjs
 * 特点：大部分用本地函数断言（不依赖服务），秒出结果；接口一致性单独测（服务没起则跳过）
 *
 * 覆盖：
 *   A. 名称归一   38 条正例 + 反例（光缆/耐寒/含参数）
 *   B. 截面单位   正例 mm^2/m㎡/mm2，反例 30m/125℃/2000V 不许误伤
 *   C. 电压写法   正例（单值）与反例（斜杠式/无电压/非国标/非电缆）
 *   D. 型号识别   全量 1193 条统计 + 关键抽样
 *   E. 体系隔离   IEEE/MT/EN 不套国标电压口径
 *   F. 接口一致   /api/plm/select 与 /api/plm/select/series 的列定义
 */
import fs from 'fs'
import { checkMaterial } from '../src/material-rules.js'
import { detectCableCode, cableSpecHints } from '../src/cable-spec.js'

const WEB = 'http://127.0.0.1:3130'
const API = 'http://127.0.0.1:3100'
const SUB = '110302'

let pass = 0
const fails = []

// 分节统计：每节结束输出「X/Y 通过」
let secTitle = ''
let secPass = 0
let secTotal = 0

function ok(name, cond, detail) {
  secTotal++
  if (cond) { pass++; secPass++ } else { fails.push(name + (detail ? '  → ' + detail : '')) }
}

/** 本地模拟一次校验（与两个 HTTP 接口等价） */
function check(name, spec, sub) {
  const r = checkMaterial({ name, spec, sub })
  const hints = cableSpecHints(spec, sub)
  return {
    errors: r.errors || [],
    warnings: (r.warnings || []).concat(hints),
    fixed: (r.specFormat && r.specFormat.fixed) || '',
  }
}

function section(title) {
  if (secTitle) {
    const all = secPass === secTotal
    console.log('  ' + (all ? '✓' : '✗') + ' ' + secTitle + '：' + secPass + '/' + secTotal + ' 通过')
  }
  secTitle = title
  secPass = 0
  secTotal = 0
}

function finishSections() {
  if (!secTitle) return
  const all = secPass === secTotal
  console.log('  ' + (all ? '✓' : '✗') + ' ' + secTitle + '：' + secPass + '/' + secTotal + ' 通过')
}

// ───────────────────────── A. 名称归一 ─────────────────────────
section('A. 名称归一（110302）')
const synFile = 'src/config/name-synonyms.json'
let syn = { bySub: {} }
try { syn = JSON.parse(fs.readFileSync(synFile, 'utf8')) } catch (e) { /* 后面断言会失败 */ }
const sub110302 = (syn.bySub && syn.bySub['110302']) || {}

const POSITIVE = [
  '控制电缆', '电力电缆', '动力电缆', '电线电缆', '橡胶电缆', '低温电缆', '橡套电缆',
  '塑料电缆', '线缆', '阻燃型屏蔽控制电缆', '屏蔽软电缆', '南洋电缆', '电线', '计算机电缆',
  '交流电缆', '电源电缆', '铠装电缆', '船用控制电缆', '屏蔽软护套电缆', '低温阻燃电力电缆',
  '计算机信号电缆', '电源线', '低烟无卤阻燃电缆', '护套软电缆', '高压线', '电缆线',
  '阻燃屏蔽电缆', '阻燃型控制电缆', '铠装高压电缆', '10kV铜芯电缆', '屏蔽电缆', '测量电缆',
  '通用橡套软电缆', '电源导线', '接地导线', '控制导线', '保护开关电源线', '终端电缆',
  '屏蔽双绞软电缆', '屏蔽控制电缆',
]
for (const a of POSITIVE) ok('「' + a + '」→ 电缆', sub110302[a] === '电缆')

const NEGATIVE = ['光缆', '网线', '光纤跳线', '尾纤', '30芯电缆', '10芯电缆',
  '7kW终端电缆', 'RS485通讯电缆', '液冷充电主机电缆', '耐寒电缆']
for (const a of NEGATIVE) ok('「' + a + '」未收录', !sub110302[a])

// ───────────────────────── B. 截面单位 ─────────────────────────
section('B. 截面单位转换')
const unitCases = [
  ['KVV-450/750V 5*1.5mm^2', 'mm²'],
  ['KVV-450/750V 5*1.5m㎡', 'mm²'],
  ['KVV-450/750V 5*1.5mm2', 'mm²'],
  ['KVV-450/750V 5*1.5MM2', 'mm²'],
]
for (const [spec, expect] of unitCases) {
  const r = check('电缆', spec, SUB)
  // 单位转换体现在「规范写法」提示里（suggestSpec 负责，specFormat 只管空格类）
  const hit = r.warnings.some((w) => /规范写法/.test(w) && w.includes(expect))
  ok('单位 ' + spec + ' → ' + expect, hit, JSON.stringify(r.warnings))
}
// 反例：不许把长度/温度/电压的单位改掉
const unitSafe = [
  'MHYBV 9*1.0 240m',
  'YEFR95-2kV 125℃ 1*270',
  'IEEE45 2000V 1*70',
]
for (const spec of unitSafe) {
  const r = check('电缆', spec, SUB)
  const bad = r.warnings.some((w) => /规范写法/.test(w) && /mm²/.test(w) && !/mm²/.test(spec))
  ok('不误伤 ' + spec, !bad, JSON.stringify(r.warnings))
}

// ───────────────────────── C. 电压写法 ─────────────────────────
section('C. 电压写法提示')
const shouldWarn = [
  'ZRKYJVP-500V 5*1.5',
  'KVV-1000V 4*1.5',
  'ZRKYJVP-500V 8*1.0',
]
for (const spec of shouldWarn) {
  const r = check('电缆', spec, SUB)
  ok('应提示  ' + spec, r.warnings.some((w) => /斜杠式/.test(w)), JSON.stringify(r.warnings))
}
const shouldNot = [
  ['YJV-8.7/10kV-3*35', SUB],
  ['KYJVP-450/750V 5*1.5mm²', SUB],
  ['KVV-4*1.5', SUB],                     // 无电压
  ['IEEE45/LSZH-60℃-450V/750V 3*4', SUB], // 美标
  ['MHYBV 9*1.0 1140V', SUB],             // 矿用
  ['H1Z2Z2-K-1.5kV-1*4', SUB],            // 光伏 DC
  ['3*25+1*16+P YCW', SUB],               // 裸规格
  ['500V 1000uF', '101401'],              // 非电缆小类
  ['380V 5.5kW', '101201'],               // 非电缆小类
]
for (const [spec, sub] of shouldNot) {
  const r = check(sub === SUB ? '电缆' : '物料', spec, sub)
  ok('不应提示 ' + spec + ' (' + sub + ')', !r.warnings.some((w) => /斜杠式/.test(w)), JSON.stringify(r.warnings))
}

// ───────────────────────── D. 型号识别 ─────────────────────────
section('D. 型号识别（全量）')
let rows = []
try {
  rows = fs.readFileSync('data/materials.ndjson', 'utf8').split('\n').filter(Boolean)
    .map((l) => { try { return JSON.parse(l) } catch { return null } }).filter(Boolean)
    .filter((r) => String(r.SUBPREFIX || String(r.FNUMBER || '').slice(0, 6)) === SUB)
} catch (e) { /* 输出会体现 */ }

let hitCount = 0
const sysMap = new Map()
const catMap = new Map()
const missSamples = []
for (const r of rows) {
  const d = detectCableCode(String(r.FSPECIFICATION || ''))
  if (!d) { if (missSamples.length < 5) missSamples.push(String(r.FSPECIFICATION || '').slice(0, 40)); continue }
  hitCount++
  const s = d.system || 'GB'
  sysMap.set(s, (sysMap.get(s) || 0) + 1)
  const c = (d.info && d.info.category) || '(无品类)'
  catMap.set(c, (catMap.get(c) || 0) + 1)
}
if (rows.length) {
  const rate = hitCount / rows.length * 100
  ok('识别率 ≥80%（' + rate.toFixed(1) + '%，' + hitCount + '/' + rows.length + '）', rate >= 80)
  ok('体系数 ≥3（' + [...sysMap.keys()].join('/') + '）', sysMap.size >= 3)
  ok('无「(无品类)」的空标签', !catMap.has('(无品类)'))
} else {
  ok('物料数据可读', false, 'data/materials.ndjson 缺失或为空')
}

// 关键抽样
const sampleExpect = [
  ['YJV-8.7/10kV-3*35', 'YJV', 'GB'],
  ['ZRKYJVP-500V 5*1.5', 'KYJVP', 'GB'],
  ['ZC-VRV-0.6/1kV 4*2.5', null, null],     // VRV 未收录
  ['IEEE45/LSZH 3*4', 'IEEE 45', 'IEEE'],
  ['MHYBV 9*1.0', 'MHYBV', 'MT'],
  ['H1Z2Z2-K-1.5kV-1*4', 'H1Z2Z2-K', 'EN'],
  ['YCW 450/750V 3*50', 'YCW', 'GB'],
  ['3*25+1*16+P YCW', 'YCW', 'GB'],          // 中段识别
]
for (const [spec, code, sys] of sampleExpect) {
  const d = detectCableCode(spec)
  if (code === null) ok('抽样未识别 ' + spec, d === null, d ? d.code : '')
  else ok('抽样 ' + spec + ' → ' + code, !!d && d.code === code && (d.system || 'GB') === sys, d ? d.code + '/' + d.system : 'null')
}

// ───────────────────────── E. 未收录提示 ─────────────────────────
section('E. 未收录型号提示')
const missCases = [
  ['ZC-VRV-0.6/1kV 4*2.5', 'VRV'],
  ['WTTC 3*1.5', 'WTTC'],
  ['YEFR95-2kV 125℃ 1*270', 'YEFR95'],
]
for (const [spec, expect] of missCases) {
  const r = check('电缆', spec, SUB)
  ok('提示「' + expect + '」未收录', r.warnings.some((w) => w.includes('「' + expect + '」') && /未收录/.test(w)), JSON.stringify(r.warnings))
}
// 裸规格不该被提示
for (const spec of ['3*25+1*16', '4*2.5', '1*70']) {
  const r = check('电缆', spec, SUB)
  ok('裸规格不提示 ' + spec, !r.warnings.some((w) => /未收录/.test(w)), JSON.stringify(r.warnings))
}

// ───────────────────────── F. 接口一致性 ─────────────────────────
section('F. 接口一致性（需 3100/3130 在线）')
try {
  const s = await fetch(API + '/api/plm/select/series?sub=100105', { cache: 'no-store' }).then((x) => x.json())
  const first = (s.series || [])[0]
  const r = await fetch(API + '/api/plm/select', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sub: '100105', series: first && first.id, limit: 2 }),
  }).then((x) => x.json())

  ok('series 接口返回 columns', Array.isArray(first && first.columns) && first.columns.length > 0)
  ok('select 接口返回 columns', Array.isArray(r.columns) && r.columns.length > 0)
  ok('两接口列定义一致',
    JSON.stringify((first.columns || []).map((c) => c.key)) === JSON.stringify((r.columns || []).map((c) => c.key)))
  ok('两接口都有 filterable',
    (first.columns || []).every((c) => c.filterable !== undefined)
    && (r.columns || []).every((c) => c.filterable !== undefined))
} catch (e) {
  console.log('  （跳过：服务未启动）')
}

// ───────────────────────── 汇总 ─────────────────────────
finishSections()
console.log('\n' + '='.repeat(56))
console.log('通过 ' + pass + ' 项，失败 ' + fails.length + ' 项')
if (fails.length) {
  console.log('\n失败明细：')
  fails.forEach((f) => console.log('  ✗ ' + f))
}
// 不用 process.exit：F 节的 fetch 连接未关闭时会触发 Node 的断言告警
process.exitCode = fails.length ? 1 : 0

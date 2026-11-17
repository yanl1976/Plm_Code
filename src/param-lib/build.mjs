/**
 * 参数标准库 · 构建脚本（离线，不参与运行时）
 *
 * 输入：data/materials.ndjson（23059 条）
 * 输出：
 *   src/config/param-standard.json        草稿（draft=true，含 accepted/pending/suspected）
 *   data/param-standard-pending.json      待人工确认清单
 *
 * 流程：提取 → 剔除错类 → 值归一 → 频次统计 → 与标准序列比对 → 分类
 *
 * 与现有库的关系：只读 spec-fields / naming-guide / dedup-rules，不修改任何现有文件。
 */
import fs from 'fs'
import path from 'path'
import { getCategory, chooseTokens } from '../classify.js'
import { extractParams } from '../struct-spec.js'
import { loadIndex } from '../plm-index.js'
import { detectSubMismatch } from '../material-rules.js'

const ROOT = path.resolve(process.cwd())
const NDJSON = path.join(ROOT, 'data/materials.ndjson')
const OUT_LIB = path.join(ROOT, 'src/config/param-standard.json')
const OUT_PENDING = path.join(ROOT, 'data/param-standard-pending.json')
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/classification-map.json'), 'utf8'))

await loadIndex({ force: true })

// ---------- 标准序列（内置，来自国标/行业惯例，后续可由业务补充）----------
const R10 = [1, 1.25, 1.6, 2, 2.5, 3.15, 4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80,
  100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300]
const CB_CURRENT = [1, 2, 3, 4, 6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600]
// 断路器分断能力常见值（含 4.5kA 行业惯例、31.5 来自 R10）
const CB_BREAK = [3, 4.5, 6, 8, 10, 12.5, 15, 16, 20, 25, 31.5, 35, 40, 50, 63, 65, 80, 100]

// ---- 标准序列（国标/行业公开序列，仅用于"是否为标准值"的判定）----

// 电流互感器标准变比（GB 1207 / GB/T 20840.2，二次侧 5A）
const RATIO = ['50/5', '75/5', '100/5', '150/5', '200/5', '250/5', '300/5', '400/5', '500/5', '600/5',
  '750/5', '800/5', '1000/5', '1200/5', '1500/5', '2000/5', '2500/5', '3000/5', '4000/5', '5000/5', '6000/5']

// 标准电压（GB/T 156）—— 低压/高压/电缆常用
const VOLT = ['9V', '12V', '24V', '36V', '48V', '110V', '127V', '220V', '380V', '400V', '415V', '440V',
  '500V', '660V', '690V', '1140V',
  '300/500V', '450/750V', '0.6/1KV', '3.6/6KV', '6/10KV', '8.7/15KV', '12/20KV', '26/35KV',
  '6KV', '10KV', '20KV', '35KV', '66KV', '110KV', '220KV']

// IEC 60063 优先数系
const E24 = [1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1]
const E6 = [1.0, 1.5, 2.2, 3.3, 4.7, 6.8]
const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]

/** 把数值归一到 [1,10) 的基准数，用于比对 E 系列 */
function mantissa(n) {
  if (!(n > 0)) return 0
  let x = n
  while (x >= 10) x /= 10
  while (x < 1) x *= 10
  return Math.round(x * 100) / 100
}
const inE = (set) => (v) => {
  const m = /^([\d.]+)/.exec(String(v))
  if (!m) return false
  const base = mantissa(parseFloat(m[1]))
  return set.some((e) => Math.abs(e - base) < 0.05)
}

const SERIES = {
  额定电流: { test: (v) => R10.includes(parseFloat(v)) || CB_CURRENT.includes(parseFloat(v)), note: 'R10 优先数系 + 断路器常见档位' },
  分断能力: { test: (v) => CB_BREAK.includes(parseFloat(v)), note: '断路器行业常见分断值（含 4.5kA）' },
  变比: { test: (v) => RATIO.includes(String(v)), note: 'GB 1207 标准变比（二次 5A）' },
  额定电压: { test: (v) => VOLT.includes(String(v)), note: 'GB/T 156 标准电压等级' },
  阻值: { test: inE(E24), note: 'E24 优先数系（IEC 60063）' },
  容值: { test: (v) => inE(E6)(v) || inE(E12)(v), note: 'E6/E12 优先数系（IEC 60063）' },
}

// ---------- 值归一（按参数定制；未列出的走默认清洗）----------
const toHalf = (s) => String(s)
  .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  .replace(/\u3000/g, ' ')
  .trim()

const NORMALIZERS = {
  极数: (v) => {
    const s = toHalf(v).toUpperCase().replace(/\s/g, '')
    const m = /^(\d)P?(\+N)?$/.exec(s)
    return m ? m[1] + 'P' + (m[2] || '') : null
  },
  脱扣曲线: (v) => {
    const s = toHalf(v).toUpperCase().replace(/\s/g, '')
    return ['B', 'C', 'D'].includes(s) ? s : null
  },
  额定电流: (v) => {
    const m = /^([\d.]+)\s*A?$/i.exec(toHalf(v))
    if (!m) return null
    const n = parseFloat(m[1])
    return isFinite(n) && n > 0 ? String(n) : null
  },
  分断能力: (v) => {
    const m = /^([\d.]+)\s*k?A?$/i.exec(toHalf(v))
    if (!m) return null
    const n = parseFloat(m[1])
    return isFinite(n) && n > 0 ? String(n) : null
  },
  精度: (v) => {
    const s = toHalf(v).replace(/\s/g, '').replace('±', '±')
    const m = /^±?\d+(\.\d+)?%?$/.exec(s)
    return m ? (s.includes('%') ? s : s + '%') : null
  },
  分断等级: (v) => {
    const s = toHalf(v).toUpperCase().replace(/\s/g, '')
    return /^[A-Z]$/.test(s) ? s : null
  },
  // 变比：200/5A、200：5、200/5A 0.5级 → 200/5
  变比: (v) => {
    const s = toHalf(v).replace(/\s/g, '')
    const m = /^(\d+(?:\.\d+)?)[\/:：](\d+(?:\.\d+)?)A?$/i.exec(s)
    return m ? m[1] + '/' + m[2] : null
  },
  // 额定电压：去 AC/DC/~ 前缀，统一大写 V/kV；多值（0.6/1kV）保留
  // 必须带单位 V/KV —— 否则 "0.66" 会被补成 "0.66V"（实测因此产生 347 条假值）
  额定电压: (v) => {
    let s = toHalf(v).toUpperCase().replace(/\s/g, '').replace(/^(AC|DC|～|~)/, '')
    if (!/^\d/.test(s)) return null
    if (!/V$/.test(s)) return null
    return /^\d+(\.\d+)?(\/\d+(\.\d+)?)?K?V$/.test(s) ? s : null
  },
  // 容值：1000uF / 1000μF / 1000uf → 1000μF
  容值: (v) => {
    const s = toHalf(v).replace(/\s/g, '').toUpperCase().replace('Μ', 'μ')
    const m = /^(\d+(?:\.\d+)?)(UF|NF|PF|F)$/.exec(s)
    if (!m) return null
    const u = m[2].toLowerCase() === 'uf' ? 'μF' : m[2]
    return m[1] + u
  },
  // 阻值：10K / 10kΩ / 10k → 10kΩ（保留数量级字母）
  阻值: (v) => {
    let s = toHalf(v).replace(/\s/g, '').replace(/Ω|R(?=\d|$)/g, 'Ω')
    if (!/^\d/.test(s)) return null
    if (!/Ω$/.test(s)) s = s + 'Ω'
    // 数量级字母统一小写：10KΩ → 10kΩ（M 保持大写）
    s = s.replace(/([\d.]+)K(?=Ω)/, '$1k')
    return s
  },
}

function normalize(param, v) {
  const f = NORMALIZERS[param]
  if (f) return f(v)
  const s = toHalf(v)
  return s || null
}

// ---------- 主流程 ----------
const rows = fs.readFileSync(NDJSON, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
console.log('物料 ' + rows.length + ' 条，小类 ' + Object.keys(MAP).length + ' 个')

// 按中类限定（先做 1001-1014，可改全量）
const SUBS = Object.keys(MAP).filter((s) => { const m = s.slice(0, 4); return m >= '1001' && m <= '1014' }).sort()

// 剔除疑似错类（只算一遍）
const suspect = new Set()
for (const r of rows) {
  const s = String(r.FNUMBER || '').slice(0, 6)
  if (!s.startsWith('10')) continue
  const n = String(r.FNAME || '').trim()
  if (n && detectSubMismatch(n, s)) suspect.add(r.FNUMBER)
}
console.log('  剔除疑似错类 ' + suspect.size + ' 条（全库口径）')

const params = new Map()   // 参数名 → { subs:Set, raw:Map, norm:Map }
let usedRows = 0
let droppedRows = 0

for (const sub of SUBS) {
  const info = getCategory(sub)
  const tokens = chooseTokens(info)
  if (!tokens.length) continue
  const list = rows.filter((r) => String(r.FNUMBER || '').startsWith(sub) && String(r.FSPECIFICATION || '').trim())
  const clean = list.filter((r) => !suspect.has(r.FNUMBER))
  droppedRows += list.length - clean.length
  usedRows += clean.length
  if (!clean.length) continue

  for (const t of tokens) {
    let acc = params.get(t)
    if (!acc) { acc = { subs: new Set(), raw: new Map(), norm: new Map() }; params.set(t, acc) }
    acc.subs.add(sub)
    for (const r of clean) {
      const v = extractParams(String(r.FSPECIFICATION), [t])[t]
      if (!v) continue
      acc.raw.set(v, (acc.raw.get(v) || 0) + 1)
      const nv = normalize(t, v)
      if (nv == null) continue
      acc.norm.set(nv, (acc.norm.get(nv) || 0) + 1)
      // 记录别名：原始写法 ≠ 归一值
      if (nv !== String(v).trim()) {
        acc.aliasMap = acc.aliasMap || new Map()
        acc.aliasMap.set(String(v).trim(), nv)
      }
    }
  }
}
console.log('  参与构建物料 ' + usedRows + ' 条（剔除 ' + droppedRows + '）')
console.log('  参数种类 ' + params.size + '\n')

// ---------- 分类 ----------
const out = { params: {} }
const pendingRows = []
let stat = { accepted: 0, pending: 0, suspected: 0 }

for (const [name, acc] of [...params.entries()].sort((a, b) => b[1].norm.size - a[1].norm.size)) {
  const ranked = [...acc.norm.entries()].sort((a, b) => b[1] - a[1])
  const ser = SERIES[name]
  const aliasesOf = () => {
    const o = {}
    if (acc.aliasMap) for (const [k, v] of acc.aliasMap) o[k] = v
    return o
  }

  // 类型判定：归一后取值种数决定能不能当"标准"
  //   ≤15  → enum  可直接给候选
  //   16-50 → semi  只给 Top N 参考
  //   >50  → free  不进标准库（型号/阻值/容值/电压这类），只留频次最高的几个作参考
  const normCount = ranked.length
  // 有标准序列的参数（额定电流/分断能力）：不看归一后种数，直接按"是否在序列内"收录
  const kind = ser ? 'series' : (normCount <= 15 ? 'enum' : normCount <= 50 ? 'semi' : 'free')
  if (kind === 'free') {
    out.params[name] = {
      type: 'free',
      subs: [...acc.subs].sort(),
      reference: ranked.slice(0, 5).map(([value, count]) => ({ value, count })),
      rawCount: acc.raw.size,
      normCount,
      aliases: aliasesOf(),
      note: '取值过多，不推荐值；仅保留 Top5 作"同小类常见写法"参考',
    }
    continue
  }

  const accepted = [], pending = [], suspected = []

  for (const [v, c] of ranked) {
    const inSeries = ser ? ser.test(v) : true
    if (inSeries && c >= 2) accepted.push({ value: v, count: c })
    else if (!inSeries && c >= 5) {
      pending.push({ value: v, count: c, reason: '不在标准序列但出现 ≥5 次，需确认是否为行业惯例/特殊规格' })
      pendingRows.push({ 参数: name, 值: v, 条数: c, 类型: '标准外高频' })
    } else if (!inSeries) {
      suspected.push({ value: v, count: c })
      pendingRows.push({ 参数: name, 值: v, 条数: c, 类型: '标准外低频(疑似笔误)' })
    } else {
      suspected.push({ value: v, count: c })
    }
  }

  stat.accepted += accepted.length
  stat.pending += pending.length
  stat.suspected += suspected.length

  out.params[name] = {
    type: ser ? 'number-series' : kind,
    kind,
    series: ser ? ser.note : '',
    subs: [...acc.subs].sort(),
    accepted: accepted.slice(0, 30),
    pending,
    suspected: suspected.slice(0, 20),
    aliases: aliasesOf(),
    rawCount: acc.raw.size,
    normCount,
  }
}

out.meta = {
  generatedAt: new Date().toISOString(),
  draft: true,
  scope: '1001-1014 中类',
  sourceRows: usedRows,
  droppedRows,
  note: '由 src/param-lib/build.mjs 自动生成。accepted=可直接推荐；pending=需人工确认；suspected=疑似笔误。人工确认后把 draft 改为 false。',
}

fs.writeFileSync(OUT_LIB, JSON.stringify(out, null, 2) + '\n', 'utf8')
fs.writeFileSync(OUT_PENDING, JSON.stringify(pendingRows, null, 2) + '\n', 'utf8')

console.log('=== 输出 ===')
console.log('  库草稿: src/config/param-standard.json（' + Object.keys(out.params).length + ' 个参数）')
console.log('  待确认: data/param-standard-pending.json（' + pendingRows.length + ' 条）')
console.log('  分类：accepted ' + stat.accepted + ' ｜ pending ' + stat.pending + ' ｜ suspected ' + stat.suspected)

console.log('\n=== 各参数收敛情况（原始 → 归一后）===')
for (const [name, p] of Object.entries(out.params)) {
  const acc = p.accepted ? p.accepted.length : (p.reference ? p.reference.length : 0)
  const pend = p.pending ? p.pending.length : 0
  console.log('  ' + name.padEnd(12) + String(p.rawCount).padStart(4) + ' → ' + String(p.normCount).padStart(4)
    + ' 种 ｜ ' + String(acc).padStart(3) + (p.type === 'free' ? ' 参考' : ' 收录')
    + ' ｜ 待确认 ' + String(pend).padStart(2)
    + ' ｜ ' + p.type + (p.kind ? '/' + p.kind : ''))
}
process.exit(0)

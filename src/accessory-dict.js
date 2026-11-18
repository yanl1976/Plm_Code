/**
 * 附加参数字典（接线能力 / 可选配件）的生成器。
 *
 * 数据来源：选型库 Excel 导入后的结构化数据
 *   data/selection/series/<小类>/<系列>.json
 * 输出：
 *   src/config/accessory-dict.json
 *
 * 结构按「小类 + 系列」两级：
 *   wiring:      [{ sub, series, values }]        接线能力
 *   accessories: [{ sub, series, code, cn, type }] 可选配件（标配/选配）
 *
 * 为什么需要它：技术参数框按型号所属系列取附加参数，
 * 而选型库的 Excel 一经更新，这份字典就必须跟着重建，否则界面上还是旧配件。
 * 因此 importSeries 成功后会自动调用本模块（见 plm-server.js）。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const SELECT_DIR = path.join(ROOT, 'data/selection')
const OUT_FILE = path.join(ROOT, 'src/config/accessory-dict.json')

/** 递归列出目录下的 json */
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (e.name.endsWith('.json')) out.push(p)
  }
  return out
}

/**
 * 解析「可配附件」单元格。
 * 形如：标配：MO 电动操作机构、ST 分励脱扣；选配：UVR 欠压线圈、钢缆联锁
 * 规则：
 *   「代号 中文」→ 拆成 code + cn
 *   「S9/V9/XF9」→ 按 / 拆成多个代号
 *   其它 → 作为纯描述（code 为空）
 */
function parseAccessories(text) {
  const out = []
  const s = String(text || '')
  for (const seg of s.split(/[；;]/)) {
    const m = /^\s*(标配|选配)\s*[:：]\s*(.+)$/.exec(seg)
    const type = m ? m[1] : ''
    const body = m ? m[2] : seg
    for (const item of body.split(/[、,，]/)) {
      const t = item.trim()
      if (!t || t.includes('\uFFFD')) continue          // 跳过编码损坏的片段
      const mm = /^([A-Za-z][A-Za-z0-9-]{0,8})\s+(.+)$/.exec(t)
      if (mm) { out.push({ code: mm[1], cn: mm[2].trim(), type }); continue }
      if (/^[A-Za-z][A-Za-z0-9/+.-]{0,30}$/.test(t)) {
        for (const c of t.split('/')) if (c.trim()) out.push({ code: c.trim(), cn: '', type })
        continue
      }
      out.push({ code: '', cn: t, type })
    }
  }
  return out
}

/**
 * 扫描选型库并重建附加参数字典。
 * @returns {{ wiring: number, accessories: number, series: number, file: string }}
 */
export function buildAccessoryDict() {
  const acc = []
  const wiring = []

  for (const f of walk(SELECT_DIR)) {
    let j
    try { j = JSON.parse(fs.readFileSync(f, 'utf8')) } catch { continue }
    const list = Array.isArray(j.series) ? j.series : (j.series ? Object.values(j.series) : [])
    for (const s of list) {
      if (!s || !Array.isArray(s.columns)) continue
      const sub = String(s.sub || '').slice(0, 6)
      // 系列名含中文（如「螺栓选型清单」）说明不是型号前缀 → 视为通用，置空
      const rawSeries = String(s.id || s.name || '')
      const series = /[\u4e00-\u9fa5]/.test(rawSeries) ? '' : rawSeries
      for (const c of s.columns) {
        const key = String(c.key || '')
        const vals = [...new Set((s.rows || []).map((r) => String(r[c.key] || '').trim()).filter(Boolean))]
        if (/可配附件|^附件$/.test(key)) {
          for (const v of vals) {
            for (const a of parseAccessories(v)) {
              acc.push({ ...a, sub, series, brand: s.brand || '', source: path.basename(f) })
            }
          }
        }
        if (/接线能力/.test(key) && vals.length) {
          const hit = wiring.find((w) => w.sub === sub && w.series === series)
          if (hit) hit.values = [...new Set([...hit.values, ...vals])]
          else wiring.push({ sub, series, values: vals })
        }
      }
    }
  }

  // 去重：同小类同系列下，代号优先、其次中文
  const seen = new Set()
  const uniq = []
  for (const a of acc) {
    const k = (a.code ? 'c:' + a.code.toUpperCase() : 'n:' + a.cn) + '@' + a.sub + '@' + a.series
    if (seen.has(k)) continue
    seen.add(k)
    uniq.push(a)
  }

  const dict = {
    meta: {
      note: '附加参数（接线能力 / 可选配件），按「小类 + 系列」存储。' +
        '由 src/accessory-dict.js 从 data/selection 自动生成，选型库导入后会自动重建，请勿手工编辑。',
      updatedAt: new Date().toISOString(),
    },
    wiring,
    accessories: uniq,
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(dict, null, 2) + '\n', 'utf8')

  return {
    wiring: wiring.length,
    accessories: uniq.length,
    series: new Set([...wiring.map((w) => w.sub + '|' + w.series), ...uniq.map((a) => a.sub + '|' + a.series)]).size,
    file: OUT_FILE,
  }
}

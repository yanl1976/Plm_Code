/**
 * 附加参数字典（接线能力 / 可选配件）的生成器。
 *
 * 数据来源：选型库 Excel 导入后的结构化数据
 *   data/selection/series/<小类>/<系列>.json
 * 输出：
 *   src/config/accessory-dict.json
 *
 * 结构（2026-11-19，方案 A + B）：
 *   pools:    [{ wiring:[...], accessories:[{code,cn,type}], raw:{wiring,accessories} }]
 *             按「行内容组合」池化去重；raw 保留该行原文，供展示层原样输出
 *   models:   { "小类|型号大写": poolId }                        型号行 → 池
 *   wiring / accessories                                          旧「按小类+系列」汇总，仅作回退
 *
 * 展示层约定（方案 B）：接口优先返回 raw，前端原样输出（仅整理空白），不再按
 * type 重组格式 —— 结构化条目只服务于去重/过滤，不参与展示。这样 Excel 内容
 * 怎么变（新增前缀、改用词、改分隔符）都不需要改代码，也不会产生歧义。
 *
 * 为什么加 pools/models：
 *   旧实现按「小类 + 系列」汇总整列取值，而 series 名含中文时会被判为「通用」
 *   （见下方 series 判定），于是整张表的列值对所有型号生效 —— 实测 100101 的
 *   EasyPact EVS+ 选型手册（2208 行）出现两类问题：
 *     ① 接线能力列 2070 行写「水平后连接」、138 行写「水平后连接（可选择垂直后连接）」，
 *        汇总后两条并列，看板上显示成「水平后连接、水平后连接（可选择垂直后连接）」；
 *     ② 固定式型号（EVSS04N3F601）混入抽屉式型号的配件（抽架位置触点/VSPD/VPEC/VPOC）。
 *   按型号行聚合后，取值与选型库该行完全一致；池化让 2208 行的字典仍然很小。
 *
 * 为什么需要它：主要参数框（旧称技术参数）按型号取附加参数，
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
 * 2026-11-19：增加「可选：」前缀识别（原只认 标配:/选配:，现场数据大量使用「可选：」），
 *   否则整段会被当作一条纯描述、再按「、」拆成若干无类型条目。
 */
function parseAccessories(text) {
  const out = []
  const s = String(text || '')
  for (const seg of s.split(/[；;]/)) {
    const m = /^\s*(标配|选配|可选)\s*[:：]\s*(.+)$/.exec(seg)
    const type = m ? (m[1] === '标配' ? '标配' : '选配') : ''
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
 * 按型号取附加参数池（新结构）。匹配顺序：
 *   ① 完整型号（同小类，键 = 小类|型号大写）
 *   ② 型号前缀（同小类下最长的、是目标型号前缀的键，处理型号带后缀的情况）
 * 返回 null 表示未命中 → 调用方回退旧的「按系列/通用」逻辑。
 */
export function pickAccessoryPool(dict, sub, model) {
  try {
    const models = dict && dict.models
    const pools = (dict && dict.pools) || []
    if (!models || !model) return null
    const S = String(sub || '')
    const M = String(model).trim().toUpperCase()
    if (!S || !M) return null
    let id = models[S + '|' + M]
    if (id == null) {
      let best = ''
      const prefix = S + '|'
      for (const k of Object.keys(models)) {
        if (!k.startsWith(prefix)) continue
        const mk = k.slice(prefix.length)
        if (mk && M.startsWith(mk) && mk.length > best.length) best = mk
      }
      if (best) id = models[prefix + best]
    }
    if (id == null) return null
    return pools[id] || null
  } catch (e) { return null }
}

/**
 * 扫描选型库并重建附加参数字典。
 * @returns {{ wiring: number, accessories: number, series: number, models: number, pools: number, file: string }}
 */
export function buildAccessoryDict() {
  const acc = []
  const wiring = []
  const pools = []
  const poolSig = new Map()
  const models = {}

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

      // ---- 旧结构：按「小类 + 系列」汇总（未命中型号时的回退路径）----
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

      // ---- 新结构：按型号行聚合（一型号一池，池按内容去重）----
      const modelKey = ((s.columns.find((c) => String(c.role || '') === 'model') || {}).key) || '型号'
      const wiringKey = ((s.columns.find((c) => /接线能力/.test(String(c.key || ''))) || {}).key) || ''
      const accKey = ((s.columns.find((c) => /可配附件|^附件$/.test(String(c.key || ''))) || {}).key) || ''
      if (!wiringKey && !accKey) continue
      for (const r of (s.rows || [])) {
        const model = String(r[modelKey] || '').trim()
        if (!model) continue
        const wv = wiringKey ? String(r[wiringKey] || '').trim() : ''
        const at = accKey ? String(r[accKey] || '').trim() : ''
        if (!wv && !at) continue
        const w = wv ? [wv] : []
        const a = at ? parseAccessories(at) : []
        // 池签名改用【原文】：原文相同才复用同一池，保证展示层能 100% 还原该行原文。
        // 结构化条目（wiring/accessories）仅作内部使用，不参与展示格式 ——
        // 这样 Excel 内容怎么变（新增前缀/改分隔符/改用词）都不需要改代码，也不会歧义。
        const sig = JSON.stringify({ sub, w: wv, a: at })
        let id = poolSig.get(sig)
        if (id == null) {
          id = pools.length
          pools.push({ wiring: w, accessories: a, raw: { wiring: wv, accessories: at } })
          poolSig.set(sig, id)
        }
        models[String(sub) + '|' + model.toUpperCase()] = id
      }
    }
  }

  // 去重（兼容旧结构）：同小类同系列下，代号优先、其次中文
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
      note: '附加参数（接线能力 / 可选配件）：pools+models 为「按型号行」精确取值（优先，含 raw 原文），' +
        'wiring/accessories 为「按小类+系列」汇总（仅在型号未命中时回退）。' +
        '展示层优先输出 raw 原文（仅整理空白），结构化条目仅作内部使用。' +
        '由 src/accessory-dict.js 从 data/selection 自动生成，选型库导入后会自动重建，请勿手工编辑。',
      updatedAt: new Date().toISOString(),
    },
    wiring,
    accessories: uniq,
    pools,
    models,
  }
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify(dict, null, 2) + '\n', 'utf8')

  return {
    wiring: wiring.length,
    accessories: uniq.length,
    series: new Set([...wiring.map((w) => w.sub + '|' + w.series), ...uniq.map((a) => a.sub + '|' + a.series)]).size,
    models: Object.keys(models).length,
    pools: pools.length,
    file: OUT_FILE,
  }
}

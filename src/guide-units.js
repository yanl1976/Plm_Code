/**
 * 品类单元（nameUnits）匹配 —— 解决「没有明确界定的名称」。
 *
 * 背景：物料名称在库里承担三种不同职能，此前只有两处落点（同义词字典 alias→std、
 * 小类标准名），缺了中间那一层，于是「门禁」「监控」「消防系统」这类**上位词/泛称**
 * 无处安放，只能硬塞进同义词字典编一个 std（就出现「监控 → 安防设备」这种错）。
 *
 * 三层模型（数据写在 naming-guide.json 的 subs[小类]，按小类隔离）：
 *   ① 泛称 systemWords  —— 不能直接下订单的上位词（门禁/监控/消防系统），只能提示"写具体"
 *   ② 品类单元 nameUnits —— 可采购、可验收的具体物（网络摄像机/硬盘/门禁控制器），带 aliases
 *   ③ 变体/错叫         —— 走 name-synonyms.json 的 bySub（存量脏叫法补丁）
 *
 * 本模块只做"名称 → 哪一层"的判定，不改变任何既有规则：
 *   - 未在范式库声明 nameUnits 的小类，全部返回 null（一律不介入）
 *   - 泛称只用于给出"请写具体"的提示，绝不映射成某个标准名
 */
import { loadGuide } from './guide-fields.js'

/**
 * 「配件/外形」类后缀：名称含这些词时不做"包含别名"的模糊匹配。
 * 例：「交换机壳体」含「交换机」，但它是壳体配件，不是交换机；
 *     「枪机电源」含「枪机」，但它是电源适配器（这类仍可靠 exact 别名命中正确的单元）。
 */
const ACCESSORY_SUFFIX = ['壳体', '配件', '支架', '电源', '标签', '线缆', '胶水', '箱', '桩', '雨棚', '模块配件']

const norm = (s) => String(s == null ? '' : s).replace(/\u3000/g, ' ').replace(/\s+/g, '').trim()

/** 某小类的单元配置：{ units, systemWords, refineHints, refineHint }；未声明则空 */
export function unitsOf(sub) {
  const s = String(sub || '').trim().slice(0, 6)
  const it = (loadGuide().subs || {})[s] || null
  if (!it) return { units: [], systemWords: [], refineHints: {}, refineHint: '' }
  return {
    units: Array.isArray(it.nameUnits) ? it.nameUnits : [],
    systemWords: Array.isArray(it.systemWords) ? it.systemWords : [],
    refineHints: (it.refineHints && typeof it.refineHints === 'object') ? it.refineHints : {},
    refineHint: it.refineHint || '',
  }
}

/** 该小类是否已声明品类单元（供 UI 判断是否介入） */
export function hasUnits(sub) {
  return unitsOf(sub).units.length > 0
}

/** 全部小类的单元名（供跨小类检测、同义词引用校验） */
export function allUnitNames() {
  const out = new Map()
  for (const [sub, it] of Object.entries(loadGuide().subs || {})) {
    const names = (Array.isArray(it.nameUnits) ? it.nameUnits : []).map((u) => u.name).filter(Boolean)
    if (names.length) out.set(sub, names)
  }
  return out
}

/**
 * 是否泛称（上位词）。命中即表示「该名称无法对应一件可采购的物，必须细分」。
 * @returns {{word:string, hint:string} | null} hint = 该泛称词对应的细分建议
 */
export function matchSystemWord(name, sub) {
  const n = norm(name)
  if (!n) return null
  const cfg = unitsOf(sub)
  for (const w of cfg.systemWords) {
    if (n === norm(w)) {
      const hint = cfg.refineHints[w] || cfg.refineHint || `请把「${w}」细分为具体部件或设备`
      return { word: w, hint }
    }
  }
  return null
}

/**
 * 名称 → 品类单元。
 * 匹配顺序：完全等于单元名 → 完全等于某个别名 → 包含最长别名（排除配件后缀）。
 * @returns {{unit:string, alias:string, exact:boolean, traits:string[]} | null}
 */
export function matchUnit(name, sub) {
  const n = norm(name)
  if (!n) return null
  const { units } = unitsOf(sub)
  if (!units.length) return null

  // ① 完全等于单元名
  for (const u of units) {
    if (n === norm(u.name)) return { unit: u.name, alias: u.name, exact: true, traits: u.traits || [] }
  }
  // ② 完全等于某个别名
  for (const u of units) {
    for (const a of u.aliases || []) {
      if (n === norm(a)) return { unit: u.name, alias: a, exact: true, traits: u.traits || [] }
    }
  }
  // ③ 包含最长别名（配件后缀不做模糊匹配，避免「交换机壳体」被归到「网络交换机」）
  if (ACCESSORY_SUFFIX.some((w) => n.includes(w))) return null
  let best = null
  for (const u of units) {
    for (const a of u.aliases || []) {
      const an = norm(a)
      if (!an || an.length < 2) continue
      if (!n.includes(an)) continue
      if (!best || an.length > best.alias.length) best = { unit: u.name, alias: a, exact: false, traits: u.traits || [] }
    }
  }
  return best
}

/** 该小类可用的「单元名」清单（用于给用户列出可选写法） */
export function unitNameList(sub) {
  return unitsOf(sub).units.map((u) => u.name).filter(Boolean)
}

export default { unitsOf, hasUnits, allUnitNames, matchSystemWord, matchUnit, unitNameList }

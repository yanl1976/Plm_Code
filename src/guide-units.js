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
export const ACCESSORY_SUFFIX = [
  '壳体', '配件', '支架', '电源', '标签', '线缆', '胶水', '箱', '桩', '雨棚', '模块配件',
  // 设备/端件：名称里含线缆词但本身是设备（如「单网线延长器发射端」不是网线）
  '延长器', '发射端', '接收端', '转换器',
  // 组件：名称里含「插座/插头」但整体是组件（如「插座光缆组件」属 110303，不是插座）
  '光缆组件',
  // 工具：网线钳/压线钳 是工具，不是它所修饰的物料
  '钳',
]

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

/**
 * 参与「跨小类检测」的单元名（只有显式标了 crossSub: true 的才算）。
 *
 * 为什么默认不参与：单元名里有大量通用词（机柜/支架/显示屏/硬盘/电源适配器/锁），
 * 把它们加入跨小类参照表会把「机柜」判到 120407 安防、「支架」判到摄像机支架，
 * 实测在「其它/其它器件」四个杂类里造成约 38 条误判。
 * 只有能唯一定位到某小类的词（网络摄像机、门禁控制器、插针、网线…）才标 crossSub。
 */
export function allUnitNames() {
  const out = new Map()
  for (const [sub, it] of Object.entries(loadGuide().subs || {})) {
    const names = (Array.isArray(it.nameUnits) ? it.nameUnits : [])
      .filter((u) => u && u.name && u.crossSub === true)
      .map((u) => u.name)
    if (names.length) out.set(sub, names)
  }
  return out
}

/**
 * 边界词：明确不属于本小类的名称（业务规则，配置在各小类的 excludeHints）。
 *
 * 为什么需要它：存量索引（名称→主导小类）只能覆盖「库里已有明确归属」的名称。
 * 若某名称在库内本身就散在多个小类（例「电源线」8 条散在 5 个类、纯度 0.38），
 * 索引会把它排除，判定就落空 —— 但业务上「电源线不是通讯线」是确定的。
 * 这类只能由业务给出词表，不能靠数据推断。
 * @returns {{word:string, hint:string} | null}
 */
export function matchExcludeHint(name, sub) {
  const n = norm(name)
  if (!n) return null
  const s = String(sub || '').trim().slice(0, 6)
  const it = (loadGuide().subs || {})[s] || null
  const hints = (it && it.excludeHints) || {}
  const hit = hints[n]
  return hit ? { word: n, hint: String(hit) } : null
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
      // lead = 引导语（各小类自定：安防「请写具体部件或设备」/ 通讯线「请写具体用途的线缆」）
      // hint = 该泛称词对应的可选写法清单
      return { word: w, hint: cfg.refineHints[w] || '', lead: cfg.refineHint || '请写具体部件或设备' }
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

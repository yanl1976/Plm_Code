/**
 * 分类：根据 FNUMBER 前 6 位（小类编码）定位 大类/中类/小类，并依据规则挑选查重关键属性。
 * 数据来源：src/config/classification-map.json（由 xlsx 生成）+ src/config/dedup-rules.json。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { RULES } from './spec.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/config/classification-map.json'), 'utf8'))

export function getCategory(subPrefix) {
  if (!subPrefix || !MAP[subPrefix]) return null
  return MAP[subPrefix]
}

// 根据小类/中类/大类名称匹配启发式关键属性；命中则返回 attrs，否则用默认
export function chooseAttrs(info) {
  if (!info) return RULES.defaultAttrs
  const hay = [info.subName, info.midName, info.bigName].filter(Boolean).join(' ')
  for (const h of RULES.heuristics) {
    if (h.match.some((kw) => hay.includes(kw))) return h.attrs
  }
  // 小类覆盖（用户自定义）
  if (info.sub && RULES.subOverrides[info.sub]) return RULES.subOverrides[info.sub].attrs || RULES.defaultAttrs
  return RULES.defaultAttrs
}

// 返回该小类需要结构化的「特征参数」名称列表（用于型号规格结构化提取）
//
// 无声明一律返回 []（不介入），绝不退回全局默认参数集：
//   默认集（型号/直径/螺纹/长度/颜色/材质）套到计算机、安防设备、软件、其它器件等
//   小类上会提错参数——实测「TE 1mm^2 黄色」被提成「长度=1mm」（实为导线截面）、
//   「NPEXA-CM31」被提成「材质=PE」（型号字母被当聚乙烯）、「Φ4平方毫米」被提成「直径=4」。
//   错误参数会污染「物料特征」视图与一物多号对比页的参数列（制造假差异、误导人工复核）。
//   无规则的小类由界面明确提示「校验规则待完善」，等范式库补齐声明后再启用。
export function chooseTokens(info) {
  if (!info) return []
  const hay = [info.subName, info.midName, info.bigName].filter(Boolean).join(' ')
  let base = null
  for (const h of RULES.heuristics) {
    if (h.match.some((kw) => hay.includes(kw)) && Array.isArray(h.tokens)) { base = h.tokens; break }
  }
  // 小类级显式声明（subOverrides）优先于兜底；这是人工确认过的「该小类确实要这些参数」
  if (!base && info.sub && RULES.subOverrides[info.sub] && Array.isArray(RULES.subOverrides[info.sub].tokens))
    base = RULES.subOverrides[info.sub].tokens
  if (!base) return []

  // 小类级**增量**参数（subAddTokens）：不覆盖 heuristic / subOverrides，只做追加。
  // 用于「只有这几个小类需要某参数」的情况，避免改了 heuristic 影响同族其他小类。
  // 例：100101-100104 的模板含 {壳架}，但同族的 100105 微型断路器没有，不该加。
  const extra = (RULES.subAddTokens || {})[info.sub]
  if (Array.isArray(extra) && extra.length) {
    const out = base.slice()
    for (const t of extra) if (!out.includes(t)) out.push(t)
    return out
  }
  return base
}

// 给一条物料记录附加分类信息 + 查重属性
export function enrich(rec) {
  const info = getCategory(rec.SUBPREFIX)
  const attrs = chooseAttrs(info)
  return {
    ...rec,
    CATEGORY: info,
    DEDUP_ATTRS: attrs,
  }
}

export { MAP, RULES }

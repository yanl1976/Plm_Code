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
export function chooseTokens(info) {
  if (!info) return []
  const hay = [info.subName, info.midName, info.bigName].filter(Boolean).join(' ')
  for (const h of RULES.heuristics) {
    if (h.match.some((kw) => hay.includes(kw)) && Array.isArray(h.tokens)) return h.tokens
  }
  if (info.sub && RULES.subOverrides[info.sub] && Array.isArray(RULES.subOverrides[info.sub].tokens))
    return RULES.subOverrides[info.sub].tokens
  return RULES.defaultTokens || []
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

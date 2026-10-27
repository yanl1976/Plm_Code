/**
 * 中类(mid)标准有序「特征参数模板」生成与管理。
 * 分类体系：大类(2位) → 中类(2位，在大类内唯一) → 小类(6位 = 大类2位+中类2位+序号2位)。
 * 关键：中类码在不同大类下会重复（电气01=断路器 / 原材料01=黑色金属 / 配套01=紧固件），
 *       故中类的唯一标识取「小类前4位 = 大类2位+中类2位」（与编码规则一致，与原分类树三级一一对应）。
 * 数据源：classification-map.json（小类→中类/大类 名称与层级）+ dedup-rules.json（heuristics 命中 token）
 *        + spec-fields.json（order 主序列 + library 全集）。
 * 产出：src/config/feature-templates.json = { version, canonicalOrder, templates:{ 前4位:{midKey,big,bigName,midName,subCount,subs,params:[...]} } }
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONFIG = path.join(ROOT, 'src', 'config')
const TPL_FILE = path.join(CONFIG, 'feature-templates.json')

function readJson(p) {
  if (!fs.existsSync(p)) return null
  return JSON.parse(fs.readFileSync(p, 'utf8'))
}

// 由配置重新生成全部中类模板（纯函数，不写盘）
export function buildTemplates() {
  const map = readJson(path.join(CONFIG, 'classification-map.json')) || {}
  const rules = readJson(path.join(CONFIG, 'dedup-rules.json')) || {}
  const fields = readJson(path.join(CONFIG, 'spec-fields.json')) || {}
  const canonicalOrder = Array.isArray(fields.order) ? fields.order : []
  const heuristics = Array.isArray(rules.heuristics) ? rules.heuristics : []
  const defaultTokens = Array.isArray(rules.defaultTokens) ? rules.defaultTokens : []

  // 按「中类」（小类前4位 = 大类2位+中类2位）聚合，避免跨大类中类码重复导致混淆
  const midGroups = new Map()
  for (const [sub, info] of Object.entries(map)) {
    const key4 = String(sub).slice(0, 4)
    if (!midGroups.has(key4)) {
      midGroups.set(key4, { key4, big: info.big, bigName: info.bigName, midName: info.midName, subs: [] })
    }
    midGroups.get(key4).subs.push({ sub, subName: info.subName })
  }

  const templates = {}
  for (const [key4, g] of midGroups) {
    const tokenSet = new Set()
    let matchedAny = false
    for (const s of g.subs) {
      const info = map[s.sub]
      const hay = [s.subName, info.midName, info.bigName].filter(Boolean).join(' ')
      for (const h of heuristics) {
        if (Array.isArray(h.match) && h.match.some((kw) => hay.includes(kw)) && Array.isArray(h.tokens)) {
          matchedAny = true
          h.tokens.forEach((t) => tokenSet.add(t))
        }
      }
    }
    if (!matchedAny) defaultTokens.forEach((t) => tokenSet.add(t))
    // 按 canonicalOrder 排序；不在主序列中的参数追加到末尾（保持并集出现顺序）
    const seen = new Set()
    const ordered = []
    for (const name of canonicalOrder) if (tokenSet.has(name)) { ordered.push(name); seen.add(name) }
    for (const name of tokenSet) if (!seen.has(name)) ordered.push(name)
    // 把「附加参数」(defaultExtra：订货号/其它等) 直接并入标准参数池：统一管理、共享候选、统一填报
    const defaults = Array.isArray(fields.defaultExtra) ? fields.defaultExtra : []
    for (const name of defaults) if (!seen.has(name)) { ordered.push(name); seen.add(name) }
    templates[key4] = {
      midKey: key4, big: g.big, bigName: g.bigName, midName: g.midName,
      subCount: g.subs.length, subs: g.subs.map((x) => ({ code: x.sub, name: x.subName })),
      candidates: ordered, // 该中类相关候选参数全集（命中 heuristics + 默认兜底 + 附加参数），供"添加参数"时过滤，不混入其他大类参数
      params: ordered,
    }
  }
  return { version: 'v1', canonicalOrder, generatedAt: new Date().toISOString(), templates }
}

// 按「大类 → 中类 → 小类」三级树组织，供 UI 导航（与原分类树一致）
export function buildTree(templates) {
  const bigMap = new Map()
  for (const t of Object.values(templates)) {
    if (!bigMap.has(t.big)) bigMap.set(t.big, { big: t.big, bigName: t.bigName, mids: [] })
    bigMap.get(t.big).mids.push({
      midKey: t.midKey, midName: t.midName, subCount: t.subCount,
      subs: (t.subs || []).map((x) => ({ code: x.code, name: x.name })),
    })
  }
  return [...bigMap.values()].sort((a, b) => String(a.big).localeCompare(String(b.big)))
    .map((g) => ({ ...g, mids: g.mids.sort((x, y) => String(x.midKey).localeCompare(String(y.midKey))) }))
}

// 仅重建某个中类（复位默认用）
export function rebuildMid(templates, midKey) {
  const all = buildTemplates()
  if (!all.templates[midKey]) return templates
  const oldSub = templates.templates[midKey] && templates.templates[midKey].subParams
  templates.templates[midKey] = all.templates[midKey]
  if (oldSub) templates.templates[midKey].subParams = oldSub // 复位中类默认时保留小类独立定制
  templates.generatedAt = new Date().toISOString()
  return templates
}

export function loadTemplates() {
  const t = readJson(TPL_FILE)
  if (t && t.templates) { if (!t.customParams) t.customParams = {}; return t }
  const gen = buildTemplates(); gen.customParams = {}; return gen
}

export function saveTemplates(obj) {
  if (!obj.templates) throw new Error('templates 字段缺失')
  fs.writeFileSync(TPL_FILE, JSON.stringify(obj, null, 2) + '\n', 'utf8')
  return obj
}

// 按中类私有的自定义参数名（用户新增，仅作用于该中类/其下小类，不共享同大类其它中类）
export function addCustomParam(templates, midKey, name) {
  const k = String(midKey)
  templates.customParams = templates.customParams || {}
  if (!templates.customParams[k]) templates.customParams[k] = []
  if (!templates.customParams[k].includes(name)) templates.customParams[k].push(name)
  return templates
}
// 从某中类的自定义参数池中删除某项（仅移除候选，不波及已加入该中类 params 的值）
export function removeCustomParam(templates, midKey, name) {
  const k = String(midKey)
  if (!templates.customParams || !templates.customParams[k]) return templates
  templates.customParams[k] = templates.customParams[k].filter((x) => x !== name)
  if (templates.customParams[k].length === 0) delete templates.customParams[k]
  return templates
}

// CLI 用：生成并落盘（保留已有的大类级自定义参数，不覆盖）
export function generateAndSave() {
  const old = readJson(TPL_FILE)
  const t = buildTemplates()
  t.customParams = (old && old.customParams) || {}
  // 整体重建时保留各中类的小类独立参数定制（subParams）
  if (old && old.templates) {
    for (const [k, tmpl] of Object.entries(t.templates)) {
      const oldSub = old.templates[k] && old.templates[k].subParams
      if (oldSub) tmpl.subParams = oldSub
    }
  }
  saveTemplates(t)
  const n = Object.keys(t.templates).length
  return { mids: n, params: Object.values(t.templates).reduce((s, x) => s + x.params.length, 0) }
}

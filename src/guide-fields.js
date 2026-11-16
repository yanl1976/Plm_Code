/**
 * 范式库字段 → 参数库参数名 的翻译 + 完备度审计。
 *
 * 为什么需要这一层：
 *   范式库（naming-guide.json）按 209 个小类声明"规格该写哪些字段"，
 *   但字段名是人读的（机型 / 关键参数 / 准确度等级 / 输出信号 …），
 *   与参数库（spec-fields.json）的标准参数名不一致；
 *   直接改范式库的 key 会改变前端范式展示、Excel 导出与 PLM 端范式提醒，故改为只读翻译。
 *
 * 边界（很重要）：
 *   - 本层只做"翻译 + 审计"，不参与运行时取数；
 *   - 某个小类实际提取哪些参数，仍由 dedup-rules.json 的 heuristics / subOverrides 决定；
 *   - 因此本层不改变任何现有提示，只用于"能不能给某个小类声明 tokens"的判断依据。
 *
 * 完备度三态：
 *   params   —— 范式字段在参数库里有对应参数（可落地）
 *   nameOnly —— 该字段属于名称/描述（产品名称、设备类型…），本就不该做成参数
 *   pending  —— 范式要求但参数库尚无对应参数（需新增参数，明确待办，不是遗漏）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getCategory, chooseTokens } from './classify.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const P_GUIDE = path.join(ROOT, 'src', 'config', 'naming-guide.json')
const P_FMAP = path.join(ROOT, 'src', 'config', 'guide-field-map.json')

const cache = { guide: null, guideMt: 0, fmap: null, fmapMt: 0 }

function readJsonCached(file, key) {
  try {
    const mt = fs.statSync(file).mtimeMs
    const mk = key + 'Mt'
    if (cache[key] && cache[mk] === mt) return cache[key]
    cache[key] = JSON.parse(fs.readFileSync(file, 'utf8'))
    cache[mk] = mt
    return cache[key]
  } catch (e) {
    return key === 'guide' ? { subs: {} } : { alias: {}, nameOnly: [], pending: [] }
  }
}

export function loadGuide() { return readJsonCached(P_GUIDE, 'guide') }
export function loadFieldMap() { return readJsonCached(P_FMAP, 'fmap') }

/** 单个小类：范式字段 → 参数名 / 名称类 / 待补 */
export function paramsOfSub(sub) {
  const s = String(sub || '').trim().slice(0, 6)
  const it = (loadGuide().subs || {})[s]
  const fmap = loadFieldMap()
  if (!it) return { sub: s, known: false, fields: [], params: [], nameOnly: [], pending: [] }
  const alias = fmap.alias || {}
  const nameOnlyKeys = new Set(fmap.nameOnly || [])
  const out = { sub: s, subName: it.subName || '', known: true, fields: [], params: [], nameOnly: [], pending: [] }
  for (const f of it.fields || []) {
    const k = String(f.key || '').trim()
    if (!k) continue
    out.fields.push(k)
    if (alias[k]) { if (!out.params.includes(alias[k])) out.params.push(alias[k]) }
    else if (nameOnlyKeys.has(k)) out.nameOnly.push(k)
    else out.pending.push(k)
  }
  return out
}

/**
 * 全库完备度审计（纯配置层，不读物料数据）。
 * @returns {{total:number, fully:Array, partial:Array, noFields:Array, readyToEnable:Array, enabledNoGuide:Array, drift:Array}}
 */
export function audit() {
  const subs = Object.keys(loadGuide().subs || {})
  const fully = []      // 范式字段全部能落到现有参数
  const partial = []    // 部分能落（其余 pending）
  const noFields = []   // 范式库没写 fields
  const readyToEnable = [] // 可完全落地、但当前还没声明 tokens（chooseTokens 为空）
  const enabledNoGuide = [] // 已声明 tokens，但范式库没声明字段（无从校验）
  const drift = []      // 已声明 tokens 与范式字段不一致（多配/漏配）

  for (const sub of subs) {
    const info = paramsOfSub(sub)
    const infoCat = getCategory(sub)
    const tokens = chooseTokens(infoCat)
    if (!info.fields.length) { noFields.push(sub); if (tokens.length) enabledNoGuide.push({ sub, tokens }); continue }
    if (!info.pending.length) {
      fully.push(info)
      if (!tokens.length) readyToEnable.push({ sub, subName: info.subName, params: info.params })
    } else {
      partial.push({ ...info, mappable: info.params.length })
    }
    if (tokens.length) {
      const missing = info.params.filter((p) => !tokens.includes(p))
      const extra = tokens.filter((t) => !info.params.includes(t))
      if (missing.length || extra.length) drift.push({ sub, subName: info.subName, missing, extra })
    }
  }
  return {
    total: subs.length,
    fully: fully.length,
    partial: partial.length,
    noFields: noFields.length,
    fullyList: fully.map((x) => ({ sub: x.sub, subName: x.subName, params: x.params })),
    partialTop: partial.sort((a, b) => b.mappable - a.mappable).slice(0, 30),
    readyToEnable,
    enabledNoGuide,
    drift,
  }
}

export default { loadGuide, loadFieldMap, paramsOfSub, audit }

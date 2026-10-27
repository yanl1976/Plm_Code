/**
 * 人工填报层持久化（按 FNUMBER 覆盖规则提取结果）。
 * 数据文件：data/feature-overrides.json = { [FNUMBER]: { mid, params:{名:值}, custom:[{name,value}], by, at } }
 * 与 applyAiOverlay 并列，最终经 applyHumanOverlay 合入物料特征参数。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'data')
const FILE = path.join(DATA, 'feature-overrides.json')

// Windows 下偶发 EBUSY，重试落盘
export function safeWrite(file, data) {
  const tmp = file + '.tmp'
  let lastErr = null
  for (let i = 0; i < 5; i++) {
    try {
      fs.writeFileSync(tmp, data, 'utf8')
      fs.renameSync(tmp, file)
      return
    } catch (e) {
      lastErr = e
      if (e.code === 'EBUSY' && i < 4) continue
      throw e
    }
  }
  throw lastErr
}

let cache = null
export function loadOverrides() {
  if (cache) return cache
  if (!fs.existsSync(FILE)) { cache = {}; return cache }
  try { cache = JSON.parse(fs.readFileSync(FILE, 'utf8')) } catch { cache = {} }
  return cache
}

export function getOverride(fnumber) {
  return loadOverrides()[fnumber] || null
}

export function saveOverride(fnumber, { mid, params = {}, custom = [], by = 'web', model = '' }) {
  const all = loadOverrides()
  const cur = all[fnumber] || {}
  all[fnumber] = {
    mid: mid || cur.mid || '',
    params: { ...(cur.params || {}), ...params },
    custom: custom && custom.length ? custom : (cur.custom || []),
    model: model || cur.model || '',
    by, at: new Date().toISOString(),
  }
  cache = all
  safeWrite(FILE, JSON.stringify(all, null, 2) + '\n')
  return all[fnumber]
}

export function deleteOverride(fnumber) {
  const all = loadOverrides()
  if (!all[fnumber]) return false
  delete all[fnumber]
  cache = all
  safeWrite(FILE, JSON.stringify(all, null, 2) + '\n')
  return true
}

// 批量预填：把规则提取结果写为初始覆盖（仅写入非空值，custom 保留）
export function bulkPrefill(entries) {
  const all = loadOverrides()
  for (const e of entries) {
    if (!e.fnumber) continue
    const cur = all[e.fnumber] || {}
    const params = { ...(cur.params || {}) }
    for (const [k, v] of Object.entries(e.params || {})) {
      if (v != null && String(v).trim() !== '') params[k] = v
    }
    all[e.fnumber] = {
      mid: e.mid || cur.mid || '',
      params,
      custom: (cur.custom && cur.custom.length) ? cur.custom : (e.custom || []),
      by: e.by || 'web', at: new Date().toISOString(),
    }
  }
  cache = all
  safeWrite(FILE, JSON.stringify(all, null, 2) + '\n')
  return entries.length
}

export function overrideMtime() {
  return fs.existsSync(FILE) ? fs.statSync(FILE).mtimeMs : 0
}

export function invalidate() { cache = null }

// 统计某中类(midKey)下，有多少物料已给某参数名赋过非空值（删除参数定义前的风险评估，防止静默丢失物料已录入值）
export function countParamUsage(midKey, name) {
  const mk = String(midKey)
  const all = loadOverrides()
  let cnt = 0
  for (const o of Object.values(all)) {
    if (!o || String(o.mid) !== mk) continue
    const v = o.params && o.params[name]
    if (v !== undefined && v !== null && String(v).trim() !== '') cnt++
  }
  return cnt
}

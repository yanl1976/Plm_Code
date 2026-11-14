/**
 * 数据源开关：控制 ERP / PLM 的启用状态。
 *
 * 配置：src/config/datasource.json（按 mtime 热更新，改完即时生效）
 *
 * 用法：
 *   import { erpEnabled, plmSnapshotFile, erpFallback } from './datasource.js'
 *
 *   if (!erpEnabled()) return []          // ERP 查询直接跳过
 *   const f = plmSnapshotFile()           // 当前该读哪个快照文件
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CFG_FILE = path.join(ROOT, 'src', 'config', 'datasource.json')

const DEFAULTS = {
  erp: {
    enabled: false,
    fallback: {
      inventory: 'empty',
      unit: 'id',
      stock: 'id',
      project: 'skip',
      onlineDedup: 'skip',
      fingerprint: 'plm',
    },
  },
  plm: {
    enabled: true,
    snapshot: 'data/materials-merged.ndjson',
    fallbackSnapshot: 'data/materials-plm.ndjson',
  },
}

let cache = null
let cacheMtime = 0

/** 读取配置（按 mtime 缓存，改文件后自动生效） */
export function loadDatasource() {
  try {
    const st = fs.statSync(CFG_FILE)
    if (!cache || st.mtimeMs !== cacheMtime) {
      const raw = JSON.parse(fs.readFileSync(CFG_FILE, 'utf8'))
      cache = {
        erp: { ...DEFAULTS.erp, ...(raw.erp || {}), fallback: { ...DEFAULTS.erp.fallback, ...((raw.erp || {}).fallback || {}) } },
        plm: { ...DEFAULTS.plm, ...(raw.plm || {}) },
      }
      cacheMtime = st.mtimeMs
    }
  } catch (e) {
    if (!cache) cache = JSON.parse(JSON.stringify(DEFAULTS))
  }
  return cache
}

/** ERP 数据库是否允许访问（默认 false） */
export function erpEnabled() {
  return !!(loadDatasource().erp || {}).enabled
}

/** PLM 数据是否启用 */
export function plmEnabled() {
  return (loadDatasource().plm || {}).enabled !== false
}

/** ERP 关闭时某功能的降级方式：'empty' | 'id' | 'skip' | 'plm' */
export function erpFallback(key) {
  const fb = (loadDatasource().erp || {}).fallback || {}
  return fb[key] || DEFAULTS.erp.fallback[key] || 'skip'
}

/** 当前该用的快照文件（绝对路径）；合并快照不存在时回退 PLM 原始快照 */
export function plmSnapshotFile() {
  const c = loadDatasource().plm || {}
  const merged = path.join(ROOT, c.snapshot || DEFAULTS.plm.snapshot)
  try {
    if (fs.statSync(merged).size > 0) return merged
  } catch (e) { /* 不存在 */ }
  return path.join(ROOT, c.fallbackSnapshot || DEFAULTS.plm.fallbackSnapshot)
}

/** 供健康检查/页面展示的一行摘要 */
export function datasourceSummary() {
  const c = loadDatasource()
  return {
    erp: !!c.erp.enabled,
    plm: c.plm.enabled !== false,
    snapshot: plmSnapshotFile(),
    fallback: c.erp.fallback,
  }
}

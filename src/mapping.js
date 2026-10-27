/**
 * 存量一物多号清洗：映射法（旧编码 -> 主编码）+ 冷冻法（标记不再使用）。
 * 数据落盘在 data/ ，不依赖数据库写权限，先建映射关系供人工/PLM 侧落地。
 *
 * mapping.json 结构：
 *   { "旧FNUMBER": { "to": "主FNUMBER", "reason": "...", "method": "merge", "by": "...", "at": "ISO时间" } }
 * freeze.json 结构：
 *   { "FNUMBER": { "reason": "...", "by": "...", "at": "ISO时间" } }
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'data')
const MAP_FILE = path.join(DATA_DIR, 'mapping.json')
const FREEZE_FILE = path.join(DATA_DIR, 'freeze.json')

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback
  try { return JSON.parse(fs.readFileSync(file, 'utf8')) } catch { return fallback }
}
function writeJson(file, obj) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8')
}

export function loadMapping() { return readJson(MAP_FILE, {}) }
export function loadFreeze() { return readJson(FREEZE_FILE, {}) }

export function addMapping(oldNo, newNo, { reason = '', by = 'cli', method = 'merge' } = {}) {
  if (!oldNo || !newNo) throw new Error('oldNo 与 newNo 均必填')
  if (oldNo === newNo) throw new Error('旧编码不能等于主编码')
  const m = loadMapping()
  m[oldNo] = { to: newNo, reason, method, by, at: new Date().toISOString() }
  writeJson(MAP_FILE, m)
  return m
}

export function removeMapping(oldNo) {
  const m = loadMapping()
  delete m[oldNo]
  writeJson(MAP_FILE, m)
  return m
}

export function freeze(no, { reason = '', by = 'cli' } = {}) {
  const f = loadFreeze()
  f[no] = { reason, by, at: new Date().toISOString() }
  writeJson(FREEZE_FILE, f)
  return f
}

export function unfreeze(no) {
  const f = loadFreeze()
  delete f[no]
  writeJson(FREEZE_FILE, f)
  return f
}

// 校验映射：无环、主编码存在（需传入已知编码集合）、无冲突
export function validateMapping(knownNumbers) {
  const m = loadMapping()
  const errors = []
  const checkExists = knownNumbers instanceof Set
  for (const [oldNo, v] of Object.entries(m)) {
    if (checkExists && !knownNumbers.has(v.to)) errors.push(`主编码 ${v.to} 不存在`)
    // 环检测
    let cur = v.to, seen = new Set([oldNo])
    while (m[cur]) {
      if (seen.has(cur)) { errors.push(`映射存在环: ${oldNo} -> ... -> ${cur}`); break }
      seen.add(cur); cur = m[cur].to
    }
  }
  return { ok: errors.length === 0, errors, count: Object.keys(m).length }
}

// 将全部物料按映射归并到主编码，输出统一视图（供下游消费 / 复核）
export async function buildUnified() {
  const NDJSON = path.join(DATA_DIR, 'materials.ndjson')
  if (!fs.existsSync(NDJSON)) throw new Error('未找到 materials.ndjson，请先 extract')
  const m = loadMapping()
  const freeze = loadFreeze()
  // 解析映射链 -> 最终主编码
  const resolve = (no) => {
    let cur = no, guard = 0
    while (m[cur] && guard++ < 20) cur = m[cur].to
    return cur
  }
  const unified = new Map() // canonicalNo -> { canonicalNo, names:Set, specs:Set, orgs:Set, frozen, sources:[oldNo] }
  const rl = (await import('readline')).default.createInterface({ input: fs.createReadStream(NDJSON, 'utf8'), crlfDelay: Infinity })
  for await (const line of rl) {
    if (!line.trim()) continue
    let rec
    try { rec = JSON.parse(line) } catch { continue }
    const canon = resolve(rec.FNUMBER)
    if (!unified.has(canon)) unified.set(canon, { canonicalNo: canon, names: new Set(), specs: new Set(), orgs: new Set(), frozen: !!freeze[canon], sources: new Set() })
    const u = unified.get(canon)
    if (rec.FNAME) u.names.add(rec.FNAME)
    if (rec.FSPECIFICATION) u.specs.add(rec.FSPECIFICATION)
    if (rec.FUSEORGID != null) u.orgs.add(rec.FUSEORGID)
    u.sources.add(rec.FNUMBER)
  }
  const out = []
  for (const [no, u] of unified) {
    out.push({ canonicalNo: no, name: [...u.names].join(' / '), specs: [...u.specs], orgCount: u.orgs.size, sourceCount: u.sources.size, frozen: u.frozen, mergedFrom: [...u.sources].filter((s) => s !== no) })
  }
  out.sort((a, b) => b.sourceCount - a.sourceCount)
  const file = path.join(DATA_DIR, 'unified-materials.json')
  fs.writeFileSync(file, JSON.stringify(out, null, 2), 'utf8')
  const merged = out.filter((o) => o.mergedFrom.length > 0)
  console.log(`统一视图: ${out.length} 个主编码，其中 ${merged.length} 个由多编码归并；输出 ${file}`)
  return out
}

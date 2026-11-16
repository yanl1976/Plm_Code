/**
 * 系统数据备份与选择性恢复。
 *
 * 覆盖的「库」：
 *   同义词字典 / 国标命名范式库 / 命名与查重规则 / 分类体系 /
 *   特征模板与字段语义 / 标准查新清单 / 选型库 / 系统设置
 *
 * 落盘：data/backups/<时间戳>/（data 被 gitignore，备份不进版本库）
 *   <时间戳>/manifest.json        备份元信息（时间、包含哪些库、文件清单）
 *   <时间戳>/src/config/*.json    按原相对路径存放，恢复时原样拷回
 *   <时间戳>/data/selection/...   目录型库同样按相对路径存放
 *
 * 安全约束：
 *   ① 只允许操作 LIBS 白名单里的路径，杜绝任意路径读写
 *   ② 恢复前自动生成「恢复前快照」，误操作可回退
 *   ③ 支持 dryRun 预览，不落盘
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BACKUP_DIR = path.join(ROOT, 'data', 'backups')

/** 目录型库复制时要跳过的子目录（历史版本，体积大且可重建） */
const SKIP_DIRS = new Set(['.history', 'uploading', 'backups'])

/**
 * 可备份的库清单。
 * kind: file=单文件 / files=多文件 / dir=整个目录
 * path(s): 相对 ROOT 的路径，同时决定备份内的存放结构
 */
export const LIBS = [
  { key: 'synonyms', name: '名称同义词字典', desc: '非标准叫法 → 标准名称映射', kind: 'file', path: 'src/config/name-synonyms.json' },
  { key: 'guide', name: '国标命名范式库', desc: '209 个小类的标准写法、引用标准、示例', kind: 'file', path: 'src/config/naming-guide.json' },
  {
    key: 'rules', name: '命名与查重规则', desc: '命名格式规则、查重级别、跨小类阈值',
    kind: 'files', paths: ['src/config/material-rules.json', 'src/config/dedup-rules.json'],
  },
  {
    key: 'classify', name: '分类体系', desc: '大类/中类/小类树与映射',
    kind: 'files', paths: ['src/config/classification.json', 'src/config/classification-map.json'],
  },
  {
    key: 'feature', name: '特征模板与字段语义', desc: '规格参数字段定义、型号语义解析',
    kind: 'files', paths: ['src/config/feature-templates.json', 'src/config/spec-fields.json', 'src/config/model-semantics.json'],
  },
  { key: 'std', name: '标准查新清单', desc: '国标/行标版本跟踪', kind: 'file', path: 'src/config/std-watch.json' },
  { key: 'selection', name: '选型库', desc: '按小类组织的选型手册与系列数据', kind: 'dir', path: 'data/selection' },
  {
    key: 'settings', name: '系统设置', desc: '提取范围、筛查组织、数据源开关',
    kind: 'files', paths: ['src/config/settings.json', 'src/config/datasource.json'],
  },
]

function libByKey(key) {
  return LIBS.find((x) => x.key === key) || null
}

/** 库涉及的文件绝对路径列表 */
function filesOf(lib) {
  if (!lib) return []
  if (lib.kind === 'file') return [path.join(ROOT, lib.path)]
  if (lib.kind === 'files') return (lib.paths || []).map((p) => path.join(ROOT, p))
  return [path.join(ROOT, lib.path)]
}

/** 递归收集目录下文件（跳过 SKIP_DIRS） */
function walkFiles(dir, out, relBase) {
  let list = []
  try { list = fs.readdirSync(dir, { withFileTypes: true }) } catch (e) { return }
  for (const e of list) {
    if (SKIP_DIRS.has(e.name)) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      walkFiles(p, out, relBase)
    } else if (e.isFile()) {
      out.push({ abs: p, rel: path.relative(relBase, p) })
    }
  }
}

/** 单个库的体积与条数（条数仅对 JSON 有意义） */
export function statLib(lib) {
  let bytes = 0
  let files = 0
  let rows = 0
  let exists = false
  if (lib.kind === 'dir') {
    const abs = path.join(ROOT, lib.path)
    const out = []
    walkFiles(abs, out, path.join(ROOT, lib.path))
    if (out.length) exists = true
    for (const f of out) {
      try { bytes += fs.statSync(f.abs).size } catch (e) { }
      files++
    }
    rows = files
  } else {
    for (const abs of filesOf(lib)) {
      try {
        const st = fs.statSync(abs)
        bytes += st.size
        files++
        exists = true
        if (/\.json$/i.test(abs)) {
          try {
            const j = JSON.parse(fs.readFileSync(abs, 'utf8'))
            rows += countRows(j)
          } catch (e) { /* 非计数用途，忽略 */ }
        }
      } catch (e) { /* 文件不存在 */ }
    }
  }
  return { key: lib.key, name: lib.name, desc: lib.desc, kind: lib.kind, exists, files, bytes, rows }
}

/** 粗略统计 JSON 里的条目数：数组取长度；对象取键数（含一层 subs 之类的容器） */
function countRows(j) {
  if (Array.isArray(j)) return j.length
  if (!j || typeof j !== 'object') return 0
  let n = 0
  for (const k of Object.keys(j)) {
    const v = j[k]
    if (Array.isArray(v)) n += v.length
    else if (v && typeof v === 'object') n += Object.keys(v).length
    else n += 1
  }
  return n
}

/** 全部库的当前状态 */
export function listLibs() {
  const libs = LIBS.map((lib) => {
    const st = statLib(lib)
    // 附带「最近一次备份是否含此库」的提示由前端从 listBackups 里判断
    return st
  })
  let lastBackupAt = null
  try {
    const dirs = fs.readdirSync(BACKUP_DIR, { withFileTypes: true }).filter((e) => e.isDirectory())
    if (dirs.length) {
      const latest = dirs.map((e) => e.name).sort().pop()
      const m = readManifest(latest)
      if (m) lastBackupAt = m.at
    }
  } catch (e) { /* 备份目录不存在 */ }
  return { libs, lastBackupAt, backupDir: BACKUP_DIR }
}

function tsName() {
  const d = new Date()
  const p = (n, w) => String(n).padStart(w || 2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${p(d.getMilliseconds(), 3)}`
}

function readManifest(id) {
  try {
    return JSON.parse(fs.readFileSync(path.join(BACKUP_DIR, id, 'manifest.json'), 'utf8'))
  } catch (e) { return null }
}

function copyInto(dir, abs, rel) {
  const dest = path.join(dir, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(abs, dest)
}

/**
 * 创建备份
 * @param {string[]} keys 要备份的库 key；空数组 = 全部
 * @param {{tag?:string}} [opt] tag 用于备注（如 before-restore / manual）
 */
export function createBackup(keys, opt) {
  const o = opt || {}
  const want = (Array.isArray(keys) && keys.length ? keys : LIBS.map((x) => x.key))
    .filter((k) => libByKey(k))
  if (!want.length) return { ok: false, error: '没有可备份的库' }

  const id = tsName()
  const dir = path.join(BACKUP_DIR, id)
  fs.mkdirSync(dir, { recursive: true })

  const included = []
  const entries = []
  for (const k of want) {
    const lib = libByKey(k)
    const st = statLib(lib)
    if (!st.exists) continue
    if (lib.kind === 'dir') {
      const abs = path.join(ROOT, lib.path)
      const out = []
      walkFiles(abs, out, path.join(ROOT, lib.path))
      for (const f of out) copyInto(dir, f.abs, f.rel)
    } else {
      for (const abs of filesOf(lib)) {
        if (!fs.existsSync(abs)) continue
        copyInto(dir, abs, path.relative(ROOT, abs))
      }
    }
    included.push(k)
    entries.push({ key: k, name: lib.name, files: st.files, bytes: st.bytes })
  }

  if (!included.length) {
    try { fs.rmSync(dir, { recursive: true, force: true }) } catch (e) { }
    return { ok: false, error: '所选库均不存在，未生成备份' }
  }

  const manifest = {
    id,
    at: new Date().toISOString(),
    tag: String(o.tag || 'manual'),
    keys: included,
    entries,
    totalBytes: entries.reduce((s, x) => s + x.bytes, 0),
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8')
  return { ok: true, ...manifest }
}

/** 备份列表（新的在前） */
export function listBackups() {
  let dirs = []
  try {
    dirs = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
      .reverse()
  } catch (e) { return [] }

  return dirs.map((id) => {
    const m = readManifest(id)
    if (!m) return { id, ok: false, note: 'manifest 缺失或损坏' }
    let bytes = 0
    try {
      const out = []
      walkFiles(path.join(BACKUP_DIR, id), out, path.join(BACKUP_DIR, id))
      for (const f of out) { try { bytes += fs.statSync(f.abs).size } catch (e) { } }
    } catch (e) { }
    return { id, at: m.at, tag: m.tag, keys: m.keys, entries: m.entries, bytes }
  })
}

/** 备份详情：含每个文件的大小 */
export function backupDetail(id) {
  const m = readManifest(id)
  if (!m) return { ok: false, error: '备份不存在或 manifest 损坏' }
  const out = []
  walkFiles(path.join(BACKUP_DIR, id), out, path.join(BACKUP_DIR, id))
  const files = out
    .map((f) => ({ rel: f.rel.replace(/\\/g, '/'), bytes: (() => { try { return fs.statSync(f.abs).size } catch (e) { return 0 } })() }))
    .filter((f) => f.rel !== 'manifest.json')
    .sort((a, b) => a.rel.localeCompare(b.rel))
  return { ok: true, ...m, files }
}

/**
 * 选择性恢复
 * @param {string} id 备份 ID
 * @param {string[]} keys 要恢复的库；空 = 该备份里的全部
 * @param {{dryRun?:boolean, snapshot?:boolean}} [opt]
 *        dryRun=true 只返回将要覆盖哪些文件，不落盘
 *        snapshot=false 跳过「恢复前快照」（默认会做）
 */
export function restore(id, keys, opt) {
  const o = opt || {}
  const m = readManifest(id)
  if (!m) return { ok: false, error: '备份不存在或 manifest 损坏' }

  const srcDir = path.join(BACKUP_DIR, id)
  const want = (Array.isArray(keys) && keys.length ? keys : m.keys)
    .filter((k) => m.keys.indexOf(k) >= 0 && libByKey(k))
  if (!want.length) return { ok: false, error: '所选库不在该备份中' }

  // 收集要恢复的文件：备份内相对路径 → 白名单校验 → 目标绝对路径
  const plan = []
  const allTargets = []
  for (const k of want) {
    const lib = libByKey(k)
    if (lib.kind === 'dir') {
      const prefix = lib.path.replace(/\\/g, '/') + '/'
      const out = []
      walkFiles(srcDir, out, srcDir)
      for (const f of out) {
        const rel = f.rel.replace(/\\/g, '/')
        if (!rel.startsWith(prefix)) continue
        const dest = path.join(ROOT, rel)
        plan.push({ key: k, rel, dest, bytes: (() => { try { return fs.statSync(f.abs).size } catch (e) { return 0 } })() })
        allTargets.push(dest)
      }
    } else {
      for (const abs of filesOf(lib)) {
        const rel = path.relative(ROOT, abs).replace(/\\/g, '/')
        const src = path.join(srcDir, rel)
        if (!fs.existsSync(src)) continue
        plan.push({ key: k, rel, dest: abs, bytes: (() => { try { return fs.statSync(src).size } catch (e) { return 0 } })() })
        allTargets.push(abs)
      }
    }
  }

  // 路径白名单：目标必须落在某个库的合法路径内
  const allowed = new Set()
  for (const lib of LIBS) {
    if (lib.kind === 'dir') allowed.add(path.join(ROOT, lib.path))
    else for (const abs of filesOf(lib)) allowed.add(abs)
  }
  for (const p of plan) {
    const inAllowed = [...allowed].some((a) => p.dest === a || p.dest.startsWith(a + path.sep))
    if (!inAllowed) return { ok: false, error: '非法恢复路径：' + p.rel }
  }

  if (o.dryRun) {
    return { ok: true, dryRun: true, id, keys: want, files: plan, count: plan.length }
  }

  // 恢复前快照：把即将被覆盖的库先备份一次
  let pre = null
  if (o.snapshot !== false) {
    try { pre = createBackup(want, { tag: 'before-restore' }) } catch (e) { pre = null }
  }

  const restored = []
  let bytes = 0
  for (const p of plan) {
    try {
      fs.mkdirSync(path.dirname(p.dest), { recursive: true })
      fs.copyFileSync(path.join(srcDir, p.rel), p.dest)
      restored.push(p.rel)
      bytes += p.bytes
    } catch (e) {
      return { ok: false, error: '写入失败：' + p.rel + '（' + (e && e.message) + '）', restored }
    }
  }

  return {
    ok: true,
    id,
    keys: want,
    restored,
    count: restored.length,
    bytes,
    preSnapshot: pre && pre.ok ? pre.id : null,
  }
}

/** 删除备份 */
export function deleteBackup(id) {
  if (!/^\d{8}-\d{6}-\d{3}$/.test(String(id || ''))) {
    return { ok: false, error: '备份 ID 非法' }
  }
  const dir = path.join(BACKUP_DIR, id)
  if (!fs.existsSync(dir)) return { ok: false, error: '备份不存在' }
  try {
    fs.rmSync(dir, { recursive: true, force: true })
    return { ok: true, id }
  } catch (e) {
    return { ok: false, error: '删除失败：' + (e && e.message) }
  }
}

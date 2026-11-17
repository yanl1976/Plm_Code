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
    // classification-map 的顶层键就是小类编码，一个小类算一条（不能把小类内的 name/mid 等字段拆开累加）
    count: (files) => Object.keys(files['classification-map.json'] || {}).length,
  },
  {
    key: 'feature', name: '特征模板与字段语义', desc: '规格参数字段定义、型号语义解析、字段映射与黄金样例',
    kind: 'files', paths: [
      'src/config/feature-templates.json',
      'src/config/spec-fields.json',
      'src/config/model-semantics.json',
      // 以下原先漏收录：换机/恢复后会缺型号解码、字段映射与回归样例
      'src/config/brand-decode.json',
      'src/config/cable-codes.json',
      'src/config/guide-field-map.json',
      'src/config/extract-cases.json',
      'src/config/select-field-alias.json',
    ],
    // templates 的键是中类，一个中类算一套模板；canonicalOrder 是字段顺序表，不算业务条目
    count: (files) => {
      const ft = files['feature-templates.json'] || {}
      const sf = files['spec-fields.json'] || {}
      const ms = files['model-semantics.json'] || {}
      return Object.keys(ft.templates || {}).length
        + Object.keys(sf.library || {}).length
        + (Array.isArray(ms.decoders) ? ms.decoders.length : 0)
    },
  },
  { key: 'std', name: '标准查新清单', desc: '国标/行标版本跟踪', kind: 'file', path: 'src/config/std-watch.json' },
  {
    key: 'symbols', name: '字符与单位符号规范',
    desc: '规格中的单位符号统一表（GBK/CP936 兼容，含 must/should 两级替换）',
    kind: 'file', path: 'src/config/spec-symbols.json',
  },
  {
    key: 'paramlib', name: '参数标准库',
    desc: '按小类隔离的参数取值库（录入补全与值校验的来源）+ 启用开关',
    kind: 'files',
    paths: ['src/config/param-standard.json', 'src/config/param-lib-rules.json'],
  },
  { key: 'selection', name: '选型库', desc: '按小类组织的选型手册与系列数据', kind: 'dir', path: 'data/selection' },
  {
    key: 'settings', name: '系统设置', desc: '提取范围、筛查组织、数据源开关',
    kind: 'files', paths: ['src/config/settings.json', 'src/config/datasource.json'],
  },
]

function libByKey(key) {
  return LIBS.find((x) => x.key === key) || null
}

/** 各库「一条」的量词：同义词/规则按条，范式库按小类，标准查新按标准 */
const UNIT = {
  synonyms: '条', guide: '个小类', rules: '条', classify: '个小类',
  feature: '项', std: '个标准', selection: '个文件', settings: '项',
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
    const parsed = {}
    for (const abs of filesOf(lib)) {
      try {
        const st = fs.statSync(abs)
        bytes += st.size
        files++
        exists = true
        if (/\.json$/i.test(abs)) {
          try {
            parsed[path.basename(abs)] = JSON.parse(fs.readFileSync(abs, 'utf8'))
          } catch (e) { /* 单个文件解析失败不影响其它文件统计 */ }
        }
      } catch (e) { /* 文件不存在 */ }
    }
    // 有定制口径就用定制的（如分类体系数小类、特征模板数中类），否则走通用规则
    if (typeof lib.count === 'function') {
      try { rows = Number(lib.count(parsed)) || 0 } catch (e) { rows = 0 }
    } else {
      for (const k of Object.keys(parsed)) rows += countRows(parsed[k])
    }
  }
  return {
    key: lib.key, name: lib.name, desc: lib.desc, kind: lib.kind,
    exists, files, bytes, rows, unit: UNIT[lib.key] || '项',
  }
}

/** 元信息键：不参与业务条目计数 */
const META_KEYS = new Set(['meta', 'version', 'updatedAt', 'description', 'note', 'notes'])

const isPrim = (v) => v == null || typeof v !== 'object'
/** 纯字典：所有值都是原始类型（如 { "空气开关": "微型断路器" }） */
const isPrimDict = (o) => !!o && typeof o === 'object' && !Array.isArray(o)
  && Object.keys(o).length > 0 && Object.values(o).every(isPrim)

/**
 * 统计 JSON 里的业务条目数。
 *
 * 不同库的「一条」含义不同，按结构区分：
 *   · 数组                     → 长度（如 categories: [大类, 大类, 大类]）
 *   · 全原始值的对象           → 键数（字典表，如 synonyms.global 的 alias→std）
 *   · 子项全是字典的对象       → 各子项键数之和（如 synonyms.bySub: { 100101: {别名:标准名}, ... }）
 *   · 子项是配置对象的对象     → 子项个数（如 naming-guide.subs 的 209 个小类、std-watch.standards 的 136 个标准）
 *
 * 这样「同义词字典」得到 159（41 通用 + 118 小类内），
 * 「范式库」得到 209（小类数）而不是把每个小类的字段都算成一条。
 */
function countRows(j) {
  if (Array.isArray(j)) return j.length
  if (!j || typeof j !== 'object') return 0

  const keys = Object.keys(j).filter((k) => !META_KEYS.has(k))
  if (!keys.length) return 0

  // 整体就是一张字典表
  if (keys.every((k) => isPrim(j[k]))) return keys.length

  let n = 0
  for (const k of keys) {
    const v = j[k]
    if (Array.isArray(v)) { n += v.length; continue }
    if (isPrim(v)) { n += 1; continue }
    if (isPrimDict(v)) { n += Object.keys(v).length; continue }   // 二级字典
    const subs = Object.values(v)
    if (subs.length && subs.every(isPrimDict)) {
      // 分组字典：每个子项都是字典表 → 累加各自的键数
      n += subs.reduce((s, x) => s + Object.keys(x).length, 0)
    } else {
      // 分组配置：每个子项算一条（一个小类 / 一个标准 / 一个模板）
      n += Object.keys(v).length
    }
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

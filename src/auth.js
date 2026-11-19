/**
 * 轻量鉴权（3130 治理看板 与 3100 管理页共用）。
 *
 * 角色（初步定位）
 *   admin  系统管理员：全部权限（含所有删除）
 *   std    标准化员  ：规则/库的编辑与导入，**不能删除**
 *   design 设计      ：只读 + 新增物料提交（核心业务）
 *
 * 账号：本地账号（src/config/users.json，首次启动自动生成三个账号，初始密码见 INITIAL_PW）
 * 会话：HMAC-SHA256 签名的 Cookie（无状态，服务重启不掉线）
 *      · 密钥：data/auth-secret（首次自动生成）
 *      · 有效期：12 小时
 * 关闭鉴权：环境变量 AUTH_ENABLED=0（应急回滚用，关闭后一切按 admin 处理）
 *
 * 插件（PLM 页面内的脚本）跨站调用不带 Cookie，因此对「只读接口白名单」放行匿名
 * （见各 server 的 isPluginRead / isPluginApi），写接口一律要求登录。
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')
const USERS_FILE = path.join(ROOT, 'src', 'config', 'users.json')
const SECRET_FILE = path.join(ROOT, 'data', 'auth-secret')

const COOKIE = 'plm_auth'
const TTL_MS = 12 * 60 * 60 * 1000
/** 初始密码：首次生成账号时使用，登录后请立即修改 */
export const INITIAL_PW = 'Plm@2026'

export const ROLE_NAMES = {
  admin: '系统管理员',
  std: '标准化员',
  design: '设计',
  test: '测试（只读）',
}

/**
 * 页面 → 可见角色（前端菜单隐藏 + 后端页面级拦截都以此为准）。
 * 只读页面（overview/materials/dedup/classify/newmat）对三角色开放；
 * 治理类页面（cleanup/rules/feature/selection）只对管理员与标准化员开放；
 * 系统设置（含备份/恢复）只对管理员开放。
 */
export const PAGE_ROLES = {
  // test（测试）为只读演示角色：除「系统设置」外全部可看，所有写操作由 can() 拦截
  overview: ['admin', 'std', 'design', 'test'],
  materials: ['admin', 'std', 'design', 'test'],
  dedup: ['admin', 'std', 'design', 'test'],
  classify: ['admin', 'std', 'design', 'test'],
  cleanup: ['admin', 'std', 'test'],
  rules: ['admin', 'std', 'test'],
  feature: ['admin', 'std', 'test'],
  settings: ['admin'],
  newmat: ['admin', 'std', 'design', 'test'],
  selection: ['admin', 'std', 'test'],
}

export function authEnabled() {
  return !/^(0|false|off|no)$/i.test(String(process.env.AUTH_ENABLED || '1'))
}

// ---------------- 用户表 ----------------

function readUsersRaw() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) } catch (e) { return null }
}

function hashPw(pw, salt) {
  return crypto.scryptSync(String(pw), salt, 32).toString('hex')
}

function makeUser(u, name, role, pw) {
  const salt = crypto.randomBytes(12).toString('hex')
  return {
    u, name, role,
    salt, hash: hashPw(pw, salt),
    mustChange: true,           // 初始密码：首次登录提示修改
    createdAt: new Date().toISOString(),
  }
}

/** 测试（只读演示）账号的初始密码：与管理员初始密码分开，避免登录页提示泄露管理员口令 */
export const INITIAL_TEST_PW = 'Test@2026'

/** 首次启动自动生成账号（幂等）；已有部署会自动补建 test 只读账号 */
export function ensureUsers() {
  const cur = readUsersRaw()
  if (cur && Array.isArray(cur.users) && cur.users.length) {
    // 2026-11-19：已有部署补建「测试（只读）」账号（幂等，不覆盖已有密码）
    if (!cur.users.some((x) => x.u === 'test')) {
      const t = makeUser('test', '测试（只读）', 'test', process.env.AUTH_TEST_PW || INITIAL_TEST_PW)
      t.mustChange = false          // 共享演示账号：固定密码，不强制改密
      cur.users.push(t)
      try { saveUsers(cur) } catch (e) { }
    }
    return cur.users
  }
  const pw = String(process.env.AUTH_INIT_PW || INITIAL_PW)
  const users = [
    makeUser('admin', '系统管理员', 'admin', pw),
    makeUser('std', '标准化员', 'std', pw),
    makeUser('design', '设计', 'design', pw),
  ]
  const t = makeUser('test', '测试（只读）', 'test', process.env.AUTH_TEST_PW || INITIAL_TEST_PW)
  t.mustChange = false
  users.push(t)
  const data = {
    meta: {
      note: '本地账号。角色：admin 系统管理员 / std 标准化员 / design 设计 / test 测试（只读）。' +
        '首次自动生成：管理员等账号初始密码为 AUTH_INIT_PW（默认 Plm@2026），' +
        'test 账号初始密码为 AUTH_TEST_PW（默认 Test@2026，登录页会提示）。',
      updatedAt: new Date().toISOString(),
    },
    users,
  }
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true })
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')
  } catch (e) { /* 写失败时仅内存可用（重启丢账号） */ }
  return users
}

/** 安全比较（长度不同直接 false，避免 timingSafeEqual 抛错） */
function sameHex(a, b) {
  const A = Buffer.from(String(a || ''), 'hex')
  const B = Buffer.from(String(b || ''), 'hex')
  if (!A.length || A.length !== B.length) return false
  try { return crypto.timingSafeEqual(A, B) } catch (e) { return false }
}

// ---------------- 会话（签名 Cookie） ----------------

let secretCache = ''
function secret() {
  if (secretCache) return secretCache
  try {
    const s = fs.readFileSync(SECRET_FILE, 'utf8').trim()
    if (s) { secretCache = s; return s }
  } catch (e) { /* 首次 */ }
  const s = crypto.randomBytes(32).toString('hex')
  try {
    fs.mkdirSync(path.dirname(SECRET_FILE), { recursive: true })
    fs.writeFileSync(SECRET_FILE, s + '\n', 'utf8')
  } catch (e) { /* 写失败则本进程内有效 */ }
  secretCache = s
  return s
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  return body + '.' + sig
}

function verifyToken(tok) {
  const s = String(tok || '')
  const i = s.lastIndexOf('.')
  if (i <= 0) return null
  const body = s.slice(0, i)
  const sig = s.slice(i + 1)
  const want = crypto.createHmac('sha256', secret()).update(body).digest('base64url')
  if (sig !== want) return null
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'))
    if (!p || !p.r || !ROLE_NAMES[p.r]) return null
    if (!p.exp || Date.now() > p.exp) return null
    return p
  } catch (e) { return null }
}

function cookieValue(req) {
  const c = String((req && req.headers && req.headers.cookie) || '')
  if (!c) return ''
  const m = c.match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : ''
}

/**
 * 读取当前会话；未登录/过期/账号被停用或删除 → null。
 * 2026-11-19：每次请求回查用户表，保证「改角色 / 停用 / 删除」即时生效
 * （签名 Cookie 是无状态的，否则要等 12 小时过期）。
 */
export function readSession(req) {
  const p = verifyToken(cookieValue(req))
  if (!p) return null
  const d = readUsersRaw()
  const user = d && Array.isArray(d.users) ? d.users.find((x) => x.u === p.u) : null
  if (!user) return null
  if (user.enabled === false) return null
  return { u: user.u, name: user.name, role: user.role, roleName: ROLE_NAMES[user.role] }
}

export function cookieHeader(token) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.floor(TTL_MS / 1000)}`
}

export function clearCookieHeader() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

// ---------------- 登录 / 改密 ----------------

/** 简单防爆破：同一 key（用户名）1 分钟内失败 5 次后暂停 */
const fails = new Map()
function tooMany(key) {
  const rec = fails.get(key)
  if (!rec) return false
  if (Date.now() - rec.at > 60 * 1000) { fails.delete(key); return false }
  return rec.n >= 5
}
function markFail(key) {
  const rec = fails.get(key)
  if (!rec || Date.now() - rec.at > 60 * 1000) fails.set(key, { n: 1, at: Date.now() })
  else rec.n += 1
}

export function login(username, password) {
  ensureUsers()
  const u = String(username || '').trim()
  if (!u) return { ok: false, error: '请输入用户名' }
  if (tooMany(u)) return { ok: false, error: '尝试过于频繁，请 1 分钟后再试' }
  const data = readUsersRaw() || { users: [] }
  const user = (data.users || []).find((x) => x.u === u)
  if (!user || !sameHex(hashPw(password, user.salt), user.hash)) {
    markFail(u)
    return { ok: false, error: '用户名或密码错误' }
  }
  if (user.enabled === false) return { ok: false, error: '该账号已停用，请联系系统管理员' }
  const token = signToken({ u: user.u, n: user.name, r: user.role, exp: Date.now() + TTL_MS })
  return {
    ok: true, token,
    user: { u: user.u, name: user.name, role: user.role, roleName: ROLE_NAMES[user.role], mustChange: !!user.mustChange },
  }
}

export function changePassword(username, oldPw, newPw) {
  const data = readUsersRaw()
  if (!data || !Array.isArray(data.users)) return { ok: false, error: '用户表不存在' }
  const user = data.users.find((x) => x.u === username)
  if (!user) return { ok: false, error: '用户不存在' }
  if (!sameHex(hashPw(oldPw, user.salt), user.hash)) return { ok: false, error: '原密码不正确' }
  const np = String(newPw || '')
  if (np.length < 6) return { ok: false, error: '新密码至少 6 位' }
  if (np === String(oldPw || '')) return { ok: false, error: '新密码不能与原密码相同' }
  const salt = crypto.randomBytes(12).toString('hex')
  user.salt = salt
  user.hash = hashPw(np, salt)
  user.mustChange = false
  user.pwChangedAt = new Date().toISOString()
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8')
  } catch (e) { return { ok: false, error: '写入失败：' + ((e && e.message) || e) } }
  return { ok: true }
}

// ---------------- 可配置权限（角色 × 功能点） ----------------

/** 功能点定义（系统设置 → 角色权限 的矩阵行；key 用于权限判断） */
export const PERM_DEFS = [
  // 页面访问
  { key: 'page.overview', group: '页面访问', name: '概览' },
  { key: 'page.materials', group: '页面访问', name: '物料特征' },
  { key: 'page.dedup', group: '页面访问', name: '一物多号查重' },
  { key: 'page.classify', group: '页面访问', name: '分类树' },
  { key: 'page.cleanup', group: '页面访问', name: '存量清洗' },
  { key: 'page.rules', group: '页面访问', name: '命名规范（同义词/范式/参数库）' },
  { key: 'page.feature', group: '页面访问', name: '特征参数录入' },
  { key: 'page.newmat', group: '页面访问', name: '新增物料' },
  { key: 'page.selection', group: '页面访问', name: '选型库' },
  { key: 'page.settings', group: '页面访问', name: '系统设置' },
  // 数据操作
  { key: 'data.write', group: '数据操作', name: '编辑规则 / 参数库 / 选型库' },
  { key: 'data.import', group: '数据操作', name: '导入（Excel / 批量）' },
  { key: 'data.run', group: '数据操作', name: '重跑提取 / 查重 / 快照刷新' },
  { key: 'data.delete', group: '数据操作', name: '删除（记录 / 文件 / 规则）' },
  { key: 'biz.submit', group: '业务', name: '新增物料提交（待新增清单）' },
  // 管理
  { key: 'admin.backup', group: '管理', name: '备份与恢复' },
  { key: 'admin.users', group: '管理', name: '用户与角色管理' },
  { key: 'admin.roles', group: '管理', name: '角色权限配置' },
]

/** 默认权限（= 2026-11-19 之前写死的行为；用于首次生成 roles.json 与「恢复默认」） */
export const DEFAULT_ROLE_PERMS = {
  admin: ['*'],
  std: ['page.overview', 'page.materials', 'page.dedup', 'page.classify', 'page.cleanup',
    'page.rules', 'page.feature', 'page.newmat', 'page.selection',
    'data.write', 'data.import', 'data.run', 'biz.submit'],
  design: ['page.overview', 'page.materials', 'page.dedup', 'page.classify', 'page.newmat', 'biz.submit'],
  test: ['page.overview', 'page.materials', 'page.dedup', 'page.classify', 'page.cleanup',
    'page.rules', 'page.feature', 'page.newmat', 'page.selection'],
}

const ROLES_FILE = path.join(ROOT, 'src', 'config', 'roles.json')
let rolesCache = { at: -1, data: null }

/** 读取角色权限配置（mtime 缓存；缺文件时写默认值） */
export function loadRolePerms() {
  try {
    const st = fs.statSync(ROLES_FILE)
    if (rolesCache.data && rolesCache.at === st.mtimeMs) return rolesCache.data
    const j = JSON.parse(fs.readFileSync(ROLES_FILE, 'utf8'))
    rolesCache = { at: st.mtimeMs, data: (j && j.roles) || {} }
    return rolesCache.data
  } catch (e) {
    const init = {}
    for (const k of Object.keys(ROLE_NAMES)) init[k] = { name: ROLE_NAMES[k], perms: (DEFAULT_ROLE_PERMS[k] || []).slice() }
    try {
      fs.mkdirSync(path.dirname(ROLES_FILE), { recursive: true })
      fs.writeFileSync(ROLES_FILE, JSON.stringify({
        meta: { note: '角色 × 功能点权限（系统设置 → 角色权限）；admin 固定全权，防锁死。', updatedAt: new Date().toISOString() },
        roles: init,
      }, null, 2) + '\n', 'utf8')
    } catch (e2) { /* 写失败用内存默认 */ }
    rolesCache = { at: 0, data: init }
    return init
  }
}

/** 角色当前权限列表（配置缺失时回退默认） */
function rolePerms(role) {
  const all = loadRolePerms()
  const r = all && all[role]
  return (r && Array.isArray(r.perms)) ? r.perms : (DEFAULT_ROLE_PERMS[role] || [])
}

/** 是否拥有某功能点权限（支持 * 与组通配 page.*） */
export function hasPerm(role, key) {
  if (!ROLE_NAMES[role]) return false
  if (role === 'admin') return true             // 管理员始终全权（防锁死）
  const list = rolePerms(role)
  if (list.indexOf('*') >= 0) return true
  if (list.indexOf(key) >= 0) return true
  const dot = String(key).indexOf('.')
  if (dot > 0 && list.indexOf(key.slice(0, dot) + '.*') >= 0) return true
  return false
}

/** 该角色可见的页面 key 列表（按功能点计算） */
export function pagesOf(role) {
  const out = []
  for (const d of PERM_DEFS) {
    if (d.key.indexOf('page.') !== 0) continue
    if (hasPerm(role, d.key)) out.push(d.key.slice(5))
  }
  return out
}

/** GET 接口 → 所需页面权限（未命中的只读接口：登录即可） */
const GET_PERM_RULES = [
  [/^\/api\/overview/, 'page.overview'],
  [/^\/api\/(materials|filters|orgs)/, 'page.materials'],
  [/^\/api\/(dedup|unified)/, 'page.dedup'],
  [/^\/api\/classification/, 'page.classify'],
  [/^\/api\/(mapping|freeze)/, 'page.cleanup'],
  [/^\/api\/(name-synonyms|naming-guide|param-lib|std-watch)/, 'page.rules'],
  [/^\/api\/feature/, 'page.feature'],
  [/^\/api\/new-material/, 'page.newmat'],
  [/^\/api\/settings/, 'page.settings'],
  [/^\/api\/(select|selection)/, 'page.selection'],
  [/^\/api\/(jobs|stats|health)/, 'page.overview'],
]

/** 写接口 → 所需操作权限（按顺序首个命中；null = 只读语义，不额外要求） */
const WRITE_PERM_RULES = [
  // 校验/联想/导出类 POST 实际是只读，只要求页面可见
  [/^\/api\/new-material\/(validate|spec-check|spec-suggest|spec-complete|accessory-complete|similar-models|inventory|next-code|export)$/, null],
  [/^\/api\/new-material$/, 'biz.submit'],
  [/import/i, 'data.import'],
  [/^\/api\/(run|rerun|snapshot|jobs|dedup|extract)/, 'data.run'],
  [/.*/, 'data.write'],
]

/**
 * 接口权限（3130）：基于「角色 × 功能点」配置判断
 *   · 删除类 → data.delete
 *   · 用户/权限/备份 → admin.users / admin.roles / admin.backup
 *   · 写接口 → data.write / data.import / data.run / biz.submit
 *   · 读接口 → 对应页面权限（page.*）
 */
export function can(role, method, pathname) {
  if (!ROLE_NAMES[role]) return false
  const m = String(method || 'GET').toUpperCase()
  const p = String(pathname || '')

  // 管理面（各自独立功能点）
  if (/^\/api\/users(\/|$)/.test(p)) return hasPerm(role, 'admin.users')
  if (/^\/api\/perms(\/|$)/.test(p)) return hasPerm(role, 'admin.roles')
  if (/^\/api\/backup(\/|$)/.test(p)) return hasPerm(role, 'admin.backup')

  // 删除类
  if (m === 'DELETE' || /\/delete$/i.test(p)) return hasPerm(role, 'data.delete')

  // 写操作
  if (m !== 'GET' && m !== 'HEAD') {
    let need = 'data.write'
    for (const [re, perm] of WRITE_PERM_RULES) {
      if (re.test(p)) { need = perm; break }
    }
    if (need && !hasPerm(role, need)) return false
    for (const [re, perm] of GET_PERM_RULES) {
      if (re.test(p)) { if (perm && !hasPerm(role, perm)) return false; break }
    }
    return true
  }

  // 读操作：按页面权限
  for (const [re, perm] of GET_PERM_RULES) {
    if (re.test(p)) return hasPerm(role, perm)
  }
  return true
}

/**
 * 3100 管理页接口权限：
 *   · 读 → 需要「选型库」页面权限
 *   · 写（导入/启停/上传）→ 需要「选型库」+「编辑规则/参数库/选型库」
 *   · 删除 → 还需要「删除」权限
 */
export function canPlm(role, method, pathname) {
  if (!ROLE_NAMES[role]) return false
  const m = String(method || 'GET').toUpperCase()
  const p = String(pathname || '')
  if (!hasPerm(role, 'page.selection')) return false
  if (m === 'GET' || m === 'HEAD') return true
  if (m === 'DELETE' || /\/delete$/i.test(p)) return hasPerm(role, 'data.delete')
  return hasPerm(role, 'data.write')
}

/** 权限矩阵（供系统设置 → 角色权限页使用） */
export function getPermMatrix() {
  return {
    defs: PERM_DEFS,
    roles: Object.keys(ROLE_NAMES).map((k) => ({
      key: k,
      name: ROLE_NAMES[k],
      perms: rolePerms(k).slice(),
      locked: k === 'admin',      // 管理员固定全权，界面不可编辑
    })),
  }
}

/** 保存权限矩阵（仅管理员调用；admin 强制 *，防锁死） */
export function savePermMatrix(roles, by) {
  const next = {}
  for (const k of Object.keys(ROLE_NAMES)) {
    const src = (roles || []).find((x) => x && x.key === k)
    const raw = src && Array.isArray(src.perms) ? src.perms : rolePerms(k)
    const valid = raw.filter((x) => typeof x === 'string')
      .filter((x) => x === '*' || PERM_DEFS.some((d) => d.key === x))
    next[k] = { name: ROLE_NAMES[k], perms: k === 'admin' ? ['*'] : valid }
  }
  try {
    fs.mkdirSync(path.dirname(ROLES_FILE), { recursive: true })
    fs.writeFileSync(ROLES_FILE, JSON.stringify({
      meta: { note: '角色 × 功能点权限（系统设置 → 角色权限）；admin 固定全权，防锁死。', updatedAt: new Date().toISOString() },
      roles: next,
    }, null, 2) + '\n', 'utf8')
  } catch (e) { return { ok: false, error: '写入失败：' + ((e && e.message) || e) } }
  rolesCache = { at: 0, data: next }
  audit('perms.save', by, Object.keys(next).join(','))
  return { ok: true }
}

/** 恢复默认权限（admin 仍固定全权） */
export function resetPermMatrix(by) {
  const roles = Object.keys(ROLE_NAMES).map((k) => ({ key: k, perms: (DEFAULT_ROLE_PERMS[k] || []).slice() }))
  const r = savePermMatrix(roles, by)
  return r.ok ? { ok: true } : r
}

// ---------------- 用户管理（仅管理员：can() 中 /api/users 前缀只放 admin） ----------------

const AUDIT_FILE = path.join(ROOT, 'data', 'auth-audit.ndjson')

/** 操作审计（追加写；data/* 已在 .gitignore 忽略） */
function audit(action, by, target) {
  try {
    fs.mkdirSync(path.dirname(AUDIT_FILE), { recursive: true })
    fs.appendFileSync(AUDIT_FILE,
      JSON.stringify({ at: new Date().toISOString(), action, by: String(by || ''), target: String(target || '') }) + '\n',
      'utf8')
  } catch (e) { }
}

/** 用户列表（脱敏：不含 salt/hash） */
export function listUsers() {
  ensureUsers()
  const d = readUsersRaw() || { users: [] }
  return (d.users || []).map((x) => ({
    u: x.u,
    name: x.name,
    role: x.role,
    roleName: ROLE_NAMES[x.role] || x.role,
    enabled: x.enabled !== false,
    mustChange: !!x.mustChange,
    createdAt: x.createdAt || '',
    pwChangedAt: x.pwChangedAt || '',
  }))
}

function saveUsers(d) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(d, null, 2) + '\n', 'utf8')
}

/** 启用状态的系统管理员数量（"最后一个管理员"保护用） */
function aliveAdmins(users) {
  return (users || []).filter((x) => x.role === 'admin' && x.enabled !== false).length
}

/** 新建用户（管理员） */
export function createUser({ u, name, role, pw, by }) {
  ensureUsers()
  const un = String(u || '').trim()
  if (!/^[A-Za-z0-9_.-]{2,20}$/.test(un)) return { ok: false, error: '用户名需为 2-20 位字母、数字、下划线、点或横线' }
  if (!ROLE_NAMES[role]) return { ok: false, error: '角色不合法' }
  const np = String(pw || '')
  if (np.length < 6) return { ok: false, error: '初始密码至少 6 位' }
  const d = readUsersRaw() || { users: [] }
  d.users = Array.isArray(d.users) ? d.users : []
  if (d.users.some((x) => x.u === un)) return { ok: false, error: '用户名已存在' }
  const salt = crypto.randomBytes(12).toString('hex')
  d.users.push({
    u: un, name: String(name || un).trim(), role,
    salt, hash: hashPw(np, salt),
    enabled: true, mustChange: true,
    createdAt: new Date().toISOString(),
  })
  saveUsers(d)
  audit('user.create', by, un + ' / ' + role)
  return { ok: true }
}

/**
 * 修改用户（姓名 / 角色 / 停用启用）。
 * 自我保护：不能改自己的角色、不能停用自己、不能删/停用/降级最后一个系统管理员。
 */
export function updateUser(u, patch, by) {
  const d = readUsersRaw()
  if (!d || !Array.isArray(d.users)) return { ok: false, error: '用户表不存在' }
  const user = d.users.find((x) => x.u === u)
  if (!user) return { ok: false, error: '用户不存在' }
  const p = patch || {}
  if (p.role !== undefined) {
    if (!ROLE_NAMES[p.role]) return { ok: false, error: '角色不合法' }
    if (u === by && p.role !== user.role) return { ok: false, error: '不能修改自己的角色' }
    if (user.role === 'admin' && p.role !== 'admin' && aliveAdmins(d.users) <= 1) {
      return { ok: false, error: '不能降级最后一个系统管理员' }
    }
    user.role = p.role
  }
  if (p.enabled !== undefined) {
    const en = !!p.enabled
    if (u === by && !en) return { ok: false, error: '不能停用自己的账号' }
    if (!en && user.role === 'admin' && aliveAdmins(d.users) <= 1) {
      return { ok: false, error: '不能停用最后一个系统管理员' }
    }
    user.enabled = en
  }
  if (p.name !== undefined) user.name = String(p.name || '').trim() || user.u
  user.updatedAt = new Date().toISOString()
  saveUsers(d)
  audit('user.update', by, u)
  return { ok: true }
}

/** 重置密码（管理员；重置后强制下次登录改密） */
export function resetPassword(u, newPw, by) {
  const d = readUsersRaw()
  if (!d || !Array.isArray(d.users)) return { ok: false, error: '用户表不存在' }
  const user = d.users.find((x) => x.u === u)
  if (!user) return { ok: false, error: '用户不存在' }
  const np = String(newPw || '')
  if (np.length < 6) return { ok: false, error: '新密码至少 6 位' }
  const salt = crypto.randomBytes(12).toString('hex')
  user.salt = salt
  user.hash = hashPw(np, salt)
  user.mustChange = true
  user.pwChangedAt = new Date().toISOString()
  saveUsers(d)
  audit('user.resetPassword', by, u)
  return { ok: true }
}

/** 删除用户（管理员；不能删自己、不能删最后一个启用管理员） */
export function deleteUser(u, by) {
  const d = readUsersRaw()
  if (!d || !Array.isArray(d.users)) return { ok: false, error: '用户表不存在' }
  const user = d.users.find((x) => x.u === u)
  if (!user) return { ok: false, error: '用户不存在' }
  if (u === by) return { ok: false, error: '不能删除自己的账号' }
  if (user.role === 'admin' && aliveAdmins(d.users) <= 1) {
    return { ok: false, error: '不能删除最后一个系统管理员' }
  }
  d.users = d.users.filter((x) => x.u !== u)
  saveUsers(d)
  audit('user.delete', by, u)
  return { ok: true }
}

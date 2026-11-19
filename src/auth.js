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
}

/**
 * 页面 → 可见角色（前端菜单隐藏 + 后端页面级拦截都以此为准）。
 * 只读页面（overview/materials/dedup/classify/newmat）对三角色开放；
 * 治理类页面（cleanup/rules/feature/selection）只对管理员与标准化员开放；
 * 系统设置（含备份/恢复）只对管理员开放。
 */
export const PAGE_ROLES = {
  overview: ['admin', 'std', 'design'],
  materials: ['admin', 'std', 'design'],
  dedup: ['admin', 'std', 'design'],
  classify: ['admin', 'std', 'design'],
  cleanup: ['admin', 'std'],
  rules: ['admin', 'std'],
  feature: ['admin', 'std'],
  settings: ['admin'],
  newmat: ['admin', 'std', 'design'],
  selection: ['admin', 'std'],
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

/** 首次启动自动生成账号（幂等）；返回用户数组 */
export function ensureUsers() {
  const cur = readUsersRaw()
  if (cur && Array.isArray(cur.users) && cur.users.length) return cur.users
  const pw = String(process.env.AUTH_INIT_PW || INITIAL_PW)
  const users = [
    makeUser('admin', '系统管理员', 'admin', pw),
    makeUser('std', '标准化员', 'std', pw),
    makeUser('design', '设计', 'design', pw),
  ]
  const data = {
    meta: {
      note: '本地账号。角色：admin 系统管理员 / std 标准化员 / design 设计。' +
        '首次自动生成，初始密码为 AUTH_INIT_PW（默认 Plm@2026），请登录后立即修改。',
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

/** 读取当前会话；未登录/过期返回 null */
export function readSession(req) {
  const p = verifyToken(cookieValue(req))
  if (!p) return null
  return { u: p.u, name: p.n || p.u, role: p.r, roleName: ROLE_NAMES[p.r] }
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

// ---------------- 权限 ----------------

/** 该角色可见的页面 key 列表 */
export function pagesOf(role) {
  const out = []
  for (const k of Object.keys(PAGE_ROLES)) {
    if (PAGE_ROLES[k].indexOf(role) >= 0) out.push(k)
  }
  return out
}

/**
 * 接口权限（3130）：
 *   · 所有删除（DELETE 方法或路径以 /delete 结尾）→ 仅 admin
 *   · 备份与恢复 → 仅 admin
 *   · 系统设置：读 = admin/std，写 = admin
 *   · 新增物料提交 → 三角色（设计的核心操作）
 *   · 其余只读 GET → 登录即可（design 可看）
 *   · 其余写操作 → admin + std（design 只读）
 */
export function can(role, method, pathname) {
  if (!ROLE_NAMES[role]) return false
  const isAdmin = role === 'admin'
  const isWriter = isAdmin || role === 'std'
  const m = String(method || 'GET').toUpperCase()
  const p = String(pathname || '')

  if (m === 'DELETE' || /\/delete$/i.test(p)) return isAdmin
  if (/^\/api\/backup\//.test(p)) return isAdmin
  if (p === '/api/settings') return m === 'GET' ? isWriter : isAdmin
  if (p === '/api/new-material' && m === 'POST') return true
  if (m === 'GET' || m === 'HEAD') return true
  return isWriter
}

/**
 * 3100 管理页接口权限：
 *   · 删除类 / reload / snapshot merge|reset → 仅 admin
 *   · 其余写（导入、启用停用、上传等）→ admin + std
 *   · 只读 → 登录即可
 */
export function canPlm(role, method, pathname) {
  if (!ROLE_NAMES[role]) return false
  const isAdmin = role === 'admin'
  const m = String(method || 'GET').toUpperCase()
  const p = String(pathname || '')
  if (m === 'DELETE' || /\/delete$/i.test(p)) return isAdmin
  if (/^\/api\/plm\/reload$/.test(p)) return isAdmin
  if (/^\/api\/plm\/snapshot\/(merge|reset)$/.test(p)) return isAdmin
  if (m === 'GET' || m === 'HEAD') return true
  return isAdmin || role === 'std'
}

/**
 * 数据库连接（金蝶 ERP / SQL Server）。
 * 复用既有 kingdee 后端模式：单例连接池、跨网连接池收敛、永不按请求关闭池。
 * .env 由 src/env.js 统一加载（项目根目录），本文件不再自己调 dotenv。
 */
import sql from 'mssql'
import { env, envInt, envBool } from './env.js'

function requireEnv(name) {
  const v = env(name, '')
  if (v === '') {
    throw new Error(`[db] 缺少必需环境变量 ${name}，请在 .env 中配置`)
  }
  return v
}

const dbConfig = {
  server: requireEnv('DB_SERVER'),
  port: envInt('DB_PORT', 1433),
  database: requireEnv('DB_DATABASE'),
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  options: {
    encrypt: envBool('DB_ENCRYPT', true),
    trustServerCertificate: true,
  },
  pool: {
    max: 20,
    min: 5,
    idleTimeoutMillis: 300000,
    acquireTimeoutMillis: 8000,
    createTimeoutMillis: 8000,
    destroyTimeoutMillis: 5000,
    reapIntervalMillis: 1000,
  },
  requestTimeout: 120000,
  connectionTimeout: 8000,
}

let poolPromise = null
let poolFailedAt = 0
const COOLDOWN = 10000

function getPool() {
  if (!poolPromise) {
    const now = Date.now()
    if (poolFailedAt && now - poolFailedAt < COOLDOWN) {
      poolPromise = Promise.reject(new Error('[db] 连接冷却中，请稍后重试'))
      return poolPromise
    }
    poolPromise = new sql.ConnectionPool(dbConfig)
      .connect()
      .then((pool) => {
        pool.on('error', (err) => console.error('[db] 连接池错误:', err.message))
        return pool
      })
      .catch((err) => {
        poolFailedAt = Date.now()
        console.error('[db] 连接池创建失败（进入冷却）:', err.message)
        poolPromise = new Promise((_, rej) => {
          const t = setTimeout(() => { poolPromise = null; poolFailedAt = 0 }, COOLDOWN)
          if (typeof t.unref === 'function') t.unref()
          rej(err)
        })
        throw err
      })
  }
  return poolPromise
}

/**
 * 执行查询。
 * @param {string} query SQL
 * @param {object} params 入参
 * @param {{timeout?: number}} [opts] timeout=单条查询超时(ms)，不传则用连接池默认 requestTimeout。
 *        交互型查询（页面按钮触发）务必传 timeout：超时立即 cancel 并抛错，避免用户端最长干等 120 秒。
 */
export async function executeQuery(query, params = {}, opts = {}) {
  const pool = await getPool()
  const request = pool.request()
  for (const [k, v] of Object.entries(params)) request.input(k, v)
  const timeout = Number(opts.timeout) || 0
  if (!timeout) {
    const result = await request.query(query)
    return result.recordset || []
  }
  request.timeout = timeout
  let timer = null
  const timeoutP = new Promise((_, reject) => {
    timer = setTimeout(() => {
      // 主动 cancel：让 SQL Server 停止执行，避免连接被长期占用
      try { request.cancel() } catch (e) { /* 已结束则忽略 */ }
      const err = new Error(`查询超时（>${Math.round(timeout / 1000)}s）`)
      err.code = 'EQUERYTIMEOUT'
      reject(err)
    }, timeout)
    if (typeof timer.unref === 'function') timer.unref()
  })
  try {
    const result = await Promise.race([request.query(query), timeoutP])
    return result.recordset || []
  } finally {
    if (timer) clearTimeout(timer)
  }
}

export async function getPoolConnection() {
  return getPool()
}

export { sql }
export default { executeQuery, getPoolConnection, sql }

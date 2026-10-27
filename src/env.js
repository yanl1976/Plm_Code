/**
 * 统一环境变量入口 —— 全项目唯一的 .env 加载点。
 *
 * 背景（为什么需要这个文件）：
 *   本项目有两个独立进程：治理看板 src/server.js 与 PLM 接口 src/plm-server.js。
 *   早期只有 src/db.js 内部调 dotenv，而 plm-server.js 的 import 链到不了 db.js，
 *   导致它的 PLM_API_PORT / PLM_API_HOST 在 PM2、systemd 等部署环境下读不到 .env，
 *   只能靠命令行 `--env-file=.env` 手工注入，容易漏。
 *   现在任何入口只要 import 本模块，就能拿到完整的 .env 配置。
 *
 * 优先级约定（与 dotenv 一致）：
 *   进程真实环境变量 > .env 文件 > 代码内默认值。
 *   这样 PM2 的 env、docker 的 -e、systemd 的 Environment= 都能覆盖 .env，
 *   便于同一份代码在开发机与生产机上用不同配置运行。
 *
 * 用法：
 *   import { env, envPort, envBool } from './env.js'
 *   const PORT = envPort('PORT', 3000)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

/** 项目根目录（src/ 的上一级） */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
/** .env 绝对路径：固定在项目根，与进程 cwd 无关（PM2 的 cwd 经常不对） */
export const ENV_FILE = path.join(ROOT, '.env')

const injected = []
let exists = false

try {
  exists = fs.existsSync(ENV_FILE)
  if (exists) {
    const raw = dotenv.parse(fs.readFileSync(ENV_FILE))
    for (const [k, v] of Object.entries(raw)) {
      // 已由外部（PM2 / docker / shell）设置的非空值优先，绝不被 .env 覆盖
      if (process.env[k] === undefined || process.env[k] === '') {
        process.env[k] = v
        injected.push(k)
      }
    }
  }
} catch (e) {
  // .env 读坏了不能拖垮启动；DB 等必需变量在 db.js 的 requireEnv 里会明确报错
  console.warn(`[env] 读取 ${ENV_FILE} 失败：${e && e.message}`)
}

/** 加载状态，供 /health、启动日志排查「到底读没读到 .env」 */
export const envInfo = {
  file: ENV_FILE,
  exists,
  injected: injected.slice(),
  // 外部注入（优先级更高）的变量名，便于区分配置来源
  fromProcess: Object.keys(process.env).filter((k) => !injected.includes(k)).length,
}

/** 读字符串，空串视为未设置 */
export function env(name, dft = '') {
  const v = process.env[name]
  return v === undefined || v === null || v === '' ? dft : String(v)
}

/** 读整数；非法值直接抛错（静默回退会让配置错误在生产上极难发现） */
export function envInt(name, dft) {
  const raw = process.env[name]
  if (raw === undefined || raw === null || raw === '') return dft
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(`[env] ${name} 必须是整数，当前值：${JSON.stringify(raw)}`)
  }
  return n
}

/** 读端口：整数且在 1~65535 之间 */
export function envPort(name, dft) {
  const n = envInt(name, dft)
  if (n < 1 || n > 65535) {
    throw new Error(`[env] ${name} 必须是有效端口(1~65535)，当前值：${n}`)
  }
  return n
}

/** 读布尔：1/true/yes/on 为真，0/false/no/off 为假 */
export function envBool(name, dft = false) {
  const raw = process.env[name]
  if (raw === undefined || raw === null || raw === '') return dft
  const s = String(raw).trim().toLowerCase()
  if (['1', 'true', 'yes', 'on'].includes(s)) return true
  if (['0', 'false', 'no', 'off'].includes(s)) return false
  throw new Error(`[env] ${name} 必须是布尔值(true/false/1/0)，当前值：${JSON.stringify(raw)}`)
}

/** 读逗号分隔列表 */
export function envList(name, dft = []) {
  const raw = env(name, '')
  if (!raw) return dft
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

/** 启动时打印一次配置来源，避免「明明配了 .env 却不生效」的排查黑洞 */
export function logEnvSource(tag = 'env') {
  const state = envInfo.exists ? `已加载 ${envInfo.file}（注入 ${envInfo.injected.length} 项）` : `未找到 ${envInfo.file}，仅使用进程环境变量`
  console.log(`[${tag}] ${state}`)
}

export default { env, envInt, envPort, envBool, envList, envInfo, logEnvSource, ROOT, ENV_FILE }

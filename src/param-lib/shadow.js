/**
 * 参数标准库 · 影子模式（shadow）
 *
 * 目的：在不影响用户的前提下，采集「如果启用会怎样」的真实数据，用于判断是否值得正式上线。
 *
 * 行为：
 *   · 每次校验（checkMaterial）时，若 enabled=true 且 shadow=true，则做一次静默评估
 *   · 评估内容：该小类已收录的参数里，哪些已填、填的值是否标准、未填的会推荐什么
 *   · 结果记入内存缓冲，定时追加到 data/param-shadow-log.ndjson
 *   · **不改变任何校验结论**：返回值只多一个 paramShadow 字段，前端不使用
 *
 * 安全：
 *   · 全链路 try/catch —— 任何异常都只影响该字段，绝不影响校验主流程
 *   · 开关关闭时立即返回 null，几乎零开销
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { enabled, isShadow, subParams, checkValue, standardValues } from './store.js'
import { extractParams } from '../struct-spec.js'
import { getCategory, chooseTokens } from '../classify.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const LOG_FILE = path.join(ROOT, 'data', 'param-shadow-log.ndjson')

const BUF = []
let lastFlush = 0
const FLUSH_MS = 60 * 1000      // 最多每分钟落盘一次
const FLUSH_SIZE = 50           // 或累计 50 条

function flush() {
  if (!BUF.length) return
  try {
    const txt = BUF.map((x) => JSON.stringify(x)).join('\n') + '\n'
    fs.appendFileSync(LOG_FILE, txt, 'utf8')
    BUF.length = 0
    lastFlush = Date.now()
  } catch (e) { /* 落盘失败不影响主流程 */ }
}

function push(rec) {
  BUF.push(rec)
  if (BUF.length >= FLUSH_SIZE || Date.now() - lastFlush > FLUSH_MS) flush()
}

/**
 * 静默评估一条录入。
 * @returns {null | {params:number, filled:number, ok:number, nonStandard:number, missing:number, detail:Array}}
 */
/**
 * 去重：同一 (小类|名称|规格) 60 秒内只记一次。
 * 插件在改名称/改规格时会多次触发 check，不去重会让日志迅速膨胀且数据失真。
 */
const SEEN = new Map()
function isDup(sub, name, spec) {
  const k = sub + '|' + name + '|' + spec
  const now = Date.now()
  const last = SEEN.get(k)
  if (last && now - last < 60000) return true
  SEEN.set(k, now)
  if (SEEN.size > 3000) {
    for (const [kk, t] of SEEN) if (now - t > 300000) SEEN.delete(kk)
  }
  return false
}

export function shadowEval(sub, name, spec) {
  try {
    if (!enabled(sub) || !isShadow()) return null
    // 规格为空时评估没有意义（未填任何参数），直接跳过
    if (!String(spec || '').trim()) return null
    if (isDup(String(sub || '').slice(0, 6), String(name || ''), String(spec || '').trim())) return null
    const s6 = String(sub || '').slice(0, 6)
    const info = getCategory(s6) || {}
    const tokens = chooseTokens(info)
    if (!tokens.length) return null

    const defs = subParams(s6)
    const names = Object.keys(defs)
    if (!names.length) return null

    const vals = extractParams(String(spec || ''), tokens)
    const detail = []
    let filled = 0, ok = 0, nonStandard = 0, missing = 0

    for (const p of names) {
      const def = defs[p] || {}
      const v = vals[p]
      // 自由型（型号/阻值/容值…）没有标准值，只记「填了没有」，不判标准性 ——
      // 否则型号必然被判"非标"，把统计口径污染掉（实测「型号✘」就是这个原因）
      if (def.type === 'free') {
        if (v) filled++
        else missing++
        detail.push({ p, filled: !!v, free: true })
        continue
      }
      if (!v) {
        missing++
        detail.push({ p, filled: false, suggest: standardValues(s6, p, 3).map((x) => x.value) })
        continue
      }
      filled++
      const r = checkValue(s6, p, v)
      if (r.ok) ok++
      else nonStandard++
      detail.push({ p, filled: true, v, nv: r.normalized, ok: r.ok, why: r.reason })
    }

    const rec = {
      at: new Date().toISOString(),
      sub: s6,
      subName: info.subName || '',
      name: String(name || ''),
      spec: String(spec || ''),
      params: names.length,
      filled, ok, nonStandard, missing,
      detail,
    }
    push(rec)
    return { params: names.length, filled, ok, nonStandard, missing, detail }
  } catch (e) {
    return null      // 影子评估失败绝不影响校验
  }
}

/** 手动落盘（进程退出前/诊断用） */
export function flushShadowLog() {
  flush()
}

/** 已缓冲但未落盘的条数（诊断用） */
export function shadowPending() {
  return BUF.length
}

/** 日志文件路径（供统计脚本使用） */
export function shadowLogFile() {
  return LOG_FILE
}

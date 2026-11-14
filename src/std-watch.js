/**
 * 标准查新：定期核查命名范式库引用的国标是否仍为现行版本
 *
 * 数据源：国家标准全文公开系统 openstd.samr.gov.cn（公开可访问）
 * 台账：src/config/std-watch.json（记录每个标准的最新版本、状态、上次核查时间）
 *
 * 设计原则：
 *   ① 只做「核查 + 提醒」，不自动改 naming-guide.json（改标准必须人工确认）
 *   ② 限速请求（默认 400ms 间隔），避免对公开平台造成压力
 *   ③ 单个失败不影响整体，记录到 failed 列表
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CFG = path.join(ROOT, 'src', 'config')
const GUIDE = path.join(CFG, 'naming-guide.json')
const WATCH = path.join(CFG, 'std-watch.json')

const PERIODS = { month: 30, quarter: 91, halfyear: 182 }

/** 从 naming-guide.json 提取所有引用的标准号（按基础号汇总） */
export function collectStandards() {
  let j = { subs: {} }
  try { j = JSON.parse(fs.readFileSync(GUIDE, 'utf8')) } catch (e) { return [] }

  const RE = /\b(GB\/T|GB|JB\/T|JB|MT|EN|IEC)\s*(\d+(?:\.\d+)*)(?:\s*-\s*(\d{4}))?/g
  const map = new Map()
  for (const [sub, g] of Object.entries(j.subs || {})) {
    const src = String(g.source || '')
    let m
    RE.lastIndex = 0
    while ((m = RE.exec(src))) {
      const base = m[1] + ' ' + m[2]
      const ver = m[3] || ''
      if (!map.has(base)) map.set(base, { base, refVers: new Set(), subs: new Set() })
      const it = map.get(base)
      if (ver) it.refVers.add(ver)
      it.subs.add(sub)
    }
  }
  return [...map.values()]
    .map((x) => ({ base: x.base, refVers: [...x.refVers].sort(), subs: [...x.subs].sort() }))
    .sort((a, b) => a.base.localeCompare(b.base))
}

function stripTags(s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
}

/** 解析开放平台检索结果页 */
function parseStdList(html) {
  const out = []
  for (const tr of (html.match(/<tr[\s\S]*?<\/tr>/g) || [])) {
    const cells = (tr.match(/<td[\s\S]*?<\/td>/g) || []).map(stripTags)
    if (cells.length < 9) continue
    const code = cells[1] || ''
    if (!/^(GB\/T|GB|JB\/T|JB|MT|EN|IEC)\s/.test(code)) continue
    out.push({
      code,
      name: cells[4] || '',
      type: cells[5] || '',
      status: cells[6] || '',
      pubDate: cells[7] || '',
      implDate: cells[8] || '',
    })
  }
  return out
}

/** 查询一个基础标准号（如 "GB/T 14048.2"），返回该号的现行版本 + 历史 */
export async function queryStandard(base, timeoutMs = 15000) {
  // 用完整号查询 + 按发布日期倒序，保证第一页就是最新版
  const url = 'https://openstd.samr.gov.cn/bzgk/gb/std_list?p.p1=0&p.p90=circulation_date&p.p91=desc&p.p2='
    + encodeURIComponent(base)
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PlmStdWatch/1.0)' },
      signal: ctrl.signal,
    })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const html = await r.text()
    const all = parseStdList(html)

    // 只保留与 base 同号的（避免 14048.2 命中 14048.20、1984 命中 19843）
    const norm = (s) => String(s).replace(/\s+/g, '').toUpperCase()
    const target = norm(base)
    const hit = all.filter((x) => {
      const m = x.code.match(/^(.*?)-\d{4}$/)
      return m && norm(m[1]) === target
    })
    if (!hit.length) return { base, found: false, current: null, history: [] }

    const verOf = (x) => {
      const m = x.code.match(/-(\d{4})$/)
      return m ? Number(m[1]) : 0
    }
    hit.sort((a, b) => verOf(b) - verOf(a))
    // 现行为准；没有现行时退到「即将实施」（尚未生效，但可提前预警）；再退到最新一条
    const cur = hit.find((x) => /^现行/.test(x.status))
      || hit.find((x) => /即将实施/.test(x.status))
      || hit[0]
    return {
      base,
      found: true,
      current: {
        version: (cur.code.match(/-(\d{4})$/) || [])[1] || '',
        code: cur.code,
        name: cur.name,
        status: cur.status,
        implDate: cur.implDate,
      },
      history: hit.map((x) => ({ code: x.code, status: x.status, implDate: x.implDate })),
    }
  } finally {
    clearTimeout(timer)
  }
}

export function loadWatch() {
  try { return JSON.parse(fs.readFileSync(WATCH, 'utf8')) } catch (e) {
    return { meta: { period: 'quarter', autoCheck: true, lastRunAt: null }, standards: {} }
  }
}

export function saveWatch(data) {
  fs.writeFileSync(WATCH, JSON.stringify(data, null, 2) + '\n', 'utf8')
  return true
}

/** 距离上次核查是否已到周期 */
export function isDue(watch) {
  const meta = (watch && watch.meta) || {}
  if (!meta.lastRunAt) return true
  const days = PERIODS[meta.period] || PERIODS.quarter
  const diff = (Date.now() - new Date(meta.lastRunAt).getTime()) / 86400000
  return diff >= days
}

/** 待核查：从未查过、或已到周期、或上次失败 */
export function dueStandards(watch) {
  const stds = watch.standards || {}
  const now = Date.now()
  const days = PERIODS[(watch.meta && watch.meta.period) || 'quarter'] || PERIODS.quarter
  return Object.values(stds).filter((x) => {
    if (!x.checkedAt) return true
    if (x.error) return true
    return (now - new Date(x.checkedAt).getTime()) / 86400000 >= days
  })
}

/** 带重试的查询：公开平台偶发超时，失败后间隔 1s / 2s 再试 */
async function queryWithRetry(base, retries = 2) {
  let lastErr = null
  for (let i = 0; i <= retries; i++) {
    try {
      return await queryStandard(base)
    } catch (e) {
      lastErr = e
      if (i < retries) await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastErr
}

/**
 * 批量核查
 * @param {object} opt { codes?: string[], delayMs?: number, onProgress?: fn }
 */
export async function runCheck(opt = {}) {
  const delayMs = typeof opt.delayMs === 'number' ? opt.delayMs : 400
  const watch = loadWatch()
  watch.meta = watch.meta || { period: 'quarter', autoCheck: true }
  watch.standards = watch.standards || {}

  // 先把库里的标准同步进台账（新增的补上，删掉的保留历史）
  const collected = collectStandards()
  for (const c of collected) {
    const cur = watch.standards[c.base] || {}
    watch.standards[c.base] = {
      ...cur,
      base: c.base,
      refVers: c.refVers,
      subs: c.subs,
      refCount: c.subs.length,
    }
  }

  let list = collected.map((x) => x.base)
  if (Array.isArray(opt.codes) && opt.codes.length) {
    const set = new Set(opt.codes)
    list = list.filter((x) => set.has(x))
  } else {
    // 只查到期的（force 时查全部）
    if (!opt.force) {
      const due = new Set(dueStandards(watch).map((x) => x.base))
      list = list.filter((x) => due.has(x))
    }
  }

  const result = { checked: 0, outdated: 0, failed: 0, skipped: list.length === 0, items: [] }
  for (let i = 0; i < list.length; i++) {
    const base = list[i]
    if (typeof opt.onProgress === 'function') {
      try { opt.onProgress({ i, total: list.length, base }) } catch (e) { }
    }
    try {
      const r = await queryWithRetry(base)
      const item = watch.standards[base] || { base }
      item.checkedAt = new Date().toISOString()
      item.error = ''
      if (r.found && r.current) {
        item.latest = r.current.version
        item.status = r.current.status
        item.name = r.current.name
        item.implDate = r.current.implDate
        item.code = r.current.code
        item.history = r.history.slice(0, 8)
        // 库里引用的版本 < 最新版本 → 标记过期
        const refMax = Math.max(...(item.refVers || []).map((v) => Number(v)).filter((n) => n > 0), 0)
        item.outdated = !!(refMax && Number(r.current.version) > refMax)
        if (item.outdated) result.outdated++
      } else {
        item.latest = ''
        item.status = '未查到'
      }
      watch.standards[base] = item
      result.checked++
      result.items.push({ base, ok: true, ...item })
    } catch (e) {
      const item = watch.standards[base] || { base }
      item.checkedAt = new Date().toISOString()
      item.error = String((e && e.message) || e)
      watch.standards[base] = item
      result.failed++
      result.items.push({ base, ok: false, error: item.error })
    }
    if (i < list.length - 1) await new Promise((res) => setTimeout(res, delayMs))
  }

  watch.meta.lastRunAt = new Date().toISOString()
  watch.meta.lastRunResult = {
    checked: result.checked,
    outdated: result.outdated,
    failed: result.failed,
    at: watch.meta.lastRunAt,
  }
  saveWatch(watch)
  return result
}

/** 汇总供前端展示 */
export function summary() {
  const watch = loadWatch()
  const stds = Object.values(watch.standards || {})
  const due = dueStandards(watch)

  // 小类号 → 小类名，用于「被引用小类」列
  let clsMap = {}
  try { clsMap = JSON.parse(fs.readFileSync(path.join(CFG, 'classification-map.json'), 'utf8')) } catch (e) { clsMap = {} }

  const withSubs = stds.map((x) => ({
    ...x,
    subNames: (x.subs || []).map((s) => ({
      sub: s,
      name: (clsMap[s] || {}).subName || '',
    })),
  }))

  return {
    meta: watch.meta || {},
    total: stds.length,
    dueCount: due.length,
    due: due.map((x) => x.base),
    outdated: stds.filter((x) => x.outdated).map((x) => x.base),
    failed: stds.filter((x) => x.error).map((x) => x.base),
    standards: withSubs.sort((a, b) => String(a.base).localeCompare(String(b.base))),
  }
}

/**
 * PLM 物料录入助手 API（独立服务，与治理看板 3000 端口互不影响）。
 *
 * 职责：给 PLM 新增物料页面提供两个实时接口
 *   POST /api/plm/suggest  —— 名称/规格联想（同义词 + 存量高频写法）
 *   POST /api/plm/check    —— 保存前校验 + 同小类查重（返回可回填的建议值）
 *   GET  /api/plm/health   —— 探活（PLM 侧用它决定是否启用增强，失败即降级）
 *   POST /api/plm/reload   —— 重载内存索引（重新 extract 后调用）
 *
 * 设计约束（很重要）：
 *   1) 任何异常都返回 ok:false 的 200 响应，绝不抛 500 —— 不能因为本服务让 PLM 报错
 *   2) 全量 CORS + 处理 OPTIONS —— PLM 站点与本服务不同源
 *   3) 同时支持 application/json 与 x-www-form-urlencoded（后者不触发预检，兼容老浏览器）
 *
 * 启动：node src/plm-server.js
 * 配置：统一由项目根 .env 提供（经 src/env.js 加载），真实环境变量可覆盖
 *   PLM_API_PORT  监听端口，默认 3100
 *   PLM_API_HOST  监听地址，默认 0.0.0.0
 */
import http from 'http'
import os from 'os'
import { loadIndex, indexStatus, queryDuplicates, suggestNames, suggestSpecs, categoryOf, tokensOf } from './plm-index.js'
import { checkMaterial, suggestSpec } from './material-rules.js'
import { extractParams } from './struct-spec.js'
import { env, envPort, logEnvSource } from './env.js'

const PORT = envPort('PLM_API_PORT', 3100)
const HOST = env('PLM_API_HOST', '0.0.0.0')
const VERSION = '1.1.0'

/**
 * 内网地址判定与优先级。
 * 本环境除标准私有网段外，还有一个自定义内网段 198.168.0.0/16（ERP 所在网段），
 * 必须一并视为「内网」；否则会被当成外网排在后面，导致推荐地址选错。
 * 优先级：192.168 > 198.168 > 10 > 172.16/12 > 其它（如 11.x 宽带连接）
 */
const INTRANET_SCORE = (ip) => {
  if (/^192\.168\./.test(ip)) return 4
  if (/^198\.168\./.test(ip)) return 3
  if (/^10\./.test(ip)) return 2
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return 1
  return 0
}

/**
 * 列出本机可用于局域网访问的 IPv4 地址。
 * 目的：启动时给出「别人能填进 CFG.apiBase 的地址」。
 */
function listLocalIPv4() {
  const out = []
  let ifs = {}
  try { ifs = os.networkInterfaces() || {} } catch (e) { return out }
  for (const name of Object.keys(ifs)) {
    for (const a of ifs[name] || []) {
      if (!a || a.internal) continue
      const isV4 = a.family === 'IPv4' || a.family === 4
      if (!isV4) continue
      if (/^169\.254\./.test(a.address)) continue
      out.push({ name, address: a.address, score: INTRANET_SCORE(a.address) })
    }
  }
  return out
}

/**
 * 对外公布地址：
 *   1) .env 里显式指定 PLM_LAN_IP 时只用它（生产机推荐做法，避免多网卡歧义）
 *   2) 否则从本机网卡里挑一个内网优先级最高的
 * 只对外公布【一个】地址：多网卡全列出来（如 11.x 宽带连接、198.168.x）只会让人不知道填哪个。
 */
const LAN_IP = env('PLM_LAN_IP', '')
const LOCAL_ADDRS = listLocalIPv4()
const CANDIDATES = LAN_IP
  ? [{ name: 'PLM_LAN_IP', address: LAN_IP, score: 9 }]
  : LOCAL_ADDRS.slice().sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
const PRIMARY_ADDR = CANDIDATES[0] || null
const OTHER_COUNT = CANDIDATES.length > 1 ? CANDIDATES.length - 1 : 0

/** 仅当监听 0.0.0.0 / :: 时对局域网开放 */
const OPEN_TO_LAN = HOST === '0.0.0.0' || HOST === '::' || HOST === ''

// ---------- 工具 ----------
function send(res, code, obj) {
  const body = JSON.stringify(obj)
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = ''
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > 1024 * 256) { req.destroy(); resolve({}) ; return }  // 256KB 上限，防误传大文件
      raw += c
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      const ct = String(req.headers['content-type'] || '')
      try {
        if (ct.includes('application/json')) return resolve(JSON.parse(raw))
        if (ct.includes('x-www-form-urlencoded')) {
          const o = {}
          for (const [k, v] of new URLSearchParams(raw)) o[k] = v
          return resolve(o)
        }
        // 兜底：先按 JSON，再按 querystring
        try { return resolve(JSON.parse(raw)) } catch { }
        const o = {}
        for (const [k, v] of new URLSearchParams(raw)) o[k] = v
        return resolve(o)
      } catch { resolve({}) }
    })
    req.on('error', () => resolve({}))
  })
}

/** 从 PLM 传来的编码里取 6 位小类。PLM 的 ECODE 与 ERP FNUMBER 同一套编码规则。 */
function subOf(body) {
  const sub = body.sub || body.subPrefix
  if (sub) return String(sub).slice(0, 6)
  const code = body.ecode || body.ECODE || body.code || ''
  const s = String(code).trim()
  return s.length >= 6 ? s.slice(0, 6) : ''
}

function log(...args) {
  console.log(new Date().toISOString(), ...args)
}

// ---------- 业务 ----------
function handleSuggest(body) {
  const sub = subOf(body)
  const field = String(body.field || 'name').toLowerCase()
  const value = String(body.value || body.name || body.spec || '')
  const info = categoryOf(sub)

  const base = {
    ok: true,
    version: VERSION,
    field,
    sub,
    known: !!info,
    category: info ? { big: info.big, bigName: info.bigName, mid: info.mid, midName: info.midName, sub: info.sub, subName: info.subName } : null,
  }

  if (!sub || !info) {
    return { ...base, suggestions: [], hint: '编码前 6 位未命中分类表，无法按小类联想' }
  }
  if (!value.trim()) return { ...base, suggestions: [] }

  if (field === 'spec') {
    const suggestions = suggestSpecs({ sub, value })
    const tokens = tokensOf(sub)
    const params = extractParams(value, tokens)
    return {
      ...base,
      suggestions,
      normalized: suggestSpec(value),
      tokens,
      params,
      hint: tokens.length ? '该小类建议写清：' + tokens.slice(0, 6).join('/') : '',
    }
  }

  return { ...base, suggestions: suggestNames({ sub, value }) }
}

function handleCheck(body) {
  const t0 = Date.now()
  const sub = subOf(body)
  const name = String(body.name || body.ename || body.ENAME || '')
  const spec = String(body.spec || body.ggxh || body.GGXH || '')
  const zycs = String(body.zycs || body.ZYCS || '')
  const info = categoryOf(sub)

  const result = {
    ok: true,
    version: VERSION,
    sub,
    known: !!info,
    category: info ? { big: info.big, bigName: info.bigName, mid: info.mid, midName: info.midName, sub: info.sub, subName: info.subName } : null,
    pass: true,
    errors: [],
    warnings: [],
    duplicates: [],
    suggestion: { name: '', spec: '', zycs: '' },
    tokens: [],
    rulesVersion: '',
  }

  // 未执行查重的原因必须显式回传：否则调用方会把 pass:true 误读成"已查重且无重复"
  if (!sub) result.skipReason = '未取到物料编码，无法确定小类（编码前 6 位），已跳过查重'
  else if (!info) result.skipReason = '编码前 6 位 "' + sub + '" 未命中分类表，已跳过查重'

  // 1) 书写规则校验（复用 material-rules，与治理看板同一套规则）
  try {
    const r = checkMaterial({ name, spec, sub: sub || undefined })
    result.errors = r.errors || []
    result.warnings = r.warnings || []
    result.rulesVersion = r.rulesVersion || ''
    result.suggestion.name = r.suggestion?.name || ''
    result.suggestion.spec = r.suggestion?.spec || ''
    result.nameFormat = r.nameFormat || null
    result.nameSynonym = r.nameSynonym || null
    result.nameModel = r.nameModel || null
  } catch (e) {
    result.warnings.push('规则校验异常（已跳过）：' + e.message)
  }

  // 2) 同小类查重
  if (sub && info) {
    try {
      const d = queryDuplicates({ sub, name, spec, zycs, limit: 20 })
      result.duplicates = d.duplicates
      result.dupLevel = d.level
    } catch (e) {
      result.warnings.push('查重异常（已跳过）：' + e.message)
    }

    // 3) 特征参数建议（回填 PLM 的「主要参数 ZYCS」）
    try {
      const tokens = tokensOf(sub)
      result.tokens = tokens
      if (spec && tokens.length) {
        const params = extractParams(spec, tokens) || {}
        const parts = Object.entries(params)
          .filter(([, v]) => v != null && String(v).trim() !== '')
          .map(([k, v]) => k + ':' + v)
        result.suggestion.zycs = parts.join('；')
      }
    } catch (e) { /* 参数提取失败不影响主流程 */ }
  }

  // 4) 通过判定：有硬错误 → 不过；有 exact/sep 级重复 → 需人工确认后才放行
  const hardDup = result.duplicates.some((x) => x.level === 'exact' || x.level === 'sep')
  result.pass = result.errors.length === 0 && !hardDup
  result.blocking = result.errors.length
    ? { type: 'error', reason: result.errors[0] }
    : hardDup
      ? { type: 'duplicate', reason: '同小类已存在相同/等价物料：' + (result.duplicates[0].fNumber || '') }
      : null

  result.elapsedMs = Date.now() - t0
  return result
}

// ---------- 路由 ----------
const server = http.createServer(async (req, res) => {
  // 204 不能带响应体，单独回，避免 Content-Length 与实际不符
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Requested-With',
      'Access-Control-Max-Age': '86400',
    })
    return res.end()
  }
  const url = new URL(req.url, 'http://localhost')
  const p = url.pathname

  try {
    if (p === '/api/plm/health') {
      const st = indexStatus()
      return send(res, 200, {
        ok: true,
        version: VERSION,
        ...st,
        listen: {
          host: HOST,
          port: PORT,
          lanOpen: OPEN_TO_LAN,
          // 推荐的 CFG.apiBase：只给一个地址，避免多网卡时不知道该填哪个
          apiBase: OPEN_TO_LAN && PRIMARY_ADDR ? 'http://' + PRIMARY_ADDR.address + ':' + PORT : '',
          urls: [
            'http://127.0.0.1:' + PORT,
            ...(OPEN_TO_LAN && PRIMARY_ADDR ? ['http://' + PRIMARY_ADDR.address + ':' + PORT] : [])
          ]
        }
      })
    }
    if (p === '/api/plm/reload' && req.method === 'POST') {
      const st = await loadIndex({ force: true })
      log('[reload]', JSON.stringify(st))
      return send(res, 200, { ok: true, ...st })
    }
    if (p === '/api/plm/suggest' && req.method === 'POST') {
      const body = await readBody(req)
      const out = handleSuggest(body)
      log('[suggest]', body.field || 'name', JSON.stringify(String(body.value || '').slice(0, 40)), '->', out.suggestions.length)
      return send(res, 200, out)
    }
    if (p === '/api/plm/check' && req.method === 'POST') {
      const body = await readBody(req)
      const out = handleCheck(body)
      log('[check]', out.sub, JSON.stringify(String(body.name || '').slice(0, 20)), '| dup=', out.duplicates.length, '| pass=', out.pass, '|', out.elapsedMs + 'ms')
      return send(res, 200, out)
    }
    return send(res, 404, { ok: false, error: 'not found: ' + p })
  } catch (e) {
    // 兜底：任何异常都以 200 + ok:false 返回，避免 PLM 前端 jQuery 走 error 分支
    log('[error]', e && e.stack ? e.stack : String(e))
    return send(res, 200, { ok: false, error: String(e && e.message || e) })
  }
})

server.on('error', (e) => {
  if (e && e.code === 'EADDRINUSE') {
    log(`[FATAL] 端口 ${PORT} 已被占用。请在项目根 .env 中修改 PLM_API_PORT 换端口，`)
    log(`        并同步修改 PLM 侧 ItemSmartInput.js 的 CFG.apiBase`)
  } else {
    log('[FATAL] 服务启动失败：', e && e.message)
  }
  process.exit(1)
})

server.listen(PORT, HOST, () => {
  logEnvSource('plm-api')
  log(`PLM 物料录入助手 已启动（监听 ${HOST}:${PORT}）`)
  log(`  健康检查  GET  /api/plm/health`)
  log(`  联想      POST /api/plm/suggest`)
  log(`  查重校验  POST /api/plm/check`)
  log('')
  log(`  本机      http://127.0.0.1:${PORT}`)

  if (!OPEN_TO_LAN) {
    log(`  [!] 当前 PLM_API_HOST=${HOST}，只有本机可访问。`)
    log(`      要让其他电脑访问：设 PLM_API_HOST=0.0.0.0 后重启服务`)
  } else if (!PRIMARY_ADDR) {
    log('  [!] 未检测到局域网 IPv4 地址（可能未联网或仅有虚拟网卡），其他电脑暂时无法访问。')
  } else {
    log(`  局域网    http://${PRIMARY_ADDR.address}:${PORT}   ← CFG.apiBase 填这个`)
    if (OTHER_COUNT > 0) {
      log(`            （另有 ${OTHER_COUNT} 个网卡地址未展示，如需指定：在 .env 设 PLM_LAN_IP=<地址>）`)
    }
    log('')
    log(`  不要填 127.0.0.1 —— 那会指向 PLM 用户自己的电脑。`)
  }

  log('')
  log(`  跨机访问不通时，先确认防火墙已放通 TCP ${PORT}（Linux: sudo ufw allow ${PORT}/tcp）`)
  log('')

  loadIndex()
    .then((st) => log('[index] 就绪', JSON.stringify({ count: st.count, subs: st.subs, skipped: st.skippedNoCategory, ms: Date.now() - st.at + 'ms' })))
    .catch((e) => log('[index] 加载失败：', e.message))
})

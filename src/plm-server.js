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
import fs from 'fs'
import path from 'path'
import XLSX from 'xlsx'
import { fileURLToPath } from 'url'
import { loadIndex, indexStatus, queryDuplicates, suggestNames, suggestSpecs, categoryOf, tokensOf } from './plm-index.js'
import { checkMaterial, suggestSpec } from './material-rules.js'
import { extractParams } from './struct-spec.js'
import { env, envPort, logEnvSource } from './env.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SELECT_DIR = path.join(ROOT, 'data', 'selection')
const PORT = envPort('PLM_API_PORT', 3100)
const HOST = env('PLM_API_HOST', '0.0.0.0')
const VERSION = '1.4.0'

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

function readBody(req, maxBytes = 1024 * 256) {
  return new Promise((resolve) => {
    let raw = ''
    let size = 0
    req.on('data', (c) => {
      size += c.length
      if (size > maxBytes) { req.destroy(); resolve({}) ; return }  // 默认 256KB 上限，Excel 导入单独放宽
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

// ---------- 选型（厂家样本 → 参数组合 → 具体型号） ----------
const SELECT_SERIES_DIR = path.join(SELECT_DIR, 'series')

function sendHtml(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
    'Cache-Control': 'no-store',
  })
  res.end(html)
}

/** 管理页：读 public/admin-selection.html，按 mtime 缓存 */
let adminPageCache = null
function adminPage() {
  const file = path.join(ROOT, 'public', 'admin-selection.html')
  try {
    const mtime = fs.statSync(file).mtimeMs
    if (adminPageCache && adminPageCache.mtime === mtime) return adminPageCache.html
    const html = fs.readFileSync(file, 'utf8')
    adminPageCache = { mtime, html }
    return html
  } catch (e) {
    return '<!doctype html><meta charset="utf-8"><h3>缺少 public/admin-selection.html</h3><p>' + String(e.message) + '</p>'
  }
}

/**
 * 读取选型库，同时把「为什么是空」一起带出来：
 *   dirExists=false → 目录没建
 *   files=[]        → 目录在但没有 json
 *   errors 非空     → 文件解析失败
 * 这样接口调用方不用猜，也不必把服务器路径写进界面。
 */
// 文件级缓存：路径 → { mtime, series }。文件没变就不重复 parse，新增文件立刻可见。
const selectFileCache = new Map()

/**
 * 目录约定（导入库）：
 *   data/selection/series/<小类号>/<系列代号>.json
 *   data/selection/series/.history/            导入前的旧版本备份（最多 5 份）
 * 手写库仍在 data/selection/series.json（规则式）。
 *
 * 这里**不做整体 TTL 缓存**：每次调用都 readdir（几百个文件也只要几毫秒），
 * 只有文件 mtime 变化才重新解析，因此新增/修改文件**无需重启、无需等待**。
 */
function loadSelection() {
  const info = { series: [], dir: SELECT_DIR, dirExists: false, files: [], errors: [] }
  const okName = (f) => f.endsWith('.json') && !/\.(bak|backup|tmp|old)\b/i.test(f) && !/^[~#.]/.test(f)

  const readOne = (abs, rel) => {
    let st
    try { st = fs.statSync(abs) } catch { return }
    info.files.push(rel)
    const hit = selectFileCache.get(abs)
    if (hit && hit.mtime === st.mtimeMs) {
      for (const s of hit.series) info.series.push(Object.assign({ _file: rel }, s))
      return
    }
    try {
      const j = JSON.parse(fs.readFileSync(abs, 'utf8'))
      const arr = Array.isArray(j.series) ? j.series : (Array.isArray(j) ? j : [])
      if (!arr.length) { info.errors.push(rel + '：缺少 series 数组'); return }
      selectFileCache.set(abs, { mtime: st.mtimeMs, series: arr })
      for (const s of arr) info.series.push(Object.assign({ _file: rel }, s))
    } catch (e) {
      info.errors.push(rel + '：' + String((e && e.message) || e))
    }
  }

  // 最多下钻两层：selection/*.json、selection/series/*.json、selection/series/<sub>/*.json
  const scanDir = (dir, relPrefix, depth) => {
    let ents
    try { ents = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const e of ents) {
      const name = e.name
      if (name.startsWith('.') || name === '_history') continue    // 备份目录不参与
      if (e.isDirectory()) {
        if (depth < 2) scanDir(path.join(dir, name), relPrefix + name + '/', depth + 1)
        continue
      }
      if (!okName(name)) continue
      readOne(path.join(dir, name), relPrefix + name)
    }
  }

  try {
    info.dirExists = fs.existsSync(SELECT_DIR)
    if (info.dirExists) scanDir(SELECT_DIR, '', 0)
  } catch (e) {
    info.errors.push(String((e && e.message) || e))
  }

  // 清理已删除文件的缓存，避免内存长期增长
  if (selectFileCache.size > 500) {
    for (const k of [...selectFileCache.keys()]) {
      if (!fs.existsSync(k)) selectFileCache.delete(k)
    }
  }
  return info
}

/** 解析上传的 Excel（base64）：自动找表头行、推断每列类型与角色 */
function parseExcelBase64(base64) {
  const raw = String(base64 || '').replace(/^data:[^,]+,/, '')
  const buf = Buffer.from(raw, 'base64')
  if (!buf.length) return { ok: false, error: '文件为空或读取失败' }

  let wb
  try { wb = XLSX.read(buf, { type: 'buffer' }) } catch (e) {
    return { ok: false, error: '无法解析为 Excel：' + String((e && e.message) || e) }
  }
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return { ok: false, error: '工作簿里没有工作表' }
  const aoaRaw = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, raw: true, defval: '' })

  // 导入时统一全角转半角（表头与数据一起），并记录转换了多少处
  let halfWidthConverted = 0
  const half = (v) => {
    const n = countFullWidth(v)
    if (n) halfWidthConverted += n
    return toHalfWidth(v)
  }
  const aoa = aoaRaw.map((row) => (row || []).map(half))

  // 表头行：前 15 行里「非空单元格最多且不重复」的一行（厂家表前面常有标题/说明行）
  let headerRow = 0, best = -1
  for (let i = 0; i < Math.min(aoa.length, 15); i++) {
    const row = (aoa[i] || []).map((x) => String(x == null ? '' : x).trim())
    const cells = row.filter(Boolean)
    const uniq = new Set(cells)
    const score = cells.length === uniq.size ? cells.length : 0
    if (score > best) { best = score; headerRow = i }
  }
  const header = (aoa[headerRow] || []).map((x) => String(x == null ? '' : x).trim())
  if (!header.filter(Boolean).length) return { ok: false, error: '未识别到表头' }

  const body = aoa.slice(headerRow + 1)
    .filter((r) => (r || []).some((x) => String(x == null ? '' : x).trim() !== ''))

  const columns = header.map((name, idx) => {
    const vals = body.map((r) => (r && r[idx] != null ? r[idx] : '')).filter((v) => String(v).trim() !== '')
    const strs = vals.map((v) => String(v).trim())
    const uniq = [...new Set(strs)]
    const numCount = strs.filter((v) => v !== '' && !isNaN(Number(v))).length
    let type = 'text'
    if (strs.length && numCount >= strs.length * 0.9) type = 'number'
    else if (uniq.length > 0 && uniq.length <= 20) type = 'enum'
    const m = name.match(/[（(]\s*([^（）()]+?)\s*[）)]\s*$/)
    const unit = m ? m[1] : ''
    const key = name.replace(/[（(]\s*[^（）()]+?\s*[）)]\s*$/, '').trim() || ('列' + (idx + 1))
    const role = /^(型号|规格型号|产品型号|型号规格|model|type)$/i.test(key) ? 'model' : ''
    const col = {
      index: idx, key, raw: name || ('列' + (idx + 1)), unit, type, role,
      options: uniq.slice(0, 60), count: uniq.length, samples: uniq.slice(0, 3),
    }
    // 默认勾选「可筛」：按列类型与列名猜，导入后可在管理页调整
    col.filterable = isPrimaryColumn(col)
    return col
  }).filter((c) => c.raw)

  const rows = body.slice(0, 5000).map((r) => {
    const o = {}
    for (const c of columns) o[c.key] = (r && r[c.index] != null) ? r[c.index] : ''
    return o
  })

  // 「进规格」默认值：判断型号列是否已经包含该列的值
  //   已包含（如型号里已有 M6、12、8.8）→ 不重复拼
  //   中文描述类 / 长文本 → 不拼
  //   剩下短参数（3P、400、LSI）→ 拼进去
  const modelColTmp = columns.find((c) => c.role === 'model')
  const modelText = modelColTmp
    ? rows.slice(0, 30).map((r) => String(r[modelColTmp.key] == null ? '' : r[modelColTmp.key])).join(' ')
    : ''
  for (const c of columns) {
    if (c === modelColTmp) { c.specPart = true; continue }
    if (c.key === '小类号') { c.specPart = false; continue }
    if (SECONDARY_KEYS.test(String(c.key || ''))) { c.specPart = false; continue }
    const s0 = (c.samples || [])[0]
    const covered = !!(modelText && s0 && modelText.indexOf(String(s0)) >= 0)
    const short = !!(s0 && String(s0).length <= 8 && !/[\u4e00-\u9fa5]/.test(String(s0)))
    c.specPart = !covered && short
  }

  // 回填示例：让导入时就能看到规格会长什么样
  const sampleSpec = modelColTmp ? buildRowSpec(rows[0] || {}, columns, modelColTmp) : ''

  return {
    ok: true, sheetName, headerRow: headerRow + 1, columns, rows,
    total: body.length,
    halfWidthConverted,     // 本次自动转换的全角字符数
    sampleSpec,             // 第一行按当前「进规格」勾选回填后的样子
  }
}

/** 在系列档位里取第一个 >= need 的电流；都超出时取最大档 */
function pickCurrent(list, need) {
  const arr = (list || []).slice().sort((a, b) => a - b)
  for (const c of arr) if (c >= need) return c
  return arr.length ? arr[arr.length - 1] : 0
}

// 选型时的「主要参数」：按列类型 + 列名判断，避免把附件、接线能力这类次要项也堆到条件栏
const PRIMARY_KEYS = /极数|电流|分断|容量|功率|口径|压力|流量|芯数|截面|规格|长度|宽度|高度|直径|转速|扭矩/
const SECONDARY_KEYS = /附件|接线|端子|备注|说明|寿命|温度|海拔|防护|阻燃|安装|进线|认证|标准|材质|重量|包装/

function isPrimaryColumn(c) {
  if (!c || c.role === 'model') return false
  const k = String(c.key || '')
  if (k === '小类号') return false
  if (SECONDARY_KEYS.test(k)) return false
  if (c.type === 'enum') return true
  // 数字列：列名命中关键词，或档位很少（≤10，如性能等级 8.8、长度 12/16）也算关键参数
  if (c.type === 'number') return PRIMARY_KEYS.test(k) || (Number(c.count) > 0 && Number(c.count) <= 10)
  return false
}

/**
 * 全角 → 半角（导入时统一，避免 ／ 与 / 、全角数字这类差异导致后续匹配不上）
 *   - 全角字母、数字 → 半角
 *   - 全角空格 → 半角空格
 *   - 全角运算符/分隔符 → 对应半角
 *   - 中文括号（）保留：中文描述里换成半角反而难看
 */
// 只收「会影响识别」的全角符号：字母数字、空格、运算符/分隔符。
// 中文标点（：；！？，。、（））一律保留 —— 附件描述里「标配：」「；选配：」是正常写法。
const FULL_SYMBOL_MAP = {
  '／': '/', '＼': '\\', '－': '-', '＋': '+', '＊': '*', '＝': '=',
  '％': '%', '＆': '&', '＠': '@', '＃': '#', '．': '.', '｜': '|',
  '～': '~', '＜': '<', '＞': '>',
}
const FULL_RE = /[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A\u3000\u2014\u2013\u2015\uFE63／＼－＋＊＝％＆＠＃．｜～＜＞]/

function toHalfWidth(v) {
  const s = String(v == null ? '' : v)
  if (!s) return s
  return s
    // 全角数字 ０-９、字母 Ａ-Ｚ ａ-ｚ
    .replace(/[\uFF10-\uFF19\uFF21-\uFF3A\uFF41-\uFF5A]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    // 全角空格
    .replace(/\u3000/g, ' ')
    // 各种横杠/破折号统一为半角减号：—（U+2014）、–（U+2013）、―（U+2015）、﹣（U+FE63）
    .replace(/[\u2014\u2013\u2015\uFE63]/g, '-')
    // 全角运算符与分隔符
    .replace(/[／＼－＋＊＝％＆＠＃．｜～＜＞]/g, (ch) => FULL_SYMBOL_MAP[ch] || ch)
}

function countFullWidth(v) {
  const s = String(v == null ? '' : v)
  if (!s) return 0
  const m = s.match(new RegExp(FULL_RE.source, 'g'))
  return m ? m.length : 0
}

/**
 * 由一行数据拼出「完整规格」：型号 + 关键参数（带单位）。
 * 厂家表里型号常只是基础代号（如 3WT11N04），极数/电流/脱扣/分断都在别的列，
 * 只回填型号会丢掉这些信息。
 */
function buildRowSpec(row, cols, modelCol) {
  const base = String((row[modelCol.key] == null ? '' : row[modelCol.key])).trim()
  const parts = []
  if (base) parts.push(base)
  for (const c of cols) {
    if (c === modelCol) continue
    const k = String(c.key || '')
    if (k === '小类号') continue                    // 每行都一样，无意义
    const v = String(row[c.key] == null ? '' : row[c.key]).trim()
    if (!v || v === '—' || v === '-') continue      // 纯占位符跳过
    // 显式标了「不进规格」的列（如说明、附件、已被型号覆盖的参数）
    if (c.specPart === false) continue
    // 型号里已包含则不重复；单字符数字（如电流 1）容易误判，不参与比对
    const skipCmp = v.length === 1 && /\d/.test(v)
    if (base && !skipCmp && base.indexOf(v) >= 0) continue
    parts.push(c.unit && /^-?\d+(\.\d+)?$/.test(v) ? v + c.unit : v)
  }
  if (parts.length) return parts.join(' ')
  return cols.map((c) => String(row[c.key] == null ? '' : row[c.key]).trim()).filter(Boolean).join(' ')
}

/** 同小类 + 同系列代号只保留一份：Excel 导入的表格优先于手写规则库 */
function dedupeSelectionSeries(list) {
  const ordered = list.slice().sort(function (a, b) {
    const at = (Array.isArray(a.rows) && a.rows.length) ? 0 : 1
    const bt = (Array.isArray(b.rows) && b.rows.length) ? 0 : 1
    return at - bt
  })
  const seen = new Set()
  const out = []
  for (const s of ordered) {
    const k = String(s.sub || '') + '|' + String(s.id || '')
    if (seen.has(k)) continue
    seen.add(k)
    out.push(s)
  }
  return out
}

function handleSelect(body) {
  const all = loadSelection().series
  const seriesId = String(body.series || '').trim()
  const sub = String(body.sub || '').slice(0, 6)
  const scene = String(body.scene || '').trim()
  const poles = String(body.poles || '').trim()
  const curveIn = String(body.curve || '').trim().toUpperCase()
  const load = Number(body.current || 0)
  // 选型结果默认全量返回：单个系列的型号一般在几十条量级，
  // 上限放到 500 只为防止异常大表把响应撑爆
  const limit = Math.max(1, Math.min(Number(body.limit) || 500, 500))

  // 同名系列（同小类）只保留一份：Excel 导入的表格优先于手写规则库，避免重复列出
  const picked = all.filter((s) => (!seriesId || s.id === seriesId)
    && (!sub || String(s.sub || '').startsWith(sub))
    && s.enabled !== false)                       // 停用的系列不参与选型
  const usable = dedupeSelectionSeries(picked)

  const items = []
  let matched = 0        // 完整匹配数（不受 limit*3 截断影响），供前端显示「共 N 条」

  // Excel 导入的「列驱动」系列：直接按列值过滤 rows，参数组合即型号
  // filters 允许传对象（POST）或 JSON 字符串（GET 拼接）
  let filters = body.filters
  if (typeof filters === 'string') {
    try { filters = JSON.parse(filters) } catch (e) { filters = {} }
  }
  if (!filters || typeof filters !== 'object') filters = {}
  const MODEL_NAME = /^(型号|规格型号|产品型号|型号规格|model|type)$/i
  for (const s of usable) {
    if (!Array.isArray(s.rows) || !s.rows.length) continue
    const cols = Array.isArray(s.columns) ? s.columns : []
    // role 缺失时按列名兜底，避免把整行参数拼成型号
    const modelCol = cols.find((c) => c.role === 'model')
      || cols.find((c) => MODEL_NAME.test(String(c.key || '').trim()))
    for (const row of s.rows) {
      let hit = true
      for (const k in filters) {
        const v = filters[k]
        if (v == null || v === '') continue
        if (String(row[k] == null ? '' : row[k]).trim() !== String(v).trim()) { hit = false; break }
      }
      if (!hit) continue
      matched++
      if (items.length >= limit * 3) continue       // 只限制返回条数，不中断统计
      const model = modelCol
        ? String(row[modelCol.key] == null ? '' : row[modelCol.key])
        : cols.map((c) => String(row[c.key] == null ? '' : row[c.key])).filter(Boolean).join(' ')
      items.push({
        series: s.id, brand: s.brand || '', name: s.name || '',
        model,                                   // 纯型号，表格首列显示
        spec: modelCol ? buildRowSpec(row, cols, modelCol) : model,   // 完整规格（含附件）
        cells: row,
        poles: row['极数'] || '', current: row['额定电流'] || '',
        curve: row['脱扣曲线'] || '', breaking: row['分断能力'] || null,
        source: s.source || '', recommended: false,
      })
    }
  }

  for (const s of usable) {
    if (Array.isArray(s.rows) && s.rows.length) continue     // 列驱动系列已在上方处理
    const p = s.params || {}
    const currents = Array.isArray(p.ratedCurrent) ? p.ratedCurrent : []
    if (!currents.length) continue
    const poleList = Array.isArray(p.poles) && p.poles.length ? p.poles : ['']
    const curves = Array.isArray(p.curve) && p.curve.length
      ? p.curve : Object.keys(p.ratedBreaking || {})

    const factor = Number((s.rules && s.rules.currentFactor) || 1.25)
    const need = load > 0 ? load * factor : 0
    const target = need > 0 ? pickCurrent(currents, need) : 0
    const sceneCurve = (scene && s.rules && s.rules.curveByScene)
      ? (s.rules.curveByScene[scene] || '') : ''
    const curve = curveIn || sceneCurve || curves[0] || ''
    const pattern = String(s.modelPattern || '{series} {poles} {curve}{current}')
    const curList = target ? [target] : currents

    for (const c of curList) {
      for (const po of (poles ? [poles] : poleList)) {
        matched++
        items.push({
          series: s.id,
          brand: s.brand || '',
          name: s.name || '',
          model: pattern.replace('{series}', s.id).replace('{poles}', po)
            .replace('{curve}', curve).replace('{current}', c),
          poles: po,
          current: c,
          curve,
          breaking: (p.ratedBreaking || {})[curve] || null,
          voltage: p.voltage || '',
          terminal: p.terminal || null,
          // 附件是「选完之后再配」的东西，跟着型号回传，供回填后提示
          accessories: Array.isArray(p.accessories) ? p.accessories : [],
          source: s.source || '',
          recommended: !!target && c === target,
        })
      }
    }
  }

  items.sort((a, b) => (b.recommended - a.recommended)
    || (a.current - b.current) || String(a.poles).localeCompare(String(b.poles)))

  // 列定义（供前端动态渲染表头与筛选器）：合并本次命中的「表格」系列
  const columnsOut = []
  const seenCol = new Set()
  for (const s of usable) {
    if (!Array.isArray(s.rows) || !s.rows.length) continue
    for (const c of (s.columns || [])) {
      const k = String(c.key || '')
      if (!k || seenCol.has(k)) continue
      seenCol.add(k)
      columnsOut.push({
        key: k,
        unit: c.unit || '',
        type: c.type || 'text',
        role: c.role || '',
        options: Array.isArray(c.options) ? c.options.slice(0, 60) : [],
      })
    }
  }

  return {
    ok: true,
    version: VERSION,
    query: { series: seriesId, sub, scene, poles, curve: curveIn, current: load },
    columns: columnsOut,
    total: matched,                     // 完整匹配数（前端「共 N 条」用这个）
    returned: Math.min(items.length, limit),
    items: items.slice(0, limit),
  }
}

/** 导入一个系列（列驱动）：写 data/selection/series/<sub>_<id>.json */
function importSeries(body) {
  const sub = String(body.sub || '').trim()
  const id = String(body.id || '').trim()
  // 保存前再统一一次全角转半角（管理页编辑时也可能输入全角，幂等操作）
  const columns = (Array.isArray(body.columns) ? body.columns : []).map((c) => ({
    ...c,
    key: toHalfWidth(c.key),
    unit: toHalfWidth(c.unit || ''),
    options: Array.isArray(c.options) ? c.options.map(toHalfWidth) : [],
  }))
  const rows = (Array.isArray(body.rows) ? body.rows : []).map((r) => {
    const o = {}
    for (const k in r) o[toHalfWidth(k)] = toHalfWidth(r[k])
    return o
  })

  if (!/^\d{6}$/.test(sub)) return { ok: false, error: '小类号必须是 6 位数字' }
  if (!id) return { ok: false, error: '系列代号不能为空' }
  if (!columns.length) return { ok: false, error: '没有可用的参数列' }
  if (!rows.length) return { ok: false, error: '没有数据行（检查表头行是否识别正确）' }

  const modelCol = columns.find((c) => c.role === 'model')
  if (modelCol) {
    for (let i = 0; i < rows.length; i++) {
      if (!String(rows[i][modelCol.key] == null ? '' : rows[i][modelCol.key]).trim()) {
        return { ok: false, error: '第 ' + (i + 1) + ' 条数据的型号为空' }
      }
    }
  }

  // 目录按小类分层：series/<小类号>/<系列代号>.json
  const safe = (s) => String(s).replace(/[\\/:*?"<>|\s]+/g, '_')
  const subDir = path.join(SELECT_SERIES_DIR, sub)
  fs.mkdirSync(subDir, { recursive: true })
  const fileName = safe(id) + '.json'
  const abs = path.join(subDir, fileName)
  const now = new Date().toISOString()
  const data = {
    meta: { importedAt: now, source: String(body.source || ''), description: 'Excel 导入（列驱动：列即参数）' },
    series: [{
      id, sub,
      brand: String(body.brand || ''),
      name: String(body.name || ''),
      source: String(body.source || ''),
      importedAt: now,
      mode: 'table',
      columns,
      rows,
    }],
  }

  // 覆盖前先备份到 series/.history/，保留最近 5 份，避免误导入覆盖掉可用数据
  let backup = ''
  if (fs.existsSync(abs)) {
    try {
      const hist = path.join(SELECT_SERIES_DIR, '.history')
      fs.mkdirSync(hist, { recursive: true })
      const bname = safe(id) + '-' + Date.now() + '.json'
      fs.copyFileSync(abs, path.join(hist, bname))
      backup = 'series/.history/' + bname
      const olds = fs.readdirSync(hist).filter((f) => f.startsWith(safe(id) + '-')).sort()
      for (const f of olds.slice(0, Math.max(0, olds.length - 5))) {
        try { fs.unlinkSync(path.join(hist, f)) } catch (e) { /* 忽略 */ }
      }
    } catch (e) { /* 备份失败不阻断导入 */ }
  }

  fs.writeFileSync(abs, JSON.stringify(data, null, 2), 'utf8')
  return {
    ok: true, file: 'series/' + sub + '/' + fileName,
    count: rows.length, columns: columns.length,
    replaced: !!backup, backup,
  }
}

/** 启用/停用：厂家升级换代后旧系列停用，不再出现在选型助手里 */
function toggleSeries(file, enabled) {
  const rel = String(file || '').replace(/^\/+/, '')
  if (!/^series\/[^\\/]+\/[^\\/]+\.json$/.test(rel)) return { ok: false, error: '文件名不合法' }
  const abs = path.resolve(SELECT_DIR, rel)
  if (!abs.startsWith(path.resolve(SELECT_DIR)) || !fs.existsSync(abs)) {
    return { ok: false, error: '文件不存在' }
  }
  try {
    const j = JSON.parse(fs.readFileSync(abs, 'utf8'))
    const s = (Array.isArray(j.series) ? j.series[0] : null)
    if (!s) return { ok: false, error: '文件里没有系列数据' }
    s.enabled = !!enabled
    fs.writeFileSync(abs, JSON.stringify(j, null, 2), 'utf8')
    return { ok: true, file: rel, enabled: s.enabled }
  } catch (e) {
    return { ok: false, error: '切换失败：' + String((e && e.message) || e) }
  }
}

function deleteSelectionFile(file, id) {
  const rel = String(file || '').replace(/^\/+/, '')
  const abs = path.resolve(SELECT_DIR, rel)
  if (!abs.startsWith(path.resolve(SELECT_DIR))) return { ok: false, error: '路径不合法' }

  // ① 导入库：一个文件就是一个系列，直接删文件
  if (/^series\/[^\\/]+\/[^\\/]+\.json$/.test(rel)) {
    if (!fs.existsSync(abs)) return { ok: false, error: '文件不存在' }
    fs.unlinkSync(abs)
    selectFileCache.delete(abs)
    return { ok: true, file: rel }
  }

  // ② 手写库（如 series.json）：文件里可能有多个系列，只移除指定 id，其余保留
  if (/^[^\\/]+\.json$/.test(rel) && id) {
    if (!fs.existsSync(abs)) return { ok: false, error: '文件不存在' }
    try {
      const j = JSON.parse(fs.readFileSync(abs, 'utf8'))
      const arr = Array.isArray(j.series) ? j.series : []
      const next = arr.filter((s) => String(s.id) !== String(id))
      if (next.length === arr.length) return { ok: false, error: '未找到该系列' }
      if (!next.length) {
        fs.unlinkSync(abs)              // 删空了就把文件一起删掉
        selectFileCache.delete(abs)
        return { ok: true, file: rel, removed: arr.length }
      }
      j.series = next
      fs.writeFileSync(abs, JSON.stringify(j, null, 2), 'utf8')
      selectFileCache.delete(abs)
      return { ok: true, file: rel, removed: arr.length - next.length }
    } catch (e) {
      return { ok: false, error: '删除失败：' + String((e && e.message) || e) }
    }
  }

  return { ok: false, error: '不支持的删除路径' }
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
    specFormat: null,
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
    // 规格空格体检：前端据此可一键修正/保存前自动应用
    result.specFormat = r.specFormat || null
    // 名称与所选小类不符（疑似选错小类）：带候选类别，前端可展示
    result.subMismatch = r.subMismatch || null
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
    // ---------- 选型库管理（原型） ----------
    if (p === '/admin/selection' && req.method === 'GET') {
      return sendHtml(res, adminPage())
    }
    if (p === '/api/plm/select/parse' && req.method === 'POST') {
      const body = await readBody(req, 12 * 1024 * 1024)      // Excel 可能几 MB
      const out = parseExcelBase64(body.data)
      if (out.ok) out.fileName = String(body.fileName || '')
      return send(res, 200, out)
    }
    if (p === '/api/plm/select/import' && req.method === 'POST') {
      const body = await readBody(req, 12 * 1024 * 1024)
      const out = importSeries(body)
      log('[select-import]', out.ok ? 'ok' : out.error, out.file || '')
      return send(res, 200, out)
    }
    if (p === '/api/plm/select/list' && req.method === 'GET') {
      const info = loadSelection()
      return send(res, 200, {
        ok: true,
        dirExists: info.dirExists,
        errors: info.errors,
        series: info.series.map((s) => ({
          id: s.id, sub: s.sub || '', brand: s.brand || '', name: s.name || '',
          mode: s.mode || (Array.isArray(s.rows) ? 'table' : 'pattern'),
          enabled: s.enabled !== false,
          file: s._file || '',
          rowCount: Array.isArray(s.rows) ? s.rows.length : 0,
          columnCount: Array.isArray(s.columns) ? s.columns.length : 0,
          source: s.source || '', importedAt: s.importedAt || '',
        })),
      })
    }
    if (p === '/api/plm/select/detail' && req.method === 'GET') {
      const rel = String(url.searchParams.get('file') || '').replace(/^\/+/, '')
      if (!/^series\/[^\\/]+\/[^\\/]+\.json$/.test(rel)) {
        return send(res, 200, { ok: false, error: '文件名不合法' })
      }
      const abs = path.resolve(SELECT_DIR, rel)
      if (!abs.startsWith(path.resolve(SELECT_DIR)) || !fs.existsSync(abs)) {
        return send(res, 200, { ok: false, error: '文件不存在' })
      }
      try {
        const j = JSON.parse(fs.readFileSync(abs, 'utf8'))
        const s = (Array.isArray(j.series) ? j.series[0] : null) || {}
        return send(res, 200, { ok: true, file: rel, series: s })
      } catch (e) {
        return send(res, 200, { ok: false, error: '读取失败：' + String((e && e.message) || e) })
      }
    }
    if (p === '/api/plm/select/toggle' && req.method === 'POST') {
      const body = await readBody(req)
      return send(res, 200, toggleSeries(body.file, body.enabled))
    }
    if (p === '/api/plm/select/delete' && req.method === 'POST') {
      const body = await readBody(req)
      return send(res, 200, deleteSelectionFile(body.file, body.id))
    }
    if (p === '/api/plm/select/series' && req.method === 'GET') {
      const info = loadSelection()
      // 选型库必须按小类隔离：不同小类的系列不能混在一起选
      const sub = String(url.searchParams.get('sub') || '').slice(0, 6)
      const list = dedupeSelectionSeries(sub
        ? info.series.filter((s) => String(s.sub || '').startsWith(sub))
        : info.series)
      return send(res, 200, {
        ok: true,
        sub,
        dirExists: info.dirExists,
        fileCount: info.files.length,
        files: info.files,
        errors: info.errors,
        series: list.map((s) => ({
          id: s.id, brand: s.brand || '', name: s.name || '', sub: s.sub || '',
          source: s.source || '', params: s.params || {}, rules: s.rules || {},
          // 表格系列：把列定义一起给前端，条件栏才能按参数动态生成
          mode: (Array.isArray(s.rows) && s.rows.length) ? 'table' : 'pattern',
          enabled: s.enabled !== false,     // 停用的系列不参与选型
          rowCount: Array.isArray(s.rows) ? s.rows.length : 0,
          columns: Array.isArray(s.columns)
            ? s.columns.map((c) => ({
                key: c.key, unit: c.unit || '', type: c.type || 'text', role: c.role || '',
                options: Array.isArray(c.options) ? c.options.slice(0, 60) : [],
                // 管理页勾选优先；老数据没有这个字段时按列类型/列名推断
                filterable: (typeof c.filterable === 'boolean') ? c.filterable : isPrimaryColumn(c),
              }))
            : [],
        })),
      })
    }
    if (p === '/api/plm/select' && (req.method === 'GET' || req.method === 'POST')) {
      const body = req.method === 'POST'
        ? await readBody(req)
        : Object.fromEntries(url.searchParams.entries())
      const out = handleSelect(body)
      log('[select]', JSON.stringify(body), '->', out.total)
      return send(res, 200, out)
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

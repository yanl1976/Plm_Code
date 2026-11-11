/**
 * 通过 PLM 既有服务取库存（不再直连 ERP 数据库）
 *
 * 调用链（从 PLM 前端源码还原，2026-11-11）：
 *   1) 登录
 *      POST {PLM_BASE}/Platform/PlatformService.asmx/TryLogin
 *      body { para: { UserName, Password, Connect, Lang:'zh-CN', LoginDeviceType:'PC', AutoLogin:false } }
 *      返回 IdentityToken 等，后续每次服务调用都要原样带上
 *
 *   2) 服务调用（PLM 前端 HoteamUI.DataService.Call 的实际报文）
 *      POST {PLM_BASE}/Base/BaseService.asmx/DataService
 *      body {
 *        para:    { ServiceUri, ...loginPara },
 *        content: JSON.stringify({ para: { ...loginPara, ...业务参数 } })
 *      }
 *
 *   3) 库存方法（TSDC\PSE\Item\Config\UIConfig\StockSearch.list 中绑定的数据服务）
 *      Hoteam.InforCenter.ERPService.GetStockSearchData
 *      业务参数见 TSDC\PSE\Item\Config\Json\StockSearchRequest.json：
 *        FormId     = STK_Inventory
 *        FieldKeys  = FMaterialId,FMaterialName,FStockName,FBaseQty,FMTONO,FStockId
 *
 * 环境变量：
 *   PLM_BASE      PLM 站点地址，如 http://192.168.20.31
 *   PLM_USER      只读服务账号
 *   PLM_PASSWORD  密码
 *   PLM_CONNECT   账套（登录页的“数据库”）
 *   PLM_TIMEOUT   超时(ms)，默认 15000
 *   INVENTORY_SOURCE  erp(默认) | plm —— 设为 plm 时库存优先走 PLM
 */

const ENV = () => ({
  base: String(process.env.PLM_BASE || '').replace(/\/+$/, ''),
  user: process.env.PLM_USER || '',
  pwd: process.env.PLM_PASSWORD || '',
  connect: process.env.PLM_CONNECT || '',
  timeout: Number(process.env.PLM_TIMEOUT || 15000),
})

export function plmConfigured() {
  const c = ENV()
  return !!(c.base && c.user && c.pwd)
}

let session = null // { at, para }

async function postJson(url, body, timeout) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
    const text = await res.text()
    let json = null
    try { json = JSON.parse(text) } catch (e) { json = null }
    return { status: res.status, text, json }
  } finally {
    clearTimeout(timer)
  }
}

/** ASMX / DataService 的返回可能套了多层（d → 字符串 → 对象），逐层剥 */
function deepUnwrap(v) {
  let x = v
  for (let i = 0; i < 5; i++) {
    if (typeof x === 'string') {
      const s = x.trim()
      if (!s || (s[0] !== '{' && s[0] !== '[')) break
      try { x = JSON.parse(s); continue } catch (e) { break }
    }
    if (Array.isArray(x)) break
    if (x && typeof x === 'object') {
      const keys = Object.keys(x)
      if (keys.length === 1) { x = x[keys[0]]; continue }
      if ('d' in x) { x = x.d; continue }
    }
    break
  }
  return x
}

const LOGIN_KEEP = [
  'CompanyID', 'Connect', 'HomePageMode', 'HostIP', 'HostPort', 'IdentityToken', 'Lang',
  'LoginDeviceType', 'LoginID', 'LoginIP', 'OwnGroupCode', 'TimeZone', 'UserCode',
  'UserGroup', 'UserGroupName', 'UserID', 'UserName', 'UserRoleType', 'UserSecurityLevel',
]

async function login(force) {
  const c = ENV()
  if (!c.base || !c.user || !c.pwd) throw new Error('未配置 PLM_BASE / PLM_USER / PLM_PASSWORD')
  if (!force && session && Date.now() - session.at < 20 * 60 * 1000) return session.para

  const r = await postJson(c.base + '/Platform/PlatformService.asmx/TryLogin', {
    para: {
      UserName: c.user,
      Password: c.pwd,
      Connect: c.connect,
      Lang: 'zh-CN',
      LoginDeviceType: 'PC',
      AutoLogin: false,
    },
  }, c.timeout)

  const d = deepUnwrap(r.json)
  if (!d || !d.IdentityToken) {
    throw new Error('PLM 登录失败（HTTP ' + r.status + '）：' + String(r.text || '').slice(0, 300))
  }
  const para = {}
  for (const k of LOGIN_KEEP) if (d[k] != null) para[k] = d[k]
  session = { at: Date.now(), para }
  return para
}

/** 调用 PLM 服务，返回已剥壳的对象；失败抛错并带上原始返回片段 */
async function callService(uri, bizPara, retried) {
  const c = ENV()
  const lp = await login()
  const body = {
    para: Object.assign({ ServiceUri: uri }, lp),
    content: JSON.stringify({ para: Object.assign({}, lp, bizPara || {}) }),
  }
  const r = await postJson(c.base + '/Base/BaseService.asmx/DataService', body, c.timeout)
  const text = r.text || ''

  // 会话失效：重登一次
  if (!retried && (r.status === 401 || /IdentityToken|登录|Session/i.test(text) && /expire|失效|过期/i.test(text))) {
    await login(true)
    return callService(uri, bizPara, true)
  }
  if (r.status !== 200) throw new Error('PLM 服务调用失败（HTTP ' + r.status + '）：' + text.slice(0, 300))

  const data = deepUnwrap(r.json)
  return { data, raw: text }
}

/** 从各种可能的返回结构里找出行数组 */
function pickRows(d) {
  if (!d) return null
  if (Array.isArray(d)) return d
  for (const k of ['Rows', 'rows', 'Data', 'data', 'Result', 'result', 'Items', 'items']) {
    if (Array.isArray(d[k])) return d[k]
    if (d[k] && typeof d[k] === 'object') {
      const inner = pickRows(d[k])
      if (inner) return inner
    }
  }
  if (d.Result && typeof d.Result === 'string') {
    try { return pickRows(JSON.parse(d.Result)) } catch (e) { return null }
  }
  return null
}

/** 库存查询：返回与现有 /api/new-material/inventory 一致的结构 */
export async function plmStock(code) {
  const c = code
  const req = {
    FormId: 'STK_Inventory',
    FieldKeys: 'FMaterialId,FMaterialName,FStockName,FBaseQty,FMTONO,FStockId',
    FilterString: [],
    OrderString: '',
    TopRowCount: 0,
    StartRow: 0,
    Limit: 2000,
    SubSystemId: '',
  }
  const { data, raw } = await callService('Hoteam.InforCenter.ERPService.GetStockSearchData', req)
  const rows = pickRows(data)
  if (!rows) {
    return {
      code: c, available: false, found: false,
      total: { qty: 0, avbqty: 0, lockqty: 0 }, warehouses: [], details: [],
      note: 'PLM 返回结构未识别（见 raw）', raw: String(raw || '').slice(0, 1500),
    }
  }
  const hit = rows.filter((x) => String(x.FMaterialId || x.FNumber || '').trim() === c)
  if (!hit.length) {
    return { code: c, available: true, found: false, total: { qty: 0, avbqty: 0, lockqty: 0 }, warehouses: [], details: [], note: 'PLM 中该物料无库存记录' }
  }
  const byStock = new Map()
  let qty = 0
  for (const x of hit) {
    const n = Number(x.FBaseQty || 0)
    const name = String(x.FStockName || '').trim() || ('仓库#' + (x.FStockId || ''))
    const pj = String(x.FMTONO || '').trim()
    qty += n
    const key = name + '|' + pj
    byStock.set(key, (byStock.get(key) || 0) + n)
  }
  const warehouses = [...byStock.entries()].map(([k, n]) => {
    const [stockName, projectNo] = k.split('|')
    return { stockName, projectNo, qty: +n.toFixed(3) }
  })
  return {
    code: c,
    available: true,
    found: true,
    source: 'plm',
    total: { qty: +qty.toFixed(3), avbqty: +qty.toFixed(3), lockqty: 0 },
    unit: '',
    warehouses,
    details: hit.slice(0, 50).map((x) => ({
      stockName: String(x.FStockName || ''),
      qty: Number(x.FBaseQty || 0),
      projectNo: String(x.FMTONO || ''),
    })),
    note: '来自 PLM 库存查询服务（数量为基本单位数量，未扣锁库）',
  }
}

/** 现场探针：原样返回 PLM 的响应，便于确认结构与 FilterString 语法 */
export async function plmProbe(code) {
  const req = {
    FormId: 'STK_Inventory',
    FieldKeys: 'FMaterialId,FMaterialName,FStockName,FBaseQty,FMTONO,FStockId',
    FilterString: [],
    Limit: 20,
  }
  if (code) req.FilterString = ["FMaterialId='" + code + "'"]
  const r = await callService('Hoteam.InforCenter.ERPService.GetStockSearchData', req)
  const rows = pickRows(r.data)
  return {
    ok: true,
    rowCount: rows ? rows.length : 0,
    sample: rows ? rows.slice(0, 5) : null,
    dataShape: r.data && typeof r.data === 'object' ? Object.keys(r.data) : typeof r.data,
    raw: String(r.raw || '').slice(0, 4000),
  }
}

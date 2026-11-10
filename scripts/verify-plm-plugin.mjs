/**
 * PLM 录入助手（ItemSmartInput.js）程序逻辑验证器
 *
 * 目的：在没有 PLM 站点的前提下，验证前端脚本的【控制流】是否正确 ——
 *   绑定、防抖联想、浮层选型、回填、失焦提示、保存前阻断/放行、降级、二次打开页。
 *
 * 做法：用 vm 创建一个最小 sandbox（window/document/jQuery/HoteamUI/控件），
 *      真实执行 ItemSmartInput.js，再用 mock 的 $.ajax 注入各类响应。
 *
 * 说明：这是【控制流】验证，不替代真实浏览器验证（真实 DOM / 真实网络仍需现场确认）。
 *       网络层已由 /api/plm/* 的端到端测试单独覆盖。
 *
 * 运行：node scripts/verify-plm-plugin.mjs
 */
import fs from 'fs'
import path from 'path'
import vm from 'vm'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PLUGIN = path.join(ROOT, 'PLMSOFT', 'Server', 'SecondaryDev', 'ItemSmartInput', 'Config', 'Js', 'ItemSmartInput.js')
const CODE = fs.readFileSync(PLUGIN, 'utf8')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let pass = 0, fail = 0
const failures = []
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  \u2713 ' + name) }
  else { fail++; failures.push(name); console.log('  \u2717 ' + name + (extra ? '  >> ' + extra : '')) }
}

// ---------------- 最小 DOM / jQuery / 控件 mock ----------------
function mkEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
    style: {},
    value: '',
    __handlers: [],
    children: [],
    innerHTML: '',
    parentNode: null,
    appendChild(c) { this.children.push(c); c.parentNode = this; c.parent = this; return c },
    insertBefore(node, ref) {
      const i = ref ? this.children.indexOf(ref) : -1
      if (i >= 0) this.children.splice(i, 0, node)
      else this.children.push(node)
      node.parentNode = this; node.parent = this
      return node
    },
    contains(n) {
      if (n === this) return true
      return this.children.some((c) => c.contains && c.contains(n))
    },
    querySelector(sel) {
      // 仅支持类选择器（插件用它判断按钮是否已注入）；标签选择器保持原来的 null
      if (typeof sel !== 'string' || sel.charAt(0) !== '.') return null
      const cls = sel.slice(1)
      const has = (c) => String(c.className || '').split(/\s+/).includes(cls)
      const direct = this.children.find(has)
      if (direct) return direct
      for (const c of this.children) {
        const r = c.querySelector ? c.querySelector(sel) : null
        if (r) return r
      }
      return null
    },
    getBoundingClientRect() { return { left: 10, top: 10, right: 210, bottom: 30, width: 200, height: 20 } },
  }
  return el
}

function makeJQ(doc, getAjax) {
  function wrap(el) {
    const api = {
      on(evt, fn) { (el.__handlers = el.__handlers || []).push({ evt, fn }); return api },
      off(evtName) {
        if (!evtName) { el.__handlers = []; return api }
        const key = String(evtName).replace(/^\./, '')
        el.__handlers = (el.__handlers || []).filter((h) => h.evt.indexOf(key) < 0)
        return api
      },
      val(v) { if (v === undefined) return el.value; el.value = v; return api },
      trigger(evt) {
        for (const h of (el.__handlers || [])) {
          if (String(h.evt).indexOf(evt) >= 0) { try { h.fn.call(el, {}) } catch (e) { } }
        }
        return api
      },
      attr(k) { return k === 'data-idx' ? el.__idx : el[k] },
      get() { return el },
      length: 1,
      0: el,
    }
    return api
  }

  const $ = function (sel, ctx) {
    if (typeof sel === 'string') {
      if (sel === '.hi-item') {
        // renderPanel 里绑定候选点击：把回调挂到 doc.__picker
        const fake = mkEl('div')
        const api = wrap(fake)
        const originOn = api.on
        api.on = function (evt, fn) { doc.__picker = fn; return api }
        api.off = originOn
        return api
      }
      if (sel.charAt(0) === '#') {
        const el = doc.__byId[sel.slice(1)]
        return el ? wrap(el) : { 0: null, get: () => null, on() { }, off() { }, length: 0 }
      }
      return { 0: null, get: () => null, on() { }, off() { }, length: 0 }
    }
    if (sel === doc) { return wrap(doc) }
    return wrap(sel)
  }
  $.ajax = function (opts) {
    const resp = getAjax()(opts)
    const deliver = () => {
      if (resp === null || resp === undefined) { if (opts.error) opts.error() }
      else if (opts.success) opts.success(resp)
    }
    // 模拟 jQuery 语义：async:false 同步回调，否则异步回调
    if (opts.async === false) deliver()
    else setTimeout(deliver, 0)
  }
  return $
}

/** 创建一个"页面实例"：控件 + DOM + sandbox，并执行插件脚本 */
function newPage({ ctrls, ajaxHandler, confirmReturn = true, globalCfg = null }) {
  const doc = mkEl('body')
  doc.body = mkEl('body')
  doc.documentElement = mkEl('html')
  doc.createElement = (t) => mkEl(t)
  doc.getElementById = (id) => doc.__byId[id] || null
  doc.__byId = {}
  doc.__handlers = []
  doc.__picker = null

  let handler = ajaxHandler
  const jq = makeJQ(doc, () => handler)

  // 控件对象（模拟 PLM 的 OTextBox / OEditButton）
  // form 作为输入框的父容器：按钮注入依赖 parentNode
  const form = mkEl('div')
  doc.body.appendChild(form)
  const ctl = {}
  for (const [id, init] of Object.entries(ctrls)) {
    const dom = mkEl('input')
    dom.id = id
    doc.__byId[id] = dom
    form.appendChild(dom)
    const c = {
      id,
      __text: init.text || '',
      __value: init.value != null ? init.value : null,
      __tag: init.tag || null,
      GetText() { return this.__text },
      GetSelectedValue() { return this.__value != null ? this.__value : this.__text },
      SetText(v) { this.__text = v; dom.value = v },
      GetTag() { return this.__tag },
      SetTag(t) { this.__tag = t },
      GetDom() { return dom },
      Check() { return true },
    }
    // 首次同步：把初值写进 DOM，供 $(el).val() 读取
    dom.value = c.__text
    ctl[id] = c
  }

  const pageEvent = {
    o: {
      ContainerID: () => 'PAGE1',
      GetControl: (id) => ctl[id] || { id: '' },
      GetPara: () => ({}),
    },
  }

  const HoteamUI = {
    UIManager: {
      MsgBox: (t, m) => { doc.__msg = { t, m } },
      ConfirmBox: (t, m) => { doc.__confirmCalls = (doc.__confirmCalls || 0) + 1; return confirmReturn },
    },
    Language: { Lang: (k) => k },
  }

  const sandbox = {}
  sandbox.window = sandbox
  sandbox.document = doc
  sandbox.console = console
  sandbox.setTimeout = setTimeout
  sandbox.clearTimeout = clearTimeout
  sandbox.setInterval = setInterval
  sandbox.clearInterval = clearInterval
  sandbox.alert = () => { }
  sandbox.confirm = () => confirmReturn
  sandbox.HoteamUI = HoteamUI
  sandbox.jQuery = jq
  sandbox.$ = jq
  sandbox.pageYOffset = 0
  // 模拟 Config/ItemSmartInput.config.js（先于插件加载）
  if (globalCfg) sandbox.ItemSmartInputConfig = globalCfg

  vm.createContext(sandbox)
  // 屏蔽插件自身的加载日志，保持输出整洁
  const quiet = CODE.replace("log('脚本已加载 v1.1（api=' + CFG.apiBase + '）');", '')
  vm.runInContext(quiet, sandbox, { filename: 'ItemSmartInput.js' })

  return {
    ctl, doc, form, pageEvent, sandbox,
    setAjax: (h) => { handler = h },
    OnCreate: () => sandbox.InforCenter_PSEITEM_CreatePage_OnCreate(pageEvent, {}),
    OnOK: () => sandbox.InforCenter_PSEITEM_CreatePage_OnOK(pageEvent),
    input: (id, v) => { const el = doc.__byId[id]; el.value = v; jq(el).trigger('input') },
    blur: (id) => jq(doc.__byId[id]).trigger('blur'),
    pick: (idx) => { if (doc.__picker) doc.__picker.call({ __idx: idx }, { preventDefault() { } }) },
  }
}

const baseCtrl = () => ({
  ENAME_Value: { text: '' },
  GGXH_Value: { text: '' },
  ZYCS_Value: { text: '' },
  ECODE_Value: { text: '1001050001', tag: { text: '1001050001', value: '1001050001' } },
  ITEMTYPE_Value: { text: '电气元件' },
})

const HEALTH_OK = { ok: true, ready: true, count: 23036, subs: 200 }
const SUGGEST_NAME = {
  ok: true, field: 'name', sub: '100105', known: true,
  category: { bigName: '电气原件', midName: '断路器', subName: '微型断路器' },
  suggestions: [
    { value: '微型断路器', from: 'synonym', note: '标准叫法' },
    { value: '空气开关', from: 'stock', count: 3 },
  ],
}
const SUGGEST_SPEC = {
  ok: true, field: 'spec', sub: '100105', known: true,
  category: { bigName: '电气原件', midName: '断路器', subName: '微型断路器' },
  suggestions: [{ value: 'NXB-63 C16 3P', from: 'stock', count: 5 }],
  normalized: 'NXB-63 C16 3P',
}
const CHECK_CLEAN = { ok: true, pass: true, errors: [], warnings: [], duplicates: [], suggestion: { name: '', spec: '', zycs: '' } }
const CHECK_FILL = {
  ok: true, pass: true, errors: [], warnings: [], duplicates: [],
  suggestion: { name: '', spec: '', zycs: '' },
  nameFormat: { raw: '空气 开关', fixed: '空气开关', final: '微型断路器', reasons: ['中间有空格', '并统一叫法'] },
  specFormat: { raw: '  NXB-63   C16  ', fixed: 'NXB-63 C16', reasons: ['首尾有空格', '中间有连续空格'] },
}
const CHECK_DUP = {
  ok: true, pass: false, errors: [], warnings: [],
  duplicates: [{ fNumber: '10010500099', fName: '微型断路器', fSpec: 'NXB-63 C16 3P', level: 'exact', score: 1 }],
  blocking: { type: 'duplicate' },
  suggestion: { name: '', spec: '', zycs: '' },
}
const CHECK_WITH_ZYCS = {
  ok: true, pass: true, errors: [], warnings: [], duplicates: [],
  suggestion: { name: '', spec: '', zycs: '型号:NXB-63；额定电流:16；极数:3P' },
}

function router(map) {
  return (opts) => {
    const url = String(opts.url || '')
    for (const k of Object.keys(map)) {
      if (url.indexOf(k) >= 0) {
        const v = map[k]
        return typeof v === 'function' ? v(opts) : v
      }
    }
    return null
  }
}

/** 在整棵 mock DOM 里按 class 找元素（注入点可能是 form，也可能是 body） */
function findByClass(p, cls) {
  const all = []
  const walk = (n) => {
    if (!n) return
    all.push(n)
    for (const c of (n.children || [])) walk(c)
  }
  walk(p.doc.body)
  return all.find((c) => String(c.className || '').indexOf(cls) >= 0)
}

function findBtn(p) {
  return findByClass(p, 'plm-smart-check-btn')
}

// ======================= 场景 =======================
async function run() {
  console.log('\n=== PLM ItemSmartInput.js 程序逻辑验证 ===\n')

  // D0 环境自检：先确认 mock 的 ajax 通路本身可用
  {
    console.log('[D0] 验证器环境自检')
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK }) })
    ok('sandbox.$ 是函数', typeof p.sandbox.$ === 'function')
    ok('$.ajax 是函数', typeof p.sandbox.$.ajax === 'function')
    ok('window.jQuery === window.$', p.sandbox.jQuery === p.sandbox.$)
    let captured = null
    try {
      p.sandbox.$.ajax({
        url: 'http://127.0.0.1:3100/api/plm/health', type: 'POST', async: false,
        success: (r) => { captured = r }, error: () => { captured = 'ERR' },
      })
    } catch (e) { captured = 'THROW:' + e.message }
    ok('mock ajax 同步返回预期对象', captured && captured.ok === true, JSON.stringify(captured))
  }

  // S1 服务可用 → 绑定成功
  {
    console.log('[S1] 服务可用时应完成绑定')
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK }) })
    p.OnCreate()
    const enameHandlers = (p.doc.__byId['ENAME_Value'].__handlers || []).length
    const ggxhHandlers = (p.doc.__byId['GGXH_Value'].__handlers || []).length
    ok('ENAME 输入框已绑定事件', enameHandlers > 0, 'handlers=' + enameHandlers)
    ok('GGXH 输入框已绑定事件', ggxhHandlers > 0, 'handlers=' + ggxhHandlers)
    await sleep(30)
  }

  // S2 服务不可用 → 不抛异常
  {
    console.log('[S2] 服务不可用时应静默降级、不抛异常')
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: () => null })
    let threw = false
    try { p.OnCreate() } catch (e) { threw = true }
    await sleep(30)
    ok('OnCreate 不抛异常', !threw)
    ok('仍绑定事件（请求失败只是不弹层）', (p.doc.__byId['GGXH_Value'].__handlers || []).length > 0)
  }

  // S3 名称联想 → 点选回填
  {
    console.log('[S3] 名称联想与回填')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/suggest': SUGGEST_NAME, '/check': CHECK_CLEAN }),
    })
    p.OnCreate()
    p.input('ENAME_Value', '空气开关')
    await sleep(420)                      // 等防抖 300ms + 异步回调
    ok('浮层已渲染候选', !!p.doc.__picker, 'picker=' + !!p.doc.__picker)
    p.pick(0)
    ok('ENAME 回填为「微型断路器」', p.ctl['ENAME_Value'].__text === '微型断路器', 'got=' + p.ctl['ENAME_Value'].__text)
  }

  // S4 规格联想 → 回填规格 + 同步 ZYCS（v1.2 起改为同步规格原文）
  {
    console.log('[S4] 规格联想与 ZYCS 同步')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/suggest': SUGGEST_SPEC, '/check': CHECK_WITH_ZYCS }),
    })
    p.OnCreate()
    p.input('GGXH_Value', 'NXB-63')
    await sleep(420)
    ok('规格浮层已渲染', !!p.doc.__picker)
    p.pick(0)
    ok('GGXH 回填', p.ctl['GGXH_Value'].__text === 'NXB-63 C16 3P', 'got=' + p.ctl['GGXH_Value'].__text)
    await sleep(60)
    ok('ZYCS 同步为规格型号', p.ctl['ZYCS_Value'].__text === 'NXB-63 C16 3P', 'got=' + p.ctl['ZYCS_Value'].__text)
  }

  // S5 保存时命中重复 + 用户取消 → 阻断
  {
    console.log('[S5] 命中强重复 + 用户取消 → 阻断保存')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_DUP }),
      confirmReturn: false,
    })
    p.ctl['ENAME_Value'].__text = '微型断路器'
    p.ctl['GGXH_Value'].__text = 'NXB-63 C16 3P'
    p.OnCreate()
    const ret = p.OnOK()
    ok('OnOK 返回 false（阻断）', ret === false, 'ret=' + ret)
    ok('弹出确认框', (p.doc.__confirmCalls || 0) === 1, 'calls=' + p.doc.__confirmCalls)
  }

  // S6 命中重复 + 用户确认 → 放行；再次保存不再重复询问
  {
    console.log('[S6] 命中强重复 + 用户确认 → 放行且只问一次')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_DUP }),
      confirmReturn: true,
    })
    p.ctl['ENAME_Value'].__text = '微型断路器'
    p.ctl['GGXH_Value'].__text = 'NXB-63 C16 3P'
    p.OnCreate()
    const r1 = p.OnOK()
    const r2 = p.OnOK()
    ok('首次确认后放行', r1 === true, 'r1=' + r1)
    ok('第二次直接放行（不重复询问）', r2 === true && (p.doc.__confirmCalls || 0) === 1, 'calls=' + p.doc.__confirmCalls)
  }

  // S7 未取到编码 → 跳过查重、放行
  {
    console.log('[S7] 未取到物料编码 → 跳过查重并放行')
    const p = newPage({
      ctrls: {
        ENAME_Value: { text: '某零件' }, GGXH_Value: { text: 'ABC-1' },
        ZYCS_Value: { text: '' }, ECODE_Value: { text: '', tag: null },
      },
      ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_DUP }),
      confirmReturn: false,
    })
    p.OnCreate()
    const ret = p.OnOK()
    ok('OnOK 返回 true（放行）', ret === true, 'ret=' + ret)
  }

  // S8 查重服务异常 → 放行
  {
    console.log('[S8] 查重服务异常 → 放行（绝不阻断建料）')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: (opts) => (String(opts.url).indexOf('/health') >= 0 ? HEALTH_OK : null),
      confirmReturn: false,
    })
    p.ctl['ENAME_Value'].__text = '微型断路器'
    p.ctl['GGXH_Value'].__text = 'NXB-63 C16 3P'
    p.OnCreate()
    const ret = p.OnOK()
    ok('OnOK 返回 true', ret === true, 'ret=' + ret)
  }

  // S9 未填规格 → 交给 PLM 原生校验
  {
    console.log('[S9] 名称为空/规格为空 → 交给 PLM 原生校验，不干预')
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_DUP }), confirmReturn: false })
    p.ctl['ENAME_Value'].__text = '只有名称'
    p.OnCreate()
    ok('OnOK 返回 true', p.OnOK() === true)
  }

  // S10 二次打开新增页 → 使用新控件重新绑定
  {
    console.log('[S10] 二次打开新增页 → 重新绑定新控件（旧版会失效）')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/suggest': SUGGEST_NAME, '/check': CHECK_CLEAN }),
    })
    p.OnCreate()
    p.input('ENAME_Value', '空气')
    await sleep(420)
    const picker1 = !!p.doc.__picker
    p.doc.__picker = null

    // 模拟关闭后重新打开：换一套控件对象
    const fresh = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/suggest': SUGGEST_NAME, '/check': CHECK_CLEAN }),
    })
    fresh.OnCreate()
    fresh.input('ENAME_Value', '空气')
    await sleep(420)
    ok('第一次联想正常', picker1)
    ok('第二次打开仍能联想', !!fresh.doc.__picker)
    fresh.pick(0)
    ok('第二次打开回填正常', fresh.ctl['ENAME_Value'].__text === '微型断路器', 'got=' + fresh.ctl['ENAME_Value'].__text)
  }

  // S11 errors 只提示不硬阻断
  {
    console.log('[S11] 规则错误只提示，不硬阻断')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({
        '/health': HEALTH_OK,
        '/check': { ok: true, pass: false, errors: ['名称过长（最多 24 个字）'], warnings: [], duplicates: [], suggestion: {} },
      }),
      confirmReturn: true,
    })
    p.ctl['ENAME_Value'].__text = '一个非常非常长的物料名称超限'
    p.ctl['GGXH_Value'].__text = 'ABC-1'
    p.OnCreate()
    const ret = p.OnOK()
    ok('用户选择继续时放行', ret === true, 'ret=' + ret)
  }

  // S12 重复再次打开页后，确认记录被清空（不会永久放行）
  {
    console.log('[S12] 二次打开页后确认记录应重置')
    const mk = () => newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_DUP }),
      confirmReturn: true,
    })
    const p1 = mk()
    p1.ctl['ENAME_Value'].__text = '微型断路器'
    p1.ctl['GGXH_Value'].__text = 'NXB-63 C16 3P'
    p1.OnCreate(); p1.OnOK()

    const p2 = mk()
    p2.ctl['ENAME_Value'].__text = '微型断路器'
    p2.ctl['GGXH_Value'].__text = 'NXB-63 C16 3P'
    p2.OnCreate()
    p2.OnOK()
    ok('新页面再次询问', (p2.doc.__confirmCalls || 0) === 1, 'calls=' + p2.doc.__confirmCalls)
  }

  // S13 规格空格自动整理：首尾 + 连续空格在保存前就地修正
  {
    console.log('[S13] 规格空格自动整理 → 保存前就地修正，乘号不动')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_CLEAN }),
    })
    p.ctl['ENAME_Value'].__text = '微型断路器'
    p.ctl['GGXH_Value'].__text = '  NXB-63   C16 3P  '
    p.OnCreate()
    const ret = p.OnOK()
    ok('OnOK 放行', ret === true, 'ret=' + ret)
    ok('首尾/连续空格已整理', p.ctl['GGXH_Value'].__text === 'NXB-63 C16 3P',
      'got=' + JSON.stringify(p.ctl['GGXH_Value'].__text))

    // 反向断言：乘号（x）不属于空格问题，不应被顺手改成 *
    const q = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_CLEAN }),
    })
    q.ctl['ENAME_Value'].__text = '按钮'
    q.ctl['GGXH_Value'].__text = 'LAY3x2 2 红'
    q.OnCreate()
    q.OnOK()
    ok('乘号不被改写', q.ctl['GGXH_Value'].__text === 'LAY3x2 2 红',
      'got=' + JSON.stringify(q.ctl['GGXH_Value'].__text))
  }

  // S14 「校验并回填」按钮：注入 → 点击 → 名称/规格回填
  {
    console.log('[S14] 校验并回填按钮（编码由 PLM 编码器提供，插件不碰编号）')
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_FILL }) })
    p.ctl['ECODE_Value'].__text = '10010100435'
    p.ctl['ECODE_Value'].__tag = { value: '10010100435' }
    p.ctl['ENAME_Value'].__text = '空气 开关'
    p.ctl['GGXH_Value'].__text = '  NXB-63   C16  '
    p.OnCreate()

    const btn = findBtn(p)
    ok('按钮已注入到规格输入框旁', !!btn)
    ok('允许类型下按钮可用', !!btn && btn.disabled !== true)
    if (btn) {
      btn.onclick({ preventDefault() { }, stopPropagation() { } })
      await sleep(20)

      const nameIn = findByClass(p, 'plm-smart-dlg-name')
      const specIn = findByClass(p, 'plm-smart-dlg-spec')
      const saveBtn = findByClass(p, 'plm-smart-dlg-save')
      ok('点击后弹出校验弹窗', !!(nameIn && specIn && saveBtn))

      if (saveBtn) {
        nameIn.value = '空气 开关'
        specIn.value = '  NXB-63   C16  '
        saveBtn.onclick({ preventDefault() { }, stopPropagation() { } })
        await sleep(20)
        ok('名称回填为同义词标准名', p.ctl['ENAME_Value'].__text === '微型断路器',
          'got=' + JSON.stringify(p.ctl['ENAME_Value'].__text))
        ok('规格回填并整理空格', p.ctl['GGXH_Value'].__text === 'NXB-63 C16',
          'got=' + JSON.stringify(p.ctl['GGXH_Value'].__text))
      }
    }
  }

  // S15 类型门控：非「电气元件 / 原材料 / 外购标准件」时按钮禁用且不回填
  {
    console.log('[S15] 类型门控：非授权类型按钮不可用')
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_FILL }) })
    p.ctl['ITEMTYPE_Value'].__text = '非标自制件'
    p.ctl['ECODE_Value'].__text = '10010100435'
    p.ctl['ECODE_Value'].__tag = { value: '10010100435' }
    p.ctl['ENAME_Value'].__text = '空气 开关'
    p.ctl['GGXH_Value'].__text = '  NXB-63   C16  '
    p.OnCreate()

    const btn = findBtn(p)
    ok('非授权类型按钮为禁用态', !!btn && btn.disabled === true)
    if (btn) {
      btn.onclick({ preventDefault() { }, stopPropagation() { } })
      await sleep(40)
      ok('点击后名称不回填', p.ctl['ENAME_Value'].__text === '空气 开关',
        'got=' + JSON.stringify(p.ctl['ENAME_Value'].__text))
      ok('点击后规格不回填', p.ctl['GGXH_Value'].__text === '  NXB-63   C16  ',
        'got=' + JSON.stringify(p.ctl['GGXH_Value'].__text))
    }
  }

  // S16 地址配置外置：window.ItemSmartInputConfig 覆盖内置 apiBase
  {
    console.log('[S16] 地址配置外置（Config/ItemSmartInput.config.js）')
    let seenUrl = ''
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: (opts) => {
        if (String(opts.url || '').indexOf('/health') >= 0) seenUrl = String(opts.url || '')
        return HEALTH_OK
      },
      globalCfg: { apiBase: 'http://10.9.8.7:3101', apiPort: 3101 },
    })
    p.OnCreate()
    await sleep(40)
    ok('请求走到配置文件里的地址', seenUrl.indexOf('http://10.9.8.7:3101') === 0, 'url=' + seenUrl)
  }

  // S17 PSEITEM$ 入口：同名「新建零组件」的另一对象类型也能生效
  {
    console.log('[S17] PSEITEM$ 入口钩子（另一个「新建零组件」对象类型）')
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_CLEAN }) })
    ok('OnCreate 已挂载', typeof p.sandbox.InforCenter_PSEITEM$_CreatePage_OnCreate === 'function')
    ok('OnOK 已挂载', typeof p.sandbox.InforCenter_PSEITEM$_CreatePage_OnOK === 'function')
    p.sandbox.InforCenter_PSEITEM$_CreatePage_OnCreate(p.pageEvent, {})
    await sleep(30)
    ok('从 $ 入口也能绑定输入框', (p.doc.__byId['ENAME_Value'].__handlers || []).length > 0)
    const btn = findBtn(p)
    ok('从 $ 入口也能注入按钮', !!btn)
  }

  // S18 DOM 兜底接管：入口不触发 CreatePage_OnCreate 时，靠轮询仍能注入按钮
  {
    console.log('[S18] DOM 兜底接管（PSE_ItemGuide 等不触发 OnCreate 的入口）')
    const p = newPage({
      ctrls: baseCtrl(),
      ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_CLEAN }),
      globalCfg: { domWatchDelay: 50 },
    })
    await sleep(220)                       // 不调用 OnCreate，等兜底接管
    const btn = findBtn(p)
    ok('未触发 OnCreate 也能注入按钮', !!btn)
    ok('输入框已绑定事件', (p.doc.__byId['ENAME_Value'].__handlers || []).length > 0)
  }

  // S20 名称与规格完全相同：按错误处理，红字提示且禁止回填
  {
    console.log('[S20] 名称与规格相同 → 阻断回填')
    const CHECK_SAME = {
      ok: true, pass: false, duplicates: [], warnings: [],
      errors: ['名称与规格完全相同，名称应写“是什么”，规格写“型号+参数”'],
    }
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_SAME }) })
    p.ctl['ECODE_Value'].__text = '10010500435'
    p.ctl['ECODE_Value'].__tag = { value: '10010500435' }
    p.ctl['ENAME_Value'].__text = 'IC65N'
    p.ctl['GGXH_Value'].__text = 'IC65N'
    p.OnCreate()

    const btn = findBtn(p)
    if (btn) btn.onclick({ preventDefault() { }, stopPropagation() { } })
    await sleep(80)

    const save = findByClass(p, 'plm-smart-dlg-save')
    const nameTip = findByClass(p, 'plm-smart-dlg-nametip')
    ok('有错误时「保存并回填」不可用', !!save && save.disabled === true)
    ok('错误以红字显示在名称下方', !!nameTip && String(nameTip.innerHTML).indexOf('✕') >= 0)
  }

  // S21 同小类已有完全相同规格：按错误处理，禁止回填，并显示重复明细
  {
    console.log('[S21] 完全相同规格 → 阻断回填')
    const CHECK_DUP = {
      ok: true, pass: false, errors: [], warnings: [],
      duplicates: [{ fNumber: '10010100271', fName: '断路器', fSpec: 'IC65N C10A/2P', level: 'exact' }],
    }
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_DUP }) })
    p.ctl['ECODE_Value'].__text = '10010100435'
    p.ctl['ECODE_Value'].__tag = { value: '10010100435' }
    p.ctl['ENAME_Value'].__text = '断路器'
    p.ctl['GGXH_Value'].__text = 'IC65N C10A/2P'
    p.OnCreate()

    const btn = findBtn(p)
    if (btn) btn.onclick({ preventDefault() { }, stopPropagation() { } })
    await sleep(80)

    const save = findByClass(p, 'plm-smart-dlg-save')
    const specTip = findByClass(p, 'plm-smart-dlg-spectip')
    ok('有完全相同规格时「保存并回填」不可用', !!save && save.disabled === true)
    ok('重复明细显示编码与规格', !!specTip
      && String(specTip.innerHTML).indexOf('10010100271') >= 0
      && String(specTip.innerHTML).indexOf('IC65N C10A/2P') >= 0)
  }

  // S22 含「小类」的规格侧警告应显示在规格下方，而不是名称下方
  {
    console.log('[S22] 规格侧警告归类')
    const CHECK_SPEC_WARN = {
      ok: true, pass: true, errors: [], duplicates: [],
      warnings: ['该小类的关键参数一个都没识别到（型号/极数/额定电流），请按“参数+数值”补全'],
    }
    const p = newPage({ ctrls: baseCtrl(), ajaxHandler: router({ '/health': HEALTH_OK, '/check': CHECK_SPEC_WARN }) })
    p.ctl['ECODE_Value'].__text = '10010100435'
    p.ctl['ECODE_Value'].__tag = { value: '10010100435' }
    p.ctl['ENAME_Value'].__text = '断路器'
    p.ctl['GGXH_Value'].__text = 'IC65N'
    p.OnCreate()

    const btn = findBtn(p)
    if (btn) btn.onclick({ preventDefault() { }, stopPropagation() { } })
    await sleep(80)

    const nameTip = findByClass(p, 'plm-smart-dlg-nametip')
    const specTip = findByClass(p, 'plm-smart-dlg-spectip')
    ok('规格警告不出现在名称下方', !!nameTip && String(nameTip.innerHTML).indexOf('关键参数') < 0)
    ok('规格警告出现在规格下方', !!specTip && String(specTip.innerHTML).indexOf('关键参数') >= 0)
  }

  console.log('\n----------------------------------------')
  console.log(`结果: ${pass} 通过 / ${fail} 失败`)
  if (fail) console.log('失败项: ' + failures.join(' | '))
  console.log('----------------------------------------\n')
  return fail === 0
}

run().then((allOk) => process.exit(allOk ? 0 : 1)).catch((e) => {
  console.error('验证器自身异常:', e)
  process.exit(2)
})

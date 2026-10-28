/**
 * PLM 物料新增「名称/规格型号」智能录入助手（二开，纯前端，零改动原页面）  v1.3
 *
 * 生效原理：
 *   PLM 页面生成模板 Platform/Config/Generator/PAGE-CREATE.generator 固化了两个钩子调用：
 *     InforCenter_[OBJTYPE]_CreatePage_OnCreate(pageEvent, data)   —— 页面渲染完成
 *     InforCenter_[OBJTYPE]_CreatePage_OnOK(pageEvent)            —— 点"确定"保存前，返回 false 可阻断
 *   本文件只定义 PSEITEM 对应的这两个全局函数，不修改 AutoGenerator/Config/Pages/PSEITEM-CREATE.page。
 *   好处：模型页面重新生成后钩子语句依然存在，改动不会被覆盖。
 *
 * 功能：
 *   1) 名称输入 —— 同义词规范化 + 库内高频名称联想，点选后回填 ENAME
 *   2) 规格输入 —— 同类既有写法联想 + 结构化参数，点选后回填 GGXH
 *   3) 失焦/保存 —— 调 /api/plm/check 做同小类查重，命中 exact/sep 级重复时提示并二次确认
 *   4) 规格型号自动同步 —— 把 GGXH 写入 主要参数(ZYCS) 与 分类属性合并(FLSXHB)：
 *        仅当二者为空或等于二开占位文字时填入，已有值一律不覆盖（不改变 PLM 生成逻辑）
 *        时机：规格输入/点选候选、进入步骤2、点"确定"前兜底
 *        宽度：严格按 PLM 元数据（GGXH 500 / ZYCS 1000 / FLSXHB 100）
 *              超限时【不做静默截断】：写入阶段跳过，保存/下一步时弹提示并阻断，让用户修改
 *
 * 降级策略（关键）：
 *   - API 不可达 / 超时 / 返回异常 → 一律放行，绝不阻断 PLM 正常建物料
 *   - 取不到输入框 DOM → 自动关闭联想，仅保留保存前查重
 *   - 总开关 CFG.enabled=false 可一键关闭
 *
 * 依赖：jQuery（PLM 站点自带 3.4.1）、HoteamUI
 */
(function (window, $) {
  'use strict';

  // ======================= 配置（部署时按现场修改） =======================
  var CFG = {
    // 治理服务地址（生产机 agenterp）。必须是【浏览器】能访问到的地址：
    //   'http://<服务机局域网IP>:3100'  —— PLM 与本服务不在同一台机器时（常见），必须显式写 IP
    //   'auto'                          —— 自动取「打开 PLM 页面的主机名」+ apiPort（同机部署时最省事）
    apiBase: 'http://192.168.20.31:3100',
    apiPort: 3100,               // 仅 apiBase='auto' 时使用

    enabled: true,               // 总开关：false 时完全静默
    timeout: 1500,               // 单次请求超时(ms)，超时即降级放行
    suggestDebounce: 300,        // 输入防抖(ms)
    minLen: 2,                   // 触发联想的最少字符数
    autoFillZycs: false,         // 旧逻辑：用结构化建议回填 ZYCS（现由 fillSpecToParams 统一处理，默认关闭）
    fillSpecToParams: true,      // 将「规格型号」同步回填到 主要参数(ZYCS) 与 分类属性合并(FLSXHB)

    // 字段宽度：必须与 PLM 元数据/数据库一致（运行时还会与控件 maxlength 取小值）
    //   PSEITEM.ENAME      nvarchar(200)  / PSEITEMMASTER.model STRING200
    //   PSEITEM.GGXH       nvarchar(500)  / STRING500   ← 规格型号/图号
    //   PSEITEM.ZYCS       nvarchar(1000) / STRING1000  ← 主要参数
    //   PSEBASEFORM.FLSXHB nvarchar(100)  / STRING100   ← 分类属性合并
    enameMaxLen: 200,
    ggxhMaxLen: 500,
    zycsMaxLen: 1000,
    flsxhbMaxLen: 100,
    warnOnOverflow: true,        // 规格型号超过 PLM 宽度时，在 Console 明确告警
    strictWidth: true,           // true=超限不截断，保存时提示并阻断，让用户回去修改
    blockOnDuplicate: true,      // 保存时命中强重复是否二次确认
    notifyDuplicateOnBlur: true, // 失焦时是否在浮层提示重复（不弹框）

    // 字段控件 ID（与 AutoGenerator/Config/Pages/PSEITEM-CREATE.page 一致）
    ctlEname: 'ENAME_Value',
    ctlGgxh: 'GGXH_Value',
    ctlZycs: 'ZYCS_Value',
    ctlEcode: 'ECODE_Value',
    // 步骤2「设计属性」表单页（PSEITEMCISFORM-CREATE）里的控件
    ctlFlsxhb: 'FLSXHB_Value',
    ctlItemType: 'ITEMTYPE_Value'
  };

  var LOG_TAG = '[ItemSmartInput]';
  var state = {
    pageKey: '',            // 当前页面实例标识，用于识别"新开了一个新增页"
    ename: null, ggxh: null, zycs: null, ecode: null,
    panel: null,
    panelOwner: null,
    lastCheckKey: '',
    okConfirmed: ''         // 已人工确认过的 名称|规格，避免重复拦截
  };

  function log() {
    if (window.console && console.log) {
      try { console.log.apply(console, [LOG_TAG].concat([].slice.call(arguments))); } catch (e) { }
    }
  }

  // ======================= 控件与 DOM 适配 =======================
  // PLM 不同版本取 DOM 的方式不同，多级回退，任一可用即可
  function domOf(ctrl) {
    if (!ctrl) return null;
    var el = null;
    try { if (typeof ctrl.GetDom === 'function') el = ctrl.GetDom(); } catch (e) { }
    if (!el) { try { if (typeof ctrl.GetElement === 'function') el = ctrl.GetElement(); } catch (e) { } }
    if (!el) { try { if (ctrl.element) el = ctrl.element; } catch (e) { } }
    if (!el && ctrl.id) { try { el = document.getElementById(ctrl.id); } catch (e) { } }
    if (!el && ctrl.id && $) { try { el = $('#' + ctrl.id)[0]; } catch (e) { } }
    if (!el && ctrl.id && $) {
      try { el = $('[id$="' + ctrl.id + '"]').get(0); } catch (e) { }
    }
    if (el && el.tagName) {
      var tag = el.tagName.toUpperCase();
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        try {
          var inner = el.querySelector ? el.querySelector('input,textarea') : null;
          if (inner) el = inner;
        } catch (e) { }
      }
    }
    return el || null;
  }

  /** 控件是否真实存在（PLM 用 id=='' 表示不存在） */
  function isValidCtl(c) {
    if (!c) return false;
    try { return String(c.id == null ? '' : c.id) !== ''; } catch (e) { return false; }
  }

  function readText(ctrl) {
    if (!ctrl) return '';
    try { return String(ctrl.GetText() == null ? '' : ctrl.GetText()).replace(/^\s+|\s+$/g, ''); } catch (e) { return ''; }
  }

  function writeText(ctrl, v) {
    if (!ctrl || v == null) return false;
    try { if (typeof ctrl.SetText === 'function') { ctrl.SetText(v); return true; } } catch (e) { }
    try {
      var el = domOf(ctrl);
      if (el) { el.value = v; return true; }
    } catch (e) { }
    return false;
  }

  /** 触发原控件失焦联动，让 PLM 自身逻辑（默认值/参数）继续生效 */
  function fireBlur(ctrl) {
    try {
      var el = domOf(ctrl);
      if (el && $) { $(el).trigger('blur'); }
    } catch (e) { }
  }

  /**
   * 取编码：ECODE 是 EditButton，值在 SetTag 的 {text,value} 里，
   * GetText() 可能只返回显示文本，故优先取 tag.value。
   */
  function readEcode(ctrl) {
    var c = ctrl || state.ecode;
    if (c) {
      try {
        var t = (typeof c.GetTag === 'function') ? c.GetTag() : null;
        if (t && t.value) return String(t.value).trim();
      } catch (e) { }
      var tx = readText(c);
      if (tx) return tx;
    }
    try {
      var d = window.InforCenter_Platform_Object_Data;
      if (d && d.ECODE) return String(d.ECODE).trim();
    } catch (e) { }
    return '';
  }

  /** 当前小类：编码前 6 位（PLM 编码规则与 ERP FNUMBER 一致） */
  function currentSub() {
    var code = readEcode();
    return code.length >= 6 ? code.slice(0, 6) : '';
  }

  // ============ 规格型号 → 主要参数(ZYCS) / 分类属性合并(FLSXHB) ============
  // 需求：不改变 PLM 物料生成逻辑，只把「规格型号(GGXH)」同步到这两个字段。
  //   ZYCS   —— PSEITEM 主要参数（ERPConfig 映射到金蝶 F_ZXCV_ZYCS）
  //   FLSXHB —— PSEBASEFORM 分类属性合并（STRING100，需截断）
  // 依据：二开把 ZYCS 置灰并写入占位文字「填写分类属性后合并自动生成」，
  //      故仅当为空 / 等于占位文字时才填，已有业务值一律不覆盖；
  //      若用户之后填写了分类属性，平台会以其合并结果覆盖，属预期行为。
  var ZYCS_PLACEHOLDER = '填写分类属性后合并自动生成';

  /**
   * 字段可写上限：以 PLM 为准。
   * 优先取控件自身的 maxlength（平台按元数据生成），再与元数据宽度取小值。
   */
  function ctlLimit(ctrl, metaLen) {
    var n = metaLen;
    try {
      var el = domOf(ctrl);
      var ml = el && el.maxLength;
      if (ml && ml > 0 && ml < n) n = ml;
    } catch (e) { }
    return n;
  }

  /** 按上限截断；超长时退到最近的分隔符，避免把参数/型号从中间切断 */
  function clipSmart(v, max) {
    v = String(v == null ? '' : v).replace(/^\s+|\s+$/g, '');
    if (!max || v.length <= max) return v;
    var cut = v.slice(0, max);
    var seps = ['/', ';', '；', '、', ',', '，', ' '];
    var best = -1;
    for (var i = 0; i < seps.length; i++) {
      var p = cut.lastIndexOf(seps[i]);
      if (p > best) best = p;
    }
    if (best >= Math.floor(max * 0.6)) cut = cut.slice(0, best);
    log('规格型号超出 PLM 字段宽度，截断为 ' + cut.length + '/' + max + ' 字符');
    return cut;
  }

  /** 本脚本在当前页面已写入的值：用于区分「我写的（可继续更新）」与「业务值（不动）」 */
  var fillMark = { zycs: '', flsxhb: '' };

  /**
   * 可填判断：
   *   空                        → 可填
   *   等于二开占位文字           → 可填（覆盖占位）
   *   等于本脚本上次写入的值     → 可填（规格继续输入/换候选时同步更新）
   *   其他（真实业务值）         → 不可填，原样保留
   */
  function isFillable(c, placeholder, mine) {
    if (!isValidCtl(c)) return false;
    var cur = readText(c);
    if (!cur) return true;
    if (placeholder && cur === placeholder) return true;
    if (mine && cur === mine) return true;
    return false;
  }

  function syncZycs(spec) {
    if (!isFillable(state.zycs, ZYCS_PLACEHOLDER, fillMark.zycs)) return false;
    var lim = ctlLimit(state.zycs, CFG.zycsMaxLen);
    var s = String(spec == null ? '' : spec).replace(/^\s+|\s+$/g, '');
    if (!s) return false;
    if (s.length > lim) {
      if (CFG.strictWidth) { log('规格型号 ' + s.length + ' 字符 > 主要参数上限 ' + lim + '，暂不写入，保存时会被拦截'); return false; }
      s = clipSmart(s, lim);
    }
    var ok = writeText(state.zycs, s);
    if (ok) {
      fillMark.zycs = s;
      log('已同步 主要参数(ZYCS) <= 规格型号（上限 ' + lim + ' 字符）');
    }
    return ok;
  }

  /** 步骤2「设计属性」页面名（随物料类型不同而不同），按序探测 */
  var FORM_PAGE_NAMES = [
    'PSEITEMCISFORM-CREATE',       // 电气元件
    'PSEITEMFIXTUREFORM-CREATE',   // 原材料/工装
    'PSEITEMSTANDARDFORM-CREATE',  // 外购标准件
    'PSEBASEFORM-CREATE'           // 兜底
  ];

  /** 取步骤2「设计属性」页面实例；尚未加载时返回 null（正常，不报错） */
  function findFormPage() {
    try {
      if (!(window.HoteamUI && HoteamUI.Page && typeof HoteamUI.Page.InstanceByName === 'function')) return null;
      for (var i = 0; i < FORM_PAGE_NAMES.length; i++) {
        var p = HoteamUI.Page.InstanceByName(FORM_PAGE_NAMES[i]);
        if (!p || typeof p.GetControl !== 'function') continue;
        var c = null;
        try { c = p.GetControl(CFG.ctlFlsxhb); } catch (e) { c = null; }
        if (isValidCtl(c)) return p;
      }
    } catch (e) { }
    return null;
  }

  function syncFlsxhb(spec, page) {
    var p = page || findFormPage();
    if (!p || !p.GetControl) return false;
    var c = null;
    try { c = p.GetControl(CFG.ctlFlsxhb); } catch (e) { c = null; }
    if (!isFillable(c, '', fillMark.flsxhb)) {
      if (isValidCtl(c)) log('分类属性合并已有值，跳过回填');
      return false;
    }
    var lim = ctlLimit(c, CFG.flsxhbMaxLen);
    var s = String(spec == null ? '' : spec).replace(/^\s+|\s+$/g, '');
    if (!s) return false;
    if (s.length > lim) {
      if (CFG.strictWidth) { log('规格型号 ' + s.length + ' 字符 > 分类属性合并上限 ' + lim + '，暂不写入，保存时会被拦截'); return false; }
      s = clipSmart(s, lim);
    }
    var ok = writeText(c, s);
    if (ok) {
      fillMark.flsxhb = s;
      log('已同步 分类属性合并(FLSXHB) <= 规格型号（上限 ' + lim + ' 字符）');
    }
    return ok;
  }

  /** 统一入口：缓存规格 + 同步两个字段（幂等，可重复调用） */
  function syncSpecToParams(spec) {
    if (!CFG.enabled || !CFG.fillSpecToParams) return;
    var v = String(spec == null ? '' : spec).replace(/^\s+|\s+$/g, '');
    if (!v) return;
    window.__PLM_SMART_SPEC = v;      // 供步骤2 页面加载时取用

    // 规格型号超过 PLM 字段宽度时提示一次（平台原生校验仍会兜底）
    var over = v.length > CFG.ggxhMaxLen;
    if (CFG.warnOnOverflow && over && !state.specOverWarned) {
      state.specOverWarned = true;
      log('规格型号长度 ' + v.length + ' 超过 PLM 上限 ' + CFG.ggxhMaxLen + ' 字符（写入参数时将按目标字段宽度截断）');
    }
    if (!over) state.specOverWarned = false;

    syncZycs(v);
    syncFlsxhb(v);
  }

  // -------- 保存前宽度校验：超限提示并阻断，让用户回去修改（不静默截断） --------
  function widthOverflow(spec) {
    var s = String(spec == null ? '' : spec).replace(/^\s+|\s+$/g, '');
    if (!s) return [];
    var out = [];
    if (s.length > CFG.ggxhMaxLen) out.push('规格型号/图号       上限 ' + CFG.ggxhMaxLen + ' 字符，当前 ' + s.length + ' 字符');
    if (s.length > CFG.zycsMaxLen) out.push('主要参数(ZYCS)      上限 ' + CFG.zycsMaxLen + ' 字符，当前 ' + s.length + ' 字符');
    if (s.length > CFG.flsxhbMaxLen) out.push('分类属性合并(FLSXHB) 上限 ' + CFG.flsxhbMaxLen + ' 字符，当前 ' + s.length + ' 字符');
    return out;
  }

  /** 返回 false = 已阻断（调用方需 return false） */
  function blockIfOverflow(spec, where) {
    if (!CFG.enabled || !CFG.strictWidth) return true;
    var over = widthOverflow(spec);
    if (!over.length) return true;
    msgBox('规格型号超出字符上限', over.join('\n') + '\n\n请精简规格型号后再' + (where || '保存') + '。');
    log('已拦截（' + (where || '保存') + '）：规格型号超长 →', over.join(' | '));
    return false;
  }

  /** 从向导页面集合取规格型号：优先控件值，其次步骤1 已提交的 para.Data */
  function specFromPages(pages, curpage) {
    var arr = [].concat(pages || [], curpage ? [curpage] : []);
    for (var i = 0; i < arr.length; i++) {
      var p = arr[i];
      try {
        if (!p || typeof p.GetControl !== 'function') continue;
        var name = '';
        try { name = String(p.PageName() || ''); } catch (e) { name = ''; }
        if (name && name !== 'PSEITEM-CREATE') continue;
        var c = p.GetControl(CFG.ctlGgxh);
        if (isValidCtl(c)) { var v = readText(c); if (v) return v; }
        var para = (typeof p.GetPara === 'function') ? p.GetPara() : null;
        if (para && para.Data && para.Data.GGXH) return String(para.Data.GGXH);
      } catch (e) { }
    }
    return window.__PLM_SMART_SPEC || '';
  }

  /** 包装向导的"下一步/保存"校验函数：先做宽度校验，超限直接阻断 */
  function wrapGuideFn(name, where) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__smartWidthWrapped) return false;
    var wrapped = function (pages, curpage) {
      try {
        if (!blockIfOverflow(specFromPages(pages, curpage), where)) return false;
      } catch (e) { log('宽度校验异常（放行）', e && e.message); }
      return orig.apply(this, arguments);
    };
    wrapped.__smartWidthWrapped = true;
    window[name] = wrapped;
    log('已挂接宽度校验：' + name + '（' + where + '）');
    return true;
  }

  var patchTries = 0;
  function installGuideGuards() {
    if (!CFG.enabled || !CFG.strictWidth) return;
    var a = wrapGuideFn('InforCenter_PSE_ItemGuide_CreateItem', '进入下一步');
    var b = wrapGuideFn('InforCenter_PSE_ItemGuide_Save', '保存');
    if (a && b) return;
    if (++patchTries < 40) setTimeout(installGuideGuards, 500);
  }

  // ======================= API（同步/异步分开，不可混用） =======================
  /** 解析 API 根地址：支持 apiBase='auto'（与 PLM 同机部署时自动用当前主机名） */
  function apiUrl(path) {
    var base = String(CFG.apiBase == null ? '' : CFG.apiBase).replace(/\/+$/, '');
    if (base.toLowerCase() === 'auto') {
      var host = '127.0.0.1';
      try { host = window.location.hostname || host; } catch (e) { }
      base = 'http://' + host + ':' + (CFG.apiPort || 3100);
    }
    return base + path;
  }

  // 用 form-urlencoded 传参：属于"简单请求"，不触发 CORS 预检，兼容性最好
  function apiSync(path, data) {
    if (!CFG.enabled || !window.$ || !$.ajax) return null;
    var out = null;
    try {
      $.ajax({
        url: apiUrl(path), type: 'POST', data: data, dataType: 'json',
        async: false, timeout: CFG.timeout,
        success: function (r) { out = r || null; },
        error: function () { out = null; }
      });
    } catch (e) { out = null; }
    return out;
  }

  function apiAsync(path, data, cb) {
    if (!CFG.enabled || !window.$ || !$.ajax) { if (cb) cb(null); return; }
    try {
      $.ajax({
        url: apiUrl(path), type: 'POST', data: data, dataType: 'json',
        async: true, timeout: CFG.timeout,
        success: function (r) { if (cb) cb(r || null); },
        error: function () { if (cb) cb(null); }
      });
    } catch (e) { if (cb) cb(null); }
  }

  // ======================= 联想浮层 =======================
  function ensurePanel() {
    // 页面切换后旧节点可能已脱离 DOM，需重建
    if (state.panel && document.body && document.body.contains(state.panel)) return state.panel;
    state.panel = null;
    if (!document.body || !$) return null;
    var div = document.createElement('div');
    div.style.cssText = [
      'position:absolute', 'z-index:99999', 'min-width:280px', 'max-width:640px',
      'background:#fff', 'border:1px solid #c8cfd8', 'border-radius:4px',
      'box-shadow:0 4px 16px rgba(0,0,0,.16)', 'font-size:12px', 'line-height:1.6',
      'display:none', 'overflow:hidden'
    ].join(';');
    document.body.appendChild(div);
    state.panel = div;
    // 先解绑再绑，避免页面多次切换导致监听器累积
    $(document).off('mousedown.smartinput').on('mousedown.smartinput', function (e) {
      if (state.panel && state.panel.style.display !== 'none') {
        if (state.panel.contains && state.panel.contains(e.target)) return;
        if (state.panelOwner && domOf(state.panelOwner) === e.target) return;
        hidePanel();
      }
    });
    return div;
  }

  function hidePanel() {
    if (state.panel) state.panel.style.display = 'none';
    state.panelOwner = null;
  }

  function placePanel(ctrl) {
    var el = domOf(ctrl);
    if (!el || !state.panel) return;
    try {
      var r = el.getBoundingClientRect();
      var top = r.bottom + (window.pageYOffset || document.documentElement.scrollTop || 0) + 2;
      var left = r.left + (window.pageXOffset || document.documentElement.scrollLeft || 0);
      state.panel.style.top = top + 'px';
      state.panel.style.left = left + 'px';
      state.panel.style.width = Math.max(r.width || 0, 280) + 'px';
    } catch (e) { }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * @param ctrl   归属控件（用于定位）
   * @param title  顶部说明
   * @param items  [{value, note, tag}]
   * @param dup    重复列表（可空）
   * @param onPick function(value, item)
   */
  function renderPanel(ctrl, title, items, dup, onPick) {
    var div = ensurePanel();
    if (!div) return;
    var html = [];
    html.push('<div style="padding:6px 10px;background:#f5f7fa;color:#5a6773;border-bottom:1px solid #e6ebf0">' + esc(title) + '</div>');

    if (dup && dup.length) {
      html.push('<div style="padding:6px 10px;background:#fff4f4;color:#c0392b;border-bottom:1px solid #f5d2d2">');
      html.push('&#9888; 同小类已存在 ' + dup.length + ' 条相同/相似物料');
      html.push('<div style="margin-top:2px;color:#8a6d3b">');
      var show = dup.slice(0, 3);
      for (var d = 0; d < show.length; d++) {
        html.push('<div>' + esc(show[d].fNumber) + ' &nbsp;' + esc(show[d].fName) + ' &nbsp;' + esc(show[d].fSpec) + '</div>');
      }
      if (dup.length > show.length) html.push('<div>… 共 ' + dup.length + ' 条</div>');
      html.push('</div></div>');
    }

    if (!items || !items.length) {
      if (!(dup && dup.length)) { hidePanel(); return; }
      html.push('<div style="padding:8px 10px;color:#8a949e">无联想候选</div>');
    } else {
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var note = it.note ? '<span style="color:#95a1ac;margin-left:6px">' + esc(it.note) + '</span>' : '';
        var tagColor = it.tag === '重复' ? '#c0392b' : (it.tag === '建议' ? '#1a7f37' : '#8a949e');
        var tag = it.tag ? '<span style="color:' + tagColor + ';margin-right:6px">[' + esc(it.tag) + ']</span>' : '';
        html.push('<div class="hi-item" data-idx="' + i + '" style="padding:5px 10px;cursor:pointer;border-bottom:1px solid #f2f5f8;word-break:break-all">'
          + tag + esc(it.value) + note + '</div>');
      }
    }

    html.push('<div style="padding:4px 10px;background:#fafbfc;color:#b0b8c0;font-size:11px">点击候选即可回填 · 按 Esc 关闭</div>');
    div.innerHTML = html.join('');
    div.style.display = 'block';
    state.panelOwner = ctrl;
    placePanel(ctrl);

    $('.hi-item', div).on('mousedown', function (e) {
      e.preventDefault();
      var idx = Number($(this).attr('data-idx'));
      var it = items[idx];
      hidePanel();
      if (it && typeof onPick === 'function') onPick(it.value, it);
    });
  }

  // ======================= 联想绑定 =======================
  function bindSuggest(ctrl, field) {
    if (!isValidCtl(ctrl)) return false;
    var el = domOf(ctrl);
    if (!el) { log('未取到 ' + field + ' 输入框 DOM，跳过联想（保存前查重仍然生效）'); return false; }

    // 先解绑，避免同一 DOM 被重复绑定导致多次弹层
    try { $(el).off('.smartinput'); } catch (e) { }

    var timer = null;
    var lastReq = '';

    $(el).on('input.smartinput keyup.smartinput', function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        var v = $(el).val();
        v = String(v == null ? '' : v).replace(/^\s+|\s+$/g, '');
        // 规格型号一有内容就同步到 ZYCS/FLSXHB（不受联想最小长度限制）
        if (field === 'spec') syncSpecToParams(v);
        if (v.length < CFG.minLen) { hidePanel(); return; }
        if (v === lastReq) return;
        lastReq = v;

        var sub = currentSub();
        apiAsync('/api/plm/suggest', {
          field: field, value: v, sub: sub, ecode: readEcode()
        }, function (r) {
          if (!r || r.ok === false) { return; }
          var cat = r.category
            ? (r.category.bigName + ' / ' + r.category.midName + ' / ' + r.category.subName)
            : '未识别分类';
          var title = cat + ' · ' + (field === 'name' ? '名称' : '规格型号') + ' 建议';

          var items = [];
          var list = r.suggestions || [];
          for (var i = 0; i < list.length; i++) {
            var s = list[i];
            var note = s.from === 'synonym' ? '标准叫法' : ('库内已用 ' + (s.count || 1) + ' 次');
            items.push({ value: s.value, note: note, tag: s.from === 'synonym' ? '建议' : '库内' });
          }

          // 规格：附带规范化写法（排在最前）
          if (field === 'spec' && r.normalized && r.normalized !== v) {
            var exists = false;
            for (var k = 0; k < items.length; k++) if (items[k].value === r.normalized) { exists = true; break; }
            if (!exists) items.unshift({ value: r.normalized, note: '规范化写法', tag: '建议' });
          }

          if (!items.length) { hidePanel(); return; }

          renderPanel(ctrl, title, items, null, function (value) {
            writeText(ctrl, value);
            fireBlur(ctrl);
            log('回填 ' + field + ' =>', value);
            if (field === 'spec') syncSpecToParams(value);
            if (field === 'spec' && CFG.autoFillZycs && state.zycs && !readText(state.zycs)) {
              apiAsync('/api/plm/check', {
                name: readText(state.ename), spec: value,
                sub: currentSub(), ecode: readEcode()
              }, function (r2) {
                if (r2 && r2.ok !== false && r2.suggestion && r2.suggestion.zycs) {
                  writeText(state.zycs, r2.suggestion.zycs);
                  fireBlur(state.zycs);
                }
              });
            }
          });
        });
      }, CFG.suggestDebounce);
    });

    // 失焦：提示重复（不阻断、不弹框），并关闭浮层
    $(el).on('blur.smartinput', function () {
      setTimeout(hidePanel, 120);
      if (!CFG.notifyDuplicateOnBlur) return;
      var name = readText(state.ename);
      var spec = readText(state.ggxh);
      if (!name && !spec) return;
      var key = name + '|' + spec;
      if (key === state.lastCheckKey) return;
      state.lastCheckKey = key;
      apiAsync('/api/plm/check', {
        name: name, spec: spec, sub: currentSub(), ecode: readEcode()
      }, function (r) {
        if (!r || r.ok === false) return;
        var hard = (r.duplicates || []).filter(function (x) { return x.level === 'exact' || x.level === 'sep'; });
        if (hard.length) {
          log('失焦发现强重复', hard.length, '条');
          renderPanel(state.ggxh || state.ename, '查重提示', [], r.duplicates, function () { });
        }
      });
    });

    $(el).on('keydown.smartinput', function (e) {
      if (e.keyCode === 27) hidePanel();
    });

    return true;
  }

  // ======================= PLM 钩子 =======================
  function ctlFrom(pageEvent, id, fallback) {
    if (isValidCtl(fallback)) return fallback;
    try {
      var o = pageEvent && pageEvent.o;
      if (o && o.GetControl) {
        var c = o.GetControl(id);
        if (isValidCtl(c)) return c;
      }
    } catch (e) { }
    return null;
  }

  /**
   * 页面渲染完成（PAGE-CREATE.generator 固化钩子）
   * 每次打开新增页都会调用，因此这里必须重置上一实例的状态并解绑旧事件。
   */
  window.InforCenter_PSEITEM_CreatePage_OnCreate = function (pageEvent, data) {
    try {
      if (!CFG.enabled) return;

      // 实例标识：每次打开新增页都是新实例
      var pk = '';
      try { pk = String((pageEvent && pageEvent.o && pageEvent.o.ContainerID && pageEvent.o.ContainerID()) || Date.now()); } catch (e) { pk = String(Date.now()); }

      // 重置状态（关键：否则第二次打开新增页仍指向已销毁的旧控件）
      state.pageKey = pk;
      state.ename = null; state.ggxh = null; state.zycs = null; state.ecode = null;
      state.lastCheckKey = ''; state.okConfirmed = '';
      state.specOverWarned = false;
      fillMark.zycs = ''; fillMark.flsxhb = '';   // 新实例：清空"本脚本已写入值"标记
      window.__PLM_SMART_SPEC = '';   // 新实例：清空上一页缓存的规格型号
      hidePanel();

      var o = pageEvent && pageEvent.o;
      if (!o || !o.GetControl) return;

      state.ename = o.GetControl(CFG.ctlEname);
      state.ggxh = o.GetControl(CFG.ctlGgxh);
      state.zycs = o.GetControl(CFG.ctlZycs);
      state.ecode = o.GetControl(CFG.ctlEcode);

      if (!isValidCtl(state.ename) && !isValidCtl(state.ggxh)) {
        log('未找到 名称/规格型号 控件，跳过增强');
        return;
      }

      var b1 = bindSuggest(state.ename, 'name');
      var b2 = bindSuggest(state.ggxh, 'spec');
      log('已绑定：' + (b1 ? '名称 ' : '') + (b2 ? '规格 ' : '') + '联想；保存前查重已启用');

      // 编辑/复制场景：规格型号已有值，立即同步一次 ZYCS/FLSXHB
      if (CFG.fillSpecToParams) {
        var initSpec = readText(state.ggxh);
        if (initSpec) syncSpecToParams(initSpec);
      }

      // 异步探活：仅用于日志提示，不阻塞页面、不影响绑定
      apiAsync('/api/plm/health', {}, function (h) {
        if (!h || h.ok !== true) {
          log('治理服务不可达：' + apiUrl('') + '（联想/查重将自动跳过，不影响原生录入）');
          return;
        }
        if (h.ready === false) { log('治理服务索引未就绪，联想暂不可用'); return; }
        log('治理服务就绪：索引 ' + h.count + ' 条 / ' + h.subs + ' 个小类');
        // 服务端会把本机所有可用地址回传，便于确认 apiBase 是否填对
        if (h.listen && h.listen.urls && h.listen.urls.length > 1) {
          log('服务端可用地址：' + h.listen.urls.join('   '));
        }
      });
    } catch (e) {
      log('OnCreate 异常（已忽略，不影响原生流程）', e && e.message);
    }
  };

  /**
   * 步骤2「设计属性」页面渲染完成（PSEITEMCISFORM-CREATE.page 固化钩子）
   * 该页由向导第二步动态加载，这里把第一步录入的规格型号同步到「分类属性合并(FLSXHB)」。
   * 已有值（含平台合并结果）一律不覆盖。
   */
  window.InforCenter_PSEITEMCISFORM_CreatePage_OnCreate = function (pageEvent, data) {
    try {
      if (!CFG.enabled || !CFG.fillSpecToParams) return;

      var spec = window.__PLM_SMART_SPEC || '';
      if (!spec && isValidCtl(state.ggxh)) spec = readText(state.ggxh);
      if (!spec) { log('步骤2：未取到规格型号，跳过 FLSXHB 回填'); return; }

      syncFlsxhb(spec, pageEvent && pageEvent.o);
    } catch (e) {
      log('PSEITEMCISFORM OnCreate 异常（已忽略）', e && e.message);
    }
  };

  /**
   * 点"确定"保存前（PAGE-CREATE.generator 固化钩子）
   * 返回 false 阻断；任何异常一律返回 true，保证 PLM 可用。
   */
  window.InforCenter_PSEITEM_CreatePage_OnOK = function (pageEvent) {
    try {
      if (!CFG.enabled || !CFG.blockOnDuplicate) return true;

      // 兜底：OnCreate 未执行或状态丢失时，直接从页面取控件，避免"静默放行"
      var cName = ctlFrom(pageEvent, CFG.ctlEname, state.ename);
      var cSpec = ctlFrom(pageEvent, CFG.ctlGgxh, state.ggxh);
      var cZycs = ctlFrom(pageEvent, CFG.ctlZycs, state.zycs);
      var cEcode = ctlFrom(pageEvent, CFG.ctlEcode, state.ecode);

      var name = readText(cName);
      var spec = readText(cSpec);
      if (!name || !spec) return true;   // 交由 PLM 原生必填校验

      // 宽度校验：超限提示并阻断保存，让用户回去修改（不做静默截断）
      if (!blockIfOverflow(spec, '保存')) return false;

      // 兜底同步：防止输入事件未触发（部分入口直接带值进来）
      if (CFG.fillSpecToParams) {
        window.__PLM_SMART_SPEC = spec;
        if (CFG.warnOnOverflow && spec.length > CFG.ggxhMaxLen) {
          log('规格型号长度 ' + spec.length + ' 超过 PLM 上限 ' + CFG.ggxhMaxLen + '，PLM 原生校验可能拦截');
        }
        var zLim = ctlLimit(cZycs, CFG.zycsMaxLen);
        var zVal = clipSmart(spec, zLim);
        if (isFillable(cZycs, ZYCS_PLACEHOLDER, fillMark.zycs) && writeText(cZycs, zVal)) {
          fillMark.zycs = zVal;
          log('保存前兜底同步 主要参数(ZYCS) <= 规格型号（上限 ' + zLim + ' 字符）');
        }
        syncFlsxhb(spec);
      }

      var ecode = readEcode(cEcode);
      var sub = ecode.length >= 6 ? ecode.slice(0, 6) : '';
      if (!sub) { log('未取到编码，跳过查重（PLM 原生编码校验兜底）'); return true; }

      var key = name + '|' + spec;
      if (state.okConfirmed === key) return true;

      var r = apiSync('/api/plm/check', {
        name: name, spec: spec, zycs: readText(cZycs), sub: sub, ecode: ecode
      });

      if (!r || r.ok === false) { log('查重服务不可用，放行'); return true; }
      if (r.skipReason) { log('跳过查重：' + r.skipReason); return true; }

      // 1) 书写规则问题：二次确认而不是硬阻断。
      //    本助手只提供建议，PLM 自身的必填/正则校验才是硬约束；
      //    硬阻断会误伤现场合理的长名称、特殊型号，导致建不了料。
      if (r.errors && r.errors.length) {
        var goErr = confirmBox('物料名称 / 规格型号 建议修正', r.errors.join('\n') + '\n\n是否仍要继续？');
        if (!goErr) return false;
      }

      // 2) 强重复（同小类同签名 / 仅分隔符不同）：二次确认
      var hard = (r.duplicates || []).filter(function (x) { return x.level === 'exact' || x.level === 'sep'; });
      if (hard.length) {
        var lines = ['同一小类下已存在下列物料：'];
        for (var i = 0; i < hard.length && i < 5; i++) {
          lines.push('  ' + hard[i].fNumber + '  ' + hard[i].fName + '  ' + hard[i].fSpec);
        }
        if (hard.length > 5) lines.push('  … 共 ' + hard.length + ' 条');
        lines.push('');
        lines.push('若确为不同实物，点"确定"继续；否则请取消并复用既有物料。');

        var go = confirmBox('疑似一物多号', lines.join('\n'));
        if (!go) return false;
        state.okConfirmed = key;
        return true;
      }

      return true;
    } catch (e) {
      log('OnOK 异常（已放行）', e && e.message);
      return true;
    }
  };

  // ======================= 弹窗兼容封装 =======================
  function msgBox(title, msg) {
    try {
      if (window.HoteamUI && HoteamUI.UIManager && HoteamUI.UIManager.MsgBox) {
        HoteamUI.UIManager.MsgBox(title, msg);
        return;
      }
    } catch (e) { }
    try { alert(title + '\n\n' + msg); } catch (e) { }
  }

  /**
   * 二次确认：只有【明确表示取消】才阻断；
   * 拿不到确定结论（API 不存在/签名不同/异常）一律放行，避免误伤正常建料。
   */
  function confirmBox(title, msg) {
    try {
      var U = window.HoteamUI && HoteamUI.UIManager;
      if (U && typeof U.ConfirmBox === 'function') {
        var ret = U.ConfirmBox(title, msg);
        if (ret === false || ret === 0 || ret === 'Cancel' || ret === 'cancel') return false;
        return true;
      }
    } catch (e) { }
    try { return confirm(title + '\n\n' + msg) === true; } catch (e) { return true; }
  }

  log('脚本已加载 v1.3（api=' + apiUrl('')
    + '；规格同步ZYCS/FLSXHB=' + (CFG.fillSpecToParams ? '开' : '关')
    + '；超限拦截=' + (CFG.strictWidth ? '开' : '关') + '）');

  // 平台向导脚本可能晚于本文件加载，这里延迟挂接（幂等，最多重试 20 秒）
  installGuideGuards();
})(window, window.jQuery);

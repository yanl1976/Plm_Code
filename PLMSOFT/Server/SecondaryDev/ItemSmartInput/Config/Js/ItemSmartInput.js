/**
 * PLM 物料新增「名称/规格型号」智能录入助手（二开，纯前端，零改动原页面）  v1.22
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
 *   4) 规格空格整理 —— 失焦/保存前把首尾空格、连续空格、全角空格就地修正
 *        口径同后端 material-rules.fixSpecFormat；乘号(×/x/X -> *)不在此处理（待定）
 *   5) 规格型号自动同步 —— 把 GGXH 写入 主要参数(ZYCS) 与 分类属性合并(FLSXHB)：
 *        仅当二者为空或等于二开占位文字时填入，已有值一律不覆盖（不改变 PLM 生成逻辑）
 *        时机：规格输入/点选候选、进入步骤2、点"确定"前兜底
 *        宽度：严格按 PLM 元数据（GGXH 500 / ZYCS 1000 / FLSXHB 100）
 *              超限时【不做静默截断】：写入阶段跳过，保存/下一步时弹提示并阻断，让用户修改
 *   6) 「校验并回填」按钮 —— 新建零组件窗口里点一下：
 *        按编号前 6 位确定小类 → 校验名称/规格（书写规则、同义词、空格、分类是否相符、同小类查重）
 *        → 把合规写法回填到「名称」「规格型号/图号」输入框。
 *        编码始终由 PLM 编码器生成，本脚本不参与发号、不改编号。
 *        仅对「电气元件 / 原材料 / 外购标准件」三种类型启用，其余类型按钮置灰不可用。
 *   7) DOM 兜底接管 —— PSE_ItemGuide 等向导入口不触发 CreatePage_OnCreate，
 *        脚本会轮询等待 GGXH_Value / ECODE_Value 出现，再用 DOM 托管控件并注入按钮，
 *        保证「向导入口」和「普通新增页」行为一致（v1.7）。
 *
 * 降级策略（关键）：
 *   - API 不可达 / 超时 / 返回异常 → 一律放行，绝不阻断 PLM 正常建物料
 *   - 取不到输入框 DOM → 自动关闭联想，仅保留保存前查重；按钮注入失败只记日志
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
    tidySpecSpace: true,         // 规格失焦/保存前自动整理空格（首尾 + 连续），不处理乘号
    domWatchDelay: 2500,         // DOM 兜底接管延时(ms)：给正常 OnCreate 留出时间，避免重复接管
    showCheckButton: true,       // 在新建零组件窗口注入「校验并回填」按钮
    checkButtonText: '校验并回填',
    checkButtonHost: 'name',     // 按钮挂在哪个输入框旁：'name'（默认）| 'spec'
    checkButtonOffsetX: 6,       // 跟随定位时相对输入框右边缘的横向偏移(px)，负数可向左贴
    checkButtonOffsetY: 0,       // 纵向偏移(px)
    checkButtonPlace: 'left',    // 'left'=名称标签左侧（默认）；'float'=输入框右侧；'fixed'=窗口右下角；'after'=插进布局
    // 按钮只对下列「类型(ITEMTYPE)」生效，其余类型置灰不可用
    restrictItemType: true,
    itemTypeAllowText: ['电气元件', '原材料', '外购标准件'],
    itemTypeAllowValues: [],     // 若 PLM 的 GetSelectedValue() 返回编码而非名称，在此补充编码

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
    okConfirmed: '',        // 已人工确认过的 名称|规格，避免重复拦截
    checkBtn: null,         // 「校验并回填」按钮
    checkTip: null,         // 按钮右侧的状态文字
    btnPlace: '',           // 当前按钮位置模式，用于轮询时重新定位
    itemtype: null,         // 类型(ITEMTYPE) 下拉控件
    typeTimer: null,        // 类型变化的轮询兜底
    lastTypeKey: ''         // 上一次识别到的类型，用于变化时打日志
  };

  function log() {
    if (window.console && console.log) {
      try { console.log.apply(console, [LOG_TAG].concat([].slice.call(arguments))); } catch (e) { }
    }
  }

  // ======================= 控件与 DOM 适配 =======================
  // PLM 不同版本取 DOM 的方式不同，多级回退，任一可用即可
  function domOf(ctrl, trace) {
    if (!ctrl) return null;
    var el = null;
    var t = trace || null;
    try { if (typeof ctrl.GetDom === 'function') { el = ctrl.GetDom(); if (el && t) t.push('GetDom'); } } catch (e) { }
    if (!el) { try { if (typeof ctrl.GetElement === 'function') { el = ctrl.GetElement(); if (el && t) t.push('GetElement'); } } catch (e) { } }
    if (!el) { try { if (ctrl.element) { el = ctrl.element; if (t) t.push('ctrl.element'); } } catch (e) { } }
    if (!el && ctrl.id) { try { el = document.getElementById(ctrl.id); if (el && t) t.push('getElementById#' + ctrl.id); } catch (e) { } }
    if (!el && ctrl.id && $) { try { el = $('#' + ctrl.id)[0]; if (el && t) t.push('$#' + ctrl.id); } catch (e) { } }
    if (!el && ctrl.id && $) {
      try { el = $('[id$="' + ctrl.id + '"]').get(0); if (el && t) t.push('$[id$=' + ctrl.id + ']'); } catch (e) { }
    }
    if (el && el.tagName) {
      var tag = el.tagName.toUpperCase();
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        try {
          var inner = el.querySelector ? el.querySelector('input,textarea') : null;
          if (inner) { el = inner; if (t) t.push('querySelector(input)'); }
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
   * 规格空格整理：全角空格/Tab/换行 -> 半角空格，连续空格合并，去首尾空格。
   * 与后端 material-rules.fixSpecFormat 同口径；乘号(×/x/X -> *)不在此处理（待定）。
   */
  function tidySpecSpace(s) {
    return String(s == null ? '' : s)
      .replace(/[^\S ]/g, ' ')
      .replace(/ {2,}/g, ' ')
      .replace(/^ +| +$/g, '');
  }

  /** 读控件原始文本（不 trim）——readText 会去掉首尾空格，恰恰是这里要修的问题 */
  function readRaw(ctrl) {
    if (!ctrl) return '';
    try { return String(ctrl.GetText() == null ? '' : ctrl.GetText()); } catch (e) { return ''; }
  }

  /** 就地整理规格控件的空格；返回 true = 发生了修正 */
  function tidySpecCtl(ctrl) {
    if (!CFG.enabled || !CFG.tidySpecSpace || !isValidCtl(ctrl)) return false;
    var cur = readRaw(ctrl);
    var fixed = tidySpecSpace(cur);
    if (!cur || fixed === cur) return false;
    if (!writeText(ctrl, fixed)) return false;
    log('规格型号空格已整理', JSON.stringify(cur), '=>', JSON.stringify(fixed));
    return true;
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
    // 同步到 ZYCS/FLSXHB 前先整理空格，避免主字段干净、参数字段带空格
    var v = tidySpecSpace(spec);
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

  /**
   * 外部地址配置：Config/ItemSmartInput.config.js 里定义 window.ItemSmartInputConfig。
   * 由 fileref 先于本文件加载；每次调用都重新读，即使配置晚到也能生效。
   */
  function extCfg() {
    var c = null;
    try { c = window.ItemSmartInputConfig; } catch (e) { c = null; }
    return (c && typeof c === 'object') ? c : null;
  }

  /** 生效地址：外部配置优先，其次内置 CFG.apiBase */
  function effectiveApiBase() {
    var c = extCfg();
    var v = (c && c.apiBase != null) ? String(c.apiBase).trim() : '';
    return v || CFG.apiBase;
  }

  function effectiveApiPort() {
    var c = extCfg();
    var n = (c && c.apiPort != null) ? Number(c.apiPort) : NaN;
    return (!isNaN(n) && n > 0) ? n : (CFG.apiPort || 3100);
  }

  /** 解析 API 根地址：支持 apiBase='auto'（与 PLM 同机部署时自动用当前主机名） */
  function apiUrl(path) {
    var base = String(effectiveApiBase() == null ? '' : effectiveApiBase()).replace(/\/+$/, '');
    if (base.toLowerCase() === 'auto') {
      var host = '127.0.0.1';
      try { host = window.location.hostname || host; } catch (e) { }
      base = 'http://' + host + ':' + effectiveApiPort();
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

    // 失焦：先整理规格空格（就地修正、用户无感），再提示重复（不阻断、不弹框）
    $(el).on('blur.smartinput', function () {
      setTimeout(hidePanel, 120);
      // 只在规格框失焦时整理，避免名称框触发时误改规格
      if (field === 'spec') tidySpecCtl(state.ggxh);
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

  // ======================= 「校验并回填」按钮 =======================
  // 只做名称/规格的校验与回填；编码一律由 PLM 编码器生成，本脚本不参与发号。

  function setCheckTip(text, kind) {
    var tip = state.checkTip;
    if (!tip) { log(text); return; }
    tip.textContent = text || '';
    tip.style.color = kind === 'bad' ? '#c0392b' : (kind === 'warn' ? '#b8860b' : '#2e7d32');
  }

  // ---- 类型(ITEMTYPE) 门控：只对电气元件 / 原材料 / 外购标准件生效 ----

  /** 读当前类型：依次取 GetSelectedValue / GetText / DOM，兼容「值是编码」或「值是名称」 */
  function readItemType() {
    var c = state.itemtype;
    var out = { value: '', text: '' };
    if (!isValidCtl(c)) return out;
    try { var v = c.GetSelectedValue(); if (v != null) out.value = String(v).trim(); } catch (e) { }
    try { var t = c.GetText(); if (t != null) out.text = String(t).trim(); } catch (e) { }
    if (!out.value || !out.text) {
      var el = domOf(c);
      if (el) {
        try {
          if (!out.value && el.value != null) out.value = String(el.value).trim();
          if (!out.text) {
            if (el.options && el.selectedIndex >= 0 && el.options[el.selectedIndex]) {
              out.text = String(el.options[el.selectedIndex].text || '').trim();
            } else if (el.textContent) {
              out.text = String(el.textContent).trim();
            }
          }
        } catch (e) { }
      }
    }
    return out;
  }

  function typeHint() {
    return '当前类型不适用（仅 ' + (CFG.itemTypeAllowText || []).join(' / ') + '）';
  }

  /** 当前类型是否允许使用按钮 */
  function isTypeAllowed() {
    if (!CFG.restrictItemType) return true;
    var allowText = CFG.itemTypeAllowText || [];
    var allowVal = CFG.itemTypeAllowValues || [];
    if (!allowText.length && !allowVal.length) return true;
    var it = readItemType();
    var ok = false;
    var cands = [it.text, it.value];
    for (var i = 0; i < cands.length && !ok; i++) {
      var x = cands[i];
      if (!x) continue;
      if (allowText.indexOf(x) >= 0 || allowVal.indexOf(x) >= 0) { ok = true; break; }
      for (var j = 0; j < allowText.length; j++) {
        if (x.indexOf(allowText[j]) >= 0) { ok = true; break; }   // 兼容「电气元件(10)」这类带后缀
      }
    }

    // 现场排障：类型值变化时打一行（注意不要再递归调用本函数）
    var tkey = String(it.value) + '|' + String(it.text);
    if (tkey !== state.lastTypeKey) {
      state.lastTypeKey = tkey;
      log('当前类型：value=' + JSON.stringify(it.value) + ' text=' + JSON.stringify(it.text)
        + ' 允许表=' + JSON.stringify(allowText) + ' → ' + (ok ? '允许' : '不允许'));
    }
    return ok;
  }

  /** 按当前类型刷新按钮的可用状态 */
  function refreshTypeGate() {
    var btn = state.checkBtn;
    if (!btn) return;
    // 页面已关闭（按钮脱离 DOM）→ 停止轮询
    try {
      if (document.body && document.body.contains && !document.body.contains(btn)) {
        if (state.typeTimer) { clearInterval(state.typeTimer); state.typeTimer = null; }
        return;
      }
    } catch (e) { }
    var ok = isTypeAllowed();
    btn.disabled = !ok;
    btn.style.opacity = ok ? '1' : '0.55';
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
    btn.title = ok ? '' : typeHint();
    if (!ok) setCheckTip(typeHint(), 'warn');
    else if (state.checkTip && String(state.checkTip.textContent || '').indexOf('当前类型不适用') >= 0) {
      setCheckTip('');
    }
    // 跟随模式：弹窗滚动/移动后重新贴合输入框
    if (state.btnPlace === 'float' || state.btnPlace === 'left') placeFloat();
  }

  /** 类型下拉变化即时刷新；自定义下拉不一定触发 change，另有轮询兜底 */
  function bindTypeWatch() {
    var el = domOf(state.itemtype);
    if (!el || !$) return;
    try {
      $(el).off('.smarttype').on('change.smarttype click.smarttype', function () {
        setTimeout(refreshTypeGate, 0);
      });
    } catch (e) { }
  }

  function startTypeWatch() {
    if (state.typeTimer) clearInterval(state.typeTimer);
    state.typeTimer = setInterval(refreshTypeGate, 1500);
  }

  /**
   * 跟随输入框定位：用 getBoundingClientRect 取输入框在当前视口中的真实坐标，
   * 按钮贴到它右侧。iframe 里 fixed 是相对 iframe 视口，和 rect 同一坐标系，所以准确。
   */
  function placeFloat() {
    var btn = state.checkBtn;
    if (!btn) return;
    // 跟随的输入框要和按钮锚点一致（默认名称框）
    var hostCtl = CFG.checkButtonHost === 'name' ? state.ename : state.ggxh;
    var el = (hostCtl && hostCtl.__dom) || null;
    if (!el || !el.getBoundingClientRect) return;
    var r = null;
    try { r = el.getBoundingClientRect(); } catch (e) { r = null; }
    var tip = state.checkTip;

    var dx = CFG.checkButtonOffsetX == null ? 6 : Number(CFG.checkButtonOffsetX);
    var dy = CFG.checkButtonOffsetY == null ? 0 : Number(CFG.checkButtonOffsetY);
    try {
      var ec2 = extCfg();
      if (ec2 && ec2.checkButtonOffsetX != null && !isNaN(Number(ec2.checkButtonOffsetX))) dx = Number(ec2.checkButtonOffsetX);
      if (ec2 && ec2.checkButtonOffsetY != null && !isNaN(Number(ec2.checkButtonOffsetY))) dy = Number(ec2.checkButtonOffsetY);
    } catch (e) { }
    if (!r || r.width <= 0 || r.height <= 0) {
      btn.style.display = 'none';
      if (tip) tip.style.display = 'none';
      return;
    }
    var maxLeft = (window.innerWidth || 1200) - 60;
    btn.style.display = 'inline-block';
    btn.style.position = 'fixed';
    btn.style.right = 'auto';
    btn.style.bottom = 'auto';
    btn.style.zIndex = '2147483000';

    if (state.btnPlace === 'left') {
      // 放在「名称」标签左侧：标签列很窄，按钮必须收窄、允许换行，否则会压住标签
      var row = rowRectOf(el);
      var left = row ? (row.left + 2) : (r.left - 50);
      btn.style.width = '44px';
      btn.style.whiteSpace = 'normal';
      btn.style.lineHeight = '14px';
      btn.style.padding = '1px 2px';
      btn.style.fontSize = '11px';
      btn.style.textAlign = 'center';
      btn.style.left = Math.max(2, left + dx) + 'px';
      btn.style.top = Math.max(4, r.top + dy) + 'px';
      if (tip) {
        tip.style.display = 'inline-block';
        tip.style.position = 'fixed';
        tip.style.right = 'auto';
        tip.style.bottom = 'auto';
        tip.style.maxWidth = '150px';
        tip.style.whiteSpace = 'normal';
        tip.style.zIndex = '2147483000';
        tip.style.left = btn.style.left;
        tip.style.top = (r.bottom + 2) + 'px';
      }
      return;
    }

    btn.style.left = Math.max(4, Math.min(r.right + dx, maxLeft)) + 'px';
    btn.style.top = Math.max(4, r.top + dy) + 'px';
    if (tip) {
      tip.style.display = 'inline-block';
      tip.style.position = 'fixed';
      tip.style.right = 'auto';
      tip.style.bottom = 'auto';
      tip.style.zIndex = '2147483000';
      tip.style.left = btn.style.left;
      tip.style.top = (r.bottom + 2) + 'px';
    }
  }

  /** 找包含「标签 + 输入框」的整行容器（宽度明显大于输入框） */
  function rowRectOf(el) {
    var ir = null;
    try { ir = el.getBoundingClientRect(); } catch (e) { return null; }
    if (!ir) return null;
    var p = el;
    for (var i = 0; i < 5 && p; i++) {
      p = p.parentNode || p.parent;
      if (!p || !p.getBoundingClientRect) continue;
      var r = null;
      try { r = p.getBoundingClientRect(); } catch (e) { r = null; }
      if (r && r.width > ir.width + 24) return r;
    }
    return null;
  }

  /** 在名称/规格输入框旁注入按钮（同一页面实例只注入一次） */
  function ensureCheckButton() {
    if (!CFG.enabled || !CFG.showCheckButton) return false;
    var hostCtl = CFG.checkButtonHost === 'name' ? state.ename : state.ggxh;
    var trace = [];
    var el = domOf(hostCtl, trace);
    if (!el) {
      log('按钮挂载点未找到：控件 id=' + ((hostCtl && hostCtl.id) || '(空)')
        + '；GetDom / GetElement / ctrl.element / getElementById / 后缀匹配 全部失败');
      return false;
    }
    var wrap = el.parentNode || el.parent;
    if (!wrap) { log('输入框没有父节点，跳过按钮注入'); return false; }

    // 若父节点是 DIV/SPAN（控件外壳，宽度通常固定），按钮放进去会压住输入框或超出被裁，
    // 因此把插入点上移一层：锚点=外壳，父节点=外壳的父节点（同一行的容器）
    var anchor = el, host = wrap;
    var wrapTag = String(wrap.tagName || '').toUpperCase();
    if (wrapTag === 'DIV' || wrapTag === 'SPAN') {
      var gp = wrap.parentNode || wrap.parent;
      if (gp) { anchor = wrap; host = gp; }
    }

    var exists = null;
    try {
      exists = (host.querySelector && host.querySelector('.plm-smart-check-btn'))
        || (document.querySelector && document.querySelector('.plm-smart-check-btn'));
    } catch (e) { exists = null; }
    if (exists) { state.checkBtn = exists; return true; }

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'plm-smart-check-btn';
    btn.textContent = CFG.checkButtonText || '校验并回填';
    btn.style.cssText = 'margin-left:6px;padding:2px 8px;font:12px/18px inherit;cursor:pointer;'
      + 'border:1px solid #3f8fd2;background:#eaf3fb;color:#16558c;border-radius:3px;'
      + 'white-space:nowrap;vertical-align:middle;position:relative;z-index:9999;pointer-events:auto;';
    var fired = false;
    var fire = function (ev) {
      try {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (ev && ev.stopPropagation) ev.stopPropagation();
      } catch (e) { }
      if (fired) return false;
      fired = true;
      setTimeout(function () { fired = false; }, 300);
      log('按钮已点击');
      runCheckAndFill();
      return false;
    };
    btn.onclick = fire;
    btn.onmousedown = fire;      // 某些容器会吞掉 click 事件，用 mousedown 兜底

    var tip = document.createElement('span');
    tip.className = 'plm-smart-check-tip';
    tip.style.cssText = 'margin-left:8px;font-size:12px;color:#666;vertical-align:middle;';

    // 位置模式：默认插到输入框右侧；布局太挤时可切成悬浮（只改配置文件即可）
    var place = CFG.checkButtonPlace || 'after';
    try { var ec = extCfg(); if (ec && ec.checkButtonPlace) place = String(ec.checkButtonPlace); } catch (e) { }

    if (place === 'fixed') {
      // 用极高的 z-index：PLM 弹窗遮罩一般在 10000 以上，9999 会被压在遮罩下面看不见
      btn.style.position = 'fixed';
      btn.style.right = '20px';
      btn.style.bottom = '20px';
      btn.style.zIndex = '2147483000';
      btn.style.display = 'inline-block';
      btn.style.boxShadow = '0 2px 8px rgba(0,0,0,.25)';
      tip.style.position = 'fixed';
      tip.style.right = '20px';
      tip.style.bottom = '52px';
      tip.style.background = '#fff';
      tip.style.padding = '2px 6px';
      tip.style.borderRadius = '3px';
      tip.style.zIndex = '2147483000';
      document.body.appendChild(btn);
      document.body.appendChild(tip);
    } else if (place === 'float' || place === 'left') {
      // 挂到 body，用 rect 定位（不参与原布局，也不会被容器裁掉）
      document.body.appendChild(btn);
      document.body.appendChild(tip);
    } else if (host.insertBefore) {
      // [输入框/外壳] → 按钮 → 状态文字
      host.insertBefore(tip, anchor.nextSibling);
      host.insertBefore(btn, tip);
    } else {
      host.appendChild(btn);
      host.appendChild(tip);
    }
    state.checkBtn = btn;
    state.checkTip = tip;
    state.btnPlace = place;
    if (place === 'float' || place === 'left') placeFloat();
    log('已注入「' + (CFG.checkButtonText || '校验并回填') + '」按钮（位置=' + place
      + '；挂载方式：' + (trace.join(' > ') || '未知') + '；锚点=' + (anchor.tagName || '?')
      + '；父节点=' + (host.tagName || '?') + '）');
    return true;
  }

  /** 点按钮：校验 → 把合规写法回填到名称/规格型号 */
  function runCheckAndFill() {
    if (!CFG.enabled) return;
    if (!isTypeAllowed()) { setCheckTip(typeHint(), 'warn'); return; }
    var sub = currentSub();
    if (!sub) {
      setCheckTip('请先在「编号」右侧点「…」申请编码', 'bad');
      msgBox('提示', '请先在「编号」右侧点「…」申请编码。\n'
        + '插件需要根据编码前 6 位确定小类，才能做分类校验与查重。');
      return;
    }
    var name = readText(state.ename);
    var spec = readRaw(state.ggxh);
    if (!name && !spec) { setCheckTip('请先填写名称或规格型号', 'bad'); return; }

    setCheckTip('校验中…');
    apiAsync('/api/plm/check', {
      name: name, spec: spec, sub: sub, ecode: readEcode()
    }, function (r) {
      if (!r || r.ok === false) {
        var tip = '治理服务不可用，未做处理（' + apiUrl('') + '）';
        setCheckTip(tip, 'bad');
        msgBox('校验未完成', tip + '\n\n请确认服务已启动，且浏览器能直接访问该地址。');
        return;
      }
      applyCheckResult(r, name, spec);
    });
  }

  /** 回填可机械修正的部分，并展示剩余问题 */
  function applyCheckResult(r, oldName, oldSpec) {
    var applied = [];

    // 名称：格式修正（空格/分隔符）+ 同义词归一，后端已算好 final
    var newName = oldName;
    if (r.nameFormat && r.nameFormat.final) newName = r.nameFormat.final;
    else if (r.nameSynonym && r.nameSynonym.exact && r.nameSynonym.std) newName = r.nameSynonym.std;
    if (newName && newName !== oldName && writeText(state.ename, newName)) {
      fireBlur(state.ename);
      applied.push('名称');
    }

    // 规格：只做空格整理（乘号策略未定，不自动改写）
    var newSpec = oldSpec;
    if (r.specFormat && r.specFormat.fixed != null) newSpec = r.specFormat.fixed;
    if (newSpec !== oldSpec && writeText(state.ggxh, newSpec)) {
      fireBlur(state.ggxh);
      if (CFG.fillSpecToParams) syncSpecToParams(newSpec);
      applied.push('规格');
    }

    var dup = (r.duplicates || []).filter(function (x) { return x.level === 'exact' || x.level === 'sep'; });
    var parts = [applied.length ? ('已回填' + applied.join('、')) : '无需回填'];
    if (r.subMismatch) parts.push('分类疑似不符');
    if (r.errors && r.errors.length) parts.push('错误 ' + r.errors.length);
    if (r.warnings && r.warnings.length) parts.push('提示 ' + r.warnings.length);
    if (dup.length) parts.push('重复 ' + dup.length);
    setCheckTip(parts.join('；'), (r.errors && r.errors.length) || dup.length ? 'warn' : 'ok');

    if (r.errors && r.errors.length) {
      msgBox('校验未通过', r.errors.join('\n'));
    } else if (dup.length) {
      renderPanel(state.ggxh || state.ename, '查重提示', [], r.duplicates, function () { });
    } else if (r.subMismatch) {
      msgBox('分类疑似不符', r.subMismatch.msg);
    }
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
      state.checkBtn = null; state.checkTip = null;
      if (state.typeTimer) { clearInterval(state.typeTimer); state.typeTimer = null; }
      state.itemtype = null;
      fillMark.zycs = ''; fillMark.flsxhb = '';   // 新实例：清空"本脚本已写入值"标记
      window.__PLM_SMART_SPEC = '';   // 新实例：清空上一页缓存的规格型号
      hidePanel();

      var o = pageEvent && pageEvent.o;
      if (!o || !o.GetControl) return;

      state.ename = o.GetControl(CFG.ctlEname);
      state.ggxh = o.GetControl(CFG.ctlGgxh);
      state.zycs = o.GetControl(CFG.ctlZycs);
      state.ecode = o.GetControl(CFG.ctlEcode);
      state.itemtype = o.GetControl(CFG.ctlItemType);
      if (!isValidCtl(state.itemtype)) {
        log('未找到类型控件 ' + CFG.ctlItemType + '，按钮将按「类型不符」处理（保持禁用）');
      }

      if (!isValidCtl(state.ename) && !isValidCtl(state.ggxh)) {
        log('未找到 名称/规格型号 控件，跳过增强');
        return;
      }

      var b1 = bindSuggest(state.ename, 'name');
      var b2 = bindSuggest(state.ggxh, 'spec');
      log('已绑定：' + (b1 ? '名称 ' : '') + (b2 ? '规格 ' : '') + '联想；保存前查重已启用');

      // 注入「校验并回填」按钮（编码仍由 PLM 编码器负责，这里完全不碰编号）
      try { ensureCheckButton(); } catch (e) { log('按钮注入异常（已忽略）', e && e.message); }

      // 类型门控：只对「电气元件 / 原材料 / 外购标准件」启用按钮，其余类型置灰
      try { bindTypeWatch(); refreshTypeGate(); startTypeWatch(); } catch (e) { log('类型门控异常（已忽略）', e && e.message); }

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

      // 空格兜底：控件里可能残留首尾/连续空格（readText 读不到），保存前就地整理
      if (tidySpecCtl(cSpec)) spec = readText(cSpec);

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

  // ---- 兼容 PSEITEM$ ----
  // PLM 里存在两个同名的「新建零组件」对象类型，页面与控件 ID 完全一致，只是钩子名不同：
  //   PSEITEM  → InforCenter_PSEITEM_CreatePage_OnCreate  / _OnOK
  //   PSEITEM$ → InforCenter_PSEITEM$_CreatePage_OnCreate / _OnOK
  // 不挂 $ 这组钩子时，从该入口进入插件完全不生效（控制台只有「脚本已加载」，没有「已绑定」）。
  window.InforCenter_PSEITEM$_CreatePage_OnCreate = function (pageEvent, data) {
    log('进入 PSEITEM$ 新增页（与 PSEITEM 共用同一套逻辑）');
    return window.InforCenter_PSEITEM_CreatePage_OnCreate(pageEvent, data);
  };
  window.InforCenter_PSEITEM$_CreatePage_OnOK = function (pageEvent) {
    return window.InforCenter_PSEITEM_CreatePage_OnOK(pageEvent);
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

  // ======================= 向导/变体页面兜底（DOM 轮询） =======================
  // 实测：PSE_ItemGuide 向导不会调用 InforCenter_PSEITEM_CreatePage_OnCreate，
  // 但输入框 DOM 是存在的。这里轮询等待弹窗出现，出现后用 DOM 托管控件。
  var domWatchTimer = null;
  var domLastTry = 0;
  var domWarned = false;
  var lastInputSig = '';

  /** 当前可见的输入框（弹窗打开时才有意义） */
  function visibleInputs() {
    var out = [];
    try {
      var all = document.querySelectorAll('input,textarea');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        var r = null;
        try { r = el.getBoundingClientRect(); } catch (e) { r = null; }
        if (!r || r.width <= 0 || r.height <= 0) continue;
        out.push(el);
      }
    } catch (e) { }
    return out;
  }

  function textOf(el) {
    try { return String(el.textContent || '').replace(/\s+/g, ''); } catch (e) { return ''; }
  }

  /** 向上最多 4 层找最近的标签文字（名称/规格型号/编号/类型…） */
  function nearLabel(el) {
    var p = el;
    for (var i = 0; i < 4 && p; i++) {
      p = p.parentNode;
      if (!p) break;
      var t = textOf(p);
      if (t && t.length <= 24) return t;
    }
    return '';
  }

  /** 标签匹配：必须「相等」或以目标「开头」，避免首页「所有类型」命中「类型」 */
  function labelHit(lb, name) {
    var t = String(lb || '').replace(/[*＊\s:：]/g, '');
    if (!t) return false;
    if (t === name) return true;
    return t.indexOf(name) === 0;
  }

  /**
   * 按标签文字找输入框。
   * 不能「从输入框向上找文字」——爬到整行/整块表单后文字会变成
   * 「名称*规格型号/图号*…」，只有第一个字段能命中。
   * 正确做法：先锁定标签元素（自身文本即标签），再取文档顺序中紧跟其后的可见输入框。
   */
  /** 是否像下拉/复选组件（名称、规格必须是普通文本框） */
  function looksLikeDropdown(el) {
    if (!el) return false;
    var id = String(el.id || '');
    var cls = String(el.className || '');
    return /DropDown|ComboBox|AutoComboBox|Select/i.test(id)
      || /dropdown|combo|select/i.test(cls);
  }

  /**
   * 按标签找输入框：**从输入框反查标签**。
   * 实测弹窗里每个输入框的 nearLabel 就是 "名称*" / "规格型号/图号" / "类型*"，
   * 比「从标签找输入框」稳得多（后者会被左侧导航里 "名称,编号,项目代号,…" 带偏）。
   * 只认带 id 的输入框，避免命中首页/搜索框。
   */
  function findInputByLabel(names, opts) {
    var list = visibleInputs();
    var noDd = !!(opts && opts.noDropdown);
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      if (!el.id) continue;
      if (noDd && looksLikeDropdown(el)) continue;
      var lb = nearLabel(el);
      if (!lb) continue;
      for (var j = 0; j < names.length; j++) {
        if (labelHit(lb, names[j])) return el;
      }
    }
    return null;
  }

  /** 打一份可见输入框清单，用于现场定位真实 id（只需看一眼控制台） */
  function dumpInputs(list) {
    var lines = [];
    for (var i = 0; i < list.length && i < 30; i++) {
      var el = list[i];
      lines.push('  [' + i + '] id=' + (el.id || '(空)')
        + ' label=' + (nearLabel(el) || '(空)')
        + ' ph=' + (el.placeholder || '')
        + ' type=' + (el.type || ''));
    }
    var frames = 0;
    try { frames = document.querySelectorAll('iframe').length; } catch (e) { }
    log('可见输入框 ' + list.length + ' 个（未命中 *_Value，供定位；iframe=' + frames + '）：\n'
      + lines.join('\n'));
  }

  function findInput(baseId) {
    var el = null;
    try { el = document.getElementById(baseId); } catch (e) { el = null; }
    if (!el) {
      try {
        var list = document.querySelectorAll('[id$="' + baseId + '"]');
        if (list && list.length) el = list[0];
      } catch (e) { el = null; }
    }
    if (!el) return null;
    var tag = String(el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') return el;
    try { return el.querySelector('input,textarea') || null; } catch (e) { return null; }
  }

  function inputVisible(el) {
    if (!el) return false;
    try {
      var r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    } catch (e) { return true; }
  }

  /** 用 DOM 元素伪造控件对象，复用 readText/writeText/domOf 那一套 */
  function domCtl(id, el) {
    if (!el) return null;
    var host = el;
    var input = el;
    var tag = String(el.tagName || '').toUpperCase();
    if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
      try { input = el.querySelector('input,textarea'); } catch (e) { input = null; }
    }
    var read = function () {
      if (input && input.value) return String(input.value);
      // EditButton 这类没有 input 的控件，退化为读容器文本（编号显示在这里）
      var txt = '';
      try { txt = String(host.textContent || ''); } catch (e) { txt = ''; }
      var m = txt.match(/[0-9A-Za-z]{6,}/);
      return m ? m[0] : '';
    };
    return {
      id: id,
      __dom: input || host,
      GetText: read,
      SetText: function (v) {
        if (!input) return;
        input.value = v;
        try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { }
        try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { }
      },
      GetDom: function () { return input || host; },
      GetSelectedValue: read,
      Check: function () { return true; }
    };
  }

  /** 编号是 EditButton（渲染成非 input 元素），按 id 特征或标签找它的容器 */
  function findEcodeHost() {
    var byId = findInput('ECODE_Value');     // 标准新增页能直接按 id 取到
    if (byId) return byId;
    var pats = ['_EditButton', 'MultiNo'];
    for (var p = 0; p < pats.length; p++) {
      try {
        var nodes = document.querySelectorAll('[id*="' + pats[p] + '"]');
        for (var i = 0; i < nodes.length; i++) {
          if (inputVisible(nodes[i])) return nodes[i];
        }
      } catch (e) { }
    }
    return findInputByLabel(['编号']);
  }

  function takeOverByDom() {
    // 优先按稳定 id（*_Value）；本平台实际渲染的是 id2044_TextBox 这类自动 id，
    // 找不到就按标签文字（规格型号 / 名称 / 编号 / 类型）定位。
    var hasId = function (el) { return !!(el && el.id); };
    var specEl = findInput('GGXH_Value') || findInputByLabel(['规格型号'], { noDropdown: true });
    if (!hasId(specEl) || !inputVisible(specEl)) return false;
    if (looksLikeDropdown(specEl)) {           // 下拉框绝不是规格型号
      log('规格型号定位到了下拉控件（' + specEl.id + '），跳过本次接管');
      return false;
    }

    var enameEl = findInput('ENAME_Value') || findInputByLabel(['名称'], { noDropdown: true });
    var ecodeEl = findEcodeHost();             // 编号是 EditButton，可能是 div 而非 input
    var typeEl = findInput('ITEMTYPE_Value') || findInputByLabel(['类型']);
    // 只认带 id 的控件，且至少要有编号或类型，避免在首页/查询页误挂
    if (!hasId(enameEl)) enameEl = null;
    if (!hasId(ecodeEl)) ecodeEl = null;
    if (!hasId(typeEl)) typeEl = null;
    if (!ecodeEl && !typeEl) return false;

    // 四个字段必须互不相同：出现「四个都指向同一个下拉框」说明结构没认对，宁可不接管
    var picked = [specEl, enameEl, ecodeEl, typeEl], seenEls = [];
    for (var pi = 0; pi < picked.length; pi++) {
      var pe = picked[pi];
      if (!pe) continue;
      if (seenEls.indexOf(pe) >= 0) {
        log('字段定位重复（同一输入框被当成多个字段），跳过本次接管');
        return false;
      }
      seenEls.push(pe);
    }

    if (!isValidCtl(state.ggxh)) state.ggxh = domCtl('GGXH_Value', specEl);
    if (!isValidCtl(state.ename)) state.ename = enameEl ? domCtl('ENAME_Value', enameEl) : null;
    if (!isValidCtl(state.ecode)) state.ecode = ecodeEl ? domCtl('ECODE_Value', ecodeEl) : null;
    if (!isValidCtl(state.itemtype)) state.itemtype = typeEl ? domCtl('ITEMTYPE_Value', typeEl) : null;

    var desc = function (el) {
      if (!el) return '未找到';
      return (el.id || '(无id)') + '[' + (nearLabel(el) || '?') + ']';
    };
    log('检测到新增弹窗（DOM 兜底接管）：规格=' + desc(specEl)
      + ' 名称=' + desc(enameEl) + ' 编号=' + desc(ecodeEl) + ' 类型=' + desc(typeEl));
    try { bindSuggest(state.ename, 'name'); } catch (e) { }
    try { bindSuggest(state.ggxh, 'spec'); } catch (e) { }
    var okBtn = false;
    try { okBtn = ensureCheckButton(); } catch (e) { log('按钮注入异常（已忽略）', e && e.message); }
    try { bindTypeWatch(); refreshTypeGate(); startTypeWatch(); } catch (e) { }
    return !!okBtn;
  }

  function watchDialog() {
    if (!CFG.enabled) return;
    if (domWatchTimer) clearTimeout(domWatchTimer);

    function detachButton() {
      try {
        if (state.checkBtn && state.checkBtn.parentNode) state.checkBtn.parentNode.removeChild(state.checkBtn);
      } catch (e) { }
      try {
        if (state.checkTip && state.checkTip.parentNode) state.checkTip.parentNode.removeChild(state.checkTip);
      } catch (e) { }
      if (state.typeTimer) { clearInterval(state.typeTimer); state.typeTimer = null; }
      state.checkBtn = null;
      state.checkTip = null;
    }

    function resetTakeover() {
      detachButton();
      state.ename = null; state.ggxh = null; state.ecode = null; state.itemtype = null;
      state.lastTypeKey = '';
    }

    function tick() {
      try {
        // 当前该接管的目标输入框（弹窗关闭时为空）
        var specNow = findInput('GGXH_Value') || findInputByLabel(['规格型号'], { noDropdown: true });
        var curSpec = (state.ggxh && state.ggxh.__dom) || null;

        // 目标变了：新弹窗打开，或之前挂到了错误位置（如首页）→ 拆掉重建
        if (specNow && curSpec && specNow !== curSpec) resetTakeover();

        var attached = !!(state.checkBtn && document.body && document.body.contains
          && document.body.contains(state.checkBtn));
        if (!attached) {
          if (state.checkBtn) resetTakeover();      // 弹窗关闭：按钮已脱离 DOM
          var now = Date.now();
          if (now - domLastTry > 1200) {            // 最多每 1.2s 尝试一次，避免频繁重绑
            domLastTry = now;
            // 只要可见输入框集合变化就打一份清单（不论接管成功与否），
            // 弹窗打开时必然会出现一次，用来确认标签与 id 的对应关系
            var list = visibleInputs();
            var sig = list.length + '#' + ((list[0] && list[0].id) || '');
            if (list.length >= 4 && sig !== lastInputSig) {
              lastInputSig = sig;
              dumpInputs(list);
            }
            if (!takeOverByDom() && !domWarned) {
              domWarned = true;
              log('尚未探测到新增弹窗（需同时出现 规格型号 / 编号 / 类型 三个字段），继续等待');
            }
          }
        }
      } catch (e) { log('弹窗探测异常（已忽略）', e && e.message); }
      domWatchTimer = setTimeout(tick, 800);
    }
    // 延时启动：先给正常的 CreatePage_OnCreate 机会，避免两条路重复接管
    var delay = CFG.domWatchDelay == null ? 2500 : CFG.domWatchDelay;
    var c = extCfg();
    if (c && c.domWatchDelay != null && !isNaN(Number(c.domWatchDelay))) delay = Number(c.domWatchDelay);
    domWatchTimer = setTimeout(tick, delay);
  }

  log('脚本已加载 v1.22（api=' + apiUrl('')
    + '；地址来源=' + ((extCfg() && extCfg().apiBase) ? 'ItemSmartInput.config.js' : '内置默认')
    + '；规格同步ZYCS/FLSXHB=' + (CFG.fillSpecToParams ? '开' : '关')
    + '；空格整理=' + (CFG.tidySpecSpace ? '开' : '关')
    + '；类型门控=' + (CFG.restrictItemType ? (CFG.itemTypeAllowText || []).join('/') : '关')
    + '；超限拦截=' + (CFG.strictWidth ? '开' : '关') + '）');

  // 平台向导脚本可能晚于本文件加载，这里延迟挂接（幂等，最多重试 20 秒）
  installGuideGuards();

  // 兜底：PSE_ItemGuide 等不触发 CreatePage_OnCreate 的入口，靠 DOM 轮询接管
  watchDialog();
})(window, window.jQuery);

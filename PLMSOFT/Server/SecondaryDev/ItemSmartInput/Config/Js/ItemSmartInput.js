/**
 * PLM 物料新增「名称/规格型号」智能录入助手（二开，纯前端，零改动原页面）  v1.54
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
 *   6) 「智能录入」按钮 —— 新建零组件窗口里点一下：
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

  // 插件版本：弹窗标题、控制台日志都读它，升级只改这一处
  // 如需现场临时改显示值，可在 ItemSmartInput.config.js 里写 version: 'x.y'
  var PLUGIN_VERSION = '1.90';
  function pluginVersion() {
    try {
      var c = extCfg();
      if (c && c.version) return String(c.version);
    } catch (e) { }
    return PLUGIN_VERSION;
  }

  // ======================= 配置（部署时按现场修改） =======================
  var CFG = {
    // 治理服务地址（生产机 agenterp）。必须是【浏览器】能访问到的地址：
    //   'http://<服务机局域网IP>:3100'  —— PLM 与本服务不在同一台机器时（常见），必须显式写 IP
    //   'auto'                          —— 自动取「打开 PLM 页面的主机名」+ apiPort（同机部署时最省事）
    apiBase: 'http://192.168.20.31:3100',
    apiPort: 3100,               // 仅 apiBase='auto' 时使用

    enabled: true,               // 总开关：false 时完全静默
    timeout: 1500,               // 单次请求超时(ms)，超时即降级放行
  plmQueryTimeout: 180000,     // PLM 对象查询超时(ms)，默认 3 分钟；大基数小类（如端子 1000+ 条）需要更长
  // 自动同步物料快照：工作时间每 N 小时一次（页面常驻时生效，关页面即停）
  autoSync: {
    enabled: true,
    hours: 2,          // 间隔小时数
    workStart: 8,      // 工作时间起（含）
    workEnd: 18,       // 工作时间止（不含）
    checkMinutes: 30,  // 每多少分钟检查一次是否该同步
  },
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
    showCheckButton: true,       // 在新建零组件窗口注入「智能录入」按钮
    lockFields: 'auto',          // 名称/规格锁定：'auto'=服务可用才锁；true=始终锁；false=不锁
    checkButtonText: '智能录入',
    checkButtonHost: 'name',     // 按钮挂在哪个输入框旁：'name'（默认）| 'spec'
    checkButtonOffsetX: 6,       // 跟随定位时相对输入框右边缘的横向偏移(px)，负数可向左贴
    checkButtonOffsetY: 0,       // 纵向偏移(px)
    checkButtonPlace: 'left',    // 'left'=名称标签左侧（默认）；'float'=输入框右侧；'fixed'=窗口右下角；'after'=插进布局
    apiLabel: '数据治理服务器',   // 提示文案里代替具体地址显示的名字
    inventorySource: 'plm',      // 'plm'=直接用 PLM 的 ERPService（与 BOM 库存查询同源）；'dashboard'=走 inventoryBase
    // allowDirectErp 已移除：全面切换 PLM，不再回落 ERP 直连
    inventoryBase: '',           // 治理看板地址（规格联想/同义词建议走这里更快），如 http://192.168.20.31:3130
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
    ctlItemType: 'ITEMTYPE_Value',

    // 提示分类与配色（外部配置文件可部分覆盖：levels/groups 浅合并，rules/mute 整体替换）
    hints: {
      levels: {
        error: { icon: '✕', label: '必须修改' },
        warn: { icon: '!', label: '建议修改' },
        tip: { icon: '·', label: '建议采用' },
        info: { icon: 'i', label: '参考' },
        ok: { icon: '✓', label: '通过' }
      },
      groups: { name: '名称', spec: '规格', dup: '查重', stock: '库存', env: '环境' },
      rules: [
        // ① 名称类 error（必须在 ^名称 warn 之前）
        { re: '^(物料)?名称.{0,10}(不能为空|过长|过短|不能包含|与规格不能完全相同|禁用词|只能)|^名称疑似', group: 'name', level: 'error' },
        // ② 名称类 warn 兜底
        { re: '^名称', group: 'name', level: 'warn' },
        // ③ 名称类专项：材质 / 品牌
        { re: '材质/表面处理|品牌请写入', group: 'name', level: 'warn' },
        // ④ 查重 error
        { re: '完全相同规格|同小类已有完全相同', group: 'dup', level: 'error' },
        // ⑤ 查重 warn / info
        { re: '疑似相同规格|高度相似|顺序不同', group: 'dup', level: 'warn' },
        { re: '相似型号|类似型号|一物多号', group: 'dup', level: 'info' },
        // ⑥ 环境（须在「库存」之前，否则「库存未核对」会被判成库存类）
        { re: '服务不可用|不可用|超时|网络异常|未核对', group: 'env', level: 'warn' },
        // ⑦ 库存
        { re: '库存', group: 'stock', level: 'info' },
        // ⑧ 规格 tip
        { re: '未收录', group: 'spec', level: 'tip' },
        { re: '^规范写法', group: 'spec', level: 'tip' },
        // ⑨ 规格 warn
        { re: '额定电压建议|乘号|括号请使用|多余空格|连续空格', group: 'spec', level: 'warn' },
        // ⑩ 规格 error（补「项目号」）
        { re: '不能为空|过长|过短|半角字符|必须包含|占位内容|项目号', group: 'spec', level: 'error' },
        // ⑪ 名称 tip
        { re: '建议采用|标准写法|同义词', group: 'name', level: 'tip' },
        // ⑫ 名称 warn（小类不符等）
        { re: '小类不符|含型号|型号请写进规格', group: 'name', level: 'warn' },
        // ⑬ 兜底
        { re: '名称', group: 'name', level: 'warn' }
      ],
      mute: [],
      mode: 'grouped'
    },

    // 阻断开关：true = 拦截保存（默认）；false = 降级为提示，允许保存
    // ⚠ 不建议关闭的 5 项：nameEmpty / specEmpty / nameEqualsSpec / dupExact / dupSep
    //    （关掉会产生脏数据：空名称、空规格、名称写型号、同一物料重复）
    blocks: {
      nameEmpty: true, nameLen: true, nameForbidChars: true, nameForbidPattern: true,
      nameEqualsSpec: true, nameFullWidth: true, subMismatch: true,
      specEmpty: true, specLen: true, specFullWidth: true, specAlnum: true,
      specForbidPattern: true, specPlaceholder: true,
      dupExact: true, dupSep: true, dupOrder: true
    }
  };

  // 允许被外部配置文件（ItemSmartInput.config.js）覆盖的键。
  // 用白名单而不是全量合并：写错键名不会悄悄改掉别的行为。
  var CFG_OVERRIDABLE = [
    'version', 'apiBase', 'apiPort', 'apiLabel', 'inventoryBase', 'inventorySource', 'enabled', 'showCheckButton', 'lockFields',
  'plmQueryTimeout', 'autoSync',
    'checkButtonText', 'checkButtonHost', 'checkButtonPlace',
    'checkButtonOffsetX', 'checkButtonOffsetY',
    'restrictItemType', 'itemTypeAllowText', 'itemTypeAllowValues',
    'tidySpecSpace', 'fillSpecToParams', 'blockOnDuplicate',
    'notifyDuplicateOnBlur', 'strictWidth',
    'suggestDebounce', 'minLen', 'timeout', 'domWatchDelay'
  ];

  var EXT_KEYS = [];
  (function applyExtCfg() {
    var c = null;
    try { c = window.ItemSmartInputConfig; } catch (e) { c = null; }
    if (!c || typeof c !== 'object') return;
    for (var i = 0; i < CFG_OVERRIDABLE.length; i++) {
      var k = CFG_OVERRIDABLE[i];
      if (c[k] !== undefined && c[k] !== null) { CFG[k] = c[k]; EXT_KEYS.push(k); }
    }
    // hints 支持部分覆盖：levels/groups 合并，rules/mute/mode 整体替换
    if (c.hints && typeof c.hints === 'object') {
      var h = c.hints;
      if (h.levels) { for (var lk in h.levels) { if (h.levels[lk]) CFG.hints.levels[lk] = h.levels[lk]; } }
      if (h.groups) { for (var gk in h.groups) { if (h.groups[gk]) CFG.hints.groups[gk] = h.groups[gk]; } }
      if (h.rules) CFG.hints.rules = h.rules;
      if (h.mute) CFG.hints.mute = h.mute;
      if (h.mode) CFG.hints.mode = h.mode;
      EXT_KEYS.push('hints');
    }
  })();

  var LOG_TAG = '[ItemSmartInput]';
  var state = {
    pageKey: '',            // 当前页面实例标识，用于识别"新开了一个新增页"
    ename: null, ggxh: null, zycs: null, ecode: null,
    panel: null,
    panelOwner: null,
    lastCheckKey: '',
    okConfirmed: '',        // 已人工确认过的 名称|规格，避免重复拦截
    checkBtn: null,         // 「智能录入」按钮
    checkTip: null,         // 按钮右侧的状态文字
    btnPlace: '',           // 当前按钮位置模式，用于轮询时重新定位
    itemtype: null,         // 类型(ITEMTYPE) 下拉控件
    typeTimer: null,        // 类型变化的轮询兜底
    lastTypeKey: '',        // 上一次识别到的类型，用于变化时打日志
    quietKey: ''            // 弹窗回填后的「名称|规格」快照：一致时不再弹提示/二次选择
  };

  /** 当前名称|规格的指纹，用于判断用户是否又改了内容 */
  function fieldKey() {
    return readText(state.ename) + '|' + readText(state.ggxh);
  }

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

  /** 访问非 3100 的地址（如看板 3130 的库存接口） */
  function apiAbsolute(url, cb) {
    if (!CFG.enabled || !window.$ || !$.ajax) { if (cb) cb(null); return; }
    try {
      $.ajax({
        url: url, type: 'GET', dataType: 'json', timeout: CFG.timeout,
        success: function (r) { if (cb) cb(r || null); },
        error: function () { if (cb) cb(null); }
      });
    } catch (e) { if (cb) cb(null); }
  }

  function apiAsync(path, data, cb) {
    if (!CFG.enabled || !window.$ || !$.ajax) { if (cb) cb(null); return; }
    try {
      // 校验请求统一带上阻断开关（配置集中在 ItemSmartInput.config.js 的 blocks 段）
      // 用 JSON 字符串传：jQuery 默认发 x-www-form-urlencoded，嵌套对象会被拍平
      if (path && path.indexOf('/api/plm/check') >= 0 && data && typeof data === 'object' && !data.blocks) {
        data.blocks = JSON.stringify(CFG.blocks || {});
      }
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
        // 弹窗已确认回填且用户没再改 → 不再弹联想/提示
        if (state.quietKey && fieldKey() === state.quietKey) { hidePanel(); return; }
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
      // 弹窗已确认回填且内容未变 → 不再提示重复，避免二次打扰
      if (state.quietKey && fieldKey() === state.quietKey) return;
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

  // ======================= 「智能录入」按钮 =======================
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
    // 未选类型 / 不在白名单 → 直接隐藏按钮，不再显示黄色提示
    btn.disabled = !ok;
    btn.style.display = ok ? 'inline-block' : 'none';
    btn.style.opacity = '1';
    btn.style.cursor = ok ? 'pointer' : 'not-allowed';
    btn.title = '';
    if (!ok) setCheckTip('');
    // 跟随模式：弹窗滚动/移动后重新贴合输入框
    if (state.btnPlace === 'float' || state.btnPlace === 'left') placeFloat();
    // 每 1.5 秒同步一次锁定状态（抵抗平台重渲染）
    try { syncLock(); } catch (e) { }
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
    // 类型门控优先：不允许时保持隐藏
    if (!isTypeAllowed()) {
      btn.style.display = 'none';
      if (state.checkTip) state.checkTip.style.display = 'none';
      return;
    }
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
      // 两两排列：11px 字号下 2 个汉字约 22px，内容宽 28px 可保证每行恰好 2 个字
      btn.style.width = '28px';
      btn.style.whiteSpace = 'normal';
      btn.style.wordBreak = 'break-all';
      btn.style.overflowWrap = 'break-word';
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
    btn.textContent = CFG.checkButtonText || '智能录入';
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
      openEditor();
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
    log('已注入「' + (CFG.checkButtonText || '智能录入') + '」按钮（位置=' + place
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
        var tip = '治理服务不可用，未做处理（' + CFG.apiLabel + '）';
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

    // 回填范围约束：只回填「规格型号」
    //   名称由设计人员自己填（各人对实物描述有差异，自动改写会覆盖人工判断）
    //   主要参数(ZYCS) / 分类属性(FLSXHB) 属于 PLM 字段，回填助手不越权写
    var newSpec = oldSpec;
    if (r.specFormat && r.specFormat.fixed != null) newSpec = r.specFormat.fixed;
    if (newSpec !== oldSpec && writeText(state.ggxh, newSpec)) {
      fireBlur(state.ggxh);
      applied.push('规格型号');
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

  // ======================= 编辑弹窗（名称/规格校验 + 回填） =======================
  var dlg = null;

  /** 归一化用于比较：去空白 + 大写（避免"看起来一样却判为不同"） */
  function normKey(s) {
    return String(s == null ? '' : s).replace(/\s+/g, '').toUpperCase();
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function dlgEl(tag, css, text) {
    var el = document.createElement(tag);
    if (css) el.style.cssText = css;
    if (text != null) el.textContent = text;
    return el;
  }

  /** 判断颜色是否偏暗（决定用亮色还是深色文字） */
  function isDarkColor(s) {
    var m = String(s || '').match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (!m) return false;
    return (0.299 * (+m[1]) + 0.587 * (+m[2]) + 0.114 * (+m[3])) < 140;
  }

  /**
   * 继承 PLM 原有配色：以规格输入框为锚点向上找弹窗容器，读它的
   * background-color / color；主色取页面上第一个有饱和背景的按钮。
   */
  function readTheme() {
    var ref = null;
    var el = (state.ggxh && state.ggxh.__dom) || null;
    try {
      var ir = el ? el.getBoundingClientRect() : null;
      var p = el;
      for (var i = 0; i < 6 && p; i++) {
        p = p.parentNode || p.parent;
        if (!p || !p.getBoundingClientRect) continue;
        var r = p.getBoundingClientRect();
        if (ir && r.width > ir.width + 40 && r.height > ir.height + 40) { ref = p; break; }
      }
    } catch (e) { ref = null; }

    var bg = '';
    var fg = '';
    try {
      if (ref && window.getComputedStyle) {
        var cs = window.getComputedStyle(ref);
        bg = cs.backgroundColor || '';
        fg = cs.color || '';
      }
    } catch (e) { }

    var accent = '';
    try {
      var btns = document.querySelectorAll('button');
      for (var j = 0; j < btns.length && !accent; j++) {
        var b = btns[j];
        var br = b.getBoundingClientRect ? b.getBoundingClientRect() : null;
        if (!br || br.width <= 0 || br.height <= 0) continue;
        var bc = window.getComputedStyle(b).backgroundColor || '';
        var m = bc.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
        if (!m) continue;
        var sum = (+m[1]) + (+m[2]) + (+m[3]);
        if (sum > 140 && sum < 690) accent = bc;   // 排除纯白/纯黑/极浅
      }
    } catch (e) { }

    if (!bg || /transparent|rgba\(0,\s*0,\s*0,\s*0\)/.test(bg)) bg = '#ffffff';
    if (!fg) fg = '#333333';
    if (!accent) accent = '#3f8fd2';
    return { bg: bg, fg: fg, accent: accent };
  }

  function closeEditor() {
    if (!dlg) return;
    try {
      if (dlg.similarMask && dlg.similarMask.parentNode) dlg.similarMask.parentNode.removeChild(dlg.similarMask);
    } catch (e) { }
    try { if (dlg.mask && dlg.mask.parentNode) dlg.mask.parentNode.removeChild(dlg.mask); } catch (e) { }
    dlg = null;
  }

  function openEditor() {
    if (!CFG.enabled || !isTypeAllowed() || dlg) return;

    // 继承 PLM 配色：背景/文字取实际弹窗容器，主色取页面按钮
    var th = readTheme();
    var dark = isDarkColor(th.bg);
    var C_ERR = dark ? '#ff8a80' : '#c0392b';
    var C_WARN = dark ? '#ffd54f' : '#b8860b';
    var C_OK = dark ? '#81c784' : '#2e7d32';
    var C_MUTE = 'rgba(127,127,127,.9)';
    var C_LINE = '1px solid rgba(127,127,127,.30)';
    var C_INPUT_BG = 'rgba(127,127,127,.07)';
    var C_HEAD_BG = 'rgba(127,127,127,.10)';

    var mask = dlgEl('div', 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.35);z-index:2147483000;');
    var panel = dlgEl('div', 'position:fixed;left:50%;top:6%;transform:translateX(-50%);width:682px;max-width:94vw;'
      + 'max-height:86vh;overflow:auto;background:' + th.bg + ';border-radius:6px;'
      + 'box-shadow:0 10px 30px rgba(0,0,0,.35);z-index:2147483001;'
      + 'font:13px/1.6 "Microsoft YaHei",Arial,sans-serif;color:' + th.fg + ';');

    var head = dlgEl('div', 'padding:10px 16px;background:' + C_HEAD_BG + ';border-bottom:' + C_LINE + ';'
      + 'font-weight:bold;font-size:14px;overflow:hidden;');
    head.className = 'plm-smart-dlg-title';
    // 先写文本再 append 子元素：textContent 赋值会清空子节点，顺序不能反
    head.textContent = 'PLM 物料录入助手　V' + pluginVersion();
    var xBtn = dlgEl('span', 'float:right;cursor:pointer;color:#999;font-weight:normal;font-size:18px;line-height:18px;', '×');
    xBtn.onclick = closeEditor;
    head.appendChild(xBtn);
    // 服务状态：原内容区两行合并成标题栏右侧一个徽标，悬停看详情
    var svcBadge = dlgEl('span', 'float:right;margin-right:10px;font-weight:normal;font-size:11px;line-height:18px;'
      + 'padding:1px 8px;border-radius:9px;background:rgba(127,127,127,.16);color:' + C_MUTE + ';', '● 检测中');
    svcBadge.className = 'plm-smart-svc-badge';
    head.appendChild(svcBadge);

    var body = dlgEl('div', 'padding:14px 16px;');

    // 顶部信息条：物料编码 + 分类 + 数据源/查重服务状态（固定内容，不会撑高）
    var metaBox = dlgEl('div', 'background:' + C_INPUT_BG + ';border:' + C_LINE + ';border-radius:4px;'
      + 'padding:6px 10px;margin-bottom:12px;color:' + C_MUTE + ';font-size:12px;line-height:1.7;');
    body.appendChild(metaBox);

    // 标准写法提示块：放在「物料名称输入框」下方
    // 防漂移关键：从打开瞬间就占固定高度（min-height），内容异步填入后高度不再变化，
    // 所以下方的规格框、按钮位置全程不动；内容过高时在块内滚动。
    // 折叠态固定约 3 行（标题/引用标准/示例）= 76px，加载前后高度一致，零漂移；
    // 展开由用户点击触发，此时高度变化可接受，超过 340px 在块内滚动
    var guideBox = dlgEl('div', 'margin:2px 0 12px;padding:8px 10px;border-left:3px solid ' + th.accent
      + ';background:rgba(127,127,127,.07);border-radius:4px;font-size:12px;line-height:1.65;'
      + 'min-height:76px;max-height:340px;overflow-y:auto;');
    guideBox.innerHTML = '<div style="opacity:.45">正在加载标准写法…</div>';

    var lastInfo = null;      // 最近一次校验结果，服务状态变化时用它重绘
    function renderInfo(r) {
      lastInfo = r;
      // HTML 属性值转义（title 里可能有引号）
      var attr = function (s) { return escHtml(s == null ? '' : s).replace(/"/g, '&quot;') };
      var code = readEcode();
      var cat = (r && r.category)
        ? (r.category.bigName + ' / ' + r.category.midName + ' / ' + r.category.subName)
        : '';

      // ---- 信息条：只留编码与分类（服务状态已并入标题栏徽标） ----
      var mHtml = '<div>物料编码：<b>' + escHtml(code || '(未申请)') + '</b>'
        + (cat ? '　分类：' + escHtml(cat) : '') + '</div>';
      if (r && r.skipReason) {
        mHtml += '<div style="color:' + C_WARN + '">' + escHtml(r.skipReason) + '</div>';
      }
      metaBox.innerHTML = mHtml;

      // ---- 标题栏状态徽标 ----
      var sOk = svc.ok;
      var sText = sOk === true ? 'PLM · 查重正常' : (sOk === false ? 'PLM · 查重不可用' : '检测中');
      svcBadge.textContent = '● ' + sText;
      svcBadge.style.color = sOk === true ? C_OK : (sOk === false ? C_ERR : C_MUTE);
      svcBadge.title = '物料库：PLM（物料信息、库存、查重均取自 PLM）\n'
        + '查重服务（' + CFG.apiLabel + '）：'
        + (sOk === true ? '正常' : (sOk === false ? '不可用，联想/查重已跳过' : '检测中'));

      // ---- 标准写法提示块 ----
      var g = r && r.guide;
      if (!g) {
        guideBox.innerHTML = '<div style="opacity:.45">该小类暂无标准写法（可在看板「命名规范 → 国标命名范式库」补充）</div>';
        return;
      }
      var gf = g.fields || [];
      var hasMore = !!String(g.specPattern || '').trim() || gf.length > 0;

      // 折叠区：规格结构 + 字段说明
      var moreHtml = '<div class="plm-guide-more" style="display:none;margin-top:3px;">'
        + '<div style="font-family:monospace;opacity:.85;">' + escHtml(g.specPattern || '') + '</div>';
      for (var gi = 0; gi < gf.length; gi++) {
        moreHtml += '<div style="opacity:.78;">· <b>' + escHtml(gf[gi].key) + '</b>'
          + (gf[gi].desc ? '：' + escHtml(gf[gi].desc) : '')
          + (gf[gi].example ? '（如 ' + escHtml(gf[gi].example) + '）' : '') + '</div>';
      }
      moreHtml += '</div>';

      guideBox.innerHTML =
          // 标题行 + 展开/折叠文字按钮
          '<div style="display:flex;align-items:baseline;gap:8px;">'
        + '<div style="flex:1 1 auto;min-width:0;color:' + th.accent + ';font-weight:600;'
        + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">标准写法 · '
        + escHtml(g.subName || '') + '</div>'
        + (hasMore
          ? '<span class="plm-guide-toggle" style="flex:0 0 auto;cursor:pointer;font-size:11px;'
            + 'color:' + th.accent + ';text-decoration:underline;">展开 ▾</span>'
          : '')
        + '</div>'
        // 引用标准：强制单行，过长省略，鼠标悬停看完整标准名称
        + (g.source
          ? '<div style="opacity:.8;margin-bottom:5px;white-space:nowrap;overflow:hidden;'
            + 'text-overflow:ellipsis;" title="' + attr('引用标准：' + g.source) + '">引用标准：'
            + escHtml(g.source) + '</div>'
          : '')
        // 示例：字号大一号、加粗、绿底突出
        + '<div style="color:' + C_OK + ';font-family:monospace;font-size:13px;font-weight:600;'
        + 'background:rgba(76,175,80,.10);border-radius:3px;padding:4px 7px;margin-top:5px;'
        + 'word-break:break-all;">示例：' + escHtml(g.example || '') + '</div>'
        + moreHtml;

      // 展开/折叠：用户主动点击，高度变化可接受
      var tg = guideBox.querySelector ? guideBox.querySelector('.plm-guide-toggle') : null;
      var moreBox = guideBox.querySelector ? guideBox.querySelector('.plm-guide-more') : null;
      if (tg && moreBox) {
        tg.onclick = function (ev) {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          var open = moreBox.style.display === 'none';
          moreBox.style.display = open ? '' : 'none';
          tg.textContent = open ? '折叠 ▴' : '展开 ▾';
        };
      }
    }

    // 名称：左标签 + 右输入框，紧跟顶部信息条（行间距收紧到 4px）
    var nameRow = dlgEl('div', 'display:flex;align-items:center;gap:8px;margin-bottom:4px;');
    nameRow.appendChild(dlgEl('span', 'flex:0 0 auto;width:64px;color:#666;font-size:13px;', '物料名称'));
    var nameIn = dlgEl('input', 'flex:1 1 auto;min-width:0;box-sizing:border-box;padding:6px 8px;border:' + C_LINE + ';'
      + 'border-radius:3px;font-size:13px;background:' + C_INPUT_BG + ';color:inherit;');
    nameIn.className = 'plm-smart-dlg-name';
    nameIn.value = readText(state.ename);
    nameRow.appendChild(nameIn);

    // 与规格行的「类似型号」同宽，保证两行输入框右边界对齐
    var selWrap = dlgEl('div', 'display:flex;align-items:center;flex:0 0 112px;');
    var selBtn = dlgEl('button', 'width:100%;box-sizing:border-box;border:1px solid rgba(127,127,127,.45);'
      + 'background:transparent;color:inherit;border-radius:4px;padding:4px 0;cursor:pointer;font-size:12px;', '选型助手');
    selBtn.className = 'plm-smart-sel-btn';
    selBtn.onclick = function () { openSelectModal(); };
    selWrap.appendChild(selBtn);
    nameRow.appendChild(selWrap);
    body.appendChild(nameRow);

    // 选型助手按钮状态约束：
    //   该小类有启用的选型系列 → 可点击；没有（或服务不可用）→ 禁用
    // 初始一律禁用，探测结果回来再放开，避免用户点了才发现空
    var selBtnReady = false;
    function setSelBtn(n) {
      selBtnReady = n > 0;
      selBtn.disabled = !selBtnReady;
      selBtn.style.opacity = selBtnReady ? '1' : '.45';
      selBtn.style.cursor = selBtnReady ? 'pointer' : 'not-allowed';
      selBtn.title = selBtnReady
        ? '按厂家样本的参数筛选型号（' + n + ' 个系列），点行回填规格'
        : '该小类暂无选型数据（需先在治理看板维护选型库）';
    }
    setSelBtn(0);
    (function probeSelectSeries() {
      var sub = String(currentSub() || '');
      if (!sub) return;
      apiAbsolute(apiUrl('/api/plm/select/series?sub=' + encodeURIComponent(sub)), function (r) {
        var all = (r && r.series) || [];
        var n = 0;
        for (var i = 0; i < all.length; i++) if (all[i].enabled !== false) n++;
        setSelBtn(n);
      });
    })();

    // 名称提示：不在输入框之间占位，统一放到两个输入框下方（见下方 append 顺序）
    var nameTip = dlgEl('div', 'margin:2px 0 4px;min-height:16px;');
    nameTip.className = 'plm-smart-dlg-nametip';

    // 名称联想（同 /api/plm/suggest field=name，与页面输入框同源）
    var nameSugBox = dlgEl('div', 'margin:0 0 6px;');

    // 规格：左标签 + 右输入框 + 右侧按钮；库存徽标放进输入框内部，保证两行输入框右边界对齐
    var specRow = dlgEl('div', 'display:flex;align-items:center;gap:8px;margin-bottom:4px;');
    specRow.appendChild(dlgEl('span', 'flex:0 0 auto;width:64px;color:#666;font-size:13px;', '规格型号'));
    var specWrap = dlgEl('div', 'flex:1 1 auto;min-width:0;position:relative;display:flex;align-items:center;');
    var specIn = dlgEl('input', 'width:100%;box-sizing:border-box;padding:6px 8px;padding-right:96px;border:' + C_LINE + ';'
      + 'border-radius:3px;font-size:13px;background:' + C_INPUT_BG + ';color:inherit;');
    specIn.className = 'plm-smart-dlg-spec';
    specIn.value = readRaw(state.ggxh);
    specWrap.appendChild(specIn);

    // 库存徽标：绝对定位在输入框内部右侧，不占按钮行宽度
    var invWrap = dlgEl('span', 'position:absolute;right:8px;top:50%;transform:translateY(-50%);'
      + 'display:none;align-items:center;gap:4px;font-size:11px;pointer-events:none;');
    var invBadge = dlgEl('span', 'background:#ffc107;color:#333;border-radius:4px;padding:0 5px;'
      + 'font-weight:bold;min-width:14px;text-align:center;', '0');
    invBadge.className = 'plm-smart-inv-badge';
    invWrap.appendChild(invBadge);
    // 数据来源标记：库存一律来自 PLM 标准接口（已移除 ERP 直连）
    var invSrc = dlgEl('span', 'opacity:.55;', '');
    invSrc.className = 'plm-smart-inv-src';
    invWrap.appendChild(invSrc);
    specWrap.appendChild(invWrap);
    specRow.appendChild(specWrap);

    // 按钮区固定宽度：与名称行的「选型助手」等宽，两行输入框右边界才能对齐
    var quickRow = dlgEl('div', 'display:flex;align-items:center;flex:0 0 112px;font-size:12px;');
    var simBtn = dlgEl('button', 'width:100%;box-sizing:border-box;border:1px solid rgba(127,127,127,.45);'
      + 'background:transparent;color:inherit;border-radius:4px;padding:2px 0;cursor:pointer;font-size:12px;', '类似型号');
    simBtn.className = 'plm-smart-sim-btn';
    simBtn.onclick = function () { openSimilarModal(); };
    quickRow.appendChild(simBtn);

    // 类似型号按钮：常显，无数据时置灰不可点（不再隐藏，避免与选型助手宽度跳动）
    function setSimBtn(n) {
      var ok = n > 0;
      simBtn.disabled = !ok;
      simBtn.style.opacity = ok ? '1' : '.45';
      simBtn.style.cursor = ok ? 'pointer' : 'not-allowed';
      simBtn.textContent = ok ? ('类似型号（' + n + '）') : '类似型号';
      simBtn.title = ok ? ('同小类共 ' + n + ' 条，按接近程度排序') : '暂无相似型号';
    }
    setSimBtn(0);
    specRow.appendChild(quickRow);
    body.appendChild(specRow);

    // 规格输入下方的「同型号系列」近似联想（看板同款，数据来自 3130）
    var specSug = dlgEl('div', 'display:none;margin-top:4px;border:' + C_LINE + ';border-radius:4px;'
      + 'overflow:hidden;font-size:12px;background:' + C_INPUT_BG + ';max-height:230px;overflow-y:auto;');
    specSug.className = 'plm-smart-dlg-sug';

    // 规格的问题提示 + 规范写法
    var specTip = dlgEl('div', 'margin:2px 0 4px;min-height:16px;');
    specTip.className = 'plm-smart-dlg-spectip';
    var specMeta = dlgEl('div', 'margin:2px 0 4px;');

    // ===== 提示区：全部放在两个输入框下方，格式与展开/折叠逻辑保持不变 =====
    // 顺序：名称提示 → 名称建议采用 → 规格提示 → 规范写法 → 标准写法块 → 同型号系列
    // 「建议采用 xxx（小类标准名）」在 nameSugBox 首行，因此紧随 nameTip，确保它是提示区的第一行
    body.appendChild(nameTip);      // 名称：问题 / 标准叫法 / 建议改为
    body.appendChild(nameSugBox);   // 名称建议采用 + 联想候选（首行即「建议采用」）
    body.appendChild(specTip);      // 规格：问题 / 建议改为 / 查重明细
    body.appendChild(specMeta);     // 规格元信息（规范写法）
    body.appendChild(guideBox);     // 标准写法（3 行 + 展开 ▾ 折叠 ▴）
    body.appendChild(specSug);      // 同型号系列联想

    var foot = dlgEl('div', 'padding:10px 16px;border-top:' + C_LINE + ';text-align:right;background:' + C_HEAD_BG + ';');
    var cancelBtn = dlgEl('button', 'padding:4px 14px;margin-left:8px;border:' + C_LINE + ';background:transparent;'
      + 'color:inherit;border-radius:3px;cursor:pointer;', '取消');
    cancelBtn.onclick = closeEditor;
    var saveBtn = dlgEl('button', 'padding:4px 14px;margin-left:8px;border:1px solid ' + th.accent
      + ';background:' + th.accent + ';color:#fff;border-radius:3px;cursor:pointer;', '保存并回填');
    saveBtn.className = 'plm-smart-dlg-save';

    var errors = [];
    var lastSimilar = null;        // 最近一次 similar-models 结果，供「类似型号明细」弹窗使用
    var topSimilarCode = '';       // 最相似物料编码（明细首条），主弹窗库存查它
    var lastInvKey = '';           // 库存查询去重：同一编码 + 同一来源不重复打请求
    var specDupItems = [];         // 兜底判重：similar-models 里 similarity=1 的条目（不依赖 3100 是否已支持 spec 级）
    var lastCheckResult = null;    // 最近一次校验结果，供兜底判重后重绘
    var lastSpecSuggestion = '';   // 规格侧已提示过的目标写法，避免「建议改为 / 规范写法」重复
    // 已提示过的规范写法（归一化后），供 loadSpecMeta 去重：
    // 规则引擎 warnings 里的「规范写法：xxx」与 /api/plm/suggest 的 normalized 是同一个 suggestSpec 输出，
    // 不去重就会出现两条一模一样的「规范写法」
    var specSuggestedKeys = {};

    function setSaveEnabled(ok) {
      saveBtn.disabled = !ok;
      saveBtn.style.opacity = ok ? '1' : '.5';
      saveBtn.style.cursor = ok ? 'pointer' : 'not-allowed';
      saveBtn.title = ok ? '' : '存在校验错误，请修改后再回填（或直接取消）';
    }

    // 名称类提示：含「名称/品名」，或「小类/分类」+「不匹配/不符/选错/更像」
    // 注意：「该小类的关键参数一个都没识别到」是规格侧提示，不能因为含"小类"就归到名称
    function isNameMsg(s) {
      var t = String(s || '');
      if (/名称|品名/.test(t)) return true;
      if (/小类|分类/.test(t) && /不匹配|不符|选错|更像/.test(t)) return true;
      return false;
    }

    // ---- 提示分类：按 CFG.hints.rules 匹配分组与级别 ----
    function hintTag(text) {
      var H = CFG.hints || {};
      var s = String(text || '');
      var mute = H.mute || [];
      for (var m = 0; m < mute.length; m++) {
        if (mute[m] && s.indexOf(mute[m]) >= 0) return null;      // 被屏蔽
      }
      var rules = H.rules || [];
      for (var i = 0; i < rules.length; i++) {
        try {
          if (new RegExp(rules[i].re).test(s)) {
            return { group: rules[i].group || 'spec', level: rules[i].level || 'warn' };
          }
        } catch (e) { /* 正则写错跳过 */ }
      }
      return { group: 'spec', level: 'warn' };
    }

    // 渲染一条提示：左侧 [分组] 小标签 + 级别图标 + 文本，颜色按级别
    // hideTagFor：该分区的标签不显示（提示已经在对应输入框下方，标签是重复信息）
    function hintHtml(text, forceLevel, hideTagFor) {
      if (String(CFG.hints && CFG.hints.mode || '') === 'plain') return null;   // 交给旧渲染
      var t = hintTag(text);
      if (!t) return '';                                        // 已屏蔽
      var H = CFG.hints || {};
      var lv = forceLevel || t.level;
      var col = lv === 'error' ? C_ERR
        : lv === 'ok' ? C_OK
          : lv === 'info' ? C_MUTE : C_WARN;
      var meta = (H.levels && H.levels[lv]) || {};
      var tag = (H.groups && H.groups[t.group]) || '';
      var showTag = tag && t.group !== hideTagFor;
      var icon = meta.icon || '';
      return '<div style="color:' + col + ';display:flex;gap:6px;align-items:flex-start;line-height:1.6;">'
        + (showTag ? '<span style="flex:0 0 auto;opacity:.8;font-size:11px;border:1px solid currentColor;'
          + 'border-radius:3px;padding:0 4px;line-height:15px;margin-top:1px;">' + escHtml(tag) + '</span>' : '')
        + (icon ? '<span style="flex:0 0 auto;opacity:.85;">' + escHtml(icon) + '</span>' : '')
        + '<span style="flex:1 1 auto;">' + escHtml(text) + '</span>'
        + '</div>';
    }

    function renderTips(r) {
      errors = ((r && r.errors) || []).slice();
      var ws = (r && r.warnings) || [];
      var nHtml = '';
      var sHtml = '';
      var i;

      // 同小类已有完全相同规格 → 按 error 处理：红字提示 + 禁止回填
      // spec 级：规格一字不差但名称不同（典型一物多号），同样阻断
      var dup = ((r && r.duplicates) || []).filter(function (d) {
        return d.level === 'exact' || d.level === 'sep' || d.level === 'spec';
      });

      // 前端兜底：similar-models 里 similarity=1 等价于「规格完全相同」。
      // 3100 尚未升级（不返回 spec 级）时，靠这一条也能拦住重复新增。
      var selfCode = String(readEcode() || '');
      for (var si = 0; si < specDupItems.length; si++) {
        var sd = specDupItems[si];
        var sdCode = String(sd.fnumber || '');
        if (!sdCode || sdCode === selfCode) continue;
        var existDup = false;
        for (var dj = 0; dj < dup.length; dj++) {
          if (String(dup[dj].fNumber || '') === sdCode) { existDup = true; break; }
        }
        if (!existDup) {
          dup.push({ fNumber: sdCode, fName: sd.name, fSpec: sd.spec, level: 'spec' });
        }
      }
      if (dup.length) {
        // 注意：文案里不要出现「名称/小类/分类」，否则会被分到名称侧
        errors.push('存在完全相同规格 ' + dup.length + ' 条，请优先复用已有编码，或确认确为新物料');
      }

      var useGrouped = !!(CFG.hints && CFG.hints.mode === 'grouped');
      // 提示已经在名称/规格各自的输入框下方，本分区标签不再重复显示；
      // 跨区的（如查重、库存）才带 [查重] [库存] 标签
      function pushTip(text, forceLevel) {
        var tg = useGrouped ? hintTag(text) : null;
        if (useGrouped && !tg) return;                       // 被 mute 屏蔽
        var toName = tg ? tg.group === 'name' : isNameMsg(text);
        var html = useGrouped
          ? hintHtml(text, forceLevel, toName ? 'name' : 'spec')
          : '<div style="color:' + (forceLevel === 'error' ? C_ERR : C_WARN) + '">'
            + (forceLevel === 'error' ? '✕ ' : '! ') + escHtml(text) + '</div>';
        if (!html) return;
        if (toName) nHtml += html; else sHtml += html;
      }
      for (i = 0; i < errors.length; i++) pushTip(errors[i], 'error');
      for (i = 0; i < ws.length; i++) pushTip(ws[i]);
      if (!nHtml && !sHtml) {
        sHtml = '<div style="color:' + C_OK + '">✓ 名称与规格符合录入规则</div>';
      }
      if (dup.length) {
        sHtml += '<div style="color:' + C_ERR + ';margin-top:6px">✕ 同小类已有完全相同规格：</div>';
        for (i = 0; i < dup.length && i < 5; i++) {
          // 接口字段是 fNumber / fName / fSpec（兼容旧的 code/name/spec）
          var dc = dup[i].fNumber || dup[i].code || dup[i].fnumber || '';
          var dn = dup[i].fName || dup[i].name || '';
          var ds = dup[i].fSpec || dup[i].spec || '';
          // spec 级：名称不同但规格相同，单独标出来，避免用户以为系统看错了
          var diffName = dup[i].level === 'spec' ? '　（名称不同）' : '';
          // 来源标注：合并快照里绝大多数来自 PLM，只有 ERP 的才标，避免界面噪音
          var srcMark = dup[i].source === 'erp' ? '[ERP历史] ' : '';
          sHtml += '<div style="color:' + C_MUTE + ';margin-left:12px">'
            + srcMark + escHtml(dc) + '　' + escHtml(dn) + '　' + escHtml(ds) + diffName + '</div>';
        }
      }
      // 参数顺序不同但参数集合完全相同：疑似同一规格，插件侧只提示不阻断（看板侧需勾选确认）
      var orderDup = ((r && r.duplicates) || []).filter(function (d) { return d && d.level === 'order'; });
      if (orderDup.length) {
        sHtml += '<div style="color:' + C_WARN + ';margin-top:6px">! 疑似相同规格（参数相同、仅书写顺序不同），请优先复用：</div>';
        for (i = 0; i < orderDup.length && i < 5; i++) {
          var oc = orderDup[i].fNumber || orderDup[i].fnumber || '';
          var os = orderDup[i].fSpec || orderDup[i].spec || '';
          var oMark = orderDup[i].source === 'erp' ? '[ERP历史] ' : '';
          sHtml += '<div style="color:' + C_MUTE + ';margin-left:12px">' + oMark + escHtml(oc) + '　' + escHtml(os) + '</div>';
        }
      }
      // 名称结构化建议：标准叫法 / 建议改为
      if (r && r.nameSynonym && r.nameSynonym.exact && r.nameSynonym.std) {
        nHtml += '<div style="color:' + C_OK + '">标准叫法：' + escHtml(r.nameSynonym.std) + '</div>';
      }
      if (r && r.nameFormat && r.nameFormat.final && r.nameFormat.final !== nameIn.value) {
        nHtml += '<div style="color:' + C_WARN + '">建议改为：<a href="javascript:void(0)" class="plm-smart-apply-name"'
          + ' style="color:' + th.accent + ';text-decoration:underline">' + escHtml(r.nameFormat.final) + '</a></div>';
      }
      // 规格结构化建议：规范写法
      lastSpecSuggestion = '';
      specSuggestedKeys = {};
      // ① 规则引擎 warnings 里的「规范写法：xxx」——先登记，供 loadSpecMeta 去重
      for (i = 0; i < ws.length; i++) {
        var nm2 = String(ws[i] || '').match(/^规范写法[：:]\s*(.+)$/);
        if (nm2) specSuggestedKeys[normKey(nm2[1])] = 1;
      }
      // ② specFormat.fixed（空格/分隔符修正后的写法）
      if (r && r.specFormat && r.specFormat.fixed && r.specFormat.fixed !== specIn.value) {
        lastSpecSuggestion = r.specFormat.fixed;
        specSuggestedKeys[normKey(r.specFormat.fixed)] = 1;
        sHtml += '<div style="color:' + C_WARN + '">建议改为：<a href="javascript:void(0)" class="plm-smart-apply-spec"'
          + ' style="color:' + th.accent + ';text-decoration:underline">' + escHtml(r.specFormat.fixed) + '</a></div>';
      }

      nameTip.innerHTML = nHtml;
      specTip.innerHTML = sHtml;
      bindApply(nameTip, '.plm-smart-apply-name', nameIn, r && r.nameFormat && r.nameFormat.final);
      bindApply(specTip, '.plm-smart-apply-spec', specIn, r && r.specFormat && r.specFormat.fixed);
      // 有 error → 禁止回填，只能改或取消
      setSaveEnabled(errors.length === 0);
    }

    /** 把「建议改为」做成可点击 */
    function bindApply(box, sel, input, val) {
      if (!val || !box || !box.querySelector) return;
      var a = box.querySelector(sel);
      if (a) a.onclick = function () { input.value = val; checkNow(); };
    }

    /**
     * 名称联想：与看板同源的三层规则（建议采用 / 存量只读 / 小类标准名兜底），
     * 数据取自 3130 的 /api/name-synonyms/suggest；未配置 inventoryBase 或请求失败时，
     * 退回 3100 的扁平建议（保持离线可用）。
     */
    function loadNameSuggest(nm) {
      nameSugBox.innerHTML = '';
      if (!nm) return;
      var base = String(CFG.inventoryBase || '').replace(/\/+$/, '');
      if (base) {
        var url = base + '/api/name-synonyms/suggest?name=' + encodeURIComponent(nm)
          + '&sub=' + encodeURIComponent(currentSub());
        apiAbsolute(url, function (r) {
          if (!dlg) return;
          if (r && (r.nameMatches || r.matches || r.subFallback || r.nameModel)) {
            renderNameSuggest(r, nm);
            return;
          }
          fallbackNameSuggest(nm);
        });
        return;
      }
      fallbackNameSuggest(nm);
    }

    /** 降级：3100 的扁平名称建议（3130 不可用时） */
    function fallbackNameSuggest(nm) {
      nameSugBox.innerHTML = '';
      apiAsync('/api/plm/suggest', { field: 'name', value: nm, sub: currentSub() }, function (r) {
        if (!dlg || !r || !r.suggestions || !r.suggestions.length) return;
        var fbHead = dlgEl('div', 'font-size:12px;margin-bottom:2px;');
        fbHead.appendChild(dlgEl('span', 'opacity:.7;', '名称建议（点击填入）'));
        fbHead.appendChild(dlgEl('span', 'opacity:.5;font-size:11px;margin-left:8px;', '来源：本地规则'));
        nameSugBox.appendChild(fbHead);
        var wrap = dlgEl('div', '');
        var list = r.suggestions.slice(0, 6);
        for (var i = 0; i < list.length; i++) {
          (function (s) {
            var chip = dlgEl('span', 'display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;'
              + 'background:' + C_INPUT_BG + ';border:' + C_LINE + ';border-radius:3px;cursor:pointer;font-size:12px;', s.value);
            chip.onclick = function () { nameIn.value = s.value; checkNow(); };
            wrap.appendChild(chip);
          })(list[i]);
        }
        nameSugBox.appendChild(wrap);
      });
    }

    /**
     * 三层名称联想渲染（与看板 app.js 的 nmNameSuggest 保持一致）：
     *   ① 建议采用：同义词 → 去型号 → 小类标准名，归一化去重后置顶，可点击填入
     *   ② 存量已有名称：只读灰字，不绑定任何点击
     *   ③ 小类标准名兜底：输入与标准名互为包含才出现（前缀、中间都支持）
     */
    function renderNameSuggest(r, raw) {
      var keyRaw = normKey(raw);
      var recs = [];
      function pushRec(name, tag, note) {
        if (!name) return;
        var k = normKey(name);
        if (!k || k === keyRaw) return;
        for (var i = 0; i < recs.length; i++) if (normKey(recs[i].name) === k) return;
        recs.push({ name: name, tag: tag || '', note: note || '' });
      }
      var stock = (r && r.nameMatches) || [];
      var syn = (r && r.matches) || [];
      var i, j;

      for (i = 0; i < syn.length; i++) {
        var hit = null;
        for (j = 0; j < stock.length; j++) {
          if (normKey(stock[j].name) === normKey(syn[i].std)) { hit = stock[j]; break; }
        }
        pushRec(syn[i].std, '同义词', hit ? '本小类 ' + (hit.count || 0) + ' 条在用' : '');
      }
      var mdl = r && r.nameModel;
      if (mdl && mdl.core) {
        var moved = (mdl.moved || []).join(' ');
        pushRec(mdl.core, '去型号', moved ? '型号/参数 ' + moved + ' 请写进规格' : '');
      }
      var fb = r && r.subFallback;
      if (fb && keyRaw.length >= 2) {
        var f = normKey(fb.name);
        // 前缀、包含都要支持：「框架」「断路器」都应提示「固定式框架断路器」
        if (f.indexOf(keyRaw) >= 0 || keyRaw.indexOf(f) === 0) pushRec(fb.name, '小类标准名', '');
      }

      var rest = [];
      for (i = 0; i < stock.length; i++) {
        var dup = false;
        for (j = 0; j < recs.length; j++) {
          if (normKey(recs[j].name) === normKey(stock[i].name)) { dup = true; break; }
        }
        if (!dup) rest.push(stock[i]);
      }
      if (!recs.length && !rest.length) return;

      nameSugBox.innerHTML = '';
      if (recs.length) {
        var head = dlgEl('div', 'font-size:12px;margin-bottom:3px;');
        head.appendChild(dlgEl('span', 'color:' + C_OK + ';', '✓ 建议采用'));
        // 数据来源标识：一眼看出走的是治理库（3130）还是本地规则（3100 回退）
        head.appendChild(dlgEl('span', 'opacity:.5;font-size:11px;margin-left:8px;', '来源：治理库'));
        nameSugBox.appendChild(head);
        for (i = 0; i < recs.length; i++) {
          (function (rec) {
            var row = dlgEl('div', 'cursor:pointer;font-size:12px;padding:2px 0 2px 6px;margin-bottom:2px;'
              + 'border-left:3px solid ' + th.accent + ';');
            row.className = 'plm-smart-ns-rec';
            var b = document.createElement('b');
            b.textContent = rec.name;
            row.appendChild(b);
            if (rec.tag) row.appendChild(dlgEl('span', 'opacity:.7;', ' [' + rec.tag + ']'));
            if (rec.note) row.appendChild(dlgEl('span', 'opacity:.65;', ' ' + rec.note));
            row.onclick = function () { nameIn.value = rec.name; checkNow(); };
            nameSugBox.appendChild(row);
          })(recs[i]);
        }
      }
      if (rest.length) {
        var sHead = dlgEl('div', 'font-size:12px;margin:4px 0 2px;opacity:.75;');
        sHead.appendChild(dlgEl('span', '', '存量已有名称（仅供参考，不可点）'));
        sHead.appendChild(dlgEl('span', 'opacity:.8;font-size:11px;margin-left:8px;', '来源：治理库'));
        nameSugBox.appendChild(sHead);
        for (i = 0; i < rest.length && i < 5; i++) {
          var sm = rest[i];
          var where = sm.inSub ? '本小类'
            : (sm.sub ? '小类 ' + sm.sub + (sm.subName ? ' ' + sm.subName : '') : '其它小类');
          var line = dlgEl('div', 'font-size:12px;opacity:.6;cursor:default;padding:1px 0 1px 6px;user-select:text;');
          line.className = 'plm-smart-ns-stock';
          line.appendChild(dlgEl('span', '', sm.name));
          line.appendChild(dlgEl('span', 'opacity:.8;', ' ' + (sm.count || 0) + ' 条 · ' + where));
          line.appendChild(dlgEl('span', 'opacity:.55;', ' 仅参考'));
          nameSugBox.appendChild(line);
        }
      }
    }

    /** 规格元信息：规范写法 / 建议写清的参数（/api/plm/suggest field=spec） */
    function loadSpecMeta(sp) {
      specMeta.innerHTML = '';
      if (!sp) return;
      apiAsync('/api/plm/suggest', { field: 'spec', value: sp, sub: currentSub() }, function (r) {
        if (!dlg || !r) return;
        var html = '';
        // 与校验结果去重：同一个目标只提示一次
        //   lastSpecSuggestion —— specFormat.fixed
        //   specSuggestedKeys  —— warnings 里的「规范写法：xxx」（同一个 suggestSpec 输出）
        if (r.normalized && normKey(r.normalized) !== normKey(sp)
          && normKey(r.normalized) !== normKey(lastSpecSuggestion)
          && !specSuggestedKeys[normKey(r.normalized)]) {
          html += '<div style="color:' + C_WARN + ';font-size:12px">规范写法：<a href="javascript:void(0)"'
            + ' class="plm-smart-apply-norm" style="color:' + th.accent + ';text-decoration:underline">'
            + escHtml(r.normalized) + '</a></div>';
        }
        if (!html) return;
        specMeta.innerHTML = html;
        bindApply(specMeta, '.plm-smart-apply-norm', specIn, r.normalized);
      });
    }

    /**
     * 类似型号：优先用看板的 similar-models（服务端已按接近度排序），
     * 未配置 inventoryBase 时退回 3100 的 suggest 频率序。
     */
    function loadSimilar(sp) {
      lastSimilar = null;
      topSimilarCode = '';
      lastInvKey = '';
      specDupItems = [];
      setSimBtn(0);        // 重置为不可点（按钮常显）
      if (!sp) return;
      var base = String(CFG.inventoryBase || '').replace(/\/+$/, '');
      if (!base) return;

      // limit=20：明细里每条都要 2 次 PLM 调用，默认只取最接近的 20 条
      var url = base + '/api/new-material/similar-models?sub=' + encodeURIComponent(currentSub())
        + '&spec=' + encodeURIComponent(sp) + '&code=' + encodeURIComponent(readEcode())
        + '&limit=20';
      apiAbsolute(url, function (r) {
        if (!dlg || !r || !r.items || !r.items.length) return;
        lastSimilar = r;
        // 最相似物料（首条）的编码：主弹窗库存改查它，而不是尚未建档的新物料自己
        topSimilarCode = String((r.items[0] && r.items[0].fnumber) || '');
        // similarity=1 就是「规格完全相同」，用它兜底判重（不依赖 3100 是否已升级）
        specDupItems = (r.items || []).filter(function (x) {
          return Number(x.similarity || 0) >= 0.999;
        });
        setSimBtn(r.items.length);
        loadInventory(specIn.value);   // 拿到编码后刷新一次库存
        if (specDupItems.length && lastCheckResult) {
          try { renderTips(lastCheckResult); } catch (e) { }   // 重新渲染红字 + 禁用按钮
        }
      });
    }

    /**
     * PLM 既有库存服务（与 BOM「库存查询」同源，实测参数，勿随意改动）：
     *   ① 物料编码 → ObjectService.CommonGetObjectDataByFilter → EID
     *   ② EID → Hoteam.InforCenter.ERPService.GetStockSearchData → GridObject
     *
     * 关键点（都是踩过的坑）：
     *   - ViewName 必须是 StockSearchListView（ListView 配置名），不是 StockSearchView
     *   - ParaList 是 JSON 对象字符串，键为 ObjectID（全大写），值为数组
     *   - 不能传 FilterString；Pager 要带 SortOrder / Records
     *   - 返回 Rows 是二维数组，每格是 {ColName, ColText}
     */
    // EID 缓存：编码 → EID，10 分钟内复用，避免同一次选型里反复查对象
    var eidCache = {};
    var EID_TTL = 10 * 60 * 1000;

    function eidCached(code) {
      var c = eidCache[code];
      return (c && Date.now() - c.at < EID_TTL) ? c.eid : '';
    }
    function eidStore(code, eid) {
      if (eid) eidCache[code] = { eid: eid, at: Date.now() };
    }

    function plmEidByCode(code) {
      if (!code) return '';
      var hit0 = eidCached(code);
      if (hit0) return hit0;
      var root = window.HoteamUI;
      if (!root || !root.DataService || !root.DataService.Call) return '';
      try {
        var safe = String(code).replace(/'/g, "''");
        var filter = {
          PSEITEM: { FilterInfo: [], FilterString: "ECODE='" + safe + "'", OrderbyString: '' }
        };
        var raw = root.DataService.Call('InforCenter.Common.ObjectService.CommonGetObjectDataByFilter', {
          para: { Data: JSON.stringify(filter) }
        });
        var o = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
        var arr = o.PSEITEM || o['PSEITEM$'] || o.Data;
        var row = arr && arr[0];
        var eid = (row && (row.EID || row['PSEITEM.EID'] || row.EID_DisplayValue)) || '';
        eidStore(code, eid);
        return eid;
      } catch (e) { return ''; }
    }

    /** 解析 GridObject.Rows → 与看板一致的库存结构；返回 null 表示「查询失败」 */
    function parseStockGrid(ret) {
      if (!ret || typeof ret !== 'object') return null;
      var rows = ret.Rows || [];          // 空数组 = 查询成功但无库存记录
      var qty = 0, whs = [];
      for (var i = 0; i < rows.length; i++) {
        var cells = rows[i] || [];
        var m = {};
        for (var j = 0; j < cells.length; j++) {
          var c = cells[j];
          if (c && c.ColName) m[c.ColName] = (c.ColText == null ? c.ColValue : c.ColText);
        }
        var n = Number(m.FAVBQty != null ? m.FAVBQty : (m.FBaseQty || 0));
        if (isNaN(n)) n = 0;
        qty += n;
        whs.push({
          stockName: String(m.FStockName || ''),
          qty: n,
          projectNo: String(m.FMTONO || ''),
          materialId: String(m.FMaterialId || '')
        });
      }
      // ok=true 表示「查询成功」（即使库存为 0），用于区分「查不到」与「没库存」
      return { ok: true, total: { qty: qty, avbqty: qty, lockqty: 0 }, warehouses: whs };
    }

    /** 同步版：供批量刷新逐条调用；查询失败返回 null */
    function plmStockQuerySync(code) {
      var root = window.HoteamUI;
      if (!root || !root.DataService || !root.DataService.Call || !code) return null;
      var eid = plmEidByCode(code);
      if (!eid) return null;
      try {
        var ret = root.DataService.Call('Hoteam.InforCenter.ERPService.GetStockSearchData', {
          para: {
            Pager: { CurrentPager: 1, RowNumber: 50, SortOrder: 'asc', SortName: '', Records: 0 },
            ViewName: 'StockSearchListView',
            ObjectType: 'PSEITEM',
            OnlyQuery: 'true',
            ParaList: JSON.stringify({ ObjectID: [eid] })
          }
        });
        return parseStockGrid(ret);
      } catch (e) { return null; }
    }

    /**
     * 异步版：平台有 DataService.AsyncCall 时走异步（不阻塞页面），
     * 没有则退回同步 Call（旧环境/测试桩）。
     * 回调 cb(结果 | null)，结果结构与同步版一致。
     */
    function plmStockQueryAsync(code, cb) {
      var root = window.HoteamUI;
      var ds = root && root.DataService;
      if (!ds || !code) { cb(null); return; }
      if (typeof ds.AsyncCall !== 'function') { cb(plmStockQuerySync(code)); return; }

      // 命中 EID 缓存时直接查库存，省掉一次对象查询
      var eidHit = eidCached(code);
      if (eidHit) { queryStock(eidHit); return; }

      function queryStock(eid) {
        if (!eid) { cb(null); return; }
        try {
          ds.AsyncCall({
            serviceuri: 'Hoteam.InforCenter.ERPService.GetStockSearchData',
            paras: {
              para: {
                Pager: { CurrentPager: 1, RowNumber: 50, SortOrder: 'asc', SortName: '', Records: 0 },
                ViewName: 'StockSearchListView',
                ObjectType: 'PSEITEM',
                OnlyQuery: 'true',
                ParaList: JSON.stringify({ ObjectID: [eid] })
              }
            },
            callback: function (ret) {
              try { cb(parseStockGrid(ret)); } catch (e) { cb(null); }
            },
            errorCallback: function () { cb(null); },
            showErrorMessage: false
          });
        } catch (e) { cb(null); }
      }

      try {
        var safe = String(code).replace(/'/g, "''");
        ds.AsyncCall({
          serviceuri: 'InforCenter.Common.ObjectService.CommonGetObjectDataByFilter',
          paras: {
            para: {
              Data: JSON.stringify({
                PSEITEM: { FilterInfo: [], FilterString: "ECODE='" + safe + "'", OrderbyString: '' }
              })
            }
          },
          callback: function (raw) {
            var eid = '';
            try {
              var o = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
              var arr = o.PSEITEM || o['PSEITEM$'] || o.Data;
              var row = arr && arr[0];
              eid = (row && (row.EID || row['PSEITEM.EID'] || row.EID_DisplayValue)) || '';
            } catch (e) { eid = ''; }
            eidStore(code, eid);
            queryStock(eid);
          },
          errorCallback: function () { cb(null); },
          showErrorMessage: false
        });
      } catch (e) { cb(null); }
    }

    function plmStockQuery(code, cb) { plmStockQueryAsync(code, cb); }

    /** 展示库存与来源标记；返回是否展示成功 */
    function showInv(r, src) {
      if (!dlg || !r || !r.total) return false;
      var n = Number(r.total.qty || 0);
      if (!n) return false;
      invBadge.textContent = String(n);
      // 库存只来自 PLM 标准接口，来源标识固定为 PLM
      invSrc.textContent = 'PLM';
      invSrc.style.opacity = '1';
      invSrc.style.padding = '0 4px';
      invSrc.style.borderRadius = '3px';
      invSrc.style.background = 'rgba(76,175,80,.18)';
      invSrc.style.color = '#2e7d32';
      invSrc.title = '数据来自 PLM 库存查询服务（Hoteam.InforCenter.ERPService.GetStockSearchData，与 BOM「库存查询」同源）';
      invBadge.title = (r.warehouses || []).slice(0, 8).map(function (w) {
        return (w.stockName || '未知仓库') + '：' + w.qty + (w.projectNo ? '（' + w.projectNo + '）' : '');
      }).join('\n');
      invWrap.style.display = 'inline-flex';
      return true;
    }

    /** 现有库存：只走 PLM 标准接口（Hoteam.InforCenter.ERPService.GetStockSearchData），不再回落 ERP 直连 */
    function loadInventory(sp) {
      invWrap.style.display = 'none';
      invBadge.textContent = '0';
      invSrc.textContent = '';
      var src = CFG.inventorySource || 'plm';
      try {
        var ec3 = extCfg();
        if (ec3 && ec3.inventorySource) src = String(ec3.inventorySource);
      } catch (e) { }

      // 优先查「最相似物料」的库存：新建物料还没建档，自身编码在 PLM 里查不到对象
      var code = topSimilarCode || readEcode();
      if (!code) return;
      var invKey = code + '|' + src;
      if (invKey === lastInvKey) return;   // 同一编码同一来源不重复查
      lastInvKey = invKey;

      if (src === 'plm') {
        plmStockQuery(code, function (r) {
          if (!dlg) return;
          if (r && r.ok) { showInv(r, 'plm'); return; }
          log('PLM 库存查询未返回数据：' + code + '（已移除 ERP 直连兜底）');
        });
        return;
      }

      // 'dashboard' 模式：走治理服务（其内部同样受 ERP 开关约束，关闭时不返回库存）
      var base = String(CFG.inventoryBase || '').replace(/\/+$/, '');
      if (!base) return;
      var url = base + '/api/new-material/inventory?code=' + encodeURIComponent(code)
        + '&sub=' + encodeURIComponent(currentSub())
        + '&spec=' + encodeURIComponent(sp || '');
      apiAbsolute(url, function (r) {
        if (!dlg || !r) return;
        showInv(r, 'plm');
      });
    }

    /**
     * 规格差异高亮：把该行规格里「与录入规格不同」的片段标黄，
     * 与看板「类似型号明细」保持同一口径（按分隔符切词比较）。
     */
    function diffSpec(qspec, spec) {
      var qt = {};
      String(qspec || '').toUpperCase().split(/[\s\/()（）,，+\-*]+/).forEach(function (t) {
        if (t) qt[t] = 1;
      });
      var parts = String(spec || '').split(/([\s\/()（）,，+\-*]+)/);
      var out = '';
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        if (!p) continue;
        if (/^[\s\/()（）,，+\-*]+$/.test(p)) { out += escHtml(p); continue; }
        out += qt[p.toUpperCase()]
          ? escHtml(p)
          : '<span style="background:#ffd54f;color:#333;padding:0 2px;border-radius:2px">' + escHtml(p) + '</span>';
      }
      return out;
    }

    /** 类似型号明细弹窗：汇总 + 差异高亮表格，点行填入规格 */
    function closeSimilarModal() {
      if (dlg && dlg.similarMask && dlg.similarMask.parentNode) {
        dlg.similarMask.parentNode.removeChild(dlg.similarMask);
      }
      if (dlg) dlg.similarMask = null;
    }

    // ================= 选型助手（与 3100 看板同源，行为一致） =================
    var selMask = null;
    var selDebounce = null;
    var selTipEl = null;

    function closeSelectModal() {
      if (selTipEl) selTipEl.style.display = 'none';
      if (!selMask) return;
      try { selMask.parentNode.removeChild(selMask); } catch (e) { }
      selMask = null;
    }

    // 结果表格：长文本单元格悬停显示全文
    function bindSelTips(root) {
      if (!root) return;
      if (!selTipEl) {
        selTipEl = dlgEl('div', 'position:fixed;z-index:2147483030;display:none;max-width:420px;max-height:240px;'
          + 'overflow:auto;padding:8px 10px;background:' + th.bg + ';color:' + th.fg + ';border:' + C_LINE + ';'
          + 'border-radius:6px;font-size:12px;line-height:1.65;white-space:pre-wrap;'
          + 'box-shadow:0 10px 28px rgba(0,0,0,.45);pointer-events:none;');
        selTipEl.className = 'plm-smart-sel-tip';
        document.body.appendChild(selTipEl);
      }
      var tds = root.querySelectorAll('td[data-full]');
      for (var i = 0; i < tds.length; i++) {
        (function (td) {
          td.onmouseenter = function () {
            selTipEl.textContent = td.getAttribute('data-full') || '';
            selTipEl.style.display = 'block';
            var r = td.getBoundingClientRect();
            var left = Math.min(r.left, window.innerWidth - 440);
            selTipEl.style.left = Math.max(8, left) + 'px';
            var top = r.bottom + 6;
            if (top + 200 > window.innerHeight) {
              top = Math.max(8, r.top - 6 - selTipEl.offsetHeight);
            }
            selTipEl.style.top = top + 'px';
          };
          td.onmouseleave = function () { selTipEl.style.display = 'none'; };
        })(tds[i]);
      }
    }

    function selColKey(sub, id) { return 'plm.sel.cols.' + sub + '.' + id; }

    // 默认勾选：管理页标了「可筛」的列；使用者勾过的优先
    function selLoadKeys(sub, id, cols) {
      try {
        var raw = localStorage.getItem(selColKey(sub, id));
        if (raw) {
          var arr = JSON.parse(raw);
          if (arr && arr.length !== undefined) return arr;
        }
      } catch (e) { }
      var out = [];
      for (var i = 0; i < cols.length; i++) {
        if (cols[i].role === 'model' || cols[i].key === '小类号') continue;
        if (cols[i].filterable !== false) out.push(cols[i].key);
      }
      return out;
    }

    function selSaveKeys(sub, id, keys) {
      try { localStorage.setItem(selColKey(sub, id), JSON.stringify(keys)); } catch (e) { }
    }

    function openSelectModal() {
      if (selMask) return;
      // 双保险：按钮已禁用时不允许打开（部分 UI 库会忽略 disabled 属性）
      if (!selBtnReady) { log('该小类暂无选型数据，已禁用选型助手'); return; }
      var sub = String(currentSub() || '');
      if (!sub) { alert('请先选择小类'); return; }

      selMask = dlgEl('div', 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.35);z-index:2147483020;');
      selMask.className = 'plm-smart-sel-mask';
      selMask.onclick = function (e) { if (e && e.target === selMask) closeSelectModal(); };

      var panel = dlgEl('div', 'position:fixed;left:50%;top:6%;transform:translateX(-50%);width:1280px;max-width:97vw;'
        + 'max-height:84vh;overflow:auto;background:' + th.bg + ';color:' + th.fg + ';border-radius:6px;'
        + 'box-shadow:0 12px 36px rgba(0,0,0,.35);z-index:2147483021;'
        + 'font:13px/1.6 "Microsoft YaHei",Arial,sans-serif;');
      selMask.appendChild(panel);

      var head = dlgEl('div', 'padding:12px 18px;border-bottom:' + C_LINE + ';background:' + C_HEAD_BG
        + ';font-size:15px;font-weight:bold;white-space:nowrap;overflow:hidden;');
      head.innerHTML = '选型助手 <span style="font-weight:normal;opacity:.7;font-size:13px">'
        + '（参数来自厂家样本，最终以设计规范与最新样本为准）</span>';
      var x = dlgEl('span', 'float:right;cursor:pointer;opacity:.7;font-size:18px;line-height:18px;', '×');
      x.onclick = closeSelectModal;
      head.appendChild(x);
      panel.appendChild(head);

      var box = dlgEl('div', 'padding:14px 18px;');
      panel.appendChild(box);
      box.innerHTML = '<div style="opacity:.7">加载中…</div>';

      // 必须挂到 document 上，否则元素只在内存里，界面看不到
      document.body.appendChild(selMask);

      apiAbsolute(apiUrl('/api/plm/select/series?sub=' + encodeURIComponent(sub)), function (r) {
        if (!selMask) return;
        var all = (r && r.series) || [];
        var list = [];
        for (var i = 0; i < all.length; i++) if (all[i].enabled !== false) list.push(all[i]);
        if (!list.length) {
          box.innerHTML = '<div style="opacity:.7">当前小类暂无选型库</div>';
          return;
        }
        renderSelUI(box, list, sub);
      });
    }

    function renderSelUI(box, series, sub) {
      var opts = '';
      for (var i = 0; i < series.length; i++) {
        var s = series[i];
        opts += '<option value="' + i + '">' + escHtml(s.id)
          + (s.brand ? ' · ' + escHtml(s.brand) : '')
          + (s.name ? ' · ' + escHtml(s.name) : '') + '</option>';
      }
      var inputStyle = 'padding:4px 6px;border:' + C_LINE + ';border-radius:4px;background:' + C_INPUT_BG + ';color:inherit;font-size:12px;';
      var btnStyle = 'border:1px solid rgba(127,127,127,.45);background:transparent;color:inherit;border-radius:4px;padding:4px 12px;cursor:pointer;font-size:12px;';

      box.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:10px;">'
        + '<label style="font-size:12px;opacity:.75">系列</label>'
        + '<select class="plm-sel-series" style="' + inputStyle + '">' + opts + '</select>'
        + '<span class="plm-sel-filters" style="display:contents"></span>'
        + '<button class="plm-sel-go" style="' + btnStyle + '">查询</button>'
        + '<button class="plm-sel-pick" style="' + btnStyle + '" title="选择哪些参数出现在条件栏">筛选字段</button>'
        + '</div>'
        + '<div class="plm-sel-picker" style="display:none;margin-bottom:10px;padding:10px 12px;'
        + 'background:rgba(127,127,127,.08);border:' + C_LINE + ';border-radius:4px;"></div>'
        + '<div style="font-size:13px;font-weight:bold;margin:6px 0 6px;">匹配型号</div>'
        + '<div class="plm-sel-result" style="font-size:12px;opacity:.75;">填写条件后点「查询」</div>';

      var selSeries = box.querySelector('.plm-sel-series');
      var filtersBox = box.querySelector('.plm-sel-filters');
      var resultBox = box.querySelector('.plm-sel-result');
      var pickerBox = box.querySelector('.plm-sel-picker');
      var goBtn = box.querySelector('.plm-sel-go');
      var pickBtn = box.querySelector('.plm-sel-pick');

      function curSeries() { return series[Number(selSeries.value) || 0] || series[0]; }
      function allCols(s) {
        var out = [];
        var cs = (s && s.columns) || [];
        for (var i = 0; i < cs.length; i++) {
          if (cs[i].role === 'model' || cs[i].key === '小类号') continue;
          out.push(cs[i]);
        }
        return out;
      }
      function control(c) {
        var label = escHtml(c.key) + (c.unit ? '（' + escHtml(c.unit) + '）' : '');
        var attr = 'data-col="' + escHtml(c.key) + '"';
        var ctrl = '';
        if (c.type === 'enum' && c.options && c.options.length) {
          var o = '<option value="">不限</option>';
          for (var i = 0; i < c.options.length; i++) o += '<option>' + escHtml(c.options[i]) + '</option>';
          ctrl = '<select ' + attr + ' style="' + inputStyle + '">' + o + '</select>';
        } else if (c.type === 'number') {
          ctrl = '<input type="number" step="any" ' + attr + ' placeholder="不限" style="width:92px;' + inputStyle + '" />';
        } else {
          ctrl = '<input type="text" ' + attr + ' placeholder="不限" style="width:110px;' + inputStyle + '" />';
        }
        return '<span style="display:inline-flex;align-items:center;gap:5px;white-space:nowrap;">'
          + '<label style="font-size:12px;opacity:.75">' + label + '</label>' + ctrl + '</span>';
      }

      function buildFilters() {
        var s = curSeries();
        var cols = allCols(s);
        var keys = selLoadKeys(sub, s.id, cols);
        var html = '';
        for (var i = 0; i < cols.length; i++) {
          if (keys.indexOf(cols[i].key) < 0) continue;
          html += control(cols[i]);
        }
        filtersBox.innerHTML = html
          || '<span style="font-size:12px;opacity:.6">未选择筛选字段，点「筛选字段」勾选</span>';

        // 筛选条件变化后自动查询（下拉立即查、输入框防抖），不必再去点「查询」
        var els = filtersBox.querySelectorAll('[data-col]');
        for (var j2 = 0; j2 < els.length; j2++) {
          (function (el) {
            if (el.tagName === 'SELECT') {
              el.onchange = function () { runQuery(); };
            } else {
              el.oninput = function () {
                clearTimeout(selDebounce);
                selDebounce = setTimeout(runQuery, 350);
              };
            }
          })(els[j2]);
        }
      }

      function buildPicker() {
        var s = curSeries();
        var cols = allCols(s);
        var keys = selLoadKeys(sub, s.id, cols);
        var main = '', other = '';
        for (var i = 0; i < cols.length; i++) {
          var c = cols[i];
          var checked = keys.indexOf(c.key) >= 0 ? ' checked' : '';
          var item = '<label style="display:inline-flex;align-items:center;gap:5px;margin:0 16px 6px 0;cursor:pointer;">'
            + '<input type="checkbox" data-key="' + escHtml(c.key) + '"' + checked + ' />'
            + escHtml(c.key) + (c.unit ? '（' + escHtml(c.unit) + '）' : '') + '</label>';
          if (c.filterable !== false) main += item; else other += item;
        }
        pickerBox.innerHTML = '<div style="font-size:12px;opacity:.75;margin-bottom:6px;">'
          + '主要参数默认已勾选；需要时再补选其他参数（选择会记住）</div>'
          + (main ? '<div style="font-size:12px;color:' + C_MUTE + ';margin:8px 0 4px;">主要参数</div><div>' + main + '</div>' : '')
          + (other ? '<div style="font-size:12px;color:' + C_MUTE + ';margin:8px 0 4px;">其他参数</div><div>' + other + '</div>' : '');

        var cbs = pickerBox.querySelectorAll('input[type=checkbox]');
        for (var j = 0; j < cbs.length; j++) {
          cbs[j].onchange = function () {
            var arr = [];
            var all = pickerBox.querySelectorAll('input[type=checkbox]');
            for (var k = 0; k < all.length; k++) if (all[k].checked) arr.push(all[k].getAttribute('data-key'));
            selSaveKeys(sub, curSeries().id, arr);
            buildFilters();
          };
        }
      }

      function runQuery() {
        var s = curSeries();
        var filters = {};
        var els = filtersBox.querySelectorAll('[data-col]');
        for (var i = 0; i < els.length; i++) {
          var v = String(els[i].value == null ? '' : els[i].value).trim();
          if (v !== '') filters[els[i].getAttribute('data-col')] = v;
        }
        var url = apiUrl('/api/plm/select?sub=' + encodeURIComponent(sub)
          + '&series=' + encodeURIComponent(s.id)
          + '&limit=500'
          + '&filters=' + encodeURIComponent(JSON.stringify(filters)));
        log('选型查询', 'series=' + s.id, 'filters=' + JSON.stringify(filters));
        resultBox.innerHTML = '<span style="opacity:.7">查询中…</span>';
        apiAbsolute(url, function (r) {
          if (!selMask) return;
          if (!r || r.ok === false) {
            log('选型查询失败', r && r.error);
            resultBox.innerHTML = '<span style="opacity:.7">查询失败</span>';
            return;
          }
          log('选型结果', 'total=' + r.total, 'returned=' + r.returned);
          renderSelResult(r);
        });
      }

      function renderSelResult(r) {
        var items = (r && r.items) || [];
        if (!items.length) { resultBox.innerHTML = '<span style="opacity:.7">没有匹配的型号</span>'; return; }
        var total = (r && r.total) || items.length;
        var paramCols = [];
        var cs = (r && r.columns) || [];
        for (var i = 0; i < cs.length; i++) {
          if (cs[i].role === 'model' || cs[i].key === '小类号') continue;
          paramCols.push(cs[i]);
        }
        var h = '<div style="font-size:12px;opacity:.7;margin-bottom:6px;">共 ' + total + ' 条'
          + (total > items.length ? '，已显示前 ' + items.length + ' 条' : '') + '</div>'
          + '<div style="overflow-x:auto;"><table style="width:max-content;min-width:100%;border-collapse:collapse;font-size:12px;">'
          + '<thead><tr style="background:' + C_HEAD_BG + ';">'
          + '<th style="padding:6px 10px;border-bottom:' + C_LINE + ';text-align:left;white-space:nowrap;">型号</th>';
        for (var j = 0; j < paramCols.length; j++) {
          h += '<th style="padding:6px 10px;border-bottom:' + C_LINE + ';text-align:left;white-space:nowrap;">'
            + escHtml(paramCols[j].key) + (paramCols[j].unit ? '（' + escHtml(paramCols[j].unit) + '）' : '') + '</th>';
        }
        h += '</tr></thead><tbody>';
        for (var k = 0; k < items.length; k++) {
          var it = items[k];
          h += '<tr data-k="' + k + '" style="cursor:pointer;">'
            + '<td style="padding:6px 10px;border-bottom:' + C_LINE + ';font-family:monospace;white-space:nowrap;">'
            + escHtml(it.model) + '</td>';
          for (var m = 0; m < paramCols.length; m++) {
            var cv = (it.cells && it.cells[paramCols[m].key] != null) ? it.cells[paramCols[m].key] : '';
            var sv = String(cv == null ? '' : cv);
            // 长文本收窄 + 省略号，悬停看全文（「中文说明」这类列很容易把表格撑爆）
            var full = sv.length > 18 ? ' data-full="' + escHtml(sv) + '"' : '';
            var clip = sv.length > 18 ? 'max-width:240px;overflow:hidden;text-overflow:ellipsis;' : '';
            h += '<td style="padding:6px 10px;border-bottom:' + C_LINE + ';white-space:nowrap;' + clip + '"' + full + '>'
              + escHtml(sv) + '</td>';
          }
          h += '</tr>';
        }
        h += '</tbody></table></div>';
        resultBox.innerHTML = h;
        bindSelTips(resultBox);

        var rows = resultBox.querySelectorAll('tr[data-k]');
        for (var n = 0; n < rows.length; n++) {
          rows[n].onclick = function () {
            var it2 = items[Number(this.getAttribute('data-k'))];
            if (!it2) return;
            // 名称由使用者手工输入（配合同义词点选）；只在为空且系列带名称时补全
            if (!String(nameIn.value || '').trim() && it2.name) nameIn.value = it2.name;
            specIn.value = it2.spec || it2.model || '';
            closeSelectModal();
            checkNow();
          };
        }
      }

      selSeries.onchange = function () { buildFilters(); runQuery(); };
      goBtn.onclick = runQuery;
      pickBtn.onclick = function () {
        if (pickerBox.style.display === 'none') {
          buildPicker();
          pickerBox.style.display = '';
        } else {
          pickerBox.style.display = 'none';
        }
      };

      buildFilters();
      runQuery();
    }

    function openSimilarModal() {
      if (!lastSimilar || !lastSimilar.items || !lastSimilar.items.length) return;
      if (dlg && dlg.similarMask) return;

      var items = lastSimilar.items;
      var total = lastSimilar.total || {};
      var sp = specIn.value;

      var m2 = dlgEl('div', 'position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.35);z-index:2147483010;');
      // 加宽到 1120：25 条时标题 + 来源标签不换行、表格不被挤压
      var p2 = dlgEl('div', 'position:fixed;left:50%;top:8%;transform:translateX(-50%);width:1120px;max-width:97vw;'
        + 'max-height:82vh;overflow:auto;background:' + th.bg + ';color:' + th.fg + ';border-radius:6px;'
        + 'box-shadow:0 12px 36px rgba(0,0,0,.35);z-index:2147483011;'
        + 'font:13px/1.6 "Microsoft YaHei",Arial,sans-serif;');

      var h2 = dlgEl('div', 'padding:12px 18px;border-bottom:' + C_LINE + ';background:' + C_HEAD_BG
        + ';font-size:15px;font-weight:bold;white-space:nowrap;overflow:hidden;');
      var matchedTotal = (lastSimilar && lastSimilar.matchedTotal) || items.length;
      h2.innerHTML = '类似型号明细 <span style="font-weight:normal;opacity:.7;font-size:13px">'
        + '（同小类相同/相似规格，共 ' + matchedTotal + ' 条'
        + (matchedTotal > items.length ? '，本次查前 ' + items.length + ' 条' : '') + '）</span>';
      var x2 = dlgEl('span', 'float:right;cursor:pointer;opacity:.7;font-size:18px;line-height:18px;', '×');
      x2.onclick = closeSimilarModal;
      h2.appendChild(x2);

      // 标题右侧标注库存来源：先显示「查询中…」，逐条查 PLM 后变为 PLM（绿）
      var simSrc = dlgEl('span', 'margin-left:10px;font-weight:bold;font-size:12px;color:' + C_MUTE + ';', '库存来源：查询中…');
      simSrc.className = 'plm-smart-sim-src';
      h2.appendChild(simSrc);

      var b2 = dlgEl('div', 'padding:12px 18px 16px;');

      // 合计先占位：数量列要等 PLM 逐条查完再显示（不再用看板数据兜底）
      var sumRow = dlgEl('div', 'opacity:.75;margin-bottom:8px;');
      sumRow.appendChild(dlgEl('span', '', '合计数量 '));
      var sumQty = dlgEl('b', 'opacity:1;', '…');
      sumRow.appendChild(sumQty);
      sumRow.appendChild(dlgEl('span', '', '　·　可用 '));
      var sumAvb = dlgEl('b', 'opacity:1;', '…');
      sumRow.appendChild(sumAvb);
      b2.appendChild(sumRow);

      var legend = dlgEl('div', 'opacity:.75;margin-bottom:10px;');
      legend.innerHTML = '录入规格：<span style="opacity:1">' + escHtml(sp) + '</span>　'
        + '<span style="background:#ffd54f;color:#333;padding:0 4px;border-radius:2px">黄色</span>'
        + ' = 与该规格的差异部分　·　已按接近程度排序（越靠前差异越少）';
      b2.appendChild(legend);

      var table = dlgEl('table', 'width:100%;border-collapse:collapse;font-size:13px;');
      table.innerHTML = '<thead><tr style="background:' + C_HEAD_BG + ';opacity:.75;text-align:left">'
        + '<th style="padding:6px 10px;font-weight:normal">物料号</th>'
        + '<th style="padding:6px 10px;font-weight:normal">名称</th>'
        + '<th style="padding:6px 10px;font-weight:normal">规格型号</th>'
        + '<th style="padding:6px 10px;font-weight:normal;width:70px">数量</th>'
        + '<th style="padding:6px 10px;font-weight:normal">项目号（最近业务）</th>'
        + '</tr></thead>';

      var tb = dlgEl('tbody', '');
      var qtyCells = [];
      var pjCells = [];
      for (var i = 0; i < items.length; i++) {
        (function (it) {
          var tr = dlgEl('tr', 'border-bottom:' + C_LINE + ';cursor:pointer;');
          var c0 = dlgEl('td', 'padding:6px 10px');
          c0.innerHTML = '<a href="javascript:void(0)" style="color:' + th.accent
            + ';text-decoration:none">' + escHtml(it.fnumber || '') + '</a>';
          tr.appendChild(c0);
          var c1 = dlgEl('td', 'padding:6px 10px');
          c1.textContent = String(it.name || '');
          tr.appendChild(c1);
          var c2 = dlgEl('td', 'padding:6px 10px');
          c2.innerHTML = diffSpec(sp, it.spec || '');
          tr.appendChild(c2);
          var c3 = dlgEl('td', 'padding:6px 10px');
          c3.className = 'plm-smart-sim-qty';
          c3.textContent = '…';          // 先占位，PLM 查到再填
          tr.appendChild(c3);
          var c4 = dlgEl('td', 'padding:6px 10px;opacity:.75');
          c4.className = 'plm-smart-sim-pj';
          c4.textContent = String(it.projectNo || '');
          tr.appendChild(c4);
          qtyCells.push(c3);
          pjCells.push(c4);
          tr.onclick = function () {
            specIn.value = it.spec;
            closeSimilarModal();
            checkNow();
          };
          tb.appendChild(tr);
        })(items[i]);
      }
      table.appendChild(tb);

      b2.appendChild(table);
      p2.appendChild(h2);
      p2.appendChild(b2);
      m2.appendChild(p2);
      document.body.appendChild(m2);
      if (dlg) dlg.similarMask = m2;

      // 先让表格显示出来，再逐条用 PLM 接口刷新库存（一条一条查，不整块卡住）
      setTimeout(function () {
        // 传当前规格作为缓存 key：同一规格反复打开明细时直接复用上次结果
        refreshSimilarStock(items, qtyCells, pjCells, sumQty, sumAvb, simSrc, specIn.value);
      }, 0);
    }

    // 明细库存缓存：小类 + 规格 → { at, map:{编码:{qty,projectNo}} }，3 分钟内复用
    var detailStockCache = {};
    var DETAIL_TTL = 3 * 60 * 1000;

    /** 从 PLM 返回的仓库行里取项目号：优先数量最大的那行，其次任意有值的行 */
    function pickStockProject(r) {
      var ws = (r && r.warehouses) || [];
      var best = '', bestQty = -1, any = '';
      for (var i = 0; i < ws.length; i++) {
        var pj = String(ws[i].projectNo || '').trim();
        if (!pj) continue;
        if (!any) any = pj;
        var q = Number(ws[i].qty || 0);
        if (q > bestQty) { bestQty = q; best = pj; }
      }
      return best || any;
    }

    /**
     * 明细库存：逐条走 PLM（不用看板数据兜底）。
     * 表格先以「…」占位，查到一条填一条；查不到的显示「-」，计入「未取到」。
     * 项目号同样以 PLM 返回的 FMTONO 为准（与 ERP 库存页一致）。
     */
    function refreshSimilarStock(items, cells, pjCells, sumQty, sumAvb, srcEl, specKey) {
      // 命中缓存：不再打 PLM，直接把上次的数量/项目号填回去
      var cacheKey = String(currentSub() || '') + '|' + String(specKey || '').trim();
      var hit = detailStockCache[cacheKey];
      if (hit && (Date.now() - hit.at) < DETAIL_TTL) {
        var s0 = 0;
        for (var ci = 0; ci < items.length; ci++) {
          var cv = hit.map[String(items[ci].fnumber || '')];
          if (!cv) continue;
          if (cells[ci]) cells[ci].textContent = (cv.qty == null ? '-' : String(cv.qty));
          if (cv.projectNo && pjCells && pjCells[ci]) pjCells[ci].textContent = cv.projectNo;
          if (cv.qty != null) s0 += cv.qty;
        }
        if (sumQty) sumQty.textContent = String(s0);
        if (sumAvb) sumAvb.textContent = String(s0);
        if (srcEl) {
          var mins = Math.max(1, Math.ceil((DETAIL_TTL - (Date.now() - hit.at)) / 60000));
          srcEl.textContent = '库存来源：缓存（' + mins + ' 分钟内有效，点此重查）';
          srcEl.style.color = '#2e7d32';
          srcEl.style.cursor = 'pointer';
          srcEl.onclick = function () {
            delete detailStockCache[cacheKey];
            srcEl.onclick = null;
            srcEl.style.cursor = '';
            refreshSimilarStock(items, cells, pjCells, sumQty, sumAvb, srcEl, specKey);
          };
        }
        return;
      }

      var i = 0, sum = 0, okCount = 0;
      function finish() {
        if (!srcEl) return;
        if (items.length > 0 && okCount === items.length) {
          srcEl.textContent = '库存来源：PLM';
          srcEl.style.color = '#2e7d32';
        } else if (okCount > 0) {
          srcEl.textContent = '库存来源：PLM（' + (items.length - okCount) + ' 条未取到）';
          srcEl.style.color = '#e8890c';
        } else {
          srcEl.textContent = '库存来源：PLM 查询失败';
          srcEl.style.color = '#d32f2f';
        }
        if (sumQty) sumQty.textContent = String(sum);
        if (sumAvb) sumAvb.textContent = String(sum);
      }
      function step() {
        if (!dlg) return;
        if (i >= items.length) { finish(); return; }
        var idx = i++;
        if (srcEl) srcEl.textContent = '库存来源：查询中 ' + (idx + 1) + '/' + items.length;
        // 串行异步：前一条回来再发下一条，既不阻塞页面，也不会瞬间打爆服务端
        plmStockQueryAsync(items[idx].fnumber, function (r) {
          if (!dlg) return;
          var n = null;
          if (r && r.ok) {
            okCount++;
            n = Number((r.total && r.total.qty) || 0);
            // 项目号以 PLM 返回的 FMTONO 为准
            var pj = pickStockProject(r);
            if (pj && pjCells && pjCells[idx]) pjCells[idx].textContent = pj;
            // 写入缓存：同一规格再次打开明细时直接复用，不再逐条查 PLM
            if (!detailStockCache[cacheKey]) detailStockCache[cacheKey] = { at: Date.now(), map: {} };
            detailStockCache[cacheKey].at = Date.now();
            detailStockCache[cacheKey].map[String(items[idx].fnumber || '')] = {
              qty: n, projectNo: pj || '',
            };
          }
          if (cells[idx]) cells[idx].textContent = (n == null ? '-' : String(n));
          if (n != null) sum += n;
          if (sumQty) sumQty.textContent = String(sum);
          if (sumAvb) sumAvb.textContent = String(sum);
          setTimeout(step, 0);
        });
      }
      setTimeout(step, 0);
    }

    var lastCheckedKey = '';
    function checkNow() {
      var nm = nameIn.value;
      var sp = specIn.value;
      // 内容没变就不重复发请求（防抖 + 失焦 + keyup 可能重复触发）
      var key = nm + '|' + sp;
      if (key === lastCheckedKey) return;
      lastCheckedKey = key;
      if (!nm && !sp) {
        nameTip.innerHTML = ''; specTip.innerHTML = '';
        nameSugBox.innerHTML = ''; specMeta.innerHTML = '';
        invWrap.style.display = 'none';
        setSimBtn(0);
        lastSimilar = null;
        errors = []; setSaveEnabled(true); return;
      }
      specTip.innerHTML = '<div style="opacity:.6">校验中…</div>';
      apiAsync('/api/plm/check', { name: nm, spec: sp, sub: currentSub(), ecode: readEcode() }, function (r) {
        if (!dlg) return;
        if (!r || r.ok === false) {
          specTip.innerHTML = '<div style="color:' + C_ERR + '">治理服务不可用（' + escHtml(CFG.apiLabel) + '）</div>';
          setSaveEnabled(false);
          return;
        }
        lastCheckResult = r;     // 供 similar-models 兜底判重后重绘
        renderInfo(r);
        renderTips(r);
        loadNameSuggest(nm);
        loadSpecMeta(sp);
        loadSimilar(sp);
        loadInventory(sp);
      });
    }

    /**
     * 同型号系列近似联想：与看板同一接口（3130 /api/new-material/spec-suggest），
     * 返回 modelSummary（该型号已有 N 条规格 / M 个物料）+ 候选规格（含型号段条数、库存）。
     */
    function loadSpecSuggest() {
      var base = String(CFG.inventoryBase || '').replace(/\/+$/, '');
      var q = String(specIn.value || '').trim();
      if (!base || q.length < 2) {
        specSug.style.display = 'none';
        specSug.innerHTML = '';
        return;
      }
      var url = base + '/api/new-material/spec-suggest?sub=' + encodeURIComponent(currentSub())
        + '&q=' + encodeURIComponent(q);
      apiAbsolute(url, function (r) {
        if (!dlg) return;
        if (!r || !r.items || !r.items.length) {
          specSug.style.display = 'none';
          specSug.innerHTML = '';
          return;
        }
        var qn = q.toLowerCase();
        var html = '';
        if (r.modelSummary) {
          html += '<div style="padding:6px 8px;border-bottom:' + C_LINE + ';line-height:1.6">ℹ 同型号系列 '
            + '<b>' + escHtml(r.modelSummary.model) + '</b>（含变体）：同小类已有 <b>'
            + escHtml(r.modelSummary.specCount) + '</b> 条规格 / <b>'
            + escHtml(r.modelSummary.itemCount) + '</b> 个物料，挑最接近的即可</div>';
        }
        for (var i = 0; i < r.items.length && i < 10; i++) {
          var it = r.items[i];
          var s = String(it.spec || '');
          if (s.trim().toLowerCase() === qn) continue;      // 不把自己列出来
          var idx = s.toLowerCase().indexOf(qn);
          var specHtml = idx >= 0
            ? escHtml(s.slice(0, idx + q.length)) + '<b style="color:' + th.accent + '">'
              + escHtml(s.slice(idx + q.length)) + '</b>'
            : escHtml(s);
          var meta = [];
          if (it.model && it.seriesSpecs > 1) meta.push('型号段 ' + it.seriesSpecs + ' 条');
          if (it.qty != null) meta.push('库存 ' + it.qty);
          html += '<div class="plm-smart-sug-item" data-spec="' + escHtml(s) + '"'
            + ' style="padding:5px 8px;border-bottom:1px solid rgba(127,127,127,.15);cursor:pointer;'
            + 'display:flex;justify-content:space-between;gap:12px">'
            + '<span style="word-break:break-all">' + specHtml + '</span>'
            + '<span style="opacity:.65;white-space:nowrap">' + escHtml(meta.join(' · ')) + '</span></div>';
        }
        specSug.innerHTML = html;
        specSug.style.display = 'block';
        // 点行即填入
        try {
          var rows = specSug.children || [];
          for (var k = 0; k < rows.length; k++) {
            (function (row) {
              if (String(row.className || '').indexOf('plm-smart-sug-item') < 0) return;
              row.onclick = function () {
                var v = row.getAttribute ? row.getAttribute('data-spec') : '';
                if (!v) return;
                specIn.value = v;
                specSug.style.display = 'none';
                checkNow();
              };
            })(rows[k]);
          }
        } catch (e) { }
      });
    }

    var timer = null;
    function onChange() {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { checkNow(); loadSpecSuggest(); }, 250);
    }
    // 多事件绑定：某些环境 input 不一定按预期触发（输入法、脚本赋值、平台键事件处理），
    // 用 keyup/change/paste 兜底，失焦时再强制校验一次
    function bindLive(el) {
      el.oninput = onChange;
      el.onkeyup = onChange;
      el.onchange = onChange;
      el.onpaste = function () { setTimeout(onChange, 0); };
      el.onblur = function () {
        if (timer) clearTimeout(timer);
        checkNow();
        // 失焦不再关闭 specSug：
        //   specSug 是常驻的「同型号系列」参考列表，不是输入下拉补全。
        //   点「展开/折叠」、切到名称框等失焦动作，不应让清单消失（原来 180ms 后强制隐藏，导致此 bug）。
        //   需要收起时由 loadSpecSuggest 重新计算（输入 <2 字）或点击候选行（填值后）负责。
      };
    }
    bindLive(nameIn);
    bindLive(specIn);

    saveBtn.onclick = function () {
      var nm = nameIn.value;
      var sp = specIn.value;
      if (!nm && !sp) { msgBox('提示', '请先填写名称或规格型号'); return; }
      // 有 error 时不允许回填，只能修改或取消
      if (errors.length) {
        msgBox('存在校验错误', '请先按提示修改名称 / 规格，或点击取消。\n\n' + errors.join('\n'));
        return;
      }

      // 保存前同步校验一次，按规范写法回填
      var r = apiSync('/api/plm/check', { name: nm, spec: sp, sub: currentSub(), ecode: readEcode() });
      if (r && r.ok !== false) {
        if (r.errors && r.errors.length) {
          renderTips(r);
          msgBox('存在校验错误', '请先按提示修改名称 / 规格，或点击取消。\n\n' + r.errors.join('\n'));
          return;
        }
        if (r.nameFormat && r.nameFormat.final) nm = r.nameFormat.final;
        else if (r.nameSynonym && r.nameSynonym.exact && r.nameSynonym.std) nm = r.nameSynonym.std;
        if (r.specFormat && r.specFormat.fixed != null) sp = r.specFormat.fixed;
      }

      // 回填范围约束：只写「规格型号」，名称与主要参数/分类属性一律不动
      var applied = [];
      if (sp && writeText(state.ggxh, sp)) {
        fireBlur(state.ggxh);
        applied.push('规格型号');
      }
      closeEditor();
      // 记住回填后的内容：之后 PLM 输入框不再弹联想/重复提示，除非用户再改
      state.quietKey = fieldKey();
      // 回填成功不再显示绿色提示，保持界面干净；只有什么都没填时才给一句说明
      setCheckTip(applied.length ? '' : '未回填（内容为空）', applied.length ? 'ok' : 'bad');
      log('弹窗回填完成：' + (applied.join('、') || '无'));
    };

    // 按要求：只有右上角 ×（和「取消」）能关闭，点遮罩不关闭
    mask.appendChild(panel);
    panel.appendChild(head);
    panel.appendChild(body);
    panel.appendChild(foot);
    foot.appendChild(cancelBtn);
    foot.appendChild(saveBtn);
    document.body.appendChild(mask);
    dlg = {
      mask: mask, panel: panel, nameIn: nameIn, specIn: specIn,
      nameTip: nameTip, specTip: specTip, invWrap: invWrap, invBadge: invBadge, simBtn: simBtn
    };

    renderInfo(null);
    checkNow();
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
      state.quietKey = '';
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

      // 注入「智能录入」按钮（编码仍由 PLM 编码器负责，这里完全不碰编号）
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
          svc.ok = false;
          try { syncLock(); } catch (e) { }
          log('治理服务不可达：' + apiUrl('') + '（联想/查重将自动跳过，名称/规格保持可编辑）');
          return;
        }
        svc.ok = h.ready !== false;
        try { syncLock(); } catch (e) { }
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
      // 弹窗里已确认并回填、内容未变 → 不再二次确认
      if (state.quietKey && state.quietKey === key) {
        log('名称/规格已在弹窗确认，跳过保存前二次确认');
        return true;
      }

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

  // ---- 名称/规格锁定（全锁 + 服务降级自动解锁）----
  var svc = { ok: null, at: 0 };        // 治理服务可用性：null=未知，true=可用，false=不可用
  var lockApplied = false;

  function probeService() {
    svc.at = Date.now();
    apiAsync('/api/plm/health', {}, function (h) {
      svc.ok = !!(h && h.ok === true && h.ready !== false);
      // 状态变化后立刻刷新弹窗里的「治理服务」提示
      try { if (dlg) renderInfo(lastInfo); } catch (e) { }
    });
  }

  function lockMode() {
    var mode = CFG.lockFields;
    var ec = extCfg();
    if (ec && ec.lockFields !== undefined && ec.lockFields !== null) mode = ec.lockFields;
    if (mode === false || mode === 'false') return false;
    if (mode === true || mode === 'true') return true;
    return svc.ok === true;            // 'auto'：服务可用才锁
  }

  /** 是否应该锁：总开关、按钮开关、类型、锁定开关都允许才锁 */
  function shouldLock() {
    if (!CFG.enabled) return false;
    if (!CFG.showCheckButton) return false;   // 没有录入入口时不锁，避免无法录入
    // 只锁「电气元件 / 原材料 / 外购标准件」，其它类型保持 PLM 原生可编辑
    if (!isTypeAllowed()) return false;
    return lockMode();
  }

  function lockTargets() {
    var list = [];
    var a = domOf(state.ename);
    var b = domOf(state.ggxh);
    if (a) list.push(a);
    if (b && b !== a) list.push(b);
    return list;
  }

  /** 锁定 / 解锁名称与规格（readOnly，程序写入不受影响） */
  function applyLock(on) {
    var els = lockTargets();
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (!el) continue;
      if (on) {
        if (!el.__plmSmartLock) {
          el.__plmSmartLock = {
            bg: el.style ? el.style.backgroundColor : '',
            cursor: el.style ? el.style.cursor : ''
          };
        }
        el.readOnly = true;
        if (el.style) {
          el.style.backgroundColor = 'rgba(127,127,127,.12)';
          el.style.cursor = 'not-allowed';
        }
        if (el.setAttribute) el.setAttribute('title', '请使用「智能录入」填写');
      } else {
        el.readOnly = false;
        var s = el.__plmSmartLock;
        if (s) {
          if (el.style) {
            el.style.backgroundColor = s.bg || '';
            el.style.cursor = s.cursor || '';
          }
          if (el.setAttribute) el.setAttribute('title', '');
          el.__plmSmartLock = null;
        }
      }
    }
    lockApplied = !!on;
  }

  /** 每轮轮询调用：服务可用性变化时自动锁/解锁 */
  function syncLock() {
    var on = shouldLock();
    if (on === lockApplied && lockTargets().length === 0) return;
    applyLock(on);
  }

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
    // 首次接管时探活一次，并按结果决定是否锁定名称/规格
    try { if (svc.ok === null) probeService(); syncLock(); } catch (e) { }
    return !!okBtn;
  }

  function watchDialog() {
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
      // 先按当前配置同步锁定状态：配置关闭 → 自动解锁；服务恢复 → 自动重新锁定
      try {
        if (CFG.enabled && Date.now() - svc.at > 30000) probeService();
        syncLock();
      } catch (e) { }
      if (!CFG.enabled) {          // 插件停用：只维持「已解锁」，不再接管
        domWatchTimer = setTimeout(tick, 1500);
        return;
      }
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

  log('脚本已加载 v' + pluginVersion() + '（api=' + apiUrl('')
    + '；地址来源=' + ((extCfg() && extCfg().apiBase) ? 'ItemSmartInput.config.js' : '内置默认')
    + '；外部配置=' + (EXT_KEYS.length ? EXT_KEYS.join('/') : '未使用')
    + '；规格同步ZYCS/FLSXHB=' + (CFG.fillSpecToParams ? '开' : '关')
    + '；空格整理=' + (CFG.tidySpecSpace ? '开' : '关')
    + '；类型门控=' + (CFG.restrictItemType ? (CFG.itemTypeAllowText || []).join('/') : '关')
    + '；超限拦截=' + (CFG.strictWidth ? '开' : '关') + '）');

  // 平台向导脚本可能晚于本文件加载，这里延迟挂接（幂等，最多重试 20 秒）
  installGuideGuards();

  // 兜底：PSE_ItemGuide 等不触发 CreatePage_OnCreate 的入口，靠 DOM 轮询接管
  watchDialog();

  // ===================== 阶段 0：PLM 物料查询接口探测（临时调试，整段可删）=====================
  // 目的：确认 CommonGetObjectDataByFilter 能否按编码查到物料、返回哪些字段、
  //       是否包含 STATEID（使用状态）、是否支持 FilterString 里带状态条件。
  // 用法（F12 Console，输入后回车）：
  //   __plmProbe.help()
  //   __plmProbe.one('10010100271')      查一条，打印全部（推荐先跑这个）
  //   __plmProbe.raw('10010100271')      只打印原始返回，不剥壳
  //   __plmProbe.state('10010100271')    对比「带/不带 STATEID 过滤」的结果差异
  //   __plmProbe.fields('10010100271')   只列返回的字段名
  //   __plmProbe.timing(['10010100271','10010100223'])   批量测耗时
  (function () {
    var TAG = '[PLM探测]'
    var SVC_FILTER = 'InforCenter.Common.ObjectService.CommonGetObjectDataByFilter'
    var SVC_STOCK = 'Hoteam.InforCenter.ERPService.GetStockSearchData'
    var KEY_FIELDS = ['ECODE', 'ENAME', 'GGXH', 'ZYCS', 'UNIT', 'STATEID', 'WORKFLOWSTATE', 'EID', 'EUID', 'UPDATETIME', 'EVERSION']
    // 超时从配置读（ItemSmartInput.config.js 的 plmQueryTimeout），默认 3 分钟
    // 依据：实测 1080 行要 19.5 秒，但个别小类会卡住超过 60 秒，需要放宽并允许现场调整
    var TIMEOUT = Number(CFG.plmQueryTimeout) || 180000

    function stamp() {
      var d = new Date()
      function p(n) { return (n < 10 ? '0' : '') + n }
      return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds()) + '.' + String(d.getMilliseconds())
    }
    function c(style, args) {
      var a = [].slice.call(args)
      a.unshift('%c' + TAG + ' ' + style, 'color:#0a7;font-weight:bold')
      return a
    }
    function log() { var a = [].slice.call(arguments); if (console && console.log) console.log.apply(console, c('', a)) }
    function warn() { var a = [].slice.call(arguments); if (console && console.warn) console.warn.apply(console, c('color:#c80', a)) }
    function err() { var a = [].slice.call(arguments); if (console && console.error) console.error.apply(console, c('color:#c00', a)) }

    function nowMs() { return (window.performance && window.performance.now) ? window.performance.now() : Date.now() }
    function cut(s, n) {
      s = String(s == null ? '' : s)
      return s.length > n ? s.slice(0, n) + '…（共 ' + s.length + ' 字）' : s
    }

    /** 环境自检：HoteamUI / DataService / AsyncCall 是否可用 */
    function envCheck() {
      var root = window.HoteamUI
      var ds = root && root.DataService
      var info = {
        HoteamUI: !!root,
        DataService: !!ds,
        AsyncCall: !!(ds && typeof ds.AsyncCall === 'function'),
        Call: !!(ds && typeof ds.Call === 'function'),
        ServiceUri: SVC_FILTER,
        timeoutMs: TIMEOUT,
      }
      log('环境自检', info)
      if (!info.HoteamUI) err('window.HoteamUI 不存在 —— 当前页面不是 PLM 页面，或平台脚本未加载')
      else if (!info.DataService) err('window.HoteamUI.DataService 不存在 —— 平台数据服务未就绪')
      else if (!info.AsyncCall && !info.Call) err('DataService 既没有 AsyncCall 也没有 Call —— 无法调用服务')
      return info
    }

    /** 逐层剥壳：ASMX 可能套 {d:"json"} / 单键对象 / 字符串 */
    function deepUnwrap(v) {
      var x = v
      for (var i = 0; i < 6; i++) {
        if (typeof x === 'string') {
          var s = x.trim()
          if (!s || (s.charAt(0) !== '{' && s.charAt(0) !== '[')) break
          try { x = JSON.parse(s); continue } catch (e) { break }
        }
        if (Object.prototype.toString.call(x) === '[object Array]') break
        if (x && typeof x === 'object') {
          var keys = Object.keys(x)
          if (keys.length === 1) { x = x[keys[0]]; continue }
          if (x.d !== undefined) { x = x.d; continue }
        }
        break
      }
      return x
    }

    /** 从返回里取出行数组（PSEITEM / PSEITEM$ / Rows / Data） */
    function pickRows(data) {
      if (!data) return []
      if (Object.prototype.toString.call(data) === '[object Array]') return data
      var cand = ['PSEITEM', 'PSEITEM$', 'PSEITEMMASTER', 'Rows', 'Data', 'data', 'Result']
      for (var i = 0; i < cand.length; i++) {
        var v = data[cand[i]]
        if (Object.prototype.toString.call(v) === '[object Array]') return v
        if (v && typeof v === 'object') {
          var inner = pickRows(v)
          if (inner.length) return inner
        }
      }
      return []
    }

    /**
     * 调 PLM 服务；cb(errInfo, rows, meta)
     * @param {string} filterString 过滤条件
     * @param {function} cb 回调
     * @param {string} orderBy OrderbyString
     * @param {object|null} pager PLM 原生分页 { CurrentPager, RowNumber }，放在 para 层（同 GetStockSearchData）
     */
    function callPlm(filterString, cb, orderBy, pager) {
      var env = envCheck()
      if (!env.DataService || (!env.AsyncCall && !env.Call)) {
        cb({ step: 'env', message: '数据服务不可用' }, [], null)
        return
      }
      var ds = window.HoteamUI.DataService
      var para = {
        para: {
          Data: JSON.stringify({
            PSEITEM: { FilterInfo: [], FilterString: filterString, OrderbyString: orderBy || '' },
          }),
        },
      }
      // PLM 原生分页：与 GetStockSearchData 一致，Pager 放在 para 层
      if (pager && pager.RowNumber) {
        para.para.Pager = {
          CurrentPager: pager.CurrentPager || 1,
          RowNumber: pager.RowNumber,
          SortOrder: 'asc',
          SortName: orderBy || '',
          Records: 0,
        }
      }
      var t0 = nowMs()
      var done = false, timer = null

      function finish(errInfo, raw) {
        if (done) return
        done = true
        if (timer) { clearTimeout(timer); timer = null }
        var cost = Math.round(nowMs() - t0)
        if (errInfo) { err('调用返回错误', errInfo, '耗时 ' + cost + 'ms'); cb(errInfo, [], { cost: cost, raw: raw }); return }
        var unwrapped = deepUnwrap(raw)
        var rows = pickRows(unwrapped)
        log('调用完成  耗时 ' + cost + 'ms  行数 ' + rows.length)
        cb(null, rows, { cost: cost, raw: raw, unwrapped: unwrapped })
      }

      timer = setTimeout(function () {
        finish({ step: 'timeout', message: '超过 ' + TIMEOUT + 'ms 无返回' }, null)
      }, TIMEOUT)

      try {
        if (env.AsyncCall) {
          ds.AsyncCall({
            serviceuri: SVC_FILTER,
            paras: para,
            callback: function (ret) { finish(null, ret) },
            errorCallback: function (e) {
              finish({ step: 'callback', message: 'errorCallback 触发', detail: cut(e && (e.message || e.statusText || e), 200) }, null)
            },
            showErrorMessage: false,
          })
          log('已发起 AsyncCall', { serviceuri: SVC_FILTER, FilterString: filterString })
        } else {
          var ret = ds.Call(SVC_FILTER, para)
          finish(null, ret)
        }
      } catch (e) {
        finish({ step: 'throw', message: String(e && e.message || e), stack: e && e.stack ? String(e.stack).split('\n').slice(0, 4).join(' | ') : '' }, null)
      }
    }

    function summarize(rows) {
      if (!rows.length) { warn('没有返回行'); return }
      var keys = Object.keys(rows[0] || {})
      log('字段清单（' + keys.length + ' 个）: ' + keys.join(', '))
      var missing = []
      for (var i = 0; i < KEY_FIELDS.length; i++) if (keys.indexOf(KEY_FIELDS[i]) < 0) missing.push(KEY_FIELDS[i])
      if (missing.length) warn('缺少关键字段: ' + missing.join(', '))
      else log('关键字段齐全 ✅')
      for (var r = 0; r < rows.length && r < 5; r++) {
        var o = rows[r], one = {}
        for (var k = 0; k < KEY_FIELDS.length; k++) {
          var f = KEY_FIELDS[k]
          if (o[f] !== undefined) one[f] = cut(o[f], 40)
        }
        log('第 ' + (r + 1) + ' 行关键值', one)
      }
    }

    function help() {
      log('阶段 0 探测工具已就绪。可用命令：')
      log('  __plmProbe.one(code)     查一条并打印全部（先跑这个）')
      log('  __plmProbe.raw(code)     只打印原始返回')
      log('  __plmProbe.state(code)   对比带/不带 STATEID 过滤')
      log('  __plmProbe.fields(code)  只列字段名')
      log('  __plmProbe.timing([codes])  批量测耗时')
      log('  __plmProbe.page({after,limit})  游标分页探测（阶段 2 前置）')
      log('  __plmProbe.pageTest()    分页能力对照测试')
      log('  __plmProbe.scan({subs,concurrency})  按小类扫描，测批量拉取耗时')
      log('  __plmProbe.pagerTest()   测 PLM 原生分页（Pager 参数）是否可用')
      log('提示：Console 里按 "[PLM探测]" 过滤本工具输出')
      envCheck()
    }

    function one(code) {
      if (!code) { err('请传编码，如 __plmProbe.one(\'10010100271\')'); return }
      log('=== 查单条：' + code + ' ===')
      callPlm("ECODE = '" + String(code).replace(/'/g, "''") + "'", function (e, rows) {
        if (e) return
        if (!rows.length) { warn('未查到该编码（可能是停用/废弃已排除，或编码不存在）'); return }
        summarize(rows)
        log('第一条完整对象：', rows[0])
        var st = rows[0].STATEID
        if (st === undefined) err('返回里没有 STATEID 字段 —— 无法判断使用状态，需换接口')
        else log('STATEID = "' + st + '"' + (st === 'Using' ? '（启用，可引用）' : '（非启用，不可引用）'))
      })
    }

    function raw(code) {
      log('=== 原始返回：' + code + ' ===')
      callPlm("ECODE = '" + String(code).replace(/'/g, "''") + "'", function (e, rows, meta) {
        if (e) { err('原始返回失败', e); return }
        log('meta', { cost: meta && meta.cost, type: typeof meta.raw })
        if (typeof meta.raw === 'string') log('原始字符串（前 1200 字）:', cut(meta.raw, 1200))
        else log('原始对象:', meta.raw)
      })
    }

    function state(code) {
      log('=== 状态过滤对比：' + code + ' ===')
      log('① 不带状态条件')
      callPlm("ECODE = '" + String(code).replace(/'/g, "''") + "'", function (e1, rows1) {
        var n1 = e1 ? -1 : rows1.length
        var s1 = e1 ? '(失败)' : (rows1[0] ? String(rows1[0].STATEID) : '(空)')
        log('① 结果：行数 ' + n1 + '  STATEID=' + s1)
        log('② 带 STATEID = \'Using\'')
        callPlm("ECODE = '" + String(code).replace(/'/g, "''") + "' AND STATEID = 'Using'", function (e2, rows2) {
          var n2 = e2 ? -1 : rows2.length
          log('② 结果：行数 ' + n2)
          if (n1 === n2) warn('两种写法行数相同 —— 接口可能不支持状态过滤，需客户端自己筛')
          else log('两种写法行数不同 —— 接口支持状态过滤 ✅')
        })
      })
    }

    function fields(code) {
      callPlm("ECODE = '" + String(code).replace(/'/g, "''") + "'", function (e, rows) {
        if (e) return
        if (!rows.length) { warn('没有返回行，无法列字段'); return }
        var keys = Object.keys(rows[0] || {})
        log('共 ' + keys.length + ' 个字段：')
        keys.forEach(function (k) { log('  ' + k + ' = ' + cut(rows[0][k], 60)) })
      })
    }

    function timing(codes) {
      codes = codes || []
      if (!codes.length) { err('请传编码数组，如 __plmProbe.timing([\'10010100271\',\'10010100223\'])'); return }
      var total = 0, done = 0, failed = 0
      codes.forEach(function (code, idx) {
        var t0 = nowMs()
        callPlm("ECODE = '" + String(code).replace(/'/g, "''") + "'", function (e, rows) {
          var cost = Math.round(nowMs() - t0)
          total += cost
          done++
          if (e) failed++
          log('[' + (idx + 1) + '/' + codes.length + '] ' + code + '  行数 ' + (e ? '-' : rows.length) + '  耗时 ' + cost + 'ms')
          if (done === codes.length) {
            log('合计：' + codes.length + ' 次，平均 ' + Math.round(total / done) + 'ms，失败 ' + failed)
          }
        })
      })
    }

    /**
     * 分页探测：游标方式（ECODE > after），按 ECODE 升序
     * 用法：__plmProbe.page({ after: '10010100000', limit: 500 })
     */
    function page(opts) {
      var o = opts || {}
      var limit = o.limit || 500
      var prefix = o.prefix || ['10', '11', '12']
      var after = o.after || ''
      var conds = prefix.map(function (p) { return "ECODE LIKE '" + p + "%'" })
      var fs = '(' + conds.join(' OR ') + ") AND STATEID = 'Using'"
      if (after) fs += " AND ECODE > '" + String(after).replace(/'/g, "''") + "'"
      log('=== 分页探测 after=' + (after || '(从头)') + ' limit=' + limit + ' ===')
      log('FilterString: ' + fs)
      callPlm(fs, function (e, rows, meta) {
        if (e) return
        log('返回 ' + rows.length + ' 行，耗时 ' + (meta && meta.cost) + 'ms')
        if (!rows.length) { warn('没有返回行（可能已到末尾，或条件不被支持）'); return }
        var first = rows[0], last = rows[rows.length - 1]
        log('首条 ECODE=' + first.ECODE + '　末条 ECODE=' + last.ECODE)
        if (String(first.ECODE) > String(last.ECODE)) {
          err('结果不是升序 —— OrderbyString 可能未生效，游标分页不可用')
        } else {
          log('结果升序 ✅ 下次游标：__plmProbe.page({ after: "' + last.ECODE + '", limit: ' + limit + ' })')
        }
        if (rows.length > limit) err('返回 ' + rows.length + ' 行 > limit ' + limit + ' —— limit 未生效')
        else if (rows.length === limit) log('返回行数正好等于 limit，可能还有下一页')
      }, 'ECODE')
    }

    /**
     * 分页能力对照：先看小范围一次返回多少（默认上限），再试游标
     * 用法：__plmProbe.pageTest()
     */
    function pageTest() {
      log('=== 分页能力对照测试（先测 100101 小类，安全范围）===')
      callPlm("ECODE LIKE '100101%' AND STATEID = 'Using'", function (e1, rows1, m1) {
        if (e1) return
        log('① 不传 limit，ECODE LIKE 100101% → 返回 ' + rows1.length + ' 行，耗时 ' + (m1 && m1.cost) + 'ms')
        log('② 接下来试「同小类 + 游标」，limit 200')
        setTimeout(function () {
          page({ prefix: ['100101'], after: '10010100000', limit: 200 })
        }, 800)
      }, 'ECODE')
    }

    /**
     * 按小类扫描：避开「10%/11%/12%」这类全表条件（实测必超时）
     * 用法：__plmProbe.scan({ subs: ['100101','100102','100103'], concurrency: 2 })
     */
    function scan(opts) {
      var o = opts || {}
      var subs = o.subs || []
      var concurrency = Math.max(1, Math.min(5, o.concurrency || 2))
      if (!subs.length) {
        err('请传小类数组，如 __plmProbe.scan({ subs: [\'100101\',\'100102\'], concurrency: 2 })')
        return
      }
      log('=== 按小类扫描：' + subs.length + ' 个小类，并发 ' + concurrency + ' ===')
      var t0 = nowMs()
      var idx = 0, done = 0, failed = 0, totalRows = 0
      var results = []

      function next() {
        if (idx >= subs.length) return
        var sub = subs[idx++]
        var st = nowMs()
        callPlm("ECODE LIKE '" + sub + "%' AND STATEID = 'Using'", function (e, rows) {
          var cost = Math.round(nowMs() - st)
          done++
          if (e) {
            failed++
            warn('[' + done + '/' + subs.length + '] ' + sub + ' 失败：' + (e.message || e.step) + '  ' + cost + 'ms')
          } else {
            totalRows += rows.length
            results.push({ sub: sub, n: rows.length, cost: cost })
            log('[' + done + '/' + subs.length + '] ' + sub + ' 返回 ' + rows.length + ' 行  ' + cost + 'ms')
          }
          if (done === subs.length) {
            var all = Math.round(nowMs() - t0)
            log('=== 完成：' + subs.length + ' 个小类，共 ' + totalRows + ' 行，失败 ' + failed + '，总耗时 ' + all + 'ms ===')
            var avg = Math.round(all / subs.length)
            log('平均 ' + avg + 'ms/小类 → 209 个小类串行约 ' + Math.round(avg * 209 / 1000) + ' 秒')
            if (results.length) {
              var maxOne = results.slice().sort(function (a, b) { return b.cost - a.cost })[0]
              log('最慢：' + maxOne.sub + ' ' + maxOne.n + ' 行 ' + maxOne.cost + 'ms')
            }
            window.__plmScanResult = results
            log('明细已存 window.__plmScanResult，可执行 copy(__plmScanResult) 复制')
            return
          }
          next()
        }, 'ECODE')
      }
      for (var i = 0; i < concurrency; i++) next()
    }

    /**
     * PLM 原生分页测试：Pager 放在 para 层（同 GetStockSearchData 的写法）
     * 用 100102（159 行，2.6 秒）作样本，比 100103（1080 行，19.5 秒）快
     * 用法：__plmProbe.pagerTest()
     */
    function pagerTest() {
      var sub = '100102'
      var fs = "ECODE LIKE '" + sub + "%' AND STATEID = 'Using'"
      log('=== PLM 原生分页测试（小类 ' + sub + '，约 159 行）===')

      log('① 不带 Pager（基线）')
      var t0 = nowMs()
      callPlm(fs, function (e1, rows1) {
        if (e1) { err('① 失败', e1); return }
        log('① 返回 ' + rows1.length + ' 行  ' + Math.round(nowMs() - t0) + 'ms')

        log('② Pager { CurrentPager: 1, RowNumber: 100 }')
        var t1 = nowMs()
        callPlm(fs, function (e2, rows2) {
          if (e2) { err('② 失败', e2); return }
          log('② 返回 ' + rows2.length + ' 行  ' + Math.round(nowMs() - t1) + 'ms')

          log('③ Pager { CurrentPager: 2, RowNumber: 100 }')
          var t2 = nowMs()
          callPlm(fs, function (e3, rows3) {
            if (e3) { err('③ 失败', e3); return }
            log('③ 返回 ' + rows3.length + ' 行  ' + Math.round(nowMs() - t2) + 'ms')

            var p1 = rows2[0] && rows2[0].ECODE
            var p2 = rows3[0] && rows3[0].ECODE
            log('第 1 页首条 ECODE=' + p1 + '　第 2 页首条 ECODE=' + p2)

            if (rows2.length === 100 && rows3.length > 0 && rows3.length < 100 && p1 !== p2) {
              log('✅ 分页有效：Page1=100 条，Page2=' + rows3.length + ' 条，数据不同')
              log('   全量 15141 条按 RowNumber=500 需要 ' + Math.ceil(15141 / 500) + ' 次请求')
            } else if (rows2.length === 100 && p1 === p2) {
              err('❌ Pager 被忽略：两页首条相同（' + p1 + '），接口不认 Pager')
            } else if (rows2.length > 100) {
              err('❌ Pager 无效：要求 100 条却返回 ' + rows2.length + ' 条')
            } else {
              warn('⚠ 结果不明确，请把上方数字发我判断')
            }
          }, 'ECODE', { CurrentPager: 2, RowNumber: 100 })
        }, 'ECODE', { CurrentPager: 1, RowNumber: 100 })
      }, 'ECODE')
    }

    // ===== 阶段 2：物料快照同步（查 PLM → 上报 3100）=====
    var syncState = {
      running: false, mode: '', total: 0, done: 0, failed: 0,
      rows: 0, batchNo: 0, errors: [], startedAt: 0, lastTicks: 0, failedSubs: [],
    }

    function syncLog() {
      var a = [].slice.call(arguments)
      a.unshift('[快照同步]')
      if (console && console.log) console.log.apply(console, a)
    }

    // 失败清单持久化：刷新页面后仍能 __plmSync.retry() 补跑
    var FAIL_KEY = 'plmSyncFailedSubs'
    function saveFailedSubs(list) {
      try { window.localStorage.setItem(FAIL_KEY, JSON.stringify(list || [])) } catch (e) { /* 隐私模式忽略 */ }
    }
    function loadFailedSubs() {
      try {
        var s = window.localStorage.getItem(FAIL_KEY)
        return s ? (JSON.parse(s) || []) : []
      } catch (e) { return [] }
    }

    function postJson(url, body, cb) {
      try {
        if (window.$ && $.ajax) {
          $.ajax({
            url: url, type: 'POST', contentType: 'application/json',
            data: JSON.stringify(body), dataType: 'json', timeout: 60000,
            success: function (r) { cb(null, r) },
            error: function (x, s, e) { cb({ status: x && x.status, msg: String(e || s) }) },
          })
        } else {
          fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            .then(function (r) { return r.json() })
            .then(function (r) { cb(null, r) })
            .catch(function (e) { cb({ msg: String(e && e.message || e) }) })
        }
      } catch (e) { cb({ msg: String(e && e.message || e) }) }
    }

    function syncPlan(cb) {
      var url = apiUrl('/api/plm/snapshot/plan')
      syncLog('获取计划：' + url)
      try {
        if (window.$ && $.ajax) {
          $.ajax({ url: url, type: 'GET', dataType: 'json', timeout: 20000,
            success: function (r) { cb(null, r) },
            error: function (x, s, e) { cb({ status: x && x.status, msg: String(e || s) }) } })
        } else {
          fetch(url).then(function (r) { return r.json() }).then(function (r) { cb(null, r) })
            .catch(function (e) { cb({ msg: String(e && e.message || e) }) })
        }
      } catch (e) { cb({ msg: String(e && e.message || e) }) }
    }

    function syncStatus() {
      var s = syncState
      var pct = s.total ? Math.round(s.done / s.total * 100) : 0
      var pending = loadFailedSubs()
      syncLog('进度 ' + s.done + '/' + s.total + '（' + pct + '%）  上报 ' + s.rows + ' 条  失败 ' + s.failed)
      if (pending.length) {
        syncLog('待补跑 ' + pending.length + ' 个小类：' + pending.join(', '))
        syncLog('补跑命令：__plmSync.retry()')
      }
      return {
        running: s.running, mode: s.mode, total: s.total, done: s.done,
        rows: s.rows, failed: s.failed, errors: s.errors, pendingRetry: pending,
      }
    }

    /**
     * 开始同步：每个小类查完立即上报一个小批次（简单可靠，并发安全）
     * @param {{force?:boolean, concurrency?:number}} opts
     */
    function syncStart(opts) {
      var o = opts || {}
      if (syncState.running) { warn('已有同步任务在跑，先等它结束'); return }
      syncPlan(function (e, plan) {
        if (e) { err('获取计划失败：' + (e.msg || e.status) + ' —— 检查 3100 是否可达：' + apiUrl('')); return }
        if (!plan || !plan.ok) { err('计划返回异常'); return }
        if (!plan.subs || !plan.subs.length) { err('计划里没有小类'); return }

        var concurrency = Math.max(1, Math.min(6, o.concurrency || plan.concurrency || 3))
        var afterTicks = o.force ? 0 : Number(plan.afterTicks || 0)
        var t0 = nowMs()

        syncState = {
          running: true, mode: o.force ? 'full' : (plan.mode || 'full'),
          total: plan.subs.length, done: 0, failed: 0,
          rows: 0, batchNo: 0, errors: [], startedAt: t0,
          lastTicks: afterTicks, failedSubs: [],
        }
        syncLog('开始：' + syncState.mode + ' 模式，' + plan.subs.length + ' 个小类，并发 ' + concurrency
          + '，起点 ticks=' + afterTicks)
        if (!afterTicks) syncLog('（全量模式：不加时间条件，扫描全部）')

        var idx = 0, finished = false, retried = false

        /** 补跑失败的小类（串行 + 单次重试，不再叠加并发压力） */
        function retryFailed(cb) {
          var list = (syncState.failedSubs || []).slice()
          if (!list.length) { cb(); return }
          retried = true
          syncState.failedSubs = []
          var ok = 0, i = 0
          syncLog('开始补跑 ' + list.length + ' 个失败小类：' + list.join(', '))
          function step() {
            if (i >= list.length) {
              syncState.failed = syncState.failedSubs.length
              syncLog('补跑结束：成功 ' + ok + ' 个，仍失败 ' + syncState.failedSubs.length + ' 个'
                + (syncState.failedSubs.length ? '（' + syncState.failedSubs.join(',') + '）' : ''))
              cb()
              return
            }
            var sub = list[i++]
            callPlm("ECODE LIKE '" + sub + "%'", function (e2, rows) {
              if (e2) {
                syncState.failedSubs.push(sub)
                saveFailedSubs(syncState.failedSubs)
                syncLog('  补跑 ' + sub + ' 仍失败：' + (e2.message || e2.step))
                return step()
              }
              ok++
              if (!rows.length) return step()
              var items = []
              for (var k = 0; k < rows.length; k++) {
                var r2 = rows[k]
                items.push({
                  ECODE: r2.ECODE, ENAME: r2.ENAME, GGXH: r2.GGXH, ZYCS: r2.ZYCS,
                  UNIT: r2.UNIT, STATEID: r2.STATEID, EID: r2.EID, EUID: r2.EUID,
                  UPDATETIME: r2.UPDATETIME, ITEMTYPE: r2.ITEMTYPE,
                })
              }
              syncState.batchNo++
              postJson(apiUrl('/api/plm/snapshot/upload'), { batch: syncState.batchNo, items: items, mode: syncState.mode }, function (e3, r3) {
                if (!e3) syncState.rows += (r3 && r3.received) || 0
                syncLog('  补跑 ' + sub + ' 成功：' + rows.length + ' 条')
                step()
              })
            }, 'ECODE')
          }
          step()
        }

        function finishAll() {
          if (finished) return
          finished = true
          // 先补跑失败的（只补一次，避免死循环）
          if (!retried && (syncState.failedSubs || []).length) {
            return retryFailed(function () {
              finished = false
              finishAll()
            })
          }
          syncState.running = false
          var elapsed = Math.round(nowMs() - t0)
          postJson(apiUrl('/api/plm/snapshot/done'), {
            mode: syncState.mode, client: 'PLM页面', elapsedMs: elapsed,
            batches: syncState.batchNo, lastTicks: syncState.lastTicks || 0,
          }, function (e2, r2) {
            if (e2) { err('收尾失败：' + (e2.msg || e2.status)); return }
            syncLog('=== 同步完成 ===')
            syncLog('  模式 ' + syncState.mode + '，小类 ' + syncState.total + '，失败查询 ' + syncState.failed)
            syncLog('  上报 ' + syncState.rows + ' 条，耗时 ' + Math.round(elapsed / 1000) + ' 秒')
            if (r2 && r2.ok) syncLog('  快照已更新：共 ' + r2.count + ' 条，lastTicks=' + r2.lastTicks)
            if (syncState.failedSubs && syncState.failedSubs.length) {
              warn('仍失败的小类：' + syncState.failedSubs.join(',') + '（可执行 __plmSync.retry() 再试）')
            }
          })
        }

        function next() {
          if (!syncState.running) { if (syncState.done >= syncState.total) finishAll(); return }
          if (idx >= plan.subs.length) {
            if (syncState.done >= syncState.total) finishAll()
            return
          }
          var sub = plan.subs[idx++]
          // 增量模式：加 UPDATETIME 条件（ticks 比较，不加 STATEID 过滤，才能发现被停用的）
          var fsStr = "ECODE LIKE '" + sub + "%'"
          if (afterTicks > 0) fsStr += ' AND UPDATETIME > ' + afterTicks

          callPlm(fsStr, function (e2, rows) {
            syncState.done++
            if (e2) {
              syncState.failed++
              syncState.failedSubs.push(sub)
              saveFailedSubs(syncState.failedSubs)
              syncState.errors.push(sub + '：' + (e2.message || e2.step))
              return next()
            }
            if (!rows.length) return next()

            var items = []
            for (var i = 0; i < rows.length; i++) {
              var r = rows[i]
              items.push({
                ECODE: r.ECODE, ENAME: r.ENAME, GGXH: r.GGXH, ZYCS: r.ZYCS,
                UNIT: r.UNIT, STATEID: r.STATEID, EID: r.EID, EUID: r.EUID,
                UPDATETIME: r.UPDATETIME, ITEMTYPE: r.ITEMTYPE,
              })
              var tk = Number(r.UPDATETIME || 0)
              if (tk > (syncState.lastTicks || 0)) syncState.lastTicks = tk
            }
            syncState.batchNo++
            var bn = syncState.batchNo
            postJson(apiUrl('/api/plm/snapshot/upload'), { batch: bn, items: items, mode: syncState.mode }, function (e3, r3) {
              if (e3) {
                syncState.errors.push('批次 ' + bn + ' 上报失败：' + (e3.msg || e3.status))
                syncLog('批次 ' + bn + '（' + sub + '）上报失败：' + (e3.msg || e3.status))
              } else {
                syncState.rows += (r3 && r3.received) || 0
                if (syncState.done % 20 === 0 || rows.length > 500) {
                  syncLog('批次 ' + bn + '（' + sub + '）' + items.length + ' 条，累计 ' + syncState.rows
                    + '，进度 ' + syncState.done + '/' + syncState.total)
                }
              }
              next()
            })
          }, 'ECODE')
        }

        for (var c = 0; c < concurrency; c++) next()
      })
    }

    /**
     * 独立补跑：只重跑指定小类（或上次失败的），结果按增量合并进现有快照
     * 用法：__plmSync.retry(['100201']) 或 __plmSync.retry()
     */
    function syncRetry(subs) {
      if (syncState.running) { warn('同步进行中，先等它结束'); return }
      // 来源优先级：显式传入 > 本次内存 > localStorage（页面刷新后仍能补跑）
      var list = (subs && subs.length) ? subs.slice()
        : ((syncState.failedSubs && syncState.failedSubs.length) ? syncState.failedSubs.slice() : loadFailedSubs())
      if (!list.length) {
        warn('没有待补跑的小类。可指定：__plmSync.retry([\'100201\',\'100301\'])')
        return
      }
      syncState.running = true
      syncState.failedSubs = []
      saveFailedSubs([])
      var ok = 0, i = 0, rowsTotal = 0, t0 = nowMs()
      syncLog('补跑 ' + list.length + ' 个小类：' + list.join(', '))

      function step() {
        if (i >= list.length) {
          syncState.running = false
          syncLog('补跑完成：成功 ' + ok + ' 个，仍失败 ' + (list.length - ok) + ' 个，补入 ' + rowsTotal + ' 条'
            + '，耗时 ' + Math.round((nowMs() - t0) / 1000) + ' 秒')
          // 关键：用 incremental 合并，不能重建（否则会丢掉已同步的全量数据）
          postJson(apiUrl('/api/plm/snapshot/done'), {
            mode: 'incremental', client: 'PLM页面-补跑', elapsedMs: Math.round(nowMs() - t0),
            batches: syncState.batchNo, lastTicks: syncState.lastTicks || 0,
          }, function (e, r) {
            if (e) { err('合并失败：' + (e.msg || e.status)); return }
            if (r && r.ok) syncLog('快照已合并：共 ' + r.count + ' 条')
          })
          return
        }
        var sub = list[i++]
        callPlm("ECODE LIKE '" + sub + "%'", function (e2, rows) {
          if (e2) {
            syncState.failedSubs.push(sub)
            saveFailedSubs(syncState.failedSubs)
            syncLog('  ' + sub + ' 仍失败：' + (e2.message || e2.step))
            return step()
          }
          ok++
          if (!rows.length) { syncLog('  ' + sub + ' 返回 0 条'); return step() }
          var items = []
          for (var k = 0; k < rows.length; k++) {
            var r2 = rows[k]
            items.push({
              ECODE: r2.ECODE, ENAME: r2.ENAME, GGXH: r2.GGXH, ZYCS: r2.ZYCS,
              UNIT: r2.UNIT, STATEID: r2.STATEID, EID: r2.EID, EUID: r2.EUID,
              UPDATETIME: r2.UPDATETIME, ITEMTYPE: r2.ITEMTYPE,
            })
            var tk = Number(r2.UPDATETIME || 0)
            if (tk > (syncState.lastTicks || 0)) syncState.lastTicks = tk
          }
          syncState.batchNo++
          postJson(apiUrl('/api/plm/snapshot/upload'), { batch: syncState.batchNo, items: items, mode: 'incremental' }, function (e3, r3) {
            if (e3) syncLog('  ' + sub + ' 上报失败：' + (e3.msg || e3.status))
            else rowsTotal += (r3 && r3.received) || 0
            step()
          })
        }, 'ECODE')
      }
      step()
    }

    // ===== 自动同步：工作时间每 N 小时检查一次 =====
    var autoTimer = null
    function autoSyncTick() {
      var a = CFG.autoSync || {}
      if (a.enabled === false) return
      if (syncState.running) return
      var now = new Date()
      var h = now.getHours()
      var ws = a.workStart == null ? 8 : a.workStart
      var we = a.workEnd == null ? 18 : a.workEnd
      if (h < ws || h >= we) return   // 非工作时间不跑
      syncPlan(function (e, plan) {
        if (e || !plan || !plan.ok) return
        var last = plan.lastAt ? new Date(plan.lastAt).getTime() : 0
        var need = (a.hours || 2) * 3600 * 1000
        var gap = last ? (Date.now() - last) : Infinity
        if (gap < need) return
        syncLog('距上次同步 ' + (last ? Math.round(gap / 3600000) + ' 小时' : '从未同步') + '，自动开始')
        syncStart({ force: !last })
      })
    }

    function autoStart() {
      var a = CFG.autoSync || {}
      if (a.enabled === false) { syncLog('自动同步已关闭'); return }
      var mins = a.checkMinutes || 30
      // 页面加载 30 秒后首次检查（避开初始化高峰），之后每 checkMinutes 检查
      setTimeout(autoSyncTick, 30000)
      if (autoTimer) clearInterval(autoTimer)
      autoTimer = setInterval(autoSyncTick, mins * 60000)
      syncLog('自动同步已启用：工作时间 ' + (a.workStart == null ? 8 : a.workStart) + ':00~'
        + (a.workEnd == null ? 18 : a.workEnd) + ':00，每 ' + (a.hours || 2) + ' 小时一次'
        + '（每 ' + mins + ' 分钟检查）')
    }

    window.__plmSync = {
      plan: function () { syncPlan(function (e, r) { if (e) { err(e); return } log('计划', r) }) },
      start: syncStart,
      status: syncStatus,
      retry: syncRetry,
      auto: { start: autoStart, tick: autoSyncTick, stop: function () { if (autoTimer) { clearInterval(autoTimer); autoTimer = null } syncLog('自动同步已停止') } },
      failed: function () {
        var list = loadFailedSubs()
        if (!list.length) { syncLog('没有待补跑的小类 ✅'); return [] }
        syncLog('待补跑 ' + list.length + ' 个：' + list.join(', '))
        syncLog('执行 __plmSync.retry() 开始补跑（不加时间限制，按小类全查）')
        return list
      },
      clearFailed: function () { saveFailedSubs([]); syncLog('已清空待补跑清单') },
      stop: function () { syncState.running = false; warn('已请求停止（当前批次结束后生效）') },
    }

    window.__plmProbe = {
      help: help, one: one, raw: raw, state: state, fields: fields, timing: timing,
      page: page, pageTest: pageTest, scan: scan, pagerTest: pagerTest,
      env: envCheck, service: { filter: SVC_FILTER, stock: SVC_STOCK },
    }
    log('快照同步工具已挂载：__plmSync.plan() / start() / status() / retry([subs]) / auto')
    // 启用自动同步（工作时间每 N 小时，页面常驻时生效）
    try { autoStart() } catch (e) { err('自动同步启动失败：' + (e && e.message)) }
    log('探测工具已挂载：__plmProbe.help() 查看用法')
  })();
})(window, window.jQuery);

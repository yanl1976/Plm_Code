/**
 * 物料录入助手 —— 配置文件（服务地址 + 功能开关）
 *
 * 生效方式：本文件由 ItemSmartInput.fileref 注册，**先于** ItemSmartInput.js 加载。
 *           改完保存 → 浏览器 Ctrl+F5 即可，不需要重启 IIS，也不需要重启 Node 服务。
 *
 * 用法：只写需要改的项，没写的沿用插件内置默认值。
 *       下面列出的就是默认值，整份保留即可看到全部开关。
 *
 * 说明：插件只识别下列键（白名单），写错键名不会生效，也不会影响其它设置。
 *       控制台首行会打印「外部配置=a/b/c」，可据此确认哪些项真的被读取。
 */
window.ItemSmartInputConfig = {
  // ---------- 服务地址 ----------
  apiBase: 'http://192.168.20.31:3100',  // 'auto' = 同机部署，自动取当前访问主机名
  apiPort: 3100,                          // 仅 apiBase='auto' 时生效
  apiLabel: '数据治理服务器',              // 提示文案里代替 IP 显示的名字
  inventorySource: 'plm',      // 'plm'=直接调 PLM 的 ERPService（与 BOM 库存查询同源）；'dashboard'=走 inventoryBase
  // allowDirectErp 已移除（2026-11-14）：系统全面切换 PLM，不再回落 ERP 直连
  // 原用途：PLM 查不到时走看板 3130 直连 ERP 库。现已由 PLM 快照 + PLM 标准接口完全覆盖。
  inventoryBase: 'http://192.168.20.31:3130', // 治理看板地址：弹窗里显示「现有库存」；留空则不显示
  timeout: 1500,                          // 单次请求超时(ms)，超时降级放行
  stockTimeout: 8000,                     // 库存查询超时(ms)
                                          // ERP 关闭访问时，PLM 的 AsyncCall 可能永不回调，
                                          // 没有超时会导致「库存」一直显示查询中、明细数量列一直是 …。
                                          // 超时后：输入框显示红标「— 查询失败」，标题栏 ERP 状态点变红。

  plmQueryTimeout: 180000,                // PLM 对象查询超时(ms)，默认 3 分钟
                                          // 实测：581 行要 11 秒、1080 行要 19.5 秒；
                                          // 个别小类会卡住超过 60 秒，故放宽到 3 分钟。
                                          // 若某小类持续超时，可单独 __plmSync.retry(['小类号']) 补跑

  // ---------- 自动同步物料快照 ----------
  // 页面常驻时生效（关掉 PLM 页面即停止）；首次检查在页面加载 30 秒后
  autoSync: {
    enabled: true,        // false = 完全不自动同步，只能手动 __plmSync.start()
    hours: 2,             // 间隔小时数（工作时间段内）
    workStart: 8,         // 工作时间起（含），24 小时制
    workEnd: 18,          // 工作时间止（不含），18 表示到 17:59
    checkMinutes: 30,     // 每多少分钟检查一次是否已到间隔（不是同步频率）
  },

  // ---------- 总开关 ----------
  enabled: true,              // false = 插件完全静默（最快的止血手段），并自动解除字段锁定
  showCheckButton: true,      // false = 不注入「智能录入」按钮（此时不锁字段，避免无法录入）
  lockFields: 'auto',         // 名称/规格锁定：'auto'=服务可用才锁；true=始终锁；false=不锁

  // ---------- 按钮 ----------
  checkButtonText: '智能录入',
  checkButtonHost: 'name',    // 'name'（名称框）| 'spec'（规格框）
  checkButtonPlace: 'left',   // 'left' 名称标签左侧 | 'float' 锚点右侧 | 'fixed' 窗口右下角 | 'after' 原布局
  checkButtonOffsetX: 6,      // 横向偏移(px)，负值向左
  checkButtonOffsetY: 0,      // 纵向偏移(px)

  // ---------- 类型门控 ----------
  restrictItemType: true,     // false = 所有类型都显示按钮
  itemTypeAllowText: ['电气元件', '原材料', '外购标准件'],
  itemTypeAllowValues: [],    // 若类型返回的是编码而非名称，在此补编码

  // ---------- 校验与回填 ----------
  tidySpecSpace: true,        // 失焦/保存前整理规格空格（首尾 / 连续 / 全角）
  fillSpecToParams: true,     // 规格同步到 主要参数(ZYCS) / 分类属性合并(FLSXHB)
  blockOnDuplicate: true,     // 保存时命中强重复二次确认
  notifyDuplicateOnBlur: true,// 失焦时浮层提示重复（不弹框）
  strictWidth: true,          // 超宽拦截（不做静默截断）

  // ---------- 联想与探测 ----------
  suggestDebounce: 300,       // 输入防抖(ms)
  minLen: 2,                  // 触发联想的最少字符数
  domWatchDelay: 2500,        // DOM 兜底接管延时(ms)，给正常 OnCreate 留出时间

  // ---------- 提示分类与配色 ----------
  // 名称 / 规格 / 查重 / 库存 / 环境 各类提醒统一在这里管：分组标签、严重程度配色、屏蔽开关。
  // 每条提示前会显示 [分组] 标签 + 严重程度图标，颜色按 level 决定。
  hints: {
    // 严重程度 → 图标与颜色。color 留空用插件内置（error 红 / warn 黄 / tip 蓝 / info 灰 / ok 绿）
    levels: {
      error: { icon: '✕', label: '必须修改' },
      warn: { icon: '!', label: '建议修改' },
      tip: { icon: '·', label: '建议采用' },
      info: { icon: 'i', label: '参考' },
      ok: { icon: '✓', label: '通过' }
    },

    // 分组标签：显示在每条提示最前面（如 [名称] [规格]）
    groups: {
      name: '名称',
      spec: '规格',
      dup: '查重',
      stock: '库存',
      env: '环境'
    },

    // 关键词 → 分组 / 级别（从上往下匹配，第一条命中即生效，顺序不要随意调）
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

    // 不想看到的提示：写关键词片段即可（如 ['括号', '乘号']），命中即隐藏
    mute: [],

    // 提示区总开关：'grouped'=按分组+配色显示（默认）；'plain'=恢复成原来的纯文字
    mode: 'grouped'
    },

    // ---------- 阻断开关 ----------
    // true = 拦截保存（默认）；false = 降级为黄色提示，允许保存
    // 与 hints.mute 的分工：blocks 管「是否拦截」，mute 管「是否显示」
    //
    // ⚠ 以下 5 项【不建议关闭】——关掉会产生脏数据，且后续难以追溯：
    //     nameEmpty       名称留空        → 物料在系统里搜不到
    //     specEmpty       规格留空        → 无法区分实物，选型/采购无从下手
    //     nameEqualsSpec  名称直接写型号   → 名称失去分类含义，检索全乱
    //     dupExact        归一化后完全相同 → 就是同一个物料，必然一物多号
    //     dupSep          仅分隔符不同     → 只是写法差异，同样是同一物料
    //
    // 其余 11 项可按现场情况临时关闭（如某些小类确实允许全角名称、允许参数顺序不同）。
    // 需要「既不拦截也不提示」时，同时把该关键词加进 hints.mute。
    blocks: {
    // 名称
    nameEmpty: true,          // 物料名称不能为空
    nameLen: true,            // 名称过短 / 过长
    nameForbidChars: true,    // 名称含规格符号（* × 等）
    nameForbidPattern: true,  // 名称含项目号 / 图号 / 产号
    nameEqualsSpec: true,     // 名称与规格完全相同
    nameFullWidth: true,      // 名称含全角字母/数字
    subMismatch: true,        // 名称与所选小类不符（名称疑似别的小类）
    // 规格
    specEmpty: true,          // 型号规格不能为空
    specLen: true,            // 型号规格过短 / 过长
    specFullWidth: true,      // 规格含全角字符
    specAlnum: true,          // 规格必须包含字母或数字
    specForbidPattern: true,  // 规格含项目号 / 产号
    specPlaceholder: true,    // 规格写「待定 / 见附件 / 同上」等占位
    // 查重
    dupExact: true,           // 归一化签名完全相同
    dupSep: true,             // 仅分隔符/空格不同
    dupOrder: true            // 参数相同、仅书写顺序不同
    }
    };

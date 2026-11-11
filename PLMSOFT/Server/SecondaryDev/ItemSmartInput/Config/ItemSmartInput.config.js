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
  allowDirectErp: true,        // PLM 查不到时回落直连 ERP（排查期默认开；PLM 稳定后改 false）
  inventoryBase: 'http://192.168.20.31:3130', // 治理看板地址：弹窗里显示「现有库存」；留空则不显示
  timeout: 1500,                          // 单次请求超时(ms)，超时降级放行

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
  domWatchDelay: 2500         // DOM 兜底接管延时(ms)，给正常 OnCreate 留出时间
};

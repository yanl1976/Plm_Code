# PLM 物料新增「名称/规格型号」智能录入 — 开发与对接文档

> 版本 v1.1.0 ｜ 2026-10-27 ｜ 状态：**开发完成，逻辑已验证，待现场联调**
> 关联文档：`PLM物料录入助手_部署说明.md`（部署/回滚/排查）、`PLM物料录入助手_部署说明.md` 第十一节（数据闭环）
> SDK 速查表：`doc/plm-sdk/`（94 个 Interface + 141 个 Service + 714 个插件点 + 930 条 cmdsql）

---

## 0. 一页速览

| 项 | 内容 |
|---|---|
| **目标** | 在 PLM 原生「新增物料」页面，为**名称**与**规格型号**两个输入框提供联想、查重，并把选定结果回填到对应输入框 |
| **硬边界** | 物料分类、物料编码申请、单位、位置、描述等**前置项全部保持 PLM 原有行为**，不做任何改动 |
| **技术路线** | PLM 前端 JS 二开（官方固化钩子）+ 本机 Node 治理服务（复用既有查重/结构化能力） |
| **侵入程度** | PLM 站点**零修改**，只新增 2 个文件（1 js + 1 fileref） |
| **是否需要 C#** | 不需要。不编译 DLL、不停服、不动 `Bin` |
| **当前状态** | 接口端到端通过；前端控制流 **25/25** 通过；现场环境 4 项待确认 |
| **待完成** | 6 项 P0（上线前）+ 5 项 P1/P2（上线后），见第 9 节 |

---

## 1. 模块地图

| 文件 | 行数 | 职责 | 归属 |
|---|---|---|---|
| `src/plm-index.js` | 270 | 内存索引：`materials.ndjson` → 小类/签名；查重三级判定；名称/规格联想 | Node |
| `src/plm-server.js` | 236 | 独立 HTTP 服务（默认 3100）：4 个接口、CORS、双格式解析、异常兜底 | Node |
| `PLMSOFT/.../ItemSmartInput.js` | 437 | PLM 侧钩子实现：绑定、防抖联想、浮层、回填、保存前阻断、降级 | PLM |
| `PLMSOFT/.../ItemSmartInput.fileref` | 8 | 声明 js 加载到 `InforCenter` / `TSDC` 框架 | PLM |
| `scripts/verify-plm-plugin.mjs` | 414 | 程序逻辑验证器（mock 环境真实执行 js，12 场景 25 断言） | 测试 |

**设计原则（与 `AI开发标准模板.md` 一致）**：
1. **业务逻辑只在 Node 一侧**，PLM 侧只做"取字段 → 调接口 → 回填"，避免两处规则漂移；
2. **PLM 侧任何异常一律放行**，绝不让治理服务影响建料；
3. **规则由配置文件驱动**（`src/config/*.json`），改规则不改代码、不动 PLM。

---

## 2. PLM 平台调研结论（对接依据）

### 2.1 平台概况

| 项 | 结论 |
|---|---|
| 产品 | 山大华天 **InforCenter Enterprise Platform 2020.3**（内部版本 8.3.8），MDA 模型驱动 |
| 站点 | `PLMSOFT/Server`（IIS），另有 `DistributedFileServer` 文件服务 |
| 技术 | ASP.NET 薄壳 + `Platform/Bin` 平台内核 + 各模块 `Bin/*.Business.dll`；业务走独立服务进程（`ServiceAddr=127.0.0.1:8890`） |
| 数据库 | `Server/Config/Apps.database`：`SQLSERVER` → `TCPLM`（**启用**）；`ERPSQLSERVER` → `198.168.6.15/AIS20240102122641`（`Enable=false`） |
| 二开层 | `TSDC`（天水电传客制）+ `SecondaryDev`（标准二开目录范式） |

### 2.2 元数据体系（运行时加载，不预编译）

| 扩展名 | 作用 |
|---|---|
| `.model` | 实体定义（`EntityType Name/Extend/TableName/GeneratePageType/LogicClass`） |
| `.schema` | 库表 DDL（`Column DataType/Required/PrimaryKeyOrder`） |
| `.dic` | 多语言 Label（中文名藏在这里） |
| `.page` | 界面布局树 + 控件 + 事件 |
| `.generator` | 页面生成模板（占位符 `[PAGENAME]/[OBJTYPE]`） |
| `.fileref` | **js 文件加载注册表**（`<JSFile FileName group>`） |
| `.cmdsql` | 外置 SQL 命令（`<Command Name>` + `[CONDITIONSTR]` 占位符） |
| `.plugin` / `.flowplugin` | 插件注册（`Type/Assembly/Class`） |

### 2.3 四条可扩展通道与能力边界

| 通道 | 能力 | 能否"保存时实时拦截" | 能否"调用外部服务" | 代价 |
|---|---|---|---|---|
| **① 元数据配置**（零代码） | 加字段/页面/编码规则/校验（`Required/ValidateUnique/Validation`） | ⚠️ 仅 `CustomCmdsqlCheck` 能跑 SQL 校验 | ❌ | 最低 |
| **② 前端 JS**（`.fileref` + 钩子） | 任意 JS，可 `$.ajax`、可改控件值 | ✅ | ✅ | 低（本方案） |
| **③ 插件 DLL**（`.plugin` + C#） | `ObjectType/AOPActionType/flowplugin` 等 6 类扩展点 | ✅ | ✅ | 高（编译+停服+覆盖风险） |
| **④ 开放 API**（`PlmApiService.asmx`） | `GetAuthCode` + `PLMCallDataService(serviceUri, para, checkAuth, connect)` | ❌（方向是"外部调 PLM"） | — | 低 |

### 2.4 四个决定性发现

**(1) 官方固化的二开钩子（本方案的立足点）**

`Platform/Config/Generator/PAGE-CREATE.generator:7,9`：

```xml
<PageHandler HandlerName="OnCreate"
  Script="... [CREATESCRIPT] var functionName = 'InforCenter_[OBJTYPE]_CreatePage_OnCreate';
          if (window[functionName] && typeof window[functionName] == 'function') return window[functionName](pageEvent,data);"/>
<PageHandler HandlerName="OnSaveCheck"
  Script="InforCenter_Platform_Object_SaveCheck = true; var functionName = 'InforCenter_[OBJTYPE]_CreatePage_OnOK';
          if (window[functionName] && typeof window[functionName] == 'function') InforCenter_Platform_Object_SaveCheck=window[functionName](pageEvent);"/>
```

对 `PSEITEM` 即 `InforCenter_PSEITEM_CreatePage_OnCreate` / `_OnOK`，已生成到 `PSEITEM-CREATE.page:92,138`。

**关键**：`PSEITEM.model` 的 `GeneratePageType="Create Edit View Copy"` 说明页面是**自动生成**的，手改 `.page` 会被覆盖；而钩子语句由模板固化，**重新生成永远保留**。因此"只实现钩子、不改页面"是唯一抗覆盖的做法。

**(2) 阻断机制成立（源码证据）**

`InforCenter/PSE/Item/Js/CreateItem.js` 向导中：

```javascript
if (cstep.Name == 'InforCenter/PSE/CreateItem/PSEITEM-CREATE.html') {
    var checkval = HoteamUI.PageCtrl.CallPageEvent(...);
    if (checkval == false) return;      // ← 返回 false 中断进入下一步
}
```

**(3) 目标控件与回填 API**

`AutoGenerator/Config/Pages/PSEITEM-CREATE.page`：

| 控件 ID | 类型 | 现有事件 | 行号 |
|---|---|---|---|
| `ENAME_Value` | `TextBox` | `OnFocusout` → 默认值联动 | 269 |
| `GGXH_Value` | `TextBox` | `OnFocusout` → 默认值联动 | 299 |
| `ZYCS_Value` | `TextBox` | `OnFocusout` → 默认值联动 | 430 |
| `ECODE_Value` | `EditButton` | `OnClick` → 编码选择器 | 235 |

回填方式（页面 `OnCreate` 里已有同类用法）：`ctrl.SetText(v)` / `GetText()` / `GetTag()` / `SetTag({text,value})`。

**(4) 字段对应关系**

| PLM（`PSEITEM` / `PSEITEMBASEFORM`） | ERP（`T_BD_MATERIAL`） | 说明 |
|---|---|---|
| `ECODE` | `FNUMBER` | 编码，同 6 位小类规则 |
| `ENAME` | `FNAME` | 名称 |
| `GGXH` | `FSPECIFICATION` | 规格型号 |
| `ZYCS` | `F_ZXCV_ZYCS` | 主要参数 |
| `UNIT` | `UNITNAME` | 单位 |

---

## 3. 方案选型

| 备选方案 | 实时拦截 | 调 Node 逻辑 | 结论 |
|---|---|---|---|
| 纯开放 API | ❌ | ❌ | 只能做存量批量巡检，做不了源头拦截 |
| 纯配置（cmdsql） | ⚠️ 仅 SQL 能表达的规则 | ❌ | 向导场景拿不到用户刚填的字段 |
| **前端 JS 二开（本方案）** | ✅ | ✅ | 零 DLL、不停服、能拿全字段 |
| C# 插件 | ✅ | ✅ | 能力最全但成本最高，留作 Excel 导入/移动端补充 |

**为什么不用插件**：`CreateItem.js:300-315` 已有 `CheckItemRulesRepeat` 在保存前拦截，说明这个时机本来就是"前端脚本说了算"；用 JS 改同一个位置，既最小侵入又不需要 .NET 工具链。

---

## 4. 系统架构

```
┌──────────────── PLM 前端（浏览器） ────────────────┐
│ PSEITEM-CREATE.page（不动）                        │
│   └─ OnCreate/OnSaveCheck → 调用固化的二开钩子      │
│ ItemSmartInput.js（新增）                           │
│   ├─ 输入防抖 300ms → POST /suggest → 浮层候选      │
│   ├─ 点选 → SetText 回填 ENAME/GGXH/ZYCS            │
│   ├─ 失焦 → POST /check → 浮层提示重复              │
│   └─ 点确定 → 同步 POST /check → 二次确认/阻断      │
└──────────────────────┬─────────────────────────────┘
                       │ form-urlencoded（简单请求，无 CORS 预检）
                       ▼
┌──────────── 开发机 Node 服务 :3100 ────────────────┐
│ plm-server.js  路由/校验/异常兜底（永远 200 + ok）  │
│ plm-index.js   内存索引 23036 条 / 200 小类         │
│   ├─ classify.js     小类定位、查重属性、特征参数    │
│   ├─ spec.js         归一化、签名、Jaccard          │
│   ├─ struct-spec.js  型号规格结构化                 │
│   ├─ name-synonyms.js 名称同义词（空气开关→微型断路器）│
│   └─ material-rules.js 书写规则校验                 │
└────────────────────────────────────────────────────┘
```

---

## 5. 详细设计

### 5.1 Node 索引层（`plm-index.js`）

**统一写入口（为后期直连物料表预留）**：

```js
applyRecord(subs, rec, source)   // source: 'erp' | 'plm'
```

当前仅 `loadIndex()` 从 `data/materials.ndjson` 调用它。后期接 `TCPLM.PSEITEM` 只需再写一个 loader，把行映射成 `FNUMBER/FNAME/FSPECIFICATION/F_ZXCV_ZYCS/UNITNAME` 后调 `applyRecord`，**查重/联想/签名逻辑一行不改**。

**索引结构**：

```
state.subs: Map<subKey(6位), {
  info,                          // 分类信息（大类/中类/小类名称）
  attrs,                         // 查重属性（如 FSPECIFICATION + F_ZXCV_ZYCS）
  tokens,                        // 该小类特征参数名
  bySig:   Map<signature, item[]> // 精确签名桶
  byLoose: Map<looseSig, item[]>  // 分隔符无关桶
  items:   item[]                 // 全量（供模糊比对）
}>
```

**查重三级判定（与 `dedup.js` 口径一致，避免两处结论打架）**：

| 级别 | 判定 | 是否参与阻断 |
|---|---|---|
| `exact` | 归一化签名完全相同 | ✅ 二次确认 |
| `sep` | 分隔符无关签名相同（`IC65N C10A/2P` ≡ `IC65N C10A 2P`） | ✅ 二次确认 |
| `fuzzy` | token Jaccard ≥ 0.8 且型号段相同 | ❌ 仅提示 |

**性能实测**：23036 条索引，单次查重 2~4ms。

### 5.2 Node 服务层（`plm-server.js`）

**四条铁律**：

1. **永远返回 200 + `ok` 字段**，异常也走 `ok:false`，避免 jQuery 进 `error` 分支导致前端异常；
2. **全量 CORS + 处理 OPTIONS**（204 不带 body）；
3. **同时支持 `application/json` 与 `x-www-form-urlencoded`**（后者不触发预检，兼容老浏览器）；
4. **显式报错**：端口占用 `EADDRINUSE` 时提示换端口并退出，不静默崩溃。

**未查重必须显式说明**（`skipReason`）：未取到编码 / 编码前缀未命中分类表时，不能返回"看起来没事"的 `pass:true`。

### 5.3 PLM 侧脚本（`ItemSmartInput.js`）

**钩子 1：`OnCreate(pageEvent, data)`**

```
重置状态（每次打开新增页都是新实例）
  → GetControl 取 4 个控件
  → 校验控件存在（PLM 用 id=='' 表示不存在）
  → 为 ENAME/GGXH 绑定 input(防抖)/blur/keydown(Esc)
  → 异步探活（仅日志，不阻塞）
```

**钩子 2：`OnOK(pageEvent)`**

```
兜底从 pageEvent 重新取控件（防 OnCreate 未执行）
  → 名称或规格为空 → 放行（交给 PLM 原生必填）
  → 取不到编码 → 放行（PLM 原生编码校验兜底）
  → 同步 POST /check
      ├─ 服务异常/超时 → 放行
      ├─ 有 errors（书写规则）→ 二次确认
      ├─ 有 exact/sep 重复 → 二次确认（取消则 return false 阻断）
      └─ 其余 → 放行
```

**降级矩阵**：

| 故障 | 表现 |
|---|---|
| Node 服务不可达 | 无浮层、不弹框，保存完全正常 |
| 取不到输入框 DOM | 联想关闭，保存前查重仍生效 |
| `ConfirmBox` API 不存在 | 回退浏览器 `confirm()` |
| 取值结论不确定 | 一律放行（只认明确的"取消"） |

**联想浮层的 DOM 获取采用多级回退**（不同版本 API 不一）：
`GetDom()` → `GetElement()` → `ctrl.element` → `getElementById` → `$('#id')` → `$('[id$=id]')` → 向内找 `input/textarea`。

### 5.4 配置项

**PLM 侧 `CFG`**：

| 配置 | 默认 | 说明 |
|---|---|---|
| `apiBase` | `http://127.0.0.1:3100` | **必须改成开发机局域网 IP**（js 在浏览器执行） |
| `enabled` | `true` | 总开关，一键止血 |
| `timeout` | `1500` | 单次请求超时，超时即放行 |
| `suggestDebounce` | `300` | 输入防抖 |
| `minLen` | `2` | 触发联想最少字符 |
| `autoFillZycs` | `true` | 选规格时连带回填主要参数 |
| `blockOnDuplicate` | `true` | 命中强重复是否二次确认 |
| `notifyDuplicateOnBlur` | `true` | 失焦是否浮层提示重复 |

**服务端**：`PLM_API_PORT`（3100）、`PLM_API_HOST`（0.0.0.0）；治理看板另用 `PORT`（3000）。三者统一在项目根 `.env` 配置（模板 `.env.example`，加载点 `src/env.js`），优先级为 进程环境变量 > `.env` > 代码默认值；业务规则在 `src/config/{dedup-rules,spec-fields,material-rules,name-synonyms}.json`。

---

## 6. 接口契约

### 6.1 `GET /api/plm/health`

```json
{ "ok": true, "version": "1.0.0", "ready": true, "at": 1793030666676,
  "count": 23036, "subs": 200, "skippedNoCategory": 9,
  "fuzzyThreshold": 0.8, "source": "...\\data\\materials.ndjson" }
```

### 6.2 `POST /api/plm/suggest`

请求（form 或 json）：

| 字段 | 必填 | 说明 |
|---|---|---|
| `field` | 是 | `name` \| `spec` |
| `value` | 是 | 当前输入 |
| `sub` | 否 | 6 位小类（优先） |
| `ecode` | 否 | 编码（`sub` 缺失时取前 6 位） |

响应要点：`category`（分类）、`suggestions[]`（`{value, from:'synonym'|'stock', count?, note?}`）、`normalized`（规格规范化写法）、`tokens`（该小类特征参数名）、`params`（结构化结果）。

### 6.3 `POST /api/plm/check`

请求：`name`、`spec`、`zycs`、`sub`/`ecode`

响应：

| 字段 | 说明 |
|---|---|
| `pass` | 综合是否通过（无硬错误且无 exact/sep 重复） |
| `errors[] / warnings[]` | 书写规则问题 / 建议 |
| `duplicates[]` | 查重结果，元素字段见下 |
| `dupLevel` | `none` \| `exact` \| `sep` \| `fuzzy` |
| `blocking` | `{type:'error'|'duplicate', reason}` 或 `null` |
| `suggestion` | `{name, spec, zycs}` 可回填值 |
| `skipReason` | **未查重的原因**（无编码/前缀未命中），有此字段表示本次没查 |
| `elapsedMs` | 耗时（实测 2~4ms） |

`duplicates[]` 元素字段（已收敛，不外泄内部 Set/签名）：
`fNumber, fName, fSpec, fZycs, fJscs, unit, org, materialId, plm, source, params, level, score`

### 6.4 `POST /api/plm/reload`

重载索引，返回同 health。**每次 `npm run extract` 后调用**。

---

## 7. 真实踩坑沉淀

> 全部来自本次开发的实测与复查，是这份文档最有价值的部分。

| # | 级别 | 坑 | 根因 | 修复 |
|---|---|---|---|---|
| 1 | **致命** | 联想/探活全部无效，页面毫无报错 | `callApi(path,data,sync)` 里 `async: sync !== true`，传 `false` 实际是**异步**，函数立即 `return null` | 拆成 `apiSync()` / `apiAsync(cb)`，4 处异步带回调、1 处同步取返回值 |
| 2 | **致命** | 新增页第二次打开后功能失效 | `state.bound` 只允许绑定一次，且 `state` 仍指向已销毁的旧控件 | 每次 `OnCreate` 重置状态 + `.off('.smartinput')` 解绑 |
| 3 | 严重 | 查重可能形同虚设 | `OnOK` 只读 `state.*`，`OnCreate` 未执行时静默放行 | `ctlFrom(pageEvent,...)` 从页面兜底取控件 |
| 4 | 严重 | 可能取不到编码 → 跳过查重 | `ECODE` 是 `EditButton`，值在 `SetTag({value})` 里，只读 `GetText()` 不一定拿得到 | 优先 `GetTag().value`，再回退 `GetText()` / 页面数据对象 |
| 5 | 严重 | 现场建不了料 | 书写规则 `errors` 直接 `return false` 硬阻断（如名称超 24 字） | 改为二次确认，用户可选择继续 |
| 6 | 严重 | 误阻断 | `ConfirmBox` 返回值判断过严，API 不存在/签名不同会被当"取消" | 只认明确 `false/0/'Cancel'`，其余一律放行 |
| 7 | 一般 | 预检响应不规范 | `OPTIONS` 用 `send(res,204,{})`，204 带 body 与 Content-Length 矛盾 | 单独 `writeHead(204)` + `end()` |
| 8 | 一般 | 端口占用时静默崩溃 | 无 `server.on('error')` | 显式提示 `PLM_API_PORT` 并 `exit(1)` |
| 9 | 一般 | `pass:true` 会被误读成"查过且无重复" | 未查重时没有原因字段 | 新增 `skipReason` |
| 10 | 一般 | 内存泄漏 | `$(document).on(...)` 随页面切换累积 | 先 `off` 再 `on` |
| 11 | 一般 | 浮层不再显示 | 页面切换后 `state.panel` 指向已脱离 DOM 的节点 | `document.body.contains()` 校验并重建 |
| 12 | 逻辑 | 相似但不同规格被列为候选（`1*16` vs `1*25`，0.857） | Jaccard 对短规格过于宽松 | 已确认 fuzzy **不参与阻断**，仅作提示 |
| 13 | 一致性 | 文档写"探活失败则不启用"，实现是"绑定但请求失败静默" | 实现改为异步探活后未同步文档 | 文档 v1.1 已更正 |
| 14 | 数据 | 查重结果把内部字段回传给前端（`tokens` 是 `Set`，序列化成 `{}`） | `out.push({...it})` 未挑字段 | 收敛为 13 个对外字段 |
| — | 工具 | 首次跑逻辑验证 12 项失败 | **验证器自己的 mock 有 bug**：`$.ajax` 拿到响应却没回传给 `success` | 修 mock 后 25/25。教训：测试失败先怀疑测试 |

---

## 8. 验证体系

### 8.1 网络层（端到端）

```
[1] health   ready=True count=23036 subs=200
[2] OPTIONS  status=204 rawlen=0
[3] suggest  「空气开关」→ 2 条，首条=微型断路器
[4] check    「电缆/YCW 450V/750V 3*25+1*16」→ pass=False dup=2 level=exact
[5] check    不带编码 → pass=True 且 skipReason=True
[6] reload   重载索引正常
```

真实数据反查：`11030200174` exact 命中自身；`11030200299` fuzzy 0.857（规格 1*16 vs 1*25，确认属误报但已不参与阻断）。

### 8.2 前端控制流（`npm run verify:plm`）

`scripts/verify-plm-plugin.mjs` 用 `vm` 构造 mock 环境（window/document/jQuery/HoteamUI/控件），**真实执行 `ItemSmartInput.js`**：

```
结果: 25 通过 / 0 失败
```

覆盖 12 个场景：绑定 / 服务不可用降级 / 名称联想回填 / 规格联想+ZYCS 连带 / 重复取消阻断 / 重复确认放行且只问一次 / 未取编码跳过 / 服务异常放行 / 字段为空不干预 / 二次打开页重新绑定 / 规则错误不硬阻断 / 确认记录随页面重置。

> 局限：验证的是**控制流**，不替代真实浏览器验证（真实 DOM 结构、真实跨域仍需现场确认）。

### 8.3 阻断机制

已从 `CreateItem.js` 源码确认 `checkval == false → return`，机制成立（未在现场实测）。

---

## 9. 待完成内容

### 9.1 P0 — 上线前必做（阻塞交付）

> 本节 6 项**不含鉴权**。现场跑通阶段按内网临时方案运行（见 9.5 的 A-0），鉴权作为上线后完善项。

| # | 事项 | 做法 | 验收标准 | 责任方 |
|---|---|---|---|---|
| P0-1 | **改 `apiBase` 为开发机局域网 IP** | 改 `ItemSmartInput.js` 顶部 `CFG.apiBase` | 另一台电脑浏览器能打开 `http://<IP>:3100/api/plm/health` | 开发 |
| P0-2 | 放通防火墙 3100 | `New-NetFirewallRule ... -LocalPort 3100` | 同上 | 开发/运维 |
| P0-3 | 重跑 `npm run extract` 刷新索引基数 | `npm run extract` → 启动服务（或 `POST /reload`） | `/health` 的 `count` 与最新物料量一致 | 开发 |
| P0-4 | **现场确认 fileref 加载** | 新建物料页 F12 看控制台 | 出现 `[ItemSmartInput] 脚本已加载 v1.1` | 现场 |
| P0-5 | **现场确认 DOM 可取** | 看是否出现 `[ItemSmartInput] 已绑定：名称 规格 联想` | 输入名称能看到浮层候选 | 现场 |
| P0-6 | **现场确认阻断有效** | 输入库内已有重复的 名称+规格 后点"确定" | 弹出"疑似一物多号"，取消则停在当前页 | 现场 |

### 9.2 P1 — 上线后尽快（数据闭环）

| # | 事项 | 说明 | 验收标准 |
|---|---|---|---|
| P1-1 | **直连 PLM 物料表并入索引** | 接入点已预留：`applyRecord(subs, rec, 'plm')`。新增 `loadFromPlm()` 查 `TCPLM.PSEITEM`（`ECODE/ENAME/GGXH/ZYCS/UNIT`），与 ERP 索引合并；`source` 字段区分来源 | 同日新建的物料能被后续录入查到；PLM 未下发物料可查重 |
| P1-2 | 服务常驻 | pm2 或计划任务（计划任务需管理员权限），登录自启 | 重启机器后 `/health` 自动可用 |
| P1-3 | 定时刷新索引（若不做 P1-1） | 每日 02:00 `extract` + `POST /reload` | 缺口窗口 ≤ 24 小时 |

### 9.3 P2 — 优化项（按需）

| # | 事项 | 说明 |
|---|---|---|
| P2-1 | CORS 收紧为 `Origin` 白名单 | 当前 `*`，内网可接受；公网/严格环境需改 `plm-server.js` 的 `send()` |
| P2-2 | fuzzy 误报优化 | 在候选返回时比对关键参数差异（如截面不同则降权/排除），减少"相似但不同"的干扰 |
| P2-3 | 审批节点是否也要挂 | 若新增物料走审批流，可在 `flowplugin` 的 `AuditNode` 再加一道校验（当前只覆盖录入页） |
| P2-4 | 移动端 / H5 | 当前不支持（不增强也不影响），若需要另做 |
| P2-5 | 并发压测 | 多人同时录入时的响应时间与索引内存占用（当前 23036 条，单次 2~4ms，预计无压力） |

### 9.4 待验证项概况（详细可执行步骤见第 10 节）

| # | 未知 | 影响 | 兜底 |
|---|---|---|---|
| U-1 | `ctrl.GetDom()/GetElement()` 在 8.3.8 是否可用 | 取不到 DOM 则无联想浮层 | 多级回退 + 保存前查重仍生效 |
| U-2 | `HoteamUI.UIManager.ConfirmBox` 是否存在及签名 | 无则无法二次确认 | 回退浏览器 `confirm()` |
| U-3 | `fileref` 的 `group` 是否应为 `InforCenter` | 加载不到则功能不生效 | 已同时注册 `InforCenter` + `TSDC`；仍不行则查主 `PLMFileRef.fileref` |
| U-4 | 浏览器跨域连通性 | 不通则无联想 | 服务不可达时整体静默降级 |
| U-5 | `OnSaveCheck` 返回 `false` 的真实阻断效果 | 不阻断则只提示不拦 | 源码已确认 `checkval == false`；若实测无效改用 `{confirm:'Cancel'}` |

### 9.5 安全与鉴权（暂缓，不阻塞现场验证）

> **现状声明（务必知晓）**：当前 `plm-server.js` **无任何鉴权**，`Access-Control-Allow-Origin: *`，监听 `0.0.0.0:3100`。
> 内网 + 短期验证阶段可接受，但**在补齐鉴权前不得长期运行、不得暴露到办公网以外**。
> 理由：接口可被枚举——`/suggest` 猜词拿到名称/规格 → `/check` 换出编码，23036 条物料可被逐步取出。

**分档方案**（现场跑通阶段只做 A-0，A-1 作为终态）：

| # | 事项 | 做法 | 验收标准 |
|---|---|---|---|
| A-0-1 | `Origin` 固定白名单 | `send()` 与 OPTIONS 分支里的 `*` 改成固定 PLM 源；不匹配则不回 CORS 头 | 其他源发起的 XHR 被浏览器拦截 |
| A-0-2 | 监听收敛 | Node 与 PLM 同机时设 `PLM_API_HOST=127.0.0.1`；不同机则防火墙只放 PLM 主机 IP | 其他机器 `curl` 连不通 |
| A-0-3 | 请求体共享密钥 | 前端 `data._tk=<value>`，服务端比对 `PLM_API_TOKEN`，不符返回 `ok:false`。**不要放 header**——自定义头会触发 OPTIONS 预检，正好撞 `web.config:70` 的 `<deny users="*" verbs="OPTIONS" />` | 无 `_tk` 被拒，功能侧静默降级 |
| A-0-4 | `Referer` 校验 | 要求 `Referer` 以 PLM 站点开头 | 直接 `curl`（无 Referer）被拒 |
| A-0-5 | 限流 | 会话/IP 级 QPS（建议 20/s）+ 每日总量上限 | 脚本遍历被限流 |
| A-0-6 | 返回最小化 | `/suggest` top ≤ 10；`/check` 只回重复项的编码/名称/规格 | 单次响应 < 4KB |
| A-1 | **IIS ARR 反代 + Windows 认证（推荐终态）** | `/plmapi/` → `http://127.0.0.1:3100`；ARR 的 `allowedServerVariables` 放行 `{LOGON_USER}` 并注入为 `HTTP_X_REMOTE_USER`；Node 只信该头 | 同源访问（跨域问题消失）；审计能记域账号 |
| A-2 | 平台签短时票（无 ARR 时备选） | C# 服务方法签 HMAC(用户名 + 5 分钟过期)，前端 body 带 `_tk`，Node 验签 | 票据过期即失效、不可重放 |
| A-3 | 审计日志 | 时间 / 账号（A-1 后可用）/ 接口 / 关键词 / 命中数 | 可按键账号追溯查询行为 |

**为什么不能"拿 PLM 的 cookie 到 Node 验"**：站点是 `<authentication mode="Windows" />` 且 `sessionState mode="Off"`（`PLMSOFT/Server/web.config:47,67`）。Node 既解不了 Forms ticket，也无法验签，只能退化成"有 cookie 就放行"，而 cookie 可伪造 → **等于没有鉴权**。身份必须由 IIS 注入（A-1）或平台签票（A-2）提供。

**推荐路径**：现场按 A-0 保底运行 → 验证通过后上 A-1（Node 业务代码零改动，只在入口加一个 `LOGON_USER` 校验），A-0-3/A-0-4 随之下线。

**待确认前提**：① Node 与 PLM 是否同一台机器（决定能否用 `127.0.0.1`）；② IIS 是否装了 ARR / URL Rewrite；③ 是否需要按角色区分权限（否则"能登录 PLM 即可用联想/查重"）。

**顺带结论**：数据本身不必过度分级——联想/查重返回的都是 PLM 内本就全员可见的物料名称与规格，真实风险在"未授权者批量取数"，不在"用户间权限差异"。

---

## 10. 现场验证清单（2026-10-28 执行，结果待填）

> **使用方式**：按 V1→V20 顺序执行，边做边在「实际」列填写。
> **判定规则已分级**：`【必须通过】` 失败即阻塞上线；`【允许降级】` 失败只记录降级范围，不阻塞。
> 这样可避免把"设计内的降级"误判为缺陷。

### 10.0 验证环境（执行前填写）

| 项 | 值 |
|---|---|
| 验证日期 | 2026-10-28 |
| 验证人 | |
| PLM 访问地址 | |
| PLM 站点物理路径 | |
| 开发机 IP | |
| Node 服务地址 | `http://<开发机IP>:3100` |
| PLM 版本 | InforCenter Enterprise Platform 2020.3（8.3.8） |
| 浏览器 / 版本 | |
| 是否已改 `CFG.apiBase` | ☐ 是 ☐ 否 |

### 10.1 服务端自检（在开发机，V1–V5）【必须通过】

| # | 步骤 | 预期 | 实际 | 判定 |
|---|---|---|---|---|
| V1 | `npm run extract`（首次/较旧时） | 生成/更新 `data/materials.ndjson` | | ☐通过 ☐失败 |
| V2 | `npm run plm` | 日志 `[index] 就绪 {"count":23036,...}` | | ☐通过 ☐失败 |
| V3 | `npm run verify:plm` | `结果: 25 通过 / 0 失败` | | ☐通过 ☐失败 |
| V4 | 本机访问 `http://127.0.0.1:3100/api/plm/health` | `ready:true`、`count>0` | | ☐通过 ☐失败 |
| V5 | **另一台电脑**访问 `http://<开发机IP>:3100/api/plm/health` | 同上（验证防火墙与路由） | | ☐通过 ☐失败 |

> V5 失败最常见：防火墙未放通 / 开发机 IP 填错 / 服务监听在 `127.0.0.1`（应是 `0.0.0.0`）。

### 10.2 加载链路（PLM 端，V6–V10）【必须通过】

| # | 步骤 | 预期 | 若失败的处理 | 实际 | 判定 |
|---|---|---|---|---|---|
| V6 | 文件置于 `SecondaryDev\ItemSmartInput\Config\`；重启 IIS 应用池 + 8890；浏览器 Ctrl+F5 | — | — | | ☐通过 ☐失败 |
| V7 | 打开「新增物料」页，F12 → Console | `[ItemSmartInput] 脚本已加载 v1.1（api=...）` | 无此行 → 查 fileref 路径/权限/缓存；再查 `InforCenter/Config/PLMFileRef.fileref` 是否需登记 | | ☐通过 ☐失败 |
| V8 | 同页，等待 1–2 秒 | `[ItemSmartInput] 已绑定：名称 规格 联想；保存前查重已启用` | 控件 ID 不符 → 核对 `PSEITEM-CREATE.page` 的 `ENAME_Value/GGXH_Value` | | ☐通过 ☐失败 |
| V9 | 同页 | `[ItemSmartInput] 治理服务就绪：索引 N 条 / M 个小类` | 无此行 → 跨域或网络不通（回看 V5） | | ☐通过 ☐失败 |
| V10 | 同页，F12 → Console 过滤 `error` | 无与本脚本相关的红色报错（其他系统报错可忽略） | 有报错 → 贴入 10.7 失败记录区，按堆栈定位 | | ☐通过 ☐失败 |

### 10.3 功能验证（V11–V14）【必须通过】

| # | 步骤 | 预期 | 实际 | 判定 |
|---|---|---|---|---|
| V11 | 「名称」输入 `空气开关`（停顿约 0.5 秒） | 浮层出现 `[建议] 微型断路器`、`[库内] 空气开关 (N 次)` | | ☐通过 ☐失败 |
| V12 | 点击 `微型断路器` | 名称输入框变为「微型断路器」 | | ☐通过 ☐失败 |
| V13 | 「规格型号」输入 `NXB-63` | 浮层出现库内既有写法（如 `NXB-63 C16 3P`）与「规范化写法」候选 | | ☐通过 ☐失败 |
| V14 | 点击任一规格候选 | 规格回填；若「主要参数(ZYCS)」为空，自动填入 `型号:...；额定电流:...；极数:...` | | ☐通过 ☐失败 |

### 10.4 查重与阻断（V15–V16）【必须通过】

| # | 步骤 | 预期 | 实际 | 判定 |
|---|---|---|---|---|
| V15 | 名称=`电缆`、规格=`YCW 450V/750V 3*25+1*16`（库内已有）→ 点「确定/下一步」 | 弹出「疑似一物多号」，列出 `11030200174 …` 等重复编码 | | ☐通过 ☐失败 |
| V16 | 在弹窗点「取消」 | **停留在当前页、未保存**；再点「确定」则继续流程 | | ☐通过 ☐失败 |

### 10.5 未知项确认（U-1—U-5）【允许降级，记录结论即可】

| # | 未知项 | 判定方法 | 通过 / 降级 | 实际 | 结论 |
|---|---|---|---|---|---|
| U-1 | `GetDom()/GetElement()` 是否可用 | 若 V11 出现浮层即为可用 | 可用=**完全版**（联想+查重）；不可用=**降级版**（仅保存前查重） | | ☐完全 ☐降级 |
| U-2 | `HoteamUI.UIManager.ConfirmBox` 是否存在 | 看 V15 弹窗样式 | 平台风格弹窗=存在；浏览器原生 `confirm`=不存在（已自动回退） | | ☐存在 ☐回退 |
| U-3 | `fileref` 的 `group` 是否正确 | 看 V7 是否有脚本日志 | 有=正确（`InforCenter` 生效） | | ☐正确 ☐需调整 |
| U-4 | 浏览器跨域是否连通 | 看 V9 | 有「就绪」=通 | | ☐通 ☐不通 |
| U-5 | `OnSaveCheck` 返回 `false` 是否真阻断 | 看 V16 | 停在当前页=阻断成立 | | ☐成立 ☐不成立 |

> U-5 若"不成立"：改为返回 `{ confirm: 'Cancel' }`（与本平台 `ActionCheck.js` 的约定一致），或改用 `HoteamUI.UIManager.Return` 关闭向导。

### 10.6 降级与容错（V17–V20）【建议执行，5 分钟】

| # | 步骤 | 预期 | 实际 | 判定 |
|---|---|---|---|---|
| V17 | 停掉 Node 服务后再打开新增页并保存 | 页面正常、可保存；控制台提示「治理服务不可达（联想/查重将自动跳过…）」 | | ☐通过 ☐失败 |
| V18 | 关闭新增页再打开 2–3 次 | 每次都出现「已绑定」，且联想可用（验证跨实例状态重置） | | ☐通过 ☐失败 |
| V19 | 不选物料编码，直接填名称/规格 | 不报错；控制台「未取到编码，跳过查重（PLM 原生编码校验兜底）」 | | ☐通过 ☐失败 |
| V20 | 名称填超长（>24 字）后点确定 | 弹「建议修正」但可继续（不硬阻断） | | ☐通过 ☐失败 |

### 10.7 验证结论

| 结论 | 勾选 |
|---|---|
| 全部【必须通过】项通过 → 可上线 | ☐ |
| 存在【必须通过】项失败 → 记录后修复再验 | ☐ |
| 仅【允许降级】项降级 → 可上线，记录降级范围 | ☐ |

**失败记录区**（现象 / 控制台报错 / Network 请求与响应 / 截图路径）：

```
（留空待填）
```

**降级范围记录**（若 U-1/U-2 降级，写明影响）：

```
（留空待填）
```

---

## 11. 上线 Checklist

- [ ] `npm run extract` 已跑，`data/materials.ndjson` 较新
- [ ] `npm run plm` 启动，日志出现 `[index] 就绪`
- [ ] `npm run verify:plm` → 25 通过 / 0 失败
- [ ] 防火墙放通 3100，另一台电脑能访问 `/api/plm/health`
- [ ] `CFG.apiBase` 已改为开发机 IP
- [ ] 两个 PLM 文件已放到 `SecondaryDev\ItemSmartInput\Config\`（UTF-8 无 BOM）
- [ ] `icacls` 已赋 IIS 读取权限
- [ ] IIS 应用池 + 8890 服务已重启，浏览器 Ctrl+F5
- [ ] 控制台出现两行 `[ItemSmartInput]` 日志
- [ ] 按 `PLM物料录入助手_部署说明.md` 第六节 10 条验收逐项通过
- [ ] 回滚方式已知晓（`CFG.enabled=false` / 删 fileref 行 / 删目录）

---

## 12. 附录：关键源码位置索引

| 用途 | 位置 |
|---|---|
| 二开钩子模板 | `Server/Platform/Config/Generator/PAGE-CREATE.generator:7,9` |
| 物料新增页（不动） | `Server/AutoGenerator/Config/Pages/PSEITEM-CREATE.page` |
| 向导保存/阻断逻辑 | `Server/InforCenter/PSE/Item/Js/CreateItem.js`（`checkval == false`） |
| 物料实体定义 | `Server/TSDC/PSE/Item/Config/Model/PSEITEM.model`、`PSEITEMBASEFORM.schema` |
| 字段校验属性 | `.model` 的 `Required/WebRequired/ValidateUnique/Validation` |
| 配置式 SQL 校验 | `Server/Platform/Js/Common/Object.js:134-204`（`CustomCmdsqlCheck`） |
| SDK 接口 | `Server/Interface/*.Interface.dll`（94 个） |
| 开放 API | `Server/InforCenter/PlmApiService.asmx` + `Hoteam.InforCenter.Base.WebService.PlmApiService` |
| SDK 速查表 | `doc/plm-sdk/01~05` |
| 部署/回滚/排查 | `doc/PLM物料录入助手_部署说明.md` |

---

## 13. 一句话总结

> 把 PLM 当成一个**只能通过"官方固化钩子"对话、且绝不能被拖慢或阻断**的外部系统：钩子负责接入，Node 负责全部业务逻辑，任何异常一律放行 —— 只有守住这条底线，源头治理才敢挂在生产录入链路上。

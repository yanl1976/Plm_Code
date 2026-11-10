# PLM 物料新增「名称/规格型号」智能录入助手 — 部署说明

> 版本 **v1.31** ｜ 适用：InforCenter Enterprise Platform 2020.3（8.3.8）＋ 物料治理服务（本仓库 Node）
> 插件文件：`ItemSmartInput.js` v1.31 — 96,775 字节 / 2,180 行 / UTF-8 无 BOM
> SHA256：`A8D2CEE692FAB87EC827404EC390F5DEE913CB2B9A5BEA218C40EDEBDF8946A7`
> 配置文件：`ItemSmartInput.config.js` — 2,812 字节 / 48 行 / UTF-8 无 BOM
> SHA256：`B244444FF9426844EFB414A47B3BFE839A1C0AF25F44A20B7A21BE052D1277A2`
>
> **版本演进（近期）**
> - **v1.31（当前）**：两个弹窗（主弹窗 + 类似型号明细）**继承 PLM 原有配色**——背景/文字取实际弹窗容器，主色取页面按钮，深色主题自动切换语义色
> - v1.30：删除「类似型号」的内联候选列表（无实际价值），只保留独立的**类似型号明细弹窗**
> - v1.29：「类似型号」改为独立的**类似型号明细弹窗**（合计数量/可用 + 录入规格与差异高亮 + 五列表格，按接近程度排序，点行填入）
> - v1.28：弹窗补齐名称联想、标准叫法 / 建议改为（可点击）、规格规范写法与建议参数；**点遮罩不再关闭弹窗**，只能右上角 × 或「取消」
> - v1.27：回填成功后**不再显示绿色提示条**（界面保持干净），只有内容为空时才提示
> - v1.26：弹窗内提示分字段（名称问题在名称框下、规格问题在规格框下）、新增**现有库存**区块（读看板 3130）、**存在 error 时禁止回填**（只能修改或取消）
> - v1.25：回填后在 PLM 输入框**不再弹联想/重复提示、保存时不再二次确认**（内容改动后自动恢复）
> - v1.24：配置文件支持**全部功能开关**（白名单合并，控制台打印「外部配置=…」）
> - v1.23：点击按钮改为弹出**校验对话框**（名称/规格可编辑、实时校验提示、类似型号、查重明细、保存并回填）；**类型未选或不满足时直接隐藏按钮**；提示文案改用「数据治理服务器」
> - v1.22：按钮改到「名称」标签左侧，窄按钮 + 可配置偏移
> - v1.21：按钮锚点默认改为名称框，`float` 定位跟随锚点
> - v1.20：改为 `float` 跟随输入框定位，解决 iframe 内 `position:fixed` 跑到视口外
> - v1.19：默认悬浮，`z-index` 提到 `2147483000`，避免被 PLM 弹窗遮罩盖住
> - v1.18：注入时跳过输入框控件外壳，新增 `checkButtonPlace` 开关
> - v1.16 / v1.17：改为按标签文字定位字段（平台真实 DOM id 是 `idgul271_TextBox` 这类自动 id）
> - v1.15：增加「可见输入框清单」诊断日志
> - v1.7：DOM 兜底接管（`PSE_ItemGuide` 向导入口不触发 `CreatePage_OnCreate`）
> - v1.6：新增按钮 + 类型门控，兼容 `PSEITEM` / `PSEITEM$`
>
> 目标：在 PLM **原生新增物料页面**上，为「名称」「规格型号」增加联想、查重、校验与回填。
> **前置项（分类、物料编码申请、单位、位置、描述、主要参数等）全部保持 PLM 原有行为，不做任何改动。**
> **编码一律由 PLM 编码器生成并管理，插件不参与发号、不改编号。**

---

## 一、方案总览

```
┌─────────────────────────── PLM 服务端（IIS） ───────────────────────────┐
│  AutoGenerator/Config/Pages/PSEITEM-CREATE.page   ← 完全不动            │
│      ↑ 该页面由 PAGE-CREATE.generator 生成，模板里固化了两个钩子调用：   │
│         InforCenter_PSEITEM_CreatePage_OnCreate(pageEvent, data)        │
│         InforCenter_PSEITEM_CreatePage_OnOK(pageEvent)                  │
│                                                                         │
│  InforCenter/Config/ItemSmartInput/ItemSmartInput.js  ← 新增（插件本体）│
│  InforCenter/Config/ItemSmartInput.config.js          ← 新增（地址配置）│
│  InforCenter/Config/PLMFileRef.fileref                ← 追加 2 行注册    │
│      config 必须排在 js 之前，否则读不到 window.ItemSmartInputConfig     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ 浏览器 jQuery $.ajax
                                  │ POST（form-urlencoded，无预检）
                                  ▼
┌──────────────────────── 开发机 Node 治理服务（端口 3100） ───────────────┐
│  src/plm-server.js   /api/plm/health | /suggest | /check | /reload       │
│  src/plm-index.js    内存索引（materials.ndjson → 小类/签名）            │
│  复用既有：classify.js · spec.js · struct-spec.js · name-synonyms.js     │
│            material-rules.js（规则仍由 src/config/*.json 驱动）          │
└─────────────────────────────────────────────────────────────────────────┘
```

**改动了什么**：新增插件 js + 地址配置，并在 `PLMFileRef.fileref` 追加两行注册；不改任何既有页面/模型。
**没改动什么**：`PSEITEM-CREATE.page`、`PSEITEM.model`、菜单、编码规则、工作流、既有 `CreateItem.js` 全部保持原样。

**交互（v1.23）**：「名称」标签左侧出现「校验并回填」按钮（类型不满足时**隐藏**）。点击弹出校验对话框：

- 名称 / 规格型号可编辑，输入 400ms 后自动校验
- 显示错误（红）、提示（黄）、同小类重复明细
- 「类似型号」列出同小类已有写法，点击即填入
- 「保存并回填」先做一次同步校验，按规范写法（同义词标准名 + 空格整理）写回 PLM 的名称与规格型号框

**类型门控**：仅「电气元件 / 原材料 / 外购标准件」显示按钮；未选择类型或其它类型（非标自制件、通用自制件、请购单、成品、服务…）**按钮不出现，也没有任何提示文案**。

> **部署位置说明**：本安装的 `Config/Apps.app` 里 `SecondaryDev` 模块整块被注释，平台不会扫描该目录下的 `.fileref`。因此插件必须挂在**已启用**的 `InforCenter` 模块下（见 4.1），不能放在 `SecondaryDev`。

---

## 二、部署清单

> `<PLM站点>` 指 IIS 中指向 `PLMSOFT\Server` 的物理目录，例如 `E:\tedri_project\dev\Plm_Code\PLMSOFT\Server`。
> 生产环境请按实际路径替换，**不要**误放到 `PLMSOFT\DistributedFileServer`。

### 2.1 PLM 侧（3 个文件）

| # | 文件 | 放置位置 | 类型 |
|---|---|---|---|
| 1 | `ItemSmartInput.js` | `<PLM站点>\InforCenter\Config\ItemSmartInput\` | 新增 |
| 2 | `ItemSmartInput.config.js` | 同上 | 新增 |
| 3 | `InforCenter\Config\PLMFileRef.fileref` | 在 `</root>` 前追加 2 行 | 修改 |

追加内容：

```xml
	<!--物料录入助手（本项目二开）-->
	<JSFile FileName ="~/InforCenter/Config/ItemSmartInput/ItemSmartInput.config.js" group="InforCenter"/>
	<JSFile FileName ="~/InforCenter/Config/ItemSmartInput/ItemSmartInput.js" group="InforCenter"/>
```

> **为什么不用 `SecondaryDev`**：本安装的 `Config/Apps.app` 中 `SecondaryDev` 整个 `<Apps>` 块被注释，平台不会扫描它的 `*.fileref`。文件能通过 URL 访问（200），但不会被加载进页面。
> `config` 必须排在 `js` 之前，否则插件读不到 `window.ItemSmartInputConfig`。

### 2.2 后端（校验与回填必需）

| # | 文件 | 说明 |
|---|---|---|
| 1 | `src/material-rules.js` | 书写规则、`fixSpecFormat()` 空格整理、`detectSubMismatch()` 分类不符 |
| 2 | `src/plm-server.js` | `/api/plm/check` 返回 `specFormat`、`subMismatch` |
| 3 | `src/config/material-rules.json` | `name.subMismatch` 配置段 |
| 4 | `src/name-synonyms.js` + `src/config/name-synonyms.json` | 名称同义词（回填标准名依赖） |

> 只换插件不换后端：按钮与弹窗仍可用，但**规格不会自动整理、分类不符不会提示、同义词标准名可能不生效**。

### 2.3 不需要部署

`scripts/verify-plm-plugin.mjs`、`doc/*`、`README.md`；`src/server.js` 与 `public/*` 属于治理看板（端口 3130），与 PLM 插件无关。

---

## 三、Node 侧部署（开发机）

### 3.1 前置检查

```powershell
cd E:\tedri_project\dev\Plm_Code
node -v                      # 需 Node 18+
Test-Path .\data\materials.ndjson   # 必须为 True
```

`data\materials.ndjson` 是查重的数据基础。若不存在或已过期，先执行（会连 ERP 测试库全量提取）：

```powershell
cd E:\tedri_project\dev\Plm_Code
npm install
npm run extract
```

> 提取完成后**必须**让助手服务重建索引：重启服务，或调用 `POST /api/plm/reload`。

### 3.2 启动服务

```powershell
cd E:\tedri_project\dev\Plm_Code
npm run plm
# 等价于：node src/plm-server.js
```

启动日志示例：

```
2026-10-27T08:00:00.000Z PLM 物料录入助手 已启动: http://0.0.0.0:3100
2026-10-27T08:00:00.000Z   健康检查  GET  /api/plm/health
2026-10-27T08:00:03.100Z [index] 就绪 {"count":23036,"subs":200,"skipped":9}
```

可配置环境变量（**统一放在项目根 `.env`**，模板见 `.env.example`；启动日志会打印实际加载的文件与注入项数）：

| 变量 | 默认 | 说明 |
|---|---|---|
| `PLM_API_PORT` | `3100` | 监听端口。改这里要同步改 PLM 侧 `CFG.apiBase` |
| `PLM_API_HOST` | `0.0.0.0` | 监听地址。必须允许局域网访问，不能是 `127.0.0.1` |
| `PORT` | `3000` | 治理看板（`npm run server`）监听端口，与 PLM 接口互不影响 |
| `WEB_HOST` | 空 | 看板绑定地址。留空 = Node 默认（所有网卡）；需只绑 IPv4 时设 `0.0.0.0` |
| `PORT_AUTO_INCREMENT` | `false` | 看板端口被占用时是否自动 +1。默认关闭，避免端口静默漂移 |

> **配置加载已收敛到 `src/env.js`（全项目唯一 `.env` 加载点）**，优先级：
> 进程真实环境变量（PM2 / docker / systemd 注入） > `.env` 文件 > 代码默认值。
> 因此 PM2 下直接 `pm2 start src/plm-server.js` 即可读到 `.env`，**不再需要** `--node-args="--env-file=.env"`。
> 启动日志首行形如 `[plm-api] 已加载 /opt/Plm_Code/.env（注入 65 项）`，未加载成功会明确提示。

### 3.3 放通防火墙（关键，最常被漏）

```powershell
# 以管理员身份运行 PowerShell
New-NetFirewallRule -DisplayName "PLM Material Helper 3100" -Direction Inbound -Protocol TCP -LocalPort 3100 -Action Allow
```

### 3.4 自测

```powershell
# 查本机局域网 IP，PLM 侧 apiBase 要用这个地址
ipconfig | findstr /i "IPv4"

# 健康检查（应返回 "ready": true 与 count>0）
Invoke-RestMethod http://127.0.0.1:3100/api/plm/health | ConvertTo-Json -Depth 3

# 联想：空气开关 → 应返回「微型断路器」
Invoke-RestMethod http://127.0.0.1:3100/api/plm/suggest -Method Post -Body @{field='name';value='空气开关';sub='100105'}

# 查重：用库里已有物料反查自身 → duplicates 至少 1 条且 level=exact
Invoke-RestMethod http://127.0.0.1:3100/api/plm/check -Method Post -Body @{name='电缆';spec='YCW 450V/750V 3*25+1*16';sub='110302'}
```

> 注意：PowerShell 5.1 的 `Get-Content` 默认按 ANSI 读文件，直接读 `materials.ndjson` 里的中文会乱码，**不要**用读文件的方式拼测试参数，直接写中文字面量即可。

### 3.5 常驻运行（生产建议）

项目自带 `ecosystem.config.cjs`，用 PM2 一条命令托管**两个服务**。端口全部由 `.env` 决定，**不在 pm2 命令里写端口**。

```bash
cd <项目目录>          # 例：/opt/Plm_Code

npm install            # 首次
npm run extract        # 首次必须：生成 data/materials.ndjson，否则两个服务启动即报「加载失败」

pm2 start ecosystem.config.cjs
pm2 list               # 应为 plm-api / plm-web 两个 online
pm2 save               # 固化进程列表
pm2 startup            # 按它输出的 sudo 命令执行一次，实现开机自启

# 常用运维
pm2 logs plm-api --lines 50
pm2 logs plm-web --lines 50
pm2 restart plm-api plm-web
pm2 delete plm-api plm-web   # 只删本项目两个，不影响同机其它 PM2 应用
```

端口对照（值取自 `.env`，改端口只改 `.env` 再 restart）：

| 进程 | 入口 | 读取变量 | 当前值 |
|---|---|---|---|
| `plm-api` | `src/plm-server.js` | `PLM_API_PORT` | `3100` |
| `plm-web` | `src/server.js` | `PORT` | `3130` |

验证：

```bash
curl -s http://127.0.0.1:3100/api/plm/health    # ready:true, count>0
curl -sI http://127.0.0.1:3130/                 # HTTP 200
```

注意事项：

- **不要在 pm2 命令里再加端口环境变量**（如 `PORT=3000 pm2 start ...`），否则与 `.env` 形成两套配置，排查困难；临时改端口请改 `.env` 后 restart。
- 若之前手工 `npm run server` 起过实例，先停掉再 `pm2 start`，否则 `plm-web` 会因端口占用 FATAL 退出并反复重启（`pm2 logs plm-web` 可见）。
- 这两个服务不能配 `cluster` 多实例：各自持有内存索引与定时器，多实例会重复加载 `materials.ndjson`、重复跑快照检查。
- Windows 下等价操作：在项目目录执行 `pm2 start ecosystem.config.cjs`；开机自启可用 `pm2-installer` 或计划任务 `schtasks /create /tn "PLM-Material" /tr "pm2 resurrect" /sc onlogon`。

---

## 四、PLM 侧部署

### 4.1 建目录并放文件

在 PLM 站点根下新建目录并放入两个文件：

```
<PLM站点>\InforCenter\Config\ItemSmartInput\ItemSmartInput.js
<PLM站点>\InforCenter\Config\ItemSmartInput\ItemSmartInput.config.js
```

示例（按实际 PLM 站点目录替换）：

```powershell
$plm = 'E:\tedri_project\dev\Plm_Code\PLMSOFT\Server'
$src = 'E:\tedri_project\dev\Plm_Code\PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config'
$dst = "$plm\InforCenter\Config\ItemSmartInput"

New-Item -ItemType Directory -Force -Path $dst | Out-Null
Copy-Item "$src\Js\ItemSmartInput.js"   $dst -Force
Copy-Item "$src\ItemSmartInput.config.js" $dst -Force
```

**注册到 fileref**（关键，否则不会加载）：

打开 `<PLM站点>\InforCenter\Config\PLMFileRef.fileref`，在 `</root>` **之前**追加：

```xml
	<!--物料录入助手（本项目二开）-->
	<JSFile FileName ="~/InforCenter/Config/ItemSmartInput/ItemSmartInput.config.js" group="InforCenter"/>
	<JSFile FileName ="~/InforCenter/Config/ItemSmartInput/ItemSmartInput.js" group="InforCenter"/>
```

**覆盖前先备份**：

```powershell
Copy-Item "$dst\ItemSmartInput.js" "$dst\ItemSmartInput.js.bak_20261109" -Force
```

**拷贝后核对指纹**：

```powershell
Get-FileHash "$dst\ItemSmartInput.js" -Algorithm SHA256
(Get-Item "$dst\ItemSmartInput.js").Length
```

应为 `022EEEC9FEBA678EE7B95283CE3CE7839CB68FB30C673AF57B5BDE0C742F0EEE` / `77853`。

**改完 `PLMFileRef.fileref` 要校验 XML**（写坏会导致整个 InforCenter 脚本包失效）：

```powershell
[xml](Get-Content "$plm\InforCenter\Config\PLMFileRef.fileref") | Out-Null; "XML OK"
```

### 4.2 编码与权限

- 两个文件必须是 **UTF-8（无 BOM）**。若用记事本另存，请选 “UTF-8”。
- 赋予 IIS 应用程序池账号读取权限：

```powershell
icacls "$plm\InforCenter\Config\ItemSmartInput" /grant "IIS_IUSRS:(OI)(CI)R" /T
```

### 4.3 修改 API 地址（**只改配置文件，不动 JS**）

地址已外置到独立配置文件：

```
<PLM站点>\InforCenter\Config\ItemSmartInput\ItemSmartInput.config.js
```

配置文件同时是**功能开关表**，改动后 Ctrl+F5 生效。可用的键（白名单，写错键名不生效）：

```javascript
window.ItemSmartInputConfig = {
  // 服务地址
  apiBase: 'http://192.168.20.31:3100',  // 'auto' = 同机部署
  apiPort: 3100, apiLabel: '数据治理服务器', timeout: 1500,

  // 总开关
  enabled: true,              // false = 插件完全静默
  showCheckButton: true,      // false = 不注入按钮

  // 按钮
  checkButtonText: '校验并回填',
  checkButtonHost: 'name',    // 'name' | 'spec'
  checkButtonPlace: 'left',   // 'left' | 'float' | 'fixed' | 'after'
  checkButtonOffsetX: 6, checkButtonOffsetY: 0,

  // 类型门控
  restrictItemType: true,     // false = 所有类型都显示
  itemTypeAllowText: ['电气元件', '原材料', '外购标准件'],
  itemTypeAllowValues: [],    // 类型返回编码时补这里

  // 校验与回填
  tidySpecSpace: true,        // 规格空格整理
  fillSpecToParams: true,     // 同步 ZYCS / FLSXHB
  blockOnDuplicate: true,     // 重复二次确认
  notifyDuplicateOnBlur: true,
  strictWidth: true,          // 超宽拦截

  // 联想与探测
  suggestDebounce: 300, minLen: 2, domWatchDelay: 2500
};
```

> 控制台首行会打印 `外部配置=apiBase/checkButtonPlace/…`，列出真正被读取的键；未出现在该列表里的键说明没写或键名有误。

- **不要改 `ItemSmartInput.js`**，以后 IP / 端口变化只改这个文件
- 改完保存 → 浏览器 Ctrl+F5 即可，**不需要重启 IIS，也不需要重启 Node 服务**
- 文件缺失或写法有误时，插件会回退到 JS 里的内置默认值，控制台显示「地址来源=内置默认」
- 加载顺序由 `ItemSmartInput.fileref` 保证（config 在 js 之前），**不要调换两行顺序**

**取值规则（务必理解）**：

| 谁访问 | 用什么地址 | 说明 |
|---|---|---|
| PLM 浏览器端 | **开发机局域网 IP**，如 `http://10.1.2.3:3100` | js 在用户浏览器里执行，`127.0.0.1` 会指向用户自己电脑而失败 |
| 服务端探活/联调 | `http://127.0.0.1:3100` | 只在开发机本机命令行测试时用 |

即：**开发机的 IP 必须对 PLM 用户电脑可达**（同一网段、防火墙已放通、未被安全软件拦截）。

### 4.4 清理缓存并重启（必须）

PLM 对 js / 页面有缓存，文件放进去不会立即生效：

```powershell
# 1) 回收 IIS 应用程序池（最彻底）
Import-Module WebAdministration
Get-IISAppPool | Where-Object { $_.Name -like "*PLM*" -or $_.Name -like "*InforCenter*" } | Restart-WebAppPool

# 2) 若 PLM 有独立服务进程（默认 8890），一并重启
Get-NetTCPConnection -LocalPort 8890 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# 3) 用户侧强制刷新
#    浏览器 Ctrl + F5；或清一次站点缓存
```

### 4.5 验证是否加载成功

1. 打开 PLM → 物料 → 新建（进入向导，到「基础信息」页，能看到 名称/规格型号 输入框）。
2. 浏览器按 `F12` 打开控制台，应看到：

```
[ItemSmartInput] 脚本已加载 v1.23（api=http://10.1.2.3:3100；地址来源=ItemSmartInput.config.js；…；类型门控=电气元件/原材料/外购标准件；…）
[ItemSmartInput] 进入 PSEITEM$ 新增页（与 PSEITEM 共用同一套逻辑）      ← 仅 PSEITEM$ 入口
[ItemSmartInput] 已绑定：名称 规格 联想；保存前查重已启用
[ItemSmartInput] 检测到新增弹窗（DOM 兜底接管）：规格=…[规格型号/图号] 名称=…[名称*] 编号=…[编号*] 类型=…[类型*]
[ItemSmartInput] 已注入「校验并回填」按钮（位置=left；…）
[ItemSmartInput] 当前类型：value="电气元件" text="电气元件" 允许表=[…] → 允许
[ItemSmartInput] 治理服务就绪：索引 23036 条 / 200 个小类
```

逐行含义：

| 行 | 说明 |
|---|---|
| 第 1 行 | 脚本已加载；`v1.23` 确认部署的是新版；`地址来源=ItemSmartInput.config.js` 确认读到了外置配置 |
| 第 2 行（可选） | 只有 `PSEITEM$` 入口出现；`PSEITEM` 入口没有这一行，属正常 |
| 第 3 行 | 输入框事件绑定成功（联想与保存前查重可用） |
| 第 4 行 | **兜底接管**：方括号里是识别到的标签。四个标签应分别是 `规格型号/图号`、`名称*`、`编号*`、`类型*`；若出现「字段定位重复…跳过本次接管」，说明结构没认对 |
| 第 5 行 | 按钮已注入，`位置=` 是实际生效的模式（`left` / `float` / `fixed` / `after`） |
| 第 6 行 | 类型判定结果；只有显示「允许」时按钮才可见 |
| 第 7 行 | 治理服务可达；缺失只代表服务不可达，按钮仍会显示，点击会提示「治理服务不可用（数据治理服务器）」 |

3. 若出现 `按钮挂载点未找到：控件 id=…`，把该行贴给开发；不影响 PLM 正常录入。

4. 若出现 `未找到类型控件 ITEMTYPE_Value`，说明类型控件 ID 不一致，按钮会一直隐藏，需核对 `PSEITEM-CREATE.page` 里的 `ControlID`。

---

## 五、配置项说明（`ItemSmartInput.js` 顶部 `CFG`）

| 配置 | 默认 | 说明 |
|---|---|---|
| `apiBase` | `http://192.168.20.31:3100` | **仅作兜底**。实际地址以 `Config/ItemSmartInput.config.js` 为准；只有该文件缺失时才用此值 |
| `enabled` | `true` | 总开关，`false` 时脚本完全静默（最快的止血手段） |
| `timeout` | `1500` | 单次请求超时(ms)，超时即降级放行 |
| `suggestDebounce` | `300` | 输入防抖，打字 300ms 后才请求 |
| `minLen` | `2` | 触发联想的最少字符数 |
| `autoFillZycs` | `true` | 选定规格后是否连带回填「主要参数 ZYCS」（仅当 ZYCS 为空时） |
| `blockOnDuplicate` | `true` | 保存时命中 exact/sep 级重复是否二次确认 |
| `notifyDuplicateOnBlur` | `true` | 失焦时在浮层提示重复（不弹框） |
| `tidySpecSpace` | `true` | 失焦/保存前自动整理规格空格（首尾 + 连续 + 全角 U+3000/Tab）；乘号不处理 |
| `showCheckButton` | `true` | 是否注入「校验并回填」按钮 |
| `checkButtonText` | `校验并回填` | 按钮文字（`left` 模式下自动换行） |
| `checkButtonHost` | `name` | 按钮锚点：`name`（名称框）或 `spec`（规格框） |
| `checkButtonPlace` | `left` | 位置模式：`left`=名称标签左侧；`float`=锚点右侧；`fixed`=窗口右下角；`after`=插进原布局 |
| `checkButtonOffsetX` | `6` | 跟随定位的横向偏移(px)，负值向左 |
| `checkButtonOffsetY` | `0` | 纵向偏移(px) |
| `apiLabel` | `数据治理服务器` | 提示文案里代替 IP 显示的名字 |
| `inventoryBase` | `''` | 看板地址（如 `http://192.168.20.31:3130`），用于弹窗内「现有库存」；留空则不显示 |
| `domWatchDelay` | `2500` | DOM 兜底接管延时(ms)；给正常 `OnCreate` 留出时间 |
| `restrictItemType` | `true` | 是否按「类型」控制按钮可见性 |
| `itemTypeAllowText` | `['电气元件','原材料','外购标准件']` | 允许显示按钮的类型显示名 |
| `itemTypeAllowValues` | `[]` | 若类型返回值是编码而非名称，在此补编码 |
| `ctlEname / ctlGgxh / ctlZycs / ctlEcode / ctlItemType` | 见文件 | 控件 ID，与 `PSEITEM-CREATE.page` 一致，一般不改 |

服务端业务规则**不在 js 里**，仍由既有配置文件驱动，改规则不需要动 PLM：

- `src/config/name-synonyms.json` —— 名称同义词（空气开关 → 微型断路器）
- `src/config/material-rules.json` —— 名称/规格书写规则（长度、禁用词、单位大小写…）；`name.subMismatch` 控制「名称与所选小类不符」的检测阈值与级别（warn/error）
- `src/config/dedup-rules.json` —— 查重属性与特征参数（按小类）
- `src/config/spec-fields.json` —— 特征参数取值正则

改完配置后调用 `POST http://127.0.0.1:3100/api/plm/reload` 重载索引（规则文件本身带 mtime 缓存，多数情况无需重启）。

### 5.1 「校验并回填」按钮与校验弹窗（v1.23）

新建零组件窗口打开后，插件在「名称」标签左侧插入一个窄按钮（`checkButtonPlace: 'left'`）。**编码仍由 PLM 编码器负责，插件不参与发号、也不改编号**。

**类型门控**：只有「电气元件 / 原材料 / 外购标准件」显示按钮；未选择类型，或选了非标自制件 / 通用自制件 / 请购单 / 成品 / 服务等，**按钮直接不出现，也没有任何提示文字**。类型切换后 1.5 秒内自动跟随。

**点击按钮弹出校验对话框**：

| 区域 | 说明 |
|---|---|
| 信息条 | 物料编码 + 大类/中类/小类；该小类建议写清的参数；未查重原因 |
| 物料名称 | 预填当前 PLM 名称，可编辑；**名称类问题显示在名称框正下方**；附带「名称建议」chips（同 `/api/plm/suggest` field=name，点击填入）、「标准叫法」「建议改为」可点击应用 |
| 规格型号 | 预填当前 PLM 规格，可编辑；**规格类问题显示在规格框正下方**；附带「规范写法」可点击应用、「该小类建议写清」参数 |
| 现有库存 | 读看板（`inventoryBase`）的只读接口，显示数量 / 可用 / 单仓名称；多仓列分仓明细 |
| 类似型号 | 主弹窗显示「同小类共 N 条（按接近程度排序）」+「查看类似型号明细」；点开为**独立弹窗**：合计数量/可用、录入规格 + 黄色差异高亮 + 排序说明、五列表格（物料号/名称/规格型号/数量/项目号），点行填入规格框。未配置 `inventoryBase` 时**不显示**（不再有内联候选列表） |
| 保存并回填 | **有 error 时按钮禁用**，点击会提示；无 error 时按规范写法回填（名称=同义词标准名+格式修正，规格=空格整理，并同步 ZYCS / FLSXHB） |
| 关闭方式 | **只有右上角 × 和「取消」**；点击遮罩不会关闭 |
| 配色 | **继承 PLM 原有配色**：以规格框向上找弹窗容器，读 `background-color` / `color`；主色取页面按钮。输入框/边框用半透明灰，浅色与深色主题都适配 |

使用流程：

1. 点「编号」右侧「…」，在编码器里选大类 / 小类并「申请编码」；
2. 点「校验并回填」→ 弹窗打开，名称与规格自动带入；
3. 修改内容，观察校验提示；可用「类似型号」一键填入已有写法；
4. 点「保存并回填」→ 写回 PLM 的「名称」「规格型号/图号」并关闭弹窗；**成功时不显示任何提示条**（界面保持干净），只有什么都没填时才提示「未回填（内容为空）」。

> 尚未申请编码时弹窗仍可打开、可校验书写规则，但**分类相关校验与查重会跳过**（小类来自编码前 6 位）。
> 有硬错误时点保存会弹二次确认，不硬阻断。
> 按钮注入或接管失败只写控制台日志，不影响 PLM 正常录入；`CFG.showCheckButton=false` 可完全关闭。

---

## 六、功能验收清单

| # | 场景 | 预期 |
|---|---|---|
| 1 | 名称输入「空气开关」 | 浮层出现 `[建议] 微型断路器`（标准叫法）与 `[库内] 空气开关 (3 次)` |
| 2 | 点击「微型断路器」 | `ENAME` 输入框被回填为「微型断路器」 |
| 3 | 规格输入「NXB-63」 | 浮层出现库内既有写法（如 `NXB-63 C16 3P`），并有「规范化写法」候选 |
| 4 | 点击某规格 | `GGXH` 回填；若 `ZYCS` 为空，自动填入 `型号:NXB-63；额定电流:16；极数:3P` |
| 5 | 规格填 `4／Q235-A`（全角斜杠） | 浮层给出「规范化写法 `4/Q235-A`」 |
| 6 | 名称/规格填成库里已有的完全一致内容后点「确定」 | 弹出「疑似一物多号」，列出重复编码；取消则不保存，确定则放行且本次不再拦 |
| 7 | 名称超长/含禁用字符后点「确定」 | 弹出「建议修正」并可选择继续，**不会硬性阻断** |
| 8 | 停掉 Node 服务后再新建物料 | 页面正常打开、可正常保存；控制台提示「治理服务不可达（联想/查重将自动跳过，不影响原生录入）」 |
| 9 | 未选物料编码就填名称/规格 | 不查重、不报错（控制台记录跳过原因），由 PLM 原生编码校验兜底 |
| 10 | 连续开关新增页 3 次以上 | 每次都能联想与查重（不会因上一次页面关闭而失效） |
| 11 | 「类型」选 电气元件 / 原材料 / 外购标准件 | 「名称」标签左侧出现「校验并回填」按钮 |
| 12 | 「类型」未选择，或选 非标自制件 / 成品 / 服务等 | 按钮**不出现**，页面无任何黄色提示 |
| 13 | 点「校验并回填」 | 弹出「物料名称与规格校验」对话框，名称/规格自动带入 |
| 14 | 弹窗内把名称改成「空气 开关」、规格改成 `  NXB-63   C16  ` | 停 400ms 后出现校验提示；错误红、提示黄 |
| 15 | 弹窗内点「类似型号」 | 列出同小类已有写法，点击即填入规格框 |
| 16 | 点「保存并回填」 | PLM 名称=`微型断路器`、规格=`NXB-63 C16`，按钮旁显示「已回填名称、规格型号」 |
| 17 | 未申请编码时打开弹窗并保存 | 弹窗可开；分类相关校验与查重跳过，仅做书写规则校验 |
| 18 | 小类 100601 三相电抗器 + 名称「断路器」，弹窗内保存 | 提示「名称与所选小类不匹配…」；点保存时二次确认，不硬阻断 |
| 19 | 规格带首尾/连续空格 | 保存后回填为整理后的写法；乘号 `×` / `x` **不被改写** |
| 20 | 从 `PSEITEM$` 入口（同样标题为「新建零组件」）进入 | 按钮、弹窗、回填与 `PSEITEM` 入口表现一致 |

### 6.1 离线逻辑验证（无需 PLM 站点，改完 js 先跑）

```powershell
cd E:\tedri_project\dev\Plm_Code
npm run verify:plm
```

预期输出结尾：`结果: 43 通过 / 0 失败`。

该脚本用 `vm` 构造 mock 环境（window/document/jQuery/HoteamUI/控件），**真实执行 `ItemSmartInput.js`**，覆盖 18 个场景：绑定、防抖联想、点选回填、ZYCS 连带回填、命中重复时取消（阻断）/确认（放行）、未取编码跳过、服务异常放行、字段为空不干预、二次打开页重新绑定、规则错误不硬阻断、确认记录随页面重置、规格空格回填、按钮点击 → 弹窗 → 保存回填、类型门控（非授权类型按钮隐藏且不回填）、外置地址配置、`PSEITEM$` 入口钩子、DOM 兜底接管。其中 S14 会真实走一遍「点按钮 → 弹窗 → 保存」，断言名称与规格被正确回填。

> 它验证的是【控制流】，不能替代真实浏览器验证（真实 DOM 结构、真实跨域仍要现场确认）；网络层由 `/api/plm/*` 的端到端测试单独覆盖。

---

## 七、故障排查

| 症状 | 原因 | 处理 |
|---|---|---|
| 控制台无 `[ItemSmartInput]` 日志 | fileref 未加载 / 缓存未清 / 权限不足 | 检查 fileref 路径与站点根是否一致；重启应用池；`icacls` 赋读权限 |
| 有「脚本已加载」但无「治理服务就绪」 | 探活失败（不影响原生录入） | 浏览器直接访问 `http://<开发机IP>:3100/api/plm/health`；不通则查防火墙/服务是否在跑 |
| 新增页第二次打开后联想失效 | 旧版本状态未重置（v1.1 已修复） | 确认部署的是 v1.23；控制台看每次打开是否都有「已绑定」日志 |
| 浏览器报 CORS 错误 | 用了非简单请求 / 端口被代理改写 | 本实现用 form-urlencoded + 全量 CORS 头，正常不该出现；若经反向代理，确认未被剥离 `Access-Control-Allow-Origin` |
| 联想出来但点选不回填 | 控件 DOM/接口版本差异 | 看控制台是否提示「未取到 xxx 输入框 DOM」；`SetText` 走的是控件 API，DOM 只用于定位浮层与事件 |
| 保存时未拦截重复 | `blockOnDuplicate=false`、名称或规格为空、或服务超时 | 检查配置；确认两个字段都有值；看控制台 `[check]` 日志 |
| 查重结果一直是 0 条 | 索引未加载 / `materials.ndjson` 过期 / 编码前缀不在分类表 | 访问 `/api/plm/health` 看 `count`、`ready`；重新 `npm run extract` 后 `POST /api/plm/reload` |
| 服务启动报 `EADDRINUSE` | 端口被占用（PLM 接口默认 3100，看板默认 3000） | `ss -lntp \| grep 3100`（Linux）或 `netstat -ano \| findstr :3100`（Windows）找到占用进程；或在 `.env` 改 `PLM_API_PORT` 并同步改 `apiBase` / 改 `PORT` |
| 改了 `.env` 端口却不生效 | 外部环境变量优先于 `.env` | 看启动首行 `[xxx] 已加载 ...`；若显示「未找到 .env」，检查路径；若进程被 PM2/docker 注入过同名变量，外部值优先，需改注入源 |
| 浏览器提示「同步 XMLHttpRequest 已废弃」 | `OnOK` 用同步请求以便阻断 | 仅警告，不影响功能；若需消除可改为预先异步缓存结果 |
| 控制台无「已注入…按钮」 | DOM 结构与预期不同，挂载点探测失败 | 看紧随其后的「按钮挂载点未找到」详情行；不影响原生录入，把该行反馈给开发 |
| 按钮一直是灰色 | 类型不在允许列表，或类型控件取不到 | 确认「类型」是 电气元件 / 原材料 / 外购标准件；看首行 `类型门控=` 与「未找到类型控件」提示 |
| 点按钮提示「请先申请编码」 | 编号为空（未走编码器） | 点「编号」右侧「…」申请编码后再点按钮；小类完全由编码前 6 位决定 |
| 点按钮但规格没回填 | 后端仍是旧版，未返回 `specFormat` | 按 2.1 更新 `material-rules.js` / `plm-server.js` 并重启服务 |
| 改了 `ItemSmartInput.config.js` 但地址没变 | fileref 顺序不对 / 浏览器缓存 / 文件没放对目录 | 确认 fileref 里 config 排在 js 之前；Ctrl+F5；看首行 `地址来源=` 是「ItemSmartInput.config.js」还是「内置默认」 |
| **插件放了但完全不加载** | 放在 `SecondaryDev` 下，而该模块在 `Config/Apps.app` 里被注释，平台不扫描 | 按 2.1 放到 `InforCenter\Config\ItemSmartInput`，并在 `InforCenter\Config\PLMFileRef.fileref` 注册 |
| 字段定位日志全是 `(无id)` | 命中了隐藏模板或首页元素 | v1.16 起按「可见 + 带 id + 标签」过滤；仍出现就贴「可见输入框清单」那段 |
| 按钮不显示 | 类型为空或不在白名单；或输入框不可见 | 先选「电气元件 / 原材料 / 外购标准件」；看「当前类型…→ 允许」日志 |
| 按钮跑到窗口右下角 | 配置文件里还写着 `checkButtonPlace: 'fixed'` | 删掉该行，或改成 `'left'` / `'float'` |
| 按钮位置偏几像素 | 标签列宽度因主题而异 | 改 `checkButtonOffsetX` / `checkButtonOffsetY`，无需改代码 |
| **控制台完全没有 `[ItemSmartInput]`** | 脚本根本没加载 | ① F12 → Network 搜 `ItemSmartInput.js`：404/403 说明路径或权限问题；② 直接在地址栏打开该 js 的 URL 看是否 200；③ 回收 IIS 应用池后 Ctrl+F5 |
| **有「脚本已加载」但没有「已绑定」** | 钩子未触发：进入的不是 `PSEITEM` / `PSEITEM$` 页面 | 看控制台是否有「进入 PSEITEM$ 新增页」；若两个都没有，说明该窗口是第三种对象类型，需把它的 `InforCenter_<对象>_CreatePage_OnCreate` 钩子也挂上（告诉我页面名即可） |

---

## 八、回滚（三档，由轻到重）

| 粒度 | 操作 | 生效 |
|---|---|---|
| 只关功能、保留文件 | `ItemSmartInput.js` 里 `CFG.enabled = false` | 清缓存后立即 |
| 关闭某一框架 | 删除 `ItemSmartInput.fileref` 对应 `<JSFile ... group="TSDC"/>` 或 `group="InforCenter"/>` 行 | 清缓存后立即 |
| 完全移除 | 删除 `InforCenter\Config\ItemSmartInput` 整个目录，并移除 `PLMFileRef.fileref` 里追加的两行 | 清缓存后立即 |

> 任何一档都不需要改动 PLM 原文件，也不会影响已建物料数据。

---

## 九、已知限制（交付前请知悉）

1. **只覆盖 PC Web 端**新增向导；H5/移动端新增不走此页面，不受影响也不增强。
2. **取不到输入框 DOM 时自动降级**：联想浮层不可用，但保存前查重（不依赖 DOM）仍生效。
3. **`OnOK` 内使用同步 ajax**：为在保存瞬间拿到结果阻断，浏览器控制台会有 “Synchronous XMLHttpRequest” 警告，属预期。
4. **编码前 6 位 = 小类**：与 `doc/编码分类规则与特征参数说明.md` 的 10/11/12 三级体系一致；若 PLM 现场编码规则与之不同，需先用 `/api/plm/suggest` 的 `category` 字段核对，必要时在 `plm-index.js` 的 `subOf` 逻辑里调整取位。
5. **strong duplicate 只是“疑似”**：`exact/sep` 级重复由人工二次确认放行，不做硬性禁止（避免误伤真实的不同实物）。
6. **不写 PLM 数据**：本方案只读（联想/校验），物料落库完全由 PLM 原生逻辑完成，不产生越权写入。
7. **查重数据源是 ERP 存量**（`materials.ndjson`）：PLM 中已建但尚未下发 ERP 的物料查不到，**同一天连续新建的多个物料之间也互相查不到**。这是当前闭环的最大缺口，补法见第十一节。
8. **CORS 为 `*`**：内网环境可接受；若需收紧，可在 `plm-server.js` 的 `send()` 中按 `Origin` 白名单校验。
9. **按钮是 DOM 注入，不是平台官方扩展点**：平台只支持在 `.page` 模型里声明 `TypeName="Button"`（会被模型重新生成覆盖），没有运行时 `AddControl` API，控件对象也不暴露 `GetDom`。插件依赖「控件 ID = DOM ID」这条平台约定挂载（框架自身也是 `$("#"+id)` 操作控件），PLM 升级若改渲染结构可能失效——控制台「已注入…（挂载方式：…）」日志就是为此准备的。
10. **类型枚举存放在 PLM 库里**：插件优先按「类型」下拉的显示文本判断，取不到再回退 `GetSelectedValue()` 与 DOM 选中项。若现场返回的是内部编码，需在 `CFG.itemTypeAllowValues` 补编码。
11. **类型门控只作用于新按钮**：原有的名称联想、失焦查重、保存前查重仍对所有类型生效。
12. **两个同名「新建零组件」入口**：PLM 同时存在 `PSEITEM` 与 `PSEITEM$`（`PSEITEM-CREATE.page` / `PSEITEM$-CREATE.page`），标题都叫「新建零组件」、控件 ID 完全一致，但钩子名不同。插件已同时挂上两组钩子；若现场还有第三种入口，需要按其页面里的 `InforCenter_<对象>_CreatePage_OnCreate` 再补一次别名。
13. **平台真实 DOM id 是自动生成的**：`idgul271_TextBox` 这类 id 每次会话都会变，**不能硬编码**。插件按标签文字（`规格型号` / `名称` / `编号` / `类型`）定位，并只认「可见 + 带 id」的输入框；`编号` 是 `EditButton`，渲染成非 input 元素，按 `_EditButton` / `MultiNo` 容器读文本。
14. **弹窗可能在 iframe 里**：所以按钮定位用 `getBoundingClientRect()` + `position:fixed`（同一坐标系），而不是相对窗口的 `bottom/right`；否则会落到 iframe 视口外看不见。
15. **DOM 兜底的代价**：写值走 `input.value + input/change 事件`，依赖 PLM 取数时从 DOM 读值（`OnGetDataFromPage` 正是 `c.GetText()`），因此正常生效；若某版本改为缓存控件内部状态，兜底写入可能不落库，需改回钩子方式。
16. **弹窗内不含大类/中类/小类/编码/单位/库存**：这些依赖治理看板（3130）的接口，PLM 插件只访问 3100。小类由编号前 6 位决定，弹窗里再选会与编码器冲突，因此刻意不做。

---

## 十、上线步骤速查（Checklist）

- [ ] 1. `npm run extract` 跑过，`data/materials.ndjson` 存在且较新
- [ ] 2. `npm run plm` 启动，日志出现 `[index] 就绪`
- [ ] 3. 防火墙放通 3100
- [ ] 4. 用 `http://<开发机IP>:3100/api/plm/health` 在**另一台**电脑验证可达
- [ ] 5. 备份旧 `ItemSmartInput.js`（`.bak_日期`）
- [ ] 6. 复制 `ItemSmartInput.js` + `ItemSmartInput.config.js` 到 `<站点>\InforCenter\Config\ItemSmartInput\`，SHA256 与第 1 节一致
- [ ] 7. 在 `InforCenter\Config\PLMFileRef.fileref` 的 `</root>` 前追加两行（config 在前、js 在后）
- [ ] 8. `[xml](Get-Content ...)` 校验 fileref 通过
- [ ] 9. 按需改 `ItemSmartInput.config.js`（`apiBase` / `checkButtonPlace` / `apiLabel` / 偏移量）
- [ ] 10. 后端同步：`material-rules.js`、`plm-server.js`、`material-rules.json`，重启服务
- [ ] 11. `icacls` 赋读权限（首次部署才需要）
- [ ] 12. 重启业务服务（8890）+ 回收 IIS 应用池
- [ ] 13. 浏览器 Ctrl+F5，确认 `v1.23`、`地址来源=ItemSmartInput.config.js`、「已注入…位置=left」
- [ ] 14. 按第六节 20 条验收逐项过一遍

---

## 十一、闭环缺口与补齐方案

本次实现的是「录入时拦截」，但查重基数只有 ERP 存量（`materials.ndjson`），存在一个真实缺口：

```
PLM 新建物料 ──(审批/下发)──> ERP ──(extract)──> materials.ndjson ──> 本助手索引
        ↑                                                              │
        └──────────── 尚未下发的物料不在此索引，查不到 ←──────────────┘
```

具体表现：
- PLM 中已建、尚未下发 ERP 的物料，新建同名同规格物料时**查不到重复**；
- 同一天连续新建的多个物料之间**互相查不到**（索引是快照，不随录入增长）。

### 补齐方案 A（推荐，一劳永逸）：并入 PLM 自身物料

`TCPLM` 库的 `PSEITEM`（+ `PSEITEMBASEFORM`）字段与 ERP 高度对应：

| PLM | ERP | 说明 |
|---|---|---|
| `PSEITEM.ECODE` | `T_BD_MATERIAL.FNUMBER` | 编码，同 6 位小类规则 |
| `PSEITEM.ENAME` | `FNAME` | 名称 |
| `PSEITEM.GGXH` | `FSPECIFICATION` | 规格型号 |
| `PSEITEM.ZYCS` | `F_ZXCV_ZYCS` | 主要参数 |
| `PSEITEM.UNIT` | `UNITNAME` | 单位 |

**接入点已预留**：`src/plm-index.js` 已把写索引的唯一入口统一为 `applyRecord(subs, rec, source)`，索引条目自带 `source: 'erp' | 'plm'`。后期只需再加一个 loader：

```js
// 伪代码：新增 loadFromPlm()，与 ERP 索引合并
const rows = await executeQuery(
  `SELECT i.ECODE AS FNUMBER, i.ENAME AS FNAME, i.GGXH AS FSPECIFICATION,
          i.ZYCS  AS F_ZXCV_ZYCS, i.UNIT AS UNITNAME
     FROM PSEITEM i WHERE i.WORKFLOWSTATE = ...`, {}, { server: 'plm' })
for (const r of rows.recordset) applyRecord(subs, r, 'plm')
```

查重、联想、签名算法**完全不用改**；`source` 字段可直接用于前端区分「PLM 未下发」与「ERP 已有」。

前置条件：本开发机能访问 `TCPLM` 库（`server=.`，即 PLM 服务器本机实例）。

### 补齐方案 B（最轻，当天可用）：会话内增量

助手记录本次会话已提交成功的「编码 + 名称 + 规格」，加入内存索引（TTL 例如 8 小时）。只能防同一天的连续重复，重启即失效。

### 补齐方案 C（不改代码）：缩短刷新周期

把 `npm run extract` + `POST /api/plm/reload` 做成定时任务（例如每日 02:00），把缺口窗口压到一天以内。这是当前已可用、成本最低的止血手段。

> 建议：**先上 C（今天就能用）→ 再做 A（彻底闭环）→ B 可不做**。

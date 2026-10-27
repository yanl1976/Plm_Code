# PLM 物料新增「名称/规格型号」智能录入助手 — 部署说明

> 版本 v1.1.0 ｜ 适用：InforCenter Enterprise Platform 2020.3（8.3.8）＋ 物料治理服务（本仓库 Node）
> v1.1.0 变更：修复异步请求返回值缺陷（原版联想/探活实际不可用）；新增页重复打开时状态重置；保存校验增加控件兜底取值；规则错误由硬阻断改为二次确认；未查重时回传 `skipReason`。
> 目标：在 PLM **原生新增物料页面**上，为「名称」「规格型号」两个输入框增加联想、查重，并把选定结果回填到对应输入框。
> **前置项（分类、物料编码申请、单位、位置、描述、主要参数等）全部保持 PLM 原有行为，不做任何改动。**

---

## 一、方案总览

```
┌─────────────────────────── PLM 服务端（IIS） ───────────────────────────┐
│  AutoGenerator/Config/Pages/PSEITEM-CREATE.page   ← 完全不动            │
│      ↑ 该页面由 PAGE-CREATE.generator 生成，模板里固化了两个钩子调用：   │
│         InforCenter_PSEITEM_CreatePage_OnCreate(pageEvent, data)        │
│         InforCenter_PSEITEM_CreatePage_OnOK(pageEvent)                  │
│                                                                         │
│  SecondaryDev/ItemSmartInput/Config/Js/ItemSmartInput.js  ← 新增        │
│      实现上面两个全局函数（钩子被模板固化，模型页重新生成也不会丢）       │
│  SecondaryDev/ItemSmartInput/Config/ItemSmartInput.fileref ← 新增       │
│      声明 js 加载到 InforCenter / TSDC 框架                              │
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

**改动了什么**：只在 PLM 站点新增 2 个文件（1 个 js + 1 个 fileref），不修改任何既有文件。
**没改动什么**：`PSEITEM-CREATE.page`、`PSEITEM.model`、菜单、编码规则、工作流、既有 `CreateItem.js` 全部保持原样。

---

## 二、部署清单

| # | 文件 | 放置位置 | 类型 |
|---|---|---|---|
| 1 | `src/plm-index.js` | `E:\tedri_project\dev\Plm_Code\src\` | 新增（Node） |
| 2 | `src/plm-server.js` | `E:\tedri_project\dev\Plm_Code\src\` | 新增（Node） |
| 3 | `ItemSmartInput.js` | `<PLM站点>\SecondaryDev\ItemSmartInput\Config\Js\` | 新增（PLM） |
| 4 | `ItemSmartInput.fileref` | `<PLM站点>\SecondaryDev\ItemSmartInput\Config\` | 新增（PLM） |
| 5 | `package.json` 的 `scripts.plm` | `E:\tedri_project\dev\Plm_Code\package.json` | 已加入（可选） |

> `<PLM站点>` 指 IIS 中指向 `PLMSOFT\Server` 的物理目录，例如 `E:\tedri_project\dev\Plm_Code\PLMSOFT\Server`。
> 生产环境请按实际路径替换，**不要**误放到 `PLMSOFT\DistributedFileServer`。

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

```powershell
# 方式一：pm2（若已安装）
cd E:\tedri_project\dev\Plm_Code
pm2 start src/plm-server.js --name plm-material-helper
pm2 save

# 方式二：计划任务，登录时自动启动
schtasks /create /tn "PLM-Material-Helper" /tr "node E:\tedri_project\dev\Plm_Code\src\plm-server.js" /sc onlogon /rl highest
```

---

## 四、PLM 侧部署

### 4.1 建目录并放文件

在 PLM 站点根下新建（路径必须完全一致，`fileref` 里写的是相对站点根的路径）：

```
<PLM站点>\SecondaryDev\ItemSmartInput\Config\ItemSmartInput.fileref
<PLM站点>\SecondaryDev\ItemSmartInput\Config\Js\ItemSmartInput.js
```

示例（按实际 PLM 站点目录替换）：

```powershell
$plm = 'E:\tedri_project\dev\Plm_Code\PLMSOFT\Server'
New-Item -ItemType Directory -Force -Path "$plm\SecondaryDev\ItemSmartInput\Config\Js" | Out-Null
Copy-Item 'E:\tedri_project\dev\Plm_Code\PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\ItemSmartInput.fileref' "$plm\SecondaryDev\ItemSmartInput\Config\" -Force
Copy-Item 'E:\tedri_project\dev\Plm_Code\PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\Js\ItemSmartInput.js' "$plm\SecondaryDev\ItemSmartInput\Config\Js\" -Force
```

### 4.2 编码与权限

- 两个文件必须是 **UTF-8（无 BOM）**。若用记事本另存，请选 “UTF-8”。
- 赋予 IIS 应用程序池账号读取权限：

```powershell
icacls "$plm\SecondaryDev\ItemSmartInput" /grant "IIS_IUSRS:(OI)(CI)R" /T
```

### 4.3 修改 API 地址（**必须改，最常见错误**）

打开 `ItemSmartInput.js`，修改文件顶部的配置块：

```javascript
var CFG = {
  apiBase: 'http://10.1.2.3:3100',   // ← 改成开发机的局域网 IP:端口
  ...
};
```

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
[ItemSmartInput] 脚本已加载 v1.1（api=http://10.1.2.3:3100）
[ItemSmartInput] 已绑定：名称 规格 联想；保存前查重已启用
[ItemSmartInput] 治理服务就绪：索引 23036 条 / 200 个小类
```

> 探活是**异步**的，只用于日志提示，不阻塞页面打开。第三行缺失只说明服务不可达，此时联想浮层不会出现、保存前查重自动跳过，**页面与原生保存仍然完全正常**。

3. 若只有第一行、没有第二行，说明**探活失败**（服务不可达）→ 见第七节排查。

---

## 五、配置项说明（`ItemSmartInput.js` 顶部 `CFG`）

| 配置 | 默认 | 说明 |
|---|---|---|
| `apiBase` | `http://127.0.0.1:3100` | **必须改成开发机局域网地址** |
| `enabled` | `true` | 总开关，`false` 时脚本完全静默（最快的止血手段） |
| `timeout` | `1500` | 单次请求超时(ms)，超时即降级放行 |
| `suggestDebounce` | `300` | 输入防抖，打字 300ms 后才请求 |
| `minLen` | `2` | 触发联想的最少字符数 |
| `autoFillZycs` | `true` | 选定规格后是否连带回填「主要参数 ZYCS」（仅当 ZYCS 为空时） |
| `blockOnDuplicate` | `true` | 保存时命中 exact/sep 级重复是否二次确认 |
| `notifyDuplicateOnBlur` | `true` | 失焦时在浮层提示重复（不弹框） |
| `ctlEname / ctlGgxh / ctlZycs / ctlEcode` | 见文件 | 控件 ID，与 `PSEITEM-CREATE.page` 一致，一般不改 |

服务端业务规则**不在 js 里**，仍由既有配置文件驱动，改规则不需要动 PLM：

- `src/config/name-synonyms.json` —— 名称同义词（空气开关 → 微型断路器）
- `src/config/material-rules.json` —— 名称/规格书写规则（长度、禁用词、单位大小写…）
- `src/config/dedup-rules.json` —— 查重属性与特征参数（按小类）
- `src/config/spec-fields.json` —— 特征参数取值正则

改完配置后调用 `POST http://127.0.0.1:3100/api/plm/reload` 重载索引（规则文件本身带 mtime 缓存，多数情况无需重启）。

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

### 6.1 离线逻辑验证（无需 PLM 站点，改完 js 先跑）

```powershell
cd E:\tedri_project\dev\Plm_Code
npm run verify:plm
```

预期输出结尾：`结果: 25 通过 / 0 失败`。

该脚本用 `vm` 构造 mock 环境（window/document/jQuery/HoteamUI/控件），**真实执行 `ItemSmartInput.js`**，覆盖 12 个场景：绑定、防抖联想、点选回填、ZYCS 连带回填、命中重复时取消（阻断）/确认（放行）、未取编码跳过、服务异常放行、字段为空不干预、二次打开页重新绑定、规则错误不硬阻断、确认记录随页面重置。

> 它验证的是【控制流】，不能替代真实浏览器验证（真实 DOM 结构、真实跨域仍要现场确认）；网络层由 `/api/plm/*` 的端到端测试单独覆盖。

---

## 七、故障排查

| 症状 | 原因 | 处理 |
|---|---|---|
| 控制台无 `[ItemSmartInput]` 日志 | fileref 未加载 / 缓存未清 / 权限不足 | 检查 fileref 路径与站点根是否一致；重启应用池；`icacls` 赋读权限 |
| 有「脚本已加载」但无「治理服务就绪」 | 探活失败（不影响原生录入） | 浏览器直接访问 `http://<开发机IP>:3100/api/plm/health`；不通则查防火墙/服务是否在跑 |
| 新增页第二次打开后联想失效 | 旧版本状态未重置（v1.1 已修复） | 确认部署的是 v1.1；控制台看每次打开是否都有「已绑定」日志 |
| 浏览器报 CORS 错误 | 用了非简单请求 / 端口被代理改写 | 本实现用 form-urlencoded + 全量 CORS 头，正常不该出现；若经反向代理，确认未被剥离 `Access-Control-Allow-Origin` |
| 联想出来但点选不回填 | 控件 DOM/接口版本差异 | 看控制台是否提示「未取到 xxx 输入框 DOM」；`SetText` 走的是控件 API，DOM 只用于定位浮层与事件 |
| 保存时未拦截重复 | `blockOnDuplicate=false`、名称或规格为空、或服务超时 | 检查配置；确认两个字段都有值；看控制台 `[check]` 日志 |
| 查重结果一直是 0 条 | 索引未加载 / `materials.ndjson` 过期 / 编码前缀不在分类表 | 访问 `/api/plm/health` 看 `count`、`ready`；重新 `npm run extract` 后 `POST /api/plm/reload` |
| 服务启动报 `EADDRINUSE` | 端口被占用（PLM 接口默认 3100，看板默认 3000） | `ss -lntp \| grep 3100`（Linux）或 `netstat -ano \| findstr :3100`（Windows）找到占用进程；或在 `.env` 改 `PLM_API_PORT` 并同步改 `apiBase` / 改 `PORT` |
| 改了 `.env` 端口却不生效 | 外部环境变量优先于 `.env` | 看启动首行 `[xxx] 已加载 ...`；若显示「未找到 .env」，检查路径；若进程被 PM2/docker 注入过同名变量，外部值优先，需改注入源 |
| 浏览器提示「同步 XMLHttpRequest 已废弃」 | `OnOK` 用同步请求以便阻断 | 仅警告，不影响功能；若需消除可改为预先异步缓存结果 |

---

## 八、回滚（三档，由轻到重）

| 粒度 | 操作 | 生效 |
|---|---|---|
| 只关功能、保留文件 | `ItemSmartInput.js` 里 `CFG.enabled = false` | 清缓存后立即 |
| 关闭某一框架 | 删除 `ItemSmartInput.fileref` 对应 `<JSFile ... group="TSDC"/>` 或 `group="InforCenter"/>` 行 | 清缓存后立即 |
| 完全移除 | 删除 `SecondaryDev\ItemSmartInput` 整个目录 | 清缓存后立即 |

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
7. **索引数据源是 ERP 存量**（`materials.ndjson`）：PLM 里刚建但尚未下发 ERP 的物料不在查重范围内。若需要，可后续把 PLM `PSEITEM` 也并入索引（增加一个数据源即可）。

---

## 十、上线步骤速查（Checklist）

- [ ] 1. `npm run extract` 跑过，`data/materials.ndjson` 存在且较新
- [ ] 2. `npm run plm` 启动，日志出现 `[index] 就绪`
- [ ] 3. 防火墙放通 3100
- [ ] 4. 用 `http://<开发机IP>:3100/api/plm/health` 在**另一台**电脑验证可达
- [ ] 5. 两个 PLM 文件放到 `SecondaryDev\ItemSmartInput\Config\`（UTF-8 无 BOM）
- [ ] 6. 改 `CFG.apiBase` 为开发机 IP
- [ ] 7. `icacls` 赋读权限
- [ ] 8. 重启 IIS 应用程序池（及 8890 服务）
- [ ] 9. 浏览器 Ctrl+F5，控制台确认两行日志
- [ ] 10. 按第六节 10 条验收逐项过一遍

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

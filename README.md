# ERP 物料主数据治理系统（一物多号清洗）

面向金蝶 ERP 物料主数据，解决「型号规格书写混乱 → 一物多号」问题。提供：
**全量提取 → 型号规格结构化 → 强制查重 → 存量清洗（映射/冻结）** 的灵活、可配置流水线。

## 目录结构
```
Plm_Code/
  .env                      # 统一配置（数据库 + 端口 + AI），模板见 .env.example，不入库
  doc/编码分类规则以及编码属性说明.xlsx   # 编码分类规则（生产物资-2023）
  data/                     # 产物（gitignore）：materials.* / dedup-* / mapping.json / freeze.json / unified-materials.json
  src/
    db.js                   # SQL Server 连接池（单例，跨网优化）
    config/
      classification.json     # 由 xlsx 生成的分类树（3 大类 / 209 小类）
      classification-map.json # 6位小类编码 -> 分类定位
      dedup-rules.json        # 灵活查重规则：归一化 + 各小类关键属性（可改，无需动代码）
    extract.js              # 全量提取物料 -> ndjson/csv/stats
    classify.js             # FNUMBER 前缀 -> 小类 + 选择查重属性
    spec.js                 # 名称/规格归一化、签名构造、Jaccard 相似度
    dedup.js                # 强制查重引擎（一物多号 / 一号多物 / 近重）
    mapping.js              # 存量清洗：映射法(旧->主) + 冷冻法(冻结)
    cli.js                  # 命令行入口
  scripts/gen_classification.py  # xlsx -> classification.json（规则变更时重跑）
```

## 快速开始
```bash
npm install                      # 安装 mssql + dotenv
npm run extract                  # 全量提取（默认仅 10/11/12 开头，跨网约 1-2 分钟）
npm run dedup                   # 强制查重，输出候选簇
# 或带近重：node src/cli.js dedup --fuzzy
npm run report                  # 查看查重报告摘要
```

## 配置（统一由 .env 管理）

所有可变配置集中在项目根 `.env`，模板见 `.env.example`（`cp .env.example .env` 后填写）。
**端口不再写死在代码或启动命令里**，两个服务都从 `.env` 读取：

| 变量 | 默认 | 作用 |
|---|---|---|
| `PORT` | `3000` | 治理看板（`src/server.js`）监听端口 |
| `WEB_HOST` | 空（Node 默认，监听所有网卡） | 看板绑定地址；需只绑 IPv4 时设 `0.0.0.0` |
| `PORT_AUTO_INCREMENT` | `false` | 端口被占用时是否自动 +1；默认关闭，避免 PM2 下端口静默漂移 |
| `PLM_API_PORT` | `3100` | PLM 接口（`src/plm-server.js`）监听端口，改动需同步 PLM 侧 `CFG.apiBase` |
| `PLM_API_HOST` | `0.0.0.0` | PLM 接口绑定地址（`127.0.0.1` 则仅本机可访问） |
| `DB_SERVER` `DB_PORT` `DB_DATABASE` `DB_USER` `DB_PASSWORD` `DB_ENCRYPT` | — | 金蝶 ERP 数据库连接（缺任一必填项会明确报错） |

加载逻辑集中在 `src/env.js` —— **全项目唯一的 `.env` 加载点**，任何入口 `import` 它即可拿到完整配置。
优先级：

```
进程真实环境变量（PM2 / docker / systemd 注入） > .env 文件 > 代码默认值
```

因此生产既可整体用 `.env`，也可在 PM2 的 `env` 段或容器 `-e` 覆盖单项。启动日志会打印配置来源：

```
[plm-api] 已加载 /opt/Plm_Code/.env（注入 65 项）
[web] 已加载 /opt/Plm_Code/.env（注入 65 项）
```

端口被占用时默认**直接退出并提示改 `.env`**，不再静默 +1；确需旧行为可设 `PORT_AUTO_INCREMENT=true`。

## 生产部署（PM2）

两个服务由 `ecosystem.config.cjs` 统一托管，端口全部来自 `.env`：

```bash
npm install
npm run extract                  # 首次必须：生成 data/materials.ndjson
pm2 start ecosystem.config.cjs   # 拉起 plm-api + plm-web
pm2 save                         # 固化进程列表
pm2 startup                      # 按输出的 sudo 命令执行一次，开机自启

pm2 logs plm-api --lines 50      # PLM 接口（PLM_API_PORT，当前 3100）
pm2 logs plm-web --lines 50      # 治理看板（PORT，当前 3130）
pm2 restart plm-api plm-web      # 改完 .env 后重启生效
pm2 delete plm-api plm-web       # 停掉本项目两个，不影响同机其它应用
```

三条纪律：

- **不在 pm2 命令里写端口**，否则与 `.env` 形成两套配置；改端口只改 `.env` 再 restart。
- **不用 cluster 多实例**：两个服务各自持有内存索引与定时器，多实例会重复加载 `materials.ndjson`。
- 曾手工 `npm run server` 的要先停掉，否则端口冲突会让 `plm-web` FATAL 退出并反复重启。

## 物料提取范围（编码前缀过滤）
提取范围由 `src/config/settings.json` 的 `materialPrefix` 控制，**默认仅提取 `10`/`11`/`12` 开头的生产物资物料**（排除 20/80 成品/半成品及未收录前缀）：
- `include`（白名单）：仅提取这些前缀开头的物料；空数组 = 提取全部。
- `exclude`（黑名单）：在 include 结果上再剔除这些前缀开头的物料（用于「系统设置」中按需追加排除项）。
- 修改后需重新提取（`npm run extract` 或前端「重跑提取」）方可生效。
- 也可在前端「系统设置」页直接增删包含/排除前缀并保存（写入 `settings.json`）。

## 筛查组织
提取范围还可在「系统设置」页按**使用组织（FUSEORGID）**筛选，仅提取指定组织的物料；默认 **天水电传**（FORGID=100067）。留空 = 不过滤（全部组织）。
- 注：本库所有物料的「创建组织 FCREATEORGID」均为 100067（天水电传），跨组织分发体现在「使用组织 FUSEORGID」，故筛查组织按 FUSEORGID 过滤才有意义（可剔除跨组织副本，使每个 FNUMBER 仅保留本组织一行）。
- 通过 `GET /api/orgs` 获取可选组织列表（按物料数排序）。

## 型号规格结构化（特征参数）
把混乱书写的「型号规格」按小类提取为**结构化特征参数**（如电缆的 电压等级/芯数/截面/型号），便于逐列对齐比对差异。规则全程可配、无需改代码：
- **「某小类提取哪些参数」** → `src/config/dedup-rules.json` 的 `heuristics[].tokens`（或 `subOverrides[<小类>].tokens`）：按小类/中类/大类名称匹配，列出该品类要结构化的参数名清单（芯数/截面/电压/材质/功率/阻值/容值/极数/螺纹/长度/牌号/型号…）。
- **「每个参数怎么取值」** → `src/config/spec-fields.json` 的 `library`：`{ 参数名: { unit, join, patterns:[正则…] } }`，按顺序尝试正则、捕获分组拼接。
- 实现：`src/struct-spec.js`（`extractParams(spec, tokens)`）+ `src/classify.js`（`chooseTokens(info)`）；`src/dedup.js` 在聚类时为每个成员附加 `params` 字段。
- 前端「一物多号查重」点开簇后，除 编码/组织/名称/规格/单位 外，还会按该簇小类的参数清单动态生成**参数列**（等宽居中、首行为参考、差异红字高亮），让参数级差异一目了然。
- 注：电学类（电压/芯数/截面/材质/型号）覆盖良好；部分简写（如端子 `TM10.5/5H`、螺钉 `8*25`）需在其 `tokens`/`patterns` 中补充对应正则才能提取，按上面两份配置即可扩展。

## 型号规格书写规范（基于头部企业命名方式）
特征参数不能凭空定义，须对齐各品类**头部企业的真实命名指纹**。项目已对全量物料做命名方式勘察（施耐德 NSX/iC65N、西门子 3WT/3RT、ABB ACS580、正泰 NXB/CM3、魏德米勒/菲尼克斯端子、宝胜/亨通电缆、国标 TMY 母排…），据此界定每个品类的特征参数与规范书写模板，并落地到提取配置：

| 品类（头部企业命名指纹） | 特征参数（按优先级） | 规范书写模板（示例） |
|---|---|---|
| 电缆/电线（宝胜/亨通/国标GB） | 型号, 额定电压, 芯数, 截面, 材质 | `YCW 450/750V 3×25+1×16` |
| 断路器（施耐德NSX/iC65N、西门子3WT、正泰NXB/CM3） | 型号, 极数, 额定电流, 额定电压 | `NSX100F 3P 100A` |
| 接触器/继电器（施耐德LC1D、西门子3RT、正泰CJX4） | 型号, 极数, 额定电流, 额定电压 | `LC1D170M7C` / `LRD-14C 7-10A` |
| 端子/连接器（魏德米勒/菲尼克斯） | 型号, 截面, 位数, 间距, 额定电流 | `UT 2.5` |
| 互感器（BH-0.66/CHL1） | 型号, 变比, 精度, 额定电压 | `BH-0.66 300/5 0.5级` |
| 电阻/电容 | 型号, 功率, 阻值/容值, 精度 | `RJ 1W 200KΩ` |
| 电抗器 | 型号, 额定电流, 额定电压, 电抗率 | `HKSG2-0.8 1600A 600V Uk=4%` |
| 信号器件/指示灯 | 型号, 额定电压, 颜色, 直径 | `AD11-22 220V 红` |
| 紧固件 | 型号, 螺纹, 长度, 材质, 头型, 表面处理, 标准 | `M6×35 不锈钢 六角 白锌 GB5783` |
| 母排/有色金属 | 型号, 材质, 截面, 直径 | `TMY 6×25` |
| 柜体/结构件 | 型号, 尺寸(宽×深×高) | `800×600×2200` |
| 保护器/熔断器 | 型号, 额定电压, 额定电流 | `RT28-63Z 63A` |

- **提取配置（两层可配、无需改代码）**：某小类提取哪些参数 → `src/config/dedup-rules.json` 的 `heuristics[].tokens`（或 `subOverrides[<小类>].tokens`，未命中品类回退 `defaultTokens`）；每个参数如何取值 → `src/config/spec-fields.json` 的 `library`（正则）。实现见 `src/struct-spec.js` + `src/classify.js`(`chooseTokens`)，`src/dedup.js` 在聚类时为每个成员附加 `params`。前端查重簇对比表动态生成**参数列**（等宽居中、首行为参考、差异红字）。
- **局限与扩展**：品牌系列代号（如 `NSX100F MA100`、`3RT`、`6ES7…`）的额定电流常内嵌于型号且无单位，需按品牌追加规则；端子间距(3.81mm)、部分简写仍待补充。新增品类参数只需在两份配置中追加条目。

## Web 可视化前端
零额外依赖（纯 Node 内置 http），可视化全流程与结果，支持人工复核与在线归并：
```bash
npm run server                  # 端口取 .env 的 PORT（默认 3000），被占用则报错退出
```
打开后包含四个视图：
1. **概览**：全流程阶段状态（提取→规格结构化/分类→强制查重→存量清洗）+ 关键指标卡 + 关键发现。
2. **一物多号查重**：按 置信度（高/低）、小类、关键词 筛选候选簇；点开簇可见各编码成员，一键「将其他编码映射到主编码」在线归并。
3. **分类树**：大类→中类→小类（含编码规则/单位/库房）。
4. **存量清洗**：新增/删除映射（映射法）、冻结（冷冻法）、查看统一物料视图（已归并项）。

后端 `src/server.js` 提供 REST 接口（`/api/overview` `/api/clusters` `/api/cluster` `/api/classification` `/api/mapping` `/api/unified`），
并支持后台重跑（`POST /api/run {stage:'extract'|'dedup'}` → 轮询 `/api/job?id=`）。


## 关键概念
- **分类**：物料编码 = 小类编码(前6位) + 5位流水。系统按前6位分组；编码规则文档只覆盖「生产物资(10/11/12)」，
  但 ERP 还含成品/半成品(70/80…)等，故分组键直接取 FNUMBER 前6字符（含字母），保证未收录前缀也能查重。
- **型号规格结构化**：`spec.js` 对名称/规格做 小写化、全角→半角、分隔符统一(/)、去空格 的归一化，
  使 `iC65N 1P C10A` 与 `iC 65N 1P C 10A` 折叠为同一签名。规则全在 `dedup-rules.json` 可改。
- **强制查重（一物多号）**：同小类内，签名相同的不同 FNUMBER 即「疑似一物多号」候选。
  - `confidence=high`：签名含规格差异（强证据，优先处理）
  - `confidence=low`：仅名称相同、规格为空（多为不同实物同名，待人工核查，勿直接合并）
- **一号多物**：同一 FNUMBER 存在多个 FMATERIALID（跨组织分发），通常为金蝶多组织正常机制，非冗余，仅作统计。

> 实测（全库 322,872 行）：已分类 322,663；一物多号候选 2,079 簇（高置信 624）；
> 型号规格为空 108,578 行（34%，数据质量重点）；已关联 PLM 物料ID = 0（PLM 联动字段未填，建议补全以从源头治理）。

## 存量清洗工作流（映射法 / 冷冻法）
1. 打开 `data/dedup-exact.csv`（已带 BOM，Excel 可直接筛 `confidence=high`），每个簇选一个主编码。
2. 记录映射：
   ```bash
   node src/cli.js mapping add <冗余编码> <主编码> --reason "同物(...)规格空格差异" --by <处理人>
   # 冻结不再使用的旧编码：
   node src/cli.js mapping freeze <旧编码> --reason "已被XXX替代"
   ```
3. 校验无环 / 主编码存在：`node src/cli.js mapping validate`
4. 生成统一视图：`node src/cli.js mapping build` → `data/unified-materials.json`
   （每个主编码聚合来源编码、名称、规格变体、使用组织数；`mergedFrom` 即被合并的旧编码）

映射关系存于 `data/mapping.json` / `data/freeze.json`，不写 ERP，待 PLM/ERP 管理员据此正式落库合并。

## 扩展：新增/调整查重口径
- 编码规则更新：改 `doc/*.xlsx` 后 `python scripts/gen_classification.py` 重建分类树。
- 某小类的关键属性（如电阻要按 阻值/精度/封装 查重）：编辑 `src/config/dedup-rules.json` 的
  `heuristics`（按小类名称关键字匹配）或 `subOverrides`（指定小类编码覆盖），无需改代码。

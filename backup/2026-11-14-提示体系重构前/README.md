# 提示体系重构前备份（2026-11-14）

用户反馈：名称与规格型号的校核提示过于杂乱，重构前的完整快照。

## 基线指纹

| 项 | 值 |
|---|---|
| 插件版本 | **v1.87** |
| 插件 SHA256（前 16） | `021D636186B468C1` |
| 备份时间 | 2026-11-14 |
| 对应提交 | 重构前最后一次提交 |

## 文件清单

| 文件 | 大小 | 作用 |
|---|---:|---|
| `ItemSmartInput.js` | 201,416 B | 插件主体（提示渲染全在这里） |
| `ItemSmartInput.config.js` | 9,743 B | 插件配置（apiBase / autoSync / plmQueryTimeout） |
| `naming-guide.json` | 262,629 B | 命名范式库（209 个小类的 specPattern / fields / example） |
| `material-rules.json` | 7,775 B | 校验规则（error / warn 两级，含文案模板） |
| `select-field-alias.json` | 1,926 B | 选型库列名 → 范式字段的别名表 |
| `material-rules.js` | 24,326 B | 规则引擎（checkName / checkSpec / suggestSpec） |
| `app.js` | 157,643 B | 治理看板前端（也有一套提示渲染） |

## 回滚方法

```bash
cd /opt/Plm_Code   # 或开发机项目根

# ① 单文件回滚（推荐，改动更可控）
cp backup/2026-11-14-提示体系重构前/ItemSmartInput.js \
   PLMSOFT/Server/SecondaryDev/ItemSmartInput/Config/Js/ItemSmartInput.js

# ② 全部回滚
cp backup/2026-11-14-提示体系重构前/ItemSmartInput.js PLMSOFT/Server/SecondaryDev/ItemSmartInput/Config/Js/
cp backup/2026-11-14-提示体系重构前/ItemSmartInput.config.js PLMSOFT/Server/SecondaryDev/ItemSmartInput/Config/
cp backup/2026-11-14-提示体系重构前/naming-guide.json src/config/
cp backup/2026-11-14-提示体系重构前/material-rules.json src/config/
cp backup/2026-11-14-提示体系重构前/select-field-alias.json src/config/
cp backup/2026-11-14-提示体系重构前/material-rules.js src/
cp backup/2026-11-14-提示体系重构前/app.js public/

# ③ 重启 3100 + 3130，插件 Ctrl+F5
```

回滚后需确认：

- 插件标题栏显示 `V 1.87`
- `__plmProbe.env()` 的 `timeoutMs` 为 `180000`

## 重构时的约束

以下行为在重构中**不能丢失**（已有回归用例覆盖）：

| 约束 | 用例 |
|---|---|
| 选型助手无数据时禁用 | S40 |
| 名称不回填，只回填规格型号 | 「名称不回填（保留用户原文）」 |
| 提示块在规格框下方，异步加载不漂移 | 布局断言 |
| 服务状态在标题栏徽标 | 「服务正常时标题栏徽标显示…」 |
| 查重结果标注来源（ERP 历史才标） | 见 `renderTips` |

# PLM 物料录入助手 · 「主要参数」保存丢失 排查与修复记录

> 记录日期：2026-11-18
> 涉及插件版本：2.23 → 2.25
> 相关提交：`ecbbad7`（第一轮）、`e178a04`（第二轮）、`2045a0a`（第三轮，生效）
> 结论状态：**已修复并经现场验证成功**

---

## 0. 一句话结论

向导建料（电气元件/原材料/外购标准件）时，物料保存后的「主要参数」**不是**取自第 1 页的「主要参数(ZYCS)」控件，
而是取自第 2 页业务表单的「分类属性合并(FLSXHB)」输入框。此前插件把助手参数写进了第 1 页 ZYCS（展示镜像），
却把 FLSXHB 写成了规格型号，导致参数从未到达真实载体。第三轮修复把参数直接写入 FLSXHB 后现场验证成功。

---

## 1. 现象与时间线

| 时间 | 现象 | 处理 |
|---|---|---|
| 上午 | 选型助手报 `TypeError: Cannot read properties of undefined (reading 'params')` | 定位为 PLM 服务器后端为旧版（`select` 不返回 params）；提供部署清单，用户部署后回填恢复正常 |
| 中午 | 向导走完第 2/3 页保存后，「主要参数」被占位文字「填写分类属性后合并自动生成」覆盖 | 第一轮修复（包装平台函数 + 保存兜底），提交 `ecbbad7` |
| 下午 | 用户反馈「还是丢失」，控制台出现平台向导报错，且出现表单重建痕迹 | 第二轮修复（作用域记忆 + 轮询自愈 + 三处覆盖点全包装），提交 `e178a04` |
| 下午（后续） | 仍丢失。用户做了 **1111 标记实验**：在第 2 页「分类属性合并」原有内容后追加 1111，保存后该值原样出现在物料「主要参数」里 | 第三轮修复（参数直写真实载体 FLSXHB），提交 `2045a0a` |
| 收尾 | 用户确认「成功了」 | 完成 |

前两轮方向偏差的根因：**只依据「主要参数」这个界面标签就假定 ZYCS 控件是保存载体，没有先验证保存链路的实际取值来源**。

---

## 2. 关键现场证据

### 2.1 控制台日志（第二轮现场）

```
[ItemSmartInput] ZYCS 控件按 DOM 定位（INPUT）
当前类型: value="电气元件" text="电气元件" 允许表=["电气元件","原材料","外购标准件"] → 允许
按钮已点击（平台容器）
规格补全已绑定: guid276_TextBox
选型查询 series=3WT智能空气断路器选型手册 filter=[]
选型结果 total=156 returned=156
已回填 主要参数(ZYCS) 并置只读（122 字符）
PLM 库存查询未返回数据: 100105002265
已回填 主要参数(ZYCS) 并置只读（122 字符）
弹窗回填完成：名称、规格型号、主要参数
已回填 分类属性合并(FLSXHB) <= 规格型号（上限 100 字符）   ← 关键疑点①：载体被写成规格
当前类型: value="" text="" → 不允许
检测到新增弹窗（DOM 兜底接管）：规格=guid0802_TextBox[规格型号/图号]
  名称=guid4683_TextBox[名称*] 编号=guid4678_TextBox[编号*] 类型=guid4673_DropDown[类型*]
当前类型: value="电气元件" text="电气元件" → 允许            ← 关键疑点②：类型控件重新初始化（表单被重建）
已注入「智能录入」按钮（位置: left）
✖ Cannot read properties of undefined (reading 'GetPara')
    InforCenter_Platform_GuideManagement_ExecPreStep
    InforCenter_Platform_GuideManagement_SetpChange
    InforCenter_Platform_GuideManagement_Button_Pre
    HoteamUI_PageEvent_GuideManagementGuideManagement_Button_PreOnClick
    HoteamUI_Common_ExeFunction
```

两个关键疑点：
1. **载体被写成规格**：第 2 页加载时 `分类属性合并(FLSXHB) <= 规格型号`，而助手参数只写进了第 1 页 ZYCS。
2. **表单被重建**：`当前类型 value="" → "电气元件"` 是第 1 页表单被销毁后重新初始化的痕迹；`ExecPreStep → GetPara` 的
   平台异常表明「上一步」的框架回放链中断。

### 2.2 决定性证据：1111 标记实验

用户在第 2 页「设计属性」的「分类属性合并」框中，于已有内容后追加 `1111`：

```
原值：3WT11N04 4P LSI/LSIG400A 55kA 500V
改后：3WT11N04 4P LSI/LSIG400A 55kA 500V1111
```

保存后，物料的「主要参数」= `3WT11N04 4P LSI/LSIG400A 55kA 500V1111`（含手改标记，原样落库）。

**结论：向导 finish 时，平台把第 2 页 FLSXHB 的内容写入物料的主要参数。第 1 页 ZYCS 控件不参与保存。**

---

## 3. 系统机制调研（代码依据）

### 3.1 向导容器：平台 GuideManagement

`PLMSOFT/Server/Platform/Config/Pages/Common/GuideManagement.page`

- 第 5–6 行：页面级钩子 —— `OnCreate → InforCenter_Platform_GuideManagement_PageOnCreate(pageEvent)`、
  `OnDialogCloseClick → InforCenter_Platform_GuideManagement_PageOnClose(pageEvent)`。
- 第 75 行：步骤页容器 `GuideManagement_Page`，类型 `Tabs`（步骤页动态加载、可被销毁重建）。
- 第 125–150 行：四个按钮 —— `Button_Pre`（上一步）、`Button_Next`（下一步）、`Button_Finish`（完成）、`Button_Cancel`。
  其中「上一步」的 OnClick = `InforCenter_Platform_GuideManagementButton_Pre(ctrlEvent)`，即现场报错栈的入口。

向导三步：基本信息（`PSEITEM-CREATE`）→ 设计属性（随类型不同，如 `PSEITEMCISFORM-CREATE`）→ 分类信息。

### 3.2 第 1 页契约：PSEITEM-CREATE

`PLMSOFT/Server/AutoGenerator/Config/Pages/PSEITEM-CREATE.page`

- 第 7–92 行 `OnCreate`：原生逻辑先执行（读初始化数据、逐字段 SetText，其中第 86–91 行会 `c.SetText(data.ZYCS)`），
  **第 92 行才是插件扩展点**：`var functionName='InforCenter_PSEITEM_CreatePage_OnCreate'; if (window[functionName]) return window[functionName](pageEvent,data);`
  → 插件对该函数是「原生脚本主动调用的扩展点」，不是覆盖，页面初始化不受影响。
- 第 93–137 行 `OnGetDataFromPage`：收集本页数据，**第 132–136 行 `data.ZYCS = c.GetText().trim()`**（从 ZYCS 控件读）。
- 第 138 行 `OnSaveCheck`：调用 `InforCenter_PSEITEM_CreatePage_OnOK`（插件扩展点）。
- 第 198–205 行：`ITEMTYPE_Value` 的 `OnChange` → `InforCenter_Platform_GenerateScript_SubDataModelValue(ctrlEvent)`，
  这是二开类型联动函数（见 3.4）的触发源。

### 3.3 第 2 页契约：业务表单

以电气元件为例 `PLMSOFT/Server/AutoGenerator/Config/Pages/PSEITEMCISFORM-CREATE.page`：

- 第 7–96 行 `OnCreate`：原生逻辑中**第 50–53 行 `c.SetText(data.FLSXHB)`**；第 96 行为插件扩展点
  `InforCenter_PSEITEMCISFORM_CreatePage_OnCreate`。
- 第 97–180 行 `OnGetDataFromPage`：**第 134–138 行 `data.FLSXHB = c.GetText().trim()`**。
- 第 181 行 `OnSaveCheck`：调用 `InforCenter_PSEITEMCISFORM_CreatePage_OnOK`（插件此前未挂，第三轮补挂）。
- 第 467–473 行：`FLSXHB_Value` 字段定义，**正则 `^([\s\S]{0,100})?$`，上限 100 字符（STRING100）**。
- 本页**没有 ZYCS 控件**；三个业务页（CIS/FIXTURE/STANDARD）结构同源，均只有 FLSXHB。
- 插件代码注释（`ItemSmartInput.js` 第 614 行附近）早已写明「三个业务页面都没有 ZYCS，主要参数在界面上就是 FLSXHB」——
  但第一、二轮修复仍只盯 ZYCS，这是方向偏差的代码级证据。

### 3.4 二开的三处占位文字覆盖

`PLMSOFT/Server/TSDC/PSE/Js/PSEItem.js`（只读调研，未改动）：

| 行号 | 函数 | 行为 |
|---|---|---|
| 72–95 | `InforCenter_PSEITEM_ITEMTYPE_SubDataModelValue` | ITEMTYPE 变化时，若类型属于 `CreateItemGGXHCanNotEditType`（原材料/电气元件/外购标准件）→ `zycsCtrl.Disable()` + `SetText("填写分类属性后合并自动生成")`；否则 Enable，且若当前值是占位文字则清空 |
| 116–124 | `InforCenter_PSE_ItemGuide_Init` | 向导初始化（`curpage.PageName()=="PSEITEM-CREATE"`）时同样写入占位文字 |
| 133–142 | `InforCenter_PSEITEM_EditPage_OnCreate` | 编辑页打开时同样写入占位文字（会把已存储的主要参数顶掉） |

占位文字常量在插件中为 `ZYCS_PLACEHOLDER = '填写分类属性后合并自动生成'`（`ItemSmartInput.js:373`）。

### 3.5 表单销毁与重建链路（参数丢失的直接成因）

`PSEItem.js:195–205` `InforCenter_PSE_ItemGuide_CreateItemFormInit`：

```js
var para = curpage.GetPara();
HoteamUI.UIManager.Close(curpage.GetControl("BaseInfoContainer").id, {});   // 销毁第 1 页表单
var pageControl = curpage.GetControl("ItemFormPageContainer");
if (prePage) {
    var prePara = prePage.GetPara();
    var itemType = prePara.Data.ITEMTYPE;
    if (prePara.ReloadNext) {
        pageControl.LoadPage(itemType + "-CREATE", { ObjectType: itemType });  // 加载第 2 页业务表单
    }
}
```

即：**「下一步」会 Close 第 1 页表单**，第 1 页 ZYCS 的 DOM 随之销毁；返回时由框架回放数据重建。
现场实测「上一步」的回放链 `GuideManagement ExecPreStep` 读取 `GetPara` 时抛 `undefined`
（栈中无任何插件帧），回放中断 → 第 1 页以空值重建（`当前类型 value=""` 即重建痕迹），
并再次触发 3.4 的三处占位文字覆盖，同时重建页的 `OnCreate` 会清空插件 `fillMark`。

### 3.6 保存数据流（修正后的正确认知）

```
第 1 页 PSEITEM-CREATE
  ZYCS 控件  ─── 仅展示镜像（表单会被销毁重建，不参与最终保存）✗
  GGXH 控件  ─── 规格型号 → 保存为物料规格 ✓

第 2 页 PSEITEMCISFORM-CREATE（电气元件）
  FLSXHB 控件（分类属性合并，STRING100）
        └── 平台 finish 时写入物料「主要参数(ZYCS)」 ✓  ← 真实载体（1111 实验证实）
```

### 3.7 现场配置差异（前两轮未察觉）

`PLMSOFT/Server/SecondaryDev/ItemSmartInput/Config/ItemSmartInput.config.js:78`

```js
fillSpecToParams: true,     // 规格同步到 主要参数(ZYCS) / 分类属性合并(FLSXHB)
```

插件内置默认是 **false**，现场配置把它打开了。后果：
- 规格每次输入/回填都会 `syncSpecToParams → syncFlsxhb(spec)`，把规格写进 FLSXHB；
- 第 2 页加载时 `PSEITEMCISFORM OnCreate` 钩子同样执行 `syncFlsxhb(spec)` → **载体被规格占用**。

因此即便参数正确写进了第 1 页 ZYCS，真实载体 FLSXHB 里装的仍是规格（或空/占位），
保存后主要参数自然不是用户要的参数。

---

## 4. 修复实施（三轮）

> 全部改动集中在插件侧，未修改任何平台/二开文件（`PSEItem.js`、`*.page` 均只读调研）。

### 4.1 第一轮（提交 `ecbbad7`）：防占位文字覆盖

动机：现场最初只看到「主要参数被占位文字覆盖」。

| 改动 | 位置（`ItemSmartInput.js`） |
|---|---|
| 包装 `InforCenter_PSEITEM_ITEMTYPE_SubDataModelValue`：调用前记住 ZYCS 有效值，平台逻辑执行后若被占位文字/清空覆盖则立即写回 | `guardZycsFromPlaceholder`（现 832 行） |
| 平台脚本晚于插件加载时 500ms × 40 重试包装（幂等） | 安装 IIFE（文件尾部） |
| 向导翻页重建 DOM 后，缓存控件脱离文档即清缓存重新定位 | `invalidateStaleZycs`（现 875 行） |
| 保存前兜底 `restoreZycsBeforeSave`：占位文字/空 + 助手写过值 → 写回 | 891 行；挂在 `wrapGuideFn`（999 行）与 `CreatePage_OnOK`（3949 行） |

第一轮无效的原因：它只防「覆盖瞬间」，无法对抗 3.5 的**整表销毁重建**（重建后 `fillMark` 被清空、空表单再被写占位文字）。

### 4.2 第二轮（提交 `e178a04`）：作用域记忆 + 轮询自愈

动机：控制台证明表单被重建、框架回放中断，第一轮的局部状态（`fillMark`）全部失效。

| 改动 | 位置 | 说明 |
|---|---|---|
| 作用域记忆 | `scopeElOf`（710）、`writeParamMemory/readParamMemory`（726/733） | 把助手写入值记到「向导对话框根节点」（控件向上最外层 `[pagepagename]` 祖先）的 `__plmSmartZycs` 槽位；TTL 2 小时 |
| 轮询自愈 | `healParamsIfWiped`（776），挂在 `watchDialog` 的 800ms `tick`（4463 行） | 占位文字/空 + 记忆存在 → 写回 |
| 三处覆盖点全包装 | `guardZycsFromPlaceholder`（832） | 补 `ItemGuide_Init`、`EditPage_OnCreate` |
| 向导开/关清记忆 | `installZycsMemoryHooks`（913） | 链式包装 `InforCenter_Platform_GuideManagement_PageOnCreate/PageOnClose`，防跨单据串场 |
| 版本 | `PLUGIN_VERSION` 2.23 → 2.24 | 现场可用 `__plmVersion` 确认部署 |

第二轮仍无效的根因：自愈恢复的是**第 1 页 ZYCS 镜像**——而保存根本不读它（3.6 结论尚未得出）。

### 4.3 第三轮（提交 `2045a0a`，生效）：参数直写真实载体 FLSXHB

动机：1111 实验（2.2）确认 FLSXHB 才是保存载体。

| 改动 | 位置 | 说明 |
|---|---|---|
| 新增 `writeParamsToFlsxhb` | 501 行 | 助手参数 → FLSXHB；不置灰（保留手工微调）；超 100 字符截断并记日志；用户已手改的值不覆盖；成功后写 `__plmSmartFlsxhb` 记忆 |
| `syncParamsToZycs` 的 FLSXHB 分支委托 | 556 行 | 去掉置灰，统一走真实载体写入器 |
| 业务页 `OnCreate` 参数优先 | `bizFormOnCreate` 3914 行；三页挂接 3929–3931 | 先自愈；有参数写参数；无参数且 `fillSpecToParams` 开才规格桥接（老行为兜底） |
| 业务页 `OnOK` 最后时刻自愈 | `bizFormOnOK` 3937 行；三页挂接 3941–3943 | 平台顺序 OnSaveCheck → OnGetDataFromPage，恢复值会进保存报文 |
| 规格防覆盖 | `syncFlsxhb` 464 行开头 | 载体已是助手参数时，规格晚到（输入事件/桥接）一律跳过 |
| CreatePage OnOK 兜底块参数优先 | 3976–3988 | 有参数写参数，无参数才规格 |
| 记忆双槽位 + 手改同步 | 726/733/776 | `__plmSmartZycs`（镜像）/`__plmSmartFlsxhb`（载体）；载体被手改时以手改值回写记忆 |
| 调试句柄 | 4518 行 | `window.__plmSmartZycsMem = { write, read, writeFlsxhb, readFlsxhb, sync, heal }` |
| 版本 | 2.24 → 2.25 | 现场 `__plmVersion` 确认 |

---

## 5. 修复后的完整数据流

```
[第 1 页] 智能录入弹窗「保存并回填」
  ├─ 名称 → ENAME
  ├─ 规格型号 → GGXH
  └─ 主要参数 → syncParamsToZycs
        ├─ ① ZYCS（第 1 页展示镜像，置灰只读）
        └─ ② FLSXHB（真实载体，不置灰；此时节点可能不存在，跳过）

[下一步] 第 2 页业务表单加载（CIS/FIXTURE/STANDARD）
  └─ bizFormOnCreate
        ├─ healParamsIfWiped()（框架回放中断则先自愈）
        ├─ 有助手参数 → writeParamsToFlsxhb（参数优先，写入载体）
        └─ 无参数 → syncFlsxhb(spec)（规格桥接，老行为）
  └─ 用户在「分类属性合并」手工微调 → 后续任何自动逻辑都不覆盖，且记忆以手改值为准

[完成/保存]
  └─ bizFormOnOk → healParamsIfWiped()（最后时刻兜底）
  └─ 平台 OnGetDataFromPage 收集 data.FLSXHB
  └─ 平台把 FLSXHB 写入物料「主要参数」 ✓
```

---

## 6. 验证

### 6.1 自动化回归

`npm run verify:plm`（`scripts/verify-plm-plugin.mjs`，104 项全部通过）：

| 场景 | 断言 |
|---|---|
| S41（1249 行） | 平台类型联动函数被包装 / 联动触发后主要参数自动写回 / 绕过包装的占位文字在 OnOK 恢复 |
| S42（1285 行） | 作用域记忆写入 / 占位覆盖自愈 / 真实业务值不被破坏 / 空值自愈 / 记忆清空后不串场 |
| S43（1337 行） | 参数写入载体并截断到 100 字符 / 业务页 OnCreate 后载体仍为参数（不被规格覆盖）/ 用户手改保留 / 无参数时规格桥接兜底 |

测试框架配套改动：`mkEl` 增加 `isConnected`、`getAttribute/setAttribute`；`newPage` 增加 `HoteamUI.Page.InstanceByName`（使 `findFormPage`/`flsxhbCtl` 在沙箱中可用）。

其他校验：`npm run validate` PASS；`npm run verify:blueprint` 蓝图与代码一致。

### 6.2 现场验证步骤（已成功）

1. 同步 `ItemSmartInput.js` 到 PLM 服务器，浏览器 Ctrl+F5（必要时回收应用池）；
2. 控制台 `__plmVersion` 应为 `2.25`，加载日志出现「已包装 ×3」「已挂接 GuideManagement_PageOnCreate/PageOnClose」；
3. 向导第 1 页选型回填 → 下一步 → 第 2 页「分类属性合并」应显示**参数内容**（不再是规格），
   控制台出现「已回填 分类属性合并(FLSXHB) <= 助手主要参数」；
4. 保存后检查物料「主要参数」= 载体内容（含用户手工微调）。

### 6.3 现场排查命令

```js
// 版本确认
__plmVersion

// 记忆与自愈状态（write/read=ZYCS 镜像；writeFlsxhb/readFlsxhb=FLSXHB 载体）
__plmSmartZycsMem.read()
__plmSmartZycsMem.readFlsxhb()
__plmSmartZycsMem.heal()          // 手动触发一次双字段自愈

// 查看载体控件当前值
document.querySelector('[cid="FLSXHB_Value"] input, [cid="FLSXHB_Value"] textarea')?.value
```

---

## 7. 已知限制与遗留

### 7.1 FLSXHB 字段宽度（100 字符）

「分类属性合并」为 STRING100（`PSEITEMCISFORM-CREATE.page:467-473`），参数超 100 字符时只能截断写入，
截断值在步骤 2 可见、可手工补全，日志会提示「主要参数 N 字符 > 分类属性合并上限 100，已按上限写入」。

要让长参数完整落库，可选方案（未实施）：后端针对业务类物料（电气元件/原材料/外购标准件）额外产出
≤100 字符的精简参数串（保留型号 + 关键特征），前端优先使用该精简串写载体。

### 7.2 平台「上一步」异常（未修）

`InforCenter_Platform_GuideManagement_ExecPreStep` 读 `GetPara` 抛 `undefined`：
- 调用栈为纯平台链路，无插件帧，插件无法安全修补（不宜包装平台导航逻辑）；
- 推测与二开 `CreateItemFormInit` 中 `Close(BaseInfoContainer)` 销毁第 1 页表单后的框架回放有关（待验证）；
- 影响：点「上一步」会中断回放，第 1 页表单以空值重建。插件现已通过作用域记忆 + 自愈补齐参数，
  但**同一页的名称/规格等手工填写内容仍可能丢失**（它们没有记忆）。
- 定性方法（A/B）：临时停用插件（将 `ItemSmartInput.js` 改名或移除引用）后重试「上一步」——
  仍报错 = 平台/二开自身问题；不报错 = 插件 DOM 注入引发，需进一步分析。

### 7.3 部署与缓存

- 插件为浏览器脚本，更新后必须 Ctrl+F5 强刷；若平台以 XHR+eval 方式加载，还需回收应用池；
- `ItemSmartInput.config.js` 中的 `fillSpecToParams: true` 现场保持开启（规格桥接兜底仍需要它），
  但已确保「有助手参数时规格不覆盖载体」。

### 7.4 经验教训

1. **先验证载体，再写防护**：界面标签（「主要参数」）不等于存储路径，先用最小实验（如 1111 标记）确认
   数据从哪个控件进入保存报文，避免在错误对象上连做两轮无效修复。
2. **现场配置优先于代码默认值**：`fillSpecToParams` 默认 false、现场为 true，这一差异直接改变了症状形态，
   排查应先读现场 `ItemSmartInput.config.js` 与控制台「外部配置=…」。
3. **向导页面会被销毁重建**：任何只存在 DOM 或闭包局部状态的值都必须有「作用域记忆 + 自愈」，
   生命周期以向导对话框为单位，且必须有清理机制（开/关钩子 + TTL）防止跨单据串场。
4. **日志要能自证**：插件关键动作（包装、写回、自愈、载体写入）都应有可检索的日志文本，
   现场截图即可判断代码是否生效、走到了哪条分支。

---

## 8. 附录

### A. 关键代码位置索引（`PLMSOFT/Server/SecondaryDev/ItemSmartInput/Config/Js/ItemSmartInput.js`，v2.25）

| 行号 | 符号 | 作用 |
|---|---|---|
| 44 | `PLUGIN_VERSION` | 版本号（当前 2.25） |
| 373 | `ZYCS_PLACEHOLDER` | 二开占位文字常量 |
| 464 | `syncFlsxhb` | 规格 → FLSXHB（桥接；载体已是参数时跳过） |
| 501 | `writeParamsToFlsxhb` | 助手参数 → FLSXHB（真实载体） |
| 531 | `syncSpecToParams` | 规格变化统一入口 |
| 556 | `syncParamsToZycs` | 主要参数回填入口（ZYCS 镜像 + FLSXHB 载体） |
| 614 / 654 | `flsxhbCtl` / `zycsCtl` | 控件三级解析（页面控件 → 页面实例 → DOM 按 cid） |
| 710–750 | `scopeElOf` / `writeParamMemory` / `readParamMemory` | 作用域记忆（双槽位） |
| 776 | `healParamsIfWiped` | 双字段自愈 |
| 832 | `guardZycsFromPlaceholder` | 三处覆盖点包装 |
| 875 | `invalidateStaleZycs` | 重建后缓存失效检测（ZYCS + FLSXHB） |
| 891 | `restoreZycsBeforeSave` | 保存前兜底 |
| 913 | `installZycsMemoryHooks` | 向导开/关清记忆 |
| 3914–3943 | `bizFormOnCreate` / `bizFormOnOK` + 三页挂接 | 业务页参数优先与最后时刻自愈 |
| 4463 | `tick` 内自愈调用 | 800ms 轮询 |
| 4518 | `__plmSmartZycsMem` | 现场排查句柄 |

### B. 日志对照表

| 日志文本 | 含义 | 出现即说明 |
|---|---|---|
| `已包装 <函数名>，防止主要参数被占位文字覆盖` | 三处覆盖点包装成功 | 2.24+ 已加载 |
| `已挂接 InforCenter_Platform_GuideManagement_PageOnCreate/PageOnClose` | 向导生命周期钩子挂上 | 2.24+ 已加载 |
| `已回填 分类属性合并(FLSXHB) <= 助手主要参数` | 参数写入真实载体 | **第三轮修复生效** |
| `主要参数 N 字符 > 分类属性合并上限 100，已按上限写入` | 载体截断写入 | 参数过长（见 7.1） |
| `分类属性合并已写入助手主要参数，跳过规格桥接` | 规格防覆盖生效 | 正常保护 |
| `分类属性合并已有值（用户已填/已手改），不覆盖` | 手改保护生效 | 正常保护 |
| `自愈恢复 主要参数(ZYCS)/分类属性合并(FLSXHB)` | 表单重建后自愈 | 向导异常路径的兜底 |
| `主要参数被平台占位文字覆盖，已自动写回` | 覆盖瞬间拦截 | 类型联动触发 |

### C. 提交清单

| 提交 | 说明 |
|---|---|
| `3ffe7c4` | （前序）ZYCS 控件延迟渲染导致取不到引用，改用按需重取 + DOM 定位 |
| `ecbbad7` | 第一轮：包装类型联动，防占位文字覆盖 |
| `e178a04` | 第二轮：向导重建表单的作用域记忆 + 800ms 自愈 + 三处覆盖点全包装 |
| `2045a0a` | 第三轮：主要参数改写真实载体 FLSXHB（生效） |

> 以上提交均为本地提交，push 由人工执行。

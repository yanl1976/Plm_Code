# 备份说明：2026-11-10 第一步改造前

> 用途：把「前端剩余规则/阈值搬到服务端」这一步改动前的文件留档，出问题可逐文件回退。
> 备份方式：原样复制（保留目录结构），未做任何改写。

## 一、备份清单（基线指纹）

| 文件 | 大小(字节) | 行数 | SHA256（前 12 位） |
|---|---|---|---|
| `PLMSOFT\Server\InforCenter\Config\PLMFileRef.fileref` | 2,568 | 31 | `A458615843C3` |
| `PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\Js\ItemSmartInput.js` | 96,775 | 2,180 | `A8D2CEE692FA` |
| `PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\ItemSmartInput.config.js` | 2,812 | 48 | `B244444FF942` |
| `PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\ItemSmartInput.fileref` | 1,046 | 17 | `9A77EA806471` |
| `src\plm-server.js` | 13,980 | 362 | `1AD004655FA6` |
| `src\plm-index.js` | 11,540 | 329 | `52E39F53D6CF` |
| `src\material-rules.js` | 21,812 | 474 | `D029153DA60A` |
| `src\config\material-rules.json` | 7,834 | 267 | `770C2871FAD5` |
| `scripts\verify-plm-plugin.mjs` | 25,010 | 647 | `2F267D623B1A` |

## 二、本次改造范围（第一步）

| 文件 | 改动 | 是否需部署 |
|---|---|---|
| `src/config/material-rules.json` | 新增 `plm` 段：字段长度上限 + 类型白名单 | **是**（重启治理服务） |
| `src/plm-server.js` | 新增 `GET/POST /api/plm/meta` 下发上面两项 | **是**（重启治理服务） |
| `ItemSmartInput.js` | 启动时拉 `/api/plm/meta`，覆盖内置阈值与类型白名单；取不到则用默认值 | **是**（覆盖 + Ctrl+F5） |
| `scripts/verify-plm-plugin.mjs` | 新增 S19 | 否 |

> 前端仍保留同名默认值，仅作为服务不可达时的兜底；**业务口径以服务端 `material-rules.json` 的 `plm` 段为准**。

## 三、回退步骤

### 1) 回到改造前（全部回退）

```powershell
$bak = 'E:\tedri_project\dev\Plm_Code\backup\20261110_step1'
$root = 'E:\tedri_project\dev\Plm_Code'

Copy-Item "$bak\src\plm-server.js"            "$root\src\" -Force
Copy-Item "$bak\src\plm-index.js"             "$root\src\" -Force
Copy-Item "$bak\src\material-rules.js"        "$root\src\" -Force
Copy-Item "$bak\src\config\material-rules.json" "$root\src\config\" -Force
Copy-Item "$bak\scripts\verify-plm-plugin.mjs"  "$root\scripts\" -Force

Copy-Item "$bak\PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\Js\ItemSmartInput.js" `
          "$root\PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\Js\" -Force
Copy-Item "$bak\PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\ItemSmartInput.config.js" `
          "$root\PLMSOFT\Server\SecondaryDev\ItemSmartInput\Config\" -Force
Copy-Item "$bak\PLMSOFT\Server\InforCenter\Config\PLMFileRef.fileref" `
          "$root\PLMSOFT\Server\InforCenter\Config\" -Force
```

### 2) 重启治理服务

```powershell
# 找到 3100 的进程并重启
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3100 -State Listen).OwningProcess -Force
Start-Process node -ArgumentList 'src/plm-server.js' -WorkingDirectory 'E:\tedri_project\dev\Plm_Code' -WindowStyle Hidden
```

### 3) 服务器侧（如果已部署）

- 覆盖 `<站点>\InforCenter\Config\ItemSmartInput\ItemSmartInput.js` 为备份中的同名文件
- 浏览器 Ctrl+F5

### 4) 验证回退成功

```powershell
Get-FileHash 'src\plm-server.js' -Algorithm SHA256          # 应回到 1AD004655FA6...
Invoke-RestMethod 'http://127.0.0.1:3100/api/plm/meta'      # 回退后应报 404/无此路由
```

## 四、仅回退某一项

- **只想关掉服务端配置下发**：把 `material-rules.json` 里的 `plm` 段删掉，接口会返回内置默认值，前端行为不变。
- **只想让前端用回硬编码**：把 `ItemSmartInput.js` 里 `loadMeta();` 一行注释掉。
- **只想回退服务端**：还原 `plm-server.js` + `material-rules.json` 并重启；前端会打印「服务端治理配置未取到，沿用内置默认值」，功能不受影响。

## 五、注意

- 备份只覆盖仓库内文件；**服务器上 `InforCenter\Config\ItemSmartInput\ItemSmartInput.js` 需另行备份**（本机仓库无该目录）。
- `PLMFileRef.fileref` 是平台文件，升级 PLM 时可能被整体覆盖，届时需重新追加插件的两行。

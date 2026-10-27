/**
 * 系统设置：可配置项集中管理。
 * 当前支持：
 *   - materialPrefix（物料编码前缀过滤）：
 *       include（白名单）仅提取这些前缀；exclude（黑名单）在 include 结果上再剔除。
 *       默认仅提取生产物资 10/11/12 开头的物料（排除 20/80 成品/半成品等）。
 *   - screenOrg（筛查组织）：仅提取「使用组织 FUSEORGID」为该组织的物料；默认 天水电传。
 *       为空字符串 = 不过滤（全部组织）。
 *
 * 落盘：src/config/settings.json（gitignore 不忽略，属于可提交配置）。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'src', 'config', 'settings.json')

const DEFAULTS = {
  materialPrefix: {
    include: ['10', '11', '12'], // 仅提取这些前缀（空数组=全部）
    exclude: [],                // 额外排除的前缀
  },
  screenOrg: '天水电传',        // 筛查组织（按使用组织 FUSEORGID 过滤）；'' = 全部
}

// 仅允许字母数字，防止 SQL 注入 / 误配置
const cleanPrefix = (p) => String(p).trim().replace(/[^0-9A-Za-z]/g, '').slice(0, 10)

export function loadSettings() {
  let s = { materialPrefix: { ...DEFAULTS.materialPrefix }, screenOrg: DEFAULTS.screenOrg }
  if (fs.existsSync(FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'))
      if (raw && raw.materialPrefix) s.materialPrefix = { ...s.materialPrefix, ...raw.materialPrefix }
      if (raw && typeof raw.screenOrg === 'string') s.screenOrg = raw.screenOrg
    } catch (e) { /* 损坏则回退默认 */ }
  }
  s.materialPrefix.include = (s.materialPrefix.include || []).map(cleanPrefix).filter(Boolean)
  s.materialPrefix.exclude = (s.materialPrefix.exclude || []).map(cleanPrefix).filter(Boolean)
  s.screenOrg = (s.screenOrg || '').trim()
  return s
}

export function saveSettings(input) {
  const cur = loadSettings()
  const mp = (input && input.materialPrefix) || {}
  if (Array.isArray(mp.include)) cur.materialPrefix.include = mp.include.map(cleanPrefix).filter(Boolean)
  if (Array.isArray(mp.exclude)) cur.materialPrefix.exclude = mp.exclude.map(cleanPrefix).filter(Boolean)
  if (typeof (input && input.screenOrg) === 'string') cur.screenOrg = input.screenOrg.trim()
  fs.mkdirSync(path.dirname(FILE), { recursive: true })
  fs.writeFileSync(FILE, JSON.stringify(cur, null, 2), 'utf8')
  return cur
}

// 构造 SQL WHERE 片段（针对 T_BD_MATERIAL.FNUMBER 前缀），无过滤时返回空串。
export function prefixSqlCondition() {
  const { include, exclude } = loadSettings().materialPrefix
  const conds = []
  if (include.length) conds.push('(' + include.map((p) => `m.FNUMBER LIKE N'${p}%'`).join(' OR ') + ')')
  for (const p of exclude) conds.push(`m.FNUMBER NOT LIKE N'${p}%'`)
  return conds.length ? ' AND ' + conds.join(' AND ') : ''
}

// 将「组织名称」解析为组织 FORGID（用于 FUSEORGID 过滤）。
// 精确匹配优先，其次模糊匹配；找不到返回 null（调用方据此跳过过滤并告警）。
export async function resolveOrgId(name, executeQuery) {
  if (!name) return null
  const rows = await executeQuery(`
    SELECT TOP 1 o.FORGID, ol.FNAME
    FROM T_ORG_ORGANIZATIONS o
    LEFT JOIN T_ORG_ORGANIZATIONS_L ol ON ol.FORGID = o.FORGID AND ol.FLOCALEID = 2052
    WHERE ol.FNAME = @name OR ol.FNAME LIKE @like
    ORDER BY CASE WHEN ol.FNAME = @name THEN 0 ELSE 1 END
  `, { name, like: '%' + name + '%' })
  return rows[0] ? { id: rows[0].FORGID, name: rows[0].FNAME } : null
}

/**
 * 物料全量提取。
 * 目标：初步提取 ERP 中所有物料基本信息，重点：编码/名称/型号规格/技术参数/单位/备注，
 *       同时保留全部可用字段，供后续分类与查重使用。
 * 输出：
 *   data/materials.ndjson   每行一个物料 JSON（供下游流式处理，避免一次性载入内存）
 *   data/materials.csv      聚焦列（人读/Excel 复核）
 *   data/stats.json         总量、唯一编码数、按组织副本数、按小类分布等
 *
 * 采用 keyset 分页（按 FMATERIALID 游标），避免 OFFSET 大偏移性能问题。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { executeQuery, getPoolConnection, sql } from './db.js'
import { loadSettings, prefixSqlCondition, resolveOrgId } from './settings.js'
import { erpFingerprint, writeSnapshotMeta } from './snapshot.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'data')
const NDJSON = path.join(DATA_DIR, 'materials.ndjson')
const CSV = path.join(DATA_DIR, 'materials.csv')
const STATS = path.join(DATA_DIR, 'stats.json')

const BATCH = 20000

// 提取列：标准字段 + 自定义 ZXCV/PJQF 字段 + 名称/规格(_L) + 基本单位
const COLS = `
  m.FMATERIALID, m.FNUMBER, m.FMASTERID, m.FMATERIALGROUP, m.FCREATEORGID, m.FUSEORGID,
  m.FDOCUMENTSTATUS, m.FFORBIDSTATUS, m.FCREATEDATE, m.FMODIFYDATE,
  m.FPLMMATERIALID, m.FOLDNUMBER, m.FMATERIALSRC,
  m.F_ZXCV_TYH, m.F_ZXCV_GYS, m.F_ZXCV_SCCS, m.F_ZXCV_WLDJ, m.F_ZXCV_CLMC, m.F_ZXCV_CLGG,
  m.F_ZXCV_WXCC, m.F_ZXCV_TH, m.F_ZXCV_ZLDA, m.F_ZXCV_TX, m.F_ZXCV_JSCS, m.F_ZXCV_ZYCS,
  m.F_ZXCV_BZ, m.F_PJQF_BJBM, m.F_PJQF_CKCB, m.F_PJQF_XMDA,
  ml.FNAME, ml.FSPECIFICATION, ml.FDESCRIPTION,
  b.FBASEUNITID, ul.FNAME AS UNITNAME, u.FNUMBER AS UNITNO
`

function emptyToNull(v) {
  if (v === null || v === undefined) return null
  if (typeof v === 'string' && v.trim() === '') return null
  return v
}

export async function runExtract({ reset = true, limit = 0 } = {}) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  if (reset) { for (const f of [NDJSON, CSV, STATS]) if (fs.existsSync(f)) fs.unlinkSync(f) }
  const prefixFilter = loadSettings().materialPrefix
  const prefixSql = prefixSqlCondition()
  const screenOrgName = loadSettings().screenOrg || ''

  const ndjsonWs = fs.createWriteStream(NDJSON, { encoding: 'utf8' })
  const csvWs = fs.createWriteStream(CSV, { encoding: 'utf8' })

  // CSV 表头（聚焦列）
  const CSV_COLS = ['FMATERIALID','FNUMBER','FNAME','FSPECIFICATION','F_ZXCV_JSCS','F_ZXCV_ZYCS',
    'F_ZXCV_BZ','UNITNAME','UNITNO','FPLMMATERIALID','FOLDNUMBER','FMATERIALSRC',
    'F_ZXCV_TYH','F_ZXCV_GYS','F_ZXCV_SCCS','F_ZXCV_CLMC','F_ZXCV_CLGG','F_ZXCV_WXCC',
    'F_ZXCV_TH','F_PJQF_BJBM','FCREATEORGID','FUSEORGID','FDOCUMENTSTATUS','FFORBIDSTATUS']
  csvWs.write('\uFEFF' + CSV_COLS.join(',') + '\n')

  const pool = await getPoolConnection()

  // 筛查组织：按「使用组织 FUSEORGID」过滤；找不到则跳过并告警
  let useOrg = null
  if (screenOrgName) {
    useOrg = await resolveOrgId(screenOrgName, executeQuery)
    if (!useOrg) console.warn(`[extract] 未找到筛查组织「${screenOrgName}」，将不过滤组织`)
  }
  const orgSql = useOrg
    ? ' AND (m.FUSEORGID = @useOrgId OR (m.FUSEORGID IS NULL AND m.FCREATEORGID = @useOrgId))'
    : ''
  const orgParam = useOrg ? { useOrgId: useOrg.id } : {}

  let lastId = 0
  let total = 0
  const numberSet = new Set()
  const orgCopy = {}           // FMATERIALID 副本：同一 FNUMBER 出现的 FMATERIALID 数
  const numberCount = {}       // FNUMBER -> 出现次数（含跨组织副本）
  const subPrefixCount = {}    // 6位前缀 -> 数量
  const createOrgCount = {}
  let emptySpec = 0, emptyName = 0, hasPlm = 0, forbid = 0

  const esc = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
  }

  while (true) {
    const rows = await executeQuery(`
      SELECT ${COLS}
      FROM T_BD_MATERIAL m
      LEFT JOIN T_BD_MATERIAL_L ml ON ml.FMATERIALID = m.FMATERIALID AND ml.FLOCALEID = 2052
      LEFT JOIN T_BD_MATERIALBASE b ON b.FMATERIALID = m.FMATERIALID
      LEFT JOIN T_BD_UNIT u ON u.FUNITID = b.FBASEUNITID
      LEFT JOIN T_BD_UNIT_L ul ON ul.FUNITID = u.FUNITID AND ul.FLOCALEID = 2052
      WHERE m.FMATERIALID > @lastId${prefixSql}${orgSql}
      ORDER BY m.FMATERIALID
      OFFSET 0 ROWS FETCH NEXT ${BATCH} ROWS ONLY
    `, { lastId, ...orgParam })
    if (rows.length === 0) break

    for (const row of rows) {
      const rec = {}
      for (const [k, v] of Object.entries(row)) rec[k] = v
      // 归一化空串为 null，便于下游判断
      for (const k of Object.keys(rec)) rec[k] = emptyToNull(rec[k])
      rec.SUBPREFIX = (rec.FNUMBER && /^\d{6}/.test(rec.FNUMBER)) ? rec.FNUMBER.slice(0, 6) : null

      ndjsonWs.write(JSON.stringify(rec) + '\n')
      if (limit && total >= limit) { rows.length = 0; break }

      const csvRow = {}
      for (const c of CSV_COLS) csvRow[c] = rec[c]
      csvWs.write(CSV_COLS.map((c) => esc(csvRow[c])).join(',') + '\n')

      // 统计
      total++
      if (rec.FNUMBER) {
        numberSet.add(rec.FNUMBER)
        numberCount[rec.FNUMBER] = (numberCount[rec.FNUMBER] || 0) + 1
      }
      if (rec.SUBPREFIX) subPrefixCount[rec.SUBPREFIX] = (subPrefixCount[rec.SUBPREFIX] || 0) + 1
      if (rec.FCREATEORGID != null) createOrgCount[rec.FCREATEORGID] = (createOrgCount[rec.FCREATEORGID] || 0) + 1
      if (!rec.FSPECIFICATION) emptySpec++
      if (!rec.FNAME) emptyName++
      if (rec.FPLMMATERIALID) hasPlm++
      if (rec.FFORBIDSTATUS === 'B' || rec.FFORBIDSTATUS === 'A') forbid++
      lastId = rec.FMATERIALID
    }
    console.log(`  已提取 ${total} 行 (lastId=${lastId})`)
    if (limit && total >= limit) break
  }

  // 一号多物（同一 FNUMBER 多个 FMATERIALID 副本）
  const multiCopies = Object.entries(numberCount).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1])

  const stats = {
    generatedAt: new Date().toISOString(),
    total,
    prefixFilter: { include: prefixFilter.include, exclude: prefixFilter.exclude },
    screenOrg: useOrg ? { name: screenOrgName, id: useOrg.id, resolvedName: useOrg.name } : { name: screenOrgName || '', id: null, resolvedName: null },
    uniqueFNumber: numberSet.size,
    fNumberWithMultipleCopies: multiCopies.length,
    fNumberCopyRows: multiCopies.reduce((s, [, n]) => s + n, 0),
    topMultiCopies: multiCopies.slice(0, 50).map(([num, n]) => ({ fNumber: num, copies: n })),
    emptySpec, emptyName, hasPlmLink: hasPlm, forbid,
    subPrefixCount,
    createOrgCount,
  }
  fs.writeFileSync(STATS, JSON.stringify(stats, null, 2), 'utf8')

  // 记录提取时点的 ERP 指纹（行数/最大ID/最晚修改时间），供 server 判断快照是否过期。
  // 失败不影响提取结果，只是下次无法判断增量。
  try {
    const fp = await erpFingerprint()
    writeSnapshotMeta({
      extractedAt: new Date().toISOString(),
      total,
      prefixFilter: { include: prefixFilter.include, exclude: prefixFilter.exclude },
      screenOrg: useOrg ? { name: screenOrgName, id: useOrg.id } : null,
      erp: fp,
    })
  } catch (e) {
    console.warn('[extract] 记录 ERP 指纹失败（不影响提取）：', e.message)
  }

  await new Promise((res) => ndjsonWs.end(res))
  await new Promise((res) => csvWs.end(res))

  console.log('\n=== 提取完成 ===')
  console.log(`  总物料行: ${total}`)
  console.log(`  唯一编码 FNUMBER: ${numberSet.size}`)
  console.log(`  同一编码下多副本(FMATERIALID)的编码数: ${multiCopies.length}（疑似一号多物/跨组织分发）`)
  console.log(`  型号规格为空: ${emptySpec}  名称为空: ${emptyName}`)
  console.log(`  已关联 PLM 物料ID: ${hasPlm}`)
  console.log(`  输出: ${NDJSON}\n        ${CSV}\n        ${STATS}`)
  return stats
}

// 直接运行
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runExtract().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
}

/**
 * 强制查重 / 一物多号 聚类引擎。
 * 读取 data/materials.ndjson（由 extract 产出），按「小类 + 归一化签名」分组：
 *   - exact（一物多号候选）：同小类内，相同签名但不同 FNUMBER 的物料聚为一簇。
 *   - sameNumber（一号多物）：同一 FNUMBER 出现多个 FMATERIALID（跨组织分发/重复建号）。
 *   - fuzzy（近重，可选）：同小类内名称+规格 token 集合 Jaccard>=阈值 的不同 FNUMBER。
 * 输出 data/dedup-*.json / .csv 供人工复核与存量清洗。
 */
import fs from 'fs'
import readline from 'readline'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { buildSignature, tokenize, jaccard, normalize, looseSignature, RULES } from './spec.js'
import { matchUnit } from './guide-units.js'
import { normalizeByTemplate } from './spec-complete.js'

// 带重试的文件写入：规避 Windows 下防病毒/索引服务偶发占用文件导致的 EBUSY/EPERM
function safeWrite(file, data) {
  for (let i = 0; i < 6; i++) {
    try { fs.writeFileSync(file, data, 'utf8'); return }
    catch (e) {
      if ((e.code === 'EBUSY' || e.code === 'EPERM') && i < 5) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 400 * (i + 1)); continue }
      throw e
    }
  }
}
import { enrich, getCategory, chooseAttrs, chooseTokens } from './classify.js'
import { extractParams } from './struct-spec.js'
import { applyAiOverlay } from './ai/overlay.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA_DIR = path.join(ROOT, 'data')
const NDJSON = path.join(DATA_DIR, 'materials.ndjson')

function minimal(rec) {
  return {
    fNumber: rec.FNUMBER,
    fName: rec.FNAME,
    fSpec: rec.FSPECIFICATION,
    fZycs: rec.F_ZXCV_ZYCS,
    fJscs: rec.F_ZXCV_JSCS,
    unit: rec.UNITNAME,
    org: rec.FUSEORGID,
    materialId: rec.FMATERIALID,
    createOrg: rec.FCREATEORGID,
    plm: rec.FPLMMATERIALID || null,
  }
}

async function streamNdjson(onRec) {
  const rl = readline.createInterface({ input: fs.createReadStream(NDJSON, 'utf8'), crlfDelay: Infinity })
  let n = 0
  for await (const line of rl) {
    if (!line.trim()) continue
    let rec
    try { rec = JSON.parse(line) } catch { continue }
    await onRec(rec)
    n++
    if (n % 50000 === 0) console.log(`  已读 ${n} 行`)
  }
  return n
}

export async function runDedup({ fuzzy = false, limit = 0 } = {}) {
  if (!fs.existsSync(NDJSON)) throw new Error('未找到 materials.ndjson，请先运行 extract')
  fs.mkdirSync(DATA_DIR, { recursive: true })

  // sub -> sig -> [members]
  const bySub = new Map()
  // 名称 -> { 小类: 次数 }：供「名称→主导小类」索引使用。
  // 必须独立收集，不能复用 bySub —— 规格为空的物料不会生成签名（下方 if (!sig) return），
  // 但它们的名称归属同样有参考价值（实测「电源线」因规格为空被漏掉）。
  const nameSub = new Map()
  // fNumber -> [members]  (一号多物)
  const byNumber = new Map()
  let total = 0, classified = 0, unclassified = 0
  const unclassifiedPrefix = {}

  await streamNdjson((rec) => {
    total++
    if (limit && total > limit) return
    // 分组键：FNUMBER 前 6 位（小类编码通常含于其中，文档未收录的前缀也按此分桶）。
    // 用 6 字符(含字母)而非仅 6 位数字，以兼容带字母的编码方案与字母前缀大类；
    // 文档仅用于补充可读名称。这样即使编码规则文档不完整，同小类内的查重仍能覆盖。
    const num = rec.FNUMBER || ''
    const subKey = num.length >= 6 ? num.slice(0, 6) : 'UNPREFIXED'
    const info = getCategory(subKey)
    if (subKey === 'UNPREFIXED') {
      unclassified++
      unclassifiedPrefix[num.slice(0, 6) || 'NO_PREFIX'] = (unclassifiedPrefix[num.slice(0, 6) || 'NO_PREFIX'] || 0) + 1
      return
    }
    classified++
    // 名称归属统计（必须在 sig 判空之前）
    const nm = String(rec.FNAME || '').trim()
    if (nm) {
      if (!nameSub.has(nm)) nameSub.set(nm, new Map())
      const nmMap = nameSub.get(nm)
      nmMap.set(subKey, (nmMap.get(subKey) || 0) + 1)
    }
    const attrs = chooseAttrs(info)
    const tokens = chooseTokens(info)
    // 名称归一：若名称命中该小类的「品类单元」别名，用单元名参与签名。
    // 目的：让「监控硬盘 8TB」与「硬盘 8TB」、「枪机 X」与「枪型网络摄像机 X」在查重中视为同物，
    // 而不是只停留在录入提示层（此前归一不影响签名，一物多号仍认不出）。
    // 只在名称命中时替换；未声明单元的小类行为完全不变。
    let sigRec = rec
    if (rec.FNAME) {
      try {
        const u = matchUnit(rec.FNAME, subKey)
        if (u && u.unit && u.unit !== rec.FNAME) sigRec = Object.assign({}, rec, { FNAME: u.unit })
      } catch (e) { /* 单元表异常时退回原名 */ }
    }
    // 签名前按模板规范化（补单位）：C20 → C20A、3*2.5 → 3*2.5mm^2。
    // 与 plm-index 的索引构建/查询保持同一口径，否则批处理与在线查重结论会不一致。
    sigRec = { ...sigRec, FSPECIFICATION: normalizeByTemplate(subKey, sigRec.FSPECIFICATION) }
    const sig = buildSignature(sigRec, attrs)
    if (!sig) return // 名称与规格都空，无法构成签名
    const m = minimal(rec)
    m.params = applyAiOverlay(extractParams(rec.FSPECIFICATION, tokens), rec.FNUMBER)
    if (!bySub.has(subKey)) bySub.set(subKey, new Map())
    const subMap = bySub.get(subKey)
    if (!subMap.has(sig)) subMap.set(sig, [])
    subMap.get(sig).push(m)

    if (rec.FNUMBER) {
      if (!byNumber.has(rec.FNUMBER)) byNumber.set(rec.FNUMBER, [])
      byNumber.get(rec.FNUMBER).push(m)
    }
  })

  // ---- 一物多号（exact）：同小类同签名，不同 FNUMBER ----
  // 置信度：签名含规格/参数内容(high) -> 强证据；仅名称相同、规格为空(low) -> 同名待核查(可能是不同实物)
  const exactClusters = []
  let exactPairCount = 0
  let highCount = 0, lowCount = 0
  for (const [sub, subMap] of bySub) {
    const info = getCategory(sub)
    for (const [sig, members] of subMap) {
      const fNumbers = new Set(members.map((m) => m.fNumber))
      if (fNumbers.size <= 1) continue
      // 置信度：签名中除名称外还含有规格/参数内容 -> high（强证据）；
      // 否则仅名称相同、规格为空 -> low（同名待核查，很可能是不同实物，需人工确认）
      const base = normalize(members[0].fName || '')
      const confidence = sig.length > base.length ? 'high' : 'low'
      if (confidence === 'high') highCount++; else lowCount++
      exactClusters.push({
        sub, subName: info?.subName, big: info?.bigName, mid: info?.midName,
        signature: sig, distinctFNumbers: fNumbers.size, confidence, members,
      })
      exactPairCount += members.length
    }
  }
  exactClusters.sort((a, b) => (a.confidence === b.confidence ? b.members.length - a.members.length : a.confidence === 'high' ? -1 : 1))

  // ---- 仅分隔符差异（sepOnly）：同小类「分隔符无关签名」相同、但 exact 签名不同 ----
  // 例：IC65N C10A/2P 与 IC65N C10A 2P、YCW-2000V-1*185 与 YCW 2000V 1*185
  // 这类写法差异现有 normalize（删空格、保留 /）抓不到，实测占一物多号的 1/3。
  // 注意 looseSignature 保留小数点，避免 3*25 与 3*2.5 被误并。
  const sepClusters = []
  let sepMemberCount = 0
  for (const [sub, subMap] of bySub) {
    const info = getCategory(sub)
    const looseMap = new Map() // loose -> [{ signature, members }]
    for (const [sig, members] of subMap) {
      const ls = looseSignature(sig)
      if (!ls) continue
      if (!looseMap.has(ls)) looseMap.set(ls, [])
      looseMap.get(ls).push({ signature: sig, members })
    }
    for (const [ls, groups] of looseMap) {
      if (groups.length <= 1) continue // 只有一个写法 → 纯 exact 重复，已在上面统计
      const fNumbers = new Set()
      for (const g of groups) for (const m of g.members) fNumbers.add(m.fNumber)
      if (fNumbers.size <= 1) continue
      const members = groups.flatMap((g) => g.members)
      sepClusters.push({
        sub, subName: info?.subName, big: info?.bigName, mid: info?.midName,
        looseSignature: ls,
        distinctFNumbers: fNumbers.size,
        variants: groups.map((g) => ({ signature: g.signature, count: g.members.length })),
        members,
      })
      sepMemberCount += members.length
    }
  }
  sepClusters.sort((a, b) => b.distinctFNumbers - a.distinctFNumbers)

  // ---- 一号多物：同 FNUMBER 多 FMATERIALID ----
  const sameNumber = []
  for (const [num, members] of byNumber) {
    const ids = new Set(members.map((m) => m.materialId))
    if (ids.size > 1) {
      sameNumber.push({ fNumber: num, copies: ids.size, members })
    }
  }
  sameNumber.sort((a, b) => b.copies - a.copies)

  // ---- 近重（fuzzy，可选）----
  let fuzzyClusters = []
  if (fuzzy) {
    fuzzyClusters = runFuzzy(bySub, getCategory)
  }

  // 写出
  const exactPath = path.join(DATA_DIR, 'dedup-exact.json')
  const samePath = path.join(DATA_DIR, 'dedup-sameNumber.json')
  const sepPath = path.join(DATA_DIR, 'dedup-sep.json')
  const reportPath = path.join(DATA_DIR, 'dedup-report.json')
  const exactCsv = path.join(DATA_DIR, 'dedup-exact.csv')

  exactClusters.sort((a, b) => (a.confidence === b.confidence ? b.members.length - a.members.length : a.confidence === 'high' ? -1 : 1))

  safeWrite(exactPath, JSON.stringify(exactClusters, null, 2))
  safeWrite(samePath, JSON.stringify(sameNumber, null, 2))
  safeWrite(sepPath, JSON.stringify(sepClusters, null, 2))
  safeWrite(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    total, classified, unclassified,
    unclassifiedPrefix,
    exactClusterCount: exactClusters.length,
    exactHighConfidence: highCount,
    exactLowConfidence: lowCount,
    exactMemberCount: exactPairCount,
    sepClusterCount: sepClusters.length,
    sepMemberCount,
    sameNumberClusterCount: sameNumber.length,
    sameNumberCopyCount: sameNumber.reduce((s, c) => s + c.copies, 0),
    fuzzyEnabled: fuzzy, fuzzyClusterCount: fuzzyClusters.length,
    topExact: exactClusters.slice(0, 50).map((c) => ({ sub: c.sub, subName: c.subName, sig: c.signature, confidence: c.confidence, distinct: c.distinctFNumbers, n: c.members.length })),
    topSep: sepClusters.slice(0, 50).map((c) => ({
      sub: c.sub, subName: c.subName, loose: c.looseSignature,
      distinct: c.distinctFNumbers, variants: c.variants.map((v) => v.signature),
    })),
  }, null, 2))

  // CSV（每条簇成员一行，便于 Excel 复核）
  const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s }
  const header = 'clusterId,confidence,sub,subName,signature,distinctFNumbers,fNumber,fName,fSpec,unit,org,materialId'
  const lines = [header]
  exactClusters.forEach((c, i) => {
    for (const m of c.members) {
      lines.push([i + 1, c.confidence, c.sub, c.subName, c.signature, c.distinctFNumbers, m.fNumber, m.fName, m.fSpec, m.unit, m.org, m.materialId].map(esc).join(','))
    }
  })
  safeWrite(exactCsv, '\uFEFF' + lines.join('\n'))

  if (fuzzy) fs.writeFileSync(path.join(DATA_DIR, 'dedup-fuzzy.json'), JSON.stringify(fuzzyClusters, null, 2), 'utf8')

  console.log('\n=== 查重完成 ===')
  console.log(`  总物料: ${total}  已分类: ${classified}  未分类: ${unclassified}`)
  console.log(`  [一物多号] 候选簇: ${exactClusters.length}  (高置信=${highCount} 含规格差异 / 低置信=${lowCount} 仅同名待核查)  涉及物料: ${exactPairCount}`)
  console.log(`  [一物多号·仅分隔符差异] 候选簇: ${sepClusters.length}  涉及物料: ${sepMemberCount}（/ 与空格、- 与空格等写法差异，未计入上方 exact）`)
  console.log(`  [一号多物] 同编码多副本簇: ${sameNumber.length}  副本数: ${sameNumber.reduce((s, c) => s + c.copies, 0)}（通常为多组织分发，非冗余）`)
  if (fuzzy) console.log(`  [近重] 候选簇: ${fuzzyClusters.length}`)
  // 生成「名称 → 主导小类」索引，供跨小类检测使用。
  // 规则：该名称在某小类 ≥3 条，且占该名称全部出现次数 ≥80%（纯度）。
  // 为什么不靠 nameUnits：209 个小类里只有 3 个建了品类单元，靠人工标注永远覆盖不全；
  // 存量数据本身就记录了「每个名称实际落在哪个小类」，用它做参照可自动覆盖全库。
  try {
    // 直接使用流式采集的 nameSub：它覆盖全部已分类物料（含规格为空、无法构成签名的）
    const index = {}
    for (const [n, mm] of nameSub) {
      const total = [...mm.values()].reduce((s, v) => s + v, 0)
      // 门槛 2（原为 3）：本意是「至少两条同类记录」。
      // 3 会把「电源线」（110302 只有 2 条）漏掉，导致它在通讯线类里填不出提示；
      // 证据强度由使用方按 count 分档：≥3 强证据（红+阻断），2 条弱证据（只提示）。
      if (total < 2) continue
      const [sub, cnt] = [...mm.entries()].sort((a, b) => b[1] - a[1])[0]
      if (cnt / total < 0.8) continue               // 该名称跨多个小类，不宜当参照
      const info = getCategory(sub)
      index[n] = { sub, subName: (info && info.subName) || '', count: cnt, purity: +(cnt / total).toFixed(2) }
    }
    // 全量分布（不受纯度限制）：供「当前小类无先例」判定用。
    // 例「电源线」散在 5 个小类、纯度 0.38 进不了 index，
    // 但它从没在「微型断路器」出现过 —— 这本身就是很强的信号。
    const dist = {}
    for (const [n, mm] of nameSub) {
      const o = {}
      for (const [s, c] of mm) o[s] = c
      dist[n] = o
    }

    safeWrite(path.join(DATA_DIR, 'name-sub-index.json'), JSON.stringify({
      generatedAt: new Date().toISOString(),
      rule: 'index=在某小类≥2条且占该名称≥80%；dist=全量分布（含低频/跨类）',
      index,
      dist,
    }, null, 2))
    console.log(`  [名称索引] ${Object.keys(index).length} 个名称 → 主导小类（供跨类检测）`)
  } catch (e) {
    console.warn('  [名称索引] 生成失败（不影响查重）：' + e.message)
  }

  console.log(`  输出: ${exactPath}\n        ${samePath}\n        ${sepPath}\n        ${reportPath}\n        ${exactCsv}`)
  return { exactClusters, sameNumber, sepClusters, fuzzyClusters }
}

function runFuzzy(bySub, getCategory) {
  const out = []
  const TH = RULES.fuzzyThreshold || 0.8
  for (const [sub, subMap] of bySub) {
    const info = getCategory(sub)
    // 收集该小类所有成员（去重到 fNumber 维度做两两比较，避免组内爆炸）
    const all = []
    for (const members of subMap.values()) for (const m of members) all.push(m)
    if (all.length > 1500) continue // 过大跳过模糊，避免 O(n^2) 超时
    const seen = new Set()
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        if (all[i].fNumber === all[j].fNumber) continue
        const key = [all[i].fNumber, all[j].fNumber].sort().join('|')
        if (seen.has(key)) continue
        const t1 = tokenize((all[i].fName || '') + ' ' + (all[i].fSpec || '') + ' ' + (all[i].fZycs || ''))
        const t2 = tokenize((all[j].fName || '') + ' ' + (all[j].fSpec || '') + ' ' + (all[j].fZycs || ''))
        const s = jaccard(t1, t2)
        if (s >= TH) { seen.add(key); out.push({ sub, subName: info?.subName, similarity: +s.toFixed(3), a: all[i], b: all[j] }) }
      }
    }
  }
  out.sort((a, b) => b.similarity - a.similarity)
  return out
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fuzzy = process.argv.includes('--fuzzy')
  runDedup({ fuzzy }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
}

const api = (p) => fetch(p).then((r) => r.json())
const $ = (s) => document.querySelector(s)
const fmt = (n) => (n == null ? '-' : n.toLocaleString('zh-CN'))

let matPage = 1, matFilters = {}
let dedupPage = 1, dedupFilters = {}
let unifiedPage = 1, unifiedFilters = {}

// ---------- Tab 切换 ----------
document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'))
  document.querySelectorAll('.panel').forEach((x) => x.classList.remove('active'))
  t.classList.add('active')
  $('#tab-' + t.dataset.tab).classList.add('active')
  if (t.dataset.tab === 'materials') loadMaterials(1)
  if (t.dataset.tab === 'dedup') loadDedup(1)
  if (t.dataset.tab === 'classify') loadTree()
  if (t.dataset.tab === 'cleanup') loadCleanup()
  if (t.dataset.tab === 'settings') loadSettings()
  if (t.dataset.tab === 'feature') loadFeature()
  if (t.dataset.tab === 'newmat') loadNewMat()
}))

// ---------- 概览 + 阶段 ----------
async function loadOverview() {
  const o = await api('/api/overview')
  renderPipeline(o.stages)
  renderMetrics(o.stats, o.report)
  renderFindings(o.stats, o.report)
}

function renderPipeline(stages) {
  const labels = { extract: '① 全量提取', classify: '② 规格结构化/分类', dedup: '③ 强制查重', cleanup: '④ 存量清洗' }
  const el = $('#pipeline'); el.innerHTML = ''
  for (const k of ['extract', 'classify', 'dedup', 'cleanup']) {
    const s = stages[k] || {}
    const done = s.exists
    const div = document.createElement('div')
    div.className = 'stage ' + (done ? 'done' : 'pending')
    const at = s.exists ? new Date(s.at).toLocaleString('zh-CN') : '未生成'
    div.innerHTML = `<div class="name"><span class="dot"></span>${labels[k]}</div><div class="note">${s.note || ''}</div><div class="state">${done ? '✓ 已生成' : '○ 待运行'} · ${at}</div>`
    el.appendChild(div)
  }
}

function renderMetrics(stats, report) {
  const cards = [
    { k: '物料总数', v: stats.total },
    { k: '已分类 / 未分类', v: `${fmt(report.classified)} / ${fmt(report.unclassified)}` },
    { k: '唯一编码 FNUMBER', v: stats.uniqueFNumber },
    { k: '一物多号候选簇', v: report.exactClusterCount, cls: 'green' },
    { k: '高置信（含规格差异）', v: report.exactHighConfidence, cls: 'green' },
    { k: '低置信（仅同名待核查）', v: report.exactLowConfidence, cls: 'amber' },
    { k: '一号多物簇（多组织分发）', v: report.sameNumberClusterCount },
    { k: '型号规格为空', v: stats.emptySpec, cls: 'red' },
    { k: '名称为空', v: stats.emptyName, cls: 'red' },
    { k: '已关联 PLM 物料ID', v: stats.hasPlmLink, cls: stats.hasPlmLink ? '' : 'red' },
  ]
  $('#metricCards').innerHTML = cards.map((c) =>
    `<div class="card"><div class="k">${c.k}</div><div class="v ${c.cls || ''}">${fmt(c.v)}</div></div>`).join('')
}

function renderFindings(stats, report) {
  const items = [
    `当前提取范围：仅包含前缀 <b>${stats.prefixFilter?.include?.length ? stats.prefixFilter.include.join('/') : '全部'}</b>${stats.prefixFilter?.exclude?.length ? ` ，并排除 <b>${stats.prefixFilter.exclude.join('/')}</b>` : ''} 开头的物料${stats.screenOrg?.name ? `，筛查组织 <b>${stats.screenOrg.resolvedName || stats.screenOrg.name}</b>` : ''}（在「系统设置」可调整，需重新提取生效）。`,
    `全库 <b>${fmt(stats.total)}</b> 条物料，唯一编码仅 <b>${fmt(stats.uniqueFNumber)}</b> 个 —— 平均每个编码有 <b>${(stats.total / Math.max(1, stats.uniqueFNumber)).toFixed(1)}</b> 个副本（跨组织分发）。`,
    `强制查重发现 <b>${fmt(report.exactClusterCount)}</b> 个「一物多号」候选簇，其中 <b>${fmt(report.exactHighConfidence)}</b> 个为高置信（归一化后规格完全相同，纯书写差异）。`,
    `<b>${fmt(stats.emptySpec)}</b> 条（${((stats.emptySpec / stats.total) * 100).toFixed(1)}%）型号规格为空，是查重精度的主要瓶颈，建议补全。`,
    `已关联 PLM 物料ID 仅 <b>${fmt(stats.hasPlmLink)}</b> 条 —— PLM 联动字段几乎未填，建议从源头补全以实现「PLM 统一发码」根治一物多号。`,
    `在 <b>一物多号查重</b> 页可逐簇人工确认并「添加映射」归并；在 <b>存量清洗</b> 页查看统一物料视图。`,
  ]
  $('#findings').innerHTML = '<h3>关键发现</h3><ul>' + items.map((i) => `<li>${i}</li>`).join('') + '</ul>'
}

// ---------- 一物多号查重 ----------
async function loadDedup(page = 1) {
  dedupPage = page
  const qs = new URLSearchParams({ page, pageSize: 50, ...dedupFilters }).toString()
  const d = await api('/api/clusters?' + qs)
  const tb = $('#clusterTable tbody'); tb.innerHTML = ''
  d.items.forEach((c, i) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${(page - 1) * 50 + i + 1}</td>
      <td>${c.subName || c.sub || ''}</td>
      <td>${c.signature}</td>
      <td><span class="tag ${c.confidence}">${c.confidence === 'high' ? '高' : '低'}</span></td>
      <td>${c.distinctFNumbers}</td><td>${c.memberCount}</td>
      <td>${c.fNumbers.slice(0, 4).join('、')}${c.fNumbers.length > 4 ? '…' : ''}</td>`
    tr.addEventListener('click', () => openCluster(c.index))
    tb.appendChild(tr)
  })
  $('#dedupCount').textContent = `共 ${fmt(d.total)} 簇 · 涉及物料 ${fmt(d.totalMembers)} 条`
  renderPager('#dedupPager', d.total, d.page, d.pageSize, loadDedup)
}

// ---------- 规格差异高亮 ----------
// 以首行为参考：把规格拆成「字母段/数字段」词元，做 LCS 序列对比，
// 当前行中不在公共子序列里的词元用 <span class="diff"> 标红（分隔符原样保留）。
function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
// 词元级 LCS 双向比对：返回 ref/cur 各自「未匹配」的词元标记（一遍算完，双向都能用）
function tokenDiff(ref, cur) {
  const re = /[A-Za-z]+|\d+/g
  const scan = (s) => {
    const segs = []
    let m
    while ((m = re.exec(s || ''))) segs.push({ text: m[0], start: m.index, end: m.index + m[0].length })
    return segs
  }
  const aSegs = scan(ref), bSegs = scan(cur)
  const a = aSegs.map((s) => s.text), b = bSegs.map((s) => s.text)
  const n = a.length, m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const aFlag = new Array(n).fill(false) // ref 有、cur 没有
  const bFlag = new Array(m).fill(false) // cur 有、ref 没有
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { aFlag[i] = true; i++ }
    else { bFlag[j] = true; j++ }
  }
  for (; i < n; i++) aFlag[i] = true
  for (; j < m; j++) bFlag[j] = true
  return { a, b, aFlag, bFlag, aSegs, bSegs }
}

function highlightDiff(ref, cur, cls = 'diff', tip = '与首行规格存在差异') {
  const re = /[A-Za-z]+|\d+/g
  const segs = []
  let m
  while ((m = re.exec(cur || ''))) segs.push({ text: m[0], start: m.index })
  if (!segs.length) return escapeHtml(cur || '') || '-'
  const { bFlag } = tokenDiff(ref, cur)
  // 按原文本渲染，保留分隔符
  let html = '', pos = 0
  segs.forEach((s, idx) => {
    html += escapeHtml(cur.slice(pos, s.start))
    html += bFlag[idx] ? `<span class="${cls}" title="${tip}">${escapeHtml(s.text)}</span>` : escapeHtml(s.text)
    pos = s.start + s.text.length
  })
  html += escapeHtml(cur.slice(pos))
  return html
}

// 「仅写法不同」用：词元序列相同、只有分隔符/大小写不同时，逐段标出差异
// 例：CW3-2500H/3P-1000A EN35/固定式  ←→  CW3-2500H 3P 1000A EN35 固定式
// 与 nmSpecDiffHtml 的分工：那个比词元增删，这个比词元之间的分隔符与大小写
const SPEC_TOKEN_RE = /[A-Za-z]+|\d+|[\u4e00-\u9fa5]+/g
function splitSpecParts(s) {
  const parts = []
  const re = new RegExp(SPEC_TOKEN_RE.source, 'g')
  let pos = 0, m
  while ((m = re.exec(String(s || '')))) {
    parts.push({ sep: String(s).slice(pos, m.index), tok: m[0] })
    pos = m.index + m[0].length
  }
  parts.push({ sep: String(s || '').slice(pos), tok: null })
  return parts
}
const normSep = (x) => String(x || '').replace(/\s+/g, ' ').trim()

function sepDiffHtml(ref, cur) {
  if (!ref || !cur) return null
  const A = splitSpecParts(ref), B = splitSpecParts(cur)
  const ta = A.filter((p) => p.tok !== null), tb = B.filter((p) => p.tok !== null)
  if (!ta.length || ta.length !== tb.length) return null
  // 词元必须完全一致（忽略大小写），否则交给 nmSpecDiffHtml 处理
  if (ta.some((p, i) => p.tok.toLowerCase() !== tb[i].tok.toLowerCase())) return null
  let html = ''
  B.forEach((p, i) => {
    const aSep = A[i] ? A[i].sep : ''
    if (p.sep) {
      html += normSep(p.sep) === normSep(aSep)
        ? escapeHtml(p.sep)
        : `<span class="nm-diff-sep" title="分隔符写法不同">${escapeHtml(p.sep)}</span>`
    } else if (normSep(aSep)) {
      html += '<span class="nm-diff-sep-gap" title="原写法此处有分隔符，当前写法没有"></span>'
    }
    if (p.tok !== null) {
      const same = A[i] && A[i].tok === p.tok
      html += same
        ? escapeHtml(p.tok)
        : `<span class="nm-diff" title="写法不同（大小写）">${escapeHtml(p.tok)}</span>`
    }
  })
  return html
}

// 类似型号弹窗用：以「已录入规格」为基准，双向标出差异
// 1) 该行规格里多出/不同的词元 → 黄色高亮
// 2) 该行缺少已录入规格里的词元 → 末尾小字提示「缺 xxx」
function nmSpecDiffHtml(ref, cur) {
  if (!cur) return ''
  const d = tokenDiff(ref, cur)
  const segs = d.bSegs
  // 渲染该行规格：连续且相邻的差异词元合并成一个黄色块（如 50kA 不要拆成两块）
  let html = '', pos = 0, i = 0
  while (i < segs.length) {
    const s = segs[i]
    html += escapeHtml(cur.slice(pos, s.start))
    if (d.bFlag[i]) {
      let txt = s.text, endAt = s.end, k = i + 1
      while (k < segs.length && d.bFlag[k] && segs[k].start === endAt) {
        txt += segs[k].text; endAt = segs[k].end; k++
      }
      html += `<span class="nm-diff" title="与已录入规格不同">${escapeHtml(txt)}</span>`
      pos = endAt
      i = k
      continue
    }
    html += escapeHtml(s.text)
    pos = s.end
    i++
  }
  html += escapeHtml(cur.slice(pos))
  // 缺失片段：相邻（原文中连在一起，如 2C0）的合并显示，中间有分隔符的才拆开
  const miss = []
  let buf = '', lastEnd = -1
  d.aSegs.forEach((s, i) => {
    if (!d.aFlag[i]) return
    if (buf && s.start === lastEnd) buf += s.text
    else { if (buf) miss.push(buf); buf = s.text }
    lastEnd = s.end
  })
  if (buf) miss.push(buf)
  if (miss.length) {
    html += `<span class="nm-diff-miss" title="该物料规格中没有已录入的以下片段">缺 ${escapeHtml(miss.join(' '))}</span>`
  }
  return html
}

// ---------- 物料特征（原始信息 + 策略特征 + 校验状态 + 溯源高亮） ----------
const UNIT_SUF = ['mm²', 'mm', 'kA', 'kW', 'OHM', 'KΩ', 'MΩ', 'Ω', 'μF', 'nF', 'pF', 'mF', 'uF', 'KV', 'kV', '芯', '位', '级', 'V', 'A', 'W', 'K', '%']
function stripUnit(v) {
  const up = v.toUpperCase()
  for (const s of UNIT_SUF) if (up.endsWith(s.toUpperCase()) && v.length > s.length) return v.slice(0, v.length - s.length)
  return v
}
// 溯源：在规格原文中定位每个特征值的来源片段（大小写不敏感；连值拆段；单位后缀回填的逐级剥离重试）
function specWithSource(spec, params) {
  const lower = (spec || '').toLowerCase()
  const ranges = []
  const untraced = []
  for (const [k, raw] of Object.entries(params || {})) {
    if (!raw) continue
    const parts = String(raw).split(/[/+]/).map((x) => x.trim()).filter(Boolean)
    let hitAny = false
    for (const p0 of parts) {
      const tries = [p0, stripUnit(p0)]
      let found = -1, len = 0
      for (const t of tries) {
        if (!t) continue
        const i = lower.indexOf(t.toLowerCase())
        if (i >= 0) { found = i; len = t.length; break }
      }
      if (found >= 0) { ranges.push([found, found + len]); hitAny = true }
    }
    if (!hitAny) untraced.push(k) // 原文定位不到（规范化改写等），如实标注 ⚠
  }
  ranges.sort((a, b) => a[0] - b[0])
  let html = '', pos = 0
  for (const [s, e] of ranges) {
    if (s < pos) continue
    html += escapeHtml(spec.slice(pos, s)) + `<mark class="src" title="特征参数提取来源（原文片段）">${escapeHtml(spec.slice(s, e))}</mark>`
    pos = e
  }
  html += escapeHtml(spec.slice(pos))
  return { html: html || '-', untraced }
}

async function loadMaterials(page = 1) {
  matPage = page
  const qs = new URLSearchParams({ page, pageSize: 50, ...matFilters }).toString()
  const d = await api('/api/materials?' + qs)
  const sc = d.meta.statusCounts
  $('#matMeta').innerHTML = '<h3>物料特征数据（策略提取 · 全量校验）</h3><ul><li>'
    + `提取规则版本 <b>${escapeHtml(d.meta.ruleVersion || '-')}</b> · 规则校验结论 `
    + `<span class="tag ${d.meta.validationPass === true ? 'ok' : d.meta.validationPass === false ? 'err' : 'amber'}">${d.meta.validationPass === true ? 'PASS' : d.meta.validationPass === false ? 'FAIL' : '未运行'}</span>`
    + ` · 物料 <b>${fmt(d.meta.total)}</b> 条：通过 <b class="green">${fmt(sc.ok)}</b> / 有缺项 <b class="amber">${fmt(sc.missing)}</b>（策略期望但原文未提供，可筛选核查）/ 有缺陷 <b class="red">${fmt(sc.error)}</b> / 待核查 <b class="amber">${fmt(d.meta.warnCount || 0)}</b> ⚠（型号首词存疑等，不阻断）`
    + '</li><li>每条物料的特征参数均在<strong>规格原文</strong>中黄底标注来源片段，可逐条核对「没有编造、没有丢失原文」；规格原文始终完整展示。ERP 原始参数字段（主要/技术参数）一并列出对照。</li></ul>'
  const dl = $('#subList'); dl.innerHTML = ''
  d.subs.slice(0, 300).forEach((s) => { const o = document.createElement('option'); o.value = s.name; dl.appendChild(o) })
  const tb = $('#matTable tbody'); tb.innerHTML = ''
  d.items.forEach((m) => {
    const src = specWithSource(m.spec, m.params)
    // 参数表：主列=表层提取参数（extractParams 已按全局 order 排序），策略期望但缺项的 token 补「—」；
    // 品牌编码解读（解码器·校验层）不反推、不覆盖提取值，仅以次级列追加在末尾供对照。
    const semFeats = m.sem?.features || []
    const semMap = {}
    semFeats.forEach((f) => { if (!semMap[f.key]) semMap[f.key] = f })
    const have = m.params || {}
    const paramKeys = [...Object.keys(have), ...(m.tokens || []).filter((k) => k !== '系列' && !(k in have))]
    const decodeKeys = [...new Set(semFeats.filter((f) => f.key !== '系列' && f.key !== '品牌' && !paramKeys.includes(f.key)).map((f) => f.key))]
    // 系列取消独立列：其含义并入「型号」。同小类只取自身参数列，保证上下对齐。
    const keys = [...paramKeys, ...decodeKeys, '品牌']
    const untraced = new Set(src.untraced)
    const seriesVal = semMap['系列']?.value || ''
    const ptab = `<table class="ptab"><thead><tr>${keys.map((k) => {
      const cls = k === '品牌' ? ' class="brand"' : (decodeKeys.includes(k) ? ' class="sem"' : '')
      const tip2 = decodeKeys.includes(k) ? ' title="品牌编码解读（解码器·校验层，不反推）"' : ''
      return `<th${cls}${tip2}>${escapeHtml(k)}</th>`
    }).join('')}</tr></thead><tbody><tr>${keys.map((k) => {
      const isBrand = k === '品牌'
      const isDecode = decodeKeys.includes(k)
      let v = isBrand ? (m.sem?.brand || '') : (isDecode ? (semMap[k]?.value || '') : (m.params?.[k] ?? ''))
      // 系列并入型号：当「系列」取值未包含在型号内时，补注到型号后（如 iC65N 1P C1A（Acti9））
      if (k === '型号' && seriesVal && v && !v.toLowerCase().includes(seriesVal.toLowerCase())) v = `${v}（${seriesVal}）`
      const cls = (isBrand ? 'brand ' : '') + (!v ? 'na' : '')
      if (!v) return `<td class="${cls.trim()}" title="${isBrand ? '品牌未识别（规格不含已收录品牌编码）' : isDecode ? '品牌编码无解读' : '策略期望参数，规格原文未提供'}">—</td>`
      const tip = isBrand ? (m.sem?.series || '物料品牌/生产商') : isDecode ? ('品牌编码解读（校验层，不作提取依据）：' + (semMap[k]?.meaning || k)) : (semMap[k]?.meaning || k)
      const warn = (m.tokens || []).includes(k) && untraced.has(k) ? ' <i class="warn" title="提取值未能在原文直接定位（多为单位回填/规范化大小写所致）">⚠</i>' : ''
      // AI 来源角标：仅当该字段由 AI 叠加填补（规则未提取）时显示 ⚡
      const aiMark = (!isBrand && !isDecode && (m.aiFields || []).includes(k)) ? ' <span class="ai-badge" title="AI 模型叠加填补：原文该值规则未提取，由 LLM 基于「不反推」补入，供人工核查">⚡</span>' : ''
      return `<td class="${cls.trim()}" title="${escapeHtml(tip)}">${escapeHtml(v)}${aiMark}${warn}</td>`
    }).join('')}</tr></tbody></table>`
    const erp = [m.zycs && `主要参数: ${escapeHtml(m.zycs)}`, m.jscs && `技术参数: ${escapeHtml(m.jscs)}`].filter(Boolean).join('<br/>')
    const warnMark = m.warns?.length
      ? `<i class="warn" title="${escapeHtml(m.warns.map((w) => w.param + ': ' + w.reason).join('；'))}"> ⚠待核查${m.warns.length}</i>` : ''
    const tag = m.status === 'error'
      ? `<span class="tag err" title="${escapeHtml(m.errors.map((e) => e.param + ': ' + e.reason).join('；'))}">缺陷${m.errors.length}</span>`
      : m.status === 'missing'
        ? `<span class="tag amber" title="缺项: ${escapeHtml(m.missing.join('、'))}">缺项${m.missing.length}</span>${warnMark}`
        : `<span class="tag ok">通过</span>${warnMark}`
    const tr = document.createElement('tr')
    tr.innerHTML = `<td><b>${m.fnumber}</b></td>
      <td>${escapeHtml(m.subName || m.sub)}</td>
      <td>${escapeHtml(m.name || '-')}</td>
      <td class="spec">${src.html}</td>
      <td class="chips">${ptab}</td>
      <td class="erp">${erp || '<span class="muted">-</span>'}</td>
      <td>${tag}${m.semGaps?.length ? `<i class="warn" title="完整性校验：规格原文以下片段未被任何特征参数覆盖（遗漏）——${escapeHtml(m.semGaps.join(' / '))}"> 遗漏:${escapeHtml(m.semGaps.join('/'))}</i>` : ''}</td>`
    tb.appendChild(tr)
  })
  $('#matCount').textContent = `符合 ${fmt(d.meta.filtered)} 条`
  renderPager('#matPager', d.meta.filtered, d.meta.page, d.meta.pageSize, loadMaterials)
}

async function openCluster(index) {
  const c = await api('/api/cluster?index=' + index)
  const byNo = {}
  c.members.forEach((m) => { (byNo[m.fNumber] ||= []).push(m) })
  const nos = Object.keys(byNo)
  const opts = nos.map((n) => `<option value="${n}">${n}</option>`).join('')
  let html = `<h3>小类：${c.subName || c.sub} · 归一签名：<code>${c.signature}</code></h3>
    <div>置信度：<span class="tag ${c.confidence}">${c.confidence === 'high' ? '高（含规格差异）' : '低（仅同名，待核查）'}</span>
     · 不同编码 <b>${c.distinctFNumbers}</b> 个 · 成员 <b>${c.members.length}</b> 条
     <span class="help" data-help="以首行为参考，红色文本表示与首行在规格/特征参数上的差异内容">ⓘ</span></div>
    <div class="canon">选主编码：<select id="canonSel">${opts}</select>
      <button id="btnMapCluster">将其他编码映射到主编码</button></div><hr/>`
  const refSpec = (byNo[nos[0]][0].fSpec || '')
  const refParams = byNo[nos[0]][0].params || {}
  const semM = c.members.find((m) => m.sem)
  let paramKeys = Object.keys(refParams)
  if (paramKeys.length) {
    const hasVal = (k) => nos.some((no) => (byNo[no][0].params?.[k] || '') !== '')
    paramKeys = paramKeys.filter(hasVal)
  }
  const pHead = paramKeys.map((k) => `<th class="param">${escapeHtml(k)}</th>`).join('')
  const pHint = paramKeys.length ? ' ；特征参数列红色=与首行差异' : ''
  const semLine = semM?.sem
    ? `<div class="sem-line">🏷 <b>${escapeHtml(semM.sem.brand)}</b> · ${escapeHtml(semM.sem.series)}：`
      + semM.sem.features.map((f) => `<span class="pv semf" title="${escapeHtml(f.meaning)}">${escapeHtml(f.key)} <b>${escapeHtml(f.value)}</b></span>`).join(' ')
      + '</div>'
    : ''
  html += `<div class="hint">参照：规格原文/技术参数为基础；结构化参数（参数→数值）为对比依据，参数数值组合决定物料规格变体；红色=与首行差异。${pHint}</div>${semLine}
    <table class="cmp"><thead><tr><th>编码</th><th>组织</th><th>名称</th><th>规格</th>${pHead}<th>单位</th></tr></thead><tbody>`
  nos.forEach((no, idx) => {
    const m0 = byNo[no][0]
    const spec = m0.fSpec || ''
    const specHtml = idx === 0 ? (escapeHtml(spec) || '-') : highlightDiff(refSpec, spec)
    const orgs = [...new Set(byNo[no].map((m) => m.org))].join('/')
    const cnt = byNo[no].length > 1 ? ` ×${byNo[no].length}` : ''
    const pCells = paramKeys.map((k) => {
      const v = m0.params?.[k] || ''
      const diff = idx !== 0 && v !== (refParams[k] || '')
      return `<td class="param${diff ? ' diff' : ''}">${escapeHtml(v) || '-'}</td>`
    }).join('')
    html += `<tr class="${idx === 0 ? 'ref' : ''}">
        <td><b>${no}</b>${cnt}</td>
        <td>${escapeHtml(orgs)}</td>
        <td>${escapeHtml(m0.fName || '-')}</td>
        <td class="spec">${specHtml}</td>
        ${pCells}
        <td>${escapeHtml(m0.unit || '-')}</td>
      </tr>`
  })
  html += `</tbody></table>`
  $('#modalBody').innerHTML = html
  $('#modal').classList.remove('hidden')
  $('#btnMapCluster').addEventListener('click', async () => {
    const canon = $('#canonSel').value
    let ok = 0
    for (const no of nos) {
      if (no === canon) continue
      await api('/api/mapping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldNo: no, newNo: canon, reason: '同物(归一签名:' + c.signature + ')查重归并', by: 'web' }) })
      ok++
    }
    alert(`已添加 ${ok} 条映射，统一视图已更新。`); $('#modal').classList.add('hidden'); loadCleanup()
  })
}

// ---------- 分类树 ----------
async function loadTree() {
  const d = await api('/api/classification')
  const el = $('#tree'); el.innerHTML = ''
  const cats = Object.values(d.tree.categories || {})
  cats.forEach((big) => {
    const h = document.createElement('div'); h.className = 'big'; h.textContent = `${big.code} ${big.name}`
    el.appendChild(h)
    Object.values(big.mid || {}).forEach((mid) => {
      const m = document.createElement('div'); m.className = 'mid'; m.textContent = `${mid.code} ${mid.name}（${mid.sub?.length || 0} 小类）`
      el.appendChild(m)
      ;(mid.sub || []).forEach((s) => {
        const s2 = document.createElement('div'); s2.className = 'sub'
        s2.textContent = `${s.code} ${s.name}` + (s.pattern ? `  规则 ${s.pattern}` : '') + (s.unit ? `  单位 ${s.unit}` : '') + (s.wh ? `  库 ${s.wh}` : '')
        el.appendChild(s2)
      })
    })
  })
}

// ---------- 存量清洗 ----------
async function loadCleanup() {
  const d = await api('/api/mapping')
  const mt = $('#mapTable tbody'); mt.innerHTML = ''
  Object.entries(d.mapping).forEach(([oldNo, v]) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${oldNo}</td><td>${v.to}</td><td>${v.reason || ''}</td><td>${v.by || ''}</td><td>${(v.at || '').slice(0, 10)}</td>
      <td><button data-delmap="${oldNo}">删</button></td>`
    mt.appendChild(tr)
  })
  mt.querySelectorAll('[data-delmap]').forEach((b) => b.addEventListener('click', async () => {
    await api('/api/mapping/' + encodeURIComponent(b.dataset.delmap), { method: 'DELETE' }); loadCleanup()
  }))
  const ft = $('#freezeTable tbody'); ft.innerHTML = ''
  Object.entries(d.freeze).forEach(([no, v]) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${no}</td><td>${v.reason || ''}</td><td>${v.by || ''}</td><td>${(v.at || '').slice(0, 10)}</td>
      <td><button data-delfrz="${no}">解</button></td>`
    ft.appendChild(tr)
  })
  ft.querySelectorAll('[data-delfrz]').forEach((b) => b.addEventListener('click', async () => {
    await api('/api/freeze/' + encodeURIComponent(b.dataset.delfrz), { method: 'DELETE' }); loadCleanup()
  }))
  $('#uCount').textContent = `统一编码 ${d.unifiedTotal} 个，已归并 ${d.mergedCount} 个`
  loadUnified(1)
}

async function loadUnified(page = 1) {
  unifiedPage = page
  const qs = new URLSearchParams({ page, pageSize: 50, mergedOnly: $('#uMerged').checked ? 1 : 0, q: unifiedFilters.q || '' }).toString()
  const d = await api('/api/unified?' + qs)
  const tb = $('#unifiedTable tbody'); tb.innerHTML = ''
  d.items.forEach((u) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td>${u.canonicalNo}</td><td>${u.name || ''}</td><td>${u.sourceCount}</td>
      <td>${(u.mergedFrom || []).join('、')}</td>`
    tb.appendChild(tr)
  })
  renderPager('#uPager', d.total, d.page, d.pageSize, loadUnified)
}

// ---------- 通用 ----------
function scrollPagerToTop(sel) {
  const el = $(sel)
  const panel = el && el.closest('.panel')
  if (panel) panel.scrollIntoView({ block: 'start' })
}
function renderPager(sel, total, page, pageSize, fn) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const el = $(sel); el.innerHTML = ''
  const mk = (label, p, dis, cls) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    if (cls) b.className = cls
    if (dis) b.disabled = true
    else b.onclick = () => { fn(p); scrollPagerToTop(sel) }
    return b
  }
  el.appendChild(mk('« 首页', 1, page <= 1))
  el.appendChild(mk('‹ 上一页', page - 1, page <= 1))
  const info = document.createElement('span')
  info.className = 'pginfo'
  info.textContent = ` 第 ${page}/${pages} 页 · 共 ${fmt(total)} 条 `
  el.appendChild(info)
  const jump = document.createElement('input')
  jump.type = 'number'; jump.min = 1; jump.max = pages; jump.value = page
  jump.className = 'pgjump'; jump.title = '输入页码后回车或点「跳转」'
  jump.onkeydown = (e) => { if (e.key === 'Enter') go.onclick() }
  const go = document.createElement('button')
  go.type = 'button'; go.textContent = '跳转'
  go.onclick = () => { let v = parseInt(jump.value, 10); if (!v || v < 1) v = 1; if (v > pages) v = pages; fn(v); scrollPagerToTop(sel) }
  el.appendChild(jump); el.appendChild(go)
  el.appendChild(mk('下一页 ›', page + 1, page >= pages))
  el.appendChild(mk('末页 »', pages, page >= pages))
}

// ---------- 事件 ----------
$('#btnSearch').addEventListener('click', () => {
  dedupFilters = { confidence: $('#fConfidence').value, sub: $('#fSub').value, q: $('#fQ').value }
  loadDedup(1)
})
$('#btnMSearch').addEventListener('click', () => {
  matFilters = { status: $('#mStatus').value, sub: $('#mSub').value, q: $('#mQ').value }
  loadMaterials(1)
})
$('#btnUSearch').addEventListener('click', () => { unifiedFilters = { q: $('#uQ').value }; loadUnified(1) })
$('#modalClose').addEventListener('click', () => $('#modal').classList.add('hidden'))
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') $('#modal').classList.add('hidden') })

$('#btnAddMap').addEventListener('click', async () => {
  const oldNo = $('#mOld').value.trim(), newNo = $('#mNew').value.trim()
  if (!oldNo || !newNo) return alert('请填旧编码与主编码')
  await api('/api/mapping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldNo, newNo, reason: $('#mReason').value, by: $('#mBy').value || 'web' }) })
  $('#mOld').value = ''; $('#mNew').value = ''; $('#mReason').value = ''
  loadCleanup()
})

// ---------- 后台重跑 ----------
function pollJob(id) {
  const t = setInterval(async () => {
    const j = await api('/api/job?id=' + id)
    $('#jobStatus').textContent = `任务${id}：${j.status === 'done' ? '完成 ✓' : j.status === 'error' ? '失败 ✗' : '运行中…'}`
    if (j.status !== 'running') { clearInterval(t); loadOverview() }
  }, 2000)
}
$('#btnRerunDedup').addEventListener('click', async () => {
  const { jobId } = await api('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: 'dedup' }) })
  pollJob(jobId)
})
$('#btnRerunExtract').addEventListener('click', async () => {
  if (!confirm('全量提取约需 1-2 分钟（跨网），确定重跑？')) return
  const { jobId } = await api('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: 'extract' }) })
  pollJob(jobId)
})

// ---------- 系统设置 ----------
let curInclude = [], curExclude = [], curOrg = ''
function renderChips() {
  const inc = $('#setInclude'); inc.innerHTML = ''
  curInclude.forEach((p, i) => {
    const c = document.createElement('span'); c.className = 'chip include'
    c.innerHTML = `${p} <span class="x">×</span>`
    c.querySelector('.x').onclick = () => { curInclude.splice(i, 1); renderChips() }
    inc.appendChild(c)
  })
  const exc = $('#setExclude'); exc.innerHTML = ''
  curExclude.forEach((p, i) => {
    const c = document.createElement('span'); c.className = 'chip exclude'
    c.innerHTML = `${p} <span class="x">×</span>`
    c.querySelector('.x').onclick = () => { curExclude.splice(i, 1); renderChips() }
    exc.appendChild(c)
  })
}
async function loadSettings() {
  const s = await api('/api/settings')
  curInclude = s.materialPrefix.include || []
  curExclude = s.materialPrefix.exclude || []
  curOrg = s.screenOrg || ''
  renderChips()
  await loadOrgs()
  loadSynonyms()
}

// ---------- 名称同义词字典维护（真源 src/config/name-synonyms.json；列表可直接编辑） ----------
const synState = { subs: null, items: [] }
const synAttr = (s) => escapeHtml(String(s == null ? '' : s)).replace(/"/g, '&quot;')

async function loadSynonyms() {
  const el = $('#synList')
  if (!el) return
  const kw = (($('#synSearch') && $('#synSearch').value) || '').trim()
  await loadSynSubs()
  const r = await api('/api/name-synonyms' + (kw ? '?kw=' + encodeURIComponent(kw) : ''))
  renderSynStats(r && r.stats)
  fillSynSubOptions()
  renderSynList((r && r.items) || [])
}

async function loadSynSubs() {
  if (synState.subs) return synState.subs
  const meta = await api('/api/new-material/meta')
  const list = []
  for (const b of ((meta && meta.tree) || [])) {
    for (const m of (b.mids || [])) {
      for (const s of (m.subs || [])) list.push({ sub: s.sub, subName: s.subName || '' })
    }
  }
  list.sort((a, b) => String(a.sub).localeCompare(String(b.sub)))
  synState.subs = list
  return list
}

function synSubOptsHtml(sel) {
  return '<option value="">全局（所有小类）</option>'
    + (synState.subs || []).map((x) => `<option value="${x.sub}"${x.sub === sel ? ' selected' : ''}>${x.sub} ${escapeHtml(x.subName)}</option>`).join('')
}

function fillSynSubOptions() {
  const sel = $('#synSub')
  if (!sel) return
  const cur = sel.value || ''
  sel.innerHTML = synSubOptsHtml(cur)
  sel.value = cur
}

function renderSynStats(st) {
  const el = $('#synStats')
  if (!el) return
  if (!st) { el.innerHTML = ''; return }
  el.innerHTML = `共 <b>${st.total}</b> 条（全局 ${st.global} / 小类 ${st.bySub}）`
}

function synMsg(text, isErr) {
  const el = $('#synMsg')
  if (!el) return
  el.textContent = text || ''
  el.className = 'syn-msg' + (isErr ? ' err' : '')
}

function renderSynList(items) {
  const el = $('#synList')
  if (!el) return
  synState.items = items
  if (!items.length) { el.innerHTML = '<p class="muted syn-empty">暂无记录</p>'; return }
  el.innerHTML = '<table class="syn-table"><thead><tr>'
    + '<th>非标准叫法</th><th>标准名称</th><th class="syn-th-scope">适用范围</th><th class="syn-th-act"></th>'
    + '</tr></thead><tbody>'
    + items.map((x, i) => `<tr data-i="${i}">
        <td><input class="syn-in" data-f="alias" value="${synAttr(x.alias)}" autocomplete="off" /></td>
        <td><input class="syn-in" data-f="std" value="${synAttr(x.std)}" autocomplete="off" /></td>
        <td class="syn-td-scope"><select class="syn-sel" data-f="sub">${synSubOptsHtml(x.sub || '')}</select></td>
        <td class="syn-acts">
          <button class="syn-btn syn-save">保存</button>
          <button class="syn-btn syn-del">删除</button>
        </td>
      </tr>`).join('')
    + '</tbody></table>'

  el.querySelectorAll('tr[data-i]').forEach((tr) => {
    const i = Number(tr.getAttribute('data-i'))
    const orig = items[i]
    if (!orig) return
    const pick = () => ({
      alias: (tr.querySelector('[data-f="alias"]').value || '').trim(),
      std: (tr.querySelector('[data-f="std"]').value || '').trim(),
      sub: (tr.querySelector('[data-f="sub"]').value || '').trim(),
    })
    const isDirty = () => {
      const v = pick()
      return v.alias !== orig.alias || v.std !== orig.std || v.sub !== (orig.sub || '')
    }
    tr.querySelectorAll('.syn-in, .syn-sel').forEach((inp) => {
      inp.addEventListener('input', () => tr.classList.toggle('dirty', isDirty()))
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter') { ev.preventDefault(); saveSynRow(tr, i) }
        else if (ev.key === 'Escape') { ev.preventDefault(); renderSynList(synState.items) }
      })
    })
    tr.querySelector('.syn-save').onclick = () => saveSynRow(tr, i)
    tr.querySelector('.syn-del').onclick = async () => {
      if (!confirm(`删除「${orig.alias}」${orig.sub ? '（小类 ' + orig.sub + '）' : '（全局）'}？`)) return
      const r = await api('/api/name-synonyms?alias=' + encodeURIComponent(orig.alias) + '&sub=' + encodeURIComponent(orig.sub || ''), { method: 'DELETE' })
      if (r && r.error) { synMsg('删除失败：' + r.error, true); return }
      synMsg('已删除')
      loadSynonyms()
    }
  })
}

async function saveSynRow(tr, i) {
  const orig = synState.items[i]
  if (!orig) return
  const v = {
    alias: (tr.querySelector('[data-f="alias"]').value || '').trim(),
    std: (tr.querySelector('[data-f="std"]').value || '').trim(),
    sub: (tr.querySelector('[data-f="sub"]').value || '').trim(),
  }
  if (!v.alias || !v.std) { synMsg('叫法与标准名都要填', true); return }
  if (v.alias === orig.alias && v.std === orig.std && v.sub === (orig.sub || '')) return
  tr.classList.add('saving')
  const r = await api('/api/name-synonyms', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldAlias: orig.alias, oldSub: orig.sub || '', alias: v.alias, std: v.std, sub: v.sub }),
  })
  tr.classList.remove('saving')
  if (r && r.error) { synMsg('保存失败：' + r.error, true); return }
  synMsg(`已保存：${v.alias} → ${v.std}`)
  loadSynonyms()
}
async function loadOrgs() {
  const orgs = await api('/api/orgs')
  const sel = $('#setOrg'); sel.innerHTML = ''
  const all = document.createElement('option'); all.value = ''; all.textContent = '（全部组织）'; sel.appendChild(all)
  orgs.forEach((o) => {
    const op = document.createElement('option')
    op.value = o.name; op.textContent = `${o.name}（${o.materialCount}）`
    sel.appendChild(op)
  })
  sel.value = curOrg
}
$('#btnAddInclude').addEventListener('click', () => {
  const v = $('#setIncludeInput').value.trim()
  if (v && !curInclude.includes(v)) { curInclude.push(v); $('#setIncludeInput').value = ''; renderChips() }
})
$('#btnAddExclude').addEventListener('click', () => {
  const v = $('#setExcludeInput').value.trim()
  if (v && !curExclude.includes(v)) { curExclude.push(v); $('#setExcludeInput').value = ''; renderChips() }
})
$('#btnSaveSettings').addEventListener('click', async () => {
  curOrg = $('#setOrg').value
  await api('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materialPrefix: { include: curInclude, exclude: curExclude }, screenOrg: curOrg }) })
  $('#settingsMsg').textContent = '已保存（需重新提取生效）'
  loadOverview()
})
async function addSynonym() {
  const alias = ($('#synAlias').value || '').trim()
  const std = ($('#synStd').value || '').trim()
  const sub = ($('#synSub').value || '').trim()
  if (!alias || !std) { synMsg('叫法与标准名都要填', true); return }
  const r = await api('/api/name-synonyms', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ alias, std, sub }),
  })
  if (r && r.error) { synMsg('添加失败：' + r.error, true); return }
  synMsg(`已保存：${alias} → ${std}${sub ? '（小类 ' + sub + '）' : '（全局）'}`)
  $('#synAlias').value = ''; $('#synStd').value = ''
  loadSynonyms()
}
$('#btnAddSyn') && ($('#btnAddSyn').onclick = addSynonym)
$('#synAlias') && $('#synAlias').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); $('#synStd').focus() } })
$('#synStd') && $('#synStd').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addSynonym() } })
let synSearchTimer = null
$('#synSearch') && $('#synSearch').addEventListener('input', () => {
  clearTimeout(synSearchTimer)
  synSearchTimer = setTimeout(loadSynonyms, 300)
})

// ---------- 启动 ----------
loadOverview()

// ================= 特征参数录入（新增菜单，不动原页面） =================
let feat = { tpl: null, tree: null, templates: null, selMid: null, work: { page: 1, filters: {}, items: [], sel: null } }

async function apiPost(p, body, method = 'POST') {
  const r = await fetch(p, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return r.json()
}
async function apiSend(p, method = 'DELETE') {
  const r = await fetch(p, { method })
  return r.json()
}

// 子标签切换
document.querySelectorAll('.feat-tab').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('.feat-tab').forEach((x) => x.classList.remove('active'))
  document.querySelectorAll('.feat-pane').forEach((x) => x.classList.remove('active'))
  b.classList.add('active')
  $('#feat-' + b.dataset.feat).classList.add('active')
}))

async function ensureFeat() {
  if (!feat.tpl) {
    const t = await api('/api/feature-templates')
    feat.tpl = t; feat.tree = t.tree; feat.templates = t.templates
  }
}
async function loadFeature() {
  await ensureFeat()
  renderTplView()
  renderWorkView(1)
}

// ---------- ① 中类标准模板（左侧大类→中类选择，右侧编辑；小类在右侧点名称编辑） ----------
function renderTplView() {
  const tree = feat.tree || []
  const el = $('#feat-tpl')
  const navHtml = tree.map((b) => `
    <div class="nav-big">${b.big} ${b.bigName}</div>
    <div class="nav-mids">${b.mids.map((m) => `<button class="mid-item" data-mid="${m.midKey}"><span>${m.midName}</span><span class="cnt">${m.subCount}</span></button>`).join('')}</div>`).join('')
  el.innerHTML = `
    <div class="tpl-guide"><b>中类标准模板</b><span class="help" data-help="第一步：在每个中类下维护标准特征参数及其展示顺序（型号 → 电气 → 线缆/结构 → 材料/外观）。&#10;左侧选大类/中类，右侧编辑有序参数；点右侧「小类」名称可独立编辑该小类特征参数。">ⓘ</span></div>
    <div class="tpl-layout">
      <aside class="tpl-nav">${navHtml}</aside>
      <section class="tpl-main" id="tplEditor"></section>
    </div>`
  el.querySelectorAll('.mid-item').forEach((c) => c.onclick = () => { feat.selSub = null; renderTplEditor(c.dataset.mid) })
  const first = (feat.selMid && feat.templates[feat.selMid]) ? feat.selMid : (tree[0] && tree[0].mids[0] && tree[0].mids[0].midKey)
  if (first) renderTplEditor(first)
}

function renderTplEditor(midKey) {
  feat.selMid = midKey
  const t = feat.templates[midKey]
  if (!t) return
  const el = $('#tplEditor')
  document.querySelectorAll('.mid-item').forEach((c) => c.classList.toggle('active', c.dataset.mid === midKey))
  const subBtns = (t.subs || []).map((s) => `<button class="sub-edit-btn" data-sub="${s.code}">${s.code} ${s.name}</button>`).join('')
  el.innerHTML = `
    <div class="tpl-head">
      <div>
        <div class="tpl-crumb">${t.bigName} <span class="muted">/</span> ${t.midName}</div>
        <div class="muted small">中类 ${midKey} · 含 ${t.subCount} 个小类</div>
      </div>
    </div>
    <div class="tpl-subs"><div class="tpl-subs-label">该中类下小类<span class="help" data-help="点名称即编辑其特征参数；选中后下方切换为小类参数，便于频繁切换。">ⓘ</span></div><div class="sub-edit-list">${subBtns || '<span class="muted">—</span>'}</div></div>
    <div id="paramEditor"></div>`
  el.querySelectorAll('.sub-edit-btn').forEach((c) => c.onclick = () => selectSub(c.dataset.sub, midKey))
  // 下方只保留一组参数编辑区：已选中小类→小类参数，否则中类默认参数（避免重复两组）
  if (feat.selSub && (t.subs || []).some((s) => s.code === feat.selSub)) {
    document.querySelectorAll('.sub-edit-btn').forEach((c) => c.classList.toggle('active', c.dataset.sub === feat.selSub))
    renderSubPanel(feat.selSub, midKey)
  } else {
    renderMidPanel(midKey)
  }
}

// 删除参数定义前，统计该中类下有多少物料已给该参数赋过非空值（保护物料已录入数据）
async function checkParamUsage(midKey, name) {
  try {
    const r = await api('/api/feature-param-usage?midKey=' + encodeURIComponent(midKey) + '&name=' + encodeURIComponent(name))
    return (r && r.count) || 0
  } catch (e) { return 0 }
}

// 中类标准参数编辑（未选小类时显示，作为该中类下所有小类的默认继承）
// mount: 挂载容器选择器；onChange: 模板变更后回调（如抽屉里联动左栏）
function renderMidPanel(midKey, mount = '#paramEditor', onChange = null) {
  const t = feat.templates[midKey]
  if (!t) return
  const cur = t.params || []
  const el = $(mount)
  const cust = (feat.tpl.customParams && feat.tpl.customParams[midKey]) || []
  const candPool = [...new Set([...(t.candidates || []), ...cust])]
  const addOpts = '<option value="">+ 添加参数</option>' +
    candPool.filter((p) => !cur.includes(p)).map((p) => `<option value="${p}">${p}</option>`).join('')
  const refresh = () => renderMidPanel(midKey, mount, onChange)
  const after = () => { if (onChange) onChange() }
  // 任何本地改动（增删/排序）都立即持久化：否则后续从服务器重新拉取模板覆盖本地时，未保存的修改会被旧数据冲掉（表现为"删掉的又出现"）
  const persist = async () => {
    const r = await apiPost('/api/feature-templates', { midKey, params: feat.templates[midKey].params, midName: t.midName, bigName: t.bigName }, 'PUT')
    if (r && r.error) { const m = el.querySelector('#tplMsg'); if (m) m.textContent = '保存失败：' + r.error }
  }
  el.innerHTML = `
    <div class="tpl-block-h">中类标准特征参数（默认供该中类下所有小类继承；顺序即展示顺序）</div>
    <ol class="tpl-list" id="tplList">${cur.map((p, i) => { const isC = cust.includes(p); return `
      <li data-i="${i}" class="${isC ? 'custom' : ''}"><span class="tpl-idx">${i + 1}</span><span class="tpl-name">${p}</span>${isC ? '<span class="tag">自定义</span>' : ''}
        <span class="tpl-act">
          <button data-act="up" data-i="${i}" ${i === 0 ? 'disabled' : ''} title="上移">↑</button>
          <button data-act="down" data-i="${i}" ${i === cur.length - 1 ? 'disabled' : ''} title="下移">↓</button>
          <button data-act="del" data-i="${i}" class="danger" title="从本中类移除（自定义名会保留在候选池，可重新添加）">✕</button>
        </span></li>` }).join('')}</ol>
    ${cur.length === 0 ? '<p class="muted">该中类暂无参数，请从下方「添加参数」或点「复位默认」。</p>' : ''}
    <div class="tpl-add">
      <span class="add-lab">添加参数</span><select id="tplAdd">${addOpts}</select><button id="tplAddBtn">添加</button>
      <span class="add-lab">自定义</span><input id="tplCustom" placeholder="输入新参数名" /><span class="add-act"><button id="tplCustomBtn">新增并加入</button><span class="help" data-help="自定义名共享本大类下所有中类/小类">ⓘ</span></span>
    </div>
    ${cust.length ? `<div class="custom-pool"><span class="muted">本大类已添加自定义参数（点 ✕ 从候选池删除）：</span>${cust.map((n) => `<span class="chip">${escapeHtml(n)}<button class="chip-del" data-n="${escapeHtml(n)}" title="从候选池删除">✕</button></span>`).join('')}</div>` : ''}
    <div class="tpl-foot">
      <button id="tplReset" class="ghost">复位默认</button>
      <button id="tplSave" class="primary">保存模板</button>
      <span id="tplMsg" class="muted"></span>
    </div>`
  el.querySelectorAll('#tplList .tpl-act button').forEach((b) => b.onclick = async () => {
    const i = +b.dataset.i, act = b.dataset.act, arr = feat.templates[midKey].params
    if (act === 'del') {
      const p = arr[i]
      const used = await checkParamUsage(midKey, p)
      if (used > 0 && !window.confirm('参数「' + p + '」已被 ' + used + ' 个物料录入赋值。\n从参数列表删除后，这些物料的录入值将不再显示（数据仍保留在库，重新加入该参数后可恢复）。\n\n确定删除？')) return
      arr.splice(i, 1)
      await persist() // 立即保存删除结果，避免之后重新拉取模板时被旧数据覆盖"复活"
      refresh()
      el.querySelector('#tplMsg').textContent = used > 0 ? ('已从本中类移除（' + used + ' 个物料的该值已不再显示，重加可恢复）') : '已从本中类移除，名称保留在候选池（可重新添加）'
      if (used === 0) { const r = await apiPost('/api/feature-templates', { action: 'removeCustomParam', midKey, name: p }, 'PUT'); if (r && !r.error) { const t2 = await api('/api/feature-templates'); feat.tpl = t2; feat.tree = t2.tree; feat.templates = t2.templates; refresh() } }
      after(); return
    }
    if (act === 'up' && i > 0) { const x = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = x }
    else if (act === 'down' && i < arr.length - 1) { const x = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = x }
    await persist()
    refresh(); after()
  })
  el.querySelector('#tplAddBtn').onclick = async () => { const v = el.querySelector('#tplAdd').value; if (v) { feat.templates[midKey].params.push(v); await persist(); refresh(); after() } }
  el.querySelector('#tplReset').onclick = async () => {
    await apiPost('/api/feature-templates', { action: 'reset', midKey }, 'PUT')
    const t2 = await api('/api/feature-templates'); feat.tpl = t2; feat.tree = t2.tree; feat.templates = t2.templates
    refresh(); el.querySelector('#tplMsg').textContent = '已复位默认'; after()
  }
  el.querySelector('#tplSave').onclick = async () => {
    await apiPost('/api/feature-templates', { midKey, params: feat.templates[midKey].params, midName: t.midName, bigName: t.bigName }, 'PUT')
    el.querySelector('#tplMsg').textContent = '已保存'; after()
  }
  el.querySelector('#tplCustomBtn').onclick = async () => {
    const name = (el.querySelector('#tplCustom').value || '').trim()
    if (!name) { el.querySelector('#tplMsg').textContent = '请输入参数名'; return }
    await apiPost('/api/feature-templates', { action: 'addCustomParam', midKey, name }, 'PUT')
    const t2 = await api('/api/feature-templates'); feat.tpl = t2; feat.tree = t2.tree; feat.templates = t2.templates
    if (!feat.templates[midKey].params.includes(name)) feat.templates[midKey].params.push(name)
    await apiPost('/api/feature-templates', { midKey, params: feat.templates[midKey].params, midName: t.midName, bigName: t.bigName }, 'PUT')
    refresh(); el.querySelector('#tplMsg').textContent = '已新增自定义参数「' + name + '」并加入本中类（仅当前中类）'; after()
  }
  el.querySelectorAll('.chip-del').forEach((b) => b.onclick = async () => {
    const n = b.dataset.n
    const r = await apiPost('/api/feature-templates', { action: 'removeCustomParam', midKey, name: n }, 'PUT')
    if (r && r.error) { el.querySelector('#tplMsg').textContent = '删除失败：' + r.error; return }
    const t2 = await api('/api/feature-templates'); feat.tpl = t2; feat.tree = t2.tree; feat.templates = t2.templates
    refresh(); el.querySelector('#tplMsg').textContent = '已从候选池删除「' + n + '」'; after()
  })
}

// ---------- 小类参数编辑：小类列表固定，选中后下方固定显示其参数面板 ----------
function selectSub(sub, midKey, mount = '#paramEditor', onChange = null) {
  feat.selMid = midKey
  feat.selSub = sub
  $('#tplEditor').querySelectorAll('.sub-edit-btn').forEach((c) => c.classList.toggle('active', c.dataset.sub === sub))
  renderSubPanel(sub, midKey, mount, onChange)
}

function renderSubPanel(sub, midKey, mount = '#paramEditor', onChange = null) {
  const t = feat.templates[midKey]
  if (!t) return
  feat.selMid = midKey
  feat.selSub = sub
  if (!t.subParams) t.subParams = {}
  if (!t.subParams[sub]) t.subParams[sub] = (t.params || []).slice() // 小类默认继承中类
  const cur = t.subParams[sub]
  const panel = $(mount)
  if (!panel) return
  const subName = (t.subs || []).find((s) => s.code === sub)
  const cust = (feat.tpl.customParams && feat.tpl.customParams[midKey]) || []
  const candPool = [...new Set([...(t.candidates || []), ...cust])]
  const addOpts = '<option value="">+ 添加参数</option>' +
    candPool.filter((p) => !cur.includes(p)).map((p) => `<option value="${p}">${p}</option>`).join('')
  const refresh = () => renderSubPanel(sub, midKey, mount, onChange)
  const after = () => { if (onChange) onChange() }
  panel.innerHTML = `
    <div class="sub-edit-panel">
      <div class="tpl-head">
        <div>
          <div class="tpl-crumb">${t.bigName} <span class="muted">/</span> ${t.midName} <span class="muted">/</span> <b>小类 ${sub}</b> ${subName ? subName.name : ''}</div>
          <div class="muted small">小类独立参数（优先于中类默认，共 ${cur.length} 项）· 选中已固定，可点其它小类切换</div>
        </div>
        <button id="subPanelClose" class="ghost" title="回到中类默认模板">回到中类 ✕</button>
      </div>
      <div class="tpl-block-h">小类特征参数（顺序即展示顺序；已继承中类，可独立增减 / 自定义）</div>
      <ol class="tpl-list" id="subTplList">${cur.map((p, i) => { const isC = cust.includes(p); return `
        <li data-i="${i}" class="${isC ? 'custom' : ''}"><span class="tpl-idx">${i + 1}</span><span class="tpl-name">${p}</span>${isC ? '<span class="tag">自定义</span>' : ''}
          <span class="tpl-act">
            <button data-act="up" data-i="${i}" ${i === 0 ? 'disabled' : ''} title="上移">↑</button>
            <button data-act="down" data-i="${i}" ${i === cur.length - 1 ? 'disabled' : ''} title="下移">↓</button>
            <button data-act="del" data-i="${i}" class="danger" title="从本小类移除（不影响中类，名称保留在候选池可重加）">✕</button>
          </span></li>` }).join('')}</ol>
      ${cur.length === 0 ? '<p class="muted">该小类暂无独立参数，已完全继承中类。可添加或自定义。</p>' : ''}
      <div class="tpl-add">
        <span class="add-lab">添加参数</span><select id="subTplAdd">${addOpts}</select><button id="subTplAddBtn">添加</button>
        <span class="add-lab">自定义</span><input id="subTplCustom" placeholder="输入新参数名" /><span class="add-act"><button id="subTplCustomBtn">新增并加入</button><span class="help" data-help="自定义名共享本大类下所有中类/小类">ⓘ</span></span>
      </div>
      ${cust.length ? `<div class="custom-pool"><span class="muted">本大类已添加自定义参数（点 ✕ 从候选池删除）：</span>${cust.map((n) => `<span class="chip">${escapeHtml(n)}<button class="chip-del" data-n="${escapeHtml(n)}" title="从候选池删除">✕</button></span>`).join('')}</div>` : ''}
      <div class="tpl-foot">
        <button id="subTplInherit" class="ghost">复位继承中类</button>
        <button id="subTplSave" class="primary">保存小类</button>
        <span id="subTplMsg" class="muted"></span>
      </div>
    </div>`
  const msg = (s) => { panel.querySelector('#subTplMsg').textContent = s }
  // 任何本地改动（增删/排序）都立即持久化：否则后续重新拉取模板覆盖本地时，未保存的修改会被旧数据冲掉（表现为"删掉的又出现"）
  const persist = async () => {
    const r = await apiPost('/api/feature-templates', { midKey, sub, params: feat.templates[midKey].subParams[sub], midName: t.midName, bigName: t.bigName }, 'PUT')
    if (r && r.error) msg('保存失败：' + r.error)
  }
  panel.querySelectorAll('#subTplList .tpl-act button').forEach((b) => b.onclick = async () => {
    const i = +b.dataset.i, act = b.dataset.act, arr = feat.templates[midKey].subParams[sub]
    if (act === 'del') {
      const p = arr[i]
      const used = await checkParamUsage(midKey, p)
      if (used > 0 && !window.confirm('参数「' + p + '」已被 ' + used + ' 个物料录入赋值。\n从本小类参数列表删除后，这些物料的录入值将不再显示（数据仍保留在库，重新加入该参数后可恢复）。\n\n确定删除？')) return
      arr.splice(i, 1)
      await persist() // 立即保存删除结果，避免之后重新拉取模板时被旧数据覆盖"复活"
      refresh()
      msg(used > 0 ? ('已从本小类移除（' + used + ' 个物料的该值已不再显示，重加可恢复）') : '已从本小类移除，名称保留在候选池（可重新添加）')
      if (used === 0) { const r = await apiPost('/api/feature-templates', { action: 'removeCustomParam', midKey, name: p }, 'PUT'); if (r && !r.error) { const t2 = await api('/api/feature-templates'); feat.tpl = t2; feat.tree = t2.tree; feat.templates = t2.templates; refresh() } }
      after(); return
    }
    if (act === 'up' && i > 0) { const x = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = x }
    else if (act === 'down' && i < arr.length - 1) { const x = arr[i + 1]; arr[i + 1] = arr[i]; arr[i] = x }
    await persist()
    refresh(); after()
  })
  panel.querySelector('#subTplAddBtn').onclick = async () => { const v = panel.querySelector('#subTplAdd').value; if (v) { feat.templates[midKey].subParams[sub].push(v); await persist(); refresh(); after() } }
  panel.querySelector('#subPanelClose').onclick = () => { feat.selSub = null; refresh && renderMidPanel(midKey, mount, onChange); after() }
  panel.querySelector('#subTplInherit').onclick = async () => {
    await apiPost('/api/feature-templates', { action: 'resetSub', midKey, sub }, 'PUT')
    const t2 = await api('/api/feature-templates'); feat.tpl = t2; feat.tree = t2.tree; feat.templates = t2.templates
    refresh(); msg('已复位：本小类回落到中类默认'); after()
  }
  panel.querySelector('#subTplSave').onclick = async () => {
    await apiPost('/api/feature-templates', { midKey, sub, params: feat.templates[midKey].subParams[sub], midName: t.midName, bigName: t.bigName }, 'PUT')
    msg('已保存小类参数'); after()
  }
  panel.querySelector('#subTplCustomBtn').onclick = async () => {
    const name = (panel.querySelector('#subTplCustom').value || '').trim()
    if (!name) { msg('请输入参数名'); return }
    await apiPost('/api/feature-templates', { action: 'addCustomParam', midKey, name }, 'PUT')
    const t2 = await api('/api/feature-templates'); feat.tpl = t2; feat.tree = t2.tree; feat.templates = t2.templates
    if (!feat.templates[midKey].subParams[sub].includes(name)) feat.templates[midKey].subParams[sub].push(name)
    await apiPost('/api/feature-templates', { midKey, sub, params: feat.templates[midKey].subParams[sub], midName: t.midName, bigName: t.bigName }, 'PUT')
    refresh(); msg('已新增自定义参数「' + name + '」并加入本小类（仅当前中类）'); after()
  }
  panel.querySelectorAll('.chip-del').forEach((b) => b.onclick = async () => {
    const n = b.dataset.n
    const r = await apiPost('/api/feature-templates', { action: 'removeCustomParam', midKey, name: n }, 'PUT')
    if (r && r.error) { msg('删除失败：' + r.error); return }
    const t2 = await api('/api/feature-templates'); feat.tpl = t2; feat.tree = t2.tree; feat.templates = t2.templates
    refresh(); msg('已从候选池删除「' + n + '」'); after()
  })
}

// ---------- ② 参数录入工作台 ----------
async function renderWorkView(page = 1) {
  feat.work.page = page
  const tree = feat.tree || []
  const f = feat.work.filters
  const qs = new URLSearchParams({ page, pageSize: 50, ...f }).toString()
  const d = await api('/api/materials?' + qs)
  let items = d.items || []
  // human（人工录入）过滤已交由服务端 /api/materials 处理（human 参数），前端不再重复过滤，避免 items 子集与 total 不一致导致跨页/边界错乱
  feat.work.items = items
  feat.work.total = (d.meta && (d.meta.filtered != null ? d.meta.filtered : d.meta.total)) || items.length
  feat.work.pageSize = 50
  feat.work.humanFiltered = false
  const el = $('#feat-work')
  const midOpts = '<option value="">全部中类</option>' + tree.map((b) =>
    `<optgroup label="${b.big} ${b.bigName}">` + b.mids.map((m) => `<option value="${m.midKey}">${m.midName}</option>`).join('') + '</optgroup>').join('')
  const selMid = f.sub && f.sub.length === 4 ? f.sub : (f.sub && f.sub.length === 6 ? f.sub.slice(0, 4) : '')
  const midObj = tree.flatMap((b) => b.mids).find((m) => m.midKey === selMid)
  const subOpts = '<option value="">全部小类</option>' +
    (midObj ? midObj.subs.map((s) => `<option value="${s.code}" ${s.code === f.sub ? 'selected' : ''}>${s.code} ${s.name}</option>`).join('') : '')
  el.innerHTML = `
    <div class="tpl-guide"><b>参数录入工作台</b><span class="help" data-help="第二步：读取原物料规格/主要参数/技术参数，人工把每个参数值填入标准模板。&#10;第三步：可用「应用自动提取」一键带入规则结果，或勾选多条「批量预填」。">ⓘ</span></div>
    <div class="feat-filter">
      <label>中类 <select id="wMid">${midOpts}</select></label>
      <label>小类 <select id="wSub">${subOpts}</select></label>
      <label>状态 <select id="wStatus">
        <option value="">全部</option><option value="missing">有缺项</option>
        <option value="h1">已人工录入</option><option value="h0">未人工录入</option></select></label>
      <label>关键词 <input id="wQ" value="${f.q || ''}" placeholder="编码/名称/规格" /></label>
      <button id="wSearch" class="primary">查询</button>
      <button id="wBulk" class="primary">批量预填选中</button>
      <span id="wMsg" class="muted"></span>
    </div>
    <table class="mat" id="featTable"><thead><tr>
      <th><input type="checkbox" id="wAll" /></th><th>编码</th><th>小类</th><th>名称</th><th>规格原文</th><th>状态</th><th>人工</th><th>新规格型号</th></tr></thead><tbody></tbody></table>
    <div class="pager" id="featPager"></div>
    <div id="featEditor"></div>`
  const tb = el.querySelector('#featTable tbody')
  items.forEach((m) => {
    const tr = document.createElement('tr')
    tr.innerHTML = `<td><input type="checkbox" class="wchk" data-fn="${m.fnumber}" /></td>
      <td>${m.fnumber}</td><td>${m.subName || ''}</td><td>${escapeHtml(m.name || '')}</td>
      <td class="src">${escapeHtml((m.spec || '').slice(0, 60))}</td>
      <td><span class="tag ${m.status}">${m.status === 'ok' ? '通过' : m.status === 'missing' ? '缺项' : '缺陷'}</span></td>
      <td>${ (m.humanFields || []).length ? '<span class="tag ok">✓</span>' : '' }</td>
      <td class="model-col">${escapeHtml(m.model || '')}</td>`
    tr.style.cursor = 'pointer'
    tr.onclick = (e) => { if (e.target.classList.contains('wchk')) return; openFeatureMaterial(m.fnumber) }
    tb.appendChild(tr)
  })
  $('#wMid').onchange = () => {
    const mk = $('#wMid').value
    feat.work.filters.sub = mk // 中类前4位 → 过滤该中类全部小类
    const mobj = tree.flatMap((b) => b.mids).find((m) => m.midKey === mk)
    const so = $('#wSub'); so.innerHTML = '<option value="">全部小类</option>' + (mobj ? mobj.subs.map((s) => `<option value="${s.code}">${s.code} ${s.name}</option>`).join('') : '')
    renderWorkView(1)
  }
  $('#wSub').onchange = () => { feat.work.filters.sub = $('#wSub').value; renderWorkView(1) }
  $('#wStatus').onchange = () => {
    const v = $('#wStatus').value
    feat.work.filters.status = (v === 'missing') ? 'missing' : ''
    feat.work.filters.human = (v === 'h1') ? '1' : (v === 'h0') ? '0' : ''
    renderWorkView(1)
  }
  $('#wSearch').onclick = () => { feat.work.filters.q = $('#wQ').value.trim(); renderWorkView(1) }
  $('#wAll').onchange = () => { el.querySelectorAll('.wchk').forEach((c) => c.checked = $('#wAll').checked) }
  $('#wBulk').onclick = async () => {
    const fns = [...el.querySelectorAll('.wchk:checked')].map((c) => c.dataset.fn)
    if (!fns.length) { $('#wMsg').textContent = '请先勾选物料'; return }
    const r = await apiPost('/api/feature-bulk-apply', { fnumbers: fns })
    $('#wMsg').textContent = `已批量预填 ${r.applied || 0} 条（规则提取结果）`
    renderWorkView(page)
  }
  renderPager('#featPager', d.meta.filtered || items.length, page, 50, renderWorkView)
}

async function openFeatureMaterial(fnumber) {
  const m = await api('/api/feature-material?fnumber=' + encodeURIComponent(fnumber))
  if (!m || !m.fnumber) return
  await ensureFeat() // 确保 feat.templates/feat.tpl 已加载，否则下方渲染会因 null 崩溃导致右侧空白
  feat.work.sel = fnumber
  feat.selSub = null // 进入抽屉默认按"当前物料是否有小类覆盖"决定视角
  // 确保右侧标准模板面板能定位到该物料所属中类；若中类尚未在①页维护过，先用物料信息构造兜底模板
  if (!feat.templates[m.midKey]) {
    feat.templates[m.midKey] = {
      midKey: m.midKey, midName: m.midName || m.midKey, bigName: m.bigName || '',
      big: m.mid || '', params: (m.templateParams || []).slice(), candidates: [], subParams: {}, subs: []
    }
  }
  feat.selMid = m.midKey
  showDrawer()
  renderDrawerHead(m)
  renderDrawerLeft(m)
  renderDrawerTpl(m.midKey, m.sub, () => renderDrawerLeft(m))
}

function showDrawer() {
  const mask = $('#drawerMask'); if (!mask) return
  mask.onclick = closeDrawer
  document.onkeydown = (e) => { if (e.key === 'Escape') closeDrawer() }
  mask.classList.add('open')
  $('#drawer').classList.add('open')
}
function closeDrawer() {
  $('#drawerMask').classList.remove('open')
  $('#drawer').classList.remove('open')
}
function renderDrawerHead(m) {
  const H = $('#drawerHead'); if (!H) return
  const items = feat.work.items || []
  const idx = items.findIndex((x) => x.fnumber === m.fnumber)
  const pageSize = feat.work.pageSize || 50
  const total = feat.work.total || 0
  const pages = total ? Math.max(1, Math.ceil(total / pageSize)) : 1
  const atStart = idx <= 0 && feat.work.page <= 1
  const atEnd = idx >= 0 && idx >= items.length - 1 && feat.work.page >= pages
  H.innerHTML = `
    <div class="dw-title"><h3>${m.name || ''} <span class="muted">(${m.fnumber} · ${m.subName})</span></h3></div>
    <div class="dw-ops">
      <button id="dwPrev" ${atStart ? 'disabled' : ''}>‹ 上一条</button>
      <button id="dwNext" ${atEnd ? 'disabled' : ''}>下一条 ›</button>
      <button id="dwClose" class="ghost">关闭 ✕</button>
    </div>`
  H.querySelector('#dwClose').onclick = closeDrawer
  H.querySelector('#dwPrev').onclick = () => gotoAdjacent(-1)
  H.querySelector('#dwNext').onclick = () => gotoAdjacent(1)
}
// 上一条/下一条：页内直接切换；到达本页边界时自动加载相邻页并跳到边界物料（跨页连续浏览，避免到边界卡死）
let _navLock = false
async function gotoAdjacent(delta) {
  if (_navLock) return
  _navLock = true
  try {
    const items = feat.work.items || []
    const idx = items.findIndex((x) => x.fnumber === feat.work.sel)
    if (idx < 0) return
    if (idx + delta >= 0 && idx + delta < items.length) {
      await openFeatureMaterial(items[idx + delta].fnumber)
      return
    }
    const pageSize = feat.work.pageSize || 50
    const total = feat.work.total || 0
    const pages = total ? Math.max(1, Math.ceil(total / pageSize)) : 1
    const tp = feat.work.page + (delta > 0 ? 1 : -1)
    if (tp < 1 || tp > pages) return
    await renderWorkView(tp)
    const ni = feat.work.items || []
    const ti = delta > 0 ? 0 : ni.length - 1
    if (ni[ti]) await openFeatureMaterial(ni[ti].fnumber)
  } finally {
    _navLock = false
  }
}
// 左栏：物料参数填报（原文 + 参数值），随标准模板即时联动
function renderDrawerLeft(m) {
  const tplEntry = feat.templates[m.midKey]
  const subParams = tplEntry && tplEntry.subParams && tplEntry.subParams[m.sub]
  const tpl = subParams || (tplEntry ? tplEntry.params : (m.templateParams || []))
  const rule = m.ruleParams || {}
  const ov = (m.override && m.override.params) || {}
  const custom = (m.override && m.override.custom) || []
  const val = (k) => {
    if (ov[k] != null && ov[k] !== '') return ov[k]
    const c = custom.find((x) => x.name === k)
    if (c && c.value) return c.value
    return rule[k] != null ? rule[k] : ''
  }
  const srcTokens = buildSrcTokens(m)
  const fields = tpl.map((k, i) => `<label class="fp"><span>${k}</span><div class="fp-wrap"><input id="fp_${i}" data-k="${k}" autocomplete="off" value="${escapeHtml(String(val(k)))}" /><div class="fp-suggest" id="fps_${i}"></div></div></label>`).join('')
  let decHtml = ''
  const ds = m.decodeSuggestions
  if (ds && typeof ds === 'object') {
    const rows = Object.entries(ds).map(([k, v]) => {
      const vv = (v && typeof v === 'object') ? (v.value != null ? v.value : '') : v
      const adopt = tpl.includes(k) ? `<button data-adopt="${k}" data-val="${escapeHtml(String(vv))}">采纳</button>` : ''
      return `<tr><td>${k}</td><td>${escapeHtml(String(vv))}</td><td>${adopt}</td></tr>`
    }).join('')
    if (rows) decHtml = `<h4>按型号解码建议（人工确认采纳）</h4><table class="mat"><thead><tr><th>参数</th><th>解码值</th><th></th></tr></thead><tbody>${rows}</tbody></table>`
  }
  const L = $('#dwLeft'); if (!L) return
  const byK = (k) => L.querySelector('[data-k="' + k + '"]') // 按参数名查找（属性选择器，参数名含括号也安全）
  L.innerHTML = `
    <div class="src-box">
      <h4>原文（读取后人工填入下方参数）</h4>
      <div class="src-cols">
        <div><b>规格</b><textarea readonly>${escapeHtml(m.spec || '')}</textarea></div>
        <div><b>主要参数</b><textarea readonly>${escapeHtml(m.zycs || '')}</textarea></div>
        <div><b>技术参数</b><textarea readonly>${escapeHtml(m.jscs || '')}</textarea></div>
      </div>
    </div>
    <h4>特征参数（当前生效来源：${subParams ? '小类 ' + m.sub + ' 覆盖' : '中类 ' + m.midKey + ' 默认'}）· 共 ${tpl.length} 项</h4>
    <div class="fp-grid">${fields}</div>
    <div class="feat-actions">
      <button id="fpSave" class="primary">保存</button>
      <button id="fpAuto">应用自动提取</button>
      <button id="fpRaw">带入原文</button>
      <button id="fpClear" class="ghost">清空人工</button>
      <span id="fpMsg" class="muted"></span>
    </div>
    <div id="fpModel" class="model-line">${m.override && m.override.model ? '整合规格型号：' + escapeHtml(m.override.model) : ''}</div>
    ${decHtml}`
  L.querySelectorAll('[data-adopt]').forEach((b) => b.onclick = () => { const k = b.dataset.adopt, v = b.dataset.val; const inp = byK(k); if (inp) inp.value = v })
  L.querySelector('#fpAuto').onclick = () => tpl.forEach((k) => { const i = byK(k); if (i) i.value = rule[k] != null ? rule[k] : '' })
  L.querySelector('#fpRaw').onclick = () => {
    const raw = [m.spec, m.zycs, m.jscs].filter((x) => x && x.trim()).join('\n')
    const box = $('#fp_其它'); if (box) box.value = raw; else L.querySelector('#fpMsg').textContent = '本中类无「其它」参数，无法带入原文'
  }
  L.querySelector('#fpClear').onclick = async () => { await apiSend('/api/feature-override?fnumber=' + encodeURIComponent(m.fnumber)); m.override = { params:{}, custom:[], model:'' }; L.querySelector('#fpMsg').textContent = '已清空人工录入'; renderDrawerLeft(m) }
  L.querySelector('#fpSave').onclick = async () => {
    const params = {}; tpl.forEach((k) => { const i = byK(k); if (i) params[k] = i.value.trim() })
    const customKept = custom.filter((c) => !tpl.includes(c.name)) // 保留非标准参数的旧自定义项，防误删
    const model = tpl.map((k) => params[k]).filter((v) => v && v.trim()).join(' ') // 整合规格型号：非空参数值以空格分隔
    await apiPost('/api/feature-override', { fnumber: m.fnumber, mid: m.mid, params, custom: customKept, by: 'web', model })
    Object.entries(params).forEach(([k, v]) => { if (v) saveHist(k, v) }) // 记录历史录入
    L.querySelector('#fpMsg').textContent = '已保存（' + Object.keys(params).length + ' 参数）'
    if (!m.override) m.override = {}
    m.override.params = params; m.override.model = model; m.override.custom = customKept
    const fm = L.querySelector('#fpModel'); if (fm) fm.textContent = model ? '整合规格型号：' + model : ''
    const it = feat.work.items.find((x) => x.fnumber === m.fnumber); if (it) { it.humanFields = Object.keys(params); it.model = model }
    // 若处于"已/未人工录入"过滤视图，补全后刷新工作台列表，使该行状态（人工标记/是否仍符合筛选）实时同步
    if (feat.work.filters && feat.work.filters.human) renderWorkView(feat.work.page)
  }
  tpl.forEach((k) => { const inp = byK(k); if (inp) bindSuggest(inp, srcTokens, k) })
  L.scrollTop = 0
}

// 历史录入记录（按参数名存 localStorage，最近 10 条）
function getHist(k) {
  try { return JSON.parse(localStorage.getItem('featHist:' + k) || '[]') } catch (e) { return [] }
}
function saveHist(k, v) {
  try {
    const key = 'featHist:' + k
    const arr = JSON.parse(localStorage.getItem(key) || '[]').filter((x) => x !== v)
    arr.unshift(v)
    localStorage.setItem(key, JSON.stringify(arr.slice(0, 10)))
  } catch (e) {}
}

// 从原文（规格/主要参数/技术参数）按空格提取可联想片段
function buildSrcTokens(m) {
  const text = [m.spec, m.zycs, m.jscs].filter((x) => x && x.trim()).join(' ').replace(/\s+/g, ' ')
  const set = new Set()
  text.split(' ').forEach((t) => { const s = t.trim(); if (s) set.add(s) })
  return [...set]
}
// 录入时按输入子串从原文片段联想，点击即填入（以空格截断的原文 token）
function bindSuggest(inp, tokens, key) {
  const box = inp.parentElement && inp.parentElement.querySelector('.fp-suggest')
  if (!box) return
  const show = () => {
    const v = inp.value.trim()
    if (!v) { box.classList.remove('show'); box.innerHTML = ''; return }
    const SEP_SRC = '\\s/\\+\\*×·~～,，。;；:：()（）\\-'
    const suggestFor = (t, v) => {
      const vv = v.toLowerCase()
      if (t.toLowerCase().startsWith(vv)) return t // 命中整条开头（无空格截断）→ 建议整条
      const parts = t.split(new RegExp('([' + SEP_SRC + '])')) // 保留分隔符，偶数索引为子段
      for (let i = 0; i < parts.length; i += 2) {
        if (parts[i].toLowerCase().startsWith(vv)) return parts.slice(i).join('') // 从该子段起到片段末尾
      }
      return null
    }
    const histHits = key ? getHist(key).filter((h) => h.toLowerCase() !== v.toLowerCase()).map((h) => suggestFor(h, v)).filter(Boolean) : []
    const srcHits = tokens.map((t) => suggestFor(t, v)).filter(Boolean)
    const hits = [...new Set([...histHits, ...srcHits])].slice(0, 12)
    if (!hits.length) { box.classList.remove('show'); box.innerHTML = ''; return }
    box.innerHTML = hits.map((t) => `<div data-v="${escapeHtml(t)}">${escapeHtml(t)}</div>`).join('')
    box.classList.add('show')
    box.querySelectorAll('div').forEach((d) => d.onclick = () => { inp.value = d.dataset.v; box.classList.remove('show'); inp.focus() })
  }
  inp.addEventListener('input', show)
  inp.addEventListener('focus', show)
  inp.addEventListener('blur', () => setTimeout(() => box.classList.remove('show'), 150))
}

// 右栏：标准模板编辑（中类/小类），改动即时联动左栏
function renderDrawerTpl(midKey, sub, onChange) {
  const t = feat.templates[midKey]
  const R = $('#dwRight'); if (!R || !t) return
  const subBtns = (t.subs || []).map((s) => `<button class="sub-edit-btn ${feat.selSub === s.code ? 'active' : ''} ${s.code === sub ? 'cur' : ''}" data-sub="${s.code}">${s.code} ${s.name}${s.code === sub ? ' ·当前' : ''}</button>`).join('')
  R.innerHTML = `
    <div class="dw-tpl-head">
      <div class="tpl-crumb">${t.bigName ? t.bigName + ' / ' : ''}${t.midName || midKey} <span class="muted">(${midKey})</span></div>
      <div class="tpl-subs-label">标准模板（编辑即时联动左侧填报）· 左侧来源：${feat.selSub ? '小类 ' + feat.selSub : '中类默认'}</div>
      <div class="sub-edit-list"><button class="sub-edit-btn ${!feat.selSub ? 'active' : ''}" data-sub="">中类默认</button>${subBtns || ''}</div>
    </div>
    <div id="dwTplPanel"></div>`
  R.querySelectorAll('.sub-edit-btn').forEach((c) => c.onclick = () => {
    const s = c.dataset.sub
    feat.selSub = s || null
    R.querySelectorAll('.sub-edit-btn').forEach((x) => x.classList.toggle('active', x.dataset.sub === (s || '')))
    if (s) renderSubPanel(s, midKey, '#dwTplPanel', onChange)
    else renderMidPanel(midKey, '#dwTplPanel', onChange)
    if (onChange) onChange()
  })
  // 默认视角：当前物料已有小类覆盖 → 进小类面板，否则中类默认
  const initSub = (t.subParams && t.subParams[sub]) ? sub : ''
  if (initSub && (t.subs || []).some((s) => s.code === initSub)) { feat.selSub = initSub; renderSubPanel(initSub, midKey, '#dwTplPanel', onChange) }
  else { feat.selSub = null; renderMidPanel(midKey, '#dwTplPanel', onChange) }
}

// ================= 新增物料（编码：小类6位 + 5位流水；本地草稿 + 导出） =================
let nm = { meta: null, items: [], cur: { big: '', mid: '', sub: '', wh: '', code: '' }, bound: false, timer: null, sugSeq: 0, nameTipTimer: null, nameTipSeq: 0 }

async function loadNewMat() {
  if (!nm.meta) nm.meta = (await api('/api/new-material/meta')) || { tree: [] }
  nm.items = (await api('/api/new-material')).items || []
  loadSnapshotTip()
  if (!nm.bound) bindNmEvents()
  renderNmSelectors()
  renderNmList()
}

function bindNmEvents() {
  nm.bound = true
  $('#nmBig').onchange = onNmBigChange
  $('#nmMid').onchange = onNmMidChange
  $('#nmSub').onchange = onNmSubChange
  $('#nmSave').onclick = nmSave
  $('#nmSimilar').onclick = () => nmShowSimilar(false)
  $('#nmExport').onclick = () => window.open('/api/new-material/export', '_blank')
  $('#nmSpec').addEventListener('input', () => {
    clearTimeout(nm.timer)
    nm.timer = setTimeout(nmSpecInput, 300)
    nmRuleTick()
  })
  // 名称：边打字边在同义词浮层里即时提示（轻量接口，120ms 防抖）
  $('#nmName').addEventListener('input', nmNameInput)
  $('#nmName').addEventListener('focus', () => { if (($('#nmName').value || '').trim()) nmNameSuggest() })
  $('#nmName').addEventListener('keydown', (e) => { if (e.key === 'Escape') hideNmNameTip() })
  $('#nmSpec').addEventListener('focus', () => { if (($('#nmSpec').value || '').trim()) nmSpecInput() })
  document.addEventListener('click', (e) => {
    const box = $('#nmSuggest'), inp = $('#nmSpec')
    if (box && inp && !box.contains(e.target) && e.target !== inp) {
      nm.sugSeq++ // 点在外部：作废在途联想请求
      box.classList.remove('show'); box.innerHTML = ''
    }
    const tip = $('#nmNameTip'), nInp = $('#nmName')
    if (tip && nInp && !tip.contains(e.target) && e.target !== nInp) hideNmNameTip()
  })
}

// ---- 名称同义词即时提示（浮层贴在名称输入框下方，只在有建议时弹出） ----
function nmNameInput() {
  clearTimeout(nm.nameTipTimer)
  nm.nameTipTimer = setTimeout(nmNameSuggest, 120)
  nmRuleTick() // 名称的长度/禁用字符等规则校验仍走底部（与同义词建议互不重复）
}

async function nmNameSuggest() {
  const box = $('#nmNameTip')
  const inp = $('#nmName')
  if (!box || !inp) return
  const raw = inp.value || ''
  if (!raw.trim()) { hideNmNameTip(); return }
  const sub = (nm.cur && nm.cur.sub) || ''
  const seq = (nm.nameTipSeq = (nm.nameTipSeq || 0) + 1)
  // 传原始值（含首尾空格），让后端能检测出「首尾有空格」
  const r = await api('/api/name-synonyms/suggest?name=' + encodeURIComponent(raw) + '&sub=' + encodeURIComponent(sub))
  if (seq !== nm.nameTipSeq) return // 有更新的输入，丢弃过期响应
  // 三层优先级：① 存量名称联想 → ② 同义词统一叫法 → ③ 小类标准名兜底
  // 名称含型号/参数（TRVV电缆、24V电源模块…）：只提示标准写法（点一下把名称改成实物名，规格不动）
  const modelTip = (r && r.nameModel && r.nameModel.core) ? r.nameModel : null
  const stockMatches = (r && r.nameMatches) || []
  const synMatches = (r && r.matches) || []
  const fallback = (r && r.subFallback) || null
  if (!stockMatches.length && !synMatches.length && !fallback && !modelTip) { hideNmNameTip(); return }
  const tagOf = (m) => {
    if (m.exact) return '完全一致'
    if (m.from === 'prefix') return '打字中'
    if (m.from === 'format') return (m.reasons || []).join(' · ') || '格式修正'
    return '含此叫法'
  }
  const stockTag = (m) => {
    const where = m.inSub ? '本小类' : (m.sub ? '小类 ' + m.sub + (m.subName ? ' ' + m.subName : '') : '其它小类')
    return `${m.count || 0} 条 · ${where}`
  }
  let html = ''
  if (modelTip) {
    // 只提示标准写法：点一下就把名称改成建议的实物名（规格不动，型号由用户自己写进规格）
    html += '<div class="nm-name-tip-head">💡 建议用标准写法（名称只写实物名）</div>'
      + `<div class="nm-name-tip-row nm-name-tip-split" data-split="1">
          <b>${escapeHtml(modelTip.core)}</b>
          <span class="nm-name-tip-arrow">← 型号/参数</span>
          <span class="nm-name-tip-alias">${escapeHtml((modelTip.moved || []).join(' '))}</span>
          <span class="nm-name-tip-tag">写进规格</span>
        </div>`
  }
  if (stockMatches.length) {
    html += '<div class="nm-name-tip-head">① 存量已有名称（点击填入）</div>'
      + stockMatches.map((m, i) => `<div class="nm-name-tip-row" data-s="${i}">
          <b>${escapeHtml(m.name)}</b>
          ${m.std ? `<span class="nm-name-tip-arrow">同义词</span><b class="nm-name-tip-std" data-std="${i}">${escapeHtml(m.std)}</b>` : ''}
          <span class="nm-name-tip-tag">${escapeHtml(stockTag(m))}</span>
        </div>`).join('')
  }
  if (synMatches.length) {
    html += '<div class="nm-name-tip-head">② 统一叫法（同义词，点击填入）</div>'
      + synMatches.map((m, i) => `<div class="nm-name-tip-row" data-i="${i}">
          <span class="nm-name-tip-alias">${escapeHtml(m.alias)}</span>
          <span class="nm-name-tip-arrow">→</span>
          <b>${escapeHtml(m.std)}</b>
          <span class="nm-name-tip-tag">${tagOf(m)}${m.scope === 'sub' ? ' · 本小类' : ''}</span>
        </div>`).join('')
  }
  if (fallback) {
    html += '<div class="nm-name-tip-head">③ 本小类标准名（兜底）</div>'
      + `<div class="nm-name-tip-row" data-fb="1">
          <b>${escapeHtml(fallback.name)}</b>
          <span class="nm-name-tip-tag">存量无此叫法</span>
        </div>`
  }
  html += modelTip
    ? '<div class="nm-name-tip-sub">仅提示标准写法，不影响保存；型号/参数请自行写进规格</div>'
    : '<div class="nm-name-tip-sub">仅提示，不影响保存</div>'
  box.innerHTML = html
  box.classList.add('show')

  const fill = (v) => {
    inp.value = v
    hideNmNameTip() // 选中即收起，不再重复弹出候选
    inp.focus()
    nmRuleCheck() // 只刷新底部的规则校验
  }
  box.querySelectorAll('[data-split]').forEach((row) => {
    // 只改名称（采纳标准写法），规格一个字都不动
    row.onclick = (ev) => { ev.stopPropagation(); fill(modelTip.core) }
  })
  box.querySelectorAll('.nm-name-tip-row[data-s]').forEach((row) => {
    const m = stockMatches[Number(row.getAttribute('data-s'))]
    if (m) row.onclick = (ev) => { ev.stopPropagation(); fill(m.name) }
  })
  // 「同义词」标准名：点了才改成标准叫法（存量叫法本身可能已过时）
  box.querySelectorAll('[data-std]').forEach((el) => {
    const m = stockMatches[Number(el.getAttribute('data-std'))]
    if (m && m.std) el.onclick = (ev) => { ev.stopPropagation(); fill(m.std) }
  })
  box.querySelectorAll('.nm-name-tip-row[data-i]').forEach((row) => {
    const m = synMatches[Number(row.getAttribute('data-i'))]
    if (m) row.onclick = (ev) => { ev.stopPropagation(); fill(m.std) }
  })
  box.querySelectorAll('.nm-name-tip-row[data-fb]').forEach((row) => {
    if (fallback) row.onclick = (ev) => { ev.stopPropagation(); fill(fallback.name) }
  })
}

function hideNmNameTip() {
  // 作废在途的联想请求，否则刚收起就被稍后返回的旧响应重新弹开
  nm.nameTipSeq = (nm.nameTipSeq || 0) + 1
  const box = $('#nmNameTip')
  if (box) { box.classList.remove('show'); box.innerHTML = '' }
}

function nmTree() { return (nm.meta && nm.meta.tree) || [] }
function nmBigNode() { return nmTree().find((b) => b.big === nm.cur.big) || null }
function nmMidNode() { const b = nmBigNode(); return b ? ((b.mids || []).find((m) => m.midKey === nm.cur.mid) || null) : null }
function nmSubNode() { const m = nmMidNode(); return m ? ((m.subs || []).find((s) => s.sub === nm.cur.sub) || null) : null }

function renderNmSelectors() {
  const tree = nmTree()
  $('#nmBig').innerHTML = tree.map((b) => `<option value="${b.big}">${b.big} ${escapeHtml(b.bigName)}</option>`).join('')
  if (!nm.cur.big && tree[0]) nm.cur.big = tree[0].big
  if (nm.cur.big) $('#nmBig').value = nm.cur.big

  const b = nmBigNode()
  $('#nmMid').innerHTML = b ? (b.mids || []).map((m) => `<option value="${m.midKey}">${m.midKey} ${escapeHtml(m.midName)}</option>`).join('') : ''
  if (b && !(b.mids || []).some((m) => m.midKey === nm.cur.mid)) nm.cur.mid = b.mids[0] ? b.mids[0].midKey : ''
  if (nm.cur.mid) $('#nmMid').value = nm.cur.mid

  const m = nmMidNode()
  $('#nmSub').innerHTML = m ? (m.subs || []).map((s) => `<option value="${s.sub}">${s.sub} ${escapeHtml(s.subName)}</option>`).join('') : ''
  if (m && !(m.subs || []).some((s) => s.sub === nm.cur.sub)) nm.cur.sub = m.subs[0] ? m.subs[0].sub : ''
  if (nm.cur.sub) $('#nmSub').value = nm.cur.sub

  onNmSubPicked()
}

function onNmBigChange() {
  nm.cur.big = $('#nmBig').value
  const b = nmBigNode()
  nm.cur.mid = b && b.mids[0] ? b.mids[0].midKey : ''
  nm.cur.sub = ''
  renderNmSelectors()
}
function onNmMidChange() {
  nm.cur.mid = $('#nmMid').value
  const m = nmMidNode()
  nm.cur.sub = m && m.subs[0] ? m.subs[0].sub : ''
  renderNmSelectors()
}
function onNmSubChange() {
  nm.cur.sub = $('#nmSub').value
  onNmSubPicked()
}

function onNmSubPicked() {
  const s = nmSubNode()
  nm.cur.wh = s ? (s.wh || '') : ''
  $('#nmWh').textContent = nm.cur.wh || '-'
  $('#nmCode').textContent = '生成中…'
  // 小类变了：同义词建议与本小类常用名称联想都要按新小类重判
  if (($('#nmName').value || '').trim()) nmNameSuggest()
  else hideNmNameTip()
  refreshNmCode()
}

async function refreshNmCode() {
  if (!nm.cur.sub) { $('#nmCode').textContent = '-'; return }
  const r = await api('/api/new-material/next-code?sub=' + encodeURIComponent(nm.cur.sub))
  if (r && r.code) {
    nm.cur.code = r.code
    $('#nmCode').textContent = r.code
    $('#nmCodeMsg').textContent = '自动生成 · 流水 ' + r.seq
  } else {
    nm.cur.code = ''
    $('#nmCode').textContent = '-'
    $('#nmCodeMsg').textContent = (r && r.error) || '编码生成失败'
  }
  renderNmInv()
}

function nmSpecInput() {
  const q = ($('#nmSpec').value || '').trim()
  const el = $('#nmSuggest')
  if (!nm.cur.sub || !q) {
    nm.sugSeq++
    el.innerHTML = ''; el.classList.remove('show')
    $('#nmSpecCheck').innerHTML = ''
    renderNmInv()
    return
  }
  const sub = encodeURIComponent(nm.cur.sub)
  const seq = ++nm.sugSeq
  api('/api/new-material/spec-suggest?sub=' + sub + '&q=' + encodeURIComponent(q))
    .then((r) => {
      // 期间已选中某项/已失焦/已改输入 → 在途结果作废，不能把下拉又弹回来
      if (seq !== nm.sugSeq) return
      renderNmSuggest(q, (r && r.items) || [], r && r.modelSummary)
    })
  api('/api/new-material/spec-check?sub=' + sub + '&spec=' + encodeURIComponent(q))
    .then((r) => { if (seq !== nm.sugSeq) return; renderNmSpecCheck(r || {}) }) // 与联想同seq：旧响应不得覆盖新输入
  renderNmInv() // 规格变化后刷新「同规格参考库存」
}

// ---- 查重快照保鲜：提示快照是否过期，并提供一键重跑（提取 + 查重） ----
async function loadSnapshotTip() {
  const el = $('#nmSnapTip')
  if (!el) return
  const st = await api('/api/snapshot/status')
  renderSnapshotTip(st)
}
function renderSnapshotTip(st) {
  const el = $('#nmSnapTip')
  if (!el) return
  if (!st || st.error) { el.innerHTML = ''; return }
  const age = st.local && st.local.ageDays != null ? st.local.ageDays : null
  const total = st.local && st.local.total != null ? fmt(st.local.total) : ''
  if (!st.stale) {
    const bits = []
    if (total) bits.push(total + ' 条')
    if (age != null) bits.push(age + ' 天前提取')
    el.innerHTML = bits.length ? `<span class="nm-snap-ok">✓ 查重快照：${bits.join(' · ')}</span>` : ''
    return
  }
  el.innerHTML = `<div class="nm-snap-warn">⚠ 查重快照可能过期：${escapeHtml((st.reasons || []).join('；'))}
    <button class="ghost nm-snap-btn" id="nmSnapRefresh">立即更新</button>
    <span class="nm-hit-sub">未更新时，保存会先向 ERP 实时核对一次</span></div>`
  const btn = $('#nmSnapRefresh')
  if (btn) btn.onclick = refreshSnapshot
}
async function refreshSnapshot() {
  const el = $('#nmSnapTip')
  if (!el) return
  el.innerHTML = '<span class="muted">正在重新提取 + 查重，请稍候（约 1~3 分钟）…</span>'
  const r = await apiPost('/api/snapshot/refresh', {})
  if (!r || r.error || !r.jobId) {
    el.innerHTML = '<span class="nm-rule-err">触发失败：' + escapeHtml((r && r.error) || '未知错误') + '</span>'
    return
  }
  let n = 0
  const tick = async () => {
    n++
    const st = await api('/api/snapshot/status?force=1')
    if (st && !st.stale) {
      renderSnapshotTip(st)
      nm.meta = null
      loadNewMat()
      return
    }
    if (n >= 60) {
      el.innerHTML = '<span class="nm-rule-warn">更新耗时较长，可稍后刷新页面查看结果</span>'
      return
    }
    setTimeout(tick, 5000)
  }
  setTimeout(tick, 5000)
}

// ---- 名称/型号规格「书写与录入规则」实时校验（规则见 src/config/material-rules.json） ----
function nmRuleTick() {
  clearTimeout(nm.ruleTimer)
  nm.ruleTimer = setTimeout(nmRuleCheck, 350)
}

function nmRuleCheck() {
  const el = $('#nmRuleCheck')
  if (!el) return
  const name = ($('#nmName').value || '').trim()
  const spec = ($('#nmSpec').value || '').trim()
  if (!name && !spec) { el.innerHTML = ''; return }
  api('/api/new-material/validate?name=' + encodeURIComponent(name)
    + '&spec=' + encodeURIComponent(spec) + '&sub=' + encodeURIComponent(nm.cur.sub || ''))
    .then((r) => renderNmRule(r || {}))
}

function renderNmRule(r) {
  const el = $('#nmRuleCheck')
  if (!el) return
  const errs = r.errors || [], warns = r.warnings || []
  let html
  if (!errs.length && !warns.length) html = '<div class="nm-ok">✓ 名称与规格符合录入规则</div>'
  else {
    html = errs.map((e) => `<div class="nm-rule-err">✕ ${escapeHtml(e)}</div>`).join('')
      + warns.map((w) => `<div class="nm-rule-warn">! ${escapeHtml(w)}</div>`).join('')
  }
  // 同义词建议与常用名称联想都在名称输入框的浮层里，这里只管规则错误
  el.innerHTML = html
}

// 只刷新查重提示与参考库存，不查联想（选中某个联想项后调用，避免下拉再次弹出）
function nmSpecCheckOnly() {
  const q = ($('#nmSpec').value || '').trim()
  const el = $('#nmSuggest')
  if (el) { el.innerHTML = ''; el.classList.remove('show') }
  if (!nm.cur.sub || !q) {
    $('#nmSpecCheck').innerHTML = ''
    renderNmInv()
    return
  }
  const sub = encodeURIComponent(nm.cur.sub)
  api('/api/new-material/spec-check?sub=' + sub + '&spec=' + encodeURIComponent(q))
    .then((r) => renderNmSpecCheck(r || {}))
  renderNmInv()
}

function renderNmSuggest(q, items, summary) {
  const el = $('#nmSuggest')
  // 输入框里已经是完整规格时，不再把它自己当"联想项"重复列出
  const qn = String(q || '').trim().toLowerCase()
  const list = (items || []).filter((it) => String(it.spec || '').trim().toLowerCase() !== qn)
  if (!list.length) { el.innerHTML = ''; el.classList.remove('show'); return }
  const ql = q.toLowerCase()
  // 输入正好是一个型号段时，先说明"这个型号已有多少规格"，避免一条条翻候选
  const head = summary
    ? '<div class="nm-series">ℹ 同型号系列 <b class="mono">' + escapeHtml(summary.model) + '</b>（含变体）：同小类已有 <b>'
      + summary.specCount + '</b> 条规格 / <b>' + summary.itemCount + '</b> 个物料，挑最接近的即可</div>'
    : ''
  el.innerHTML = head + list.map((it) => {
    const s = String(it.spec || '')
    const idx = s.toLowerCase().indexOf(ql)
    const html = idx >= 0
      ? escapeHtml(s.slice(0, idx + q.length)) + '<b class="nm-tail">' + escapeHtml(s.slice(idx + q.length)) + '</b>'
      : escapeHtml(s)
    const stock = it.qty != null ? `库存 ${fmt(it.qty)}` : ''
    const series = it.model && it.seriesSpecs > 1 ? `型号段 ${it.seriesSpecs} 条` : ''
    const cnt = [series, stock].filter(Boolean).join(' · ')
    return `<div data-v="${escapeHtml(s)}">${html}<span class="nm-cnt">${cnt}</span></div>`
  }).join('')
  el.classList.add('show')
  el.querySelectorAll('div[data-v]').forEach((d) => d.onclick = () => {
    const v = d.dataset.v
    clearTimeout(nm.timer)   // 作废还在等待的防抖查询
    nm.sugSeq++              // 作废在途的联想响应，否则下拉会被它重新弹出来挡住下面的字段
    $('#nmSpec').value = v
    el.classList.remove('show'); el.innerHTML = ''
    nmSpecCheckOnly()        // 只刷新查重提示/参考库存，不再查联想
    nmRuleTick()             // 值是被程序改的，不会触发 input，需手动跑规则校验
    const unit = $('#nmUnit')
    if (unit) unit.focus()   // 选中后直接跳到单位，方便继续录入
  })
}

function renderNmSpecCheck(c) {
  const el = $('#nmSpecCheck')
  const exact = c.exact || [], similar = c.similar || [], separatorOnly = c.separatorOnly || []
  const series = c.series || null
  // 同型号系列提示：输入只到型号阶段时（如 iC65N），完全/相似都命中不了，
  // 但同小类可能已有一批该型号的规格 —— 这类"半截输入"恰恰是设计人员最需要提醒的时刻
  const seriesHtml = series
    ? '<div class="nm-series">ℹ 同型号系列 <b class="mono">' + escapeHtml(series.model) + '</b>：同小类已有 <b>'
      + series.specCount + '</b> 条规格 / <b>' + series.itemCount + '</b> 个物料，请先确认是否已有完全相同的规格'
      + (series.samples || []).slice(0, 4).map((x) => `<div class="nm-hit nm-hit-series"><b>${escapeHtml(x.fnumber)}</b> · <span class="mono nm-series-spec" data-fill="${escapeHtml(x.spec)}">${escapeHtml(x.spec)}</span></div>`).join('')
      + '</div>'
    : ''
  if (!exact.length && !separatorOnly.length && !similar.length) {
    el.innerHTML = seriesHtml || (c.erpChecked
      ? '<span class="nm-ok">✓ 未发现相同规格（已实时核对 ERP）</span>'
      : '<span class="nm-ok">✓ 未发现相同规格</span>')
    if (seriesHtml) bindNmSeriesFill(el)
    return
  }
  // ERP 实时补查出来的命中项，单独标注来源
  const erpTag = (h) => (h.fromErp ? '<span class="nm-badge erp">ERP实时</span> ' : '')
  const stockHtml = (h) => {
    if (h.qty == null) return ''
    const avb = h.avbqty !== h.qty ? '（可用 ' + fmt(h.avbqty) + '）' : ''
    // 数字单独包一层：在「仅写法不同」那行里用实心黄底反色块，突出已有库存量
    return ` · <span class="nm-stock">库存 <span class="nm-stock-num">${fmt(h.qty)}</span>${avb}</span>`
  }
  let html = seriesHtml
  if (exact.length) {
    html += '<div class="nm-warn">⚠ 同小类已存在完全相同型号规格，不能重复新增：</div>'
    html += exact.slice(0, 5).map((h) => `<div class="nm-hit">${erpTag(h)}<span class="nm-badge exact">完全相同</span> <b>${escapeHtml(h.fnumber)}</b> · ${escapeHtml(h.spec)}${stockHtml(h)}</div>`).join('')
  }
  // 仅分隔符/空格写法不同 → 同一物，同样不能重复新增，请沿用原写法
  if (separatorOnly.length) {
    const curSpec = ($('#nmSpec').value || '').trim()
    html += '<div class="nm-warn">⚠ 已存在仅写法不同（分隔符/空格差异）的相同规格，请沿用原编码与原写法：</div>'
    html += separatorOnly.slice(0, 5).map((h) => {
      // 黄色标出与当前输入的差异：分隔符/大小写差异优先，词元增删回落通用比对
      const sepHtml = curSpec ? sepDiffHtml(curSpec, h.spec) : null
      const dh = sepHtml || (curSpec && nmSpecDiffHtml(curSpec, h.spec)) || escapeHtml(h.spec)
      const tip = sepHtml ? '<span class="nm-hit-sub">黄底=差异（分隔符/大小写）</span>' : ''
      return `<div class="nm-hit nm-hit-sep">${erpTag(h)}<span class="nm-badge sep">仅写法不同</span> <b>${escapeHtml(h.fnumber)}</b> · <span class="mono">${dh}</span>${stockHtml(h)}${tip}</div>`
    }).join('')
  }
  if (similar.length) {
    html += '<div class="nm-warn">高度相似，请确认是否确为新物料：</div>'
    html += similar.slice(0, 5).map((h) => `<div class="nm-hit">${erpTag(h)}<span class="nm-badge high">${Math.round((h.similarity || 0) * 100)}%</span> <b>${escapeHtml(h.fnumber)}</b> · ${escapeHtml(h.spec)}${stockHtml(h)}</div>`).join('')
  }
  el.innerHTML = html
  bindNmSeriesFill(el)
}

// 「同型号系列」里的样例规格可点击填入，方便直接沿用已有写法
function bindNmSeriesFill(el) {
  el.querySelectorAll('[data-fill]').forEach((n) => {
    n.style.cursor = 'pointer'
    n.onclick = () => {
      $('#nmSpec').value = n.getAttribute('data-fill')
      nmSpecCheckOnly()
      nmRuleTick()
    }
  })
}

async function renderNmInv() {
  const el = $('#nmInv')
  if (!el) return
  const code = String(nm.cur.code || '').trim()
  if (!code) { el.innerHTML = ''; return }
  const spec = ($('#nmSpec').value || '').trim()
  el.innerHTML = '<div class="nm-inv-box"><b>即时库存</b><span class="muted"> 查询中…</span></div>'
  const r = await api('/api/new-material/inventory?code=' + encodeURIComponent(code)
    + '&sub=' + encodeURIComponent(nm.cur.sub || '')
    + '&spec=' + encodeURIComponent(spec))
  if (!r || !r.available) {
    el.innerHTML = `<div class="nm-inv-box"><b>即时库存</b><span class="muted"> ${escapeHtml((r && r.note) || '库存查询失败')}</span></div>`
    const se0 = $('#nmSpecStock'); if (se0) se0.textContent = '现有库存 -'
    return
  }
  const t = r.total || {}
  const unit = escapeHtml(r.unit || '')
  const se = $('#nmSpecStock')
  // 数量用反色块（实心黄底 + 深色字），与查重提示里的库存数字保持一致
  if (se) se.innerHTML = (r.found || r.mode === 'reference')
    ? '现有库存 <span class="nm-stock-num">' + fmt(t.qty) + '</span>'
    : '现有库存 -'
  // 新编码尚未建档 → 「现有库存」只统计规格完全相同的存量物料；相似规格在「类似型号」弹窗查看
  if (r.mode === 'reference') {
    const n = (r.matched || []).length
    if (!n) {
      el.innerHTML = `<div class="nm-inv-box"><b>现有库存</b><span class="muted"> ${escapeHtml(r.note || '无完全相同规格的存量物料')}</span></div>`
      return
    }
    let html = `<div class="nm-inv-box"><b>现有库存</b><span class="muted"> 完全相同规格 ${n} 个物料</span>
      <span class="nm-inv-sum">数量 <b>${fmt(t.qty)}</b> ${unit}</span>
      <span class="nm-inv-sum">可用 <b class="nm-ok">${fmt(t.avbqty)}</b> ${unit}</span></div>`
    const wh = (r.warehouses || []).slice(0, 8).map((w) => `<span class="nm-wh-chip">${escapeHtml(w.stockName || ('仓库#' + w.stockId))}：${fmt(w.qty)} ${unit}</span>`)
    if (wh.length) html += '<div class="nm-inv-wh">' + wh.join('') + '</div>'
    el.innerHTML = html
    return
  }
  if (r.found === false) {
    const note = spec ? (r.note || '暂无库存') : '填写规格型号后可查看同规格存量库存'
    el.innerHTML = `<div class="nm-inv-box"><b>即时库存</b><span class="muted"> ${escapeHtml(note)}</span></div>`
    return
  }
  let html = `<div class="nm-inv-box"><b>即时库存</b>
    <span class="nm-inv-sum">数量 <b>${fmt(t.qty)}</b> ${unit}</span>
    <span class="nm-inv-sum">可用 <b class="nm-ok">${fmt(t.avbqty)}</b> ${unit}</span>
    <span class="nm-inv-sum">锁库 <b class="nm-warn">${fmt(t.lockqty)}</b> ${unit}</span></div>`
  if ((r.warehouses || []).length) {
    html += '<div class="nm-inv-wh">' + r.warehouses.map((w) => {
      const name = w.stockName || ('仓库#' + w.stockId)
      const extra = w.avbqty !== w.qty ? '（可用 ' + fmt(w.avbqty) + '）' : ''
      return `<span class="nm-wh-chip">${escapeHtml(name)}：${fmt(w.qty)} ${unit}${extra}</span>`
    }).join('') + '</div>'
  } else {
    html += '<div class="nm-inv-wh"><span class="nm-wh-chip">暂无分仓库存</span></div>'
  }
  el.innerHTML = html
}

// 类似型号弹窗：物料号 / 名称 / 规格 / 库存数量 / 项目号
async function nmShowSimilar(refresh) {
  if (!nm.cur.sub) { alert('请先选择小类'); return }
  const spec = ($('#nmSpec').value || '').trim()
  if (!spec) { alert('请先填写规格型号'); return }
  const body = $('#modalBody')
  if (!body) return
  // 先弹窗再查：ERP 首次查询库存/项目号较慢，先给出"查询中"反馈，不让用户觉得按钮没反应
  body.innerHTML = '<h3>类似型号明细</h3><p class="muted">查询中…（首次查询较慢，结果会缓存到本地，下次秒开）</p>'
  $('#modal').classList.remove('hidden')
  const r = await api('/api/new-material/similar-models?sub=' + encodeURIComponent(nm.cur.sub)
    + '&spec=' + encodeURIComponent(spec) + '&code=' + encodeURIComponent(nm.cur.code || '')
    + (refresh === true ? '&refresh=1' : ''))
  const items = (r && r.items) || []
  const total = (r && r.total) || { qty: 0, avbqty: 0 }
  let html = `<h3>类似型号明细 <span class="muted">（同小类相同/相似规格，共 ${items.length} 条）</span></h3>`
  if (r && r.error) {
    html += `<p class="muted">查询失败：${escapeHtml(String(r.error))}</p>`
    body.innerHTML = html
    return
  }
  if (r && r.pending > 0) {
    html += `<p class="muted small nm-warn">其中 ${r.pending} 条库存/项目号未取到（可能查询超时），
      <a href="javascript:void 0" id="nmSimRefresh">点此重查</a>；已取到的结果正常展示并可缓存复用。</p>`
  }
  if (!items.length) {
    html += '<p class="muted">未找到类似型号的存量物料</p>'
  } else {
    html += `<p class="muted small">合计数量 ${fmt(total.qty)} · 可用 ${fmt(total.avbqty)}</p>`
    html += `<p class="muted small">录入规格：<span class="mono">${escapeHtml(spec)}</span>　<span class="nm-diff-legend">黄色</span>= 与该规格的差异部分</p>`
    html += '<table class="mat nm-sim-table"><thead><tr><th>物料号</th><th>名称</th><th>规格型号</th><th>数量</th><th>项目号（最近业务）</th></tr></thead><tbody>'
    html += items.map((d) => {
      // 与「已录入的规格」逐词元对比，差异部分黄色标出（分隔符原样保留）
      const specHtml = nmSpecDiffHtml(spec, d.spec)
      return `<tr>
      <td class="mono">${escapeHtml(d.fnumber)}</td>
      <td>${escapeHtml(d.name || '')}</td>
      <td>${specHtml}</td>
      <td class="num">${fmt(d.qty)}</td>
      <td title="${escapeHtml(d.projectLastDate || '')}">${escapeHtml(d.projectNo || '')}</td>
    </tr>`
    }).join('')
    html += '</tbody></table>'
  }
  body.innerHTML = html
  const btn = $('#nmSimRefresh')
  if (btn) btn.addEventListener('click', (ev) => { ev.preventDefault(); nmShowSimilar(true) })
}

async function nmSave() {
  const msg = (s) => { $('#nmMsg').textContent = s }
  if (!nm.cur.sub) { msg('请先选择小类'); return }
  const name = ($('#nmName').value || '').trim()
  const spec = ($('#nmSpec').value || '').trim()
  if (!name) { msg('请填写物料名称'); return }
  if (!spec) { msg('请填写规格型号'); return }
  $('#nmSave').disabled = true
  try {
    const r = await apiPost('/api/new-material', {
      name, spec, unit: ($('#nmUnit').value || '').trim(), sub: nm.cur.sub,
      remark: ($('#nmRemark').value || '').trim(), by: 'web',
    })
    if (r && r.error) { msg('保存失败：' + r.error); return }
    msg('已加入待新增清单，编码 ' + r.item.code)
    $('#nmName').value = ''; $('#nmSpec').value = ''; $('#nmUnit').value = ''; $('#nmRemark').value = ''
    $('#nmSuggest').innerHTML = ''; $('#nmSpecCheck').innerHTML = ''
    // 清掉上一条查询到的库存/参考库存，避免残留误导下一条录入
    const invEl = $('#nmInv'); if (invEl) invEl.innerHTML = ''
    const stEl = $('#nmSpecStock'); if (stEl) stEl.textContent = '现有库存 -'
    hideNmNameTip()
    const rc = $('#nmRuleCheck'); if (rc) rc.innerHTML = ''
    nm.items = (await api('/api/new-material')).items || []
    renderNmList()
    await refreshNmCode()
  } finally {
    $('#nmSave').disabled = false
  }
}

function renderNmList() {
  const tb = document.querySelector('#nmTable tbody')
  if (!tb) return
  if (!nm.items.length) { tb.innerHTML = '<tr><td colspan="8" class="muted">暂无待新增物料</td></tr>'; return }
  tb.innerHTML = nm.items.map((d) => `<tr>
    <td class="mono">${escapeHtml(d.code)}</td>
    <td>${escapeHtml(d.name)}</td>
    <td>${escapeHtml(d.spec)}</td>
    <td>${escapeHtml(d.sub)} ${escapeHtml(d.subName || '')}</td>
    <td>${escapeHtml(d.unit || '')}</td>
    <td>${escapeHtml(d.wh || '')}</td>
    <td class="muted">${escapeHtml(String(d.createdAt || '').replace('T', ' ').slice(0, 19))}</td>
    <td><button class="danger" data-del="${escapeHtml(d.id)}">删除</button></td>
  </tr>`).join('')
  tb.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => {
    if (!window.confirm('确认从待新增清单删除？')) return
    await apiPost('/api/new-material/delete', { id: b.dataset.del })
    nm.items = (await api('/api/new-material')).items || []
    renderNmList()
  })
}


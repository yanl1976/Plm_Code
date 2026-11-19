// 注意：必须把第二个参数透传给 fetch，否则带 method/body 的调用会退化成 GET，
// 导致「保存设置」「修改同义词」「重跑提取」等写操作静默失效（只读不写）。
const api = (p, opts) => fetch(p, opts).then((r) => r.json())
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
  if (t.dataset.tab === 'rules') loadRules()
if (t.dataset.tab === 'settings') loadSettings()
  if (t.dataset.tab === 'feature') loadFeature()
  if (t.dataset.tab === 'newmat') loadNewMat()
  if (t.dataset.tab === 'selection') loadSelectionAdmin()
}))

// 选型库管理页由治理服务 3100 提供，这里用 iframe 内嵌；首次切到该页签时才加载
let selAdminLoaded = false
function loadSelectionAdmin() {
  if (selAdminLoaded) return
  const f = $('#selFrame')
  if (!f) return
  const base = window.SELECT_ADMIN_BASE
    || (location.protocol + '//' + (location.hostname || '127.0.0.1') + ':3100')
  f.src = base + '/admin/selection'
  selAdminLoaded = true
}

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
    + ` · 物料 <b>${fmt(d.meta.total)}</b> 条：通过 <b class="green">${fmt(sc.ok)}</b> / 有缺项 <b class="amber">${fmt(sc.missing)}</b>（策略期望但原文未提供，可筛选核查）/ 有缺陷 <b class="red">${fmt(sc.error)}</b> / 规则待完善 <b>${fmt(sc.pending || 0)}</b>（未做提取与校验）/ 待核查 <b class="amber">${fmt(d.meta.warnCount || 0)}</b> ⚠（型号首词存疑等，不阻断）`
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
    const tag = m.status === 'pending'
      // 该小类没有特征参数声明 → 本次未提取、未校验。必须区别于「通过」，否则等于虚假合规结论
      ? '<span class="tag pending">校验规则待完善</span>'
      : m.status === 'error'
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
  setModalWidth(false)
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

  // 顶部统计：大类 / 中类 / 小类总数，便于和导出的 Excel 对照
  let midN = 0
  let subN = 0
  cats.forEach((b) => {
    const ms = Object.values(b.mid || {})
    midN += ms.length
    ms.forEach((m) => { subN += (m.sub || []).length })
  })
  const metaEl = $('#clsMeta')
  if (metaEl) metaEl.textContent = `共 ${cats.length} 个大类 / ${midN} 个中类 / ${subN} 个小类`
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

// 导出分类归属 Excel（大类 → 中类 → 小类）
if ($('#btnExportClassify')) {
  $('#btnExportClassify').addEventListener('click', () => {
    window.location.href = '/api/classification/export'
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
  try { await loadBackup() } catch (e) { /* 备份模块异常不影响设置页其它功能 */ }
}

// ---------- 系统数据备份与选择性恢复 ----------
const bkState = { libs: [], selected: new Set(), backups: [] }

function fmtBytes(n) {
  const v = Number(n) || 0
  if (v >= 1048576) return (v / 1048576).toFixed(1) + ' MB'
  if (v >= 1024) return (v / 1024).toFixed(1) + ' KB'
  return v + ' B'
}

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = (x) => String(x).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
    + ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds())
}

async function loadBackup() {
  let r = null
  try {
    r = await api('/api/backup/libs')
  } catch (e) {
    // 服务端未部署时接口 404：给出可读提示，避免整个设置页白屏
    const box = $('#bkLibs')
    if (box) box.innerHTML = '<p class="muted">备份功能不可用（接口未就绪，可能是服务端未部署最新版本）。</p>'
    const msg = $('#bkMsg')
    if (msg) msg.textContent = '接口不可用：' + ((e && e.message) || e)
    return
  }
  bkState.libs = (r && r.libs) || []
  // 默认勾选「同义词字典 / 国标命名范式库 / 命名与查重规则」这三个最常改的
  if (!bkState.selected.size) {
    for (const k of ['synonyms', 'guide', 'rules']) {
      if (bkState.libs.some((x) => x.key === k)) bkState.selected.add(k)
    }
  }
  renderBackupLibs()
  await loadBackupList()
}

function renderBackupLibs() {
  const box = $('#bkLibs')
  if (!box) return
  box.innerHTML = bkState.libs.map((x) => {
    const checked = bkState.selected.has(x.key) ? ' checked' : ''
    const missing = x.exists ? '' : ' style="opacity:.45"'
    return `<label class="bk-lib"${missing}>
      <input type="checkbox" class="bk-chk" data-key="${escapeHtml(x.key)}"${checked} />
      <span class="bk-name">${escapeHtml(x.name)}</span>
      <span class="bk-meta">${x.exists ? (x.rows ? x.rows + ' ' + (x.unit || '条') + ' · ' : '') + fmtBytes(x.bytes) : '文件不存在'}</span>
      <span class="bk-desc">${escapeHtml(x.desc || '')}</span>
    </label>`
  }).join('')
  box.querySelectorAll('.bk-chk').forEach((el) => {
    el.addEventListener('change', () => {
      const k = el.dataset.key
      if (el.checked) bkState.selected.add(k)
      else bkState.selected.delete(k)
    })
  })
}

async function loadBackupList() {
  const box = $('#bkList')
  if (!box) return
  const r = await api('/api/backup/list')
  bkState.backups = (r && r.items) || []
  if (!bkState.backups.length) {
    box.innerHTML = '<p class="muted">还没有备份。选择上面的库后点「备份选中」即可创建第一份。</p>'
    return
  }
  const rows = bkState.backups.map((b) => {
    const names = (b.keys || []).map((k) => {
      const lib = bkState.libs.find((x) => x.key === k)
      return lib ? lib.name : k
    }).join('、')
    return `<tr>
      <td>${fmtTime(b.at)}</td>
      <td>${escapeHtml(names)}</td>
      <td style="text-align:right">${fmtBytes(b.bytes)}</td>
      <td>${b.tag === 'before-restore' ? '<span class="bk-tag">恢复前快照</span>' : ''}</td>
      <td style="white-space:nowrap">
        <button class="bk-btn" data-act="restore" data-id="${escapeHtml(b.id)}">恢复</button>
        <button class="bk-btn danger" data-act="delete" data-id="${escapeHtml(b.id)}">删除</button>
      </td>
    </tr>`
  }).join('')
  box.innerHTML = `<table class="bk-table">
    <thead><tr><th>时间</th><th>包含的库</th><th style="text-align:right">大小</th><th></th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`
  box.querySelectorAll('.bk-btn').forEach((el) => {
    el.addEventListener('click', () => {
      if (el.dataset.act === 'restore') openRestore(el.dataset.id)
      else delBackup(el.dataset.id)
    })
  })
}

async function doBackup(keys) {
  const msg = $('#bkMsg')
  if (!keys.length) { if (msg) msg.textContent = '请至少选择一个库'; return }
  const names = keys.map((k) => (bkState.libs.find((x) => x.key === k) || {}).name || k).join('、')
  if (!confirm('将备份以下库：\n\n' + names + '\n\n继续？')) return
  if (msg) msg.textContent = '备份中…'
  try {
    // 注意：api() 只发 GET，这里必须用 apiPost
    const r = await apiPost('/api/backup/create', { keys })
    if (msg) msg.textContent = r && r.ok
      ? ('已备份 ' + keys.length + ' 个库（' + fmtBytes(r.totalBytes) + '）')
      : ('备份失败：' + ((r && r.error) || '未知'))
    await loadBackupList()
  } catch (e) {
    // 常见原因：服务端未部署最新版本（/api/backup/* 返回 404）
    if (msg) msg.textContent = '备份失败：' + ((e && e.message) || e) + '｜若接口 404，说明服务端需要部署最新版本'
  }
}

async function delBackup(id) {
  if (!confirm('确定删除这份备份？删除后不可恢复。')) return
  const msg = $('#bkMsg')
  try {
    const r = await apiPost('/api/backup/delete', { id })
    if (msg) msg.textContent = r && r.ok ? '已删除' : ('删除失败：' + ((r && r.error) || '未知'))
    await loadBackupList()
  } catch (e) {
    if (msg) msg.textContent = '删除失败：' + ((e && e.message) || e)
  }
}

async function openRestore(id) {
  const b = bkState.backups.find((x) => x.id === id)
  if (!b) return
  // 让用户选择要恢复哪些库（默认全选该备份内的库）
  const names = (b.keys || []).map((k) => {
    const lib = bkState.libs.find((x) => x.key === k)
    return (lib ? lib.name : k)
  })
  const input = prompt(
    '恢复备份 ' + fmtTime(b.at) + '\n\n该备份包含（可删掉不想恢复的项，逗号分隔）：\n'
    + names.join(', ') + '\n\n留空 = 恢复全部；输入 cancel 取消',
    names.join(', ')
  )
  if (input == null) return
  if (/^cancel$/i.test(input.trim())) return
  let keys = b.keys
  if (input.trim()) {
    const want = input.split(/[,，\s]+/).map((s) => s.trim()).filter(Boolean)
    keys = b.keys.filter((k) => {
      const lib = bkState.libs.find((x) => x.key === k)
      const nm = lib ? lib.name : k
      return want.indexOf(nm) >= 0 || want.indexOf(k) >= 0
    })
  }
  if (!keys.length) { alert('没有匹配的库'); return }

  // 先预览：会覆盖哪些文件
  let dry = null
  try {
    dry = await apiPost('/api/backup/restore', { id, keys, dryRun: true })
  } catch (e) {
    alert('预览失败：' + ((e && e.message) || e) + '\n\n若接口 404，说明服务端未部署最新版本')
    return
  }
  if (!dry || !dry.ok) { alert('预览失败：' + ((dry && dry.error) || '未知')); return }
  const list = (dry.files || []).map((f) => '  ' + f.rel).join('\n')
  if (!confirm('将覆盖以下 ' + dry.count + ' 个文件：\n\n' + list
    + '\n\n（恢复前会自动生成「恢复前快照」）\n\n确认恢复？')) return

  const msg = $('#bkMsg')
  if (msg) msg.textContent = '恢复中…'
  let r = null
  try {
    r = await apiPost('/api/backup/restore', { id, keys })
  } catch (e) {
    if (msg) msg.textContent = '恢复失败：' + ((e && e.message) || e)
    return
  }
  if (r && r.ok) {
    if (msg) msg.textContent = '已恢复 ' + r.count + ' 个文件' + (r.preSnapshot ? ('（恢复前快照：' + r.preSnapshot + '）') : '')
    await loadBackupList()
    await loadBackup()
    // 配置类库恢复后需要重载页面才能看到变化
    if (confirm('恢复完成。是否立即重新加载页面以应用新配置？')) location.reload()
  } else {
    if (msg) msg.textContent = '恢复失败：' + ((r && r.error) || '未知')
  }
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

// 数据备份按钮
if ($('#btnBackupSel')) {
  $('#btnBackupSel').addEventListener('click', () => doBackup([...bkState.selected]))
}
if ($('#btnBackupAll')) {
  $('#btnBackupAll').addEventListener('click', () => doBackup(bkState.libs.filter((x) => x.exists).map((x) => x.key)))
}
if ($('#btnBkToggleAll')) {
  $('#btnBkToggleAll').addEventListener('click', () => {
    const all = bkState.libs.filter((x) => x.exists).map((x) => x.key)
    if (bkState.selected.size >= all.length) bkState.selected.clear()
    else for (const k of all) bkState.selected.add(k)
    renderBackupLibs()
  })
}
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

// 同义词字典：导出 Excel（后端生成，带表头与列宽）
$('#btnExportSyn') && ($('#btnExportSyn').onclick = () => {
  location.href = '/api/name-synonyms/export'
})

// 同义词字典：从 Excel 批量导入（合并模式，同别名同范围且标准名一致的跳过）
const synFileEl = $('#synFile')
$('#btnImportSyn') && ($('#btnImportSyn').onclick = () => { if (synFileEl) synFileEl.click() })
synFileEl && (synFileEl.onchange = () => {
  const f = synFileEl.files && synFileEl.files[0]
  if (!f) return
  const msg = $('#synMsg')
  if (msg) { msg.className = 'syn-msg'; msg.textContent = '导入中…' }
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const r = await apiPost('/api/name-synonyms/import', {
        fileName: f.name, data: String(reader.result || ''),
      })
      if (!r || !r.ok) {
        if (msg) { msg.className = 'syn-msg err'; msg.textContent = '导入失败：' + ((r && r.error) || '未知错误') }
        return
      }
      const bad = (r.errors || []).length
      if (msg) {
        msg.className = 'syn-msg' + (bad ? ' err' : '')
        msg.textContent = '导入完成：新增 ' + r.added + ' 条，更新 ' + r.updated + ' 条，跳过 ' + r.skipped + ' 条'
          + (bad ? '；' + bad + ' 条失败（' + r.errors[0] + '）' : '')
      }
      await loadSynonyms()
    } catch (e) {
      if (msg) { msg.className = 'syn-msg err'; msg.textContent = '导入失败：' + (e && e.message ? e.message : e) }
    } finally {
      synFileEl.value = ''
    }
  }
  reader.readAsDataURL(f)
})
$('#synAlias') && $('#synAlias').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); $('#synStd').focus() } })
$('#synStd') && $('#synStd').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addSynonym() } })
let synSearchTimer = null
$('#synSearch') && $('#synSearch').addEventListener('input', () => {
  clearTimeout(synSearchTimer)
  synSearchTimer = setTimeout(loadSynonyms, 300)
})

// ================= 国标命名范式库（管理） =================
let ngItems = []
let ngKw = ''

function ngSend(method, path, body) {
  return fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).then((r) => r.json())
}

async function loadGuideList() {
  const box = $('#ngList')
  if (!box) return
  try {
    const r = await api('/api/naming-guide/list' + (ngKw ? '?kw=' + encodeURIComponent(ngKw) : ''))
    ngItems = (r && r.items) || []
    const st = $('#ngStats')
    const sm = (r && r.summary) || null
    if (st) {
      st.textContent = '共 ' + ((r && r.total) || 0) + ' 个小类'
        + (sm ? '（参数规则：已启用 ' + sm.on + ' · 可启用 ' + sm.ready + ' · 待补参数 ' + sm.partial + '）' : '')
        + (ngKw ? '，筛选 ' + ngItems.length + ' 条' : '')
    }
    renderGuideList()
  } catch (e) {
    const m = $('#ngMsg')
    if (m) { m.className = 'syn-msg err'; m.textContent = '加载失败：' + (e && e.message ? e.message : e) }
  }
}

// 参数规则状态：on=已启用校验 / ready=范式字段都能落到参数库但还没启用 / partial=还有待新增参数
function ruleCell(it) {
  if (it.ruleState === 'on') return '<span class="ng-grade g-A">已启用 ' + ((it.tokens || []).length) + '</span>'
  if (it.ruleState === 'ready') return '<span class="ng-grade g-B">可启用</span>'
  return '<span class="ng-grade g-C">缺 ' + ((it.paramsPending || []).length) + '</span>'
}

function renderGuideList() {
  const box = $('#ngList')
  if (!box) return
  if (!ngItems.length) {
    box.innerHTML = '<div class="muted" style="padding:10px">' + (ngKw ? '没有匹配的小类' : '暂无数据') + '</div>'
    return
  }
  // 按百分比分配，任何屏宽下都不会把某一列压到不可读
  let h = '<table class="ng-table ng-fixed"><thead><tr>'
    + '<th style="width:5%">小类号</th>'
    + '<th style="width:9%">小类名</th>'
    + '<th style="width:6%">置信度</th>'
    + '<th style="width:6%">条款依据</th>'
    + '<th style="width:24%">依据</th>'
    + '<th style="width:16%">规格结构</th>'
    + '<th style="width:13%">示例</th>'
    + '<th style="width:9%">参数规则</th>'
    + '<th style="width:12%">操作</th>'
    + '</tr></thead><tbody>'
  const GRADE = {
    A: { cls: 'g-A', text: 'A 国标' },
    B: { cls: 'g-B', text: 'B 惯例' },
    C: { cls: 'g-C', text: 'C 推定' },
  }
  for (const it of ngItems) {
    const gd = GRADE[it.confidence] || { cls: 'g-none', text: '—' }
    h += '<tr>'
      + '<td class="mono">' + it.sub + '</td>'
      + '<td class="ng-nowrap">' + escapeHtml(it.subName) + (it.hasStd ? '' : ' <span class="ng-nostd">无国标</span>') + '</td>'
      + '<td><span class="ng-grade ' + gd.cls + '">' + gd.text + '</span></td>'
      + '<td class="mono" title="' + escapeHtml(it.sourceRef || '待补条款号') + '">' + escapeHtml(it.sourceRef || '—') + '</td>'
      + '<td class="ng-src" title="' + escapeHtml(it.source) + '">' + escapeHtml(it.source) + '</td>'
      + '<td class="mono ng-clip" title="' + escapeHtml(it.specPattern) + '">' + escapeHtml(it.specPattern) + '</td>'
      + '<td class="mono ng-clip" title="' + escapeHtml(it.example) + '">' + escapeHtml(it.example) + '</td>'
      + '<td style="text-align:center" title="' + escapeHtml(
        '范式字段 ' + it.fieldCount + ' 个'
        + (it.paramsMapped && it.paramsMapped.length ? '；可落地参数：' + it.paramsMapped.join('、') : '')
        + (it.paramsPending && it.paramsPending.length ? '；待新增参数：' + it.paramsPending.join('、') : '')
        + (it.tokens && it.tokens.length ? '；已启用：' + it.tokens.join('、') : '')
      ) + '">' + ruleCell(it) + '</td>'
      + '<td class="ng-ops"><button class="ghost ng-edit" data-sub="' + it.sub + '">编辑</button>'
      + '<button class="ghost ng-del" data-sub="' + it.sub + '">删除</button></td>'
      + '</tr>'
  }
  h += '</tbody></table>'
  box.innerHTML = h
  box.querySelectorAll('.ng-edit').forEach((b) => { b.onclick = () => openGuideEdit(b.dataset.sub) })
  box.querySelectorAll('.ng-del').forEach((b) => { b.onclick = () => delGuide(b.dataset.sub) })
}

function ngFieldRow(f) {
  return '<tr>'
    + '<td><input class="ng-fk" value="' + escapeHtml(f.key || '') + '" placeholder="字段名（对应 {占位符}）" /></td>'
    + '<td><input class="ng-fd" value="' + escapeHtml(f.desc || '') + '" placeholder="说明" /></td>'
    + '<td><input class="ng-fe" value="' + escapeHtml(f.example || '') + '" placeholder="示例" /></td>'
    + '<td style="width:36px"><button class="ghost ng-fdel" title="删除该字段">×</button></td></tr>'
}

async function openGuideEdit(sub) {
  let g = { sub: sub || '', subName: '', source: '', nameRule: '', nameAliases: [], specPattern: '', fields: [], example: '', avoid: '' }
  if (sub) {
    try {
      const r = await api('/api/naming-guide?sub=' + encodeURIComponent(sub))
      if (r && r.guide) g = Object.assign(g, r.guide, { sub })
    } catch (e) { }
  }
  const html = '<h3 style="margin:0 0 6px;font-size:15px">' + (sub ? '编辑范式 · ' + escapeHtml(sub) : '新增范式') + '</h3>'
    + '<div class="ng-form">'
    + '<label>小类号 *</label><input id="ngSub" class="mono" value="' + escapeHtml(g.sub) + '" placeholder="6 位数字"' + (sub ? ' readonly' : '') + ' />'
    + '<label>小类名 *</label><input id="ngSubName" value="' + escapeHtml(g.subName || '') + '" />'
    + '<label>依据 *</label><input id="ngSource" value="' + escapeHtml(g.source || '') + '" placeholder="GB/T xxx-YYYY《…》 或 无对应国标（按行业惯例：…）" />'
    + '<label>置信度</label><select id="ngConf"><option value="A">A · 有国标可追溯</option><option value="B">B · 无国标按行业惯例</option><option value="C">C · 推定，需复核</option></select>'
    + '<label>条款依据</label><input id="ngRef" class="mono" value="' + escapeHtml(g.sourceRef || '') + '" placeholder="如 第 5.3.2 条（A 级建议填）" />'
    + '<label>名称规则</label><input id="ngRule" value="' + escapeHtml(g.nameRule || '') + '" />'
    + '<label>常见错叫</label><input id="ngAlias" value="' + escapeHtml((g.nameAliases || []).join('、')) + '" placeholder="顿号分隔" />'
    + '<label>规格结构 *</label><input id="ngPat" class="mono" value="' + escapeHtml(g.specPattern || '') + '" />'
    + '<label>示例 *</label><input id="ngEg" class="mono" value="' + escapeHtml(g.example || '') + '" />'
    + '<label>避免</label><input id="ngAvoid" value="' + escapeHtml(g.avoid || '') + '" />'
    + '<label>字段</label>'
    + '<div><table class="ng-ftable"><thead><tr><th>字段名</th><th>说明</th><th>示例</th><th></th></tr></thead>'
    + '<tbody id="ngFields">' + (g.fields || []).map(ngFieldRow).join('') + '</tbody></table>'
    + '<button class="ghost" id="ngAddField" style="margin-top:4px">+ 加字段</button></div>'
    + '</div>'
    + '<div class="ng-foot"><span id="ngEditMsg" class="syn-msg"></span>'
    + '<button class="ghost" id="ngCancel">取消</button>'
    + '<button class="primary" id="ngSave">保存</button></div>'
  $('#modalBody').innerHTML = html
  $('#modal').classList.remove('hidden')
  if ($('#ngConf')) $('#ngConf').value = g.confidence || 'B'

  const bindDel = () => {
    document.querySelectorAll('#ngFields .ng-fdel').forEach((b) => { b.onclick = () => b.closest('tr').remove() })
  }
  bindDel()
  $('#ngAddField').onclick = () => {
    $('#ngFields').insertAdjacentHTML('beforeend', ngFieldRow({}))
    bindDel()
  }
  $('#ngCancel').onclick = () => $('#modal').classList.add('hidden')
  $('#ngSave').onclick = () => saveGuide(!!sub)
}

async function saveGuide(isEdit) {
  const msg = $('#ngEditMsg')
  const fields = []
  document.querySelectorAll('#ngFields tr').forEach((tr) => {
    const k = tr.querySelector('.ng-fk').value.trim()
    if (!k) return
    fields.push({
      key: k,
      desc: tr.querySelector('.ng-fd').value.trim(),
      example: tr.querySelector('.ng-fe').value.trim(),
    })
  })
  const body = {
    sub: $('#ngSub').value.trim(),
    subName: $('#ngSubName').value.trim(),
    source: $('#ngSource').value.trim(),
    nameRule: $('#ngRule').value.trim(),
    nameAliases: $('#ngAlias').value.split(/[、,，\/]/).map((x) => x.trim()).filter(Boolean),
    specPattern: $('#ngPat').value.trim(),
    example: $('#ngEg').value.trim(),
    avoid: $('#ngAvoid').value.trim(),
    confidence: $('#ngConf') ? $('#ngConf').value : '',
    sourceRef: $('#ngRef') ? $('#ngRef').value.trim() : '',
    fields,
  }
  if (!/^\d{6}$/.test(body.sub)) {
    if (msg) { msg.className = 'syn-msg err'; msg.textContent = '小类号必须是 6 位数字' }
    return
  }
  if (!body.subName || !body.source || !body.specPattern || !body.example) {
    if (msg) { msg.className = 'syn-msg err'; msg.textContent = '小类名 / 依据 / 规格结构 / 示例 都不能为空' }
    return
  }
  if (msg) { msg.className = 'syn-msg'; msg.textContent = '保存中…' }
  try {
    const r = await ngSend(isEdit ? 'PUT' : 'POST', '/api/naming-guide', body)
    if (!r || !r.ok) {
      if (msg) { msg.className = 'syn-msg err'; msg.textContent = '保存失败：' + ((r && r.error) || '未知错误') }
      return
    }
    $('#modal').classList.add('hidden')
    const m = $('#ngMsg')
    if (m) { m.className = 'syn-msg'; m.textContent = '已保存 ' + body.sub + '（共 ' + r.total + ' 个小类）' }
    await loadGuideList()
  } catch (e) {
    if (msg) { msg.className = 'syn-msg err'; msg.textContent = '保存失败：' + (e && e.message ? e.message : e) }
  }
}

async function delGuide(sub) {
  const it = ngItems.find((x) => x.sub === sub)
  if (!confirm('确认删除 ' + sub + '（' + (it ? it.subName : '') + '）的范式？')) return
  try {
    const r = await ngSend('DELETE', '/api/naming-guide?sub=' + encodeURIComponent(sub))
    const m = $('#ngMsg')
    if (!r || !r.ok) {
      if (m) { m.className = 'syn-msg err'; m.textContent = '删除失败：' + ((r && r.error) || '') }
      return
    }
    if (m) { m.className = 'syn-msg'; m.textContent = '已删除 ' + sub + '（剩余 ' + r.total + ' 个）' }
    await loadGuideList()
  } catch (e) {
    const m = $('#ngMsg')
    if (m) { m.className = 'syn-msg err'; m.textContent = '删除失败：' + (e && e.message ? e.message : e) }
  }
}

$('#btnAddNg') && ($('#btnAddNg').onclick = () => openGuideEdit(''))
$('#btnExportNg') && ($('#btnExportNg').onclick = () => { location.href = '/api/naming-guide/export' })
$('#btnImportNg') && ($('#btnImportNg').onclick = () => { const f = $('#ngFile'); if (f) f.click() })
$('#ngFile') && ($('#ngFile').onchange = () => {
  const el = $('#ngFile')
  const f = el.files && el.files[0]
  if (!f) return
  const msg = $('#ngMsg')
  if (msg) { msg.className = 'syn-msg'; msg.textContent = '导入中…' }
  const reader = new FileReader()
  reader.onload = async () => {
    try {
      const r = await ngSend('POST', '/api/naming-guide/import', { fileName: f.name, data: String(reader.result || '') })
      if (!r || !r.ok) {
        if (msg) { msg.className = 'syn-msg err'; msg.textContent = '导入失败：' + ((r && r.error) || '未知错误') }
        return
      }
      const bad = (r.errors || []).length
      if (msg) {
        msg.className = 'syn-msg' + (bad ? ' err' : '')
        msg.textContent = '导入完成：新增 ' + r.added + ' 条，更新 ' + r.updated + ' 条，跳过 ' + r.skipped + ' 条'
          + (bad ? '；' + bad + ' 条失败（' + r.errors[0] + '）' : '')
      }
      await loadGuideList()
    } catch (e) {
      if (msg) { msg.className = 'syn-msg err'; msg.textContent = '导入失败：' + (e && e.message ? e.message : e) }
    } finally {
      el.value = ''
    }
  }
  reader.readAsDataURL(f)
})
let ngSearchTimer = null
$('#ngSearch') && $('#ngSearch').addEventListener('input', () => {
  clearTimeout(ngSearchTimer)
  ngSearchTimer = setTimeout(() => {
    ngKw = ($('#ngSearch').value || '').trim()
    loadGuideList()
  }, 300)
})

// ================= 命名规范页（四个子标签：同义词 / 范式库 / 参数标准库 / 标准查新） =================
const rulesLoaded = { syn: false, guide: false, param: false, std: false }

function switchSubTab(name) {
  document.querySelectorAll('.sub-tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.subtab === name)
  })
  document.querySelectorAll('.sub-panel').forEach((p) => {
    p.classList.toggle('active', p.id === 'sub-' + name)
  })
  if (name === 'syn' && !rulesLoaded.syn) { rulesLoaded.syn = true; loadSynonyms() }
  if (name === 'guide' && !rulesLoaded.guide) { rulesLoaded.guide = true; loadGuideList() }
  // 参数标准库：此分支缺失会让页面只有标题和开关、列表永远空白（首次实现时踩过）
  if (name === 'param' && !rulesLoaded.param) { rulesLoaded.param = true; loadParamLib() }
  if (name === 'std' && !rulesLoaded.std) { rulesLoaded.std = true; loadStdWatch() }
}

// ================= 标准查新 =================
let stdItems = []

async function loadStdWatch() {
  const box = $('#stdList')
  if (!box) return
  try {
    const r = await api('/api/std-watch')
    stdItems = (r && r.standards) || []
    if ($('#stdPeriod') && r && r.meta) $('#stdPeriod').value = r.meta.period || 'quarter'
    if ($('#stdAuto') && r && r.meta) $('#stdAuto').checked = r.meta.autoCheck !== false
    const st = $('#stdStats')
    if (st) {
      const cs = (r && r.confidenceStats) || {}
      st.textContent = '共 ' + ((r && r.total) || 0) + ' 个标准'
        + (cs.high ? '，双源一致 ' + cs.high : '')
        + (r && r.outdated && r.outdated.length ? '，' + r.outdated.length + ' 个过期' : '')
        + (cs.pending ? '，' + cs.pending + ' 个新版待生效' : '')
        + (cs.conflict ? '，' + cs.conflict + ' 个两源冲突' : '')
        + (cs.single ? '，' + cs.single + ' 个单源' : '')
        + (cs.none ? '，' + cs.none + ' 个未收录' : '')
        + (r && r.meta && r.meta.lastRunAt ? ' · 上次 ' + String(r.meta.lastRunAt).slice(0, 10) : '')
    }
    renderStdList()
  } catch (e) {
    const m = $('#stdMsg')
    if (m) { m.className = 'syn-msg err'; m.textContent = '加载失败：' + (e && e.message ? e.message : e) }
  }
}

function renderStdList() {
  const box = $('#stdList')
  if (!box) return
  if (!stdItems.length) {
    box.innerHTML = '<div class="muted" style="padding:10px">还没有核查记录，点「立即核查」开始</div>'
    return
  }
  let h = '<table class="ng-table"><thead><tr>'
    + '<th style="width:160px">标准号</th>'
    + '<th style="width:84px">现行版本</th>'
    + '<th style="width:84px">状态</th>'
    + '<th style="width:96px">置信度</th>'
    + '<th style="width:100px">实施日期</th>'
    + '<th style="width:100px">上次核查</th>'
    + '<th style="width:52px">引用</th>'
    + '<th>标准名称</th>'
    + '<th style="width:260px">被引用小类（名称）</th>'
    + '</tr></thead><tbody>'
  for (const x of stdItems) {
    let badge = ''
    let rowCls = ''
    if (x.outdated) { badge = '<span class="std-bad">过期</span>'; rowCls = 'std-row-bad' }
    else if (x.error) { badge = '<span class="std-warn">核查失败</span>'; rowCls = 'std-row-warn' }
    else if (x.status === '未查到') { badge = '<span class="std-warn">未查到</span>' }
    else if (/即将实施/.test(x.status || '')) { badge = '<span class="std-warn">即将实施</span>' }
    else if (/现行/.test(x.status || '')) { badge = '<span class="std-ok">现行</span>' }

    // 被引用小类：小类号 + 名称，逗号分隔；过长时省略号 + 悬停看全文
    const subList = x.subNames || []
    const subText = subList.map((s) => s.sub + ' ' + (s.name || '')).join('、')
    // 双源交叉验证的置信度：两源一致才算高置信，冲突标黄待人工仲裁
    const CONF = {
      high: { cls: 'std-ok', text: '双源一致' },
      pending: { cls: 'std-warn', text: '新版待生效' },
      conflict: { cls: 'std-warn', text: '两源冲突' },
      single: { cls: 'std-dim', text: '单源' },
      none: { cls: 'std-warn', text: '未收录' },
    }
    const cf = CONF[x.confidence] || { cls: 'std-dim', text: '未核查' }
    const srcTip = (x.sources && (x.sources.samr || x.sources.openstd))
      ? ['samr：' + (x.sources.samr ? x.sources.samr.version + ' ' + x.sources.samr.state : '无'),
        'openstd：' + (x.sources.openstd ? x.sources.openstd.version + ' ' + x.sources.openstd.state : '无'),
        x.pendingVersion ? '新版 ' + x.pendingVersion + ' 将于 ' + (x.pendingDate || '') + ' 生效' : '']
        .filter(Boolean).join('\n')
      : '尚未核查'

    h += '<tr class="' + rowCls + '">'
      + '<td class="mono">' + escapeHtml(x.base)
      + (x.outdated ? ' <span class="std-bad">→ ' + escapeHtml(x.latest || '') + '</span>' : '') + '</td>'
      + '<td class="mono">' + escapeHtml(x.latest || '—') + '</td>'
      + '<td>' + badge + '</td>'
      + '<td><span class="' + cf.cls + '" title="' + escapeHtml(srcTip) + '">' + cf.text + '</span></td>'
      + '<td class="mono">' + escapeHtml(x.implDate || '—') + '</td>'
      + '<td class="mono">' + escapeHtml(x.checkedAt ? String(x.checkedAt).slice(0, 10) : '—') + '</td>'
      + '<td style="text-align:center">' + (x.refCount || 0) + '</td>'
      + '<td class="ng-clip" title="' + escapeHtml(x.name || '') + '">' + escapeHtml(x.name || '') + '</td>'
      + '<td class="ng-clip std-subs" title="' + escapeHtml(subText || '—') + '">' + escapeHtml(subText || '—') + '</td>'
      + '</tr>'
  }
  h += '</tbody></table>'
  box.innerHTML = h
}

async function runStdCheck(onlyDue) {
  const msg = $('#stdMsg')
  const btn = $('#btnStdRun')
  if (msg) {
    msg.className = 'syn-msg'
    msg.textContent = onlyDue ? '核查待核查项中…' : '全量核查中，约需 2~5 分钟，请保持页面打开…'
  }
  if (btn) btn.disabled = true
  try {
    const r = await fetch('/api/std-watch/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: !onlyDue, delayMs: 200 }),
    }).then((x) => x.json())
    if (!r || !r.ok) {
      if (msg) { msg.className = 'syn-msg err'; msg.textContent = '核查失败：' + ((r && r.error) || '未知错误') }
      return
    }
    if (msg) {
      msg.className = 'syn-msg'
      msg.textContent = '核查完成：共 ' + r.checked + ' 个，过期 ' + r.outdated + ' 个，失败 ' + r.failed + ' 个'
    }
    await loadStdWatch()
    updateRulesSummary()
  } catch (e) {
    if (msg) { msg.className = 'syn-msg err'; msg.textContent = '核查失败：' + (e && e.message ? e.message : e) }
  } finally {
    if (btn) btn.disabled = false
  }
}

$('#btnStdRun') && ($('#btnStdRun').onclick = () => {
  if (!confirm('全量核查 136 个标准，约需 2~5 分钟，确认开始？')) return
  runStdCheck(false)
})
$('#btnStdDue') && ($('#btnStdDue').onclick = () => runStdCheck(true))
$('#stdPeriod') && ($('#stdPeriod').onchange = async () => {
  try {
    await fetch('/api/std-watch/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: $('#stdPeriod').value }),
    }).then((r) => r.json())
    const m = $('#stdMsg')
    if (m) { m.className = 'syn-msg'; m.textContent = '核查周期已改为「' + $('#stdPeriod').selectedOptions[0].textContent + '」' }
    await loadStdWatch()
  } catch (e) { }
})
$('#stdAuto') && ($('#stdAuto').onchange = async () => {
  try {
    await fetch('/api/std-watch/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoCheck: $('#stdAuto').checked }),
    }).then((r) => r.json())
    const m = $('#stdMsg')
    if (m) { m.className = 'syn-msg'; m.textContent = '自动核查已' + ($('#stdAuto').checked ? '开启' : '关闭') }
  } catch (e) { }
})

// ================= 参数标准库（按小类隔离） =================
// 数据源：src/config/param-standard.json；开关：src/config/param-lib-rules.json
// 界面只改「值清单」（accepted / pending），type 与 series 由构建脚本推导。
const PL = { data: null, kw: '', opened: {}, editing: null }

async function loadParamLib() {
  const list = $('#plList')
  if (!list) return
  const r = await api('/api/param-lib/list?kw=' + encodeURIComponent(PL.kw || '')).catch(() => null)
  if (!r || !r.ok) {
    list.innerHTML = '<div class="syn-empty">读取失败：param-standard.json 可能尚未生成（先运行 npm run param:build）</div>'
    return
  }
  PL.data = r
  if ($('#plEnabled')) $('#plEnabled').checked = !!r.config.enabled
  if ($('#plShadow')) $('#plShadow').checked = !!r.config.shadow
  const st = r.summary || {}
  if ($('#plStats')) {
    $('#plStats').textContent = (st.subs || 0) + ' 个小类 · ' + (st.params || 0) + ' 个参数 · ' + (st.values || 0) + ' 个值'
  }
  renderParamList()
}


function renderParamList() {
  const list = $('#plList')
  const r = PL.data
  if (!list || !r) return
  if (!r.items || !r.items.length) { list.innerHTML = '<div class="syn-empty">没有匹配的小类</div>'; return }
  // 不做折叠：所有小类全部展开，参数以横向 chip 呈现。
  // 折叠虽省空间，但每次看参数都要多点一次，反而慢；
  // 值不铺开，所以全部展开也不会太长。
  list.innerHTML = r.items.map((x) => {
    const chips = (x.params || []).map((p) => {
      const n = p.type === 'free' ? (p.values || []).length : p.acceptedCount
      const tip = (p.type || '') + (n ? ' · ' + n + ' 值' : ' · 无值') + '（点击编辑）'
      return '<span class="pl-pchip" data-sub="' + x.sub + '" data-param="' + escapeHtml(p.name)
        + '" title="' + escapeHtml(tip) + '">' + escapeHtml(p.name)
        + (n ? '<i>' + n + '</i>' : '') + '</span>'
    }).join('')
    // 全部挤在同一行：编号 + 名称 + 统计 + 参数 chips + 按钮。
    // chips 多了就在它们自己的区域横向滚动，按钮始终贴在右侧可见。
    return '<div class="pl-sub open">'
      + '<div class="pl-sub-row">'
      + '<b class="mono pl-sub-code">' + x.sub + '</b>'
      + '<span class="pl-name" title="' + escapeHtml(x.subName) + '">' + escapeHtml(x.subName) + '</span>'
      + '<span class="pl-meta">' + x.paramCount + ' 参数 · ' + x.valueCount + ' 值</span>'
      + '<div class="pl-pchips">' + chips + '</div>'
      + '<div class="pl-btns">'
      + '<button class="ghost pl-view" data-sub="' + x.sub + '">查看</button>'
      + '<button class="ghost pl-editbtn" data-sub="' + x.sub + '">编辑</button>'
      + '</div>'
      + '</div>'
      + '</div>'
  }).join('')

  list.querySelectorAll('.pl-view').forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); openPlEdit(b.dataset.sub, null, true) }
  })
  list.querySelectorAll('.pl-editbtn').forEach((b) => {
    b.onclick = (e) => { e.stopPropagation(); openPlEdit(b.dataset.sub) }
  })
  list.querySelectorAll('.pl-pchip').forEach((c) => {
    c.onclick = (e) => { e.stopPropagation(); openPlEdit(c.dataset.sub, c.dataset.param) }
  })
}

/**
 * 整类编辑抽屉（方案 D）
 *
 * 为什么放弃行内 chip 编辑：一个参数一行、值最多 28 个，点开窄行逐个增删
 * 既看不到该小类的全貌，也容易改错。抽屉一次列出全部参数，值用多行文本框
 * （自动换行、可从 Excel 整列粘贴），并对新增/删除标色，保存前就能确认改了什么。
 */
const PLED = { sub: '', item: null, orig: {}, cur: {}, readonly: false, deleted: [] }

/** 对比原值与当前值，得出新增/删除 */
function plDiff(name) {
  // 值已改为对象数组，比较时只取 value
  const vals = (arr) => (arr || []).map((x) => String(x && x.value !== undefined ? x.value : x))
  const o = vals(PLED.orig[name])
  const c = vals(PLED.cur[name])
  const added = c.filter((v) => !o.includes(v))
  const removed = o.filter((v) => !c.includes(v))
  const changed = added.length || removed.length || o.join('\u0001') !== c.join('\u0001')
  return { added, removed, changed }
}

function plDiffHtml(name) {
  const d = plDiff(name)
  if (!d.changed) return '<span class="none">无改动</span>'
  const bits = []
  if (d.added.length) {
    bits.push('<span class="add">+' + d.added.length + ' 新增：'
      + escapeHtml(d.added.slice(0, 4).join('、')) + (d.added.length > 4 ? '…' : '') + '</span>')
  }
  if (d.removed.length) {
    bits.push('<span class="del">−' + d.removed.length + ' 删除：'
      + escapeHtml(d.removed.slice(0, 4).join('、')) + (d.removed.length > 4 ? '…' : '') + '</span>')
  }
  if (!d.added.length && !d.removed.length) bits.push('<span class="mod">~ 内容已修改</span>')
  return bits.join('')
}

function openPlEdit(sub, focusParam, readonly) {
  const item = (PL.data.items || []).find((x) => x.sub === sub)
  if (!item) return
  PLED.sub = sub
  PLED.item = item
  PLED.readonly = !!readonly
  PLED.orig = {}
  PLED.cur = {}
  PLED.removed = {}
  PLED.deleted = []
  // 参数列表用副本：抽屉里可能新增参数列，不能直接改 PL.data 里的共享对象
  PLED.params = (item.params || []).map((p) => ({ ...p }))
  // 打开时的顺序快照：用左右箭头调过之后，据此判断是否需要提交 order
  PLED.origOrder = PLED.params.map((p) => p.name)
  for (const p of PLED.params) {
    // 值保存为对象（value/count/source）：source 决定颜色，且要跟着存回库，
    // 否则保存后重新打开就分不清"哪些是人工加的"
    const list = (p.values || []).map((v) => ({
      value: String(v.value),
      count: v.count || 0,
      source: v.source || (p.type === 'free' ? 'reference' : 'stock'),
    }))
    PLED.orig[p.name] = list.map((v) => ({ ...v }))
    PLED.cur[p.name] = list.map((v) => ({ ...v }))
    // 历史删除记录（库里的 removed）一并带出来，可恢复
    PLED.removed[p.name] = (p.removed || []).map((v) => String(v.value))
  }
  if ($('#plDhSub')) $('#plDhSub').textContent = sub
  if ($('#plDhName')) $('#plDhName').textContent = item.subName || ''
  if ($('#plDhMeta')) {
    $('#plDhMeta').textContent = (item.paramCount || 0) + ' 个参数 · 存量 '
      + (item.rowCount || 0) + ' 条 · 值 ' + (item.valueCount || 0) + ' 个'
      + (PLED.readonly ? ' · 只读' : '')
  }
  // 只读模式：隐藏「还原 / 保存全部」，只留关闭
  const foot = $('#plDrawerFoot')
  if (foot) foot.classList.toggle('readonly', PLED.readonly)
  renderPlDrawer()
  $('#plDrawerMask').classList.add('open')
  $('#plDrawer').classList.add('open')
  if (focusParam) {
    setTimeout(() => {
      // 横向排列：把目标参数所在的那一列横向滚进视野，纵向保持不动
      const pi = (PLED.params || []).findIndex((x) => x.name === focusParam)
      if (pi < 0) return
      const col = document.querySelector('#plDrawerBody .pl-col[data-pi="' + pi + '"]')
      if (col) col.scrollIntoView({ block: 'nearest', inline: 'center' })
    }, 80)
  }
}

function closePlDrawer() {
  $('#plDrawer').classList.remove('open')
  $('#plDrawerMask').classList.remove('open')
  PLED.item = null
}

function renderPlDrawer() {
  const box = $('#plDrawerBody')
  if (!box || !PLED.item) return
  // 横向排列：一列一个参数，参数名在上、值列表在下。
  // 值必须单行显示（不换行）——列宽只有 124px，长值换行会把列撑乱；
  // 超出部分裁成省略号，鼠标悬停用 title 看全文。textarea 做不到这点，故改用文本行。
  box.innerHTML = '<div class="pl-cols">'
    + (PLED.params || []).map((p, pi) => renderPlCol(p, pi)).join('')
    + '</div>'
  bindPlColEvents(box)
  refreshPlFoot()
}

/** 粘贴清洗：换行 / 逗号 / 分号 / Tab 都当分隔；全角转半角；连续空格合并成一个 */
function plSplitValues(text) {
  return String(text || '')
    .replace(/\u3000/g, ' ')          // 全角空格
    .replace(/[，；、]/g, ',')         // 全角标点 → 半角逗号
    .split(/[\r\n,;\t]+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())   // 合并连续空格、去首尾
    .filter(Boolean)
}

function renderPlCol(p, pi) {
  const ro = PLED.readonly
  const vals = PLED.cur[p.name] || []
  const d = ro ? { added: [], removed: [], changed: false } : plDiff(p.name)
  const cls = !d.changed ? '' : (d.added.length && !d.removed.length ? ' add'
    : (!d.added.length && d.removed.length ? ' del' : ' mod'))
  const name = escapeHtml(p.name)
  // 人工新增/修改的值常驻绿色（source=manual 存进库，重开抽屉仍是绿色）
  const rows = vals.map((v, i) => {
    const isNew = v.source === 'manual'
    return '<div class="pl-val' + (isNew ? ' new' : '') + '" data-pi="' + pi + '" data-i="' + i
      + '" title="' + escapeHtml(v.value) + (isNew ? '（人工录入）' : '')
      + (ro ? '' : '（双击修改）') + '">'
      + escapeHtml(v.value)
      + (ro ? '' : '<i class="pl-x" data-pi="' + pi + '" data-del="' + i + '" title="删除">×</i>')
      + '</div>'
  }).join('')
  // 已删除的值保留在底部（含历史删除记录），点 ↺ 可恢复 —— 防止误删找不回
  const goneVals = ro ? [] : (PLED.removed[p.name] || [])
  const gone = goneVals.map((v, i) => '<div class="pl-val gone" title="已删除，点 ↺ 恢复：' + escapeHtml(v) + '">'
    + escapeHtml(v) + '<i class="pl-x pl-restore" data-pi="' + pi + '" data-ri="' + i + '" title="恢复">↺</i></div>').join('')
  // 列头：上方是左右箭头（调整参数顺序）+ 删除本参数；下面是参数名
  const mvRow = ro ? '' : '<div class="pl-mv-row">'
    + '<button class="pl-mv" data-pi="' + pi + '" data-dir="-1" title="左移">◀</button>'
    + '<button class="pl-mv" data-pi="' + pi + '" data-dir="1" title="右移">▶</button>'
    + '<button class="pl-col-del" data-pi="' + pi + '" title="删除整个参数">×</button>'
    + '</div>'
  return '<div class="pl-col' + cls + '" data-pi="' + pi + '">'
    + '<div class="pl-col-head">'
    + mvRow
    + '<div class="pl-col-name" title="' + name + '">' + name + '</div>'
    + '<div class="pl-col-meta" title="' + escapeHtml(p.type || '') + '"><span>'
    + escapeHtml(p.type || '') + '</span> · <span>' + vals.length + ' 值</span></div>'
    + '</div>'
    + '<div class="pl-col-list">' + (rows || '<div class="pl-empty">（无值）</div>') + gone + '</div>'
    // size="1"：input 的固有宽度（默认约 20 字符）会参与列宽计算，
    // 不设的话编辑模式下每列都会被撑到 max-width，看起来"没自适应"
    + (ro ? '' : '<div class="pl-add-row"><input data-pi="' + pi + '" size="1" placeholder="+ 添加 / 粘贴" /></div>')
    + (ro ? '' : '<div class="pl-col-diff pl-diff">' + plDiffHtml(p.name) + '</div>')
    + '</div>'
}

/**
 * 就地编辑某个值：把该行替换成输入框（回车/失焦确认，Esc 取消）。
 * 确认时：原值进 removed（变红色删除线，可恢复），新值标 manual（绿色）。
 * 两者都会随「保存全部」落盘，重开抽屉仍能看出哪些是人工改过的。
 */
function startEditPlValue(el) {
  if (!el || el.dataset.editing) return
  const pi = Number(el.dataset.pi)
  const i = Number(el.dataset.i)
  const p = (PLED.params || [])[pi]
  const cur = p && (PLED.cur[p.name] || [])[i]
  if (!cur) return
  el.dataset.editing = '1'
  el.innerHTML = ''
  const inp = document.createElement('input')
  inp.className = 'pl-val-edit'
  inp.value = cur.value
  inp.spellcheck = false
  el.appendChild(inp)
  inp.focus()
  inp.select()

  let done = false
  const finish = (ok) => {
    if (done) return
    done = true
    if (ok) {
      const nv = String(inp.value || '').trim()
      if (nv && nv !== cur.value) {
        if (!PLED.removed[p.name].includes(cur.value)) PLED.removed[p.name].push(cur.value)
        PLED.cur[p.name][i] = { value: nv, count: cur.count || 0, source: 'manual' }
        if ($('#plDfTip')) $('#plDfTip').textContent = '已修改：' + cur.value + ' → ' + nv
      }
    }
    refreshPlCol(pi)
  }
  inp.onkeydown = (e) => {
    if (e.isComposing) return
    if (e.key === 'Enter') { e.preventDefault(); finish(true) }
    else if (e.key === 'Escape') { e.preventDefault(); finish(false) }
  }
  // 失焦也确认：用户点到别处（或直接点保存）时，改动不会丢
  inp.onblur = () => finish(true)
}

/**
 * 值排序：与后端 sortByValue 同口径（数值优先、含单位换算），无法解析的退回字典序。
 * 抽屉里新增/修改一个值后立刻排序，否则「75」会落在「100」后面。
 */
function plNum(val) {
  const t = String(val || '').toUpperCase().replace(/\s/g, '')
  // 分数写法：1/2W = 0.5W、1/4W = 0.25W（电阻功率常见）
  const frac = /^(\d+)\/(\d+)(W|KW)$/.exec(t)
  if (frac) return (parseFloat(frac[1]) / parseFloat(frac[2])) * (frac[3] === 'KW' ? 1000 : 1)
  // 单位等级：换算到基本单位再比，避免 "6KV" 排在 "690V" 前面
  const UNITS = [
    [/PF$/, 1e-12], [/NF$/, 1e-9], [/UF$|ΜF$|μF$/, 1e-6], [/MF$/, 1e-3],
    [/MΩ$|MOHM$/, 1e6], [/KΩ$|KOHM$/, 1e3], [/Ω$|OHM$/, 1],
    [/KV$/, 1e3], [/MV$/, 1e-3], [/V$/, 1],
    [/KW$/, 1e3], [/MW$/, 1e-3], [/W$/, 1],
    [/KA$/, 1e3], [/MA$/, 1e-3], [/A$/, 1],
    [/MM\^?2$/, 1], [/MM$/, 1],
  ]
  let mul = 1
  for (const [re, m] of UNITS) { if (re.test(t)) { mul = m; break } }
  const m = /^(-?\d+(?:\.\d+)?)/.exec(t)
  return m ? parseFloat(m[1]) * mul : NaN
}

function plSortValues(list) {
  return list.slice().sort((a, b) => {
    const na = plNum(a.value)
    const nb = plNum(b.value)
    const aNum = !Number.isNaN(na)
    const bNum = !Number.isNaN(nb)
    if (aNum && bNum && na !== nb) return na - nb
    if (aNum !== bNum) return aNum ? -1 : 1      // 能算出数值的排前
    return String(a.value).localeCompare(String(b.value), 'zh')
  })
}

function bindPlColEvents(scope) {
  // 单击值 → 就地变成输入框（不再弹 prompt），回车/失焦确认，Esc 取消。
  // 改完：原值进 removed（红删除线，可恢复），新值标 manual（绿色）；两者随保存持久化。
  scope.querySelectorAll('.pl-val[data-i]').forEach((el) => {
    el.onclick = (e) => {
      if (PLED.readonly) return
      if (e.target.classList.contains('pl-x')) return   // 点在 × 上不进入编辑
      startEditPlValue(el)
    }
  })
  if (PLED.readonly) return

  // 左右箭头：调整参数列顺序
  scope.querySelectorAll('.pl-mv').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation()
      movePlParam(Number(b.dataset.pi), Number(b.dataset.dir))
    }
  })

  // 删除整个参数列（连同它的所有值）。不直接抹掉：记入 PLED.deleted，
  // 保存前可在底部恢复；保存时后端移到 removedParams（软删除，数据不丢）。
  scope.querySelectorAll('.pl-col-del').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation()
      const pi = Number(b.dataset.pi)
      const p = (PLED.params || [])[pi]
      if (!p) return
      const n = (PLED.cur[p.name] || []).length
      if (!window.confirm('删除参数「' + p.name + '」？\n该参数下的 ' + n + ' 个值会一并移除。\n（保存前可在底部恢复）')) return
      commitPendingInputs()
      PLED.params.splice(pi, 1)
      if (!PLED.deleted.includes(p.name)) PLED.deleted.push(p.name)
      renderPlDrawer()
    }
  })

  scope.querySelectorAll('.pl-x[data-del]').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation()
      const pi = Number(b.dataset.pi)
      const p = (PLED.params || [])[pi]
      if (!p) return
      const i = Number(b.dataset.del)
      const v = PLED.cur[p.name][i]
      PLED.cur[p.name].splice(i, 1)
      // 软删除：值不丢弃，移入 removed 保留在底部（可恢复）
      if (v && !PLED.removed[p.name].includes(v.value)) PLED.removed[p.name].push(v.value)
      refreshPlCol(pi)
    }
  })

  // 恢复：把 removed 里的值放回 accepted
  scope.querySelectorAll('.pl-restore[data-ri]').forEach((b) => {
    b.onclick = (e) => {
      e.stopPropagation()
      const pi = Number(b.dataset.pi)
      const p = (PLED.params || [])[pi]
      if (!p) return
      const ri = Number(b.dataset.ri)
      const v = PLED.removed[p.name][ri]
      PLED.removed[p.name].splice(ri, 1)
      // 恢复的值标记为人工确认，显示为绿色
      if (v && !PLED.cur[p.name].some((x) => x.value === v)) {
        PLED.cur[p.name].push({ value: v, count: 0, source: 'manual' })
      }
      refreshPlCol(pi)
    }
  })

  scope.querySelectorAll('input[data-pi]').forEach((inp) => {
    const addFrom = (text) => {
      const pi = Number(inp.dataset.pi)
      const p = (PLED.params || [])[pi]
      if (!p) return
      const parts = plSplitValues(text)
      let n = 0
      for (const v of parts) {
        if (PLED.cur[p.name].some((x) => x.value === v)) continue
        // source=manual：人工新增，绿色且持久化
        PLED.cur[p.name].push({ value: v, count: 0, source: 'manual' })
        n++
      }
      inp.value = ''
      if (n) refreshPlCol(pi)
    }
    inp.onkeydown = (e) => {
      if (e.key !== 'Enter' || e.isComposing) return
      e.preventDefault()
      addFrom(inp.value)
    }
    // 失焦也提交：很多人打完值直接点「保存全部」，不会先按回车，
    // 值留在输入框里 → 底部显示"没有改动"、保存也不生效。
    inp.onblur = () => {
      const txt = String(inp.value || '').trim()
      if (!txt) return
      setTimeout(() => addFrom(txt), 0)   // 延后一拍，避免重渲染打断 blur
    }
    // 边输入边更新底部提示（有未提交内容时提醒可点保存）
    inp.oninput = () => refreshPlFoot()
    // 粘贴多个值（含换行/逗号/多余空格）直接入列；单个值走默认粘贴，便于再修改
    inp.onpaste = (e) => {
      const cb = e.clipboardData || window.clipboardData
      const txt = cb ? cb.getData('text') : ''
      if (plSplitValues(txt).length > 1) {
        e.preventDefault()
        addFrom(txt)
      }
    }
  })
}

/** 重渲染单列（删除/添加后调用），不影响其它列的输入状态 */
function refreshPlCol(pi) {
  const col = document.querySelector('#plDrawerBody .pl-col[data-pi="' + pi + '"]')
  const p = (PLED.params || [])[pi]
  if (!col || !p) return
  // 每次刷新都按值排序：新增/修改/恢复之后立刻归位（75 应插在 63 与 80 之间）
  PLED.cur[p.name] = plSortValues(PLED.cur[p.name] || [])
  const tmp = document.createElement('div')
  tmp.innerHTML = renderPlCol(p, pi)
  const fresh = tmp.firstChild
  col.replaceWith(fresh)
  bindPlColEvents(fresh)
  refreshPlFoot()
}

function refreshPlFoot() {
  const n = (PLED.params || []).filter((p) => p.isNew || plDiff(p.name).changed).length
  const orderChanged = (PLED.params || []).map((p) => p.name).join('|')
    !== (PLED.origOrder || []).join('|')
  // 底部提示：有改动报数量；输入框里还有未提交内容时单独提示
  const pending = Array.from(document.querySelectorAll('#plDrawerBody input[data-pi]'))
    .some((inp) => String(inp.value || '').trim())
  const del = PLED.deleted || []
  const tip = $('#plDfTip')
  if (tip) {
    const bits = []
    if (n) bits.push(n + ' 个参数有改动')
    if (orderChanged) bits.push('顺序已调整')
    if (del.length) {
      // 已删除的参数可点「恢复」，保存前撤销
      bits.push('已删除参数：' + del.map((nm) =>
        escapeHtml(nm) + '<a href="javascript:void(0)" class="pl-undel" data-name="'
        + escapeHtml(nm) + '">恢复</a>').join('、'))
    }
    if (bits.length) {
      tip.innerHTML = bits.join('；')
      tip.querySelectorAll('.pl-undel').forEach((a) => {
        a.onclick = () => {
          const nm = a.dataset.name
          PLED.deleted = (PLED.deleted || []).filter((x) => x !== nm)
          // 用打开时的快照恢复该列（值与顺序都还原）
          const src = (PLED.item.params || []).find((x) => x.name === nm)
          if (src && !PLED.params.some((x) => x.name === nm)) {
            PLED.params.push({ ...src })
            const vals = (src.values || []).map((v) => ({
              value: String(v.value), count: v.count || 0,
              source: v.source || (src.type === 'free' ? 'reference' : 'stock'),
            }))
            PLED.orig[nm] = vals.map((v) => ({ ...v }))
            PLED.cur[nm] = vals.map((v) => ({ ...v }))
            PLED.removed[nm] = (src.removed || []).map((v) => String(v.value))
          }
          renderPlDrawer()
        }
      })
    } else {
      tip.textContent = pending
        ? '输入框里有待添加的值，点「保存全部」会一并保存'
        : '没有改动'
    }
  }
  // 不用 disabled：禁用后点击不会触发 onclick，用户填了值也点不动，
  // 表现出来就是「保存无效」。改为弱化样式，逻辑在 savePlDrawer 里判断。
  if ($('#plDhSave')) $('#plDhSave').classList.toggle('is-dim', !n && !pending && !orderChanged && !del.length)
}

/** 左右箭头：与相邻列交换位置（顺序会保存下来，并同步到录入提示顺序） */
function movePlParam(pi, dir) {
  const arr = PLED.params || []
  const j = pi + dir
  if (j < 0 || j >= arr.length) return
  commitPendingInputs()          // 先收住未提交的输入，重渲染才不会丢
  const t = arr[pi]
  arr[pi] = arr[j]
  arr[j] = t
  renderPlDrawer()
}

/** 保存前把各列输入框里还没提交的内容收进来（防止"打了值没回车"被丢掉） */
function commitPendingInputs() {
  const inputs = document.querySelectorAll('#plDrawerBody input[data-pi]')
  let touched = false
  inputs.forEach((inp) => {
    const txt = String(inp.value || '').trim()
    if (!txt) return
    const pi = Number(inp.dataset.pi)
    const p = (PLED.params || [])[pi]
    if (!p) return
    for (const v of plSplitValues(txt)) {
      if (!PLED.cur[p.name].some((x) => x.value === v)) {
        PLED.cur[p.name].push({ value: v, count: 0, source: 'manual' })
        touched = true
      }
    }
    inp.value = ''
  })
  if (touched) refreshPlFoot()
  return touched
}

async function savePlDrawer() {
  commitPendingInputs()
  // isNew：抽屉里新增的参数列（即使还没填值也要提交，否则不会被创建）
  const changed = (PLED.params || []).filter((p) => p.isNew || plDiff(p.name).changed)
  const orderNames = (PLED.params || []).map((p) => p.name)
  const orderChanged = orderNames.join('|') !== (PLED.origOrder || []).join('|')
  const deleted = PLED.deleted || []
  if (!changed.length && !orderChanged && !deleted.length) { closePlDrawer(); return }
  const items = changed.map((p) => ({
    param: p.name,
    type: p.type || 'free',
    // 值已是对象，source 直接带回去（manual 会让前端重新打开时仍显示绿色）
    accepted: (PLED.cur[p.name] || []).map((v) => ({
      value: v.value,
      count: v.count || 0,
      source: v.source || 'manual',
    })),
    // 软删除：把「已删除」清单一并提交，后端存进 removed，下次打开还能恢复
    removed: (PLED.removed[p.name] || []).map((v) => ({ value: v, count: 0 })),
  }))
  const body = { sub: PLED.sub, items }
  // 顺序调整单独提交（只调顺序、不改值时也要能保存）
  if (orderChanged) body.order = orderNames
  // 删除的参数：后端移到 removedParams（软删除，数据和值都留着，可人工恢复）
  if (deleted.length) body.deleted = deleted
  const r = await api('/api/param-lib/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null)
  const msg = $('#plMsg')
  if (r && r.ok) {
    if (msg) {
      msg.className = 'syn-msg ok'
      msg.textContent = '已保存 ' + r.updated + ' 个参数（' + PLED.sub + '）'
        + (r.created ? '，新建 ' + r.created + ' 个' : '')
        + (r.deleted ? '，删除 ' + r.deleted + ' 个（可在库文件 removedParams 中找回）' : '')
        + (orderChanged ? '，参数顺序已更新（录入提示同步）' : '')
    }
    closePlDrawer()
    await loadParamLib()
  } else if (msg) {
    msg.className = 'syn-msg err'; msg.textContent = (r && r.error) || '保存失败'
  }
}


/**
 * 四个配置库的版本号标注（取自各自文件的 meta.version）。
 * 聚合接口一次取回，避免为「显示版本」改动四个业务接口。
 */
async function loadConfigVersions() {
  const r = await api('/api/config-versions').catch(() => null)
  const vs = (r && r.versions) || {}
  document.querySelectorAll('.cfg-ver[data-ver]').forEach((el) => {
    const v = vs[el.dataset.ver]
    el.textContent = v ? 'v' + v : ''
    el.title = v ? '当前库版本（取自文件 meta.version）' : '该文件未标注版本'
  })
}

async function loadRules() {
  const cur = document.querySelector('.sub-tab.active')
  const name = cur ? cur.dataset.subtab : 'syn'
  loadConfigVersions()
  if (name === 'guide') { rulesLoaded.guide = true; await loadGuideList() }
  else if (name === 'param') { rulesLoaded.param = true; await loadParamLib() }
  else if (name === 'std') { rulesLoaded.std = true; await loadStdWatch() }
  else { rulesLoaded.syn = true; await loadSynonyms() }
  updateRulesSummary()
}

async function updateRulesSummary() {
  const el = $('#rulesSummary')
  if (!el) return
  try {
    const [s, g] = await Promise.all([
      api('/api/name-synonyms').catch(() => null),
      api('/api/naming-guide/list').catch(() => null),
    ])
    const sc = (s && s.stats && s.stats.total) || (s && s.items ? s.items.length : 0)
    const gc = (g && g.total) || 0
    el.textContent = '同义词 ' + sc + ' 条 · 命名范式 ' + gc + ' 个小类'
  } catch (e) { /* 统计失败不影响使用 */ }
}

document.querySelectorAll('.sub-tab').forEach((b) => {
  b.onclick = () => switchSubTab(b.dataset.subtab)
})

// ---------- 参数标准库：搜索 / 开关 / 导出 / 导入 ----------
if ($('#plSearch')) {
  let plTimer = null
  $('#plSearch').oninput = (e) => {
    clearTimeout(plTimer)
    plTimer = setTimeout(() => { PL.kw = e.target.value.trim(); loadParamLib() }, 250)
  }
}
async function savePlConfig(patch) {
  const r = await api('/api/param-lib/config', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch),
  }).catch(() => null)
  const m = $('#plMsg')
  if (r && r.ok) {
    if (m) {
      m.className = 'syn-msg ok'
      m.textContent = '开关已保存：' + (r.config.enabled ? '启用' : '停用')
        + (r.config.shadow ? ' · 影子模式（只记录不生效）' : ' · 正式生效')
    }
  } else if (m) { m.className = 'syn-msg err'; m.textContent = '保存失败' }
}
if ($('#plEnabled')) $('#plEnabled').onchange = (e) => savePlConfig({ enabled: e.target.checked })
if ($('#plShadow')) $('#plShadow').onchange = (e) => savePlConfig({ shadow: e.target.checked })
// ---------- 整类编辑抽屉：关闭 / 取消 / 还原 / 保存 ----------
if ($('#plDhClose')) $('#plDhClose').onclick = closePlDrawer
if ($('#plDhCancel')) $('#plDhCancel').onclick = closePlDrawer
if ($('#plDrawerMask')) $('#plDrawerMask').onclick = closePlDrawer
if ($('#plDhReset')) {
  $('#plDhReset').onclick = () => {
    if (!PLED.item) return
    for (const p of PLED.params || []) PLED.cur[p.name] = (PLED.orig[p.name] || []).slice()
    renderPlDrawer()
  }
}
if ($('#plDhSave')) $('#plDhSave').onclick = savePlDrawer

// 抽屉里新增参数列（该小类原本没有这个参数）
if ($('#plAddParam')) {
  $('#plAddParam').onclick = () => {
    if (PLED.readonly) return
    const nm = String(prompt('新参数名（例：脱扣器 / 额定频率）') || '').trim()
    if (!nm) return
    if ((PLED.params || []).some((p) => p.name === nm)) {
      alert('该小类下已有参数「' + nm + '」')
      return
    }
    const t = String(prompt('类型：free=自由文本 / enum=枚举 / semi=半枚举 / series=数值序列', 'free') || 'free').trim()
    const type = ['free', 'enum', 'semi', 'series'].includes(t) ? t : 'free'
    PLED.params.push({
      name: nm, type, series: '', values: [],
      acceptedCount: 0, pendingCount: 0, removedCount: 0, isNew: true,
    })
    PLED.orig[nm] = []
    PLED.cur[nm] = []
    PLED.removed[nm] = []
    renderPlDrawer()
    if ($('#plDfTip')) $('#plDfTip').textContent = '已新增参数「' + nm + '」，填值后点「保存全部」'
  }
}
document.addEventListener('keydown', (e) => {
  const d = $('#plDrawer')
  if (e.key === 'Escape' && d && d.classList.contains('open')) closePlDrawer()
})

if ($('#btnPlExport')) $('#btnPlExport').onclick = () => { location.href = '/api/param-lib/export-xlsx' }
if ($('#btnPlExportJson')) $('#btnPlExportJson').onclick = () => { location.href = '/api/param-lib/export' }
// 导入模式：upsert=补充（默认，安全）｜replace=覆盖（表里没有的值会被删除）
let plImportMode = 'upsert'
if ($('#btnPlImport')) $('#btnPlImport').onclick = () => { plImportMode = 'upsert'; $('#plFile').click() }
if ($('#btnPlImportReplace')) $('#btnPlImportReplace').onclick = () => { plImportMode = 'replace'; $('#plFile').click() }
if ($('#plFile')) {
  $('#plFile').onchange = async (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const m = $('#plMsg')
    const setMsg = (ok, text) => { if (m) { m.className = 'syn-msg ' + (ok ? 'ok' : 'err'); m.textContent = text } }
    try {
      if (/\.xlsx?$/i.test(f.name)) {
        // ① 预检：先算「新增/更新/删除」数量，让用户确认后再写盘
        const qs = '?dryRun=1&mode=' + plImportMode
        const dry = await (await fetch('/api/param-lib/import-xlsx' + qs, { method: 'POST', body: f })).json()
        if (!dry || !dry.ok) { setMsg(false, (dry && dry.error) || '预检失败'); return }
        const label = plImportMode === 'replace' ? '覆盖' : '补充'
        const lines = [
          '即将导入（' + label + '）：',
          dry.newParams ? '  新增参数 ' + dry.newParams + ' 个（来自「参数清单」表）' : '',
          '  新增 ' + dry.added + ' 个值',
          '  更新 ' + dry.updated + ' 个值',
          dry.removed ? '  删除 ' + dry.removed + ' 个值（表里没有的）' : '  删除 0 个值',
          '  涉及 ' + (dry.groups || 0) + ' 个「小类+参数」组',
          dry.skipped && dry.skipped.length ? '  跳过 ' + dry.skipped.length + ' 组（库中无此小类/参数）' : '',
          '',
          '确定继续？',
        ].filter(Boolean).join('\n')
        if (!window.confirm(lines)) { setMsg(true, '已取消导入（未写入任何数据）'); return }
        // ② 正式导入（后端会先自动备份）
        const r = await (await fetch('/api/param-lib/import-xlsx?mode=' + plImportMode, { method: 'POST', body: f })).json()
        if (r && r.ok) {
          setMsg(true, '导入成功（' + label + '）：新增 ' + r.added + ' / 更新 ' + r.updated + ' / 删除 ' + r.removed
            + (r.skipped && r.skipped.length ? '，跳过 ' + r.skipped.length + ' 组' : ''))
          await loadParamLib()
        } else {
          setMsg(false, (r && r.error) || '导入失败')
        }
      } else {
        const data = JSON.parse(await f.text())
        const r = await api('/api/param-lib/import', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data, mode: 'merge' }),
        })
        if (r && r.ok) { setMsg(true, 'JSON 导入成功：共 ' + r.subs + ' 个小类（同小类已覆盖）'); await loadParamLib() }
        else { setMsg(false, (r && r.error) || '导入失败') }
      }
    } catch (err) {
      setMsg(false, '导入失败：' + err.message)
    } finally {
      e.target.value = ''
    }
  }
}

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
  nmFillExtras()
}

function bindNmEvents() {
  nm.bound = true
  $('#nmBig').onchange = onNmBigChange
  $('#nmMid').onchange = onNmMidChange
  $('#nmSub').onchange = onNmSubChange
  // 用户一旦手动编辑（删改），后续改规格不再自动覆盖；切换小类时才重置
  $('#nmParams') && $('#nmParams').addEventListener('input', () => { $('#nmParams').dataset.auto = '0' })
  // —— 主要参数框的联想：按「参数名 值」给候选 ——
// 规格型号框只填型号，其余参数（额定电流、防护等级、附件…）都在这个框里，
// 它需要自己的 IDE：输入参数名提示该参数的值，输入值反查参数名。
// 主要参数框的 IDE 键位：Tab 采纳首个候选、Esc 收起。
// 用 onkeydown（属性赋值而非 addEventListener）：重复绑定不会叠加，
// 且它就是该元素自己的处理，不受其它监听影响。
// 把值追加到主要参数框（与点选候选同一套拼接规则）
// 采纳候选：补全「最后一段」，而不是追加新的一段。
// 输入 220 → Tab → 变成 220V（不是 220；220V）。
// 多个参数仍用「；」分隔，最后一段就是正在输入的那个。


$('#nmSave').onclick = nmSave
  $('#nmSimilar').onclick = () => nmShowSimilar(false)
  const nmSelBtn = $('#nmSelect')
  if (nmSelBtn) nmSelBtn.onclick = () => nmShowSelect()
  $('#nmExport').onclick = () => window.open('/api/new-material/export', '_blank')



$('#nmSpec').addEventListener('input', () => {
    clearTimeout(nm.timer)
    nm.timer = setTimeout(() => { nmFillExtras(); nmSpecInput() }, 180)   // 先填技术参数，再跑补全
    nm.complete = null      // 输入一变就撤掉旧续写，避免显示过期候选
    updateNmGhost()
    nmRuleTick()
  })
  // 名称：边打字边在同义词浮层里即时提示（轻量接口，120ms 防抖）
  $('#nmName').addEventListener('input', nmNameInput)
  $('#nmName').addEventListener('focus', () => { if (($('#nmName').value || '').trim()) nmNameSuggest() })
  $('#nmName').addEventListener('keydown', (e) => { if (e.key === 'Escape') hideNmNameTip() })
  $('#nmSpec').addEventListener('focus', () => { if (($('#nmSpec').value || '').trim()) nmSpecInput() })
  // 滚动时续写层跟随（textarea 内容超两行时）
  $('#nmSpec').addEventListener('scroll', () => {
    const g = $('#nmGhost'), inp = $('#nmSpec')
    if (g && inp) g.scrollTop = inp.scrollTop
  })
  // 分段补全：Tab 采用首个候选（不能用 Enter——PLM/表单一栏里 Enter 常触发提交）
  $('#nmSpec').addEventListener('keydown', (e) => {
    if (e.isComposing) return                    // 中文输入法组字中，不拦截
    const box = $('#nmSuggest')
    const open = box && box.classList.contains('show')
    if (e.key === 'Tab' && !e.shiftKey && open && nm.complete && (nm.complete.options || []).length) {
      e.preventDefault()
      applySpecComplete(nm.complete.options[0].value)
      return
    }
    if (e.key === 'Escape' && open) {
      nm.sugSeq++                                // 作废在途响应，避免又被弹回来
      box.classList.remove('show'); box.innerHTML = ''
    }
  })
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

  // —— 从规格里自动提取「附加说明 / 可选配件」填到技术参数框 ——
// 规格是查重的依据，必须完整；技术参数只放规格之外的那部分（配件代号、中文说明）。
// 只在该框为空或内容来自上次自动提取时才覆盖，避免冲掉用户手工补充的内容。
// —— 技术参数整体填充 ——
// 第二类参数（接线能力 / 可选配件）不参与规格补全，也不做候选，
// 直接把该小类的全部条目写进技术参数框，由人工删减和增补。
// 技术参数填充（唯一实现）
// 第二类参数 = 接线能力 + 可选配件，按物料型号所属系列过滤，整体写入后由人工删减增补。
// 三条触发路径（切换小类 / 修改规格 / 进入页面）都只调这个函数，不再各写一份。
async function nmFillExtras() {
  const el = $('#nmParams')
  // 用户手动改过（含删空）就不再自动覆盖 —— 覆盖会把手写的删减冲掉。
  if (el && el.dataset.auto === '0') return
  const sub = String(nm.cur.sub || '').trim()
  if (!el || !sub) return

  // 型号 = 规格的第一个词；配件按型号所属系列过滤（100105 下 3WT 与 NB8-40J 完全不同）
  const spec = String($('#nmSpec').value || '').trim()
  const model = (() => {
    for (let p = 0; p < spec.length; p++) {
      const c = spec.charCodeAt(p)
      if (c === 32 || c === 9 || c === 12288) return spec.slice(0, p)   // 空格 / Tab / 全角空格
    }
    return spec
  })()

  // 型号还没填 → 无法判断属于哪个系列，技术参数保持空白；
  // 等选型助手回填或手工写好型号后再取对应配件，避免一选分类就塞入别家的内容。
  if (!model) { el.value = ''; el.dataset.auto = '1'; return }

  const r = await api('/api/new-material/accessory-complete?sub=' + encodeURIComponent(sub)
    + '&model=' + encodeURIComponent(model)).catch(() => null)
  // 请求期间用户可能已经手动编辑过；改过就不覆盖（否则会把手写的删减冲掉）
  if (el.dataset.auto === '0') return
  const items = (r && r.items) || []
  const raw = r && r.raw

  // 没有可填内容时清空，而不是保留上一次的结果 ——
  // 否则换型号后看到的是旧配件，会被误认为"过滤没生效"。
  if (!items.length && !raw) { el.value = ''; el.dataset.auto = '1'; return }

  // 【方案 B：原文保真】后端按型号行返回 raw（该行「接线能力」「可配附件」原文），
  // 这里只整理空白（换行/连续空格压成单个空格），其余标点、「；」「、」「：」一律保留。
  // 好处：Excel 内容怎么变（新增前缀、改用词、改分隔符）都不需要改前端代码，也不会歧义。
  if (raw) {
    const tidy = (s) => String(s || '').replace(/\s+/g, ' ').trim()
    const parts = []
    if (tidy(raw.wiring)) parts.push(tidy(raw.wiring))
    if (tidy(raw.accessories)) parts.push(tidy(raw.accessories))
    if (parts.length) {
      el.value = parts.join('；')
      el.dataset.auto = '1'
      return
    }
  }

  // 【回退：旧后端 / 旧字典无 raw】结构化拼接（按 type 分组，保留「标配 / 可选」语义）。
  // 旧后端没有 type 字段时用 param 里的「(标配)」兜底。
  const segs = []
  const wiringVals = []
  let optBuf = []
  const flushOpt = () => { if (optBuf.length) { segs.push('可选：' + optBuf.join('、')); optBuf = [] } }
  for (const it of items) {
    const label = String(it.label || '').trim()
    if (!label) continue
    const param = String(it.param || '')
    if (param === '接线能力') { wiringVals.push(label); continue }
    const type = it.type != null ? String(it.type) : (param.indexOf('(标配)') >= 0 ? '标配' : '')
    if (type === '选配') { optBuf.push(label); continue }
    flushOpt()
    segs.push(type === '标配' ? '标配：' + label : label)
  }
  flushOpt()
  el.value = [wiringVals.join('、')].concat(segs).filter(Boolean).join('；')
  el.dataset.auto = '1'
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
  // 泛称（门禁/监控/消防系统）：后端只回 refine（细分建议），不给候选
  const refine = (r && r.refine) || null
  if (!stockMatches.length && !synMatches.length && !fallback && !modelTip && !refine) { hideNmNameTip(); return }
  const key = (s) => String(s || '').replace(/\s+/g, '').toUpperCase()
  const keyRaw = key(raw)

  // 「建议采用」：把同义词 / 去型号 / 小类标准名合并成一块，按优先级去重
  const recs = []
  const pushRec = (name, tag, note) => {
    if (!name || key(name) === keyRaw) return
    if (recs.some((x) => key(x.name) === key(name))) return
    recs.push({ name, tag, note: note || '' })
  }
  synMatches.forEach((m) => {
    const hit = stockMatches.find((s) => key(s.name) === key(m.std))
    pushRec(m.std, '同义词', hit ? `本小类 ${hit.count || 0} 条在用` : '')
  })
  if (modelTip) {
    const moved = (modelTip.moved || []).join(' ')
    pushRec(modelTip.core, '去型号', moved ? `型号/参数 ${moved} 请写进规格` : '')
  }
  // 小类标准名兜底：输入与标准名互为包含关系时出现
  // （前缀、包含都要支持：「框架」「断路器」都应提示「固定式框架断路器」）
  if (fallback && keyRaw.length >= 2) {
    const f = key(fallback.name)
    if (f.indexOf(keyRaw) >= 0 || keyRaw.indexOf(f) === 0) pushRec(fallback.name, '小类标准名', '')
  }

  // 存量：只读展示，且不重复展示「建议采用」里已经给出的名称
  const stockList = stockMatches
    .filter((m) => !recs.some((x) => key(x.name) === key(m.name)))
    .slice(0, 5)

  // 泛称且没有其它候选：只给一条不可点选的提示，不给「建议采用」（泛称不能直接填）
  if (refine && !recs.length && !stockList.length) {
    // 引导语由该小类的 refineHint 决定（安防：部件或设备；通讯线：具体用途的线缆）
    box.innerHTML = '<div class="nm-name-tip-sub" style="color:var(--amber)">「' + escapeHtml(raw.trim())
      + '」是泛称，' + escapeHtml(refine.lead || '请写具体部件或设备')
      + (refine.hint ? '：' + escapeHtml(refine.hint) : '') + '</div>'
    box.classList.add('show')
    return
  }

  if (!recs.length && !stockList.length) { hideNmNameTip(); return }

  const stockTag = (m) => {
    const where = m.inSub ? '本小类' : (m.sub ? '小类 ' + m.sub + (m.subName ? ' ' + m.subName : '') : '其它小类')
    return `${m.count || 0} 条 · ${where}`
  }

  let html = ''
  if (recs.length) {
    html += '<div class="nm-name-tip-head">✓ 建议采用</div>'
      + recs.slice(0, 3).map((m, i) => `<div class="nm-name-tip-row nm-name-tip-rec" data-r="${i}">
          <b>${escapeHtml(m.name)}</b>
          <span class="nm-name-tip-src">${escapeHtml(m.tag)}</span>
          ${m.note ? `<span class="nm-name-tip-tag">${escapeHtml(m.note)}</span>` : ''}
        </div>`).join('')
  }
  if (stockList.length) {
    html += '<div class="nm-name-tip-head">存量已有名称（仅供参考，不可点）</div>'
      + stockList.map((m) => `<div class="nm-name-tip-row is-readonly">
          <b>${escapeHtml(m.name)}</b>
          <span class="nm-name-tip-tag">${escapeHtml(stockTag(m))}</span>
          <span class="nm-name-tip-lock">仅参考</span>
        </div>`).join('')
  }
  html += '<div class="nm-name-tip-sub">仅提示，不影响保存；灰色名称为历史写法，不能点击填入</div>'
  box.innerHTML = html
  box.classList.add('show')

  const fill = (v) => {
    inp.value = v
    hideNmNameTip() // 选中即收起，不再重复弹出候选
    inp.focus()
    nmRuleCheck() // 只刷新底部的规则校验
  }
  // 只有「建议采用」可点；存量名称不绑事件
  box.querySelectorAll('[data-r]').forEach((row) => {
    const m = recs[Number(row.getAttribute('data-r'))]
    if (m) row.onclick = (ev) => { ev.stopPropagation(); fill(m.name) }
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
  checkSelectAvailable()      // 该小类没有选型库时，按钮置灰
  loadNamingGuide(s ? s.sub : '')   // 显示该小类的国标写法参考
  // 切小类：重置标记，允许按新小类重新填充
  const _pEl = $('#nmParams'); if (_pEl) _pEl.dataset.auto = '1'
  nmFillExtras()
  }

async function refreshNmCode() {
  if (!nm.cur.sub) { $('#nmCode').textContent = '-'; return }
  const r = await api('/api/new-material/next-code?sub=' + encodeURIComponent(nm.cur.sub))
  if (r && r.code) {
    nm.cur.code = r.code
    $('#nmCode').textContent = r.code
    $('#nmCodeMsg').textContent = '预分配 · 流水 ' + r.seq + '（正式编号以 PLM 编码器为准）'
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
  nm.complete = null
  // ① 分段补全（参数级）：推断"当前在填哪一段"，给该段的取值候选
  api('/api/new-material/spec-complete?sub=' + sub + '&q=' + encodeURIComponent(q)).catch(() => null)
    .then((c) => {
      if (seq !== nm.sugSeq) return
      nm.complete = (c && c.ok) ? c : null
      updateNmGhost()
      renderNmSuggest(q, nm.lastItems || [], nm.lastSummary)
    })
  // ② 整条规格联想（存量写法）：与①并发，各自渲染时都会带上补全区
  api('/api/new-material/spec-suggest?sub=' + sub + '&q=' + encodeURIComponent(q)).catch(() => null)
    .then((r) => {
      // 期间已选中某项/已失焦/已改输入 → 在途结果作废，不能把下拉又弹回来
      if (seq !== nm.sugSeq) return
      nm.lastItems = (r && r.items) || []
      nm.lastSummary = (r && r.modelSummary) || null
      renderNmSuggest(q, nm.lastItems, nm.lastSummary)
    })
  api('/api/new-material/spec-check?sub=' + sub + '&spec=' + encodeURIComponent(q)).catch(() => null)
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
  // 名称也不 trim：首尾空格要能传到后端，否则「名称首尾有空格」永远不提示
  const rawName = ($('#nmName').value || '')
  const name = rawName.trim()
  // 规格不 trim：交给后端识别首尾空格，前端才能提示「保存时会自动整理」
  const spec = ($('#nmSpec').value || '')
  if (!name && !spec.trim()) { el.innerHTML = ''; return }
  // 改用 POST：可携带阻断开关（window.BLOCK_CONFIG 覆盖，默认全部阻断）
  apiPost('/api/new-material/validate', {
    name: rawName,
    spec,
    sub: nm.cur.sub || '',
    blocks: JSON.stringify(window.BLOCK_CONFIG || {}),
  })
    .then((r) => renderNmRule(r || {}))
    .catch(() => {
      // 请求失败时不能静默保留上一次的结果，否则看起来像「校验失效」
      const box = $('#nmRuleCheck')
      if (box) box.innerHTML = '<div class="nm-rule-warn">! 校验服务暂不可用，请稍后重试</div>'
    })
}

// ---- 提示分类与配色（与插件 ItemSmartInput.config.js 的 hints 结构保持一致）----
const HINT_CFG = Object.assign({
  levels: {
    error: { icon: '✕' }, warn: { icon: '!' }, tip: { icon: '·' },
    info: { icon: 'i' }, ok: { icon: '✓' },
  },
  groups: { name: '名称', spec: '规格', dup: '查重', stock: '库存', env: '环境' },
  rules: [
    // ① 名称类 error（必须在 ^名称 warn 之前）
    { re: '^(物料)?名称.{0,10}(不能为空|过长|过短|不能包含|与规格不能完全相同|禁用词|只能)|^名称疑似', group: 'name', level: 'error' },
    // ② 名称类 warn 兜底
    { re: '^名称', group: 'name', level: 'warn' },
    // ③ 名称类专项：材质 / 品牌
    { re: '材质/表面处理|品牌请写入', group: 'name', level: 'warn' },
    // ④ 查重 error
    { re: '完全相同规格|同小类已有完全相同', group: 'dup', level: 'error' },
    // ⑤ 查重 warn / info
    { re: '疑似相同规格|高度相似|顺序不同', group: 'dup', level: 'warn' },
    { re: '相似型号|类似型号|一物多号', group: 'dup', level: 'info' },
    // ⑥ 环境（须在「库存」之前，否则「库存未核对」会被判成库存类）
    { re: '服务不可用|不可用|超时|网络异常|未核对', group: 'env', level: 'warn' },
    // ⑦ 库存
    { re: '库存', group: 'stock', level: 'info' },
    // ⑧ 规格 tip
    { re: '未收录', group: 'spec', level: 'tip' },
    { re: '^规范写法', group: 'spec', level: 'tip' },
    // ⑨ 规格 warn
    { re: '额定电压建议|乘号|括号请使用|多余空格|连续空格', group: 'spec', level: 'warn' },
    // ⑩ 规格 error（补「项目号」）
    { re: '不能为空|过长|过短|半角字符|必须包含|占位内容|项目号', group: 'spec', level: 'error' },
    // ⑪ 名称 tip
    { re: '建议采用|标准写法|同义词', group: 'name', level: 'tip' },
    // ⑫ 名称 warn（小类不符等）
    { re: '小类不符|含型号|型号请写进规格', group: 'name', level: 'warn' },
    // ⑬ 兜底
    { re: '名称', group: 'name', level: 'warn' },
  ],
  mute: [],
  mode: 'grouped',
}, window.HINT_CONFIG || {})

const HINT_COLOR = {
  error: 'var(--red)', warn: 'var(--amber)', tip: 'var(--accent)',
  info: 'var(--muted)', ok: 'var(--green)',
}

function hintTag(text) {
  const s = String(text || '')
  for (const m of (HINT_CFG.mute || [])) if (m && s.indexOf(m) >= 0) return null
  for (const r of (HINT_CFG.rules || [])) {
    try { if (new RegExp(r.re).test(s)) return { group: r.group || 'spec', level: r.level || 'warn' } } catch (e) { }
  }
  return { group: 'spec', level: 'warn' }
}

/** 一条提示：[分组] 标签 + 级别图标 + 文本；被 mute 时返回空串 */
function hintHtml(text, forceLevel) {
  const t = hintTag(text)
  if (!t) return ''
  const lv = forceLevel || t.level
  const meta = (HINT_CFG.levels || {})[lv] || {}
  const tag = (HINT_CFG.groups || {})[t.group] || ''
  return '<div class="nm-hint" style="color:' + (HINT_COLOR[lv] || 'var(--amber)') + '">'
    + (tag ? '<span class="nm-hint-tag">' + tag + '</span>' : '')
    + (meta.icon ? '<span class="nm-hint-icon">' + meta.icon + '</span>' : '')
    + '<span class="nm-hint-text">' + escapeHtml(text) + '</span>'
    + '</div>'
}

function renderNmRule(r) {
  const el = $('#nmRuleCheck')
  if (!el) return
  const errs = r.errors || [], warns = r.warnings || []
  const fmt = r.specFormat
  // 空格类问题合并成一条「会自动整理成什么」，比逐条列「有空格」更有用。
  // 注意：规格再长也不能省略「规范写法」，否则用户看不到完整型号。
  // 跨类提示（subMismatch）在下方单独渲染，这里把同一句从 errors/warnings 里剔掉，
  // 否则同一条会显示两次（后端 material-rules 会把 msg 同时 push 进 errors，以便阻断保存）
  const mmMsg = (r.subMismatch && r.subMismatch.msg) || ''
  const otherWarns = warns.filter((w) => {
    if (mmMsg && w === mmMsg) return false
    if (/空格/.test(w) && !/名称/.test(w)) return false
    if (fmt && fmt.fixed && w === '规范写法：' + fmt.fixed) return false  // 与整理结果重复
    return true
  })

  // 按分组整合：名称 / 规格 / 查重 / 库存 / 环境，每组一个标题，组内逐条列
  const buckets = {}
  const pushHint = (text, forceLevel) => {
    const t = hintTag(text)
    if (!t) return                       // 被 mute
    if (!buckets[t.group]) buckets[t.group] = []
    buckets[t.group].push({ text, level: forceLevel || t.level })
  }
  errs.forEach((e) => { if (mmMsg && e === mmMsg) return; pushHint(e, 'error') })
  if (fmt && fmt.fixed) {
    pushHint('保存时会自动整理规格空格（' + fmt.reasons.join('、') + '）→ ' + fmt.fixed, 'warn')
  }
  otherWarns.forEach((w) => pushHint(w))

  // 同小类实时查重结果（后端 /validate 新增 duplicateLevel / duplicates）：
  //   exact = 完全相同规格已存在（红，应视为重复物料）
  //   fuzzy = 规格高度相似，如少写封装（琥珀，只提示让人确认）
  // 此前看板没有这块，用户在录入页根本看不到"这条可能已经存在"。
  const dups = r.duplicates || []
  if (dups.length) {
    const isExact = r.duplicateLevel === 'exact'
    const head = isExact
      ? '相同规格已存在 ' + dups.length + ' 条'
      : '规格高度相似 ' + dups.length + ' 条，请确认是否重复'
    const detail = dups.slice(0, 5).map((d) => String(d.fnumber || '') + ' ' + String(d.spec || '')
      + (d.level === 'exact' ? '' : '（相似 ' + Math.round((Number(d.score) || 0) * 100) + '%）')).join('；')
    if (!buckets.dup) buckets.dup = []
    buckets.dup.push({ text: head + '：' + detail, level: isExact ? 'error' : 'warn' })
  }

  // 跨小类：名称明显属于另一个小类（如 110301 电线 里填「电话线」）。
  // 后端 detectSubMismatch 已给出 msg/level，但看板此前完全没有渲染这个字段 ——
  // 用户选错小类后只能看到「书写格式符合规范」，无从得知类选错了。
  // 放在最前面，且 level=error 用红色（未阻断保存，只是必须让用户看见）。
  const mm = r.subMismatch
  const mmHtml = mm
    ? '<div class="nm-hint" style="color:' + (mm.level === 'error' ? 'var(--red)' : 'var(--amber)') + '">'
      + '<span class="nm-hint-icon">⚠</span>'
      + '<span class="nm-hint-text">' + escapeHtml(mm.msg
        || ('名称「' + mm.name + '」与所选小类「' + ((mm.current && mm.current.subName) || '') + '」不匹配'))
      + '</span></div>'
    : ''

  const ORDER = ['name', 'spec', 'dup', 'stock', 'env']
  let html = mmHtml
  for (const g of ORDER) {
    const list = buckets[g]
    if (!list || !list.length) continue
    html += '<div class="nm-hint-group"><div class="nm-hint-group-title">'
      + escapeHtml((HINT_CFG.groups || {})[g] || g) + '</div>'
    for (const it of list) {
      const meta = (HINT_CFG.levels || {})[it.level] || {}
      html += '<div class="nm-hint" style="color:' + (HINT_COLOR[it.level] || 'var(--amber)') + '">'
        + '<span class="nm-hint-icon">' + (meta.icon || '') + '</span>'
        + '<span class="nm-hint-text">' + escapeHtml(it.text) + '</span>'
        + '</div>'
    }
    html += '</div>'
  }
  // 该小类暂无特征参数规则：一句话说清即可。
  // 作用只是「别让无提示走到下面那句绿色『符合』上被误读成参数也合规」，
  // 不必再解释校验了什么、何时生效（用户明确要求删掉这些补充说明）。
  const pendingHtml = r.rulePending
    ? '<div class="nm-hint" style="color:var(--muted)">'
      + '<span class="nm-hint-icon">i</span>'
      + '<span class="nm-hint-text">校验规则待完善：该小类暂无特征参数规则</span></div>'
    : ''
  if (!html) {
    // 措辞明确限定在「书写格式」：避免把「没查出问题」读成「参数齐全」
    html = pendingHtml || ('<div class="nm-hint" style="color:var(--green)">'
      + '<span class="nm-hint-icon">✓</span>'
      + '<span class="nm-hint-text">名称与规格的书写格式符合规范</span></div>')
  } else if (pendingHtml) {
    html += pendingHtml
  }
  el.innerHTML = html
}

// 只刷新查重提示与参考库存，不查联想（选中某个联想项后调用，避免下拉再次弹出）
function nmSpecCheckOnly() {
  nmFillExtras()   // 程序化改规格不触发 input 事件，技术参数在这里同步
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

/**
 * 规格分段补全的 HTML：显示"当前在填哪一段"与该段的取值候选（带频次）。
 * 只对模板能对齐参数库的段出现；对齐不上或自由输入的段返回空串（不打扰）。
 */
function nmCompleteHtml(r) {
  if (!r || !r.ok || !r.options || !r.options.length) return ''
  const seg = r.unit ? r.param + '（' + r.unit + '）' : r.param
  const pf = String(r.prefix || '').toLowerCase()
  // 两列网格：长型号单行省略（title 显示完整），候选多时自动向下多排
  const opts = r.options.slice(0, 8).map((o, i) => {
    const v = String(o.value || '')
    const hit = pf && v.toLowerCase().startsWith(pf)
    const html = hit
      ? '<b>' + escapeHtml(v.slice(0, pf.length)) + '</b>' + escapeHtml(v.slice(pf.length))
      : escapeHtml(v)
    return '<span class="nm-copt' + (i === 0 ? ' on' : '') + '" data-cv="' + escapeHtml(v) + '" title="' + escapeHtml(v) + '">' + html + '</span>'
  }).join('')
  return '<div class="nm-complete">'
    + '<span class="nm-cseg" title="' + escapeHtml(seg) + '">' + escapeHtml(seg) + '</span>'
    + '<span class="nm-cgrid">' + opts + '</span>'
    + '<span class="nm-ckey">Tab 补全</span></div>'
}

/**
 * 输入框内的灰色续写（IDE 式）：已输入部分透明占位，剩余部分灰色显示。
 * 用与 textarea 完全一致的字体与内边距，保证字符位置对齐；不改动输入内容与光标。
 */
function updateNmGhost() {
  const g = $('#nmGhost'), inp = $('#nmSpec')
  if (!g || !inp) return
  const r = nm.complete
  if (!r || !r.ok || !(r.options || []).length) { g.innerHTML = ''; return }
  const val = inp.value || ''
  const cand = String(r.options[0].value || '')
  const tail = String(r.prefix || '')
  const rest = tail ? cand.slice(tail.length) : cand
  if (!rest) { g.innerHTML = ''; return }
  // 只在光标位于末尾时续写（中途编辑时续写会错位）
  if (inp.selectionStart != null && inp.selectionStart !== (inp.value || '').length) { g.innerHTML = ''; return }
  // 与 textarea 的排版同步（不同主题/字号下面板样式可能不同）
  const cs = getComputedStyle(inp)
  g.style.font = cs.font
  g.style.lineHeight = cs.lineHeight
  g.style.padding = cs.padding
  g.style.letterSpacing = cs.letterSpacing
  g.style.textIndent = cs.textIndent
  g.style.borderWidth = cs.borderWidth
  g.style.borderStyle = 'solid'
  g.style.borderColor = 'transparent'
  g.scrollTop = inp.scrollTop
  g.innerHTML = escapeHtml(val) + '<span class="gr">' + escapeHtml(rest) + '</span>'
}

/** 采用某个补全候选：替换当前段的已输入片段，不足一段时补空格 */
function applySpecComplete(value) {
  const inp = $('#nmSpec')
  if (!inp) return
  const r = nm.complete || {}
  const cur = inp.value || ''
  const tail = r.prefix && cur.endsWith(r.prefix) ? r.prefix : ''
  const head = tail ? cur.slice(0, cur.length - tail.length) : cur
  const base = head.replace(/\s+$/, '')

  // 防重复：该值若已出现在规格中，且当前没有待替换的前缀，就不再追加。
  //
  // 边界比"独立词"更宽，因为型号本身就编码了参数：
  //   GSW3-3200/3P  → /3P 已经表示三极，再写一个 3P 就是重复
  //   NXB-63-3P     → -3P 同理
  // 所以分隔符允许 / - （ ( ，但不允许字母数字（否则 C10A 里的 10A 会被当成 10A 已填）。
  //
  // 只在 tail 为空时判断：有前缀时是"替换"语义（输入 3 → 采用 3P），不属于重复。
  if (!tail) {
    const esc = String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const hit = new RegExp('(^|[\\s/\\-（(])' + esc + '(?=$|[\\s/\\-）)])', 'i').test(cur)
    if (hit) {
      nm.complete = null
      updateNmGhost()
      return
    }
  }

  inp.value = base ? base + ' ' + value : value
  clearTimeout(nm.timer)
  nm.sugSeq++
  nm.complete = null
  updateNmGhost()
  nmSpecCheckOnly()
  nmRuleTick()
  // 焦点留在规格框内，便于连续录入（此前跳到单位框会打断，是"难用"的主因之一）
  inp.focus()
  try { inp.setSelectionRange(inp.value.length, inp.value.length) } catch (e) { /* 忽略 */ }
}

function renderNmSuggest(q, items, summary) {
  const el = $('#nmSuggest')
  // 输入框里已经是完整规格时，不再把它自己当"联想项"重复列出
  const qn = String(q || '').trim().toLowerCase()
  const list = (items || []).filter((it) => String(it.spec || '').trim().toLowerCase() !== qn)
  const cHtml = nmCompleteHtml(nm.complete)
  if (!list.length && !cHtml) { el.innerHTML = ''; el.classList.remove('show'); return }
  const ql = q.toLowerCase()
  // 原先这里有一条「同型号系列 N 条规格 / M 个物料」的说明块：
  // 与每条候选自带的「型号段 N 条」标注重复，且常出现 1250 条这类无意义的大数，已移除。
  el.innerHTML = cHtml + list.map((it) => {
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
  // 分段补全候选：点击即采用（与下面"整条规格"候选分开绑定，避免互相干扰）
  el.querySelectorAll('[data-cv]').forEach((d) => { d.onclick = () => applySpecComplete(d.dataset.cv) })
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
  const orderSame = c.orderSame || []
  const series = c.series || null
  // 同型号系列提示：输入只到型号阶段时（如 iC65N），完全/相似都命中不了，
  // 但同小类可能已有一批该型号的规格 —— 这类"半截输入"恰恰是设计人员最需要提醒的时刻
  const seriesHtml = series
    ? '<div class="nm-series">ℹ 同型号系列 <b class="mono">' + escapeHtml(series.model) + '</b>：同小类已有 <b>'
      + series.specCount + '</b> 条规格 / <b>' + series.itemCount + '</b> 个物料，请先确认是否已有完全相同的规格'
      + (series.samples || []).slice(0, 4).map((x) => `<div class="nm-hit nm-hit-series"><b>${escapeHtml(x.fnumber)}</b> · <span class="mono nm-series-spec" data-fill="${escapeHtml(x.spec)}">${escapeHtml(x.spec)}</span></div>`).join('')
      + '</div>'
    : ''
  if (!exact.length && !separatorOnly.length && !similar.length && !orderSame.length) {
    el.innerHTML = seriesHtml || (c.erpChecked
      ? '<span class="nm-ok">✓ 未发现相同规格（已实时核对 ERP）</span>'
      : '<span class="nm-ok">✓ 未发现相同规格</span>')
    if (seriesHtml) bindNmSeriesFill(el)
    return
  }
  // 来源标注：区分「ERP 实时补查」与「ERP 历史基线」
  //   合并快照里 99.8% 来自 PLM，默认不标；只有来自 ERP 的才标，界面才清爽
  const erpTag = (h) => {
    if (h.fromErp) return '<span class="nm-badge erp">ERP实时</span> '
    if (h.source === 'erp') return '<span class="nm-badge erp">ERP历史</span> '
    return ''
  }
  const stockHtml = (h) => {
    if (h.qty == null) return ''
    const avb = h.avbqty !== h.qty ? '（可用 ' + fmt(h.avbqty) + '）' : ''
    // 数字单独包一层：在「仅写法不同」那行里用实心黄底反色块，突出已有库存量
    return ` · <span class="nm-stock">库存 <span class="nm-stock-num">${fmt(h.qty)}</span>${avb}</span>`
  }
  let html = seriesHtml
  // 参数顺序不同但参数集合完全相同 → 同一个规格的两种写法，折叠式强提示，需勾选确认才能保存
  if (orderSame.length) {
    html += '<div class="nm-warn">⚠ 疑似相同规格（参数完全相同，仅书写顺序不同）：</div>'
    html += orderSame.slice(0, 5).map((h) =>
      `<div class="nm-hit nm-hit-order">${erpTag(h)}<span class="nm-badge order">顺序不同</span> <b>${escapeHtml(h.fnumber)}</b> · <span class="mono">${escapeHtml(h.spec)}</span>${escapeHtml(h.name || '')}</div>`
    ).join('')
    html += '<label class="nm-dup-confirm"><input type="checkbox" id="nmConfirmOrder" />'
      + ' 我已确认与上述物料<b>不是同一物料</b>（如参数顺序在本品类有不同含义），允许继续录入</label>'
  }
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
    // 单仓库时把仓库名并进汇总行，避免「数量 3」和「元器件库1：3 个」把同一个数说两遍；
    // 多仓库才单独列分仓明细（那时每个库的数量才有对比价值）。
    const whs = r.warehouses || []
    const onlyWh = whs.length === 1 ? (whs[0].stockName || ('仓库#' + whs[0].stockId)) : ''
    let html = `<div class="nm-inv-box"><b>现有库存</b><span class="muted"> 完全相同规格 ${n} 个物料</span>
      <span class="nm-inv-sum">数量 <b>${fmt(t.qty)}</b> ${unit}</span>
      <span class="nm-inv-sum">可用 <b class="nm-ok">${fmt(t.avbqty)}</b> ${unit}</span>`
      + (onlyWh ? `<span class="muted">（${escapeHtml(onlyWh)}）</span>` : '') + '</div>'
    if (!onlyWh) {
      const wh = whs.slice(0, 8).map((w) => `<span class="nm-wh-chip">${escapeHtml(w.stockName || ('仓库#' + w.stockId))}：${fmt(w.qty)} ${unit}</span>`)
      if (wh.length) html += '<div class="nm-inv-wh">' + wh.join('') + '</div>'
    }
    el.innerHTML = html
    return
  }
  if (r.found === false) {
    const note = spec ? (r.note || '暂无库存') : '填写规格型号后可查看同规格存量库存'
    el.innerHTML = `<div class="nm-inv-box"><b>即时库存</b><span class="muted"> ${escapeHtml(note)}</span></div>`
    return
  }
  // 与参考库存同口径：单仓库并入汇总行，多仓库才单独列明细
  const whs = r.warehouses || []
  const onlyWh = whs.length === 1 ? (whs[0].stockName || ('仓库#' + whs[0].stockId)) : ''
  let html = `<div class="nm-inv-box"><b>即时库存</b>
    <span class="nm-inv-sum">数量 <b>${fmt(t.qty)}</b> ${unit}</span>
    <span class="nm-inv-sum">可用 <b class="nm-ok">${fmt(t.avbqty)}</b> ${unit}</span>
    <span class="nm-inv-sum">锁库 <b class="nm-warn">${fmt(t.lockqty)}</b> ${unit}</span>`
    + (onlyWh ? `<span class="muted">（${escapeHtml(onlyWh)}）</span>` : '') + '</div>'
  if (!onlyWh) {
    if (whs.length) {
      html += '<div class="nm-inv-wh">' + whs.map((w) => {
        const name = w.stockName || ('仓库#' + w.stockId)
        const extra = w.avbqty !== w.qty ? '（可用 ' + fmt(w.avbqty) + '）' : ''
        return `<span class="nm-wh-chip">${escapeHtml(name)}：${fmt(w.qty)} ${unit}${extra}</span>`
      }).join('') + '</div>'
    } else {
      html += '<div class="nm-inv-wh"><span class="nm-wh-chip">暂无分仓库存</span></div>'
    }
  }
  el.innerHTML = html
}

// 选型助手：按场景 / 极数 / 负载电流，从厂家样本结构化参数中筛型号，点行回填名称与规格
// 数据源是治理服务 3100（与看板同机时直接用当前主机名拼端口，可用 SELECT_API_BASE 覆盖）
function selectBase() {
  return window.SELECT_API_BASE
    || (location.protocol + '//' + (location.hostname || '127.0.0.1') + ':3100')
}

// ---- 命名范式：按小类显示国标规定的名称与规格写法（只提示，不校验）----
let nmGuide = null

function renderGuideTip() {
  const el = $('#nmGuideTip')
  if (!el) return
  const g = nmGuide
  if (!g) { el.innerHTML = ''; el.classList.remove('show'); return }
  const rows = (g.fields || []).map((f) =>
    '<span class="nm-guide-field"><b>' + escapeHtml(f.key) + '</b>'
    + (f.desc ? ' — ' + escapeHtml(f.desc) : '')
    + (f.example ? '（如 ' + escapeHtml(f.example) + '）' : '') + '</span>').join('')
  el.innerHTML = '<div class="nm-guide-head">标准写法 · ' + escapeHtml(g.subName || '')
    + (g.source ? '<span class="nm-guide-src">' + escapeHtml(g.source.split('《')[0]) + '</span>' : '') + '</div>'
    + '<div class="nm-guide-pattern">' + escapeHtml(g.specPattern || '') + '</div>'
    + (rows ? '<div class="nm-guide-fields">' + rows + '</div>' : '')
    + '<div class="nm-guide-eg">示例：' + escapeHtml(g.example || '') + '</div>'
    + (g.nameRule ? '<div class="nm-guide-name">名称：' + escapeHtml(g.nameRule) + '</div>' : '')
  el.classList.add('show')
}

async function loadNamingGuide(sub) {
  nmGuide = null
  renderGuideTip()
  if (!sub) return
  try {
    const r = await api('/api/naming-guide?sub=' + encodeURIComponent(sub))
    nmGuide = (r && r.guide) || null
  } catch (e) { nmGuide = null }
  renderGuideTip()
}

// 选型按钮可用性：当前小类下有「启用」的选型库才可点
let selCheckSeq = 0
async function checkSelectAvailable() {
  const btn = $('#nmSelect')
  if (!btn) return
  const sub = String((nm.cur && nm.cur.sub) || '').trim()
  if (!sub) {
    btn.disabled = true
    btn.title = '请先选择小类'
    return
  }
  const seq = ++selCheckSeq
  btn.disabled = true
  btn.title = '正在检查选型库…'
  try {
    const r = await fetch(selectBase() + '/api/plm/select/series?sub=' + encodeURIComponent(sub),
      { cache: 'no-store' }).then((x) => x.json())
    if (seq !== selCheckSeq) return            // 小类又变了，丢弃过期结果
    const list = (r && Array.isArray(r.series)) ? r.series : []
    const usable = list.filter((s) => s.enabled !== false)
    btn.disabled = !usable.length
    btn.title = usable.length
      ? '按参数从厂家样本中选型（' + usable.length + ' 个系列）'
      : '当前小类暂无选型库'
  } catch (e) {
    if (seq !== selCheckSeq) return
    btn.disabled = true
    btn.title = '选型服务不可用'
  }
}

// 选型结果表格：长文本单元格悬停显示全文
function bindSelCellTips(root) {
  if (!root) return
  let tip = document.getElementById('nmCellTip')
  if (!tip) {
    tip = document.createElement('div')
    tip.id = 'nmCellTip'
    tip.className = 'nm-cell-tip'
    document.body.appendChild(tip)
  }
  root.querySelectorAll('td[data-full]').forEach((td) => {
    td.addEventListener('mouseenter', () => {
      tip.textContent = td.getAttribute('data-full') || ''
      tip.style.display = 'block'
      const r = td.getBoundingClientRect()
      tip.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 440)) + 'px'
      let top = r.bottom + 6
      if (top + 200 > window.innerHeight) top = Math.max(8, r.top - 6 - tip.offsetHeight)
      tip.style.top = top + 'px'
    })
    td.addEventListener('mouseleave', () => { tip.style.display = 'none' })
  })
}

// 弹窗宽度：选型助手表格列多，单独放宽；其它弹窗恢复默认
function setModalWidth(wide) {
  const mb = document.querySelector('#modal .modal-box')
  if (mb) mb.style.width = wide ? 'min(1320px, 96vw)' : ''
}

async function nmShowSelect() {
  const sub = String((nm.cur && nm.cur.sub) || '').trim()
  if (!sub) { alert('请先选择小类'); return }
  const body = $('#modalBody')
  if (!body) return
  body.innerHTML = '<h3>选型助手</h3><p class="muted">加载中…</p>'
  setModalWidth(true)
  $('#modal').classList.remove('hidden')

  let series = []
  let r = null
  try {
    r = await fetch(selectBase() + '/api/plm/select/series?sub=' + encodeURIComponent(sub),
      { cache: 'no-store' }).then((x) => x.json())
    // 旧版 3100 没有这个接口，会返回 {ok:false,error:'not found'} —— 不能当成「库为空」
    if (!r || r.ok === false || !Array.isArray(r.series)) {
      body.innerHTML = '<h3>选型助手</h3><p class="muted">选型接口不可用（' + escapeHtml(selectBase()) + '）'
        + (r && r.error ? '：' + escapeHtml(String(r.error)) : '')
        + '</p><p class="muted small">该地址的 3100 可能是旧版本，需部署 src/plm-server.js 与 data/selection/ 后重启。</p>'
      return
    }
    // 停用的系列不参与选型（厂家换代后旧产品停用）
    const all = r.series || []
    series = all.filter((s) => s.enabled !== false)
    if (!series.length && all.length) {
      body.innerHTML = '<h3>选型助手</h3><p class="muted">该小类下的选型库均已停用</p>'
        + '<p class="muted small">如需使用，请到「选型库」管理页重新启用。</p>'
      return
    }
  } catch (e) {
    body.innerHTML = '<h3>选型助手</h3><p class="muted">选型服务不可用（' + escapeHtml(selectBase())
      + '），请确认 3100 服务已启动且本机可访问。</p>'
    return
  }
  if (!series.length) {
    // 按接口回传的诊断信息给出准确原因，不在界面暴露服务器路径
    let why = '选型库暂未导入'
    if (r && r.dirExists === false) why = '选型库目录未创建'
    else if (r && r.fileCount === 0) why = '选型库目录下没有参数文件'
    else if (r && r.errors && r.errors.length) why = '选型库文件解析失败（' + r.errors[0] + '）'
    else if (r && r.fileCount > 0) why = '当前小类（' + sub + '）暂无选型库'
    body.innerHTML = '<h3>选型助手</h3><p class="muted">' + escapeHtml(why) + '</p>'
    return
  }

  const seriesOpts = series.map((s, i) => '<option value="' + i + '">' + escapeHtml(s.id)
    + (s.brand ? ' · ' + escapeHtml(s.brand) : '') + (s.name ? ' · ' + escapeHtml(s.name) : '') + '</option>').join('')

  body.innerHTML = '<h3>选型助手 <span class="muted">（参数来自厂家样本，最终以设计规范与最新样本为准）</span></h3>'
    + '<div class="nm-select-bar">'
    + '<label>系列</label><select id="nmSelSeries">' + seriesOpts + '</select>'
    + '<span id="nmSelFilters" style="display:contents"></span>'
    + '<button id="nmSelGo" class="ghost">查询</button>'
    + '<button id="nmSelPick" class="ghost" title="选择哪些参数出现在条件栏，选择会记住">筛选字段</button>'
    + '</div>'
    + '<div id="nmSelPicker" class="nm-col-picker hidden"></div>'
    + '<div id="nmSelMore"></div>'
    + '<div class="nm-sel-sub">匹配型号</div>'
    + '<div id="nmSelResult" class="muted small">填写条件后点「查询」</div>'
    + '<div id="nmSelInfo" class="muted small"></div>'

  // 条件栏不写死：按当前系列的列定义生成
  //   表格系列（Excel 导入）→ 每个参数一列：枚举出下拉、数字出输入框、文本出精确匹配框
  //   规则系列（手写库）    → 场景 / 极数 / 曲线 / 负载电流
  function filterControl(c) {
    const label = escapeHtml(c.key) + (c.unit ? '（' + escapeHtml(c.unit) + '）' : '')
    const attr = 'data-col="' + escapeHtml(c.key) + '"'
    let ctrl = ''
    if (c.type === 'enum' && (c.options || []).length) {
      ctrl = '<select ' + attr + '><option value="">不限</option>'
        + c.options.map((o) => '<option>' + escapeHtml(o) + '</option>').join('') + '</select>'
    } else if (c.type === 'number') {
      ctrl = '<input type="number" step="any" ' + attr + ' placeholder="不限" />'
    } else {
      ctrl = '<input type="text" ' + attr + ' placeholder="不限" />'
    }
    // 标签和控件包成一个整体，换行时不会被拆开
    return '<span class="nm-filter-item"><label>' + label + '</label>' + ctrl + '</span>'
  }

  // 可选列：排除型号列与小类号
  function allCols(s) {
    return (s.columns || []).filter((c) => c.role !== 'model' && c.key !== '小类号')
  }
  // 默认勾选：管理页标了「可筛」的列
  function defaultCols(s) {
    return allCols(s).filter((c) => c.filterable !== false)
  }
  // 使用者自己的选择优先（按系列记在本机），没有记录才用管理页默认
  function loadColKeys(s) {
    try {
      const raw = localStorage.getItem('nm.filterCols.' + (s.sub || '') + '.' + s.id)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) return arr
      }
    } catch (e) { }
    return defaultCols(s).map((c) => c.key)
  }
  function saveColKeys(s, keys) {
    try {
      localStorage.setItem('nm.filterCols.' + (s.sub || '') + '.' + s.id, JSON.stringify(keys))
    } catch (e) { }
  }

  // 条件栏只放当前选中的列
  function buildFilters(s) {
    const cols = allCols(s)
    if (s.mode === 'table' && cols.length) {
      const keys = loadColKeys(s)
      const vis = cols.filter((c) => keys.indexOf(c.key) >= 0)
      return {
        main: vis.length
          ? vis.map(filterControl).join('')
          : '<span class="muted small">未选择筛选字段，点右侧「筛选字段」勾选</span>',
        more: '',
      }
    }
    const poleSet = new Set()
    ;((s.params && s.params.poles) || []).forEach((p) => poleSet.add(p))
    const poleOpts = [...poleSet].map((p) => '<option>' + escapeHtml(p) + '</option>').join('')
    return {
      main: '<label>场景</label><select id="nmSelScene"><option value="">不限</option><option>照明</option><option>动力</option><option>配电</option></select>'
        + '<label>极数</label><select id="nmSelPoles"><option value="">不限</option>' + poleOpts + '</select>'
        + '<label>曲线</label><select id="nmSelCurve"><option value="">自动</option><option>B</option><option>C</option><option>D</option></select>'
        + '<label>负载电流</label><input id="nmSelCurrent" type="number" min="0" step="0.1" placeholder="A" />',
      more: '',
    }
  }

  function refreshFilters() {
    const idx = Number($('#nmSelSeries').value || 0)
    const s = series[idx] || series[0]
    const out = buildFilters(s)
    const mainBox = $('#nmSelFilters')
    if (mainBox) mainBox.innerHTML = out.main
    const moreBox = $('#nmSelMore')
    if (moreBox) moreBox.innerHTML = ''
    const picker = $('#nmSelPicker')
    if (picker) { picker.classList.add('hidden'); picker.innerHTML = '' }
  }

  // 「筛选字段」面板：使用者按习惯自行勾选，结果记在本机
  function renderPicker() {
    const idx = Number($('#nmSelSeries').value || 0)
    const s = series[idx] || series[0]
    const cols = allCols(s)
    const keys = loadColKeys(s)
    const box = $('#nmSelPicker')
    if (!box) return
    if (!cols.length) {
      box.innerHTML = '<div class="nm-col-picker-head">该系列没有可选参数</div>'
      return
    }
    const mainCols = defaultCols(s)
    const otherCols = cols.filter((c) => mainCols.indexOf(c) < 0)
    const item = (c) => '<label><input type="checkbox" data-key="' + escapeHtml(c.key) + '"'
      + (keys.indexOf(c.key) >= 0 ? ' checked' : '') + '> ' + escapeHtml(c.key)
      + (c.unit ? '（' + escapeHtml(c.unit) + '）' : '') + '</label>'

    box.innerHTML = '<div class="nm-col-picker-head">主要参数默认已勾选；需要时再补选其他参数（选择会记住）</div>'
      + (mainCols.length
        ? '<div class="nm-col-picker-group">主要参数</div>'
          + '<div class="nm-col-picker-list">' + mainCols.map(item).join('') + '</div>'
        : '')
      + (otherCols.length
        ? '<div class="nm-col-picker-group">其他参数</div>'
          + '<div class="nm-col-picker-list">' + otherCols.map(item).join('') + '</div>'
        : '')
      + '<div class="nm-col-picker-foot">'
      + '<button data-act="all">全选</button><button data-act="none">清空</button>'
      + '</div>'

    const apply = (nextKeys) => {
      saveColKeys(s, nextKeys)
      box.innerHTML = ''
      renderPicker()
      const mainBox = $('#nmSelFilters')
      if (mainBox) mainBox.innerHTML = buildFilters(s).main
    }
    box.querySelectorAll('input[type=checkbox]').forEach((el) => {
      el.onchange = () => {
        const picked = Array.prototype.map.call(
          box.querySelectorAll('input[type=checkbox]:checked'), (x) => x.getAttribute('data-key'))
        apply(picked)
      }
    })
    const allBtn = box.querySelector('[data-act="all"]')
    if (allBtn) allBtn.onclick = () => apply(cols.map((c) => c.key))
    const noneBtn = box.querySelector('[data-act="none"]')
    if (noneBtn) noneBtn.onclick = () => apply([])
  }

  const run = async () => {
    const idx = Number($('#nmSelSeries').value || 0)
    const s = series[idx] || series[0]
    const box = $('#nmSelResult')
    box.innerHTML = '<span class="muted">查询中…</span>'

    // 全部取出：型号条数有限，一屏滚动比「显示前 N 条」更好用
    const payload = { sub: sub, series: s.id, limit: 500 }
    // 表格系列：收集每个筛选控件的值（含「更多筛选」里的），组装成 filters 交给后端
    const colEls = body.querySelectorAll('[data-col]')
    if (colEls.length) {
      const filters = {}
      let any = false
      colEls.forEach((el) => {
        const v = String(el.value == null ? '' : el.value).trim()
        if (v !== '') { filters[el.getAttribute('data-col')] = v; any = true }
      })
      if (any) payload.filters = filters
    } else {
      payload.scene = ($('#nmSelScene') || {}).value || ''
      payload.poles = ($('#nmSelPoles') || {}).value || ''
      payload.curve = ($('#nmSelCurve') || {}).value || ''
      payload.current = ($('#nmSelCurrent') || {}).value || ''
    }

    let r = null
    try {
      r = await fetch(selectBase() + '/api/plm/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((x) => x.json())
    } catch (e) {
      box.innerHTML = '<span class="muted">查询失败，请确认 3100 服务可访问</span>'
      return
    }
    const items = (r && r.items) || []
    if (!items.length) { box.innerHTML = '<span class="muted">没有匹配的型号</span>'; return }

    // 按后端返回的 columns 动态出列（Excel 导入的系列有任意多个参数列）
    const allCols = (r && r.columns) || []
    const paramCols = allCols.filter((c) => c.role !== 'model' && c.key !== '小类号')

    // 默认全量显示；只有超过上限（500）时才提示细化筛选
    const totalN = (r && r.total) || items.length
    let html = '<p class="muted small">共 ' + totalN + ' 条'
      + (totalN > items.length ? '，已显示前 ' + items.length + ' 条，请细化筛选条件' : '') + '</p>'

    if (paramCols.length) {
      html += '<div class="nm-table-wrap"><table class="mat"><thead><tr><th>型号</th>'
        + paramCols.map((c) => '<th>' + escapeHtml(c.key)
          + (c.unit ? '（' + escapeHtml(c.unit) + '）' : '') + '</th>').join('')
        + '<th></th></tr></thead><tbody>'
      html += items.map((it, k) => '<tr data-k="' + k + '" style="cursor:pointer">'
        + '<td class="mono">' + escapeHtml(it.model) + '</td>'
        + paramCols.map((c) => {
          const v = it.cells && it.cells[c.key] != null ? it.cells[c.key]
            : (it[c.key] != null ? it[c.key] : '')
          const s = String(v == null ? '' : v)
          // 长文本收窄 + 省略号，悬停看全文（「中文说明」这类列否则会把表格撑爆）
          const full = s.length > 18 ? ' data-full="' + escapeHtml(s) + '"' : ''
          const clip = s.length > 18 ? ' style="max-width:240px;overflow:hidden;text-overflow:ellipsis;"' : ''
          return '<td' + clip + full + '>' + escapeHtml(s) + '</td>'
        }).join('')
        + '<td>' + (it.recommended ? '<span class="nm-diff-legend">推荐</span>' : '') + '</td>'
        + '</tr>').join('')
      html += '</tbody></table></div>'
    } else {
      // 规则式系列（手写库）：固定四列
      html += '<div class="nm-table-wrap"><table class="mat"><thead><tr><th>型号</th><th>极数</th><th>电流</th><th>曲线</th><th>分断</th><th></th></tr></thead><tbody>'
      html += items.map((it, k) => '<tr data-k="' + k + '" style="cursor:pointer">'
        + '<td class="mono">' + escapeHtml(it.model) + '</td>'
        + '<td>' + escapeHtml(it.poles) + '</td>'
        + '<td class="num">' + (it.current == null ? '' : it.current) + 'A</td>'
        + '<td>' + escapeHtml(it.curve) + '</td>'
        + '<td>' + (it.breaking ? it.breaking + 'kA' : '') + '</td>'
        + '<td>' + (it.recommended ? '<span class="nm-diff-legend">推荐</span>' : '') + '</td>'
        + '</tr>').join('')
      html += '</tbody></table></div>'
    }
    box.innerHTML = html
    bindSelCellTips(box)
    box.querySelectorAll('tr[data-k]').forEach((tr) => {
      tr.addEventListener('click', () => {
        const it = items[Number(tr.dataset.k)]
        const nameEl = $('#nmName')
        const specEl = $('#nmSpec')
        // 名称只在为空时补全，不覆盖用户已经写好的叫法。
        // 关键：用 dispatchEvent('input') 走与手动输入完全相同的链路，
        // 直接赋值不会触发 input，校验就会「看起来失效」。
        // 名称由使用者手工输入（配合同义词点选），选型只在为空且系列有名称时补全。
        // 这里不派发 input：否则会弹出名称联想浮层，干扰操作；校验由规格的 input 统一触发
        if (nameEl) {
          if (!String(nameEl.value || '').trim() && it.name) nameEl.value = it.name
          try { hideNmNameTip() } catch (e) { }
        }
        // 规格是选型的结果，直接覆盖；优先用「型号 + 全部参数（含附件）」的完整规格
        if (specEl) {
          specEl.value = it.spec || it.model
          specEl.dispatchEvent(new Event('input'))
          // 回填不是「打字」，清掉 300ms 后要弹的规格联想，避免挡住页面
          setTimeout(() => {
            try {
              nm.sugSeq++   // 作废在途联想（不能 clearTimeout(nm.timer)，那里还有填技术参数）
              const sug = $('#nmSuggest')
              if (sug) sug.innerHTML = ''
            } catch (e) { }
          }, 0)
        }
        // 立即校验一次，不走 350ms 防抖，回填后底部马上给出结果
        setTimeout(() => {
          try { clearTimeout(nm.ruleTimer); nmRuleCheck() } catch (e) { }
        }, 0)
        // 附件属于「选完之后再配」，回填后在页面消息行提示一次
        const acc = it.accessories || []
        const msgEl = $('#nmMsg')
        if (msgEl) {
          msgEl.textContent = acc.length
            ? '已选 ' + it.model + '，可配附件：' + acc.join(' / ')
            : '已选 ' + it.model
        }
        $('#modal').classList.add('hidden')
      })
    })
    $('#nmSelInfo').innerHTML = s.source ? '来源：' + escapeHtml(s.source) : ''
  }
  $('#nmSelGo').onclick = run
  $('#nmSelSeries').onchange = () => { refreshFilters(); run() }
  $('#nmSelPick').onclick = () => {
    const box = $('#nmSelPicker')
    if (!box) return
    if (box.classList.contains('hidden')) {
      renderPicker()
      box.classList.remove('hidden')
    } else {
      box.classList.add('hidden')
    }
  }
  refreshFilters()
  run()
}

// 类似型号弹窗：物料号 / 名称 / 规格 / 库存数量 / 项目号
async function nmShowSimilar(refresh, limitArg) {
  if (!nm.cur.sub) { alert('请先选择小类'); return }
  const spec = ($('#nmSpec').value || '').trim()
  if (!spec) { alert('请先填写规格型号'); return }
  const body = $('#modalBody')
  if (!body) return
  // 分页：默认只取前 20 条，避免一次拉全量后端要批量补库存/项目号
  const limit = Number(limitArg) || 20
  // 先弹窗再查：ERP 首次查询库存/项目号较慢，先给出"查询中"反馈，不让用户觉得按钮没反应
  body.innerHTML = '<h3>类似型号明细</h3><p class="muted">查询中…（首次查询较慢，结果会缓存到本地，下次秒开）</p>'
  setModalWidth(false)
  $('#modal').classList.remove('hidden')
  const r = await api('/api/new-material/similar-models?sub=' + encodeURIComponent(nm.cur.sub)
    + '&spec=' + encodeURIComponent(spec) + '&code=' + encodeURIComponent(nm.cur.code || '')
    + '&limit=' + limit
    + (refresh === true ? '&refresh=1' : ''))
  const items = (r && r.items) || []
  const total = (r && r.total) || { qty: 0, avbqty: 0 }
  const matchedTotal = (r && r.matchedTotal) || items.length
  let html = `<h3>类似型号明细 <span class="muted">（同小类相同/相似规格，共 ${matchedTotal} 条）</span></h3>`
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
    html += `<p class="muted small">录入规格：<span class="mono">${escapeHtml(spec)}</span>　<span class="nm-diff-legend">黄色</span>= 与该规格的差异部分　·　已按接近程度排序（越靠前差异越少）</p>`
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
  // 分页提示：总数多于当前条数时给出「加载更多」
  if (matchedTotal > items.length) {
    html += `<p class="muted small">当前显示前 ${items.length} 条，共 ${matchedTotal} 条　
      <a href="javascript:void 0" id="nmSimMore">加载更多（+20）</a></p>`
  }
  body.innerHTML = html
  const btn = $('#nmSimRefresh')
  if (btn) btn.addEventListener('click', (ev) => { ev.preventDefault(); nmShowSimilar(true, limit) })
  const more = $('#nmSimMore')
  if (more) more.addEventListener('click', (ev) => { ev.preventDefault(); nmShowSimilar(false, limit + 20) })
}

async function nmSave() {
  const msg = (s) => { $('#nmMsg').textContent = s }
  if (!nm.cur.sub) { msg('请先选择小类'); return }
  const name = ($('#nmName').value || '').trim()
  // 规格保留原始输入：首尾空格交给后端统一整理并回传「改了什么」，
  // 若在这里先 trim，后续就无法提醒用户「空格已被自动整理」。
  const spec = ($('#nmSpec').value || '')
  if (!name) { msg('请填写物料名称'); return }
  if (!spec.trim()) { msg('请填写规格型号'); return }
  // 主要参数最终写入 PLM F_ZXCV_ZYCS (STRING1000)：与插件侧 zycsMaxLen 同口径，
  // 录入端先提示，避免到 PLM 导入时才失败（后端同样会拒绝）
  const paramsVal = ($('#nmParams').value || '').trim()
  if (paramsVal.length > 1000) {
    msg(`主要参数 ${paramsVal.length} 字符，超过 1000 字符上限（PLM 主要参数字段），请精简后再提交`)
    return
  }
  // 参数顺序不同但参数集合完全相同 → 疑似同一规格，必须勾选确认才能继续
  if (document.querySelector('.nm-hit-order')) {
    const ck = document.getElementById('nmConfirmOrder')
    if (!ck || !ck.checked) {
      msg('存在疑似相同规格（参数相同、仅书写顺序不同），请先勾选下方确认项')
      const el = $('#nmSpecCheck')
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      return
    }
  }
  $('#nmSave').disabled = true
  try {
    const r = await apiPost('/api/new-material', {
      name, spec, unit: ($('#nmUnit').value || '').trim(), sub: nm.cur.sub,
      remark: '', by: 'web',   // 备注栏已移除（2026-11-19）：字段保留但不再采集
      // 主要参数：规格型号以外的内容（额定电流、防护等级、附件说明…），与规格分开提交
      params: paramsVal,
    })
    if (r && r.error) { msg('保存失败：' + r.error); return }
    const tidy = r.specTidy
    msg('已加入待新增清单，预分配编码 ' + r.item.code + '（正式编号以 PLM 编码器为准）')
    $('#nmName').value = ''; $('#nmSpec').value = ''; $('#nmUnit').value = ''
    if ($('#nmParams')) { $('#nmParams').value = ''; $('#nmParams').dataset.auto = '1' }   // 重置标记，下一条仍可自动填
    $('#nmSuggest').innerHTML = ''; $('#nmSpecCheck').innerHTML = ''
    // 清掉上一条查询到的库存/参考库存，避免残留误导下一条录入
    const invEl = $('#nmInv'); if (invEl) invEl.innerHTML = ''
    const stEl = $('#nmSpecStock'); if (stEl) stEl.textContent = '现有库存 -'
    hideNmNameTip()
    // 空格整理结果放到输入框正下方的规则区，比挤在按钮旁更容易看到
    clearTimeout(nm.ruleTimer)
    const rc = $('#nmRuleCheck')
    if (rc) {
      rc.innerHTML = tidy
        ? '<div class="nm-ok">✓ 规格空格已自动整理（'
          + escapeHtml(tidy.reasons.join('、')) + '）：' + escapeHtml(tidy.to) + '</div>'
        : ''
    }
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
  if (!nm.items.length) { tb.innerHTML = '<tr><td colspan="9" class="muted">暂无待新增物料</td></tr>'; return }
  tb.innerHTML = nm.items.map((d) => `<tr>
    <td class="mono">${escapeHtml(d.code)}</td>
    <td>${escapeHtml(d.name)}</td>
    <td>${escapeHtml(d.spec)}</td>
    <td class="nm-td-params">${escapeHtml(d.params || '')}</td>
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


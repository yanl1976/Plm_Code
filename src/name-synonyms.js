/**
 * 物料名称同义词字典（可维护）。
 *
 * 目的：录入时把非标准叫法统一到标准名（空气开关 → 断路器），
 *       只做提示、不阻断保存 —— 真正的重复新增已由保存链路的「同小类+同规格」409 拦截。
 *
 * 真源：src/config/name-synonyms.json（按 mtime 热更新，改文件即生效，无需重启）
 * 结构：{ global: {alias: std}, bySub: { 小类6位: {alias: std} } }
 *
 * 匹配两级：
 *   exact    —— 输入名称与 alias 完全一致 → 建议整体改名为 std
 *   contains —— 输入名称包含 alias → 只替换该片段，保留修饰词
 *               例：交流空气开关 → 交流断路器（不是整体改成「断路器」）
 * 两级的差异很重要：整体改名会丢掉「交流」，替换则保留。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const FILE = path.join(ROOT, 'src', 'config', 'name-synonyms.json')

let cached = null
let cachedMtime = 0

const EMPTY = () => ({ meta: { version: '1.0.0' }, global: {}, bySub: {} })

/** 读取字典（mtime 变化自动重载，支持手工编辑文件后即时生效） */
export function loadDict() {
  try {
    const mt = fs.statSync(FILE).mtimeMs
    if (cached && mt === cachedMtime) return cached
    const raw = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    const d = EMPTY()
    d.meta = raw.meta || d.meta
    d.global = raw.global && typeof raw.global === 'object' ? raw.global : {}
    d.bySub = raw.bySub && typeof raw.bySub === 'object' ? raw.bySub : {}
    cached = d
    cachedMtime = mt
    return d
  } catch (e) {
    if (cached) return cached
    return EMPTY()
  }
}

/** 原子写回（tmp + rename，避免半写入损坏字典） */
function persist(d) {
  const tmp = FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(d, null, 2) + '\n', 'utf8')
  fs.renameSync(tmp, FILE)
  cached = null
  cachedMtime = 0
  return loadDict()
}

const norm = (s) => String(s == null ? '' : s).replace(/\u3000/g, ' ').replace(/\s+/g, ' ').trim()

/** 展开成扁平条目：小类条目在前（优先），全局在后 */
function entries(sub) {
  const d = loadDict()
  const list = []
  const s = norm(sub)
  if (s && d.bySub[s]) {
    for (const [alias, std] of Object.entries(d.bySub[s])) list.push({ alias, std, scope: 'sub', sub: s })
  }
  for (const [alias, std] of Object.entries(d.global)) list.push({ alias, std, scope: 'global', sub: '' })
  return list
}

/**
 * 输入末尾与叫法开头的最大重叠长度（用于「还在打字中」的前缀提示）
 * 例：输入「空气」 vs 叫法「空气开关」→ 2；输入「交流空气」→ 2（末尾「空气」对上了）
 */
function headOverlap(input, alias) {
  const max = Math.min(input.length, alias.length - 1)
  for (let k = max; k >= 2; k--) {
    if (input.slice(input.length - k) === alias.slice(0, k)) return k
  }
  return 0
}

function toHit(e, std, exactFlag, from, overlapLen) {
  const h = { std, stdName: e.std, alias: e.alias, scope: e.scope, sub: e.sub, exact: exactFlag, from }
  if (overlapLen) h.overlap = overlapLen
  return h
}

/**
 * 找出一个输入名称的全部候选建议（按可信度：完全一致 > 包含 > 打字中前缀）
 *
 * 三级匹配的意义：
 *   exact    —— 已经写完了一个非标准叫法（空气开关）→ 建议整体改名
 *   contains —— 输入里含有完整叫法（交流空气开关）→ 只替换该片段，保留「交流」
 *   prefix   —— 还没打完（空气 / 交流空气）→ 末尾已对上叫法开头，提前提示
 *              这一级是为了「边打字边提示」，否则要等四个字全部输入完才出现
 *
 * @returns {Array<{std,stdName,alias,scope,sub,exact,from,overlap?}>} std=采纳后的完整名称
 */
export function findAllSuggestions(raw, sub, limit = 5, opts = {}) {
  const name = norm(raw)
  if (!name) return []
  const list = entries(sub)
  // 该名称在本小类已是「在用的完整名称」（存量出现 >= knownNameMin 次）时，
  // 不猜他还在打字 —— 否则「端子」会被误判为「端子标记」没打完，提示成「端子标记号」
  const known = Number(opts.knownCount) || 0
  const skipPrefix = known >= (opts.knownNameMin || 3)

  // 小类标准名保护：某叫法在别处虽是非标准写法，但如果是本小类 bySub 里定下的标准名，
  // 那它就是正确答案，不再反向建议改掉。
  // 例：微型断路器在 100105「微型断路器」是标准名，不该被全局规则建议成「断路器」。
  const subMap = (sub && loadDict().bySub[norm(sub)]) || null
  if (subMap) {
    for (const v of Object.values(subMap)) if (norm(v) === name) return []
  }

  // 1) 完全一致：bySub 先于 global（entries 顺序），只取第一条
  for (const e of list) {
    if (e.alias === name && e.std && e.std !== name) {
      return [toHit(e, e.std, true, 'exact')]
    }
  }

  // 2) 包含完整叫法：最长 alias 优先
  // 仅当「输入已含标准名、且标准名本身包含了这个异名」时跳过，
  // 否则会误跳过合法场景：交流微型断路器（含「断路器」，但「断路器」不含「微型断路器」）应建议为「交流断路器」
  // 注意：小类规则(scope='sub')只参与「完全一致」与「打字中」，不参与片段替换。
  // 否则会把输入的修饰词接到本小类标准名前面，拼出语义矛盾的结果：
  // 例 100103「固定式塑壳断路器」小类下输入「微型断路器」，会被拆成「微型」+「塑壳断路器」。
  const contains = []
  for (const e of list) {
    if (!e.std || e.std === e.alias || e.alias.length < 2) continue
    if (e.scope === 'sub') continue
    if (!name.includes(e.alias)) continue
    if (name.includes(e.std) && e.std.includes(e.alias)) continue
    const replaced = name.replace(e.alias, e.std)
    if (replaced && replaced !== name) contains.push(toHit(e, replaced, false, 'contains'))
  }
  contains.sort((a, b) => b.alias.length - a.alias.length)

  // 3) 打字中：输入末尾对上叫法开头（至少 2 字）→ 替换末尾该片段
  const prefix = []
  if (!skipPrefix) for (const e of list) {
    if (!e.std || e.std === e.alias) continue
    const k = headOverlap(name, e.alias)
    if (!k) continue
    const replaced = name.slice(0, name.length - k) + e.std
    if (replaced === name) continue
    prefix.push(toHit(e, replaced, false, 'prefix', k))
  }
  prefix.sort((a, b) => (b.overlap || 0) - (a.overlap || 0))
  // 去重两步：
  // 1) 同一叫法只留一条 —— bySub 已在 entries 前面，覆盖全局（否则「空气」会同时给出
  //    小类的「微型断路器」和全局的「断路器」两条）
  // 2) 同一标准名只留重叠最多的一条，避免「空气开关/空气断路器」刷出一堆重复
  const byAlias = new Map()
  for (const p of prefix) if (!byAlias.has(p.alias)) byAlias.set(p.alias, p)
  const seen = new Set()
  const dedup = []
  for (const p of byAlias.values()) {
    const key = p.scope + '|' + p.std
    if (seen.has(key)) continue
    seen.add(key)
    dedup.push(p)
  }
  prefix.length = 0
  prefix.push(...dedup)

  // 打字中已对上更长的叫法时，丢弃被它覆盖的短「包含」建议，
  // 否则「基座单」会先给出「模块底座单」这种荒谬结果，而不是正确的「基座单元 → 模块底座」
  const maxOverlap = prefix.reduce((m, p) => Math.max(m, p.overlap || 0), 0)
  const kept = maxOverlap ? contains.filter((c) => c.alias.length > maxOverlap) : contains

  return [...kept, ...prefix].slice(0, limit)
}

/**
 * 给出单个最佳名称建议（兼容旧调用）
 * @returns {null | {std,stdName,alias,scope,sub,exact,from}}
 *   std —— 采纳后应填入的完整名称（exact 时即标准名；contains/prefix 时为替换后的名称）
 */
export function suggestName(raw, sub, opts) {
  return findAllSuggestions(raw, sub, 1, opts)[0] || null
}

/** 列表（供维护界面） */
export function listSynonyms({ sub, kw, scope } = {}) {
  const d = loadDict()
  const q = norm(kw).toLowerCase()
  const out = []
  const push = (alias, std, sc, sb) => {
    if (scope && scope !== sc) return
    if (sub && sc === 'sub' && sb !== norm(sub)) return
    if (q && !(alias.toLowerCase().includes(q) || String(std).toLowerCase().includes(q))) return
    out.push({ alias, std, scope: sc, sub: sb })
  }
  for (const [sb, m] of Object.entries(d.bySub)) {
    for (const [alias, std] of Object.entries(m || {})) push(alias, std, 'sub', sb)
  }
  for (const [alias, std] of Object.entries(d.global)) push(alias, std, 'global', '')
  return out
}

/** 统计 */
export function stats() {
  const d = loadDict()
  let subCount = 0
  for (const m of Object.values(d.bySub)) subCount += Object.keys(m || {}).length
  return {
    total: Object.keys(d.global).length + subCount,
    global: Object.keys(d.global).length,
    bySub: subCount,
    subKinds: Object.keys(d.bySub).length,
    version: (d.meta && d.meta.version) || '',
  }
}

/** 成环检测：a → b 后，沿 b 的别名链继续走，若回到 a 则成环 */
function wouldCycle(d, alias, std, sub) {
  const step = (from, sb) => {
    const inSub = sb && d.bySub[sb] ? d.bySub[sb][from] : undefined
    if (inSub) return inSub
    return d.global[from]
  }
  let cur = std
  const seen = new Set([alias])
  for (let i = 0; i < 20; i++) {
    if (!cur) return false
    if (seen.has(cur)) return true
    seen.add(cur)
    const next = step(cur, sub) || step(cur, '')
    if (!next) return false
    cur = next
  }
  return true
}

/**
 * 新增/修改一条同义词
 * @param {{alias:string, std:string, sub?:string}} p sub 为空 = 全局规则
 */
export function setSynonym({ alias, std, sub } = {}) {
  const a = norm(alias)
  const s = norm(std)
  const sb = norm(sub)
  if (!a) throw new Error('非标准叫法不能为空')
  if (!s) throw new Error('标准名称不能为空')
  if (a === s) throw new Error('非标准叫法与标准名称不能相同')
  if (a.length > 24) throw new Error('非标准叫法过长（最多 24 字）')
  if (s.length > 24) throw new Error('标准名称过长（最多 24 字）')
  // 「标准名包含叫法」仅在全局生效时才危险：全局条目参与片段替换（contains），
  // 如 断路器→塑壳断路器 作用在「框架断路器」上会拼出「框架塑壳断路器」。
  // 小类(bySub)条目只参与「完全一致/打字中」，不参与片段替换，故允许「短叫法 → 本小类更完整的标准名」，
  // 这是存量里最常见的一类归一（电阻→管型电阻、互感器→电流互感器），既有条目本就这样写。
  if (!sb && s.includes(a)) throw new Error('标准名称不能包含非标准叫法（替换后会残留，形成死循环）')
  if (sb && !/^\d{6}$/.test(sb)) throw new Error('小类编码必须是 6 位数字')

  const d = loadDict()
  const next = {
    meta: { ...d.meta, updatedAt: new Date().toISOString() },
    global: { ...d.global },
    bySub: JSON.parse(JSON.stringify(d.bySub || {})),
  }
  // 允许同一叫法同时存在全局与小类两条：小类优先覆盖（entries() 已把小类排在前面）。
  // 这样给某个小类定特例时，不会让该叫法在其它小类失效。
  if (sb) {
    if (!next.bySub[sb]) next.bySub[sb] = {}
    next.bySub[sb][a] = s
  } else {
    next.global[a] = s
  }
  if (wouldCycle(next, a, s, sb)) throw new Error('该映射会与现有规则形成循环（A→B 且 B→A），请检查')
  persist(next)
  return { ok: true, alias: a, std: s, scope: sb ? 'sub' : 'global', sub: sb }
}

/**
 * 修改一条同义词（可以同时改编法、标准名和适用范围）
 * 用 oldAlias/oldSub 精确定位原条目，一次完成「删旧 + 写新」，避免前端分两次请求造成中间态丢失。
 */
export function updateSynonym({ oldAlias, oldSub, alias, std, sub } = {}) {
  const oa = norm(oldAlias)
  const osb = norm(oldSub)
  const a = norm(alias)
  const s = norm(std)
  const sb = norm(sub)
  if (!oa) throw new Error('缺少原叫法')
  if (!a) throw new Error('非标准叫法不能为空')
  if (!s) throw new Error('标准名称不能为空')
  if (a === s) throw new Error('非标准叫法与标准名称不能相同')
  if (a.length > 24) throw new Error('非标准叫法过长（最多 24 字）')
  if (s.length > 24) throw new Error('标准名称过长（最多 24 字）')
  // 「标准名包含叫法」仅在全局生效时才危险：全局条目参与片段替换（contains），
  // 如 断路器→塑壳断路器 作用在「框架断路器」上会拼出「框架塑壳断路器」。
  // 小类(bySub)条目只参与「完全一致/打字中」，不参与片段替换，故允许「短叫法 → 本小类更完整的标准名」，
  // 这是存量里最常见的一类归一（电阻→管型电阻、互感器→电流互感器），既有条目本就这样写。
  if (!sb && s.includes(a)) throw new Error('标准名称不能包含非标准叫法（替换后会残留，形成死循环）')
  if (sb && !/^\d{6}$/.test(sb)) throw new Error('小类编码必须是 6 位数字')

  const d = loadDict()
  const next = {
    meta: { ...d.meta, updatedAt: new Date().toISOString() },
    global: { ...d.global },
    bySub: JSON.parse(JSON.stringify(d.bySub || {})),
  }
  // 删旧（按原作用域精确定位）
  if (osb) {
    if (next.bySub[osb] && next.bySub[osb][oa]) delete next.bySub[osb][oa]
    if (next.bySub[osb] && !Object.keys(next.bySub[osb]).length) delete next.bySub[osb]
  } else {
    delete next.global[oa]
  }
  // 写新
  if (sb) {
    if (!next.bySub[sb]) next.bySub[sb] = {}
    next.bySub[sb][a] = s
  } else {
    next.global[a] = s
  }
  if (wouldCycle(next, a, s, sb)) throw new Error('该映射会与现有规则形成循环（A→B 且 B→A），请检查')
  persist(next)
  return { ok: true, alias: a, std: s, scope: sb ? 'sub' : 'global', sub: sb }
}

/** 删除一条同义词 */
export function removeSynonym({ alias, sub } = {}) {
  const a = norm(alias)
  const sb = norm(sub)
  if (!a) throw new Error('缺少非标准叫法')
  const d = loadDict()
  const next = {
    meta: { ...d.meta, updatedAt: new Date().toISOString() },
    global: { ...d.global },
    bySub: JSON.parse(JSON.stringify(d.bySub || {})),
  }
  let removed = 0
  // 未指定小类时，全局与该叫法的所有小类条目一并删除
  if (next.global[a]) { delete next.global[a]; removed++ }
  for (const k of Object.keys(next.bySub)) {
    if (sb && k !== sb) continue
    if (next.bySub[k] && next.bySub[k][a]) { delete next.bySub[k][a]; removed++ }
    if (next.bySub[k] && !Object.keys(next.bySub[k]).length) delete next.bySub[k]
  }
  if (!removed) return { ok: false, removed: 0 }
  persist(next)
  return { ok: true, removed }
}

// ---------------------------------------------------------------------------
// 存量名称联想（第一等数据源）
//
// 设计依据：联想必须以「已存在物料名称」为准，而不是拿小类名去猜。
//   - 存量名称是本库已在用的真实写法，命中即可直接沿用，天然同物同名；
//   - 同义词字典只负责把存量里的非标准叫法再归一（提示，不自动改）；
//   - 小类标准名（subName）仅在存量完全无候选时兜底，避免「按小类硬猜」。
// ---------------------------------------------------------------------------

/** 输入与存量名称的关联类型；返回 null = 不相关（宁缺勿滥，避免误伤无关名称） */
function stockKind(input, cand, inSub) {
  if (!cand) return null
  // 完全同名：本小类里就是它自己（无信息量，跳过）；
  // 其它小类里有同名物料则很有价值 —— 说明该叫法属于别处/可能选错小类
  if (cand === input) return inSub ? null : 'exact'
  if (cand.startsWith(input)) return 'prefix'      // 输入是候选开头（边打字边联想）
  if (cand.endsWith(input)) return 'suffix'        // 输入是核心词（动力电缆 ← 电缆）
  if (cand.includes(input)) return 'contains'      // 中间包含
  if (input.includes(cand) && cand.length >= 2) return 'contained' // 输入带了修饰词
  return null
}

const STOCK_WEIGHT = { exact: 5, prefix: 4, suffix: 3, contains: 2, contained: 1 }

/**
 * 对存量名称做联想排序。
 * @param {string} raw 用户输入
 * @param {{inSub?:Array<{name:string,count:number}>, others?:Array<{name:string,count:number,sub:string,subName?:string}>}} pool
 * @param {{limit?:number, exclude?:Set<string>}} opts
 * @returns {Array<{name:string,count:number,kind:string,inSub:boolean,sub:string,subName:string}>}
 */
export function rankStockNames(raw, pool = {}, opts = {}) {
  const input = norm(raw)
  if (input.length < 1) return []
  const limit = opts.limit || 6
  const exclude = opts.exclude || new Set()
  const out = []
  const seen = new Set()

  const take = (list, inSub) => {
    for (const c of list || []) {
      const name = norm(c.name)
      if (!name) continue
      if (/\s/.test(name)) continue            // 带空格的存量脏名不参与联想
      if (name.length > 24) continue           // 超长名（含型号）不作名称候选
      if (exclude.has(name)) continue
      const kind = stockKind(input, name, inSub)
      if (!kind) continue
      if (seen.has(name)) continue             // 本小类优先，已出现则不再取其它小类的同名
      seen.add(name)
      out.push({
        name, count: Number(c.count) || 0, kind, inSub,
        sub: inSub ? '' : String(c.sub || ''), subName: inSub ? '' : String(c.subName || ''),
      })
    }
  }
  take(pool.inSub, true)
  take(pool.others, false)

  // 排序：档位 > （短输入时）名称更短优先 > 频次 > 名称
  // 短输入（<=3 字，如「断路」「三相」）时，高频长名称会把目标挤出前几屏，
  // 实测把「更短=更接近核心词」提到频次前面，前3命中率 72.5%→73.7%，其余场景不变。
  const shortInput = input.length <= 3
  out.sort((a, b) =>
    (STOCK_WEIGHT[b.kind] - STOCK_WEIGHT[a.kind]) ||
    (shortInput ? (a.name.length - b.name.length) : 0) ||
    (b.count - a.count) ||
    (a.name.length - b.name.length) ||
    a.name.localeCompare(b.name))
  return out.slice(0, limit)
}

/** 该名称在当前小类下的写法统计（供「本小类常用名称」参考，不做自动推荐） */
export function nameFrequency(docs, sub, limit = 8) {
  const m = new Map()
  for (const d of docs || []) {
    if (sub && d.sub !== sub && !String(d.fnumber || '').startsWith(sub)) continue
    const n = norm(d.name)
    if (!n) continue
    m.set(n, (m.get(n) || 0) + 1)
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

export default { loadDict, suggestName, findAllSuggestions, listSynonyms, stats, setSynonym, updateSynonym, removeSynonym, nameFrequency, rankStockNames }

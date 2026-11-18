/**
 * 规格型号「分段补全」——按范式模板推断当前在填哪个参数，给出该参数的取值候选。
 *
 * 设计依据（实测数据，见讨论记录）：
 *   1. 按空格拆整句的候选质量差（Top5 覆盖 2%~34%，因用户写法与模板不齐），
 *      而按「参数」拆的候选质量好得多：
 *        枚举型（极数/脱扣曲线/精度/分断等级）：Top5 覆盖 91%~100%
 *        半枚举型（额定电压/芯数/功率/截面）：Top5 覆盖 43%~76%
 *        自由型（型号/阻值）：取值上百种 → 不猜值，只补单位
 *   2. 因此本模块只做「模板里能对齐到参数库」的段，对齐不上的段直接跳过（绝不猜）。
 *
 * 关键机制：
 *   - 模板占位符 → 参数名：用 config/guide-field-map.json 的 alias 翻译
 *     （如 {脱扣特性} → 脱扣曲线；{额定功率} → 功率）
 *   - 相邻占位符合并成一段：`{脱扣特性}{额定电流}A` 是一个补全单元，候选为 `C16A`、`C10A`
 *   - 候选值来自本小类存量规格的参数提取结果，按频次排序
 *   - 段尾单位（A/Ω/W/mm^2）用于「数字后自动补单位」
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { getCategory, chooseTokens } from './classify.js'
import { extractParams } from './struct-spec.js'
import { loadGuide } from './guide-fields.js'
import { enabled as paramLibEnabled, isShadow as paramLibShadow, checkValue as paramLibCheck, paramDef as paramLibDef, subParams as paramLibSubParams, subOrder as paramLibOrder } from './param-lib/store.js'
import { normalize as paramLibNormalize } from './param-lib/normalize.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP_FILE = path.join(ROOT, 'src/config/guide-field-map.json')

// 模板占位符 → 参数名（只读翻译层，60 秒缓存，改文件即时生效）
let _alias = null
let _aliasAt = 0
function aliasMap() {
  if (_alias && Date.now() - _aliasAt < 60000) return _alias
  _aliasAt = Date.now()
  try { _alias = JSON.parse(fs.readFileSync(MAP_FILE, 'utf8')).alias || {} }
  catch (e) { _alias = {} }
  return _alias
}

/**
 * 把 specPattern 拆成「补全段」。
 *
 * 一个「段」= 空格分隔的一段，内部可能含多个占位符（如 `{脱扣特性}{额定电流}A`、`{芯数}*{截面}mm^2`）。
 * 段内保留 `tpl`（占位符原样）与分隔符，拼值时按位替换 ——
 * 否则 `3` 和 `2.5` 会拼成 `32.5`（丢了 `*`），候选就全错了。
 * @returns {{segments: Array<{key:string, params:string[], rawNames:string[], tpl:string, unit:string}>, tokens:string[], pattern:string}}
 */
export function patternSegments(sub) {
  const s = String(sub || '').slice(0, 6)
  const pat = (((loadGuide().subs || {})[s] || {}).specPattern) || ''
  const info = getCategory(s)
  const tokens = chooseTokens(info)
  const al = aliasMap()
  const out = []
  for (const seg of String(pat).split(/\s+/).filter(Boolean)) {
    const rawNames = [...seg.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].trim())
    if (!rawNames.length) continue
    // 翻译成参数名；参数库里没有的（如 壳架/设备类型/关键参数/端头类型）留空
    const mapped = rawNames.map((n) => al[n] || (tokens.includes(n) ? n : ''))
    const kept = mapped.filter(Boolean)
    if (!kept.length) continue                     // 全部对不上 → 整段跳过（确实无从推荐）

    // 部分对齐：把对不上的占位符从模板里剪掉（连同其后紧跟的分隔符），而不是整段丢弃。
    // 否则 `{壳架}/{额定电流}A` 会整段消失 —— 用户输入 12（1250 的前缀）时被归到"分断能力"，
    // 表现为"12 后面本该有参数却不出候选"（实测 100101 固定式框架断路器）。
    let tplSeg = seg
    rawNames.forEach((n, i) => {
      if (mapped[i]) return
      const esc = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      tplSeg = tplSeg.replace(new RegExp('\\{' + esc + '\\}[/\\*×·]?'), '')
    })
    tplSeg = tplSeg.replace(/^[/\*×·\s]+/, '').replace(/[/\*×·\s]+$/, '')

    let unit = tplSeg.replace(/\{[^}]+\}/g, '').replace(/^[*×·]+/, '').trim()
    if (!/^[A-Za-zΩ℃°%μ0-9^]+$/.test(unit)) unit = ''
    // tpl：去掉尾部单位后的段模板（保留参数间分隔符）
    const tpl = unit ? tplSeg.slice(0, tplSeg.lastIndexOf(unit)) : tplSeg
    out.push({
      key: kept.join('+'),
      params: kept,
      rawNames,
      tpl,
      unit,
      partial: kept.length < rawNames.length,   // 该段有占位符未能对齐（如 {壳架}）
    })
  }
  return { segments: out, tokens, pattern: pat }
}

/** 按段模板拼值：{脱扣特性}{额定电流} + {脱扣曲线:C, 额定电流:16A} → C16A */
function fillTpl(seg, vals) {
  let i = 0
  return seg.tpl.replace(/\{[^}]+\}/g, () => {
    const p = seg.params[i++]
    return vals[p] || ''
  })
}

// 每小类的「段 → 取值频次」表，5 分钟缓存（存量变了不用重启）
const CACHE = new Map()
const TTL = 5 * 60 * 1000

/**
 * @param {string} sub 小类
 * @param {Array<{fSpec?:string, spec?:string, fnumber?:string, FNUMBER?:string}>} [items]
 *        该小类的物料（由调用方提供 —— 3130 用 allDocs()，3100 用 plm-index 的 bucketItems）。
 *        不传则仅返回模板结构、无候选。
 */
function statOf(sub, items) {
  const src = items || []
  // 缓存键必须带上「标准库开关状态」：
  // 否则切换 enabled/shadow 后仍命中 5 分钟前的旧统计，
  // 表现为「开关改了但候选没变」（实测对比三种状态结果完全一致，就是踩了这个）。
  const plFlag = paramLibEnabled(sub) ? (paramLibShadow() ? ':shadow' : ':assist') : ':off'
  const ckey = sub + plFlag
  const hit = CACHE.get(ckey)
  // 数据源变了（条数不同）也要重建，避免缓存住空表
  if (hit && Date.now() - hit.at < TTL && hit.srcCount === src.length) return hit
  const meta0 = patternSegments(sub)
  // 模板只声明了部分参数（如 100101 模板 5 段，库里实有 8 个参数），
  // 未声明的那些（脱扣器 / 脱扣曲线 / 分断等级）永远轮不到补全。
  // 这里把「库里有值、但模板没写」的参数追加为独立段，让补全覆盖整个参数库；
  // 只追加有值的（没值的参数追上去也没候选，只会多一个空段）。
  const declared = new Set(meta0.segments.flatMap((x) => x.params))
  const extra = []
  for (const [p, d] of Object.entries(paramLibSubParams(sub) || {})) {
    if (declared.has(p)) continue
    if (!((d.accepted || []).length)) continue
    extra.push({ key: p, params: [p], rawNames: [p], tpl: '{' + p + '}', unit: '', appended: true })
  }
  let segs = [...meta0.segments, ...extra]
  // 按人工设定的参数顺序（参数标准库界面用左右箭头调的）重排段序列，
  // 让"物料录入时的提示顺序"跟界面顺序一致；未列入 order 的保持原相对顺序。
  const order = paramLibOrder(sub)
  if (order.length && segs.length) {
    const oidx = new Map(order.map((n, i) => [n, i]))
    segs = segs.slice().sort((a, b) => {
      const ia = oidx.has(a.params[0]) ? oidx.get(a.params[0]) : null
      const ib = oidx.has(b.params[0]) ? oidx.get(b.params[0]) : null
      if (ia != null && ib != null) return ia - ib
      if (ia != null) return -1
      if (ib != null) return 1
      return 0
    })
  }
  const meta = { ...meta0, segments: segs }
  const table = new Map()
  for (const it of src) {
    // 调用方可以传"该小类"或"全量"：这里统一按小类过滤
    // 三处来源字段命名不同：plm-index 的 minimal() 用 fNumber，看板 allDocs() 用 fnumber，快照用 FNUMBER
    const sn = String(it.sub || it.SUB || '').slice(0, 6)
    const fn = String(it.fnumber || it.FNUMBER || it.fNumber || '')
    if (sn ? sn !== sub : !fn.startsWith(sub)) continue
    const spec = String(it.fSpec || it.spec || '')
    if (!spec) continue
    const vals = extractParams(spec, meta.tokens)
    for (const sg of meta.segments) {
      if (!sg.params.every((p) => vals[p])) continue   // 参数不全 → 该段不算有效取值
      // 单参数段：若该小类已收录参数标准库，只接受「库内认可的值」。
      // 否则型号片段会被当成参数值 —— 实测 "LA38-11/203" 被解析出 额定电压="11/203"，
      // 于是候选里冒出 11/203、22/203 这类垃圾（它们并不在参数库里）。
      // 影子模式（shadow=true）下不过滤 —— 影子的定义是「不影响结果」。
      // 要真正按标准库收敛候选，需 enabled=true 且 shadow=false。
      //
      // ⚠ free 型（型号/阻值/容值）必须跳过过滤：它们本就没有"标准值"，
      //   checkValue 对它们的返回值恒为 unknown，一旦过滤就会把「型号段」整个清空 ——
      //   表现为「输入型号时一个候选都没有，像是补全功能被关了」。
      if (sg.params.length === 1 && paramLibEnabled(sub) && !paramLibShadow()) {
        const def = paramLibDef(sub, sg.params[0])
        if (def && def.type !== 'free') {
          const chk = paramLibCheck(sub, sg.params[0], vals[sg.params[0]])
          if (!chk.ok) continue
        }
      }
      // 补段单位：`{脱扣特性}{额定电流}A` 需拼成 "C10A"、`{芯数}*{截面}mm^2` 需 "3*2.5mm^2"。
      // 但 extractParams 取到的值有时已带单位（16A / 10kΩ），无脑追加会变成 C10AA、10kΩΩ ——
      // 故先判断值是否已以该单位结尾。
      const filled = fillTpl(sg, vals)
      if (!filled) continue
      const u = sg.unit || ''
      let v = (u && !filled.toUpperCase().endsWith(u.toUpperCase())) ? filled + u : filled
      // 数量级字母统一小写：10KΩ → 10kΩ（同一参数出现两种写法会让候选重复且难扫视）
      v = v.replace(/(\d)K(?=Ω)/g, '$1k')
      // 单参数段用统一归一规则收敛写法：三极P/三极 → 3P、AC220V → 220V、10K → 10kΩ。
      // 统计是在存量原文上做的，不归一就会出现「3P」和「三极P」两个候选（实测 100201）。
      if (sg.params.length === 1) {
        const nv = paramLibNormalize(sg.params[0], v)
        if (nv) v = nv
      }
      if (!table.has(sg.key)) table.set(sg.key, new Map())
      const m = table.get(sg.key)
      m.set(v, (m.get(v) || 0) + 1)
    }
  }
  const ranked = new Map()
  for (const [k, m] of table) {
    ranked.set(k, [...m.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count })))
  }
  const st = { at: Date.now(), ...meta, ranked, total: src.length, srcCount: src.length }
  CACHE.set(ckey, st)
  return st
}

/**
 * 规格输入补全。
 * @param {string} sub 小类 6 位
 * @param {string} q   当前已输入内容
 * @returns 当前段、已填段、候选（带频次）与模板
 */
export function complete(sub, q, items, depth = 0) {
  const s6 = String(sub || '').slice(0, 6)
  const raw = String(q || '')
  const st = statOf(s6, items)

  if (!st.segments.length) {
    return { ok: false, reason: '该小类模板无法对齐参数库', param: '', prefix: '', options: [], segments: [], pattern: st.pattern, sampleSize: st.total }
  }

  const tail = (/([^\s]*)$/.exec(raw) || [, ''])[1]
  const vals = extractParams(raw, st.tokens)

  // 当前段推断（IDE 语义：先补全"正在打的那一段"，再考虑"下一段"）
  //   ① 末尾片段能归属某段 → 就是它（例：NXB-6 仍在填型号，不该跳到极数）
  //   ② 末尾为空（刚打空格）→ 取第一个未填段
  // 关键：归属只从「head 已填完的段之后」开始找。
  //       否则「型号」这类宽正则会把 3P / C1 也认成型号（实测：NXB-63 3P 被判成型号段）。
  const headStr = tail ? raw.slice(0, raw.length - tail.length) : raw
  // 型号段固定吃第一个 token，其内容不参与后续段的「是否已填」判定。
  // 原因：型号正则极宽，会把型号里的片段认成别的参数 ——
  //   实测 "LA38-11/203" 被解析出 额定电压="11/203"，于是空格后直接跳过电压段、
  //   跳到颜色，用户看不到本该出现的电压提示。
  const headToks = String(headStr).trim().split(/\s+/).filter(Boolean)
  const firstIsModel = st.segments[0] && st.segments[0].params.length === 1 && st.segments[0].params[0] === '型号'
  let start = 0
  if (firstIsModel && headToks.length) {
    start = 1                                  // 第一个 token 归型号段
    const restVals = extractParams(headToks.slice(1).join(' '), st.tokens)
    for (let i = 1; i < st.segments.length; i++) {
      if (st.segments[i].params.every((p) => restVals[p])) start = i + 1
      else break
    }
  } else {
    const headVals = extractParams(headStr, st.tokens)
    for (let i = 0; i < st.segments.length; i++) {
      if (st.segments[i].params.every((p) => headVals[p])) start = i + 1
      else break
    }
  }
  let idx = -1
  if (tail) {
    for (let i = start; i < st.segments.length; i++) {
      const segI = st.segments[i]
      const tv = extractParams(tail, segI.params)
      if (!segI.params.some((p) => tv[p])) continue
      // 型号段让位：若这一段输入里还能解析出别的参数（典型 GSW3-3200/3P 的 /3P），
      // 说明型号已经写完，不该再被当成"仍在填型号"。否则后续段永远轮不到，
      // 用户按 Tab 只会得到一个和型号重复的型号串。
      if (i === 0 && segI.params.length === 1 && segI.params[0] === '型号') {
        const hasOther = st.segments.slice(1)
          .some((sg) => sg.params.some((p) => (extractParams(tail, sg.params)[p] || '')))
        if (hasOther) continue
      }
      idx = i
      break
    }
  }
  if (idx < 0) idx = start < st.segments.length ? start : st.segments.length - 1

  // 末尾为空（刚打完空格）时，如果当前段没有任何候选，就向后找第一个有候选的段。
  // 否则会"卡"在冷门段上（如 101001 的安装孔径，存量只有 2% 写过），
  // 用户看到的是"什么都没有"，误以为补全功能失效。
  // 只在前缀为空时跳：用户正在输入某段时不跳，避免打断。
  const prefixOf = tail
  if (!prefixOf) {
    // 跳过条件：没候选 **或** 该段参数已经能从规格里解析出来（如极数已由型号 /3P 表达）。
    // 只看"有没有候选"会跳回来：GSW3-3200/3P 推进到「壳架+额定电流」（无候选）后，
    // 又落回「极数」，等于白跳。
    // 型号段不参与"已填"判断：型号永远有值，否则刚输入型号就被跳过。
    let probe = idx
    while (probe < st.segments.length) {
      const sg = st.segments[probe]
      const hasCand = (st.ranked.get(sg.key) || []).length > 0
      const isModel = sg.params.length === 1 && sg.params[0] === '型号'
      const filled = !isModel && sg.params.every((p) => (extractParams(raw, sg.params)[p] || ''))
      if (hasCand && !filled) break
      probe++
    }
    if (probe < st.segments.length) idx = probe
  }

  const seg = st.segments[idx]
  const prefix = tail

  // 该段参数若已能从规格前面解析出来（典型：型号内嵌 /3P 已表示极数），
  // 就视为"已填"，直接推进到下一段。
  //
  // 为什么不能只在"同值"时拦：极数这类参数在一条规格里只能出现一次，
  // GSW3-3200/3P 后面再写 4P 同样矛盾（用户明确指出）。
  // 因此判断依据是"参数是否已解析出值"，而不是"值是否相同"。
  //
  // 顺带解决另一个边界：型号后未打空格时整串会被型号正则吞掉，
  // 这里能识别出内嵌参数，从而正常推进，不会停在型号段。
  if (depth < 6) {
    // 用整串判断而不是 headStr：型号后未打空格时 tail 就是整串、headStr 为空，
    // 只看 headStr 会漏掉"型号里已经写了极数"这种情况。
    //
    // 两个必须排除的情况：
    //  ① 型号段本身：型号永远是"有值"的，推进它等于没输入就跳走（NXB-6 → 直接跳到极数）
    //  ② 组合段（壳架+额定电流）：只要一个参数有值就推进，会导致该段永远显示不全
    //     （GSW3-3200 有壳架 3200、但额定电流还没写）
    const isModelSeg = seg.params.length === 1 && seg.params[0] === '型号'
    if (!isModelSeg) {
      const v = extractParams(raw, seg.params)
      const filledNow = seg.params.every((p) => v[p])
      if (filledNow && idx < st.segments.length - 1) {
        return complete(s6, String(raw).replace(/\s*$/, '') + ' ', items, depth + 1)
      }
    }
  }

  const all = st.ranked.get(seg.key) || []
  // 过滤按「参数值」而不是「字符串包含」：
  //   输入 "10" 时，字符串 includes 会命中 D100A / C100（都含 "10"），但它们额定电流是 100，明显不是用户要的。
  //   正确做法：把用户已输入的片段解析出参数值，候选的对应参数必须一致（数值比较，忽略 A/mm^2 等单位后缀）。
  // 用户常省略单位：输入 "10" 想表达 10A、"10k" 想表达 10kΩ。
  // 而参数正则通常要求带单位（额定电流 = /^(\d+)\s*A$/），直接解析会得到空值 →
  // 过滤失效、一个候选都不给（实测 GSB2-63M/2P 10 就是这样）。故补单位再试一次。
  let tailVals = prefix ? extractParams(prefix, seg.params) : {}
  if (prefix && seg.unit && !seg.params.some((p) => tailVals[p])) {
    const v2 = extractParams(prefix + seg.unit, seg.params)
    if (seg.params.some((p) => v2[p])) tailVals = v2
  }
  const hasTail = seg.params.some((p) => tailVals[p])
  // 组合段（`{芯数}*{截面}mm^2`）：用户输入 "3" 可能指首参数（3 芯）也可能指末参数（3 平方）。
  // 上面补单位只匹配到末参数，这里再不补单位解析一次，作为备选条件，两者取并集。
  let tailAlt = null
  if (prefix && seg.params.length > 1 && hasTail) {
    const v0 = extractParams(prefix, seg.params)
    if (seg.params.some((p) => v0[p]) && JSON.stringify(v0) !== JSON.stringify(tailVals)) tailAlt = v0
  }
  const numOf = (s) => {
    const m = /([\d.]+)/.exec(String(s || ''))
    return m ? parseFloat(m[1]) : null
  }
  const eqVal = (a, b) => {
    const na = numOf(a)
    const nb = numOf(b)
    if (na != null && nb != null && na === nb) return true
    return String(a).toUpperCase() === String(b).toUpperCase()
  }
  let opts
  const kk = prefix.toLowerCase()
  if (hasTail) {
    const matchBy = (tv) => all.filter((x) => {
      const cv = extractParams(x.value, seg.params)
      return seg.params.every((p) => !tv[p] || eqVal(cv[p], tv[p]))
    })
    // ① 参数级精确匹配（输入 10 只留额定电流=10，排除 D100A/C100）
    const exact = matchBy(tailVals)
    // ①b 组合段的另一种理解（3 芯 vs 3 平方）
    const exactAlt = tailAlt ? matchBy(tailAlt) : []
    // ①c 组合段：把前缀直接当首个参数（输入 3 可能是「3 芯」，此时 extractParams 未必识别得出）
    let firstHit = []
    if (kk && seg.params.length > 1) {
      const fp = seg.params[0]
      firstHit = all.filter((x) => {
        const cv = extractParams(x.value, seg.params)
        return cv[fp] && eqVal(cv[fp], prefix)
      })
    }
    // ② 字符串前缀匹配（容错：输入 C1 时 C10A/C16A 也可能是想要的，不能只给 C1A）
    const pre = kk ? all.filter((x) => x.value.toLowerCase().startsWith(kk)) : []
    const seen = new Set()
    opts = []
    // 顺序即优先级：组合段输入 "3" 时，"芯数=3"（3*2.5mm^2）比"截面=3"更可能是用户本意，
    // 而 exact 往往条数更多，会把前者挤出前 N 个（实测只看到 3*3mm^2、20*3.0mm^2 等截面=3 的）
    for (const x of [...firstHit, ...exact, ...exactAlt, ...pre]) {
      if (seen.has(x.value)) continue
      seen.add(x.value)
      opts.push(x)
    }
    if (!opts.length) opts = pre
  } else {
    opts = kk ? all.filter((x) => x.value.toLowerCase().startsWith(kk)) : all
  }

  // —— 剔除「已出现在规格前面部分」的候选 ——
  // 型号本身常内嵌参数：GSW3-3200/3P 的 /3P 已经表示三极，再推荐 3P 只会诱导用户重复书写。
  // 边界允许 / - （ ( 这类分隔符，但不允许字母数字 —— 否则 C10A 里的 10A 会被误判为已写。
  if (headStr) {
    opts = opts.filter((x) => {
      const esc = String(x.value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return !new RegExp('(^|[\\s/\\-（(])' + esc + '(?=$|[\\s/\\-）)])', 'i').test(String(headStr))
    })
  }

  // —— 剔除「与已输入内容完全相同」的候选 ——
  // 用户已经把这一段写完了，再把它推荐给自己毫无意义；更糟的是按 Tab 会把同一值再插一遍，
  // 表现为「候选里重复显示自己」（实测 101001 型号段把 LA38-11/203 推荐给它自己）。
  if (prefix) {
    // 宽松归一后比较：只差空格/连字符/大小写的，视为同一个值。
    // 典型：输入「NM8N -250」时不该再推荐「NM8N-250」——
    // 严格相等比较时两者不同，候选里就会出现"自己推荐自己"。
    const loose = (s) => String(s == null ? '' : s)
      .toLowerCase()
      .replace(/\s+/g, '')            // 去掉所有空白
      .replace(/[－—–_]/g, '-')        // 全角/长横线统一成半角连字符
      .replace(/[．。]/g, '.').replace(/[／]/g, '/')
    const k = loose(prefix)
    opts = opts.filter((x) => loose(x.value) !== k)

    // —— 写完整后自动推进到下一段 ——
    // prefix 与本小类某个存量值完全一致 → 说明这一段已写完，直接给出下一段的候选。
    // 这样「输完型号 → 提示电压」「输完电压 → 提示颜色」，不必依赖用户记得打空格。
    // 继续打字时会重新计算（此时 prefix 不再等于任何完整值，会回到本段补全），风险可控。
    const isComplete = all.some((x) => String(x.value).trim().toLowerCase() === k)
    if (isComplete && idx < st.segments.length - 1) {
      return complete(s6, String(raw).replace(/\s*$/, '') + ' ', items)
    }
  }

  // 单位补全：本段带单位、输入是「数字（可带 k/M/μ 倍率）」→ 优先给「数字+单位」
  // 例：电阻段输入 10k → 10kΩ
  // 限定单参数段：组合段 `{芯数}*{截面}mm^2` 的单位只属于后半段，
  // 若对整段补单位，输入 "3" 会被补成 "3mm^2"（实测发现的错误）
  // 单位补全只在「该值确实存在」时给：输入 10k → 10kΩ 有意义；
  // 但输入 12 就造出 12A（该小类根本没有 12A）只会误导用户。
  const unitHit = seg.unit && seg.params.length === 1 && /^[\d.]+\s*[kKmMμuGg]?$/.test(prefix)
  if (unitHit) {
    const withUnit = prefix + seg.unit
    const exists = all.some((x) => x.value === withUnit) || opts.some((x) => x.value === withUnit)
    if (exists) opts = [{ value: withUnit, count: 0, kind: 'unit' }, ...opts.filter((x) => x.value !== withUnit)]
  }

  return {
    ok: true,
    param: seg.key,
    unit: seg.unit,
    prefix,
    index: idx,
    total: st.segments.length,
    filled: st.segments.slice(0, idx).map((x) => x.key),
    segments: st.segments.map((x) => x.key + (x.unit ? x.unit : '')),
    options: opts.slice(0, 8),
    pattern: st.pattern,
    sampleSize: st.total,
  }
}

/** 清缓存（测试或数据刷新时用） */
export function clearCompleteCache() { CACHE.clear(); SEG_CACHE.clear() }

// 段序列缓存：normalizeByTemplate 会被「索引加载 2 万条」和「每次查重」调用，
// 不缓存的话 patternSegments 每次都重建模板，明显拖慢启动。
const SEG_CACHE = new Map()
function segmentsOf(sub) {
  const s6 = String(sub || '').slice(0, 6)
  const hit = SEG_CACHE.get(s6)
  if (hit) return hit
  const v = patternSegments(s6)
  SEG_CACHE.set(s6, v)
  return v
}

/**
 * 规格规范化 —— 用于**查重签名**，把「同一物的不同写法」收敛成同一结果。
 *
 * 解决的实际问题：用户少写单位时签名不同，导致同一物被判为新物料。
 *   输入 NXBF-63 2P C20   → 规范化 NXBF-63 2P C20A
 *   输入 NXBF-63 2P C20A  → 规范化 NXBF-63 2P C20A     ← 两者签名相同，能判重复
 *
 * 做法：按模板逐段解析；某段解析不全时补上该段单位再试（C20 → C20A、3*2.5 → 3*2.5mm^2）；
 *      最后按模板顺序重组。
 *
 * 安全：一段都拼不出来时返回原值 —— 宁可漏判，也不能把规格改错后拿去比对。
 */
export function normalizeByTemplate(sub, spec) {
  const s6 = String(sub || '').slice(0, 6)
  const raw = String(spec || '').trim()
  if (!raw) return raw
  const meta = segmentsOf(s6)
  if (!meta.segments.length) return raw

  const tokens = raw.split(/\s+/).filter(Boolean)
  if (!tokens.length) return raw

  const vals = {}
  let ti = 0
  // 型号段固定吃第一个 token（型号正则太宽，会抢走 3*2.5、C20 这类片段）
  const first = meta.segments[0]
  if (first && first.params.length === 1 && first.params[0] === '型号' && tokens.length) {
    vals['型号'] = tokens[0]
    ti = 1
  }

  let segIdx = ti ? 1 : 0
  for (; ti < tokens.length; ti++) {
    const t = tokens[ti]
    let hit = false
    for (let i = segIdx; i < meta.segments.length; i++) {
      const seg = meta.segments[i]
      let v = extractParams(t, seg.params)
      if (!seg.params.some((p) => v[p]) && seg.unit) {
        const v2 = extractParams(t + seg.unit, seg.params)     // 补段单位再试
        if (seg.params.some((p) => v2[p])) v = v2
      }
      if (seg.params.some((p) => v[p])) {
        for (const p of seg.params) if (v[p]) vals[p] = v[p]
        segIdx = i
        hit = true
        break
      }
    }
    if (!hit) continue      // 无法归入任何段（多余内容）—— 忽略，不影响已解析的段
  }

  const parts = []
  for (const seg of meta.segments) {
    if (!seg.params.every((p) => vals[p])) continue           // 该段不全 → 跳过
    let v = fillTpl(seg, vals)
    const u = seg.unit || ''
    if (u && !v.toUpperCase().endsWith(u.toUpperCase())) v += u
    v = v.replace(/(\d)K(?=Ω)/g, '$1k')
    parts.push(v)
  }
  return parts.length ? parts.join(' ') : raw
}

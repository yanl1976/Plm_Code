/**
 * 阻断开关：按配置把「必须修改」的校验降级为「建议修改」
 *
 * 配置来源
 *   插件：ItemSmartInput.config.js 的 blocks 段（前端随请求体传入）
 *   看板：window.BLOCK_CONFIG（前端拼进请求）
 *
 * 语义
 *   blocks.<key> === false → 该条 error 降级为 warning，不再阻断保存
 *   blocks 未提供或非 false → 按 true 处理（保持原有严格行为）
 *
 * 与 hints.mute 的分工
 *   blocks   控制「是否拦截保存」
 *   hints.mute 控制「是否显示」
 */

// 文案 → 开关 key。顺序重要：更具体的模式必须排在前（如「名称不能包含全角」先于「名称不能包含」）
export const BLOCK_MAP = [
  // ── 名称（7）──
  { key: 'nameEmpty', re: /^物料名称不能为空/ },
  { key: 'nameLen', re: /^名称(过短|过长)/ },
  { key: 'nameFullWidth', re: /^名称不能包含全角/ },
  { key: 'nameForbidChars', re: /^名称不能包含/ },
  { key: 'nameEqualsSpec', re: /^名称与规格(不能完全相同|完全相同)/ },
  { key: 'nameForbidPattern', re: /^名称里不要写/ },
  { key: 'subMismatch', re: /^名称(疑似|与所选小类)/ },
  // ── 规格（6）──
  { key: 'specEmpty', re: /^型号规格不能为空/ },
  { key: 'specLen', re: /^型号规格(过短|过长)/ },
  { key: 'specFullWidth', re: /^请使用半角字符/ },
  { key: 'specAlnum', re: /^规格必须包含字母或数字/ },
  { key: 'specForbidPattern', re: /^规格里不要写/ },
  { key: 'specPlaceholder', re: /^规格不能写/ },
]

// 查重三档（不在 BLOCK_MAP 里，按 duplicates 的 level 判定）
export const DUP_KEYS = ['dupExact', 'dupSep', 'dupOrder']

export const BLOCK_KEYS = BLOCK_MAP.map((x) => x.key).concat(DUP_KEYS)

/** 把外部传入的 blocks 归一化：支持对象或 JSON 字符串，只保留布尔值 */
export function normalizeBlocks(raw) {
  const out = {}
  let src = raw
  // 前端用 x-www-form-urlencoded 提交时，嵌套对象会被拍平，所以统一用 JSON 字符串传
  if (typeof src === 'string') {
    try { src = JSON.parse(src) } catch (e) { src = null }
  }
  if (!src || typeof src !== 'object') return out
  for (const k of BLOCK_KEYS) {
    if (typeof src[k] === 'boolean') out[k] = src[k]
  }
  return out
}

/**
 * 按开关过滤校验结果：关闭的 error 降级到 warnings
 * @param {{errors?:string[], warnings?:string[]}} result 就地修改
 * @param {object} blocks 开关
 * @returns {{downgraded:number}}
 */
export function applyBlocks(result, blocks) {
  const B = blocks || {}
  let downgraded = 0
  const kept = []
  for (const e of result.errors || []) {
    const hit = BLOCK_MAP.find((x) => x.re.test(e))
    if (hit && B[hit.key] === false) {
      if (!Array.isArray(result.warnings)) result.warnings = []
      result.warnings.push(e + '（已关闭阻断）')
      downgraded++
    } else {
      kept.push(e)
    }
  }
  result.errors = kept
  return { downgraded }
}

/**
 * 查重是否构成硬阻断
 * @param {Array} duplicates queryDuplicates 的结果
 * @param {object} blocks 开关
 * @param {boolean} confirmOrder 用户是否已确认「不是同一物料」
 */
export function isHardDup(duplicates, blocks, confirmOrder) {
  const B = blocks || {}
  const orderOn = B.dupOrder !== false && !confirmOrder
  return (duplicates || []).some((x) =>
    (x.level === 'exact' && B.dupExact !== false) ||
    (x.level === 'sep' && B.dupSep !== false) ||
    (x.level === 'order' && orderOn)
  )
}

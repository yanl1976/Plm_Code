/**
 * 参数值归一 —— 构建与读取共用的唯一实现。
 *
 * 为什么单独抽出来：
 *   build.mjs 需要它把存量写法收敛（10A→10、2→2P、200/5A→200/5）；
 *   store.js 的 checkValue 也需要它，否则调用方传入原始写法（220kV、4极、10k）
 *   与库里的归一键（220KV、4P、10kΩ）对不上，会被误判为"非标"。
 *   两处各写一份必然分叉，故抽为单一真源。
 */

const toHalf = (s) => String(s)
  .replace(/[\uFF01-\uFF5E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
  .replace(/\u3000/g, ' ')
  .trim()

export const NORMALIZERS = {
  极数: (v) => {
    let s = toHalf(v).replace(/\s/g, '')
    // 中文写法：单极/双极/两极/三极/四极、4极 → 1P/2P/3P/4P
    s = s.replace(/^单极$/, '1极').replace(/^双极$/, '2极').replace(/^两极$/, '2极')
      .replace(/^三极$/, '3极').replace(/^四极$/, '4极')
      .toUpperCase().replace(/极$/, 'P')
    const m = /^(\d)P?(\+N)?$/.exec(s)
    return m ? m[1] + 'P' + (m[2] || '') : null
  },
  脱扣曲线: (v) => {
    const s = toHalf(v).toUpperCase().replace(/\s/g, '')
    return ['B', 'C', 'D'].includes(s) ? s : null
  },
  额定电流: (v) => {
    const m = /^([\d.]+)\s*A?$/i.exec(toHalf(v))
    if (!m) return null
    const n = parseFloat(m[1])
    return isFinite(n) && n > 0 ? String(n) : null
  },
  分断能力: (v) => {
    const m = /^([\d.]+)\s*k?A?$/i.exec(toHalf(v))
    if (!m) return null
    const n = parseFloat(m[1])
    return isFinite(n) && n > 0 ? String(n) : null
  },
  // 必须带单位 V/KV —— 否则 "0.66" 会被补成 "0.66V"（曾产生 347 条假值）
  额定电压: (v) => {
    const s = toHalf(v).toUpperCase().replace(/\s/g, '').replace(/^(AC|DC|～|~)/, '')
    if (!/^\d/.test(s)) return null
    if (!/V$/.test(s)) return null
    return /^\d+(\.\d+)?(\/\d+(\.\d+)?)?K?V$/.test(s) ? s : null
  },
  精度: (v) => {
    const s = toHalf(v).replace(/\s/g, '')
    const m = /^±?\d+(\.\d+)?%?$/.exec(s)
    return m ? (s.includes('%') ? s : s + '%') : null
  },
  分断等级: (v) => {
    const s = toHalf(v).toUpperCase().replace(/\s/g, '')
    return /^[A-Z]$/.test(s) ? s : null
  },
  变比: (v) => {
    const s = toHalf(v).replace(/\s/g, '')
    const m = /^(\d+(?:\.\d+)?)[\/:：](\d+(?:\.\d+)?)A?$/i.exec(s)
    return m ? m[1] + '/' + m[2] : null
  },
  容值: (v) => {
    const s = toHalf(v).replace(/\s/g, '').toUpperCase().replace('Μ', 'μ')
    const m = /^(\d+(?:\.\d+)?)(UF|NF|PF|F)$/.exec(s)
    if (!m) return null
    const u = m[2].toLowerCase() === 'uf' ? 'μF' : m[2]
    return m[1] + u
  },
  阻值: (v) => {
    let s = toHalf(v).replace(/\s/g, '').replace(/Ω|R(?=\d|$)/g, 'Ω')
    if (!/^\d/.test(s)) return null
    if (!/Ω$/.test(s)) s = s + 'Ω'
    return s.replace(/([\d.]+)K(?=Ω)/, '$1k')
  },
}

/**
 * 归一。无专属规则时做通用清洗（全角→半角、trim）。
 * @returns {string|null} null 表示该值不符合该参数的形态（应丢弃）
 */
export function normalize(param, v) {
  const f = NORMALIZERS[param]
  if (f) return f(v)
  const s = toHalf(v)
  return s || null
}

export { toHalf }

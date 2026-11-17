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
    // 中文写法：单极/双极/两极/三极/四极 → 1极/2极/3极/4极
    // 注意不能加 $ 锚：存量里有「三极P」「3极P」这类带尾 P 的写法，
    // 加了锚就漏掉，归一结果残留成「三极P」，候选里出现脏值（实测 100201）
    s = s.replace(/^单极/, '1极').replace(/^双极/, '2极').replace(/^两极/, '2极')
      .replace(/^三极/, '3极').replace(/^四极/, '4极')
      .toUpperCase().replace(/极P?$/, 'P')
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
  额定二次电流: (v) => {
    const m = /^(\d+(?:\.\d+)?)\s*A?$/i.exec(String(v || '').trim())
    return m ? m[1] + 'A' : null
  },

  频率: (v) => {
    const m = /^(\d+(?:\.\d+)?)\s*hz$/i.exec(String(v || '').trim())
    return m ? m[1] + 'Hz' : null
  },

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
  // 容值：单位大小写统一为规范写法 pF / nF / μF / mF / F
  // （原先只把 UF 转成 μF，NF/PF 保持大写，导致同一参数出现两种写法，排序也乱）
  容值: (v) => {
    // toUpperCase 会把 μ(U+03BC) 变成希腊大写 Μ(U+039C)，这里先转成 ASCII 的 U 再匹配，
    // 否则 μF 归一后会匹配不到、直接返回 null（值被丢弃）
    const s = toHalf(v).replace(/\s/g, '').toUpperCase().replace(/\u039C/g, 'U')
    const m = /^(\d+(?:\.\d+)?)(UF|NF|PF|MF|F)$/.exec(s)
    if (!m) return null
    const u = m[2] === 'UF' ? 'μF' : m[2] === 'NF' ? 'nF' : m[2] === 'PF' ? 'pF' : m[2] === 'MF' ? 'mF' : 'F'
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

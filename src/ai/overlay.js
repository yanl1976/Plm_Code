// AI 抽取结果回灌（默认关闭，需 AI_EXTRACT=1 才生效，不扰动现有基线）。
// ai-extract 命令烘焙出 data/ai-overlay.json（fNumber -> 合并后的 params），
// dedup.js / server.js 在 AI_EXTRACT=1 时读取并叠加到规则提取结果之上。
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
let cache = null
let cacheLoaded = false

function loadMap() {
  if (cacheLoaded) return cache
  cacheLoaded = true
  cache = new Map()
  if (process.env.AI_EXTRACT !== '1') return cache
  const f = path.join(ROOT, 'data/ai-overlay.json')
  if (fs.existsSync(f)) {
    try {
      const arr = JSON.parse(fs.readFileSync(f, 'utf8'))
      for (const e of arr) if (e.fNumber) cache.set(e.fNumber, e.merged)
    } catch { /* 忽略损坏文件 */ }
  }
  return cache
}

// 把 AI 填空叠加到规则提取结果：只补规则为空的 token，绝不覆盖规则已有值。
export function applyAiOverlay(params, fNumber) {
  if (process.env.AI_EXTRACT !== '1') return params
  const m = loadMap().get(fNumber)
  if (!m) return params
  const out = { ...params }
  for (const [k, v] of Object.entries(m)) {
    if (!(k in out) || !out[k]) out[k] = v
  }
  return out
}

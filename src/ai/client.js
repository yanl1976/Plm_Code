// LLM 客户端：OpenAI 兼容 chat/completions，支持 cloud(MiniMax) / local(内部Qwen) 双档案。
// 仅服务端使用；超时不依赖 fetch 默认；返回 { content, usage, finish }。
// .env 由 src/env.js 统一加载（项目根），此处不再单独调 dotenv
import '../env.js'

export function aiConfig(profile) {
  profile = profile || process.env.AI_DEFAULT_PROFILE || 'cloud'
  if (profile === 'local') {
    const base = (process.env.AI_LOCAL_BASE_URL || 'http://localhost:8080/v1').replace(/\/$/, '')
    return {
      profile: 'local',
      url: base + '/chat/completions',
      key: process.env.AI_LOCAL_API_KEY || '',
      model: process.env.AI_LOCAL_MODEL || '',
    }
  }
  // cloud = MiniMax（MINIMAX_API_URL 已是完整 /chat/completions 路径）
  return {
    profile: 'cloud',
    url: process.env.MINIMAX_API_URL || '',
    key: process.env.MINIMAX_API_KEY || '',
    model: process.env.TOKENHUB_MODEL || 'MiniMax-M2.5-highspeed',
  }
}

export async function callChat(messages, opts = {}) {
  const cfg = aiConfig(opts.profile)
  if (!cfg.url || !cfg.key) throw new Error(`[ai] 档案 ${cfg.profile} 缺少 URL/KEY`)
  const body = {
    model: cfg.model,
    messages,
    temperature: opts.temperature ?? 0,
    max_tokens: opts.maxTokens ?? 2000,
    response_format: { type: 'json_object' },
  }
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? 240000)
  let lastErr = null
  const tries = 1 + (opts.retries ?? 2)
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(cfg.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
        body: JSON.stringify(body),
        signal: ac.signal,
      })
      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`)
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
        continue
      }
      if (!res.ok) { const t = await res.text(); throw new Error(`HTTP ${res.status}: ${t.slice(0, 200)}`) }
      const j = await res.json()
      clearTimeout(timer)
      return {
        content: j?.choices?.[0]?.message?.content || '',
        usage: j?.usage || null,
        finish: j?.choices?.[0]?.finish_reason || null,
      }
    } catch (e) {
      lastErr = e
      if (e.name === 'AbortError') break
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  clearTimeout(timer)
  throw lastErr || new Error('[ai] 未知调用失败')
}

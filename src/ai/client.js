// LLM 客户端：OpenAI 兼容 chat/completions，支持 cloud(外部模型 API) / local(内部大模型) 双档案。
// 仅服务端使用；超时不依赖 fetch 默认；返回 { content, usage, finish }。
// 配置统一来自项目根 .env（经 src/env.js 加载），支持两套命名：
//   cloud: TOKENHUB_BASE_URL + TOKENHUB_API_KEY（推荐，与其它系统共用同一份 .env）
//          或 MINIMAX_API_URL（完整 /chat/completions 路径）+ MINIMAX_API_KEY（旧命名）
//   local: AI_LOCAL_BASE_URL + AI_LOCAL_API_KEY + AI_LOCAL_MODEL
import { env } from '../env.js'

export function aiConfig(profile) {
  profile = profile || env('AI_DEFAULT_PROFILE', 'cloud')
  if (profile === 'local') {
    const base = env('AI_LOCAL_BASE_URL', 'http://localhost:8080/v1').replace(/\/$/, '')
    return {
      profile: 'local',
      url: base + '/chat/completions',
      key: env('AI_LOCAL_API_KEY', ''),
      model: env('AI_LOCAL_MODEL', ''),
    }
  }
  // cloud 档案：MINIMAX_API_URL 视为完整路径；TOKENHUB_BASE_URL 视为 /v1 基址，需拼 /chat/completions
  const fullUrl = env('MINIMAX_API_URL', '')
  const baseUrl = env('TOKENHUB_BASE_URL', '').replace(/\/$/, '')
  return {
    profile: 'cloud',
    url: fullUrl || (baseUrl ? baseUrl + '/chat/completions' : ''),
    key: env('MINIMAX_API_KEY', '') || env('TOKENHUB_API_KEY', ''),
    model: env('TOKENHUB_MODEL', 'MiniMax-M2.5-highspeed'),
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

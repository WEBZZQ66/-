import service from '@/utils/request'

//分页查询我的咨询会话
//skipAuthRedirect：失败时不让全局拦截器清 token 跳登录页，由页面自己提示
export function mySessions(params) {
  return service.get('/psychological-chat/sessions', { params, skipAuthRedirect: true })
}

//获取会话消息列表
export function sessionMessages(sessionId) {
  return service.get(`/psychological-chat/sessions/${sessionId}/messages`, { skipAuthRedirect: true })
}

//创建新的会话
export function startSession(data) {
  return service.post('/psychological-chat/session/start', data)
}

//删除咨询会话
export function deleteSession(sessionId) {
  return service.delete(`/psychological-chat/sessions/${sessionId}`, { skipAuthRedirect: true })
}

//创建或更新情绪日记
export function saveEmotionDiary(data) {
  return service.post('/emotion-diary', data)
}

//查询知识文章列表（推荐阅读：按阅读量倒序）
export function knowledgeArticlePage(params) {
  return service.get('/knowledge/article/page', { params, skipAuthRedirect: true })
}

//获取知识文章详情
export function knowledgeArticleDetail(id) {
  return service.get(`/knowledge/article/${id}`, { skipAuthRedirect: true })
}


//获取会话情绪分析结果
//情绪分析是辅助信息，失败不提示、不跳登录页，页面自己降级成「暂无」
export function sessionEmotion(sessionId) {
  return service.get(`/psychological-chat/session/${sessionId}/emotion`, {
    skipAuthRedirect: true,
    silentError: true
  })
}

/* ---------- 流式对话 ---------- */
//axios 会把响应体整个读完再交给回调，做不了逐字输出，所以这里单独用 fetch 读 SSE
const STREAM_URL = '/api/psychological-chat/stream'
//首字超时：这么久还没吐第一个字，就当失败，避免界面无限转圈
const FIRST_CHUNK_TIMEOUT = 15000

//每个事件里可能是纯文本，也可能是 JSON，这里统一取出正文。
//后端实际格式是 { code, msg, data: { type: 'normal', content: '...' } }，正文在第二层
const chunkText = (data) => {
  if (data === null || data === undefined) return ''
  if (typeof data === 'string') return data
  if (typeof data !== 'object') return String(data)

  const inner = data.data
  //正文可能直接被包在 data.data 里，也可能直接挂在最外层
  const source = inner && typeof inner === 'object' ? inner : data
  const val = source.content ?? source.text ?? source.delta ?? source.message ?? source.answer
  if (typeof val === 'string') return val
  if (typeof inner === 'string') return inner
  return ''
}

//把一段 SSE 事件拆成「事件名 + data 原文」
const splitEvent = (rawEvent) => {
  let eventName = ''
  const dataLines = []

  rawEvent.split('\n').forEach(line => {
    const text = line.trimEnd()
    if (text.startsWith('event:')) {
      eventName = text.slice(6).trim()
    } else if (text.startsWith('data:')) {
      dataLines.push(text.slice(5).trimStart())
    } else if (text.startsWith(':')) {
      //以冒号开头是注释行，忽略
    }
  })

  return { eventName, payload: dataLines.join('\n') }
}

/**
 * 发起流式对话
 * @param {Object}   options
 * @param {string}   options.sessionId   会话 id
 * @param {string}   options.userMessage 用户输入
 * @param {AbortSignal} [options.signal] 用于取消
 * @param {(text: string) => void} options.onChunk 收到一段文本
 */
export async function streamChat({ sessionId, userMessage, signal, onChunk }) {
  const response = await fetch(STREAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      token: localStorage.getItem('token') || ''
    },
    body: JSON.stringify({ sessionId, userMessage }),
    signal
  })

  if (!response.ok) {
    throw new Error(`对话请求失败（HTTP ${response.status}）`)
  }

  //个别网关不返回流，直接给一段 JSON
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/event-stream') || !response.body) {
    const text = await response.text()
    let data = null
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
    const content = data === null ? text : chunkText(data)
    if (content) onChunk(content)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  //返回 false 表示流已结束
  const flushEvent = (rawEvent) => {
    const { eventName, payload } = splitEvent(rawEvent)

    //结束事件：data 通常是 {}，也可能直接是 [DONE]
    if (eventName === 'done' || payload === '[DONE]') return false
    if (!payload || payload === '{}') return true

    let data = null
    try {
      data = JSON.parse(payload)
    } catch {
      data = null // 不是 JSON，按纯文本处理
    }

    //服务端错误事件，或业务码非成功：抛出带后端原话的错误，由页面提示
    const isErrorEvent = eventName === 'error'
    const isBusinessError =
      data && typeof data === 'object' && (String(data.code) === '-1' || data.success === false)
    if (isErrorEvent || isBusinessError) {
      const message = (data && (data.msg || data.message)) || payload || '对话服务异常'
      throw new Error(message)
    }

    const content = data === null ? payload : chunkText(data)
    if (content && content !== '[DONE]') {
      clearFirstChunkTimer()
      onChunk(content)
    }
    return true
  }

  //首字超时后主动断开，再按超时错误抛给页面
  let timedOut = false
  let firstChunkTimer = setTimeout(() => {
    timedOut = true
    reader.cancel().catch(() => {})
  }, FIRST_CHUNK_TIMEOUT)

  const clearFirstChunkTimer = () => {
    if (firstChunkTimer) {
      clearTimeout(firstChunkTimer)
      firstChunkTimer = null
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      buffer = buffer.replace(/\r/g, '') //统一成 \n 分隔，兼容 \r\n

      let index = buffer.indexOf('\n\n')
      while (index !== -1) {
        const rawEvent = buffer.slice(0, index)
        buffer = buffer.slice(index + 2)
        if (!flushEvent(rawEvent)) {
          reader.cancel()
          return
        }
        index = buffer.indexOf('\n\n')
      }
    }

    if (timedOut) throw new Error('等待回复超时，请重试')

    //流结束时缓冲区里可能还剩最后一段
    if (buffer.trim()) flushEvent(buffer)
  } catch (error) {
    reader.cancel().catch(() => {})
    throw error
  } finally {
    clearFirstChunkTimer()
  }
}

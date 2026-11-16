<template>
    <div class="chat-page">
        <!-- 左侧信息栏 -->
        <aside class="side">
            <section class="card profile">
                <div class="avatar lg">
                    <img :src="robotIcon" alt="AI 助手" />
                </div>
                <h3 class="profile-name">{{ ASSISTANT_NAME }}</h3>
                <p class="profile-status">
                    <span class="dot"></span>
                    在线服务中
                </p>
            </section>

            <section class="card mood">
                <div class="card-title">情绪花园</div>

                <div class="mood-ring" :style="ringStyle">
                    <div class="ring-inner">
                        <span v-if="mood.hasData" class="mood-icon">{{ mood.icon }}</span>
                        <span class="mood-score">{{ mood.hasData ? mood.score : '—' }}</span>
                    </div>
                </div>

                <p class="mood-today">
                    今天感觉
                    <strong>{{ mood.today }}</strong>
                    <span v-if="mood.hasData" class="mood-emotion">{{ mood.label }}</span>
                </p>

                <div class="mood-levels">
                    <span v-for="i in 3" :key="i" :class="{ on: i <= mood.level }"></span>
                </div>

                <div class="mood-tip">
                    <div class="tip-icon">💡</div>
                    <div class="tip-body">
                        <div class="tip-title">给你的小建议</div>
                        <div class="tip-text">{{ mood.tip }}</div>
                    </div>
                </div>
            </section>

            <section class="card history">
                <div class="card-head">
                    <div class="card-title">会话历史</div>
                    <el-button
                        v-if="hasMoreSessions"
                        text
                        size="small"
                        class="more-btn"
                        :loading="sessionLoading"
                        @click="loadMoreSessions"
                    >
                        加载更多
                    </el-button>
                </div>
                <div class="history-list">
                    <div v-if="sessionError" class="history-error">{{ sessionError }}</div>
                    <div v-else-if="sessionLoading && !sessions.length" class="history-empty">加载中…</div>
                    <div v-else-if="!sessions.length" class="history-empty">暂无会话记录</div>
                    <ul v-else>
                        <li
                            v-for="item in sessions"
                            :key="item.id"
                            class="history-item"
                            :class="{ active: item.id === activeSessionId }"
                            @click="openSession(item)"
                        >
                            <div class="history-main">
                                <div class="history-name">{{ item.title }}</div>
                                <div class="history-foot">
                                    <span class="history-preview">{{ item.preview || '暂无消息' }}</span>
                                    <span class="history-time">{{ formatShortTime(item.time) }}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="history-del"
                                title="删除会话"
                                aria-label="删除会话"
                                @click.stop="handleDeleteSession(item)"
                            >
                                <el-icon><Delete /></el-icon>
                            </button>
                        </li>
                    </ul>
                </div>
            </section>
        </aside>

        <!-- 右侧对话区 -->
        <section class="panel">
            <header class="panel-head">
                <div class="avatar sm">
                    <img :src="robotIcon" alt="" />
                </div>
                <div class="head-text">
                    <div class="head-name">{{ ASSISTANT_NAME }}</div>
                    <div class="head-sub">您的贴心 AI 心理健康助手</div>
                </div>
                <el-button class="new-btn" circle title="新对话" @click="resetChat">
                    <el-icon><Plus /></el-icon>
                </el-button>
            </header>

            <div ref="listRef" class="messages">
                <div v-if="loadingMessages" class="loading-hint">正在加载对话…</div>

                <TransitionGroup name="msg">
                    <div
                        v-for="(item, index) in messages"
                        :key="item.id"
                        class="msg-row"
                        :class="item.role"
                        :style="{ transitionDelay: `${Math.min(index, 6) * 30}ms` }"
                    >
                        <div v-if="item.role === 'assistant'" class="avatar sm">
                            <img :src="robotIcon" alt="" />
                        </div>
                        <div class="msg-body">
                            <div class="bubble" :class="{ typing: item.pending && !item.content }">
                                <template v-if="item.pending && !item.content">
                                    <span></span><span></span><span></span>
                                </template>
                                <template v-else>{{ item.content }}</template>
                            </div>
                            <div class="msg-footer">
                                <span class="msg-time">{{ formatTime(item.time) }}</span>
                                <button
                                    v-if="item.failed"
                                    type="button"
                                    class="retry-btn"
                                    @click="retryMessage(item)"
                                >
                                    <el-icon><RefreshRight /></el-icon>
                                    重试
                                </button>
                            </div>
                        </div>
                    </div>
                </TransitionGroup>
            </div>

            <footer class="composer">
                <el-input
                    v-model="draft"
                    class="composer-input"
                    type="textarea"
                    resize="none"
                    :autosize="{ minRows: 1, maxRows: 4 }"
                    :disabled="loadingMessages"
                    placeholder="请输入您想要分享的内容..."
                    @keydown.enter.exact.prevent="send"
                />
                <el-button
                    class="send-btn"
                    circle
                    :disabled="!canSend"
                    :loading="streaming"
                    @click="send"
                >
                    <el-icon v-if="!streaming"><Promotion /></el-icon>
                </el-button>
            </footer>
        </section>
    </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mySessions, sessionMessages, startSession, sessionEmotion, streamChat, deleteSession } from '@/api/user'
import robotIcon from '@/assets/images/robot-fill.png'

const ASSISTANT_NAME = '大爱同学'
const SESSION_PAGE_SIZE = 20
const GREETING =
    '您好！我是大爱仙尊，您的 AI 心理健康助手。很高兴陪伴您，为您提供温暖的心理支持。请告诉我，今天您感觉怎么样？有什么想要分享的吗？'

/* ---------- 通用工具 ---------- */
const pick = (obj, keys) => {
    if (!obj) return ''
    for (const key of keys) {
        const val = obj[key]
        if (val !== undefined && val !== null && val !== '') return val
    }
    return ''
}

//时间可能是毫秒时间戳、也可能是字符串，统一转成毫秒
const toTimestamp = (val) => {
    if (val === undefined || val === null || val === '') return Date.now()
    if (typeof val === 'number') return val
    const num = Number(val)
    if (!Number.isNaN(num) && String(val).length >= 10) return num
    const parsed = Date.parse(String(val).replace(/-/g, '/'))
    return Number.isNaN(parsed) ? Date.now() : parsed
}

const formatTime = (timestamp) => {
    const diff = Date.now() - timestamp
    if (diff >= 0 && diff < 60 * 1000) return '刚刚'
    const date = new Date(timestamp)
    const pad = n => String(n).padStart(2, '0')
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatShortTime = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const pad = n => String(n).padStart(2, '0')
    return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

//会话标题格式，与后端示例一致：小暖 AI助手 - 2026/6/16 09:58:33
const buildSessionTitle = (date) => {
    const pad = n => String(n).padStart(2, '0')
    return `${ASSISTANT_NAME} - ${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

/* ---------- 消息 ---------- */
let localId = 0
const createLocalMessage = (role, content, extra = {}) => ({
    id: `local-${++localId}`,
    role,
    content,
    time: Date.now(),
    ...extra
})

const isUserMessage = (raw) => {
    const role = String(pick(raw, ['role', 'sender', 'senderType', 'from', 'type', 'messageType'])).toLowerCase()
    return role.includes('user') || ['1', 'human', 'customer', 'client'].includes(role)
}

const normalizeMessage = (raw, index) => ({
    id: String(pick(raw, ['id', 'messageId', 'msgId']) || `msg-${index}`),
    role: isUserMessage(raw) ? 'user' : 'assistant',
    content: String(pick(raw, ['content', 'message', 'msgContent', 'text', 'contentText']) ?? ''),
    time: toTimestamp(pick(raw, ['createTime', 'createdAt', 'createdTime', 'sendTime', 'time', 'timestamp']))
})

const listRef = ref(null)
//先放一条欢迎语，接口回来之前页面也不会是空的
const messages = ref([createLocalMessage('assistant', GREETING)])
const draft = ref('')
const streaming = ref(false)
const loadingMessages = ref(false)
let controller = null

const canSend = computed(() => draft.value.trim().length > 0 && !streaming.value && !loadingMessages.value)

const scrollToBottom = async () => {
    await nextTick()
    const el = listRef.value
    if (el) el.scrollTop = el.scrollHeight
}

const removeMessage = (id) => {
    const index = messages.value.findIndex(item => item.id === id)
    if (index !== -1) messages.value.splice(index, 1)
}

/* ---------- 会话列表 ---------- */
const sessions = ref([])
const sessionTotal = ref(0)
const sessionPage = ref(1)
const sessionLoading = ref(false)
const sessionError = ref('')
const activeSessionId = ref('')

const normalizeSession = (raw) => ({
    id: String(pick(raw, ['sessionId', 'id', 'session_id']) || ''),
    title: pick(raw, ['sessionTitle', 'title', 'sessionName']) || '未命名会话',
    //列表里带回来的最后一条消息，用来在历史里预览
    preview: String(pick(raw, ['lastMessageContent', 'lastMessage', 'contentPreview', 'summary']) || ''),
    time: toTimestamp(pick(raw, ['lastMessageTime', 'updateTime', 'updatedAt', 'startTime', 'startedAt', 'createTime'])),
    messageCount: Number(pick(raw, ['messageCount', 'count']) || 0)
})

const hasMoreSessions = computed(() => sessions.value.length < sessionTotal.value)

const loadSessions = async ({ append = false } = {}) => {
    sessionLoading.value = true
    try {
        //后端分页参数叫法不稳（pageNum/pageSize 或 current/size），两种都带上
        const data = await mySessions({
            pageNum: sessionPage.value,
            pageSize: SESSION_PAGE_SIZE,
            current: sessionPage.value,
            size: SESSION_PAGE_SIZE
        })
        const list = Array.isArray(data) ? data : (data?.records ?? data?.list ?? data?.rows ?? [])
        const normalized = list.map(normalizeSession).filter(item => item.id)
        sessions.value = append ? [...sessions.value, ...normalized] : normalized
        sessionTotal.value = Number(data?.total ?? sessions.value.length) || sessions.value.length
        sessionError.value = ''
    } catch (error) {
        if (!append) {
            sessions.value = []
            sessionTotal.value = 0
        }
        //把后端原话显示出来，别让页面看着像什么都没发生
        sessionError.value = `会话加载失败：${error?.message || '请稍后重试'}`
    } finally {
        sessionLoading.value = false
    }
}

const loadMoreSessions = () => {
    sessionPage.value += 1
    loadSessions({ append: true })
}

/* ---------- 加载某个会话的消息 ---------- */
const loadMessages = async (sessionId) => {
    loadingMessages.value = true
    try {
        const data = await sessionMessages(sessionId)
        const list = Array.isArray(data) ? data : (data?.records ?? data?.list ?? [])
        const normalized = list.map(normalizeMessage)
        //接口没返回内容时保留界面已有消息，避免刚发的内容消失
        if (normalized.length) messages.value = normalized
        return normalized.length
    } catch {
        return 0
    } finally {
        loadingMessages.value = false
        await scrollToBottom()
    }
}

//创建会话后 AI 回复是异步生成的（那一刻 messageCount 还是 1），
//轮询几次等它落库，避免用户只看到自己发的那句话
const waitForReply = async (sessionId, retries = 4, interval = 1000) => {
    for (let i = 0; i < retries; i += 1) {
        await new Promise(resolve => setTimeout(resolve, interval))
        try {
            const data = await sessionMessages(sessionId)
            const list = (Array.isArray(data) ? data : (data?.records ?? data?.list ?? [])).map(normalizeMessage)
            if (list.some(item => item.role === 'assistant' && item.content)) {
                messages.value = list
                await scrollToBottom()
                return true
            }
        } catch {
            //单次失败忽略，继续下一次
        }
    }
    return false
}

//删除会话：二次确认 → 调接口 → 从列表移除；删的是当前会话就把对话区清空
const handleDeleteSession = async (item) => {
    try {
        await ElMessageBox.confirm(
            `确定删除会话「${item.title}」吗？删除后该会话的聊天记录将无法恢复。`,
            '删除确认',
            {
                type: 'warning',
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                confirmButtonClass: 'el-button--danger'
            }
        )
    } catch {
        return // 点了取消或关闭弹窗
    }

    try {
        await deleteSession(item.id)
        sessions.value = sessions.value.filter(session => session.id !== item.id)
        sessionTotal.value = Math.max(0, sessionTotal.value - 1)
        if (item.id === activeSessionId.value) resetChat()
        ElMessage.success('会话已删除')
    } catch (error) {
        //失败提示已由 request.js 的响应拦截器统一弹出
        console.warn('[chat] 删除会话失败：', error?.message, 'sessionId =', item.id)
    }
}

const openSession = async (item) => {
    if (item.id === activeSessionId.value && messages.value.length) return
    cancelStream()
    activeSessionId.value = item.id
    messages.value = []
    await loadMessages(item.id)
    loadEmotion(item.id)
}

/* ---------- 发送消息 ---------- */
const send = async () => {
    const content = draft.value.trim()
    if (!content || !canSend.value) return

    draft.value = ''
    messages.value.push(createLocalMessage('user', content))
    await scrollToBottom()

    if (!activeSessionId.value) {
        await createSession(content)
    } else {
        await sendInSession(content)
    }
}

//还没有会话时：先创建会话（首条消息随会话一起落库），再拉取消息拿到 AI 的首条回复
const createSession = async (content) => {
    streaming.value = true
    const pending = createLocalMessage('assistant', '', { pending: true })
    messages.value.push(pending)
    await scrollToBottom()

    try {
        const data = await startSession({
            initialMessage: content,
            sessionTitle: buildSessionTitle(new Date())
        })
        const sessionId = pick(data, ['sessionId', 'id'])
        if (!sessionId) throw new Error('创建会话失败')

        //这个接口返回的是 session_41333，消息接口只认数字，统一存成数字那份
        activeSessionId.value = String(sessionId).replace(/^session_/, '')
        sessionPage.value = 1
        await loadSessions()

        const count = await loadMessages(activeSessionId.value)
        if (!count) {
            removeMessage(pending.id)
            messages.value.push(
                createLocalMessage('assistant', '会话已创建，暂时没有取到回复，稍后可在左侧会话历史里继续查看。')
            )
        } else if (!messages.value.some(item => item.role === 'assistant' && item.content)) {
            //只有用户消息、还没生成 AI 回复：边等边转圈
            const waiting = createLocalMessage('assistant', '', { pending: true })
            messages.value.push(waiting)
            await scrollToBottom()

            const gotReply = await waitForReply(activeSessionId.value)
            removeMessage(waiting.id)
            if (!gotReply) {
                messages.value.push(
                    createLocalMessage('assistant', 'AI 正在生成回复，稍后可在左侧会话历史里查看。')
                )
            }
            await scrollToBottom()
        }
        loadEmotion(activeSessionId.value)
    } catch {
        removeMessage(pending.id)
        ElMessage.error('会话创建失败，请稍后重试')
        messages.value.push(createLocalMessage('assistant', '抱歉，会话创建失败，请稍后再试。'))
    } finally {
        streaming.value = false
        await scrollToBottom()
    }
}

//流式接口要的是 session_41333 这种正式会话 key，消息接口才用数字 id
const toStreamSessionId = (id) => {
    const value = String(id)
    return value.startsWith('session_') ? value : `session_${value}`
}

//已有会话：走流式接口，边收边显示
const sendInSession = async (content) => {
    streaming.value = true
    const reply = createLocalMessage('assistant', '', { pending: true })
    messages.value.push(reply)
    await scrollToBottom()

    controller = new AbortController()

    //打字机节流：分片先攒在本地，按帧刷到视图上，避免每个 token 都触发一次渲染
    let pendingText = ''
    let rafId = null

    const flushText = () => {
        rafId = null
        if (!pendingText) return
        //必须通过数组里取到的代理对象修改，直接改 reply 不会触发视图更新
        const item = messages.value.find(msg => msg.id === reply.id)
        if (!item) {
            pendingText = ''
            return
        }
        item.content += pendingText
        item.pending = false
        pendingText = ''
        scrollToBottom()
    }

    const queueText = (text) => {
        pendingText += text
        if (rafId === null) rafId = requestAnimationFrame(flushText)
    }

    //流结束时把还没刷出去的字立刻补上
    const flushNow = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId)
            rafId = null
        }
        flushText()
    }

    try {
        await streamChat({
            sessionId: toStreamSessionId(activeSessionId.value),
            userMessage: content,
            signal: controller.signal,
            onChunk: queueText
        })

        flushNow()
        const item = messages.value.find(msg => msg.id === reply.id)
        if (item && !item.content) item.content = '（没有收到回复内容，请稍后重试）'
    } catch (error) {
        flushNow()
        if (error?.name === 'AbortError') {
            removeMessage(reply.id)
            return
        }
        //后端在 event:error 里会给具体原因，直接展示出来
        console.warn('[chat] 对话失败：', error?.message, 'sessionId =', toStreamSessionId(activeSessionId.value))
        const message = error?.message || '网络异常，回复失败，请重试'
        const item = messages.value.find(msg => msg.id === reply.id)
        if (item) {
            item.content = item.content || message
            //标记失败，气泡下方会出现「重试」
            item.failed = true
            item.retryText = content
        }
        ElMessage.error(message)
    } finally {
        const item = messages.value.find(msg => msg.id === reply.id)
        if (item) item.pending = false
        streaming.value = false
        controller = null
        await scrollToBottom()

        //刷新历史列表里的最后消息时间
        sessionPage.value = 1
        loadSessions()
    }
}

//重试：删掉失败的气泡，用同一条内容再请求一次（不重复添加用户消息）
const retryMessage = (item) => {
    if (streaming.value || !item?.retryText) return
    const text = item.retryText
    removeMessage(item.id)
    sendInSession(text)
}

const cancelStream = () => {
    if (controller) {
        controller.abort()
        controller = null
    }
    streaming.value = false
}

//新对话：清空当前会话，下一条消息会创建新会话
const resetChat = () => {
    cancelStream()
    loadingMessages.value = false
    activeSessionId.value = ''
    messages.value = [createLocalMessage('assistant', GREETING)]
    draft.value = ''
    resetMood()
    scrollToBottom()
}

/* ---------- 情绪花园 ---------- */
const mood = reactive({
    hasData: false,
    label: '—',
    icon: '',
    score: 0,
    today: '—',
    level: 0,
    tip: '开始对话后，这里会显示 AI 的情绪分析'
})

const resetMood = () => {
    mood.hasData = false
    mood.label = '—'
    mood.icon = ''
    mood.score = 0
    mood.today = '—'
    mood.level = 0
    mood.tip = '开始对话后，这里会显示 AI 的情绪分析'
}

//消息接口用数字 id（41333），情绪接口要 session_41333 这种带前缀的形式，
//两种都试一次，都失败就静默降级成「暂无」
const loadEmotion = async (rawId) => {
    const id = String(rawId)
    const candidates = id.startsWith('session_') ? [id] : [`session_${id}`, id]

    for (const sessionId of candidates) {
        try {
            const data = await sessionEmotion(sessionId)
            if (!data) continue

            const score = Number(data.emotionScore)
            const riskLevel = Number(data.riskLevel ?? 0)

            mood.hasData = true
            mood.label = data.primaryEmotion || '—'
            mood.icon = data.icon || '🙂'
            mood.score = Number.isNaN(score) ? 0 : Math.max(0, Math.min(100, Math.round(score)))
            mood.level = Math.max(1, Math.min(3, Math.ceil(mood.score / 34)))
            //风险等级优先，其次看是否负向情绪，最后才按分数给个直观词
            mood.today =
                riskLevel >= 2
                    ? '需要关注'
                    : data.isNegative
                      ? '有点低落'
                      : mood.score >= 70
                        ? '很不错'
                        : mood.score >= 40
                          ? '还不错'
                          : '需要关注'
            mood.tip = data.suggestion || data.riskDescription || '保持规律作息，情绪会更稳定'
            return
        } catch {
            //换下一种格式继续试
        }
    }

    resetMood()
}

const ringStyle = computed(() => {
    const percent = mood.hasData ? Math.min(100, Math.max(0, mood.score)) : 0
    const active = percent * 3.6
    return {
        background: `conic-gradient(#a97ae0 0deg ${active}deg, #efe9f8 ${active}deg 360deg)`
    }
})

/* ---------- 生命周期 ---------- */
const bootstrap = async () => {
    await loadSessions()
    //有历史会话就打开最近的一条，否则保留欢迎语
    if (sessions.value.length) {
        await openSession(sessions.value[0])
    }
}

onMounted(bootstrap)

onBeforeUnmount(() => {
    cancelStream()
    messages.value = []
})
</script>
<style lang="scss" scoped>
$brand: #55268e;
$brand-light: #7b4cb4;
$border: #ece9f2;
$text: #1f2937;
$sub: #6b7280;

.chat-page {
    flex: 1;
    display: flex;
    gap: 16px;
    padding: 16px;
    /* 扣掉页头 76px 和 footer 56px，聊天区正好一屏；
       上下都用同一值夹住，内容再多也不会把页面撑高 */
    min-height: calc(100vh - 132px);
    max-height: calc(100vh - 132px);
    overflow: hidden;
    box-sizing: border-box;
    background: #f6f5f9;
}

/* ---------- 左侧 ---------- */
.side {
    width: 288px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-height: 0;
}

.card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(60, 40, 100, 0.05);
}

.card-title {
    font-size: 14px;
    font-weight: 600;
    color: $text;
}

.profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    .profile-name {
        font-size: 16px;
        font-weight: 600;
        color: $text;
        margin-top: 12px;
    }

    .profile-status {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
        font-size: 13px;
        color: #4ca85f;

        .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #52c46a;
            box-shadow: 0 0 0 3px rgba(82, 196, 106, 0.18);
            animation: pulse 1.8s ease-in-out infinite;
        }
    }
}

.avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, $brand-light, $brand);
    flex-shrink: 0;

    img {
        object-fit: contain;
    }

    &.lg {
        width: 64px;
        height: 64px;

        img {
            width: 32px;
            height: 32px;
        }
    }

    &.sm {
        width: 34px;
        height: 34px;

        img {
            width: 18px;
            height: 18px;
        }
    }
}

.mood {
    .card-title {
        margin-bottom: 16px;
    }

    .mood-ring {
        width: 118px;
        height: 118px;
        margin: 0 auto;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;

        .ring-inner {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;

            .mood-icon {
                font-size: 20px;
                line-height: 1.1;
            }

            .mood-score {
                font-size: 18px;
                font-weight: 700;
                color: $brand;
            }
        }
    }

    .mood-today {
        margin-top: 14px;
        text-align: center;
        font-size: 13px;
        color: $sub;

        strong {
            margin-left: 6px;
            font-size: 14px;
            color: $text;
        }

        .mood-emotion {
            margin-left: 6px;
            font-size: 12px;
            color: #a4a8b2;
        }
    }

    .mood-levels {
        display: flex;
        justify-content: center;
        gap: 6px;
        margin-top: 10px;

        span {
            width: 18px;
            height: 6px;
            border-radius: 3px;
            background: #eae5f3;

            &.on {
                background: #d9b9f2;
            }
        }
    }

    .mood-tip {
        display: flex;
        gap: 10px;
        margin-top: 16px;
        padding: 12px;
        border-radius: 12px;
        background: #faf7fd;

        .tip-icon {
            width: 28px;
            height: 28px;
            flex-shrink: 0;
            border-radius: 50%;
            background: #f3ecfb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .tip-title {
            font-size: 13px;
            color: $text;
            margin-bottom: 4px;
        }

        .tip-text {
            font-size: 13px;
            line-height: 1.6;
            color: $sub;
        }
    }
}

.history {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    .card-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        min-height: 24px;

        .more-btn {
            padding: 0;
            font-size: 12px;
            color: $brand-light;
        }
    }

    .history-list {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }

    .history-empty {
        padding: 28px 0;
        text-align: center;
        font-size: 13px;
        color: #a4a8b2;
    }

    .history-error {
        margin: 8px 0;
        padding: 10px 12px;
        border-radius: 10px;
        background: #fef0f0;
        color: #d9534f;
        font-size: 12px;
        line-height: 1.6;
        word-break: break-word;
    }

    .history-item {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 10px 8px 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
            background: #f6f2fb;

            .history-del {
                opacity: 1;
            }
        }

        &.active {
            background: #f2ecfa;

            .history-name {
                color: $brand;
            }
        }

        .history-main {
            flex: 1;
            min-width: 0;
        }

        .history-name {
            font-size: 13px;
            color: $text;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .history-foot {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-top: 4px;
        }

        .history-preview {
            flex: 1;
            min-width: 0;
            font-size: 12px;
            color: #9ca3af;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .history-time {
            flex-shrink: 0;
            font-size: 11px;
            color: #b0b3bb;
        }

        .history-del {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            padding: 0;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: #b0b3bb;
            cursor: pointer;
            opacity: 0.45;
            transition: opacity 0.2s ease, color 0.2s ease, background-color 0.2s ease;

            &:hover {
                opacity: 1;
                color: #f56c6c;
                background: #fdecec;
            }
        }
    }
}

/* ---------- 右侧对话区 ---------- */
.panel {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 12px rgba(60, 40, 100, 0.05);
    overflow: hidden;
}

.panel-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid $border;
    flex-shrink: 0;

    .head-text {
        flex: 1;
        min-width: 0;

        .head-name {
            font-size: 15px;
            font-weight: 600;
            color: $text;
        }

        .head-sub {
            margin-top: 2px;
            font-size: 12px;
            color: #9ca3af;
        }
    }

    .new-btn {
        width: 32px;
        height: 32px;
        border: 1px solid $border;
        color: $brand;

        &:hover {
            background: #f6f2fb;
            border-color: #dccff0;
            color: $brand;
        }
    }
}

.messages {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 24px 20px 8px;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background: #e4dff0;
        border-radius: 3px;
    }

    .loading-hint {
        text-align: center;
        font-size: 13px;
        color: #a4a8b2;
        padding: 8px 0 16px;
    }
}

.msg-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 20px;

    &.user {
        flex-direction: row-reverse;

        .msg-body {
            align-items: flex-end;
        }

        .bubble {
            background: linear-gradient(135deg, $brand-light, $brand);
            color: #fff;
            border-radius: 14px 4px 14px 14px;
        }
    }

    &.assistant .bubble {
        background: #f6f4fa;
        color: $text;
        border-radius: 4px 14px 14px 14px;
    }

    .msg-body {
        display: flex;
        flex-direction: column;
        max-width: min(72%, 620px);
    }

    .bubble {
        padding: 12px 16px;
        font-size: 14px;
        line-height: 1.75;
        word-break: break-word;
        white-space: pre-wrap;
    }

    .msg-footer {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 6px;
    }

    .msg-time {
        font-size: 12px;
        color: #b0b3bb;
    }

    .retry-btn {
        display: inline-flex;
        align-items: center;
        gap: 3px;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 12px;
        color: $brand-light;

        &:hover {
            color: $brand;
            text-decoration: underline;
        }
    }

    /* 等待回复的三点动画 */
    .bubble.typing {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 16px;

        span {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #b9a6d8;
            animation: blink 1.2s infinite ease-in-out;

            &:nth-child(2) {
                animation-delay: 0.2s;
            }

            &:nth-child(3) {
                animation-delay: 0.4s;
            }
        }
    }
}

.composer {
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    gap: 12px;
    padding: 12px 20px 18px;
    border-top: 1px solid $border;

    .composer-input {
        flex: 1;

        :deep(.el-textarea__inner) {
            border-radius: 14px;
            padding: 11px 14px;
            background: #f8f7fb;
            box-shadow: 0 0 0 1px #ece9f2 inset;
            font-size: 14px;
            line-height: 1.6;

            &:focus {
                background: #fff;
                box-shadow: 0 0 0 1px $brand-light inset;
            }
        }
    }

    .send-btn {
        width: 42px;
        height: 42px;
        flex-shrink: 0;
        border: none;
        background: linear-gradient(135deg, $brand-light, $brand);
        color: #fff;
        font-size: 18px;

        &:hover:not(.is-disabled) {
            background: linear-gradient(135deg, #8b5cc4, #5f2b9c);
            color: #fff;
        }

        &.is-disabled {
            background: #e6e2ee;
            color: #fff;
        }
    }
}

/* ---------- 动画 ---------- */
@keyframes pulse {
    0%,
    100% {
        box-shadow: 0 0 0 3px rgba(82, 196, 106, 0.18);
    }

    50% {
        box-shadow: 0 0 0 5px rgba(82, 196, 106, 0.1);
    }
}

@keyframes blink {
    0%,
    80%,
    100% {
        opacity: 0.3;
        transform: translateY(0);
    }

    40% {
        opacity: 1;
        transform: translateY(-2px);
    }
}

.msg-enter-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.msg-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

/* ---------- 窄屏 ---------- */
@media (max-width: 1024px) {
    .side {
        display: none;
    }

    .chat-page {
        padding: 12px;
    }
}
</style>

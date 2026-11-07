<template>
    <div>
        <PageHead title="咨询记录" />
        <el-table :data="tableData" v-loading="loading" style="width: 100%;margin-top: 25px;" row-key="id">
            <el-table-column prop="userNickname" label="会话ID" width="200">
                <template #default="scope">
                    <div class="user-cell">
                        <el-avatar :size="32">
                            {{ (scope.row.userNickname || '?').slice(0, 1) }}
                        </el-avatar>
                        <span class="user-name">{{ scope.row.userNickname || '-' }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column prop="sessionTitle" label="情绪日志" min-width="420">
                <template #default="scope">
                    <div class="log-title">{{ scope.row.sessionTitle || '-' }}</div>
                    <div class="log-preview">{{ scope.row.lastMessageContent || '-' }}</div>
                </template>
            </el-table-column>
            <el-table-column prop="messageCount" label="消息数" width="100" />
            <el-table-column prop="lastMessageTime" label="时间" width="180" :formatter="formatTimeCell" />
            <el-table-column label="操作" width="100" fixed="right">
                <template #default="scope">
                    <el-button text type="primary" @click="handleDetail(scope.row)">详情</el-button>
                </template>
            </el-table-column>
        </el-table>
        <el-pagination
            style="margin-top: 25px;justify-content: flex-end;"
            :current-page="pagination.currentPage"
            :page-size="pagination.size"
            layout="total, prev, pager, next"
            :total="pagination.total"
            @current-change="handlePageChange"
        />
        <el-dialog v-model="detailVisible" title="会话详情" width="720px" class="session-dialog" @closed="handleDialogClosed">
            <!-- 会话概要 -->
            <div class="session-summary">
                <el-avatar :size="40">{{ (detailSession?.userNickname || '?').slice(0, 1) }}</el-avatar>
                <div class="summary-main">
                    <div class="summary-title">{{ detailSession?.sessionTitle || '-' }}</div>
                    <div class="summary-meta">
                        <span>用户：{{ detailSession?.userNickname || '-' }}</span>
                        <span>消息数：{{ detailSession?.messageCount ?? 0 }}</span>
                        <span>时长：{{ detailSession?.durationMinutes ?? '-' }} 分钟</span>
                        <span>{{ formatTime(detailSession?.startedAt) }}</span>
                    </div>
                </div>
            </div>

            <!-- 消息列表 -->
            <div ref="messageListRef" class="message-list" v-loading="messageLoading">
                <TransitionGroup name="msg">
                    <div
                        v-for="(msg, index) in messages"
                        :key="msg.id ?? index"
                        class="message-row"
                        :class="isUserMessage(msg) ? 'is-user' : 'is-assistant'"
                        :style="{ transitionDelay: `${Math.min(index, 8) * 40}ms` }"
                    >
                        <el-avatar :size="28" class="msg-avatar">
                            {{ isUserMessage(msg) ? '用' : 'AI' }}
                        </el-avatar>
                        <div class="msg-body">
                            <div class="msg-bubble">{{ messageContent(msg) || '-' }}</div>
                            <div class="msg-time">{{ formatTime(messageTime(msg)) }}</div>
                        </div>
                    </div>
                </TransitionGroup>
                <el-empty
                    v-if="!messageLoading && !messages.length"
                    description="暂无消息记录"
                    :image-size="70"
                />
            </div>

            <template #footer>
                <el-button @click="detailVisible = false">关闭</el-button>
            </template>
        </el-dialog>
    </div>
</template>
<script setup>
import PageHead from '@/components/PageHead.vue'
import TableSearch from '@/components/TableSearch.vue'
import { sessionPage, sessionMessages } from '@/api/admin'
import { ref, reactive, onMounted, nextTick } from 'vue'

//分页参数
const pagination = reactive({
    currentPage: 1,
    size: 10,
    total: 0
})
//表格数据
const tableData = ref([])
const loading = ref(false)
//保存查询条件，翻页时沿用
const searchParams = ref({})

const formatTime = (val) => {
    if (val === undefined || val === null || val === '' || val === '-') return '-'
    const date = new Date(val)
    if (Number.isNaN(date.getTime())) return String(val)
    const pad = n => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
//el-table-column 的 formatter 签名：(row, column, cellValue)
const formatTimeCell = (_row, _column, cellValue) => formatTime(cellValue)

const fetchList = async () => {
    loading.value = true
    try {
        const params = {
            currentPage: pagination.currentPage,
            size: pagination.size,
            //后端要求 emotionTag 必传，未选择时传空字符串
            emotionTag: searchParams.value.emotionTag || ''
        }
        const data = await sessionPage(params)
        tableData.value = data?.records ?? []
        pagination.total = data?.total ?? 0
    } catch {
        //失败提示已由 request.js 的响应拦截器统一弹出
        tableData.value = []
        pagination.total = 0
    } finally {
        loading.value = false
    }
}

//查询：条件变化时回到第一页
const handleSearch = (formData = {}) => {
    searchParams.value = { ...formData }
    pagination.currentPage = 1
    fetchList()
}

const handlePageChange = (page) => {
    pagination.currentPage = page
    fetchList()
}

//详情弹窗
const detailVisible = ref(false)
const detailSession = ref(null)
const messageListRef = ref(null)
const messages = ref([])
const messageLoading = ref(false)

//消息接口未给出响应字段，先按候选字段取值，拿到真实响应后可精简
const pick = (obj, keys) => {
    if (!obj) return ''
    for (const key of keys) {
        const val = obj[key]
        if (val !== undefined && val !== null && val !== '') return val
    }
    return ''
}
const messageContent = (msg) => pick(msg, ['content', 'message', 'msgContent', 'text', 'contentText'])
const messageTime = (msg) => pick(msg, ['createTime', 'createdAt', 'createdTime', 'sendTime', 'time', 'timestamp'])
const isUserMessage = (msg) => {
    const role = String(pick(msg, ['role', 'sender', 'senderType', 'from', 'type', 'messageType'])).toLowerCase()
    return role.includes('user') || ['1', 'human', 'customer', 'client'].includes(role)
}

const scrollToBottom = () => {
    const el = messageListRef.value
    if (el) el.scrollTop = el.scrollHeight
}

const handleDetail = async (row) => {
    detailSession.value = row
    messages.value = []
    detailVisible.value = true
    messageLoading.value = true
    try {
        const data = await sessionMessages(row.id)
        messages.value = Array.isArray(data) ? data : (data?.records ?? data?.list ?? [])
    } catch {
        messages.value = []
    } finally {
        messageLoading.value = false
        await nextTick()
        scrollToBottom()
    }
}

const handleDialogClosed = () => {
    messages.value = []
    detailSession.value = null
}

onMounted(() => {
    fetchList()
})
</script>

<style lang="scss" scoped>
.user-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .user-name {
        color: #1f2937;
    }
}

.log-title {
    color: #1f2937;
    margin-bottom: 4px;
}

.log-preview {
    color: #6b7280;
    font-size: 13px;
    /* 最多两行，超出显示省略号 */
    display: -webkit-box;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    overflow: hidden;
}

/* ---------- 会话详情弹窗 ---------- */
.session-dialog {
    :deep(.el-dialog__body) {
        padding-top: 12px;
    }
}

.session-summary {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    margin-bottom: 12px;
    background: #f8fafc;
    border: 1px solid #eef2f7;
    border-radius: 10px;
    transition: background-color 0.25s ease;

    &:hover {
        background: #f3f7fc;
    }

    .summary-main {
        min-width: 0;

        .summary-title {
            font-size: 15px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .summary-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 4px 16px;
            font-size: 12px;
            color: #6b7280;
        }
    }
}

.message-list {
    padding: 8px 4px;
    max-height: 420px;
    min-height: 120px;
    overflow-y: auto;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-thumb {
        background: #d7dde5;
        border-radius: 3px;
    }
}

.message-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 16px;

    &.is-user {
        flex-direction: row-reverse;

        .msg-body {
            align-items: flex-end;
        }

        .msg-bubble {
            background: #409eff;
            color: #fff;
            border-radius: 12px 4px 12px 12px;
        }
    }

    &.is-assistant .msg-bubble {
        border-radius: 4px 12px 12px 12px;
    }

    .msg-avatar {
        flex-shrink: 0;
        font-size: 12px;
        background: #e8effa;
        color: #409eff;
    }

    &.is-user .msg-avatar {
        background: #409eff;
        color: #fff;
    }

    .msg-body {
        display: flex;
        flex-direction: column;
        max-width: 72%;
    }

    .msg-bubble {
        padding: 10px 14px;
        background: #f4f5f7;
        color: #1f2937;
        line-height: 1.6;
        font-size: 14px;
        white-space: pre-wrap;
        word-break: break-word;
        transition: box-shadow 0.2s ease, transform 0.2s ease;

        &:hover {
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
            transform: translateY(-1px);
        }
    }

    .msg-time {
        margin-top: 4px;
        font-size: 12px;
        color: #9ca3af;
    }
}

/* 消息逐条进入动画 */
.msg-enter-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.msg-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.msg-leave-active {
    transition: opacity 0.2s ease;
    position: absolute;
}

.msg-leave-to {
    opacity: 0;
}
</style>

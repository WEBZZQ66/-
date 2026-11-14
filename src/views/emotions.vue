<template>
    <div>
        <PageHead title="情绪日志" />
        <TableSearch :formItem="formItem" @search="handleSearch" />
        <el-table :data="tableData" v-loading="loading" style="width: 100%;margin-top: 25px;" row-key="id">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column label="会话ID" width="110">
                <template #default="scope">
                    <el-avatar :size="40">{{ nicknameOf(scope.row) || '?' }}</el-avatar>
                </template>
            </el-table-column>
            <el-table-column prop="diaryDate" label="记录日期" width="140" :formatter="formatDateCell" />
            <el-table-column label="情绪评分" width="250">
                <template #default="scope">
                    <div class="mood-stars">
                        <el-icon
                            v-for="i in MAX_SCORE"
                            :key="i"
                            :class="i <= Number(scope.row.moodScore || 0) ? 'star-on' : 'star-off'"
                        >
                            <StarFilled />
                        </el-icon>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="生活指标" width="140">
                <template #default="scope">
                    <div class="life-metrics">
                        <div>睡眠: {{ scope.row.sleepQuality ?? 0 }}/5</div>
                        <div>压力: {{ scope.row.stressLevel ?? 0 }}/5</div>
                    </div>
                </template>
            </el-table-column>
            <el-table-column label="情绪触发因素" min-width="160" show-overflow-tooltip>
                <template #default="scope">{{ scope.row.triggerFactor || '-' }}</template>
            </el-table-column>
            <el-table-column label="日记内容" min-width="200" show-overflow-tooltip>
                <template #default="scope">{{ scope.row.diaryContentPreview || scope.row.diaryContent || '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150" fixed="right">
                <template #default="scope">
                    <div class="action-btns">
                        <el-button text type="primary" @click="handleDetail(scope.row)">详情</el-button>
                        <el-button text type="danger" @click="handleDelete(scope.row)">删除</el-button>
                    </div>
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

        <el-dialog v-model="detailVisible" title="情绪日记详情" width="720px" class="emotion-dialog">
            <!-- 用户信息 -->
            <div class="detail-section">
                <div class="section-title">用户信息</div>
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="用户名">{{ detailRow?.username || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="昵称">{{ detailRow?.nickname || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="用户ID">{{ detailRow?.userId ?? '-' }}</el-descriptions-item>
                    <el-descriptions-item label="记录日期">{{ formatDate(detailRow?.diaryDate) }}</el-descriptions-item>
                </el-descriptions>
            </div>

            <!-- 情绪状态 -->
            <div class="detail-section">
                <div class="section-title">情绪状态</div>
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="情绪评分">
                        <div class="score-cell">
                            <div class="mood-stars">
                                <el-icon
                                    v-for="i in MAX_SCORE"
                                    :key="i"
                                    :class="i <= Number(detailRow?.moodScore || 0) ? 'star-on' : 'star-off'"
                                >
                                    <StarFilled />
                                </el-icon>
                            </div>
                            <span class="score-num">{{ Number(detailRow?.moodScore || 0) }}</span>
                        </div>
                    </el-descriptions-item>
                    <el-descriptions-item label="主要情绪">{{ detailRow?.dominantEmotion || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="睡眠质量">{{ detailRow?.sleepQuality ?? 0 }}/5</el-descriptions-item>
                    <el-descriptions-item label="压力水平">{{ detailRow?.stressLevel ?? 0 }}/5</el-descriptions-item>
                </el-descriptions>
            </div>

            <!-- 日记内容 -->
            <div class="detail-section">
                <div class="section-title">日记内容</div>
                <el-descriptions :column="2" border>
                    <el-descriptions-item label="情绪触发因素">{{ detailRow?.triggerFactor || '-' }}</el-descriptions-item>
                    <el-descriptions-item label="日记内容">
                        <div class="diary-content">{{ detailRow?.diaryContent || '-' }}</div>
                    </el-descriptions-item>
                </el-descriptions>
            </div>

            <!-- AI情绪分析结果 -->
            <div class="detail-section">
                <div class="section-title">AI情绪分析结果</div>
                <template v-if="hasAiAnalysis">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="主要情绪">
                            <el-tag type="info">{{ aiDetail.primaryEmotion || '-' }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="情绪强度">
                            <div class="intensity-cell">
                                <el-progress
                                    :percentage="intensity"
                                    :show-text="false"
                                    :stroke-width="8"
                                    color="#909399"
                                />
                                <span class="intensity-num">{{ intensity }}%</span>
                            </div>
                        </el-descriptions-item>
                        <el-descriptions-item label="风险等级">
                            <el-tag :type="riskInfo.type">{{ riskInfo.label }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="情绪性质">
                            <el-tag :type="natureInfo.type">{{ natureInfo.label }}</el-tag>
                        </el-descriptions-item>
                    </el-descriptions>

                    <div class="detail-subsection" v-if="aiDetail.suggestion">
                        <div class="section-title">专业建议</div>
                        <div class="block-text">{{ aiDetail.suggestion }}</div>
                    </div>
                    <div class="detail-subsection" v-if="aiDetail.riskDescription">
                        <div class="section-title">风险描述</div>
                        <div class="block-text">{{ aiDetail.riskDescription }}</div>
                    </div>
                    <div class="detail-subsection" v-if="improvementText">
                        <div class="section-title">改善建议</div>
                        <div class="block-text">{{ improvementText }}</div>
                    </div>
                </template>
                <el-empty v-else description="暂无 AI 分析结果" :image-size="70" />
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
import { emotionDiaryPage, deleteEmotionDiary } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, reactive, computed, onMounted } from 'vue'

const MAX_SCORE = 10

//用户ID + 情绪评分范围，对应接口的 userId / minMoodScore / maxMoodScore
const formItem = [
    {
        comp: 'input',
        label: '用户ID',
        prop: 'userId',
        placeholder: '请输入用户ID'
    },
    {
        comp: 'select',
        label: '情绪评分',
        prop: 'moodRange',
        placeholder: '选择评分范围',
        options: [
            { label: '低分（1-3）', value: '1-3' },
            { label: '中分（4-6）', value: '4-6' },
            { label: '高分（7-10）', value: '7-10' },
        ]
    }
]

//分页参数
const pagination = reactive({
    currentPage: 1,
    size: 10,
    total: 0
})
const tableData = ref([])
const loading = ref(false)
//保存查询条件，翻页时沿用
const searchParams = ref({})

//表格头像里显示昵称，没有昵称时回退到用户名
const nicknameOf = (row) => row?.nickname || row?.username || ''

const formatDate = (val) => {
    if (val === undefined || val === null || val === '' || val === '-') return '-'
    const date = new Date(val)
    if (Number.isNaN(date.getTime())) return String(val)
    const pad = n => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
//el-table-column 的 formatter 签名：(row, column, cellValue)
const formatDateCell = (_row, _column, cellValue) => formatDate(cellValue)

const fetchList = async () => {
    loading.value = true
    try {
        const [minMoodScore, maxMoodScore] = (searchParams.value.moodRange || '').split('-')
        const params = {
            current: pagination.currentPage,
            size: pagination.size,
            userId: searchParams.value.userId || undefined,
            minMoodScore: minMoodScore || undefined,
            maxMoodScore: maxMoodScore || undefined
        }
        const data = await emotionDiaryPage(params)
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
const detailRow = ref(null)
const handleDetail = (row) => {
    detailRow.value = row
    detailVisible.value = true
}

//aiEmotionAnalysis 是 JSON 字符串，解析后使用
const aiDetail = computed(() => {
    const raw = detailRow.value?.aiEmotionAnalysis
    if (!raw) return {}
    if (typeof raw === 'object') return raw
    try {
        return JSON.parse(raw)
    } catch {
        return {}
    }
})
const hasAiAnalysis = computed(() => Object.keys(aiDetail.value).length > 0)

//情绪强度 0-100
const intensity = computed(() => {
    const score = Number(aiDetail.value.emotionScore)
    if (Number.isNaN(score)) return 0
    return Math.min(100, Math.max(0, Math.round(score)))
})

//riskLevel：0 正常 / 1 关注 / 2 高风险
const RISK_LEVELS = {
    0: { label: '正常', type: 'success' },
    1: { label: '关注', type: 'warning' },
    2: { label: '高风险', type: 'danger' }
}
const riskInfo = computed(() => {
    const level = aiDetail.value.riskLevel
    return RISK_LEVELS[level] ?? { label: level === undefined ? '-' : String(level), type: 'info' }
})

const natureInfo = computed(() => {
    return aiDetail.value.isNegative
        ? { label: '负向情绪', type: 'danger' }
        : { label: '正常情绪', type: 'success' }
})

const improvementText = computed(() => {
    const list = aiDetail.value.improvementSuggestions
    if (!Array.isArray(list) || !list.length) return ''
    //数组逐条换行展示
    return list.map((item, index) => `${index + 1}. ${item}`).join('\n')
})

//删除
const handleDelete = async (row) => {
    try {
        await ElMessageBox.confirm(
            `确定删除 ID 为 ${row.id} 的情绪日记吗？删除后不可恢复。`,
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
        await deleteEmotionDiary(row.id)
        ElMessage.success('删除成功')
        // 当前页只剩这一条时回退一页，避免停在空页
        if (tableData.value.length === 1 && pagination.currentPage > 1) {
            pagination.currentPage--
        }
        fetchList()
    } catch {
        // 失败提示已由 request.js 的响应拦截器统一弹出
    }
}

onMounted(() => {
    fetchList()
})
</script>

<style lang="scss" scoped>
.mood-stars {
    display: flex;
    align-items: center;
    gap: 2px;

    .el-icon {
        font-size: 16px;
    }

    .star-on {
        color: #f5b301;
    }

    .star-off {
        color: #dcdfe6;
    }
}

.life-metrics {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: #4b5563;
}

.action-btns {
    display: flex;
    align-items: center;
    gap: 12px;

    /* 去掉 Element Plus 相邻按钮默认的左边距，避免叠加后换行 */
    .el-button + .el-button {
        margin-left: 0;
    }
}

.diary-content {
    max-height: 200px;
    overflow-y: auto;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.7;
}

/* ---------- 详情弹窗 ---------- */
.emotion-dialog {
    :deep(.el-dialog__body) {
        padding-top: 8px;
        max-height: 70vh;
        overflow-y: auto;
    }
}

.detail-section {
    margin-bottom: 18px;

    &:last-child {
        margin-bottom: 0;
    }
}

.detail-subsection {
    margin-top: 12px;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 8px;
    padding-left: 8px;
    border-left: 3px solid #409eff;
    line-height: 1.2;
}

.score-cell {
    display: flex;
    align-items: center;
    gap: 10px;

    .score-num {
        color: #6b7280;
    }
}

.intensity-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;

    .el-progress {
        flex: 1;
    }

    .intensity-num {
        flex-shrink: 0;
        color: #6b7280;
        font-size: 13px;
    }
}

.block-text {
    padding: 10px 12px;
    background: #fafbfc;
    border: 1px solid #eef2f7;
    border-radius: 8px;
    color: #4b5563;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
}
</style>

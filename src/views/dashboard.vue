<template>
    <div>
        <PageHead title="数据分析">
            <template #buttons>
                <div class="head-actions">
                    <span class="update-time" v-if="lastUpdated">更新于 {{ lastUpdated }}</span>
                    <el-button :loading="refreshing" @click="handleRefresh">刷新</el-button>
                </div>
            </template>
        </PageHead>

        <!-- ---------- 指标卡片 ---------- -->
        <div class="stat-grid" v-loading="loading">
            <div v-for="card in statCards" :key="card.label" class="stat-card">
                <div class="stat-icon" :style="{ background: card.bg, boxShadow: card.shadow }">
                    <img :src="card.icon" alt="" />
                </div>
                <div class="stat-info">
                    <div class="stat-label">{{ card.label }}</div>
                    <div class="stat-value">{{ card.value }}</div>
                    <div class="stat-extra" v-if="card.extra">{{ card.extra }}</div>
                </div>
            </div>
        </div>

        <!-- ---------- 情绪分布 + 情绪趋势 ---------- -->
        <div class="chart-grid cols-2">
            <div class="chart-card">
                <div class="chart-head">
                    <span class="chart-title">情绪分布</span>
                    <span class="chart-sub">AI 分析主要情绪占比</span>
                </div>
                <div class="chart-wrap">
                    <div ref="pieRef" class="chart-body"></div>
                    <div v-if="!loading && !hasEmotion" class="chart-empty">
                        <el-empty description="暂无情绪数据" :image-size="70" />
                    </div>
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-head">
                    <span class="chart-title">情绪趋势</span>
                    <span class="chart-sub">近 30 天情绪评分与日记量</span>
                </div>
                <div class="chart-wrap">
                    <div ref="trendRef" class="chart-body"></div>
                    <div v-if="!loading && !hasEmotionTrend" class="chart-empty">
                        <el-empty description="暂无趋势数据" :image-size="70" />
                    </div>
                </div>
            </div>
        </div>

        <!-- ---------- 情绪热力图 + 用户活跃度 ---------- -->
        <div class="chart-grid cols-2">
            <div class="chart-card">
                <div class="chart-head">
                    <span class="chart-title">情绪活跃热力图</span>
                    <span class="chart-sub">
                        高峰时段 {{ heatmap.peak }} · {{ heatmap.range }}
                    </span>
                </div>
                <div class="chart-wrap">
                    <div ref="heatmapRef" class="chart-body"></div>
                    <div v-if="!loading && !hasHeatmap" class="chart-empty">
                        <el-empty description="暂无热力图数据" :image-size="70" />
                    </div>
                </div>
            </div>

            <div class="chart-card">
                <div class="chart-head">
                    <span class="chart-title">用户活跃度</span>
                    <span class="chart-sub">近 30 天活跃与新增用户</span>
                </div>
                <div class="chart-wrap">
                    <div ref="activityRef" class="chart-body"></div>
                    <div v-if="!loading && !hasActivity" class="chart-empty">
                        <el-empty description="暂无用户活跃数据" :image-size="70" />
                    </div>
                </div>
            </div>
        </div>

        <!-- ---------- 咨询趋势 ---------- -->
        <div class="chart-grid">
            <div class="chart-card">
                <div class="chart-head">
                    <span class="chart-title">咨询趋势</span>
                    <span class="chart-sub">
                        会话总数 {{ formatNumber(consult.totalSessions) }} · 平均时长 {{ formatDuration(consult.avgDurationMinutes) }}
                    </span>
                </div>
                <div class="chart-wrap">
                    <div ref="consultRef" class="chart-body"></div>
                    <div v-if="!loading && !hasConsult" class="chart-empty">
                        <el-empty description="暂无咨询数据" :image-size="70" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import PageHead from '@/components/PageHead.vue'
import { analyticsOverview } from '@/api/admin'
import { ElMessage } from 'element-plus'
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'

//按需引入 ECharts，避免打包整个库
import * as echarts from 'echarts/core'
import { PieChart, LineChart, BarChart, HeatmapChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

//卡片图标复用素材库图片
import iconUsers from '@/assets/images/users.png'
import iconLike from '@/assets/images/like.png'
import iconComments from '@/assets/images/comments.png'
import iconBook from '@/assets/images/book.png'
import iconSmile from '@/assets/images/smile.png'

//情绪分布图例用对应情绪的表情图
import iconHappy from '@/assets/images/开心.png'
import iconExcited from '@/assets/images/兴奋.png'
import iconCalm from '@/assets/images/平静.png'
import iconConfused from '@/assets/images/困惑.png'
import iconSad from '@/assets/images/悲伤.png'
import iconSurprised from '@/assets/images/惊讶.png'
import iconAnxious from '@/assets/images/焦虑.png'
import iconTired from '@/assets/images/疲惫.png'

echarts.use([
    PieChart, LineChart, BarChart, HeatmapChart,
    TooltipComponent, LegendComponent, GridComponent, VisualMapComponent,
    CanvasRenderer
])

const emotionIcons = {
    '开心': iconHappy,
    '兴奋': iconExcited,
    '平静': iconCalm,
    '困惑': iconConfused,
    '悲伤': iconSad,
    '惊讶': iconSurprised,
    '焦虑': iconAnxious,
    '疲惫': iconTired
}

//情绪配色：正向偏冷绿，负向偏暖红，未知情绪走默认色板
const EMOTION_COLORS = {
    '开心': '#67c23a',
    '兴奋': '#409eff',
    '平静': '#36cfc9',
    '惊讶': '#9b7cf5',
    '困惑': '#b1b3b8',
    '疲惫': '#e6a23c',
    '悲伤': '#8a94a6',
    '焦虑': '#f56c6c'
}
const FALLBACK_COLORS = ['#409eff', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9b7cf5', '#36cfc9']

const WEEK_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const HOUR_LABELS = Array.from({ length: 24 }, (_, i) => `${i}时`)

const loading = ref(false)
const overview = ref({})

const pick = (obj, keys) => {
    if (!obj) return ''
    for (const key of keys) {
        const val = obj[key]
        if (val !== undefined && val !== null && val !== '') return val
    }
    return ''
}

const formatNumber = (val) => {
    const num = Number(val)
    return Number.isNaN(num) ? 0 : num.toLocaleString()
}

//把「2026-11-13」压成「11-13」，横轴才不会挤在一起
const shortDate = (val) => (typeof val === 'string' && val.length >= 10 ? val.slice(5).replace('-', '/') : val)

const formatDuration = (val) => {
    const num = Number(val)
    if (!num || Number.isNaN(num)) return '-'
    return `${num.toLocaleString(undefined, { maximumFractionDigits: 1 })} 分钟`
}

/* ---------- 指标卡片 ---------- */
const SYSTEM = computed(() => overview.value?.systemOverview ?? {})

const statCards = computed(() => {
    const s = SYSTEM.value
    return [
        {
            label: '总用户数',
            value: formatNumber(s.totalUsers),
            extra: `今日新增 ${formatNumber(s.todayNewUsers)}`,
            icon: iconUsers,
            bg: 'linear-gradient(135deg, #5b9bff 0%, #2f6fe4 100%)',
            shadow: '0 6px 14px rgba(64, 158, 255, 0.32)'
        },
        {
            label: '活跃用户',
            value: formatNumber(s.activeUsers),
            extra: '',
            icon: iconLike,
            bg: 'linear-gradient(135deg, #7ed957 0%, #46a72a 100%)',
            shadow: '0 6px 14px rgba(103, 194, 58, 0.32)'
        },
        {
            label: '总会话数',
            value: formatNumber(s.totalSessions),
            extra: `今日新增 ${formatNumber(s.todayNewSessions)}`,
            icon: iconComments,
            bg: 'linear-gradient(135deg, #f0b553 0%, #d5871a 100%)',
            shadow: '0 6px 14px rgba(230, 162, 60, 0.32)'
        },
        {
            label: '情绪日记数',
            value: formatNumber(s.totalDiaries),
            extra: `今日新增 ${formatNumber(s.todayNewDiaries)}`,
            icon: iconBook,
            bg: 'linear-gradient(135deg, #f98a8a 0%, #e05050 100%)',
            shadow: '0 6px 14px rgba(245, 108, 108, 0.32)'
        },
        {
            label: '平均情绪评分',
            value: s.avgMoodScore ?? '-',
            extra: '满分 10 分',
            icon: iconSmile,
            bg: 'linear-gradient(135deg, #9aa7bd 0%, #5f6b7d 100%)',
            shadow: '0 6px 14px rgba(107, 119, 137, 0.32)'
        }
    ]
})

/* ---------- 情绪分布 ---------- */
//注意：emotionDistribution 在接口里是挂在 emotionHeatmap 下面的，不是 data 顶层
const emotionPie = computed(() => {
    const raw = overview.value?.emotionDistribution
        ?? overview.value?.emotionHeatmap?.emotionDistribution
        ?? {}
    const entries = Array.isArray(raw)
        ? raw.map(item => [item.name ?? item.emotion ?? item.label, item.value ?? item.count])
        : Object.entries(raw)
    return entries
        .map(([name, value]) => ({ name, value: Number(value) || 0 }))
        .filter(item => item.name && item.value > 0)
        .sort((a, b) => b.value - a.value)
})
const hasEmotion = computed(() => emotionPie.value.length > 0)

/* ---------- 情绪趋势 ---------- */
const emotionTrend = computed(() => {
    const list = overview.value?.emotionTrend
    if (!Array.isArray(list) || !list.length) return { dates: [], scores: [], counts: [] }
    return {
        dates: list.map(item => shortDate(item.date)),
        //没有记录的日期 avgMoodScore 是 0，置空避免把曲线拉到 0
        scores: list.map(item => (Number(item.recordCount) > 0 ? Number(item.avgMoodScore) : null)),
        counts: list.map(item => Number(item.recordCount) || 0)
    }
})
const hasEmotionTrend = computed(() => emotionTrend.value.dates.length > 0)

/* ---------- 情绪热力图（7 天 × 24 小时） ---------- */
const cellCount = (cell) => {
    if (cell === null || cell === undefined || cell === '') return 0
    if (typeof cell === 'number') return cell
    const num = Number(pick(cell, ['count', 'value', 'recordCount', 'messageCount', 'sessionCount', 'diaryCount', 'total', 'num']))
    return Number.isNaN(num) ? 0 : num
}

const heatmap = computed(() => {
    const raw = overview.value?.emotionHeatmap
    const grid = raw?.gridData
    const result = {
        data: [],
        peak: raw?.peakEmotionTime || '-',
        range: raw?.dateRange || '-',
        max: 1
    }
    if (!Array.isArray(grid) || !grid.length) return result

    grid.forEach((row, y) => {
        if (!Array.isArray(row)) return
        row.forEach((cell, x) => {
            result.data.push([x, y, cellCount(cell)])
        })
    })
    const maxValue = Math.max(...result.data.map(item => item[2]), 0)
    result.max = Math.max(maxValue, 1)
    return result
})
const hasHeatmap = computed(() => heatmap.value.data.length > 0)

/* ---------- 用户活跃度 ---------- */
const userActivity = computed(() => {
    const list = overview.value?.userActivity
    if (!Array.isArray(list) || !list.length) return { dates: [], activeUsers: [], newUsers: [] }
    return {
        dates: list.map(item => shortDate(item.date)),
        activeUsers: list.map(item => Number(item.activeUsers) || 0),
        newUsers: list.map(item => Number(item.newUsers) || 0)
    }
})
const hasActivity = computed(() => userActivity.value.dates.length > 0)

/* ---------- 咨询趋势 ---------- */
const consult = computed(() => overview.value?.consultationStats ?? {})

const consultTrend = computed(() => {
    const list = consult.value.dailyTrend
    if (!Array.isArray(list) || !list.length) return { dates: [], sessions: [], messages: [] }
    return {
        dates: list.map(item => shortDate(item.date)),
        sessions: list.map(item => Number(pick(item, ['sessionCount', 'sessions', 'count', 'total'])) || 0),
        messages: list.map(item => Number(pick(item, ['messageCount', 'messages'])) || 0)
    }
})
const hasConsult = computed(() => consultTrend.value.dates.length > 0)

/* ---------- 图表渲染 ---------- */
const pieRef = ref(null)
const trendRef = ref(null)
const heatmapRef = ref(null)
const activityRef = ref(null)
const consultRef = ref(null)

const chartInstances = {}

const setChart = (key, el, option) => {
    if (!el) return
    if (!chartInstances[key]) chartInstances[key] = echarts.init(el)
    chartInstances[key].setOption(option, true)
}

const pieOption = () => ({
    tooltip: { trigger: 'item', formatter: '{b}: {c} 条 ({d}%)' },
    legend: {
        bottom: 0,
        type: 'scroll',
        itemWidth: 22,
        itemHeight: 22,
        data: emotionPie.value.map(item => ({
            name: item.name,
            icon: emotionIcons[item.name] ? `image://${emotionIcons[item.name]}` : 'circle'
        }))
    },
    series: [{
        type: 'pie',
        radius: ['45%', '66%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: emotionPie.value.map((item, index) => ({
            name: item.name,
            value: item.value,
            itemStyle: { color: EMOTION_COLORS[item.name] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] }
        }))
    }]
})

const trendOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, itemWidth: 16, itemHeight: 10 },
    //左右各留 44px 给两根 Y 轴的文字，ECharts 6 里 containLabel 已废弃
    grid: { left: 44, right: 44, top: 36, bottom: 48 },
    xAxis: {
        type: 'category',
        boundaryGap: true,
        data: emotionTrend.value.dates,
        axisLabel: { fontSize: 11 }
    },
    yAxis: [
        { type: 'value', name: '情绪评分', min: 0, max: 10, nameTextStyle: { fontSize: 11 } },
        { type: 'value', name: '日记数', minInterval: 1, splitLine: { show: false }, nameTextStyle: { fontSize: 11 } }
    ],
    series: [
        {
            name: '平均情绪评分',
            type: 'line',
            smooth: true,
            connectNulls: true,
            yAxisIndex: 0,
            data: emotionTrend.value.scores,
            itemStyle: { color: '#409eff' },
            areaStyle: { color: 'rgba(64,158,255,0.12)' }
        },
        {
            name: '日记数',
            type: 'bar',
            yAxisIndex: 1,
            barWidth: '45%',
            data: emotionTrend.value.counts,
            itemStyle: { color: '#c6e2ff', borderRadius: [4, 4, 0, 0] }
        }
    ]
})

const heatmapOption = () => ({
    tooltip: {
        formatter: (params) => {
            const [hour, day, count] = params.value
            return `${WEEK_LABELS[day] ?? ''} ${hour}时<br/>情绪记录：${count} 条`
        }
    },
    grid: { left: 48, right: 20, top: 16, bottom: 72 },
    xAxis: {
        type: 'category',
        data: HOUR_LABELS,
        splitArea: { show: true },
        axisLabel: { fontSize: 10, interval: 1 }
    },
    yAxis: {
        type: 'category',
        data: WEEK_LABELS,
        splitArea: { show: true },
        axisLabel: { fontSize: 11 }
    },
    visualMap: {
        min: 0,
        max: heatmap.value.max,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        textStyle: { fontSize: 11 },
        inRange: { color: ['#e8f3ff', '#b6d9ff', '#7fb8f5', '#4a90e2', '#1f5fa8'] }
    },
    series: [{
        type: 'heatmap',
        data: heatmap.value.data,
        itemStyle: { borderRadius: 3, borderColor: '#fff', borderWidth: 1 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.18)' } }
    }]
})

const activityOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, itemWidth: 16, itemHeight: 10 },
    grid: { left: 48, right: 20, top: 30, bottom: 48 },
    xAxis: { type: 'category', data: userActivity.value.dates, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', minInterval: 1 },
    series: [
        {
            name: '活跃用户',
            type: 'line',
            smooth: true,
            data: userActivity.value.activeUsers,
            itemStyle: { color: '#67c23a' },
            areaStyle: { color: 'rgba(103,194,58,0.12)' }
        },
        {
            name: '新增用户',
            type: 'bar',
            barWidth: '45%',
            data: userActivity.value.newUsers,
            itemStyle: { color: '#f0d9b5', borderRadius: [4, 4, 0, 0] }
        }
    ]
})

const consultOption = () => ({
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, itemWidth: 16, itemHeight: 10 },
    grid: { left: 48, right: 48, top: 36, bottom: 48 },
    xAxis: { type: 'category', data: consultTrend.value.dates, axisLabel: { fontSize: 11 } },
    yAxis: [
        { type: 'value', name: '会话数', minInterval: 1, nameTextStyle: { fontSize: 11 } },
        { type: 'value', name: '消息数', minInterval: 1, splitLine: { show: false }, nameTextStyle: { fontSize: 11 } }
    ],
    series: [
        {
            name: '会话数',
            type: 'bar',
            barWidth: '45%',
            data: consultTrend.value.sessions,
            itemStyle: { color: '#c6e2ff', borderRadius: [4, 4, 0, 0] }
        },
        {
            name: '消息数',
            type: 'line',
            smooth: true,
            yAxisIndex: 1,
            data: consultTrend.value.messages,
            itemStyle: { color: '#9b7cf5' }
        }
    ]
})

const renderCharts = async () => {
    await nextTick()
    setChart('pie', pieRef.value, pieOption())
    setChart('trend', trendRef.value, trendOption())
    setChart('heatmap', heatmapRef.value, heatmapOption())
    setChart('activity', activityRef.value, activityOption())
    setChart('consult', consultRef.value, consultOption())
}

const handleResize = () => {
    Object.values(chartInstances).forEach(chart => chart?.resize())
}

/* ---------- 数据拉取 / 自动刷新 ---------- */
const POLL_INTERVAL = 30 * 1000 //轮询间隔
const MAX_SILENT_FAILS = 3 //连续失败几次后暂停轮询，避免一直弹错误提示

const refreshing = ref(false)
const lastUpdated = ref('')
let pollTimer = null
let silentFailCount = 0

const formatClock = (date) => {
    const pad = n => String(n).padStart(2, '0')
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const stopPolling = () => {
    if (pollTimer) {
        clearInterval(pollTimer)
        pollTimer = null
    }
}

const startPolling = () => {
    stopPolling()
    pollTimer = setInterval(() => fetchOverview(true), POLL_INTERVAL)
}

//silent 为 true 时不显示整页 loading，用于轮询和手动刷新
const fetchOverview = async (silent = false) => {
    if (silent) refreshing.value = true
    else loading.value = true
    try {
        overview.value = (await analyticsOverview()) ?? {}
        lastUpdated.value = formatClock(new Date())
        silentFailCount = 0
    } catch {
        //失败提示已由 request.js 的响应拦截器统一弹出
        if (!silent) overview.value = {}
        //轮询失败保留上一次的数据；连续失败则停下，别每 30 秒弹一次提示
        if (silent && ++silentFailCount >= MAX_SILENT_FAILS) {
            stopPolling()
            ElMessage.warning('数据刷新连续失败，已暂停自动刷新，可点击「刷新」重试')
        }
    } finally {
        loading.value = false
        refreshing.value = false
    }
    await renderCharts()
}

const handleRefresh = () => {
    silentFailCount = 0
    fetchOverview(true)
    startPolling() //手动刷新后重新开始计时
}

onMounted(async () => {
    window.addEventListener('resize', handleResize)
    await fetchOverview()
    startPolling()
})

onBeforeUnmount(() => {
    stopPolling()
    window.removeEventListener('resize', handleResize)
    Object.keys(chartInstances).forEach(key => {
        chartInstances[key]?.dispose()
        delete chartInstances[key]
    })
})
</script>

<style lang="scss" scoped>
.head-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .update-time {
        font-size: 13px;
        color: #9ca3af;
    }
}

.stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(196px, 1fr));
    gap: 16px;
    margin-top: 20px;
}

.stat-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 20px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #eef2f7;
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.06);
    }

    .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 10px;
        flex-shrink: 0;

        img {
            width: 28px;
            height: 28px;
            object-fit: contain;
        }
    }

    .stat-info {
        min-width: 0;

        .stat-label {
            font-size: 13px;
            color: #6b7280;
            margin-bottom: 6px;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 600;
            color: #1f2937;
            line-height: 1;
        }

        .stat-extra {
            margin-top: 6px;
            font-size: 12px;
            color: #9ca3af;
        }
    }
}

.chart-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-top: 16px;

    &.cols-2 {
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
    }
}

.chart-card {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #eef2f7;
    padding: 18px 20px 8px;
}

.chart-head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px 10px;
    margin-bottom: 8px;

    .chart-title {
        font-size: 16px;
        font-weight: 600;
        color: #1f2937;
    }

    .chart-sub {
        font-size: 12px;
        color: #9ca3af;
    }
}

.chart-wrap {
    position: relative;
    height: 320px;
}

.chart-body {
    width: 100%;
    height: 100%;
}

.chart-empty {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
}
</style>

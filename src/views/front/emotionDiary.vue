<template>
    <div class="diary-page">
        <FrontBanner
            variant="warm"
            icon="Notebook"
            title="情绪日记"
            subtitle="记录今天的心情，让情绪有迹可循"
        />

        <div ref="cardRef" class="diary-card" :class="{ 'is-entering': entering }">
            <el-form ref="formRef" :model="form" :rules="rules" label-position="top" class="diary-form">
                <!-- 记录日期 -->
                <el-form-item label="记录日期" prop="diaryDate">
                    <el-date-picker
                        v-model="form.diaryDate"
                        type="date"
                        value-format="YYYY-MM-DD"
                        placeholder="选择日期"
                        :disabled-date="disabledFuture"
                        class="date-picker"
                    />
                </el-form-item>

                <!-- 今日心情 -->
                <el-form-item label="今日心情" prop="moodScore">
                    <div class="mood-block">
                        <div class="mood-current">
                            <span class="mood-emoji">{{ currentMood.emoji }}</span>
                            <span class="mood-text">{{ currentMood.label }}</span>
                        </div>
                        <div class="score-row">
                            <button
                                v-for="n in 10"
                                :key="n"
                                type="button"
                                class="score-dot"
                                :class="{ on: form.moodScore === n }"
                                @click="select('moodScore', n)"
                            >
                                {{ n }}
                            </button>
                        </div>
                        <div class="score-legend">
                            <span>很低落</span>
                            <span>非常棒</span>
                        </div>
                    </div>
                </el-form-item>

                <!-- 主要情绪 -->
                <el-form-item label="主要情绪" prop="dominantEmotion">
                    <div class="emotion-grid">
                        <button
                            v-for="item in EMOTIONS"
                            :key="item.label"
                            type="button"
                            class="emotion-item"
                            :class="{ on: form.dominantEmotion === item.label }"
                            @click="select('dominantEmotion', item.label)"
                        >
                            <img :src="item.icon" :alt="item.label" />
                            <span>{{ item.label }}</span>
                        </button>
                    </div>
                </el-form-item>

                <!-- 睡眠 / 压力 -->
                <div class="row-2">
                    <el-form-item label="睡眠质量" prop="sleepQuality">
                        <div class="level-block">
                            <div class="level-row">
                                <button
                                    v-for="n in 5"
                                    :key="n"
                                    type="button"
                                    class="level-dot"
                                    :class="{ on: form.sleepQuality === n }"
                                    @click="select('sleepQuality', n)"
                                >
                                    {{ n }}
                                </button>
                            </div>
                            <span class="level-text">{{ SLEEP_TEXT[form.sleepQuality] || '' }}</span>
                        </div>
                    </el-form-item>

                    <el-form-item label="压力水平" prop="stressLevel">
                        <div class="level-block">
                            <div class="level-row">
                                <button
                                    v-for="n in 5"
                                    :key="n"
                                    type="button"
                                    class="level-dot"
                                    :class="{ on: form.stressLevel === n }"
                                    @click="select('stressLevel', n)"
                                >
                                    {{ n }}
                                </button>
                            </div>
                            <span class="level-text">{{ STRESS_TEXT[form.stressLevel] || '' }}</span>
                        </div>
                    </el-form-item>
                </div>

                <!-- 触发因素 -->
                <el-form-item label="情绪触发因素" prop="emotionTriggers">
                    <el-input
                        v-model="form.emotionTriggers"
                        maxlength="50"
                        show-word-limit
                        placeholder="例如：工作压力、和朋友聊天、天气变化…"
                    />
                </el-form-item>

                <!-- 今日感想 -->
                <el-form-item label="今日感想" prop="diaryContent">
                    <el-input
                        v-model="form.diaryContent"
                        type="textarea"
                        resize="none"
                        :autosize="{ minRows: 5, maxRows: 10 }"
                        maxlength="500"
                        show-word-limit
                        placeholder="写下今天发生的事，以及此刻的感受…"
                    />
                </el-form-item>

                <div class="diary-actions">
                    <el-button class="ghost-btn" @click="resetForm">重置</el-button>
                    <el-button class="save-btn" :loading="submitting" @click="submit">保存日记</el-button>
                </div>
            </el-form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { saveEmotionDiary } from '@/api/user'
import { saveTodayMood } from '@/utils/todayMood'
import FrontBanner from '@/components/FrontBanner.vue'

import iconHappy from '@/assets/images/开心.png'
import iconExcited from '@/assets/images/兴奋.png'
import iconCalm from '@/assets/images/平静.png'
import iconConfused from '@/assets/images/困惑.png'
import iconSad from '@/assets/images/悲伤.png'
import iconSurprised from '@/assets/images/惊讶.png'
import iconAnxious from '@/assets/images/焦虑.png'
import iconTired from '@/assets/images/疲惫.png'

const EMOTIONS = [
    { label: '开心', icon: iconHappy },
    { label: '兴奋', icon: iconExcited },
    { label: '平静', icon: iconCalm },
    { label: '困惑', icon: iconConfused },
    { label: '悲伤', icon: iconSad },
    { label: '惊讶', icon: iconSurprised },
    { label: '焦虑', icon: iconAnxious },
    { label: '疲惫', icon: iconTired }
]

const SLEEP_TEXT = { 1: '很差', 2: '较差', 3: '一般', 4: '不错', 5: '很好' }
const STRESS_TEXT = { 1: '很低', 2: '较低', 3: '一般', 4: '较高', 5: '很高' }

//评分 → 表情和描述
const MOOD_STEPS = [
    { max: 2, emoji: '😞', label: '很低落' },
    { max: 4, emoji: '😕', label: '有点低落' },
    { max: 6, emoji: '😐', label: '一般' },
    { max: 8, emoji: '🙂', label: '还不错' },
    { max: 10, emoji: '😄', label: '非常棒' }
]

const today = () => {
    const date = new Date()
    const pad = n => String(n).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const createForm = () => ({
    diaryDate: today(),
    moodScore: null,
    dominantEmotion: '',
    emotionTriggers: '',
    diaryContent: '',
    sleepQuality: null,
    stressLevel: null
})

const formRef = ref()
const form = reactive(createForm())
const submitting = ref(false)

//抽屉展开动画：动画跑完就摘掉 class，即使动画没执行也不会把卡片留在隐藏态
const cardRef = ref()
const entering = ref(true)
let enterTimer = null

const startDrawer = () => {
    entering.value = true
    if (enterTimer) clearTimeout(enterTimer)
    enterTimer = setTimeout(() => {
        entering.value = false
    }, 700)
}

//重播抽屉动画：先摘掉 class 并强制回流，再加回去动画才会重新播放
const replayDrawer = async () => {
    entering.value = false
    await nextTick()
    void cardRef.value?.offsetWidth // 触发一次布局，重置动画状态
    cardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    startDrawer()
}

onMounted(startDrawer)

onBeforeUnmount(() => {
    if (enterTimer) clearTimeout(enterTimer)
})

const currentMood = computed(() => {
    if (!form.moodScore) return { emoji: '🙂', label: '请选择今天的心情' }
    return MOOD_STEPS.find(step => form.moodScore <= step.max) ?? { emoji: '🙂', label: '请选择今天的心情' }
})

const rules = {
    diaryDate: [{ required: true, message: '请选择记录日期', trigger: 'change' }],
    moodScore: [{ required: true, message: '请选择今日心情评分', trigger: 'change' }],
    dominantEmotion: [{ required: true, message: '请选择主要情绪', trigger: 'change' }],
    emotionTriggers: [{ required: true, message: '请填写情绪触发因素', trigger: 'blur' }],
    diaryContent: [{ required: true, message: '请写下今日感想', trigger: 'blur' }],
    sleepQuality: [{ required: true, message: '请选择睡眠质量', trigger: 'change' }],
    stressLevel: [{ required: true, message: '请选择压力水平', trigger: 'change' }]
}

//没选明天及以后的日期
const disabledFuture = (date) => date.getTime() > Date.now()

//自定义控件选值后手动清掉校验红字
const select = (prop, value) => {
    form[prop] = value
    formRef.value?.clearValidate(prop)
}

//清空表单并重播抽屉动画（保存成功和点重置都走这里）
const resetForm = () => {
    Object.assign(form, createForm())
    formRef.value?.clearValidate()
    replayDrawer()
}

const submit = async () => {
    try {
        await formRef.value.validate()
    } catch {
        ElMessage.warning('还有内容没有填写完整')
        return
    }

    submitting.value = true
    try {
        await saveEmotionDiary({
            diaryDate: form.diaryDate,
            moodScore: form.moodScore,
            dominantEmotion: form.dominantEmotion,
            emotionTriggers: form.emotionTriggers.trim(),
            diaryContent: form.diaryContent.trim(),
            sleepQuality: form.sleepQuality,
            stressLevel: form.stressLevel
        })
        ElMessage.success('情绪日记已保存')
        //记到本地，聊天页的情绪花园会直接显示今天的状态
        saveTodayMood({
            diaryDate: form.diaryDate,
            moodScore: form.moodScore,
            dominantEmotion: form.dominantEmotion
        })
        //保存成功后清空表单并重播一次展开动画
        resetForm()
    } catch {
        //失败提示已由 request.js 的响应拦截器统一弹出
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
.diary-page {
    flex: 1;
    padding: 24px;
    /* 整体偏暖，比卡片更浅一档，让牛皮纸板块跳出来 */
    background: var(--bg-page);
    box-sizing: border-box;
}

.diary-card {
    max-width: 820px;
    margin: 0 auto;
    padding: 28px 36px;
    border-radius: 16px;
    border: 1px solid var(--paper-border);

    /* 仿牛皮纸：底色 + 两层纤维纹 + 细小斑点 + 顶部提亮 */
    background-color: var(--paper-bg);
    background-image:
        repeating-linear-gradient(112deg, var(--paper-line) 0 1px, transparent 1px 7px),
        repeating-linear-gradient(24deg, var(--paper-line-2) 0 1px, transparent 1px 9px),
        radial-gradient(var(--paper-dot) 1px, transparent 1px),
        radial-gradient(120% 100% at 50% 0%, var(--paper-gloss) 0%, rgba(255, 255, 255, 0) 62%);
    background-size: auto, auto, 18px 18px, auto;
    box-shadow:
        0 3px 18px rgba(120, 90, 50, 0.1),
        inset 0 0 46px var(--paper-inset);

}

/* 抽屉式下拉展开：卡片从上往下"抽"出来 */
.diary-card.is-entering {
    animation: drawer-open 1.5s cubic-bezier(0.22, 1, 0.36, 1) 0.06s both;
}

@keyframes drawer-open {
    0% {
        clip-path: inset(0 0 100% 0);
        transform: translateY(-10px);
        opacity: 0;
    }

    40% {
        opacity: 1;
    }

    100% {
        clip-path: inset(0 0 0 0);
        transform: translateY(0);
        opacity: 1;
    }
}

/* 系统开启"减少动态效果"时不做动画 */
@media (prefers-reduced-motion: reduce) {
    .diary-card {
        animation: none;
    }
}

/* ---------- 通用表单样式 ---------- */
.diary-form {
    :deep(.el-form-item__label) {
        font-size: 13px;
        font-weight: 500;
        color: var(--paper-label);
        padding-bottom: 6px;
    }

    :deep(.el-form-item) {
        margin-bottom: 22px;
    }

    .date-picker {
        width: 220px;

        :deep(.el-input__wrapper) {
            border-radius: 10px;
        }
    }

    :deep(.el-textarea__inner),
    :deep(.el-input__wrapper) {
        border-radius: 10px;
        font-size: 14px;
        /* 纸面上用微暖的白色，比纯白柔和 */
        background-color: var(--paper-input);
        box-shadow: 0 0 0 1px var(--paper-input-border) inset;
    }

    :deep(.el-textarea__inner) {
        line-height: 1.7;
        padding: 12px 14px;
    }
}

/* ---------- 心情评分 ---------- */
.mood-block {
    width: 100%;
}

.mood-current {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .mood-emoji {
        font-size: 22px;
        line-height: 1;
    }

    .mood-text {
        font-size: 13px;
        color: var(--brand-700);
        font-weight: 500;
    }
}

.score-row {
    display: flex;
    gap: 8px;

    .score-dot {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 1px solid var(--paper-input-border);
        background: #fffdf7;
        color: var(--paper-label);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            border-color: var(--brand-300);
            color: var(--brand-700);
        }

        &.on {
            background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
            border-color: transparent;
            color: var(--on-brand);
            font-weight: 600;
            transform: scale(1.04);
        }
    }
}

.score-legend {
    display: flex;
    justify-content: space-between;
    max-width: 412px;
    margin-top: 8px;
    font-size: 12px;
    color: var(--paper-label);
}

/* ---------- 情绪选择 ---------- */
.emotion-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 10px;
    width: 100%;
}

.emotion-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 4px;
    border: 1px solid transparent;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.2s ease;

    img {
        width: 28px;
        height: 28px;
        object-fit: contain;
    }

    span {
        font-size: 12px;
        color: var(--text-2);
    }

    &:hover {
        background: rgba(255, 255, 255, 0.78);
    }

    &.on {
        border-color: var(--brand-300);
        background: var(--brand-50);

        span {
            color: var(--brand-700);
            font-weight: 600;
        }
    }
}

/* ---------- 睡眠 / 压力 ---------- */
.row-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.level-block {
    display: flex;
    align-items: center;
    gap: 12px;
}

.level-row {
    display: flex;
    gap: 8px;

    .level-dot {
        width: 40px;
        height: 34px;
        border-radius: 8px;
        border: 1px solid var(--paper-input-border);
        background: #fffdf7;
        color: var(--paper-label);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            border-color: var(--brand-300);
            color: var(--brand-700);
        }

        &.on {
            background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
            border-color: transparent;
            color: var(--on-brand);
            font-weight: 600;
        }
    }
}

.level-text {
    font-size: 13px;
    color: var(--brand-700);
    min-width: 32px;
}

/* ---------- 底部按钮 ---------- */
.diary-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 8px;

    .el-button {
        height: 40px;
        padding: 0 26px;
        border-radius: 10px;
        font-size: 14px;
        margin-left: 0;
    }

    .ghost-btn {
        border-color: var(--paper-border);
        color: var(--paper-label);
        background: rgba(255, 255, 255, 0.35);

        &:hover {
            border-color: var(--brand-300);
            color: var(--brand-700);
            background: var(--brand-50);
        }
    }

    .save-btn {
        border: none;
        background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
        /* 用 Element 的变量覆盖各状态，避免 hover/active 时串回默认蓝色 */
        --el-button-bg-color: #{var(--brand-500)};
        --el-button-border-color: transparent;
        --el-button-hover-bg-color: #{var(--brand-700)};
        --el-button-hover-border-color: transparent;
        --el-button-active-bg-color: #{var(--brand-700)};
        --el-button-active-border-color: transparent;
        --el-button-text-color: #fff;
        --el-button-hover-text-color: #fff;
        --el-button-active-text-color: #fff;
        --el-button-disabled-text-color: #fff;
        color: var(--on-brand);

        &:hover {
            background: linear-gradient(135deg, #8b5cc4, #5f2b9c);
            color: var(--on-brand);
        }
    }
}

/* ---------- 窄屏 ---------- */
@media (max-width: 900px) {
    .diary-banner {
        padding: 22px 20px;
    }

    .banner-inner {
        padding: 0 20px;
    }

    .diary-card {
        padding: 24px 20px;
    }

    .emotion-grid {
        grid-template-columns: repeat(4, 1fr);
    }

    .row-2 {
        grid-template-columns: 1fr;
        gap: 0;
    }

    .score-row {
        flex-wrap: wrap;
    }
}
</style>

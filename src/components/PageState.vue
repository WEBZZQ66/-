<template>
    <div class="page-state" :class="{ compact }">
        <el-icon class="state-icon"><component :is="iconName" /></el-icon>
        <p class="state-text">{{ text }}</p>
        <el-button v-if="actionText" class="state-btn" @click="$emit('action')">
            {{ actionText }}
        </el-button>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    //empty 空数据 / error 加载失败 / lock 需要登录
    type: { type: String, default: 'empty' },
    text: { type: String, default: '' },
    actionText: { type: String, default: '' },
    compact: { type: Boolean, default: false }
})

defineEmits(['action'])

const iconName = computed(
    () => ({ empty: 'Files', error: 'Warning', lock: 'Lock' })[props.type] || 'Files'
)
</script>

<style lang="scss" scoped>
.page-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 64px 0;

    &.compact {
        padding: 40px 0;
    }

    .state-icon {
        font-size: 34px;
        color: var(--brand-300);
    }

    .state-text {
        font-size: 14px;
        color: var(--text-2);
        text-align: center;
    }

    .state-btn {
        margin-top: 6px;
        height: 36px;
        padding: 0 22px;
        border-radius: var(--radius-sm);
        border: none;
        background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
        color: var(--on-brand);

        &:hover {
            background: linear-gradient(135deg, var(--brand-500), var(--brand-600));
            color: var(--on-brand);
        }
    }
}
</style>

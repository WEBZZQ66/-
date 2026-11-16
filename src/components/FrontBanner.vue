<template>
    <header class="front-banner" :class="`is-${variant}`">
        <div class="banner-inner">
            <div class="banner-icon">
                <el-icon><component :is="icon" /></el-icon>
            </div>
            <div class="banner-text">
                <h2>{{ title }}</h2>
                <p v-if="subtitle">{{ subtitle }}</p>
            </div>
            <slot name="extra" />
        </div>
    </header>
</template>

<script setup>
defineProps({
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    icon: { type: String, default: 'Reading' },
    //purple：站内紫；warm：牛皮纸暖色
    variant: { type: String, default: 'purple' }
})
</script>

<style lang="scss" scoped>
.front-banner {
    margin: -24px -24px 22px;
    padding: 24px 24px;
    border-bottom: 1px solid var(--border);
    transition: background-color var(--dur-normal) ease, border-color var(--dur-normal) ease;

    &.is-purple {
        background: linear-gradient(135deg, var(--brand-100) 0%, var(--brand-50) 55%, var(--brand-200) 100%);
    }

    &.is-warm {
        background: linear-gradient(135deg, #faf6ec 0%, #fdfaf3 55%, #f7f2e6 100%);
        border-bottom-color: #e8dfc9;
    }
}

html.dark .front-banner.is-warm {
    background: linear-gradient(135deg, #221d15 0%, #262018 55%, #2a2319 100%);
    border-bottom-color: var(--border);
}

.banner-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 8px;
    display: flex;
    align-items: center;
    gap: 14px;
}

.banner-icon {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    background: var(--bg-card);
    color: var(--brand-500);
    font-size: 22px;
    box-shadow: 0 2px 8px rgba(85, 38, 142, 0.06);
}

.banner-text {
    min-width: 0;

    h2 {
        font-size: 22px;
        font-weight: 600;
        color: var(--text-1);
        letter-spacing: 0.5px;
    }

    p {
        margin-top: 5px;
        font-size: 13px;
        color: var(--text-2);
    }
}

@media (max-width: 900px) {
    .front-banner {
        margin: -16px -16px 18px;
        padding: 20px 16px;
    }

    .banner-inner {
        padding: 0;
    }
}
</style>

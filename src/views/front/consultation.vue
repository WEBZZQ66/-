<template>
    <div class="placeholder-page">
        <h2 class="title">AI咨询</h2>
        <p class="desc">页面建设中，敬请期待</p>
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
    </div>
</template>
<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>
<style lang="scss" scoped>
.placeholder-page {
    flex: 1;
    min-height: 480px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: #fff;

    .title {
        font-size: 26px;
        font-weight: 700;
        color: #1f2937;
    }

    .desc {
        font-size: 15px;
        color: #6b7280;
        margin-bottom: 8px;
    }
}
</style>

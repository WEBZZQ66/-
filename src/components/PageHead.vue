<template>
    <div class="page-head">
        <p class="page-title">{{props.title}}</p>
        <div class="action-btn">
            <slot name="buttons"></slot>
        </div>
    </div>
</template>
<script setup>
import {defineProps} from 'vue'
const props = defineProps({
    title: {
        type: String,
        default: '页面标题'
    }
})
</script>
<style lang="scss" scoped>
.page-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    .page-title {
        font-size: 24px;
        font-weight: #2d3748;
    }
}
</style>
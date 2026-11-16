<template>
    <section class="hero">
        <div class="hero-inner">
            <div class="hero-text">
                <h1 class="hero-title">一次温暖的对话</h1>
                <h1 class="hero-title accent">化孤独为慰藉</h1>
                <p class="hero-desc">
                    每个深夜，每个焦虑的时刻，我们都在这里。不必独自承受，让心与心的连接温暖您的每一天
                </p>
                <div class="hero-actions">
                    <el-button class="btn-solid" @click="handleChat">开始倾诉，获得陪伴</el-button>
                    <el-button class="btn-ghost" @click="handleDiary">记录心情，释放情感</el-button>
                </div>
            </div>

            <div class="hero-visual">
                <div class="mask-circle">
                    <img class="mask-img" :src="maskImage" alt="大爱同学" />
                </div>
            </div>
        </div>
    </section>
</template>
<script setup>
import { useRouter } from 'vue-router'
import maskImage from '@/assets/images/taidu.png'

const router = useRouter()

const isLoggedIn = () => Boolean(localStorage.getItem('token'))

//需要登录的功能：未登录先去登录页，登录后回到原本要去的页面
const toLoginWithBack = (redirect) => {
    router.push({ path: '/auth/login', query: { redirect } })
}

const handleChat = () => {
    if (!isLoggedIn()) return toLoginWithBack('/consultation')
    router.push('/consultation')
}

const handleDiary = () => {
    if (!isLoggedIn()) return toLoginWithBack('/emotion-diary')
    router.push('/emotion-diary')
}
</script>
<style lang="scss" scoped>
.hero {
    flex: 1;
    /* 主体拉长，四周留白更大，整体更舒展 */
    min-height: 680px;
    display: flex;
    align-items: center;
    position: relative;
    overflow: hidden;
    /* 与登录页左栏同一套紫色渐变 */
    background: linear-gradient(90deg, #55268e 0%, #401a6e 50%, #2a0e4e 100%);

    /* 效果图上那层很淡的斜纹 */
    &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.03) 0 1px,
            transparent 1px 7px
        );
        pointer-events: none;
    }
}

.hero-inner {
    width: 100%;
    /* 内容整体收窄，跟效果图那样两侧留出大片留白 */
    max-width: 1000px;
    margin: 0 auto;
    padding: 100px 24px;
    display: flex;
    align-items: center;
    /* 整组居中，文案与头像之间的距离固定，不再被 space-between 拉开 */
    justify-content: center;
    gap: 64px;
    position: relative;
    z-index: 1;
}

.hero-text {
    /* 不吸收剩余空间，宽度贴合内容，中间就不会出现大片空白 */
    flex: 0 1 auto;
    max-width: 520px;

    .hero-title {
        font-size: 44px;
        font-weight: 700;
        line-height: 1.32;
        letter-spacing: 1px;
        color: #fff;
        margin: 0;

        &.accent {
            color: #f7d34d;
        }
    }

    .hero-desc {
        margin: 22px 0 34px;
        max-width: 480px;
        font-size: 15px;
        line-height: 1.9;
        color: rgba(255, 255, 255, 0.85);
    }
}

.hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;

    .el-button {
        height: 42px;
        padding: 0 22px;
        font-size: 14px;
        border-radius: 8px;
        margin-left: 0; /* 去掉 Element Plus 相邻按钮默认左外边距 */
    }

    .btn-solid {
        background: #fff;
        border-color: #fff;
        color: #2f4f45;
        font-weight: 600;

        &:hover,
        &:focus {
            background: #f0f6f3;
            border-color: #f0f6f3;
            color: #244139;
        }
    }

    .btn-ghost {
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.75);
        color: #fff;

        &:hover,
        &:focus {
            background: rgba(255, 255, 255, 0.14);
            border-color: #fff;
            color: #fff;
        }
    }
}

/* ---------- 右侧圆形头像 ---------- */
.hero-visual {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mask-circle {
    position: relative;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;

    /* 外围两圈光晕 */
    &::before,
    &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.16);
        transform: translate(-50%, -50%);
    }

    &::before {
        width: 300px;
        height: 300px;
    }

    &::after {
        width: 380px;
        height: 380px;
        border-color: rgba(255, 255, 255, 0.08);
    }

    .mask-img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }
}

/* ---------- 窄屏适配 ---------- */
@media (max-width: 1024px) {
    .hero-inner {
        flex-direction: column-reverse;
        justify-content: center;
        text-align: center;
        gap: 40px;
        padding: 48px 24px;
    }

    .hero-text {
        max-width: 100%;

        .hero-title {
            font-size: 30px;
        }

        .hero-desc {
            margin: 18px auto 28px;
        }
    }

    .hero-actions {
        justify-content: center;
    }

    .mask-circle {
        width: 160px;
        height: 160px;

        &::before {
            width: 220px;
            height: 220px;
        }

        &::after {
            width: 280px;
            height: 280px;
        }
    }
}
</style>

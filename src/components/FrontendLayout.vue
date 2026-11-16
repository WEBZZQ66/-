<template>
    <div class="front-layout">
        <!-- 顶部导航 -->
        <header class="front-header">
            <div class="header-inner">
                <div class="brand">
                    <img class="brand-icon" :src="robotIcon" alt="心理健康AI助手" />
                    <span class="brand-name">大爱同学心理健康助手</span>
                </div>

                <nav class="nav-links">
                    <router-link to="/" class="nav-item">首页</router-link>

                    <!-- 已登录：业务菜单 + 退出登录 -->
                    <template v-if="loggedIn">
                        <router-link to="/consultation" class="nav-item">AI咨询</router-link>
                        <router-link to="/emotion-diary" class="nav-item">情绪日记</router-link>
                        <router-link to="/knowledge" class="nav-item">知识库</router-link>
                        <el-button class="logout-btn" @click="handleLogout">退出登录</el-button>
                    </template>

                    <!-- 未登录：登录 / 注册 -->
                    <template v-else>
                        <router-link to="/knowledge" class="nav-item">知识库</router-link>
                        <span class="nav-item" @click="goLogin">登录</span>
                        <el-button type="primary" class="register-btn" @click="goRegister">注册</el-button>
                    </template>
                </nav>
            </div>
        </header>

        <!-- 页面内容 -->
        <main class="front-main">
            <router-view />
        </main>

        <!-- 底部 -->
        <footer class="front-footer">
            © 2026 心理健康AI助手. 保留所有权利.
        </footer>
    </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { logout } from '@/api/admin'
import robotIcon from '@/assets/images/daai.jpeg'

const router = useRouter()
const route = useRoute()

//当前是否已登录，登录/退出后导航栏跟着切换
const loggedIn = ref(Boolean(localStorage.getItem('token')))

//登录态可能被接口拦截器清掉（token 过期），切页面时重新读一次，避免导航栏显示错误状态
watch(
    () => route.fullPath,
    () => {
        loggedIn.value = Boolean(localStorage.getItem('token'))
    }
)

const goLogin = () => router.push('/auth/login')
const goRegister = () => router.push('/auth/register')

//退出登录：结束服务端会话 → 清理本地凭据 → 导航栏切回登录/注册
const handleLogout = async () => {
    try {
        await ElMessageBox.confirm('确定退出当前账号吗？', '退出确认', {
            type: 'warning',
            confirmButtonText: '退出',
            cancelButtonText: '取消'
        })
    } catch {
        return // 点了取消或关闭弹窗
    }

    try {
        await logout()
    } catch {
        // 接口失败（比如 token 已过期）也要继续清理本地状态
    } finally {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        loggedIn.value = false
        ElMessage.success('已退出登录')
        //如果当前停在需要登录的页面，退回首页
        if (route.meta?.requiresAuth) router.push('/')
    }
}
</script>
<style lang="scss" scoped>
.front-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: #fff;
}

/* ---------- 顶部导航 ---------- */
.front-header {
    height: 76px;
    background: #f5f5f5;
    flex-shrink: 0;
}

.header-inner {
    height: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 0 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.brand {
    display: flex;
    align-items: center;
    gap: 10px;

    .brand-icon {
        width: 30px;
        height: 30px;
        object-fit: contain;
        border-radius: 6px;
    }

    .brand-name {
        font-size: 19px;
        font-weight: 700;
        color: #1f2937;
        letter-spacing: 0.5px;
    }
}

.nav-links {
    display: flex;
    align-items: center;
    gap: 36px;

    .nav-item {
        font-size: 15px;
        color: #1f2937;
        cursor: pointer;
        text-decoration: none;
        transition: color 0.2s ease;

        &:hover {
            color: #4b8bf5;
        }
    }

    .register-btn {
        height: 34px;
        padding: 0 18px;
        border-radius: 6px;
        font-size: 14px;
        background: #4b8bf5;
        border-color: #4b8bf5;

        &:hover {
            background: #3a7ae4;
            border-color: #3a7ae4;
        }
    }

    .logout-btn {
        height: 34px;
        padding: 0 18px;
        border-radius: 6px;
        font-size: 14px;
        background: transparent;
        border: 1px solid #d8d8dc;
        color: #1f2937;

        &:hover,
        &:focus {
            background: #fff;
            border-color: #bfc2c9;
            color: #1f2937;
        }
    }
}

/* ---------- 页面内容 ---------- */
.front-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

/* ---------- 底部 ---------- */
.front-footer {
    flex-shrink: 0;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #26262e;
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    letter-spacing: 0.5px;
}

/* ---------- 窄屏适配 ---------- */
@media (max-width: 1024px) {
    .header-inner {
        padding: 0 24px;
    }

    .nav-links {
        gap: 20px;
    }
}
</style>

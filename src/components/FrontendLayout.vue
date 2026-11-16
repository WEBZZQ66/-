<template>
    <div class="front-layout">
        <!-- 顶部导航 -->
        <header class="front-header">
            <div class="header-inner">
                <div class="brand">
                    <img class="brand-icon" :src="robotIcon" alt="心理健康AI助手" />
                    <span class="brand-name">大爱同学心理健康助手</span>
                </div>

                <nav ref="navRef" class="nav-links">
                    <!-- 滑块指示器：跟着当前功能平滑移动 -->
                    <span class="nav-indicator" :style="indicatorStyle"></span>

                    <router-link
                        v-for="item in navItems"
                        :key="item.path"
                        :to="item.path"
                        class="nav-item"
                        :class="{ 'is-active': isActive(item.path) }"
                    >
                        {{ item.label }}
                    </router-link>

                    <span class="nav-divider"></span>

                    <button type="button" class="icon-btn" :title="themeTitle" @click="handleTheme">
                        <el-icon>
                            <component :is="dark ? 'Sunny' : 'Moon'" />
                        </el-icon>
                    </button>

                    <template v-if="loggedIn">
                        <el-button class="logout-btn" @click="handleLogout">退出登录</el-button>
                    </template>
                    <template v-else>
                        <span class="nav-item" @click="goLogin">登录</span>
                        <el-button type="primary" class="register-btn" @click="goRegister">注册</el-button>
                    </template>
                </nav>

                <!-- 窄屏菜单 -->
                <button type="button" class="menu-btn" title="菜单" @click="menuVisible = true">
                    <el-icon><Menu /></el-icon>
                </button>
            </div>
        </header>

        <!-- 页面内容 -->
        <main class="front-main">
            <router-view v-slot="{ Component }">
                <Transition name="page" mode="out-in">
                    <component :is="Component" />
                </Transition>
            </router-view>
        </main>

        <!-- 底部 -->
        <footer class="front-footer">
            © 2026 心理健康AI助手. 保留所有权利.
        </footer>

        <!-- 窄屏抽屉菜单 -->
        <el-drawer v-model="menuVisible" direction="rtl" size="240px" :with-header="false">
            <div class="menu-body">
                <router-link
                    v-for="item in navItems"
                    :key="item.path"
                    :to="item.path"
                    class="menu-link"
                    :class="{ 'is-active': isActive(item.path) }"
                    @click="menuVisible = false"
                >
                    {{ item.label }}
                </router-link>

                <div class="menu-actions">
                    <el-button v-if="loggedIn" class="logout-btn" @click="handleLogout">退出登录</el-button>
                    <template v-else>
                        <el-button @click="goLogin">登录</el-button>
                        <el-button type="primary" @click="goRegister">注册</el-button>
                    </template>
                </div>
            </div>
        </el-drawer>
    </div>
</template>
<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { logout } from '@/api/admin'
import { getTheme, toggleTheme } from '@/utils/theme'
import robotIcon from '@/assets/images/daai.jpeg'

const router = useRouter()
const route = useRoute()

const menuVisible = ref(false)
const dark = ref(getTheme() === 'dark')
const themeTitle = computed(() => (dark.value ? '切换到浅色模式' : '切换到深色模式'))

//当前是否已登录，登录/退出后导航栏跟着切换
const loggedIn = ref(Boolean(localStorage.getItem('token')))

//登录态可能被接口拦截器清掉（token 过期），切页面时重新读一次，避免导航栏显示错误状态
watch(
    () => route.fullPath,
    () => {
        loggedIn.value = Boolean(localStorage.getItem('token'))
    }
)

//导航项：未登录只露出首页和知识库
const navItems = computed(() => {
    const items = [{ path: '/', label: '首页' }]
    if (loggedIn.value) {
        items.push({ path: '/consultation', label: 'AI咨询' }, { path: '/emotion-diary', label: '情绪日记' })
    }
    items.push({ path: '/knowledge', label: '知识库' })
    return items
})

//当前所在功能的导航高亮：首页精确匹配，其余页面带子路径也算（如 /knowledge/xxx）
const isActive = (path) => {
    if (path === '/') return route.path === '/'
    return route.path === path || route.path.startsWith(`${path}/`)
}

/* ---------- 导航滑块 ---------- */
const navRef = ref(null)
const indicator = ref({ left: 0, width: 0, visible: false })

const indicatorStyle = computed(() => ({
    transform: `translateY(-50%) translateX(${indicator.value.left}px)`,
    width: `${indicator.value.width}px`,
    opacity: indicator.value.visible ? 1 : 0
}))

//测量当前高亮项的位置和宽度，让滑块滑过去
const updateIndicator = async () => {
    await nextTick()
    const el = navRef.value?.querySelector('.nav-item.is-active')
    if (!el) {
        indicator.value = { ...indicator.value, visible: false }
        return
    }
    indicator.value = { left: el.offsetLeft, width: el.offsetWidth, visible: true }
}

watch(() => route.fullPath, updateIndicator)
//登录/退出后导航项会增删，尺寸跟着变
watch(loggedIn, updateIndicator)
onMounted(() => {
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
})
onBeforeUnmount(() => window.removeEventListener('resize', updateIndicator))

/* ---------- 主题 ---------- */
const handleTheme = () => {
    dark.value = toggleTheme() === 'dark'
}

/* ---------- 菜单动作 ---------- */
const goLogin = () => {
    menuVisible.value = false
    router.push('/auth/login')
}

const goRegister = () => {
    menuVisible.value = false
    router.push('/auth/register')
}

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
        menuVisible.value = false
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
    background: var(--bg-page);
    transition: background-color var(--dur-normal) ease;
}

/* ---------- 顶部导航 ---------- */
.front-header {
    height: 76px;
    background: var(--bg-header);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    transition: background-color var(--dur-normal) ease, border-color var(--dur-normal) ease;
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
        color: var(--text-1);
        letter-spacing: 0.5px;
    }
}

.nav-links {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;

    /* 跟随当前功能的滑块 */
    .nav-indicator {
        position: absolute;
        top: 50%;
        left: 0;
        height: 32px;
        border-radius: var(--radius-sm);
        background: var(--brand-100);
        pointer-events: none;
        z-index: 0;
        transition:
            transform 0.34s var(--ease-out),
            width 0.34s var(--ease-out),
            opacity var(--dur-fast) ease;
    }

    .nav-item {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        height: 32px;
        padding: 0 12px;
        border-radius: var(--radius-sm);
        font-size: 15px;
        color: var(--text-1);
        cursor: pointer;
        text-decoration: none;
        transition: color var(--dur-fast) ease, background-color var(--dur-fast) ease;

        &:hover:not(.is-active) {
            color: var(--brand-600);
            background: var(--bg-subtle);
        }

        /* 背景交给滑块，这里只改文字 */
        &.is-active {
            color: var(--brand-600);
            font-weight: 600;
        }
    }

    .nav-divider {
        width: 1px;
        height: 18px;
        margin: 0 6px;
        background: var(--border-strong);
    }

    .icon-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-2);
        font-size: 16px;
        cursor: pointer;
        transition: color var(--dur-fast) ease, background-color var(--dur-fast) ease;

        &:hover {
            color: var(--brand-600);
            background: var(--bg-subtle);
        }
    }

    .register-btn {
        height: 34px;
        padding: 0 18px;
        border-radius: 6px;
        font-size: 14px;
    }

    .logout-btn {
        height: 34px;
        padding: 0 18px;
        border-radius: 6px;
        font-size: 14px;
        background: transparent;
        border: 1px solid var(--border-strong);
        color: var(--text-1);

        &:hover,
        &:focus {
            background: var(--bg-card);
            border-color: var(--brand-300);
            color: var(--brand-600);
        }
    }
}

.menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-1);
    font-size: 18px;
    cursor: pointer;
}

/* ---------- 窄屏抽屉菜单 ---------- */
.menu-body {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .menu-link {
        padding: 12px 14px;
        border-radius: var(--radius-md);
        font-size: 15px;
        color: var(--text-1);
        text-decoration: none;

        &:hover {
            background: var(--bg-subtle);
        }

        &.is-active {
            background: var(--brand-100);
            color: var(--brand-600);
            font-weight: 600;
        }
    }

    .menu-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 16px;

        .el-button {
            margin-left: 0;
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
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-footer);
    color: rgba(255, 255, 255, 0.75);
    font-size: 12px;
    letter-spacing: 0.3px;
}

/* ---------- 页面切换过渡 ---------- */
.page-enter-active,
.page-leave-active {
    transition: opacity var(--dur-fast) ease, transform var(--dur-fast) ease;
}

.page-enter-from {
    opacity: 0;
    transform: translateY(6px);
}

.page-leave-to {
    opacity: 0;
}

/* 系统开启"减少动态效果"时关掉过渡 */
@media (prefers-reduced-motion: reduce) {
    .nav-indicator,
    .page-enter-active,
    .page-leave-active {
        transition: none;
    }
}

/* ---------- 窄屏适配 ---------- */
@media (max-width: 900px) {
    .header-inner {
        padding: 0 16px;
    }

    .brand-name {
        font-size: 16px;
    }

    .nav-links {
        display: none;
    }

    .menu-btn {
        display: flex;
    }
}

@media (min-width: 901px) and (max-width: 1024px) {
    .header-inner {
        padding: 0 24px;
    }

    .nav-links {
        gap: 2px;

        .nav-item {
            padding: 0 8px;
            font-size: 14px;
        }
    }
}
</style>

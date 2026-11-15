import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import BackendLayout from '@/components/BackendLayout.vue'
import AuthLayout from '@/components/AuthLayout.vue'

//userType: 1 普通用户（前台），2 管理员（后台）
const ADMIN_USER_TYPE = 2
//配置路由
const backendRoutes = [
    {
        path: '/',
        redirect: '/auth/login'
    },
    {
        path: '/back',
        component: BackendLayout,
        redirect: '/back/dashboard',
        children: [
            {
                path: '/back/dashboard',
                component: () => import('@/views/dashboard.vue'),
                meta: {
                    title: '数据分析',
                    icon: 'PieChart'
                }
            },
            {
                path: '/back/knowledge',
                component: () => import('@/views/knowledge.vue'),
                meta: {
                    title: '知识文章',
                    icon: 'ChatLineSquare'
                }
            },
            {
                path: '/back/consultations',
                component: () => import('@/views/consultations.vue'),
                meta: {
                    title: '咨询记录',
                    icon: 'Message'
                }
            },
            {
                path: '/back/emotions',
                component: () => import('@/views/emotions.vue'),
                meta: {
                    title: '情绪日志',
                    icon: 'User'
                }
            }
        ]

    },
    {
        path: '/auth',
        component: AuthLayout,
        redirect: '/auth/login',
        children: [
            {
                path: '/auth/login',
                component: () => import('@/views/login.vue'),
                meta: {
                    title: '登录',
                }
            },
            {
                path: '/auth/register',
                component: () => import('@/views/register.vue'),
                meta: {
                    title: '注册',
                }
            }
        ]
    },
    // 未匹配到的路径统一回到登录页，避免白屏
    {
        path: '/:pathMatch(.*)*',
        redirect: '/auth/login'
    }
]
const router = createRouter({
    history: createWebHistory(),  // 使用HTML5 History模式，URL不带 # 号
    routes: backendRoutes
})

//读取本地登录态
const getAuthState = () => {
    const token = localStorage.getItem('token')
    let userInfo = null
    try {
        userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null')
    } catch {
        userInfo = null
    }
    return {
        token,
        isAdmin: Number(userInfo?.userType) === ADMIN_USER_TYPE
    }
}

const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
}

//前置守卫：区分前后台用户
router.beforeEach((to) => {
    const { token, isAdmin } = getAuthState()

    //登录/注册页：已登录的管理员直接进后台，不用重复登录
    if (to.path.startsWith('/auth')) {
        return token && isAdmin ? '/back/dashboard' : true
    }

    //未登录：跳到登录页，并记住原本要去的地址
    if (!token) {
        return { path: '/auth/login', query: { redirect: to.fullPath } }
    }

    //已登录但不是管理员（userType !== 2）：不允许进入后台
    if (!isAdmin) {
        clearAuth()
        ElMessage.error('该账号没有管理端权限')
        return '/auth/login'
    }

    return true
})

export default router
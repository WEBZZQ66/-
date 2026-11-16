import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import BackendLayout from '@/components/BackendLayout.vue'
import AuthLayout from '@/components/AuthLayout.vue'
import FrontendLayout from '@/components/FrontendLayout.vue'

//userType: 1 普通用户（前台），2 管理员（后台）
const ADMIN_USER_TYPE = 2
//配置路由
const routes = [
    //用户端：共用 FrontendLayout（页头 + router-view + footer）
    //meta 写在子路由上，父级不写，避免 public 被所有子页面继承
    {
        path: '/',
        component: FrontendLayout,
        children: [
            {
                path: '',
                component: () => import('@/views/front/Home.vue'),
                meta: {
                    title: '首页',
                    public: true
                }
            },
            {
                path: 'consultation',
                component: () => import('@/views/front/consultation.vue'),
                meta: {
                    title: 'AI咨询',
                    requiresAuth: true
                }
            },
            {
                path: 'emotion-diary',
                component: () => import('@/views/front/emotionDiary.vue'),
                meta: {
                    title: '情绪日记',
                    requiresAuth: true
                }
            },
            {
                path: 'knowledge',
                component: () => import('@/views/front/knowledge.vue'),
                meta: {
                    title: '知识库',
                    public: true
                }
            },
            {
                path: 'knowledge/:id',
                component: () => import('@/views/front/articleDetail.vue'),
                meta: {
                    title: '文章详情',
                    public: true
                }
            }
        ]
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
    routes
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
    //公开页面（用户端首页等）不做登录校验
    if (to.meta?.public) return true

    const { token, isAdmin } = getAuthState()

    //登录/注册页：已登录就不必再登录，管理员进后台、普通用户进用户端
    if (to.path.startsWith('/auth')) {
        if (!token) return true
        return isAdmin ? '/back/dashboard' : '/'
    }

    //用户端需要登录的页面：普通用户也可以进，不校验管理员身份
    if (to.meta?.requiresAuth) {
        return token ? true : { path: '/auth/login', query: { redirect: to.fullPath } }
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
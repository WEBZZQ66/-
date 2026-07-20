import { createRouter, createWebHistory } from 'vue-router'
import BackendLayout from '@/components/BackendLayout.vue'
import AuthLayout from '@/components/AuthLayout.vue'
//配置路由
const backendRoutes = [
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
    }
]
const router = createRouter({
    history: createWebHistory(),  // 使用HTML5 History模式，URL不带 # 号
    routes: backendRoutes
})
export default router
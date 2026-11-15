<template>
    <div class="navbar">
        <div class="flex-box">
            <el-button @click="handleCollapse">
                <el-icon>
                    <Expand />
                </el-icon>
            </el-button>
            <p class="page-title">{{ pageTitle }}</p>
        </div>
        <div class="flex-box">
            <el-dropdown @command="handleCommand">
                <div class="flex-box">
                    <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                    <p>admin</p>
                    <el-icon>
                        <ArrowDown />
                    </el-icon>
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="logout">
                            <el-icon><SwitchButton /></el-icon>
                            退出登录
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
    </div>
</template>
<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { logout } from '@/api/admin'
import { useAdminStore } from '@/stores/admin'

const route = useRoute()
const router = useRouter()

// 标题跟随当前路由的 meta.title，切换菜单时自动变化
const pageTitle = computed(() => route.meta?.title ?? '')

// 折叠侧边栏
const handleCollapse = () => {
    useAdminStore().toggleCollapse()
}
// 退出登录
const handleCommand = async (command) => {
    if (command !== 'logout') return

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
        ElMessage.success('已退出登录')
        router.push('/auth/login')
    }
}
</script>
<style lang="scss" scoped>
.navbar {
    height: 100%;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 15px;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    border-bottom: 1px solid #e5e7ed;

    .flex-box {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .page-title {
        font-size: 26px;
        font-weight: bold;
        margin-left: 20px;
        color: #1f2937;
    }
}
</style>

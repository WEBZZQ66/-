<template>
    <div class="bg">
        <el-aside :width="isCollapse ? '64px' : '254px'">
            <el-menu class="main-menu" :collapse="isCollapse" :collapse-transition="false" default-active="2"
                @select="handleSelect">
                <div class="brand">
                    <el-image v-show="!isCollapse"
                        style="width: 80px; height: 80px; border-radius: 20%;margin-right: 10px;" :src="iconU"
                        alt="logo" />
                    <div v-show="!isCollapse" class="info-card">
                        <h1 class="brand-title">大爱同学</h1>
                        <p class="brand-subtitle">天地一家大爱盟</p>
                    </div>
                </div>
                <el-menu-item class="menu-item"
                    v-for="(item, index) in router.options.routes[0].children.filter(child => child.path !== '')"
                    :key="item.path" :index="item.path">
                    <el-icon>
                        <component :is="item.meta.icon" />
                    </el-icon>
                    <span>{{ item.meta.title }}</span>
                </el-menu-item>
            </el-menu>
        </el-aside>
    </div>
</template>


<script setup>
const iconU = new URL('@/assets/images/daai.jpeg', import.meta.url).href
import { useRouter } from 'vue-router'
import { useAdminStore } from '@/stores/admin'
import { computed } from 'vue'

const isCollapse = computed(() => useAdminStore().iscollapse)

const router = useRouter()// 获取路由实例
console.log(router, 'routers')// 处理菜单选择事件
const handleSelect = (index) => {// index 是被选中菜单项的路径
    console.log(index)
    router.push(index)
}
</script>


<style lang="scss" scoped>
.bg {
    height: 100%;
    background-color: #fff;
}

.main-menu {
    height: 100%;
    background-color: #fff;


    .brand {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 10px;
        background-color: #fff;
        border-bottom: 1px solid #e5e7eb;

        .info-card {
            .brand-title {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 5px;
                color: #1f2937;
                border-bottom: 1px solid black;
            }

            .brand-subtitle {
                font-size: 14px;
                color: #6b7280;
            }
        }
    }
}
</style>

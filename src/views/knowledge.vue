<template>
    <div>
        <PageHead title="知识文章">
            <template #buttons>
                <el-button type="primary">新增</el-button>
                <el-button type="primary">编辑</el-button>
            </template>
        </PageHead>
        <TableSearch :formItem="formItem" @search="handleSearch" />
    </div>
</template>
<script setup>
import PageHead from '@/components/PageHead.vue'
import TableSearch from '@/components/TableSearch.vue'
import { categoryTree, articlePage } from '@/api/admin'
import { ref, onMounted, reactive } from 'vue'

const formItem = [
    {
        comp: 'input',
        label: '文章标题',
        prop: 'title',
        placeholder: '请输入标题'
    },
    {
        comp: 'select',
        label: '分类',
        prop: 'categoryId',
        placeholder: '请选择分类',

    },
    {
        comp:'select',
        label:'状态',
        prop:'status',
        placeholder:'请选择状态',
        options:[{label:'草稿',value:0},{label:'已发布',value:1},{label:'已下线',value:2}]
    }
]

//分页参数
const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
})
const handleSearch = (form) => {
    console.log(form, '查询参数')
    articlePage(pagination).then(data => {
        console.log(data, '分页数据')
        // 处理返回的数据
    })
}

//分类映射
const categoryMap = reactive({})
//分类列表
const categoies = ref([])

onMounted(async () => {
    const data = await categoryTree()

    categoies.value = data.map(item => {
        categoryMap[item.id] = item.categoryName
        return {
            label: item.categoryName,
            value: item.id
        }
    })
    formItem[1].options = categoies.value
})
</script>

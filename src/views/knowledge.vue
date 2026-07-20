<template>
    <div>
        <PageHead title="知识文章">
            <template #buttons>
                <el-button type="primary">新增</el-button>
                <el-button type="primary">编辑</el-button>
            </template>
        </PageHead>
        <TableSearch :formItem="formItem" @search="handleSearch" />
        <el-table :data="tableData" style="width: 100%;margin-top: 25px;">
            <el-table-column label="文章标题" fixed="left">
                <template #default="scope">
                    <div style="display: flex;align-items: center;">
                        <el-icon><timer /></el-icon>
                        <span>{{scope.row.title}}</span>
                    </div>    
                </template>    
            </el-table-column>
            <el-table-column label="分类" width="200">
                <template #default="scope">
                    <div style="display: flex;align-items: center;">
                        <el-icon><timer /></el-icon>
                        <span>{{categoryMap[scope.row.categoryId]}}</span>
                    </div>    
                </template>    
            </el-table-column>
            <el-table-column prop="authorName" label="作者" width="150" />
            <el-table-column prop="readCount" label="阅读量" width="150" />
            <el-table-column prop="publishedAt" label="发布时间" width="150"/>
            <el-table-column label="操作" width="300" fixed="right">
                <template #default="scope">
                    <el-button text type="primary">编辑</el-button>
                    <el-button v-if="scope.row.status === 0||scope.row.status === 2" text type="success">发布</el-button>
                    <el-button v-if="scope.row.status === 1" text type="warning">下线</el-button>
                    <el-button text type="danger">删除</el-button> 
                </template>    
            </el-table-column>
        </el-table>
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
   currentPage: 1,
   size: 10,
   total: 0,
})
//表格数据
const tableData = ref([])

const handleSearch = async(formData) => {
    console.log(formData, '查询参数')

    const params = {
        ...formData,
        ...pagination
    }
    const {records, total} = await articlePage(params)
    tableData.value = records
    
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
    //获取文章列表
    handleSearch()
})
</script>

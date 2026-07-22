<template>
  <el-dialog
    :title="isEdit ? '编辑文章' : '创建文章'"
    v-model="dialogVisible"
    width="50%"
    @close="handleClose"
  >
  <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
    <el-form-item label="文章标题" prop="title">
      <el-input v-model="formData.title" placeholder="请输入标题" maxlength="200" show-word-limit clearable></el-input>
    </el-form-item>
    <el-form-item label="所属分类" prop="categoryId">
      <el-select v-model="formData.categoryId" placeholder="请选择分类">
        <el-option
          v-for="item in props.categories"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="文章摘要" prop="summary">
      <el-input type="textarea" v-model="formData.summary" placeholder="请输入摘要(可选)" maxlength="1000" show-word-limit clearable :rows="4"></el-input>
    </el-form-item>
    <el-form-item label="标签" prop="tags">
      <el-select type="" v-model="formData.tagArray" placeholder="请输入文章标签" multiple filterable allow-create style="width: 100%;" clearable>
        <el-option v-for="tag in commonTags" :key="tag" :value="tag" :label="tag"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="封面图片">
      <div class="cover-wrapper">
        <!-- 自定义上传方法 -->
        <el-upload
          class="avatar-uploader"
          action="#"
          :before-upload="beforeUpload"
          :http-request="handleUploadRequest"
          :show-file-list="false"
          accept="image/*"
        >
        <div v-if="!urlImg" class="cover-placeholder">
          <p>点击上传封面</p>
        </div>
        <img class="cover-image" v-else :src="urlImg" alt="封面图片"/>
      </el-upload>
      <div v-if="urlImg" class="cover-remove">
        <el-button type="danger" size="small" @click="handleRemove">移除封面</el-button>
      </div>
      </div>
    </el-form-item>
    <el-form-item label="文章内容" prop="content">
      <RichTextEditor 
      v-model="formData.content"
      placeholder="请输入文章内容,支持富文本格式\n\n可以使用加粗、斜体、下划线、列表、标题等格式来丰富文章内容。"
      :maxCharCount="5000"
      min-height="400px"
      @change="handleContentChange"
      @created="handleEditorCreated" />
    </el-form-item>
  </el-form>
  <div v-show="btnPreview">
    <h3>内容预览</h3>
    <div v-html="formData.content" style="border: 1px solid #ccc; padding: 10px; margin-top: 10px;"></div>
  </div>
  <template #footer>
    <el-button @click="btnPreview = !btnPreview">{{ btnPreview ? '隐藏效果' : '预览效果' }}</el-button>
    <el-button type="primary" @click="handleSubmit" :loading="loading">创建文章</el-button>
    <el-button type="primary" @click="handleClose">取消</el-button>
  </template>
  </el-dialog>
</template>

<script setup>
import { ref,reactive, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { uploadFile,createArticle } from '@/api/admin'
import { filebaseUrl } from '@/config/index.js'
import RichTextEditor from '@/components/RichTextEditor.vue'
//定义事件
const emit = defineEmits(['update:modelValue', 'success'])

const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => {
        emit('update:modelValue', val)
    }
})
//判断是否为编辑模式
const isEdit= computed(()=>!!props.article?.id)

const handleClose = () => {} 

const props = defineProps({
    modelValue: {
        type: Boolean,
        default: false
    },
    categories: {
       type: Array,
      default: ()=>[]
    },
    article: {
        type: Object,
        default: null
    }

})

 

const formData = reactive({
    "title": "",
    "content": "",
    "coverImage": "",
    "categoryId": 1,
    "summary": "",
    "tags": "",
    "id": ""
})
const rules = reactive({
    title: [
        { required: true, message: '请输入文章标题', trigger: 'blur' },
        { max: 200, message: '标题长度不能超过200个字符', trigger: 'blur' }
    ],
    categoryId: [
        { required: true, message: '请选择分类', trigger: 'change' }
    ],
    content: [
        { required: true, message: '请输入文章内容', trigger: 'blur' },
        { max: 5000, message: '文章内容长度不能超过5000个字符', trigger: 'blur' }
    ]
})
const commonTags = [ "情绪管理", "焦虑", "抑郁", "压力", "人际关系", "自我成长", "工作压力睡眠", "心理疾病", "心理治疗", "心理咨询" , "工作压力", "学习方法", "生活技巧"]

//上传
const urlImg=ref('')

const beforeUpload = (file)=>{
  //针对上传文件进行校验
  const isImage =file.type.startsWith('image/') //校验文件类型
  const isLt5M=file.size/1024/1024<5 //校验文件大小
  if(!isImage){
    ElMessage.error('只能上传图片文件')
    return false
  }
  if(!isLt5M){
    ElMessage.error('图片大小不能超过5MB')
    return false
  }
  return true
}
//上传封面接口联调
const handleUploadRequest=async({file})=>
{
  //生成uuid
  const businessId = crypto.randomUUID()

  const fileRes=await uploadFile(file,{
    businessId:businessId
  })
  console.log(fileRes)
  //拼接图片文件地址
  urlImg.value=filebaseUrl+fileRes.filePath
  formData.coverImage = fileRes.filePath
}
//移除封面方法
const handleRemove=()=>{
  urlImg.value=''
  formData.coverImage=''
}
//监听富文本内容变化
const handleContentChange=(data)=>{
  formData.content=data.html
}
//定义一初始值
const editorInstance = ref(null)
const handleEditorCreated=(editor)=>{
  editorInstance.value = editor
  //编辑
  if(formData.content && editor){
    nextTick(()=>{
      editor.setHtml(formData.content)
    })
  }
}
const btnPreview = ref(false)

//提交文章
const formRef = ref()
const loading = ref(false)
const handleSubmit = () => {
  formRef.value.validate(async (valid, fields) => {
    if (!valid) return
    loading.value = true
    console.log('提交的表单信息',formData)
    const submitData = {
      ...formData,
      tags: formData.tagArray.join(',')
    }
    delete submitData.tagArray
    createArticle(submitData).then(res=>{
      emit('success')
      loading.value = false
    })
  })
}
</script>

<style lang="scss" scoped>
.cover-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.cover-placeholder{
  width: 200px;
  height: 120px;
  display:flex ;
  flex-direction: column;
  align-items:center;
  justify-content: center;
  color: #8b949e;
  background: #f6f8fa;
}
.cover-image{
  width: 200px;
  height: 120px;
  display: block;
}

</style>
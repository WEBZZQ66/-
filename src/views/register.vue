<template>
  <div class="container">
    <div class="title">
      <div class="back-home" @click="router.push('/')">
        <el-icon>
          <Back />
        </el-icon>
        <span>返回首页</span>
      </div>
      <div class="title-text">
        <h2>创建您的账户</h2>
        <p>填写以下信息完成注册</p>
      </div>
    </div>

    <div class="form-container">
      <el-form ref="ruleFormRef" :model="formData" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" size="large" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" size="large" placeholder="请输入邮箱" />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="昵称" prop="nickname">
            <el-input v-model="formData.nickname" size="large" placeholder="选填" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="formData.phone" size="large" placeholder="选填" />
          </el-form-item>
        </div>

        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="formData.gender">
            <el-radio :value="1">男</el-radio>
            <el-radio :value="2">女</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="formData.password"
            size="large"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="formData.confirmPassword"
            size="large"
            type="password"
            show-password
            placeholder="请再次输入密码"
          />
        </el-form-item>

        <el-form-item>
          <el-button class="btn" type="primary" size="large" :loading="submitting" @click="submitForm(ruleFormRef)">
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer">
        <p>已有账户？<router-link to="/auth/login">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { register } from '@/api/admin'

const ruleFormRef = ref()
const router = useRouter()
const submitting = ref(false)

const formData = reactive({
  username: '',
  email: '',
  nickname: '',
  phone: '',
  gender: null,
  password: '',
  confirmPassword: ''
})

//两次密码一致性校验
const validateConfirmPassword = (_rule, value, callback) => {
  if (!value) return callback(new Error('请再次输入密码'))
  if (value !== formData.password) return callback(new Error('两次输入的密码不一致'))
  callback()
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度 3-20 位', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ],
  nickname: [{ max: 20, message: '昵称最多 20 个字符', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const submitForm = async (formEl) => {
  if (!formEl) return
  try {
    await formEl.validate()
  } catch {
    return // 校验未通过，表单上已有提示
  }

  submitting.value = true
  try {
    await register({
      username: formData.username.trim(),
      email: formData.email.trim(),
      //昵称、手机号非必填，为空就不传，避免后端存成空串
      nickname: formData.nickname.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      gender: formData.gender,
      //用户端注册固定为普通用户
      userType: 1
    })
    ElMessage.success('注册成功，请登录')
    router.push('/auth/login')
  } catch {
    //失败提示已由 request.js 的响应拦截器统一弹出
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  width: 420px;
  /* 内容比屏幕高时在自身内部滚动，不把顶部的「返回首页」顶出视口 */
  max-height: 100vh;
  overflow-y: auto;
  padding: 40px 0;
  box-sizing: border-box;
  /* 隐藏滚动条（仍可滚动）：Firefox / 旧 Edge / Chrome 三种写法 */
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  .title {
    .back-home {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 30px;
      cursor: pointer;
      color: #4b5563;

      &:hover {
        color: #4b8bf5;
      }
    }

    .title-text {
      text-align: center;

      h2 {
        font-size: 32px;
        margin-bottom: 10px;
      }

      p {
        font-size: 16px;
        color: #6b7280;
      }
    }
  }

  .form-container {
    margin-top: 24px;

    .form-row {
      display: flex;
      gap: 12px;

      .el-form-item {
        flex: 1;
      }
    }

    .btn {
      width: 100%;
      margin-top: 16px;
    }

    .footer {
      padding: 20px;
      text-align: center;
    }
  }
}
</style>

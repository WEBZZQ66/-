<template>
  <div class="container">
    <div class="title">
      <div class="back-home">
        <el-icon>
          <Back />
        </el-icon>
        <span>返回首页</span>
      </div>
      <div class="title-text">
        <h2>登录您的账户</h2>
        <p>请输入您的登录信息</p>
      </div>
    </div>
    <div class="form-container">
      <el-form ref="ruleFormRef" :model="formData" :rules="rules" label-position="top"> <!-- 校验规则 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" size="large" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="formData.password" size="large" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button class="btn" type="primary" size="large" @click="submitForm(ruleFormRef)">登录</el-button>
        </el-form-item>
      </el-form>
      <div class="footer">
        <p>还没有账户？<router-link to="/auth/register">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { login } from '@/api/admin'
import { useRouter, useRoute } from 'vue-router'

const ruleFormRef = ref()
const router = useRouter()
const route = useRoute()

const formData = reactive({
  username: '',
  password: ''
})
const rules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
})
// 提交表单
const submitForm = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid) => {
    if (valid) {
      login(formData).then(data => {
        //判断token是否存在
        if (!data?.token) {
          return console.log('登录失败')
        }
        //登录成功，保存token和用户信息
        localStorage.setItem('token', data.token)
        localStorage.setItem('userInfo', JSON.stringify(data.userInfo))

        //优先回到被守卫拦下的页面（只接受站内路径）
        const rawRedirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''
        const redirect = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
          ? rawRedirect
          : ''

        //userType: 2 管理员进后台，其它（普通用户）进用户端
        if (Number(data.userInfo?.userType) === 2) {
          router.push(redirect || '/back/dashboard')
        } else {
          //普通用户不允许进后台，redirect 指向 /back 时忽略
          router.push(redirect && !redirect.startsWith('/back') ? redirect : '/')
        }
      })
      // 处理登录逻辑
    } else {
      console.log('error submit!!')
      return false
    }
  })
}
</script>

<style lang="scss" scoped>
.container {
  width: 384px;

  .title {
    .back-home {
      margin-bottom: 60px;
    }

    .title-text {
      text-align: center;

      h2 {
        font-size: 36px;
        margin-bottom: 10px;
      }

      p {
        font-size: 18px;
        color: #6b7280;
      }
    }
  }

  .form-container {
    margin-top: 30px;

    .btn {
      width: 100%;
      margin-top: 40px;
    }

    .footer {
      padding: 30px;
      text-align: center;
    }
  }
}
</style>
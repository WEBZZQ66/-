<template>
  <div class="auth-layout">
    <div class="left-section">
      <div class="content">
        <h2 class="title">大爱同学</h2>
        <p class="text">态度是心的面具</p>
        <div class="taidu">
          <el-image class="taidu-img" :src="taiduImg" alt="态度" />
        </div>
      </div>
    </div>
    <div class="right-section">
      <router-view> </router-view> <!-- 这里是路由视图，显示当前路由对应的组件 -->
    </div>
  </div>
</template>

<script setup>
const taiduImg = new URL('@/assets/images/taidu.png', import.meta.url).href
</script>

<style lang="scss" scoped>
.auth-layout {
  display: flex;

  .left-section {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    background: linear-gradient(90deg, rgb(85, 38, 142) 0%, rgb(42, 14, 78) 100%) rgba(23, 0, 54, 0.95);
    height: 100vh;

    .content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .title {
        margin-bottom: 20px;
        font-size: 40px;
        font-weight: bold;
        color: #fff;
      }

      .text {
        margin-bottom: 20px;
        width: 460px;
        font-size: 20px;
        color: #fff;
        text-align: center;
      }

      .taidu {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 160px;
        height: 160px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%);
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3);
        overflow: hidden;

        .taidu-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          animation: spin 12s linear infinite;
        }
      }
    }
  }

  .right-section {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
    height: 100vh;
    background-color: #fff;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
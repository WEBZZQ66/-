<template>
  <el-form ref="ruleFormRef" :model="formDate">
    <el-row :gutter="24">
      <template v-for="item in formItemAttrs" :key='item.prop'>
        <el-col v-bind="item.col">
          <el-form-item :label="item.label" :prop="item.prop">
            <!--根据 item.comp 的值动态渲染组件-->
            <component v-model="formDate[item.prop]" :is="isComp(item.comp)" :placeholder="item.placeholder">
              <!--如果组件是 select，还需要渲染 options-->
              <template v-if="item.comp === 'select'">
                <el-option label="全部" value=""></el-option>
                <el-option v-for="opt in item.options" :key="opt.value" :label="opt.label"
                  :value="opt.value"></el-option>
              </template>
            </component>
          </el-form-item>
        </el-col>
      </template>
    </el-row>
    <el-row>
      <el-button type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset(ruleFormRef)">重置</el-button>
    </el-row>
  </el-form>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'



// 定义组件的 props
const props = defineProps({
  formItem: {
    type: Array,
    default: () => []
  }
})

const formItemAttrs = computed(() => {
  const { formItem } = props
  formItem.forEach(item => {
    item.col = { xs: 24, sm: 12, md: 8, lg: 6, xl: 6 }
  })
  return formItem
})

//表单数据
const formDate = reactive({})
const isComp = (comp) => {
  return {
    input: 'el-input',
    select: 'el-select'
  }[comp]
}
// 定义组件的 emits
const emit = defineEmits(['search'])
const handleSearch = () => {
  // 触发父组件的 search 事件，并传递表单数据
  emit('search', formDate)
  console.log(formDate, '表单数据')
}
const ruleFormRef = ref()
const handleReset = (formel) => {
  // 重置表单数据
  //先重置表单，再触发查询
  if (!formel) return
  formel.resetFields()
  emit('search', formDate)
}
</script>

<style lang="scss" scoped></style>
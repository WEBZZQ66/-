import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  const iscollapse = ref(false)
  const toggleCollapse = () => {
    iscollapse.value = !iscollapse.value
  }
  return { iscollapse, toggleCollapse }
})
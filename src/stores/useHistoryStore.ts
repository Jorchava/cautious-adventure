import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SpinRecord } from '@/types/game.types'

export const useHistoryStore = defineStore('history', () => {
  const records = ref<SpinRecord[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  return { records, isLoading, error }
})

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ClientHistoryService } from '@/game/services/ClientHistoryService'
import type { HistoryService } from '@/game/services/HistoryService'
import type { SpinRecord } from '@/types/game.types'

export const useHistoryStore = defineStore('history', () => {
  const records = ref<SpinRecord[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let service: HistoryService = new ClientHistoryService()

  function setService(svc: HistoryService): void {
    service = svc
  }

  async function fetchHistory(): Promise<void> {
    error.value = null
    isLoading.value = true
    try {
      records.value = await service.getHistory()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : String(e)
    } finally {
      isLoading.value = false
    }
  }

  async function addRecord(data: Omit<SpinRecord, 'id' | 'timestamp'>): Promise<void> {
    const timestamp = new Date().toISOString()
    const id = crypto.randomUUID()
    const record: SpinRecord = { id, timestamp, ...data }
    records.value.unshift(record)
    try {
      await service.recordSpin({ timestamp, ...data })
    } catch {
      // Graceful degradation: keep the local record even if persistence fails
    }
  }

  return { records, isLoading, error, fetchHistory, addRecord, setService }
})

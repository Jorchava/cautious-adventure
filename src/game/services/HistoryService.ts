import type { SpinRecord } from '@/types/game.types'

export interface HistoryService {
  getHistory(limit?: number): Promise<SpinRecord[]>
  recordSpin(record: Omit<SpinRecord, 'id'>): Promise<SpinRecord>
}

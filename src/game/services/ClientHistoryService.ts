import type { SpinRecord } from '@/types/game.types'
import type { HistoryService } from './HistoryService'

export class ClientHistoryService implements HistoryService {
  constructor(private readonly baseUrl = 'http://localhost:3001') {}

  async getHistory(limit = 10): Promise<SpinRecord[]> {
    const url = `${this.baseUrl}/history?_sort=timestamp&_order=desc&_limit=${limit}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HistoryService.getHistory failed: ${response.statusText}`)
    }
    return response.json()
  }

  async recordSpin(record: Omit<SpinRecord, 'id'>): Promise<SpinRecord> {
    const response = await fetch(`${this.baseUrl}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    })
    if (!response.ok) {
      throw new Error(`HistoryService.recordSpin failed: ${response.statusText}`)
    }
    return response.json()
  }
}

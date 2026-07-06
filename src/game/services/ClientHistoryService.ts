import type { SpinRecord } from '@/types/game.types'
import type { HistoryService } from './HistoryService'

export class ClientHistoryService implements HistoryService {
  constructor(
    private readonly baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'
  ) { }

  async getHistory(limit = 10): Promise<SpinRecord[]> {
    // _limit removed — not supported in json-server v1 (treated as field filter)
    // Slice client-side instead, which is reliable across all versions
    const url = `${this.baseUrl}/history?_sort=-timestamp`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HistoryService.getHistory failed: ${response.statusText}`)
    }
    const all: SpinRecord[] = await response.json()
    return all.slice(0, limit)
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

import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useHistoryStore } from '@/stores/useHistoryStore'
import type { HistoryService } from '@/game/services/HistoryService'
import type { SpinRecord } from '@/types/game.types'

function makeRecord(overrides: Partial<SpinRecord> = {}): SpinRecord {
  return {
    id: '1',
    timestamp: '2026-01-01T00:00:00.000Z',
    bet: 20,
    win: 0,
    freeSpinsAwarded: 0,
    ...overrides,
  }
}

function makeMockService(): HistoryService {
  return {
    getHistory: vi.fn(),
    recordSpin: vi.fn(),
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('initial state', () => {
  it('records is an empty array', () => {
    const store = useHistoryStore()
    expect(store.records).toEqual([])
  })

  it('isLoading is false', () => {
    const store = useHistoryStore()
    expect(store.isLoading).toBe(false)
  })

  it('error is null', () => {
    const store = useHistoryStore()
    expect(store.error).toBeNull()
  })
})

describe('fetchHistory', () => {
  it('sets isLoading to true while the request is in flight', () => {
    let resolvePromise!: (value: SpinRecord[]) => void
    const service = makeMockService()
    service.getHistory = vi.fn().mockReturnValue(new Promise<SpinRecord[]>(resolve => { resolvePromise = resolve }))
    const store = useHistoryStore()
    store.setService(service)
    store.fetchHistory()
    expect(store.isLoading).toBe(true)
    resolvePromise!([])
  })

  it('sets isLoading to false after the request resolves', async () => {
    const service = makeMockService()
    service.getHistory = vi.fn().mockResolvedValue([])
    const store = useHistoryStore()
    store.setService(service)
    await store.fetchHistory()
    expect(store.isLoading).toBe(false)
  })

  it('populates records with the response from the service', async () => {
    const records = [makeRecord({ id: '1' }), makeRecord({ id: '2' })]
    const service = makeMockService()
    service.getHistory = vi.fn().mockResolvedValue(records)
    const store = useHistoryStore()
    store.setService(service)
    await store.fetchHistory()
    expect(store.records).toEqual(records)
  })

  it('sets error to the error message when the service throws', async () => {
    const service = makeMockService()
    service.getHistory = vi.fn().mockRejectedValue(new Error('Network failure'))
    const store = useHistoryStore()
    store.setService(service)
    await store.fetchHistory()
    expect(store.error).toBe('Network failure')
  })

  it('sets isLoading to false even when the service throws', async () => {
    const service = makeMockService()
    service.getHistory = vi.fn().mockRejectedValue(new Error('Network failure'))
    const store = useHistoryStore()
    store.setService(service)
    await store.fetchHistory()
    expect(store.isLoading).toBe(false)
  })

  it('clears any previous error on a successful fetch', async () => {
    const service = makeMockService()
    const store = useHistoryStore()
    store.setService(service)

    service.getHistory = vi.fn().mockRejectedValue(new Error('Previous error'))
    await store.fetchHistory()
    expect(store.error).toBe('Previous error')

    service.getHistory = vi.fn().mockResolvedValue([makeRecord()])
    await store.fetchHistory()
    expect(store.error).toBeNull()
  })
})

describe('addRecord', () => {
  it('prepends the new record to the start of records (most recent first)', async () => {
    const service = makeMockService()
    service.recordSpin = vi.fn().mockResolvedValue(makeRecord({ id: 'new', bet: 50 }))
    const store = useHistoryStore()
    store.setService(service)
    store.records = [makeRecord({ id: 'old', bet: 10 })]
    await store.addRecord({ bet: 50, win: 0, freeSpinsAwarded: 0 })
    expect(store.records[0].bet).toBe(50)
    expect(store.records).toHaveLength(2)
  })

  it('calls recordSpin on the service with the provided data', async () => {
    const service = makeMockService()
    service.recordSpin = vi.fn().mockResolvedValue(makeRecord({ id: 'server-id' }))
    const store = useHistoryStore()
    store.setService(service)
    const data = { bet: 20, win: 100, freeSpinsAwarded: 5 }
    await store.addRecord(data)
    expect(service.recordSpin).toHaveBeenCalledWith(
      expect.objectContaining({ bet: 20, win: 100, freeSpinsAwarded: 5 })
    )
  })

  it('includes a valid ISO timestamp in the data passed to recordSpin', async () => {
    const service = makeMockService()
    service.recordSpin = vi.fn().mockResolvedValue(makeRecord({ id: 'server-id' }))
    const store = useHistoryStore()
    store.setService(service)
    await store.addRecord({ bet: 20, win: 0, freeSpinsAwarded: 0 })
    const callArg = (service.recordSpin as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(callArg.timestamp).toBeDefined()
    expect(() => new Date(callArg.timestamp)).not.toThrow()
    expect(new Date(callArg.timestamp).toISOString()).toBe(callArg.timestamp)
  })

  it('does not remove the record from local state if the service call fails', async () => {
    const service = makeMockService()
    service.recordSpin = vi.fn().mockRejectedValue(new Error('Server error'))
    const store = useHistoryStore()
    store.setService(service)
    await store.addRecord({ bet: 20, win: 0, freeSpinsAwarded: 0 })
    expect(store.records).toHaveLength(1)
    expect(store.records[0].bet).toBe(20)
  })

  it('does not throw when the service call fails (graceful degradation)', async () => {
    const service = makeMockService()
    service.recordSpin = vi.fn().mockRejectedValue(new Error('Server error'))
    const store = useHistoryStore()
    store.setService(service)
    await expect(
      store.addRecord({ bet: 20, win: 0, freeSpinsAwarded: 0 })
    ).resolves.toBeUndefined()
  })
})

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ClientHistoryService } from '@/game/services/ClientHistoryService'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function okResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  })
}

function errorResponse(statusText = 'Internal Server Error') {
  return Promise.resolve({
    ok: false,
    statusText,
  })
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('getHistory', () => {
  it('calls GET with the correct URL using default limit of 10', async () => {
    mockFetch.mockResolvedValue(okResponse([]))
    const service = new ClientHistoryService()
    await service.getHistory()
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/history?_sort=timestamp&_order=desc&_limit=10'
    )
  })

  it('calls GET with the correct URL when limit is specified as 5', async () => {
    mockFetch.mockResolvedValue(okResponse([]))
    const service = new ClientHistoryService()
    await service.getHistory(5)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/history?_sort=timestamp&_order=desc&_limit=5'
    )
  })

  it('returns the parsed JSON array from the response', async () => {
    const records = [
      { id: '1', timestamp: '2026-01-01T00:00:00.000Z', bet: 20, win: 0, freeSpinsAwarded: 0 },
    ]
    mockFetch.mockResolvedValue(okResponse(records))
    const service = new ClientHistoryService()
    const result = await service.getHistory()
    expect(result).toEqual(records)
  })

  it('throws a descriptive error when response.ok is false', async () => {
    mockFetch.mockResolvedValue(errorResponse('Not Found'))
    const service = new ClientHistoryService()
    await expect(service.getHistory()).rejects.toThrow('Not Found')
  })
})

describe('recordSpin', () => {
  it('calls POST to /history', async () => {
    mockFetch.mockResolvedValue(okResponse({ id: '1' }))
    const service = new ClientHistoryService()
    await service.recordSpin({ bet: 20, win: 50, freeSpinsAwarded: 0, timestamp: '2026-01-01T00:00:00.000Z' })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/history',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('sends Content-Type: application/json header', async () => {
    mockFetch.mockResolvedValue(okResponse({ id: '1' }))
    const service = new ClientHistoryService()
    await service.recordSpin({ bet: 20, win: 50, freeSpinsAwarded: 0, timestamp: '2026-01-01T00:00:00.000Z' })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/history',
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  it('sends the record serialized as JSON in the request body', async () => {
    mockFetch.mockResolvedValue(okResponse({ id: '1' }))
    const record = { bet: 20, win: 50, freeSpinsAwarded: 0, timestamp: '2026-01-01T00:00:00.000Z' }
    const service = new ClientHistoryService()
    await service.recordSpin(record)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/history',
      expect.objectContaining({
        body: JSON.stringify(record),
      })
    )
  })

  it('returns the response JSON (which includes the server-generated id)', async () => {
    const created = { id: 'abc-123', bet: 20, win: 50, freeSpinsAwarded: 0, timestamp: '2026-01-01T00:00:00.000Z' }
    mockFetch.mockResolvedValue(okResponse(created))
    const service = new ClientHistoryService()
    const result = await service.recordSpin({ bet: 20, win: 50, freeSpinsAwarded: 0, timestamp: '2026-01-01T00:00:00.000Z' })
    expect(result).toEqual(created)
  })

  it('throws a descriptive error when response.ok is false', async () => {
    mockFetch.mockResolvedValue(errorResponse('Bad Request'))
    const service = new ClientHistoryService()
    await expect(service.recordSpin({ bet: 20, win: 50, freeSpinsAwarded: 0, timestamp: '2026-01-01T00:00:00.000Z' }))
      .rejects.toThrow('Bad Request')
  })
})

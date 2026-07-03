import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAutoplay } from '@/composables/useAutoplay'
import { useGameStore } from '@/stores/useGameStore'
import type { SpinResult } from '@/types/game.types'

const BASE_RESULT: SpinResult = {
  reels: [
    { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
    { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
    { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
    { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
    { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
  ],
  paylines: [],
  scatterCount: 0,
  scatterPositions: [],
  totalWin: 0,
  freeSpinsAwarded: 0,
}

const mockSpin = vi.fn().mockImplementation(async () => {
  const store = useGameStore()
  store.setPhase('SPINNING')
  store.setResult(BASE_RESULT)
  store.setPhase('IDLE')
  return BASE_RESULT
})

vi.mock('@/composables/useGameMachine', () => ({
  useGameMachine: () => ({ spin: mockSpin }),
}))

describe('useAutoplay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockSpin.mockReset()
    mockSpin.mockImplementation(async () => {
      const store = useGameStore()
      store.setPhase('SPINNING')
      store.setResult(BASE_RESULT)
      store.setPhase('IDLE')
      return BASE_RESULT
    })
  })

  it('isActive is false initially', () => {
    const autoplay = useAutoplay()
    expect(autoplay.isActive.value).toBe(false)
  })

  it('start() sets isActive to true', async () => {
    const autoplay = useAutoplay()
    const store = useGameStore()
    store.setPhase('IDLE')
    const promise = autoplay.start(5)
    expect(autoplay.isActive.value).toBe(true)
    autoplay.stop()
    await promise
  })

  it('stop() sets isActive to false', async () => {
    const autoplay = useAutoplay()
    autoplay.stop()
    expect(autoplay.isActive.value).toBe(false)
  })

  it('stops when balance drops below totalBet', async () => {
    const autoplay = useAutoplay()
    const store = useGameStore()
    store.setPhase('IDLE')
    store.balance = 10
    await autoplay.start(5)
    expect(autoplay.isActive.value).toBe(false)
    expect(mockSpin).not.toHaveBeenCalled()
  })

  it('stops when phase transitions to FREE_SPINS_INTRO', async () => {
    const autoplay = useAutoplay()
    const store = useGameStore()
    store.setPhase('IDLE')
    mockSpin.mockImplementationOnce(async () => {
      const store = useGameStore()
      store.setPhase('SPINNING')
      const result: SpinResult = { ...BASE_RESULT, freeSpinsAwarded: 10 }
      store.setResult(result)
      store.setPhase('FREE_SPINS_INTRO')
      return result
    })
    await autoplay.start(5)
    expect(mockSpin).toHaveBeenCalledTimes(1)
    expect(autoplay.isActive.value).toBe(false)
  })

  it('stops when the requested count is reached', async () => {
    const autoplay = useAutoplay()
    const store = useGameStore()
    store.setPhase('IDLE')
    await autoplay.start(5)
    expect(mockSpin).toHaveBeenCalledTimes(5)
    expect(autoplay.isActive.value).toBe(false)
  })

  it('isActive returns to false after all spins complete', async () => {
    const autoplay = useAutoplay()
    const store = useGameStore()
    store.setPhase('IDLE')
    await autoplay.start(5)
    expect(autoplay.isActive.value).toBe(false)
  })

  it('calling start() while already active does nothing', async () => {
    const autoplay = useAutoplay()
    const store = useGameStore()
    store.setPhase('IDLE')
    const promise1 = autoplay.start(5)
    const promise2 = autoplay.start(10)
    await Promise.all([promise1, promise2])
    expect(mockSpin).toHaveBeenCalledTimes(5)
  })
})

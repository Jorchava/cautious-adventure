import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect } from 'vitest'
import { useGameStore } from '@/stores/useGameStore'
import type { PaylineResult, SpinResult } from '@/types/game.types'

describe('useGameStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('initial phase is IDLE', () => {
    const store = useGameStore()
    expect(store.phase).toBe('IDLE')
  })

  it('initial balance is 1000', () => {
    const store = useGameStore()
    expect(store.balance).toBe(1000)
  })

  it('initial bet is { coinsPerLine: 1, linesPlayed: 20, totalBet: 20 }', () => {
    const store = useGameStore()
    expect(store.bet).toEqual({ coinsPerLine: 1, linesPlayed: 20, totalBet: 20 })
  })

  it('setPhase updates phase', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    expect(store.phase).toBe('SPINNING')
  })

  it('updateBalance(+100) adds to balance', () => {
    const store = useGameStore()
    store.updateBalance(100)
    expect(store.balance).toBe(1100)
  })

  it('updateBalance(-50) subtracts from balance', () => {
    const store = useGameStore()
    store.updateBalance(-50)
    expect(store.balance).toBe(950)
  })

  it('updateBalance(-999999) does not go below 0', () => {
    const store = useGameStore()
    store.updateBalance(-999999)
    expect(store.balance).toBe(0)
  })

  it('canSpin is true when phase === IDLE and balance >= totalBet', () => {
    const store = useGameStore()
    expect(store.canSpin).toBe(true)
  })

  it('canSpin is false when phase === SPINNING', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    expect(store.canSpin).toBe(false)
  })

  it('canSpin is false when balance < totalBet', () => {
    const store = useGameStore()
    store.updateBalance(-999)
    expect(store.canSpin).toBe(false)
  })

  it('setBetCoin(5) updates coinsPerLine to 5 and totalBet to 100', () => {
    const store = useGameStore()
    store.setBetCoin(5)
    expect(store.bet.coinsPerLine).toBe(5)
    expect(store.bet.totalBet).toBe(100)
  })

  it('setError sets error and phase to ERROR', () => {
    const store = useGameStore()
    store.setError('Network failure')
    expect(store.error).toBe('Network failure')
    expect(store.phase).toBe('ERROR')
  })

  it('resetError clears error to null', () => {
    const store = useGameStore()
    store.setError('Network failure')
    store.resetError()
    expect(store.error).toBeNull()
  })

  it('setResult(null) clears lastResult to null', () => {
    const store = useGameStore()
    store.setResult(null)
    expect(store.lastResult).toBeNull()
  })

  it('setFreeSpins(10) sets freeSpinsRemaining to 10', () => {
    const store = useGameStore()
    store.setFreeSpins(10)
    expect(store.freeSpinsRemaining).toBe(10)
  })

  it('decrementFreeSpins() reduces freeSpinsRemaining by 1', () => {
    const store = useGameStore()
    store.setFreeSpins(5)
    store.decrementFreeSpins()
    expect(store.freeSpinsRemaining).toBe(4)
  })

  it('decrementFreeSpins() does not go below 0', () => {
    const store = useGameStore()
    store.setFreeSpins(0)
    store.decrementFreeSpins()
    expect(store.freeSpinsRemaining).toBe(0)
  })

  it('resetError() does not change the current phase', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    store.resetError()
    expect(store.phase).toBe('SPINNING')
  })

  it('setResult stores the last spin result', () => {
    const store = useGameStore()
    store.setResult({
      reels: [
        { symbols: ['WILD', 'HIGH_A', 'LOW_B'] as const, stopPosition: 5 },
        { symbols: ['LOW_B', 'LOW_A', 'HIGH_B'] as const, stopPosition: 10 },
        { symbols: ['SCATTER', 'LOW_B', 'LOW_A'] as const, stopPosition: 15 },
        { symbols: ['HIGH_A', 'WILD', 'HIGH_B'] as const, stopPosition: 2 },
        { symbols: ['LOW_A', 'HIGH_B', 'WILD'] as const, stopPosition: 8 },
      ] as unknown as SpinResult['reels'],
      paylines: [{ lineIndex: 0, matchCount: 3, symbolId: 'HIGH_A', payout: 50, positions: [[0, 1], [1, 1], [2, 1]] as unknown as PaylineResult['positions'] }],
      scatterCount: 0,
      scatterPositions: [] as unknown as SpinResult['scatterPositions'],
      totalWin: 50,
      freeSpinsAwarded: 0,
    })
    expect(store.lastResult?.totalWin).toBe(50)
  })
})

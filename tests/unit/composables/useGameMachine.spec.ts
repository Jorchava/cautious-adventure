import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useGameMachine } from '@/composables/useGameMachine'
import { useGameStore } from '@/stores/useGameStore'
import type { SpinResult } from '@/types/game.types'
import type { SpinService } from '@/game/services/SpinService'

function makeResult(overrides: Partial<SpinResult> = {}): SpinResult {
  const emptyReel = {
    symbols: ['LOW_B', 'LOW_A', 'HIGH_A'] as const,
    stopPosition: 0,
  }
  return {
    reels: [emptyReel, emptyReel, emptyReel, emptyReel, emptyReel] as unknown as SpinResult['reels'],
    paylines: [],
    scatterCount: 0,
    scatterPositions: [],
    totalWin: 0,
    freeSpinsAwarded: 0,
    ...overrides,
  }
}

function makeMockService(result: SpinResult = makeResult()): SpinService {
  return { requestSpin: vi.fn().mockResolvedValue(result) }
}

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('spin()', () => {
  it('throws when phase is not IDLE', async () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    const machine = useGameMachine(makeMockService())
    await expect(machine.spin()).rejects.toThrow('Invalid transition')
  })

  it('throws when balance < totalBet with a clear message', async () => {
    const store = useGameStore()
    store.updateBalance(-999)
    const machine = useGameMachine(makeMockService())
    await expect(machine.spin()).rejects.toThrow('balance')
  })

  it('deducts totalBet from balance before transitioning', async () => {
    const store = useGameStore()
    const machine = useGameMachine(makeMockService())
    await machine.spin()
    expect(store.balance).toBe(980)
  })

  it('transitions phase from IDLE to SPINNING', async () => {
    const store = useGameStore()
    const machine = useGameMachine(makeMockService())
    await machine.spin()
    expect(store.phase).toBe('SPINNING')
  })

  it('calls spinService.requestSpin with the current bet config', async () => {
    const service = makeMockService()
    const machine = useGameMachine(service)
    const store = useGameStore()
    await machine.spin()
    expect(service.requestSpin).toHaveBeenCalledWith(store.bet)
  })

  it('stores the SpinResult in lastResult via store.setResult', async () => {
    const result = makeResult({ totalWin: 100 })
    const machine = useGameMachine(makeMockService(result))
    const store = useGameStore()
    await machine.spin()
    expect(store.lastResult?.totalWin).toBe(100)
  })

  it('returns the SpinResult (PixiJS will use it for reel stop positions)', async () => {
    const result = makeResult({ totalWin: 50 })
    const machine = useGameMachine(makeMockService(result))
    const returned = await machine.spin()
    expect(returned.totalWin).toBe(50)
  })
})

describe('evaluate()', () => {
  it('throws when phase is not SPINNING', () => {
    const machine = useGameMachine(makeMockService())
    expect(() => machine.evaluate()).toThrow('Invalid transition')
  })

  it('transitions SPINNING → IDLE when totalWin === 0 and freeSpinsAwarded === 0', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    store.setResult(makeResult({ totalWin: 0, freeSpinsAwarded: 0 }))
    const machine = useGameMachine(makeMockService())
    machine.evaluate()
    expect(store.phase).toBe('IDLE')
  })

  it('transitions SPINNING → PAYING when totalWin > 0 and freeSpinsAwarded === 0', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    store.setResult(makeResult({ totalWin: 50, freeSpinsAwarded: 0 }))
    const machine = useGameMachine(makeMockService())
    machine.evaluate()
    expect(store.phase).toBe('PAYING')
  })

  it('transitions SPINNING → FREE_SPINS_INTRO when freeSpinsAwarded > 0', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    store.setResult(makeResult({ totalWin: 0, freeSpinsAwarded: 10 }))
    const machine = useGameMachine(makeMockService())
    machine.evaluate()
    expect(store.phase).toBe('FREE_SPINS_INTRO')
  })

  it('calls store.setFreeSpins with the awarded count before transitioning to FREE_SPINS_INTRO', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    store.setResult(makeResult({ totalWin: 0, freeSpinsAwarded: 10 }))
    const machine = useGameMachine(makeMockService())
    machine.evaluate()
    expect(store.freeSpinsRemaining).toBe(10)
  })
})

describe('completePaying()', () => {
  it('throws when phase is not PAYING', () => {
    const machine = useGameMachine(makeMockService())
    expect(() => machine.completePaying()).toThrow('Invalid transition')
  })

  it('adds lastResult.totalWin to balance', () => {
    const store = useGameStore()
    store.setPhase('PAYING')
    store.setResult(makeResult({ totalWin: 75 }))
    const machine = useGameMachine(makeMockService())
    machine.completePaying()
    expect(store.balance).toBe(1075)
  })

  it('transitions PAYING → IDLE', () => {
    const store = useGameStore()
    store.setPhase('PAYING')
    store.setResult(makeResult({ totalWin: 50 }))
    const machine = useGameMachine(makeMockService())
    machine.completePaying()
    expect(store.phase).toBe('IDLE')
  })
})

describe('beginFreeSpins()', () => {
  it('throws when phase is not FREE_SPINS_INTRO', () => {
    const machine = useGameMachine(makeMockService())
    expect(() => machine.beginFreeSpins()).toThrow('Invalid transition')
  })

  it('transitions FREE_SPINS_INTRO → FREE_SPINNING', () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINS_INTRO')
    const machine = useGameMachine(makeMockService())
    machine.beginFreeSpins()
    expect(store.phase).toBe('FREE_SPINNING')
  })
})

describe('completeFreeSpinRound()', () => {
  it('throws when phase is not FREE_SPINNING', async () => {
    const machine = useGameMachine(makeMockService())
    await expect(machine.completeFreeSpinRound()).rejects.toThrow('Invalid transition')
  })

  it('calls spinService.requestSpin without deducting balance', async () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINNING')
    const service = makeMockService()
    const machine = useGameMachine(service)
    const balanceBefore = store.balance
    await machine.completeFreeSpinRound()
    expect(store.balance).toBe(balanceBefore)
    expect(service.requestSpin).toHaveBeenCalledOnce()
  })

  it('decrements freeSpinsRemaining', async () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINNING')
    store.setFreeSpins(5)
    const machine = useGameMachine(makeMockService())
    await machine.completeFreeSpinRound()
    expect(store.freeSpinsRemaining).toBe(4)
  })

  it('stays in FREE_SPINNING when freeSpinsRemaining > 0 after decrement', async () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINNING')
    store.setFreeSpins(3)
    const machine = useGameMachine(makeMockService())
    await machine.completeFreeSpinRound()
    expect(store.phase).toBe('FREE_SPINNING')
  })

  it('transitions to FREE_SPINS_COMPLETE when freeSpinsRemaining reaches 0', async () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINNING')
    store.setFreeSpins(1)
    const machine = useGameMachine(makeMockService())
    await machine.completeFreeSpinRound()
    expect(store.phase).toBe('FREE_SPINS_COMPLETE')
  })

  it('returns the SpinResult', async () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINNING')
    store.setFreeSpins(3)
    const result = makeResult({ totalWin: 25 })
    const machine = useGameMachine(makeMockService(result))
    const returned = await machine.completeFreeSpinRound()
    expect(returned.totalWin).toBe(25)
  })
})

describe('dismissFreeSpins()', () => {
  it('throws when phase is not FREE_SPINS_COMPLETE', () => {
    const machine = useGameMachine(makeMockService())
    expect(() => machine.dismissFreeSpins()).toThrow('Invalid transition')
  })

  it('transitions FREE_SPINS_COMPLETE → IDLE', () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINS_COMPLETE')
    const machine = useGameMachine(makeMockService())
    machine.dismissFreeSpins()
    expect(store.phase).toBe('IDLE')
  })
})

describe('setError()', () => {
  it('stores the error message', () => {
    const store = useGameStore()
    const machine = useGameMachine(makeMockService())
    machine.setError('Something broke')
    expect(store.error).toBe('Something broke')
  })

  it('transitions any phase to ERROR', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    const machine = useGameMachine(makeMockService())
    machine.setError('Boom')
    expect(store.phase).toBe('ERROR')
  })
})

describe('reset()', () => {
  it('transitions ERROR → IDLE', () => {
    const store = useGameStore()
    store.setPhase('ERROR')
    const machine = useGameMachine(makeMockService())
    machine.reset()
    expect(store.phase).toBe('IDLE')
  })

  it('clears the error string', () => {
    const store = useGameStore()
    store.setError('Something broke')
    const machine = useGameMachine(makeMockService())
    machine.reset()
    expect(store.error).toBeNull()
  })
})

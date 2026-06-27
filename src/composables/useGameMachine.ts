import { useGameStore } from '@/stores/useGameStore'
import { ClientSpinService } from '@/game/services/ClientSpinService'
import type { SpinResult, GamePhase } from '@/types/game.types'
import type { SpinService } from '@/game/services/SpinService'

export function useGameMachine(spinService: SpinService = new ClientSpinService()) {
  const store = useGameStore()

  function assertPhase(expected: GamePhase | GamePhase[]): void {
    const phases = Array.isArray(expected) ? expected : [expected]
    if (!phases.includes(store.phase)) {
      throw new Error(
        `[GameMachine] Invalid transition: expected ${phases.join(' | ')}, ` +
        `current phase is "${store.phase}"`
      )
    }
  }

  async function spin(): Promise<SpinResult> {
    assertPhase('IDLE')
    if (store.balance < store.bet.totalBet) {
      throw new Error(
        `[GameMachine] Insufficient balance: ${store.balance} < ${store.bet.totalBet}`
      )
    }
    store.updateBalance(-store.bet.totalBet)
    store.setPhase('SPINNING')
    const result = await spinService.requestSpin(store.bet)
    store.setResult(result)
    return result
  }

  function evaluate(): void {
    assertPhase('SPINNING')
    const result = store.lastResult
    if (!result) {
      store.setPhase('IDLE')
      return
    }
    if (result.freeSpinsAwarded > 0) {
      store.setFreeSpins(result.freeSpinsAwarded)
      store.setPhase('FREE_SPINS_INTRO')
    } else if (result.totalWin > 0) {
      store.setPhase('PAYING')
    } else {
      store.setPhase('IDLE')
    }
  }

  function completePaying(): void {
    assertPhase('PAYING')
    const result = store.lastResult
    if (result) {
      store.updateBalance(result.totalWin)
    }
    store.setPhase('IDLE')
  }

  function beginFreeSpins(): void {
    assertPhase('FREE_SPINS_INTRO')
    store.setPhase('FREE_SPINNING')
  }

  async function completeFreeSpinRound(): Promise<SpinResult> {
    assertPhase('FREE_SPINNING')
    const result = await spinService.requestSpin(store.bet)
    store.setResult(result)
    store.decrementFreeSpins()
    if (store.freeSpinsRemaining === 0) {
      store.setPhase('FREE_SPINS_COMPLETE')
    }
    return result
  }

  function dismissFreeSpins(): void {
    assertPhase('FREE_SPINS_COMPLETE')
    store.setPhase('IDLE')
  }

  function setError(message: string): void {
    store.setError(message)
  }

  function reset(): void {
    assertPhase('ERROR')
    store.resetError()
    store.setPhase('IDLE')
  }

  return {
    spin,
    evaluate,
    completePaying,
    beginFreeSpins,
    completeFreeSpinRound,
    dismissFreeSpins,
    setError,
    reset,
  }
}

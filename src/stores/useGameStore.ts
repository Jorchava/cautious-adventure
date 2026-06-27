import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { GamePhase, BetConfig, SpinResult } from '@/types/game.types'

export const useGameStore = defineStore('game', () => {
  const phase = ref<GamePhase>('IDLE')
  const balance = ref(1000)
  const bet = ref<BetConfig>({ coinsPerLine: 1, linesPlayed: 20, totalBet: 20 })
  const lastResult = ref<SpinResult | null>(null)
  const freeSpinsRemaining = ref(0)
  const autoplayRemaining = ref(0)
  const error = ref<string | null>(null)

  const canSpin = computed(() =>
    phase.value === 'IDLE' && balance.value >= bet.value.totalBet
  )

  function setPhase(newPhase: GamePhase): void {
    phase.value = newPhase
  }

  function updateBalance(delta: number): void {
    balance.value = Math.max(0, balance.value + delta)
  }

  function setBetCoin(coins: 1 | 2 | 5 | 10): void {
    bet.value = { coinsPerLine: coins, linesPlayed: 20, totalBet: coins * 20 }
  }

  function setResult(result: SpinResult): void {
    lastResult.value = result
  }

  function setError(msg: string): void {
    error.value = msg
    phase.value = 'ERROR'
  }

  function resetError(): void {
    error.value = null
  }

  return {
    phase, balance, bet, lastResult,
    freeSpinsRemaining, autoplayRemaining, error,
    canSpin, setPhase, updateBalance, setBetCoin,
    setResult, setError, resetError,
  }
})

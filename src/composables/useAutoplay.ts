import { ref } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useGameMachine } from '@/composables/useGameMachine'
import type { GamePhase } from '@/types/game.types'

export const AUTOPLAY_OPTIONS = [5, 10, 25] as const
export type AutoplayCount = (typeof AUTOPLAY_OPTIONS)[number]

export function useAutoplay() {
  const store = useGameStore()
  const machine = useGameMachine()

  const isActive = ref(false)
  const remaining = ref(0)

  async function start(count: AutoplayCount): Promise<void> {
    if (isActive.value) return
    isActive.value = true
    remaining.value = count

    while (remaining.value > 0 && isActive.value) {
      if (store.balance < store.bet.totalBet) {
        stop()
        break
      }
      if (
        store.phase === 'FREE_SPINS_INTRO' ||
        store.phase === 'FREE_SPINNING'
      ) {
        stop()
        break
      }

      if (store.phase !== 'IDLE') {
        await waitForIdle()
        continue
      }

      try {
        await machine.spin()
        remaining.value--
        const currentPhase = store.phase as GamePhase
        if (
          currentPhase === 'FREE_SPINS_INTRO' ||
          currentPhase === 'FREE_SPINNING'
        ) {
          stop()
          break
        }
        await waitForIdle()
      } catch {
        stop()
        break
      }
    }

    isActive.value = false
    remaining.value = 0
  }

  function stop(): void {
    isActive.value = false
    remaining.value = 0
  }

  function waitForIdle(): Promise<void> {
    return new Promise((resolve) => {
      if (store.phase === 'IDLE') {
        resolve()
        return
      }
      const interval = setInterval(() => {
        if (
          store.phase === 'IDLE' ||
          !isActive.value ||
          store.phase === 'FREE_SPINS_INTRO' ||
          store.phase === 'FREE_SPINNING'
        ) {
          clearInterval(interval)
          resolve()
        }
      }, 50)
    })
  }

  return { isActive, remaining, start, stop }
}

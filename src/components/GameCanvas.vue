<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePixiApp } from '@/composables/usePixiApp'
import { useGameStore } from '@/stores/useGameStore'
import { useGameMachine } from '@/composables/useGameMachine'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { useAudio } from '@/composables/useAudio'
import { SceneManager } from '@/pixi/SceneManager'
import { LoadingScene } from '@/pixi/scenes/LoadingScene'
import { GameScene } from '@/pixi/scenes/GameScene'
import type { SpinResult, SoundKey } from '@/types/game.types'
import FreeSpinsIntro from '@/components/FreeSpinsIntro.vue'
import FreeSpinsComplete from '@/components/FreeSpinsComplete.vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameStore = useGameStore()
const machine = useGameMachine()
const historyStore = useHistoryStore()
const audio = useAudio()
const { app, isReady } = usePixiApp(canvasRef)

// Bridges the FREE_SPINNING loop: increments when allReelsStopped fires while
// phase stays FREE_SPINNING, because Vue watchers don't re-fire on unchanged values.
const nextFreeSpinSignal = ref(0)

let sceneManager: SceneManager | null = null
let gameScene: GameScene | null = null
let spinStarted = false
let audioPreloaded = false
let freeSpinsAccumulated = 0
let payingInProgress = false

// Scene Initialization
watch(isReady, async (ready) => {
  if (!ready) return
  try {
    sceneManager = new SceneManager(app)
    await sceneManager.switchTo(new LoadingScene())

    gameScene = new GameScene()

    // allReelsStopped has ONE job: tell the FSM the animation is done.
    // The FSM decides what comes next. The signal bridges the FREE_SPINNING
    // loop where phase stays the same across consecutive free spins.
    gameScene.on('allReelsStopped', () => {
      machine.evaluate()
      if (gameStore.phase === 'FREE_SPINNING' && gameStore.freeSpinsRemaining > 0) {
        nextFreeSpinSignal.value++
      }
    })

    await sceneManager.switchTo(gameScene)
  } catch (err) {
    machine.setError(err instanceof Error ? err.message : 'PixiJS init failed')
  }
})

// Phase → PixiJS Bridge
// This is the ONLY phase watcher. Handles all FSM state transitions.
// nextFreeSpinSignal is included so the watcher re-fires during the free
// spins loop even when phase stays FREE_SPINNING.
watch(
  () => [gameStore.phase, gameStore.lastResult, nextFreeSpinSignal.value] as const,
  async ([phase, lastResult]) => {
    if (!gameScene) return

    // SPINNING
    if (phase === 'SPINNING') {
      // Fires twice: once with null result (ignore), once with real result (act).
      if (lastResult && !spinStarted) {
        spinStarted = true
        payingInProgress = false

        // Audio preload deferred to first user gesture (browser autoplay policy).
        // Runs in background — not awaited — so it doesn't delay reel animation.
        if (!audioPreloaded) {
          audioPreloaded = true
          audio.preload()
        }

        gameScene.startSpin(lastResult as SpinResult, app)
        audio.play('reel_spin')
      }
      return
    }

    // Any non-SPINNING phase resets the spinStarted guard for the next cycle.
    spinStarted = false
    audio.stop('reel_spin')

    // PAYING
    if (phase === 'PAYING' && lastResult) {
      // Guard against Vue re-firing the async watcher during the 2-second
      // showWinAnimation await. Without this, completePaying() is called twice:
      // first when phase becomes PAYING, second when lastResult changes mid-await.
      if (payingInProgress) return
      payingInProgress = true

      try {
        const ratio = lastResult.totalWin / gameStore.bet.totalBet
        const winKey: SoundKey = ratio > 20 ? 'win_big'
          : ratio >= 5 ? 'win_medium'
            : 'win_small'
        audio.play(winKey)

        await gameScene.showWinAnimation(lastResult, app, gameStore.bet.totalBet)
        machine.completePaying()

        await historyStore.addRecord({
          bet: gameStore.bet.totalBet,
          win: lastResult.totalWin,
          freeSpinsAwarded: lastResult.freeSpinsAwarded,
        })
      } finally {
        // Always reset — guarantees next spin starts clean even if something throws.
        payingInProgress = false
      }
    }

    // FREE_SPINS_INTRO
    else if (phase === 'FREE_SPINS_INTRO') {
      freeSpinsAccumulated = 0
      audio.play('free_spins_trigger')
      // FreeSpinsIntro overlay appears via v-if on phase.
      // User clicks "Start Spinning" → machine.beginFreeSpins() → FREE_SPINNING.
    }

    // FREE_SPINNING
    else if (phase === 'FREE_SPINNING' && gameStore.freeSpinsRemaining > 0) {
      // Triggered by: initial FREE_SPINNING entry OR nextFreeSpinSignal increment.
      const result = await machine.completeFreeSpinRound()
      if (result && gameScene) {
        freeSpinsAccumulated += result.totalWin
        gameScene.startSpin(result, app)
        audio.play('reel_spin')
      }
    }
  }
)

async function onFreeSpinsCollect(): Promise<void> {
  if (gameStore.lastResult) {
    await historyStore.addRecord({
      bet: gameStore.bet.totalBet,
      win: freeSpinsAccumulated,
      freeSpinsAwarded: 0,
    })
  }
  machine.dismissFreeSpins()
}
</script>

<template>
  <div class="game-canvas-wrapper">
    <canvas ref="canvasRef" />
    <FreeSpinsIntro @continue="machine.beginFreeSpins()" />
    <FreeSpinsComplete @continue="onFreeSpinsCollect" />
  </div>
</template>

<style lang="scss" scoped>
.game-canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0a0a1a;
}

canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: 900px;
  height: 640px;
  object-fit: contain;
}
</style>

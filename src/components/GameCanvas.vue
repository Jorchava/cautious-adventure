<template>
  <!-- // This should be debug only comment on/off -->
  <!-- <div v-if="gameStore.error" style="position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
         background:#1a0000; color:#ff4444; padding:20px; border:1px solid #ff4444;
         z-index:999; font-family:monospace; max-width:600px; word-break:break-all">
    {{ gameStore.error }}
  </div> -->
  <div ref="containerRef" class="game-canvas-wrapper">
    <canvas ref="canvasRef" />
    <FreeSpinsIntro @continue="machine.beginFreeSpins()" />
    <FreeSpinsComplete @continue="onFreeSpinsCollect" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePixiApp } from '@/composables/usePixiApp'
import { useGameStore } from '@/stores/useGameStore'
import { useGameMachine } from '@/composables/useGameMachine'
import { useHistoryStore } from '@/stores/useHistoryStore'
import { SceneManager } from '@/pixi/SceneManager'
import { LoadingScene } from '@/pixi/scenes/LoadingScene'
import { GameScene } from '@/pixi/scenes/GameScene'
import type { SpinResult } from '@/types/game.types'
import FreeSpinsIntro from '@/components/FreeSpinsIntro.vue'
import FreeSpinsComplete from '@/components/FreeSpinsComplete.vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameStore = useGameStore()
const machine = useGameMachine()
const historyStore = useHistoryStore()
const { app, isReady } = usePixiApp(canvasRef)

let sceneManager: SceneManager | null = null
let gameScene: GameScene | null = null

let freeSpinsAccumulated = 0

let spinStarted = false

watch(isReady, async (ready) => {
  if (!ready) return

  try {
    sceneManager = new SceneManager(app)

    const loading = new LoadingScene()
    await sceneManager.switchTo(loading)

    gameScene = new GameScene()
    gameScene.on('allReelsStopped', async () => {
      if (gameStore.phase === 'FREE_SPINNING') {
        machine.evaluate()
        if (gameStore.phase === 'FREE_SPINNING' && gameStore.freeSpinsRemaining > 0) {
          const nextResult = await machine.completeFreeSpinRound()
          freeSpinsAccumulated += nextResult.totalWin
          gameScene!.startSpin(nextResult, app)
        }
      } else if (gameStore.phase !== 'FREE_SPINS_COMPLETE') {
        machine.evaluate()
      }
    })

    await sceneManager.switchTo(gameScene)
  } catch (err) {
    machine.setError(err instanceof Error ? err.message : 'PixiJS init failed')
  }
})

watch(
  () => [gameStore.phase, gameStore.lastResult] as const,
  async ([phase, lastResult]) => {
    // bridge between Pinia state and the PixiJS visual layer debug
    console.log('[watcher] phase:', phase, 'lastResult:', gameStore.lastResult)
    if (!gameScene) return

    if (phase === 'SPINNING') {
      // First trigger: phase=SPINNING, lastResult=null → do nothing
      // Second trigger: phase=SPINNING, lastResult=set → call startSpin
      if (lastResult && !spinStarted) {
        spinStarted = true
        gameScene.startSpin(lastResult as SpinResult, app)
      }
      return
    }

    spinStarted = false // reset for next spin

    if (phase === 'PAYING' && lastResult) {
      await gameScene.showWinAnimation(lastResult)
      machine.completePaying()
      await historyStore.addRecord({
        bet: gameStore.bet.totalBet,
        win: lastResult.totalWin,
        freeSpinsAwarded: lastResult.freeSpinsAwarded,
      })
    } else if (phase === 'FREE_SPINS_INTRO') {
      freeSpinsAccumulated = 0
    } else if (phase === 'FREE_SPINNING' && gameStore.freeSpinsRemaining > 0) {
      const result = await machine.completeFreeSpinRound()
      if (result) {
        freeSpinsAccumulated += result.totalWin
        gameScene.startSpin(result, app)
      }
    }
  },
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

<style lang="scss" scoped>
.game-canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a1a;
}

canvas {
  display: block;
}
</style>

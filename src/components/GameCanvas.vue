<template>
  <div
    ref="containerRef"
    class="game-canvas-wrapper"
  >
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { usePixiApp } from '@/composables/usePixiApp'
import { useGameStore } from '@/stores/useGameStore'
import { useGameMachine } from '@/composables/useGameMachine'
import { SceneManager } from '@/pixi/SceneManager'
import { LoadingScene } from '@/pixi/scenes/LoadingScene'
import { GameScene } from '@/pixi/scenes/GameScene'
import type { SpinResult } from '@/types/game.types'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gameStore = useGameStore()
const machine = useGameMachine()
const { app, isReady } = usePixiApp(canvasRef)

let sceneManager: SceneManager | null = null
let gameScene: GameScene | null = null

watch(isReady, async (ready) => {
  if (!ready) return

  try {
    sceneManager = new SceneManager(app)

    const loading = new LoadingScene()
    await sceneManager.switchTo(loading)

    gameScene = new GameScene()
    gameScene.on('allReelsStopped', () => {
      machine.evaluate()
    })

    await sceneManager.switchTo(gameScene)
  } catch (err) {
    machine.setError(err instanceof Error ? err.message : 'PixiJS init failed')
  }
})

watch(
  () => gameStore.phase,
  async (phase) => {
    if (!gameScene) return

    if (phase === 'SPINNING' && gameStore.lastResult) {
      gameScene.startSpin(gameStore.lastResult as SpinResult, app)
    } else if (phase === 'PAYING' && gameStore.lastResult) {
      await gameScene.showWinAnimation(gameStore.lastResult)
      machine.completePaying()
    }
  },
)
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

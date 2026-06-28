import { ref, onMounted, onUnmounted } from 'vue'
import { Application } from 'pixi.js'
import type { Ref } from 'vue'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/pixi/constants'

export function usePixiApp(canvasRef: Ref<HTMLCanvasElement | null>) {
  const app = new Application()
  const isReady = ref(false)

  onMounted(async () => {
    if (!canvasRef.value) return

    await app.init({
      canvas: canvasRef.value,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      background: '#0a0a1a',
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    isReady.value = true
  })

  onUnmounted(() => {
    app.destroy(true, { children: true, texture: true })
    isReady.value = false
  })

  return { app, isReady }
}

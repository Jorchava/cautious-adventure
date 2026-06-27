<template>
  <canvas ref="canvasRef" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  void canvasRef.value
  // PixiJS will be initialized on canvasRef in Session 3
})
</script>

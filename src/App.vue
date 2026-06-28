<template>
  <div class="app">
    <GameCanvas />
    <div class="ui-layer">
      <SpinButton />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameCanvas from '@/components/GameCanvas.vue'
import SpinButton from '@/components/SpinButton.vue'
</script>

<style lang="scss">
@import '@/assets/styles/main';

.app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a1a;
}

.ui-layer {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
}
</style>

<template>
  <div class="app">
    <GameCanvas class="canvas-layer" />

    <div class="hud">
      <div class="hud-top">
        <BalanceDisplay />
      </div>
      <div class="hud-bottom">
        <BetPanel />
        <SpinButton />
        <button
          class="paytable-toggle"
          @click="paytableRef?.open()"
        >
          ℹ
        </button>
      </div>
    </div>

    <Paytable ref="paytableRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import GameCanvas from '@/components/GameCanvas.vue'
import BalanceDisplay from '@/components/BalanceDisplay.vue'
import BetPanel from '@/components/BetPanel.vue'
import SpinButton from '@/components/SpinButton.vue'
import Paytable from '@/components/Paytable.vue'

const paytableRef = ref<InstanceType<typeof Paytable> | null>(null)
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

.canvas-layer {
  position: absolute;
  inset: 0;
}

.hud {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 32px;
  pointer-events: none;

  & > * {
    pointer-events: auto;
  }
}

.hud-top {
  display: flex;
  justify-content: center;
}

.hud-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.paytable-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #334455;
  background: transparent;
  color: #556677;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    border-color: #00ffff;
    color: #00ffff;
  }
}
</style>

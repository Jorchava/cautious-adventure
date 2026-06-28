<template>
  <button
    class="spin-btn"
    :disabled="!gameStore.canSpin"
    @click="handleSpin"
  >
    {{ gameStore.phase === 'SPINNING' ? 'SPINNING...' : 'SPIN' }}
  </button>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/useGameStore'
import { useGameMachine } from '@/composables/useGameMachine'

const gameStore = useGameStore()
const machine = useGameMachine()

async function handleSpin(): Promise<void> {
  try {
    await machine.spin()
  } catch (err) {
    console.error('Spin failed:', err)
  }
}
</script>

<style lang="scss" scoped>
.spin-btn {
  padding: 16px 48px;
  font-size: 1.25rem;
  font-weight: bold;
  color: #0a0a1a;
  background: #00ffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.1em;

  &:disabled {
    background: #1a3a3a;
    color: #336666;
    cursor: not-allowed;
  }
}
</style>

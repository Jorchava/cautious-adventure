<template>
  <div class="balance-display">
    <div class="balance-item">
      <span class="label">CREDITS</span>
      <span class="value">{{ gameStore.balance.toLocaleString() }}</span>
    </div>
    <Transition name="win-fade">
      <div
        v-if="showWin"
        class="balance-item win"
      >
        <span class="label">WIN</span>
        <span class="value">{{
          gameStore.lastResult?.totalWin.toLocaleString()
        }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

const gameStore = useGameStore()

const showWin = computed(
  () => gameStore.lastResult !== null && gameStore.lastResult.totalWin > 0,
)
</script>

<style lang="scss" scoped>
.balance-display {
  display: flex;
  gap: 32px;
  align-items: center;
}

.balance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .label {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: #556677;
  }

  .value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #e0e0e0;
    min-width: 80px;
    text-align: center;
  }

  &.win .value {
    color: #ffd700;
  }
}

.win-fade-enter-active,
.win-fade-leave-active {
  transition: opacity 0.3s ease;
}

.win-fade-enter-from,
.win-fade-leave-to {
  opacity: 0;
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'
import { useGameMachine } from '@/composables/useGameMachine'
import { useAutoplay, AUTOPLAY_OPTIONS } from '@/composables/useAutoplay'

const gameStore = useGameStore()
const machine = useGameMachine()
const autoplay = useAutoplay()

const canAct = computed(() =>
  autoplay.isActive.value ? true : gameStore.canSpin,
)

const buttonLabel = computed(() => {
  if (autoplay.isActive.value) return `STOP (${autoplay.remaining.value})`
  if (gameStore.phase !== 'IDLE') return gameStore.phase.replace('_', ' ')
  return 'SPIN'
})

async function handleMainClick(): Promise<void> {
  if (autoplay.isActive.value) {
    autoplay.stop()
    return
  }
  try {
    await machine.spin()
  } catch (err) {
    console.error('Spin failed:', err)
  }
}
</script>

<template>
  <div class="spin-control">
    <button
      class="spin-btn"
      :class="{ 'is-stop': autoplay.isActive.value }"
      :disabled="!canAct"
      @click="handleMainClick"
    >
      {{ buttonLabel }}
    </button>

    <div
      v-if="!autoplay.isActive.value"
      class="autoplay-options"
    >
      <button
        v-for="count in AUTOPLAY_OPTIONS"
        :key="count"
        class="auto-btn"
        :disabled="!gameStore.canSpin"
        @click="autoplay.start(count)"
      >
        {{ count }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.spin-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

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

  &.is-stop {
    background: #ff4444;
    color: #ffffff;

    &:hover {
      background: #ff6666;
    }
  }
}

.autoplay-options {
  display: flex;
  gap: 6px;
}

.auto-btn {
  padding: 6px 14px;
  font-size: 0.78rem;
  color: #00ffff;
  background: transparent;
  border: 1px solid #00ffff;
  border-radius: 3px;
  cursor: pointer;

  &:disabled {
    border-color: #334455;
    color: #334455;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: rgba(0, 255, 255, 0.1);
  }
}
</style>

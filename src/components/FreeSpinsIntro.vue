<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

defineEmits<{
  continue: []
}>()

const gameStore = useGameStore()

const visible = computed(() => gameStore.phase === 'FREE_SPINS_INTRO')
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="free-spins-intro"
    >
      <div class="fs-panel">
        <h2 class="fs-title">
          FREE SPINS
        </h2>
        <p class="fs-subtitle">
          {{ gameStore.freeSpinsRemaining }} FREE SPINS AWARDED
        </p>
        <button
          class="fs-start-btn"
          @click="$emit('continue')"
        >
          START SPINNING
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.free-spins-intro {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.fs-panel {
  text-align: center;
  border: 2px solid #00ffff;
  border-radius: 8px;
  padding: 48px 64px;
  background: #0d0d1f;
}

.fs-title {
  font-size: 2rem;
  letter-spacing: 0.2em;
  color: #00ffff;
  margin-bottom: 16px;
}

.fs-subtitle {
  font-size: 1.1rem;
  color: #e0e0e0;
  margin-bottom: 32px;
}

.fs-start-btn {
  padding: 14px 48px;
  font-size: 1rem;
  font-weight: bold;
  color: #0a0a1a;
  background: #00ffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.1em;

  &:hover {
    background: #33ffff;
  }
}
</style>

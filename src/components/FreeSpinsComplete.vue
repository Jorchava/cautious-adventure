<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="free-spins-complete"
    >
      <div class="fs-panel">
        <h2 class="fs-title">
          FREE SPINS COMPLETE
        </h2>
        <p class="fs-win-amount">
          {{ totalWin }}
        </p>
        <button
          class="fs-collect-btn"
          @click="$emit('continue')"
        >
          COLLECT
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

defineEmits<{
  continue: []
}>()

const gameStore = useGameStore()

const visible = computed(() => gameStore.phase === 'FREE_SPINS_COMPLETE')

const totalWin = computed(() => {
  return gameStore.lastResult?.totalWin ?? 0
})
</script>

<style lang="scss" scoped>
.free-spins-complete {
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
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 48px 64px;
  background: #0d0d1f;
}

.fs-title {
  font-size: 1.8rem;
  letter-spacing: 0.15em;
  color: #ffd700;
  margin-bottom: 16px;
}

.fs-win-amount {
  font-size: 2.5rem;
  font-weight: bold;
  color: #ffd700;
  margin-bottom: 32px;
}

.fs-collect-btn {
  padding: 14px 48px;
  font-size: 1rem;
  font-weight: bold;
  color: #0a0a1a;
  background: #ffd700;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.1em;

  &:hover {
    background: #ffe44d;
  }
}
</style>

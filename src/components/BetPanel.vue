<template>
  <div class="bet-panel">
    <button
      class="bet-btn"
      :disabled="!canDecrease"
      @click="decrease"
    >
      −
    </button>

    <div class="bet-values">
      <span class="coin-label">COIN</span>
      <span class="coin-value">{{ gameStore.bet.coinsPerLine }}</span>
      <span class="total-label">BET {{ gameStore.bet.totalBet }}</span>
    </div>

    <button
      class="bet-btn"
      :disabled="!canIncrease"
      @click="increase"
    >
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/useGameStore'

const COIN_OPTIONS = [1, 2, 5, 10] as const
type CoinOption = (typeof COIN_OPTIONS)[number]

const gameStore = useGameStore()

const isIdle = computed(() => gameStore.phase === 'IDLE')
const currentIndex = computed(() =>
  COIN_OPTIONS.indexOf(gameStore.bet.coinsPerLine as CoinOption),
)

const canDecrease = computed(() => isIdle.value && currentIndex.value > 0)
const canIncrease = computed(
  () => isIdle.value && currentIndex.value < COIN_OPTIONS.length - 1,
)

function decrease(): void {
  if (!canDecrease.value) return
  const newCoin = COIN_OPTIONS[currentIndex.value - 1]
  gameStore.setBetCoin(newCoin)
}

function increase(): void {
  if (!canIncrease.value) return
  const newCoin = COIN_OPTIONS[currentIndex.value + 1]
  gameStore.setBetCoin(newCoin)
}
</script>

<style lang="scss" scoped>
.bet-panel {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bet-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #00ffff;
  background: transparent;
  color: #00ffff;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;

  &:disabled {
    border-color: #1a3a3a;
    color: #1a3a3a;
    cursor: not-allowed;
  }
}

.bet-values {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;

  .coin-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: #556677;
  }

  .coin-value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #e0e0e0;
  }

  .total-label {
    font-size: 0.65rem;
    color: #556677;
    letter-spacing: 0.1em;
  }
}
</style>

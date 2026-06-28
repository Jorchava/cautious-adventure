<template>
  <Teleport to="body">
    <Transition name="paytable-fade">
      <div
        v-if="isOpen"
        class="paytable-overlay"
        @click.self="close"
      >
        <div class="paytable-panel">
          <button
            class="close-btn"
            @click="close"
          >
            ✕
          </button>
          <h2 class="title">
            PAYTABLE
          </h2>

          <div class="symbols-grid">
            <div
              v-for="sym in symbolDefs"
              :key="sym.id"
              class="symbol-row"
            >
              <div
                class="symbol-swatch"
                :style="{ background: sym.color }"
              />
              <span class="symbol-name">{{ sym.displayName }}</span>
              <div class="payouts">
                <span
                  v-for="[count, payout] in sym.payoutEntries"
                  :key="count"
                  class="payout-entry"
                >
                  {{ count }}× = {{ payout }}
                </span>
              </div>
            </div>
          </div>

          <div class="scatter-note">
            <strong>SCATTER (Neon Star):</strong>
            3 = 10× bet + 10 free spins &nbsp;|&nbsp; 4 = 20× bet + 15 free
            spins &nbsp;|&nbsp; 5 = 50× bet + 20 free spins
          </div>

          <div class="lines-note">
            20 fixed paylines &middot; Wins pay left to right
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SYMBOL_DEFINITIONS } from '@/game/config/symbols'

const isOpen = ref(false)

const SYMBOL_COLORS: Record<string, string> = {
  WILD: '#ffd700',
  SCATTER: '#ff00ff',
  HIGH_A: '#00ffff',
  HIGH_B: '#ff4444',
  LOW_A: '#44ff44',
  LOW_B: '#4444ff',
}

const symbolDefs = computed(() =>
  SYMBOL_DEFINITIONS.map((sym) => ({
    ...sym,
    color: SYMBOL_COLORS[sym.id] ?? '#ffffff',
    payoutEntries: Object.entries(sym.payouts)
      .map(([k, v]) => [Number(k), v] as [number, number])
      .sort(([a], [b]) => b - a),
  })),
)

function open(): void {
  isOpen.value = true
}
function close(): void {
  isOpen.value = false
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.paytable-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.paytable-panel {
  background: #0d0d1f;
  border: 2px solid #00ffff;
  border-radius: 8px;
  padding: 32px;
  min-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  color: #00ffff;
  font-size: 1.25rem;
  cursor: pointer;
}

.title {
  text-align: center;
  letter-spacing: 0.2em;
  color: #00ffff;
  margin-bottom: 24px;
}

.symbols-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.symbol-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
}

.symbol-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.symbol-name {
  color: #e0e0e0;
  font-size: 0.9rem;
}

.payouts {
  display: flex;
  gap: 12px;
  color: #aaaaaa;
  font-size: 0.8rem;
}

.payout-entry {
  white-space: nowrap;
}

.scatter-note,
.lines-note {
  margin-top: 20px;
  font-size: 0.78rem;
  color: #778899;
  text-align: center;
  line-height: 1.6;
}

.paytable-fade-enter-active,
.paytable-fade-leave-active {
  transition: opacity 0.25s ease;
}
.paytable-fade-enter-from,
.paytable-fade-leave-to {
  opacity: 0;
}
</style>

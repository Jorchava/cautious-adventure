<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useHistoryStore } from '@/stores/useHistoryStore'

const historyStore = useHistoryStore()

// Offline when in production and no backend URL configured
const isOffline = computed(() =>
  !import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL
)

onMounted(async () => {
  await historyStore.fetchHistory()
})
</script>

<template>
  <div class="win-history">
    <h3 class="history-title">
      HISTORY
    </h3>

    <div
      v-if="historyStore.isLoading"
      class="history-loading"
    >
      Loading...
    </div>

    <template v-else-if="historyStore.records.length === 0">
      <!-- Show offline notice in production without backend -->
      <div
        v-if="isOffline"
        class="history-offline"
      >
        <span class="offline-icon">ℹ</span>
        History requires an API backend.

        <a
          href="https://github.com/Jorchava/cautious-adventure#backend-integration"
          class="offline-link"
        >Setup
          guide</a>
      </div>
      <div
        v-else
        class="history-empty"
      >
        No history yet
      </div>
    </template>

    <ul
      v-else
      class="history-list"
    >
      <li
        v-for="record in historyStore.records"
        :key="record.id"
        class="history-row"
        :class="{ 'is-win': record.win > 0 }"
      >
        <span class="record-bet">BET {{ record.bet }}</span>
        <span class="record-win">
          {{ record.win > 0 ? `+${record.win}` : '—' }}
        </span>
      </li>
    </ul>

    <p
      v-if="historyStore.error"
      class="history-error"
    >
      {{ historyStore.error }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.win-history {
  width: 180px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #1a2a3a;
  border-radius: 6px;
  padding: 12px;
}

.history-title {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: #556677;
  margin-bottom: 8px;
  text-align: center;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.history-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  padding: 4px 6px;
  border-radius: 3px;
  color: #556677;

  &.is-win {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.07);
  }
}

.history-loading,
.history-empty,
.history-error {
  font-size: 0.75rem;
  color: #556677;
  text-align: center;
  padding: 8px 0;
}

.history-offline {
  font-size: 0.72rem;
  color: #556677;
  text-align: center;
  padding: 8px 4px;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
}

.offline-icon {
  font-size: 1rem;
  color: #334455;
}

.offline-link {
  color: #00ffff;
  font-size: 0.68rem;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.history-error {
  color: #ff4444;
}
</style>

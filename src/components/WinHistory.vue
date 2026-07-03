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

    <div
      v-else-if="historyStore.records.length === 0"
      class="history-empty"
    >
      No history yet
    </div>

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

<script setup lang="ts">
import { onMounted } from 'vue'
import { useHistoryStore } from '@/stores/useHistoryStore'

const historyStore = useHistoryStore()

onMounted(async () => {
  await historyStore.fetchHistory()
})
</script>

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

.history-error {
  color: #ff4444;
}
</style>

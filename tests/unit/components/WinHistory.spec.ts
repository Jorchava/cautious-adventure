import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import WinHistory from '@/components/WinHistory.vue'
import { useHistoryStore } from '@/stores/useHistoryStore'

vi.mock('@/game/services/ClientHistoryService', () => ({
  ClientHistoryService: function() {
    return {
      getHistory: vi.fn().mockResolvedValue([
        { id: '1', timestamp: '2024-01-01T00:00:00Z', bet: 20, win: 100, freeSpinsAwarded: 0 },
        { id: '2', timestamp: '2024-01-01T00:00:01Z', bet: 20, win: 0, freeSpinsAwarded: 0 },
      ]),
      recordSpin: vi.fn().mockResolvedValue({ id: '3' }),
    }
  },
}))

describe('WinHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders without errors', () => {
    const wrapper = mount(WinHistory)
    expect(wrapper.exists()).toBe(true)
  })

  it('calls historyStore.fetchHistory on mount', async () => {
    const store = useHistoryStore()
    const spy = vi.spyOn(store, 'fetchHistory')
    mount(WinHistory)
    expect(spy).toHaveBeenCalledOnce()
  })

  it('shows a loading indicator while isLoading is true', () => {
    const store = useHistoryStore()
    store.isLoading = true
    const wrapper = mount(WinHistory)
    expect(wrapper.text()).toContain('Loading')
  })

  it('displays "No history yet" when records is empty', () => {
    const wrapper = mount(WinHistory)
    expect(wrapper.text()).toContain('No history yet')
  })

  it('renders one row per spin record', async () => {
    const store = useHistoryStore()
    store.records = [
      { id: '1', timestamp: '2024-01-01T00:00:00Z', bet: 20, win: 100, freeSpinsAwarded: 0 },
      { id: '2', timestamp: '2024-01-01T00:00:01Z', bet: 20, win: 50, freeSpinsAwarded: 0 },
    ]
    const wrapper = mount(WinHistory)
    const rows = wrapper.findAll('.history-row')
    expect(rows).toHaveLength(2)
  })

  it('displays the bet amount for each record', async () => {
    const store = useHistoryStore()
    store.records = [
      { id: '1', timestamp: '2024-01-01T00:00:00Z', bet: 50, win: 0, freeSpinsAwarded: 0 },
    ]
    const wrapper = mount(WinHistory)
    expect(wrapper.text()).toContain('50')
  })

  it('displays the win amount for each record', async () => {
    const store = useHistoryStore()
    store.records = [
      { id: '1', timestamp: '2024-01-01T00:00:00Z', bet: 20, win: 200, freeSpinsAwarded: 0 },
    ]
    const wrapper = mount(WinHistory)
    expect(wrapper.text()).toContain('200')
  })

  it('shows a win highlight when win > 0', async () => {
    const store = useHistoryStore()
    store.records = [
      { id: '1', timestamp: '2024-01-01T00:00:00Z', bet: 20, win: 100, freeSpinsAwarded: 0 },
    ]
    const wrapper = mount(WinHistory)
    const row = wrapper.find('.history-row')
    expect(row.classes()).toContain('is-win')
  })

  it('shows a loss style when win === 0', async () => {
    const store = useHistoryStore()
    store.records = [
      { id: '1', timestamp: '2024-01-01T00:00:00Z', bet: 20, win: 0, freeSpinsAwarded: 0 },
    ]
    const wrapper = mount(WinHistory)
    const row = wrapper.find('.history-row')
    expect(row.classes()).not.toContain('is-win')
  })
})

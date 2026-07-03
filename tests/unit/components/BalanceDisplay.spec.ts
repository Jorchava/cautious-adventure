import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import BalanceDisplay from '@/components/BalanceDisplay.vue'
import { useGameStore } from '@/stores/useGameStore'
import type { SpinResult } from '@/types/game.types'

function makeResult(totalWin: number): SpinResult {
  return {
    reels: Array(5).fill({
      symbols: ['LOW_B', 'LOW_A', 'HIGH_A'],
      stopPosition: 0,
    }) as unknown as SpinResult['reels'],
    paylines: [],
    scatterCount: 0,
    scatterPositions: [],
    totalWin,
    freeSpinsAwarded: 0,
  }
}

describe('BalanceDisplay', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays the current balance from the store', () => {
    const store = useGameStore()
    store.balance = 500
    const wrapper = mount(BalanceDisplay)
    expect(wrapper.text()).toContain('500')
  })

  it('displays the label CREDITS above the balance', () => {
    const wrapper = mount(BalanceDisplay)
    expect(wrapper.text()).toContain('CREDITS')
  })

  it('does not show a WIN section when lastResult is null', () => {
    const wrapper = mount(BalanceDisplay)
    expect(wrapper.text()).not.toContain('WIN')
  })

  it('does not show a WIN section when totalWin is 0', () => {
    const store = useGameStore()
    store.setResult(makeResult(0))
    const wrapper = mount(BalanceDisplay)
    expect(wrapper.text()).not.toContain('WIN')
  })

  it('shows a WIN section when lastResult.totalWin > 0', () => {
    const store = useGameStore()
    store.setResult(makeResult(100))
    const wrapper = mount(BalanceDisplay)
    expect(wrapper.text()).toContain('WIN')
  })

  it('displays the correct win amount', () => {
    const store = useGameStore()
    store.setResult(makeResult(250))
    const wrapper = mount(BalanceDisplay)
    expect(wrapper.text()).toContain('250')
  })
})

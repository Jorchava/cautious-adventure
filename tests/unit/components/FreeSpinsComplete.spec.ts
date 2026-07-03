import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import FreeSpinsComplete from '@/components/FreeSpinsComplete.vue'
import { useGameStore } from '@/stores/useGameStore'

function getOverlay(): Element | null {
  return document.body.querySelector('.free-spins-complete')
}

describe('FreeSpinsComplete', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.querySelector('.free-spins-complete')?.remove()
  })

  it('is not visible when phase is not FREE_SPINS_COMPLETE', () => {
    const store = useGameStore()
    store.setPhase('IDLE')
    const wrapper = mount(FreeSpinsComplete, { attachTo: document.body })
    expect(getOverlay()).toBeNull()
    wrapper.unmount()
  })

  it('is visible when phase is FREE_SPINS_COMPLETE', () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINS_COMPLETE')
    const wrapper = mount(FreeSpinsComplete, { attachTo: document.body })
    expect(getOverlay()).toBeTruthy()
    wrapper.unmount()
  })

  it('displays the total win from lastResult', () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINS_COMPLETE')
    store.setResult({
      reels: [
        { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
        { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
        { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
        { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
        { symbols: ['LOW_A', 'LOW_A', 'LOW_A'], stopPosition: 0 },
      ],
      paylines: [],
      scatterCount: 0,
      scatterPositions: [],
      totalWin: 500,
      freeSpinsAwarded: 0,
    })
    const wrapper = mount(FreeSpinsComplete, { attachTo: document.body })
    expect(getOverlay()?.textContent).toContain('500')
    wrapper.unmount()
  })

  it('emits a continue event when the CTA button is clicked', async () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINS_COMPLETE')
    const wrapper = mount(FreeSpinsComplete, { attachTo: document.body })
    const btn = document.body.querySelector<HTMLButtonElement>('.fs-collect-btn')
    expect(btn).toBeTruthy()
    btn!.click()
    expect(wrapper.emitted('continue')).toBeTruthy()
    wrapper.unmount()
  })
})

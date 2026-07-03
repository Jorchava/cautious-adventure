import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import FreeSpinsIntro from '@/components/FreeSpinsIntro.vue'
import { useGameStore } from '@/stores/useGameStore'

function getOverlay(): Element | null {
  return document.body.querySelector('.free-spins-intro')
}

describe('FreeSpinsIntro', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    document.body.querySelector('.free-spins-intro')?.remove()
  })

  it('is not visible when phase is not FREE_SPINS_INTRO', () => {
    const store = useGameStore()
    store.setPhase('IDLE')
    store.setFreeSpins(10)
    const wrapper = mount(FreeSpinsIntro, { attachTo: document.body })
    expect(getOverlay()).toBeNull()
    wrapper.unmount()
  })

  it('is visible when phase is FREE_SPINS_INTRO', () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINS_INTRO')
    store.setFreeSpins(10)
    const wrapper = mount(FreeSpinsIntro, { attachTo: document.body })
    expect(getOverlay()).toBeTruthy()
    wrapper.unmount()
  })

  it('displays the number of free spins awarded from the store', () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINS_INTRO')
    store.setFreeSpins(15)
    const wrapper = mount(FreeSpinsIntro, { attachTo: document.body })
    expect(getOverlay()?.textContent).toContain('15')
    wrapper.unmount()
  })

  it('emits a continue event when the CTA button is clicked', async () => {
    const store = useGameStore()
    store.setPhase('FREE_SPINS_INTRO')
    store.setFreeSpins(10)
    const wrapper = mount(FreeSpinsIntro, { attachTo: document.body })
    const btn = document.body.querySelector<HTMLButtonElement>('.fs-start-btn')
    expect(btn).toBeTruthy()
    btn!.click()
    expect(wrapper.emitted('continue')).toBeTruthy()
    wrapper.unmount()
  })
})

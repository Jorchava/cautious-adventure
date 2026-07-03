import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import BetPanel from '@/components/BetPanel.vue'
import { useGameStore } from '@/stores/useGameStore'

describe('BetPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('displays the current coinsPerLine value', () => {
    const wrapper = mount(BetPanel)
    expect(wrapper.text()).toContain('1')
  })

  it('displays the total bet (coinsPerLine × 20)', () => {
    const wrapper = mount(BetPanel)
    expect(wrapper.text()).toContain('BET')
    expect(wrapper.text()).toContain('20')
  })

  it('renders a decrease (-) button and increase (+) button', () => {
    const wrapper = mount(BetPanel)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(2)
    expect(buttons[0].text()).toBe('−')
    expect(buttons[1].text()).toBe('+')
  })

  it('clicking increase (+) moves to the next coin option', () => {
    const store = useGameStore()
    store.setBetCoin(1)
    const wrapper = mount(BetPanel)
    const incBtn = wrapper.findAll('button')[1]
    incBtn.trigger('click')
    expect(store.bet.coinsPerLine).toBe(2)
  })

  it('clicking decrease (-) moves to the previous coin option', () => {
    const store = useGameStore()
    store.setBetCoin(5)
    const wrapper = mount(BetPanel)
    const decBtn = wrapper.findAll('button')[0]
    decBtn.trigger('click')
    expect(store.bet.coinsPerLine).toBe(2)
  })

  it('the decrease button is disabled when coinsPerLine is at the minimum (1)', () => {
    const store = useGameStore()
    store.setBetCoin(1)
    const wrapper = mount(BetPanel)
    const decBtn = wrapper.findAll('button')[0]
    expect((decBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('the increase button is disabled when coinsPerLine is at the maximum (10)', () => {
    const store = useGameStore()
    store.setBetCoin(10)
    const wrapper = mount(BetPanel)
    const incBtn = wrapper.findAll('button')[1]
    expect((incBtn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('both buttons are disabled when phase is not IDLE', () => {
    const store = useGameStore()
    store.setPhase('SPINNING')
    const wrapper = mount(BetPanel)
    const buttons = wrapper.findAll('button')
    buttons.forEach((btn) => {
      expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    })
  })

  it('does not go below the minimum coin option', () => {
    const store = useGameStore()
    store.setBetCoin(1)
    const wrapper = mount(BetPanel)
    const decBtn = wrapper.findAll('button')[0]
    decBtn.trigger('click')
    expect(store.bet.coinsPerLine).toBe(1)
  })

  it('does not exceed the maximum coin option', () => {
    const store = useGameStore()
    store.setBetCoin(10)
    const wrapper = mount(BetPanel)
    const incBtn = wrapper.findAll('button')[1]
    incBtn.trigger('click')
    expect(store.bet.coinsPerLine).toBe(10)
  })
})

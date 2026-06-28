import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import GameCanvas from '@/components/GameCanvas.vue'

const mockEvaluate = vi.fn()
const mockSetError = vi.fn()

vi.mock('@/composables/useGameMachine', () => ({
  useGameMachine: () => ({
    evaluate: mockEvaluate,
    setError: mockSetError,
    spin: vi.fn().mockResolvedValue({}),
    completePaying: vi.fn(),
    beginFreeSpins: vi.fn(),
    dismissFreeSpins: vi.fn(),
    reset: vi.fn(),
  }),
}))

describe('GameCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockEvaluate.mockReset()
    mockSetError.mockReset()
  })

  it('renders a canvas element', () => {
    const wrapper = mount(GameCanvas)
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  it('mounts without throwing errors', () => {
    expect(() => mount(GameCanvas)).not.toThrow()
  })
})

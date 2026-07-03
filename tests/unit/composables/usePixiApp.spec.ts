import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { usePixiApp } from '@/composables/usePixiApp'
// pixi.js is already mocked in tests/setup.ts

interface PixiAppTestVm {
  app: {
    init: ReturnType<typeof vi.fn>
    destroy: ReturnType<typeof vi.fn>
  }
  isReady: boolean
}

import { vi } from 'vitest'

function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

const PixiAppTestHost = defineComponent({
  props: {
    canvasElement: { type: Object as () => HTMLCanvasElement | null, default: null },
  },
  setup(props) {
    const canvasRef = ref<HTMLCanvasElement | null>(props.canvasElement)
    return usePixiApp(canvasRef)
  },
  template: '<div></div>',
})

describe('usePixiApp', () => {
  it('calls app.init() on mount with a canvas element', async () => {
    const wrapper = mount(PixiAppTestHost, {
      props: { canvasElement: document.createElement('canvas') },
      attachTo: document.body,
    })
    await tick()
    const vm = wrapper.vm as unknown as PixiAppTestVm
    expect(vm.app.init).toHaveBeenCalledOnce()
  })

  it('isReady becomes true after app.init() resolves', async () => {
    const wrapper = mount(PixiAppTestHost, {
      props: { canvasElement: document.createElement('canvas') },
      attachTo: document.body,
    })
    await tick()
    const vm = wrapper.vm as unknown as PixiAppTestVm
    expect(vm.isReady).toBe(true)
  })

  it('calls app.destroy() with full cleanup options on unmount', async () => {
    const wrapper = mount(PixiAppTestHost, {
      props: { canvasElement: document.createElement('canvas') },
      attachTo: document.body,
    })
    await tick()
    const vm = wrapper.vm as unknown as PixiAppTestVm
    wrapper.unmount()
    expect(vm.app.destroy).toHaveBeenCalledWith(true, {
      children: true,
      texture: true,
    })
  })

  it('does not call app.init() if canvasRef is null', async () => {
    const wrapper = mount(PixiAppTestHost, {
      props: { canvasElement: null },
      attachTo: document.body,
    })
    await tick()
    const vm = wrapper.vm as unknown as PixiAppTestVm
    expect(vm.app.init).not.toHaveBeenCalled()
    expect(vm.isReady).toBe(false)
  })
})

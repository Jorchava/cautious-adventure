import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { usePixiApp } from '@/composables/usePixiApp'
// pixi.js is already mocked in tests/setup.ts

function tick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

function mountWithPixiApp() {
  const canvasRef = ref<HTMLCanvasElement | null>(
    document.createElement('canvas'),
  )
  let exposed: ReturnType<typeof usePixiApp> | undefined

  const TestComponent = defineComponent({
    setup() {
      const result = usePixiApp(canvasRef)
      exposed = result
      return result
    },
    template: '<div></div>',
  })

  const wrapper = mount(TestComponent, { attachTo: document.body })
  return { wrapper, exposed: exposed! }
}

describe('usePixiApp', () => {
  it('calls app.init() on mount with a canvas element', async () => {
    const { exposed } = mountWithPixiApp()
    // Wait for onMounted + async init
    await tick()
    expect(exposed.app.init).toHaveBeenCalledOnce()
  })

  it('isReady becomes true after app.init() resolves', async () => {
    const { exposed } = mountWithPixiApp()
    await tick()
    expect(exposed.isReady.value).toBe(true)
  })

  it('calls app.destroy() with full cleanup options on unmount', async () => {
    const { wrapper, exposed } = mountWithPixiApp()
    await tick()
    wrapper.unmount()
    expect(exposed.app.destroy).toHaveBeenCalledWith(true, {
      children: true,
      texture: true,
    })
  })

  it('does not call app.init() if canvasRef is null', async () => {
    let exposed: ReturnType<typeof usePixiApp> | undefined
    const canvasRef = ref<HTMLCanvasElement | null>(null)

    const TestComponent = defineComponent({
      setup() {
        const result = usePixiApp(canvasRef)
        exposed = result
        return result
      },
      template: '<div></div>',
    })

    mount(TestComponent, { attachTo: document.body })
    await tick()
    expect(exposed!.app.init).not.toHaveBeenCalled()
    expect(exposed!.isReady.value).toBe(false)
  })
})

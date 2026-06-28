import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SceneManager } from '@/pixi/SceneManager'
import type { IScene } from '@/pixi/IScene'
import { Application } from 'pixi.js'

function mockScene(): IScene {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  }
}

describe('SceneManager', () => {
  let app: InstanceType<typeof Application>
  let manager: SceneManager

  beforeEach(() => {
    app = new Application()
    manager = new SceneManager(app)
  })

  it('calls scene.init() when switching to a new scene', async () => {
    const scene = mockScene()
    await manager.switchTo(scene)
    expect(scene.init).toHaveBeenCalledOnce()
  })

  it('adds the scene to app.stage', async () => {
    const scene = mockScene()
    await manager.switchTo(scene)
    expect(app.stage.addChild).toHaveBeenCalledWith(scene)
  })

  it('calls destroy() on the previous scene when switching', async () => {
    const first = mockScene()
    const second = mockScene()
    await manager.switchTo(first)
    await manager.switchTo(second)
    expect(first.destroy).toHaveBeenCalledWith({ children: true })
  })

  it('removes the previous scene from app.stage before adding the new one', async () => {
    const first = mockScene()
    const second = mockScene()
    await manager.switchTo(first)
    await manager.switchTo(second)
    expect(app.stage.removeChild).toHaveBeenCalledWith(first)
    expect(app.stage.addChild).toHaveBeenCalledWith(second)
  })

  it('does not throw when switchTo is called with no existing scene', async () => {
    const scene = mockScene()
    await expect(manager.switchTo(scene)).resolves.toBeUndefined()
  })

  it('destroy() calls destroy on the current scene', () => {
    const scene = mockScene()
    manager.switchTo(scene)
    manager.destroy()
    expect(scene.destroy).toHaveBeenCalledWith({ children: true })
  })

  it('destroy() does not throw when no scene is active', () => {
    expect(() => manager.destroy()).not.toThrow()
  })
})

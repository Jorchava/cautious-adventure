import { vi } from 'vitest'

vi.mock('pixi.js', () => ({
  Application: vi.fn(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    stage: { addChild: vi.fn(), removeChild: vi.fn() },
    ticker: { add: vi.fn(), remove: vi.fn() },
    screen: { width: 1280, height: 720 },
  })),
  Assets: {
    load: vi.fn().mockResolvedValue({}),
    loadBundle: vi.fn().mockResolvedValue({}),
    addBundle: vi.fn(),
  },
  Container: vi.fn(() => ({ addChild: vi.fn(), removeChild: vi.fn(), destroy: vi.fn() })),
  Sprite: vi.fn(() => ({ position: { set: vi.fn() }, anchor: { set: vi.fn() }, destroy: vi.fn() })),
  Graphics: vi.fn(() => ({ rect: vi.fn().mockReturnThis(), fill: vi.fn().mockReturnThis(), moveTo: vi.fn().mockReturnThis(), lineTo: vi.fn().mockReturnThis(), stroke: vi.fn() })),
}))

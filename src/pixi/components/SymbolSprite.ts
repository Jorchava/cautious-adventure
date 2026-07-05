import { Sprite, Texture, BlurFilter, Ticker, Application } from 'pixi.js'
import type { SymbolId } from '@/types/game.types'
import { REEL_WIDTH, SYMBOL_HEIGHT } from '@/pixi/constants'

export class SymbolSprite extends Sprite {
  readonly symbolId: SymbolId
  private glowFilter: BlurFilter | null = null
  private glowPhase = 0
  private tickHandler: ((ticker: Ticker) => void) | null = null

  constructor(symbolId: SymbolId) {
    super(Texture.WHITE)
    this.symbolId = symbolId
    this.width = REEL_WIDTH
    this.height = SYMBOL_HEIGHT
    this.tint = SymbolSprite.colorFor(symbolId)
    this.anchor.set(0)
  }

  pulse(app: Application): void {
    if (this.glowFilter) return

    const filter = new BlurFilter({ strength: 2, quality: 3 })
    this.glowFilter = filter
    this.filters = [filter]

    this.tickHandler = (ticker: Ticker) => {
      this.glowPhase += 0.06 * ticker.deltaTime
      filter.strength = 3 + Math.sin(this.glowPhase) * 2
    }
    app.ticker.add(this.tickHandler)
  }

  stopPulse(app: Application): void {
    if (this.tickHandler) {
      app.ticker.remove(this.tickHandler)
      this.tickHandler = null
    }
    this.filters = []
    this.glowFilter = null
    this.glowPhase = 0
  }

  static colorFor(id: SymbolId): number {
    const colors: Record<SymbolId, number> = {
      WILD: 0xffd700,
      SCATTER: 0xff00ff,
      HIGH_A: 0x00ffff,
      HIGH_B: 0xff4444,
      LOW_A: 0x44ff44,
      LOW_B: 0x4444ff,
    }
    return colors[id]
  }
}

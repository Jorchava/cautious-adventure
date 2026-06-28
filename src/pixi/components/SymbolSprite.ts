import { Sprite, Texture } from 'pixi.js'
import type { SymbolId } from '@/types/game.types'
import { REEL_WIDTH, SYMBOL_HEIGHT } from '@/pixi/constants'

export class SymbolSprite extends Sprite {
  readonly symbolId: SymbolId

  constructor(symbolId: SymbolId) {
    super(Texture.WHITE)
    this.symbolId = symbolId
    this.width = REEL_WIDTH
    this.height = SYMBOL_HEIGHT
    this.tint = SymbolSprite.colorFor(symbolId)
    this.anchor.set(0)
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

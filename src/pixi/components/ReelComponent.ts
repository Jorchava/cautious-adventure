import { Container, Ticker } from 'pixi.js'
import { SymbolSprite } from '@/pixi/components/SymbolSprite'
import {
  wrapStripOffset,
  decelerateVelocity,
  isReadyToSnap,
  getSymbolIndexAtRow,
  symbolYPosition,
} from '@/pixi/utils/reelMath'
import {
  SYMBOL_HEIGHT,
  VISIBLE_ROWS,
  MAX_SPIN_VELOCITY,
  DECEL_FACTOR,
  MIN_SNAP_VELOCITY,
} from '@/pixi/constants'
import type { SymbolId } from '@/types/game.types'

export class ReelComponent extends Container {
  private sprites: SymbolSprite[] = []
  private stripOffset = 0
  private velocity = 0
  private isSpinning = false
  private targetStopIndex: number | null = null
  private finalStopIndex = 0
  private readonly stripLength: number
  private readonly stripSymbols: SymbolId[]
  readonly tickHandler: (ticker: Ticker) => void

  constructor(stripSymbols: SymbolId[]) {
    super()
    this.stripSymbols = stripSymbols
    this.stripLength = stripSymbols.length
    this.tickHandler = this.update.bind(this)
    this.buildSprites()
  }

  private buildSprites(): void {
    for (let i = 0; i < VISIBLE_ROWS + 2; i++) {
      const symbolId = this.stripSymbols[i % this.stripLength]
      const sprite = new SymbolSprite(symbolId)
      sprite.y = symbolYPosition(i - 1)
      this.sprites.push(sprite)
      this.addChild(sprite)
    }
  }

  spin(): void {
    this.isSpinning = true
    this.velocity = MAX_SPIN_VELOCITY
    this.targetStopIndex = null
  }

  stop(targetStripIndex: number): void {
    this.targetStopIndex = targetStripIndex
  }

  update(ticker: Ticker): void {
    if (!this.isSpinning) return

    if (this.targetStopIndex !== null) {
      this.velocity = decelerateVelocity(this.velocity, DECEL_FACTOR)
      if (isReadyToSnap(this.velocity, MIN_SNAP_VELOCITY)) {
        this.snapAndStop()
        return
      }
    }

    this.stripOffset = wrapStripOffset(
      this.stripOffset + this.velocity * ticker.deltaTime,
      this.stripLength * SYMBOL_HEIGHT,
    )

    this.updateSpritePositions()
  }

  private updateSpritePositions(): void {
    this.sprites.forEach((sprite, i) => {
      const rawY =
        (this.stripOffset + symbolYPosition(i - 1)) %
        (this.stripLength * SYMBOL_HEIGHT)
      sprite.y =
        rawY < -SYMBOL_HEIGHT ? rawY + this.stripLength * SYMBOL_HEIGHT : rawY

      const stripIdx =
        Math.floor(sprite.y / SYMBOL_HEIGHT) % this.stripLength
      const safeIdx =
        ((stripIdx % this.stripLength) + this.stripLength) % this.stripLength
      const newId = this.stripSymbols[safeIdx]
      if (sprite.symbolId !== newId) {
        sprite.tint = SymbolSprite.colorFor(newId)
      }
    })
  }

  private snapAndStop(): void {
    this.velocity = 0
    this.isSpinning = false
    if (this.targetStopIndex !== null) {
      this.finalStopIndex = this.targetStopIndex
    }
    this.targetStopIndex = null

    this.sprites.forEach((sprite, i) => {
      sprite.y = symbolYPosition(i - 1)
    })

    this.emit('stopped', this)
  }

  getSpriteAt(row: number): SymbolSprite | null {
    return this.sprites[row + 1] ?? null
  }

  getVisibleSymbols(): [SymbolId, SymbolId, SymbolId] {
    const stopPos = this.finalStopIndex
    return [
      this.stripSymbols[getSymbolIndexAtRow(stopPos, 0, this.stripLength)],
      this.stripSymbols[getSymbolIndexAtRow(stopPos, 1, this.stripLength)],
      this.stripSymbols[getSymbolIndexAtRow(stopPos, 2, this.stripLength)],
    ]
  }

  override destroy(options?: { children?: boolean }): void {
    this.isSpinning = false
    super.destroy(options)
  }
}

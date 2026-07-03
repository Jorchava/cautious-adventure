import { Container, Graphics } from 'pixi.js'
import { PAYLINES } from '@/game/config/paylines'
import {
  REEL_START_X,
  REEL_START_Y,
  REEL_WIDTH,
  REEL_GAP,
  SYMBOL_HEIGHT,
} from '@/pixi/constants'
import type { PaylineResult } from '@/types/game.types'

const PAYLINE_COLORS: number[] = [
  0xff3333, 0x33ff33, 0x3333ff, 0xffff33, 0xff33ff, 0x33ffff, 0xff8833,
  0x8833ff, 0x33ff88, 0xff3388, 0xffaa33, 0x33aaff, 0xaa33ff, 0x33ffaa,
  0xffaa88, 0x88aaff, 0xff8888, 0x88ff88, 0x8888ff, 0xffffff,
]

export class WinLine extends Container {
  drawPayline(paylineResult: PaylineResult): void {
    const rowIndices = PAYLINES[paylineResult.lineIndex]
    const color =
      PAYLINE_COLORS[paylineResult.lineIndex % PAYLINE_COLORS.length]

    const points = rowIndices.map((row, reelIndex) => ({
      x: REEL_START_X + reelIndex * (REEL_WIDTH + REEL_GAP) + REEL_WIDTH / 2,
      y: REEL_START_Y + row * SYMBOL_HEIGHT + SYMBOL_HEIGHT / 2,
    }))

    const g = new Graphics()
    g.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach((p) => g.lineTo(p.x, p.y))
    g.stroke({ width: 3, color, alpha: 0.9 })

    points.forEach((p) => {
      g.circle(p.x, p.y, 8).fill({ color, alpha: 0.7 })
    })

    this.addChild(g)
  }

  clearAll(): void {
    this.removeChildren().forEach((child) => child.destroy())
  }
}

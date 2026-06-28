import { Container, Graphics, Ticker } from 'pixi.js'
import type { IScene } from '@/pixi/IScene'
import { ReelComponent } from '@/pixi/components/ReelComponent'
import { WinLine } from '@/pixi/components/WinLine'
import {
  REEL_WIDTH,
  REEL_GAP,
  SYMBOL_HEIGHT,
  VISIBLE_ROWS,
  REEL_START_X,
  REEL_START_Y,
  REEL_COUNT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CASCADE_STOP_DELAY_MS,
} from '@/pixi/constants'
import { REEL_STRIPS } from '@/game/config/reelStrips'
import type { SpinResult } from '@/types/game.types'

const WIN_ANIMATION_DURATION_MS = 2000
const DIM_ALPHA = 0.35

interface AppWithTicker {
  ticker: {
    add: (fn: (t: Ticker) => void) => void
    remove: (fn: (t: Ticker) => void) => void
  }
}

export class GameScene extends Container implements IScene {
  private reels: ReelComponent[] = []
  private reelContainer!: Container
  private stoppedCount = 0
  private tickerFns: ((t: Ticker) => void)[] = []
  private winLine!: WinLine

  async init(): Promise<void> {
    this.buildBackground()
    this.buildReels()
    this.buildFrame()

    this.winLine = new WinLine()
    this.addChild(this.winLine)
  }

  private buildBackground(): void {
    const bg = new Graphics()
    bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).fill(0x0a0a1a)
    this.addChild(bg)
  }

  private buildReels(): void {
    this.reelContainer = new Container()

    const mask = new Graphics()
    mask
      .rect(
        REEL_START_X,
        REEL_START_Y,
        REEL_WIDTH * REEL_COUNT + REEL_GAP * (REEL_COUNT - 1),
        SYMBOL_HEIGHT * VISIBLE_ROWS,
      )
      .fill(0xffffff)
    this.reelContainer.mask = mask
    this.reelContainer.addChild(mask)

    for (let i = 0; i < REEL_COUNT; i++) {
      const reel = new ReelComponent(REEL_STRIPS[i])
      reel.x = REEL_START_X + i * (REEL_WIDTH + REEL_GAP)
      reel.y = REEL_START_Y
      this.reels.push(reel)
      this.reelContainer.addChild(reel)
    }

    this.addChild(this.reelContainer)
  }

  private buildFrame(): void {
    const frame = new Graphics()
    frame
      .rect(
        REEL_START_X - 4,
        REEL_START_Y - 4,
        REEL_WIDTH * REEL_COUNT + REEL_GAP * (REEL_COUNT - 1) + 8,
        SYMBOL_HEIGHT * VISIBLE_ROWS + 8,
      )
      .stroke({ width: 3, color: 0x00ffff })
    this.addChild(frame)
  }

  startSpin(result: SpinResult, app: AppWithTicker): void {
    this.stoppedCount = 0

    this.reels.forEach((reel, index) => {
      const tickFn = (t: Ticker) => reel.update(t)
      app.ticker.add(tickFn)
      this.tickerFns.push(tickFn)

      reel.spin()

      const stopDelay = (index + 1) * 500 + index * CASCADE_STOP_DELAY_MS
      setTimeout(() => {
        reel.stop(result.reels[index].stopPosition)
      }, stopDelay)

      reel.once('stopped', () => {
        this.stoppedCount++
        if (this.stoppedCount === REEL_COUNT) {
          this.emit('allReelsStopped')
        }
      })
    })
  }

  showWin(result: SpinResult): void {
    result.paylines.forEach((pl) => this.winLine.drawPayline(pl))

    const winKeys = new Set(
      result.paylines.flatMap((pl) =>
        pl.positions.map(([reelIdx, row]) => `${reelIdx},${row}`),
      ),
    )

    this.reels.forEach((reel, reelIndex) => {
      for (let row = 0; row < VISIBLE_ROWS; row++) {
        const sprite = reel.getSpriteAt(row)
        if (sprite) {
          sprite.alpha = winKeys.has(`${reelIndex},${row}`) ? 1.0 : DIM_ALPHA
        }
      }
    })
  }

  clearWin(): void {
    this.winLine.clearAll()

    this.reels.forEach((reel) => {
      for (let row = 0; row < VISIBLE_ROWS; row++) {
        const sprite = reel.getSpriteAt(row)
        if (sprite) sprite.alpha = 1.0
      }
    })
  }

  async showWinAnimation(result: SpinResult): Promise<void> {
    this.showWin(result)
    // Note: in production, store this timeout ref and cancel it in onUnmounted
    // to prevent completePaying() firing after component teardown
    await new Promise<void>((resolve) => setTimeout(resolve, WIN_ANIMATION_DURATION_MS))
    this.clearWin()
  }

  override destroy(options?: { children?: boolean }): void {
    this.tickerFns = []
    this.reels = []
    super.destroy(options)
  }
}

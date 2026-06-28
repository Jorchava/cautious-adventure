import { Container, Graphics, Ticker } from 'pixi.js'
import type { IScene } from '@/pixi/IScene'
import { ReelComponent } from '@/pixi/components/ReelComponent'
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

  async init(): Promise<void> {
    this.buildBackground()
    this.buildReels()
    this.buildFrame()
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

  override destroy(options?: { children?: boolean }): void {
    this.tickerFns = []
    this.reels = []
    super.destroy(options)
  }
}

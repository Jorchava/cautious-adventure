import { Container, Graphics, Text } from 'pixi.js'
import { Assets } from 'pixi.js'
import type { IScene } from '@/pixi/IScene'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/pixi/constants'

const SYMBOL_BUNDLE: Record<string, string> = {}

export class LoadingScene extends Container implements IScene {
  private bar!: Graphics
  private statusLabel!: Text

  async init(): Promise<void> {
    this.buildUI()

    if (Object.keys(SYMBOL_BUNDLE).length === 0) {
      this.setProgress(1)
      return
    }

    Assets.addBundle('symbols', SYMBOL_BUNDLE)
    await Assets.loadBundle('symbols', (progress: number) => {
      this.setProgress(progress)
    })
  }

  private buildUI(): void {
    const bg = new Graphics()
    bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).fill(0x0a0a1a)
    this.addChild(bg)

    this.bar = new Graphics()
    this.setProgress(0)
    this.bar.x = 200
    this.bar.y = 300
    this.addChild(this.bar)

    this.statusLabel = new Text({
      text: 'Loading...',
      style: { fill: 0x00ffff, fontSize: 20 },
    })
    this.statusLabel.anchor.set(0.5)
    this.statusLabel.position.set(450, 340)
    this.addChild(this.statusLabel)
  }

  private setProgress(progress: number): void {
    this.bar.clear()
    this.bar.rect(0, 0, 500, 12).fill(0x1a1a2e)
    this.bar.rect(0, 0, 500 * progress, 12).fill(0x00ffff)
    this.statusLabel.text =
      progress >= 1 ? 'Ready!' : `Loading... ${Math.round(progress * 100)}%`
  }
}

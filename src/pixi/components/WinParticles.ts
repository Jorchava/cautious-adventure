import { Container, Sprite, Texture, Ticker } from 'pixi.js'
import type { Application } from 'pixi.js'

const PARTICLE_COUNT = 80
const PARTICLE_COLORS = [0xffd700, 0x00ffff, 0xff00ff, 0xffffff]

export class WinParticles extends Container {
  private particleContainer: Container | null = null
  private velocities: Array<{ vx: number; vy: number }> = []
  private tickHandler: ((ticker: Ticker) => void) | null = null
  private _app: Application | null = null  // store app reference

  burst(app: Application, x: number, y: number): void {
    this._app = app  // store for cleanup
    this.cleanup(app)
    // runtime ts errors prev set to ts ignore by agent
    this.particleContainer = new Container()

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new Sprite(Texture.WHITE)
      p.width = 6
      p.height = 6
      p.anchor.set(0.5)
      p.position.set(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 40,
      )
      p.tint =
        PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]
      p.alpha = 1
      this.particleContainer.addChild(p)

      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 4
      this.velocities.push({
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
      })
    }

    this.addChild(this.particleContainer)

    this.tickHandler = (ticker: Ticker) => {
      if (!this.particleContainer) return
      let allFaded = true

      this.particleContainer.children.forEach((child, i) => {
        const p = child as Sprite
        p.x += this.velocities[i].vx * ticker.deltaTime
        p.y += this.velocities[i].vy * ticker.deltaTime
        this.velocities[i].vy += 0.15 * ticker.deltaTime
        p.alpha -= 0.018 * ticker.deltaTime
        if (p.alpha > 0) allFaded = false
      })

      if (allFaded) this.cleanup(app)
    }

    app.ticker.add(this.tickHandler)
  }

  cleanup(app: Application): void {
    if (this.tickHandler) {
      app.ticker.remove(this.tickHandler)
      this.tickHandler = null
    }
    if (this.particleContainer) {
      this.particleContainer.destroy({ children: true })
      this.particleContainer = null
    }
    this.velocities = []
  }
  override destroy(options?: { children?: boolean }): void {
    if (this._app) this.cleanup(this._app)
    super.destroy(options)
  }
}

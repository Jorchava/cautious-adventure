import { Application, Container } from 'pixi.js'
import type { IScene } from '@/pixi/IScene'

export class SceneManager {
  private current: IScene | null = null

  constructor(private readonly app: Application) {}

  async switchTo(scene: IScene): Promise<void> {
    if (this.current) {
      this.current.destroy({ children: true })
      this.app.stage.removeChild(this.current as unknown as Container)
    }
    this.current = scene
    this.app.stage.addChild(scene as unknown as Container)
    await scene.init()
  }

  destroy(): void {
    this.current?.destroy({ children: true })
    this.current = null
  }
}

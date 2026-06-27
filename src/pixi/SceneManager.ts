import { Application } from 'pixi.js'
import type { IScene } from '@/types/pixi.types'

export class SceneManager {
  private app: Application
  private currentScene: IScene | null = null

  constructor(app: Application) {
    this.app = app
  }

  async switchScene(scene: IScene): Promise<void> {
    if (this.currentScene) {
      this.currentScene.destroy({ children: true })
      this.app.stage.removeChild(this.currentScene)
    }
    this.currentScene = scene
    await scene.init()
    this.app.stage.addChild(scene)
  }

  destroy(): void {
    if (this.currentScene) {
      this.currentScene.destroy({ children: true })
      this.app.stage.removeChild(this.currentScene)
    }
  }
}

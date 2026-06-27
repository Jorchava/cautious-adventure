import type { Container } from 'pixi.js'

export interface IScene extends Container {
  init(): Promise<void>
}

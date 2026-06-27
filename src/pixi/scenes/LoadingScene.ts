import { Container, Text, TextStyle } from 'pixi.js'
import type { IScene } from '@/types/pixi.types'

export class LoadingScene extends Container implements IScene {
  async init(): Promise<void> {
    const text = new Text({
      text: 'Loading...',
      style: new TextStyle({ fill: '#ffffff', fontSize: 32 }),
    })
    text.anchor.set(0.5)
    text.position.set(640, 360)
    this.addChild(text)
  }
}

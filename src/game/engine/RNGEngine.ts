import { REEL_STRIPS } from '../config/reelStrips'

export class RNGEngine {
  generateStopPositions(): number[] {
    return REEL_STRIPS.map(strip => Math.floor(Math.random() * strip.length))
  }
}

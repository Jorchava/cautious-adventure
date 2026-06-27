import type { BetConfig, ReelResult, SpinResult, SymbolId } from '@/types/game.types'
import type { SpinService } from './SpinService'
import { RNGEngine } from '../engine/RNGEngine'
import { PaylineEvaluator } from '../engine/PaylineEvaluator'
import { REEL_STRIPS } from '../config/reelStrips'

const STRIP_LENGTH = 22
const VISIBLE_ROWS = 3

const FREE_SPINS_TABLE: Record<number, number> = {
  3: 10,
  4: 15,
  5: 20,
}

const SCATTER_AWARD_TABLE: Record<number, number> = {
  3: 10,
  4: 20,
  5: 50,
}

export class ClientSpinService implements SpinService {
  private rng: RNGEngine
  private evaluator: PaylineEvaluator

  constructor() {
    this.rng = new RNGEngine()
    this.evaluator = new PaylineEvaluator()
  }

  async requestSpin(bet: BetConfig): Promise<SpinResult> {
    const stopPositions = this.rng.generateStopPositions()

    const reelResults: ReelResult[] = stopPositions.map((pos, reelIndex) => {
      const strip = REEL_STRIPS[reelIndex]
      const symbols: [SymbolId, SymbolId, SymbolId] = [
        strip[pos % STRIP_LENGTH],
        strip[(pos + 1) % STRIP_LENGTH],
        strip[(pos + 2) % STRIP_LENGTH],
      ]
      return { symbols, stopPosition: pos }
    })

    const reels: SpinResult['reels'] = reelResults as unknown as SpinResult['reels']

    const paylines = this.evaluator.evaluate(reelResults, bet)

    const scatterPositions: Array<[number, number]> = []
    for (let r = 0; r < reelResults.length; r++) {
      for (let row = 0; row < VISIBLE_ROWS; row++) {
        if (reelResults[r].symbols[row] === 'SCATTER') {
          scatterPositions.push([r, row])
        }
      }
    }

    const scatterCount = scatterPositions.length
    const freeSpinsAwarded = FREE_SPINS_TABLE[scatterCount] ?? 0

    const scatterAward = (SCATTER_AWARD_TABLE[scatterCount] ?? 0) * bet.totalBet
    const paylineTotal = paylines.reduce((sum, p) => sum + p.payout, 0)
    const totalWin = paylineTotal + scatterAward

    return {
      reels,
      paylines,
      scatterCount,
      scatterPositions,
      totalWin,
      freeSpinsAwarded,
    }
  }
}

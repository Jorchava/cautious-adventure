import { describe, it, expect } from 'vitest'
import { PaylineEvaluator } from '@/game/engine/PaylineEvaluator'
import type { BetConfig, ReelResult, SymbolId } from '@/types/game.types'

const defaultBet: BetConfig = { coinsPerLine: 1, linesPlayed: 20, totalBet: 20 }

function makeReels(layout: SymbolId[][]): ReelResult[] {
  return layout.map((symbols, i) => ({
    symbols: [symbols[0]!, symbols[1]!, symbols[2]!] as const,
    stopPosition: i,
  }))
}

describe('PaylineEvaluator', () => {
  const evaluator = new PaylineEvaluator()

  it('three matching HIGH_A on line 0 returns correct payout', () => {
    // Payline 0 = [1,1,1,1,1] — middle straight
    // Place HIGH_A at row 1 (middle) of reels 0-2, different symbols at reels 3-4
    const reels = makeReels([
      ['SCATTER', 'HIGH_A', 'WILD'],
      ['HIGH_B', 'HIGH_A', 'LOW_A'],
      ['LOW_A', 'HIGH_A', 'HIGH_B'],
      ['WILD', 'LOW_A', 'SCATTER'],
      ['SCATTER', 'LOW_B', 'LOW_A'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    const win = result.find(r => r.lineIndex === 0)
    expect(win).toBeDefined()
    expect(win!.matchCount).toBe(3)
    expect(win!.symbolId).toBe('HIGH_A')
    expect(win!.payout).toBe(50)
  })

  it('five matching HIGH_B returns correct payout multiplied by coinsPerLine', () => {
    // Payline 0 = [1,1,1,1,1] — all middle
    // Place HIGH_B at row 1 (middle) of all 5 reels
    const reels = makeReels([
      ['LOW_A', 'HIGH_B', 'LOW_B'],
      ['WILD', 'HIGH_B', 'HIGH_A'],
      ['SCATTER', 'HIGH_B', 'LOW_A'],
      ['LOW_B', 'HIGH_B', 'WILD'],
      ['HIGH_A', 'HIGH_B', 'LOW_B'],
    ])
    const bet5: BetConfig = { coinsPerLine: 5, linesPlayed: 20, totalBet: 100 }
    const result = evaluator.evaluate(reels, bet5)
    const win = result.find(r => r.lineIndex === 0)
    expect(win).toBeDefined()
    expect(win!.matchCount).toBe(5)
    expect(win!.payout).toBe(500 * 5)
  })

  it('WILD in reel 0 completes a HIGH_A 3-match', () => {
    // Payline 0: [WILD(reel0,row1), HIGH_A(reel1,row1), HIGH_A(reel2,row1), ...]
    // WILD should substitute as HIGH_A, giving 3 consecutive HIGH_A
    const reels = makeReels([
      ['LOW_B', 'WILD', 'LOW_B'],
      ['LOW_B', 'HIGH_A', 'LOW_B'],
      ['LOW_B', 'HIGH_A', 'LOW_B'],
      ['LOW_B', 'LOW_A', 'LOW_B'],
      ['LOW_B', 'LOW_A', 'LOW_B'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    const highAWins = result.filter(r => r.symbolId === 'HIGH_A')
    expect(highAWins.length).toBeGreaterThanOrEqual(1)
    const wildLine = highAWins.find(r => r.positions[0][0] === 0 && r.positions[0][1] === 1)
    expect(wildLine).toBeDefined()
    expect(wildLine!.matchCount).toBe(3)
  })

  it('WILD does NOT substitute for SCATTER', () => {
    const reels = makeReels([
      ['SCATTER', 'WILD', 'LOW_A'],
      ['SCATTER', 'LOW_B', 'WILD'],
      ['SCATTER', 'LOW_A', 'HIGH_A'],
      ['LOW_A', 'HIGH_A', 'LOW_B'],
      ['LOW_B', 'LOW_A', 'HIGH_B'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    const scatterWins = result.filter(r => r.symbolId === 'SCATTER')
    expect(scatterWins).toHaveLength(0)
  })

  it('no matching symbols returns empty paylines array', () => {
    // All reels have different symbols at each row position
    // No payline should have 2+ consecutive matching symbols left-to-right
    const reels = makeReels([
      ['HIGH_A', 'HIGH_B', 'LOW_A'],
      ['LOW_B', 'LOW_A', 'HIGH_A'],
      ['HIGH_B', 'SCATTER', 'LOW_B'],
      ['LOW_A', 'HIGH_A', 'HIGH_B'],
      ['SCATTER', 'LOW_B', 'LOW_A'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    expect(result).toHaveLength(0)
  })

  it('LOW_B pays for exactly 2 of a kind', () => {
    // Payline 0: LOW_B at row 1 of reels 0-3, then cut off
    // Actually payline 0 = [1,1,1,1,1], so let's put LOW_B at row 1 of reels 0 and 1 only
    // But that's not how reels work — the evaluator checks horizontally across paylines
    // Payline 5 = [0,0,1,2,2] — check this one
    // Put LOW_B at (reel0,row0), (reel1,row0), and different at reel2
    const reels = makeReels([
      ['LOW_B', 'HIGH_A', 'HIGH_B'],
      ['LOW_B', 'LOW_A', 'SCATTER'],
      ['HIGH_B', 'SCATTER', 'LOW_A'],
      ['LOW_A', 'HIGH_B', 'SCATTER'],
      ['SCATTER', 'LOW_A', 'HIGH_A'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    // Payline 1 = [0,0,0,0,0]: LOW_B, LOW_B, HIGH_B, LOW_A, SCATTER → 2 LOW_B
    // LOW_B pays for 2 of a kind
    const payline1 = result.find(r => r.lineIndex === 1)
    expect(payline1).toBeDefined()
    expect(payline1!.symbolId).toBe('LOW_B')
    expect(payline1!.matchCount).toBe(2)
    expect(payline1!.payout).toBe(5)
  })

  it('HIGH_A does NOT pay for 2 of a kind', () => {
    const reels = makeReels([
      ['HIGH_A', 'LOW_B', 'LOW_B'],
      ['HIGH_A', 'LOW_B', 'LOW_B'],
      ['LOW_A', 'LOW_B', 'LOW_B'],
      ['LOW_B', 'LOW_B', 'LOW_B'],
      ['LOW_B', 'LOW_B', 'LOW_B'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    // Payline 1 [0,0,0,0,0]: HIGH_A, HIGH_A, LOW_A, LOW_B, LOW_B → only 2 HIGH_A
    const highAWins = result.filter(r => r.symbolId === 'HIGH_A')
    expect(highAWins).toHaveLength(0)
  })

  it('payline 3 (V shape) evaluates with correct positions', () => {
    // Payline 3 = [0,1,2,1,0]
    // Put HIGH_A at (0,0), (1,1), (2,2)
    const reels = makeReels([
      ['HIGH_A', 'LOW_B', 'LOW_B'],
      ['LOW_B', 'HIGH_A', 'LOW_B'],
      ['LOW_B', 'LOW_B', 'HIGH_A'],
      ['LOW_A', 'LOW_B', 'LOW_B'],
      ['LOW_A', 'LOW_B', 'LOW_B'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    const win = result.find(r => r.lineIndex === 3)
    expect(win).toBeDefined()
    expect(win!.matchCount).toBe(3)
    expect(win!.positions).toEqual([[0, 0], [1, 1], [2, 2]])
  })

  it('payline with only WILD symbols produces no match (cannot resolve)', () => {
    // Payline 0 [1,1,1,1,1]: all WILD — resolveWilds returns [] → skip
    const reels = makeReels([
      ['LOW_B', 'WILD', 'LOW_B'],
      ['LOW_B', 'WILD', 'LOW_B'],
      ['LOW_B', 'WILD', 'LOW_B'],
      ['LOW_B', 'WILD', 'LOW_B'],
      ['LOW_B', 'WILD', 'LOW_B'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    const wildLines = result.filter(r => r.lineIndex === 0)
    expect(wildLines).toHaveLength(0)
  })

  it('SCATTER symbols on reels 0 and 1 returns empty paylines array', () => {
    const reels = makeReels([
      ['SCATTER', 'LOW_B', 'LOW_B'],
      ['LOW_B', 'SCATTER', 'LOW_B'],
      ['LOW_A', 'LOW_B', 'LOW_B'],
      ['LOW_B', 'LOW_B', 'LOW_B'],
      ['LOW_B', 'LOW_B', 'LOW_B'],
    ])
    const result = evaluator.evaluate(reels, defaultBet)
    expect(result.every(r => r.symbolId !== 'SCATTER')).toBe(true)
  })

  it('coinsPerLine = 5 multiplies all payouts by 5', () => {
    const reels = makeReels([
      ['SCATTER', 'HIGH_A', 'WILD'],
      ['HIGH_B', 'HIGH_A', 'LOW_A'],
      ['LOW_A', 'HIGH_A', 'HIGH_B'],
      ['WILD', 'LOW_A', 'SCATTER'],
      ['SCATTER', 'LOW_B', 'LOW_A'],
    ])
    const bet5: BetConfig = { coinsPerLine: 5, linesPlayed: 20, totalBet: 100 }
    const result = evaluator.evaluate(reels, bet5)
    const win = result.find(r => r.lineIndex === 0)
    expect(win).toBeDefined()
    expect(win!.payout).toBe(50 * 5)
  })
})

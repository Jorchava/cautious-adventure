import type { BetConfig, PaylineResult, ReelResult, SymbolId } from '@/types/game.types'
import { PAYLINES } from '../config/paylines'
import { SYMBOL_DEFINITIONS } from '../config/symbols'

const NON_SUBSTITUTES: Set<SymbolId> = new Set(['SCATTER'])

export class PaylineEvaluator {
  evaluate(reels: ReelResult[], bet: BetConfig): PaylineResult[] {
    const results: PaylineResult[] = []

    for (let lineIndex = 0; lineIndex < PAYLINES.length; lineIndex++) {
      const rowPattern = PAYLINES[lineIndex]
      const rawSymbols: SymbolId[] = rowPattern.map((row, reelIdx) =>
        reels[reelIdx]!.symbols[row]
      )

      const resolvedSymbols = this.resolveWilds(rawSymbols)

      if (resolvedSymbols.length === 0) continue

      const firstSymbol = resolvedSymbols[0]
      let matchCount = 1

      for (let i = 1; i < resolvedSymbols.length; i++) {
        if (resolvedSymbols[i] === firstSymbol) {
          matchCount++
        } else {
          break
        }
      }

      const symbolDef = SYMBOL_DEFINITIONS.find(s => s.id === firstSymbol)
      if (!symbolDef) continue

      const basePayout = symbolDef.payouts[matchCount as 2 | 3 | 4 | 5]
      if (basePayout === undefined) continue

      const positions: Array<[number, number]> = []
      for (let i = 0; i < matchCount; i++) {
        positions.push([i, rowPattern[i]])
      }

      results.push({
        lineIndex,
        matchCount,
        symbolId: firstSymbol,
        payout: basePayout * bet.coinsPerLine,
        positions,
      })
    }

    return results
  }

  private resolveWilds(symbols: SymbolId[]): SymbolId[] {
    const firstNonWild = symbols.find(
      s => s !== 'WILD' && !NON_SUBSTITUTES.has(s)
    )

    if (!firstNonWild) return []

    return symbols.map(s => {
      if (s === 'WILD') return firstNonWild
      if (NON_SUBSTITUTES.has(s)) return s
      return s
    })
  }
}

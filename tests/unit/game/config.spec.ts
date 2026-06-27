import { describe, it, expect } from 'vitest'
import { PAYLINES } from '@/game/config/paylines'
import { REEL_STRIPS } from '@/game/config/reelStrips'
import { SYMBOL_DEFINITIONS } from '@/game/config/symbols'
import type { SymbolId } from '@/types/game.types'

const VALID_SYMBOL_IDS: SymbolId[] = ['WILD', 'SCATTER', 'HIGH_A', 'HIGH_B', 'LOW_A', 'LOW_B']

describe('PAYLINES', () => {
  it('has exactly 20 paylines', () => expect(PAYLINES).toHaveLength(20))
  it('each payline has exactly 5 row indices', () => {
    PAYLINES.forEach(line => expect(line).toHaveLength(5))
  })
  it('all row indices are 0, 1, or 2', () => {
    PAYLINES.forEach(line => line.forEach(row => expect([0, 1, 2]).toContain(row)))
  })
})

describe('REEL_STRIPS', () => {
  it('has exactly 5 reel strips', () => expect(REEL_STRIPS).toHaveLength(5))
  it('each strip has at least 20 symbols', () => {
    REEL_STRIPS.forEach(strip => expect(strip.length).toBeGreaterThanOrEqual(20))
  })
  it('all symbol IDs are valid', () => {
    REEL_STRIPS.forEach(strip =>
      strip.forEach(id => expect(VALID_SYMBOL_IDS).toContain(id))
    )
  })
})

describe('SYMBOL_DEFINITIONS', () => {
  it('has exactly 6 symbol definitions', () => expect(SYMBOL_DEFINITIONS).toHaveLength(6))
  it('each symbol has an id, displayName, and payouts object', () => {
    SYMBOL_DEFINITIONS.forEach(sym => {
      expect(sym.id).toBeDefined()
      expect(sym.displayName).toBeDefined()
      expect(sym.payouts).toBeDefined()
    })
  })
  it('LOW_B is the only symbol with a payout for 2 matches', () => {
    const lowB = SYMBOL_DEFINITIONS.find(s => s.id === 'LOW_B')
    expect(lowB?.payouts[2]).toBeGreaterThan(0)
    const others = SYMBOL_DEFINITIONS.filter(s => s.id !== 'LOW_B' && s.id !== 'SCATTER')
    others.forEach(s => expect(s.payouts[2]).toBeUndefined())
  })
})

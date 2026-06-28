import { describe, it, expect } from 'vitest'
import {
  wrapStripOffset,
  decelerateVelocity,
  isReadyToSnap,
  snapToNearestSymbol,
  getSymbolIndexAtRow,
  symbolYPosition,
} from '@/pixi/utils/reelMath'
import { SYMBOL_HEIGHT } from '@/pixi/constants'

describe('wrapStripOffset', () => {
  it('returns offset unchanged when within strip bounds', () => {
    expect(wrapStripOffset(5, 22)).toBe(5)
  })

  it('wraps offset back to 0 when it equals stripTotal', () => {
    expect(wrapStripOffset(22, 22)).toBe(0)
  })

  it('wraps offset when it exceeds stripTotal', () => {
    expect(wrapStripOffset(25, 22)).toBe(3)
  })

  it('handles large multiples of stripTotal correctly', () => {
    expect(wrapStripOffset(2200, 22)).toBe(0)
    expect(wrapStripOffset(2203, 22)).toBe(3)
  })
})

describe('decelerateVelocity', () => {
  it('multiplies velocity by decelFactor', () => {
    const result = decelerateVelocity(40, 0.88)
    expect(result).toBeCloseTo(35.2, 5)
  })

  it('returns a smaller positive value than input', () => {
    const result = decelerateVelocity(30, 0.5)
    expect(result).toBeLessThan(30)
    expect(result).toBeGreaterThan(0)
  })

  it('never returns a negative value', () => {
    // Even with edge case inputs, result should be >= 0
    expect(decelerateVelocity(0, 0.88)).toBe(0)
    expect(decelerateVelocity(-5, 0.88)).toBe(0)
  })
})

describe('isReadyToSnap', () => {
  it('returns true when velocity is below minSnapVelocity', () => {
    expect(isReadyToSnap(1.0, 1.5)).toBe(true)
  })

  it('returns false when velocity is above minSnapVelocity', () => {
    expect(isReadyToSnap(10, 1.5)).toBe(false)
  })

  it('returns true when velocity equals minSnapVelocity exactly', () => {
    expect(isReadyToSnap(1.5, 1.5)).toBe(true)
  })
})

describe('snapToNearestSymbol', () => {
  it('returns 0 for offset 0', () => {
    expect(snapToNearestSymbol(0)).toBe(0)
  })

  it('rounds down to nearest SYMBOL_HEIGHT multiple below', () => {
    // SYMBOL_HEIGHT = 160, so offset 75 should round to 160 * round(75/160) = 160 * 0 = 0
    expect(snapToNearestSymbol(75)).toBe(0)
  })

  it('rounds up to nearest SYMBOL_HEIGHT multiple when closer to next', () => {
    // SYMBOL_HEIGHT = 160, so offset 100 should round to 160 * round(100/160) = 160 * 1 = 160
    expect(snapToNearestSymbol(100)).toBe(160)
  })

  it('returns exact multiple unchanged when already on grid', () => {
    expect(snapToNearestSymbol(320)).toBe(320)
  })
})

describe('getSymbolIndexAtRow', () => {
  it('returns stopPosition for row 0 (top)', () => {
    expect(getSymbolIndexAtRow(5, 0, 22)).toBe(5)
  })

  it('returns (stopPosition + 1) % stripLength for row 1', () => {
    expect(getSymbolIndexAtRow(5, 1, 22)).toBe(6)
  })

  it('returns (stopPosition + 2) % stripLength for row 2', () => {
    expect(getSymbolIndexAtRow(5, 2, 22)).toBe(7)
  })

  it('wraps correctly at end of strip', () => {
    expect(getSymbolIndexAtRow(21, 2, 22)).toBe(1)
  })
})

describe('symbolYPosition', () => {
  it('returns 0 for symbol index 0', () => {
    expect(symbolYPosition(0)).toBe(0)
  })

  it('returns SYMBOL_HEIGHT for symbol index 1', () => {
    expect(symbolYPosition(1)).toBe(SYMBOL_HEIGHT)
  })

  it('returns negative SYMBOL_HEIGHT for symbol index -1 (above viewport)', () => {
    expect(symbolYPosition(-1)).toBe(-SYMBOL_HEIGHT)
  })
})

import { describe, it, expect } from 'vitest'
import { RNGEngine } from '@/game/engine/RNGEngine'
import { REEL_STRIPS } from '@/game/config/reelStrips'

describe('RNGEngine', () => {
  const engine = new RNGEngine()

  it('returns exactly 5 stop positions', () => {
    const positions = engine.generateStopPositions()
    expect(positions).toHaveLength(5)
  })

  it('each stop position is within bounds of its reel strip', () => {
    const positions = engine.generateStopPositions()
    positions.forEach((pos, reelIndex) => {
      expect(pos).toBeGreaterThanOrEqual(0)
      expect(pos).toBeLessThan(REEL_STRIPS[reelIndex].length)
    })
  })

  it('generates non-trivially varied positions across 1000 spins', () => {
    const counts = Array.from({ length: 5 }, () => new Map<number, number>())
    for (let i = 0; i < 1000; i++) {
      engine.generateStopPositions().forEach((pos, reelIndex) => {
        counts[reelIndex].set(pos, (counts[reelIndex].get(pos) ?? 0) + 1)
      })
    }
    counts.forEach((reelCounts) => {
      reelCounts.forEach((count) => {
        expect(count / 1000).toBeLessThan(0.15)
      })
    })
  })
})

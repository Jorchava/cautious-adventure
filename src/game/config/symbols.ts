import type { SymbolDefinition } from '@/types/game.types'

export const SYMBOL_DEFINITIONS: SymbolDefinition[] = [
  { id: 'WILD', displayName: 'Neon Lightning', spritePath: '/sprites/wild.png', payouts: { 3: 100, 4: 500, 5: 2000 } },
  { id: 'SCATTER', displayName: 'Neon Star', spritePath: '/sprites/scatter.png', payouts: {} },
  { id: 'HIGH_A', displayName: 'Neon Diamond', spritePath: '/sprites/high_a.png', payouts: { 3: 50, 4: 200, 5: 1000 } },
  { id: 'HIGH_B', displayName: 'Neon Seven', spritePath: '/sprites/high_b.png', payouts: { 3: 25, 4: 100, 5: 500 } },
  { id: 'LOW_A', displayName: 'Neon Bar', spritePath: '/sprites/low_a.png', payouts: { 3: 10, 4: 50, 5: 200 } },
  { id: 'LOW_B', displayName: 'Neon Bell', spritePath: '/sprites/low_b.png', payouts: { 2: 5, 3: 10, 4: 25, 5: 100 } },
]

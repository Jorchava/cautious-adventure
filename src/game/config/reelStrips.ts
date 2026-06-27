import type { SymbolId } from '@/types/game.types'

export const REEL_STRIPS: SymbolId[][] = [
  [
    'LOW_B','LOW_A','HIGH_A','LOW_B','HIGH_B','LOW_A','SCATTER',
    'LOW_B','HIGH_A','LOW_A','WILD','LOW_B','HIGH_B','LOW_A',
    'HIGH_A','LOW_B','LOW_A','HIGH_B','LOW_B','HIGH_A','LOW_A','LOW_B',
  ],
  [
    'HIGH_B','LOW_A','LOW_B','HIGH_A','LOW_B','HIGH_B','LOW_A',
    'LOW_B','WILD','LOW_A','HIGH_A','LOW_B','SCATTER','LOW_A',
    'HIGH_B','LOW_B','HIGH_A','LOW_A','LOW_B','HIGH_B','LOW_A','LOW_B',
  ],
  [
    'LOW_A','HIGH_A','LOW_B','LOW_A','HIGH_B','LOW_B','HIGH_A',
    'SCATTER','LOW_A','LOW_B','HIGH_B','LOW_A','WILD','LOW_B',
    'HIGH_A','LOW_A','LOW_B','HIGH_B','LOW_A','HIGH_A','LOW_B','LOW_A',
  ],
  [
    'LOW_B','HIGH_B','LOW_A','LOW_B','HIGH_A','LOW_A','LOW_B',
    'HIGH_B','LOW_A','SCATTER','LOW_B','HIGH_A','LOW_A','WILD',
    'LOW_B','HIGH_B','LOW_A','HIGH_A','LOW_B','LOW_A','HIGH_B','LOW_B',
  ],
  [
    'HIGH_A','LOW_B','LOW_A','HIGH_B','LOW_B','HIGH_A','LOW_A',
    'LOW_B','HIGH_B','LOW_A','LOW_B','WILD','HIGH_A','LOW_A',
    'SCATTER','LOW_B','HIGH_B','LOW_A','HIGH_A','LOW_B','LOW_A','HIGH_B',
  ],
]

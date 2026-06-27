export type GamePhase =
  | 'IDLE'
  | 'SPINNING'
  | 'EVALUATING'
  | 'PAYING'
  | 'FREE_SPINS_INTRO'
  | 'FREE_SPINNING'
  | 'FREE_SPINS_COMPLETE'
  | 'ERROR'

export type SymbolId =
  | 'WILD'
  | 'SCATTER'
  | 'HIGH_A'
  | 'HIGH_B'
  | 'LOW_A'
  | 'LOW_B'

export interface SymbolDefinition {
  id: SymbolId
  displayName: string
  spritePath: string
  payouts: Partial<Record<2 | 3 | 4 | 5, number>>
}

export interface ReelResult {
  symbols: readonly [SymbolId, SymbolId, SymbolId]
  stopPosition: number
}

export interface PaylineResult {
  lineIndex: number
  matchCount: number
  symbolId: SymbolId
  payout: number
  positions: ReadonlyArray<readonly [number, number]>
}

export interface SpinResult {
  reels: readonly [ReelResult, ReelResult, ReelResult, ReelResult, ReelResult]
  paylines: readonly PaylineResult[]
  scatterCount: number
  scatterPositions: ReadonlyArray<readonly [number, number]>
  totalWin: number
  freeSpinsAwarded: number
}

export interface BetConfig {
  coinsPerLine: 1 | 2 | 5 | 10
  linesPlayed: 20
  totalBet: number
}

export interface SpinRecord {
  id: string
  timestamp: string
  bet: number
  win: number
  freeSpinsAwarded: number
}

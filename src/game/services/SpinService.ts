import type { BetConfig, SpinResult } from '@/types/game.types'

export interface SpinService {
  requestSpin(bet: BetConfig): Promise<SpinResult>
}

import type { SpinRecord } from './game.types'

export type HistoryResponse = SpinRecord[]
export type CreateHistoryRequest = Omit<SpinRecord, 'id'>
export type CreateHistoryResponse = SpinRecord

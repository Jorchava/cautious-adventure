import { SYMBOL_HEIGHT } from '@/pixi/constants'

export function wrapStripOffset(offset: number, stripTotal: number): number {
  return ((offset % stripTotal) + stripTotal) % stripTotal
}

export function decelerateVelocity(
  velocity: number,
  decelFactor: number,
): number {
  return Math.max(0, velocity * decelFactor)
}

export function isReadyToSnap(
  velocity: number,
  minSnapVelocity: number,
): boolean {
  return velocity <= minSnapVelocity
}

export function snapToNearestSymbol(offset: number): number {
  return Math.round(offset / SYMBOL_HEIGHT) * SYMBOL_HEIGHT
}

export function getSymbolIndexAtRow(
  stopPosition: number,
  row: number,
  stripLength: number,
): number {
  return (stopPosition + row) % stripLength
}

export function symbolYPosition(slotIndex: number): number {
  return slotIndex * SYMBOL_HEIGHT
}

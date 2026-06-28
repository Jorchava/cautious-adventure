export const SYMBOL_HEIGHT = 160
export const REEL_WIDTH = 140
export const REEL_GAP = 8
export const VISIBLE_ROWS = 3
export const REEL_COUNT = 5

export const TOTAL_REEL_WIDTH =
  REEL_COUNT * REEL_WIDTH + (REEL_COUNT - 1) * REEL_GAP
export const VIEWPORT_HEIGHT = SYMBOL_HEIGHT * VISIBLE_ROWS

export const MAX_SPIN_VELOCITY = 40
export const DECEL_FACTOR = 0.88
export const MIN_SNAP_VELOCITY = 1.5
export const CASCADE_STOP_DELAY_MS = 150

export const CANVAS_WIDTH = 900
export const CANVAS_HEIGHT = 640
export const REEL_START_X = (CANVAS_WIDTH - TOTAL_REEL_WIDTH) / 2
export const REEL_START_Y = (CANVAS_HEIGHT - VIEWPORT_HEIGHT) / 2

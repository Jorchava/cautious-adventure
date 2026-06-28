# Architecture: Neon Reels

> Portfolio slot game — senior frontend showcase.
> This document is the single source of truth for all agents and contributors.
> Update it when architectural decisions change. Never let code and documentation drift apart.

---

## 1. Project Overview

**Neon Reels** is a browser-based 5-reel, 3-row video slot machine built to demonstrate senior-level frontend engineering. The game features a neon/cyberpunk aesthetic rendered entirely in PixiJS v8, with state management via Pinia, a typed finite state machine, configuration-driven game logic, REST-backed win history, and full TDD coverage on the game engine.

This is a portfolio piece. No real money is involved. The RNG runs client-side and is documented as a portfolio constraint — production slots require certified server-side RNG.

---

## 2. Goals

- Demonstrate PixiJS v8 mastery: scenes, reel animation, win lines, particles, filters
- Demonstrate layered architecture: game logic fully decoupled from rendering and Vue
- Demonstrate state machine design: typed FSM, 8 states, explicit transitions
- Demonstrate TypeScript discipline: strict mode, zero implicit `any`, documented interfaces
- Demonstrate TDD: game engine has ≥90% line coverage via Vitest
- Demonstrate REST integration: spin history via json-server mock API
- Ship a complete, playable game — not a prototype

---

## 3. Non-Goals

- No real money, gambling compliance, or age gates
- No server-side RNG (production requirement documented, not implemented)
- No persistent user accounts or authentication
- No multiplayer
- No Nuxt — this is a pure SPA; SSR provides zero value for a canvas game
- No mobile-native build — responsive web only

---

## 4. Game Specification

### 4.1 Reel Layout

- **5 reels × 3 visible rows** — 15 symbol positions total
- Reels spin independently, stopping left to right with a **150ms cascade delay**
- Each reel has a symbol strip of 22 symbols; a random stop position determines which 3 are visible

### 4.2 Symbols

Payout multipliers apply to `coinsPerLine × multiplier`.

| ID | Display Name | 2x | 3x | 4x | 5x | Notes |
|----|--------------|----|----|----|----|-|
| `WILD` | Neon Lightning | — | 100 | 500 | 2000 | Substitutes all except SCATTER |
| `SCATTER` | Neon Star | — | — | — | — | Triggers free spins anywhere on reels |
| `HIGH_A` | Neon Diamond | — | 50 | 200 | 1000 | |
| `HIGH_B` | Neon Seven | — | 25 | 100 | 500 | |
| `LOW_A` | Neon Bar | — | 10 | 50 | 200 | |
| `LOW_B` | Neon Bell | 5 | 10 | 25 | 100 | Only symbol paying for 2 of a kind |

Wins pay **left to right**, starting from reel index 0. WILD substitutes in any position. SCATTER does not count as a payline win — it triggers free spins based on total count across all reels.

### 4.3 Paylines

20 fixed paylines. Row indices: `0` = top, `1` = middle, `2` = bottom.

```typescript
// src/game/config/paylines.ts
export const PAYLINES: number[][] = [
  [1, 1, 1, 1, 1], // 0  — middle straight
  [0, 0, 0, 0, 0], // 1  — top straight
  [2, 2, 2, 2, 2], // 2  — bottom straight
  [0, 1, 2, 1, 0], // 3  — V shape
  [2, 1, 0, 1, 2], // 4  — inverse V
  [0, 0, 1, 2, 2], // 5  — diagonal down
  [2, 2, 1, 0, 0], // 6  — diagonal up
  [1, 0, 0, 0, 1], // 7  — top dip
  [1, 2, 2, 2, 1], // 8  — bottom dip
  [0, 1, 0, 1, 0], // 9  — zigzag top
  [2, 1, 2, 1, 2], // 10 — zigzag bottom
  [1, 0, 1, 0, 1], // 11 — alternating top
  [1, 2, 1, 2, 1], // 12 — alternating bottom
  [0, 0, 1, 0, 0], // 13 — top middle peak
  [2, 2, 1, 2, 2], // 14 — bottom middle peak
  [0, 1, 1, 1, 0], // 15 — shallow V
  [2, 1, 1, 1, 2], // 16 — shallow inverse V
  [1, 1, 0, 1, 1], // 17 — top dip middle
  [1, 1, 2, 1, 1], // 18 — bottom bump middle
  [0, 0, 0, 1, 2], // 19 — step down right
]
```

### 4.4 Reel Strips

Each reel has a 22-symbol strip. The RNG picks a random start position; the 3 visible rows show `[pos, pos+1, pos+2]` modulo strip length.

```typescript
// src/game/config/reelStrips.ts
export const REEL_STRIPS: SymbolId[][] = [
  // Reel 0
  ['LOW_B','LOW_A','HIGH_A','LOW_B','HIGH_B','LOW_A','SCATTER',
   'LOW_B','HIGH_A','LOW_A','WILD','LOW_B','HIGH_B','LOW_A',
   'HIGH_A','LOW_B','LOW_A','HIGH_B','LOW_B','HIGH_A','LOW_A','LOW_B'],
  // Reel 1
  ['HIGH_B','LOW_A','LOW_B','HIGH_A','LOW_B','HIGH_B','LOW_A',
   'LOW_B','WILD','LOW_A','HIGH_A','LOW_B','SCATTER','LOW_A',
   'HIGH_B','LOW_B','HIGH_A','LOW_A','LOW_B','HIGH_B','LOW_A','LOW_B'],
  // Reel 2
  ['LOW_A','HIGH_A','LOW_B','LOW_A','HIGH_B','LOW_B','HIGH_A',
   'SCATTER','LOW_A','LOW_B','HIGH_B','LOW_A','WILD','LOW_B',
   'HIGH_A','LOW_A','LOW_B','HIGH_B','LOW_A','HIGH_A','LOW_B','LOW_A'],
  // Reel 3
  ['LOW_B','HIGH_B','LOW_A','LOW_B','HIGH_A','LOW_A','LOW_B',
   'HIGH_B','LOW_A','SCATTER','LOW_B','HIGH_A','LOW_A','WILD',
   'LOW_B','HIGH_B','LOW_A','HIGH_A','LOW_B','LOW_A','HIGH_B','LOW_B'],
  // Reel 4
  ['HIGH_A','LOW_B','LOW_A','HIGH_B','LOW_B','HIGH_A','LOW_A',
   'LOW_B','HIGH_B','LOW_A','LOW_B','WILD','HIGH_A','LOW_A',
   'SCATTER','LOW_B','HIGH_B','LOW_A','HIGH_A','LOW_B','LOW_A','HIGH_B'],
]
```

### 4.5 Features

**Wild** — Substitutes for `HIGH_A`, `HIGH_B`, `LOW_A`, `LOW_B` anywhere on a payline. Does not substitute for `SCATTER`.

**Scatter / Free Spins:**

| Scatter Count | Scatter Award | Free Spins |
|--------------|---------------|------------|
| 3 anywhere | 10× total bet | 10 free spins |
| 4 anywhere | 20× total bet | 15 free spins |
| 5 anywhere | 50× total bet | 20 free spins |

Free spins run at the triggering spin's bet. Free spins do not re-trigger (v1 simplification).

**Autoplay** — 5, 10, or 25 automatic spins. Auto-stops on: free spins trigger, balance below minimum bet, or manual stop.

### 4.6 Credit System

| Setting | Value |
|---------|-------|
| Starting balance | 1,000 credits |
| Coins per line options | 1, 2, 5, 10 |
| Fixed paylines | 20 |
| Min total bet | 20 |
| Max total bet | 200 |
| Default bet | 20 (1 coin × 20 lines) |

---

## 5. Technical Architecture

### 5.1 Layer Model

```
┌───────────────────────────────────────────────────────────┐
│  Vue UI Layer                                             │
│  BetPanel · SpinButton · BalanceDisplay · Paytable        │
│  WinHistory · MuteToggle                                  │
│  — User input only. Reads Pinia. Contains zero game logic.│
├───────────────────────────────────────────────────────────┤
│  Pinia State Layer                                        │
│  useGameStore · useHistoryStore                           │
│  — Single source of truth. Bridges all other layers.      │
├────────────────────────┬──────────────────────────────────┤
│  PixiJS Render Layer   │  Game Logic Layer                │
│  SceneManager          │  RNGEngine                       │
│  GameScene             │  PaylineEvaluator                │
│  ReelComponent         │  ClientSpinService               │
│  WinLine               │  HistoryService                  │
│  WinParticles          │                                  │
│  — Reads Pinia.        │  — Pure TypeScript.              │
│  No game logic.        │  Zero framework imports.         │
└────────────────────────┴──────────────────────────────────┘
```

**Critical rule:** `src/game/` must have zero imports from `vue`, `pixi.js`, or `pinia`.
This makes it fully unit-testable without DOM, canvas, or framework setup.

### 5.2 Directory Structure

```
neon-reels/
│
├── docs/
│   ├── architecture.md          ← This file — source of truth
│   ├── pixi-v8-patterns.md      ← Verified PixiJS v8 patterns for agents
│   └── decisions/               ← ADRs as needed
│
├── src/
│   ├── game/                    ← Pure TypeScript. No framework dependencies.
│   │   ├── config/
│   │   │   ├── symbols.ts       ← Symbol definitions + payout tables
│   │   │   ├── paylines.ts      ← 20 payline row-index arrays
│   │   │   └── reelStrips.ts    ← 5 reel symbol strips
│   │   ├── engine/
│   │   │   ├── RNGEngine.ts         ← Generates stop positions per reel
│   │   │   └── PaylineEvaluator.ts  ← Evaluates all 20 paylines
│   │   └── services/
│   │       ├── SpinService.ts        ← Interface (swappable)
│   │       ├── ClientSpinService.ts  ← Portfolio RNG implementation
│   │       └── HistoryService.ts     ← REST client for json-server
│   │
│   ├── pixi/                    ← PixiJS rendering. Reads from Pinia, never writes.
│   │   ├── SceneManager.ts          ← Owns Application, mounts/unmounts scenes
│   │   ├── scenes/
│   │   │   ├── LoadingScene.ts      ← Asset loading with progress bar
│   │   │   └── GameScene.ts         ← Main game canvas composition
│   │   └── components/
│   │       ├── ReelComponent.ts     ← Single reel: strip management + animation
│   │       ├── SymbolSprite.ts      ← Single symbol sprite with win animation
│   │       ├── WinLine.ts           ← Graphics-drawn payline highlight
│   │       └── WinParticles.ts      ← ParticleContainer burst for big wins
│   │
│   ├── stores/
│   │   ├── useGameStore.ts          ← phase, balance, bet, lastResult, freeSpins
│   │   └── useHistoryStore.ts       ← session records, REST sync
│   │
│   ├── composables/
│   │   ├── useGameMachine.ts        ← FSM: all state transitions and guards
│   │   ├── usePixiApp.ts            ← PixiJS Application lifecycle (Vue composable)
│   │   └── useAudio.ts              ← @pixi/sound management
│   │
│   ├── components/              ← Vue UI. Reads Pinia. No game logic.
│   │   ├── GameCanvas.vue           ← Canvas wrapper, mounts PixiJS via usePixiApp
│   │   ├── BetPanel.vue             ← Coin selector, total bet display
│   │   ├── BalanceDisplay.vue       ← Credits and last win
│   │   ├── SpinButton.vue           ← Primary action (spin / stop autoplay)
│   │   ├── Paytable.vue             ← Full-screen overlay with symbol payouts
│   │   └── WinHistory.vue           ← Last 10 spins from HistoryService
│   │
│   ├── types/
│   │   ├── game.types.ts            ← All shared game interfaces (source below)
│   │   ├── pixi.types.ts            ← PixiJS extension and scene interfaces
│   │   └── api.types.ts             ← REST request/response types
│   │
│   ├── assets/
│   │   ├── sprites/                 ← Symbol textures (Kenney Casino Pack or custom)
│   │   ├── audio/                   ← .ogg + .mp3 pairs for browser compatibility
│   │   └── styles/
│   │       ├── _variables.scss      ← Neon color tokens, spacing
│   │       ├── _reset.scss
│   │       └── main.scss
│   │
│   └── App.vue
│
├── tests/
│   ├── unit/
│   │   ├── game/
│   │   │   ├── config.spec.ts
│   │   │   ├── RNGEngine.spec.ts
│   │   │   ├── PaylineEvaluator.spec.ts
│   │   │   ├── ClientSpinService.spec.ts
│   │   │   └── rtp.spec.ts          ← 100k spin simulation (bonus)
│   │   └── stores/
│   │       ├── useGameStore.spec.ts
│   │       └── useHistoryStore.spec.ts
│   └── setup.ts
│
├── db.json                      ← json-server database (history records)
├── AGENTS.md
├── SKILLS.md
├── PROJECT_CONTEXT.md
├── OPEN_CODE_PROMPT.md
├── package.json
├── vite.config.ts
├── vitest.config.ts
└── tsconfig.json
```

---

## 6. State Machine

### 6.1 States

| State | Description | Can spin? |
|-------|-------------|-----------|
| `IDLE` | Awaiting player action. Bet controls enabled. | ✅ |
| `SPINNING` | Reels animating. Stop button available for autoplay. | ❌ |
| `EVALUATING` | Reel results received. Calculating payline wins. | ❌ |
| `PAYING` | Win animations playing. Balance incrementing gradually. | ❌ |
| `FREE_SPINS_INTRO` | Scatter triggered — full-screen intro animation. | ❌ |
| `FREE_SPINNING` | Free spin in progress (same loop as `SPINNING` + `EVALUATING`). | ❌ |
| `FREE_SPINS_COMPLETE` | All free spins done. Showing total win. | ❌ (tap to continue) |
| `ERROR` | Network or validation failure. Error message shown. | ❌ (reset available) |

### 6.2 Transitions

```
IDLE
  --[SPIN pressed + balance >= totalBet]--> SPINNING

SPINNING
  --[all 5 reels stopped]--> EVALUATING

EVALUATING
  --[totalWin === 0 AND freeSpinsAwarded === 0]--> IDLE
  --[totalWin > 0  AND freeSpinsAwarded === 0]--> PAYING
  --[freeSpinsAwarded > 0]--> FREE_SPINS_INTRO

PAYING
  --[win animation complete + balance settled]--> IDLE

FREE_SPINS_INTRO
  --[intro animation complete]--> FREE_SPINNING

FREE_SPINNING
  --[spin complete + freeSpinsRemaining > 0]--> FREE_SPINNING (loop)
  --[spin complete + freeSpinsRemaining === 0]--> FREE_SPINS_COMPLETE

FREE_SPINS_COMPLETE
  --[player taps continue]--> IDLE

Any state
  --[unhandled exception or network error]--> ERROR

ERROR
  --[player taps reset]--> IDLE
```

### 6.3 TypeScript Types

```typescript
// src/types/game.types.ts

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
  symbols: [SymbolId, SymbolId, SymbolId] // [top, middle, bottom]
  stopPosition: number                      // index into reel strip
}

export interface PaylineResult {
  lineIndex: number
  matchCount: number
  symbolId: SymbolId               // the matching symbol (after Wild substitution)
  payout: number                   // in credits
  positions: Array<[number, number]> // [reelIndex, rowIndex] for each matched symbol
}

export interface SpinResult {
  reels: [ReelResult, ReelResult, ReelResult, ReelResult, ReelResult]
  paylines: PaylineResult[]        // only winning paylines
  scatterCount: number
  scatterPositions: Array<[number, number]>  // [reelIndex, rowIndex]
  totalWin: number                 // sum of all paylines[].payout + scatter award
  freeSpinsAwarded: number
}

export interface BetConfig {
  coinsPerLine: 1 | 2 | 5 | 10
  linesPlayed: 20                  // always 20 (fixed paylines)
  totalBet: number                 // coinsPerLine × 20
}

export interface SpinRecord {
  id: string
  timestamp: string
  bet: number
  win: number
  freeSpinsAwarded: number
}
```

---

## 7. Service Interfaces

### 7.1 SpinService

```typescript
// src/game/services/SpinService.ts

import type { BetConfig, SpinResult } from '@/types/game.types'

export interface SpinService {
  /**
   * Request a spin result for the given bet configuration.
   *
   * Portfolio implementation: ClientSpinService — deterministic client-side RNG.
   * Production implementation: ServerSpinService — certified RNG endpoint.
   * Both implement this interface; swap at the DI boundary in useGameMachine.
   */
  requestSpin(bet: BetConfig): Promise<SpinResult>
}
```

`ClientSpinService` composes:
- `RNGEngine.generateStopPositions()` → 5 stop indices
- `PaylineEvaluator.evaluate(reels, bet)` → `PaylineResult[]`
- Scatter counting + free spins calculation

### 7.2 HistoryService

```typescript
// src/game/services/HistoryService.ts

import type { SpinRecord } from '@/types/game.types'

export interface HistoryService {
  getHistory(limit?: number): Promise<SpinRecord[]>
  recordSpin(record: Omit<SpinRecord, 'id'>): Promise<SpinRecord>
}
```

**REST Endpoints** (json-server at `http://localhost:3001`):

| Method | URL | Description |
|--------|-----|-------------|
| `GET` | `/history?_sort=timestamp&_order=desc&_limit=10` | Fetch last 10 spins |
| `POST` | `/history` | Record a completed spin |

**db.json** (json-server database):
```json
{
  "history": []
}
```

### 7.3 AudioService (via useAudio composable)

```typescript
// Managed by src/composables/useAudio.ts using @pixi/sound

export type SoundKey =
  | 'reel_spin'
  | 'reel_stop'
  | 'win_small'       // totalWin < 5× bet
  | 'win_medium'      // totalWin 5–20× bet
  | 'win_big'         // totalWin > 20× bet
  | 'free_spins_trigger'
  | 'button_click'
  | 'autoplay_stop'

export interface AudioService {
  play(key: SoundKey): void
  stop(key: SoundKey): void
  setMuted(muted: boolean): void
}
```

---

## 8. Pinia Stores

### useGameStore

```typescript
// src/stores/useGameStore.ts
export const useGameStore = defineStore('game', () => {
  // State
  const phase = ref<GamePhase>('IDLE')
  const balance = ref(1000)
  const bet = ref<BetConfig>({ coinsPerLine: 1, linesPlayed: 20, totalBet: 20 })
  const lastResult = ref<SpinResult | null>(null)
  const freeSpinsRemaining = ref(0)
  const autoplayRemaining = ref(0)
  const error = ref<string | null>(null)

  // Computed
  const canSpin = computed(() =>
    phase.value === 'IDLE' && balance.value >= bet.value.totalBet
  )

  // Actions: setPhase, updateBalance, setBetCoin, setResult, setError, resetError
  // All actions validate state before mutating

  return {
    phase, balance, bet, lastResult,
    freeSpinsRemaining, autoplayRemaining, error,
    canSpin
  }
})
```

### useHistoryStore

```typescript
// src/stores/useHistoryStore.ts
export const useHistoryStore = defineStore('history', () => {
  const records = ref<SpinRecord[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions: fetchHistory (calls HistoryService.getHistory), addRecord
  // addRecord optimistically prepends to records, then persists via HistoryService

  return { records, isLoading, error }
})
```

---

## 9. PixiJS Scene Architecture

### 9.1 Container Hierarchy (GameScene)

```
Application.stage
└── GameScene (Container)
    ├── BackgroundContainer   z=0  Static neon background + gradient
    ├── ReelContainer         z=1  The 5 reels
    │   ├── ReelMask              Graphics mask: clips to 3×5 viewport
    │   ├── ReelComponent[0]
    │   ├── ReelComponent[1]
    │   ├── ReelComponent[2]
    │   ├── ReelComponent[3]
    │   └── ReelComponent[4]
    ├── FrameContainer        z=2  Decorative chrome frame over reels
    ├── WinLineContainer      z=3  Payline highlight overlays
    └── ParticleContainer     z=4  Win celebration particles (big wins only)
```

### 9.2 Reel Animation Strategy

Each `ReelComponent` manages a vertical strip of `STRIP_LENGTH + 3` symbol sprites.
On spin:

1. `spin()` — Sets `velocity = MAX_VELOCITY`, Ticker begins decrementing `stripOffset`
2. Symbols recycle: when a sprite's computed `y` exceeds `VISIBLE_HEIGHT`, it repositions at top with the next symbol from the strip
3. `stop(targetStopIndex)` — Triggers deceleration easing; snaps to exact pixel grid on arrival
4. Emits `'stopped'` event — `GameScene` waits for all 5 before transitioning to `EVALUATING`

Constants:
```typescript
const SYMBOL_HEIGHT = 160       // px
const REEL_WIDTH = 140          // px
const VISIBLE_ROWS = 3
const MAX_VELOCITY = 40         // px per tick at 60fps
const DECELERATION = 0.92       // multiplied per tick during decel
const REEL_CASCADE_DELAY = 150  // ms between each reel stopping
```

### 9.3 Win Line Rendering

After `EVALUATING` resolves with winning paylines:

1. `WinLineContainer` draws each winning payline path using `Graphics.moveTo/lineTo`
2. Each winning `SymbolSprite` plays a `scale` pulse (1.0 → 1.15 → 1.0) via Ticker
3. Non-winning symbols dim to `alpha = 0.35`
4. After `PAYING_DURATION` ms: emit `'payingComplete'` → `useGameMachine` transitions to `IDLE`

### 9.4 Scene Transitions

`SceneManager` holds the `Application` and manages scene lifecycle:

```typescript
class SceneManager {
  private app: Application
  private currentScene: IScene | null = null

  async switchScene(scene: IScene): Promise<void> {
    if (this.currentScene) {
      this.currentScene.destroy()
      this.app.stage.removeChild(this.currentScene)
    }
    this.currentScene = scene
    await scene.init()
    this.app.stage.addChild(scene)
  }
}

interface IScene extends Container {
  init(): Promise<void>
  destroy(options?: { children: boolean }): void
}
```

---

## 10. Testing Strategy

### Coverage Requirements

| Module | Tool | Required Coverage | Priority |
|--------|------|------------------|----------|
| `RNGEngine` | Vitest | 100% | Critical |
| `PaylineEvaluator` | Vitest | 100% | Critical |
| `ClientSpinService` | Vitest | 100% | Critical |
| `useGameStore` | Vitest + Pinia | 90% | High |
| `useGameMachine` | Vitest | 90% | High |
| `HistoryService` | Vitest (vi.mock fetch) | 80% | Medium |
| Vue components | Vitest + @vue/test-utils | Integration | Medium |
| PixiJS rendering | Manual / visual | — | Low |

### Key Test Cases for PaylineEvaluator

These specific cases must be covered — they define correct behavior:

- 3× `HIGH_A` on line 0 (middle straight) returns correct payout
- 5× `HIGH_B` returns correct 5x payout multiplied by `coinsPerLine`
- `WILD` in position 0 completes a `HIGH_A` run → counted as `HIGH_A` payout
- `WILD` does NOT substitute for `SCATTER`
- `LOW_B` pays for exactly 2 of a kind; no other symbol does
- `SCATTER` on reel 0 + reel 1 = 0 free spins (needs 3 minimum)
- `SCATTER` count 3/4/5 awards correct free spins and multipliers
- Payline 3 (V shape: rows `[0,1,2,1,0]`) evaluates with correct positions

### RTP Simulation Test (demonstrates seniority)

```typescript
// tests/unit/game/rtp.spec.ts
it('RTP is within 93–99% over 100,000 spins at 1 coin/line', () => {
  const service = new ClientSpinService()
  const bet: BetConfig = { coinsPerLine: 1, linesPlayed: 20, totalBet: 20 }
  let totalWagered = 0
  let totalWon = 0

  for (let i = 0; i < 100_000; i++) {
    // synchronous version needed for simulation — expose sync method
    totalWagered += bet.totalBet
    totalWon += simulateSpin(bet).totalWin
  }

  const rtp = totalWon / totalWagered
  expect(rtp).toBeGreaterThan(0.93)
  expect(rtp).toBeLessThan(0.99)
})
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/game/**', 'src/stores/**', 'src/composables/**'],
      thresholds: { lines: 90, functions: 90 },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
```

---

## 11. Performance Targets

| Metric | Target |
|--------|--------|
| Reel spin FPS | 60 FPS (no drops during all-5 simultaneous spin) |
| Bundle size | < 600 KB gzipped (excluding game assets) |
| First paint | < 2s on simulated 4G (loading scene covers asset fetch) |
| Memory | No growth after 100 consecutive spins (Chrome DevTools memory profiler) |
| PixiJS objects | All sprites destroyed on scene exit — zero orphan textures |

---

## 12. Assets and Credits

### Sprites
- **Kenney Casino Pack** — https://kenney.nl/assets/casino-pack — CC0
- **Kenney UI Pack Space** — https://kenney.nl/assets/ui-pack-space — CC0
- Alternative for v1: generate symbols with PixiJS `Graphics` (no asset dependency, shows API skill)

### Audio
- **freesound.org** — search "slot machine reel", "coin win", "slot stop" — filter CC0
- **Mixkit.co** — Free game sounds, no attribution required

### Fonts
- **Orbitron** — fonts.google.com/specimen/Orbitron — Open Font License (neon/cyberpunk aesthetic)

### Attribution format (in-game credits screen + README)
```
Casino assets: Kenney (kenney.nl) — CC0
Audio: freesound.org contributors — see docs/sound-credits.md
Font: Orbitron — Google Fonts — OFL
```

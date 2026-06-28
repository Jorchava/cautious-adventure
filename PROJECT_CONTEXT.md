# PROJECT_CONTEXT.md
> Project-specific context for Neon Reels. Read alongside AGENTS.md and SKILLS.md.
> Updated: Session 0 (planning phase complete).

---

## Project Overview

Neon Reels is a browser-based 5-reel, 3-row video slot machine with a neon/cyberpunk aesthetic.
It is a senior frontend portfolio piece demonstrating PixiJS v8 rendering, layered architecture,
a typed finite state machine, TDD-covered game logic, REST-backed spin history, and TypeScript
strict mode throughout. No real money is involved. The RNG is client-side by design (documented
portfolio constraint — production slots require server-side certified RNG).

---

## Core Goals

- [x] Define architecture, types, and game spec (complete — see docs/architecture.md)
- [ ] Implement tested game logic layer (RNGEngine, PaylineEvaluator, SpinService)
- [ ] Implement PixiJS reel animation and scene management
- [ ] Implement Vue UI layer (BetPanel, SpinButton, Paytable, WinHistory)
- [ ] Ship a complete, playable game with free spins and autoplay

---

## Non-Goals

- No real money or gambling compliance
- No server-side RNG (documented — production would require certified backend)
- No persistent user accounts
- No multiplayer
- No Nuxt — pure SPA, canvas game has no SSR use case
- No mobile-native build — responsive web only

---

## Stack Decisions

| Technology | Version | Justification for Neon Reels |
|-----------|---------|------------------------------|
| Vue 3 | Latest | Component architecture for HUD/overlay UI |
| Vite | Latest | Fast HMR, native PixiJS compatibility, no SSR overhead |
| PixiJS | v8.x | WebGL-accelerated canvas for 60fps reel animation |
| Pinia | Latest | Type-safe reactive state bridging game logic and Vue UI |
| Vitest | Latest | Vite-native, fast, happy-dom compatible |
| SCSS | — | Component-scoped styles + neon token variables |
| @pixi/sound | Latest | Official PixiJS audio, integrates with asset loader pipeline |
| json-server | dev dep | Zero-backend mock REST API for spin history (portfolio demo) |
| TypeScript | Strict | Strict mode throughout, no any |
| Nuxt 4 | ❌ NOT USED | Canvas SPA — SSR adds zero value |
| XState | ❌ NOT USED | Custom FSM demonstrates the pattern; XState is a drop-in upgrade if needed |

---

## Architecture Overview

Four layers, each with a single responsibility:

```
Vue UI Layer         — Reads Pinia. Captures user input. No game logic.
Pinia State Layer    — Single source of truth for all layers.
PixiJS Render Layer  — Reads Pinia. Renders reels, animations, particles.
Game Logic Layer     — Pure TypeScript. Zero framework imports. 100% testable.
```

Full detail: `docs/architecture.md`

Key directories:
```
src/game/        — Pure TypeScript game logic (RNG, paylines, services)
src/pixi/        — PixiJS scenes and components
src/stores/      — Pinia (useGameStore, useHistoryStore)
src/composables/ — Vue composables (useGameMachine, usePixiApp, useAudio)
src/components/  — Vue UI components only
src/types/       — Shared TypeScript interfaces
docs/            — Architecture, PixiJS patterns, decisions
```

---

## Game Specification Summary

- **Layout:** 5 reels × 3 rows, 20 fixed paylines
- **Symbols:** WILD, SCATTER, HIGH_A, HIGH_B, LOW_A, LOW_B
- **Features:** Wild substitution, Scatter free spins (3/4/5 = 10/15/20 spins)
- **Bet:** 1/2/5/10 coins × 20 fixed lines = 20–200 total bet range
- **Starting balance:** 1,000 credits
- **Autoplay:** 5, 10, 25 spins with auto-stop on free spins or low balance
- **History:** Last 10 spins via REST API (json-server)

---

## State Machine (8 States)

```
IDLE → SPINNING → EVALUATING → PAYING → IDLE
                             ↘ FREE_SPINS_INTRO → FREE_SPINNING → FREE_SPINS_COMPLETE → IDLE
Any → ERROR → IDLE
```

Full transition table: `docs/architecture.md` section 6.2

---

## Key Constraints

- `src/game/` must have zero imports from `vue`, `pixi.js`, or `pinia`
- PixiJS v8 patterns only — consult `docs/pixi-v8-patterns.md` before any PixiJS code
- No new dependencies without explicit user approval
- `pnpm vitest run` must pass before any task is marked complete
- `pnpm tsc --noEmit` must pass before any task is marked complete
- PixiJS objects created in `onMounted` must be destroyed in `onUnmounted`

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Frame rate | 60 FPS during all-5-reel simultaneous spin |
| Bundle size | < 600 KB gzipped (excluding assets) |
| First paint | < 2s on simulated 4G |
| Memory | No growth after 100 consecutive spins |

---

## Asset Sources

- Sprites: Kenney Casino Pack (kenney.nl/assets/casino-pack) — CC0
- Audio: freesound.org — CC0 (see docs/sound-credits.md when populated)
- Font: Orbitron (fonts.google.com) — Open Font License
- Alternative v1: draw symbols with PixiJS Graphics (no asset dependency)

---

## Development State

### Completed — Sessions 1 & 2
- [x] Governance files: AGENTS.md, SKILLS.md, PROJECT_CONTEXT.md
- [x] docs/architecture.md — complete
- [x] docs/pixi-v8-patterns.md — complete
- [x] Project scaffolded (Vue 3 + Vite + Pinia + PixiJS v8 + Vitest)
- [x] src/types/game.types.ts — all game types defined
- [x] src/game/ — config (symbols, reelStrips, paylines), engine (RNGEngine, PaylineEvaluator), services (SpinService, ClientSpinService, HistoryService, ClientHistoryService)
- [x] src/stores/ — useGameStore, useHistoryStore (composition pattern)
- [x] src/composables/useGameMachine.ts — FSM with all 8 states
- [x] 102 tests passing (game logic, stores, composables, config)
- [x] TypeScript strict mode — zero tsc errors

### Completed — Session 3 (PixiJS Rendering Foundation)
- [x] src/pixi/constants.ts — layout/animation constants
- [x] src/pixi/utils/reelMath.ts — pure animation math (TDD, 21 tests)
- [x] src/pixi/SceneManager.ts — scene lifecycle with switchTo/destroy
- [x] src/pixi/IScene.ts — scene interface (init + destroy)
- [x] src/pixi/components/SymbolSprite.ts — placeholder symbol display with colors
- [x] src/pixi/components/ReelComponent.ts — reel strip animation with deceleration + snap
- [x] src/pixi/scenes/LoadingScene.ts — asset loading with progress bar
- [x] src/pixi/scenes/GameScene.ts — 5-reel composition with cascade stop
- [x] src/composables/usePixiApp.ts — Application lifecycle composable (TDD, 4 tests)
- [x] src/components/GameCanvas.vue — Vue/PixiJS bridge with phase watcher
- [x] src/components/SpinButton.vue — wired to machine.spin()
- [x] src/assets/styles/main.scss — global reset styles
- [x] 136 tests passing (102 baseline + 34 Session 3)
- [x] pnpm tsc --noEmit — zero errors
- [x] pnpm lint — zero errors (2 warnings: vue/one-component-per-file)

### Completed — Session 4 (Win Lines + Core UI)
- [x] src/pixi/components/WinLine.ts — Graphics-drawn payline highlights
- [x] GameScene win animation methods (showWin, clearWin, showWinAnimation)
- [x] ReelComponent.getSpriteAt() — sprite access by row index
- [x] GameCanvas.vue PAYING phase handler — awaits showWinAnimation, calls completePaying()
- [x] BalanceDisplay.vue — live credits + win amount display (TDD)
- [x] BetPanel.vue — coin value selector with validation (TDD)
- [x] Paytable.vue — full-screen overlay with symbol payouts
- [x] App.vue — wired HUD with BalanceDisplay, BetPanel, Paytable toggle
- [x] 152 tests passing (136 baseline + 16 Session 4)
- [x] pnpm tsc — zero errors
- [x] pnpm lint — zero errors (2 pre-existing warnings: vue/one-component-per-file)

### Next — Session 5 (Free Spins + Polish)
- [ ] Free spins intro screen + flow
- [ ] Autoplay (5 / 10 / 25 spins with stop conditions)
- [ ] useAudio.ts wired via @pixi/sound
- [ ] WinHistory.vue + json-server REST integration
- [ ] Neon glow filter on winning symbols

---

## Known Issues / Tech Debt

[NONE — project has not started yet]

---

## Glossary

| Term | Definition in Neon Reels |
|------|--------------------------|
| Reel | One vertical column of spinning symbols (5 total) |
| Strip | The full ordered sequence of symbols on a reel (22 symbols) |
| Stop position | The strip index that lands at row 0 (top) when the reel stops |
| Payline | A predefined path across the 5 reels that is checked for winning combinations |
| Match | Consecutive identical symbols (or Wilds) on a payline, left to right from reel 0 |
| Wild | Symbol that substitutes for any non-Scatter symbol |
| Scatter | Symbol that triggers free spins when 3+ appear anywhere on the reels |
| Free spins | Bonus round of automatic spins at no cost to the player |
| Autoplay | Automatic spin sequence (5/10/25) with configurable stop conditions |
| Phase | The current state of the game FSM (IDLE, SPINNING, etc.) |
| coinsPerLine | Bet multiplier per payline: 1, 2, 5, or 10 |
| totalBet | coinsPerLine × 20 (fixed paylines) |

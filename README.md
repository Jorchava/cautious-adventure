# Neon Reels 🎰

A browser-based 5-reel, 3-row video slot machine with neon/cyberpunk aesthetic, built with PixiJS v8 and Vue 3. Senior frontend portfolio piece demonstrating layered architecture, a typed finite state machine, TDD-covered game logic, and REST-backed spin history.

**Stack:** Vue 3 · TypeScript (strict) · PixiJS v8 · Pinia · SCSS · Vite · Vitest · json-server

---

## What This Demonstrates

| Skill | Implementation |
|-------|---------------|
| **PixiJS v8** | Scene graph, async Application.init, reel deceleration animation, BlurFilter glow, ParticleContainer win burst, Graphics paylines, mask-based viewport clipping |
| **Layered architecture** | Game logic layer (`src/game/`) has zero imports from Vue, PixiJS, or Pinia — fully unit-testable without DOM |
| **Typed FSM** | Custom 8-state finite state machine with explicit transitions, guards, and TypeScript discriminated unions |
| **TDD discipline** | 177 tests covering game engine, stores, composables, and components. Game logic has ~95% branch coverage |
| **REST integration** | Spin history persisted via json-server mock API. HistoryService interface enables swap to any backend |
| **Vue/PixiJS bridge** | Pinia watchers dispatch PixiJS scene actions. No game logic leaks into the render layer |

---

## Architecture

```
┌───────────────────────────────────────────────┐
│  Vue UI Layer                                 │
│  BetPanel · SpinButton · Paytable · WinHistory│
│  — Captures user input. Contains zero game    │
│    logic.                                     │
├───────────────────────────────────────────────┤
│  Pinia State Layer                            │
│  useGameStore · useHistoryStore               │
│  — Single source of truth. Bridges all layers.│
├──────────────────────┬────────────────────────┤
│  PixiJS Render Layer │  Game Logic Layer      │
│  SceneManager        │  RNGEngine             │
│  GameScene           │  PaylineEvaluator      │
│  ReelComponent       │  SpinService           │
│  WinParticles        │  HistoryService        │
│  — Reads Pinia.      │  — Pure TypeScript.    │
│    No game logic.    │    Zero framework deps.│
└──────────────────────┴────────────────────────┘
```

- **Vue UI Layer:** Reads Pinia state. Dispatches user actions via the game machine composable. No business logic.
- **Pinia State Layer:** Single reactive state tree. Keeps `src/pixi/` and `src/game/` frameworks-agnostic.
- **PixiJS Render Layer:** Manages canvas, scenes, reel animations, win effects, particles. Reads Pinia, never writes it.
- **Game Logic Layer:** Pure TypeScript — no Vue, PixiJS, or Pinia imports. Fully testable with `vitest` alone.

---

## State Machine

```
IDLE → SPINNING → EVALUATING → PAYING → IDLE
                     ↘ FREE_SPINS_INTRO → FREE_SPINNING → FREE_SPINS_COMPLETE → IDLE
Any → ERROR → IDLE
```

8 states with typed transitions. Custom FSM (not XState) keeps the dependency light and demonstrates understanding of state machine patterns. Each transition is guarded: insufficient balance cannot spin, free spins cannot re-trigger, etc.

---

## Key Design Decisions

**SpinService interface** — `ClientSpinService` (client-side RNG) and a hypothetical `ServerSpinService` (certified RNG) both implement the same `SpinService` interface. Swap at the DI boundary without changing game logic.

**Game logic isolation** — `src/game/` has zero imports from Vue, PixiJS, or Pinia. This enables 100% synchronous testing without DOM setup. The RNG engine, payline evaluator, and spin service are tested in pure Vitest.

**json-server for history** — A zero-backend mock REST API (`pnpm api` + `pnpm dev`) serves spin history. The `HistoryService` interface makes it trivial to swap to a production API later.

**Reactivity race condition** — Pinia watchers fire between `setPhase('SPINNING')` and `setResult()`, causing a phantom trigger. Fixed by watching the `[phase, lastResult]` tuple with a `spinStarted` flag. Tests couldn't catch this because `vi.mock('pixi.js')` made async timing invisible to Vitest.

---

## Getting Started

```bash
pnpm install          # Install dependencies
pnpm api &            # Start json-server on port 3001 (in background)
pnpm dev              # Start Vite dev server on port 5173
```

Open `http://localhost:5173`. Play the game.

> **Note on audio:** Audio is wired via `@pixi/sound` but requires `.ogg` files in `src/assets/audio/`. The game runs silently when files are absent — no crash, no console noise. See `docs/sound-credits.md` for recommended CC0 sources.

---

## Game Features

- **5 reels × 3 rows**, 20 fixed paylines, 6 symbol types (WILD, SCATTER, HIGH_A/B, LOW_A/B)
- **Left-to-right payline evaluation** with WILD substitution (except SCATTER)
- **Free spins** triggered by 3/4/5 SCATTER symbols: 10/15/20 spins with 10×/20×/50× bet award
- **Autoplay** — 5, 10, or 25 spins with auto-stop on free spins or low balance
- **Neon glow** on winning symbols via animated BlurFilter (pulsing 1–5 strength)
- **Particle burst** on big wins (>20× bet) using PixiJS ParticleContainer
- **Win history** — last 10 spins persisted via REST API, survives page refresh
- **Paytable overlay** with symbol payouts, opens via ℹ button, closes with ESC
- **Mute toggle** for audio control
- **Responsive canvas** — scales down gracefully at 768px viewport width

---

## Testing

```bash
pnpm vitest run       # 177 tests, all passing
pnpm tsc --noEmit     # Zero TypeScript errors (strict mode)
pnpm lint             # Zero ESLint errors/warnings
pnpm vitest --coverage # ~95% line coverage on game logic
```

**Test breakdown:** Game engine (31) · Stores (33) · Composables (41) · Components (35) · PixiJS math (21) · Config (9) · History service (9)

PixiJS rendering is tested manually — the design extracts all pure math into `reelMath.ts` (21 tests), leaving only visual composition in scene classes.

---

## Credits

- **Casino assets:** Kenney (kenney.nl) — CC0
- **Audio:** freesound.org contributors (pending — see docs/sound-credits.md) — CC0
- **Font:** Orbitron — Google Fonts — Open Font License
- **Primary rendering:** PixiJS v8 (pixijs.com)
- **JSON Server:** typicode/json-server

---

## License

MIT

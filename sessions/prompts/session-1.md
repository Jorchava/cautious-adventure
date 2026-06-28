# Session 1 Prompt

## Neon Reels Kickoff Prompt

> Copy this entire document into your first session to begin development.
> Do not abbreviate or skip sections. Every part exists to prevent a known category of mistake.

---

## Mandatory Context — Read Before Any Action

You are a senior TypeScript and PixiJS v8 engineer building a portfolio-quality browser slot game
called **Neon Reels**.

Read these files in full, in this order, before writing a single line of code:

1. `AGENTS.md` — Your behavioral rules and code standards (non-negotiable)
2. `SKILLS.md` — Approved CLI commands and output contracts
3. `PROJECT_CONTEXT.md` — Project goals, constraints, and stack decisions
4. `docs/architecture.md` — Full technical specification (your blueprint for the entire project)
5. `docs/pixi-v8-patterns.md` — Verified PixiJS v8 patterns (consult before any PixiJS code)

**Confirm you have read all five files before proceeding.**
State one-line summaries of what each file told you. Then begin.

---

## Session 1 Goal

Build the typed, tested game foundation. No PixiJS. No Vue components.
Establish the full project scaffold, TypeScript configuration, and the game logic layer
so that every subsequent session builds on a verified, type-safe base.

---

## Session 1 Success Criteria

All of the following must pass before this session is complete:

```
[ ] pnpm vitest run    → exit code 0, all tests green, none skipped
[ ] pnpm tsc --noEmit  → exit code 0, zero TypeScript errors
[ ] pnpm lint          → exit code 0, zero violations
[ ] Directory structure matches docs/architecture.md section 5.2 exactly
[ ] src/game/ has zero imports from 'vue', 'pixi.js', or 'pinia'
[ ] All implemented files have corresponding .spec.ts test files
```

---

## Task Execution Order

Execute tasks strictly in this order. Do not jump ahead.
After each task, confirm its verify step passes before moving to the next.

---

### TASK 1 — Project Scaffold

Scaffold a new Vite + Vue 3 + TypeScript project:

```bash
pnpm create vite neon-reels --template vue-ts
cd neon-reels
```

Install all required dependencies in one command:

```bash
pnpm add pinia pixi.js @pixi/sound
pnpm add -D vitest @vue/test-utils @vitest/coverage-v8 happy-dom \
           json-server @types/node typescript @vue/tsconfig \
           eslint eslint-plugin-vue @typescript-eslint/eslint-plugin
```

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "vitest:run": "vitest run",
    "coverage": "vitest run --coverage",
    "tsc": "vue-tsc --noEmit",
    "lint": "eslint . --ext .vue,.ts,.tsx",
    "api": "json-server --watch db.json --port 3001"
  }
}
```

Create `db.json` in the project root:

```json
{
  "history": []
}
```

Create the full directory structure from `docs/architecture.md` section 5.2.
Create empty placeholder files for all paths listed — even if empty, they should exist
so TypeScript can validate imports from the start.

**Verify:** `pnpm install` completes without errors.

---

### TASK 2 — TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "tests/**/*.ts"]
}
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/game/**', 'src/stores/**', 'src/composables/**'],
      thresholds: { lines: 90, functions: 90, branches: 85 },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
```

Create `tests/setup.ts`:

```typescript
// Global test setup
// Extend with vi.mock entries for canvas/WebGL if needed
import { vi } from 'vitest';

// PixiJS requires canvas — mock it in test environment
vi.mock('pixi.js', () => ({
  Application: vi.fn(() => ({
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    stage: { addChild: vi.fn(), removeChild: vi.fn() },
    ticker: { add: vi.fn(), remove: vi.fn() },
    screen: { width: 1280, height: 720 },
  })),
  Assets: {
    load: vi.fn().mockResolvedValue({}),
    loadBundle: vi.fn().mockResolvedValue({}),
    addBundle: vi.fn(),
  },
  Container: vi.fn(() => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn(),
  })),
  Sprite: vi.fn(() => ({
    position: { set: vi.fn() },
    anchor: { set: vi.fn() },
    destroy: vi.fn(),
  })),
  Graphics: vi.fn(() => ({
    rect: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    moveTo: vi.fn().mockReturnThis(),
    lineTo: vi.fn().mockReturnThis(),
    stroke: vi.fn(),
  })),
}));
```

**Verify:** `pnpm tsc --noEmit` passes (or fails only on empty placeholder files — that is acceptable).

---

### TASK 3 — Game Types

Implement `src/types/game.types.ts` with ALL types from `docs/architecture.md` section 6.3.

Rules:

- No `any` anywhere
- No optional properties unless explicitly listed in the architecture doc as optional
- Export every type
- Use `readonly` on tuple types like `ReelResult.symbols`

**Verify:** `pnpm tsc --noEmit` passes with the types file in place.

---

### TASK 4 — Game Configuration (TDD)

**Write the tests first:**

Create `tests/unit/game/config.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { PAYLINES } from '@/game/config/paylines';
import { REEL_STRIPS } from '@/game/config/reelStrips';
import { SYMBOL_DEFINITIONS } from '@/game/config/symbols';
import type { SymbolId } from '@/types/game.types';

const VALID_SYMBOL_IDS: SymbolId[] = [
  'WILD',
  'SCATTER',
  'HIGH_A',
  'HIGH_B',
  'LOW_A',
  'LOW_B',
];

describe('PAYLINES', () => {
  it('has exactly 20 paylines', () => expect(PAYLINES).toHaveLength(20));
  it('each payline has exactly 5 row indices', () => {
    PAYLINES.forEach((line) => expect(line).toHaveLength(5));
  });
  it('all row indices are 0, 1, or 2', () => {
    PAYLINES.forEach((line) =>
      line.forEach((row) => expect([0, 1, 2]).toContain(row)),
    );
  });
});

describe('REEL_STRIPS', () => {
  it('has exactly 5 reel strips', () => expect(REEL_STRIPS).toHaveLength(5));
  it('each strip has at least 20 symbols', () => {
    REEL_STRIPS.forEach((strip) =>
      expect(strip.length).toBeGreaterThanOrEqual(20),
    );
  });
  it('all symbol IDs are valid', () => {
    REEL_STRIPS.forEach((strip) =>
      strip.forEach((id) => expect(VALID_SYMBOL_IDS).toContain(id)),
    );
  });
});

describe('SYMBOL_DEFINITIONS', () => {
  it('has exactly 6 symbol definitions', () =>
    expect(SYMBOL_DEFINITIONS).toHaveLength(6));
  it('each symbol has an id, displayName, and payouts object', () => {
    SYMBOL_DEFINITIONS.forEach((sym) => {
      expect(sym.id).toBeDefined();
      expect(sym.displayName).toBeDefined();
      expect(sym.payouts).toBeDefined();
    });
  });
  it('LOW_B is the only symbol with a payout for 2 matches', () => {
    const lowB = SYMBOL_DEFINITIONS.find((s) => s.id === 'LOW_B');
    expect(lowB?.payouts[2]).toBeGreaterThan(0);
    const others = SYMBOL_DEFINITIONS.filter(
      (s) => s.id !== 'LOW_B' && s.id !== 'SCATTER',
    );
    others.forEach((s) => expect(s.payouts[2]).toBeUndefined());
  });
});
```

Run: `pnpm vitest run tests/unit/game/config.spec.ts` — **confirm it fails (red) for the right reason.**

Then implement:

- `src/game/config/paylines.ts` — from `docs/architecture.md` section 4.3
- `src/game/config/reelStrips.ts` — from `docs/architecture.md` section 4.4
- `src/game/config/symbols.ts` — from `docs/architecture.md` section 4.2

**Verify:** `pnpm vitest run tests/unit/game/config.spec.ts` passes green.

---

### TASK 5 — RNGEngine (TDD)

**Write the tests first:**

Create `tests/unit/game/RNGEngine.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { RNGEngine } from '@/game/engine/RNGEngine';
import { REEL_STRIPS } from '@/game/config/reelStrips';

describe('RNGEngine', () => {
  const engine = new RNGEngine();

  it('returns exactly 5 stop positions', () => {
    const positions = engine.generateStopPositions();
    expect(positions).toHaveLength(5);
  });

  it('each stop position is within bounds of its reel strip', () => {
    const positions = engine.generateStopPositions();
    positions.forEach((pos, reelIndex) => {
      expect(pos).toBeGreaterThanOrEqual(0);
      expect(pos).toBeLessThan(REEL_STRIPS[reelIndex].length);
    });
  });

  it('generates non-trivially varied positions across 1000 spins', () => {
    const counts = Array.from({ length: 5 }, () => new Map<number, number>());
    for (let i = 0; i < 1000; i++) {
      engine.generateStopPositions().forEach((pos, reelIndex) => {
        counts[reelIndex].set(pos, (counts[reelIndex].get(pos) ?? 0) + 1);
      });
    }
    // No single position should appear > 15% of the time (strips have 22 symbols)
    counts.forEach((reelCounts, reelIndex) => {
      reelCounts.forEach((count) => {
        expect(count / 1000).toBeLessThan(0.15);
      });
    });
  });
});
```

Run: confirm red. Then implement `src/game/engine/RNGEngine.ts`.

**Verify:** `pnpm vitest run tests/unit/game/RNGEngine.spec.ts` green.

---

### TASK 6 — PaylineEvaluator (TDD — most complex unit in the codebase)

**Write the tests first:**

Create `tests/unit/game/PaylineEvaluator.spec.ts`. Cover all of these cases:

```typescript
// Cases to cover (write one describe block per scenario):
// 1. Three matching HIGH_A on line 0 (middle straight) returns correct payout
// 2. Five matching HIGH_B returns correct 5× payout multiplied by coinsPerLine
// 3. WILD in reel 0 completes a HIGH_A 3-match — counted as HIGH_A, correct payout
// 4. WILD does NOT substitute for SCATTER
// 5. No matching symbols → returns empty paylines array
// 6. LOW_B pays for exactly 2 of a kind
// 7. HIGH_A does NOT pay for 2 of a kind
// 8. Payline 3 (V shape: rows [0,1,2,1,0]) evaluates with correct positions
// 9. SCATTER symbols on reels 0 and 1 → paylines array is empty (scatters are not payline wins)
// 10. coinsPerLine = 5 → all payouts are 5× the base multiplier
```

Run: confirm red. Then implement `src/game/engine/PaylineEvaluator.ts`.

The evaluator signature:

```typescript
export class PaylineEvaluator {
  evaluate(reels: ReelResult[], bet: BetConfig): PaylineResult[];
}
```

Internal logic:

1. For each of the 20 paylines:
   - Extract the symbol at each `[reelIndex, rowIndex]` position
   - Resolve WILD substitutions (WILD becomes the adjacent non-WILD, non-SCATTER symbol)
   - Count consecutive matches left to right
   - Look up payout from `SYMBOL_DEFINITIONS`
   - Skip if matchCount < minimum for that symbol
2. Return only winning paylines

**Verify:** `pnpm vitest run tests/unit/game/PaylineEvaluator.spec.ts` green.

---

### TASK 7 — ClientSpinService (TDD — integration)

**Write tests first.** `tests/unit/game/ClientSpinService.spec.ts`:

```typescript
// Cases to cover:
// 1. requestSpin() resolves to a SpinResult matching the interface shape
// 2. totalWin equals the sum of all paylines[].payout
// 3. freeSpinsAwarded is 10 when scatterCount === 3
// 4. freeSpinsAwarded is 15 when scatterCount === 4
// 5. freeSpinsAwarded is 20 when scatterCount === 5
// 6. freeSpinsAwarded is 0 when scatterCount < 3
// 7. reels array has exactly 5 ReelResult entries
// 8. Each ReelResult.symbols has exactly 3 SymbolId entries
```

Implement `src/game/services/SpinService.ts` (interface) and `src/game/services/ClientSpinService.ts`.

`ClientSpinService` composes `RNGEngine` and `PaylineEvaluator` internally.

**Verify:** `pnpm vitest run` (all tests) green.

---

### TASK 8 — useGameStore (TDD)

**Write tests first.** `tests/unit/stores/useGameStore.spec.ts`:

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, it, expect } from 'vitest';
import { useGameStore } from '@/stores/useGameStore';

beforeEach(() => {
  setActivePinia(createPinia());
});

// Cases to cover:
// 1. Initial phase is 'IDLE'
// 2. Initial balance is 1000
// 3. Initial bet is { coinsPerLine: 1, linesPlayed: 20, totalBet: 20 }
// 4. setPhase('SPINNING') updates phase
// 5. updateBalance(+100) adds to balance
// 6. updateBalance(-50) subtracts from balance
// 7. updateBalance(-999999) does not go below 0
// 8. canSpin is true when phase === 'IDLE' and balance >= totalBet
// 9. canSpin is false when phase === 'SPINNING'
// 10. canSpin is false when balance < totalBet
// 11. setBetCoin(5) updates coinsPerLine to 5 and totalBet to 100
// 12. setError('Network failure') sets error and phase to 'ERROR'
```

Implement `src/stores/useGameStore.ts` with all state, actions, and the `canSpin` computed.

**Verify:** `pnpm vitest run tests/unit/stores/useGameStore.spec.ts` green.

---

## End of Session 1 — Final Checklist

Before reporting session complete, confirm every item:

```
[ ] pnpm vitest run   → green, all passing, coverage ≥90% for src/game/
[ ] pnpm tsc --noEmit → zero errors
[ ] pnpm lint         → zero violations
[ ] src/game/ has zero imports from 'vue', 'pixi.js', 'pinia'
[ ] Directory matches docs/architecture.md section 5.2
[ ] No 'any' type in src/game/ or src/types/
[ ] All 8 tasks have corresponding .spec.ts files with passing tests
```

**Report format:**

- Files created (count)
- Test count (passed / total)
- Any deviations from docs/architecture.md (with reasoning)
- Blockers or questions for the next session

---

## Sessions Roadmap

| Session              | Focus                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------- |
| **1 (this session)** | Scaffold + game logic layer + stores (typed, tested)                                     |
| **2**                | `useGameMachine.ts` (FSM, all 8 states), `HistoryService`, `useHistoryStore`             |
| **3**                | PixiJS `SceneManager`, `LoadingScene`, `GameScene` scaffold, `ReelComponent` + animation |
| **4**                | Win evaluation visuals (`WinLine`, symbol dim/pulse), Vue UI components                  |
| **5**                | Free spins flow, Autoplay, `useAudio.ts`, `WinHistory` panel + REST integration          |
| **6**                | Polish: neon glow filters, big win particles, responsive layout, README final            |

---

## Project References (for this session)

- Game types: `docs/architecture.md` section 6.3
- Symbol payouts: `docs/architecture.md` section 4.2
- Payline definitions: `docs/architecture.md` section 4.3
- Reel strips: `docs/architecture.md` section 4.4
- Store shape: `docs/architecture.md` section 8
- Directory structure: `docs/architecture.md` section 5.2
- PixiJS patterns (not needed until session 3): `docs/pixi-v8-patterns.md`

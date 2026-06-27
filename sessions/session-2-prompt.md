# Session 2 Prompt

## Neon Reels: Game State Machine · History Service · History Store

> Paste this entire document into a NEW session.
> Do not continue Session 1. Start fresh — context resets to 0%.

---

## Mandatory Context — Read Before Any Action

Read these files in full, in this order, before writing a single line of code:

1. `AGENTS.md` — Behavioral rules and code standards
2. `SKILLS.md` — Approved CLI commands and output contracts
3. `PROJECT_CONTEXT.md` — Project goals and current development state
4. `docs/architecture.md` — Focus on sections 6 (FSM), 7 (Services), 8 (Stores), 9 (PixiJS — read-ahead only)
5. `docs/pixi-v8-patterns.md` — Read-ahead only; not used this session

Then read the Session 1 output to understand the existing foundation:

```
src/types/game.types.ts
src/stores/useGameStore.ts
src/game/services/SpinService.ts          (interface)
src/game/services/ClientSpinService.ts    (implementation)
src/game/engine/RNGEngine.ts
src/game/engine/PaylineEvaluator.ts
tests/unit/stores/useGameStore.spec.ts    (see what actions already exist)
```

Confirm you have read all files. State what actions currently exist in useGameStore
before beginning Task 1.

---

## Session 2 Goal

Implement the game's complete behavioral layer. By end of session:

- `useGameStore` has all actions needed by the state machine
- `useGameMachine.ts` implements all 8 FSM states with guards and transitions
- `ClientHistoryService.ts` implements the REST client for json-server
- `useHistoryStore.ts` manages history state and delegates to the service

Session 3 will wire all of this to PixiJS rendering. This session is pure
TypeScript and Pinia — no canvas, no PixiJS imports.

---

## Session 2 Success Criteria

```
[ ] pnpm vitest run    → all green, total count higher than Session 1
[ ] pnpm tsc --noEmit  → zero TypeScript errors
[ ] pnpm lint          → zero violations
[ ] useGameMachine covers all 8 states with assertPhase guards
[ ] Invalid transitions throw descriptive error messages
[ ] No real fetch() calls in tests — all HTTP mocked via vi.stubGlobal
[ ] No 'any' types in any new file
```

---

## Tasks — Execute in this order

---

### TASK 1 — Complete useGameStore (TDD additions only)

Read the existing `useGameStore.ts` and `useGameStore.spec.ts`.

The FSM (Task 2) requires these actions. If any are missing from Session 1,
add them with tests before touching the composable:

| Action               | Signature                              | Behaviour                                |
| -------------------- | -------------------------------------- | ---------------------------------------- |
| `setResult`          | `(result: SpinResult \| null) => void` | Sets `lastResult`                        |
| `setFreeSpins`       | `(count: number) => void`              | Sets `freeSpinsRemaining`                |
| `decrementFreeSpins` | `() => void`                           | Subtracts 1, floor at 0                  |
| `resetError`         | `() => void`                           | Clears `error` — does NOT change `phase` |

Add only the missing ones. Do not touch actions that already pass tests.

New test cases to add (only if the action is new):

```typescript
// Add to tests/unit/stores/useGameStore.spec.ts

it('setResult stores a SpinResult in lastResult');
it('setResult(null) clears lastResult to null');
it('setFreeSpins(10) sets freeSpinsRemaining to 10');
it('decrementFreeSpins() reduces freeSpinsRemaining by 1');
it('decrementFreeSpins() does not go below 0');
it('resetError() clears the error string');
it('resetError() does not change the current phase');
```

**Verify:** `pnpm vitest run tests/unit/stores/useGameStore.spec.ts` green.

---

### TASK 2 — useGameMachine (TDD — core of this session)

**Write the tests first.**

Create `tests/unit/composables/useGameMachine.spec.ts`:

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { useGameMachine } from '@/composables/useGameMachine';
import { useGameStore } from '@/stores/useGameStore';
import type { SpinResult, SpinService } from '@/types/game.types';

// Build a minimal valid SpinResult for test use
function makeResult(overrides: Partial<SpinResult> = {}): SpinResult {
  const emptyReel = {
    symbols: ['LOW_B', 'LOW_A', 'HIGH_A'] as const,
    stopPosition: 0,
  };
  return {
    reels: [emptyReel, emptyReel, emptyReel, emptyReel, emptyReel],
    paylines: [],
    scatterCount: 0,
    scatterPositions: [],
    totalWin: 0,
    freeSpinsAwarded: 0,
    ...overrides,
  };
}

// Inject a mock SpinService directly — no vi.mock needed
function makeMockService(result: SpinResult = makeResult()): SpinService {
  return { requestSpin: vi.fn().mockResolvedValue(result) };
}

beforeEach(() => {
  setActivePinia(createPinia());
});
```

Write one `describe` block per method. Cover every case below:

**spin() — guards:**

```typescript
it('throws when phase is not IDLE');
it('throws when balance < totalBet with a clear message');
```

**spin() — happy path:**

```typescript
it('deducts totalBet from balance before transitioning');
it('transitions phase from IDLE to SPINNING');
it('calls spinService.requestSpin with the current bet config');
it('stores the SpinResult in lastResult via store.setResult');
it('returns the SpinResult (PixiJS will use it for reel stop positions)');
```

**evaluate() — routing:**

```typescript
it('throws when phase is not SPINNING');
it(
  'transitions SPINNING → IDLE when totalWin === 0 and freeSpinsAwarded === 0',
);
it(
  'transitions SPINNING → PAYING when totalWin > 0 and freeSpinsAwarded === 0',
);
it('transitions SPINNING → FREE_SPINS_INTRO when freeSpinsAwarded > 0');
it(
  'calls store.setFreeSpins with the awarded count before transitioning to FREE_SPINS_INTRO',
);
```

**completePaying():**

```typescript
it('throws when phase is not PAYING');
it('adds lastResult.totalWin to balance');
it('transitions PAYING → IDLE');
```

**Free spins flow:**

```typescript
it('beginFreeSpins() throws when phase is not FREE_SPINS_INTRO');
it('beginFreeSpins() transitions FREE_SPINS_INTRO → FREE_SPINNING');

it('completeFreeSpinRound() throws when phase is not FREE_SPINNING');
it(
  'completeFreeSpinRound() calls spinService.requestSpin without deducting balance',
);
it('completeFreeSpinRound() decrements freeSpinsRemaining');
it(
  'completeFreeSpinRound() stays in FREE_SPINNING when freeSpinsRemaining > 0 after decrement',
);
it(
  'completeFreeSpinRound() transitions to FREE_SPINS_COMPLETE when freeSpinsRemaining reaches 0',
);
it('completeFreeSpinRound() returns the SpinResult');

it('dismissFreeSpins() throws when phase is not FREE_SPINS_COMPLETE');
it('dismissFreeSpins() transitions FREE_SPINS_COMPLETE → IDLE');
```

**Error handling:**

```typescript
it('setError() stores the error message');
it('setError() transitions any phase to ERROR');
it('reset() transitions ERROR → IDLE');
it('reset() clears the error string');
```

Run `pnpm vitest run tests/unit/composables/useGameMachine.spec.ts` —
confirm red for the right reasons, then implement.

---

**Implementation — `src/composables/useGameMachine.ts`:**

The composable accepts an optional SpinService parameter so tests inject mocks
without needing vi.mock. Production code uses the default:

```typescript
import { useGameStore } from '@/stores/useGameStore'
import { ClientSpinService } from '@/game/services/ClientSpinService'
import type { SpinService, SpinResult, GamePhase } from '@/types/game.types'

export function useGameMachine(spinService: SpinService = new ClientSpinService()) {
  const store = useGameStore()

  // Private guard — throws on invalid phase with a clear message
  function assertPhase(expected: GamePhase | GamePhase[]): void {
    const phases = Array.isArray(expected) ? expected : [expected]
    if (!phases.includes(store.phase)) {
      throw new Error(
        `[GameMachine] Invalid transition: expected ${phases.join(' | ')}, ` +
        `current phase is "${store.phase}"`
      )
    }
  }

  // Called by SpinButton. Returns SpinResult so PixiJS knows reel stop positions.
  async function spin(): Promise<SpinResult> { ... }

  // Called by PixiJS GameScene after all reels finish animating.
  function evaluate(): void { ... }

  // Called by PixiJS after win animation completes.
  function completePaying(): void { ... }

  // Called by PixiJS after free spins intro animation.
  function beginFreeSpins(): void { ... }

  // Called by PixiJS after each free spin reel animation completes.
  async function completeFreeSpinRound(): Promise<SpinResult> { ... }

  // Called when player taps continue on the FREE_SPINS_COMPLETE screen.
  function dismissFreeSpins(): void { ... }

  // Called by any error boundary.
  function setError(message: string): void { ... }

  // Resets ERROR state back to IDLE.
  function reset(): void { ... }

  return {
    spin,
    evaluate,
    completePaying,
    beginFreeSpins,
    completeFreeSpinRound,
    dismissFreeSpins,
    setError,
    reset,
  }
}
```

Important implementation notes:

- `spin()` deducts balance BEFORE calling `spinService.requestSpin`. This mirrors
  how a real slot machine works — the bet is placed when you press spin, not when
  the reels stop. The deduction must happen before the async call.

- `evaluate()` is synchronous. It reads `store.lastResult` (set by `spin()`)
  and routes to the correct next phase. It does NOT call SpinService.

- `completeFreeSpinRound()` does NOT deduct balance. Free spins cost nothing.

- All transitions go through `assertPhase`. No silent fallbacks.

**Verify:** `pnpm vitest run tests/unit/composables/useGameMachine.spec.ts` green.

---

### TASK 3 — ClientHistoryService (TDD)

Check if `src/game/services/HistoryService.ts` (the interface) exists from Session 1.
If it does not, create it first from `docs/architecture.md` section 7.2.

**Write tests first.**

Create `tests/unit/game/ClientHistoryService.spec.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ClientHistoryService } from '@/game/services/ClientHistoryService';

// Mock the global fetch — no real HTTP in tests
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Helpers
function okResponse(data: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function errorResponse(statusText = 'Internal Server Error') {
  return Promise.resolve({
    ok: false,
    statusText,
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});
```

Test cases:

```typescript
describe('getHistory', () => {
  it('calls GET with the correct URL using default limit of 10');
  it('calls GET with the correct URL when limit is specified as 5');
  it('returns the parsed JSON array from the response');
  it('throws a descriptive error when response.ok is false');
});

describe('recordSpin', () => {
  it('calls POST to /history');
  it('sends Content-Type: application/json header');
  it('sends the record serialized as JSON in the request body');
  it('returns the response JSON (which includes the server-generated id)');
  it('throws a descriptive error when response.ok is false');
});
```

The correct GET URL format (verify against `docs/architecture.md` section 7.2):

```
http://localhost:3001/history?_sort=timestamp&_order=desc&_limit=10
```

Implement `src/game/services/ClientHistoryService.ts`:

```typescript
import type { HistoryService, SpinRecord } from '@/types/game.types'

export class ClientHistoryService implements HistoryService {
  // Configurable base URL — allows test injection without mocking the module
  constructor(private readonly baseUrl = 'http://localhost:3001') {}

  async getHistory(limit = 10): Promise<SpinRecord[]> { ... }
  async recordSpin(record: Omit<SpinRecord, 'id'>): Promise<SpinRecord> { ... }
}
```

Note on error messages: include the statusText in thrown errors so they are
useful in production DevTools. Example:

```typescript
throw new Error(`HistoryService.getHistory failed: ${response.statusText}`);
```

**Verify:** `pnpm vitest run tests/unit/game/ClientHistoryService.spec.ts` green.

---

### TASK 4 — useHistoryStore (TDD)

**Write tests first.**

Create `tests/unit/stores/useHistoryStore.spec.ts`:

```typescript
import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { useHistoryStore } from '@/stores/useHistoryStore';
import type { SpinRecord } from '@/types/game.types';

// Mock ClientHistoryService at the module level
const mockGetHistory = vi.fn();
const mockRecordSpin = vi.fn();

vi.mock('@/game/services/ClientHistoryService', () => ({
  ClientHistoryService: vi.fn().mockImplementation(() => ({
    getHistory: mockGetHistory,
    recordSpin: mockRecordSpin,
  })),
}));

function makeRecord(overrides: Partial<SpinRecord> = {}): SpinRecord {
  return {
    id: '1',
    timestamp: '2026-01-01T00:00:00.000Z',
    bet: 20,
    win: 0,
    freeSpinsAwarded: 0,
    ...overrides,
  };
}

beforeEach(() => {
  setActivePinia(createPinia());
  mockGetHistory.mockReset();
  mockRecordSpin.mockReset();
});
```

Test cases:

```typescript
describe('initial state', () => {
  it('records is an empty array');
  it('isLoading is false');
  it('error is null');
});

describe('fetchHistory', () => {
  it('sets isLoading to true while the request is in flight');
  it('sets isLoading to false after the request resolves');
  it('populates records with the response from the service');
  it('sets error to the error message when the service throws');
  it('sets isLoading to false even when the service throws');
  it('clears any previous error on a successful fetch');
});

describe('addRecord', () => {
  it('prepends the new record to the start of records (most recent first)');
  it('calls recordSpin on the service with the provided data');
  it('includes a valid ISO timestamp in the data passed to recordSpin');
  it('does not remove the record from local state if the service call fails');
  it('does not throw when the service call fails (graceful degradation)');
});
```

Implement `src/stores/useHistoryStore.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ClientHistoryService } from '@/game/services/ClientHistoryService'
import type { SpinRecord } from '@/types/game.types'

export const useHistoryStore = defineStore('history', () => {
  const records = ref<SpinRecord[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const service = new ClientHistoryService()

  async function fetchHistory(): Promise<void> { ... }

  async function addRecord(data: Omit<SpinRecord, 'id' | 'timestamp'>): Promise<void> {
    // Strategy:
    // 1. Build a temporary local record with a generated id and current timestamp
    // 2. Prepend it to records immediately (optimistic update — UI shows it at once)
    // 3. Call service.recordSpin in the background
    // 4. If service fails: log the error, but DO NOT remove the local record
    //    Reason: the session history is still correct for the player even if
    //    persistence fails. Removing it would be confusing and lossy.
    ...
  }

  return { records, isLoading, error, fetchHistory, addRecord }
})
```

**Verify:** `pnpm vitest run tests/unit/stores/useHistoryStore.spec.ts` green.

---

## End of Session 2 — Final Checklist

Before reporting session complete:

```
[ ] pnpm vitest run    → all green, higher count than Session 1 (48)
[ ] pnpm tsc --noEmit  → zero errors
[ ] pnpm lint          → zero violations
[ ] useGameMachine.ts — all 8 states, all transitions guarded with assertPhase
[ ] ClientHistoryService.ts — no real fetch() in tests, vi.stubGlobal used
[ ] useHistoryStore.ts — vi.mock used for service, no module-level state leaks
[ ] No 'any' in any new file
[ ] src/game/ still has zero Vue/Pinia/PixiJS imports
```

**Report format:**

- Files created and modified
- Test count: Session 1 total → Session 2 total
- Deviations from `docs/architecture.md` with reasoning
- Blockers or questions for Session 3

---

## What Comes Next — Session 3 Preview

Session 3 is the first PixiJS session:

- `usePixiApp.ts` — PixiJS Application lifecycle as a Vue composable
- `SceneManager.ts` — owns the Application, mounts/destroys scenes
- `LoadingScene.ts` — asset bundle loading with progress
- `GameScene.ts` — container hierarchy, canvas layout
- `ReelComponent.ts` — strip management and spin animation
- `GameCanvas.vue` — wires `useGameMachine` to PixiJS events

Before Session 3, read `docs/pixi-v8-patterns.md` in full.
Every PixiJS pattern must come from that file or the official v8 docs.
No v7 patterns. No guessing from training data.

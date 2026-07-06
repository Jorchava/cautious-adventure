# Session 5 Prompt

## Neon Reels: Free Spins · Autoplay · Win History

> Paste this entire document into a NEW session.
> Confirm docs/architecture.md and docs/pixi-v8-patterns.md exist on disk before starting.

---

## Mandatory Context — Read Before Any Action

Read these files in full, in this order:

1. `AGENTS.md` — Behavioral rules; pay attention to TDD mandate
2. `SKILLS.md` — Approved commands; note `pnpm api` for json-server
3. `PROJECT_CONTEXT.md` — Current dev state; update it in Task 2
4. `docs/architecture.md` — Sections 4.5 (free spins spec), 6 (FSM transitions),
   7.2 (HistoryService endpoints), 4.6 (credit system)
5. `docs/pixi-v8-patterns.md` — No new patterns this session; confirm for reference

Then read these existing files to understand what's already wired:

```
src/composables/useGameMachine.ts   — beginFreeSpins(), completeFreeSpinRound(),
                                      dismissFreeSpins() already implemented
src/stores/useGameStore.ts          — freeSpinsRemaining, autoplayRemaining exist
src/stores/useHistoryStore.ts       — fetchHistory(), addRecord() already implemented
src/game/services/ClientHistoryService.ts  — REST client already implemented
src/components/GameCanvas.vue       — phase watcher (you will extend this)
src/App.vue                         — HUD layout (you will extend this)
```

Confirm all files read. State what GameCanvas.vue's phase watcher currently
handles and what phases are not yet handled before beginning Task 1.

---

## Session 5 Goal

Complete all remaining game features:

- Fix 2 pre-existing lint warnings from Session 3
- Free spins flow: intro overlay → spinning loop → complete screen
- Autoplay: 5 / 10 / 25 spins with correct stop conditions
- `WinHistory.vue`: last 10 spins from the REST API (requires `pnpm api`)
- Wire `addRecord()` into the paid spin and free spin completion paths

By end of session, every feature in `docs/architecture.md` section 2 (Goals)
is implemented. `pnpm dev` + `pnpm api` together show a complete, playable game.

---

## Session 5 Success Criteria

```
[ ] pnpm vitest run    → all green, higher count than Session 4 (152)
[ ] pnpm tsc --noEmit  → zero errors
[ ] pnpm lint          → zero errors AND zero warnings (fix Session 3 warnings)
[ ] pnpm dev + pnpm api → full game playable, history panel shows past spins
[ ] Free spins: 3 scatters triggers intro → free spinning loop → complete screen
[ ] Autoplay: runs N spins, stops on free spins trigger or balance < totalBet
[ ] WinHistory: fetches on mount, updates after each completed spin
[ ] addRecord called after completePaying() and after free spins complete
[ ] No game logic added to any Vue component
```

---

## Tasks — Execute in this order

---

### TASK 1 — Fix Lint Warnings

Run `pnpm lint` and identify the 2 pre-existing warnings from Session 3.
They are in inline test component definitions. Fix them so lint exits with
zero warnings, not just zero errors.

Do not change any test logic — only fix the lint violation.

**Verify:** `pnpm lint` exits cleanly with no warnings or errors.

---

### TASK 2 — Update PROJECT_CONTEXT.md

Mark Session 4 items complete. Add Session 5 items as in-progress.

---

### TASK 3 — Free Spins Overlay Components (TDD)

The FSM already has the free spins states fully implemented in `useGameMachine.ts`.
What's missing is the Vue side: overlay components that appear/disappear based
on the game phase.

**Write tests first.**

Create `tests/unit/components/FreeSpinsIntro.spec.ts`:

```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import FreeSpinsIntro from '@/components/FreeSpinsIntro.vue';
import { useGameStore } from '@/stores/useGameStore';

describe('FreeSpinsIntro', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('is not visible when phase is not FREE_SPINS_INTRO');
  it('is visible when phase is FREE_SPINS_INTRO');
  it('displays the number of free spins awarded from the store');
  it('emits a continue event when the CTA button is clicked');
});
```

Create `tests/unit/components/FreeSpinsComplete.spec.ts`:

```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import FreeSpinsComplete from '@/components/FreeSpinsComplete.vue';
import { useGameStore } from '@/stores/useGameStore';

describe('FreeSpinsComplete', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('is not visible when phase is not FREE_SPINS_COMPLETE');
  it('is visible when phase is FREE_SPINS_COMPLETE');
  it('displays the total win from lastResult');
  it('emits a continue event when the CTA button is clicked');
});
```

Run — confirm red, then implement both components.

**`src/components/FreeSpinsIntro.vue`:**

Full-screen overlay (use `Teleport to="body"`), visible only when
`gameStore.phase === 'FREE_SPINS_INTRO'`. Shows:

- "FREE SPINS" headline
- "{{ gameStore.freeSpinsRemaining }} FREE SPINS AWARDED" subtitle
- A "START SPINNING" button that emits `'continue'`

Use `v-if` bound to `phase === 'FREE_SPINS_INTRO'`, not `v-show`.
Neon cyan color scheme consistent with Paytable.vue.

**`src/components/FreeSpinsComplete.vue`:**

Full-screen overlay, visible only when `phase === 'FREE_SPINS_COMPLETE'`. Shows:

- "FREE SPINS COMPLETE" headline
- Total win amount from `gameStore.lastResult?.totalWin` (or accumulated from
  the session — see architecture.md section 4.5 for the spec)
- A "COLLECT" button that emits `'continue'`

**Verify:** Both spec files green.

---

### TASK 4 — Wire Free Spins in GameCanvas.vue

Read `src/components/GameCanvas.vue` fully before editing.
Surgical change — extend the phase watcher and add overlay event handling.

**Extend the phase watcher** to handle free spin phases:

```typescript
// Add to the existing phase watch handler:

else if (phase === 'FREE_SPINS_INTRO') {
  // Overlay appears via FreeSpinsIntro.vue (v-if on phase)
  // GameCanvas just waits — the user clicks "Start Spinning"
  // which calls machine.beginFreeSpins() via the overlay's continue event
}
else if (phase === 'FREE_SPINNING' && gameStore.freeSpinsRemaining > 0) {
  // Same visual flow as regular spin but uses completeFreeSpinRound()
  const result = await machine.completeFreeSpinRound()
  // result is returned — startSpin needs it for reel stop positions
  if (gameScene && result) {
    gameScene.startSpin(result, app)
    // allReelsStopped listener is already on gameScene from init
    // After reels stop: machine.evaluate() → back into this watcher
  }
}
else if (phase === 'FREE_SPINS_COMPLETE') {
  // Overlay appears via FreeSpinsComplete.vue
  // User clicks "Collect" → machine.dismissFreeSpins() → IDLE
}
```

**Add the overlay components to the template** (inside the existing `<div class="app">`):

```vue
<FreeSpinsIntro @continue="machine.beginFreeSpins()" />
<FreeSpinsComplete @continue="onFreeSpinsCollect" />
```

**Add handler:**

```typescript
async function onFreeSpinsCollect(): Promise<void> {
  // Record the free spins session result before dismissing
  if (gameStore.lastResult) {
    await historyStore.addRecord({
      bet: gameStore.bet.totalBet,
      win: gameStore.lastResult.totalWin,
      freeSpinsAwarded: 0,
    });
  }
  machine.dismissFreeSpins();
}
```

**Wire `addRecord` after regular `completePaying()` as well.** Add after
`machine.completePaying()` in the PAYING handler:

```typescript
// After completePaying() call in the PAYING watcher:
if (gameStore.lastResult) {
  await historyStore.addRecord({
    bet: gameStore.bet.totalBet,
    win: gameStore.lastResult.totalWin,
    freeSpinsAwarded: gameStore.lastResult.freeSpinsAwarded,
  });
}
```

Import `useHistoryStore` at the top of `GameCanvas.vue`:

```typescript
import { useHistoryStore } from '@/stores/useHistoryStore';
const historyStore = useHistoryStore();
```

---

### TASK 5 — Autoplay (TDD)

Autoplay runs N spins automatically, stopping on defined conditions.
Implement it as a composable so it's independently testable.

**Write tests first.**

Create `tests/unit/composables/useAutoplay.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAutoplay } from '@/composables/useAutoplay';
import { useGameStore } from '@/stores/useGameStore';

// Mock useGameMachine
const mockSpin = vi.fn().mockResolvedValue({});
vi.mock('@/composables/useGameMachine', () => ({
  useGameMachine: () => ({ spin: mockSpin }),
}));

describe('useAutoplay', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockSpin.mockReset();
    mockSpin.mockResolvedValue({});
  });

  it('isActive is false initially');
  it('start(10) sets isActive to true');
  it('stop() sets isActive to false');
  it('start() calls machine.spin() for each spin in the sequence');
  it('stops early when balance drops below totalBet');
  it('stops early when phase transitions to FREE_SPINS_INTRO');
  it('stops when the requested count is reached');
  it('isActive returns to false after all spins complete');
  it('calling start() while already active does nothing');
});
```

Run — confirm red, then implement.

Create `src/composables/useAutoplay.ts`:

```typescript
import { ref, computed } from 'vue';
import { useGameStore } from '@/stores/useGameStore';
import { useGameMachine } from '@/composables/useGameMachine';

export const AUTOPLAY_OPTIONS = [5, 10, 25] as const;
export type AutoplayCount = (typeof AUTOPLAY_OPTIONS)[number];

export function useAutoplay() {
  const store = useGameStore();
  const machine = useGameMachine();

  const isActive = ref(false);
  const remaining = ref(0);

  async function start(count: AutoplayCount): Promise<void> {
    if (isActive.value) return;
    isActive.value = true;
    remaining.value = count;

    while (remaining.value > 0 && isActive.value) {
      // Stop conditions
      if (store.balance < store.bet.totalBet) {
        stop();
        break;
      }
      if (
        store.phase === 'FREE_SPINS_INTRO' ||
        store.phase === 'FREE_SPINNING'
      ) {
        stop();
        break;
      }
      // Wait for IDLE before next spin
      if (store.phase !== 'IDLE') {
        await waitForIdle();
        continue;
      }

      try {
        await machine.spin();
        remaining.value--;
        // Wait for the full spin cycle to complete (PAYING → IDLE)
        await waitForIdle();
      } catch {
        stop();
        break;
      }
    }

    isActive.value = false;
    remaining.value = 0;
  }

  function stop(): void {
    isActive.value = false;
    remaining.value = 0;
  }

  // Polls store.phase until it reaches IDLE
  // Uses a short interval — not a busy loop
  function waitForIdle(): Promise<void> {
    return new Promise((resolve) => {
      if (store.phase === 'IDLE') {
        resolve();
        return;
      }
      const interval = setInterval(() => {
        if (store.phase === 'IDLE' || !isActive.value) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  return { isActive, remaining, start, stop };
}
```

**Add Autoplay controls to `src/components/SpinButton.vue`.**

SpinButton should now handle three modes:

- Normal: shows SPIN, calls `machine.spin()`
- Autoplay running: shows STOP, calls `autoplay.stop()`
- Autoplay picker: a small set of count buttons (5 / 10 / 25)

Extend SpinButton:

```vue
<template>
  <div class="spin-control">
    <button
      class="spin-btn"
      :class="{ 'is-stop': autoplay.isActive.value }"
      :disabled="!canAct"
      @click="handleMainClick"
    >
      {{ buttonLabel }}
    </button>

    <div v-if="!autoplay.isActive.value" class="autoplay-options">
      <button
        v-for="count in AUTOPLAY_OPTIONS"
        :key="count"
        class="auto-btn"
        :disabled="!gameStore.canSpin"
        @click="autoplay.start(count)"
      >
        {{ count }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/useGameStore';
import { useGameMachine } from '@/composables/useGameMachine';
import { useAutoplay, AUTOPLAY_OPTIONS } from '@/composables/useAutoplay';

const gameStore = useGameStore();
const machine = useGameMachine();
const autoplay = useAutoplay();

const canAct = computed(() =>
  autoplay.isActive.value ? true : gameStore.canSpin,
);

const buttonLabel = computed(() => {
  if (autoplay.isActive.value) return `STOP (${autoplay.remaining.value})`;
  if (gameStore.phase !== 'IDLE') return gameStore.phase.replace('_', ' ');
  return 'SPIN';
});

async function handleMainClick(): Promise<void> {
  if (autoplay.isActive.value) {
    autoplay.stop();
    return;
  }
  try {
    await machine.spin();
  } catch (err) {
    console.error('Spin failed:', err);
  }
}
</script>
```

**Verify:** `pnpm vitest run tests/unit/composables/useAutoplay.spec.ts` green.

---

### TASK 6 — WinHistory.vue (TDD)

**Write tests first.**

Create `tests/unit/components/WinHistory.spec.ts`:

```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import WinHistory from '@/components/WinHistory.vue';
import { useHistoryStore } from '@/stores/useHistoryStore';

// Mock the history store's service so no real fetch fires
vi.mock('@/game/services/ClientHistoryService', () => ({
  ClientHistoryService: vi.fn().mockImplementation(() => ({
    getHistory: vi.fn().mockResolvedValue([]),
    recordSpin: vi.fn().mockResolvedValue({ id: '1' }),
  })),
}));

describe('WinHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders without errors');
  it('calls historyStore.fetchHistory on mount');
  it('shows a loading indicator while isLoading is true');
  it('displays "No history yet" when records is empty');
  it('renders one row per spin record');
  it('displays the bet amount for each record');
  it('displays the win amount for each record');
  it('shows a win highlight when win > 0');
  it('shows a loss style when win === 0');
});
```

Run — confirm red, then implement.

Create `src/components/WinHistory.vue`:

```vue
<template>
  <div class="win-history">
    <h3 class="history-title">HISTORY</h3>

    <div v-if="historyStore.isLoading" class="history-loading">Loading...</div>

    <div v-else-if="historyStore.records.length === 0" class="history-empty">
      No history yet
    </div>

    <ul v-else class="history-list">
      <li
        v-for="record in historyStore.records"
        :key="record.id"
        class="history-row"
        :class="{ 'is-win': record.win > 0 }"
      >
        <span class="record-bet">BET {{ record.bet }}</span>
        <span class="record-win">
          {{ record.win > 0 ? `+${record.win}` : '—' }}
        </span>
      </li>
    </ul>

    <p v-if="historyStore.error" class="history-error">
      {{ historyStore.error }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useHistoryStore } from '@/stores/useHistoryStore';

const historyStore = useHistoryStore();

onMounted(async () => {
  await historyStore.fetchHistory();
});
</script>

<style lang="scss" scoped>
.win-history {
  width: 180px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid #1a2a3a;
  border-radius: 6px;
  padding: 12px;
}

.history-title {
  font-size: 0.65rem;
  letter-spacing: 0.15em;
  color: #556677;
  margin-bottom: 8px;
  text-align: center;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.history-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  padding: 4px 6px;
  border-radius: 3px;
  color: #556677;

  &.is-win {
    color: #ffd700;
    background: rgba(255, 215, 0, 0.07);
  }
}

.history-loading,
.history-empty,
.history-error {
  font-size: 0.75rem;
  color: #556677;
  text-align: center;
  padding: 8px 0;
}

.history-error {
  color: #ff4444;
}
</style>
```

**Add WinHistory to App.vue HUD** — place it in the top-right corner as a sidebar,
or below the BalanceDisplay. Surgical change only.

**Verify:** `pnpm vitest run tests/unit/components/WinHistory.spec.ts` green.

---

### TASK 7 — Integration Smoke Test

Run the game with both servers:

```bash
# Terminal 1
pnpm dev

# Terminal 2
pnpm api
```

Walk through this full flow in the browser:

```
1. Open http://localhost:5173
2. Check WinHistory panel shows "No history yet"
3. Click SPIN — reels spin, stop with cascade
4. If WIN: paylines highlight for 2s, balance increases, history shows new entry
5. If LOSS: balance decreases by bet amount, no highlights
6. Change coin value via BetPanel — total bet updates
7. Click autoplay "10" — 10 spins run automatically
8. Click STOP during autoplay — stops cleanly
9. Open Paytable — shows all symbol payouts — close it
10. Check Network tab in DevTools: POST to http://localhost:3001/history visible per spin
```

If free spins trigger during testing, verify:

- Intro overlay appears with spin count
- Start Spinning button transitions to FREE_SPINNING
- Reels spin N times without deducting balance
- Complete overlay appears, Collect button returns to IDLE

Document what you observed in your report.

---

## End of Session 5 — Final Checklist

```
[ ] pnpm vitest run    → all green, higher than Session 4 (152)
[ ] pnpm tsc --noEmit  → zero errors
[ ] pnpm lint          → zero errors, zero warnings (2 previous warnings fixed)
[ ] pnpm dev + api     → full game flow playable end-to-end
[ ] History panel updates after each completed spin
[ ] POST /history visible in DevTools Network tab
[ ] Autoplay stops correctly on free spins trigger and low balance
[ ] Free spins overlays appear and disappear correctly
[ ] PROJECT_CONTEXT.md dev state updated — all major features complete
```

Report format:

- Files created / modified
- Test count: Session 4 (152) → Session 5 total
- Integration smoke test observations (what you saw in the browser)
- Deviations from docs/architecture.md with reasoning
- Blockers for Session 6

---

## Session 6 Preview — Polish

Session 6 is the final session:

- Neon glow filter on winning symbols (BlurFilter from pixi-v8-patterns.md)
- Big win particle burst via WinParticles.ts for wins > 20× bet
- useAudio.ts implementation with @pixi/sound
- Responsive canvas scaling for different screen sizes
- Performance audit (memory check after 100 spins in DevTools)
- README final version with screenshots, credits, architecture summary

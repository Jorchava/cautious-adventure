# Session 4 Prompt

## Neon Reels: Win Visuals + Core UI Components

> Paste this entire document into a NEW session.
> Before starting: confirm docs/architecture.md and docs/pixi-v8-patterns.md
> exist on disk. If either is missing, stop and add them before continuing.

---

## Mandatory Context — Read Before Any Action

Read these files in full, in this order:

1. `AGENTS.md` — Behavioral rules and PixiJS v8 hard constraints
2. `SKILLS.md` — Approved commands and output contracts
3. `PROJECT_CONTEXT.md` — Current dev state; update it in Task 1
4. `docs/architecture.md` — Sections 9 (win line rendering, container hierarchy), 6 (FSM PAYING state)
5. `docs/pixi-v8-patterns.md` — Sections: Win Line Graphics, Filters/Glow, Vue Integration

Then read the Session 3 output to understand the current rendering foundation:

```
src/pixi/constants.ts
src/pixi/scenes/GameScene.ts       (you will extend this — read carefully)
src/pixi/components/ReelComponent.ts
src/components/GameCanvas.vue      (you will extend this — read carefully)
src/composables/useGameMachine.ts  (completePaying() is called here after win animation)
src/stores/useGameStore.ts         (phase, balance, lastResult, canSpin)
```

Confirm all files read. State what methods GameScene currently exposes
and what GameCanvas.vue currently watches before beginning Task 1.

---

## Session 4 Goal

Complete the win flow and add the core HUD components:

- Win line highlights drawn over winning paylines
- Winning symbols pulse; non-winning symbols dim
- `completePaying()` called automatically after win animation
- `BalanceDisplay.vue` shows live credits and last win amount
- `BetPanel.vue` lets player change coin value between spins
- `Paytable.vue` full-screen overlay (open/close)

By end of session: a full spin cycle is visually complete — spin → reels stop →
win lines highlight → balance updates → idle. `pnpm dev` must demonstrate this flow.

---

## Session 4 Success Criteria

```
[ ] pnpm vitest run    → all green, count higher than Session 3 (136)
[ ] pnpm tsc --noEmit  → zero TypeScript errors
[ ] pnpm lint          → zero violations
[ ] pnpm dev           → full win cycle visible: spin → highlight → balance update → idle
[ ] Win lines draw on winning paylines and clear before next spin
[ ] Non-winning symbols dim to alpha 0.35 on a win; restore on clearWin
[ ] completePaying() is called by GameCanvas.vue — never by PixiJS directly
[ ] BalanceDisplay shows correct credits and last win
[ ] BetPanel correctly validates coin options against AGENTS.md code style
```

---

## Tasks — Execute in this order

---

### TASK 1 — Update PROJECT_CONTEXT.md

Mark Session 3 items complete in the dev state checklist.
Add Session 4 items as in-progress.

---

### TASK 2 — WinLine Component (no unit tests — visual)

Read `docs/pixi-v8-patterns.md` section "Win Line Graphics" before implementing.

Create `src/pixi/components/WinLine.ts`:

```typescript
import { Container, Graphics } from 'pixi.js';
import { PAYLINES } from '@/game/config/paylines';
import {
  REEL_START_X,
  REEL_START_Y,
  REEL_WIDTH,
  REEL_GAP,
  SYMBOL_HEIGHT,
} from '@/pixi/constants';
import type { PaylineResult } from '@/types/game.types';

// One distinct color per payline — 20 entries
const PAYLINE_COLORS: number[] = [
  0xff3333, 0x33ff33, 0x3333ff, 0xffff33, 0xff33ff, 0x33ffff, 0xff8833,
  0x8833ff, 0x33ff88, 0xff3388, 0xffaa33, 0x33aaff, 0xaa33ff, 0x33ffaa,
  0xffaa88, 0x88aaff, 0xff8888, 0x88ff88, 0x8888ff, 0xffffff,
];

export class WinLine extends Container {
  /** Draw a single winning payline. */
  drawPayline(paylineResult: PaylineResult): void {
    const rowIndices = PAYLINES[paylineResult.lineIndex];
    const color =
      PAYLINE_COLORS[paylineResult.lineIndex % PAYLINE_COLORS.length];

    const points = rowIndices.map((row, reelIndex) => ({
      x: REEL_START_X + reelIndex * (REEL_WIDTH + REEL_GAP) + REEL_WIDTH / 2,
      y: REEL_START_Y + row * SYMBOL_HEIGHT + SYMBOL_HEIGHT / 2,
    }));

    const g = new Graphics();
    g.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((p) => g.lineTo(p.x, p.y));
    g.stroke({ width: 3, color, alpha: 0.9 });

    // Small circle at each symbol position
    points.forEach((p) => {
      g.circle(p.x, p.y, 8).fill({ color, alpha: 0.7 });
    });

    this.addChild(g);
  }

  /** Remove all drawn lines. Call before next spin. */
  clearAll(): void {
    this.removeChildren().forEach((child) => child.destroy());
  }
}
```

---

### TASK 3 — Extend GameScene with Win Animation Methods

Read `src/pixi/scenes/GameScene.ts` fully before editing.
Use surgical changes — only add what is needed; do not refactor existing code.

Add to `GameScene`:

**Constants needed (add at top of file or import from constants.ts):**

```typescript
const WIN_ANIMATION_DURATION_MS = 2000; // how long win lines show before clearing
const DIM_ALPHA = 0.35; // alpha for non-winning symbols
```

**New property — add to class fields:**

```typescript
private winLine!: WinLine
```

**In `init()` — add after building frame:**

```typescript
this.winLine = new WinLine();
this.addChild(this.winLine);
```

**New method — `showWin(result: SpinResult): void`**

This method is called immediately after all reels stop on a win.
It does NOT await — it starts the visual state synchronously.

```typescript
showWin(result: SpinResult): void {
  // 1. Draw all winning paylines
  result.paylines.forEach(pl => this.winLine.drawPayline(pl))

  // 2. Collect winning positions as a Set for fast lookup
  const winKeys = new Set(
    result.paylines.flatMap(pl =>
      pl.positions.map(([reelIdx, row]) => `${reelIdx},${row}`)
    )
  )

  // 3. Dim non-winners; keep winners at full alpha
  this.reels.forEach((reel, reelIndex) => {
    // ReelComponent exposes getVisibleSymbols() — use it to check rows
    for (let row = 0; row < VISIBLE_ROWS; row++) {
      const sprite = reel.getSpriteAt(row)  // see note below
      if (sprite) {
        sprite.alpha = winKeys.has(`${reelIndex},${row}`) ? 1.0 : DIM_ALPHA
      }
    }
  })
}
```

**Note on `getSpriteAt(row)`:** ReelComponent needs to expose a method to return
the sprite currently visible at a given row index. Add to `ReelComponent`:

```typescript
getSpriteAt(row: number): SymbolSprite | null {
  return this.sprites[row + 1] ?? null  // sprites[0] is the above-viewport buffer
}
```

**New method — `clearWin(): void`**

```typescript
clearWin(): void {
  this.winLine.clearAll()
  // Restore all symbols to full alpha
  this.reels.forEach(reel => {
    for (let row = 0; row < VISIBLE_ROWS; row++) {
      const sprite = reel.getSpriteAt(row)
      if (sprite) sprite.alpha = 1.0
    }
  })
}
```

**New method — `showWinAnimation(result: SpinResult): Promise<void>`**

This is the method GameCanvas.vue awaits. It orchestrates the full PAYING visual:

```typescript
async showWinAnimation(result: SpinResult): Promise<void> {
  this.showWin(result)
  await new Promise<void>(resolve => setTimeout(resolve, WIN_ANIMATION_DURATION_MS))
  this.clearWin()
}
```

**Verify:** `pnpm tsc --noEmit` passes after these additions.

---

### TASK 4 — Update GameCanvas.vue for PAYING Phase

Read `src/components/GameCanvas.vue` fully before editing.
Surgical change — only modify the `watch(() => gameStore.phase, ...)` handler.

Extend the phase watcher to handle `PAYING`:

```typescript
watch(
  () => gameStore.phase,
  async (phase) => {
    if (!gameScene) return;

    if (phase === 'SPINNING' && gameStore.lastResult) {
      gameScene.startSpin(gameStore.lastResult, app);
    } else if (phase === 'PAYING' && gameStore.lastResult) {
      // Await the win animation, THEN call completePaying
      // This is the correct separation: PixiJS controls timing,
      // Vue/machine controls state transition
      await gameScene.showWinAnimation(gameStore.lastResult);
      machine.completePaying();
    }
  },
);
```

**Important:** `clearWin()` is called inside `showWinAnimation()` before it resolves.
The reels are visually clean by the time `machine.completePaying()` transitions to IDLE.

**Verify:** In `pnpm dev`, a winning spin should now show colored lines on reels,
hold for 2 seconds, clear, then update the balance.

---

### TASK 5 — BalanceDisplay.vue (TDD)

**Write tests first.**

Create `tests/unit/components/BalanceDisplay.spec.ts`:

```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import BalanceDisplay from '@/components/BalanceDisplay.vue';
import { useGameStore } from '@/stores/useGameStore';
import type { SpinResult } from '@/types/game.types';

function makeResult(totalWin: number): SpinResult {
  return {
    reels: Array(5).fill({
      symbols: ['LOW_B', 'LOW_A', 'HIGH_A'],
      stopPosition: 0,
    }) as never,
    paylines: [],
    scatterCount: 0,
    scatterPositions: [],
    totalWin,
    freeSpinsAwarded: 0,
  };
}

describe('BalanceDisplay', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('displays the current balance from the store');
  it('displays the label CREDITS above the balance');
  it('does not show a WIN section when lastResult is null');
  it('does not show a WIN section when totalWin is 0');
  it('shows a WIN section when lastResult.totalWin > 0');
  it('displays the correct win amount');
  it(
    'hides the WIN section when phase is IDLE and lastResult.totalWin is 0 after a loss',
  );
});
```

Run — confirm red, then implement.

Implement `src/components/BalanceDisplay.vue`:

```vue
<template>
  <div class="balance-display">
    <div class="balance-item">
      <span class="label">CREDITS</span>
      <span class="value">{{ gameStore.balance.toLocaleString() }}</span>
    </div>
    <Transition name="win-fade">
      <div v-if="showWin" class="balance-item win">
        <span class="label">WIN</span>
        <span class="value">{{
          gameStore.lastResult?.totalWin.toLocaleString()
        }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/useGameStore';

const gameStore = useGameStore();

const showWin = computed(
  () => gameStore.lastResult !== null && gameStore.lastResult.totalWin > 0,
);
</script>

<style lang="scss" scoped>
.balance-display {
  display: flex;
  gap: 32px;
  align-items: center;
}

.balance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .label {
    font-size: 0.65rem;
    letter-spacing: 0.15em;
    color: #556677;
  }

  .value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #e0e0e0;
    min-width: 80px;
    text-align: center;
  }

  &.win .value {
    color: #ffd700;
  }
}

.win-fade-enter-active,
.win-fade-leave-active {
  transition: opacity 0.3s ease;
}

.win-fade-enter-from,
.win-fade-leave-to {
  opacity: 0;
}
</style>
```

**Verify:** `pnpm vitest run tests/unit/components/BalanceDisplay.spec.ts` green.

---

### TASK 6 — BetPanel.vue (TDD)

**Write tests first.**

Create `tests/unit/components/BetPanel.spec.ts`:

```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import BetPanel from '@/components/BetPanel.vue';
import { useGameStore } from '@/stores/useGameStore';

const COIN_OPTIONS = [1, 2, 5, 10] as const;

describe('BetPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('displays the current coinsPerLine value');
  it('displays the total bet (coinsPerLine × 20)');
  it('renders a decrease (-) button and increase (+) button');
  it('clicking increase (+) moves to the next coin option');
  it('clicking decrease (-) moves to the previous coin option');
  it('the decrease button is disabled when coinsPerLine is at the minimum (1)');
  it(
    'the increase button is disabled when coinsPerLine is at the maximum (10)',
  );
  it('both buttons are disabled when phase is not IDLE');
  it('does not go below the minimum coin option');
  it('does not exceed the maximum coin option');
});
```

Run — confirm red, then implement.

Implement `src/components/BetPanel.vue`:

```vue
<template>
  <div class="bet-panel">
    <button class="bet-btn" :disabled="!canDecrease" @click="decrease">
      −
    </button>

    <div class="bet-values">
      <span class="coin-label">COIN</span>
      <span class="coin-value">{{ gameStore.bet.coinsPerLine }}</span>
      <span class="total-label">BET {{ gameStore.bet.totalBet }}</span>
    </div>

    <button class="bet-btn" :disabled="!canIncrease" @click="increase">
      +
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '@/stores/useGameStore';

const COIN_OPTIONS = [1, 2, 5, 10] as const;
type CoinOption = (typeof COIN_OPTIONS)[number];

const gameStore = useGameStore();

const isIdle = computed(() => gameStore.phase === 'IDLE');
const currentIndex = computed(() =>
  COIN_OPTIONS.indexOf(gameStore.bet.coinsPerLine as CoinOption),
);

const canDecrease = computed(() => isIdle.value && currentIndex.value > 0);
const canIncrease = computed(
  () => isIdle.value && currentIndex.value < COIN_OPTIONS.length - 1,
);

function decrease(): void {
  if (!canDecrease.value) return;
  const newCoin = COIN_OPTIONS[currentIndex.value - 1];
  gameStore.setBetCoin(newCoin);
}

function increase(): void {
  if (!canIncrease.value) return;
  const newCoin = COIN_OPTIONS[currentIndex.value + 1];
  gameStore.setBetCoin(newCoin);
}
</script>

<style lang="scss" scoped>
.bet-panel {
  display: flex;
  align-items: center;
  gap: 16px;
}

.bet-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #00ffff;
  background: transparent;
  color: #00ffff;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;

  &:disabled {
    border-color: #1a3a3a;
    color: #1a3a3a;
    cursor: not-allowed;
  }
}

.bet-values {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;

  .coin-label {
    font-size: 0.6rem;
    letter-spacing: 0.15em;
    color: #556677;
  }

  .coin-value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #e0e0e0;
  }

  .total-label {
    font-size: 0.65rem;
    color: #556677;
    letter-spacing: 0.1em;
  }
}
</style>
```

**Verify:** `pnpm vitest run tests/unit/components/BetPanel.spec.ts` green.

---

### TASK 7 — Paytable.vue (no unit tests — visual overlay)

Create `src/components/Paytable.vue`. This is a full-screen overlay toggled by
a button in the HUD. No unit tests — layout verified visually.

```vue
<template>
  <Teleport to="body">
    <Transition name="paytable-fade">
      <div v-if="isOpen" class="paytable-overlay" @click.self="close">
        <div class="paytable-panel">
          <button class="close-btn" @click="close">✕</button>
          <h2 class="title">PAYTABLE</h2>

          <div class="symbols-grid">
            <div v-for="sym in symbolDefs" :key="sym.id" class="symbol-row">
              <div class="symbol-swatch" :style="{ background: sym.color }" />
              <span class="symbol-name">{{ sym.displayName }}</span>
              <div class="payouts">
                <span
                  v-for="[count, payout] in sym.payoutEntries"
                  :key="count"
                  class="payout-entry"
                >
                  {{ count }}× = {{ payout }}
                </span>
              </div>
            </div>
          </div>

          <div class="scatter-note">
            <strong>SCATTER (Neon Star):</strong>
            3 = 10× bet + 10 free spins &nbsp;|&nbsp; 4 = 20× bet + 15 free
            spins &nbsp;|&nbsp; 5 = 50× bet + 20 free spins
          </div>

          <div class="lines-note">
            20 fixed paylines · Wins pay left to right
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { SYMBOL_DEFINITIONS } from '@/game/config/symbols';

const isOpen = ref(false);

const SYMBOL_COLORS: Record<string, string> = {
  WILD: '#ffd700',
  SCATTER: '#ff00ff',
  HIGH_A: '#00ffff',
  HIGH_B: '#ff4444',
  LOW_A: '#44ff44',
  LOW_B: '#4444ff',
};

const symbolDefs = computed(() =>
  SYMBOL_DEFINITIONS.map((sym) => ({
    ...sym,
    color: SYMBOL_COLORS[sym.id] ?? '#ffffff',
    payoutEntries: Object.entries(sym.payouts)
      .map(([k, v]) => [Number(k), v] as [number, number])
      .sort(([a], [b]) => b - a),
  })),
);

function open(): void {
  isOpen.value = true;
}
function close(): void {
  isOpen.value = false;
}

defineExpose({ open, close });
</script>

<style lang="scss" scoped>
.paytable-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.paytable-panel {
  background: #0d0d1f;
  border: 2px solid #00ffff;
  border-radius: 8px;
  padding: 32px;
  min-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: transparent;
  border: none;
  color: #00ffff;
  font-size: 1.25rem;
  cursor: pointer;
}

.title {
  text-align: center;
  letter-spacing: 0.2em;
  color: #00ffff;
  margin-bottom: 24px;
}

.symbols-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.symbol-row {
  display: grid;
  grid-template-columns: 32px 1fr auto;
  align-items: center;
  gap: 12px;
}

.symbol-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.symbol-name {
  color: #e0e0e0;
  font-size: 0.9rem;
}

.payouts {
  display: flex;
  gap: 12px;
  color: #aaaaaa;
  font-size: 0.8rem;
}

.payout-entry {
  white-space: nowrap;
}

.scatter-note,
.lines-note {
  margin-top: 20px;
  font-size: 0.78rem;
  color: #778899;
  text-align: center;
  line-height: 1.6;
}

.paytable-fade-enter-active,
.paytable-fade-leave-active {
  transition: opacity 0.25s ease;
}
.paytable-fade-enter-from,
.paytable-fade-leave-to {
  opacity: 0;
}
</style>
```

---

### TASK 8 — Wire Full HUD in App.vue

Update `src/App.vue` to include `BalanceDisplay`, `BetPanel`, and a Paytable
toggle button alongside `SpinButton`:

```vue
<template>
  <div class="app">
    <GameCanvas class="canvas-layer" />

    <div class="hud">
      <div class="hud-top">
        <BalanceDisplay />
      </div>
      <div class="hud-bottom">
        <BetPanel />
        <SpinButton />
        <button class="paytable-toggle" @click="paytableRef?.open()">ℹ</button>
      </div>
    </div>

    <Paytable ref="paytableRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import GameCanvas from '@/components/GameCanvas.vue';
import BalanceDisplay from '@/components/BalanceDisplay.vue';
import BetPanel from '@/components/BetPanel.vue';
import SpinButton from '@/components/SpinButton.vue';
import Paytable from '@/components/Paytable.vue';

const paytableRef = ref<InstanceType<typeof Paytable> | null>(null);
</script>

<style lang="scss">
@import '@/assets/styles/main';

.app {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0a0a1a;
}

.canvas-layer {
  position: absolute;
  inset: 0;
}

.hud {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 32px;
  pointer-events: none; // canvas receives pointer events by default

  & > * {
    pointer-events: auto;
  }
}

.hud-top {
  display: flex;
  justify-content: center;
}

.hud-bottom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.paytable-toggle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid #334455;
  background: transparent;
  color: #556677;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    border-color: #00ffff;
    color: #00ffff;
  }
}
</style>
```

---

## End of Session 4 — Final Checklist

```
[ ] pnpm vitest run    → all green, higher count than Session 3 (136)
[ ] pnpm tsc --noEmit  → zero errors
[ ] pnpm lint          → zero violations
[ ] pnpm dev           → full win cycle: spin → lines light up → balance updates → idle
[ ] Losing spin: no win lines, symbols stay at full alpha
[ ] Winning spin: correct paylines highlighted, non-winners dimmed, balance increases
[ ] BetPanel: changing coin updates totalBet, disabled when spinning
[ ] Paytable: opens on ℹ click, closes on ✕ or overlay click
[ ] No game logic in any Vue component (logic stays in useGameMachine / stores)
[ ] PROJECT_CONTEXT.md dev state updated
```

Report format:

- Files created / modified
- Test count: Session 3 (136) → Session 4 total
- Smoke test result (describe the win cycle you saw in the browser)
- Deviations from docs/architecture.md with reasoning
- Blockers for Session 5

---

## Session 5 Preview

Session 5 will complete the game:

- Free spins intro screen + flow
- Autoplay (5 / 10 / 25 spins with stop conditions)
- `useAudio.ts` wired to game phases via `@pixi/sound`
- `WinHistory.vue` + json-server REST integration (start with `pnpm api`)
- Neon glow filter on winning symbols (BlurFilter from pixi-v8-patterns.md)

# Session 3 Prompt

## Neon Reels: PixiJS Rendering Foundation

> Paste this entire document into a NEW Open Code session.
> This is the first session that touches PixiJS. Read pixi-v8-patterns.md
> before every single PixiJS file you write — no exceptions.

---

## Mandatory Context — Read Before Any Action

Read these files in full, in this order:

1. `AGENTS.md` — Behavioral rules (pay attention to PixiJS v8 Rules section)
2. `SKILLS.md` — Approved commands and output contracts
3. `PROJECT_CONTEXT.md` — Current dev state; update it in Task 1
4. `docs/architecture.md` — Focus on sections 9 (PixiJS Architecture), 5.2 (directory structure)
5. `docs/pixi-v8-patterns.md` — Read this in full. Consult it before every PixiJS file.

Then read the existing Session 1-2 output to understand the foundation:

```
src/types/game.types.ts
src/composables/useGameMachine.ts      (the FSM — GameCanvas.vue will call its methods)
src/stores/useGameStore.ts             (the store — GameCanvas.vue watches its phase)
tests/setup.ts                         (IMPORTANT: vi.mock('pixi.js') is already defined here)
```

Confirm all files read. State what the existing PixiJS mock in `tests/setup.ts`
provides before writing any test.

---

## Critical Testing Note — Read Before Task 2

PixiJS requires a real WebGL context. Unit testing rendering code is not feasible.
The `tests/setup.ts` mock already stubs the entire `pixi.js` module.

**Testing surface this session:**

| File               | Testable?      | How                                 |
| ------------------ | -------------- | ----------------------------------- |
| `reelMath.ts`      | ✅ Fully       | Pure functions, zero PixiJS imports |
| `SceneManager.ts`  | ✅ Partially   | Mock IScene objects                 |
| `usePixiApp.ts`    | ✅ Partially   | Existing pixi.js mock in setup.ts   |
| `GameCanvas.vue`   | ✅ Partially   | Mock useGameMachine + useGameStore  |
| `LoadingScene.ts`  | ❌ Visual only | No unit tests                       |
| `ReelComponent.ts` | ❌ Visual only | Uses reelMath.ts which IS tested    |
| `GameScene.ts`     | ❌ Visual only | No unit tests                       |
| `SymbolSprite.ts`  | ❌ Visual only | No unit tests                       |

**The test count increase this session will be lower than Sessions 1–2.**
This is correct. Do not invent tests for rendering code to hit a number.
Do not skip tests for code that IS testable.

---

## Session 3 Goal

Build the complete PixiJS rendering foundation:

- A `SceneManager` that owns the PixiJS `Application` and mounts/destroys scenes
- A `usePixiApp` Vue composable that manages the Application lifecycle
- `LoadingScene` that loads the asset bundle with a progress bar
- `ReelComponent` that animates a symbol strip (the core visual mechanic)
- `GameScene` that composes 5 reels with the correct container hierarchy
- `GameCanvas.vue` that bridges Vue/Pinia state to PixiJS events

By end of session, `pnpm dev` shows a working canvas with 5 spinning reels
that stop and call `machine.evaluate()` on completion.

---

## Session 3 Success Criteria

```
[ ] pnpm vitest run    → all green, includes new Session 3 tests
[ ] pnpm tsc --noEmit  → zero TypeScript errors
[ ] pnpm lint          → zero violations
[ ] pnpm dev           → canvas renders, reels spin when SpinButton clicked
[ ] No v7 PixiJS patterns — every pattern verified against pixi-v8-patterns.md
[ ] Every PixiJS object created in a scene is destroyed when that scene exits
[ ] GameCanvas.vue has zero direct game logic — only wires store → PixiJS → machine
```

---

## Tasks — Execute in this order

---

### TASK 1 — Update PROJECT_CONTEXT.md

Before writing any code, open `PROJECT_CONTEXT.md` and mark Sessions 1 and 2
items as complete in the Development State checklist. Then add the Session 3
items as in-progress. Commit this update mentally — it is part of the session output.

---

### TASK 2 — PixiJS Constants + IScene Interface

Create `src/pixi/constants.ts`:

```typescript
// All PixiJS layout and animation constants in one place.
// Change here, effects everywhere. Never hardcode these values in components.

export const SYMBOL_HEIGHT = 160; // px height of each symbol sprite
export const REEL_WIDTH = 140; // px width of each reel
export const REEL_GAP = 8; // px gap between reels
export const VISIBLE_ROWS = 3; // symbol rows visible at once
export const REEL_COUNT = 5;

// Calculated layout values
export const TOTAL_REEL_WIDTH =
  REEL_COUNT * REEL_WIDTH + (REEL_COUNT - 1) * REEL_GAP;
export const VIEWPORT_HEIGHT = SYMBOL_HEIGHT * VISIBLE_ROWS;

// Animation
export const MAX_SPIN_VELOCITY = 40; // px per ticker deltaTime unit at 60fps
export const DECEL_FACTOR = 0.88; // velocity multiplied per tick during decel
export const MIN_SNAP_VELOCITY = 1.5; // velocity below this → snap to grid
export const CASCADE_STOP_DELAY_MS = 150; // ms between each reel stopping left to right

// Canvas layout
export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 640;
export const REEL_START_X = (CANVAS_WIDTH - TOTAL_REEL_WIDTH) / 2;
export const REEL_START_Y = (CANVAS_HEIGHT - VIEWPORT_HEIGHT) / 2;
```

Create `src/pixi/IScene.ts`:

```typescript
export interface IScene {
  init(): Promise<void>;
  destroy(options?: { children?: boolean; texture?: boolean }): void;
}
```

No tests needed for constants or the interface type.

---

### TASK 3 — reelMath.ts Pure Functions (TDD — full coverage)

This is the **only rendering-related file with full unit tests**.
Extract all animation math here so ReelComponent stays testable at the math level.

**Write tests first.**

Create `tests/unit/pixi/reelMath.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  wrapStripOffset,
  decelerateVelocity,
  isReadyToSnap,
  snapToNearestSymbol,
  getSymbolIndexAtRow,
  symbolYPosition,
} from '@/pixi/utils/reelMath';
import { SYMBOL_HEIGHT, VISIBLE_ROWS } from '@/pixi/constants';

describe('wrapStripOffset', () => {
  it('returns offset unchanged when within strip bounds');
  it('wraps offset back to 0 when it equals stripTotal');
  it('wraps offset when it exceeds stripTotal');
  it('handles large multiples of stripTotal correctly');
});

describe('decelerateVelocity', () => {
  it('multiplies velocity by decelFactor');
  it('returns a smaller positive value than input');
  it('never returns a negative value');
});

describe('isReadyToSnap', () => {
  it('returns true when velocity is below minSnapVelocity');
  it('returns false when velocity is above minSnapVelocity');
  it('returns true when velocity equals minSnapVelocity exactly');
});

describe('snapToNearestSymbol', () => {
  it('returns 0 for offset 0');
  it('rounds down to nearest SYMBOL_HEIGHT multiple below');
  it('rounds up to nearest SYMBOL_HEIGHT multiple when closer to next');
  it('returns exact multiple unchanged when already on grid');
});

describe('getSymbolIndexAtRow', () => {
  it('returns stopPosition for row 0 (top)');
  it('returns (stopPosition + 1) % stripLength for row 1');
  it('returns (stopPosition + 2) % stripLength for row 2');
  it('wraps correctly at end of strip');
});

describe('symbolYPosition', () => {
  it('returns 0 for symbol index 0');
  it('returns SYMBOL_HEIGHT for symbol index 1');
  it('returns negative SYMBOL_HEIGHT for symbol index -1 (above viewport)');
});
```

Run `pnpm vitest run tests/unit/pixi/reelMath.spec.ts` — confirm red, then implement.

Create `src/pixi/utils/reelMath.ts`:

```typescript
// Pure math functions for reel strip animation.
// Zero PixiJS imports — these are fully unit-testable.

import { SYMBOL_HEIGHT } from '@/pixi/constants';

/** Wraps a continuously-incrementing offset back within [0, stripTotal) */
export function wrapStripOffset(offset: number, stripTotal: number): number {
  return ((offset % stripTotal) + stripTotal) % stripTotal;
}

/** Applies one tick of deceleration to velocity */
export function decelerateVelocity(
  velocity: number,
  decelFactor: number,
): number {
  return Math.max(0, velocity * decelFactor);
}

/** Returns true when velocity is low enough to snap to grid */
export function isReadyToSnap(
  velocity: number,
  minSnapVelocity: number,
): boolean {
  return velocity <= minSnapVelocity;
}

/** Rounds an offset to the nearest symbol grid line */
export function snapToNearestSymbol(offset: number): number {
  return Math.round(offset / SYMBOL_HEIGHT) * SYMBOL_HEIGHT;
}

/** Returns the strip index of the symbol visible at a given row */
export function getSymbolIndexAtRow(
  stopPosition: number,
  row: number,
  stripLength: number,
): number {
  return (stopPosition + row) % stripLength;
}

/** Returns the y pixel position for a symbol slot index */
export function symbolYPosition(slotIndex: number): number {
  return slotIndex * SYMBOL_HEIGHT;
}
```

**Verify:** `pnpm vitest run tests/unit/pixi/reelMath.spec.ts` green.

---

### TASK 4 — SceneManager (TDD — partial)

**Write tests first.**

Create `tests/unit/pixi/SceneManager.spec.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SceneManager } from '@/pixi/SceneManager';
import type { IScene } from '@/pixi/IScene';

// Build a minimal mock scene
function mockScene(): IScene {
  return {
    init: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
  };
}

// The PixiJS Application is already mocked in tests/setup.ts
// Import and instantiate it — the mock returns the stub shape
import { Application } from 'pixi.js';

describe('SceneManager', () => {
  let app: InstanceType<typeof Application>;
  let manager: SceneManager;

  beforeEach(() => {
    app = new Application();
    manager = new SceneManager(app);
  });

  it('calls scene.init() when switching to a new scene');
  it('adds the scene to app.stage');
  it('calls destroy() on the previous scene when switching');
  it('removes the previous scene from app.stage before adding the new one');
  it('does not throw when switchTo is called with no existing scene');
  it('destroy() calls destroy on the current scene');
  it('destroy() does not throw when no scene is active');
});
```

Run — confirm red, then implement.

Create `src/pixi/SceneManager.ts`:

```typescript
import { Application, Container } from 'pixi.js';
import type { IScene } from '@/pixi/IScene';

export class SceneManager {
  private current: IScene | null = null;

  constructor(private readonly app: Application) {}

  async switchTo(scene: IScene): Promise<void> {
    if (this.current) {
      this.current.destroy({ children: true });
      this.app.stage.removeChild(this.current as unknown as Container);
    }
    this.current = scene;
    this.app.stage.addChild(scene as unknown as Container);
    await scene.init();
  }

  destroy(): void {
    this.current?.destroy({ children: true });
    this.current = null;
  }
}
```

**Verify:** `pnpm vitest run tests/unit/pixi/SceneManager.spec.ts` green.

---

### TASK 5 — usePixiApp Composable (TDD — partial)

**Write tests first.**

Create `tests/unit/composables/usePixiApp.spec.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, ref } from 'vue';
import { usePixiApp } from '@/composables/usePixiApp';
// pixi.js is already mocked in tests/setup.ts

// Wrap composable in a test component to trigger lifecycle hooks
function mountWithPixiApp() {
  const canvasRef = ref<HTMLCanvasElement | null>(
    document.createElement('canvas'),
  );
  let exposed: ReturnType<typeof usePixiApp> | undefined;

  const TestComponent = defineComponent({
    setup() {
      const result = usePixiApp(canvasRef);
      exposed = result;
      return result;
    },
    template: '<div></div>',
  });

  const wrapper = mount(TestComponent, { attachTo: document.body });
  return { wrapper, exposed: exposed! };
}

describe('usePixiApp', () => {
  it('calls app.init() on mount with a canvas element');
  it('isReady becomes true after app.init() resolves');
  it('calls app.destroy() with full cleanup options on unmount');
  it('does not call app.init() if canvasRef is null');
});
```

Run — confirm red, then implement.

Create `src/composables/usePixiApp.ts`:

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import { Application } from 'pixi.js';
import type { Ref } from 'vue';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/pixi/constants';

export function usePixiApp(canvasRef: Ref<HTMLCanvasElement | null>) {
  const app = new Application();
  const isReady = ref(false);

  onMounted(async () => {
    if (!canvasRef.value) return;

    await app.init({
      canvas: canvasRef.value,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      background: '#0a0a1a',
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    isReady.value = true;
  });

  onUnmounted(() => {
    app.destroy(true, { children: true, texture: true, baseTexture: true });
    isReady.value = false;
  });

  return { app, isReady };
}
```

**Verify:** `pnpm vitest run tests/unit/composables/usePixiApp.spec.ts` green.

---

### TASK 6 — SymbolSprite (no tests — visual only)

Create `src/pixi/components/SymbolSprite.ts`:

```typescript
import { Sprite, Texture } from 'pixi.js';
import type { SymbolId } from '@/types/game.types';
import { REEL_WIDTH, SYMBOL_HEIGHT } from '@/pixi/constants';

// Maps SymbolId to its texture path.
// In v1 we use placeholder colored rectangles drawn with Graphics.
// Replace with real sprite paths once Kenney assets are added.
const SYMBOL_TEXTURE_MAP: Record<SymbolId, string> = {
  WILD: 'wild',
  SCATTER: 'scatter',
  HIGH_A: 'high_a',
  HIGH_B: 'high_b',
  LOW_A: 'low_a',
  LOW_B: 'low_b',
};

export class SymbolSprite extends Sprite {
  readonly symbolId: SymbolId;

  constructor(symbolId: SymbolId) {
    // Use white texture as placeholder until real assets are loaded
    super(Texture.WHITE);
    this.symbolId = symbolId;
    this.width = REEL_WIDTH;
    this.height = SYMBOL_HEIGHT;
    this.tint = SymbolSprite.colorFor(symbolId);
    this.anchor.set(0);
  }

  // Pulse animation for win highlight
  pulse(): void {
    // Implemented in Session 4 with Ticker
  }

  private static colorFor(id: SymbolId): number {
    const colors: Record<SymbolId, number> = {
      WILD: 0xffd700, // gold
      SCATTER: 0xff00ff, // magenta
      HIGH_A: 0x00ffff, // cyan
      HIGH_B: 0xff4444, // red
      LOW_A: 0x44ff44, // green
      LOW_B: 0x4444ff, // blue
    };
    return colors[id];
  }
}
```

---

### TASK 7 — ReelComponent (no unit tests — uses reelMath.ts)

Create `src/pixi/components/ReelComponent.ts`.

This is the core animation class. Read `docs/pixi-v8-patterns.md` section
"Reel Strip Animation Pattern" before implementing.

```typescript
import { Container, Graphics, Ticker } from 'pixi.js';
import { EventEmitter } from 'pixi.js';
import { SymbolSprite } from '@/pixi/components/SymbolSprite';
import {
  wrapStripOffset,
  decelerateVelocity,
  isReadyToSnap,
  snapToNearestSymbol,
  getSymbolIndexAtRow,
  symbolYPosition,
} from '@/pixi/utils/reelMath';
import {
  SYMBOL_HEIGHT,
  VISIBLE_ROWS,
  MAX_SPIN_VELOCITY,
  DECEL_FACTOR,
  MIN_SNAP_VELOCITY,
} from '@/pixi/constants';
import type { SymbolId } from '@/types/game.types';

export class ReelComponent extends Container {
  private sprites: SymbolSprite[] = [];
  private stripOffset = 0;
  private velocity = 0;
  private isSpinning = false;
  private targetStopIndex: number | null = null;
  private readonly stripLength: number;
  private readonly stripSymbols: SymbolId[];
  private readonly tickHandler: (ticker: Ticker) => void;

  constructor(stripSymbols: SymbolId[]) {
    super();
    this.stripSymbols = stripSymbols;
    this.stripLength = stripSymbols.length;
    this.tickHandler = this.update.bind(this);
    this.buildSprites();
  }

  private buildSprites(): void {
    // Create VISIBLE_ROWS + 2 sprites (one above, one below for seamless wrap)
    for (let i = 0; i < VISIBLE_ROWS + 2; i++) {
      const symbolId = this.stripSymbols[i % this.stripLength];
      const sprite = new SymbolSprite(symbolId);
      sprite.y = symbolYPosition(i - 1); // start one symbol above viewport
      this.sprites.push(sprite);
      this.addChild(sprite);
    }
  }

  /** Begin spinning. Attach to app.ticker externally. */
  spin(): void {
    this.isSpinning = true;
    this.velocity = MAX_SPIN_VELOCITY;
    this.targetStopIndex = null;
  }

  /** Schedule a stop at the given strip index. */
  stop(targetStripIndex: number): void {
    this.targetStopIndex = targetStripIndex;
  }

  /** Called by app.ticker every frame. */
  update(ticker: Ticker): void {
    if (!this.isSpinning) return;

    if (this.targetStopIndex !== null) {
      this.velocity = decelerateVelocity(this.velocity, DECEL_FACTOR);
      if (isReadyToSnap(this.velocity, MIN_SNAP_VELOCITY)) {
        this.snapAndStop();
        return;
      }
    }

    this.stripOffset = wrapStripOffset(
      this.stripOffset + this.velocity * ticker.deltaTime,
      this.stripLength * SYMBOL_HEIGHT,
    );

    this.updateSpritePositions();
  }

  private updateSpritePositions(): void {
    this.sprites.forEach((sprite, i) => {
      const rawY =
        (this.stripOffset + symbolYPosition(i - 1)) %
        (this.stripLength * SYMBOL_HEIGHT);
      sprite.y =
        rawY < -SYMBOL_HEIGHT ? rawY + this.stripLength * SYMBOL_HEIGHT : rawY;

      // Update symbol texture to match strip position
      const stripIdx = Math.floor(sprite.y / SYMBOL_HEIGHT) % this.stripLength;
      const safeIdx =
        ((stripIdx % this.stripLength) + this.stripLength) % this.stripLength;
      const newId = this.stripSymbols[safeIdx];
      if (sprite.symbolId !== newId) {
        sprite.tint = SymbolSprite['colorFor'](newId); // update color for placeholder
      }
    });
  }

  private snapAndStop(): void {
    this.velocity = 0;
    this.isSpinning = false;
    this.targetStopIndex = null;

    // Snap all sprites to exact grid positions
    this.sprites.forEach((sprite, i) => {
      sprite.y = symbolYPosition(i - 1);
    });

    this.emit('stopped', this);
  }

  /** Returns the currently visible symbols [top, middle, bottom] */
  getVisibleSymbols(): [SymbolId, SymbolId, SymbolId] {
    const stopPos = this.targetStopIndex ?? 0;
    return [
      this.stripSymbols[getSymbolIndexAtRow(stopPos, 0, this.stripLength)],
      this.stripSymbols[getSymbolIndexAtRow(stopPos, 1, this.stripLength)],
      this.stripSymbols[getSymbolIndexAtRow(stopPos, 2, this.stripLength)],
    ];
  }

  override destroy(options?: { children?: boolean }): void {
    this.isSpinning = false;
    super.destroy(options);
  }
}
```

---

### TASK 8 — LoadingScene (no unit tests — visual only)

Create `src/pixi/scenes/LoadingScene.ts`:

```typescript
import { Container, Graphics, Text } from 'pixi.js';
import { Assets } from 'pixi.js';
import type { IScene } from '@/pixi/IScene';

// Asset bundle definition — matches src/assets/sprites/ filenames
// In v1, we skip real assets and use placeholder colored sprites.
// When Kenney assets are added, populate this bundle.
const SYMBOL_BUNDLE = {
  // 'wild': '/sprites/wild.png',
  // ... add when assets are ready
};

export class LoadingScene extends Container implements IScene {
  private bar!: Graphics;
  private label!: Text;

  async init(): Promise<void> {
    this.buildUI();

    // If no assets defined, resolve immediately
    if (Object.keys(SYMBOL_BUNDLE).length === 0) {
      this.setProgress(1);
      return;
    }

    Assets.addBundle('symbols', SYMBOL_BUNDLE);
    await Assets.loadBundle('symbols', (progress: number) => {
      this.setProgress(progress);
    });
  }

  private buildUI(): void {
    const bg = new Graphics();
    bg.rect(0, 0, 900, 640).fill(0x0a0a1a);
    this.addChild(bg);

    this.bar = new Graphics();
    this.setProgress(0);
    this.bar.x = 200;
    this.bar.y = 300;
    this.addChild(this.bar);

    this.label = new Text({
      text: 'Loading...',
      style: { fill: 0x00ffff, fontSize: 20 },
    });
    this.label.anchor.set(0.5);
    this.label.position.set(450, 340);
    this.addChild(this.label);
  }

  private setProgress(progress: number): void {
    this.bar.clear();
    // Background track
    this.bar.rect(0, 0, 500, 12).fill(0x1a1a2e);
    // Fill
    this.bar.rect(0, 0, 500 * progress, 12).fill(0x00ffff);
    this.label.text =
      progress >= 1 ? 'Ready!' : `Loading... ${Math.round(progress * 100)}%`;
  }
}
```

---

### TASK 9 — GameScene (no unit tests — visual only)

Create `src/pixi/scenes/GameScene.ts`.

Read `docs/architecture.md` section 9.1 (Container Hierarchy) before implementing.

```typescript
import { Container, Graphics } from 'pixi.js';
import type { IScene } from '@/pixi/IScene';
import { ReelComponent } from '@/pixi/components/ReelComponent';
import {
  REEL_WIDTH,
  REEL_GAP,
  SYMBOL_HEIGHT,
  VISIBLE_ROWS,
  REEL_START_X,
  REEL_START_Y,
  REEL_COUNT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '@/pixi/constants';
import { REEL_STRIPS } from '@/game/config/reelStrips';
import type { SpinResult } from '@/types/game.types';

export class GameScene extends Container implements IScene {
  private reels: ReelComponent[] = [];
  private reelContainer!: Container;
  private winLineContainer!: Container;
  private stoppedCount = 0;

  async init(): Promise<void> {
    this.buildBackground();
    this.buildReels();
    this.buildFrame();
    this.winLineContainer = new Container();
    this.addChild(this.winLineContainer);
  }

  private buildBackground(): void {
    const bg = new Graphics();
    bg.rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).fill(0x0a0a1a);
    this.addChild(bg);
  }

  private buildReels(): void {
    this.reelContainer = new Container();

    // Viewport mask — clips to 3 visible rows
    const mask = new Graphics();
    mask
      .rect(
        REEL_START_X,
        REEL_START_Y,
        REEL_WIDTH * REEL_COUNT + REEL_GAP * (REEL_COUNT - 1),
        SYMBOL_HEIGHT * VISIBLE_ROWS,
      )
      .fill(0xffffff);
    this.reelContainer.mask = mask;
    this.reelContainer.addChild(mask); // mask MUST be in the scene graph

    for (let i = 0; i < REEL_COUNT; i++) {
      const reel = new ReelComponent(REEL_STRIPS[i]);
      reel.x = REEL_START_X + i * (REEL_WIDTH + REEL_GAP);
      reel.y = REEL_START_Y;
      this.reels.push(reel);
      this.reelContainer.addChild(reel);
    }

    this.addChild(this.reelContainer);
  }

  private buildFrame(): void {
    // Decorative neon frame around the reel viewport
    const frame = new Graphics();
    frame
      .rect(
        REEL_START_X - 4,
        REEL_START_Y - 4,
        REEL_WIDTH * REEL_COUNT + REEL_GAP * (REEL_COUNT - 1) + 8,
        SYMBOL_HEIGHT * VISIBLE_ROWS + 8,
      )
      .stroke({ width: 3, color: 0x00ffff });
    this.addChild(frame);
  }

  /**
   * Called by GameCanvas.vue when store.phase becomes 'SPINNING'.
   * Starts all reels and schedules their stop positions from the SpinResult.
   */
  startSpin(
    result: SpinResult,
    app: { ticker: { add: (fn: (t: unknown) => void) => void } },
  ): void {
    this.stoppedCount = 0;

    this.reels.forEach((reel, index) => {
      // Attach reel to ticker
      const tickFn = (ticker: unknown) => reel.update(ticker as never);
      app.ticker.add(tickFn);

      reel.spin();

      // Schedule stop for each reel with cascade delay
      const stopDelay = (index + 1) * 500 + index * 150; // min spin time + cascade
      setTimeout(() => {
        reel.stop(result.reels[index].stopPosition);
      }, stopDelay);

      // Listen for stopped event
      reel.once('stopped', () => {
        this.stoppedCount++;
        if (this.stoppedCount === REEL_COUNT) {
          this.emit('allReelsStopped');
        }
      });
    });
  }

  override destroy(options?: { children?: boolean }): void {
    this.reels = [];
    super.destroy(options);
  }
}
```

---

### TASK 10 — GameCanvas.vue (TDD — integration test)

**Write test first.**

Create `tests/unit/components/GameCanvas.spec.ts`:

```typescript
import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import GameCanvas from '@/components/GameCanvas.vue';

// Mock PixiJS (already in setup.ts — verify the mock exists)
// Mock useGameMachine to track calls
const mockEvaluate = vi.fn();
const mockSetError = vi.fn();

vi.mock('@/composables/useGameMachine', () => ({
  useGameMachine: () => ({
    evaluate: mockEvaluate,
    setError: mockSetError,
    spin: vi.fn().mockResolvedValue({}),
    completePaying: vi.fn(),
    beginFreeSpins: vi.fn(),
    dismissFreeSpins: vi.fn(),
    reset: vi.fn(),
  }),
}));

describe('GameCanvas', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockEvaluate.mockReset();
    mockSetError.mockReset();
  });

  it('renders a canvas element');
  it('mounts without throwing errors');
  // Note: full PixiJS scene integration is verified visually via pnpm dev
});
```

Run — confirm behavior, then implement.

Create `src/components/GameCanvas.vue`:

```vue
<template>
  <div ref="containerRef" class="game-canvas-wrapper">
    <canvas ref="canvasRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { usePixiApp } from '@/composables/usePixiApp';
import { useGameStore } from '@/stores/useGameStore';
import { useGameMachine } from '@/composables/useGameMachine';
import { SceneManager } from '@/pixi/SceneManager';
import { LoadingScene } from '@/pixi/scenes/LoadingScene';
import { GameScene } from '@/pixi/scenes/GameScene';
import type { SpinResult } from '@/types/game.types';

const canvasRef = ref<HTMLCanvasElement | null>(null);
const gameStore = useGameStore();
const machine = useGameMachine();
const { app, isReady } = usePixiApp(canvasRef);

let sceneManager: SceneManager | null = null;
let gameScene: GameScene | null = null;

// Initialize PixiJS scenes when app is ready
watch(isReady, async (ready) => {
  if (!ready) return;

  try {
    sceneManager = new SceneManager(app);

    const loading = new LoadingScene();
    await sceneManager.switchTo(loading);

    gameScene = new GameScene();
    gameScene.on('allReelsStopped', () => {
      machine.evaluate();
    });

    await sceneManager.switchTo(gameScene);
  } catch (err) {
    machine.setError(err instanceof Error ? err.message : 'PixiJS init failed');
  }
});

// Bridge: Pinia phase → PixiJS action
watch(
  () => gameStore.phase,
  (phase) => {
    if (!gameScene) return;

    if (phase === 'SPINNING' && gameStore.lastResult) {
      gameScene.startSpin(gameStore.lastResult as SpinResult, app);
    }
  },
);
</script>

<style lang="scss" scoped>
.game-canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a1a;
}

canvas {
  display: block;
}
</style>
```

**Verify:** `pnpm vitest run tests/unit/components/GameCanvas.spec.ts` green.

---

### TASK 11 — App.vue and pnpm dev smoke test

Update `src/App.vue` to mount `GameCanvas` and `SpinButton` so the canvas
is visible and functional via `pnpm dev`:

```vue
<template>
  <div class="app">
    <GameCanvas />
    <div class="ui-layer">
      <SpinButton />
    </div>
  </div>
</template>

<script setup lang="ts">
import GameCanvas from '@/components/GameCanvas.vue';
import SpinButton from '@/components/SpinButton.vue';
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

.ui-layer {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
```

Update `src/components/SpinButton.vue` stub to call `machine.spin()`:

```vue
<template>
  <button class="spin-btn" :disabled="!gameStore.canSpin" @click="handleSpin">
    {{ gameStore.phase === 'SPINNING' ? 'SPINNING...' : 'SPIN' }}
  </button>
</template>

<script setup lang="ts">
import { useGameStore } from '@/stores/useGameStore';
import { useGameMachine } from '@/composables/useGameMachine';

const gameStore = useGameStore();
const machine = useGameMachine();

async function handleSpin(): Promise<void> {
  try {
    await machine.spin();
  } catch (err) {
    console.error('Spin failed:', err);
  }
}
</script>

<style lang="scss" scoped>
.spin-btn {
  padding: 16px 48px;
  font-size: 1.25rem;
  font-weight: bold;
  color: #0a0a1a;
  background: #00ffff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  letter-spacing: 0.1em;

  &:disabled {
    background: #1a3a3a;
    color: #336666;
    cursor: not-allowed;
  }
}
</style>
```

**Final smoke test:**

```bash
pnpm dev
```

Open `http://localhost:5173`. You should see:

- Dark canvas with 5 colored placeholder symbol columns
- A cyan SPIN button at the bottom
- Clicking SPIN starts the reel animation
- Reels stop left to right with cascade delay
- Console shows no errors

If the canvas is blank or SPIN throws: check browser DevTools console before reporting.

---

## End of Session 3 — Final Checklist

```
[ ] pnpm vitest run    → all green (reelMath + SceneManager + usePixiApp + GameCanvas tests)
[ ] pnpm tsc --noEmit  → zero errors
[ ] pnpm lint          → zero violations
[ ] pnpm dev           → canvas visible, reels spin on click, stop with cascade
[ ] No v7 PixiJS patterns anywhere
[ ] Every PixiJS Container/Sprite created has a corresponding destroy() path
[ ] GameCanvas.vue contains zero game logic (only wiring)
[ ] src/game/ still has zero Vue/Pinia/PixiJS imports
[ ] PROJECT_CONTEXT.md dev state updated
```

Report format:

- Files created/modified
- Test count: Session 2 (102) → Session 3 total
- Visual smoke test result (what you see in the browser)
- Deviations from architecture.md with reasoning
- Blockers for Session 4

---

## Session 4 Preview

Session 4 will add:

- Win line rendering (Graphics-drawn payline highlights)
- Symbol win/dim animations (pulse on winning symbols, dim on losers)
- `BalanceDisplay.vue` (credits, last win)
- `BetPanel.vue` (coin selector)
- `Paytable.vue` (full-screen overlay)
- Wire `completePaying()` after win animation finishes

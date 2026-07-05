# Session 6 Prompt

## Neon Reels: Polish, Audio, Performance & README

> Paste this entire document into a NEW session.
> This is the final development session. After this the project is portfolio-ready.
> Confirm docs/architecture.md and docs/pixi-v8-patterns.md exist on disk before starting.

---

## Mandatory Context — Read Before Any Action

Read these files in full, in this order:

1. `AGENTS.md` — Behavioral rules + Vue component order section (recently added)
2. `SKILLS.md` — Approved commands
3. `PROJECT_CONTEXT.md` — Update it in Task 1
4. `docs/architecture.md` — Sections 11 (performance targets), 12 (asset credits)
5. `docs/pixi-v8-patterns.md` — Sections: Filters/Glow, ParticleContainer

Then read these files before writing any code:

```
src/pixi/scenes/GameScene.ts           — startSpin ticker cleanup (confirm app stored as property)
src/composables/usePixiApp.ts          — app lifecycle
src/composables/useAudio.ts            — stub to implement
src/pixi/components/SymbolSprite.ts    — pulse() stub to implement
src/stores/useHistoryStore.ts          — READ CAREFULLY: confirm default service is initialized
src/components/WinHistory.vue          — fetchHistory on mount
src/components/Paytable.vue            — ESC key not yet implemented
```

Confirm all files read. Before beginning Task 0, state:

1. How `useHistoryStore` initializes its service (DI via setService, or direct new?)
2. What `SymbolSprite.pulse()` currently contains
3. Whether `GameScene.startSpin` stores `app` as a class property

---

## Pre-flight Fixes (Complete Before Polish Tasks)

---

### TASK 0 — Remove Debug Logs

Remove the two console.log lines added during debugging:

- `[watcher] phase:` log in `src/components/GameCanvas.vue`
- `[GameScene] startSpin called` log in `src/pixi/scenes/GameScene.ts`

Run `pnpm lint` — confirm zero violations.

---

### TASK 0.5 — Enforce Vue Component Order

Add to `eslint.config.js` inside the Vue plugin rules:

```javascript
'vue/component-tags-order': ['error', {
  order: ['script', 'template', 'style'],
}],
```

Run `pnpm lint` — it will flag every `.vue` file with incorrect order.
Reorder all flagged files: `<script setup lang="ts">` → `<template>` → `<style scoped lang="scss">`.
Zero logic changes — structural reorder only.

Run `pnpm vitest run` after — confirm all 177 tests still pass.
Run `pnpm lint` — confirm zero violations, zero warnings.

---

### TASK 0.7 — Fix History Persistence After Browser Refresh

Read `src/stores/useHistoryStore.ts` carefully. The Session 2 DI deviation
(setService pattern instead of direct instantiation) may cause `fetchHistory`
to fail silently on fresh page load if no default service is created.

Confirm or fix: the store must have a default service instance available
without requiring `setService` to be called first:

```typescript
// The store must initialize a default service instance
// whether via DI or direct instantiation
const service = ref<HistoryService>(new ClientHistoryService());

// setService only used in tests:
function setService(s: HistoryService): void {
  service.value = s;
}
```

After fixing, verify:

1. Run `pnpm api` then `pnpm dev`
2. Run 3 spins
3. Hard refresh the browser (Ctrl+Shift+R)
4. History panel should show the 3 records from before refresh
5. Check Network tab — a GET /history request should appear on mount

Also check `db.json` directly after spins to confirm json-server is persisting
records to disk. If db.json is empty despite 201 POST responses, json-server
may need `--watch` flag or a config adjustment.

Run `pnpm vitest run` after — confirm store tests still pass with the fix.

---

### TASK 0.8 — Add ESC Key to Paytable

Read `src/components/Paytable.vue`. Add keyboard ESC support to close the overlay.

```typescript
// Add to <script setup>
import { onMounted, onUnmounted } from 'vue'; // add to existing import

function onKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && isOpen.value) close();
}
onMounted(() => document.addEventListener('keydown', onKeyDown));
onUnmounted(() => document.removeEventListener('keydown', onKeyDown));
```

Verify manually: open Paytable with ℹ button, press ESC — overlay closes.

---

## Session 6 Polish Tasks

---

### TASK 1 — Update PROJECT_CONTEXT.md

Mark Session 5 items complete. Add Session 6 as in-progress.
Add the reactivity race condition fix to Known Issues/Design Decisions:

```markdown
- Vue reactivity race (FIXED): watcher fired between setPhase('SPINNING') and
  setResult() in machine.spin(). Fixed by watching [phase, lastResult] tuple
  with spinStarted flag to prevent double-trigger. Tests couldn't catch this
  because vi.mock('pixi.js') made the async timing invisible to Vitest.
```

---

### TASK 2 — Neon Glow on Winning Symbols

Read `docs/pixi-v8-patterns.md` section "Filters — Neon Glow Effect" before implementing.

**Implement `SymbolSprite.pulse()` and `SymbolSprite.stopPulse()`:**

```typescript
import { BlurFilter, Ticker } from 'pixi.js'
import type { Application } from 'pixi.js'

private glowFilter: BlurFilter | null = null
private glowPhase = 0
private tickHandler: ((ticker: Ticker) => void) | null = null

pulse(app: Application): void {
  if (this.glowFilter) return

  const filter = new BlurFilter({ strength: 2, quality: 3 })
  this.glowFilter = filter
  this.filters = [filter]

  this.tickHandler = (ticker: Ticker) => {
    this.glowPhase += 0.06 * ticker.deltaTime
    filter.strength = 3 + Math.sin(this.glowPhase) * 2
  }
  app.ticker.add(this.tickHandler)
}

stopPulse(app: Application): void {
  if (this.tickHandler) {
    app.ticker.remove(this.tickHandler)
    this.tickHandler = null
  }
  this.filters = []
  this.glowFilter = null
  this.glowPhase = 0
}
```

**Update GameScene.showWin() signature:**
`showWin(result: SpinResult, app: Application): void`

Call `sprite.pulse(app)` on winning sprites, `sprite.stopPulse(app)` in `clearWin()`.

**Update showWinAnimation():**
`async showWinAnimation(result: SpinResult, app: Application): Promise<void>`

**Update GameCanvas.vue PAYING handler:**

```typescript
await gameScene.showWinAnimation(gameStore.lastResult, app);
```

The `app` instance is already available in GameCanvas.vue from `usePixiApp`.

Verify: `pnpm tsc --noEmit` passes. Visually in `pnpm dev`: winning symbols
glow with pulsing neon effect during the 2-second win display.

---

### TASK 3 — Win Particles for Big Wins

Read `docs/pixi-v8-patterns.md` section "ParticleContainer" before implementing.
Big win threshold: `totalWin > bet.totalBet * 20`.

Create `src/pixi/components/WinParticles.ts`:

```typescript
import { Container, ParticleContainer, Sprite, Texture, Ticker } from 'pixi.js';
import type { Application } from 'pixi.js';

const PARTICLE_COUNT = 80;
const PARTICLE_COLORS = [0xffd700, 0x00ffff, 0xff00ff, 0xffffff];

export class WinParticles extends Container {
  private particleContainer: ParticleContainer | null = null;
  private velocities: Array<{ vx: number; vy: number }> = [];
  private tickHandler: ((ticker: Ticker) => void) | null = null;

  burst(app: Application, x: number, y: number): void {
    this.cleanup(app);

    this.particleContainer = new ParticleContainer(PARTICLE_COUNT, {
      position: true,
      alpha: true,
      tint: true,
    });

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = new Sprite(Texture.WHITE);
      p.width = 6;
      p.height = 6;
      p.anchor.set(0.5);
      p.position.set(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 40,
      );
      p.tint =
        PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
      p.alpha = 1;
      this.particleContainer.addChild(p);

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      this.velocities.push({
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
      });
    }

    this.addChild(this.particleContainer);

    this.tickHandler = (ticker: Ticker) => {
      if (!this.particleContainer) return;
      let allFaded = true;

      this.particleContainer.children.forEach((child, i) => {
        const p = child as Sprite;
        p.x += this.velocities[i].vx * ticker.deltaTime;
        p.y += this.velocities[i].vy * ticker.deltaTime;
        this.velocities[i].vy += 0.15 * ticker.deltaTime;
        p.alpha -= 0.018 * ticker.deltaTime;
        if (p.alpha > 0) allFaded = false;
      });

      if (allFaded) this.cleanup(app);
    };

    app.ticker.add(this.tickHandler);
  }

  cleanup(app: Application): void {
    if (this.tickHandler) {
      app.ticker.remove(this.tickHandler);
      this.tickHandler = null;
    }
    if (this.particleContainer) {
      this.particleContainer.destroy({ children: true });
      this.particleContainer = null;
    }
    this.velocities = [];
  }
}
```

Add `WinParticles` to `GameScene`:

- Class field: `private winParticles!: WinParticles`
- In `init()`: `this.winParticles = new WinParticles(); this.addChild(this.winParticles)`
- In `showWin()`, at the end: if big win, call `this.winParticles.burst(app, centerX, centerY)`
- In `GameScene.destroy()`: `this.winParticles?.cleanup(this.app!)` before super.destroy

Add constant: `const BIG_WIN_MULTIPLIER = 20`

---

### TASK 4 — useAudio.ts Implementation

`@pixi/sound` is already installed. Implement the stub in `src/composables/useAudio.ts`.
Audio files do not exist yet — implementation must fail silently on missing files.

```typescript
import { ref } from 'vue';
import type { SoundKey } from '@/types/game.types';

// Lazy import @pixi/sound to avoid breaking the game if audio init fails
let soundLib: typeof import('@pixi/sound') | null = null;

async function loadSoundLib(): Promise<void> {
  try {
    soundLib = await import('@pixi/sound');
  } catch {
    // Audio unavailable — game continues without sound
  }
}

const isMuted = ref(false);
const SOUND_PATHS: Record<SoundKey, string> = {
  reel_spin: '/audio/reel_spin.ogg',
  reel_stop: '/audio/reel_stop.ogg',
  win_small: '/audio/win_small.ogg',
  win_medium: '/audio/win_medium.ogg',
  win_big: '/audio/win_big.ogg',
  free_spins_trigger: '/audio/free_spins_trigger.ogg',
  button_click: '/audio/button_click.ogg',
  autoplay_stop: '/audio/autoplay_stop.ogg',
};

async function preload(): Promise<void> {
  await loadSoundLib();
  if (!soundLib) return;
  for (const [key, path] of Object.entries(SOUND_PATHS) as [
    SoundKey,
    string,
  ][]) {
    try {
      soundLib.Sound.from({ url: path, preload: true });
    } catch {
      /* silent */
    }
  }
}

function play(key: SoundKey): void {
  if (isMuted.value || !soundLib) return;
  try {
    soundLib.sound.play(key);
  } catch {
    /* silent */
  }
}

function stop(key: SoundKey): void {
  if (!soundLib) return;
  try {
    soundLib.sound.stop(key);
  } catch {
    /* silent */
  }
}

function setMuted(muted: boolean): void {
  isMuted.value = muted;
}

export function useAudio() {
  return { play, stop, setMuted, isMuted, preload };
}
```

Wire the most impactful calls in `GameCanvas.vue`:

- After app init: `await audio.preload()`
- Phase `SPINNING`: `audio.play('reel_spin')`
- Phase `PAYING`: `audio.stop('reel_spin')` + play appropriate win sound
- Phase `FREE_SPINS_INTRO`: `audio.play('free_spins_trigger')`

Add mute toggle button to `App.vue` HUD near the ℹ button:

```vue
<button class="mute-btn" @click="audio.setMuted(!audio.isMuted.value)">
  {{ audio.isMuted.value ? '🔇' : '🔊' }}
</button>
```

---

### TASK 5 — Responsive Canvas Scaling

The canvas uses fixed 900×640. Apply CSS scaling for smaller viewports.

In `src/components/GameCanvas.vue` scoped styles:

```scss
.game-canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #0a0a1a;
}

canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: 900px;
  height: 640px;
  object-fit: contain;
}
```

Test at 1280px, 900px, and 768px viewport widths using DevTools device mode.

---

### TASK 6 — Performance Audit (Document Results)

Open Chrome DevTools → Memory tab:

1. Take heap snapshot — note JS heap size
2. Run 100 spins (autoplay × 25 four times)
3. Take second snapshot
4. Compare sizes

Then Performance tab:

1. Record 10 spins
2. Check Frames section — target sustained 60 FPS
3. Note any Long Tasks during reel animation

Document exact numbers in your session report.
No code changes needed if heap is stable. If heap grows consistently:

- Check WinParticles.cleanup() is called in GameScene.destroy()
- Check all ticker handlers are removed in destroy() paths

---

### TASK 7 — README.md Final Version

Write a complete, portfolio-quality README. Structure:

```
# Neon Reels 🎰
[one-line description]
[stack list]

## What This Demonstrates
[updated skill → implementation table]

## Architecture
[layer diagram]
[one sentence per layer on why it exists]

## State Machine
[FSM diagram]
[one sentence on custom FSM vs XState decision]

## Key Design Decisions
[3-4 decisions: SpinService interface, game logic isolation, json-server, reactivity race fix]
[The reactivity race fix is worth including — real debugging story]

## Getting Started
[exact commands: pnpm install, pnpm api, pnpm dev]
[note: audio requires .ogg files in src/assets/audio/]

## Game Features
[complete list including free spins, autoplay, history, paytable, mute, ESC to close]

## Testing
[177 tests, what's covered, PixiJS visual testing note]

## Credits
[Kenney — CC0]
[freesound.org — CC0]
[Orbitron — OFL]

## License
MIT
```

---

### TASK 8 — Final PROJECT_CONTEXT.md

Mark all items complete. Known Issues section:

```markdown
## Known Issues / Design Decisions

- freeSpinsAccumulated: local variable in GameCanvas.vue; resets on remount.
  Production: move to store.
- Audio: implemented but requires .ogg files in src/assets/audio/.
  See docs/sound-credits.md for recommended freesound.org sources.
- Sprites: colored placeholder squares. Kenney Casino Pack assets are
  drop-in replacements — update SYMBOL_TEXTURE_MAP in SymbolSprite.ts.
- RTP simulation: 1 todo test (run pnpm coverage to see scope).
- Vue reactivity race (resolved): documented in Known Issues above.
```

---

## End of Session 6 — Final Checklist

```
[ ] pnpm vitest run    → all green, ≥177 tests
[ ] pnpm tsc --noEmit  → zero errors
[ ] pnpm lint          → zero errors, zero warnings
[ ] History persists after browser refresh (TASK 0.7 verified)
[ ] ESC closes Paytable overlay
[ ] Debug console.log lines removed
[ ] All .vue files use script → template → style order
[ ] Winning symbols show neon glow and pulse
[ ] Big wins trigger particle burst
[ ] Canvas scales at 768px viewport
[ ] Audio wired (plays when .ogg files present, silent otherwise)
[ ] Mute button functional
[ ] README.md complete and portfolio-quality
[ ] PROJECT_CONTEXT.md all items checked
[ ] Memory audit numbers documented
```

Final report: files created/modified, test count, performance numbers,
visual observations, any remaining known issues.

---

## After Session 6 — Your Remaining Steps

1. Add real assets: Kenney Casino Pack → src/assets/sprites/
   freesound.org audio → src/assets/audio/
   Update SymbolSprite.ts SYMBOL_TEXTURE_MAP and LoadingScene bundle

2. Deploy to Netlify:
   - `pnpm build` → deploys the dist/ folder
   - For history panel on live: deploy json-server to Railway (free tier)
     set VITE_API_BASE_URL env var in Netlify dashboard
     update ClientHistoryService baseUrl to use import.meta.env.VITE_API_BASE_URL

3. Merge: feature/session-6 → dev → main

4. Portfolio: link live URL + GitHub repo
   docs/architecture.md is the document you walk through in technical interviews

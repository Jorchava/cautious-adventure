# PixiJS v8 Patterns — Verified Reference

> Slot-game-specific PixiJS v8 patterns for agents working in this codebase.
> Every pattern here is verified against the PixiJS v8 API.
> Do NOT use v7 patterns from training data or old documentation — the API changed substantially.
> Update this file when new patterns are confirmed during development.

---

## Application Lifecycle

```typescript
// ✅ v8 — Application.init() is ASYNC
import { Application } from 'pixi.js'

const app = new Application()
await app.init({
  canvas: canvasElement,       // HTMLCanvasElement from Vue ref
  resizeTo: containerElement,  // Automatically resizes to parent
  background: '#0a0a1a',
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,           // Handles HiDPI displays
})

// ❌ v7 — REMOVED in v8
const app = new Application({ width: 1280, height: 720 }) // sync, forbidden
```

**Vue integration — required lifecycle shape:**

```typescript
// src/composables/usePixiApp.ts
export function usePixiApp(canvasRef: Ref<HTMLCanvasElement | null>) {
  const app = new Application()

  onMounted(async () => {
    if (!canvasRef.value) return
    await app.init({
      canvas: canvasRef.value,
      resizeTo: canvasRef.value.parentElement ?? undefined,
      background: '#0a0a1a',
      antialias: true,
    })
    // mount scenes here
  })

  onUnmounted(() => {
    app.destroy(true, { children: true, texture: true, baseTexture: true })
  })

  return { app }
}
```

---

## Asset Loading

```typescript
// ✅ v8 — Assets replaces Loader entirely
import { Assets } from 'pixi.js'

// Single asset
const texture = await Assets.load('/sprites/wild.png')

// Named bundle with progress (use in LoadingScene)
Assets.addBundle('symbols', {
  wild:    '/sprites/wild.png',
  scatter: '/sprites/scatter.png',
  high_a:  '/sprites/high_a.png',
  high_b:  '/sprites/high_b.png',
  low_a:   '/sprites/low_a.png',
  low_b:   '/sprites/low_b.png',
})

const textures = await Assets.loadBundle('symbols', (progress: number) => {
  loadingProgress.value = Math.round(progress * 100)
})

// Access loaded texture by key
const sprite = new Sprite(textures.wild)

// ❌ v7 — Loader removed entirely
PIXI.Loader.shared.add('wild', '/sprites/wild.png').load(...)  // FORBIDDEN
```

---

## Interactivity

```typescript
// ✅ v8 — eventMode replaces interactive boolean
sprite.eventMode = 'static'    // For stationary objects: buttons, symbols
sprite.eventMode = 'dynamic'   // For moving objects
sprite.cursor = 'pointer'
sprite.on('pointerdown', handleClick)
sprite.on('pointerover', handleHover)
sprite.off('pointerdown', handleClick)  // cleanup

// ❌ v7 — REMOVED
sprite.interactive = true       // FORBIDDEN
sprite.buttonMode = true        // FORBIDDEN
```

---

## Destroy and Cleanup

```typescript
// ✅ Full application cleanup — REQUIRED in onUnmounted
app.destroy(true, {
  children: true,     // destroy all child display objects
  texture: true,      // destroy textures
  baseTexture: true,  // destroy base textures (GPU memory)
})

// ✅ Removing a scene / container
scene.destroy({ children: true })
app.stage.removeChild(scene)

// ✅ Removing a single sprite
sprite.destroy()
container.removeChild(sprite)

// ✅ Cleanup: remove Ticker callback
const onTick = (ticker: Ticker) => { /* ... */ }
app.ticker.add(onTick)
// ...later...
app.ticker.remove(onTick)
```

---

## Ticker (Game Loop)

```typescript
import { Ticker } from 'pixi.js'

// Add to app ticker — frame-rate independent via deltaTime
app.ticker.add((ticker: Ticker) => {
  // ticker.deltaTime: 1.0 at 60fps; 2.0 at 30fps (normalize velocity with this)
  // ticker.deltaMS: milliseconds since last frame
  reel.y -= SPIN_SPEED * ticker.deltaTime
})

// Priority — lower priority runs first
app.ticker.add(updatePhysics, undefined, UPDATE_PRIORITY.HIGH)
app.ticker.add(updateRender, undefined, UPDATE_PRIORITY.LOW)

// Remove ticker callback (REQUIRED on scene destroy)
const tickHandler = (ticker: Ticker) => { /* ... */ }
app.ticker.add(tickHandler)
// on cleanup:
app.ticker.remove(tickHandler)
```

---

## Reel Strip Animation Pattern

Core pattern for `ReelComponent.ts`. The strip wraps symbols vertically.

```typescript
import { Container, Sprite, Ticker } from 'pixi.js'

const SYMBOL_HEIGHT = 160
const MAX_VELOCITY = 40          // px per tick at 60fps
const DECEL_FACTOR = 0.92        // multiply velocity per tick during deceleration
const MIN_SNAP_VELOCITY = 1.5    // velocity threshold to trigger snap

class ReelComponent extends Container {
  private sprites: Sprite[] = []
  private stripOffset = 0
  private velocity = 0
  private isSpinning = false
  private targetOffset: number | null = null

  // Start spinning
  spin(): void {
    this.isSpinning = true
    this.velocity = MAX_VELOCITY
    this.targetOffset = null
  }

  // Begin stopping at a specific strip position
  stop(stripIndex: number): void {
    // Target offset positions the desired symbol at row 0
    this.targetOffset = stripIndex * SYMBOL_HEIGHT
  }

  // Called by Ticker every frame
  update(ticker: Ticker): void {
    if (!this.isSpinning) return

    if (this.targetOffset !== null) {
      // Deceleration phase
      this.velocity *= DECEL_FACTOR
      if (this.velocity <= MIN_SNAP_VELOCITY) {
        this.snapToTarget()
        return
      }
    }

    this.stripOffset = (this.stripOffset + this.velocity * ticker.deltaTime)
      % (REEL_STRIP_LENGTH * SYMBOL_HEIGHT)

    this.updateSpritePositions()
  }

  private updateSpritePositions(): void {
    this.sprites.forEach((sprite, i) => {
      const y = ((this.stripOffset + i * SYMBOL_HEIGHT) % TOTAL_STRIP_PX)
      // Wrap: if sprite goes above visible area, reposition at bottom
      sprite.y = y < -SYMBOL_HEIGHT ? y + TOTAL_STRIP_PX : y
    })
  }

  private snapToTarget(): void {
    // Position sprites at exact grid without floating point drift
    this.sprites.forEach((sprite, i) => {
      sprite.y = i * SYMBOL_HEIGHT
    })
    this.isSpinning = false
    this.velocity = 0
    this.emit('stopped', this)
  }
}
```

---

## Masking (Reel Viewport)

```typescript
import { Container, Graphics } from 'pixi.js'

// Clips the reel container to show only 3 rows
const reelContainer = new Container()

const mask = new Graphics()
mask.rect(
  REEL_START_X,
  REEL_START_Y,
  REEL_WIDTH * 5 + REEL_GAP * 4,  // total width of all 5 reels
  SYMBOL_HEIGHT * 3                 // exactly 3 rows
).fill(0xffffff)

reelContainer.mask = mask
reelContainer.addChild(mask)  // ⚠ Mask MUST be added to the scene graph to work
app.stage.addChild(reelContainer)
```

---

## Filters — Neon Glow Effect

```typescript
import { BlurFilter, Sprite } from 'pixi.js'

// Static glow
const glow = new BlurFilter({ strength: 6, quality: 3 })
symbolSprite.filters = [glow]

// Animated pulsing glow (in Ticker)
let phase = 0
app.ticker.add((ticker: Ticker) => {
  phase += 0.04 * ticker.deltaTime
  glow.strength = 3 + Math.sin(phase) * 3  // oscillates 0–6
})

// Remove filters on destroy
symbolSprite.filters = []
symbolSprite.destroy()
```

---

## ParticleContainer (Big Win Celebrations)

```typescript
import { ParticleContainer, Sprite, Assets } from 'pixi.js'

// ParticleContainer is highly optimized for many identical sprites
const particles = new ParticleContainer(200, {
  position: true,
  alpha: true,
  scale: true,
  rotation: true,
})
app.stage.addChild(particles)

// Spawn burst
const texture = await Assets.load('/sprites/particle.png')
for (let i = 0; i < 80; i++) {
  const p = new Sprite(texture)
  p.anchor.set(0.5)
  p.position.set(
    Math.random() * app.screen.width,
    Math.random() * app.screen.height
  )
  p.alpha = 1
  particles.addChild(p)
}

// Animate in Ticker — fade and float upward
const velocities = Array.from({ length: 80 }, () => ({
  vx: (Math.random() - 0.5) * 4,
  vy: -(Math.random() * 3 + 1),
}))

app.ticker.add((ticker: Ticker) => {
  particles.children.forEach((child, i) => {
    const p = child as Sprite
    p.x += velocities[i].vx * ticker.deltaTime
    p.y += velocities[i].vy * ticker.deltaTime
    p.alpha -= 0.015 * ticker.deltaTime
  })
  // Remove when all faded
  if ((particles.children[0] as Sprite)?.alpha <= 0) {
    particles.destroy({ children: true })
  }
})
```

---

## Win Line Graphics

```typescript
import { Graphics, Container } from 'pixi.js'

// Draw a winning payline
function drawPayline(
  container: Container,
  lineIndex: number,
  rowIndices: number[], // 5 row indices from PAYLINES config
  reelPositions: number[] // x position of each reel center
): void {
  const g = new Graphics()

  const points = rowIndices.map((row, reelIndex) => ({
    x: reelPositions[reelIndex],
    y: REEL_START_Y + row * SYMBOL_HEIGHT + SYMBOL_HEIGHT / 2,
  }))

  g.moveTo(points[0].x, points[0].y)
  points.slice(1).forEach(p => g.lineTo(p.x, p.y))

  g.stroke({ width: 3, color: PAYLINE_COLORS[lineIndex], alpha: 0.85 })
  container.addChild(g)
}

// Cleanup all win lines
function clearWinLines(container: Container): void {
  container.destroy({ children: true })
  // Then re-create an empty container
}
```

---

## Common Pitfalls in This Codebase

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| Calling `app.init()` synchronously | `TypeError: Cannot read property 'stage' of undefined` | Always `await app.init()` |
| Forgetting to add mask to scene graph | Mask defined but has no effect | `container.addChild(mask)` after `container.mask = mask` |
| Not calling `destroy()` on scene switch | GPU memory grows with each session | `scene.destroy({ children: true })` before switching |
| Leftover Ticker callbacks after destroy | Errors firing on destroyed objects | `app.ticker.remove(callback)` in every cleanup path |
| `Assets.load()` called before `app.init()` | Inconsistent behavior | Always init app before loading assets |
| Sprite positions drifting after many frames | Floating-point accumulation in strip offset | Use modulo to reset offset periodically, or snap to grid on stop |
| Using `new Sprite(Texture.from(...))` without prior load | Empty/broken sprite or inconsistent display | Load via `Assets.loadBundle()` in LoadingScene first |

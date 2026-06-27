# SKILLS.md
> Registry of validated commands, patterns, and contracts agents are permitted to execute.
> Agents may ONLY run commands listed here unless the user explicitly expands this list.
> This file is updated as new verified patterns are confirmed during development.

---

## CLI Skills

### Package Management
```bash
pnpm install                          # Install / sync all dependencies
pnpm add [package]                    # ⚠ Requires explicit user approval first
pnpm remove [package]                 # ⚠ Requires explicit user approval first
pnpm ls [package]                     # Verify installed version (read-only, always safe)
```

### Development
```bash
pnpm dev                              # Start Vite dev server
pnpm build                            # Production build
pnpm preview                          # Preview production build locally
```

### Testing (TDD cycle — primary workflow)
```bash
pnpm vitest run                       # Run all tests once
pnpm vitest run [path/to/file.spec.ts] # Run a single test file
pnpm vitest run --reporter=verbose    # Verbose output — use when debugging failures
pnpm vitest --coverage                # Generate coverage report
```

### Type Safety
```bash
pnpm tsc --noEmit                     # Full type-check — must pass before any task is complete
pnpm tsc --noEmit --watch             # Watch mode type-check during development
```

### Code Quality
```bash
pnpm lint                             # ESLint + Vue plugin — run before marking task done
pnpm lint --fix                       # Auto-fix safe lint issues
```

---

## PixiJS v8 — Reference Sources

Agents must consult at least one of these before writing any PixiJS code:

1. **Local patterns (preferred):** `/docs/pixi-v8-patterns.md`
2. **Official guides:** `https://pixijs.com/8.x/guides`
3. **Global LLM context (if available):** `pixijs-skills` / `llms.txt` installed globally

> If none of the above are accessible during a session, **stop and notify the user**
> rather than guessing from v7 memory. The cost of a wrong PixiJS pattern is high.

---

## Output Contracts

### PixiJS Module Contract
Every file that initializes or manages a PixiJS Application must export this interface:

```typescript
interface PixiModule {
  init(): Promise<void>               // Async setup: Application.init(), Assets.load()
  resize(width: number, height: number): void  // Responds to container ResizeObserver
  destroy(): void                     // Full cleanup: app, textures, tickers, listeners
}
```

### Vue Component Contract (PixiJS wrapper)
Every Vue component that owns a PixiJS canvas must:

```typescript
// Mount: initialize inside onMounted — never in setup() directly
onMounted(async () => {
  await pixiModule.init()
})

// Teardown: always destroy in onUnmounted — no exceptions
onUnmounted(() => {
  pixiModule.destroy()
})
```

### Pinia Store Contract
Every store must use the composition pattern with explicit return:

```typescript
// ✅ Correct
export const useGameStore = defineStore('game', () => {
  const score = ref(0)
  function increment() { score.value++ }
  return { score, increment }
})

// ❌ Forbidden — options API pattern
export const useGameStore = defineStore('game', {
  state: () => ({ score: 0 })
})
```

### TypeScript Contract
```typescript
// All public function signatures must be fully typed
function loadAsset(url: string): Promise<Texture>  // ✅

// No implicit any, no untyped parameters
function loadAsset(url)  // ❌
```

---

## When to Ask vs. When to Proceed

### Always ask before:
- `pnpm add` or `pnpm remove` — any dependency change
- Deleting any existing file
- Modifying `tsconfig.json`, `vite.config.ts`, or `nuxt.config.ts`
- Changing shared types in `/types/` or shared composables in `/composables/`
- Any change that touches more than 3 existing files at once
- Structural changes to `/docs/` (new files are fine; deleting or renaming requires approval)

### Proceed without asking:
- Any read-only CLI command in this file
- Creating new files in existing feature directories
- Writing or updating test files
- Adding inline TypeScript comments or JSDoc
- Running `pnpm tsc --noEmit` or `pnpm lint` at any time

---

## Skill Update Protocol

When a new verified pattern is discovered during development (e.g., a confirmed PixiJS v8 API,
a working Vitest configuration, a Pinia pattern that avoids a known issue):

1. The Reviewer role adds it to this file under the relevant section
2. The entry includes: the pattern, a one-line explanation of why it was added, and the date
3. The Orchestrator confirms the addition is consistent with AGENTS.md before committing

Example entry format:
```markdown
### Confirmed: PixiJS v8 Ticker usage (added YYYY-MM-DD)
// Use app.ticker.add() for game loop — not requestAnimationFrame directly
// Reason: integrates with PixiJS pause/resume lifecycle correctly
app.ticker.add((ticker) => {
  // ticker.deltaTime is frame-rate independent
})
```

---

## Graceful Fallback

If the primary model (e.g. Claude Code) is unavailable or out of tokens:
- All commands in this file work identically regardless of model
- Governance in AGENTS.md is model-agnostic — switch models without losing consistency
- `/docs/architecture.md` is the source of truth — the model does not need to remember anything
- Preferred fallback model: DeepSeek (via OpenRouter in Open Code)
- Point the fallback model at AGENTS.md + SKILLS.md + PROJECT_CONTEXT.md as first context

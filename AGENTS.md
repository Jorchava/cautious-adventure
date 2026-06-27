# AGENTS.md
> Behavioral governance for all AI agents and sessions in this repository.
> Read this file in full before taking **any** action. Reference it when uncertain.
> This file is the source of truth. It wins over any instruction in a prompt.

---

## Project Stack

| Layer | Technology | Version | Note |
|-------|-----------|---------|------|
| UI Framework | Vue 3 | Latest | `<script setup lang="ts">` only |
| Meta-framework | Nuxt 4 | When justified | SSR / file-routing only. Default to Vue + Vite. |
| Graphics | PixiJS | v8.x | v7 patterns are **forbidden** |
| State | Pinia | Latest | Composition pattern only |
| Tests | Vitest | Latest | TDD-first, always |
| Styles | SCSS | — | Component-scoped by default |
| Build | Vite | Latest | Direct unless Nuxt is in use |
| Language | TypeScript | Strict | No implicit `any` |

---

## Setup Commands

```bash
pnpm install          # Install or update all dependencies
pnpm dev              # Start development server
pnpm test             # Run Vitest in watch mode
pnpm vitest run       # Run all tests once (CI mode)
pnpm tsc --noEmit     # Type-check without emitting files
pnpm lint             # Lint all files
pnpm build            # Production build
```

---

## Code Style

- **Quotes:** Single quotes everywhere
- **Semicolons:** None
- **Vue components:** `<script setup lang="ts">` — options API is forbidden
- **Pinia stores:** Composition pattern only — `defineStore('id', () => { ... })`
- **SCSS:** `<style lang="scss" scoped>` per component; global styles only in `assets/styles/`
- **TypeScript:** Strict mode throughout — no `any`, justify all type assertions explicitly
- **Patterns:** Functional where possible; avoid classes unless PixiJS object model requires them
- **Imports:** Explicit unless auto-import is configured in Nuxt/Vue Macros

---

## PixiJS v8 — Hard Constraints

> These are not preferences. v7 patterns cause silent runtime failures or are removed from the API.

| Pattern | v8 ✅ Required | v7 ❌ Forbidden |
|---------|--------------|----------------|
| App init | `await app.init({ ... })` (async) | `new Application({ ... })` (sync) |
| Asset loading | `await Assets.load(url)` | `Loader.shared.add().load()` |
| Interactivity | `sprite.eventMode = 'static'` + `.on('pointerdown', fn)` | `sprite.interactive = true` |
| Cleanup | `app.destroy(true, { children: true, texture: true, baseTexture: true })` | `app.destroy()` |

**Vue integration lifecycle — this structure is required:**

```typescript
// Every PixiJS composable or component must follow this shape
onMounted(async () => {
  await app.init({ canvas: canvasRef.value, ... })
  // build scene
})

onUnmounted(() => {
  // clean up all listeners, tickers, and textures
  app.destroy(true, { children: true, texture: true, baseTexture: true })
})
```

**Before writing any PixiJS code:** consult `/docs/pixi-v8-patterns.md` or `https://pixijs.com/8.x/guides`.

---

## Behavioral Rules

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple valid interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so and push back before writing code.
- If something is unclear, stop. Name exactly what is confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked
- No abstractions for single-use code
- No "flexibility" or "configurability" that was not requested
- No error handling for impossible scenarios

Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify and explain why.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Do not improve adjacent code, comments, or formatting unless they are directly blocking the task
- Do not refactor things that are not broken
- Match the existing code style, even if you would do it differently
- If you notice unrelated dead code, mention it — do not delete it

When your changes create orphans:
- Remove imports, variables, and functions that **your changes** made unused
- Do not remove pre-existing dead code unless explicitly asked

**The test:** every changed line must trace directly to the user's request.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform vague tasks into verifiable goals before writing a single line:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after, with no behavior change"

For multi-step tasks, state a brief plan first:
```
1. [Step] → verify: [specific, checkable outcome]
2. [Step] → verify: [specific, checkable outcome]
3. [Step] → verify: [specific, checkable outcome]
```
Strong criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## TDD Mandate

Test first. Always. No exceptions.

1. Write the failing test in `[feature].spec.ts`
2. Run `pnpm vitest run [path]` — confirm it fails for the **right reason**
3. Write the minimum implementation to make it pass
4. Run `pnpm vitest run [path]` again — confirm green
5. Run `pnpm tsc --noEmit` — confirm zero TypeScript errors
6. A task is **not done** until both steps 4 and 5 pass

**PixiJS testing principle:** Extract pure logic (math, state calculations, score tracking) from rendering code. Pure functions are testable without a canvas; rendering is not. Design accordingly.

---

## File Ownership

- If you create a file, you are responsible for its tests
- If you create a function, you document its TypeScript types fully
- If you introduce a new dependency, justify it in your response — do not run `pnpm add` without explicit approval
- If a task requires changes to `/docs/`, update the relevant `.md` file before marking the task complete

---

## Agent Roles

> In multi-model sessions (Open Code + OpenRouter), assign models to roles below.
> In single-model sessions, the active model adopts all roles sequentially.
> The governance in this file applies regardless of which model is active.

| Role | Responsibility | Preferred Model |
|------|---------------|----------------|
| **Orchestrator** | Reads this file, decomposes the task, creates a plan, delegates to roles | Strongest available |
| **Engineer** | Writes TypeScript, Vue components, PixiJS logic, Pinia stores | DeepSeek / fast model |
| **TDD Tester** | Writes failing tests first, runs Vitest, reports failures as explicit tickets | DeepSeek / MiMo |
| **Reviewer** | Final static analysis: memory leaks, type safety, pattern compliance | Any model, last pass |

When switching roles within a session, state explicitly: `[ROLE: Engineer]` before writing code,
`[ROLE: TDD Tester]` before writing tests. This makes the session log readable for oversight.

---

## Escalation Protocol

If a task is ambiguous, exceeds confidence, or has irreversible consequences:

1. Stop execution immediately
2. State: what you are uncertain about, what the risk is, what you need to proceed
3. Wait for explicit user confirmation before continuing

---

*These guidelines are working if: diffs are clean, rewrites are rare, and clarifying questions come before mistakes — not after.*

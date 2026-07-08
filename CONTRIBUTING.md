# Contributing to Neon Reels

Thank you for your interest in contributing. This document covers everything
you need to know to submit a useful pull request.

---

## Before You Start

Check the [open issues](https://github.com/Jorchava/cautious-adventure/issues)
to see if your idea or bug is already being tracked. If not, open one first
and describe what you want to do. This avoids duplicate work and lets us
discuss the approach before you invest time writing code.

---

## Development Setup

```bash
git clone https://github.com/Jorchava/cautious-adventure.git
cd cautious-adventure
pnpm install
cp db.example.json db.json

# Terminal 1
pnpm api

# Terminal 2
pnpm dev
```

---

## Code Standards

These are enforced by ESLint and TypeScript — your PR will fail CI if any
of these are violated.

### TypeScript
- Strict mode throughout — zero `any` types
- No `@ts-ignore` or `@ts-expect-error` without a comment explaining why
- All public function signatures must be fully typed

### Vue Components
All `.vue` files follow this block order — enforced by `vue/block-order`:

```
<script setup lang="ts">
<template>
<style lang="scss" scoped>
```

### PixiJS
- PixiJS v8 patterns only — consult `docs/pixi-v8-patterns.md`
- Every PixiJS object created must have a corresponding `destroy()` path
- No `@ts-expect-error` workarounds for PixiJS API — if something doesn't
  compile, the pattern is probably wrong

### Architecture Rule
`src/game/` must have zero imports from `vue`, `pinia`, or `pixi.js`.
This directory is pure TypeScript and must remain independently testable.
Verify with: `grep -r "from 'vue'" src/game/`

---

## Testing Requirements

All PRs must pass the full test suite:

```bash
pnpm vitest run          # All tests must pass
pnpm tsc --noEmit        # Zero TypeScript errors
pnpm lint                # Zero errors and zero warnings
```

If your change adds new functionality, it needs tests. If your change fixes
a bug, include a test that would have caught the bug. The `src/game/` layer
has near-100% coverage — maintain that.

PixiJS rendering code (scenes, components) is tested visually via `pnpm dev`.
Unit tests are not required for rendering code, but the pure math functions
in `src/pixi/utils/` must remain fully tested.

---

## Pull Request Process

1. Fork the repo and create a branch from `dev` (not `main`)
2. Make your changes following the standards above
3. Run the full check suite locally before pushing
4. Open a PR against the `dev` branch with a clear description of what changed and why
5. Reference any related issue with `Closes #123`

PRs that skip tests, introduce `any` types, or use v7 PixiJS patterns will
be returned for changes before review.

---

## What We Welcome

- Bug fixes with reproduction steps
- Performance improvements with before/after measurements
- New slot features (bonus rounds, additional symbol types, win line patterns)
- Improved visual effects using PixiJS v8 APIs
- Better audio integration
- Documentation improvements

## What Is Out of Scope

- Real-money gambling features of any kind
- Server-side RNG implementation (this is intentionally client-side for demo purposes)
- User authentication or accounts
- Payment processing

---

## Asset Licensing

All contributed assets (sprites, audio, fonts) must be CC0 or similarly
permissive. Include the source URL and license confirmation in
`docs/asset-credits.md` alongside your PR.

---

## Questions

Open an issue with the `question` label. We'll respond there so the answer
is visible to everyone.

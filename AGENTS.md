# Scope

This repository owns the community widget packages consumed by Aidget. It does not build
Aidget itself.

The current package contract lives in `README.md`, `schemas/`, the validation scripts, and their
tests. Inspect those sources instead of duplicating the contract here.

# Non-negotiable rules

- `registry.json` is generated. Run `pnpm registry`; never edit it by hand.
- Widget packages ship as-is. Do not add package scripts, lifecycle hooks, a build step, or runtime
  dependency installation.
- Any change to files included in an npm package requires a new semver version. Reviewed versions
  are immutable, including after a package is delisted.
- List only platforms that were actually rendered and checked in Aidget. CI validates static files,
  not desktop rendering.
- `packages/<id>/agents.md` is distributed widget guidance. This root `AGENTS.md` is repository
  guidance; do not remove the package file or treat the two as interchangeable.
- npm publication is owned by CI. Do not publish manually, rewrite published artifacts, or expose
  npm credentials.
- Preserve existing staged and unstaged work. Do not stage, unstage, commit, push, publish, tag, or
  rewrite history unless the user explicitly asks.

# Validation

Run this gate after widget or validation changes:

```sh
pnpm check
pnpm registry
pnpm validate
pnpm test
pnpm build:site
pnpm exec vp check
```

`pnpm check` may modify files. The final non-fixing `pnpm exec vp check` must pass.

# Implementation

- Fail fast with explicit errors. Do not add fallback behavior or silently recover.
- Reuse the existing helpers in `scripts/package.mjs` instead of duplicating validation, path, JSON,
  or hashing logic.
- Reproduce bugs with a failing test before fixing them. Tests mirror the scripts under
  `tests/scripts/`.
- Keep `schemas/` synchronized with changes to Aidget's package or widget configuration contract.

---
name: create-aidget-widget
description: Create or update a static Aidget desktop widget package in this repository. Use for new widgets, visual iterations, widget metadata, permissions, screenshots, and agents.md.
---

# Create an Aidget Widget

## Before editing

- Read `README.md`, `schemas/widget-config.schema.json`, and the current `packages/welcome` package.
- For an existing Aidget widget, call `aidget_get` and read its `agents.md` before changing it.
- If Aidget MCP or desktop rendering is unavailable, finish the package but explicitly state that rendering, screenshots, and platform verification were not performed.

## Workflow

1. Choose a unique lowercase ID matching `[a-z0-9][a-z0-9-]{0,63}`.
2. Copy `packages/welcome` to `packages/<id>` and rename the npm package to `@aidget-community/<id>`.
3. Build the widget with `index.html`, `style.css`, and static files under `assets/`. Keep the package self-contained; do not add a build step, lifecycle script, or runtime dependencies.
4. Set `config.json` values for `title`, `screenshots`, verified `platforms`, initial `size`, `dragMode`, `permissions`, and `network`.
5. Write `agents.md` with the widget's purpose, refresh behavior, update constraints, and appearance requirements.
6. Use Aidget MCP tools when available for live rendering, revisions, and screenshots. Keep the accepted HTML and CSS in the package.
7. Capture the actual rendered widget as `assets/screenshot.png`, `.jpg`, or `.webp`. Do not use a mockup or browser-only preview.

## Widget guidance

- Aidget provides a transparent host surface. Draw the widget's own background, border, radius, and focus treatment.
- Support `prefers-color-scheme` and `prefers-reduced-motion`. Do not rely on `backdrop-filter` for readability because desktop blur can disappear during dragging on macOS.
- Prefer local system fonts. Add a network origin only when the widget truly needs remote data, and declare the exact HTTPS origin in `network`.
- Request only the capabilities the widget uses. Scripts require the `script` permission.
- Keep runtime references relative and place scripts, images, and fonts under `assets/`. Do not use nested frames.
- Scripts and module preloads must be package-local. Inline `<script>` blocks are authorized by host-generated content hashes. Do not use remote scripts, inline event attributes, `javascript:` URLs, `eval`, `new Function`, or dynamically inserted inline code. Use `addEventListener` for events; network grants cover data and static resources only.
- Iterate from actual Aidget screenshots. Static HTML inspection is not visual verification.

## Package contract

- `package.json` uses an exact semver version and contains description, author, repository, license, and `files`.
- `config.json` requires at least one real screenshot. Initial width must be at least 160 and height at least 120.
- List only operating systems you rendered and checked in Aidget.
- Any change to published package content requires a new version. Do not reuse a reviewed or published version for different bytes.

## Verify

Run the repository checks:

```sh
pnpm ready
pnpm exec vp check
```

Report the exact checks run, the platforms verified in Aidget, and anything not tested. Do not stage, commit, publish, or edit generated registry content unless the user asks.

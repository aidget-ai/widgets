<!-- prettier-ignore -->
<div align="center">

# Aidget Community Widgets

**Community widgets for Aidget**

[![Check](https://img.shields.io/github/actions/workflow/status/aidget-ai/widgets/check.yml?branch=main&label=Check&style=flat-square)](https://github.com/aidget-ai/widgets/actions/workflows/check.yml)
[![Publish](https://img.shields.io/github/actions/workflow/status/aidget-ai/widgets/publish.yml?branch=main&label=Publish&style=flat-square)](https://github.com/aidget-ai/widgets/actions/workflows/publish.yml)
[![Node 24](https://img.shields.io/badge/Node.js-24-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![pnpm 12](https://img.shields.io/badge/pnpm-12-F69220?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-111111?style=flat-square)](LICENSE)

[Installation](#install-community-widgets) | [Development](#development) | [Widget contract](#widget-contract)<br>
English | [简体中文](README.zh-CN.md)

</div>

This repository hosts the community widgets used by Aidget and does not contain the Aidget desktop app itself. Each widget is a publish-ready npm package containing HTML, CSS, static assets, and widget metadata.

## Install community widgets

### From the app

Open the **Community Widgets** panel in Aidget to browse and install widgets.

### From the CLI

```sh
aidget community list
aidget community install @aidget-community/welcome
```

## Development

> Coding agents can use the `skills/create-aidget-widget` skill to help create Aidget widgets.

### Create a widget

Start from the welcome card to avoid boilerplate:

```sh
git clone https://github.com/aidget-ai/widgets.git && cd widgets
cp -R packages/welcome packages/<id>
```

Then complete the following:

1. Use `@aidget-community/<id>` as the npm package name and an exact semver version.
2. Set a unique widget ID, title, supported platforms, initial size, and required capabilities in `config.json`.
3. Write static HTML/CSS, and place runtime resources such as scripts, images, and fonts in `assets/`.
4. Document the purpose, update constraints, refresh behavior, and appearance notes in `agents.md`; this file ships to agents with the widget.
5. Render the widget in Aidget, capture a PNG, JPEG, or WebP screenshot, and list only the platforms you actually verified.
6. Run the [local checks](#local-checks) and open a pull request.

> Widget IDs must match `[a-z0-9][a-z0-9-]{0,63}`, match `<id>` in the package name, and use an initial size of at least `160 × 120`.

### Local checks

Node.js 24 and pnpm are recommended. After installing dependencies, run the full check:

```sh
pnpm install --frozen-lockfile --ignore-scripts
pnpm ready
```

### Distribution

After widget code is merged into `main`, it appears immediately in Aidget's community widget catalog.

> Aidget uses the platforms, permissions, and network origins declared in `config.json` to decide whether installation is allowed.

Widgets are also published to npm (`@aidget-community/<id>`):

- For new widgets, a staged package is published first and becomes public only after an administrator manually approves it once (a new npm platform rule).
- For widgets that already exist, the package is published directly through Trusted Publisher.

> npm packages are the preferred installation source (falling back to the GitHub repository when unavailable) and are also used to display installation counts.

## Widget contract

A published package uses the following structure:

```text
packages/<id>/
├── package.json          # npm metadata and published file list
├── config.json           # Aidget widget metadata
├── index.html            # widget entry point
├── style.css             # primary stylesheet
├── agents.md             # agent guidance distributed with the package
└── assets/               # screenshots and all runtime assets
```

### package.json

The package name must be `@aidget-community/<id>`, the version must use exact semver, and the package must include a description, author, repository, and license. `files` must include every file the widget needs at runtime.

> Widgets are installed as-is. Do not declare build scripts, lifecycle scripts, dependency installation, or `dependencies`, `optionalDependencies`, and `peerDependencies`.

### config.json

The following configuration requests no script, location, storage, or network capabilities:

```json
{
  "id": "note",
  "title": "Note",
  "logo": null,
  "screenshots": ["assets/screenshot.png"],
  "platforms": ["macos", "windows", "linux"],
  "size": { "width": 360, "height": 220 },
  "dragMode": "all",
  "permissions": [],
  "network": []
}
```

- `screenshots` must contain at least one image showing the widget rendered in Aidget; `logo` is optional. Images must be PNG, JPEG, or WebP, and each file must be no larger than 5 MiB.
- `platforms` must list only operating systems that were actually verified. The initial size must be at least `160 × 120`.
- `dragMode` supports two values:
  - `all`: regular widget content is draggable, and the host excludes interactive regions.
  - `handle`: only the drag handle at the top of the host is draggable.
- `permissions` accepts only `script`, `location`, and `storage`. Widgets do not receive host capabilities automatically, so every capability must be declared explicitly in `config.json`.
- Each `network` entry must be an HTTPS URL containing only an origin, such as `https://api.example.com`. HTTP, wildcards, paths, query parameters, fragments, and URL credentials are not allowed.

### Static assets

- Symbolic links are not allowed, and assets must not escape the widget directory.
- Runtime references must use relative paths; external resources may come only from the exact HTTPS origins declared in `config.json`.
- `iframe`, `object`, `embed`, and `base` elements are not allowed.
- Declare the `script` permission to use `<script>`.
- Scripts and module preloads must reference package-local files; network grants never authorize remote JavaScript. The host generates a CSP hash from the response content for inline `<script>` blocks.
- Inline event attributes and `javascript:` URLs are not allowed; use `addEventListener`. The runtime CSP also blocks `eval`, `new Function`, and newly added inline script content.
- An npm package may contain at most 1,000 files, a 20 MiB tarball, and 100 MiB unpacked.

## License

[MIT License](LICENSE)

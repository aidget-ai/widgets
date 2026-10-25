# Community widgets

- Each reviewed widget lives in `packages/<id>` and has `package.json`, portable `config.json`, `index.html`, screenshots and optional assets/author guidance.
- Package names use `@aidget-community/<id>`. Never include runtime revisions, local storage, secrets, user data or `node_modules` in packages.
- Shared schemas are exported from aidget Rust types. Do not hand-edit schemas; update the owning app contract and export it.
- Run `npm run registry`, `npm run check` and `npm test` before review.
- Distributed content changes require a new package version. Published name/version pairs are immutable.
- Do not execute widget scripts during packaging, validation or publication.
- Contributions require passing CI and human review. PRs have no publish credentials.

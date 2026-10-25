# aidget community widgets

Reviewed desktop widgets for [aidget](https://github.com/aidget-ai/aidget). Discoverable widgets live on `main`; package artifacts live on `dist` and npm under `@aidget-community/*`.

## Install

Use aidget's Community Widgets panel, or:

```sh
aidget community list --json
aidget community install @aidget-community/welcome --json
aidget community install @someone/widget@1.2.3 --json
```

Community installation uses the exact version shown by main. npm is attempted first. Missing versions, network failures and temporary service errors permit installation of the same version from official dist. Integrity or reviewed-content mismatches always fail. Third-party npm packages have no official dist channel. aidget downloads files natively; Node, npm, Bun and Git are not required on the client, and package scripts never run.

The panel's count is **npm weekly downloads**, not successful aidget installations or unique users. Dist downloads do not contribute to this statistic. Local cards show no source badge because their contents can be edited independently after installation.

## Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md). LOGO is optional; a real screenshot is required. All runtime resources must be included. A package.json is optional for user-created local widgets, but required for distribution.

## Publishing

After a reviewed merge to main, Actions validates and packs once with `npm pack --ignore-scripts`. Separate dist and npm jobs consume the same artifact. The workflow also supports manual dispatch. Re-running it preserves existing dist versions and verifies already-published npm integrity.

The npm job uses Trusted Publishing with OIDC, or the repository's `NPM_TOKEN` secret for a first publication. The npm organization owner must own `@aidget-community`, publish new packages initially and configure `aidget-ai/widgets` / `publish.yml` as Trusted Publisher with direct `npm publish` allowed. Without first-publication credentials, a new package stays available on dist and the workflow summary records the required setup. An existing package's rejected publication or a registry network error fails the npm job; it does not prevent dist publication.

Never put tokens in this repository. Configure repository branch rules to require the Check / validate status and one current-head review, and grant the Actions token write access to dist only through the publish job. Anonymous publishing and updates are outside this version.

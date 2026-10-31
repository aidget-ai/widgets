# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML and CSS generated with the repository's existing Node tooling.

## Users

Aidget users and visitors who want to discover desktop widgets created by the community before installing the desktop app.

## Product Purpose

The portal presents the reviewed community widget catalogue, shows what each widget looks like, and directs visitors to the official Aidget release download.

## Positioning

The catalogue is derived from the same reviewed `registry.json` consumed by Aidget. It presents the desktop widget experience directly, without requiring the app or an npm account to browse it.

## Operating Context

Visitors browse on desktop and mobile web. Community widget authors publish through this repository, where CI validates the catalogue and deploys its static preview site.

## Capabilities and Constraints

The first version lists every reviewed community entry with its title, first screenshot, and description. The site is static, supports Chinese and English interface text, follows the system color scheme, and has no search, filters, detail dialogs, download counts, npm status checks, author/version/platform metadata, or runtime GitHub API dependency.

## Brand Commitments

The portal represents Aidget's community widget programme and links to the official Aidget GitHub repository. The existing Aidget icon and the community panel's card language are approved identity references.

## Evidence on Hand

`registry.json` contains reviewed package metadata and media digests. Each current entry has a real rendered screenshot under `packages/<id>/assets/`. The Aidget icon is available from the main repository and is copied into this repository for self-contained builds.

## Product Principles

- Show reviewed content instead of fetching a second catalogue at runtime.
- Let screenshots carry the product while keeping metadata easy to scan.
- Keep every install and download path pointed at the official Aidget repository.
- Preserve the community catalogue's card language across languages and themes.

## Accessibility & Inclusion

The site provides semantic landmarks, keyboard-visible focus, descriptive link and image text, reduced-motion support, responsive layouts, and readable contrast in light and dark system themes.

---
name: Aidget Community Portal
description: A warm, image-led showcase for the Aidget community widget catalogue.
colors:
  brand-blue: '#4c64ce'
  brand-blue-deep: '#3d52b4'
  install-blue: '#4056bd'
  community-green: '#147b43'
  app-canvas: '#f4f4f6'
  app-canvas-deep: '#eceef3'
  porcelain: '#ffffff'
  charcoal: '#25252a'
  cool-gray: '#62626c'
  muted-slate: '#64646d'
  night-ground: '#1c1c20'
  night-surface: '#29292f'
  periwinkle: '#9aaaff'
  night-install: '#b5c0ff'
  night-green: '#75d59b'
typography:
  display:
    fontFamily: 'ui-rounded, SF Pro Rounded, Avenir Next Rounded, PingFang SC, Noto Sans CJK SC, sans-serif'
    fontSize: 'clamp(3rem, 8.2vw, 6rem)'
    fontWeight: 780
    lineHeight: 0.98
    letterSpacing: '-0.04em'
  headline:
    fontFamily: 'ui-rounded, SF Pro Rounded, Avenir Next Rounded, PingFang SC, Noto Sans CJK SC, sans-serif'
    fontSize: 'clamp(2.25rem, 4.5vw, 4.1rem)'
    fontWeight: 750
    lineHeight: 1.05
    letterSpacing: '-0.04em'
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Noto Sans CJK SC, sans-serif'
    fontSize: '16px'
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 'normal'
  label:
    fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Text, PingFang SC, Noto Sans CJK SC, sans-serif'
    fontSize: '11px'
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: 'normal'
rounded:
  sm: '6px'
  md: '10px'
  lg: '18px'
  xl: '26px'
  pill: '999px'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '48px'
  section: 'clamp(72px, 10vw, 124px)'
components:
  button-primary:
    backgroundColor: '{colors.brand-blue}'
    textColor: '{colors.porcelain}'
    rounded: '{rounded.pill}'
    typography: '{typography.body}'
    padding: '0 20px'
    height: '48px'
  button-primary-hover:
    backgroundColor: '{colors.brand-blue-deep}'
    textColor: '{colors.porcelain}'
  button-secondary:
    backgroundColor: '{colors.porcelain}'
    textColor: '{colors.charcoal}'
    rounded: '{rounded.pill}'
    typography: '{typography.body}'
    padding: '0 20px'
    height: '48px'
  install-link:
    backgroundColor: '{colors.install-blue}'
    textColor: '{colors.install-blue}'
    rounded: '{rounded.pill}'
    typography: '{typography.label}'
    padding: '6px 11px'
  widget-preview:
    backgroundColor: '{colors.deep-paper}'
    rounded: '{rounded.lg}'
    padding: '14px'
  navigation-link:
    backgroundColor: '{colors.porcelain}'
    textColor: '{colors.charcoal}'
    rounded: '{rounded.md}'
    typography: '{typography.body}'
    height: '40px'
---

# Design System: Aidget Community Portal

## Overview

**Creative North Star: "The Open Workbench"**

The portal treats the community catalogue as Aidget's desktop workbench opened to the public. Cool app neutrals and a clear blue brand signal give the landing page a calm, productive presence, while real widget screenshots provide the evidence and the app's checkerboard stage provides a familiar product cue.

The page scales its ambition into one image-led opening and then becomes a precise browsing surface. Metadata stays quiet, install actions stay recognizable, and the catalogue retains the scan rhythm of the desktop app.

**Key Characteristics:**

- Warm and tactile in the hero, restrained and utilitarian in the catalogue.
- Real screenshots carry the visual proof.
- Blue expresses the product identity and install actions.
- Rounded geometry and raised media surfaces echo the desktop app.

## Colors

The palette pairs cool app neutrals with a periwinkle-blue product accent and a green verification signal.

### Primary

- **Brand Blue:** Brand emphasis, hero phrase, selection, install actions, and primary download action.
- **Brand Blue Deep:** Hover state for the primary action.

### Secondary

- **Install Blue:** Install pills and their soft tinted hover background.

### Tertiary

- **Community Green:** Aidget community attribution only.

### Neutral

- **App Canvas:** Page foundation and light-theme breathing room.
- **App Canvas Deep:** Lower page field.
- **Porcelain:** Raised controls and screenshot frames.
- **Charcoal:** Primary text and high-emphasis content.
- **Cool Gray:** Descriptions and secondary navigation.
- **Muted Slate:** Descriptions and compact state labels that still need readable contrast.
- **Night Ground / Night Surface:** System dark-theme background and raised surfaces.

**The Restrained Signal Rule.** Blue owns brand emphasis and installation, while green owns community attribution; these roles do not swap.

## Typography

**Display Font:** Rounded system sans with CJK support.

**Body Font:** Platform UI sans with CJK support.

**Character:** Rounded display forms create a desktop-toy warmth while the body stack preserves app-like clarity and native language rendering.

### Hierarchy

- **Display:** Heavy, tightly set, short-line hero copy.
- **Headline:** Catalogue title and major section entry.
- **Title:** Widget names in compact card headings.
- **Body:** Descriptions and introductions, held to a readable measure.
- **Label:** Verification and compact actions.

## Layout

The page uses a centered 1320px shell with fluid side padding. The hero is a left-aligned display block followed by a wide product stage. The catalogue uses three equal columns on desktop, two below 940px, and one below 640px. Tonal cards use fixed header and description rows around one shared 16:10 preview ratio, so every card in a breakpoint has the same dimensions. Content never relies on viewport-width units for layout width.

## Elevation & Depth

The system is lightly lifted. Hero previews use a broad, soft shadow to read as a physical desktop object. Catalogue cards use a quiet surface tone and restrained shadow for separation; their checkerboard preview stages use tone alone, without outlines.

### Shadow Vocabulary

- **Product Stage:** Broad ambient shadow under the large hero preview.
- **Catalogue Card:** Soft ambient shadow around each tonal catalogue item.
- **Card Stage:** Borderless checkerboard tone inside widget previews.

**The One Raised Object Rule.** The hero product stage receives the full display shadow; repeated cards use one shared, quieter card elevation.

## Shapes

Navigation controls use gently rounded rectangles. Buttons and status pills are fully rounded. Screenshot stages use the larger catalogue radius, and the hero frame uses the most generous radius. Header controls and hero actions may use hairline boundaries; catalogue cards and preview stages do not.

## Components

### Buttons

- **Shape:** Full pill with 48px minimum height.
- **Primary:** Brand blue with porcelain text and a short directional arrow.
- **Secondary:** Porcelain surface with charcoal text and a visible outline.
- **Focus:** A visible three-pixel system-blue ring with four-pixel offset.

### Cards / Containers

- **Corner Style:** Twenty-pixel outer card; eighteen-pixel preview stage.
- **Background:** Solid app surface with a checkerboard preview stage inside.
- **Shadow Strategy:** Quiet ambient card shadow plus screenshot drop shadow.
- **Border:** None; card and preview boundaries are carried by surface tone and shadow.
- **Internal Padding:** Sixteen pixels for the card; fourteen pixels around contained screenshots.

### Navigation

- **Style:** Compact desktop-style bar with brand, language switch, and GitHub icon.
- **States:** Language and repository controls share the same hover background and text color.
- **Responsive:** Language and repository access remain visible on phones.

### Widget Catalogue

- **Identity:** Reusable grid glyph or logo, widget name, and green `aidget 社区` attribution.
- **Action:** Blue install pill at the trailing edge.
- **Preview:** Object-fit containment on the checkerboard stage.
- **Description:** One consistent two-line row below the preview; author, version, and platforms are omitted.

## Do's and Don'ts

### Do:

- **Do** let real widget screenshots lead each catalogue entry.
- **Do** keep brand, install, and verification colors in their fixed roles.
- **Do** preserve readable secondary text through at least 4.5:1 contrast.
- **Do** keep the hero product image placeholder visibly provisional until a real capture is supplied.

### Don't:

- **Don't** add display letter spacing tighter than `-0.04em`.
- **Don't** turn the repeated catalogue into nested raised cards.
- **Don't** introduce a second decorative visual world inside the catalogue.
- **Don't** use English-only text inside imagery shared by both language pages.

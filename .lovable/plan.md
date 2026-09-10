# Reusable liquid-glass design system

## Goal
Unify ClinQSphereX navigation, cards, dialogs, and evidence panels with one readable violet-and-white liquid-glass system while preserving all existing behavior and content.

## What will change
- Add shared semantic tokens for glass tint, edge light, depth, overlays, highlights, and motion in both light and dark contexts.
- Add reusable glass primitives with variants for standard cards, elevated panels, navigation, evidence, and dark cinematic surfaces.
- Restyle the shared Card, Dialog, Alert Dialog, and Hover Card components to use those primitives.
- Apply the same primitives to public navigation, authenticated navigation, safety/evidence panels, candidate evidence, and representative research cards.
- Keep blur and distortion restrained so text remains legible; avoid the external patterned background and SVG filter from the sample.

## Technical details
- Use Tailwind v4 semantic tokens and reusable utilities in the global stylesheet.
- Use standard `backdrop-filter` only; no browser-prefixed duplicate.
- Preserve focus states, keyboard behavior, reduced-motion handling, and existing route/data logic.
- Validate representative public, authenticated, modal, evidence, desktop, and mobile views.

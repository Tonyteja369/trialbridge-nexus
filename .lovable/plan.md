# Diagnosphere.X immersive redesign

## Goal
Rename TrialBridge to **Diagnosphere.X** and redesign the existing product around the selected Arctic Signal palette, Sora/Manrope typography, glass surfaces, and a full-width Three.js opening scene.

## What will change
- Replace visible TrialBridge naming and page metadata with Diagnosphere.X while preserving the existing clinical workflow and safety language.
- Build a performant interactive Three.js diagnostic sphere for the public opening, inspired by the uploaded dotted-globe reference without embedding the reference image.
- Recompose the public page into full-width sections with crisp hierarchy, medical-research content, subtle grid texture, glass information panels, and restrained scroll/hover transitions.
- Carry the same visual system into sign-in and the authenticated workspace: navigation, key summaries, forms, tables, status indicators, and empty/loading states.
- Keep all existing studies, screening, consent, allocation, task, audit, and account behavior intact.

## Visual system
- Palette: `#0DB8D3`, `#1B7FDC`, `#065B98`, `#193546`, translated into semantic light/dark tokens with accessible foregrounds.
- Type: Sora for headings and Manrope for interface/body copy.
- Surfaces: translucent glass with fine borders and controlled blur; no decorative card nesting.
- Motion: slow sphere rotation and pointer response, soft section reveals, precise control feedback, and reduced-motion support.

## Technical details
- Add React Three Fiber, Drei, Three.js, and Three.js types for the client-rendered scene.
- Isolate WebGL from server rendering and provide a stable visual fallback.
- Build the sphere procedurally from instanced points for low draw-call cost and cap rendering resolution for mobile performance.
- Use semantic design tokens in the global stylesheet rather than hardcoded component colors.
- Verify the public page, sign-in page, and authenticated dashboard at desktop and mobile sizes; check rendering, interaction, console output, and production compilation.

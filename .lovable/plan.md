# ClinQSphereX premium biomedical liquid interface

## Goal
Transform the existing ClinQSphereX website into an original, immersive violet-and-white biomedical interface while preserving every live workflow, data source, safety statement, and human-review control.

## What will change
- Rebuild the public opening as a cinematic full-width research environment with a slow procedural 3D DNA helix, restrained particles, readable content overlays, and clear Platform/Research actions.
- Introduce a selective liquid-glass system for navigation, key research panels, authentication, visualization controls, and floating data labels—not every section.
- Recompose the disease-first homepage into the requested research narrative, keeping heart and cardiovascular research as the flagship example.
- Add a premium biomedical media display using a locally bundled generated visual/poster rather than unrelated stock footage; motion will come from layered WebGL and interface animation without blocking page load.
- Build an original cardiovascular research centerpiece with a scientifically inspired, non-graphic heart visualization and surrounding evidence/review panels.
- Carry the visual system into sign-in, the authenticated workspace, candidate review, and Quantum Lab without changing their data or actions.
- Update public navigation and footer, including the requested creator credits and research-prototype disclosure.

## Scientific and UX safeguards
- Keep live ClinicalTrials.gov results, real stored workspace data, and synthetic examples visibly distinguished.
- Show unavailable model/benchmark values as “Not evaluated” or “Not available”; never invent performance or quantum advantage.
- Preserve PASS / NOT MATCHED / UNKNOWN semantics and make researcher responsibility visually prominent.
- Keep external research scale statements qualitative unless the page has a verified source, date, data type, and access status.
- Maintain keyboard focus, contrast, readable type, semantic headings, loading/error/empty states, and screen-reader labels.

## Technical details
- Use React Three Fiber/Three.js for an optimized procedural DNA scene with capped pixel ratio, deterministic geometry, low draw calls, device-aware particle counts, and reduced-motion behavior.
- Keep WebGL client-safe with a stable CSS/image fallback so unsupported devices still receive a complete page.
- Use semantic violet/white tokens in the global stylesheet and physically restrained translucency, blur, inner highlights, and shadows.
- Use CSS intersection-based reveals and limited pointer parallax; avoid heavy post-processing, cursor trails, and excessive animation.
- Keep the current TanStack Start and Lovable Cloud architecture unchanged.
- Verify public, auth, dashboard, candidate, and Quantum Lab pages at desktop and mobile sizes, including WebGL visibility, navigation, interactions, console output, and production compilation.

# Repository Structure Guide

## Current Layout

- `README.md` — PRD and product blueprint
- `DESIGN.md` — semantic design system guidance
- `web/` — active React frontend implementation
- `backend/` — API and service layer (in progress)
- `scripts/` — utility scripts
- `_bmad/` — BMAD workflows and configs
- `_bmad-output/` — generated BMAD artifacts
- `docs/` — implementation and planning docs

## Conventions

1. Keep generated artifacts out of source control:
   - `node_modules/`
   - `dist/`
   - cache/temp/log folders

2. Keep product decisions in docs:
   - feature strategy in `docs/FEATURES_AND_DIFFERENTIATORS.md`
   - design rules in `DESIGN.md`

3. Keep app code inside bounded areas:
   - `web/src/components/` for reusable UI
   - `web/src/pages/` for route-level views
   - `web/src/api.js` for backend communication layer

## Next Refactor Target

- Introduce feature modules in web:
  - `web/src/features/chat/`
  - `web/src/features/fact-check/`
  - `web/src/features/timeline/`
  - etc.

This keeps implementation scalable as the repo grows toward mobile and multi-surface parity.

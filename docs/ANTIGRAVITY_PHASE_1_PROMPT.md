# Borewell Sentinel — Antigravity Phase 1 Prompt

Open the `BOREWELL_SENTINEL` workspace. Read the repository README and `docs/BUILD_PLAN.md` first.

The repository already contains a software-only visual prototype scaffold. Your job is to turn it into the first polished competition-quality build without replacing the architecture.

## Immediate goals

1. Install dependencies.
2. Run TypeScript typecheck.
3. Run the Next.js app.
4. Open `http://localhost:3000` in the browser.
5. Verify the Command Center visually.
6. Fix runtime, TypeScript, and layout errors.
7. Preserve the existing visual direction from `public/reference/ui_reference_1.png` and `ui_reference_2.png`.

## Visual requirements

The home screen must feel like a groundwater operations command center, not a generic SaaS dashboard.

Keep:
- dark navy / near-black background
- teal/cyan accents
- green normal status
- amber sensor anomaly
- red groundwater anomaly
- purple uncertain
- thin borders
- restrained glow
- compact scientific typography
- strong information hierarchy

The center 3D view is the hero element.

## 3D twin requirements

Use the existing procedural React Three Fiber scene as the starting point.

Do not replace the procedural geometry with static images.

The scene must visually communicate:
- surface terrain
- subsurface layer
- aquifer/water layer
- borewell casing
- water column
- sensor head
- status ring
- anomaly pulse
- selected well
- labels
- groundwater flow lines

Interaction:
- orbit
- zoom
- pan
- click a borewell
- selected well becomes visually emphasized
- right panel updates

## Demo behavior

Use deterministic mock data. Do NOT use Math.random for core demo state.

We need at least these scenarios:

A. NORMAL NETWORK
All major wells stable.

B. SENSOR ANOMALY
BW-04 produces an isolated spike; neighboring wells remain stable. Classification should be sensor anomaly.

C. GROUNDWATER ANOMALY
BW-05 and nearby wells decline persistently. Classification should be groundwater anomaly.

D. UNCERTAIN
BW-12 has insufficient spatial or sensor evidence.

## UI requirements

Keep these sections:
- header
- left navigation
- KPI strip
- 3D twin
- recent alerts
- selected borewell detail
- water-level trend
- rainfall vs groundwater
- anomaly classification
- Raw -> Trusted -> Intelligence pipeline
- quick actions

Make all sections visually consistent.

## Quality bar

At 1920x1080:
- no major clipping
- balanced whitespace
- 3D scene should dominate the viewport
- panels aligned
- readable type

At 1280x800:
- no critical overlap
- center scene remains usable
- sidebar can compact gracefully

## Engineering rules

- Keep TypeScript strict.
- Avoid `any`.
- Keep domain data under `lib/`.
- Keep visual components reusable.
- Do not add a backend yet.
- Do not add MQTT yet.
- Do not build ML yet.
- Do not claim scientific validation.

## Verification

After changes:
1. run `npm run typecheck`
2. run `npm run build`
3. run dev server
4. open browser
5. inspect console for red errors
6. click several borewells
7. verify the right panel changes
8. verify anomaly colors
9. rotate/zoom the 3D twin
10. capture a screenshot for the project review

Create `docs/PHASE_1_REPORT.md` with:
- files changed
- issues found
- fixes
- typecheck result
- build result
- browser verification result
- remaining limitations

Then stop and report:

PHASE 1 COMPLETE — AWAITING REVIEW

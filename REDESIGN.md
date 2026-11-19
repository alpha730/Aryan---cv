# Painted redesign: handoff notes

The site keeps its Lord of the Rings "Red Book" map theme, layout, sections and animations.
Only the pictures changed: the ink sketches and CSS-drawn objects were replaced with smooth,
painterly images that look realistic. Theme is NOT Game of Thrones (that is only the GitHub profile).

## What changed

| Area | Before | After | Files |
|---|---|---|---|
| Map places (7 stops) | inline SVG ink sketches | painted vignettes, 130x130 map units by default, set a little above each stop; `Painted` takes optional `size`, `dx`, `dy` (map units). Eregion uses `dx={24} dy={12}`, Moria `size={110} dx={10}` | `src/map/landmarks.tsx`, `public/landmarks/*.webp` |
| Ring mark (header + footer) | SVG circle in `currentColor` | painted gold ring `<img>` | `src/components/icons.tsx`, `.ring-mark` in `src/styles.css`, `public/relics/ring.webp` |
| Palantír card | CSS gradient orb + stand | painted glass orb + carved stone stand; swirl animation kept (opacity 0.55), `.orb-shine` hidden | `src/styles.css` (`.orb`, `.orb-swirl`, `.orb-shine`, `.orb-stand`), `public/relics/palantir*.webp` |
| Voice agent card | waveform only | painted Horn of Gondor above the waveform (wave height 110px -> 70px) | `src/sections/Projects.tsx`, `.art-voice .horn` in `src/styles.css`, `public/relics/horn.webp` |
| Thrór's Map card | CSS gradient sheet | painted parchment with torn edges; moon, runes and scan overlays kept | `src/styles.css` (`.map-sheet`), `public/relics/thror-map.webp` |
| `.gitignore` | | adds `.preview-build` | |

Notes:
- `landmarks.tsx` keeps the old sketch components. `const SKETCH = false` switches between painted and ink.
- `Painted` props: `size` (default 130) sets the picture's width and height, `dx`/`dy` (default 0) shift it from the stop. The vertical offset scales with `size`, so a smaller picture keeps the same placement above its stop.
- Why Eregion and Moria are adjusted: the two stops are close, and the road reaches Eregion (marker III, at its door 1790,762) between them. At 130 units the Moria painting covered marker III, so III read as part of Moria. Eregion is nudged towards its marker (dx 24, dy 12) and Moria is made smaller and moved east (size 110, dx 10). Marker III now sits at the edge of the Eregion forge, and marker IV still sits just under the Moria gate.
- Image URLs in TSX use `import.meta.env.BASE_URL`; CSS uses `/relics/...` (Vite rewrites it for the base).
- The Ring mark no longer takes the realm colour (`.brand svg { color }` no longer applies). This is intended.

## The pictures

All images were painted in code (Python, numpy, scipy, Pillow), not AI-generated, because the
Higgsfield account had no credits. Scripts are in `tools/paint/`:

- `paint.py`: shared toolkit (noise, masks, volume shading, brush strokes, Kuwahara painterly filter, soft vignette, sepia grade)
- one script per place: `bagend.py`, `rivendell.py`, `eregion.py`, `moria.py`, `edoras.py`, `minastirith.py`, `havens.py`. Run `python bagend.py out.png` (640x640 RGBA), then convert to WebP.
- `relics.py OUTDIR`: writes palantir, palantir-stand, thror-map, horn and ring (`.webp` + `.png`).

To swap in photo-real art later (e.g. Higgsfield), keep the same file names, sizes and transparent soft edges, and no code changes are needed.

## Checks already done

- `tsc --noEmit` and `vite build` pass.
- Visually checked in headless Chrome at 1440x900 and 390x844: the map overview, every chapter close-up, all three project cards, and the Ring in the header and footer. No console errors; all 12 images return 200; the swirl, runes, scan and waveform animations run.
- `.preview-build/` deleted.
- Not yet checked: Safari/Firefox, a real phone, Lighthouse.

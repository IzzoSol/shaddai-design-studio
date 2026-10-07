---
name: mascot-character
description: Design or redesign a brand mascot/character (e.g. Asimov the cat) as layered SVG with poses, animation hooks and a character sheet, then place it across a site and film. Use when the user says a character, mascot, robot or animal "looks basic" or "needs to be better designed", or wants a mascot everywhere.
---

# Mascot character (TURTLE character sheet)

Reference: `kits/cinematic-site/cat.js` (Asimov: tabby-and-white, green eyes, red collar with a gold "A" tag) and `tools/cat-sheet.html`.

## 1. Reference → spec (write it down first)
- Pull the defining traits from the user's references, e.g. "I, Robot cat: mackerel tabby, white blaze running into a white muzzle and bib, green eyes, red collar with a round tag".
- Palette as tokens (`C = { fur, furL, furD, stripe, white, whiteS, pink, nose, collar, tag, eye, eyeD, ink }`). Write the silhouette rule: **realistic proportions beat chibi**. Head ≈ 1/3 of sitting height, narrow shoulders, wide haunches.

## 2. Build quality in SVG (what made the redesign land)
- Gradients for volume: radial fur gradient (light crown → dark edges), a horizontal body gradient (dark flanks, light centre) and a vertical white gradient.
- Markings as **tapered filled paths** (not stroked lines), clipped to the body silhouette with a `clipPath`.
- Eyes: almond paths, an iris gradient, a slit pupil, upper-lid shadow and two catchlights. Blink lids are rects **inside a clipPath of the eye**.
- Ink outline 2.4–2.6 px, round joins. Fine whiskers at 0.9 opacity. A small highlight on the nose and the tag.
- Keep each pose's viewBox stable (peek 200×160, sit 200×300, walk 170×110) so layouts don't shift when the art improves.

## 3. Animation hooks (keep these names; site, intro and film depend on them)
`.cat-pupil` (follows the cursor) · `.cat-lid` (blink height 0 → 36) · `.cat-tail` (sit swish) · `.cat-leg f1 f2 b1 b2` (walk cycle, `transform-origin` set per leg) · `.cat-tail-w` · `window.CatArt.svg(pose, idPrefix)` for canvas/intro use. Give every instance a unique id prefix, because gradients and clipPaths are id-scoped.

## 4. Check, then place
- Open `tools/cat-sheet.html` (all poses plus a small size) and screenshot it. Fix anatomy before placement.
- Then check it in context: covers, case-file photo, walker, intro. Re-check overlaps (e.g. the cover halo moved up when the head shrank).
- In a canvas film, rasterise with `new Image()` from `data:image/svg+xml` (add `xmlns`) and preload before the first frame.
- Lore claims about the mascot go through **lore-fact-check** ("reportedly named Asimov").

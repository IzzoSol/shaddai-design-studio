---
name: hyperframes-film
description: Make an original animated cinematic mini movie or trailer (1080p MP4 with a synthesized score) from HTML, canvas and three.js using HyperFrames — script with QUILL, 3D story scenes, 2D chapter painters, inserted chapters, sound, render and delivery. Use when the user asks for a cinematic movie, trailer, explainer film or "our own animated version" of a scene.
---

# HyperFrames film (the "Nine Lives" pipeline)

Template: `kits/hyperframes-film/` (copy `vendor/` and `fonts/` in from `kits/cinematic-site/`). Tool: `npx --yes hyperframes@0.8.140` (`lint`, `snapshot --at`, `render`).

## 1. Script (QUILL), one table
`| time | beat | what we see | sound |` plus a logline, a through-line (e.g. "the cat is the witness") and a **sources** paragraph. Every factual beat goes through **lore-fact-check** first.

## 2. Composition rules
- One root `<div id="root" data-composition-id=… data-duration=… data-fps="30" data-width="1920" data-height="1080">`.
- Two full-frame canvases: `#gl` (three.js) under `#c2d` (2D painters). Supers and subtitles go in `<section class="clip" data-start data-duration data-track-index>`.
- One paused GSAP timeline registered as `window.__timelines['<id>']`, with a silent carrier tween spanning the whole film so `onUpdate` fires on every seek. Also listen to `hf-seek` and render from `e.detail.time`.
- **Deterministic frames only**: time comes from the seek, randomness from seeded `rng(seed + frameIndex)`, and nothing uses `Date.now()` or `Math.random()`.
- 3D: `world3d.js` exposes `active(t)` / `render(t)` with a `CUT` table of shot times. 2D painters take local time `lt` (see `assets/scenes2d.js`, `assets/catlore.js`).

## 3. Adding chapters without breaking sync
Don't hand-shift times. Insert chapters with a remap: `INS = [[atOldTime, length, [[painter, dur], …]], …]`. `render(T)` walks the inserts and draws the chapter or `renderV2(T - offset)`. Shift HTML clips and GSAP positions with one script: `new = old + Σ len(inserts at ≤ old)`. The carrier tween stays at 0.

## 4. Sound
- Score is synthesized in numpy (`score2.py`): pads, hits, ticks, siren, heartbeat, purr, chime, with ducking under dialogue. `score3.py` splices new cues in at the same insert points with **30 ms fades and no dropped samples** (crossfading by overlapping drifted later audio by 0.4 s).
- Licensed or user-supplied dialogue: cut a short excerpt with ffmpeg, keep the file **git-ignored**, credit it on screen and in the end card, and get the user's explicit OK on the risk.

## 5. Check, then render
- `lint` → 0 errors. Then `snapshot --no-end --timeout 15000 --at t1,t2,…` at every new beat, and read the contact sheet. Fix framing (camera inside walls, the back of a head, cropped heads, floating characters, captions over labels).
- Render ≈ 60 frames/min in this container (184 s ≈ 90 min). Run it in the background, and don't run heavy browser checks at the same time.
- Ship: `ffprobe` the duration, check audio levels around the dialogue, then compress with `ffmpeg -crf 28` to under 30 MB and send it. Stop an outdated render instead of finishing it.

## Rules
Original animation only: homages, never copied footage frames. Fictional disasters are labeled fictional in the end card ("R-7 and the Meridian Collider are fictional"). Add "not affiliated with …" for every brand shown.

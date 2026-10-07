---
name: cinematic-site
description: Build a polished, cinematic static website (token launch, brand, fandom, product) fast — a themed design system, three.js 3D hero, a cinematic intro, scroll motion, swivel carousels, a mascot, verification and Render deploy. Use when asked for a "dynamic", "cinematic", "3D", "magazine/retro-styled" or "amazing" website, or to start a new site from the SHADDAI kit.
---

# Cinematic static site (the $ASIMOV playbook)

Reference build: `IzzoSol/asimov-site` (private). Engine code to start from: `kits/cinematic-site/` in this repo.
Agents: QUILL writes, TURTLE designs, NEXUS architects, ORACLE researches, PIKADON gates compliance.

## Step 0 — brief (≤10 minutes, don't skip)
1. Restate the subject in one line and **confirm it**. (We lost a round building the wrong subject: "It's not about SHADDAI, it's about $ASIMOV.")
2. Collect the reference images. Name the aesthetic in words (e.g. "1950s–90s pulp sci‑fi magazine, Asimov's Science Fiction masthead, robot paperbacks").
3. Ask for, or leave config slots for: contract address, socials, affiliate tags, mascot name/lore. Never invent them.
4. QUILL writes `MASTER-PROMPT.md`: audience, sections, voice, truth rules, CTA. That's the build's spec.

## Step 1 — scaffold (copy the kit)
```
cp -r kits/cinematic-site/{vendor,fonts,*.js,pulp.css,render.yaml,tools} <new-site>/
```
- **No build step.** Plain HTML/CSS/JS, served static. Vendored three.js r128 UMD + addons, GSAP 3.12.5 + ScrollTrigger in `vendor/`. Self-hosted woff2 fonts (OFL) in `fonts/`.
- Script order matters: three + addons → robot3d.js → cover-paint.js → cat.js → shelf.js → intro.js → page script → three-scenes.js → hero3d.js → (scene).js → gsap → ScrollTrigger → motion.js.
- Theme = CSS tokens on `:root` (`--paper --ink --rust --gold`, display/cond/mono/serif font stacks). Swap tokens and fonts first; most of the look follows.

## Step 2 — sections (pick what fits; each is a reusable pattern in the kit)
| Pattern | File | Notes |
|---|---|---|
| Newsstand bar + live ticker | page script | DexScreener API; hide empty fields |
| Cover hero with a live 3D character | hero3d.js + robot3d.js | PBR, PMREM RoomEnvironment, bloom; rendered still (`tools/render-cover.html`) as the fallback `img.art` |
| Cinematic intro (~11 s, skippable) | intro.js | sessionStorage "seen" flag, a replay link, `?introT=` freeze for screenshots |
| Pair / orbit coins | three-scenes.js PairOrbit | `loopWhileVisible()` renders only on screen |
| Issue grid → contents dialog | page script `CAST` + `coverHTML()` | procedural covers via cover-paint.js; mascot as each cover's focal point |
| 3D turntable shelf | shelf.js `Swivel()` | see the **swivel-shelf** skill |
| 3D world scene | foundation3d.js | nebula shader sky, InstancedMesh greebles, scroll-driven camera |
| Parody/laws sheet, marquees, buy card, footer | page + pulp.css | stamp/slot animations in motion.js |
| Mascot everywhere | cat.js | see the **mascot-character** skill |

## Step 3 — motion rules (each one cost us a bug)
- Use `gsap.fromTo()`, **never `gsap.from()`**, with ScrollTrigger (a refresh can record the hidden state as the end state).
- `gsap.ticker.lagSmoothing(0)`, or reveals freeze under slow frames.
- Don't mix CSS transitions with GSAP on the same property. Use `clearProps` after tossing cards that have CSS rotations.
- `html,body{overflow-x:clip}`: entrance animations otherwise cause horizontal scroll on mobile.
- `ScrollTrigger.refresh()` on load, on `document.fonts.ready` and once at 1.5 s.
- Respect `prefers-reduced-motion`; every WebGL piece needs a CSS/image fallback (`hasGL()` check).
- Prefix intro classes (`cine-*`): a generic `.intro` collided with another section.
- Don't name globals `top`, `name`, `status` in classic scripts (`var top` collides with `window.top`).

## Step 4 — art direction (TURTLE)
- Users reject "basic". Escalate fast: flat SVG → layered gradients + rim light → real 3D (PBR) → rendered still. Show a screenshot every round.
- Copyrighted covers/paintings/film frames: **never rehost**. Make homages in code, credit the artist, and link to buy or see the original. Real book covers: hotlink from Open Library / Google Books in the visitor's browser.
- Use one mascot across hero, sections, cursor-following eyes and a scroll walker. It's the cheapest way to make a site feel alive.

## Step 5 — verify before every push
- Playwright with `executablePath:'/opt/pw-browsers/chromium'`, args `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader`. Use `waitUntil:'domcontentloaded'` (external requests can hang `load`) and abort third-party hosts.
- Shoot desktop (1360×900) and mobile (390×844) per section. Assert `document.documentElement.scrollWidth - innerWidth === 0`, and that `pageerror` is empty.
- A Read of the screenshot is the review. Fix what you see, then re-shoot.

## Step 6 — ship
- Private GitHub repo → Render **Blueprint** (`render.yaml`: static, publish `.`), connect the repo and Apply. Push = deploy.
- claude.ai artifact preview blocks self-hosted fonts and external images: run `tools/build-preview.py` (inlines fonts as data URIs) before publishing a preview, and tell the user the live site loads real covers.
- README: launch checklist (config block, affiliate tag + disclosure), site map, how to rebuild assets.

## Pairs with
`swivel-shelf`, `mascot-character`, `hyperframes-film` (the trailer/mini movie), `lore-fact-check`, `token-launch-site`. Workflow: `cinematic-token-site` in `workflows/workflows.json`.

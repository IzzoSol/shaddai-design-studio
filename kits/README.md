# Kits

Working code from the $ASIMOV build (`IzzoSol/asimov-site`), ready to copy into a new project. See the matching skills in `.claude/skills/`.

- `cinematic-site/`: `vendor/` (three.js r128 + addons, GSAP 3.12.5 + ScrollTrigger), `fonts/` (OFL woff2), `shelf.js` (Swivel), `robot3d.js` (PBR robot), `hero3d.js`, `intro.js` (3D cinematic intro), `three-scenes.js` (PairOrbit + `loopWhileVisible`), `foundation3d.js` (3D world scene), `cover-paint.js` (procedural covers), `cat.js` (mascot), `motion.js` (GSAP rules), `pulp.css` (theme example), `render.yaml`, `tools/` (artifact preview builder, cover renderer, mascot character sheet).
- `hyperframes-film/`: `index.html` (composition + chapter remap), `world3d.js` (3D shots), `assets/scenes2d.js` + `assets/catlore.js` (2D painters), `score2.py` + `score3.py` (synth + splice), `SCRIPT.md` (example script table). Copy `vendor/` and `fonts/` from `cinematic-site/` into `assets/`, plus `robot3d.js` and `cat.js`. The dialogue excerpt is not included (licensed, git-ignored).

The Asimov-specific content (copy, lore, robot story) is an example: replace it, and keep the engines.

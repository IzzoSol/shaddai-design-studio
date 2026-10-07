# SHADDAI design studio (private)

One private home for design systems, creative workflows and the tools that audit them. Everything here is usable by SHADDAI; reference code from third-party UI libraries is **not** copied in (see `sh-ui/README.md` for sources).

```
sh-ui/          vanilla design system for the dashboard (buttons, tabs, fields, cards, empty states, tables, dialogs)
tools/          dash-visual-lint.js — walks every dashboard view and reports visual problems as JSON
site/           $ASIMOV SCIENCE FINANCE: pulp-magazine token site + slide deck (static, no build)
workflows/      scenario playbooks as data (workflows.json): UGC ads, game pitch + trailer, long video to shorts,
                cinematic token site, cinematic mini film
kits/           working engine code to start new builds from (cinematic-site, hyperframes-film)
.claude/skills/ Claude Code skills: the playbooks and gotchas from the $ASIMOV build
```

## Build the next site 10× faster
Attach this repo to the session, then say e.g. *"use the cinematic-site skill to build …"*. The skills load automatically from `.claude/skills/`:

| Skill | For |
|---|---|
| `cinematic-site` | the end-to-end site playbook: brief → kit → sections → motion rules → verify → Render |
| `token-launch-site` | token config, live price, how-to-buy, disclaimers, launch checklist |
| `swivel-shelf` | 3D turntable of books/art with real covers and buy/affiliate links |
| `mascot-character` | TURTLE character sheet: layered SVG mascot with poses and animation hooks |
| `hyperframes-film` | original animated mini movie: script → 3D/2D scenes → score → render |
| `lore-fact-check` | verify, hedge or cut every fact, credit and statistic |

Kits: `kits/cinematic-site/` (vendored three.js + GSAP, fonts, shelf/robot/cat/cover-paint/motion/intro engines, preview + cover render tools, render.yaml) and `kits/hyperframes-film/` (composition, 3D world, 2D painters, chapter remap, score synth + splice). The canonical example is the private repo `IzzoSol/asimov-site`; `site/` here is an early snapshot.

## Workflows
`workflows/workflows.json` is the single source of truth. Each workflow lists inputs, agent + tool steps, a quality gate, a compliance checklist and expected outputs. The same file can be:
- rendered as a guide or checklist (QUILL),
- exposed as an MCP tool (`run_workflow(id, inputs)`) next to the existing SHADDAI MCP tools,
- packaged and sold as a pack once reviewed.

Existing pieces these chain together: dashboard Media Studio (image / video / voice / writer), Shaddai-Clipper-Feature- (local Whisper + ffmpeg), turtle-music-bot and FL-STUDIO-AI (music + MCP), shaddai-gamedev-tools (game dev), ai-influencer (fictional cast; rules: no real likeness, non-explicit, AI-disclosed).

## Rules baked into every workflow
- AI-generated people and voices are disclosed where required.
- No invented testimonials, reviews, results or player counts.
- No real person's likeness or voice without written permission.
- Only clip and publish content you own or have rights to.

## Status
v0.1: design system + lint + three workflows. Next: wire `run_workflow` into the SHADDAI MCP server, add scenario packs (launch kit, creator media kit, game update post), version each pack.

## Site (`site/`)
Static, no build step. Open `site/index.html` or `site/slides.html` in a browser, or serve the folder.
- `MASTER-PROMPT.md`: the brief QUILL wrote via `shaddai-mcp run_agent`, with the site's truth rules.
- **Launch config:** fill the `TOKEN` block at the top of the script in `index.html` (contract address, X, Telegram, DexScreener). Empty fields stay hidden; the CA copy button and Jupiter link switch on once `ca` is set.
- Live prices: DexScreener public API for $ASIMOV (once `ca` is set) and NVDAx.
- `cover-paint.js`: procedural painted covers (8 seeded canvas scenes), shared by site and deck; `paintTo()` paints offscreen WebGL textures.
- `three-scenes.js` (three.js r128 from cdnjs): a 3D bookshelf turntable (real cover, spine and page-edge faces, drag with inertia, click a book to bring it forward) and the $ASIMOV/NVDAx coin orbit with swap particles. Renders only while on screen; respects reduced motion; without WebGL the CSS versions stay.
- **Read the originals** swivel: 16 Isaac Asimov books. Covers load live from Open Library's covers API in the visitor's browser (nothing rehosted); each book links to Bookshop.org, Amazon and Open Library. To earn on referrals, set `AFFILIATE.amazonTag` in `index.html` and add a disclosure line.

# SHADDAI SCIENCE FICTION — master prompt (QUILL)

Written by QUILL via `shaddai-mcp run_agent` (kb_quill: "writing is thinking — every word earns its place"),
with TURTLE (kb_turtle: Picasso — show the subject from many viewpoints at once, fearlessly) and
NEXUS (kb_nexus: the agent loop — observe, think, act, then verify by looking at the result).

## The brief
Build the SHADDAI site as if it were an issue of a 1990s digest science-fiction magazine and a shelf of
1950s–80s robot paperbacks. The reader should feel they picked a magazine off a newsstand, not opened a SaaS page.

## Look (TURTLE)
- **Masthead:** huge condensed italic wordmark with a hard offset shadow, a new ink colour every issue
  (red, gold, blue, violet, teal). Under it, "SCIENCE FICTION" letterspaced, with the S and F picked out in red.
- **Paper:** warm newsprint (#f1dcbc), grain, faint foxing at the edges. Ink is warm black, rust red (#a5302a)
  and a cobalt blue. No pure white, no gradients-on-white, no glassmorphism.
- **Covers:** painted skies, ringed planets, chrome robots, lone figures. Generated on canvas so every load
  repaints slightly differently. Halftone dot screen and a price box + barcode on every cover.
- **Type:** Anton (masthead/cover lines), Oswald (cover-line subheads), Libre Caslon Text italic (editorial copy,
  the "Laws" sheet), Courier Prime (fine print, issue data).
- **The collage:** one spread shows all seven agent issues laid out on a carpet like a collector's haul,
  slightly rotated, overlapping. Hover lifts an issue off the pile.

## Voice (QUILL)
- Cover lines are the copy: short, punchy, agent name + a story title ("NEXUS — Cold Iron Architecture").
- Wry, never smug. The parody "Laws of Robotics" sheet is the humour beat — every joke is also a true product fact.
- No invented testimonials, reviews, user counts or results. Real numbers only: 7 agents, 85 KB docs,
  5 MCP tools, 9 AURA tools, 199/199 tests, 82% tool-schema tokens cut, 0 dependencies, no API keys.

## Motion (TURTLE + NEXUS)
- One orchestrated moment: the hero cover "prints" in — masthead slams down, cover lines stamp in one by one,
  the painted art drifts with the pointer (parallax layers).
- Scroll reveals start from a visible state (never stuck at opacity 0). Paperbacks fan out on hover.
- The slide deck turns like magazine pages. Everything respects `prefers-reduced-motion`.

## Build (NEXUS)
- Static, no build step, no framework: `site/index.html` + `site/slides.html`, inline CSS/JS, Google Fonts only.
- Works at 400px wide with a 16px gutter; keyboard focus visible; slides drive by ← → / swipe.
- Verify by screenshot at desktop + phone before shipping (observe → think → act → check).

## Sections
1. **Cover** — this month's issue (hero).
2. **The collection** — 7 agent issues, click one for its contents page.
3. **SHADDAI's Laws of Robotics** — parody sheet, true facts.
4. **The Robot Series** — 8 paperbacks = the product line (MCP, AURA, design studio, workflows).
5. **Subscription card** — the one-line installs, tear-off style, copy buttons.
6. **Next issue** — what ships next (roadmap), and a link to the slide deck.

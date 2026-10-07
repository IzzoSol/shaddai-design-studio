---
name: token-launch-site
description: Token/meme-coin launch specifics for a site — config block, live price ticker, contract-address copy, how-to-buy steps, pair story, disclaimers and launch checklist. Use with cinematic-site when the site is for a crypto token (Solana, StonkFun, pump-style launches, tokenized-stock pairs).
---

# Token launch site

## Config, never invented
```js
var TOKEN = { ca: '', x: '', telegram: '', dexscreener: '', stonkfun: '' }; // empty = hidden
var AFFILIATE = { amazonTag: '' };
```
Empty fields hide their UI. Setting `ca` switches on the copy button, the Jupiter link and the live price.

## Pieces
- **Live ticker:** DexScreener public API (`/latest/dex/tokens/<mint>`), for the token and its pair asset (e.g. NVDAx, Backed's tokenized NVIDIA, mint in `NVDAX_MINT`). Fail quietly to "price unavailable".
- **How to buy** card: wallet → fund with SOL → copy CA (check it twice) → swap (StonkFun / Jupiter).
- **Pair story:** two orbiting coins with swap particles (`three-scenes.js` PairOrbit). "Science fiction × science fact" framing.
- **Lore** sells: mascot + history (see mascot-character, lore-fact-check).

## Disclaimers (PIKADON gate)
- Not financial advice. Meme token, no promise of value.
- Not affiliated with the brands, studios or estates shown.
- Tokenized stocks: note availability limits (e.g. NVDAx not for US persons) if you mention them.
- No fake holders counts, volume, testimonials or "partnerships".

## Launch checklist
CA filled · socials filled · DexScreener link · affiliate tag + disclosure · README updated · Render deployed from the private repo · mobile check.

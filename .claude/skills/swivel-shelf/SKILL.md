---
name: swivel-shelf
description: Add a 3D turntable "swivel" carousel of books, covers or framed paintings with real covers, buy/affiliate links and credits (three.js, drag with inertia, CSS fallback). Use when a site needs a shelf of books, products, artworks or albums people can spin and click through.
---

# Swivel shelf

Code: `kits/cinematic-site/shelf.js` → `window.Swivel({...})`. Painted fallback faces come from `cover-paint.js`.

## Use
```html
<div class="swivel" id="swivel" tabindex="0" role="region" aria-roledescription="carousel" aria-label="… Use the arrow keys to turn."></div>
<div class="plate" id="plate"><button class="spin spin-prev">‹</button>
  <div class="info" aria-live="polite"><h3 class="ob-title"></h3><p class="meta ob-meta"></p><div class="buy ob-buy"></div></div>
  <button class="spin spin-next">›</button></div>
```
```js
Swivel({ host: '#swivel', plate: '#plate', kind: 'book' /* or 'canvas' for gilt-framed paintings */,
  items: [{ title, meta, author, scene, sky, accent, seed, cover: 'openlibrary', links: [{label, href}] }],
  rim, disc, trim, trimGlow });
```
- `kind:'book'` draws spine and page edges; `kind:'canvas'` draws gilt frames. Drag with inertia, raycast click to bring an item forward, idle turn, arrow keys. A CSS ring is the fallback without WebGL.
- Several shelves per page are fine (we ran three: originals, Foundation novels, painters).

## Real covers (legal and reliable)
- Look up covers in the **visitor's browser**: Open Library search, pick the doc with a `cover_i` and the most `edition_count`. Fall back to Google Books `imageLinks.thumbnail` (https, `zoom=1|2`). Cache hits in localStorage and **never cache a network failure**.
- Hotlink only, never rehost. Showing a cover to point people at the book is standard retail/library practice.
- WebGL textures need `crossOrigin='anonymous'`. If a host doesn't send CORS, the painted face stays. That's fine.

## Links that give back
- Every item: Bookshop.org (supports indie stores), Amazon (affiliate: `AFFILIATE.amazonTag`, plus a disclosure line once it's set) and Open Library (free to borrow).
- Art shelf: our homage painted in code + "see the original" link + the artist's credit. Unknown artist → ask the user. Never guess a credit.

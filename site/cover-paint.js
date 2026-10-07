/* cover-paint.js — paints pulp sci-fi cover art onto <canvas data-scene="..."> elements.
   No dependencies. Seeded, so a cover looks the same each load unless the seed changes.
   Scenes: planet, robot, city, nebula, portal, sun, sketch, split.
   Attributes: data-scene, data-seed, data-sky="#top,#mid,#low", data-accent="#hex". */
(function () {
  'use strict';

  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }

  function sky(ctx, w, h, stops) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    stops.forEach(function (c, i) { g.addColorStop(i / (stops.length - 1), c); });
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }

  // Many soft translucent dabs read as brushwork instead of a flat vector fill.
  function dabs(ctx, r, x, y, rw, rh, color, n, size) {
    ctx.save(); ctx.fillStyle = color;
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.04 + r() * 0.08;
      ctx.beginPath();
      ctx.ellipse(x + (r() - 0.5) * rw, y + (r() - 0.5) * rh, size * (0.4 + r()), size * (0.2 + r() * 0.5), r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function stars(ctx, r, w, h, n, maxY) {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const s = r() * 1.6 + 0.3;
      ctx.globalAlpha = 0.3 + r() * 0.7; ctx.fillStyle = r() > 0.85 ? '#ffe9b0' : '#ffffff';
      ctx.fillRect(r() * w, r() * h * maxY, s, s);
    }
    ctx.restore();
  }

  function planet(ctx, x, y, rad, base, light, ring) {
    const g = ctx.createRadialGradient(x - rad * 0.4, y - rad * 0.4, rad * 0.1, x, y, rad);
    g.addColorStop(0, light); g.addColorStop(0.55, base); g.addColorStop(1, '#0b0710');
    if (ring) { ctx.save(); ctx.strokeStyle = ring; ctx.globalAlpha = 0.55; ctx.lineWidth = rad * 0.09;
      ctx.beginPath(); ctx.ellipse(x, y, rad * 1.9, rad * 0.42, -0.35, Math.PI, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.globalAlpha = 0.18; ctx.strokeStyle = light; ctx.lineWidth = rad * 0.05;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(x, y + i * rad * 0.28, rad * 0.95, rad * 0.08, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
    if (ring) { ctx.save(); ctx.strokeStyle = ring; ctx.globalAlpha = 0.75; ctx.lineWidth = rad * 0.09;
      ctx.beginPath(); ctx.ellipse(x, y, rad * 1.9, rad * 0.42, -0.35, 0, Math.PI); ctx.stroke(); ctx.restore(); }
  }

  function ridge(ctx, r, w, h, y0, amp, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h);
    let y = y0;
    for (let x = 0; x <= w + 10; x += w / 18) { y = y0 + (r() - 0.5) * amp; ctx.lineTo(x, y); }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }

  // Chrome robot built from rounded blocks: head, visor eyes, torso, limbs.
  function robot(ctx, cx, base, H, body, eye, pose) {
    const u = H / 10;
    function blk(x, y, w, h, rr) { ctx.beginPath(); ctx.roundRect(cx + x * u, base - y * u, w * u, h * u, (rr || 0.3) * u); ctx.fill(); }
    const g = ctx.createLinearGradient(cx - 2 * u, 0, cx + 2 * u, 0);
    g.addColorStop(0, body[0]); g.addColorStop(0.45, body[1]); g.addColorStop(1, body[2]);
    ctx.save(); ctx.fillStyle = g;
    if (pose === 'sit') {
      blk(-1.1, 6.2, 2.2, 3.0, 0.8);            // torso
      blk(-0.7, 7.6, 1.4, 1.3, 0.6);            // head
      blk(-1.6, 3.4, 3.4, 0.9, 0.4);            // thighs
      blk(1.2, 3.3, 0.7, 3.3, 0.35);            // shins
      blk(-1.5, 6.0, 0.6, 2.6, 0.3);            // arm
    } else {
      blk(-0.75, 10, 1.5, 1.6, 0.7);            // head
      blk(-0.3, 8.5, 0.6, 0.5, 0.1);            // neck
      blk(-1.5, 8.1, 3.0, 3.4, 0.6);            // torso
      blk(-1.1, 4.8, 2.2, 0.8, 0.3);            // hips
      blk(-2.15, 7.9, 0.6, 3.6, 0.3);           // arms
      blk(1.55, 7.9, 0.6, 3.6, 0.3);
      blk(-1.0, 4.1, 0.75, 4.1, 0.3);           // legs
      blk(0.25, 4.1, 0.75, 4.1, 0.3);
    }
    ctx.shadowColor = eye; ctx.shadowBlur = u * 1.2; ctx.fillStyle = eye;
    const ey = pose === 'sit' ? 7.1 : 9.2;
    blk(-0.45, ey, 0.3, 0.25, 0.12); blk(0.15, ey, 0.3, 0.25, 0.12);
    ctx.restore();
  }

  function figure(ctx, x, base, h, color) {
    ctx.save(); ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, base - h * 0.88, h * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - h * 0.13, base - h * 0.75); ctx.lineTo(x + h * 0.13, base - h * 0.75);
    ctx.lineTo(x + h * 0.08, base); ctx.lineTo(x - h * 0.08, base); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  const SCENES = {
    planet: function (c, r, w, h, p) {
      sky(c, w, h, p.sky); stars(c, r, w, h, 260, 0.7);
      dabs(c, r, w * 0.3, h * 0.35, w, h * 0.4, p.accent, 140, w * 0.12);
      planet(c, w * 0.66, h * 0.32, w * 0.24, p.accent, '#ffe7c2', '#f6d48a');
      planet(c, w * 0.18, h * 0.16, w * 0.05, '#7a6a8e', '#e8e0ff');
      ridge(c, r, w, h, h * 0.78, h * 0.08, '#24131c'); ridge(c, r, w, h, h * 0.88, h * 0.05, '#0e070b');
      figure(c, w * 0.3, h * 0.885, h * 0.07, '#0e070b');
    },
    robot: function (c, r, w, h, p) {
      sky(c, w, h, p.sky); dabs(c, r, w * 0.5, h * 0.45, w * 1.2, h * 0.8, '#000', 160, w * 0.18);
      c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(w * 0.5, h * 1.02, w * 0.9, h * 0.2, 0, 0, Math.PI * 2); c.fill(); c.restore();
      robot(c, w * 0.5, h * 0.93, h * 0.8, ['#050404', '#3a2a2a', '#0b0808'], p.eye || '#fff4d6');
    },
    city: function (c, r, w, h, p) {
      sky(c, w, h, p.sky); planet(c, w * 0.5, h * 0.55, w * 0.22, '#ffcf5a', '#fff6c8');
      dabs(c, r, w * 0.5, h * 0.3, w, h * 0.3, '#ff6a2a', 120, w * 0.14);
      c.fillStyle = '#2a0d10';
      for (let i = 0; i < 9; i++) { const x = r() * w, ht = h * (0.15 + r() * 0.3);
        c.fillRect(x, h * 0.72 - ht, w * 0.012, ht); c.beginPath(); c.ellipse(x + w * 0.006, h * 0.72 - ht, w * (0.03 + r() * 0.03), h * 0.012, 0, 0, Math.PI * 2); c.fill(); }
      for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(w * (0.15 + i * 0.24), h * 0.74, w * (0.06 + r() * 0.05), Math.PI, 0); c.fillStyle = '#e8d6ff'; c.globalAlpha = 0.6; c.fill(); c.globalAlpha = 1; }
      ridge(c, r, w, h, h * 0.76, h * 0.03, '#4a2a12'); ridge(c, r, w, h, h * 0.86, h * 0.02, '#1c0b06');
      robot(c, w * 0.66, h * 0.95, h * 0.32, ['#8a5a10', '#ffd66a', '#7a4a0a'], '#fff');
      figure(c, w * 0.42, h * 0.95, h * 0.2, '#1c0b06');
    },
    nebula: function (c, r, w, h, p) {
      sky(c, w, h, p.sky); stars(c, r, w, h, 320, 1);
      ['#ff4fa0', '#5ad6ff', p.accent].forEach(function (col, i) { dabs(c, r, w * (0.3 + i * 0.2), h * (0.35 + i * 0.12), w * 0.8, h * 0.4, col, 220, w * 0.16); });
      c.save(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.shadowColor = '#fff'; c.shadowBlur = 12;
      c.beginPath(); c.moveTo(w * 0.15, h * 0.75); c.lineTo(w * 0.62, h * 0.4); c.stroke(); c.restore();
      c.save(); c.translate(w * 0.62, h * 0.4); c.rotate(-0.65); c.fillStyle = '#d9dde6';
      c.beginPath(); c.moveTo(w * 0.07, 0); c.lineTo(-w * 0.03, -w * 0.025); c.lineTo(-w * 0.03, w * 0.025); c.closePath(); c.fill(); c.restore();
      planet(c, w * 0.8, h * 0.82, w * 0.12, '#3b5bb5', '#bfe3ff', '#a9c4ff');
    },
    portal: function (c, r, w, h, p) {
      sky(c, w, h, p.sky);
      const cx = w * 0.5, cy = h * 0.45, R = w * 0.38;
      c.save(); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
      sky(c, w, h, ['#02040c', '#0b1b3a', '#030712']); stars(c, r, w, h, 220, 1);
      planet(c, cx + R * 0.35, cy - R * 0.3, R * 0.22, '#8fb4d8', '#f0f8ff'); c.restore();
      c.save(); c.lineWidth = w * 0.05; c.strokeStyle = '#2f4a5a'; c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
      c.lineWidth = w * 0.012; c.strokeStyle = '#9fd6e6'; c.beginPath(); c.arc(cx, cy, R - w * 0.03, 0, Math.PI * 2); c.stroke(); c.restore();
      c.fillStyle = 'rgba(0,10,20,.55)'; c.fillRect(0, h * 0.84, w, h * 0.16);
      robot(c, w * 0.62, h * 0.97, h * 0.5, ['#4d5a66', '#dce6ee', '#3a4550'], '#7ff');
      figure(c, w * 0.36, h * 0.97, h * 0.42, '#e8e2d4');
    },
    sun: function (c, r, w, h, p) {
      sky(c, w, h, p.sky);
      c.save(); c.translate(w * 0.72, h * 0.26); c.strokeStyle = '#fff'; c.globalAlpha = 0.85;
      for (let i = 0; i < 16; i++) { c.rotate(Math.PI / 8); c.lineWidth = i % 2 ? 1 : 2.5; c.beginPath(); c.moveTo(0, w * 0.03); c.lineTo(0, w * (i % 2 ? 0.1 : 0.16)); c.stroke(); }
      c.restore();
      c.fillStyle = '#3b2a10';
      c.beginPath(); c.ellipse(w * 0.36, h * 0.48, w * 0.13, h * 0.11, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(w * 0.02, h); c.quadraticCurveTo(w * 0.05, h * 0.6, w * 0.36, h * 0.6); c.quadraticCurveTo(w * 0.66, h * 0.6, w * 0.7, h); c.fill();
      c.save(); c.globalCompositeOperation = 'multiply'; dabs(c, r, w * 0.36, h * 0.6, w * 0.6, h * 0.6, '#c28a20', 160, w * 0.08); c.restore();
      c.fillStyle = '#1a1206'; c.fillRect(w * 0.26, h * 0.74, w * 0.2, h * 0.1);
      c.strokeStyle = '#e9c45a'; c.lineWidth = 1.2; for (let i = 0; i < 5; i++) c.strokeRect(w * (0.27 + i * 0.036), h * 0.755, w * 0.025, h * 0.07);
      for (let i = 0; i < 3; i++) robot(c, w * (0.74 + i * 0.09), h * 0.78, h * 0.18, ['#2a2010', '#7a6a40', '#2a2010'], '#fff6c0');
    },
    sketch: function (c, r, w, h, p) {
      sky(c, w, h, p.sky);
      c.save(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineCap = 'round';
      for (let i = 0; i < 70; i++) { c.lineWidth = 0.6 + r() * 1.4; c.beginPath();
        const x = w * (0.35 + r() * 0.5), y = h * (0.15 + r() * 0.6); c.moveTo(x, y);
        c.bezierCurveTo(x + (r() - 0.5) * w * 0.3, y + (r() - 0.5) * h * 0.2, x + (r() - 0.5) * w * 0.3, y + (r() - 0.5) * h * 0.2, x + (r() - 0.5) * w * 0.4, y + (r() - 0.5) * h * 0.3); c.stroke(); }
      c.restore();
      c.save(); c.fillStyle = '#122236'; c.globalAlpha = 0.85;
      c.beginPath(); c.ellipse(w * 0.62, h * 0.4, w * 0.17, h * 0.17, 0.2, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(w * 0.42, h * 0.95); c.quadraticCurveTo(w * 0.55, h * 0.55, w * 0.9, h * 0.62); c.lineTo(w, h); c.fill(); c.restore();
      dabs(c, r, w * 0.3, h * 0.88, w * 0.6, h * 0.05, '#d2232a', 90, w * 0.08);
      figure(c, w * 0.22, h * 0.87, h * 0.08, '#111');
    },
    split: function (c, r, w, h, p) {
      c.fillStyle = '#111'; c.fillRect(0, 0, w, h);
      c.save(); c.beginPath(); c.rect(w * 0.5, 0, w * 0.5, h); c.clip();
      c.fillStyle = '#f4efe6'; c.beginPath(); c.arc(w * 0.5, h * 0.2, w * 0.13, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(w * 0.5, h * 0.3); c.lineTo(w * 0.78, h * 0.36); c.lineTo(w * 0.86, h * 0.8); c.lineTo(w * 0.78, h * 0.8); c.lineTo(w * 0.72, h * 0.45); c.lineTo(w * 0.66, h); c.lineTo(w * 0.5, h); c.fill();
      c.strokeStyle = '#d4482a'; c.lineWidth = 1.4; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(w * 0.76, h * 0.42); c.quadraticCurveTo(w * (0.78 + r() * 0.05), h * 0.6, w * (0.79 + r() * 0.06), h * 0.78); c.stroke(); }
      c.restore();
      c.save(); c.beginPath(); c.rect(0, 0, w * 0.5, h); c.clip(); c.strokeStyle = '#eee'; c.fillStyle = '#eee'; c.lineWidth = 2;
      c.beginPath(); c.arc(w * 0.5, h * 0.2, w * 0.13, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
      for (let i = 0; i < 9; i++) { const y = h * (0.32 + i * 0.07); c.strokeRect(w * (0.3 + r() * 0.1), y, w * (0.1 + r() * 0.1), h * 0.04); }
      c.beginPath(); c.arc(w * 0.22, h * 0.36, w * 0.05, 0, Math.PI * 2); c.fill();
      c.fillRect(w * 0.1, h * 0.4, w * 0.025, h * 0.4); c.restore();
    }
  };

  function paint(canvas) {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(160, Math.round(box.width)), h = Math.max(220, Math.round(box.height));
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!ctx.roundRect) ctx.roundRect = function (x, y, ww, hh) { this.rect(x, y, ww, hh); };
    const d = canvas.dataset;
    const p = { sky: (d.sky || '#1b1030,#6a2a4a,#f0a050').split(','), accent: d.accent || '#c8462e', eye: d.eye };
    (SCENES[d.scene] || SCENES.planet)(ctx, rng(+d.seed || 7), w, h, p);
  }

  function paintAll(root) { (root || document).querySelectorAll('canvas[data-scene]').forEach(paint); }

  let t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(paintAll, 150); });
  window.CoverPaint = { paint: paint, paintAll: paintAll };
  if (document.readyState !== 'loading') paintAll(); else document.addEventListener('DOMContentLoaded', function () { paintAll(); });
})();

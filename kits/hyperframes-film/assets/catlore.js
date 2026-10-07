/* catlore.js — the cat's nine lives, painted on the 2D canvas for "Nine Lives".
   Each painter takes local time lt (seconds from its own start). Uses S2D helpers from scenes2d.js
   and the editor-in-chief cat from cat.js (CatArt), rasterised once into images. Deterministic. */
(function () {
  'use strict';
  var S = window.S2D, x = S.ctx, W = S.W, H = S.H, C = S.C, F = S.F, ph = S.ph, ease = S.easeOut, clamp = S.clamp, text = S.text;
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }
  function fade(t, a, b, d) { d = d || 0.5; return clamp(Math.min((t - a) / d, (b - t) / d)); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  // the cat, as images (sit 200×300, walk 170×110, peek 200×160)
  var CAT = {};
  function rasterise(pose, w, h) {
    if (!window.CatArt) return;
    var svg = CatArt.svg(pose, 'lore' + pose).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" ');
    var img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); CAT[pose] = img;
  }
  rasterise('sit', 400, 600); rasterise('walk', 340, 220); rasterise('peek', 400, 320);
  function cat(pose, cx, by, h, opt) { // centred at cx, feet on by, height h
    var img = CAT[pose]; if (!img || !img.complete || !img.naturalWidth) return;
    opt = opt || {}; var w = h * img.naturalWidth / img.naturalHeight;
    x.save(); x.translate(cx, by); if (opt.flip) x.scale(-1, 1); if (opt.rot) x.rotate(opt.rot);
    if (opt.alpha != null) x.globalAlpha *= opt.alpha; if (opt.filter) x.filter = opt.filter;
    if (opt.shadow) { x.shadowColor = opt.shadow; x.shadowBlur = opt.blur || 40; }
    x.drawImage(img, -w / 2, -h, w, h); x.restore();
  }

  // a chapter card: "LIFE ONE" + year + place top-left, caption bottom
  var WORD = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  function card(lt, dur, n, year, place, lines, ink) {
    ink = ink || '#f1dcbc';
    var a = fade(lt, 0.15, dur - 0.1, 0.45), k = ease(ph(lt, 0.1, 0.8));
    x.save(); x.globalAlpha = a;
    text('LIFE ' + WORD[n - 1], 150 - (1 - k) * 40, 200, 30, 'Oswald, sans-serif', C.gold, { align: 'left', track: 10, style: '600' });
    text(year, 146, 270, 92, F.display, ink, { align: 'left', glow: 'rgba(0,0,0,.6)', blur: 20 });
    text(place, 150, 340, 24, F.mono, ink, { align: 'left', track: 4 });
    // nine pips: the lives used so far
    for (var i = 0; i < 9; i++) { x.beginPath(); x.arc(158 + i * 26, 380, 7, 0, 6.283); x.fillStyle = i < n ? C.gold : 'rgba(241,220,188,.25)'; x.fill(); }
    x.restore();
    lines.forEach(function (ln, i) {
      var s = 0.9 + i * 1.5, b = fade(lt, s, dur - 0.15, 0.4);
      if (b <= 0) return;
      x.save(); x.globalAlpha = b; x.translate(0, (1 - ease(ph(lt, s, s + 0.6))) * 16);
      font(i === 0 ? 46 : 38, F.serif, 'italic'); var w = x.measureText(ln).width + 56;
      x.fillStyle = 'rgba(0,0,0,.62)'; x.fillRect(W / 2 - w / 2, H - 250 + i * 64 - 30, w, 60);
      text(ln, W / 2, H - 250 + i * 64, i === 0 ? 46 : 38, F.serif, i === 0 ? '#fff' : '#f1dcbc', { style: 'italic' });
      x.restore();
    });
  }
  function font(size, fam, style) { x.font = (style || '') + ' ' + size + 'px ' + fam; }
  function sky(top, bot) { var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, W, H); }
  function stars(seed, n, a) { var r = rng(seed); for (var i = 0; i < n; i++) { x.fillStyle = 'rgba(255,240,220,' + (r() * a) + ')'; var s = r() < 0.06 ? 3 : 2; x.fillRect(r() * W, r() * H, s, s); } }
  function arc(r, x0, y0, x1, y1, jag) { // a jagged electric arc
    x.beginPath(); x.moveTo(x0, y0); var n = 9;
    for (var i = 1; i < n; i++) { var k = i / n; x.lineTo(lerp(x0, x1, k) + (r() - 0.5) * jag, lerp(y0, y1, k) + (r() - 0.5) * jag); }
    x.lineTo(x1, y1); x.stroke();
  }

  /* ── cold open: the eye (7 s) ── */
  function sEye(lt) {
    x.fillStyle = '#000'; x.fillRect(0, 0, W, H);
    var open = ease(ph(lt, 1.0, 2.3)), push = 1 + lt * 0.012, dil = ease(ph(lt, 2.6, 4.2));
    x.save(); x.translate(W / 2, H / 2 - 20); x.scale(push, push);
    // fur around the eye
    var r = rng(5);
    x.globalAlpha = 0.5 * open;
    for (var i = 0; i < 700; i++) { var a = r() * 6.283, d = 300 + r() * 520; x.strokeStyle = r() < 0.35 ? '#2a241e' : '#5d554b'; x.lineWidth = 2 + r() * 2; x.beginPath(); x.moveTo(Math.cos(a) * d, Math.sin(a) * d * 0.62); x.lineTo(Math.cos(a) * (d + 30 + r() * 40), Math.sin(a) * (d + 30) * 0.62 + 8); x.stroke(); }
    x.globalAlpha = 1;
    // the almond, opening
    var ew = 470, eh = 230 * Math.max(0.02, open);
    x.save(); x.beginPath(); x.moveTo(-ew, 0); x.quadraticCurveTo(0, -eh * 1.5, ew, 0); x.quadraticCurveTo(0, eh * 1.5, -ew, 0); x.closePath(); x.clip();
    var g = x.createRadialGradient(-40, -40, 10, 0, 0, 330); g.addColorStop(0, '#e6f59a'); g.addColorStop(0.45, '#a8c94a'); g.addColorStop(0.85, '#556f18'); g.addColorStop(1, '#20280a');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, 330, 0, 6.283); x.fill();
    // iris fibres
    x.globalAlpha = 0.35; x.strokeStyle = '#2f3f0a'; x.lineWidth = 2;
    for (i = 0; i < 160; i++) { var aa = i / 160 * 6.283 + Math.sin(i) * 0.02; x.beginPath(); x.moveTo(Math.cos(aa) * 70, Math.sin(aa) * 70); x.lineTo(Math.cos(aa) * (230 + (i % 7) * 12), Math.sin(aa) * (230 + (i % 7) * 12)); x.stroke(); }
    x.globalAlpha = 1;
    // the pupil: a slit that dilates
    var pw = lerp(26, 150, dil); x.fillStyle = '#050505'; x.beginPath(); x.ellipse(0, 0, pw, 300, 0, 0, 6.283); x.fill();
    // what the cat sees: the collider ring and R-7's eye, reflected
    x.save(); x.globalCompositeOperation = 'screen'; x.globalAlpha = 0.85 * ph(lt, 2.0, 3.0);
    x.strokeStyle = 'rgba(90,160,255,.9)'; x.lineWidth = 6; x.shadowColor = '#3d7fe0'; x.shadowBlur = 30;
    x.beginPath(); x.ellipse(-30, -10, 120, 44, -0.2, 0, 6.283); x.stroke();
    x.fillStyle = 'rgba(255,170,60,' + (0.5 + 0.5 * Math.sin(lt * 5)) + ')'; x.beginPath(); x.arc(30, 40, 8, 0, 6.283); x.fill();
    x.restore();
    // highlight + lid shadow
    x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.ellipse(-150, -80, 46, 30, -0.5, 0, 6.283); x.fill();
    var lid = x.createLinearGradient(0, -eh * 1.5, 0, 0); lid.addColorStop(0, 'rgba(0,0,0,.6)'); lid.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = lid; x.fillRect(-ew, -eh * 1.5, ew * 2, eh * 1.5);
    x.restore();
    x.strokeStyle = '#0a0806'; x.lineWidth = 14; x.beginPath(); x.moveTo(-ew, 0); x.quadraticCurveTo(0, -eh * 1.5, ew, 0); x.quadraticCurveTo(0, eh * 1.5, -ew, 0); x.stroke();
    x.restore();
    // the words
    [[3.4, 'Every cat has nine lives.'], [4.9, 'This one was there for all of them.']].forEach(function (w, i) {
      var b = fade(lt, w[0], 6.5, 0.5); if (b <= 0) return; x.save(); x.globalAlpha = b;
      font(54, F.serif, 'italic'); var tw = x.measureText(w[1]).width + 60; x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(W / 2 - tw / 2, H - 300 + i * 76 - 36, tw, 72);
      text(w[1], W / 2, H - 300 + i * 76, 54, F.serif, i ? C.gold : '#fff', { style: 'italic' }); x.restore();
    });
    if (lt > 6.4) { x.fillStyle = 'rgba(0,0,0,' + ph(lt, 6.4, 7) + ')'; x.fillRect(0, 0, W, H); }
  }

  /* ── life one: Tesla's Mačak, c. 1860s (5.3 s) ── */
  function sTesla(lt) {
    sky('#060a1e', '#141a3a');
    var flash = Math.max(0, 1 - Math.abs(lt - 2.1) / 0.12) + Math.max(0, 1 - Math.abs(lt - 2.45) / 0.08) * 0.6;
    // the window: snow, and lightning over the hills
    x.save(); x.translate(1180, 170); x.fillStyle = flash > 0 ? 'rgba(200,215,255,' + (0.25 + flash * 0.6) + ')' : '#0b1430'; x.fillRect(0, 0, 560, 480);
    if (flash > 0) { x.strokeStyle = 'rgba(255,255,255,' + flash + ')'; x.lineWidth = 4; arc(rng(9), 300, 0, 260, 380, 60); }
    x.fillStyle = '#05070f'; x.beginPath(); x.moveTo(0, 480); x.quadraticCurveTo(180, 330, 330, 420); x.quadraticCurveTo(450, 360, 560, 410); x.lineTo(560, 480); x.fill();
    var rs = rng(3); x.fillStyle = 'rgba(255,255,255,.8)'; for (var i = 0; i < 120; i++) { var sx = rs() * 560, sy = (rs() * 480 + lt * (40 + rs() * 50)) % 480; x.fillRect(sx + Math.sin(lt + i) * 6, sy, 3, 3); }
    x.strokeStyle = '#2b1d14'; x.lineWidth = 22; x.strokeRect(0, 0, 560, 480); x.lineWidth = 12; x.beginPath(); x.moveTo(280, 0); x.lineTo(280, 480); x.moveTo(0, 240); x.lineTo(560, 240); x.stroke();
    x.restore();
    // candle warmth
    var g = x.createRadialGradient(560, 860, 20, 560, 860, 700); g.addColorStop(0, 'rgba(255,170,80,.35)'); g.addColorStop(1, 'rgba(255,170,80,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.fillStyle = '#1a120c'; x.fillRect(0, 900, W, 180);
    // the cat, and the sparks along its back
    var cx = 640, by = 920, ch = 560;
    cat('sit', cx, by, ch, { filter: 'brightness(' + (0.75 + flash * 0.5) + ')' });
    var r = rng(1 + Math.floor(lt * 24));
    x.save(); x.globalCompositeOperation = 'lighter'; x.strokeStyle = 'rgba(170,210,255,.95)'; x.shadowColor = '#7fb6ff'; x.shadowBlur = 22; x.lineWidth = 2.5;
    var on = ph(lt, 0.6, 1.2);
    for (i = 0; i < 14 * on; i++) {
      var u = r(), side = r() < 0.5 ? -1 : 1, px = cx + side * (90 + r() * 70), py = by - ch * (0.25 + u * 0.55);
      arc(r, px, py, px + (r() - 0.5) * 120, py - 40 - r() * 90, 26);
    }
    x.restore();
    card(lt, 5.3, 1, 'c. 1860s', 'SMILJAN · MAČAK, TESLA\'S CAT', ['A boy strokes his cat. Its back lights up with sparks.', 'He wonders if nature is a giant cat. Nikola Tesla grew up to light the world.']);
  }

  /* ── life two: The Boxing Cats, 1894 (5.3 s) ── */
  function sBoxing(lt) {
    var fr = Math.floor(lt * 16), r = rng(100 + fr), flick = 0.9 + r() * 0.12;
    x.fillStyle = '#d9c39a'; x.fillRect(0, 0, W, H);
    // the little ring
    x.fillStyle = '#b89d6e'; x.fillRect(360, 700, 1200, 220);
    x.strokeStyle = '#3a2c1c'; x.lineWidth = 6; [620, 670, 720].forEach(function (y) { x.beginPath(); x.moveTo(380, y); x.lineTo(1540, y); x.stroke(); });
    x.fillStyle = '#3a2c1c'; x.fillRect(370, 560, 22, 360); x.fillRect(1528, 560, 22, 360);
    // two cats, sparring
    var bob = Math.sin(lt * 9) * 14, jab = Math.max(0, Math.sin(lt * 4.5)) * 60, jab2 = Math.max(0, Math.sin(lt * 4.5 + 2.4)) * 60;
    cat('sit', 780 + jab, 880 + bob, 420, { rot: -0.08 + jab / 900, filter: 'sepia(1) contrast(1.1) brightness(.9)' });
    cat('sit', 1140 - jab2, 880 - bob, 420, { flip: true, rot: 0.08 - jab2 / 900, filter: 'sepia(1) contrast(1.15) brightness(.75)' });
    // film: flicker, scratches, dust, sprocket holes, iris
    x.fillStyle = 'rgba(40,25,10,' + (0.12 + (1 - flick) * 1.2) + ')'; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(255,250,235,.5)'; x.lineWidth = 2; for (var i = 0; i < 3; i++) { var sx = r() * W; x.beginPath(); x.moveTo(sx, 0); x.lineTo(sx + (r() - 0.5) * 30, H); x.stroke(); }
    x.fillStyle = 'rgba(20,12,4,.6)'; for (i = 0; i < 20; i++) x.fillRect(r() * W, r() * H, 2 + r() * 4, 2 + r() * 4);
    x.fillStyle = '#120c06'; x.fillRect(0, 0, 110, H); x.fillRect(W - 110, 0, 110, H);
    var off = (lt * 16 % 1) * 120; x.fillStyle = '#d9c39a';
    for (i = -1; i < 11; i++) { x.fillRect(35, i * 120 + off, 40, 60); x.fillRect(W - 75, i * 120 + off, 40, 60); }
    var ir = x.createRadialGradient(W / 2, H / 2, 380, W / 2, H / 2, 980); ir.addColorStop(0, 'rgba(0,0,0,0)'); ir.addColorStop(1, 'rgba(0,0,0,.85)'); x.fillStyle = ir; x.fillRect(0, 0, W, H);
    // title card in the style of the period
    var tc = fade(lt, 0.2, 1.5, 0.3);
    if (tc > 0) { x.save(); x.globalAlpha = tc; x.fillStyle = '#120c06'; x.fillRect(560, 430, 800, 200); x.strokeStyle = '#d9c39a'; x.lineWidth = 3; x.strokeRect(580, 450, 760, 160); text('THE BOXING CATS', W / 2, 515, 64, F.serif, '#e8d8b4', {}); text('(PROF. WELTON\'S)', W / 2, 575, 26, F.mono, '#e8d8b4', { track: 6 }); x.restore(); }
    card(lt, 5.3, 2, '1894', 'EDISON\'S BLACK MARIA STUDIO', ['Two cats spar in a tiny ring for Edison\'s camera.', 'One of the first films ever made. The first cat video.'], '#fff4dc');
  }

  /* ── life three: Schrödinger, 1935 (5.4 s) ── */
  function sBox(lt) {
    sky('#02070c', '#0a1a22');
    var cx = W / 2 + 260, cy = 640, s = 260, lid = ease(ph(lt, 1.0, 2.4)) * 0.5;
    // light from inside the box
    var g = x.createRadialGradient(cx, cy - 120, 20, cx, cy - 120, 700); g.addColorStop(0, 'rgba(127,224,210,' + (0.15 + lid * 0.5) + ')'); g.addColorStop(1, 'rgba(127,224,210,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    // the cat, in superposition: two of it, neither quite there
    var q = 0.5 + 0.5 * Math.sin(lt * 7), q2 = 0.5 + 0.5 * Math.sin(lt * 7 + Math.PI);
    if (lid > 0.05) {
      cat('sit', cx - 40, cy - 30, 360, { alpha: 0.2 + 0.6 * q, shadow: 'rgba(127,224,210,.9)', blur: 30 });
      cat('sit', cx + 40, cy - 30, 360, { alpha: 0.2 + 0.6 * q2, flip: true, filter: 'grayscale(1) brightness(1.3)' });
    }
    // the box (front faces drawn over the cat's lower half)
    x.fillStyle = '#3a2a1a'; x.strokeStyle = '#120a04'; x.lineWidth = 4;
    x.beginPath(); x.moveTo(cx - s, cy - 40); x.lineTo(cx + s, cy - 40); x.lineTo(cx + s, cy + 260); x.lineTo(cx - s, cy + 260); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#2a1e12'; x.beginPath(); x.moveTo(cx + s, cy - 40); x.lineTo(cx + s + 120, cy - 120); x.lineTo(cx + s + 120, cy + 180); x.lineTo(cx + s, cy + 260); x.closePath(); x.fill(); x.stroke();
    // the lid, lifting
    x.save(); x.translate(cx - s, cy - 40); x.rotate(-lid * 1.2); x.fillStyle = '#4a3622'; x.beginPath(); x.moveTo(0, 0); x.lineTo(2 * s, 0); x.lineTo(2 * s + 120, -80); x.lineTo(120, -80); x.closePath(); x.fill(); x.stroke(); x.restore();
    text('|ALIVE⟩ + |DEAD⟩', cx, cy + 140, 54, F.mono, 'rgba(127,224,210,' + (0.4 + 0.5 * q) + ')', { glow: '#7fe0d2', blur: 18 });
    card(lt, 5.4, 3, '1935', 'ERWIN SCHRÖDINGER · THOUGHT EXPERIMENT', ['A physicist puts a cat in a box. Until you look, it is alive and dead at once.', 'Quantum physics never got over it. Quantum computers still haven\'t.']);
  }

  /* ── life four: Hubel & Wiesel, 1959 (5.3 s) ── */
  function sSee(lt) {
    sky('#04070a', '#0b1410');
    // the screen with a bar of light turning
    var sx = 1010, sy = 230, sw = 660, sh = 460, ang = -0.9 + lt * 0.42, pref = 0.6;
    x.fillStyle = '#111'; x.fillRect(sx - 30, sy - 30, sw + 60, sh + 60); x.fillStyle = '#000'; x.fillRect(sx, sy, sw, sh);
    x.save(); x.beginPath(); x.rect(sx, sy, sw, sh); x.clip(); x.translate(sx + sw / 2, sy + sh / 2); x.rotate(ang);
    x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 30; x.fillRect(-26, -260, 52, 520); x.restore();
    // the cat watches
    cat('sit', 560, 900, 470, { filter: 'brightness(.85)' });
    // the trace: one neuron, firing for the edge it likes
    var rate = Math.pow(Math.max(0, Math.cos(ang - pref)), 12), r = rng(77);
    x.strokeStyle = '#7dff8a'; x.shadowColor = '#7dff8a'; x.shadowBlur = 12; x.lineWidth = 3; x.beginPath();
    var base = 850, x0 = 860, x1 = 1760;
    for (var X = x0; X <= x1; X += 3) {
      var past = lt - (x1 - X) / 300, n = Math.round(past * 100), rr = Math.pow(Math.max(0, Math.cos(-0.9 + past * 0.42 - pref)), 12);
      var hsh = Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1, spike = hsh < 0.02 + rr * 0.4 ? -(50 + 50 * ((n * 7) % 5) / 4) : 0;
      x.lineTo(X, base + spike + Math.sin(n * 0.7) * 3);
    }
    x.stroke(); x.shadowBlur = 0;
    text(rate > 0.5 ? 'NEURON FIRING' : 'NEURON QUIET', 1310, 960, 26, F.mono, rate > 0.5 ? '#7dff8a' : 'rgba(125,255,138,.45)', { track: 6 });
    card(lt, 5.3, 4, '1959', 'HUBEL & WIESEL · THE VISUAL CORTEX', ['Two scientists show a cat bars of light. Single neurons fire for edges.', 'It wins a Nobel, and becomes the blueprint for how machines learn to see.']);
  }

  /* ── life five: Félicette, 18 October 1963 (5.3 s) ── */
  function sRocket(lt) {
    var up = ease(ph(lt, 0.6, 5.3)), camY = up * 900;
    var g = x.createLinearGradient(0, -900 + camY, 0, H + camY); g.addColorStop(0, '#02030a'); g.addColorStop(0.45, '#1a1440'); g.addColorStop(0.8, '#e0743a'); g.addColorStop(1, '#f2b06a');
    x.fillStyle = g; x.fillRect(0, 0, W, H); stars(31, 260, ph(camY, 200, 800));
    x.save(); x.translate(0, camY);
    x.fillStyle = '#7a4a2a'; x.beginPath(); x.moveTo(0, 900); x.quadraticCurveTo(500, 840, 960, 880); x.quadraticCurveTo(1400, 840, W, 890); x.lineTo(W, H); x.lineTo(0, H); x.fill();
    var ry = 760 - ease(ph(lt, 0.4, 5.3)) * 1500, rx = 960;
    // smoke column and flame
    var r = rng(5 + Math.floor(lt * 20));
    for (var i = 0; i < 40; i++) { var k = i / 40, yy = ry + 150 + k * (900 - ry); x.fillStyle = 'rgba(240,230,220,' + (0.06 + 0.12 * (1 - k)) + ')'; x.beginPath(); x.arc(rx + (r() - 0.5) * 60 * k, yy, 30 + k * 90, 0, 6.283); x.fill(); }
    x.fillStyle = '#ffb12a'; x.shadowColor = '#ff8a1a'; x.shadowBlur = 50; x.beginPath(); x.moveTo(rx - 18, ry + 140); x.lineTo(rx, ry + 230 + r() * 50); x.lineTo(rx + 18, ry + 140); x.fill(); x.shadowBlur = 0;
    // the rocket
    x.fillStyle = '#f2efe6'; x.fillRect(rx - 22, ry - 120, 44, 260); x.beginPath(); x.moveTo(rx - 22, ry - 120); x.lineTo(rx, ry - 190); x.lineTo(rx + 22, ry - 120); x.fill();
    x.fillStyle = '#d8322b'; x.beginPath(); x.moveTo(rx - 22, ry + 90); x.lineTo(rx - 56, ry + 150); x.lineTo(rx - 22, ry + 140); x.fill(); x.beginPath(); x.moveTo(rx + 22, ry + 90); x.lineTo(rx + 56, ry + 150); x.lineTo(rx + 22, ry + 140); x.fill();
    x.restore();
    // porthole: the cat, weightless
    var pa = ph(lt, 1.6, 2.2);
    if (pa > 0) {
      var px = 1460, py = 520, pr = 190 * ease(pa);
      x.save(); x.beginPath(); x.arc(px, py, pr, 0, 6.283); x.clip(); x.fillStyle = '#0b1230'; x.fillRect(px - 200, py - 200, 400, 400); stars(77, 60, 0.9);
      cat('peek', px, py + 150 + Math.sin(lt * 2) * 10, 280, { rot: Math.sin(lt * 1.3) * 0.12 }); x.restore();
      x.strokeStyle = '#c9ced8'; x.lineWidth = 18; x.beginPath(); x.arc(px, py, pr, 0, 6.283); x.stroke();
      for (i = 0; i < 12; i++) { var a = i / 12 * 6.283; x.fillStyle = '#7a808c'; x.beginPath(); x.arc(px + Math.cos(a) * pr, py + Math.sin(a) * pr, 5, 0, 6.283); x.fill(); }
    }
    card(lt, 5.3, 5, '1963', '18 OCTOBER · HAMMAGUIR, SAHARA', ['Félicette rides a French rocket about 157 km up, to the edge of space.', 'She parachutes home alive. Still the only cat ever to go to space.']);
  }

  /* ── life six: the robot cat, 1969 (5.4 s) ── */
  function sManga(lt) {
    x.fillStyle = '#f7f3ea'; x.fillRect(0, 0, W, H);
    var cx = 1180, cy = 560, r = rng(12);
    x.strokeStyle = 'rgba(29,20,16,.85)';
    for (var i = 0; i < 140; i++) { var a = r() * 6.283, d0 = 300 + r() * 120; x.lineWidth = 1 + r() * 3; x.beginPath(); x.moveTo(cx + Math.cos(a) * d0, cy + Math.sin(a) * d0); x.lineTo(cx + Math.cos(a) * 1400, cy + Math.sin(a) * 1400); x.stroke(); }
    // screentone dots behind the hero
    x.fillStyle = 'rgba(43,138,240,.35)'; for (var yy = 0; yy < H; yy += 14) for (var xx = (yy / 14) % 2 ? 7 : 0; xx < W; xx += 14) { var dd = Math.hypot(xx - cx, yy - cy); if (dd < 330) { x.beginPath(); x.arc(xx, yy, 4 * (1 - dd / 330), 0, 6.283); x.fill(); } }
    var pop = ease(ph(lt, 0.2, 0.9)), hop = Math.abs(Math.sin(lt * 3.2)) * 26;
    cat('sit', cx, cy + 330 - hop, 640 * (0.8 + 0.2 * pop), {});
    // gadgets from the future, spinning out of the pocket
    ['#2b8af0', '#e8a21c', '#d8322b', '#76b900'].forEach(function (c, k) {
      var a = lt * 1.6 + k * 1.57, R = 470 * pop; x.save(); x.translate(cx + Math.cos(a) * R, cy - 40 + Math.sin(a) * R * 0.62); x.rotate(a * 2);
      x.fillStyle = c; x.strokeStyle = '#1d1410'; x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 34, 0, 6.283); x.fill(); x.stroke(); x.fillStyle = '#fff'; x.fillRect(-12, -4, 24, 8); x.restore();
    });
    // panel borders
    x.strokeStyle = '#1d1410'; x.lineWidth = 12; x.strokeRect(90, 120, W - 180, H - 240); x.lineWidth = 8; x.beginPath(); x.moveTo(760, 120); x.lineTo(700, H - 120); x.stroke();
    text('BEEP!', 460, 600, 120, F.display, '#2b8af0', { glow: '#fff', blur: 0 });
    card(lt, 5.4, 6, '1969', 'TOKYO · A ROBOT CAT FROM THE 22ND CENTURY', ['A cartoonist dreams up a robot cat who travels back in time to help a boy.', 'A generation grows up trusting robots, because the robot was a cat.'], '#1d1410');
  }

  /* ── life seven: I, Robot, 2004 (4.5 s) ── */
  function sHouse(lt) {
    var shake = lt > 0.8 && lt < 3.4 ? Math.sin(lt * 60) * 8 * (1 - ph(lt, 2.4, 3.4)) : 0;
    x.save(); x.translate(shake, shake * 0.6);
    sky('#1a120c', '#3a2618');
    // the wall coming apart
    var r = rng(44);
    x.fillStyle = '#5a4030'; x.fillRect(-20, 0, W + 40, 820);
    var bite = ease(ph(lt, 0.8, 2.6));
    x.fillStyle = '#ffd9a0'; x.beginPath(); x.moveTo(1200, 0); x.lineTo(1200 + bite * 700, 0); x.lineTo(1200 + bite * 700, 820 * bite); x.lineTo(1300, 600 * bite); x.closePath(); x.fill();
    for (var i = 0; i < 60; i++) { var t0 = 0.8 + r() * 1.8, k = clamp((lt - t0) / 1.2); if (k <= 0) continue; var bx = 1250 + r() * 600, by = k * k * 900 - 40; x.save(); x.translate(bx, by); x.rotate(k * (r() - 0.5) * 8); x.fillStyle = r() < 0.5 ? '#3a2a1e' : '#6a5040'; x.fillRect(-20, -12, 30 + r() * 30, 18 + r() * 20); x.restore(); }
    // dust
    for (i = 0; i < 30; i++) { x.fillStyle = 'rgba(200,170,130,' + (0.12 * ph(lt, 1.0, 2.0)) + ')'; x.beginPath(); x.arc(1100 + r() * 800, 700 + r() * 200 - lt * 30, 60 + r() * 80, 0, 6.283); x.fill(); }
    x.fillStyle = '#2a1c12'; x.fillRect(-20, 820, W + 40, 300);
    x.restore();
    // the witness walks out of the dust, toward us
    var wk = ease(ph(lt, 1.2, 3.6));
    cat('sit', lerp(1500, 760, wk), 960, lerp(260, 560, wk), { shadow: 'rgba(0,0,0,.6)' });
    // the collar tag reads ASIMOV
    var ta = ph(lt, 3.0, 3.5);
    if (ta > 0) { x.save(); x.globalAlpha = ta; x.fillStyle = '#e8b04a'; x.strokeStyle = '#1d1410'; x.lineWidth = 3; x.beginPath(); x.roundRect ? x.roundRect(860, 640, 220, 64, 32) : x.rect(860, 640, 220, 64); x.fill(); x.stroke(); text('ASIMOV', 970, 674, 40, F.display, '#1d1410', { track: 3 }); x.restore(); }
    card(lt, 4.5, 7, '2004', 'I, ROBOT · DR. LANNING\'S HOUSE', ['A demolition robot tears the house down. One witness walks out: a tabby.', 'The film never says its name. Reportedly, it\'s Asimov.']);
  }

  /* ── life eight: the Google cat → the GPU, 2012–2013 (4.5 s) ── */
  var small = document.createElement('canvas'); small.width = 26; small.height = 21;
  function sNet(lt) {
    x.fillStyle = '#020604'; x.fillRect(0, 0, W, H);
    var cols = 14, rows = 8, cw = 120, chh = 80, gx = (W - cols * cw) / 2, gy = 150, conv = ease(ph(lt, 1.4, 2.6));
    var r = rng(9 + Math.floor(lt * 12));
    for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
      var X = gx + i * cw, Y = gy + j * chh, h = (i * 37 + j * 91 + Math.floor(lt * 12) * 13) % 360;
      x.globalAlpha = 0.85 * (1 - conv); x.fillStyle = 'hsl(' + h + ',45%,' + (25 + r() * 25) + '%)'; x.fillRect(X + 4, Y + 4, cw - 8, chh - 8);
    }
    x.globalAlpha = 1;
    // a cat's face resolving out of the noise, pixel by pixel
    if (conv > 0 && CAT.peek && CAT.peek.complete) {
      var sc = small.getContext('2d'), res = Math.max(4, Math.round(lerp(4, 26, ease(ph(lt, 1.8, 3.6)))));
      small.width = res; small.height = Math.round(res * 0.8); sc.drawImage(CAT.peek, 0, 0, small.width, small.height);
      var fw = 620, fh = 496; x.save(); x.imageSmoothingEnabled = false; x.globalAlpha = conv; x.filter = 'saturate(.3) brightness(1.1)';
      x.drawImage(small, W / 2 - fw / 2, 230, fw, fh); x.restore();
      x.strokeStyle = 'rgba(118,185,0,' + conv + ')'; x.lineWidth = 4; x.strokeRect(W / 2 - fw / 2 - 12, 218, fw + 24, fh + 24);
      text('NEURON 3 · "CAT"', W / 2, 200, 28, F.mono, 'rgba(118,185,0,' + conv + ')', { track: 6 });
    }
    var g2 = ph(lt, 3.0, 3.4);
    if (g2 > 0) text('2013 · STANFORD + NVIDIA: 6.5× BIGGER, ON 16 GPU SERVERS', W / 2, 790, 30, F.mono, 'rgba(168,255,74,' + g2 + ')', { track: 3 });
    card(lt, 4.5, 8, '2012', 'GOOGLE BRAIN · 16,000 CPU CORES', ['A neural net watches millions of video frames. Nobody tells it what to look for.', 'It learns to see a cat. Next year it moves onto the GPU.']);
  }

  /* ── life nine: on-chain, now (8 s) ── */
  function coin(cx, cy, rr, spin, paw) {
    var sx = Math.cos(spin); x.save(); x.translate(cx, cy); x.scale(Math.max(0.06, Math.abs(sx)), 1);
    var g = x.createRadialGradient(-rr * 0.3, -rr * 0.4, 4, 0, 0, rr); g.addColorStop(0, '#ffe08a'); g.addColorStop(0.6, '#e8a21c'); g.addColorStop(1, '#7a4a08');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, rr, 0, 6.283); x.fill(); x.strokeStyle = 'rgba(255,243,196,.8)'; x.lineWidth = Math.max(1, rr * 0.06); x.beginPath(); x.arc(0, 0, rr * 0.78, 0, 6.283); x.stroke();
    x.fillStyle = '#5a0a1e';
    if (paw) { x.beginPath(); x.ellipse(0, rr * 0.15, rr * 0.28, rr * 0.22, 0, 0, 6.283); x.fill(); [[-0.3, -0.2], [-0.1, -0.38], [0.1, -0.38], [0.3, -0.2]].forEach(function (p) { x.beginPath(); x.arc(p[0] * rr, p[1] * rr, rr * 0.1, 0, 6.283); x.fill(); }); }
    else { x.font = Math.round(rr * 0.8) + 'px ' + F.display; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$A', 0, rr * 0.05); }
    x.restore();
  }
  function sChain(lt) {
    sky('#05030f', '#1a0b33');
    var g = x.createRadialGradient(W / 2, H * 0.55, 40, W / 2, H * 0.55, 900); g.addColorStop(0, 'rgba(232,162,28,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H); stars(91, 200, 0.7);
    var r = rng(19);
    for (var i = 0; i < 46; i++) { var t0 = r() * 2.2, sp = 260 + r() * 260, X = r() * W, y = -80 + (lt - t0) * sp; if (lt < t0 || (X < 760 && y % (H + 160) < 460)) continue; coin(X, y % (H + 160), 22 + r() * 26, lt * (2 + r() * 3) + i, i % 3 !== 0); }
    // the big coin rises; the cat steps onto it
    var up = ease(ph(lt, 1.6, 3.2)), cy = lerp(H + 300, 720, up);
    coin(W / 2, cy, 230, Math.sin(lt * 0.8) * 0.25, false);
    var on = ease(ph(lt, 3.0, 4.4));
    if (on > 0) cat('sit', W / 2, cy - 200 + (1 - on) * -200, 360, { alpha: on, shadow: 'rgba(232,162,28,.7)', blur: 40 });
    var fin = ph(lt, 5.6, 6.2);
    if (fin > 0) text('LIFE NINE IS ON-CHAIN.', W / 2, 200, 64, F.display, 'rgba(255,224,138,' + fin + ')', { track: 4, glow: '#e8a21c', blur: 30 });
    card(lt, 8, 9, 'NOW', 'SOLANA · $ASIMOV × NVDAx', ['2017: cartoon cats called CryptoKitties jam the Ethereum network.', 'Since then, the cat has been crypto\'s favourite mascot.']);
    if (lt > 7.6) { x.fillStyle = 'rgba(255,244,220,' + ph(lt, 7.6, 8) * 0.5 + ')'; x.fillRect(0, 0, W, H); }
  }

  window.CatLore = { sEye: sEye, sTesla: sTesla, sBoxing: sBoxing, sBox: sBox, sSee: sSee, sRocket: sRocket, sManga: sManga, sHouse: sHouse, sNet: sNet, sChain: sChain, images: CAT };
})();

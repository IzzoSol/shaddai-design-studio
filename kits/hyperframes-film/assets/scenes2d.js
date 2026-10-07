/* scenes2d.js — 2D scene painters shared with movie/movie.html (Canvas 2D, pure functions of time).
   Each sScene(t) paints one full frame for its original timeline; film/index.html maps film time onto it. */
(function(){
'use strict';

var W = 1920, H = 1080, BAR = 96;
var CLIP_AT = 44.6, CLIP_LEN = 4.0, CLIP_RECT = { x: 120, y: 183, w: 1680, h: 714 };
var DURATION = 82;
var c = document.getElementById('c2d'), x = c.getContext('2d');

var C = { night: '#03060d', blue: '#3d7fe0', ice: '#a9d4ff', paper: '#f1dcbc', ink: '#1d1410', rust: '#a5302a', red: '#d8322b', gold: '#e8a21c', cream: '#fff4dc' };
var F = { display: 'Anton, Impact, sans-serif', cond: '600 1px Oswald, sans-serif', mono: "'Courier Prime', monospace", serif: 'Caslon, Georgia, serif' };

function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }
function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
function ease(v) { v = clamp(v); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }
function easeOut(v) { v = clamp(v); return 1 - Math.pow(1 - v, 3); }
function ph(t, a, b) { return clamp((t - a) / (b - a)); }
function fadeIO(t, a, b, d) { d = d || 0.6; return clamp(Math.min((t - a) / d, (b - t) / d)); }
function lerp(a, b, k) { return a + (b - a) * k; }

function font(size, fam, style) { x.font = (style || '') + ' ' + size + 'px ' + fam; }
function text(s, X, Y, size, fam, color, opts) {
  opts = opts || {}; font(size, fam, opts.style || ''); x.fillStyle = color; x.textAlign = opts.align || 'center'; x.textBaseline = opts.base || 'middle';
  if (opts.track) { x.letterSpacing = opts.track + 'px'; }
  if (opts.glow) { x.shadowColor = opts.glow; x.shadowBlur = opts.blur || 24; }
  x.fillText(s, X, Y); x.shadowBlur = 0; x.letterSpacing = '0px';
}
function typed(s, k) { return s.slice(0, Math.round(s.length * clamp(k))); }
function wrap(s, max) {
  var words = s.split(' '), lines = [], line = '';
  words.forEach(function (w) { var tt = line ? line + ' ' + w : w; if (x.measureText(tt).width > max && line) { lines.push(line); line = w; } else line = tt; });
  if (line) lines.push(line); return lines;
}

/* ── precomputed assets ── */
var grain = (function () {
  var g = document.createElement('canvas'); g.width = 512; g.height = 512; var gx = g.getContext('2d'), id = gx.createImageData(512, 512), r = rng(9);
  for (var i = 0; i < id.data.length; i += 4) { var v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 11; }
  gx.putImageData(id, 0, 0); return g;
})();
var DUST = (function () { var r = rng(42), a = []; for (var i = 0; i < 2600; i++) a.push({ x: r(), y: r(), z: 0.3 + r() * 0.7, s: r() * 6.28, sp: 0.2 + r() }); return a; })();
var HEAD = (function () { // sample the robot-head silhouette into target points
  var g = document.createElement('canvas'); g.width = g.height = 300; var gx = g.getContext('2d');
  gx.strokeStyle = gx.fillStyle = '#fff'; gx.lineWidth = 10;
  gx.beginPath(); gx.roundRect(81, 18, 138, 180, 36); gx.stroke();
  gx.beginPath(); gx.moveTo(81, 60); gx.lineTo(219, 60); gx.stroke();
  gx.fillRect(105, 81, 33, 18); gx.beginPath(); gx.ellipse(180, 90, 16, 10, 0, 0, 6.283); gx.fill();
  gx.fillRect(114, 141, 72, 9); gx.fillRect(114, 141, 12, 36); gx.fillRect(174, 141, 12, 36); gx.fillRect(126, 198, 48, 24);
  gx.beginPath(); gx.moveTo(36, 294); gx.quadraticCurveTo(150, 198, 264, 294); gx.stroke();
  var d = gx.getImageData(0, 0, 300, 300).data, pts = [];
  for (var y = 0; y < 300; y += 2) for (var X = 0; X < 300; X += 2) if (d[(y * 300 + X) * 4 + 3] > 128) pts.push([X / 300 - 0.5, y / 300 - 0.5]);
  var r = rng(5), out = []; for (var i = 0; i < DUST.length; i++) out.push(pts[(r() * pts.length) | 0]); return out;
})();

/* ── shared layers ── */
function bars(k) { x.fillStyle = '#000'; var h = BAR * (k == null ? 1 : k); x.fillRect(0, 0, W, h); x.fillRect(0, H - h, W, h); }
function vignette(a) { var g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + (a || 0.7) + ')'); x.fillStyle = g; x.fillRect(0, 0, W, H); }
var grainPat = null;
function film(t) { // tiled, shifted every 1/24 s like real film grain
  if (!grainPat) grainPat = x.createPattern(grain, 'repeat');
  var f = Math.floor(t * 24); x.save(); x.translate(-(f * 137 % 512), -(f * 251 % 512)); x.fillStyle = grainPat; x.fillRect(0, 0, W + 512, H + 512); x.restore();
}
function bg(col) { x.fillStyle = col; x.fillRect(0, 0, W, H); }
function paperBg() {
  bg(C.paper); var g = x.createRadialGradient(0, 0, 0, 0, 0, W * 0.7); g.addColorStop(0, 'rgba(140,90,40,.25)'); g.addColorStop(1, 'rgba(140,90,40,0)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  g = x.createRadialGradient(W, H, 0, W, H, W * 0.7); g.addColorStop(0, 'rgba(140,90,40,.22)'); g.addColorStop(1, 'rgba(140,90,40,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
}
function halftone(alpha, step) { x.save(); x.globalAlpha = alpha; x.fillStyle = '#000'; step = step || 9; for (var y = 0; y < H; y += step) for (var X = (y / step) % 2 ? step / 2 : 0; X < W; X += step) { x.beginPath(); x.arc(X, y, step * 0.22, 0, 6.283); x.fill(); } x.restore(); }

/* ── robot drawing (chrome figure) ── */
function robot(cx, base, Hh, cols, eye, glowK) {
  var u = Hh / 10; function blk(a, b, w, h, rr) { x.beginPath(); x.roundRect(cx + a * u, base - b * u, w * u, h * u, (rr || 0.3) * u); x.fill(); }
  var g = x.createLinearGradient(cx - 2 * u, 0, cx + 2 * u, 0); g.addColorStop(0, cols[0]); g.addColorStop(0.45, cols[1]); g.addColorStop(1, cols[2]);
  x.fillStyle = g; blk(-0.75, 10, 1.5, 1.6, 0.7); blk(-0.3, 8.5, 0.6, 0.5, 0.1); blk(-1.5, 8.1, 3, 3.4, 0.6); blk(-1.1, 4.8, 2.2, 0.8, 0.3);
  blk(-2.15, 7.9, 0.6, 3.6, 0.3); blk(1.55, 7.9, 0.6, 3.6, 0.3); blk(-1, 4.1, 0.75, 4.1, 0.3); blk(0.25, 4.1, 0.75, 4.1, 0.3);
  x.shadowColor = eye; x.shadowBlur = u * 2 * (glowK || 1); x.fillStyle = eye; blk(-0.45, 9.2, 0.3, 0.25, 0.12); blk(0.15, 9.2, 0.3, 0.25, 0.12); x.shadowBlur = 0;
}

/* ═════════ SCENES ═════════ */
// 1 · Cold open (0–7): blue dust gathers into a robot head; two typed lines.
function sColdOpen(t) {
  bg(C.night);
  var form = ease(ph(t, 2.2, 5.6)), fade = 1 - ph(t, 6.2, 7);
  x.save(); x.globalAlpha = fade;
  for (var i = 0; i < DUST.length; i++) {
    var d = DUST[i], hx = W / 2 + HEAD[i][0] * 620, hy = H / 2 - 30 + HEAD[i][1] * 620;
    var fx = d.x * W + Math.sin(t * 0.3 * d.sp + d.s) * 40, fy = d.y * H + Math.cos(t * 0.25 * d.sp + d.s) * 30;
    var k = clamp((form - d.z * 0.35) / 0.65), px = lerp(fx, hx, ease(k)), py = lerp(fy, hy, ease(k));
    x.fillStyle = i % 7 ? C.blue : C.ice; x.globalAlpha = fade * (0.35 + 0.65 * d.z);
    x.fillRect(px, py, 2.2 * d.z + 0.6, 2.2 * d.z + 0.6);
  }
  var eyes = ph(t, 5.0, 5.5) * fade;
  if (eyes > 0) { x.globalAlpha = eyes; [[W / 2 - 60, H / 2 - 30 - 56], [W / 2 + 62, H / 2 - 30 - 50]].forEach(function (e) { var g = x.createRadialGradient(e[0], e[1], 2, e[0], e[1], 60); g.addColorStop(0, '#fff'); g.addColorStop(0.3, '#ffc04a'); g.addColorStop(1, 'rgba(255,192,74,0)'); x.fillStyle = g; x.fillRect(e[0] - 60, e[1] - 60, 120, 120); }); }
  x.restore();
  var a = fadeIO(t, 0.6, 6.6, 0.5);
  text(typed('Before the machines arrived,', ph(t, 0.8, 2.6)), W / 2, H - BAR - 120, 46, F.mono, 'rgba(217,230,255,' + a + ')', { glow: 'rgba(80,140,255,.6)' });
  text(typed('a man imagined them.', ph(t, 3.0, 4.4)), W / 2, H - BAR - 60, 46, F.mono, 'rgba(217,230,255,' + a + ')', { glow: 'rgba(80,140,255,.6)' });
}

// 2 · The author (7–15): painted sky, magazine-style title card.
function sAuthor(t) {
  var lt = t - 7, z = 1 + lt * 0.012;
  x.save(); x.translate(W / 2, H / 2); x.scale(z, z); x.translate(-W / 2, -H / 2);
  var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120a26'); g.addColorStop(0.5, '#4a1840'); g.addColorStop(0.8, '#c8502e'); g.addColorStop(1, '#f2a65a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  var r = rng(3); for (var i = 0; i < 400; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.6) + ')'; x.fillRect(r() * W, r() * H * 0.6, 1.6, 1.6); }
  var px = W * 0.7, py = H * 0.36, pr = 260; g = x.createRadialGradient(px - pr * 0.4, py - pr * 0.4, 20, px, py, pr); g.addColorStop(0, '#ffe7c2'); g.addColorStop(0.55, '#b0402a'); g.addColorStop(1, '#0b0710');
  x.strokeStyle = 'rgba(246,212,138,.6)'; x.lineWidth = 22; x.beginPath(); x.ellipse(px, py, pr * 1.9, pr * 0.42, -0.35, Math.PI, Math.PI * 2); x.stroke();
  x.fillStyle = g; x.beginPath(); x.arc(px, py, pr, 0, 6.283); x.fill();
  x.beginPath(); x.ellipse(px, py, pr * 1.9, pr * 0.42, -0.35, 0, Math.PI); x.stroke();
  x.fillStyle = '#1c0b10'; x.beginPath(); x.moveTo(0, H); r = rng(8); for (var X = 0; X <= W + 100; X += 110) x.lineTo(X, H * 0.84 + (r() - 0.5) * 70); x.lineTo(W, H); x.fill();
  x.restore();
  halftone(0.12, 8);
  var a = fadeIO(t, 7, 15, 0.7), slam = easeOut(ph(t, 7.4, 8.1));
  x.save(); x.globalAlpha = a; x.translate(170, 420); x.scale(lerp(1.5, 1, slam), lerp(1.5, 1, slam));
  font(210, F.display, 'italic'); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
  x.fillStyle = '#000'; x.fillText('ISAAC', 12, 12); x.fillText('ASIMOV', 12, 222);
  x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeText('ISAAC', 0, 0); x.strokeText('ASIMOV', 0, 210);
  x.fillStyle = C.red; x.fillText('ISAAC', 0, 0); x.fillText('ASIMOV', 0, 210);
  x.restore();
  var b = a * ph(t, 8.6, 9.4);
  text('1920 – 1992', 180, 720, 64, F.display, 'rgba(255,240,210,' + b + ')', { align: 'left', track: 6 });
  var c2 = a * ph(t, 9.6, 10.4);
  text('Biochemist. Professor. Author or editor of more than 500 books.', 180, 800, 40, F.serif, 'rgba(255,240,210,' + c2 + ')', { align: 'left', style: 'italic' });
  var d2 = a * ph(t, 11, 11.8);
  text('He coined the word “robotics.”', 180, 860, 40, F.serif, 'rgba(255,214,140,' + d2 + ')', { align: 'left', style: 'italic' });
}

// 3 · The Three Laws (15–27): typed onto the newsprint sheet.
var LAWS = [
  'A robot may not injure a human being or, through inaction, allow a human being to come to harm.',
  'A robot must obey the orders given it by human beings except where such orders would conflict with the First Law.',
  'A robot must protect its own existence as long as such protection does not conflict with the First or Second Law.'
];
function sLaws(t) {
  paperBg(); halftone(0.04, 7);
  var a = fadeIO(t, 15, 27, 0.6);
  x.save(); x.globalAlpha = a;
  text('SCIENCE FACT AND FICTION', W - 200, 170, 40, F.display, C.rust, { align: 'right' });
  text('1942 · “RUNAROUND”', 200, 190, 44, F.display, C.ink, { align: 'left', track: 4 });
  var hk = easeOut(ph(t, 15.3, 16.1));
  font(140, F.display); x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = C.ink;
  x.fillText('THE THREE LAWS', 200 - (1 - hk) * 80, 340);
  x.fillStyle = C.rust; x.fillRect(200, 372, 1520 * easeOut(ph(t, 15.8, 16.8)), 7);
  var y0 = 470;
  for (var i = 0; i < 3; i++) {
    var s = 16.8 + i * 3.2, k = ph(t, s, s + 2.4);
    font(50, F.serif); var lines = wrap(LAWS[i], 1380), yy = y0; y0 += lines.length * 62 + 44;
    if (k <= 0) continue;
    var shown = typed(LAWS[i], k), used = 0;
    text((i + 1) + '.', 200, yy, 72, F.display, C.ink, { align: 'left', base: 'alphabetic' });
    lines.forEach(function (ln, j) { var take = Math.max(0, Math.min(ln.length, shown.length - used)); used += ln.length + 1; if (take) text(ln.slice(0, take), 300, yy + j * 62, 50, F.serif, C.ink, { align: 'left', base: 'alphabetic' }); });
  }
  x.restore();
}

// 4 · The beginning of technology (27–40): a timeline that tracks past the camera.
var TL = [
  [1950, 'I, Robot is published', 'Nine stories built on the Three Laws.'],
  [1961, 'Unimate goes to work', 'The first industrial robot joins a General Motors assembly line.'],
  [1984, 'The Terminator', 'Hollywood imagines a machine with no laws at all.'],
  [1997, 'Deep Blue beats Kasparov', 'A computer defeats the reigning world chess champion.']
];
function sTimeline(t) {
  bg('#0b0d14');
  var lt = t - 27, span = 12.6, k = clamp(lt / span), cam = lerp(-200, TL.length * 520 - 1400, ease(k));
  x.save(); x.globalAlpha = fadeIO(t, 27, 40, 0.5);
  text('THE BEGINNING OF TECHNOLOGY', W / 2, BAR + 70, 44, F.display, C.gold, { track: 10 });
  x.strokeStyle = 'rgba(241,220,188,.35)'; x.lineWidth = 3; x.beginPath(); x.moveTo(0, 620); x.lineTo(W, 620); x.stroke();
  for (var i = 0; i < 80; i++) { var tx = i * 60 - (cam % 60); x.fillStyle = 'rgba(241,220,188,.25)'; x.fillRect(tx, 612, 2, 16); }
  TL.forEach(function (e, i) {
    var cx = 360 + i * 520 - cam, near = 1 - Math.min(1, Math.abs(cx - W / 2) / 900);
    if (cx < -500 || cx > W + 500) return;
    var pop = easeOut(clamp(near * 1.6));
    x.save(); x.translate(cx, 620); x.scale(0.8 + 0.2 * pop, 0.8 + 0.2 * pop);
    x.fillStyle = i === 2 ? C.red : C.gold; x.beginPath(); x.arc(0, 0, 14, 0, 6.283); x.fill();
    x.globalAlpha *= 0.35 + 0.65 * pop;
    text(String(e[0]), 0, -150, 150, F.display, i === 2 ? C.red : C.paper, {});
    text(e[1].toUpperCase(), 0, 90, 46, F.display, C.paper, { track: 2 });
    font(30, F.serif, 'italic'); wrap(e[2], 460).forEach(function (ln, j) { text(ln, 0, 150 + j * 40, 30, F.serif, 'rgba(241,220,188,.8)', { style: 'italic' }); });
    x.restore();
  });
  x.restore();
  if (lt > 5.4 && lt < 8.2) { x.save(); x.globalAlpha = 0.06 * Math.sin(lt * 40); x.fillStyle = C.red; x.fillRect(0, 0, W, H); x.restore(); } // 1984: a red flicker
}

// 5 · Pre-clip title (40–44.6)
function sPreClip(t) {
  bg('#000');
  var a = fadeIO(t, 40, 44.6, 0.5);
  text('2004.', W / 2, H / 2 - 70, 120, F.display, 'rgba(241,220,188,' + a + ')', { track: 8 });
  text(typed('Hollywood asked what happens when the machines stop listening.', ph(t, 40.8, 43.4)), W / 2, H / 2 + 60, 44, F.mono, 'rgba(241,220,188,' + a + ')');
}

// 6 · The clip (44.6–48.6): frame + credit; ffmpeg fills CLIP_RECT.
function sClip(t) {
  bg('#000');
  x.strokeStyle = 'rgba(241,220,188,.4)'; x.lineWidth = 2; x.strokeRect(CLIP_RECT.x - 10, CLIP_RECT.y - 10, CLIP_RECT.w + 20, CLIP_RECT.h + 20);
  text('I, ROBOT (2004) · 20TH CENTURY FOX · EXCERPT', W / 2, CLIP_RECT.y + CLIP_RECT.h + 60, 24, F.display, 'rgba(241,220,188,.55)', { track: 6 });
}

// 7 · Then fiction caught up (48.6–62): fast cuts, glitch transitions.
var AI = [
  ['2012', 'AlexNet', 'Deep learning learns to see.'],
  ['2016', 'AlphaGo', 'A machine beats a Go champion, 4 games to 1.'],
  ['2017', '“Attention Is All You Need”', 'The Transformer is born.'],
  ['2022', 'ChatGPT', 'Talking to a machine goes mainstream.'],
  ['TODAY', 'Isaac', 'NVIDIA names its robotics platform after him.']
];
function sAI(t) {
  bg(C.night);
  var lt = t - 48.6;
  if (lt < 2.0) { // impact + title
    var k = easeOut(ph(t, 48.6, 49.2));
    x.fillStyle = 'rgba(255,244,220,' + (1 - ph(t, 48.6, 49.0)) * 0.8 + ')'; x.fillRect(0, 0, W, H);
    text('THEN FICTION CAUGHT UP.', W / 2, H / 2, lerp(220, 150, k), F.display, C.paper, { track: 4 });
    return;
  }
  var idx = Math.min(AI.length - 1, Math.floor((lt - 2.0) / 2.3)), lk = ((lt - 2.0) % 2.3) / 2.3, e = AI[idx];
  // grid floor
  x.save(); x.strokeStyle = 'rgba(61,127,224,.25)'; x.lineWidth = 2;
  for (var i = -20; i <= 20; i++) { x.beginPath(); x.moveTo(W / 2 + i * 40, H * 0.62); x.lineTo(W / 2 + i * 260, H); x.stroke(); }
  for (var j = 0; j < 10; j++) { var yy = H * 0.62 + Math.pow((j + (lt * 1.5 % 1)) / 10, 2) * H * 0.38; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
  x.restore();
  var inK = easeOut(clamp(lk * 5)), out = clamp((lk - 0.88) * 8);
  x.save(); x.globalAlpha = 1 - out;
  text(e[0], W / 2, 330, lerp(260, 220, inK), F.display, idx === 4 ? C.gold : C.blue, { glow: 'rgba(61,127,224,.7)', blur: 40, track: 6 });
  text(e[1].toUpperCase(), W / 2, 560, 92, F.display, C.paper, { track: 2 });
  text(e[2], W / 2, 660, 44, F.serif, 'rgba(241,220,188,.85)', { style: 'italic' });
  x.restore();
  if (lk < 0.08 || lk > 0.92) { // glitch slices at the cuts
    var r = rng(Math.floor(lt * 30) + 1); for (var s = 0; s < 14; s++) { var sy = r() * H, sh = 6 + r() * 40; x.drawImage(c, 0, sy, W, sh, (r() - 0.5) * 120, sy, W, sh); }
  }
}

// 8 · Why it matters (62–72)
var WHY = [[62.2, 64.6, 'He didn’t predict the machines.'], [64.6, 67.0, 'He predicted the question.'], [67.0, 69.6, 'How do we make them safe?'], [69.6, 72.0, 'Every AI safety debate still starts where he did.']];
function sWhy(t) {
  paperBg(); halftone(0.04, 7);
  WHY.forEach(function (w, i) {
    if (t < w[0] || t >= w[1]) return;
    var k = easeOut(ph(t, w[0], w[0] + 0.6)), a = fadeIO(t, w[0], w[1], 0.4);
    var big = i === 2;
    x.save(); x.globalAlpha = a; x.translate(0, (1 - k) * 30);
    if (big) text(w[2].toUpperCase(), W / 2, H / 2, 150, F.display, C.rust, {});
    else text(w[2], W / 2, H / 2, i === 3 ? 66 : 92, F.serif, C.ink, { style: 'italic' });
    x.restore();
  });
  x.fillStyle = C.rust; x.fillRect(W / 2 - 300, H / 2 + 130, 600 * ph(t, 62.2, 72), 5);
}

// 9 · Close (72–82): the pair of coins, the token, the books.
function coin(cx, cy, r, spin, fic) {
  var sx = Math.cos(spin), face = sx >= 0;
  x.save(); x.translate(cx, cy);
  x.fillStyle = fic ? '#8a6420' : '#4f6e2c'; x.beginPath(); x.ellipse(6 * Math.sign(sx || 1), 0, Math.max(6, Math.abs(sx) * r), r, 0, 0, 6.283); x.fill();
  x.scale(Math.max(0.04, Math.abs(sx)), 1);
  var g = x.createRadialGradient(-r * 0.3, -r * 0.4, 10, 0, 0, r);
  if (fic) { g.addColorStop(0, '#ffd27a'); g.addColorStop(0.55, C.red); g.addColorStop(1, '#4a0e0c'); } else { g.addColorStop(0, '#d4f58a'); g.addColorStop(0.55, '#3f7a12'); g.addColorStop(1, '#0d1f05'); }
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 6.283); x.fill();
  x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 5; x.beginPath(); x.arc(0, 0, r - 18, 0, 6.283); x.stroke();
  if (face) text(fic ? '$A' : 'NVDAx', 0, 6, fic ? r * 0.7 : r * 0.42, F.display, '#fff', {});
  x.restore();
}
function sClose(t) {
  bg('#120a10');
  var g = x.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H * 0.45, W * 0.6); g.addColorStop(0, 'rgba(216,50,43,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  var r = rng(11); for (var i = 0; i < 300; i++) { x.fillStyle = 'rgba(255,220,170,' + r() * 0.6 + ')'; x.fillRect(r() * W, r() * H, 2, 2); }
  var a = Math.min(1, ph(t, 72, 72.8)) * (1 - ph(t, 81, 82));
  x.save(); x.globalAlpha = a;
  var ang = (t - 72) * 1.1, R = 230;
  var ax = W / 2 + Math.cos(ang) * R, az = Math.sin(ang), bx = W / 2 - Math.cos(ang) * R;
  var first = az > 0 ? [bx, false] : [ax, true], second = az > 0 ? [ax, true] : [bx, false];
  // swap particles between the coins
  for (var p = 0; p < 60; p++) { var u = ((t * 0.6 + p / 60) % 1), dir = p % 2, uu = dir ? 1 - u : u; x.fillStyle = dir ? 'rgba(168,255,74,.8)' : 'rgba(255,199,90,.85)'; x.fillRect(lerp(ax, bx, uu), 340 + Math.sin(uu * Math.PI + p) * 40 * Math.sin(uu * Math.PI), 4, 4); }
  coin(first[0], 340, 118, (t - 72) * 2.2 + (first[1] ? 0 : 1), first[1]);
  coin(second[0], 340, 130, (t - 72) * 2.2 + (second[1] ? 0 : 1), second[1]);
  var tk = easeOut(ph(t, 73.4, 74.2));
  x.save(); x.translate(W / 2, 640); x.scale(lerp(1.4, 1, tk), lerp(1.4, 1, tk)); x.globalAlpha *= tk;
  font(210, F.display, 'italic'); x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  x.fillStyle = '#000'; x.fillText('$ASIMOV', 12, 12); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeText('$ASIMOV', 0, 0); x.fillStyle = C.red; x.fillText('$ASIMOV', 0, 0);
  x.restore();
  text('SCIENCE FICTION · SCIENCE FACT', W / 2, 790, 46, F.display, 'rgba(241,220,188,' + ph(t, 74.4, 75.2) + ')', { track: 12 });
  text('Paired with NVDAx on StonkFun. Read the originals.', W / 2, 860, 36, F.serif, 'rgba(255,214,140,' + ph(t, 75.6, 76.4) + ')', { style: 'italic' });
  text('Not financial advice. Not affiliated with NVIDIA, 20th Century Studios, Hugging Face or the Asimov estate. R-7 and the Meridian Collider are fictional. I, Robot dialogue excerpt used for commentary.', W / 2, H - BAR - 30, 20, F.mono, 'rgba(241,220,188,' + 0.6 * ph(t, 76, 77) + ')');
  x.restore();
}


window.S2D = { sAuthor: sAuthor, sLaws: sLaws, sTimeline: sTimeline, sAI: sAI, sWhy: sWhy, sClose: sClose, vignette: vignette, film: film, bars: bars, ctx: x, W: W, H: H, text: text, easeOut: easeOut, ph: ph, clamp: clamp, C: C, F: F };
})();

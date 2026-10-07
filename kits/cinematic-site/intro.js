/* intro.js — the cinematic opening (three.js r128 + robot3d.js + cat.js art).
   ~11.5s, skippable, once per browser session; off for reduced motion or without WebGL; footer link replays it.
   1  black → R-7's eyes ignite in extreme close-up            "1942. A writer imagines machines that think."
   2  pull back and orbit: R-7 in a shaft of light, three holographic rings carry the Three Laws
   3  the tabby pops onto its shoulder; R-7 turns to look      "Every robot needs an editor."
   4  the rings collapse in a flash, the $Asimov masthead slams in, the screen splits open on the page
   ?introT=6 freezes the sequence at that second (for review screenshots). */
(function () {
  'use strict';
  var KEY = 'asimov-intro-seen';
  var FIX = /[?&]introT=([\d.]+)/.exec(location.search);
  var forced = location.hash === '#intro' || !!FIX;
  function seen() { try { return sessionStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function markSeen() { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} }
  var T = window.THREE;
  if (!T || !window.AsimovRobot) return;
  if (!forced && (seen() || window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  try { var tc = document.createElement('canvas'); if (!(tc.getContext('webgl') || tc.getContext('experimental-webgl'))) return; } catch (e) { return; }

  /* ── stage DOM (letterbox, grain, vignette, captions, skip) ── */
  var root = document.createElement('div');
  root.className = 'cine';
  root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Opening sequence');
  root.innerHTML =
    '<div class="cine-bar top"></div><div class="cine-bar bot"></div>' +
    '<p class="cine-cap" id="cine-cap" aria-live="polite"></p>' +
    '<button type="button" class="cine-skip" id="cine-skip">Skip intro ›</button>' +
    '<div class="cine-grain"></div><div class="cine-vig"></div><div class="cine-flash"></div>';
  document.body.appendChild(root);
  document.documentElement.classList.add('cine-on');
  var cap = root.querySelector('#cine-cap'), flashEl = root.querySelector('.cine-flash');

  var W = window.innerWidth, H = window.innerHeight, narrow = W < 700;
  var renderer = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, narrow ? 1.25 : 1.6));
  renderer.setSize(W, H); renderer.setClearColor(0x020306, 1);
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.9;
  renderer.domElement.className = 'cine-gl';
  root.insertBefore(renderer.domElement, root.firstChild);

  var scene = new T.Scene(); scene.fog = new T.FogExp2(0x020306, 0.08);
  var camera = new T.PerspectiveCamera(30, W / H, 0.02, 80);
  var env = AsimovRobot.studio(renderer);
  var composer = null, bloom = null;
  if (T.EffectComposer && T.UnrealBloomPass) {
    composer = new T.EffectComposer(renderer); composer.addPass(new T.RenderPass(scene, camera));
    bloom = new T.UnrealBloomPass(new T.Vector2(W, H), 1.1, 0.6, 0.8); composer.addPass(bloom);
  }

  function canvasTex(w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { v = clamp(v); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }
  function out(v) { v = clamp(v); return 1 - Math.pow(1 - v, 3); }
  function back(v) { v = clamp(v); var c = 1.9; return 1 + (c + 1) * Math.pow(v - 1, 3) + c * Math.pow(v - 1, 2); }
  function ph(t, a, b) { return clamp((t - a) / (b - a)); }
  function lerp(a, b, k) { return a + (b - a) * k; }

  /* ── R-7 ── */
  var bot = AsimovRobot.create({ eye: 0xffc04a, envMap: env }); scene.add(bot.root);
  bot.root.position.set(0, -2.95, 0);                                 // head near the origin
  var HEAD = new T.Vector3(0, 0.22, 0);  // the visor line

  // lights: hard key from above (the shaft), cyan rim, rust kicker
  var key = new T.SpotLight(0xfff0d8, 0, 14, 0.42, 0.55, 1.2); key.position.set(0.6, 6.5, 1.2); key.target.position.set(0, -0.5, 0); scene.add(key); scene.add(key.target);
  var rim = new T.DirectionalLight(0x5ab0ff, 0); rim.position.set(3, 1.5, -3); scene.add(rim);
  var kick = new T.DirectionalLight(0xff4a22, 0); kick.position.set(-3.5, -0.5, -1.5); scene.add(kick);
  var amb = new T.AmbientLight(0x202838, 0.0); scene.add(amb);

  // the shaft of light: an open cone, brightest at its core
  var beamTex = canvasTex(64, 256, function (g, w, h) { var gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,240,215,0)'); gr.addColorStop(0.5, 'rgba(255,240,215,1)'); gr.addColorStop(1, 'rgba(255,240,215,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); var v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.3, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = v; g.fillRect(0, 0, w, h); });
  var beam = new T.Mesh(new T.CylinderGeometry(0.25, 2.2, 8, 48, 1, true), new T.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
  beam.position.set(0.3, 2.4, 0.2); scene.add(beam);

  // dust motes drifting through the shaft
  var DUST = narrow ? 500 : 900, dg = new T.BufferGeometry(), dp = new Float32Array(DUST * 3), ds = [];
  for (var i = 0; i < DUST; i++) { ds.push([Math.random() * 6.283, Math.random() * 2.2, Math.random() * 7 - 3.5, 0.2 + Math.random() * 0.6]); }
  dg.setAttribute('position', new T.BufferAttribute(dp, 3));
  var dotTex = canvasTex(32, 32, function (g) { var r = g.createRadialGradient(16, 16, 1, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
  var dust = new T.Points(dg, new T.PointsMaterial({ color: 0xffe2b0, size: 0.03, map: dotTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending }));
  scene.add(dust);

  // the Three Laws as holographic rings around the head
  var LAWS = [
    'I · A ROBOT MAY NOT INJURE A HUMAN BEING OR, THROUGH INACTION, ALLOW A HUMAN BEING TO COME TO HARM · ',
    'II · A ROBOT MUST OBEY THE ORDERS GIVEN IT BY HUMAN BEINGS EXCEPT WHERE SUCH ORDERS WOULD CONFLICT WITH THE FIRST LAW · ',
    'III · A ROBOT MUST PROTECT ITS OWN EXISTENCE AS LONG AS SUCH PROTECTION DOES NOT CONFLICT WITH THE FIRST OR SECOND LAW · '
  ];
  var rings = LAWS.map(function (txt, k) {
    var tex = canvasTex(4096, 96, function (g, w, h) {
      g.font = '600 52px Oswald, "Arial Narrow", sans-serif'; g.textBaseline = 'middle'; g.fillStyle = k === 0 ? '#ffd27a' : '#9fe8ff';
      g.shadowColor = g.fillStyle; g.shadowBlur = 12; var x = 0, s = txt; while (x < w) { g.fillText(s, x, h / 2); x += g.measureText(s).width; }
      g.shadowBlur = 0; g.fillRect(0, 4, w, 2); g.fillRect(0, h - 6, w, 2);
    });
    tex.wrapS = T.RepeatWrapping;
    var m = new T.Mesh(new T.CylinderGeometry(0.95 + k * 0.17, 0.95 + k * 0.17, 0.11, 128, 1, true), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
    m.position.copy(HEAD); m.rotation.set(0.28 - k * 0.24, 0, -0.18 + k * 0.2); scene.add(m); return m;
  });

  // the cat on R-7's shoulder (cat.js art drawn onto a billboard)
  var catSprite = null;
  if (window.CatArt) {
    var img = new Image(), catTex = new T.Texture(img); catTex.encoding = T.sRGBEncoding;
    img.onload = function () { catTex.needsUpdate = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(CatArt.svg('sit', 'introcat').replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" '));
    catSprite = new T.Sprite(new T.SpriteMaterial({ map: catTex, transparent: true, depthWrite: false }));
    catSprite.center.set(0.5, 0.03); catSprite.scale.set(0.001, 0.001, 1); scene.add(catSprite);
  }
  var shoulder = new T.Vector3();

  // the masthead card, drawn in the magazine's own type
  var mastTex = null, mast = null;
  function buildMast() {
    mastTex = canvasTex(2048, 820, function (g, w, h) {
      g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      g.font = 'italic 400 330px "Bowlby One", Anton, Impact, sans-serif';
      g.fillStyle = '#000'; g.fillText('$Asimov', w / 2 + 22, 452);
      g.strokeStyle = '#fff'; g.lineWidth = 18; g.strokeText('$Asimov', w / 2, 430);
      g.fillStyle = '#d8322b'; g.fillText('$Asimov', w / 2, 430);
      g.font = '400 92px Anton, Impact, sans-serif'; if (g.letterSpacing !== undefined) g.letterSpacing = '38px';
      var line = 'SCIENCE FINANCE';
      g.fillStyle = '#000'; g.fillText(line, w / 2 + 6, 606); g.fillStyle = '#f6efe2'; g.fillText(line, w / 2, 600);
      g.fillStyle = '#d8322b'; var full = g.measureText(line).width, sx = w / 2 - full / 2; g.textAlign = 'left';
      g.fillText('S', sx, 600); g.fillText('F', sx + g.measureText('SCIENCE ').width, 600);
    });
    mast = new T.Mesh(new T.PlaneGeometry(4.6, 1.84), new T.MeshBasicMaterial({ map: mastTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    scene.add(mast);
  }
  // a light sweep that crosses the masthead
  var sweep = new T.Mesh(new T.PlaneGeometry(0.6, 2.4), new T.MeshBasicMaterial({ map: beamTex, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
  scene.add(sweep);

  /* ── the timeline ── */
  var END = 11.4, OUTT = 0.9;
  var CAPS = [[0.7, 3.3, '1942. A writer imagines machines that think.'], [3.6, 6.0, 'He gave them three laws.'], [6.6, 8.6, 'Every robot needs an editor.'], [9.4, 11.2, 'Science fiction. Science fact.']];

  function frame(t) {
    // eyes ignite (flicker) and settle
    var ign = t < 1.0 ? 0 : t < 1.45 ? ((Math.floor(t * 22) % 2) ? 1 : 0.15) : 1;
    bot.setEye(0xffc04a, ign * (t > 6.4 && t < 9 ? 1.15 : 1));
    key.intensity = 4.2 * out(ph(t, 1.6, 3.2)); rim.intensity = 2.6 * out(ph(t, 1.2, 2.6)); kick.intensity = 1.4 * out(ph(t, 2.0, 3.4)); amb.intensity = 0.5 * ph(t, 2, 4);
    beam.material.opacity = 0.16 * out(ph(t, 2.2, 3.6)) * (1 - ph(t, 8.6, 9.2) * 0.6);
    dust.material.opacity = 0.75 * out(ph(t, 2.4, 4));
    for (var i = 0; i < DUST; i++) { var d = ds[i], a = d[0] + t * 0.05; dp[i * 3] = 0.3 + Math.cos(a) * d[1]; dp[i * 3 + 1] = ((d[2] + t * d[3] * 0.25 + 3.5) % 7) - 3.5; dp[i * 3 + 2] = 0.2 + Math.sin(a) * d[1]; }
    dg.attributes.position.needsUpdate = true;

    // the Laws: each ring arrives, lights, and spins; at 8.6 they collapse inward in a flash
    var collapse = ease(ph(t, 8.6, 9.25));
    rings.forEach(function (r, k) {
      var on = out(ph(t, 3.3 + k * 0.6, 3.9 + k * 0.6));
      r.material.opacity = on * (1 - collapse) * (k === 0 ? 1 : 0.85);
      var s = lerp(1.35, 1, on) * (1 - collapse * 0.92); r.scale.set(s, 1, s);
      r.rotation.y = t * (0.45 + k * 0.12) * (k % 2 ? -1 : 1);
      r.material.map.offset.x = -t * 0.015;
    });

    // R-7: head lifts as it wakes, turns to the cat, back to camera for the title
    var wake = ease(ph(t, 1.2, 3.0)), look = ease(ph(t, 6.6, 7.3)) * (1 - ease(ph(t, 8.4, 9.0)));
    bot.pose({ headPitch: lerp(0.38, 0.0, wake) + look * 0.12, headYaw: look * 0.62, headRoll: look * -0.1, chestPitch: lerp(0.08, 0, wake), chestYaw: look * 0.08,
      armL: { shoulder: [0.06, 0, -0.14], elbow: -0.3 }, armR: { shoulder: [0.06, 0, 0.14], elbow: -0.3 } });

    // the cat pops onto the right shoulder
    if (catSprite) {
      bot.root.updateMatrixWorld(true);
      bot.joints.armR.shoulder.getWorldPosition(shoulder);
      var pop = back(ph(t, 6.0, 6.55));
      catSprite.position.set(shoulder.x + 0.05, shoulder.y + 0.1, shoulder.z + 0.04);
      catSprite.scale.set(0.42 * pop, 0.63 * pop, 1);
      catSprite.material.opacity = (pop > 0 ? 1 : 0) * (1 - ph(t, 9.0, 9.4));
    }

    // the masthead slams in front of R-7
    if (mast) {
      var slam = out(ph(t, 9.1, 9.5));
      mast.material.opacity = slam;
    }

    // camera: macro on the visor → orbit out → over the shoulder toward the cat → square on the title
    var p = new T.Vector3(), tg = HEAD.clone();
    if (t < 2.8) { var a0 = ph(t, 0, 2.8); p.set(lerp(0.06, 0.16, a0), 0.23, lerp(1.25, 1.55, a0)); camera.fov = narrow ? 30 : 20; }
    else if (t < 6.2) { var a1 = ease(ph(t, 2.8, 6.2)), ang = lerp(0.15, 0.75, a1), dist = lerp(1.55, narrow ? 4.6 : 3.4, a1); p.set(Math.sin(ang) * dist, lerp(0.23, 0.05, a1), Math.cos(ang) * dist); tg.set(0, lerp(0.22, -0.25, a1), 0); camera.fov = lerp(22, 34, a1); }
    else if (t < 8.6) { var a2 = ease(ph(t, 6.2, 8.6)); p.set(lerp(2.3, 1.75, a2) * (narrow ? 1.3 : 1), lerp(0.05, 0.3, a2), lerp(2.5, 2.1, a2) * (narrow ? 1.3 : 1)); tg.set(lerp(0, 0.4, a2), lerp(-0.25, 0.0, a2), 0); camera.fov = lerp(34, 30, a2); }
    else { var a3 = ease(ph(t, 8.6, 9.6)), push = ease(ph(t, 9.8, 11.4)); p.set(lerp(1.75, 0, a3), lerp(0.3, 0.05, a3), lerp(2.1, 3.6, a3) - push * 0.8); tg.set(lerp(0.4, 0, a3), lerp(0.0, -0.1, a3), 0); camera.fov = narrow ? 52 : 34; }
    var shake = t > 9.1 && t < 9.7 ? (1 - ph(t, 9.1, 9.7)) * 0.03 : 0;
    p.x += Math.sin(t * 91) * shake; p.y += Math.cos(t * 77) * shake;
    camera.position.copy(p); camera.lookAt(tg); camera.updateProjectionMatrix();
    if (mast) {
      mast.position.set(0, -0.05, 1.25); mast.lookAt(camera.position);
      var dd = camera.position.distanceTo(mast.position), visW = 2 * dd * Math.tan(camera.fov * Math.PI / 360) * camera.aspect;
      var fit = Math.min(1, (visW * 0.86) / 4.6), sc2 = lerp(1.9, 1, out(ph(t, 9.1, 9.5))) * fit; mast.scale.set(sc2, sc2, 1);
    }
    sweep.position.set(lerp(-3.2, 3.2, ph(t, 9.7, 10.5)), -0.05, 1.32); sweep.lookAt(camera.position); sweep.rotateZ(-0.5);
    sweep.material.opacity = t > 9.7 && t < 10.5 ? 0.55 : 0;
    if (bloom) bloom.strength = (t > 9.6 ? 0.45 : 1.0) + (t > 8.9 && t < 9.4 ? (1 - Math.abs(t - 9.15) / 0.25) * 2.5 : 0);

    flashEl.style.opacity = t > 9.0 && t < 9.5 ? String(0.75 * (1 - Math.abs(t - 9.2) / 0.3)) : '0';
    var c = ''; CAPS.forEach(function (x) { if (t >= x[0] && t < x[1]) c = x[2].slice(0, Math.ceil(x[2].length * clamp((t - x[0]) / 0.9))); });
    if (cap.textContent !== c) cap.textContent = c;
    if (composer) composer.render(); else renderer.render(scene, camera);
  }

  var start = 0, ending = -1, done = false;
  function loop(now) {
    if (done) return;
    if (!start) start = now;
    var t = FIX ? +FIX[1] : (now - start) / 1000;
    if (!FIX && ending < 0 && t >= END) finish();
    frame(t);
    if (!FIX) requestAnimationFrame(loop);
  }
  function size() { W = window.innerWidth; H = window.innerHeight; renderer.setSize(W, H); if (composer) composer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); }
  window.addEventListener('resize', size);

  function finish() {
    if (ending >= 0) return;
    ending = performance.now(); markSeen();
    root.classList.add('out');
    setTimeout(function () {
      done = true; window.removeEventListener('resize', size);
      renderer.dispose(); root.remove(); document.documentElement.classList.remove('cine-on');
      var hero = document.getElementById('hero-cover');
      if (hero) { hero.classList.remove('print'); void hero.offsetWidth; hero.classList.add('print'); }
    }, OUTT * 1000);
  }
  root.querySelector('#cine-skip').addEventListener('click', finish);
  document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter') { finish(); document.removeEventListener('keydown', onKey); } });
  root.querySelector('#cine-skip').focus({ preventScroll: true });

  // wait for the pulp fonts so the masthead and rings are drawn in the right type
  var ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('italic 330px "Bowlby One"'), document.fonts.load('400 92px Anton'), document.fonts.load('600 52px Oswald')]).catch(function () {}) : Promise.resolve();
  var go = false; function begin() { if (go) return; go = true; buildMast(); requestAnimationFrame(loop); }
  ready.then(begin); setTimeout(begin, 1200);
})();

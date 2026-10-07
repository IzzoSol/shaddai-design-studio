/* three-scenes.js — WebGL upgrades for the $ASIMOV page (three.js r128, UMD global THREE).
   1. Shelf3D: the "Read the originals" swivel as real books (cover, spine, page edges) on a lit turntable.
   2. PairOrbit: $ASIMOV and NVDAx as two coins orbiting each other, with swap particles flowing between them.
   If THREE or WebGL is missing, nothing here runs and the CSS versions stay in place. */
(function () {
  'use strict';
  if (!window.THREE) return;
  var T = window.THREE;
  function hasGL() { try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); } catch (e) { return false; } }
  if (!hasGL()) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DISPLAY = "'Anton','Impact','Arial Narrow Bold',sans-serif";
  var COND = "'Oswald','Arial Narrow',sans-serif";

  /* ── shared helpers ── */
  function makeRenderer(host) {
    var r = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.outputEncoding = T.sRGBEncoding;
    r.domElement.className = 'gl';
    host.appendChild(r.domElement);
    return r;
  }
  function tex(canvas) { var t = new T.CanvasTexture(canvas); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function wrapLines(ctx, text, max) {
    var words = text.split(' '), lines = [], line = '';
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line); return lines;
  }
  // Runs `frame` every animation frame while `el` is on screen and the tab is visible.
  function loopWhileVisible(el, frame) {
    var on = false, raf = 0, last = performance.now();
    function tick(now) { raf = 0; if (!on || document.hidden) return; var dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt, now / 1000); raf = requestAnimationFrame(tick); }
    function start() { if (!raf && on && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } }
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; start(); }, { rootMargin: '120px' }).observe(el);
    document.addEventListener('visibilitychange', start);
    return start;
  }

  /* ═════════════ 1. Shelf3D ═════════════ */
  function Shelf3D() {
    var Shelf = window.AsimovShelf, host = document.getElementById('swivel');
    if (!Shelf || !host || !window.CoverPaint) return;
    var BOOKS = Shelf.books, N = BOOKS.length, STEP = Math.PI * 2 / N;
    var BW = 1.25, BH = 1.875, BD = 0.22, R = 4.3;

    function coverTexCanvas(b, k) {
      var w = 512, h = 768, c = canvas(w, h);
      var ctx = CoverPaint.paintTo(c, { scene: b[3], seed: 300 + k, sky: b[4] || undefined }, w, h);
      var g = ctx.createLinearGradient(0, 0, 0, h * 0.38); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h * 0.38);
      ctx.font = '400 ' + Math.round(w * 0.12) + 'px ' + DISPLAY; ctx.textBaseline = 'top';
      var lines = wrapLines(ctx, b[0].toUpperCase(), w * 0.86);
      ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 4; ctx.fillStyle = '#fff';
      lines.forEach(function (l, i) { ctx.fillText(l, w * 0.07, w * 0.07 + i * w * 0.125); });
      ctx.shadowColor = 'transparent'; ctx.font = '600 ' + Math.round(w * 0.042) + 'px ' + COND; ctx.fillStyle = '#ffd98a';
      ctx.fillText('I S A A C   A S I M O V', w * 0.07, w * 0.1 + lines.length * w * 0.125);
      ctx.globalAlpha = 0.12; ctx.fillStyle = '#000';
      for (var y = 0; y < h; y += 5) for (var x = (y / 5) % 2 ? 2.5 : 0; x < w; x += 5) { ctx.beginPath(); ctx.arc(x, y, 1.1, 0, 6.283); ctx.fill(); }
      ctx.globalAlpha = 1;
      return c;
    }
    function spineTexCanvas(b) {
      var w = 96, h = 768, c = canvas(w, h), ctx = c.getContext('2d');
      var base = (b[4] || '#151515').split(',')[1] || '#151515';
      ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
      var g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(0.5, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.45)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.save(); ctx.translate(w * 0.62, h * 0.06); ctx.rotate(Math.PI / 2);
      ctx.font = '400 40px ' + DISPLAY; ctx.fillStyle = '#fff'; ctx.fillText(b[0].toUpperCase(), 0, 0);
      ctx.font = '600 22px ' + COND; ctx.fillStyle = '#ffd98a'; ctx.fillText('ASIMOV', h * 0.74, 0);
      ctx.restore();
      return c;
    }
    var pagesTex = (function () {
      var c = canvas(64, 256), ctx = c.getContext('2d'); ctx.fillStyle = '#efe2c6'; ctx.fillRect(0, 0, 64, 256);
      for (var i = 0; i < 64; i += 2) { ctx.fillStyle = i % 4 ? 'rgba(120,90,50,.18)' : 'rgba(255,255,255,.25)'; ctx.fillRect(i, 0, 1, 256); }
      return tex(c);
    })();
    var backTex = (function () { var c = canvas(256, 384), ctx = c.getContext('2d'); ctx.fillStyle = '#1d1410'; ctx.fillRect(0, 0, 256, 384); ctx.fillStyle = '#fff'; ctx.fillRect(150, 300, 80, 50); return tex(c); })();
    var shadowTex = (function () { var c = canvas(128, 128), ctx = c.getContext('2d'); var g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.65)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); })();

    var renderer = makeRenderer(host);
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(30, 2, 0.1, 60);
    scene.add(new T.AmbientLight(0xfff1dc, 0.55));
    var key = new T.DirectionalLight(0xffe2b8, 1.0); key.position.set(3, 5, 9); scene.add(key);
    var rim = new T.PointLight(0xd8322b, 2.2, 18); rim.position.set(-5, 2.5, -2); scene.add(rim);
    var gold = new T.PointLight(0xe8a21c, 1.2, 14); gold.position.set(5, -1, 3); scene.add(gold);
    var spot = new T.SpotLight(0xfff6e6, 1.1, 20, 0.38, 0.6); spot.position.set(0, 5, R + 5); spot.target.position.set(0, 0, R); scene.add(spot); scene.add(spot.target);

    // turntable disc
    var disc = new T.Mesh(new T.CylinderGeometry(R + 1.1, R + 1.25, 0.12, 96),
      new T.MeshStandardMaterial({ color: 0x2a1d16, roughness: 0.35, metalness: 0.25 }));
    disc.position.y = -BH / 2 - 0.07; scene.add(disc);
    var trim = new T.Mesh(new T.TorusGeometry(R + 1.18, 0.025, 8, 128), new T.MeshStandardMaterial({ color: 0xa5302a, emissive: 0x5a1010, roughness: 0.4 }));
    trim.rotation.x = Math.PI / 2; trim.position.y = -BH / 2 - 0.01; scene.add(trim);

    var group = new T.Group(); scene.add(group);
    var books = [], meshes = [];
    BOOKS.forEach(function (b, k) {
      var coverC = coverTexCanvas(b, k), coverT = tex(coverC);
      var mats = [
        new T.MeshStandardMaterial({ map: pagesTex, roughness: 0.9 }),                    // +x: fore-edge
        new T.MeshStandardMaterial({ map: tex(spineTexCanvas(b)), roughness: 0.55 }),     // -x: spine
        new T.MeshStandardMaterial({ map: pagesTex, roughness: 0.9 }),                    // +y
        new T.MeshStandardMaterial({ map: pagesTex, roughness: 0.9 }),                    // -y
        new T.MeshStandardMaterial({ map: coverT, roughness: 0.42, metalness: 0.04 }),    // +z: cover
        new T.MeshStandardMaterial({ map: backTex, roughness: 0.6 })                      // -z: back
      ];
      var mesh = new T.Mesh(new T.BoxGeometry(BW, BH, BD), mats); mesh.userData.k = k;
      var holder = new T.Group(), a = k * STEP;
      holder.position.set(Math.sin(a) * R, 0, Math.cos(a) * R); holder.rotation.y = a;
      var sh = new T.Mesh(new T.PlaneGeometry(BW * 1.6, BD * 6), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.position.y = -BH / 2 - 0.005;
      holder.add(mesh); holder.add(sh); group.add(holder);
      books.push({ mesh: mesh, holder: holder, cover: coverC, coverT: coverT, mats: mats, lift: 0, push: 0 });
      meshes.push(mesh);
    });

    // dust motes in the light
    var DUST = 260, dg = new T.BufferGeometry(), dp = new Float32Array(DUST * 3);
    for (var i = 0; i < DUST; i++) { dp[i * 3] = (Math.random() - 0.5) * 16; dp[i * 3 + 1] = (Math.random() - 0.3) * 6; dp[i * 3 + 2] = (Math.random() - 0.5) * 12; }
    dg.setAttribute('position', new T.BufferAttribute(dp, 3));
    var dust = new T.Points(dg, new T.PointsMaterial({ color: 0xffd9a0, size: 0.035, transparent: true, opacity: 0.55, depthWrite: false }));
    scene.add(dust);

    // switch the page over to 3D
    host.classList.add('is-3d');
    var cssRing = document.getElementById('ring'); if (cssRing) cssRing.hidden = true;
    Shelf.mode = '3d';

    var rot = 0, target = 0, front = -1, hovered = -1, idle = 0, dragging = false, x0 = 0, t0 = 0, moved = false, vel = 0, lastX = 0, lastT = 0;
    function frontIndex() { return ((Math.round(-rot / STEP) % N) + N) % N; }
    function snap(v) { return Math.round(v / STEP) * STEP; }
    Shelf.turn = function (d) { target = snap(target) - d * STEP; idle = 0; kick(); };

    function size() {
      var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); camera.aspect = w / h;
      var far = w < 560 ? 15.5 : w < 900 ? 12.5 : 10.8;
      camera.position.set(0, 1.25, R + far - 4); camera.lookAt(0, 0.05, R - 1.2);
      camera.updateProjectionMatrix(); kick();
    }
    new ResizeObserver(size).observe(host);

    var ray = new T.Raycaster(), ptr = new T.Vector2();
    function pick(e) {
      var r = renderer.domElement.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera); var hit = ray.intersectObjects(meshes)[0];
      return hit ? hit.object.userData.k : -1;
    }
    var el = renderer.domElement;
    el.addEventListener('pointerdown', function (e) { dragging = true; moved = false; x0 = lastX = e.clientX; t0 = target; lastT = performance.now(); vel = 0; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', function (e) {
      if (dragging) {
        var dx = e.clientX - x0; if (Math.abs(dx) > 4) moved = true;
        var now = performance.now(); vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
        target = rot = t0 + dx * 0.0065; kick();
      } else { var k = pick(e); if (k !== hovered) { hovered = k; el.style.cursor = k >= 0 ? 'pointer' : 'grab'; kick(); } }
    });
    function release(e) {
      if (!dragging) return; dragging = false; idle = 0;
      if (!moved) { var k = pick(e); if (k >= 0) { var d = ((k - frontIndex()) % N + N) % N; if (d > N / 2) d -= N; Shelf.turn(d); } return; }
      target = snap(target + vel * 0.35); kick();
    }
    el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', function () { hovered = -1; });

    if (!reduce) setInterval(function () {
      if (document.hidden || dragging || host.matches(':hover') || host.contains(document.activeElement)) { idle = 0; return; }
      if (++idle >= 4) { Shelf.turn(1); idle = 0; }
    }, 1000);

    var kick = loopWhileVisible(host, function (dt, t) {
      rot += (target - rot) * (dragging ? 1 : 1 - Math.pow(0.0015, dt));
      group.rotation.y = rot;
      var f = frontIndex();
      if (f !== front) { front = f; Shelf.plate(f); }
      books.forEach(function (b, k) {
        var isF = k === f, isH = k === hovered && !isF;
        b.lift += ((isF ? 0.16 : 0) - b.lift) * Math.min(1, dt * 7);
        b.push += ((isF ? 0.35 : isH ? 0.18 : 0) - b.push) * Math.min(1, dt * 7);
        b.mesh.position.set(0, b.lift + (isF && !reduce ? Math.sin(t * 1.6) * 0.03 : 0), b.push);
        b.mesh.rotation.x = isF ? -0.05 : 0;
        var dim = isF ? 1 : isH ? 0.85 : 0.6;
        b.mats[4].color.setScalar(b.mats[4].color.r + (dim - b.mats[4].color.r) * Math.min(1, dt * 6));
        b.mats[1].color.copy(b.mats[4].color);
      });
      if (!reduce) { dust.rotation.y = t * 0.02; dust.position.y = Math.sin(t * 0.3) * 0.15; }
      renderer.render(scene, camera);
    });
    size();

    // Real covers from Open Library when CORS allows; painted ones stay otherwise.
    function cacheGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function cacheSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function applyCover(b, id) {
      if (!id || id === 'none') return;
      var img = new Image(); img.crossOrigin = 'anonymous';
      img.onload = function () {
        if (img.naturalWidth < 20) return;
        var ctx = b.cover.getContext('2d'), cw = b.cover.width, ch = b.cover.height, s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        ctx.drawImage(img, (cw - img.naturalWidth * s) / 2, (ch - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
        b.coverT.needsUpdate = true; kick();
      };
      img.src = 'https://covers.openlibrary.org/b/id/' + id + '-L.jpg';
    }
    var started = false;
    new IntersectionObserver(function (es) {
      if (started || !es[0].isIntersecting) return; started = true;
      var q = books.map(function (b, k) { return k; });
      function next() {
        var k = q.shift(); if (k == null) return;
        var title = BOOKS[k][0], key = 'ol-cover:' + title, hit = cacheGet(key);
        if (hit) { applyCover(books[k], hit); return next(); }
        fetch('https://openlibrary.org/search.json?title=' + encodeURIComponent(title) + '&author=' + encodeURIComponent('Isaac Asimov') + '&fields=cover_i&limit=5')
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) { var d = j && (j.docs || []).find(function (x) { return x.cover_i; }); var id = d ? String(d.cover_i) : 'none'; cacheSet(key, id); applyCover(books[k], id); })
          .catch(function () {}).then(function () { setTimeout(next, 120); });
      }
      next(); next();
    }, { rootMargin: '400px' }).observe(host);
  }

  /* ═════════════ 2. PairOrbit ═════════════ */
  function PairOrbit() {
    var host = document.getElementById('orbit'); if (!host) return;
    function face(kind) {
      var s = 512, c = canvas(s, s), ctx = c.getContext('2d'), m = s / 2;
      var fic = kind === 'asimov';
      var g = ctx.createRadialGradient(m * 0.7, m * 0.6, 20, m, m, m);
      if (fic) { g.addColorStop(0, '#ffd27a'); g.addColorStop(0.55, '#d8322b'); g.addColorStop(1, '#4a0e0c'); }
      else { g.addColorStop(0, '#d4f58a'); g.addColorStop(0.55, '#3f7a12'); g.addColorStop(1, '#0d1f05'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(m, m, m - 26, 0, 6.283); ctx.stroke();
      ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(m, m, m - 70, 0, 6.283); ctx.stroke();
      // ring lettering
      var ring = fic ? '$ASIMOV · SCIENCE FICTION · 1942 · ' : 'NVDAx · SCIENCE FACT · BACKED 1:1 · ';
      ctx.font = '600 30px ' + COND; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      for (var i = 0; i < ring.length; i++) { var a = i / ring.length * 6.283; ctx.save(); ctx.translate(m + Math.sin(a) * (m - 48), m - Math.cos(a) * (m - 48)); ctx.rotate(a); ctx.fillText(ring[i], 0, 10); ctx.restore(); }
      if (fic) { // robot head
        ctx.fillStyle = '#1d1410'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(m - 70, m - 95, 140, 150, 34) : ctx.rect(m - 70, m - 95, 140, 150); ctx.fill();
        ctx.fillStyle = '#fff4d6'; ctx.shadowColor = '#fff4d6'; ctx.shadowBlur = 20; ctx.fillRect(m - 44, m - 45, 30, 16); ctx.fillRect(m + 14, m - 45, 30, 16); ctx.shadowBlur = 0;
        ctx.fillStyle = '#e8a21c'; ctx.fillRect(m - 30, m + 10, 60, 12); ctx.fillRect(m - 8, m - 120, 16, 26);
        ctx.font = '400 54px ' + DISPLAY; ctx.fillStyle = '#fff'; ctx.fillText('$A', m, m + 128);
      } else { // chip grid
        ctx.strokeStyle = 'rgba(220,255,160,.5)'; ctx.lineWidth = 3;
        for (var k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(m - 120, m + k * 30); ctx.lineTo(m + 120, m + k * 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(m + k * 30, m - 120); ctx.lineTo(m + k * 30, m + 120); ctx.stroke(); }
        ctx.fillStyle = '#0d1f05'; ctx.fillRect(m - 92, m - 56, 184, 112);
        ctx.font = '400 72px ' + DISPLAY; ctx.fillStyle = '#e9ffc2'; ctx.fillText('NVDAx', m, m + 26);
      }
      return tex(c);
    }
    var renderer = makeRenderer(host);
    var scene = new T.Scene(), camera = new T.PerspectiveCamera(34, 1, 0.1, 40);
    camera.position.set(0, 1.6, 6.2); camera.lookAt(0, 0, 0);
    scene.add(new T.AmbientLight(0xffffff, 0.6));
    var kl = new T.DirectionalLight(0xfff0d0, 1.2); kl.position.set(2, 4, 5); scene.add(kl);
    var rl = new T.PointLight(0xd8322b, 1.4, 12); rl.position.set(-3, 1, -2); scene.add(rl);
    var gl = new T.PointLight(0x76b900, 1.4, 12); gl.position.set(3, 1, -2); scene.add(gl);
    function coin(kind, edge) {
      var f = face(kind);
      var m = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.14, 72), [
        new T.MeshStandardMaterial({ color: edge, metalness: 0.75, roughness: 0.28 }),
        new T.MeshStandardMaterial({ map: f, metalness: 0.3, roughness: 0.4 }),
        new T.MeshStandardMaterial({ map: f, metalness: 0.3, roughness: 0.4 })
      ]);
      m.rotation.x = Math.PI / 2; var g = new T.Group(); g.add(m); scene.add(g); return g;
    }
    var A = coin('asimov', 0xd9a441), B = coin('nvdax', 0x9cc46a);
    // swap particles: gold flows A→B, green flows B→A
    var P = 70, pg = new T.BufferGeometry(), pp = new Float32Array(P * 3), pc = new Float32Array(P * 3), seeds = [];
    var cg = new T.Color(0xffc75a), cn = new T.Color(0xa8ff4a);
    for (var i = 0; i < P; i++) { seeds.push({ u: Math.random(), sp: 0.25 + Math.random() * 0.35, dir: i % 2, off: Math.random() * 6.283 }); var c = i % 2 ? cn : cg; pc[i * 3] = c.r; pc[i * 3 + 1] = c.g; pc[i * 3 + 2] = c.b; }
    pg.setAttribute('position', new T.BufferAttribute(pp, 3)); pg.setAttribute('color', new T.BufferAttribute(pc, 3));
    var pts = new T.Points(pg, new T.PointsMaterial({ size: 0.07, vertexColors: true, transparent: true, opacity: 0.95, depthWrite: false, blending: T.AdditiveBlending }));
    scene.add(pts);
    var lineG = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]);
    var line = new T.Line(lineG, new T.LineBasicMaterial({ color: 0xf1dcbc, transparent: true, opacity: 0.35 })); scene.add(line);

    host.classList.add('is-3d');
    var tilt = { x: 0, y: 0 };
    host.addEventListener('pointermove', function (e) { var r = host.getBoundingClientRect(); tilt.x = (e.clientX - r.left) / r.width - 0.5; tilt.y = (e.clientY - r.top) / r.height - 0.5; kick(); });
    function size() { var w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; var z = camera.aspect < 1.4 ? 7.4 : 5.3; camera.position.set(0, z * 0.26, z); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); kick(); }
    new ResizeObserver(size).observe(host);
    var pa = new T.Vector3(), pb = new T.Vector3(), mid = new T.Vector3();
    var kick = loopWhileVisible(host, function (dt, t) {
      var a = reduce ? 0.6 : t * 0.7, r = 1.25;
      pa.set(Math.cos(a) * r, Math.sin(a * 2) * 0.12, Math.sin(a) * r * 0.55);
      pb.set(-pa.x, -pa.y, -pa.z);
      A.position.copy(pa); B.position.copy(pb);
      A.rotation.y = reduce ? 0.3 : Math.sin(t * 0.9) * 0.7 + tilt.x; B.rotation.y = reduce ? -0.3 : Math.sin(t * 0.9 + 2) * 0.7 + tilt.x;
      A.rotation.x = B.rotation.x = tilt.y * 0.5;
      line.geometry.attributes.position.setXYZ(0, pa.x, pa.y, pa.z); line.geometry.attributes.position.setXYZ(1, pb.x, pb.y, pb.z); line.geometry.attributes.position.needsUpdate = true;
      for (var i = 0; i < P; i++) {
        var s = seeds[i]; if (!reduce) s.u = (s.u + dt * s.sp) % 1;
        var u = s.dir ? 1 - s.u : s.u, from = pa, to = pb;
        mid.lerpVectors(from, to, u);
        var bulge = Math.sin(u * Math.PI) * 0.35;
        pp[i * 3] = mid.x + Math.cos(s.off + t) * bulge * 0.4;
        pp[i * 3 + 1] = mid.y + Math.sin(s.off + t * 1.3) * bulge * (s.dir ? 1 : -1);
        pp[i * 3 + 2] = mid.z + Math.sin(s.off) * bulge * 0.4;
      }
      pg.attributes.position.needsUpdate = true;
      scene.rotation.y += ((tilt.x * 0.4) - scene.rotation.y) * Math.min(1, dt * 3);
      renderer.render(scene, camera);
    });
    size();
  }

  function boot() { try { Shelf3D(); } catch (e) { console.warn('Shelf3D off:', e); } try { PairOrbit(); } catch (e) { console.warn('PairOrbit off:', e); } }
  // Canvas text needs the web fonts loaded before textures are drawn.
  var booted = false; function once() { if (!booted) { booted = true; boot(); } }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(once); setTimeout(once, 2500); } else once();
})();

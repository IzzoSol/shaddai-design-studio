/* world3d.js — the 3D half of "The First Law": Meridian Collider sublevel 9 and the tunnel.
   Pure function of film time: World.render(t) poses everything and draws one frame. No clocks, no randomness
   outside a seeded generator, so HyperFrames can seek to any frame. */
(function () {
  'use strict';
  var T = window.THREE;
  function rng(seed) { var s = seed >>> 0; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(v) { v = clamp(v); return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2; }
  function ph(t, a, b) { return clamp((t - a) / (b - a)); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function V(x, y, z) { return new T.Vector3(x, y, z); }
  function lv(a, b, k) { return V(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k)); }

  var W = 1920, H = 1080;
  var canvas = document.getElementById('gl');
  var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
  var scene = new T.Scene(); scene.background = new T.Color(0x020306);
  var studioEnv = window.AsimovRobot.studio(renderer);
  scene.fog = new T.FogExp2(0x020306, 0.055);
  var camera = new T.PerspectiveCamera(35, W / H, 0.05, 200);
  var composer = new T.EffectComposer(renderer);
  composer.addPass(new T.RenderPass(scene, camera));
  var bloom = new T.UnrealBloomPass(new T.Vector2(W, H), 1.0, 0.55, 0.82); composer.addPass(bloom);

  var M = {
    floor: new T.MeshStandardMaterial({ color: 0x0b0e12, metalness: 0.6, roughness: 0.3 }),
    wall: new T.MeshStandardMaterial({ color: 0x0d1015, metalness: 0.4, roughness: 0.7 }),
    steel: new T.MeshStandardMaterial({ color: 0x3a4048, metalness: 0.9, roughness: 0.35 }),
    ringBody: new T.MeshStandardMaterial({ color: 0x2a3038, metalness: 0.95, roughness: 0.25 }),
    glowCyan: new T.MeshBasicMaterial({ color: 0x5fe6ff, toneMapped: false }),
    glowRed: new T.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false }),
    sodium: new T.MeshBasicMaterial({ color: 0xffa040, toneMapped: false }),
    human: new T.MeshStandardMaterial({ color: 0x060606, metalness: 0.0, roughness: 0.9 }),
    coat: new T.MeshStandardMaterial({ color: 0x0c0806, metalness: 0.0, roughness: 0.95 }),
    concrete: new T.MeshStandardMaterial({ color: 0x3b3934, metalness: 0.1, roughness: 0.85, side: T.BackSide }),
    car: new T.MeshStandardMaterial({ color: 0x15171b, metalness: 0.7, roughness: 0.35 }),
    tyre: new T.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.9 })
  };
  function mesh(g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); return o; }

  /* ═════ LAB (sublevel 9) ═════ */
  var lab = new T.Group(); scene.add(lab);
  var floorTex = (function () { // grid plates
    var c = document.createElement('canvas'); c.width = c.height = 512; var g = c.getContext('2d');
    g.fillStyle = '#16191e'; g.fillRect(0, 0, 512, 512); g.strokeStyle = '#05070a'; g.lineWidth = 6; g.strokeRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(255,255,255,.05)'; g.lineWidth = 2; for (var i = 32; i < 512; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 512); g.stroke(); }
    var t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(10, 10); t.encoding = T.sRGBEncoding; return t;
  })();
  M.floor.map = floorTex;
  var floor = mesh(new T.PlaneGeometry(40, 40), M.floor); floor.rotation.x = -Math.PI / 2; lab.add(floor);
  // chamber walls with a doorway at z = 4.5 (door gap x ∈ [-1.4, 1.4])
  var back = mesh(new T.BoxGeometry(20, 9, 0.5), M.wall, 0, 4.5, -5); lab.add(back);
  [-1, 1].forEach(function (s) {
    lab.add(mesh(new T.BoxGeometry(0.5, 9, 10), M.wall, s * 8, 4.5, 0));
    lab.add(mesh(new T.BoxGeometry(6.6, 9, 0.5), M.wall, s * 4.7, 4.5, 4.5));                      // front wall beside the door
    for (var i = 0; i < 4; i++) { lab.add(mesh(new T.BoxGeometry(0.35, 9, 0.35), M.steel, s * 7.6, 4.5, -4 + i * 2.6)); lab.add(mesh(new T.BoxGeometry(0.04, 7, 0.04), M.glowCyan, s * 7.4, 4.5, -4 + i * 2.6)); } // columns + light strips
  });
  lab.add(mesh(new T.BoxGeometry(2.8, 5.2, 0.5), M.wall, 0, 6.4, 4.5));                                 // lintel
  var doorFrame = new T.Group(); lab.add(doorFrame);
  [-1, 1].forEach(function (s) { doorFrame.add(mesh(new T.BoxGeometry(0.18, 3.8, 0.7), M.steel, s * 1.48, 1.9, 4.5)); });
  var doorL = mesh(new T.BoxGeometry(1.45, 3.75, 0.25), M.steel, -2.2, 1.88, 4.85), doorR = mesh(new T.BoxGeometry(1.45, 3.75, 0.25), M.steel, 2.2, 1.88, 4.85);
  [doorL, doorR].forEach(function (d) { d.add(mesh(new T.BoxGeometry(1.2, 0.08, 0.26), M.glowRed, 0, 1.2, 0.01)); lab.add(d); });
  // ceiling light strips
  for (var k = 0; k < 6; k++) lab.add(mesh(new T.BoxGeometry(0.12, 0.06, 7), M.glowCyan, -6 + k * 2.4, 8.6, 0));

  // the containment ring: a vertical torus with lit seams and a field of orbiting light
  var ring = new T.Group(); ring.position.set(0, 2.9, -1.2); lab.add(ring);
  ring.add(mesh(new T.TorusGeometry(2.4, 0.42, 40, 160), M.ringBody));
  var seamA = mesh(new T.TorusGeometry(2.4, 0.45, 8, 160), M.glowCyan); seamA.scale.set(1, 1, 0.06); ring.add(seamA);
  var seamB = mesh(new T.TorusGeometry(1.98, 0.035, 8, 160), M.glowCyan); ring.add(seamB);
  for (var b = 0; b < 12; b++) { var clampBox = mesh(new T.BoxGeometry(0.5, 0.95, 0.95), M.steel); var a = b / 12 * Math.PI * 2; clampBox.position.set(Math.cos(a) * 2.4, Math.sin(a) * 2.4, 0); clampBox.rotation.z = a; ring.add(clampBox); }
  ring.add(mesh(new T.BoxGeometry(1.4, 0.5, 1.6), M.steel, 0, -2.9, 0));                                  // pedestal
  var FIELD = 1600, fg = new T.BufferGeometry(), fp = new Float32Array(FIELD * 3), fseed = [];
  (function () { var r = rng(17); for (var i = 0; i < FIELD; i++) fseed.push([r() * Math.PI * 2, 0.4 + r() * 1.5, (r() - 0.5) * 0.6, 0.3 + r()]); })();
  fg.setAttribute('position', new T.BufferAttribute(fp, 3));
  var dot = (function () { var c = document.createElement('canvas'); c.width = c.height = 32; var g = c.getContext('2d'); var r = g.createRadialGradient(16, 16, 1, 16, 16, 16); r.addColorStop(0, '#fff'); r.addColorStop(0.4, 'rgba(255,255,255,.6)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new T.CanvasTexture(c); })();
  var fieldMat = new T.PointsMaterial({ color: 0x9fe8ff, size: 0.03, map: dot, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false });
  var field = new T.Points(fg, fieldMat); ring.add(field);
  // the leak: a false-vacuum bubble with a fresnel rim that ripples
  var bubbleMat = new T.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uHot: { value: 0 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
    vertexShader: 'uniform float uTime; varying vec3 vN; varying vec3 vV; void main(){ vec3 p = position + normal * 0.06 * sin(position.y*9.0 + uTime*6.0) * sin(position.x*7.0 - uTime*4.0); vec4 mv = modelViewMatrix * vec4(p,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform float uHot; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.4); vec3 c = mix(vec3(0.35,0.9,1.2), vec3(1.4,0.35,0.2), uHot); gl_FragColor = vec4(c * (0.25 + f*2.6), 0.3 + f*0.9); }'
  });
  var bubble = mesh(new T.SphereGeometry(1, 96, 64), bubbleMat); ring.add(bubble);
  var bubbleCore = mesh(new T.SphereGeometry(1, 32, 16), new T.MeshBasicMaterial({ color: 0x0a0418 })); ring.add(bubbleCore);

  // gantry beam and the technician pinned under it
  var gantry = mesh(new T.BoxGeometry(3.2, 0.32, 0.36), M.steel, 2.0, 0.42, 1.8); gantry.rotation.y = -0.4; lab.add(gantry);
  function human(mat, coatMat) {
    var g = new T.Group(), P = {};
    g.add(P.torso = mesh(new T.CylinderGeometry(0.2, 0.17, 0.62, 16), coatMat || mat, 0, 1.25, 0));
    if (coatMat) g.add(mesh(new T.CylinderGeometry(0.2, 0.3, 0.7, 16), coatMat, 0, 0.75, 0));
    g.add(mesh(new T.SphereGeometry(0.13, 20, 16), mat, 0, 1.72, 0));
    g.add(mesh(new T.CylinderGeometry(0.05, 0.06, 0.12, 10), mat, 0, 1.58, 0));
    ['L', 'R'].forEach(function (s) {
      var sg = s === 'L' ? -1 : 1;
      var arm = new T.Group(); arm.position.set(sg * 0.25, 1.5, 0); arm.add(mesh(new T.CylinderGeometry(0.055, 0.045, 0.62, 10), coatMat || mat, 0, -0.3, 0)); g.add(arm); P['arm' + s] = arm;
      var leg = new T.Group(); leg.position.set(sg * 0.1, 0.92, 0); leg.add(mesh(new T.CylinderGeometry(0.075, 0.055, 0.9, 10), mat, 0, -0.45, 0)); g.add(leg); P['leg' + s] = leg;
    });
    g.userData = P; return g;
  }
  var suit = new T.MeshStandardMaterial({ color: 0xd2621a, roughness: 0.6, metalness: 0.0 });
  var tech = human(suit); tech.add(mesh(new T.CylinderGeometry(0.205, 0.205, 0.05, 16), new T.MeshBasicMaterial({ color: 0xe8f0d0 }), 0, 1.18, 0)); tech.rotation.set(-Math.PI / 2, 0, 0.5); tech.position.set(1.7, 0.16, 2.3); lab.add(tech);
  tech.userData.armR.rotation.z = 2.2;

  // R-7
  var bot = window.AsimovRobot.create({ eye: 0x7ff6ff, envMap: studioEnv }); lab.add(bot.root);
  var red1 = new T.PointLight(0xff2010, 0, 18), red2 = new T.PointLight(0xff2010, 0, 18); red1.position.set(-5, 7, 2); red2.position.set(5, 7, -3); lab.add(red1); lab.add(red2);
  var ringLight = new T.PointLight(0x5fe6ff, 2.2, 14); ringLight.position.set(0, 2.9, 0.5); lab.add(ringLight);
  var key = new T.DirectionalLight(0xbfd4ff, 0.6); key.position.set(-4, 8, 8); lab.add(key);
  var coreLight = new T.PointLight(0xffc04a, 0, 6); lab.add(coreLight);
  var techSpot = new T.SpotLight(0xffb070, 0, 9, 0.45, 0.6); techSpot.position.set(1.4, 5.5, 3.2); techSpot.target.position.set(1.8, 0, 2.3); lab.add(techSpot); lab.add(techSpot.target);
  var pool = (function () { var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'); var r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, 'rgba(120,170,200,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); })();
  var floorPool = mesh(new T.PlaneGeometry(5, 5), new T.MeshBasicMaterial({ map: pool, transparent: true, depthWrite: false, blending: T.AdditiveBlending })); floorPool.rotation.x = -Math.PI / 2; floorPool.position.set(1.1, 0.01, 0.6); lab.add(floorPool);
  var shadowTex = (function () { var c = document.createElement('canvas'); c.width = c.height = 128; var g = c.getContext('2d'); var r = g.createRadialGradient(64, 64, 4, 64, 64, 64); r.addColorStop(0, 'rgba(0,0,0,.85)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); })();
  var botShadow = mesh(new T.PlaneGeometry(1.6, 1.6), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })); botShadow.rotation.x = -Math.PI / 2; botShadow.position.y = 0.012; lab.add(botShadow);
  scene.add(new T.AmbientLight(0x1a2030, 0.6));

  /* ═════ TUNNEL (2004 homage), built far away so the two sets never share a frame ═════ */
  var tunnel = new T.Group(); tunnel.position.set(200, 0, 0); scene.add(tunnel);
  var tube = mesh(new T.CylinderGeometry(6, 6, 80, 48, 1, true), M.concrete, 0, 3.2, -30); tube.rotation.x = Math.PI / 2; tunnel.add(tube);
  var wet = mesh(new T.PlaneGeometry(12, 80), new T.MeshStandardMaterial({ color: 0x0c0c0d, metalness: 0.9, roughness: 0.12 }), 0, 0, -30); wet.rotation.x = -Math.PI / 2; tunnel.add(wet);
  for (var j = 0; j < 14; j++) { tunnel.add(mesh(new T.BoxGeometry(0.5, 0.12, 1.4), M.sodium, -3.4, 7.4, 6 - j * 5.5)); tunnel.add(mesh(new T.BoxGeometry(0.5, 0.12, 1.4), M.sodium, 3.4, 7.4, 6 - j * 5.5)); }
  [0, -12, -24].forEach(function (z) { var l = new T.PointLight(0xff9a3a, 3.2, 16); l.position.set(0, 6.6, z); tunnel.add(l); });
  var back2 = new T.PointLight(0xfff0d8, 6, 22); back2.position.set(0, 2.5, -9); tunnel.add(back2);
  var car = new T.Group(); car.position.set(-2.4, 0.95, -5); car.rotation.set(0, 0.5, Math.PI / 2 * 0.92); tunnel.add(car);
  car.add(mesh(new T.BoxGeometry(4.4, 1.0, 1.9), M.car)); car.add(mesh(new T.BoxGeometry(2.4, 0.7, 1.7), M.car, -0.2, 0.8, 0));
  [[-1.4, -0.5, 0.95], [1.4, -0.5, 0.95], [-1.4, -0.5, -0.95], [1.4, -0.5, -0.95]].forEach(function (p) { var w = mesh(new T.CylinderGeometry(0.42, 0.42, 0.3, 24), M.tyre, p[0], p[1], p[2]); w.rotation.x = Math.PI / 2; car.add(w); });
  var steamG = new T.BufferGeometry(), STEAM = 260, sp = new Float32Array(STEAM * 3), sseed = []; (function () { var r = rng(23); for (var i = 0; i < STEAM; i++) sseed.push([r(), r(), r()]); })();
  steamG.setAttribute('position', new T.BufferAttribute(sp, 3));
  var puff = (function () { var c = document.createElement('canvas'); c.width = c.height = 64; var g = c.getContext('2d'); var r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new T.CanvasTexture(c); })();
  var steam = new T.Points(steamG, new T.PointsMaterial({ color: 0xd8d2c8, size: 0.9, map: puff, transparent: true, opacity: 0.16, depthWrite: false })); tunnel.add(steam);
  var redEyes = []; (function () { var r = rng(31); for (var i = 0; i < 14; i++) { var pair = new T.Group(); pair.position.set((r() - 0.5) * 8, 1.4 + r() * 1.6, -14 - r() * 22); pair.add(mesh(new T.SphereGeometry(0.06, 8, 6), M.glowRed, -0.12, 0, 0)); pair.add(mesh(new T.SphereGeometry(0.06, 8, 6), M.glowRed, 0.12, 0, 0)); pair.userData.off = 70.6 + r() * 1.6; tunnel.add(pair); redEyes.push(pair); } })();
  var detective = human(M.human); detective.position.set(0.9, 0, -2.2); detective.rotation.y = -2.4; tunnel.add(detective);
  var lieutenant = human(M.human, M.coat); lieutenant.position.set(-0.7, 0, -3.4); lieutenant.rotation.y = 0.8; tunnel.add(lieutenant);

  /* ═════ shots ═════ */
  var CUT = { push: 8, breach: 16, order: 24, eyes: 32.5, walk: 34.6, flash: 40.5, black: 41.6, tunnel: 70, tunnelEnd: 80, epi: 112, epiEnd: 120 };

  function poseBot(t) {
    var p = { armL: { shoulder: [0.05, 0, -0.12], elbow: -0.25 }, armR: { shoulder: [0.05, 0, 0.12], elbow: -0.25 } };
    bot.root.position.set(0, 0, 6.6); bot.root.rotation.set(0, Math.PI, 0); bot.root.visible = true;
    var lift = ease(ph(t, 16.4, 17.6));
    p.headPitch = lerp(0.42, -0.05, lift); p.spinePitch = lerp(0.12, 0, lift); p.headYaw = 0;
    if (t >= CUT.order) p.headYaw = ease(ph(t, 28.5, 30)) * -0.55;                      // looks at the technician
    if (t >= CUT.eyes) p.headYaw = -0.55 * (1 - ph(t, 32.5, 33.4));
    if (t >= CUT.walk) {                                                                 // through the door, to the beam
      var w = ph(t, 34.6, 36.6), pos = lv(V(0, 0, 6.6), V(1.9, 0, 2.75), ease(w));
      bot.root.position.copy(pos); bot.root.rotation.y = Math.PI - 0.35 * ease(w);
      if (w < 1) { bot.walk((t - 34.6) * 7, 0.42, { headYaw: -0.2 }); return; }
      var lifting = ease(ph(t, 36.6, 37.6));
      p.armL = { shoulder: [-2.3 * lifting, 0, -0.3], elbow: -0.4 }; p.armR = { shoulder: [-2.3 * lifting, 0, 0.3], elbow: -0.4 };
      p.spinePitch = 0.25 * (1 - lifting); p.headPitch = -0.2;
      if (t >= 38.4) {                                                                   // turns and drives its core into the ring
        var go = ease(ph(t, 38.4, 40.4)); bot.root.position.copy(lv(V(1.9, 0, 2.75), V(0.2, 0.7, -0.4), go));
        bot.root.rotation.y = lerp(Math.PI - 0.35, Math.PI * 2 - 0.1, ease(ph(t, 38.4, 39.2)));
        p.armL = { shoulder: [-1.4, 0, -0.6], elbow: -0.3 }; p.armR = { shoulder: [-1.4, 0, 0.6], elbow: -0.3 }; p.chestPitch = 0.25 * go;
      }
    }
    if (t >= CUT.epi) {                                                                  // slumped against the cold ring
      bot.root.position.set(1.2, 0, 0.35); bot.root.rotation.set(0, -0.55, 0);
      p = { lift: -1.08, headPitch: 0.42, headRoll: 0.22, spinePitch: -0.22, chestPitch: -0.08, armL: { shoulder: [0.2, 0, -0.35], elbow: -0.2, grip: 0.6 }, armR: { shoulder: [-0.4, 0, 0.5], elbow: -0.5, grip: 0.6 },
        legL: { hip: [-1.45, 0, -0.15], knee: 0.2 }, legR: { hip: [-1.2, 0, 0.25], knee: 0.9 } };
    }
    bot.pose(p);
  }

  function eyes(t) {
    var col = 0x7ff6ff, k = 0.35;
    if (t >= CUT.breach) k = 1;
    if (t >= CUT.eyes) { col = 0xffc04a; k = 1.2; }
    if (t >= CUT.flash) k = 0;
    if (t >= CUT.epi) { col = 0xffc04a; k = t < 118.4 ? 0 : (t < 118.9 ? ((Math.floor(t * 18) % 2) ? 0.9 : 0.1) : 0.9); }
    bot.setEye(col, k);
    coreLight.intensity = t >= CUT.eyes && t < CUT.flash ? 2.5 : 0;
    coreLight.position.copy(bot.root.position).add(V(0, 2.3, 0.4));
    botShadow.position.x = bot.root.position.x; botShadow.position.z = bot.root.position.z; botShadow.visible = bot.root.position.y < 0.1;
    techSpot.intensity = t >= 24 && t < CUT.flash ? 3 : 0; floorPool.visible = t >= CUT.epi;
  }

  function setCam(pos, look, fov) { camera.position.copy(pos); camera.lookAt(look); camera.fov = fov || 35; camera.updateProjectionMatrix(); }

  function shot(t) {
    lab.visible = !(t >= CUT.tunnel && t < CUT.tunnelEnd);
    tunnel.visible = !lab.visible;
    if (tunnel.visible) {                                                                // ── 2004 homage
      var k = ph(t, 70, 80), base = V(200, 0, 0);
      if (t < 73.4) setCam(base.clone().add(V(-4.5 + k * 2, 1.4, 4)), base.clone().add(V(0, 1.4, -6)), 38);
      else if (t < 77) setCam(base.clone().add(V(2.8, 1.7, 1.4)), base.clone().add(V(-0.5, 1.5, -3.2)), 34);
      else setCam(base.clone().add(V(-1.4 + (t - 77) * 0.1, 1.5, 0.8)), base.clone().add(V(0.9, 1.5, -2.2)), 32);
      detective.userData.armR.rotation.z = t > 77 ? 1.2 + Math.sin(t * 6) * 0.15 : 0.2;
      lieutenant.userData.armL.rotation.x = t > 75.3 && t < 77 ? -0.9 : 0;
      redEyes.forEach(function (e) { e.visible = t < e.userData.off; });
      for (var i = 0; i < STEAM; i++) { var s = sseed[i], life = ((t * 0.25 + s[0]) % 1); sp[i * 3] = -2.4 + (s[1] - 0.5) * 1.6 + life * 0.6; sp[i * 3 + 1] = 1.2 + life * 4; sp[i * 3 + 2] = -5 + (s[2] - 0.5) * 2; }
      steamG.attributes.position.needsUpdate = true;
      bloom.strength = 0.8; return;
    }
    bloom.strength = 1.0;
    if (t < CUT.push) { var a = ph(t, 0, 8); setCam(V(-2.2 + a * 1.4, 2.2 + a * 0.5, -0.2 + a * 0.6), V(0.2, 2.9, -1.2), 46); }                // inside: the ring, turning
    else if (t < CUT.breach) { var b = ease(ph(t, 8, 16)); setCam(V(0.25, 3.0, 3.7 + b * 0.9), V(0, 3.0, 6.6), lerp(34, 22, b)); }        // R-7 framed in the doorway
    else if (t < CUT.order) { var c = ph(t, 16, 24); setCam(V(-4.8 + c * 0.8, 2.0 + Math.sin(t * 30) * 0.015 * (1 - c), 3.6), V(0, 2.7, -1.0), 42); } // the breach
    else if (t < 28.5) { setCam(V(1.25, 3.55, 9.2), V(1.7, 0.5, 2.3), 30); }                                                              // over R-7's shoulder
    else if (t < CUT.eyes) { var pv = ph(t, 28.5, 32.5); setCam(V(-0.4, 3.3, 6.3 - pv * 0.3), V(1.7, 0.35 + pv * 0.1, 2.3), lerp(30, 24, pv)); } // R-7's eyes: the technician
    else if (t < CUT.walk) { var d = ease(ph(t, 32.5, 34.6)); setCam(V(0.06, 3.36, 5.2 + d * 0.25), V(0, 3.33, 6.6), 15); }               // the eyes turn gold
    else if (t < CUT.black) {                                                                                                               // through the door, the beam, the ring
      var e = ph(t, 34.6, 41.6), look = lv(V(0.6, 1.8, 4.2), V(1.4, 2.6, 2.6), ease(ph(t, 36.4, 37.2)));
      look = lv(look, V(0.4, 2.4, -0.6), ease(ph(t, 38.2, 39.6)));
      setCam(V(-5.2 + e * 0.8, 3.0, 1.2 + e * 0.4), look, 38);
    }
    else if (t >= CUT.epi) { var f = ph(t, 112, 120); setCam(V(-4.4 + f * 0.4, 1.7, 4.2 - f * 0.4), V(0.9, 1.15, 0.4), 36); }
    else setCam(V(0, 3, 12), V(0, 3, 0), 35);
  }

  function labState(t) {
    var breach = t >= CUT.breach && t < CUT.flash;
    var strobe = breach ? ((Math.floor(t * 3) % 2) ? 5 : 0.6) : 0;
    red1.intensity = red2.intensity = strobe;
    M.glowRed.color.setHex(breach && Math.floor(t * 3) % 2 ? 0xff2a1a : 0x40100a);
    var cold = t >= CUT.flash;
    M.glowCyan.color.setHex(cold ? 0x0a1418 : 0x5fe6ff);
    ringLight.intensity = cold ? 0.15 : 2.2; fieldMat.opacity = cold ? 0 : 0.9;
    for (var i = 0; i < FIELD; i++) { var s = fseed[i], a = s[0] + t * s[3] * (breach ? 2.2 : 0.8); var r = s[1] * (breach ? 1 + 0.08 * Math.sin(t * 9 + i) : 1); fp[i * 3] = Math.cos(a) * r; fp[i * 3 + 1] = Math.sin(a) * r; fp[i * 3 + 2] = s[2]; }
    fg.attributes.position.needsUpdate = true;
    // bubble grows from the breach, then collapses into the core
    var gk = ph(t, 16, 40), grow = t < CUT.breach ? 0 : t < CUT.flash ? 0.35 + (1 - Math.pow(1 - gk, 2)) * 1.55 : Math.max(0, 1.9 * (1 - ph(t, 40.5, 41.0)));
    bubble.scale.setScalar(Math.max(0.001, grow)); bubbleCore.scale.setScalar(Math.max(0.001, grow * 0.45));
    bubble.visible = bubbleCore.visible = grow > 0.002;
    bubbleMat.uniforms.uTime.value = t; bubbleMat.uniforms.uHot.value = ph(t, 32, 40);
    // door: open, then sliding shut from the order (stops at a gap R-7 squeezes through)
    var shut = ease(ph(t, 25, 33)) * 0.6;   // stops at a gap R-7 can squeeze through
    doorL.position.x = lerp(-2.2, -0.72, shut); doorR.position.x = lerp(2.2, 0.72, shut);
    // the beam rises off the technician, who is dragged clear
    var lift = ease(ph(t, 36.6, 37.6)), drop = ease(ph(t, 38.3, 38.9));
    gantry.position.set(lerp(2.0, 1.95, lift), 0.42 + lift * 3.3 - drop * 3.5, lerp(1.8, 2.45, lift)); gantry.rotation.y = lerp(-0.4, 1.35, lift); gantry.visible = t < CUT.epi;
    var clear = ease(ph(t, 37.5, 38.4)); tech.position.set(1.7 + clear * 2.6, 0.16, 2.3 + clear * 0.8); tech.visible = t < CUT.epi;
  }

  window.World = {
    cut: CUT,
    // is a 3D shot on screen at time t?
    active: function (t) { return t < CUT.black || (t >= CUT.tunnel && t < CUT.tunnelEnd) || (t >= CUT.epi && t < CUT.epiEnd); },
    render: function (t) { labState(t); poseBot(t); eyes(t); shot(t); composer.render(); },
    screen: function (v) { var p = v.clone().project(camera); return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * H }; },
    bot: bot
  };
})();

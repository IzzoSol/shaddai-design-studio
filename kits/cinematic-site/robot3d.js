/* robot3d.js — R-7, the procedural 3D robot (three.js r128 UMD global THREE).
   Ceramic shell over chrome joints, glossy black visor, glowing eyes and chest core.
   Fully jointed so the site and the film can pose it:
     const bot = AsimovRobot.create({ eye: 0x7ff6ff });  scene.add(bot.root);
     bot.pose({ headYaw: .3, armR: { shoulder: [-.4, 0, .2], elbow: -.6 } });  bot.setEye(0xffc04a, 1);
   AsimovRobot.studio(renderer) returns a PMREM environment map for chrome reflections. */
(function () {
  'use strict';
  var T = window.THREE; if (!T) return;

  // finish: 'gold' (Robot Visions brass + chrome, default) or 'ceramic' (white shell)
  function mats(eyeColor, finish) {
    var gold = finish !== 'ceramic';
    return {
      ceramic: gold ? new T.MeshStandardMaterial({ color: 0xcf9a3a, metalness: 1, roughness: 0.3, envMapIntensity: 0.85 })
                    : new T.MeshPhysicalMaterial({ color: 0xc9c3b8, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.18, envMapIntensity: 0.55 }),
      ceramicDark: gold ? new T.MeshStandardMaterial({ color: 0x8c6a32, metalness: 1, roughness: 0.34, envMapIntensity: 0.9 })
                        : new T.MeshPhysicalMaterial({ color: 0x8f897f, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.55 }),
      chrome: new T.MeshStandardMaterial({ color: 0xb8c0c9, metalness: 1, roughness: 0.18, envMapIntensity: 0.8 }),
      gunmetal: new T.MeshStandardMaterial({ color: 0x23272d, metalness: 0.85, roughness: 0.35 }),
      rubber: new T.MeshStandardMaterial({ color: 0x0d0f12, metalness: 0.2, roughness: 0.7 }),
      visor: new T.MeshPhysicalMaterial({ color: 0x010203, metalness: 0.0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.35 }),
      eye: new T.MeshBasicMaterial({ color: eyeColor, toneMapped: false }),
      eyeCore: new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
      core: new T.MeshBasicMaterial({ color: eyeColor, toneMapped: false }),
      seam: new T.MeshStandardMaterial({ color: 0x1a1a1c, roughness: 0.6 })
    };
  }

  // Smooth tapered limb shell from a lathe profile (radius r0 at top → r1 at bottom, length L, along -Y).
  function limbShell(r0, r1, L, bulge) {
    var pts = [], n = 14;
    for (var i = 0; i <= n; i++) {
      var k = i / n, r = r0 + (r1 - r0) * k + Math.sin(k * Math.PI) * (bulge || 0);
      pts.push(new T.Vector2(Math.max(0.001, r * (i === 0 || i === n ? 0.82 : 1)), -k * L));
    }
    return new T.LatheGeometry(pts, 40);
  }
  function lathe(profile, seg) { return new T.LatheGeometry(profile.map(function (p) { return new T.Vector2(p[0], p[1]); }), seg || 56); }
  function mesh(g, m, x, y, z) { var o = new T.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); o.castShadow = o.receiveShadow = true; return o; }
  function pivot(parent, x, y, z) { var g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g; }

  function create(opts) {
    opts = opts || {};
    var M = mats(opts.eye != null ? opts.eye : 0x7ff6ff, opts.finish), J = {};
    if (opts.envMap) Object.keys(M).forEach(function (k) { if (M[k].isMeshStandardMaterial) { M[k].envMap = opts.envMap; M[k].needsUpdate = true; } });
    var root = new T.Group(); root.name = 'R-7';

    /* pelvis + spine */
    J.pelvis = pivot(root, 0, 1.62, 0);
    var pelvis = mesh(lathe([[0.001, 0.12], [0.24, 0.1], [0.3, 0.0], [0.27, -0.12], [0.16, -0.2], [0.001, -0.22]]), M.ceramic);
    pelvis.scale.set(1.25, 1, 0.82); J.pelvis.add(pelvis);
    J.spine = pivot(J.pelvis, 0, 0.12, 0);
    for (var i = 0; i < 3; i++) { // exposed abdominal vertebrae
      var ring = mesh(new T.TorusGeometry(0.16 - i * 0.004, 0.045, 16, 40), M.gunmetal, 0, 0.06 + i * 0.1, 0);
      ring.rotation.x = Math.PI / 2; ring.scale.set(1.25, 0.85, 1); J.spine.add(ring);
    }
    J.spine.add(mesh(new T.CylinderGeometry(0.1, 0.12, 0.34, 24), M.chrome, 0, 0.16, -0.02));

    /* chest */
    J.chest = pivot(J.spine, 0, 0.34, 0);
    var chest = mesh(lathe([[0.001, 0.8], [0.22, 0.79], [0.41, 0.73], [0.5, 0.6], [0.48, 0.42], [0.4, 0.22], [0.3, 0.06], [0.24, 0.0], [0.001, -0.01]]), M.ceramic);
    chest.scale.set(1.08, 1, 0.62); J.chest.add(chest);
    // pectoral seam + sternum channel
    var seam = mesh(new T.TorusGeometry(0.36, 0.006, 6, 64, Math.PI), M.seam, 0, 0.5, 0.0); seam.scale.set(1.18, 0.55, 0.66); seam.rotation.x = 0.1; seam.position.z = 0.04; J.chest.add(seam);
    var stern = mesh(new T.BoxGeometry(0.012, 0.42, 0.02), M.seam, 0, 0.36, 0.335); J.chest.add(stern);
    // chest core: chrome bezel + glow
    var bezel = mesh(new T.TorusGeometry(0.075, 0.022, 16, 48), M.chrome, 0, 0.42, 0.318); J.chest.add(bezel);
    J.core = mesh(new T.CircleGeometry(0.06, 40), M.core, 0, 0.42, 0.322); J.chest.add(J.core);
    // collar and trapezius plates
    var collar = mesh(new T.TorusGeometry(0.17, 0.035, 16, 48), M.gunmetal, 0, 0.78, 0); collar.rotation.x = Math.PI / 2; J.chest.add(collar);
    [-1, 1].forEach(function (s) {
      var trap = mesh(new T.SphereGeometry(0.17, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.ceramicDark, s * 0.26, 0.7, -0.02);
      trap.scale.set(1.3, 0.45, 0.9); trap.rotation.z = -s * 0.35; J.chest.add(trap);
    });

    /* neck: chrome segments + cables */
    J.neck = pivot(J.chest, 0, 0.8, 0);
    J.neck.add(mesh(new T.CylinderGeometry(0.075, 0.09, 0.2, 24), M.chrome, 0, 0.08, 0));
    for (var n = 0; n < 2; n++) { var nr = mesh(new T.TorusGeometry(0.085, 0.016, 10, 32), M.gunmetal, 0, 0.04 + n * 0.08, 0); nr.rotation.x = Math.PI / 2; J.neck.add(nr); }
    [-1, 1].forEach(function (s) {
      var curve = new T.CatmullRomCurve3([new T.Vector3(s * 0.12, -0.08, -0.02), new T.Vector3(s * 0.11, 0.08, 0.02), new T.Vector3(s * 0.08, 0.22, 0.0)]);
      J.neck.add(mesh(new T.TubeGeometry(curve, 16, 0.018, 8, false), M.rubber));
    });

    /* head */
    J.head = pivot(J.neck, 0, 0.18, 0); J.head.scale.setScalar(0.86);
    // cranium (set back) + a protruding face mask whose rim reads as a panel line
    var skull = mesh(new T.SphereGeometry(0.285, 64, 48), M.ceramicDark, 0, 0.29, -0.02); skull.scale.set(0.9, 1.05, 1.0); J.head.add(skull);
    var cap = mesh(new T.SphereGeometry(0.292, 64, 32, 0, Math.PI * 2, 0, 1.15), M.ceramic, 0, 0.29, -0.02); cap.scale.set(0.9, 1.05, 1.0); J.head.add(cap);
    var mask = mesh(new T.SphereGeometry(0.29, 64, 48, Math.PI / 2 - 1.05, 2.1, 0.95, 1.55), M.ceramic, 0, 0.27, 0.02); mask.scale.set(0.84, 1.08, 1.04); J.head.add(mask);
    var jaw = mesh(lathe([[0.001, 0.0], [0.13, 0.015], [0.19, 0.08], [0.215, 0.17], [0.001, 0.2]], 48), M.ceramic, 0, 0.03, 0.035); jaw.scale.set(0.95, 1, 0.95); J.head.add(jaw);
    // brow ridge, nose ridge, cheekbones
    var brow = mesh(new T.TorusGeometry(0.235, 0.014, 10, 48, 1.5), M.ceramic, 0, 0.2, 0.0); brow.rotation.set(0, 0, Math.PI / 2 - 0.75); brow.position.set(0, 0.06, 0.07); brow.scale.set(1, 1, 1);
    var browWrap = pivot(J.head, 0, 0.27, 0.035); browWrap.rotation.x = -1.32; browWrap.add(brow); brow.position.set(0, 0, 0);
    var nose = mesh(new T.CylinderGeometry(0.008, 0.018, 0.1, 12), M.ceramic, 0, 0.19, 0.285); nose.rotation.x = -0.25; J.head.add(nose);
    // sagittal seam over the cranium
    var sag = mesh(new T.TorusGeometry(0.296, 0.0035, 6, 80, Math.PI * 0.9), M.seam, 0, 0.29, -0.02); sag.rotation.set(0, Math.PI / 2, Math.PI * 0.55); sag.scale.set(1.05, 0.9, 1); J.head.add(sag);
    // visor: a slim band of black glass across the eyes
    var visor = mesh(new T.SphereGeometry(0.287, 64, 12, Math.PI / 2 - 0.78, 1.56, 1.38, 0.24), M.visor, 0, 0.27, 0.03); visor.scale.set(0.86, 1.08, 1.05); J.head.add(visor);
    // eyes: elongated glows with hot cores
    J.eyes = [];
    [-1, 1].forEach(function (s) {
      var e = mesh(new T.SphereGeometry(1, 24, 12), M.eye, s * 0.085, 0.292, 0.318); e.scale.set(0.048, 0.012, 0.008); e.rotation.y = s * 0.28; e.rotation.z = s * -0.06; J.head.add(e); J.eyes.push(e);
      var c = mesh(new T.SphereGeometry(1, 16, 8), M.eyeCore, s * 0.085, 0.292, 0.325); c.scale.set(0.018, 0.0045, 0.004); c.rotation.y = s * 0.28; J.head.add(c);
    });
    // mouth grille
    for (var g = 0; g < 7; g++) { var slot = mesh(new T.BoxGeometry(0.009, 0.04, 0.02), M.seam, -0.054 + g * 0.018, 0.105, 0.262 - Math.abs(g - 3) * 0.006); J.head.add(slot); }
    // ear discs
    [-1, 1].forEach(function (s) {
      var ear = mesh(new T.CylinderGeometry(0.075, 0.075, 0.05, 40), M.chrome, s * 0.255, 0.24, -0.01); ear.rotation.z = Math.PI / 2; J.head.add(ear);
      var er = mesh(new T.TorusGeometry(0.075, 0.012, 10, 40), M.gunmetal, s * 0.28, 0.24, -0.01); er.rotation.y = Math.PI / 2; J.head.add(er);
      var cap = mesh(new T.CircleGeometry(0.04, 32), M.gunmetal, s * 0.282, 0.24, -0.01); cap.rotation.y = s * Math.PI / 2; J.head.add(cap);
    });

    /* arms */
    function arm(side) {
      var s = side === 'L' ? -1 : 1, A = {};
      A.shoulder = pivot(J.chest, s * 0.56, 0.64, -0.02);
      A.shoulder.add(mesh(new T.SphereGeometry(0.12, 32, 24), M.chrome));
      var paul = mesh(new T.SphereGeometry(0.135, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.55), M.ceramic, s * 0.03, 0.03, 0); paul.scale.set(1.05, 0.9, 1.0); paul.rotation.z = -s * 0.5; A.shoulder.add(paul);
      A.shoulder.add(mesh(limbShell(0.1, 0.085, 0.56, 0.012), M.ceramic, 0, -0.08, 0));
      A.elbow = pivot(A.shoulder, 0, -0.66, 0);
      A.elbow.add(mesh(new T.SphereGeometry(0.075, 24, 16), M.chrome));
      A.elbow.add(mesh(limbShell(0.082, 0.062, 0.5, 0.01), M.ceramic, 0, -0.06, 0));
      A.wrist = pivot(A.elbow, 0, -0.6, 0);
      A.wrist.add(mesh(new T.SphereGeometry(0.048, 16, 12), M.chrome));
      var palm = mesh(new T.BoxGeometry(0.1, 0.12, 0.05), M.gunmetal, 0, -0.08, 0); A.wrist.add(palm);
      for (var f = 0; f < 4; f++) {
        var fg = pivot(A.wrist, -0.036 + f * 0.024, -0.14, 0);
        fg.add(mesh(new T.CylinderGeometry(0.01, 0.009, 0.075, 8), M.gunmetal, 0, -0.04, 0));
        fg.rotation.x = 0.25; A['f' + f] = fg;
      }
      var th = pivot(A.wrist, s * -0.055, -0.07, 0.02); th.rotation.z = s * 0.6; th.add(mesh(new T.CylinderGeometry(0.011, 0.01, 0.06, 8), M.gunmetal, 0, -0.03, 0));
      return A;
    }
    J.armL = arm('L'); J.armR = arm('R');

    /* legs */
    function leg(side) {
      var s = side === 'L' ? -1 : 1, L = {};
      L.hip = pivot(J.pelvis, s * 0.17, -0.12, 0);
      L.hip.add(mesh(new T.SphereGeometry(0.1, 24, 16), M.chrome));
      L.hip.add(mesh(limbShell(0.135, 0.1, 0.72, 0.02), M.ceramic, 0, -0.06, 0));
      L.knee = pivot(L.hip, 0, -0.8, 0);
      L.knee.add(mesh(new T.SphereGeometry(0.08, 24, 16), M.chrome));
      var cap = mesh(new T.SphereGeometry(0.075, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), M.ceramicDark, 0, 0.0, 0.05); cap.rotation.x = Math.PI / 2; J.knee = cap; L.knee.add(cap);
      L.knee.add(mesh(limbShell(0.1, 0.065, 0.66, 0.015), M.ceramic, 0, -0.06, 0));
      L.ankle = pivot(L.knee, 0, -0.74, 0);
      L.ankle.add(mesh(new T.SphereGeometry(0.05, 16, 12), M.chrome));
      var foot = mesh(new T.BoxGeometry(0.13, 0.07, 0.3), M.ceramic, 0, -0.07, 0.07); L.ankle.add(foot);
      L.ankle.add(mesh(new T.BoxGeometry(0.135, 0.02, 0.31), M.rubber, 0, -0.105, 0.07));
      return L;
    }
    J.legL = leg('L'); J.legR = leg('R');

    var bot = {
      root: root, joints: J, materials: M,
      setEye: function (hex, intensity) {
        M.eye.color.setHex(hex); M.core.color.setHex(hex);
        var k = intensity == null ? 1 : intensity; M.eye.color.multiplyScalar(1.15 * k); M.core.color.multiplyScalar(1.1 * k);
        M.eyeCore.color.setScalar(Math.min(1, 0.4 + k * 0.6));
      },
      // Angles in radians. arm: { shoulder:[x,y,z], elbow, wrist:[x,y,z], grip }  leg: { hip:[x,y,z], knee, ankle }
      pose: function (p) {
        p = p || {};
        J.head.rotation.set(p.headPitch || 0, p.headYaw || 0, p.headRoll || 0);
        J.neck.rotation.set((p.headPitch || 0) * 0.3, (p.headYaw || 0) * 0.25, 0);
        J.chest.rotation.set(p.chestPitch || 0, p.chestYaw || 0, p.chestRoll || 0);
        J.spine.rotation.set(p.spinePitch || 0, 0, 0);
        J.pelvis.rotation.set(0, p.hipYaw || 0, 0);
        J.pelvis.position.y = 1.62 + (p.lift || 0);
        ['L', 'R'].forEach(function (s) {
          var a = p['arm' + s] || {}, A = J['arm' + s], sg = s === 'L' ? -1 : 1, sh = a.shoulder || [0, 0, 0.12 * sg];
          A.shoulder.rotation.set(sh[0], sh[1], sh[2]);
          A.elbow.rotation.set(a.elbow || -0.15, 0, 0);
          var w = a.wrist || [0, 0, 0]; A.wrist.rotation.set(w[0], w[1], w[2]);
          var gr = a.grip == null ? 0.25 : a.grip; for (var f = 0; f < 4; f++) A['f' + f].rotation.x = gr;
          var l = p['leg' + s] || {}, L = J['leg' + s], hp = l.hip || [0, 0, 0.03 * sg];
          L.hip.rotation.set(hp[0], hp[1], hp[2]); L.knee.rotation.set(l.knee || 0, 0, 0); L.ankle.rotation.set(l.ankle || 0, 0, 0);
        });
      },
      // A procedural walk: phase in radians.
      walk: function (phase, stride, extra) {
        var s = stride == null ? 0.45 : stride, sin = Math.sin(phase), cos = Math.cos(phase);
        var p = Object.assign({
          lift: Math.abs(cos) * 0.025 - 0.02, hipYaw: sin * 0.06, chestYaw: -sin * 0.08,
          armL: { shoulder: [sin * s * 0.8, 0, -0.1], elbow: -0.25 - Math.max(0, sin) * 0.35 },
          armR: { shoulder: [-sin * s * 0.8, 0, 0.1], elbow: -0.25 - Math.max(0, -sin) * 0.35 },
          legL: { hip: [-sin * s, 0, -0.03], knee: Math.max(0, cos) * s * 1.4, ankle: sin * 0.15 },
          legR: { hip: [sin * s, 0, 0.03], knee: Math.max(0, -cos) * s * 1.4, ankle: -sin * 0.15 }
        }, extra || {});
        bot.pose(p);
      }
    };
    bot.setEye(opts.eye != null ? opts.eye : 0x7ff6ff, 1);
    bot.pose({});
    return bot;
  }

  // Studio lighting environment for reflections (no network: generated in-scene).
  function studio(renderer) {
    if (!T.RoomEnvironment) return null;
    var pm = new T.PMREMGenerator(renderer);
    var env = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
    pm.dispose(); return env;
  }

  window.AsimovRobot = { create: create, studio: studio };
})();

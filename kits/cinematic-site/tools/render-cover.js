// node tools/render-cover.js — renders R-7 stills used when live 3D can't run (needs playwright + Chromium)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(require('fs').existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } : {});
  for (const [shot, w, h, out] of [['cover', 1000, 1400, 'r7-cover'], ['fiction', 600, 840, 'r7-fiction']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto('file://' + path.join(__dirname, 'render-cover.html') + `?shot=${shot}&w=${w}&h=${h}`);
    await p.waitForFunction(() => window.DONE, null, { timeout: 120000 }); await p.waitForTimeout(500);
    await (await p.$('#c')).screenshot({ path: path.join(__dirname, '..', 'assets', out + '.png') });
    await p.close();
  }
  await b.close();
})();

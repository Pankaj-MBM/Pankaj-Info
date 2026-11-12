// Renders every <section class="shot" id="…"> in scripts/mockups/mockups.html to
// src/assets/projects/<id>.png (1600×1000) with local Chrome via the DevTools Protocol — no dependencies.
// These are ILLUSTRATIVE UI mockups (marked `illustration: true` in the project files), not real screenshots.
// Run: node scripts/make-mockups.mjs   (set CHROME_PATH if Chrome lives elsewhere)
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9342;
const outDir = 'src/assets/projects';
const proc = spawn(
  chrome,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--allow-file-access-from-files',
    '--hide-scrollbars',
    '--no-first-run',
    `--user-data-dir=${mkdtempSync(join(tmpdir(), 'mockups-chrome-'))}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

try {
  let target;
  for (let i = 0; i < 60 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
    } catch {
      /* Chrome still starting */
    }
    if (!target) await sleep(250);
  }
  if (!target) throw new Error('Chrome did not start — set CHROME_PATH');

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let seq = 0;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    pending.get(msg.id)?.(msg);
    pending.delete(msg.id);
  });
  const send = (method, params = {}) =>
    new Promise((res) => {
      const id = ++seq;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(resolve('scripts/mockups/mockups.html')).href });
  await sleep(2500);
  const { result } = await send('Runtime.evaluate', {
    expression: `JSON.stringify([...document.querySelectorAll('section.shot')].map(s => { const r = s.getBoundingClientRect(); return { id: s.id, x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; }))`,
    returnByValue: true,
  });
  const shots = JSON.parse(result.result.value);
  mkdirSync(outDir, { recursive: true });
  for (const s of shots) {
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: s.x, y: s.y, width: s.w, height: s.h, scale: 1 },
    });
    writeFileSync(`${outDir}/${s.id}.png`, Buffer.from(shot.result.data, 'base64'));
    console.log(`wrote ${outDir}/${s.id}.png`);
  }
  ws.close();
} finally {
  proc.kill();
}

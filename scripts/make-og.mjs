// Renders scripts/og-template.html to public/og/og-default.png (1200×630) with local Chrome via the
// DevTools Protocol — no dependencies. Run: node scripts/make-og.mjs   (set CHROME_PATH if Chrome lives elsewhere)
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9341;
const profileDir = mkdtempSync(join(tmpdir(), 'og-chrome-'));
const proc = spawn(
  chrome,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--allow-file-access-from-files',
    '--hide-scrollbars',
    '--no-first-run',
    `--user-data-dir=${profileDir}`,
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

  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: pathToFileURL(resolve('scripts/og-template.html')).href });
  await sleep(2000);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  mkdirSync('public/og', { recursive: true });
  writeFileSync('public/og/og-default.png', Buffer.from(shot.result.data, 'base64'));
  console.log('wrote public/og/og-default.png');
  ws.close();
} finally {
  proc.kill();
}

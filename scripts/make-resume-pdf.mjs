// Prints the site's /resume/ page to public/resume/Pankaj-Parihar-Resume.pdf (A4) with local Chrome via the
// DevTools Protocol — no dependencies. The PDF is generated from the same data as the website, so the two
// never disagree (experience, dates, skills).
// Run with the site served locally:  npm run build && npm run preview   then   node scripts/make-resume-pdf.mjs
// Env: RESUME_URL (default http://localhost:4321/resume/), CHROME_PATH.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.env.RESUME_URL ?? 'http://localhost:4321/resume/';
const out = 'public/resume/Pankaj-Parihar-Resume.pdf';
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9342;
const profileDir = mkdtempSync(join(tmpdir(), 'resume-chrome-'));
const proc = spawn(
  chrome,
  ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${profileDir}`, 'about:blank'],
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

  await send('Page.enable');
  const loaded = new Promise((r) => {
    ws.addEventListener('message', function onLoad(ev) {
      if (JSON.parse(ev.data).method === 'Page.loadEventFired') {
        ws.removeEventListener('message', onLoad);
        r();
      }
    });
  });
  await send('Page.navigate', { url });
  await loaded;
  // Light theme for print, and let web fonts settle.
  await send('Runtime.evaluate', { expression: "document.documentElement.dataset.theme='light'" });
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  await sleep(500);

  const pdf = await send('Page.printToPDF', {
    printBackground: true,
    preferCSSPageSize: true,
    paperWidth: 8.27,
    paperHeight: 11.69,
    displayHeaderFooter: false,
  });
  if (!pdf.result?.data) throw new Error(`printToPDF failed: ${JSON.stringify(pdf.error ?? pdf)}`);
  mkdirSync('public/resume', { recursive: true });
  writeFileSync(out, Buffer.from(pdf.result.data, 'base64'));
  console.log(`wrote ${out}`);
  ws.close();
} finally {
  proc.kill();
}

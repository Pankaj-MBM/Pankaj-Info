// Renders scripts/resume/resume.html to public/resume/Pankaj-Parihar-Resume.pdf with local Chrome via the
// DevTools Protocol — no dependencies. Run: node scripts/make-resume.mjs   (set CHROME_PATH if needed)
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = 'public/resume/Pankaj-Parihar-Resume.pdf';
const chrome = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9343;
const profileDir = mkdtempSync(join(tmpdir(), 'resume-chrome-'));
const proc = spawn(
  chrome,
  ['--headless=new', `--remote-debugging-port=${port}`, '--allow-file-access-from-files', '--no-first-run', `--user-data-dir=${profileDir}`, 'about:blank'],
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

  await send('Page.navigate', { url: pathToFileURL(resolve('scripts/resume/resume.html')).href });
  await sleep(1200);
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true, displayHeaderFooter: false });
  if (!pdf.result?.data) throw new Error(`printToPDF failed: ${JSON.stringify(pdf.error ?? pdf)}`);
  mkdirSync('public/resume', { recursive: true });
  writeFileSync(out, Buffer.from(pdf.result.data, 'base64'));
  console.log(`wrote ${out}`);
  ws.close();
} finally {
  proc.kill();
}

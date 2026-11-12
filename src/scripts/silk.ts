/**
 * "Silk" hero background: a ribbon of fine threads that rises from the lower-left to behind the portrait,
 * twisting slowly and bending a little towards the pointer.
 * Light on purpose: one 2D canvas, ~30 polylines, DPR capped at 2, paused off-screen / in hidden tabs,
 * and a single still frame for prefers-reduced-motion.
 */
import { prefersReducedMotion } from './utils';

type Rgb = [number, number, number];

const parseRgb = (v: string, fallback: Rgb): Rgb => {
  const parts = v.trim().split(/\s+/).map(Number);
  return parts.length === 3 && parts.every((n) => Number.isFinite(n)) ? (parts as Rgb) : fallback;
};

export function initSilk(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!host || !ctx) return;

  const still = prefersReducedMotion();
  let w = 0;
  let h = 0;
  let colorA: Rgb = [176, 141, 87];
  let colorB: Rgb = [31, 59, 143];
  let alpha = 0.22;
  let raf = 0;
  let running = false;
  let t = 0;
  let last = 0;
  // Pointer influence, eased towards its target every frame.
  const pointer = { x: 0.7, y: 0.4, tx: 0.7, ty: 0.4, pull: 0, tpull: 0 };

  const readColors = () => {
    const cs = getComputedStyle(host);
    colorA = parseRgb(cs.getPropertyValue('--silk-a'), colorA);
    colorB = parseRgb(cs.getPropertyValue('--silk-b'), colorB);
    alpha = Number(cs.getPropertyValue('--silk-alpha')) || alpha;
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = host.clientWidth;
    h = host.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!running) draw();
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const mobile = w < 768;
    const lines = mobile ? 26 : 40;
    const step = mobile ? 10 : 14;
    // Desktop: rises from below the text to behind the portrait. Mobile: flows behind the photo on the first screen.
    const span = Math.min(h, mobile ? 560 : 900);
    const startY = mobile ? span * 0.8 : span * 0.98;
    const endY = mobile ? span * 0.22 : span * 0.08;
    const spread = mobile ? 5.5 : 9;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    pointer.pull += (pointer.tpull - pointer.pull) * 0.04;

    const grad = ctx.createLinearGradient(0, startY, w, endY);
    const [ar, ag, ab] = colorA;
    const [br, bg, bb] = colorB;
    grad.addColorStop(0, `rgb(${ar} ${ag} ${ab} / 0)`);
    grad.addColorStop(0.3, `rgb(${ar} ${ag} ${ab} / ${alpha})`);
    grad.addColorStop(0.75, `rgb(${br} ${bg} ${bb} / ${alpha})`);
    grad.addColorStop(1, `rgb(${br} ${bg} ${bb} / 0)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1;

    const px = pointer.x * w;
    const py = pointer.y * h;
    for (let i = 0; i < lines; i++) {
      const k = i / (lines - 1) - 0.5; // -0.5 … 0.5 across the ribbon
      ctx.beginPath();
      for (let x = -step; x <= w + step; x += step) {
        const u = x / w;
        const base = startY + (endY - startY) * (u * u * (3 - 2 * u)); // smooth S-curve rise
        const wave = Math.sin(u * 4.6 + t * 0.5) * (mobile ? 30 : 52) + Math.sin(u * 11 - t * 0.8 + k * 2) * 10;
        const twist = Math.sin(u * 3.4 - t * 0.45) * 1.4 + 0.25; // threads cross over like silk
        let y = base + wave + k * spread * 22 * twist;
        const dx = (x - px) / (w * 0.18);
        y += (py - y) * 0.22 * pointer.pull * Math.exp(-dx * dx);
        if (x === -step) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  };

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    t += dt;
    draw();
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || still) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  readColors();
  resize();
  new ResizeObserver(resize).observe(host);
  new MutationObserver(() => {
    readColors();
    if (!running) draw();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (!still) {
    let visible = true;
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      visible && !document.hidden ? start() : stop();
    }).observe(host);
    document.addEventListener('visibilitychange', () => (visible && !document.hidden ? start() : stop()));

    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      host.addEventListener('pointermove', (e) => {
        const r = host.getBoundingClientRect();
        pointer.tx = (e.clientX - r.left) / r.width;
        pointer.ty = (e.clientY - r.top) / r.height;
        pointer.tpull = 1;
      });
      host.addEventListener('pointerleave', () => (pointer.tpull = 0));
    }
  }
  canvas.classList.add('is-ready');
}

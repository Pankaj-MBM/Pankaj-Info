/**
 * "Silk" hero background: ribbons of fine gold and blue threads flowing around the portrait.
 * Luxury details: threads are brighter in the middle of each ribbon (depth), a slow glint of light travels
 * along every ribbon like light catching satin, and a few specks of gold dust drift and twinkle on the silk.
 * Everything bends a little towards the pointer.
 * Light on purpose: one 2D canvas, ~90 polylines + ~30 specks, DPR capped at 2, paused off-screen and in
 * hidden tabs, and a single still frame for prefers-reduced-motion.
 */
import { prefersReducedMotion } from './utils';

type Rgb = [number, number, number];

/**
 * y values (from / to) are fractions of the hero's first screen. `fade` = where along x a ribbon fades in,
 * is fully visible, and fades out again — this keeps threads off the headline. swap = blue→gold.
 */
type Ribbon = {
  from: number;
  to: number;
  lines: number;
  spread: number;
  amp: number;
  freq: number;
  speed: number;
  phase: number;
  weight: number;
  fade: [number, number, number, number];
  swap?: boolean;
  desktopOnly?: boolean;
};

const RIBBONS: Ribbon[] = [
  // Main ribbon: from below the text, rising behind the portrait.
  { from: 0.98, to: 0.08, lines: 40, spread: 9, amp: 52, freq: 4.6, speed: 0.5, phase: 0, weight: 1, fade: [0, 0.3, 0.75, 1] },
  // Counter ribbon: falls across the right half, crossing the main one behind the photo.
  { from: 0.05, to: 0.92, lines: 28, spread: 6, amp: 40, freq: 3.8, speed: -0.42, phase: 2.1, weight: 0.8, fade: [0.45, 0.68, 0.9, 1], swap: true },
  // Low, faint ribbon along the bottom of the first screen.
  { from: 0.9, to: 0.8, lines: 22, spread: 4, amp: 26, freq: 6.2, speed: 0.36, phase: 4.2, weight: 0.55, fade: [0, 0.25, 0.7, 1], desktopOnly: true },
];

type Speck = { ribbon: number; u: number; k: number; drift: number; seed: number; size: number };

const parseRgb = (v: string, fallback: Rgb): Rgb => {
  const parts = v.trim().split(/\s+/).map(Number);
  return parts.length === 3 && parts.every((n) => Number.isFinite(n)) ? (parts as Rgb) : fallback;
};
const rgba = (c: Rgb, a: number) => `rgb(${c[0]} ${c[1]} ${c[2]} / ${a.toFixed(3)})`;
const clamp01 = (n: number) => Math.min(Math.max(n, 0), 1);

export function initSilk(canvas: HTMLCanvasElement) {
  const host = canvas.parentElement;
  const ctx = canvas.getContext('2d');
  if (!host || !ctx) return;

  const still = prefersReducedMotion();
  let w = 0;
  let h = 0;
  let colorA: Rgb = [176, 141, 87];
  let colorB: Rgb = [31, 59, 143];
  let glint: Rgb = [138, 106, 53];
  let alpha = 0.22;
  let luminous = false; // dark theme: threads add light where they cross
  let raf = 0;
  let running = false;
  let t = 0;
  let last = 0;
  const pointer = { x: 0.7, y: 0.4, tx: 0.7, ty: 0.4, pull: 0, tpull: 0 };

  // Gold dust: specks that live on the two upper ribbons and drift along them (right half only).
  const specks: Speck[] = Array.from({ length: 30 }, (_, i) => ({
    ribbon: i % 3 === 0 ? 1 : 0,
    u: Math.random(),
    k: Math.random() - 0.5,
    drift: 0.006 + Math.random() * 0.012,
    seed: Math.random() * Math.PI * 2,
    size: 0.8 + Math.random() * 1.4,
  }));

  const readColors = () => {
    const cs = getComputedStyle(host);
    colorA = parseRgb(cs.getPropertyValue('--silk-a'), colorA);
    colorB = parseRgb(cs.getPropertyValue('--silk-b'), colorB);
    glint = parseRgb(cs.getPropertyValue('--silk-glint'), glint);
    alpha = Number(cs.getPropertyValue('--silk-alpha')) || alpha;
    luminous = document.documentElement.dataset.theme === 'dark';
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

  /** Geometry shared by threads and specks. */
  const layout = () => {
    const mobile = w < 768;
    const span = Math.min(h, mobile ? 560 : 900);
    return { mobile, span };
  };
  const ends = (r: Ribbon, mobile: boolean, span: number) => ({
    startY: span * (mobile ? 0.2 + r.from * 0.62 : r.from),
    endY: span * (mobile ? 0.2 + r.to * 0.62 : r.to),
  });
  const yAt = (r: Ribbon, x: number, k: number, startY: number, endY: number, mobile: boolean) => {
    const u = clamp01(x / w);
    const tt = t * r.speed;
    const amp = r.amp * (mobile ? 0.6 : 1);
    const spread = r.spread * (mobile ? 0.6 : 1);
    const base = startY + (endY - startY) * (u * u * (3 - 2 * u)); // smooth S-curve
    const wave = Math.sin(u * r.freq + tt + r.phase) * amp + Math.sin(u * 11 - tt * 1.6 + k * 2) * 10;
    const twist = Math.sin(u * 3.4 - tt * 0.9 + r.phase) * 1.4 + 0.25; // threads cross over like silk
    let y = base + wave + k * spread * 22 * twist;
    const dx = (x - pointer.x * w) / (w * 0.18);
    y += (pointer.y * h - y) * 0.22 * pointer.pull * Math.exp(-dx * dx);
    return y;
  };

  /** Ribbon colour along x, with a soft glint that slides along it over time. */
  const ribbonGradient = (r: Ribbon, index: number, startY: number, endY: number) => {
    const [c1, c2] = r.swap ? [colorB, colorA] : [colorA, colorB];
    const a = alpha * r.weight;
    const grad = ctx.createLinearGradient(0, startY, w, endY);
    const [f0, f1, f2, f3] = r.fade;
    grad.addColorStop(f0, rgba(c1, 0));
    grad.addColorStop(f1, rgba(c1, a));
    grad.addColorStop(f2, rgba(c2, a));
    grad.addColorStop(f3, rgba(c2, 0));
    // Glint: travels from f1 to f2 every ~9 s, offset per ribbon.
    const p = (t / 9 + index * 0.37) % 1;
    const g = f1 + (f2 - f1) * p;
    const half = 0.07;
    if (g - half > f1 && g + half < f2) {
      const mix = (g - f1) / (f2 - f1);
      const base: Rgb = [0, 1, 2].map((i) => Math.round(c1[i] + (c2[i] - c1[i]) * mix)) as Rgb;
      grad.addColorStop(g - half, rgba(base, a));
      grad.addColorStop(g, rgba(glint, Math.min(a * 2.6, 0.85)));
      grad.addColorStop(g + half, rgba(base, a));
    }
    return grad;
  };

  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const { mobile, span } = layout();
    const step = mobile ? 10 : 14;

    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    pointer.pull += (pointer.tpull - pointer.pull) * 0.04;

    ctx.globalCompositeOperation = luminous ? 'lighter' : 'source-over';
    ctx.lineWidth = 1;
    RIBBONS.forEach((r, index) => {
      if (mobile && r.desktopOnly) return;
      const { startY, endY } = ends(r, mobile, span);
      ctx.strokeStyle = ribbonGradient(r, index, startY, endY);
      const lines = mobile ? Math.round(r.lines * 0.65) : r.lines;
      for (let i = 0; i < lines; i++) {
        const k = i / (lines - 1) - 0.5; // -0.5 … 0.5 across the ribbon
        ctx.globalAlpha = 1 - Math.abs(k) * 1.3; // fuller in the middle → volume
        ctx.beginPath();
        for (let x = -step; x <= w + step; x += step) {
          const y = yAt(r, x, k, startY, endY, mobile);
          if (x === -step) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    });

    // Gold dust.
    ctx.globalAlpha = 1;
    for (const s of specks) {
      const r = RIBBONS[s.ribbon];
      const visibleFrom = Math.max(r.fade[1], 0.52); // keep dust on the photo side, off the text
      const visibleTo = r.fade[2];
      const u = visibleFrom + (visibleTo - visibleFrom) * ((s.u + t * s.drift) % 1);
      const { startY, endY } = ends(r, mobile, span);
      const x = u * w;
      const y = yAt(r, x, s.k, startY, endY, mobile);
      const twinkle = Math.max(0, Math.sin(t * 1.4 + s.seed)) ** 3;
      if (twinkle < 0.02) continue;
      const size = s.size * (mobile ? 0.85 : 1);
      const halo = ctx.createRadialGradient(x, y, 0, x, y, size * 6);
      halo.addColorStop(0, rgba(glint, 0.55 * twinkle));
      halo.addColorStop(1, rgba(glint, 0));
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, size * 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(luminous ? [255, 248, 230] : glint, 0.95 * twinkle);
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
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
  if (still) t = 2.2; // a pleasant still frame: glint mid-ribbon, some dust lit
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

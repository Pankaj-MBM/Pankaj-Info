/**
 * 3D particle hero: thousands of points assemble into the name, scatter away from the cursor,
 * burst on click, and drift into space while scrolling. Lazy-loaded; the real <h1> stays underneath.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';

const FOV = 35;

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uProgress;
  uniform vec2 uMouse;
  uniform float uRadius;
  uniform float uForce;
  uniform float uScroll;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uDist;
  uniform float uMinX;
  uniform float uRangeX;
  attribute vec3 aTarget;
  attribute vec3 aStart;
  attribute float aSeed;
  attribute float aDust;
  varying float vAlpha;
  varying float vMix;

  void main() {
    float t = clamp((uProgress - aSeed * 0.45) / 0.55, 0.0, 1.0);
    t = t * t * (3.0 - 2.0 * t);
    vec3 p = mix(aStart, aTarget, t);

    float wobble = mix(1.6, 7.0, aDust);
    p.x += sin(uTime * 0.7 + aSeed * 40.0) * wobble;
    p.y += cos(uTime * 0.55 + aSeed * 31.0) * wobble;
    p.z += sin(uTime * 0.4 + aSeed * 17.0) * wobble * 2.0;

    vec2 d = p.xy - uMouse;
    float dist = length(d);
    float f = smoothstep(uRadius, 0.0, dist) * uForce * (1.0 - aDust * 0.6);
    p.xy += normalize(d + vec2(0.0001)) * f;
    p.z += f * 1.4;

    p.y += uScroll * (140.0 + aSeed * 420.0);
    p.z += uScroll * (aSeed - 0.35) * 900.0;
    p.x += uScroll * (aSeed - 0.5) * 300.0;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * mix(1.0, 0.75, aDust) * (uDist / -mv.z);

    vAlpha = mix(0.95, 0.4, aDust) * (1.0 - uScroll * 0.85) * (0.35 + 0.65 * t);
    vMix = clamp((aTarget.x - uMinX) / uRangeX, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying float vAlpha;
  varying float vMix;

  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float a = smoothstep(0.5, 0.08, r) * vAlpha;
    vec3 col = vMix < 0.5 ? mix(uColorA, uColorB, vMix * 2.0) : mix(uColorB, uColorC, (vMix - 0.5) * 2.0);
    gl_FragColor = vec4(col, a);
  }
`;

const PALETTES = {
  dark: { a: '#7ab0ff', b: '#e8edf6', c: '#ffc24d', blending: AdditiveBlending },
  light: { a: '#1d5bbf', b: '#0b1220', c: '#c27a00', blending: NormalBlending },
};

const hexToVec = (hex: string) =>
  new Vector3(parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255);

export async function startHero3D(canvas: HTMLCanvasElement, nameEl: HTMLElement) {
  const hero = canvas.parentElement as HTMLElement;
  await document.fonts.ready;
  // Measure the name only after its entrance animation has finished.
  await Promise.all(nameEl.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));

  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 6000);

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uMouse: { value: { x: 1e5, y: 1e5 } },
      uRadius: { value: 120 },
      uForce: { value: 70 },
      uScroll: { value: 0 },
      uSize: { value: 2.6 },
      uPixelRatio: { value: dpr },
      uDist: { value: 1000 },
      uMinX: { value: -500 },
      uRangeX: { value: 1000 },
      uColorA: { value: new Vector3() },
      uColorB: { value: new Vector3() },
      uColorC: { value: new Vector3() },
    },
  });
  const applyTheme = () => {
    const p = document.documentElement.dataset.theme === 'light' ? PALETTES.light : PALETTES.dark;
    material.uniforms.uColorA.value = hexToVec(p.a);
    material.uniforms.uColorB.value = hexToVec(p.b);
    material.uniforms.uColorC.value = hexToVec(p.c);
    material.blending = p.blending;
    material.needsUpdate = true;
  };
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let points: Points | null = null;
  let W = 0;
  let H = 0;

  /** Draw the h1 lines onto an offscreen canvas at their real positions and sample filled pixels. */
  const sampleTargets = (): number[] => {
    const heroRect = hero.getBoundingClientRect();
    const off = document.createElement('canvas');
    off.width = Math.ceil(W);
    off.height = Math.ceil(H);
    const ctx = off.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];
    ctx.fillStyle = '#fff';
    nameEl.querySelectorAll<HTMLElement>('[data-line]').forEach((line) => {
      const cs = getComputedStyle(line);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = cs.letterSpacing;
      const text = (line.textContent ?? '').trim();
      const m = ctx.measureText(text);
      const r = line.getBoundingClientRect();
      const lineHeight = r.height;
      const halfLeading = (lineHeight - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
      ctx.fillText(text, r.left - heroRect.left, r.top - heroRect.top + halfLeading + m.fontBoundingBoxAscent);
    });
    const { data } = ctx.getImageData(0, 0, off.width, off.height);
    const step = W < 700 ? 3 : 4;
    const out: number[] = [];
    for (let y = 0; y < off.height; y += step) {
      for (let x = 0; x < off.width; x += step) {
        if (data[(y * off.width + x) * 4 + 3] > 140) out.push(x - W / 2, H / 2 - y);
      }
    }
    return out;
  };

  const build = (instant: boolean) => {
    const rect = hero.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const dist = H / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    material.uniforms.uDist.value = dist;
    material.uniforms.uRadius.value = W < 700 ? 80 : 130;
    material.uniforms.uSize.value = W < 700 ? 2.5 : 2.6;

    const samples = sampleTargets();
    // Spread the blue → white → marigold gradient across the name itself.
    let minX = Infinity;
    let maxX = -Infinity;
    for (let i = 0; i < samples.length; i += 2) {
      if (samples[i] < minX) minX = samples[i];
      if (samples[i] > maxX) maxX = samples[i];
    }
    if (Number.isFinite(minX)) {
      material.uniforms.uMinX.value = minX;
      material.uniforms.uRangeX.value = Math.max(1, maxX - minX);
    }
    const maxText = W < 700 ? 4200 : 9000;
    const textCount = Math.min(maxText, samples.length / 2);
    const dustCount = W < 700 ? 500 : 1400;
    const total = textCount + dustCount;
    const target = new Float32Array(total * 3);
    const start = new Float32Array(total * 3);
    const seed = new Float32Array(total);
    const dust = new Float32Array(total);
    const pickStride = samples.length / 2 / Math.max(1, textCount);
    for (let i = 0; i < total; i++) {
      const isDust = i >= textCount;
      if (!isDust) {
        const s = Math.floor(i * pickStride + Math.random() * pickStride) * 2;
        target[i * 3] = samples[s] + (Math.random() - 0.5) * 1.5;
        target[i * 3 + 1] = samples[s + 1] + (Math.random() - 0.5) * 1.5;
        target[i * 3 + 2] = (Math.random() - 0.5) * 18;
      } else {
        target[i * 3] = (Math.random() - 0.5) * W * 1.2;
        target[i * 3 + 1] = (Math.random() - 0.5) * H * 1.2;
        target[i * 3 + 2] = (Math.random() - 0.5) * 900;
      }
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = W * (0.6 + Math.random() * 0.9);
      start[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      start[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      start[i * 3 + 2] = radius * Math.cos(phi) - 400;
      seed[i] = Math.random();
      dust[i] = isDust ? 1 : 0;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(target.slice(), 3));
    geometry.setAttribute('aTarget', new BufferAttribute(target, 3));
    geometry.setAttribute('aStart', new BufferAttribute(start, 3));
    geometry.setAttribute('aSeed', new BufferAttribute(seed, 1));
    geometry.setAttribute('aDust', new BufferAttribute(dust, 1));
    if (points) {
      scene.remove(points);
      points.geometry.dispose();
    }
    points = new Points(geometry, material);
    points.frustumCulled = false;
    scene.add(points);
    if (instant) material.uniforms.uProgress.value = 1;
  };
  build(false);

  // Pointer: smoothed mouse in world space (z = 0 plane maps 1 unit = 1 CSS px).
  const mouse = { x: 1e5, y: 1e5, tx: 1e5, ty: 1e5, nx: 0, ny: 0 };
  let force = 70;
  const onMove = (e: PointerEvent) => {
    const r = hero.getBoundingClientRect();
    mouse.tx = e.clientX - r.left - W / 2;
    mouse.ty = H / 2 - (e.clientY - r.top);
    mouse.nx = mouse.tx / (W / 2);
    mouse.ny = mouse.ty / (H / 2);
    if (mouse.x > 1e4) {
      mouse.x = mouse.tx;
      mouse.y = mouse.ty;
    }
  };
  hero.addEventListener('pointermove', onMove, { passive: true });
  hero.addEventListener('pointerdown', (e) => {
    onMove(e);
    force = 260;
  });
  hero.addEventListener('pointerleave', () => {
    mouse.tx = mouse.ty = mouse.x = mouse.y = 1e5;
    mouse.nx = mouse.ny = 0;
  });

  let resizeTimer: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => build(true), 200);
  });

  let visible = true;
  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(hero);

  const begin = performance.now();
  let revealed = false;
  const tick = (now: number) => {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    const u = material.uniforms;
    const elapsed = (now - begin) / 1000;
    u.uTime.value = elapsed;
    u.uProgress.value = Math.min(1, u.uProgress.value + 0.012);
    if (!revealed && u.uProgress.value > 0.55) {
      revealed = true;
      nameEl.classList.add('is-3d');
    }
    mouse.x += (mouse.tx - mouse.x) * 0.12;
    mouse.y += (mouse.ty - mouse.y) * 0.12;
    u.uMouse.value = { x: mouse.x, y: mouse.y };
    force += (70 - force) * 0.04;
    u.uForce.value = force;
    const r = hero.getBoundingClientRect();
    u.uScroll.value = Math.min(1, Math.max(0, -r.top / (r.height * 0.9)));
    camera.position.x += (mouse.nx * 40 - camera.position.x) * 0.04;
    camera.position.y += (mouse.ny * 25 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };
  canvas.classList.add('is-ready');
  requestAnimationFrame(tick);
}

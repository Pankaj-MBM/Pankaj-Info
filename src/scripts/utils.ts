export const $ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector);
export const $$ = <T extends Element = HTMLElement>(selector: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(selector));

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Area = 'local' | 'session';
const area = (a: Area) => (a === 'local' ? window.localStorage : window.sessionStorage);

/** Storage that never throws (private mode / blocked storage). */
export const storage = {
  get(key: string, a: Area = 'local'): string | null {
    try {
      return area(a).getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string, a: Area = 'local') {
    try {
      area(a).setItem(key, value);
    } catch {
      /* storage unavailable — keep working without persistence */
    }
  },
  remove(key: string, a: Area = 'local') {
    try {
      area(a).removeItem(key);
    } catch {
      /* storage unavailable */
    }
  },
};

interface RawConfig {
  e?: string;
  p?: string;
  t?: string;
  w?: string;
  m?: string;
}
let cache: { email: string; phone: string; tel: string; whatsapp: string; waMessage: string } | null = null;

const decode = (value = '') => {
  try {
    return new TextDecoder().decode(Uint8Array.from(atob(value), (c) => c.charCodeAt(0)));
  } catch {
    return '';
  }
};

/** Contact details from #site-config (base64 so they are not plain text in the HTML). */
export function contactInfo() {
  if (cache) return cache;
  let raw: RawConfig = {};
  try {
    raw = JSON.parse(document.getElementById('site-config')?.textContent || '{}');
  } catch {
    raw = {};
  }
  cache = {
    email: decode(raw.e),
    phone: decode(raw.p),
    tel: decode(raw.t),
    whatsapp: decode(raw.w),
    waMessage: decode(raw.m),
  };
  return cache;
}

export function whatsappUrl() {
  const { whatsapp, waMessage } = contactInfo();
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(waMessage)}`;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export async function copyEmail(source: string) {
  const { email } = contactInfo();
  const ok = await copyText(email);
  toast(ok ? `Email copied: ${email}` : `Email: ${email}`, ok ? 'success' : 'info');
  track('email_copy', { source });
}

/** Toast in the top layer (Popover API) so it stays visible above open dialogs. */
export function toast(message: string, tone: 'success' | 'error' | 'info' = 'info') {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.dataset.tone = tone;
  el.textContent = message;
  region.append(el);
  if (typeof region.showPopover === 'function') {
    try {
      if (region.matches(':popover-open')) region.hidePopover();
      region.showPopover();
    } catch {
      /* popover unsupported — region is still fixed-positioned */
    }
  }
  window.setTimeout(() => {
    el.remove();
    if (!region.childElementCount && typeof region.hidePopover === 'function') {
      try {
        region.hidePopover();
      } catch {
        /* already hidden */
      }
    }
  }, 4000);
}

type AnalyticsWindow = Window & {
  umami?: { track: (event: string, data?: Record<string, string>) => void };
  goatcounter?: { count: (vars: Record<string, unknown>) => void };
};

/** Cookie-less analytics hook (Roadmap §6.8). No-op until a provider script is added. */
export function track(event: string, data?: Record<string, string>) {
  try {
    const w = window as AnalyticsWindow;
    if (w.umami) w.umami.track(event, data);
    else if (w.goatcounter) w.goatcounter.count({ path: event, title: JSON.stringify(data ?? {}), event: true });
  } catch {
    /* analytics must never break the site */
  }
}

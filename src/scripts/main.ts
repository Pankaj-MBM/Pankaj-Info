import { $, $$, contactInfo, copyEmail, prefersReducedMotion, storage, track, whatsappUrl } from './utils';

type ViewTransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

/* ---------- Theme (with a circular view-transition reveal) ---------- */
function initTheme() {
  const root = document.documentElement;
  const buttons = $$<HTMLButtonElement>('[data-theme-toggle]');
  const sync = () => {
    const dark = root.dataset.theme === 'dark';
    buttons.forEach((b) => {
      b.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      b.setAttribute('aria-pressed', String(dark));
    });
  };
  const apply = (theme: 'light' | 'dark') => {
    root.dataset.theme = theme;
    storage.set('theme', theme);
    sync();
  };
  buttons.forEach((btn) =>
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      const doc = document as ViewTransitionDocument;
      track('theme_toggle', { to: next });
      if (!doc.startViewTransition || prefersReducedMotion()) {
        apply(next);
        return;
      }
      const rect = btn.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      const transition = doc.startViewTransition(() => apply(next));
      transition.ready
        .then(() => {
          root.animate(
            { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
            { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' },
          );
        })
        .catch(() => undefined);
    }),
  );
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!storage.get('theme')) {
      root.dataset.theme = e.matches ? 'dark' : 'light';
      sync();
    }
  });
  sync();
}

/* ---------- Header: scrolled state, progress bar, active section ---------- */
function initHeader() {
  const header = $('[data-header]');
  const bar = $('[data-scroll-progress]');
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    header?.toggleAttribute('data-scrolled', y > 8);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar?.style.setProperty('--progress', String(max > 0 ? Math.min(1, y / max) : 0));
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true },
  );
  update();

  const links = $$<HTMLAnchorElement>('[data-nav-link]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const byId = new Map(links.map((l) => [l.dataset.navLink ?? '', l]));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        links.forEach((l) => l.removeAttribute('aria-current'));
        byId.get(entry.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  byId.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  });
}

/* ---------- Dialogs: light-dismiss + close buttons ---------- */
function enhanceDialog(dialog: HTMLDialogElement) {
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  $$('[data-dialog-close]', dialog).forEach((b) => b.addEventListener('click', () => dialog.close()));
}

function initMobileMenu() {
  const dialog = $<HTMLDialogElement>('#mobile-menu');
  const opener = $<HTMLButtonElement>('[data-menu-open]');
  if (!dialog || !opener) return;
  opener.addEventListener('click', () => {
    dialog.showModal();
    opener.setAttribute('aria-expanded', 'true');
  });
  dialog.addEventListener('close', () => opener.setAttribute('aria-expanded', 'false'));
  $$('[data-menu-close], a', dialog).forEach((el) => el.addEventListener('click', () => dialog.close()));
}

function initSummary() {
  const dialog = $<HTMLDialogElement>('#summary-dialog');
  if (!dialog) return;
  enhanceDialog(dialog);
  const open = () => {
    if (dialog.open) return;
    dialog.showModal();
    track('summary_open');
  };
  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element | null)?.closest('[data-open-summary]');
    if (!trigger) return;
    e.preventDefault();
    open();
  });
  window.addEventListener('open-summary', open);
  if (new URLSearchParams(location.search).get('view') === 'summary') open();
}

function initChatFab() {
  const fab = $<HTMLButtonElement>('[data-chat-fab]');
  const dialog = $<HTMLDialogElement>('#chat-dialog');
  if (!fab || !dialog) return;
  enhanceDialog(dialog);
  const open = (question?: string) => {
    if (!dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
      track('chat_open', { source: question ? 'hero' : 'fab' });
    }
    if (question) {
      const chat = dialog.querySelector('ask-pankaj') as (HTMLElement & { askById?: (id: string) => void }) | null;
      chat?.askById?.(question);
    }
  };
  fab.addEventListener('click', () => open());
  window.addEventListener('open-chat', () => open());
  $$<HTMLButtonElement>('[data-ask]').forEach((b) => b.addEventListener('click', () => open(b.dataset.ask)));

  const heroChat = $('[data-hero-chat]');
  const large = matchMedia('(min-width: 1024px)');
  let heroVisible = false;
  const sync = () => fab.toggleAttribute('data-visible', !large.matches || !heroVisible);
  if (heroChat && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      sync();
    }).observe(heroChat);
  }
  large.addEventListener('change', sync);
  sync();
}

/* ---------- Command palette (lazy-loaded) ---------- */
function initPalette() {
  let loader: Promise<typeof import('./palette')> | null = null;
  const load = () => (loader ??= import('./palette'));
  const open = () => {
    load()
      .then((m) => m.openPalette())
      .catch(() => undefined);
  };
  $$('[data-open-palette]').forEach((b) => {
    b.addEventListener('click', open);
    b.addEventListener('pointerenter', () => void load(), { once: true });
    b.addEventListener('focus', () => void load(), { once: true });
  });
  document.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    const typing = target?.closest('input, textarea, select, [contenteditable="true"]');
    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
    } else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      open();
    }
  });
  const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgent);
  $$('[data-kbd-hint]').forEach((el) => (el.textContent = isMac ? '⌘K' : 'Ctrl K'));
}

/* ---------- Contact actions (email, WhatsApp, phone) ---------- */
function initContactActions() {
  const { email, phone, tel } = contactInfo();
  $$('[data-email-text]').forEach((el) => (el.textContent = email));
  $$('[data-copy-email]').forEach((btn) =>
    btn.addEventListener('click', () => void copyEmail(btn.closest('section, footer, dialog, header')?.id || 'page')),
  );
  $$<HTMLAnchorElement>('[data-whatsapp]').forEach((a) => {
    a.href = whatsappUrl();
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.addEventListener('click', () => track('whatsapp_click'));
  });
  $$<HTMLButtonElement>('[data-reveal-phone]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const link = document.createElement('a');
      link.href = `tel:${tel}`;
      link.className = btn.className;
      link.innerHTML = btn.innerHTML;
      const value = link.querySelector('[data-phone-text]');
      if (value) value.textContent = phone;
      const label = link.querySelector('.channel-label');
      if (label) label.textContent = 'Phone · tap to call';
      link.querySelector('[data-phone-icon]')?.remove();
      btn.replaceWith(link);
      link.focus();
      track('phone_reveal');
    }),
  );
  $$<HTMLElement>('[data-track]').forEach((el) =>
    el.addEventListener('click', () => track(el.dataset.track ?? 'click', { source: el.dataset.trackSource ?? '' })),
  );
}

/* ---------- Local time + time-zone relation ---------- */
function offsetMinutes(timeZone: string) {
  const part = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'longOffset' })
    .formatToParts(new Date())
    .find((p) => p.type === 'timeZoneName')?.value;
  const match = part?.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
  if (!match) return 0;
  return (match[1] === '-' ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

function initLocalTime() {
  const clocks = $$('[data-local-time]');
  const relations = $$('[data-tz-relation]');
  if (!clocks.length && !relations.length) return;
  const zone = clocks[0]?.dataset.tz ?? 'Asia/Kolkata';
  const format = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: zone });
  const tick = () => clocks.forEach((el) => (el.textContent = `${format.format(new Date())} IST`));
  tick();
  window.setInterval(tick, 30_000);

  try {
    const visitorZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const diff = offsetMinutes(zone) - offsetMinutes(visitorZone);
    let message = 'Same time zone as you 👋';
    if (diff !== 0) {
      const abs = Math.abs(diff);
      const span = [Math.floor(abs / 60) ? `${Math.floor(abs / 60)}h` : '', abs % 60 ? `${abs % 60}m` : '']
        .filter(Boolean)
        .join(' ');
      message = `${span} ${diff > 0 ? 'ahead of' : 'behind'} you (${visitorZone.replace(/_/g, ' ')})`;
    }
    relations.forEach((el) => (el.textContent = message));
  } catch {
    /* keep the server-rendered text */
  }
}

/* ---------- Reveal on scroll + count-up ---------- */
function initReveal() {
  const items = $$('[data-reveal]');
  if (!items.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('is-visible');
    else observer.observe(el);
  });
  document.documentElement.classList.add('reveal-ready');
}

function initCountUp() {
  const items = $$('[data-count-to]');
  if (!items.length || prefersReducedMotion() || !('IntersectionObserver' in window)) return;
  const run = (el: HTMLElement) => {
    const to = Number(el.dataset.countTo);
    const decimals = Number(el.dataset.decimals ?? 0);
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / 1100);
      el.textContent = (to * (1 - Math.pow(1 - t, 3))).toFixed(decimals);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        run(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    },
    { threshold: 0.6 },
  );
  items.forEach((el) => {
    el.textContent = (0).toFixed(Number(el.dataset.decimals ?? 0));
    observer.observe(el);
  });
}

/* ---------- Project filter (URL-synced) ---------- */
function initProjectFilter() {
  const group = $('[data-project-filter]');
  if (!group) return;
  const buttons = $$<HTMLButtonElement>('[data-filter]', group);
  const cards = $$('[data-project]');
  const empty = $('[data-filter-empty]');
  const moreHeading = $('[data-more-heading]');
  const apply = (tag: string, updateUrl = true) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === tag)));
    let shown = 0;
    let shownMore = 0;
    cards.forEach((card) => {
      const match = tag === 'all' || (card.dataset.tags ?? '').split(' ').includes(tag);
      card.hidden = !match;
      if (match) {
        shown++;
        if (moreHeading && card.compareDocumentPosition(moreHeading) & Node.DOCUMENT_POSITION_PRECEDING) shownMore++;
      }
    });
    if (empty) empty.hidden = shown > 0;
    if (moreHeading) moreHeading.hidden = shownMore === 0;
    if (updateUrl) {
      const url = new URL(location.href);
      if (tag === 'all') url.searchParams.delete('tag');
      else url.searchParams.set('tag', tag);
      history.replaceState(history.state, '', url);
      track('project_filter', { tag });
    }
  };
  buttons.forEach((b) => b.addEventListener('click', () => apply(b.dataset.filter ?? 'all')));
  $('[data-filter-reset]')?.addEventListener('click', () => apply('all'));
  const initial = new URLSearchParams(location.search).get('tag');
  if (initial && buttons.some((b) => b.dataset.filter === initial)) apply(initial, false);
}

/* ---------- Small touches ---------- */
function initMarquee() {
  $$<HTMLButtonElement>('[data-marquee-toggle]').forEach((btn) => {
    const host = btn.closest('[data-marquee]');
    const track = host?.querySelector('.marquee');
    btn.addEventListener('click', () => {
      const paused = !host?.hasAttribute('data-paused');
      host?.toggleAttribute('data-paused', paused);
      track?.toggleAttribute('data-paused', paused);
      btn.setAttribute('aria-pressed', String(paused));
      btn.setAttribute('aria-label', paused ? 'Play the technology logos animation' : 'Pause the technology logos animation');
    });
  });
}

function initSpotlight() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  $$('.spotlight').forEach((el) =>
    el.addEventListener('pointermove', (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    }),
  );
}

function greetDevelopers() {
  const { email } = contactInfo();
  console.log(
    '%cHi developer 👋%c\nLike what you see? I build things like this for a living — %s',
    'font: 600 16px system-ui; color: #1d5bbf',
    'font: 13px system-ui',
    email,
  );
}

initTheme();
initHeader();
initMobileMenu();
initSummary();
initChatFab();
initPalette();
initContactActions();
initLocalTime();
initReveal();
initCountUp();
initProjectFilter();
initMarquee();
initSpotlight();
greetDevelopers();

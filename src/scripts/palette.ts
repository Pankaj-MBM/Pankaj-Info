import { copyEmail, track, whatsappUrl } from './utils';

interface PaletteItem {
  id: string;
  group: string;
  label: string;
  href?: string;
  action?: 'summary' | 'copy-email' | 'whatsapp' | 'chat' | 'theme';
  keywords?: string;
  external?: boolean;
  download?: boolean;
}

let dialog: HTMLDialogElement | null = null;
let input: HTMLInputElement;
let list: HTMLUListElement;
let items: PaletteItem[] = [];
let filtered: PaletteItem[] = [];
let active = 0;

function matches(item: PaletteItem, query: string) {
  if (!query) return true;
  const haystack = `${item.label} ${item.group} ${item.keywords ?? ''}`.toLowerCase();
  if (haystack.includes(query)) return true;
  let i = 0;
  for (const ch of haystack) if (ch === query[i]) i++;
  return i === query.length;
}

function highlight() {
  list.querySelectorAll<HTMLElement>('[role="option"]').forEach((el) => {
    el.setAttribute('aria-selected', String(Number(el.dataset.index) === active));
  });
  const current = list.querySelector<HTMLElement>(`#palette-opt-${active}`);
  input.setAttribute('aria-activedescendant', current?.id ?? '');
  current?.scrollIntoView({ block: 'nearest' });
}

function render() {
  const query = input.value.trim().toLowerCase();
  filtered = items.filter((item) => matches(item, query));
  active = Math.min(active, Math.max(0, filtered.length - 1));
  list.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('li');
    empty.className = 'palette-empty';
    empty.setAttribute('role', 'presentation');
    empty.textContent = 'No results — try “resume”, “email” or “projects”.';
    list.append(empty);
    input.setAttribute('aria-activedescendant', '');
    return;
  }
  let lastGroup = '';
  filtered.forEach((item, index) => {
    if (item.group !== lastGroup) {
      lastGroup = item.group;
      const heading = document.createElement('li');
      heading.className = 'palette-group';
      heading.setAttribute('role', 'presentation');
      heading.textContent = item.group;
      list.append(heading);
    }
    const option = document.createElement('li');
    option.id = `palette-opt-${index}`;
    option.className = 'palette-option';
    option.setAttribute('role', 'option');
    option.dataset.index = String(index);
    const label = document.createElement('span');
    label.textContent = item.label;
    option.append(label);
    if (item.external || item.download) {
      const hint = document.createElement('span');
      hint.className = 'palette-hint';
      hint.textContent = item.download ? 'Download' : 'Opens in new tab';
      option.append(hint);
    }
    list.append(option);
  });
  highlight();
}

async function run(item: PaletteItem | undefined) {
  if (!item || !dialog) return;
  dialog.close();
  track('palette_run', { id: item.id });
  if (item.href) {
    if (item.download) {
      const a = document.createElement('a');
      a.href = item.href;
      a.download = '';
      document.body.append(a);
      a.click();
      a.remove();
      track('resume_download', { source: 'palette' });
    } else if (item.external) {
      window.open(item.href, '_blank', 'noopener');
    } else {
      location.href = item.href;
    }
    return;
  }
  switch (item.action) {
    case 'copy-email':
      await copyEmail('palette');
      break;
    case 'whatsapp':
      window.open(whatsappUrl(), '_blank', 'noopener');
      track('whatsapp_click', { source: 'palette' });
      break;
    case 'theme':
      document.querySelector<HTMLButtonElement>('[data-theme-toggle]')?.click();
      break;
    case 'summary':
      window.dispatchEvent(new CustomEvent('open-summary'));
      break;
    case 'chat':
      window.dispatchEvent(new CustomEvent('open-chat'));
      break;
  }
}

function setup() {
  dialog = document.querySelector<HTMLDialogElement>('#palette');
  if (!dialog) return false;
  const field = dialog.querySelector<HTMLInputElement>('input');
  const listbox = dialog.querySelector<HTMLUListElement>('[role="listbox"]');
  if (!field || !listbox) return false;
  input = field;
  list = listbox;
  try {
    items = JSON.parse(dialog.querySelector('script[type="application/json"]')?.textContent || '[]');
  } catch {
    items = [];
  }
  input.addEventListener('input', () => {
    active = 0;
    render();
  });
  input.addEventListener('keydown', (e) => {
    if (!filtered.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = (active + 1) % filtered.length;
      highlight();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active - 1 + filtered.length) % filtered.length;
      highlight();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      void run(filtered[active]);
    }
  });
  list.addEventListener('click', (e) => {
    const option = (e.target as Element).closest<HTMLElement>('[role="option"]');
    if (option) void run(filtered[Number(option.dataset.index)]);
  });
  list.addEventListener('pointermove', (e) => {
    const option = (e.target as Element).closest<HTMLElement>('[role="option"]');
    if (option && Number(option.dataset.index) !== active) {
      active = Number(option.dataset.index);
      highlight();
    }
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog?.close();
  });
  dialog.addEventListener('close', () => {
    input.value = '';
    active = 0;
  });
  return true;
}

export function openPalette() {
  if (!dialog && !setup()) return;
  if (!dialog || dialog.open) return;
  render();
  dialog.showModal();
  input.focus();
  track('palette_open');
}

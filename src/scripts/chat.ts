import { copyEmail, prefersReducedMotion, track, whatsappUrl } from './utils';

type Action =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'download'; label: string; href: string }
  | { kind: 'copy-email'; label: string }
  | { kind: 'whatsapp'; label: string }
  | { kind: 'summary'; label: string };

interface Item {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  actions?: Action[];
}
interface Payload {
  items: Item[];
  fallback: string;
}

const FALLBACK_ACTIONS: Action[] = [
  { kind: 'copy-email', label: 'Copy email' },
  { kind: 'whatsapp', label: 'WhatsApp' },
];

class AskPankaj extends HTMLElement {
  private data: Payload = { items: [], fallback: '' };
  private log!: HTMLElement;
  private chips!: HTMLElement;
  private form: HTMLFormElement | null = null;
  private asked = new Set<string>();
  private busy = false;

  connectedCallback() {
    if (this.dataset.ready) return;
    this.dataset.ready = 'true';
    try {
      this.data = JSON.parse(this.querySelector('script[type="application/json"]')?.textContent || '');
    } catch {
      return;
    }
    const log = this.querySelector<HTMLElement>('[data-chat-log]');
    const chips = this.querySelector<HTMLElement>('[data-chat-chips]');
    if (!log || !chips) return;
    this.log = log;
    this.chips = chips;
    this.form = this.querySelector('[data-chat-form]');

    this.chips.addEventListener('click', (e) => {
      const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-q]');
      if (btn?.dataset.q) this.ask(btn.dataset.q);
    });
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = this.form?.querySelector('input');
      const text = input?.value.trim() ?? '';
      if (!input || !text || this.busy) return;
      input.value = '';
      this.askFree(text);
    });
    this.querySelector('[data-chat-reset]')?.addEventListener('click', () => this.reset());
    this.log.addEventListener('click', (e) => void this.onAction(e));
    this.renderChips();
  }

  /** Public entry point — e.g. a hero chip opens the chat with this question already asked. */
  askById(id: string) {
    this.ask(id);
  }

  private ask(id: string) {
    const item = this.data.items.find((i) => i.id === id);
    if (!item || this.busy) return;
    this.asked.add(id);
    this.addMessage('user', item.question);
    this.reply(item);
    track('chat_question', { id });
  }

  private askFree(text: string) {
    this.addMessage('user', text);
    const item = this.match(text);
    if (item) this.asked.add(item.id);
    this.reply(item);
    track('chat_question', { id: item?.id ?? 'unmatched' });
  }

  private match(text: string): Item | null {
    const q = text.toLowerCase();
    let best: Item | null = null;
    let bestScore = 0;
    for (const item of this.data.items) {
      const score = item.keywords.reduce((n, k) => n + (q.includes(k) ? 1 : 0), 0);
      if (score > bestScore) {
        best = item;
        bestScore = score;
      }
    }
    return best;
  }

  private reply(item: Item | null) {
    this.setBusy(true);
    const typing = this.addTyping();
    const text = item ? item.answer : this.data.fallback;
    const delay = prefersReducedMotion() ? 0 : Math.min(900, 350 + text.length * 3);
    window.setTimeout(() => {
      typing.remove();
      this.addMessage('bot', text, item ? (item.actions ?? []) : FALLBACK_ACTIONS);
      this.setBusy(false);
      this.renderChips();
    }, delay);
  }

  private addMessage(from: 'bot' | 'user', text: string, actions: Action[] = []) {
    const msg = document.createElement('div');
    msg.className = `msg msg-${from}`;
    const bubble = document.createElement('p');
    bubble.className = 'msg-bubble';
    bubble.textContent = text;
    msg.append(bubble);
    if (actions.length) {
      const row = document.createElement('div');
      row.className = 'msg-actions';
      actions.forEach((a) => row.append(this.renderAction(a)));
      msg.append(row);
    }
    this.log.append(msg);
    this.scrollToEnd();
  }

  private renderAction(action: Action): HTMLElement {
    if (action.kind === 'link' || action.kind === 'download') {
      const a = document.createElement('a');
      a.className = 'msg-action';
      a.href = action.href;
      a.textContent = action.label;
      if (action.kind === 'download') {
        a.setAttribute('download', '');
        a.addEventListener('click', () => track('resume_download', { source: 'chat' }));
      } else {
        a.addEventListener('click', () => this.closest('dialog')?.close());
      }
      return a;
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'msg-action';
    b.textContent = action.label;
    b.dataset.action = action.kind;
    return b;
  }

  private async onAction(e: Event) {
    const el = (e.target as Element).closest<HTMLElement>('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'copy-email') await copyEmail('chat');
    else if (el.dataset.action === 'whatsapp') {
      window.open(whatsappUrl(), '_blank', 'noopener');
      track('whatsapp_click', { source: 'chat' });
    } else if (el.dataset.action === 'summary') {
      this.closest('dialog')?.close();
      window.dispatchEvent(new CustomEvent('open-summary'));
    }
  }

  private addTyping() {
    const msg = document.createElement('div');
    msg.className = 'msg msg-bot';
    msg.innerHTML = '<p class="msg-bubble msg-typing" aria-label="Typing"><span></span><span></span><span></span></p>';
    this.log.append(msg);
    this.scrollToEnd();
    return msg;
  }

  private renderChips() {
    const remaining = this.data.items.filter((i) => !this.asked.has(i.id));
    const list = (remaining.length ? remaining : this.data.items).slice(0, 4);
    this.chips.replaceChildren(
      ...list.map((item) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chat-chip';
        b.dataset.q = item.id;
        b.textContent = item.question;
        return b;
      }),
    );
  }

  private setBusy(busy: boolean) {
    this.busy = busy;
    this.chips.querySelectorAll('button').forEach((b) => (b.disabled = busy));
    const send = this.form?.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (send) send.disabled = busy;
  }

  private scrollToEnd() {
    this.log.scrollTo({ top: this.log.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  private reset() {
    if (this.busy) return;
    this.asked.clear();
    Array.from(this.log.querySelectorAll('.msg')).slice(1).forEach((m) => m.remove());
    this.renderChips();
  }
}

if (!customElements.get('ask-pankaj')) customElements.define('ask-pankaj', AskPankaj);

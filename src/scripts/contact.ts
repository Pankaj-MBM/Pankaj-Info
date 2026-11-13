import { contactInfo, copyText, storage, toast, track, whatsappUrl } from './utils';

const DRAFT_KEY = 'contact-draft';
type Field = HTMLInputElement | HTMLTextAreaElement;

/** Contact form with every state: validation, sending, success, error, offline, double-submit lock, saved draft. */
export function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  const submitLabel = form.querySelector<HTMLElement>('[data-submit-label]');
  if (!status || !submit) return;
  // Catalyst function that emails the message (functions/contact). Same-origin on the Catalyst-hosted site;
  // other copies (Slate, local) call the custom domain, which allows them via CORS.
  const remote = form.dataset.endpoint ?? '';
  const endpoint = remote && location.origin === new URL(remote).origin ? new URL(remote).pathname : remote;
  const fields = Array.from(form.querySelectorAll<Field>('input[name]:not([name="botcheck"]), textarea[name]'));

  // Restore a draft after a refresh mid-flow.
  try {
    const draft = JSON.parse(storage.get(DRAFT_KEY, 'session') || 'null') as Record<string, string> | null;
    if (draft) fields.forEach((f) => draft[f.name] && (f.value = draft[f.name]));
  } catch {
    /* corrupt draft — ignore */
  }
  let saveTimer: number | undefined;
  form.addEventListener('input', () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      const draft = Object.fromEntries(fields.map((f) => [f.name, f.value]));
      storage.set(DRAFT_KEY, JSON.stringify(draft), 'session');
    }, 300);
  });

  const showError = (field: Field, message: string) => {
    const error = form.querySelector<HTMLElement>(`#${field.id}-error`);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
  };
  const validate = (field: Field) => {
    let message = '';
    if (field.validity.valueMissing) message = `Please enter your ${field.dataset.label ?? 'details'}.`;
    else if (field.validity.typeMismatch) message = 'Please enter a valid email address, like name@company.com.';
    else if (field.validity.tooShort) message = `Please write at least ${field.getAttribute('minlength')} characters.`;
    showError(field, message);
    return !message;
  };
  fields.forEach((f) => {
    f.addEventListener('blur', () => f.value && validate(f));
    f.addEventListener('input', () => f.getAttribute('aria-invalid') === 'true' && validate(f));
  });

  type Action = { label: string; href?: string; onClick?: () => void; newTab?: boolean };
  const setStatus = (kind: string, text: string, actions: Action[] = []) => {
    status.dataset.kind = kind;
    status.replaceChildren(document.createTextNode(text));
    if (actions.length) {
      const row = document.createElement('span');
      row.className = 'form-status-actions';
      for (const action of actions) {
        const el = document.createElement(action.href ? 'a' : 'button');
        el.className = 'form-status-action';
        el.textContent = action.label;
        if (el instanceof HTMLAnchorElement && action.href) {
          el.href = action.href;
          if (action.newTab) {
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
          }
        } else if (el instanceof HTMLButtonElement) el.type = 'button';
        if (action.onClick) el.addEventListener('click', action.onClick);
        row.append(el);
      }
      status.append(row);
    }
    status.hidden = false;
  };

  /**
   * The visitor's message as a polished, ready-to-send email (and a WhatsApp variant): clear subject,
   * greeting, their words untouched apart from tidy capitalisation, and a proper signature block.
   */
  const draftMessage = () => {
    const data = new FormData(form);
    const tidy = (v: FormDataEntryValue | null) => String(v ?? '').trim().replace(/\s+/g, ' ');
    const titleCase = (s: string) => s.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
    const name = titleCase(tidy(data.get('name')));
    const company = tidy(data.get('company'));
    const from = tidy(data.get('email'));
    let message = String(data.get('message') ?? '').trim();
    message = message.charAt(0).toUpperCase() + message.slice(1);
    const greeted = /^(hi|hello|hey|dear|greetings|good (morning|afternoon|evening))\b/i.test(message);
    const site = location.hostname;

    const subject = company ? `Opportunity at ${company} — let’s connect` : `Let’s connect — ${name} via your portfolio`;
    const body = [
      greeted ? null : 'Hi Pankaj,',
      greeted ? null : '',
      message,
      '',
      'Best regards,',
      name,
      company || null,
      from,
      '',
      '———',
      `Sent via ${site}`,
    ]
      .filter((line) => line !== null)
      .join('\n');
    const whatsapp = [
      `*${company ? `Opportunity at ${company}` : 'New enquiry via your portfolio'}*`,
      '',
      greeted ? message : `Hi Pankaj,\n\n${message}`,
      '',
      `— *${name}*${company ? `, ${company}` : ''}`,
      from,
      `_via ${site}_`,
    ].join('\n');
    return { subject, body, whatsapp };
  };
  /**
   * Ways to send without a form service. Web-based first (Gmail, WhatsApp) — a mailto: link alone opens
   * whatever mail app the OS has registered, which is often missing or broken.
   */
  const handOffActions = (): Action[] => {
    const { email } = contactInfo();
    const { subject, body, whatsapp } = draftMessage();
    const q = (s: string) => encodeURIComponent(s);
    return [
      {
        label: 'Send via Gmail',
        href: `https://mail.google.com/mail/?view=cm&fs=1&to=${q(email)}&su=${q(subject)}&body=${q(body)}`,
        newTab: true,
        onClick: () => track('contact_handoff', { via: 'gmail' }),
      },
      {
        label: 'Send on WhatsApp',
        href: whatsappUrl(whatsapp),
        newTab: true,
        onClick: () => track('contact_handoff', { via: 'whatsapp' }),
      },
      {
        label: 'Copy message',
        onClick: async () => {
          const ok = await copyText(`To: ${email}\nSubject: ${subject}\n\n${body}`);
          toast(ok ? 'Message copied — paste it into any email' : `Email: ${email}`, ok ? 'success' : 'info');
          track('contact_handoff', { via: 'copy' });
        },
      },
      { label: 'Other email app', href: `mailto:${email}?subject=${q(subject)}&body=${q(body)}` },
    ];
  };

  let sending = false;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (sending) return;
    const invalid = fields.filter((f) => !validate(f));
    if (invalid.length) {
      invalid[0].focus();
      return;
    }
    const honeypot = form.querySelector<HTMLInputElement>('[name="botcheck"]');
    if (honeypot?.checked) {
      form.reset();
      setStatus('success', 'Thanks! Your message is on its way.');
      return;
    }
    if (!endpoint) {
      // No mail endpoint configured → let the visitor pick how to send the message they wrote.
      setStatus('mailto', 'Your message is ready. Choose how to send it:', handOffActions());
      track('contact_submit', { result: 'handoff' });
      return;
    }
    if (!navigator.onLine) {
      setStatus('offline', 'You’re offline. Your message is saved — send it again when you’re back online.');
      return;
    }

    sending = true;
    submit.disabled = true;
    submit.setAttribute('data-loading', '');
    if (submitLabel) submitLabel.textContent = 'Sending…';
    status.hidden = true;
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 20000);
    try {
      const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
      delete data.botcheck;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, page: location.pathname }),
        signal: controller.signal,
      });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Record<string, string> };
      if (res.status === 422 && json.errors) {
        // Server-side validation disagreed with the browser — show it on the fields.
        for (const [name, message] of Object.entries(json.errors)) {
          const field = fields.find((f) => f.name === name);
          if (field) showError(field, message);
        }
        fields.find((f) => json.errors?.[f.name])?.focus();
        return;
      }
      if (!res.ok || !json.ok) throw new Error(`Request failed (${res.status})`);
      const name = data.name.trim().split(/\s+/)[0];
      form.reset();
      storage.remove(DRAFT_KEY, 'session');
      fields.forEach((f) => f.setAttribute('aria-invalid', 'false'));
      setStatus('success', `Thanks, ${name}! Your message is in my inbox — a confirmation is on its way to yours. I’ll reply within 24 hours.`);
      toast('Message sent ✓', 'success');
      track('contact_submit', { result: 'success' });
    } catch {
      setStatus('error', 'Your message couldn’t be sent. Please try again, or send it another way:', handOffActions());
      track('contact_submit', { result: 'error' });
    } finally {
      window.clearTimeout(timer);
      sending = false;
      submit.disabled = false;
      submit.removeAttribute('data-loading');
      if (submitLabel) submitLabel.textContent = 'Send message';
    }
  });
}

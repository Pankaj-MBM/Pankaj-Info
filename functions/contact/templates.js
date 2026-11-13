'use strict';
/**
 * Branded HTML emails for the portfolio contact form — same palette as the site (ink, cream, gold).
 * Table layout + inline styles so they render in Gmail, Outlook and Apple Mail.
 * Every value that came from the visitor goes through esc().
 */

const C = {
  ink: '#0b0b0e',
  ink2: '#16161b',
  cream: '#f6f3ec',
  card: '#ffffff',
  text: '#16161b',
  muted: '#6b6a72',
  line: '#e7e1d5',
  gold: '#b08d57',
  goldSoft: '#d8b77a',
};
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paragraphs = (s) => esc(s).replace(/\r?\n/g, '<br>');

function shell({ preheader, eyebrow, body, footer }) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>${esc(eyebrow)}</title></head>
<body style="margin:0;padding:0;background:${C.cream};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.cream};">
<tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
  <tr><td style="background:${C.ink};border-radius:20px 20px 0 0;padding:26px 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;">
        <span style="display:inline-block;width:40px;height:40px;line-height:40px;text-align:center;border-radius:11px;background:${C.ink2};border:1px solid #2a2a31;font:700 17px ${SERIF};color:${C.goldSoft};">PP</span>
        <span style="display:inline-block;vertical-align:middle;margin-left:12px;font:italic 21px ${SERIF};color:${C.cream};">Pankaj Parihar</span>
      </td>
      <td align="right" style="vertical-align:middle;font:600 11px ${SANS};letter-spacing:2.5px;text-transform:uppercase;color:${C.goldSoft};">${esc(eyebrow)}</td>
    </tr></table>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,${C.gold},#1f3b8f);background-color:${C.gold};font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="background:${C.card};padding:36px 32px 32px;border-radius:0 0 20px 20px;">${body}</td></tr>
  <tr><td style="padding:22px 12px;text-align:center;font:12px/1.6 ${SANS};color:${C.muted};">${footer}</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const button = (href, label, dark = true) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 10px 0;padding:13px 22px;border-radius:999px;font:600 14px ${SANS};text-decoration:none;${
    dark ? `background:${C.ink};color:${C.cream};` : `background:${C.cream};color:${C.text};border:1px solid ${C.line};`
  }">${esc(label)}</a>`;

const quote = (text) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr>
    <td style="width:3px;background:${C.gold};border-radius:3px;"></td>
    <td style="padding:16px 20px;background:${C.cream};border-radius:0 12px 12px 0;font:15px/1.7 ${SANS};color:${C.text};">${paragraphs(text)}</td>
  </tr></table>`;

/** Email to Pankaj: who wrote, what they said, one-tap reply. */
function ownerEmail({ name, email, company, message, page, receivedAt, site }) {
  const first = name.split(' ')[0];
  const headline = company ? `${esc(name)} from ${esc(company)} wants to connect` : `${esc(name)} wants to connect`;
  const replySubject = company ? `Re: Opportunity at ${company}` : 'Re: Your message on my portfolio';
  const row = (k, v) =>
    `<tr><td style="padding:10px 0;border-top:1px solid ${C.line};width:120px;font:600 12px ${SANS};letter-spacing:1px;text-transform:uppercase;color:${C.muted};">${k}</td>
     <td style="padding:10px 0;border-top:1px solid ${C.line};font:15px ${SANS};color:${C.text};">${v}</td></tr>`;
  const body = `
    <p style="margin:0 0 6px;font:600 12px ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.gold};">New message · portfolio</p>
    <h1 style="margin:0;font:400 28px/1.25 ${SERIF};color:${C.text};">${headline}</h1>
    ${quote(message)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 26px;">
      ${row('Name', esc(name))}
      ${company ? row('Company', esc(company)) : ''}
      ${row('Email', `<a href="mailto:${esc(email)}" style="color:${C.text};">${esc(email)}</a>`)}
      ${row('Received', esc(receivedAt))}
      ${page ? row('From page', esc(page)) : ''}
    </table>
    ${button(`mailto:${email}?subject=${encodeURIComponent(replySubject)}`, `Reply to ${first}`)}`;
  return {
    subject: company ? `New opportunity: ${company} — ${name}` : `New message from ${name} — portfolio`,
    html: shell({
      preheader: message.slice(0, 120),
      eyebrow: 'New opportunity',
      body,
      footer: `Sent by the contact form on <a href="${esc(site)}" style="color:${C.muted};">${esc(new URL(site).hostname)}</a>. Reply goes straight to ${esc(email)}.`,
    }),
  };
}

/** Auto-reply to the visitor: confirmation, their message, and the next useful links. */
function visitorEmail({ name, company, message, site, resumeUrl, linkedin, whatsapp }) {
  const first = name.split(' ')[0];
  const body = `
    <img src="${esc(site)}/app/og/og-default.png" width="536" alt="Pankaj Parihar — Software Engineer" style="display:block;width:100%;max-width:536px;height:auto;border:0;border-radius:14px;margin:0 0 28px;">
    <h1 style="margin:0 0 14px;font:400 28px/1.25 ${SERIF};color:${C.text};">Thank you, ${esc(first)}.</h1>
    <p style="margin:0;font:16px/1.7 ${SANS};color:${C.text};">
      I’ve received your message${company ? ` about the opportunity at <strong>${esc(company)}</strong>` : ''} and I’ll get back to you personally within 24 hours.
    </p>
    ${quote(message)}
    <p style="margin:0 0 16px;font:15px/1.7 ${SANS};color:${C.muted};">In the meantime, here’s everything in one place:</p>
    ${button(site, 'View portfolio')}${button(resumeUrl, 'Download résumé', false)}${button(linkedin, 'LinkedIn', false)}${button(whatsapp, 'WhatsApp', false)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:26px;border-top:1px solid ${C.line};"><tr><td style="padding-top:20px;">
      <p style="margin:0;font:italic 20px ${SERIF};color:${C.text};">Pankaj Parihar</p>
      <p style="margin:4px 0 0;font:600 11px ${SANS};letter-spacing:1.5px;text-transform:uppercase;color:${C.gold};">Software Engineer · Angular · Flutter · .NET · Azure AI</p>
    </td></tr></table>`;
  return {
    subject: `Thanks for reaching out, ${first} — Pankaj Parihar`,
    html: shell({
      preheader: `Got your message${company ? ` about ${company}` : ''} — I’ll reply within 24 hours.`,
      eyebrow: 'Message received',
      body,
      footer: `You’re receiving this because you used the contact form on <a href="${esc(site)}" style="color:${C.muted};">${esc(new URL(site).hostname)}</a>.`,
    }),
  };
}

module.exports = { ownerEmail, visitorEmail, esc };

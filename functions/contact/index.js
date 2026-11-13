'use strict';
/**
 * POST /server/contact/  — portfolio contact form.
 * Validates the message, emails Pankaj a branded notification (reply-to = visitor) and sends the visitor a
 * branded confirmation. Catalyst Mail needs FROM_EMAIL verified in the console (Cloud Scale › Mail).
 */
const catalyst = require('zcatalyst-sdk-node');
const { ownerEmail, visitorEmail } = require('./templates');

const OWNER = process.env.OWNER_EMAIL;
const FROM = process.env.FROM_EMAIL;
const SITE = (process.env.SITE_URL || 'https://pankaj.2026.co.in').replace(/\/$/, '');
const LINKS = {
  resumeUrl: `${SITE}/app/resume/Pankaj-Parihar-Resume.pdf`,
  linkedin: 'https://www.linkedin.com/in/pankajparihar0286/',
  whatsapp: 'https://wa.me/917568862848',
};
const MAX_BODY = 20 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Same-origin on the custom domain needs no CORS; these cover the Slate copy and local development.
const ALLOWED_ORIGIN = /^(https:\/\/pankaj\.2026\.co\.in|https:\/\/[a-z0-9-]+\.(onslate|catalystserverless)\.(in|com)|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

function send(req, res, status, payload) {
  const origin = req.headers.origin;
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Vary: 'Origin' };
  if (origin && ALLOWED_ORIGIN.test(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  res.writeHead(status, headers);
  res.end(status === 204 ? undefined : JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(Object.assign(new Error('too large'), { status: 413 }));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('bad json'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
const oneLine = (v, max) => clean(v, max).replace(/\s+/g, ' ');
const titleCase = (s) => s.replace(/(^|\s)(\p{L})/gu, (_, sp, c) => sp + c.toUpperCase());

function validate(body) {
  const data = {
    name: titleCase(oneLine(body.name, 80)),
    email: oneLine(body.email, 120).toLowerCase(),
    company: oneLine(body.company, 80),
    message: clean(body.message, 3000),
    page: oneLine(body.page, 200),
  };
  const errors = {};
  if (data.name.length < 2) errors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(data.email)) errors.email = 'Please enter a valid email address.';
  if (data.message.length < 10) errors.message = 'Please write at least 10 characters.';
  return { data, errors };
}

module.exports = async (req, res) => {
  const path = (req.url || '/').split('?')[0];
  if (req.method === 'OPTIONS') return send(req, res, 204);
  if (req.method === 'GET' && (path === '/' || path === '')) return send(req, res, 200, { ok: true, service: 'contact' });
  if (req.method !== 'POST') return send(req, res, 405, { ok: false, error: 'Method not allowed' });

  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return send(req, res, e.status || 400, { ok: false, error: 'Invalid request' });
  }
  // Honeypot: bots tick hidden boxes. Pretend success so they don't retry.
  if (body.botcheck) return send(req, res, 200, { ok: true });

  const { data, errors } = validate(body);
  if (Object.keys(errors).length) return send(req, res, 422, { ok: false, errors });

  const receivedAt = new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date());

  try {
    const mail = catalyst.initialize(req).email();
    const owner = ownerEmail({ ...data, receivedAt: `${receivedAt} IST`, site: SITE });
    await mail.sendMail({
      from_email: FROM,
      display_name: `${data.name} via portfolio`,
      to_email: [OWNER],
      reply_to: [data.email],
      subject: owner.subject,
      content: owner.html,
      html_mode: true,
    });
    // The confirmation is a courtesy — a failure here must not fail the request.
    try {
      const visitor = visitorEmail({ ...data, site: SITE, ...LINKS });
      await mail.sendMail({
        from_email: FROM,
        display_name: 'Pankaj Parihar',
        to_email: [data.email],
        reply_to: [OWNER],
        subject: visitor.subject,
        content: visitor.html,
        html_mode: true,
      });
    } catch (e) {
      console.log('auto-reply failed:', e && e.message);
    }
    return send(req, res, 200, { ok: true });
  } catch (e) {
    console.log('send failed:', e && (e.message || e));
    return send(req, res, 502, { ok: false, error: 'Could not send right now' });
  }
};

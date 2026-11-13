# Pankaj Parihar — Portfolio

Personal portfolio of **Pankaj Parihar**, Software Engineer (Angular · ASP.NET Core · Azure OpenAI).
Static site built with **Astro 6**, **TypeScript** and **Tailwind CSS v4** — about 11 KB of JavaScript (gzipped) in total.

## Features

- **Ask Pankaj** — a scripted chat assistant that answers recruiter questions in one tap (works without JS as an FAQ)
- **30-second recruiter summary** — one-screen overview, also at `/?view=summary`
- **Command palette** — `Ctrl K` / `⌘ K` / `/`
- Live local time + time-zone difference for international recruiters
- Case studies with accessible SVG architecture diagrams, an HTML resume page (print-ready) and a custom 404
- Light/dark theme without flash, reduced-motion support, keyboard-friendly dialogs, SEO + JSON-LD + sitemap

## Run locally

```bash
npm install
npm run dev        # http://localhost:4321
npm run check      # type check
npm run build      # production build → dist/
npm run preview    # serve the build
```

Requires Node 22.12+ (Astro 7 needs Node 22.23+; this project pins Astro 6).

## Where to edit content

| What | File |
|---|---|
| Name, headline, contact, availability, resume links | `src/data/profile.ts` |
| Work experience | `src/data/experience.ts` |
| Skills | `src/data/skills.ts` |
| Education, certifications, testimonials | `src/data/education.ts` |
| Chat questions & answers | `src/data/faq.ts` |
| Projects / case studies (Markdown) | `src/content/projects/*.md` |
| Resume PDF | `public/resume/Pankaj-Parihar-Resume.pdf` |

Unknown facts are `null` in the data files and simply hidden on the site. Projects with `draft: true` show in
`npm run dev` only. Private or confidential projects can never carry code/live links — the build fails if they do.

## Environment variables

Copy `.env.example` to `.env`:

- `SITE_URL` — the final domain (canonical URLs, Open Graph, sitemap); defaults to https://pankaj.2026.co.in
- `PUBLIC_CONTACT_ENDPOINT` — contact-form endpoint; defaults to the Catalyst function below

## Hosting (Zoho Catalyst)

- **Site** — Cloud Scale web-client hosting on https://pankaj.2026.co.in (served under `/app/`):
  `npm run build:client` then `catalyst deploy --only client`
- **Contact form** — `functions/contact` (Advanced I/O, Node) emails a branded notification to Pankaj and a
  branded confirmation to the sender through Catalyst Mail: `catalyst deploy --only functions`.
  The sender address (`FROM_EMAIL` in `functions/contact/catalyst-config.json`) must be verified in the
  Catalyst console under Cloud Scale › Mail.
- **Slate copy** — `catalyst deploy slate`

## Regenerate images

```bash
node scripts/make-icons.mjs   # favicon PNGs + app icons
node scripts/make-og.mjs      # public/og/og-default.png from scripts/og-template.html (uses local Chrome)
```

---

© Pankaj Parihar. Code may be reused with credit; text, images and personal details may not.

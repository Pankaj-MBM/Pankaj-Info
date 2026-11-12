/**
 * Single source of truth for personal facts (Roadmap §6.3 / §7.1).
 * `null` = not known yet → the UI hides it. Fill every TODO(pankaj) before launch.
 */
export const profile = {
  name: 'Pankaj Parihar',
  firstName: 'Pankaj',
  initials: 'PP',
  role: 'Software Engineer',
  roleLong: 'Full-Stack Software Engineer',
  tagline: 'Angular · ASP.NET Core · Azure OpenAI',
  headline: {
    lead: 'I build',
    rotating: ['AI-powered CRMs', 'WhatsApp automation', 'QR ordering systems', 'inventory platforms'],
    rest: 'with Angular, .NET & Azure OpenAI.',
  },
  pitch:
    '2.5+ years shipping production software — CRM & ERP at Dial ERP Technology, plus a live QR-ordering platform for cafés, WhatsApp bulk messaging, inventory and field-sales tracking.',
  summary:
    'Software Engineer with 2.5+ years of experience in Angular, ASP.NET Core and Flutter. At Dial ERP Technology I build enterprise CRM & ERP products: REST APIs in ASP.NET Core, Angular (Material) front-ends, WhatsApp automation with Meta’s Cloud API, and AI features with Azure OpenAI and Azure AI Search.',
  experience: {
    /** Stated by Pankaj (decision D5). Shown until `firstRoleStart` is known. */
    years: 2.5,
    /** TODO(pankaj): 'YYYY-MM' start of the first role — the total is then calculated on every build. */
    firstRoleStart: null as string | null,
  },
  location: {
    country: 'India',
    region: 'Rajasthan',
    city: null as string | null, // TODO(pankaj): current city
    timezone: 'Asia/Kolkata',
    tzAbbr: 'IST',
    tzOffset: 'UTC+5:30',
  },
  availability: {
    statusLabel: 'Open to new opportunities',
    noticePeriod: null as string | null, // TODO(pankaj): e.g. '30 days'
    openTo: [] as string[], // TODO(pankaj): e.g. ['Full-time', 'On-site', 'Hybrid', 'Remote']
    relocation: null as string | null, // TODO(pankaj): e.g. 'Anywhere in India; abroad with visa sponsorship'
  },
  contact: {
    emailUser: 'pankajparihar0286',
    emailDomain: 'gmail.com',
    phoneDisplay: '+91 75688 62848',
    phoneE164: '+917568862848',
    whatsapp: '917568862848',
    whatsappMessage: 'Hi Pankaj, I saw your portfolio and would like to talk about a role.',
    bookingUrl: null as string | null, // decision D13 — e.g. a Cal.com link
  },
  socials: {
    linkedin: 'https://www.linkedin.com/in/pankajparihar0286/',
    github: 'https://github.com/Pankaj-MBM',
    naukri: null as string | null, // ONLY a public URL that opens without login (decision D15)
  },
  resume: {
    /** TODO(pankaj): replace public/resume/Pankaj-Parihar-Resume.pdf with the updated resume (2.5 years). */
    pdf: '/resume/Pankaj-Parihar-Resume.pdf',
    docx: null as string | null,
    updated: 'Nov 2026',
  },
  languages: ['English — professional', 'Hindi — native'], // TODO(pankaj): confirm / add more
  currently: null as string[] | null, // TODO(pankaj): e.g. ['Building …', 'Learning …']
  beyondCode: null as string | null, // TODO(pankaj): one or two human facts
};

export const email = `${profile.contact.emailUser}@${profile.contact.emailDomain}`;

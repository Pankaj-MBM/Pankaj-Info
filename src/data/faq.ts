import { withBase } from '../lib/url';
import { profile } from './profile';
import { experienceLabel } from '../lib/format';

export type ChatAction =
  | { kind: 'link'; label: string; href: string }
  | { kind: 'download'; label: string; href: string }
  | { kind: 'copy-email'; label: string }
  | { kind: 'whatsapp'; label: string }
  | { kind: 'summary'; label: string };

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
  actions?: ChatAction[];
}

const { availability, resume } = profile;

const items: (FaqItem | null)[] = [
  {
    id: 'stack',
    question: 'What’s your tech stack?',
    answer:
      'Core: Angular (Material) + TypeScript on the front end, ASP.NET Core Web API (C#) on the back end, MongoDB for data, and Azure OpenAI + Azure AI Search for AI features. Also: WhatsApp Cloud API, Google Maps API, Flutter, Firebase, MySQL/PostgreSQL and Redis.',
    keywords: ['stack', 'tech', 'skill', 'technolog', 'angular', '.net', 'dotnet', 'c#', 'language', 'framework'],
    actions: [{ kind: 'link', label: 'See all skills', href: withBase('/#skills') }],
  },
  {
    id: 'experience',
    question: 'How much experience do you have?',
    answer: `${experienceLabel()}. Software Engineer at Dial ERP Technology since Nov 2024, building enterprise CRM/ERP products — and before that, Flutter & Angular Developer at Hunarship.`,
    keywords: ['experience', 'year', 'yrs', 'work', 'job', 'company', 'senior'],
    actions: [{ kind: 'link', label: 'View experience', href: withBase('/#experience') }],
  },
  {
    id: 'ai',
    question: 'Have you built AI features?',
    answer:
      'Yes. At Dial ERP I implemented AI chatbot features for the CRM using Azure OpenAI with Azure AI Search (retrieval-augmented generation), so users can ask questions about their data in plain language.',
    keywords: ['ai', 'openai', 'gpt', 'llm', 'rag', 'chatbot', 'azure', 'genai', 'machine'],
    actions: [{ kind: 'link', label: 'Read the case study', href: withBase('/projects/ai-crm-whatsapp/') }],
  },
  {
    id: 'whatsapp',
    question: 'WhatsApp automation?',
    answer:
      'I integrated Meta’s WhatsApp Cloud API end-to-end: template messages, media, webhooks for delivery status and replies, and bulk messaging.',
    keywords: ['whatsapp', 'meta', 'webhook', 'messag', 'bulk', 'template'],
    actions: [{ kind: 'link', label: 'Read the case study', href: withBase('/projects/ai-crm-whatsapp/') }],
  },
  availability.noticePeriod
    ? {
        id: 'notice',
        question: 'What’s your notice period?',
        answer: `My notice period is ${availability.noticePeriod}.`,
        keywords: ['notice', 'join', 'start', 'available', 'when'],
        actions: [{ kind: 'summary', label: '30-sec summary' }],
      }
    : null,
  availability.relocation
    ? {
        id: 'relocation',
        question: 'Open to relocation or remote?',
        answer: availability.relocation,
        keywords: ['relocat', 'remote', 'hybrid', 'onsite', 'on-site', 'abroad', 'visa', 'move'],
        actions: [{ kind: 'summary', label: '30-sec summary' }],
      }
    : null,
  {
    id: 'best-project',
    question: 'Which project should I see first?',
    answer:
      'Start with the WhatsApp CRM & AI automation platform — Angular, .NET, MongoDB and Azure OpenAI, end to end. For a product that is live in production, see 2026.co.in — a QR ordering platform for cafés and restaurants.',
    keywords: ['project', 'best', 'portfolio', 'showcase', 'example', 'code', 'github', 'live'],
    actions: [
      { kind: 'link', label: 'CRM case study', href: withBase('/projects/ai-crm-whatsapp/') },
      { kind: 'link', label: '2026.co.in', href: withBase('/projects/2026-co-in/') },
      { kind: 'link', label: 'All projects', href: withBase('/#projects') },
    ],
  },
  {
    id: 'resume',
    question: 'Can I get your resume?',
    answer: 'Of course — here it is.',
    keywords: ['resume', 'cv', 'download', 'pdf', 'profile'],
    actions: [{ kind: 'download', label: 'Download PDF', href: resume.pdf }],
  },
  {
    id: 'salary',
    question: 'Salary expectations?',
    answer: 'Happy to discuss on a call — it depends on the role, location and responsibilities.',
    keywords: ['salary', 'ctc', 'compensation', 'pay', 'package', 'expect', 'lpa'],
    actions: [{ kind: 'link', label: 'Get in touch', href: withBase('/#contact') }],
  },
  {
    id: 'contact',
    question: 'How can I contact you?',
    answer:
      'Email me (I usually reply within 24 hours), message me on WhatsApp, or use the contact form.',
    keywords: ['contact', 'email', 'mail', 'phone', 'call', 'reach', 'number', 'hire', 'talk'],
    actions: [
      { kind: 'copy-email', label: 'Copy email' },
      { kind: 'whatsapp', label: 'WhatsApp' },
      { kind: 'link', label: 'Contact form', href: withBase('/#contact') },
    ],
  },
];

export const faq = items.filter((item): item is FaqItem => item !== null);

export const chatGreeting =
  'Hi 👋 I’m Pankaj’s assistant. Ask about his experience, skills or availability — or tap a question below.';

export const chatFallback =
  'I’m a simple scripted assistant, so I don’t know that one yet. Try a question below — or ask Pankaj directly.';

export interface Role {
  id: string;
  company: string;
  role: string;
  type: string;
  /** 'YYYY-MM' — null = not confirmed yet */
  start: string | null;
  /** 'YYYY-MM' — null = present */
  end: string | null;
  location: string;
  bullets: string[];
  stack: string[];
  caseStudy?: { href: string; label: string };
}

export const experience: Role[] = [
  {
    id: 'dial-erp',
    company: 'Dial ERP Technology Ltd.',
    role: 'Software Engineer',
    type: 'Full-time',
    start: '2024-11',
    end: null,
    location: 'Gurgaon, Haryana',
    bullets: [
      'Build and maintain enterprise CRM & ERP modules with Angular, ASP.NET Core Web API (C#) and MongoDB.',
      'Designed and shipped 40+ REST APIs and a library of reusable Angular Material components.',
      'Integrated Meta WhatsApp Cloud API end-to-end — template messages, media, webhooks and bulk messaging.',
      'Implemented AI chatbot features with Azure OpenAI and Azure AI Search (retrieval-augmented generation).',
      'Own production support — debugging, bug fixes and performance optimization.',
      'Work in Agile sprints with code reviews and Git-based workflows.',
    ],
    stack: [
      'Angular',
      'Angular Material',
      'ASP.NET Core',
      'C#',
      'MongoDB',
      'Azure OpenAI',
      'Azure AI Search',
      'WhatsApp Cloud API',
    ],
    caseStudy: { href: '/projects/ai-crm-whatsapp/', label: 'CRM case study' },
  },
  {
    id: 'hunarship',
    company: 'Hunarship',
    role: 'Flutter & Angular Developer',
    type: 'Before Nov 2024',
    start: null, // TODO(pankaj): start month exactly as on the experience letter
    end: '2024-10',
    location: 'Jodhpur, Rajasthan',
    bullets: [
      // TODO(pankaj): confirm the EduCareer admin panel was Hunarship work.
      'Built the EduCareer admin panel in Flutter Web on Firebase — students, job seekers, job providers, a student-query workflow, dashboards and PDF export.',
      'Developed Flutter mobile apps with Firebase and Laravel back-end integration; integrated REST APIs.',
      'Designed responsive mobile user interfaces.',
      // TODO(pankaj): add your Angular work in this role.
    ],
    stack: ['Flutter', 'Dart', 'Firebase', 'Laravel', 'Angular', 'REST APIs'],
    caseStudy: { href: '/projects/educareer-admin/', label: 'EduCareer case study' },
  },
];

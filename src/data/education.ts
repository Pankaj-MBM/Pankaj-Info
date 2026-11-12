export interface Education {
  degree: string;
  short: string;
  school: string;
  place: string;
  year: string | null;
  score: string;
}

export const education: Education[] = [
  {
    degree: 'Master of Computer Applications',
    short: 'MCA',
    school: 'MBM University',
    place: 'Jodhpur, Rajasthan',
    year: '2024',
    score: '84%',
  },
  {
    degree: 'Bachelor of Computer Applications',
    short: 'BCA',
    school: 'Lucky Institute of Professional Studies',
    place: 'Jodhpur, Rajasthan',
    year: null, // TODO(pankaj): graduation year
    score: '75%',
  },
];

export interface Certification {
  name: string;
  issuer: string;
  year: string;
  url?: string;
}
/** Empty = the section is hidden. Add real certifications only. */
export const certifications: Certification[] = [];

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  relation: string;
  url?: string;
}
/** Empty = the section is hidden. Real LinkedIn recommendations only — never fabricate. */
export const testimonials: Testimonial[] = [];

/** From the resume's achievements section. */
export const achievements = [
  'Developed an AI-powered CRM and WhatsApp automation platform using Angular, ASP.NET Core Web API, C# and MongoDB.',
  'Implemented Azure OpenAI integration to enable AI-powered CRM features.',
  'Built the Geo Tracker application with Google Maps integration.',
  'Delivered multiple production-ready enterprise application modules.',
  'Developed and deployed multiple AI-assisted projects using Claude AI.',
];

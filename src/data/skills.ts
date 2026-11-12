export interface Skill {
  name: string;
  icon: string;
}
export interface CoreSkill extends Skill {
  evidence: string;
}

/** Tier 1 — production, daily use. Every card says where it was used. */
export const coreSkills: CoreSkill[] = [
  { name: 'Angular', icon: 'si:angular', evidence: 'CRM/ERP modules · Geo Tracker' },
  { name: 'TypeScript', icon: 'si:typescript', evidence: 'Angular apps · React client sites' },
  { name: 'ASP.NET Core Web API', icon: 'si:dotnet', evidence: '40+ REST APIs at Dial ERP' },
  { name: 'C#', icon: 'si:csharp', evidence: 'Back-end services & APIs' },
  { name: 'MongoDB', icon: 'si:mongodb', evidence: 'CRM/ERP data layer' },
  { name: 'Azure OpenAI', icon: 'si:openai', evidence: 'AI chatbot features in the CRM' },
  { name: 'Azure AI Search', icon: 'si:microsoftazure', evidence: 'RAG retrieval for the chatbot' },
  { name: 'WhatsApp Cloud API', icon: 'si:whatsapp', evidence: 'Templates · media · webhooks · bulk' },
];

/** Tier 2 — used in real projects. */
export const alsoSkills: Skill[] = [
  { name: 'Angular Material', icon: 'lucide:layers' },
  { name: 'REST APIs & Webhooks', icon: 'lucide:workflow' },
  { name: 'Flutter', icon: 'si:flutter' },
  { name: 'Dart', icon: 'si:dart' },
  { name: 'Firebase', icon: 'si:firebase' },
  { name: 'Laravel', icon: 'si:laravel' },
  { name: 'MySQL', icon: 'si:mysql' },
  { name: 'PostgreSQL', icon: 'si:postgresql' },
  { name: 'Redis', icon: 'si:redis' },
  { name: 'SQL', icon: 'lucide:database' },
  { name: 'JavaScript', icon: 'si:javascript' },
  { name: 'HTML5', icon: 'si:html5' },
  { name: 'CSS3', icon: 'si:css3' },
  { name: 'Bootstrap', icon: 'si:bootstrap' },
  { name: 'Google Maps API', icon: 'si:googlemaps' },
  { name: 'Linux & shell', icon: 'si:linux' },
];

/** Tier 3 — tools & practices. */
export const toolSkills: Skill[] = [
  { name: 'Git & GitHub', icon: 'si:github' },
  { name: 'VS Code', icon: 'si:visualstudiocode' },
  { name: 'Visual Studio', icon: 'si:visualstudio' },
  { name: 'Postman', icon: 'si:postman' },
  { name: 'Android Studio', icon: 'si:androidstudio' },
  { name: 'Agile / Scrum', icon: 'lucide:workflow' },
  { name: 'Code reviews', icon: 'lucide:search-check' },
  { name: 'AI-assisted development (Claude)', icon: 'si:claude' },
];

/** Academic / familiar — shown on /resume only, never on the home page. */
export const familiarSkills = ['Python', 'Java', 'C/C++'];

/** Logo strip under the proof bar. */
export const techStrip: Skill[] = [
  { name: 'Angular', icon: 'si:angular' },
  { name: 'TypeScript', icon: 'si:typescript' },
  { name: '.NET', icon: 'si:dotnet' },
  { name: 'C#', icon: 'si:csharp' },
  { name: 'MongoDB', icon: 'si:mongodb' },
  { name: 'Azure', icon: 'si:microsoftazure' },
  { name: 'OpenAI', icon: 'si:openai' },
  { name: 'WhatsApp API', icon: 'si:whatsapp' },
  { name: 'Flutter', icon: 'si:flutter' },
  { name: 'Firebase', icon: 'si:firebase' },
  { name: 'Google Maps', icon: 'si:googlemaps' },
  { name: 'PostgreSQL', icon: 'si:postgresql' },
  { name: 'Redis', icon: 'si:redis' },
  { name: 'Git', icon: 'si:git' },
  { name: 'Linux', icon: 'si:linux' },
];

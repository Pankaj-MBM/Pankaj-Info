import { profile } from '../data/profile';
import { education } from '../data/education';
import { coreSkills } from '../data/skills';

/** ProfilePage + Person JSON-LD (Roadmap §7.7). Email and phone are left out on purpose. */
export function profileJsonLd(site: URL | undefined) {
  const sameAs = [profile.socials.linkedin, profile.socials.github, profile.socials.naukri].filter(
    (url): url is string => Boolean(url),
  );
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateModified: new Date().toISOString().slice(0, 10),
    mainEntity: {
      '@type': 'Person',
      name: profile.name,
      jobTitle: profile.role,
      description: profile.summary,
      url: new URL('/', site).href,
      image: new URL('/og/og-default.png', site).href,
      worksFor: { '@type': 'Organization', name: 'Dial ERP Technology Ltd.' },
      alumniOf: education.map((e) => ({ '@type': 'CollegeOrUniversity', name: `${e.school}, Jodhpur` })),
      address: {
        '@type': 'PostalAddress',
        addressRegion: profile.location.region,
        addressCountry: 'IN',
      },
      knowsAbout: [...coreSkills.map((s) => s.name), 'Flutter', 'Firebase', 'REST APIs'],
      knowsLanguage: ['en', 'hi'],
      sameAs,
    },
  };
}

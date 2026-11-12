import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export type ProjectTag = Project['data']['tags'][number];

export const tagLabels: Record<ProjectTag, string> = {
  ai: 'AI',
  whatsapp: 'WhatsApp',
  angular: 'Angular',
  dotnet: '.NET',
  flutter: 'Flutter',
  react: 'React',
  maps: 'Maps',
  web: 'Web',
  realtime: 'Real-time',
};

export const contextLabels: Record<NonNullable<Project['data']['context']>, string> = {
  work: 'Work project',
  client: 'Client project',
  personal: 'Personal project',
  internship: 'Internship',
  academic: 'Academic',
};

/**
 * All projects, sorted. Drafts are visible in `astro dev` (marked "Draft") and excluded from builds.
 * Enforces decision D8: private / confidential projects may never carry code or live links.
 */
export async function getProjects(): Promise<Project[]> {
  const all = await getCollection('projects', (p) => import.meta.env.DEV || !p.data.draft);
  for (const p of all) {
    const { visibility, links } = p.data;
    if (visibility !== 'public' && (links.repo || links.live)) {
      throw new Error(
        `[projects] "${p.id}" is ${visibility} but has repo/live links — not allowed (Roadmap decision D8).`,
      );
    }
  }
  return all.sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export function projectYear(p: Project): string | null {
  return p.data.period?.start ? p.data.period.start.slice(0, 4) : null;
}

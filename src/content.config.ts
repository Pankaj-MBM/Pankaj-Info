import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      /** One-line outcome shown on cards (≤ 200 chars). */
      summary: z.string().max(200),
      role: z.string().optional(),
      /** Company or client the work was done for (only when OK to show). */
      org: z.string().optional(),
      period: z.object({ start: z.string(), end: z.string().optional() }).optional(),
      context: z.enum(['work', 'client', 'personal', 'internship', 'academic']).optional(),
      tags: z
        .array(z.enum(['ai', 'whatsapp', 'angular', 'dotnet', 'flutter', 'react', 'maps', 'web', 'realtime']))
        .default([]),
      stack: z.array(z.string()).default([]),
      highlights: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /** true = the cover is an illustrative UI mockup, not a real screenshot (labelled on the site). */
      illustration: z.boolean().default(false),
      gallery: z.array(z.object({ src: image(), alt: z.string() })).default([]),
      links: z
        .object({ live: z.string().optional(), repo: z.string().optional(), video: z.string().optional() })
        .default({}),
      /** public = code links allowed · private/confidential = info + screenshots only (D8). */
      visibility: z.enum(['public', 'private', 'confidential']),
      /** Honest label for AI-scaffolded builds. */
      aiAssisted: z.boolean().default(false),
      metrics: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
      diagrams: z.array(z.enum(['whatsapp', 'rag'])).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(99),
      draft: z.boolean().default(false),
    }),
});

export const collections = { projects };

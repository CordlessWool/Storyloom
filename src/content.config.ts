import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// The path is the id, e.g. `spaetzle` or (travel posts, one folder per trip)
// `schottland/aufbruch`. Images live in `<blog>/_images/`.
const entries = (name: string) =>
  glob({
    pattern: '**/*.md',
    base: `./src/content/${name}`,
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  });

const blog = (name: string) =>
  defineCollection({
    loader: entries(name),
    schema: ({ image }) =>
      z.object({
        title: z.string(),
        date: z.coerce.date(),
        updated: z.coerce.date().optional(),
        excerpt: z.string().optional(),
        /** Show the excerpt as lead paragraph on the post page (false: it's only a list teaser). */
        lead: z.boolean().default(false),
        /** Local image (`../_images/x.jpg`) or remote URL (Unsplash), optimized at build time. */
        cover: z.union([image(), z.url()]).optional(),
        coverAlt: z.string().optional(),
        coverCaption: z.string().optional(),
        tags: z.array(z.string()).default([]),
        featured: z.boolean().default(false),
        draft: z.boolean().default(false),
      }),
  });

export const collections = {
  reisen: blog('reisen'),
  geschichten: blog('geschichten'),
  rezepte: blog('rezepte'),
  pages: defineCollection({
    loader: entries('pages'),
    schema: z.object({ title: z.string() }),
  }),
};

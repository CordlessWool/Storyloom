import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const post = z.object({
  title: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  excerpt: z.string().optional(),
  /** Show the excerpt as lead paragraph on the post page (false: it's only a list teaser). */
  lead: z.boolean().default(false),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  coverCaption: z.string().optional(),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

const blog = (name: string) =>
  defineCollection({ loader: glob({ pattern: '**/*.md', base: `./src/content/${name}` }), schema: post });

export const collections = {
  reisen: blog('reisen'),
  geschichten: blog('geschichten'),
  rezepte: blog('rezepte'),
  pages: defineCollection({
    loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
    schema: z.object({ title: z.string() }),
  }),
};

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { rehypeFigures, remarkMissingImages } from './src/lib/markdown-images.mjs';

const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: 'https://storyloom.de',
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  // Responsive srcset for every image, including the ones in Markdown.
  image: { layout: 'constrained' },
  markdown: {
    // unified (remark/rehype) instead of the default Sätteri processor: the
    // image plugins need the mdast/hast trees.
    processor: unified({
      remarkPlugins: [[remarkMissingImages, { base }]],
      rehypePlugins: [rehypeFigures],
    }),
  },
});

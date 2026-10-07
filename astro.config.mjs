// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { rehypeLocalImages } from './src/lib/local-images.mjs';

const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site: 'https://storyloom.de',
  base,
  trailingSlash: 'always',
  integrations: [sitemap()],
  markdown: {
    // unified (remark/rehype) instead of the default Sätteri processor: the
    // image plugin needs raw HTML (Ghost galleries) parsed into elements.
    processor: unified({ rehypePlugins: [[rehypeLocalImages, { base }]] }),
  },
});

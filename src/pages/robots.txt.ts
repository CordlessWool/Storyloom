import type { APIContext } from 'astro';
import { url } from '../lib/site';

export function GET({ site }: APIContext) {
  const sitemap = new URL(url('/sitemap-index.xml'), site);
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`);
}

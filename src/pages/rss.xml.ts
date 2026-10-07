import type { APIContext } from 'astro';
import { feed } from '../lib/feed';
import { BLOG_LIST, SITE, getPosts } from '../lib/site';

/** All three blogs in one feed. */
export async function GET(context: APIContext) {
  const posts = (await Promise.all(BLOG_LIST.map((b) => getPosts(b.key))))
    .flat()
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  return feed(context, SITE.title, SITE.description, posts);
}

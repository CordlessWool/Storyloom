import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE, postUrl, type Post } from './site';

/** RSS feed with title, teaser and link per post (posts newest first). */
export function feed(context: APIContext, title: string, description: string, posts: Post[]) {
  return rss({
    title,
    description,
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: post.data.excerpt,
      link: postUrl(post.collection, post.id),
      categories: post.data.tags,
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
}

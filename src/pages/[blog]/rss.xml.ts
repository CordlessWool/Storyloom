import type { APIContext } from 'astro';
import { feed } from '../../lib/feed';
import { BLOGS, BLOG_LIST, SITE, getPosts, type BlogKey } from '../../lib/site';

export const getStaticPaths = () => BLOG_LIST.map((b) => ({ params: { blog: b.key } }));

export async function GET(context: APIContext) {
  const blog = BLOGS[context.params.blog as BlogKey];
  return feed(context, `${blog.title} – ${SITE.title}`, blog.description, await getPosts(blog.key));
}

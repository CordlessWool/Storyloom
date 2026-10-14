// schema.org markup shared by the layout and the recipe page.

import { SITE, postUrl, type Post } from './site';

export const author = { '@type': 'Person', name: SITE.author };

/** Ghost's auto excerpts are whole paragraphs; search results show about 160 characters. */
export function metaDescription(text: string): string {
  const full = text.replace(/\s+/g, ' ').trim();
  return full.length > 160 ? `${full.slice(0, 157).replace(/\s+\S*$/, '')} …` : full;
}

export function blogPosting(post: Post, description: string, image: URL | string | undefined, site: URL) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.data.title,
    description,
    datePublished: post.data.date.toISOString(),
    dateModified: (post.data.updated ?? post.data.date).toISOString(),
    url: new URL(postUrl(post.collection, post.id), site).href,
    ...(image && { image: String(image) }),
    inLanguage: SITE.lang,
    author,
    ...(post.data.tags.length && { keywords: post.data.tags.join(', ') }),
  };
}

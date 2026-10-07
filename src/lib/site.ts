import { getCollection, type CollectionEntry } from 'astro:content';
import { PLACEHOLDER, isLocal, isMissingLocalImage, withBase } from './local-images.mjs';

export const SITE = {
  title: 'Storyloom',
  description: 'Schreib dir deine Welt',
  lang: 'de',
  author: 'Wolfgang Rathgeb',
  support: { label: 'Support me!', url: 'https://www.buymeacoffee.com/cordlessWool' },
};

export type BlogKey = 'reisen' | 'geschichten' | 'rezepte';
export type Post = CollectionEntry<BlogKey>;

export interface Blog {
  key: BlogKey;
  title: string;
  tagline: string;
  description: string;
}

export const BLOGS: Record<BlogKey, Blog> = {
  reisen: {
    key: 'reisen',
    title: 'Reisen',
    tagline: 'Unterwegs in Schottland und Indien',
    description: 'Reisetagebücher – zu Fuß durch die Highlands und mit dem Zug durch Indien.',
  },
  geschichten: {
    key: 'geschichten',
    title: 'Geschichten',
    tagline: 'Kurzgeschichten und Gedanken',
    description: 'Erzählungen, Momentaufnahmen und Gedanken über das Leben.',
  },
  rezepte: {
    key: 'rezepte',
    title: 'Rezepte',
    tagline: 'Aus Omas Küche',
    description: 'Schwäbische Klassiker, Brot und Kuchen – zum Nachkochen und Nachbacken.',
  },
};

export const BLOG_LIST = Object.values(BLOGS);

/** Prefix a root-relative path with the configured base. */
export function url(path = '/'): string {
  return withBase(import.meta.env.BASE_URL, path.startsWith('/') ? path : `/${path}`);
}

export function postUrl(blog: BlogKey, id: string): string {
  return url(`/${blog}/${id}/`);
}

/** Published posts of a blog, newest first. */
export async function getPosts(blog: BlogKey): Promise<Post[]> {
  const posts = await getCollection(blog, ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Newer/older neighbours of a post within its blog. */
export function adjacent(posts: Post[], id: string): { newer?: Post; older?: Post } {
  const i = posts.findIndex((p) => p.id === id);
  return { newer: posts[i - 1], older: posts[i + 1] };
}

/** Resolve an image path for output: base-prefixed, placeholder if the local file is missing. */
export function imageSrc(src?: string): string | undefined {
  if (!src) return undefined;
  if (isMissingLocalImage(src)) return url(PLACEHOLDER);
  return isLocal(src) ? url(src) : src;
}

export function readingTime(post: Post): number {
  const words = (post.body ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

const dateFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

export function formatDate(date: Date): string {
  return dateFmt.format(date);
}

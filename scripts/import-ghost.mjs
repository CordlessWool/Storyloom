// One-time import of a Ghost backup into Astro content collections.
//
// Usage: node scripts/import-ghost.mjs <path-to-backup>
//
// Reads <backup>/data/{posts,pages}.json and <backup>/content/images, writes
// Markdown into src/content/<blog>/ and copies images to public/content/images/.
// Existing generated files are overwritten.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import TurndownService from 'turndown';

const backup = resolve(process.argv[2] ?? 'storyloom-backup-2026-10-07');
const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src/content');

const GHOST_IMAGE_URL = /https?:\/\/storyloom\.de\/content\/images\/(?:size\/w\d+\/)?/g;

// Ghost primary tag slug -> blog
const BLOG_BY_TAG = {
  reisen: 'reisen',
  schottland: 'reisen',
  indien: 'reisen',
  'geschichten-3': 'geschichten',
  gedanken: 'geschichten',
  'gedanken-und-geschichten': 'geschichten',
  kochen: 'rezepte',
  backen: 'rezepte',
};

// Posts whose Ghost tags don't identify the blog
const BLOG_BY_SLUG = {
  fruhstuck: 'reisen', // part of the 2014 Scotland diary
};

// Tags that only mirror the blog itself or are Ghost import noise
const DROP_TAGS = new Set(['reisen', 'geschichten-3', 'gedanken-und-geschichten']);

function blogFor(post) {
  if (BLOG_BY_SLUG[post.slug]) return BLOG_BY_SLUG[post.slug];
  for (const tag of [post.primary_tag, ...post.tags].filter(Boolean)) {
    if (BLOG_BY_TAG[tag.slug]) return BLOG_BY_TAG[tag.slug];
  }
  throw new Error(`No blog for post "${post.slug}" — add it to BLOG_BY_SLUG`);
}

function cleanTags(tags) {
  return tags
    .filter((t) => !DROP_TAGS.has(t.slug) && !t.slug.startsWith('hash-import'))
    .map((t) => t.name.replace(/^#/, '').trim());
}

function localizeImage(url) {
  if (!url) return null;
  return url.replace(GHOST_IMAGE_URL, '/content/images/');
}

function prepareHtml(html) {
  return (html ?? '')
    .replace(/\s(srcset|sizes)="[^"]*"/g, '')
    .replace(GHOST_IMAGE_URL, '/content/images/');
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  emDelimiter: '_',
});
// Galleries and captioned images have no Markdown equivalent; keep them as HTML.
turndown.keep(['figure']);

function frontmatter(data) {
  const lines = Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

function writeEntry(dir, slug, data, html) {
  mkdirSync(dir, { recursive: true });
  const body = turndown.turndown(prepareHtml(html));
  writeFileSync(join(dir, `${slug}.md`), `${frontmatter(data)}\n${body}\n`);
}

const { posts } = JSON.parse(readFileSync(join(backup, 'data/posts.json'), 'utf8'));
const { pages } = JSON.parse(readFileSync(join(backup, 'data/pages.json'), 'utf8'));

for (const blog of new Set(Object.values(BLOG_BY_TAG))) {
  rmSync(join(contentDir, blog), { recursive: true, force: true });
}

const counts = {};
for (const post of posts) {
  const blog = blogFor(post);
  counts[blog] = (counts[blog] ?? 0) + 1;
  writeEntry(
    join(contentDir, blog),
    post.slug,
    {
      title: post.title,
      date: post.published_at,
      updated: post.updated_at,
      excerpt: post.custom_excerpt ?? post.excerpt,
      // Ghost's auto excerpt repeats the opening of the body; only a custom one is a lead.
      lead: Boolean(post.custom_excerpt) || undefined,
      cover: localizeImage(post.feature_image),
      coverAlt: post.feature_image_alt,
      coverCaption: post.feature_image_caption,
      tags: cleanTags(post.tags),
      featured: post.featured || undefined,
    },
    post.html,
  );
}

rmSync(join(contentDir, 'pages'), { recursive: true, force: true });
for (const page of pages) {
  writeEntry(join(contentDir, 'pages'), page.slug, { title: page.title }, page.html);
}

const imagesSrc = join(backup, 'content/images');
const imagesDest = join(root, 'public/content/images');
if (existsSync(imagesSrc)) {
  cpSync(imagesSrc, imagesDest, {
    recursive: true,
    filter: (src) => !src.endsWith('.DS_Store'),
  });
}

console.log('Imported posts:', counts, '| pages:', pages.length);

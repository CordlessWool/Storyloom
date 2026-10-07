// One-time import of a Ghost backup into Astro content collections.
//
// Usage: node scripts/import-ghost.mjs <path-to-backup>
//
// Posts become src/content/<blog>/[<trip>/]<slug>.md. Images are named after
// the post and stored
//   - recipes: next to the recipe, cover <slug>.jpg, others <slug>-01.jpg, ...
//   - travel posts: <trip>/_images/, cover <slug>-cover.jpg, others <slug>-01.jpg
//   - everything else: <blog>/_images/, same names as travel posts. Unsplash covers stay remote URLs
// (Astro optimizes them at build time). Images missing from the backup are
// still referenced under their new name and listed in
// scripts/missing-images.json, so scripts/restore-images.mjs can put the
// originals in place later. Existing generated content is overwritten.

import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import TurndownService from 'turndown';

const backup = resolve(process.argv[2] ?? 'storyloom-backup-2026-10-07');
const root = resolve(import.meta.dirname, '..');
const contentDir = join(root, 'src/content');
const missingFile = join(root, 'scripts/missing-images.json');

const GHOST_IMAGE_URL = /^https?:\/\/storyloom\.de\/content\/images\/(?:size\/w\d+\/)?/;

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

// Posts whose Ghost tags don't identify the blog or trip
const BLOG_BY_SLUG = {
  fruhstuck: 'reisen', // part of the 2014 Scotland diary
};
const TRIP_BY_SLUG = {
  fruhstuck: 'schottland',
};

// Travel posts are grouped into one folder per trip
const TRIPS = ['schottland', 'indien'];

// Tags that only mirror the blog or trip itself, or are Ghost import noise
const DROP_TAGS = new Set(['reisen', 'geschichten-3', 'gedanken-und-geschichten', ...TRIPS]);

// Custom excerpts that only repeat the first paragraph: keep them as list teaser, not as lead
const NO_LEAD = new Set(['fladle']);

function blogFor(post) {
  if (BLOG_BY_SLUG[post.slug]) return BLOG_BY_SLUG[post.slug];
  for (const tag of [post.primary_tag, ...post.tags].filter(Boolean)) {
    if (BLOG_BY_TAG[tag.slug]) return BLOG_BY_TAG[tag.slug];
  }
  throw new Error(`No blog for post "${post.slug}" — add it to BLOG_BY_SLUG`);
}

function tripFor(post) {
  const trip = TRIP_BY_SLUG[post.slug] ?? post.tags.map((t) => t.slug).find((s) => TRIPS.includes(s));
  if (!trip) throw new Error(`No trip for travel post "${post.slug}" — add it to TRIP_BY_SLUG`);
  return trip;
}

function cleanTags(tags) {
  return tags
    .filter((t) => !DROP_TAGS.has(t.slug) && !t.slug.startsWith('hash-import'))
    .map((t) => t.name.replace(/^#/, '').trim());
}

/** Copies the images of one entry into `imagesDir`, named after its slug. */
class EntryImages {
  constructor(entryFile, imagesDir, slug, coverName) {
    this.imagesDir = imagesDir;
    this.slug = slug;
    this.coverName = coverName;
    this.prefix = relative(dirname(entryFile), imagesDir) || '.';
    this.count = 0;
    this.names = new Map();
  }

  name(url, isCover = false) {
    if (!GHOST_IMAGE_URL.test(url)) return url; // remote (Unsplash): optimized by Astro at build time
    if (this.names.has(url)) return this.names.get(url);
    const clean = url.split('?')[0];
    const ext = extname(clean).toLowerCase().replace('.jpeg', '.jpg');
    const base = isCover ? this.coverName : `${this.slug}-${String(++this.count).padStart(2, '0')}`;
    const name = `${base}${ext}`;
    const ref = `${this.prefix.startsWith('.') ? '' : './'}${this.prefix}/${name}`;
    this.names.set(url, ref);

    mkdirSync(this.imagesDir, { recursive: true });
    const source = join(backup, 'content/images', clean.replace(GHOST_IMAGE_URL, ''));
    if (existsSync(source)) copyFileSync(source, join(this.imagesDir, name));
    else missing.push({ file: relative(root, join(this.imagesDir, name)), original: basename(source) });
    return ref;
  }
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  emDelimiter: '_',
});

let current; // EntryImages of the entry being converted

const image = (img, title) => {
  const alt = (img.getAttribute('alt') ?? '').replace(/[[\]]/g, '');
  const src = current.name(img.getAttribute('src'));
  return `![${alt}](${src}${title ? ` "${title.replace(/"/g, "'")}"` : ''})`;
};

// Ghost image and gallery cards become plain Markdown images on consecutive lines
// (one paragraph). The site renders such paragraphs as a figure / gallery; the
// title of the first image is the caption.
turndown.addRule('figure', {
  filter: 'figure',
  replacement: (_, node) => {
    const caption = node.getElementsByTagName('figcaption')[0]?.textContent.trim();
    const images = Array.from(node.getElementsByTagName('img')).map((img, i) => image(img, i === 0 && caption));
    return images.length ? `\n\n${images.join('\n')}\n\n` : '';
  },
});
turndown.addRule('img', { filter: 'img', replacement: (_, node) => image(node) });

function frontmatter(data) {
  const lines = Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`);
  return `---\n${lines.join('\n')}\n---\n`;
}

/** `data` gets the cover reference (if any) and returns the frontmatter. */
function writeEntry(blog, entryPath, slug, html, coverUrl, data) {
  const file = join(contentDir, `${entryPath}.md`);
  mkdirSync(dirname(file), { recursive: true });
  current =
    blog === 'rezepte'
      ? new EntryImages(file, dirname(file), slug, slug)
      : new EntryImages(file, join(dirname(file), '_images'), slug, `${slug}-cover`);
  const cover = coverUrl ? current.name(coverUrl, true) : undefined;
  const body = turndown.turndown(html ?? '');
  writeFileSync(file, `${frontmatter(data(cover))}\n${body}\n`);
}

const { posts } = JSON.parse(readFileSync(join(backup, 'data/posts.json'), 'utf8'));
const { pages } = JSON.parse(readFileSync(join(backup, 'data/pages.json'), 'utf8'));
const missing = [];

for (const dir of [...new Set(Object.values(BLOG_BY_TAG)), 'pages']) {
  rmSync(join(contentDir, dir), { recursive: true, force: true });
}

const counts = {};
for (const post of posts) {
  const blog = blogFor(post);
  const entryPath = blog === 'reisen' ? `reisen/${tripFor(post)}/${post.slug}` : `${blog}/${post.slug}`;
  counts[blog] = (counts[blog] ?? 0) + 1;
  writeEntry(blog, entryPath, post.slug, post.html, post.feature_image, (cover) => ({
    title: post.title,
    date: post.published_at,
    updated: post.updated_at,
    excerpt: post.custom_excerpt ?? post.excerpt,
    // Ghost's auto excerpt repeats the opening of the body; only a custom one is a lead.
    lead: (Boolean(post.custom_excerpt) && !NO_LEAD.has(post.slug)) || undefined,
    cover,
    coverAlt: post.feature_image_alt,
    coverCaption: post.feature_image_caption,
    tags: cleanTags(post.tags),
    featured: post.featured || undefined,
  }));
}

for (const page of pages) {
  writeEntry('pages', `pages/${page.slug}`, page.slug, page.html, null, () => ({ title: page.title }));
}

writeFileSync(missingFile, `${JSON.stringify(missing, null, 2)}\n`);
console.log('Imported posts:', counts, '| pages:', pages.length, '| missing images:', missing.length);

# Storyloom

Personal blog with three sections, built with [Astro](https://astro.build):

| Route           | Content                                    |
| --------------- | ------------------------------------------ |
| `/`             | Picker for the three blogs                 |
| `/reisen/`      | Travel diaries (Schottland, Indien)        |
| `/geschichten/` | Short stories and thoughts                 |
| `/rezepte/`     | Recipes, with full-text search (Pagefind)  |

## Commands

```sh
npm install
npm run dev       # dev server (recipe search unavailable here)
npm run build     # static build to dist/ + Pagefind search index
npm run preview   # serve dist/ — use this to try the search
npm run check     # type check
```

`BASE_PATH=/sub/ npm run build` builds the site for a sub-path.

## Content

```
src/content/
  reisen/<trip>/<slug>.md      → /reisen/<trip>/<slug>/   (trip page: /reisen/<trip>/)
  geschichten/<slug>.md        → /geschichten/<slug>/
  rezepte/<slug>.md            → /rezepte/<slug>/
  pages/<slug>.md              → /<slug>/   (Impressum, Über den Autor)
  <blog>/_images/              images of that blog
```

Frontmatter: `title`, `date`, optional `excerpt`, `lead` (show the excerpt as lead paragraph), `cover`, `coverAlt`, `coverCaption`, `tags`, `featured`, `draft`. Trip titles live in `TRIPS` in `src/lib/site.ts`.

### Images

Put images into the blog's `_images/` folder, name them after the post (`<slug>-cover.jpg`, `<slug>-01.jpg`, …) and reference them relatively. `cover` can also be a remote URL from an allowed domain (`image.domains` in `astro.config.mjs`, currently Unsplash):

```md
cover: "../_images/aufbruch-cover.jpg"

![Loch Ness am Morgen](../_images/aufbruch-01.jpg)

![](../_images/aufbruch-02.jpg "Caption for the whole gallery")
![](../_images/aufbruch-03.jpg)
```

Astro optimizes every image at build time (WebP, responsive `srcset`); remote covers are downloaded during the build and served from the site, so visitors never load from Unsplash. A paragraph that contains only images becomes a figure; more than one image becomes a gallery, and the title of the first image is the caption.

Images that are referenced but missing show a placeholder instead of breaking the build. The 22 images missing from the Ghost backup are listed with their original file names in `scripts/missing-images.json`; once found:

```sh
npm run restore:images -- path/to/folder-with-originals
```

## Ghost import

The content was imported once from a Ghost backup:

```sh
npm run import:ghost -- path/to/storyloom-backup
```

The script overwrites `src/content/{reisen,geschichten,rezepte,pages}`, renames images after their post and keeps Unsplash covers as URLs. Category and trip mapping live at the top of `scripts/import-ghost.mjs`.

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

Every post is a folder with an `index.md` and its images:

```
src/content/
  reisen/<trip>/<slug>/index.md     → /reisen/<trip>/<slug>/   (trip page: /reisen/<trip>/)
  geschichten/<slug>/index.md       → /geschichten/<slug>/
  rezepte/<slug>/index.md           → /rezepte/<slug>/
  pages/<slug>/index.md             → /<slug>/   (Impressum, Über den Autor)
```

Frontmatter: `title`, `date`, optional `excerpt`, `lead` (show the excerpt as lead paragraph), `cover`, `coverAlt`, `coverCaption`, `tags`, `featured`, `draft`. Trip titles live in `TRIPS` in `src/lib/site.ts`.

### Images

Put images next to `index.md`, name them after the post (`<slug>-cover.jpg`, `<slug>-01.jpg`, …) and reference them relatively:

```md
cover: "./aufbruch-cover.jpg"

![Loch Ness am Morgen](./aufbruch-01.jpg)

![](./aufbruch-02.jpg "Caption for the whole gallery")
![](./aufbruch-03.jpg)
```

Astro optimizes every image at build time (WebP, responsive `srcset`). A paragraph that contains only images becomes a figure; more than one image becomes a gallery, and the title of the first image is the caption.

Images that are referenced but missing show a placeholder instead of breaking the build. The 22 images missing from the Ghost backup are listed with their original file names in `scripts/missing-images.json`; once found:

```sh
npm run restore:images -- path/to/folder-with-originals
```

## Ghost import

The content was imported once from a Ghost backup:

```sh
npm run import:ghost -- path/to/storyloom-backup
```

The script overwrites `src/content/{reisen,geschichten,rezepte,pages}`, renames images after their post and downloads the Unsplash covers. Category and trip mapping live at the top of `scripts/import-ghost.mjs`.

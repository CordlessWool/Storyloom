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

Posts are Markdown files in `src/content/<blog>/`, pages (Impressum, Über den Autor) in `src/content/pages/`. Frontmatter: `title`, `date`, optional `excerpt`, `cover`, `coverAlt`, `coverCaption`, `tags`, `featured`, `draft`.

Images live in `public/content/images/` and are referenced as `/content/images/...`. Images that are referenced but missing are replaced by a placeholder at build time — drop the file into place and rebuild to restore it.

Each blog has its own route folder in `src/pages/<blog>/`, so a blog can get its own layout without affecting the others.

## Ghost import

The content was imported once from a Ghost backup:

```sh
npm run import:ghost -- path/to/storyloom-backup
```

The script overwrites `src/content/{reisen,geschichten,rezepte,pages}`. Category mapping lives at the top of `scripts/import-ghost.mjs`.

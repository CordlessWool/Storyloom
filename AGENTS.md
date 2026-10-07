# Agent Guidelines

Rules for any automated assistant working in this repository.

## No attribution

Never mention AI, assistants, tools, or anything pointing to automated authorship. This applies everywhere:

- Commit messages (no `Co-Authored-By` or "Generated with" trailers)
- Pull request titles and descriptions
- Code comments, docs, changelogs, file headers

## Branching

- Never commit directly to `main`.
- Every change goes on its own branch, e.g. `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- Merge into `main` only via pull request or after explicit approval.

## Project notes

- Astro 7. Markdown runs through the `unified()` processor (see `astro.config.mjs`) because `src/lib/markdown-images.mjs` needs the mdast/hast trees (missing-image placeholder, image-only paragraphs → figures).
- Content entries are flat files (`<slug>.md`, travel posts `<trip>/<slug>.md`); images in `<blog>/_images/`, named `<slug>-cover.jpg`, `<slug>-01.jpg`. Use relative image paths so Astro optimizes them; covers may be remote URLs (render them with `CoverImage`).
- Internal links must go through `url()` / `postUrl()` from `src/lib/site.ts` so `BASE_PATH` builds keep working.
- Recipe search (Pagefind) only exists after `npm run build`; test it with `npm run preview`.
- Docs: https://docs.astro.build

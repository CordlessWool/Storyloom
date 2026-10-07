// Rehype plugin for root-relative image paths in content (`/content/images/...`):
// - prefixes the configured base path, so the site also works under a sub-path
// - swaps images missing from public/ for a placeholder. The content keeps the
//   real path, so restoring the file and rebuilding brings the original back.

import { existsSync } from 'node:fs';
import { join } from 'node:path';

export const PLACEHOLDER = '/placeholder.svg';

export function isLocal(src) {
  return typeof src === 'string' && src.startsWith('/') && !src.startsWith('//');
}

export function isMissingLocalImage(src, publicDir = 'public') {
  return isLocal(src) && !existsSync(join(publicDir, decodeURIComponent(src.split('?')[0])));
}

export function withBase(base, path) {
  return base.replace(/\/$/, '') + path;
}

export function rehypeLocalImages({ base = '/' } = {}) {
  // Inline HTML (e.g. Ghost gallery figures) stays a raw string in the tree.
  const rewriteRaw = (html) =>
    html.replace(/<img\b[^>]*>/g, (tag) => {
      const src = tag.match(/\bsrc="([^"]+)"/)?.[1];
      if (!isLocal(src)) return tag;
      if (!isMissingLocalImage(src)) return tag.replace(`src="${src}"`, `src="${withBase(base, src)}"`);
      const marked = tag
        .replace(`src="${src}"`, `src="${withBase(base, PLACEHOLDER)}" data-missing-src="${src}"`)
        .replace(/\bclass="([^"]*)"/, 'class="$1 img-missing"');
      return marked.includes('img-missing') ? marked : marked.replace('<img', '<img class="img-missing"');
    });

  const walk = (node) => {
    if (node.type === 'raw') node.value = rewriteRaw(node.value);
    if (node.type === 'element' && node.tagName === 'img') {
      const p = node.properties;
      const src = String(p.src ?? '');
      if (isMissingLocalImage(src)) {
        p.dataMissingSrc = src;
        p.src = PLACEHOLDER;
        p.alt = p.alt || 'Bild folgt';
        p.className = [...[p.className ?? []].flat(), 'img-missing'];
      }
      if (isLocal(p.src)) p.src = withBase(base, p.src);
    }
    node.children?.forEach(walk);
  };
  return walk;
}

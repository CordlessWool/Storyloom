// Markdown plugins for images that live next to the content (`./name.jpg`).
// Astro optimizes those automatically; these plugins only handle the edges.

import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const PLACEHOLDER = '/placeholder.svg';

const isRelative = (url) => !/^([a-z]+:|\/|#)/i.test(url);

/**
 * Remark: images missing on disk become a placeholder instead of failing the
 * build. Runs before Astro collects images; the content keeps the real path,
 * so adding the file and rebuilding is enough to show it.
 */
export function remarkMissingImages({ base = '/' } = {}) {
  return (tree, file) => {
    if (typeof file.path !== 'string') return;
    const walk = (node) => {
      if (node.type === 'image' && isRelative(node.url)) {
        if (!existsSync(join(dirname(file.path), decodeURI(node.url)))) {
          node.data = {
            ...node.data,
            hProperties: { className: ['img-missing'], dataMissingSrc: node.url },
          };
          node.url = base.replace(/\/$/, '') + PLACEHOLDER;
        }
      }
      node.children?.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Rehype: a paragraph that contains only images becomes a <figure>, with
 * class "gallery" for more than one image. The title of the first image is
 * the caption.
 */
export function rehypeFigures() {
  const isBlank = (n) => n.type === 'text' && !n.value.trim();
  const walk = (node) => {
    node.children?.forEach((child, i) => {
      if (child.type !== 'element' || child.tagName !== 'p') return walk(child);
      const content = child.children.filter((n) => !isBlank(n) && !(n.type === 'element' && n.tagName === 'br'));
      if (!content.length || !content.every((n) => n.type === 'element' && n.tagName === 'img')) return;

      const caption = content[0].properties.title;
      content.forEach((img) => delete img.properties.title);
      node.children[i] = {
        type: 'element',
        tagName: 'figure',
        properties: { className: content.length > 1 ? ['gallery'] : [], dataCount: content.length },
        children: [
          ...content,
          ...(caption ? [{ type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: String(caption) }] }] : []),
        ],
      };
    });
  };
  return walk;
}

import type { ImageMetadata } from 'astro';
import { getImage } from 'astro:assets';

/** Absolute URL of a 1200px JPEG version of a cover, for og:image. */
export async function ogImageUrl(cover: ImageMetadata | string, site: URL): Promise<URL> {
  const options = { width: 1200, format: 'jpg' as const };
  const image = typeof cover === 'string' ? await getImage({ src: cover, inferSize: true, ...options }) : await getImage({ src: cover, ...options });
  return new URL(image.src, site);
}

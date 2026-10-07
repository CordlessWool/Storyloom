// Line icons for recipes without a photo, picked by category tag.
// 24×24 viewBox, drawn with stroke only (stroke-width set by the caller).

export type IconKind = 'kuchen' | 'backen' | 'kochen' | 'schale';

export const ICON_LABEL: Record<IconKind, string> = {
  kuchen: 'Kuchen',
  backen: 'Backen',
  kochen: 'Kochen',
  schale: 'Rezept',
};

export const ICON_PATHS: Record<IconKind, string> = {
  // Cake slice with a cherry
  kuchen: 'M3 19.5h18v-8L4.6 6.4 3 7.9zM3 14.5h18M15.6 7.2a1.7 1.7 0 1 0 0-.01M16.8 5.6l1.2-2',
  // Loaf with scored crust
  backen: 'M5 19.5h14v-6.6c1.3-.6 2-1.7 2-3.1 0-2.6-3.6-4.3-9-4.3S3 7.2 3 9.8c0 1.4.7 2.5 2 3.1zM9.2 9.4 7.8 12M13.2 9.4 11.8 12M17.2 9.4 15.8 12',
  // Pot with domed lid and knob
  kochen: 'M5 11.5h14v5a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 5 16.5zM2.5 13H5M19 13h2.5M4.5 11.5c.4-2.6 3.4-4.2 7.5-4.2s7.1 1.6 7.5 4.2M12 7.3V5.2M10.5 5.2h3',
  // Bowl with steam (fallback)
  schale: 'M3 11.5h18a9 9 0 0 1-18 0zM9 20.5h6M9.5 8c0-1 1-1.2 1-2.3M13.5 8c0-1 1-1.2 1-2.3',
};

/** Most specific category wins: Kuchen before Backen before Kochen. */
export function iconKind(tags: string[]): IconKind {
  if (tags.includes('Kuchen')) return 'kuchen';
  if (tags.includes('Backen')) return 'backen';
  if (tags.includes('Kochen')) return 'kochen';
  return 'schale';
}

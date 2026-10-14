// schema.org Recipe for a recipe page, built from the parsed recipe parts.
// Google shows recipes with this markup as rich results (image, time, servings).

import { SITE, postUrl, type Post } from '../../lib/site';
import { plainText, type Fact, type RecipeParts } from './recipe-parts';

const PREP = ['Zubereitungszeit'];
const COOK = ['Backzeit', 'Kochzeit'];
const REST = ['Ruhezeit'];
const YIELD = ['Menge', 'Portionen'];
/** Tags that name a regional cuisine (recipeCuisine). */
const CUISINES = ['Schwäbisch', 'Bayerisch', 'Badisch', 'Russisch', 'Italienisch', 'Französisch'];

/** "60 min", "ca. 30min", "2,5 bis 3h", "1,5 Stunden" → minutes (the upper value of a range). */
function minutes(line: string): number | undefined {
  const m = plainText(line).match(/(\d+(?:[.,]\d+)?)\s*(min|std|stunde|h\b)/i);
  if (!m) return undefined;
  const n = parseFloat(m[1].replace(',', '.'));
  return Math.round(/^min/i.test(m[2]) ? n : n * 60);
}

/**
 * Prep, cook and rest minutes. "Zeitaufwand" lists them line by line
 * ("ca. 30min Zubereitung", "2,5 bis 3h Ruhen", "20 bis 30min Backen").
 */
function times(facts: Fact[]) {
  const t = { prep: 0, cook: 0, rest: 0 };
  for (const f of facts) {
    for (const line of f.lines) {
      const min = minutes(line);
      if (!min) continue;
      const kind = PREP.includes(f.label)
        ? 'prep'
        : COOK.includes(f.label)
          ? 'cook'
          : REST.includes(f.label)
            ? 'rest'
            : f.label === 'Zeitaufwand'
              ? /back|koch|brat/i.test(line)
                ? 'cook'
                : /ruh|geh/i.test(line)
                  ? 'rest'
                  : 'prep'
              : undefined;
      if (kind) t[kind] += min;
    }
  }
  return t;
}

const duration = (min: number) => (min ? `PT${min}M` : undefined);

/** "… für 2-3 Personen …" → "2-3 Personen"; short lines are taken as they are. */
function servings(facts: Fact[]): string | undefined {
  const line = facts.find((f) => YIELD.includes(f.label))?.lines.join(' ');
  if (!line) return undefined;
  const text = plainText(line);
  return text.match(/\d+(?:\s*[-–]\s*\d+)?\s*(?:Personen|Portionen|Stück|Brote?)\b/i)?.[0] ?? (text.length <= 40 ? text : undefined);
}

export function recipeSchema(post: Post, parts: RecipeParts | undefined, image: string | undefined, site: URL) {
  const facts = parts?.facts ?? [];
  const { prep, cook, rest } = times(facts);
  const cuisine = post.data.tags.filter((t) => CUISINES.includes(t));
  const ingredients = (parts?.groups ?? [])
    .filter((g) => !g.equipment)
    .flatMap((g) => g.items.map((i) => plainText([i.qty, i.name].filter(Boolean).join(' '))));

  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: post.data.title,
    description: plainText(post.data.excerpt ?? ''),
    url: new URL(postUrl('rezepte', post.id), site).href,
    ...(image && { image: [image] }),
    author: { '@type': 'Person', name: SITE.author },
    datePublished: post.data.date.toISOString(),
    inLanguage: SITE.lang,
    ...(cuisine.length && { recipeCuisine: cuisine.join(', ') }),
    ...(post.data.tags.length && { keywords: post.data.tags.join(', ') }),
    ...(prep && { prepTime: duration(prep) }),
    ...(cook && { cookTime: duration(cook) }),
    ...((prep || cook) && { totalTime: duration(prep + cook + rest) }),
    ...(servings(facts) && { recipeYield: servings(facts) }),
    ...(ingredients.length && { recipeIngredient: ingredients }),
    ...(parts?.steps.length && { recipeInstructions: parts.steps.map((text) => ({ '@type': 'HowToStep', text })) }),
  };
}

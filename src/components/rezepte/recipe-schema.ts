// schema.org Recipe for a recipe page, built from the parsed recipe parts.
// Google shows recipes with this markup as rich results (image, time, servings).

import { SITE, postUrl, type Post } from '../../lib/site';
import { plainText, type Fact, type RecipeParts } from './recipe-parts';

const PREP = ['Zubereitungszeit', 'Zeitaufwand'];
const COOK = ['Backzeit', 'Kochzeit'];
const YIELD = ['Menge', 'Portionen'];

/** "60 min", "ca. 30min", "1,5 Stunden" → minutes. */
function minutes(facts: Fact[], labels: string[]): number | undefined {
  const line = facts.find((f) => labels.includes(f.label))?.lines.join(' ');
  const m = line && plainText(line).match(/(\d+(?:[.,]\d+)?)\s*(min|std|stunde)/i);
  if (!m) return undefined;
  const n = parseFloat(m[1].replace(',', '.'));
  return Math.round(/^min/i.test(m[2]) ? n : n * 60);
}

const duration = (min?: number) => (min ? `PT${min}M` : undefined);

/** "… für 2-3 Personen …" → "2-3 Personen"; short lines are taken as they are. */
function servings(facts: Fact[]): string | undefined {
  const line = facts.find((f) => YIELD.includes(f.label))?.lines.join(' ');
  if (!line) return undefined;
  const text = plainText(line);
  return text.match(/\d+(?:\s*[-–]\s*\d+)?\s*(?:Personen|Portionen|Stück|Brote?)\b/i)?.[0] ?? (text.length <= 40 ? text : undefined);
}

export function recipeSchema(post: Post, parts: RecipeParts | undefined, image: string | undefined, site: URL) {
  const facts = parts?.facts ?? [];
  const prep = minutes(facts, PREP);
  const cook = minutes(facts, COOK);
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
    ...(post.data.tags.length && { keywords: post.data.tags.join(', ') }),
    ...(prep && { prepTime: duration(prep) }),
    ...(cook && { cookTime: duration(cook) }),
    ...((prep || cook) && { totalTime: duration((prep ?? 0) + (cook ?? 0)) }),
    ...(servings(facts) && { recipeYield: servings(facts) }),
    ...(ingredients.length && { recipeIngredient: ingredients }),
    ...(parts?.steps.length && { recipeInstructions: parts.steps.map((text) => ({ '@type': 'HowToStep', text })) }),
  };
}

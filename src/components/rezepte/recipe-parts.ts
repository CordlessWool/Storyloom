// Splits a rendered recipe (Ghost-era Markdown, no structured data) into the
// parts a cook needs: ingredient groups, key facts and the remaining method.
// Works on the top-level blocks of the rendered HTML. Recipes without a
// recognisable ingredient block return no groups; the page then falls back
// to a single column.

export interface Ingredient {
  qty?: string;
  /** May contain inline HTML (links). */
  name: string;
}

export interface IngredientGroup {
  label: string;
  /** Equipment ("Vorbereitung") rather than food. */
  equipment: boolean;
  items: Ingredient[];
}

export interface Fact {
  label: string;
  lines: string[];
}

export interface RecipeParts {
  groups: IngredientGroup[];
  facts: Fact[];
  method: string;
  /** Plain-text paragraphs and list items after the first ingredient group. */
  steps: string[];
}

const INGREDIENT_LABELS = ['Zutaten', 'Teig', 'Füllung', 'Belag', 'Streusel', 'Optional', 'Gewürze', 'Für die Soße'];
const EQUIPMENT_LABELS = ['Vorbereitung', 'Zubehör', 'Utensilien'];
const FACT_LABELS = ['Menge', 'Portionen', 'Zeitaufwand', 'Temperatur', 'Backzeit', 'Zubereitungszeit', 'Ruhezeit', 'Kochzeit'];
const ALL_LABELS = [...INGREDIENT_LABELS, ...EQUIPMENT_LABELS, ...FACT_LABELS];

const VOID = new Set(['br', 'img', 'hr', 'input', 'source', 'wbr', 'meta', 'link']);

/** Top-level elements of an HTML fragment, as outer HTML strings. */
export function splitBlocks(html: string): string[] {
  const blocks: string[] = [];
  const tag = /<(\/?)([a-zA-Z][\w-]*)[^>]*?(\/?)>/g;
  let depth = 0;
  let start = -1;
  let m: RegExpExecArray | null;
  while ((m = tag.exec(html))) {
    const [full, closing, name, selfClosing] = m;
    const lower = name.toLowerCase();
    if (closing) {
      depth--;
      if (depth === 0 && start >= 0) {
        blocks.push(html.slice(start, m.index + full.length));
        start = -1;
      }
    } else if (VOID.has(lower) || selfClosing) {
      if (depth === 0) blocks.push(full);
    } else {
      if (depth === 0) start = m.index;
      depth++;
    }
  }
  return blocks;
}

const text = (html: string) => html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
/** Tags stripped and entities decoded, for structured data (not for HTML output). */
export const plainText = (html: string) =>
  html
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x?[\da-f]+|\w+);/gi, (m, e: string) =>
      e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(1).replace(/^x/i, ''), /^#x/i.test(e) ? 16 : 10)) : (ENTITIES[e] ?? m),
    )
    .replace(/\s+/g, ' ')
    .trim();
const inner = (block: string) => block.replace(/^<[^>]+>/, '').replace(/<\/[^>]+>\s*$/, '');
const isList = (block: string) => /^<(ul|ol)\b/i.test(block);
const listItems = (block: string) => [...block.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => m[1]);

function cleanLine(line: string): string {
  return line
    .replace(/^<p>|<\/p>$/g, '')
    .replace(/^\s*(?:\\?-|–|•)\s+/, '')
    .trim();
}

const QTY =
  /^((?:ca\.\s*)?\d[\d.,/]*(?:\s*[-–]\s*\d[\d.,/]*)?(?:\s*(?:kg|g|ml|l|el|tl|EL|TL|Tassen?|Würfel|Päckchen|Esslöffel|Teelöffel|Prisen?|Stück|Becher|Bund|Dosen?|Schluck)\b\.?)?)\s+(.+)$/s;

function toIngredient(line: string): Ingredient {
  const m = line.match(QTY);
  return m ? { qty: m[1].trim(), name: m[2].trim() } : { name: line };
}

/** `<p><strong>Zutaten:</strong><br>…` or a plain `<p>Teig:</p>` → label + rest. */
function matchLabel(block: string): { label: string; rest: string } | undefined {
  if (!/^<p\b/i.test(block)) return undefined;
  const body = inner(block).trim();
  const names = ALL_LABELS.join('|');
  const bold = body.match(new RegExp(`^<strong>\\s*(${names})\\s*:?\\s*</strong>\\s*:?\\s*(?:<br\\s*/?>)?([\\s\\S]*)$`, 'i'));
  if (bold) return { label: bold[1], rest: bold[2].trim() };
  const plain = body.match(new RegExp(`^(${names})\\s*:\\s*$`, 'i'));
  if (plain) return { label: plain[1], rest: '' };
  return undefined;
}

/** A list where every item is "Backzeit: 60 min" style → facts. */
function matchFactList(block: string): Fact[] | undefined {
  if (!isList(block)) return undefined;
  const facts = listItems(block).map((li) => text(li).match(new RegExp(`^(${FACT_LABELS.join('|')})\\s*:\\s*(.+)$`, 'i')));
  if (facts.length === 0 || facts.some((f) => !f)) return undefined;
  return facts.map((f) => ({ label: f![1], lines: [f![2]] }));
}

/** Paragraphs and list items are steps; headings, figures and tips are not. */
function toSteps(block: string): string[] {
  const lines = isList(block) ? listItems(block) : /^<p\b/i.test(block) ? [inner(block)] : [];
  return lines.map(plainText).filter(Boolean);
}

const canonical = (label: string) => ALL_LABELS.find((l) => l.toLowerCase() === label.toLowerCase()) ?? label;

export function extractRecipe(html: string): RecipeParts {
  const blocks = splitBlocks(html);
  const groups: IngredientGroup[] = [];
  const facts: Fact[] = [];
  const method: string[] = [];
  const steps: string[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    const factList = matchFactList(block);
    if (factList) {
      facts.push(...factList);
      continue;
    }

    const hit = matchLabel(block);
    if (!hit) {
      method.push(block);
      if (groups.length > 0) steps.push(...toSteps(block));
      continue;
    }

    const label = canonical(hit.label);
    let lines = hit.rest ? hit.rest.split(/<br\s*\/?>/i).map(cleanLine).filter(Boolean) : [];
    if (lines.length === 0 && blocks[i + 1] && isList(blocks[i + 1])) {
      lines = listItems(blocks[++i]).map(cleanLine).filter(Boolean);
    }
    if (lines.length === 0) {
      method.push(block);
      continue;
    }

    if (FACT_LABELS.includes(label)) {
      facts.push({ label, lines });
    } else {
      groups.push({
        label,
        equipment: EQUIPMENT_LABELS.includes(label),
        items: lines.map(toIngredient),
      });
    }
  }

  return { groups, facts, method: method.join('\n'), steps };
}

/** Number of food ingredients (equipment excluded). */
export function ingredientCount(parts: RecipeParts): number {
  return parts.groups.filter((g) => !g.equipment).reduce((n, g) => n + g.items.length, 0);
}

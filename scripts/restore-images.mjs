// Puts images that were missing from the Ghost backup in place.
//
// Usage: node scripts/restore-images.mjs <folder-with-originals>
//
// Looks up every entry of scripts/missing-images.json by its original file name
// (e.g. DSC_1264-2.jpg) anywhere below the given folder, copies it under its new
// name next to its post and removes it from the list.

import { copyFileSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/restore-images.mjs <folder-with-originals>');
  process.exit(1);
}

const root = resolve(import.meta.dirname, '..');
const listFile = join(root, 'scripts/missing-images.json');
const missing = JSON.parse(readFileSync(listFile, 'utf8'));

const found = new Map();
const scan = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) scan(path);
    else found.set(name.toLowerCase(), path);
  }
};
scan(resolve(source));

const still = missing.filter(({ file, original }) => {
  const path = found.get(original.toLowerCase());
  if (!path) return true;
  copyFileSync(path, join(root, file));
  console.log(`✓ ${original} → ${file}`);
  return false;
});

writeFileSync(listFile, `${JSON.stringify(still, null, 2)}\n`);
console.log(`${missing.length - still.length} restored, ${still.length} still missing.`);

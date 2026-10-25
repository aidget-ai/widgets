import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { root, registry } from './package.mjs';
const actual = registry();
if (readFileSync(join(root, 'registry.json'), 'utf8') !== JSON.stringify(actual, null, 2) + '\n') throw new Error('registry.json is stale; run npm run registry');
const base = process.argv[2];
if (base) {
  if (!/^[a-f0-9]{40}$/.test(base)) throw new Error('base must be an exact commit SHA');
  const previous = JSON.parse(execFileSync('git', ['show', `${base}:registry.json`], { cwd: root, encoding: 'utf8' }));
  for (const entry of actual.widgets) {
    const old = previous.widgets.find(e => e.package.name === entry.package.name);
    if (old?.package.version === entry.package.version && JSON.stringify(old.files) !== JSON.stringify(entry.files)) throw new Error(`${entry.package.name}: distributed content changed without a version bump`);
  }
}
console.log(`Checked ${actual.widgets.length} widget(s)`);

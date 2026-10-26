import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { root, registry } from './package.mjs';

/** A reviewed name/version keeps the same bytes, including after delisting. */
export function assertImmutableVersions(current, history) {
  for (const previous of history) {
    for (const entry of current.widgets) {
      const old = previous.widgets.find(
        (candidate) =>
          candidate.package.name === entry.package.name &&
          candidate.package.version === entry.package.version,
      );
      if (old && JSON.stringify(old.files) !== JSON.stringify(entry.files)) {
        throw new Error(
          `${entry.package.name}@${entry.package.version}: reviewed version is immutable; bump the version`,
        );
      }
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const actual = registry();
  if (
    readFileSync(join(root, 'registry.json'), 'utf8') !==
    JSON.stringify(actual, null, 2) + '\n'
  ) {
    throw new Error('registry.json is stale; run pnpm registry');
  }
  const base =
    process.argv[2] ??
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  if (!/^[a-f0-9]{40}$/.test(base)) {
    throw new Error('base must be an exact commit SHA');
  }
  const commits = execFileSync('git', ['rev-list', base, '--', 'registry.json'], {
    cwd: root,
    encoding: 'utf8',
  })
    .trim()
    .split('\n')
    .filter(Boolean);
  for (const commit of commits) {
    const previous = JSON.parse(
      execFileSync('git', ['show', `${commit}:registry.json`], { cwd: root, encoding: 'utf8' }),
    );
    assertImmutableVersions(actual, [previous]);
  }
  console.log(`Checked ${actual.widgets.length} widget(s)`);
}

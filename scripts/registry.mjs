import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { root, registry } from './package.mjs';

/** Parse explicit first inclusion dates; reject ambiguous or duplicate assignments. */
export function publicationArguments(args) {
  const { values } = parseArgs({
    args,
    options: { 'published-at': { type: 'string', multiple: true } },
  });
  const publishedAt = new Map();
  for (const value of values['published-at'] ?? []) {
    const separator = value.indexOf('=');
    if (separator < 1 || publishedAt.has(value.slice(0, separator))) {
      throw new Error('--published-at requires a unique <package>=<UTC RFC3339 timestamp>');
    }
    publishedAt.set(value.slice(0, separator), value.slice(separator + 1));
  }
  return publishedAt;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  writeFileSync(
    join(root, 'registry.json'),
    JSON.stringify(registry(publicationArguments(process.argv.slice(2))), null, 2) + '\n',
  );
}

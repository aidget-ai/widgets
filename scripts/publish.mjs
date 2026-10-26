import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { json, integrity } from './package.mjs';
export async function registryVersion(name, version, request = fetch) {
  const response = await request(
    `https://registry.npmjs.org/${encodeURIComponent(name)}${version ? `/${version}` : ''}`,
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`npm lookup ${name}: HTTP ${response.status}`);
  }
  return response.json();
}
export async function publish(
  packed,
  { lookup = registryVersion, run = execFileSync, env = process.env } = {},
) {
  const summary = [];
  for (const [name, pkg] of Object.entries(json(join(packed, 'index.json')).packages)) {
    const version = pkg.latest,
      entry = pkg.versions[version],
      file = join(packed, entry.file);
    if (integrity(readFileSync(file)) !== entry.integrity) {
      throw new Error('publish artifact integrity mismatch');
    }
    const existing = await lookup(name, version);
    if (existing) {
      if (existing.dist?.integrity !== entry.integrity) {
        throw new Error(`${name}@${version}: npm version differs from reviewed artifact`);
      }
      summary.push(`${name}@${version}: already published`);
      continue;
    }
    if (!(await lookup(name)) && !env.NPM_TOKEN) {
      summary.push(
        `${name}@${version}: first publication requires an npm scope owner or NPM_TOKEN; available from the reviewed Git commit`,
      );
      continue;
    }
    run(
      'npm',
      [
        'publish',
        file,
        '--access',
        'public',
        '--ignore-scripts',
        '--registry',
        'https://registry.npmjs.org',
      ],
      {
        stdio: 'inherit',
        env: { ...env, ...(env.NPM_TOKEN ? { NODE_AUTH_TOKEN: env.NPM_TOKEN } : {}) },
      },
    );
    summary.push(`${name}@${version}: published`);
  }
  return summary;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2]) {
    throw new Error('usage: node scripts/publish.mjs <packed>');
  }
  const summary = (await publish(resolve(process.argv[2]))).join('\n');
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }
}

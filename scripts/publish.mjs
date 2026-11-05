import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { json, integrity, shasum } from './package.mjs';
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
export function stagedVersions(run = execFileSync) {
  return JSON.parse(
    run('npm', ['stage', 'list', '--json', '--registry', 'https://registry.npmjs.org'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );
}
export async function publish(
  packed,
  { lookup = registryVersion, staged = stagedVersions, run = execFileSync, env = process.env } = {},
) {
  const summary = [];
  let stagedQueue;
  const loadStaged = async () => (stagedQueue ??= await staged(run));
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
    const firstRelease = !(await lookup(name));
    if (firstRelease && !env.NPM_TOKEN) {
      summary.push(
        `${name}@${version}: first release requires an npm scope owner or stage-only NPM_TOKEN; available from the reviewed Git commit`,
      );
      continue;
    }
    if (firstRelease) {
      const pending = (await loadStaged()).find(
        (item) => item.packageName === name && item.version === version,
      );
      if (pending) {
        if (pending.shasum !== shasum(readFileSync(file))) {
          throw new Error(`${name}@${version}: staged npm version differs from reviewed artifact`);
        }
        summary.push(`${name}@${version}: already staged for first-release approval`);
        continue;
      }
    }
    run(
      'npm',
      [
        ...(firstRelease ? ['stage'] : []),
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
        env: {
          ...env,
          ...(firstRelease && env.NPM_TOKEN ? { NODE_AUTH_TOKEN: env.NPM_TOKEN } : {}),
        },
      },
    );
    summary.push(
      firstRelease
        ? `${name}@${version}: staged for first-release approval`
        : `${name}@${version}: published`,
    );
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

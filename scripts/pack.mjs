import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { root, registry, integrity } from './package.mjs';
const out = resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('usage: node scripts/pack.mjs <out>');
mkdirSync(join(out, 'tgz'), { recursive: true });
const packages = {};
for (const entry of registry().widgets) {
  const [packed] = JSON.parse(execFileSync('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', join(out, 'tgz')], { cwd: join(root, 'packages', entry.config.id), encoding: 'utf8' }));
  const file = `tgz/${packed.filename}`;
  const bytes = readFileSync(join(out, file)); if (bytes.length > 20*1024*1024) throw new Error('tarball exceeds 20 MiB');
  packages[entry.package.name] = { latest: entry.package.version, versions: { [entry.package.version]: { file, integrity: integrity(bytes), sourceCommit: process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(), files: entry.files } } };
}
writeFileSync(join(out, 'index.json'), JSON.stringify({ packages }, null, 2) + '\n');

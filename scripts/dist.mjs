import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { integrity, safePath, json } from './package.mjs';
export function mergeDist(packed, destination) {
  mkdirSync(join(destination, 'tgz'), { recursive: true });
  const indexPath = join(destination, 'index.json');
  const index = existsSync(indexPath) ? json(indexPath) : { packages: {} };
  for (const [name, entry] of Object.entries(json(join(packed, 'index.json')).packages)) {
    const target = index.packages[name] ??= { latest: entry.latest, versions: {} };
    for (const [version, value] of Object.entries(entry.versions)) {
      safePath(value.file); if (!/^tgz\/[a-zA-Z0-9._-]+\.tgz$/.test(value.file)) throw new Error('invalid tarball path');
      const bytes = readFileSync(join(packed, value.file));
      if (integrity(bytes) !== value.integrity) throw new Error('packed artifact integrity mismatch');
      const old = target.versions[version];
      if (old) {
        if (old.integrity !== value.integrity || JSON.stringify(old.files) !== JSON.stringify(value.files)) throw new Error(`${name}@${version}: published version is immutable`);
        if (!existsSync(join(destination, old.file)) || integrity(readFileSync(join(destination, old.file))) !== old.integrity) throw new Error('published dist tarball is missing or corrupt');
      } else { copyFileSync(join(packed, value.file), join(destination, value.file)); target.versions[version] = value; }
    }
    target.latest = entry.latest;
  }
  writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (!process.argv[2] || !process.argv[3]) throw new Error('usage: node scripts/dist.mjs <packed> <dist-checkout>');
  mergeDist(resolve(process.argv[2]), resolve(process.argv[3]));
}

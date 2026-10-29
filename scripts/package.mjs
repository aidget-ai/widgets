import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, lstatSync, realpathSync } from 'node:fs';
import { resolve, relative, join, sep } from 'node:path';

import Ajv from 'ajv/dist/2020.js';

import { validateResources } from './resources.mjs';

export const root = resolve(import.meta.dirname, '..');
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const integrity = (bytes) => `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
export function json(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}
export function packedEntry(output) {
  const value = JSON.parse(output);
  const entries = Array.isArray(value) ? value : Object.values(value ?? {});
  if (entries.length !== 1 || !entries[0] || !Array.isArray(entries[0].files)) {
    throw new Error('invalid npm pack manifest');
  }
  return entries[0];
}
export function safePath(path) {
  if (!path || /[\\:\0]/.test(path) || path.split('/').some((p) => !p || p.startsWith('.'))) {
    throw new Error(`unsafe package path: ${path}`);
  }
}
function checkTree(directory, base = directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile())) {
      throw new Error(`unsupported package entry: ${path}`);
    }
    safePath(relative(base, path).split(sep).join('/'));
    if (entry.isDirectory()) {
      checkTree(path, base);
    }
  }
}
const ajv = new Ajv({ allErrors: true, strict: false });
ajv.addFormat('date-time', isPublicationTime);
ajv.addFormat('double', { type: 'number', validate: Number.isFinite });
ajv.addFormat('uint64', { type: 'number', validate: (n) => Number.isSafeInteger(n) && n >= 0 });
const validators = new Map();
export function validateSchema(name, value) {
  if (!validators.has(name)) {
    validators.set(name, ajv.compile(json(join(root, 'schemas', `${name}.schema.json`))));
  }
  const validate = validators.get(name);
  if (!validate(value)) {
    throw new Error(`${name}: ${ajv.errorsText(validate.errors)}`);
  }
}
export function inspect(directory) {
  checkTree(directory);
  const pkg = json(join(directory, 'package.json'));
  const config = json(join(directory, 'config.json'));
  validateSchema('package', pkg);
  validateSchema('widget-config', config);
  if (Object.keys(pkg.scripts ?? {}).length) {
    throw new Error('widget packages cannot declare lifecycle or build scripts');
  }
  if (
    !/^[a-z0-9][a-z0-9-]{0,63}$/.test(config.id) ||
    pkg.name !== `@aidget-community/${config.id}`
  ) {
    throw new Error('package name must be @aidget-community/<id>');
  }
  if (!/^\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?$/.test(pkg.version)) {
    throw new Error('package requires an exact semver version');
  }
  if (
    !config.title.trim() ||
    !pkg.description.trim() ||
    !pkg.author ||
    !config.screenshots.length
  ) {
    throw new Error('community package requires title, description, author and screenshot');
  }
  if (config.size.width < 160 || config.size.height < 120 || !config.platforms.length) {
    throw new Error('invalid platform list or initial size');
  }
  for (const origin of config.network) {
    const url = new URL(origin);
    if (
      url.protocol !== 'https:' ||
      url.origin !== origin ||
      url.hostname.includes('*') ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      throw new Error(`invalid network origin: ${origin}`);
    }
  }
  for (const key of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    if (Object.keys(pkg[key] ?? {}).length) {
      throw new Error('runtime dependencies must be bundled');
    }
  }
  const packed = packedEntry(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );
  if (packed.files.length > 1000 || packed.unpackedSize > 100 * 1024 * 1024) {
    throw new Error('package exceeds install limits');
  }
  const files = packed.files
    .map(({ path }) => {
      safePath(path);
      const full = join(directory, path);
      if (
        !lstatSync(full).isFile() ||
        !realpathSync(full).startsWith(realpathSync(directory) + sep)
      ) {
        throw new Error('package file escapes directory');
      }
      const bytes = readFileSync(full);
      return { path, size: bytes.length, sha256: sha256(bytes) };
    })
    .sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const paths = new Set(files.map((f) => f.path));
  for (const path of [
    'package.json',
    'config.json',
    'index.html',
    ...config.screenshots,
    ...(config.logo ? [config.logo] : []),
  ]) {
    if (!paths.has(path)) {
      throw new Error(`missing published file: ${path}`);
    }
  }
  for (const path of [...config.screenshots, ...(config.logo ? [config.logo] : [])]) {
    const bytes = readFileSync(join(directory, path));
    const valid =
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
      bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255])) ||
      (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
    if (!valid || bytes.length > 5 * 1024 * 1024) {
      throw new Error(`invalid raster media: ${path}`);
    }
  }
  validateResources(directory, config, files);
  // Retain only fields consumed by the shared package type; hash the full original file.
  const packageInfo = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    author: normalizePerson(pkg.author),
    repository: normalizeRepository(pkg.repository),
    license: pkg.license ?? null,
    files: pkg.files ?? [],
  };
  return { package: packageInfo, config, files };
}
function normalizePerson(value) {
  return typeof value === 'object' && value
    ? { name: value.name, email: value.email ?? null, url: value.url ?? null }
    : (value ?? null);
}
function normalizeRepository(value) {
  return typeof value === 'object' && value
    ? { type: value.type, url: value.url, directory: value.directory ?? null }
    : (value ?? null);
}
/** Accept real calendar dates written as UTC RFC3339 timestamps. */
export function isPublicationTime(value) {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 19) === value.slice(0, 19)
  );
}

/** Preserve first inclusion dates across package releases; new names require an explicit date. */
export function withPublicationTimes(entries, previous, supplied) {
  const names = new Set(entries.map((entry) => entry.package.name));
  for (const name of supplied.keys()) {
    if (!names.has(name)) {
      throw new Error(`publishedAt: unknown package ${name}`);
    }
  }
  return entries.map((entry) => {
    const name = entry.package.name;
    const existing = previous.find((item) => item.package.name === name)?.publishedAt;
    if (existing !== undefined && supplied.has(name) && supplied.get(name) !== existing) {
      throw new Error(`${name}: publishedAt cannot change`);
    }
    const publishedAt = existing === undefined ? supplied.get(name) : existing;
    if (!isPublicationTime(publishedAt)) {
      throw new Error(`${name}: publishedAt requires an explicit UTC RFC3339 timestamp`);
    }
    return { ...entry, publishedAt };
  });
}

/** Build and validate the catalogue, retaining dates from the checked-in registry. */
export function registry(publishedAt = new Map()) {
  const widgets = readdirSync(join(root, 'packages'), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .map((e) => inspect(join(root, 'packages', e.name)));
  const ids = new Set(),
    names = new Set();
  for (const e of widgets) {
    if (ids.has(e.config.id) || names.has(e.package.name)) {
      throw new Error('duplicate widget identity');
    }
    ids.add(e.config.id);
    names.add(e.package.name);
  }
  const previous = json(join(root, 'registry.json'));
  const value = { widgets: withPublicationTimes(widgets, previous.widgets, publishedAt) };
  validateSchema('registry', value);
  return value;
}

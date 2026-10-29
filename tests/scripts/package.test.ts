import assert from 'node:assert/strict';
import {
  cpSync,
  mkdtempSync,
  rmSync,
  readFileSync,
  writeFileSync,
  existsSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { expect, test, type TestContext } from 'vite-plus/test';

import {
  root,
  inspect,
  packedEntry,
  withPublicationTimes,
  validateSchema,
} from '../../scripts/package.mjs';
function fixture(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), 'aidget-package-'));
  cpSync(join(root, 'packages/welcome'), dir, { recursive: true });
  t.onTestFinished(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}
test('npm pack JSON supports array and keyed object outputs', () => {
  const entry = { files: [{ path: 'index.html' }], unpackedSize: 1 };
  assert.deepEqual(packedEntry(JSON.stringify([entry])), entry);
  assert.deepEqual(packedEntry(JSON.stringify({ '@aidget-community/widget': entry })), entry);
  assert.throws(() => packedEntry('{}'), /invalid npm pack manifest/);
});
test('real screenshots and runtime files appear in the packed manifest', (t) => {
  const dir = fixture(t);
  const entry = inspect(dir);
  expect(entry.files).toContainEqual(
    expect.objectContaining({ path: entry.config.screenshots[0] }),
  );
  assert.equal(entry.package.name, '@aidget-community/welcome');
});
test('missing screenshots fail validation', (t) => {
  const dir = fixture(t);
  rmSync(join(dir, 'assets/screenshot.png'));
  assert.throws(() => inspect(dir), /missing published file/);
});
test('undeclared wildcard origins and script fields are rejected', (t) => {
  const dir = fixture(t);
  const path = join(dir, 'config.json'),
    config = JSON.parse(readFileSync(path, 'utf8'));
  config.network = ['https://*.example.com'];
  writeFileSync(path, JSON.stringify(config));
  assert.throws(() => inspect(dir), /invalid network origin/);
  config.network = [];
  config.allowScripts = true;
  writeFileSync(path, JSON.stringify(config));
  assert.throws(() => inspect(dir), /additional properties/);
});
test('npm prepare scripts never execute during manifest inspection', (t) => {
  const dir = fixture(t);
  const path = join(dir, 'package.json'),
    pkg = JSON.parse(readFileSync(path, 'utf8'));
  pkg.scripts = { prepare: "node -e \"require('fs').writeFileSync('executed','yes')\"" };
  writeFileSync(path, JSON.stringify(pkg));
  assert.throws(() => inspect(dir), /cannot declare lifecycle/);
  assert.equal(existsSync(join(dir, 'executed')), false);
});
test('symlinks fail before npm packing', (t) => {
  const dir = fixture(t);
  symlinkSync('/tmp', join(dir, 'assets/external'));
  assert.throws(() => inspect(dir), /unsupported package entry/);
});
test('missing runtime resources referenced by HTML fail validation', (t) => {
  const dir = fixture(t);
  const path = join(dir, 'index.html');
  writeFileSync(path, readFileSync(path, 'utf8') + '<img src="./assets/missing.png">');
  assert.throws(() => inspect(dir), /missing runtime resource/);
});
test('missing CSS resources and undeclared origins fail validation', (t) => {
  const dir = fixture(t),
    path = join(dir, 'style.css'),
    original = readFileSync(path, 'utf8');
  writeFileSync(path, original + '\n.bad {background:url(./assets/missing.png)}');
  assert.throws(() => inspect(dir), /missing runtime resource/);
  writeFileSync(path, original + '\n.bad {background:url(https://unexpected.example/a.png)}');
  assert.throws(() => inspect(dir), /undeclared network resource/);
});
test('nested frames and scripts without the script grant fail validation', (t) => {
  const dir = fixture(t),
    path = join(dir, 'index.html'),
    original = readFileSync(path, 'utf8');
  writeFileSync(path, original + '<iframe src="https://example.com"></iframe>');
  assert.throws(() => inspect(dir), /unsupported widget element/);
  writeFileSync(path, original + '<script>window.ran=true</script>');
  assert.throws(() => inspect(dir), /script permission/);
});

test('registry publication times survive version updates and new entries require an explicit time', () => {
  const previous = [
    {
      package: { name: '@aidget-community/note', version: '1.0.0' },
      publishedAt: '2026-10-25T06:49:57Z',
    },
  ];
  const entries = [{ package: { name: '@aidget-community/note', version: '1.0.1' } }];
  expect(withPublicationTimes(entries, previous, new Map())[0].publishedAt).toBe(
    previous[0].publishedAt,
  );
  expect(entries[0]).not.toHaveProperty('publishedAt');
  const fresh = [{ package: { name: '@aidget-community/new', version: '0.1.0' } }];
  expect(() => withPublicationTimes(fresh, [], new Map())).toThrow(/publishedAt/);
  expect(
    withPublicationTimes(fresh, [], new Map([['@aidget-community/new', '2026-10-28T00:00:00Z']]))[0]
      .publishedAt,
  ).toBe('2026-10-28T00:00:00Z');
  expect(() =>
    withPublicationTimes(
      entries,
      previous,
      new Map([['@aidget-community/note', '2026-10-28T00:00:00Z']]),
    ),
  ).toThrow(/cannot change/);
  expect(() =>
    withPublicationTimes(
      entries,
      previous,
      new Map([['@aidget-community/typo', '2026-10-28T00:00:00Z']]),
    ),
  ).toThrow(/unknown package/);
});

test('registry timestamps reject absent, malformed, non-UTC and impossible dates', () => {
  const entries = [{ package: { name: '@aidget-community/new' } }];
  for (const value of [
    undefined,
    'yesterday',
    '2026-02-30T00:00:00Z',
    '2026-10-28T08:00:00+08:00',
  ]) {
    expect(() =>
      withPublicationTimes(entries, [], new Map([['@aidget-community/new', value]])),
    ).toThrow(/publishedAt/);
  }
});

test('registry schema allows discovery extensions but still checks known fields and config', () => {
  const value = JSON.parse(readFileSync(join(root, 'registry.json'), 'utf8'));
  value.future = true;
  value.widgets[0].future = true;
  value.widgets[0].files[0].future = true;
  expect(() => validateSchema('registry', value)).not.toThrow();
  value.widgets[0].files[0].size = 'large';
  expect(() => validateSchema('registry', value)).toThrow();
  value.widgets[0].files[0].size = 1;
  value.widgets[0].config.future = true;
  expect(() => validateSchema('registry', value)).toThrow();
});

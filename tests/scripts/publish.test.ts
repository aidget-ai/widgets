import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { beforeEach, test, vi, type TestContext } from 'vite-plus/test';

import { integrity } from '../../scripts/package.mjs';
import { publish, registryVersion } from '../../scripts/publish.mjs';
vi.mock('node:child_process', () => ({ execFileSync: vi.fn() }));
beforeEach(() => vi.mocked(execFileSync).mockReset());

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), 'aidget-publish-'));
  t.onTestFinished(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(join(root, 'tgz'));
  const bytes = Buffer.from('tarball');
  writeFileSync(join(root, 'tgz/widget.tgz'), bytes);
  const sri = integrity(bytes);
  writeFileSync(
    join(root, 'index.json'),
    JSON.stringify({
      packages: {
        '@aidget-community/widget': {
          latest: '1.0.0',
          versions: { '1.0.0': { file: 'tgz/widget.tgz', integrity: sri } },
        },
      },
    }),
  );
  return { root, sri };
}
test('first publication without credentials remains available from the reviewed Git commit', async (t) => {
  const { root } = fixture(t);
  const run = execFileSync;
  const summary = await publish(root, {
    lookup: async () => null,
    run,
    env: {},
  });
  assert.equal(vi.mocked(run).mock.calls.length, 0);
  assert.match(summary[0], /available from the reviewed Git commit/);
});
test('an identical npm version is skipped', async (t) => {
  const { root, sri } = fixture(t);
  const run = execFileSync;
  await publish(root, {
    lookup: async () => ({ dist: { integrity: sri } }),
    run,
    env: {},
  });
  assert.equal(vi.mocked(run).mock.calls.length, 0);
});
test('a conflicting existing npm version is an error', async (t) => {
  const { root } = fixture(t);
  await assert.rejects(
    publish(root, { lookup: async () => ({ dist: { integrity: 'different' } }), env: {} }),
    /differs/,
  );
});
test('publication uses the packed artifact and suppresses lifecycle scripts', async (t) => {
  const { root } = fixture(t);
  const run = execFileSync;
  await publish(root, {
    lookup: async (_name, version) => (version ? null : { name: 'exists' }),
    run,
    env: {},
  });
  assert.equal(vi.mocked(run).mock.calls.length, 1);
  assert.equal(vi.mocked(run).mock.calls[0][0], 'npm');
  assert.deepEqual(vi.mocked(run).mock.calls[0][1], [
    'publish',
    join(root, 'tgz/widget.tgz'),
    '--access',
    'public',
    '--ignore-scripts',
    '--registry',
    'https://registry.npmjs.org',
  ]);
});
test('existing-package publish errors fail the task', async (t) => {
  const { root } = fixture(t);
  await assert.rejects(
    publish(root, {
      lookup: async (_name, version) => (version ? null : {}),
      run: () => {
        throw new Error('OIDC denied');
      },
      env: {},
    }),
    /OIDC denied/,
  );
});
test('registry transport errors are not mistaken for unpublished packages', async () => {
  await assert.rejects(
    registryVersion('x', '1.0.0', async () => new Response(null, { status: 503 })),
    /503/,
  );
  assert.equal(
    await registryVersion('x', '1.0.0', async () => new Response(null, { status: 404 })),
    null,
  );
});

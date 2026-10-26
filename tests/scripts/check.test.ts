import assert from 'node:assert/strict';

import { test } from 'vite-plus/test';

import { assertImmutableVersions } from '../../scripts/check.mjs';

const registry = (version: string, digest = 'first') => ({
  widgets: [
    {
      package: { name: '@aidget-community/note', version },
      files: [{ path: 'index.html', sha256: digest }],
    },
  ],
});

test('an unchanged version is repeatable and new versions are allowed', () => {
  assert.doesNotThrow(() => assertImmutableVersions(registry('1.0.0'), [registry('1.0.0')]));
  assert.doesNotThrow(() =>
    assertImmutableVersions(registry('1.0.1', 'second'), [registry('1.0.0')]),
  );
});

test('changing a previously reviewed version fails', () => {
  assert.throws(
    () => assertImmutableVersions(registry('1.0.0', 'changed'), [registry('1.0.0')]),
    /immutable/,
  );
});

test('delisted historical versions cannot be reused with different bytes', () => {
  assert.throws(
    () =>
      assertImmutableVersions(registry('1.0.0', 'changed'), [
        { widgets: [] },
        registry('1.0.1', 'second'),
        registry('1.0.0'),
      ]),
    /immutable/,
  );
});

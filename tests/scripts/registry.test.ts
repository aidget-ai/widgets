import { expect, test } from 'vite-plus/test';

import { publicationArguments } from '../../scripts/registry.mjs';

test('parses explicit first publication times for multiple new packages', () => {
  expect(
    publicationArguments([
      '--published-at',
      '@aidget-community/clock=2026-10-28T00:00:00Z',
      '--published-at',
      '@aidget-community/note=2026-10-28T01:00:00Z',
    ]),
  ).toEqual(
    new Map([
      ['@aidget-community/clock', '2026-10-28T00:00:00Z'],
      ['@aidget-community/note', '2026-10-28T01:00:00Z'],
    ]),
  );
  expect(publicationArguments([]).size).toBe(0);
});

test('rejects malformed, duplicate and unknown CLI options', () => {
  for (const args of [
    ['--published-at', 'missing-separator'],
    ['--published-at', '=2026-10-28T00:00:00Z'],
    ['--published-at'],
    ['--unknown'],
    [
      '--published-at',
      'clock=2026-10-28T00:00:00Z',
      '--published-at',
      'clock=2026-10-29T00:00:00Z',
    ],
  ]) {
    expect(() => publicationArguments(args)).toThrow();
  }
});

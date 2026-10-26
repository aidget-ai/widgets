import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { test, type TestContext } from 'vite-plus/test';

import { validateResources } from '../../scripts/resources.mjs';
function fixture(t: TestContext, html: string, css = '') {
  const directory = mkdtempSync(join(tmpdir(), 'aidget-resources-'));
  t.onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
  mkdirSync(join(directory, 'assets'));
  const values = {
    'index.html': html,
    'style.css': css,
    'assets/pic.png': 'image',
    'assets/more.css': '.nested{background:url(./pic.png)}',
    'assets/app.js': 'document.body.dataset.ready = "yes";',
  };
  for (const [file, value] of Object.entries(values)) {
    writeFileSync(join(directory, file), value);
  }
  return {
    directory,
    files: Object.keys(values).map((path) => ({ path })),
    config: { id: 'sample', permissions: [], network: [] },
  };
}
test('CSS imports and nested relative asset paths resolve against their own file', (t) => {
  const f = fixture(
    t,
    '<link rel="stylesheet" href="./style.css">',
    '@import "./assets/more.css";',
  );
  validateResources(f.directory, f.config, f.files);
});
test('srcset data URIs and local candidates remain valid', (t) => {
  const f = fixture(t, '<img srcset="data:image/png;base64,AAAA 1x, ./assets/pic.png 2x">');
  validateResources(f.directory, f.config, f.files);
});
test('only explicitly declared external resource origins pass', (t) => {
  const f = fixture(t, '<img src="https://images.example.com/image.png">');
  assert.throws(() => validateResources(f.directory, f.config, f.files), /undeclared network/);
  validateResources(f.directory, { ...f.config, network: ['https://images.example.com'] }, f.files);
});
test('relative paths cannot escape the widget directory', (t) => {
  const f = fixture(t, '<img src="../other/pic.png">');
  assert.throws(() => validateResources(f.directory, f.config, f.files), /escapes widget/);
});
test('a dummy URL used for resolution cannot be mistaken for a local resource', (t) => {
  const f = fixture(t, '<img src="https://widget.invalid/content/sample/assets/pic.png">');
  assert.throws(() => validateResources(f.directory, f.config, f.files), /undeclared network/);
});

test('declaring a network origin never authorizes remote script resources', (t) => {
  for (const html of [
    '<script src="https://cdn.example.com/app.js"></script>',
    '<script src="//cdn.example.com/app.js"></script>',
    '<script src="data:text/javascript,alert(1)"></script>',
    '<script src="blob:https://cdn.example.com/id"></script>',
    '<link rel="modulepreload" href="https://cdn.example.com/app.js">',
    '<link rel="MODULEPRELOAD" href="https://cdn.example.com/app.js">',
    '<link rel="preload" as="script" href="https://cdn.example.com/app.js">',
  ]) {
    const f = fixture(t, html);
    assert.throws(
      () =>
        validateResources(
          f.directory,
          {
            ...f.config,
            permissions: ['script'],
            network: ['https://cdn.example.com'],
          },
          f.files,
        ),
      /script resources must be local/,
    );
  }
});

test('inline handlers and JavaScript URLs are refused even with script permission', (t) => {
  for (const html of [
    '<button onclick="alert(1)">Click</button>',
    '<svg onload="alert(1)"></svg>',
    '<a href="java&#x73;cript:alert(1)">Click</a>',
    '<a href="java&#10;script:alert(1)">Click</a>',
    '<form action="JAVASCRIPT:alert(1)"></form>',
  ]) {
    const f = fixture(t, html);
    assert.throws(
      () =>
        validateResources(
          f.directory,
          {
            ...f.config,
            permissions: ['script'],
          },
          f.files,
        ),
      /inline handlers|JavaScript URLs/,
    );
  }
});

test('packaged scripts, inline script blocks and local module preloads remain valid', (t) => {
  const f = fixture(
    t,
    '<script src="assets/app.js"></script><script>window.answer = 42;</script><link rel="modulepreload" href="assets/app.js">',
  );
  validateResources(f.directory, { ...f.config, permissions: ['script'] }, f.files);
});

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { parse, type DefaultTreeAdapterMap } from 'parse5';
import { test, type TestContext } from 'vite-plus/test';

import { buildSite, sortEntries } from '../../scripts/site.mjs';

function digest(bytes: Buffer | string) {
  return createHash('sha256').update(bytes).digest('hex');
}

function entry(
  id: string,
  publishedAt: string,
  options: { description?: string; logo?: boolean } = {},
) {
  const files = [{ path: 'assets/screenshot.png', size: 10, sha256: digest(`${id}-screenshot`) }];
  const config = {
    id,
    title: `${id} <Widget>`,
    logo: options.logo ? 'assets/logo.png' : null,
    screenshots: ['assets/screenshot.png'],
    platforms: ['macos', 'windows'],
    size: { width: 360, height: 220 },
    dragMode: 'all',
    permissions: [],
    network: [],
  };
  if (options.logo) {
    files.push({ path: 'assets/logo.png', size: 8, sha256: digest(`${id}-logo`) });
  }
  return {
    publishedAt,
    package: {
      name: `@aidget-community/${id}`,
      version: '1.0.0',
      description: options.description ?? `${id} description`,
      author: { name: 'Community author', email: null, url: null },
      repository: null,
      license: 'MIT',
      files: ['assets'],
    },
    config,
    files,
  };
}

function fixture(t: TestContext) {
  const directory = mkdtempSync(join(tmpdir(), 'aidget-site-'));
  t.onTestFinished(() => rmSync(directory, { recursive: true, force: true }));
  const siteRoot = join(directory, 'site');
  const packagesRoot = join(directory, 'packages');
  mkdirSync(join(siteRoot, 'assets'), { recursive: true });
  mkdirSync(packagesRoot, { recursive: true });
  for (const [path, value] of Object.entries({
    'styles.css': '/* site */',
    'assets/aidget-icon.png': 'icon',
    'assets/product-preview-placeholder.svg': '<svg></svg>',
  })) {
    writeFileSync(join(siteRoot, path), value);
  }

  const widgets = [
    entry('alpha', '2026-10-28T00:00:00Z', {
      description: 'Alpha & <script>alert("unsafe")</script>',
    }),
    entry('beta', '2026-10-30T00:00:00Z', { logo: true }),
  ];
  for (const item of widgets) {
    const id = item.config.id;
    mkdirSync(join(packagesRoot, id, 'assets'), { recursive: true });
    writeFileSync(join(packagesRoot, id, 'assets/screenshot.png'), `${id}-screenshot`);
    if (item.config.logo) {
      writeFileSync(join(packagesRoot, id, 'assets/logo.png'), `${id}-logo`);
    }
  }
  const registryPath = join(directory, 'registry.json');
  writeFileSync(registryPath, JSON.stringify({ widgets }, null, 2));
  return { directory, siteRoot, packagesRoot, registryPath, output: join(directory, 'out') };
}

function descendants(
  node: DefaultTreeAdapterMap['node'],
  matches: (candidate: DefaultTreeAdapterMap['element']) => boolean,
) {
  const found: DefaultTreeAdapterMap['element'][] = [];
  if ('tagName' in node && matches(node)) {
    found.push(node);
  }
  if ('childNodes' in node) {
    for (const child of node.childNodes) {
      found.push(...descendants(child, matches));
    }
  }
  return found;
}

function attribute(element: DefaultTreeAdapterMap['element'], name: string) {
  return element.attrs.find((candidate) => candidate.name === name)?.value;
}

function textContent(node: DefaultTreeAdapterMap['node']): string {
  if ('value' in node) {
    return node.value;
  }
  return 'childNodes' in node ? node.childNodes.map(textContent).join('') : '';
}

test('builds sorted bilingual pages with validated local media and release links', (t) => {
  const f = fixture(t);
  const widgets = buildSite({
    output: f.output,
    repositoryRoot: f.directory,
    registryPath: f.registryPath,
    siteRoot: f.siteRoot,
  });
  assert.deepEqual(
    widgets.map((item) => item.config.id),
    ['beta', 'alpha'],
  );

  const chinese = parse(readFileSync(join(f.output, 'index.html'), 'utf8'));
  const english = parse(readFileSync(join(f.output, 'en/index.html'), 'utf8'));
  const chineseHtml = descendants(chinese, (element) => element.tagName === 'html').at(0);
  const englishHtml = descendants(english, (element) => element.tagName === 'html').at(0);
  assert.equal(chineseHtml && attribute(chineseHtml, 'lang'), 'zh-CN');
  assert.equal(englishHtml && attribute(englishHtml, 'lang'), 'en');

  const cards = descendants(chinese, (element) => element.tagName === 'article');
  assert.deepEqual(
    cards.map((card) => attribute(card, 'data-package')),
    ['@aidget-community/beta', '@aidget-community/alpha'],
  );
  const links = descendants(chinese, (element) => element.tagName === 'a');
  const installs = links.filter((link) => attribute(link, 'class') === 'install-link');
  assert.equal(installs.length, 2);
  assert.ok(
    installs.every(
      (link) => attribute(link, 'href') === 'https://github.com/aidget-ai/aidget/releases',
    ),
  );
  assert.ok(links.some((link) => attribute(link, 'aria-label') === '打开 Aidget 主仓库'));
  assert.equal(descendants(chinese, (element) => element.tagName === 'script').length, 0);
  assert.equal(
    descendants(chinese, (element) => attribute(element, 'class') === 'browse-nav').length,
    0,
  );
  assert.equal(
    descendants(chinese, (element) => attribute(element, 'class') === 'widget-count').length,
    0,
  );
  for (const className of ['card-meta', 'platform-list']) {
    assert.equal(
      descendants(chinese, (element) => attribute(element, 'class') === className).length,
      0,
    );
  }
  assert.ok(
    descendants(chinese, (element) => attribute(element, 'class') === 'verified').every(
      (element) => textContent(element).trim() === 'aidget 社区',
    ),
  );

  const footer = descendants(chinese, (element) => element.tagName === 'footer').at(0);
  assert.ok(footer);
  const footerLinks = descendants(footer, (element) => element.tagName === 'a');
  assert.deepEqual(
    footerLinks.map((link) => textContent(link).trim()),
    ['Aidget 社区', '前往 GitHub 开源仓库'],
  );
  const introduction = descendants(
    chinese,
    (element) => attribute(element, 'id') === 'catalog-title',
  ).at(0)?.parentNode;
  assert.ok(introduction && 'childNodes' in introduction);
  assert.ok(
    introduction.childNodes.some(
      (node) =>
        'tagName' in node &&
        node.tagName === 'p' &&
        textContent(node).trim() === '由 Aidget 社区贡献者发布和维护的桌面小组件',
    ),
  );

  const images = descendants(chinese, (element) => element.tagName === 'img');
  assert.ok(images.some((image) => attribute(image, 'fetchpriority') === 'high'));
  assert.ok(
    images.some(
      (image) =>
        attribute(image, 'src') === 'media/beta/assets/screenshot.png' &&
        attribute(image, 'loading') === 'lazy',
    ),
  );
  const englishImages = descendants(english, (element) => element.tagName === 'img');
  assert.ok(
    englishImages.some(
      (image) => attribute(image, 'src') === '../media/beta/assets/screenshot.png',
    ),
  );
  assert.match(readFileSync(join(f.output, 'styles.css'), 'utf8'), /site/);
  assert.equal(
    readFileSync(join(f.output, 'media/alpha/assets/screenshot.png'), 'utf8'),
    'alpha-screenshot',
  );
  assert.equal(readFileSync(join(f.output, 'media/beta/assets/logo.png'), 'utf8'), 'beta-logo');
});

test('rejects media whose bytes do not match the reviewed registry digest', (t) => {
  const f = fixture(t);
  writeFileSync(join(f.packagesRoot, 'alpha/assets/screenshot.png'), 'changed');
  assert.throws(
    () =>
      buildSite({
        output: f.output,
        repositoryRoot: f.directory,
        registryPath: f.registryPath,
        siteRoot: f.siteRoot,
      }),
    /digest mismatch/,
  );
});

test('rejects entries without a screenshot', (t) => {
  const f = fixture(t);
  const registry = JSON.parse(readFileSync(f.registryPath, 'utf8'));
  registry.widgets[0].config.screenshots = [];
  writeFileSync(f.registryPath, JSON.stringify(registry));
  assert.throws(
    () =>
      buildSite({
        output: f.output,
        repositoryRoot: f.directory,
        registryPath: f.registryPath,
        siteRoot: f.siteRoot,
      }),
    /requires a screenshot/,
  );
});

test('sorts equal publication times by package name', () => {
  const widgets = [entry('zeta', '2026-10-29T00:00:00Z'), entry('alpha', '2026-10-29T00:00:00Z')];
  assert.deepEqual(
    sortEntries(widgets).map((item) => item.config.id),
    ['alpha', 'zeta'],
  );
});

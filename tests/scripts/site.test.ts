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
    'assets/carousel.js': '// carousel',
    'assets/product-preview.webp': 'preview',
    'assets/product-window.webp': 'window',
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

  for (const [document, expected] of [
    [
      chinese,
      {
        brand: 'Aidget - AI Widget',
        heroLead: '把桌面',
        heroAccent: '交给 AI Agent',
        description: '说出你的桌面创意，让 Agent 为你实现。',
        carouselLabel: 'Aidget 产品截图',
        slides: [
          { src: 'assets/site/product-preview.webp', alt: 'Aidget 桌面组件效果' },
          { src: 'assets/site/product-window.webp', alt: 'Aidget 主界面' },
        ],
      },
    ],
    [
      english,
      {
        brand: 'Aidget - AI Widget',
        heroLead: 'Manage desktop widgets,',
        heroAccent: 'the AI Agent way.',
        description: 'Describe your desktop idea and let your Agent make it real.',
        carouselLabel: 'Aidget product screenshots',
        slides: [
          { src: '../assets/site/product-preview.webp', alt: 'Aidget widgets on the desktop' },
          { src: '../assets/site/product-window.webp', alt: 'Aidget main window' },
        ],
      },
    ],
  ] as const) {
    const brand = descendants(
      document,
      (element) => element.tagName === 'a' && attribute(element, 'class') === 'brand',
    ).at(0);
    assert.ok(brand);
    assert.equal(attribute(brand, 'aria-label'), expected.brand);
    assert.equal(textContent(brand).trim(), expected.brand);

    const title = descendants(
      document,
      (element) => element.tagName === 'h1' && attribute(element, 'id') === 'hero-title',
    ).at(0);
    assert.ok(title);
    const titleLead = 'childNodes' in title ? title.childNodes[0] : undefined;
    assert.equal(titleLead && textContent(titleLead), expected.heroLead);
    const titleAccent = descendants(title, (element) => element.tagName === 'span').at(0);
    assert.ok(titleAccent);
    assert.equal(textContent(titleAccent), expected.heroAccent);

    const titleContainer = title.parentNode;
    assert.ok(titleContainer);
    const heroDescription = descendants(titleContainer, (element) => element.tagName === 'p').at(0);
    assert.ok(heroDescription);
    assert.equal(textContent(heroDescription), expected.description);

    const pageDescription = descendants(
      document,
      (element) => element.tagName === 'meta' && attribute(element, 'name') === 'description',
    ).at(0);
    assert.ok(pageDescription);
    assert.equal(attribute(pageDescription, 'content'), expected.description);

    const productPreview = descendants(
      document,
      (element) =>
        element.tagName === 'figure' && attribute(element, 'class') === 'product-preview',
    ).at(0);
    assert.ok(productPreview);
    const carousel = descendants(
      productPreview,
      (element) => attribute(element, 'data-carousel') !== undefined,
    ).at(0);
    assert.ok(carousel);
    assert.equal(attribute(carousel, 'role'), 'group');
    assert.equal(attribute(carousel, 'aria-roledescription'), 'carousel');
    assert.equal(attribute(carousel, 'aria-label'), expected.carouselLabel);
    const slides = descendants(
      carousel,
      (element) => attribute(element, 'data-carousel-slide') !== undefined,
    );
    assert.equal(slides.length, 2);
    assert.equal(attribute(slides[0], 'class'), 'preview-slide is-active');
    assert.equal(attribute(slides[0], 'aria-hidden'), 'false');
    assert.equal(attribute(slides[1], 'aria-hidden'), 'true');
    assert.ok(
      slides.every(
        (slide) =>
          attribute(slide, 'role') === 'group' &&
          attribute(slide, 'aria-roledescription') === 'slide',
      ),
    );
    for (const [index, slide] of slides.entries()) {
      const image = descendants(slide, (element) => element.tagName === 'img').at(0);
      assert.ok(image);
      assert.equal(attribute(image, 'src'), expected.slides[index]?.src);
      assert.equal(attribute(image, 'alt'), expected.slides[index]?.alt);
      assert.equal(attribute(image, 'width'), '2000');
      assert.equal(attribute(image, 'height'), '1265');
    }
    const dots = descendants(
      carousel,
      (element) => attribute(element, 'data-carousel-dot') !== undefined,
    );
    assert.equal(dots.length, 2);
    assert.equal(attribute(dots[0], 'aria-current'), 'true');
    assert.equal(attribute(dots[1], 'aria-current'), 'false');
    for (const name of [
      'data-carousel-count',
      'data-carousel-next',
      'data-carousel-previous',
      'data-carousel-toggle',
    ]) {
      assert.equal(
        descendants(productPreview, (element) => attribute(element, name) !== undefined).length,
        0,
      );
    }
    assert.equal(
      descendants(productPreview, (element) => element.tagName === 'figcaption').length,
      0,
    );
  }

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
  const scripts = descendants(chinese, (element) => element.tagName === 'script');
  assert.equal(scripts.length, 1);
  assert.equal(attribute(scripts[0], 'src'), 'assets/site/carousel.js');
  assert.equal(attribute(scripts[0], 'defer'), '');
  const englishScripts = descendants(english, (element) => element.tagName === 'script');
  assert.equal(englishScripts.length, 1);
  assert.equal(attribute(englishScripts[0], 'src'), '../assets/site/carousel.js');
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
  assert.equal(readFileSync(join(f.output, 'assets/site/aidget-icon.png'), 'utf8'), 'icon');
  assert.equal(readFileSync(join(f.output, 'assets/site/carousel.js'), 'utf8'), '// carousel');
  assert.equal(readFileSync(join(f.output, 'assets/site/product-preview.webp'), 'utf8'), 'preview');
  assert.equal(readFileSync(join(f.output, 'assets/site/product-window.webp'), 'utf8'), 'window');
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

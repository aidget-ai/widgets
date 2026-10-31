import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { json, root, safePath, sha256, validateSchema } from './package.mjs';

const MAIN_REPOSITORY = 'https://github.com/aidget-ai/aidget';
const RELEASES = `${MAIN_REPOSITORY}/releases`;
const PUBLIC_SITE = 'https://aidget-ai.github.io/widgets/';
const SITE_NAME = 'Aidget - AI Widget';

const copy = {
  zh: {
    lang: 'zh-CN',
    pageTitle: 'Aidget 社区组件',
    pageDescription: '说出你的桌面创意，让 Agent 为你实现。',
    skipContent: '跳到主要内容',
    navigation: '主导航',
    switchLanguage: 'Switch to English',
    switchLanguageLabel: 'EN',
    mainRepository: '打开 Aidget 主仓库',
    titleLead: '把桌面',
    titleAccent: '交给 AI Agent',
    introduction: '说出你的桌面创意，让 Agent 为你实现。',
    download: '下载 Aidget',
    browse: '浏览社区组件',
    previewAlt: 'Aidget 产品截图占位',
    previewCaption: '产品截图位置已预留，之后可直接替换为真实桌面效果。',
    placeholder: '占位图',
    catalogTitle: '社区组件',
    catalogIntroduction: '由 Aidget 社区贡献者发布和维护的桌面小组件',
    verified: 'aidget 社区',
    install: '安装',
    installLabel: (title) => `安装 ${title}：前往 GitHub Releases`,
    footer: 'Aidget 社区',
    footerRepository: '前往 GitHub 开源仓库',
  },
  en: {
    lang: 'en',
    pageTitle: 'Aidget Community Widgets',
    pageDescription: 'Describe your desktop idea and let your Agent make it real.',
    skipContent: 'Skip to content',
    navigation: 'Main navigation',
    switchLanguage: '切换到简体中文',
    switchLanguageLabel: '中文',
    mainRepository: 'Open the Aidget main repository',
    titleLead: 'Manage desktop widgets,',
    titleAccent: 'the AI Agent way.',
    introduction: 'Describe your desktop idea and let your Agent make it real.',
    download: 'Download Aidget',
    browse: 'Browse widgets',
    previewAlt: 'Aidget product screenshot placeholder',
    previewCaption:
      'The product screenshot area is ready to be replaced with a real desktop capture.',
    placeholder: 'Placeholder',
    catalogTitle: 'Community widgets',
    catalogIntroduction:
      'Desktop widgets published and maintained by Aidget community contributors.',
    verified: 'aidget community',
    install: 'Install',
    installLabel: (title) => `Install ${title} from GitHub Releases`,
    footer: 'Aidget Community',
    footerRepository: 'Visit the GitHub open-source repository',
  },
};

/** Escape untrusted catalogue text before placing it in generated HTML. */
export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Keep newest reviewed entries first, with a deterministic package-name tie break. */
export function sortEntries(widgets) {
  return [...widgets].sort(
    (left, right) =>
      Date.parse(right.publishedAt) - Date.parse(left.publishedAt) ||
      left.package.name.localeCompare(right.package.name, 'en'),
  );
}

function icon(name, className = '') {
  if (name === 'grid') {
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"></rect><rect x="14" y="3" width="7" height="7" rx="2"></rect><rect x="3" y="14" width="7" height="7" rx="2"></rect><rect x="14" y="14" width="7" height="7" rx="2"></rect></svg>`;
  }
  if (name === 'shield') {
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 20 6v5c0 4.8-3.2 8.1-8 10-4.8-1.9-8-5.2-8-10V6l8-3Z"></path><path d="m8.7 12 2.1 2.1 4.6-4.6"></path></svg>`;
  }
  if (name === 'github') {
    return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" stroke="none" d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.2c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.9 10.9 0 0 1 5.76 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z"></path></svg>`;
  }
  if (name === 'arrow') {
    return `<svg class="${className}" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h12M11 5l5 5-5 5"></path></svg>`;
  }
  throw new Error(`Unknown icon: ${name}`);
}

function renderLogo(widget, prefix) {
  if (widget.logoPath) {
    return `<div class="widget-logo"><img src="${escapeHtml(`${prefix}${widget.logoPath}`)}" alt="" width="32" height="32"></div>`;
  }
  return `<div class="widget-logo widget-logo-default">${icon('grid')}</div>`;
}

function renderWidget(widget, locale, prefix) {
  const text = copy[locale];
  const title = widget.config.title;
  return `<article class="widget-card" data-package="${escapeHtml(widget.package.name)}">
  <div class="card-heading">
    ${renderLogo(widget, prefix)}
    <div class="widget-identity">
      <h3>${escapeHtml(title)}</h3>
      <span class="verified">${icon('shield')}${text.verified}</span>
    </div>
    <a class="install-link" href="${RELEASES}" aria-label="${escapeHtml(text.installLabel(title))}">${text.install}</a>
  </div>
  <div class="preview-stage">
    <img src="${escapeHtml(`${prefix}${widget.screenshotPath}`)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async">
  </div>
  <p class="widget-description">${escapeHtml(widget.package.description ?? '')}</p>
</article>`;
}

function renderPage(locale, widgets) {
  const text = copy[locale];
  const prefix = locale === 'en' ? '../' : '';
  const home = locale === 'en' ? '../' : './';
  const languageHref = locale === 'en' ? '../' : 'en/';
  const canonical = locale === 'en' ? `${PUBLIC_SITE}en/` : PUBLIC_SITE;
  const preview = `${prefix}assets/site/product-preview-placeholder.svg`;
  const brandIcon = `${prefix}assets/site/aidget-icon.png`;
  const pageClass = locale === 'en' ? 'lang-en' : 'lang-zh';

  return `<!doctype html>
<html lang="${text.lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${text.pageTitle}</title>
  <meta name="description" content="${escapeHtml(text.pageDescription)}">
  <meta name="theme-color" content="#f4f4f6" media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="#1c1c20" media="(prefers-color-scheme: dark)">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" hreflang="${locale === 'en' ? 'zh-CN' : 'en'}" href="${locale === 'en' ? '../' : 'en/'}">
  <link rel="icon" href="${brandIcon}" type="image/png">
  <link rel="stylesheet" href="${prefix}styles.css">
</head>
<body class="${pageClass}">
  <a class="skip-link" href="#main">${text.skipContent}</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="${home}" aria-label="${SITE_NAME}">
        <img src="${brandIcon}" alt="" width="34" height="34">
        <span>${SITE_NAME}</span>
      </a>
      <nav aria-label="${text.navigation}">
        <a class="language-link" href="${languageHref}" hreflang="${locale === 'en' ? 'zh-CN' : 'en'}" aria-label="${text.switchLanguage}">${text.switchLanguageLabel}</a>
        <a class="github-link" href="${MAIN_REPOSITORY}" aria-label="${text.mainRepository}" title="${text.mainRepository}">${icon('github')}</a>
      </nav>
    </div>
  </header>
  <main id="main">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <h1 id="hero-title">${text.titleLead}<br><span>${text.titleAccent}</span></h1>
        <p>${text.introduction}</p>
        <div class="hero-actions">
          <a class="primary-action" href="${RELEASES}">${text.download}${icon('arrow')}</a>
          <a class="secondary-action" href="#widgets">${text.browse}</a>
        </div>
      </div>
      <figure class="product-preview">
        <div class="preview-window">
          <div class="window-bar" aria-hidden="true"><span></span><span></span><span></span></div>
          <img src="${preview}" alt="${text.previewAlt}" width="1600" height="900" fetchpriority="high" decoding="async">
        </div>
        <figcaption>${text.previewCaption}<span>${text.placeholder}</span></figcaption>
      </figure>
    </section>
    <section class="catalog" id="widgets" aria-labelledby="catalog-title">
      <header class="catalog-heading">
        <div>
          <h2 id="catalog-title">${text.catalogTitle}</h2>
          <p>${text.catalogIntroduction}</p>
        </div>
      </header>
      <div class="widget-grid">
        ${widgets.map((widget) => renderWidget(widget, locale, prefix)).join('\n        ')}
      </div>
    </section>
  </main>
  <footer class="site-footer">
    <a class="footer-brand" href="${home}"><img src="${brandIcon}" alt="" width="24" height="24">${text.footer}</a>
    <a href="${MAIN_REPOSITORY}">${text.footerRepository}${icon('arrow')}</a>
  </footer>
</body>
</html>
`;
}

function copyStaticAsset(siteRoot, output, path) {
  const source = join(siteRoot, path);
  const destination =
    path === 'styles.css'
      ? join(output, 'styles.css')
      : join(output, 'assets/site', path.replace(/^assets\//, ''));
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

function reviewedFile(widget, path, packagesRoot) {
  if (!path) {
    throw new Error(`${widget.package.name}: requires a screenshot`);
  }
  safePath(path);
  const reviewed = widget.files.find((file) => file.path === path);
  if (!reviewed) {
    throw new Error(`${widget.package.name}: ${path} is missing from the digest list`);
  }
  const source = join(packagesRoot, widget.config.id, path);
  const bytes = readFileSync(source);
  if (sha256(bytes) !== reviewed.sha256.toLowerCase()) {
    throw new Error(`${widget.package.name}: ${path} digest mismatch`);
  }
  return source;
}

function copyReviewedFile(widget, path, packagesRoot, output) {
  const source = reviewedFile(widget, path, packagesRoot);
  const destination = join(output, 'media', widget.config.id, path);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  return `media/${widget.config.id}/${path}`;
}

/** Build the complete static portal and return the catalogue in display order. */
export function buildSite({
  output = join(root, '_site'),
  repositoryRoot = root,
  registryPath = join(repositoryRoot, 'registry.json'),
  siteRoot = join(repositoryRoot, 'site'),
} = {}) {
  const destination = resolve(output);
  if ([repositoryRoot, siteRoot].some((path) => resolve(path) === destination)) {
    throw new Error('site output cannot replace its source directory');
  }
  const registry = json(registryPath);
  validateSchema('registry', registry);
  const widgets = sortEntries(registry.widgets).map((widget) => {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(widget.config.id)) {
      throw new Error(`${widget.package.name}: invalid widget id`);
    }
    const screenshot = widget.config.screenshots[0];
    if (!screenshot) {
      throw new Error(`${widget.package.name}: requires a screenshot`);
    }
    reviewedFile(widget, screenshot, join(repositoryRoot, 'packages'));
    if (widget.config.logo) {
      reviewedFile(widget, widget.config.logo, join(repositoryRoot, 'packages'));
    }
    return {
      ...widget,
      screenshotPath: `media/${widget.config.id}/${screenshot}`,
      logoPath: widget.config.logo ? `media/${widget.config.id}/${widget.config.logo}` : null,
    };
  });

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  for (const path of [
    'styles.css',
    'assets/aidget-icon.png',
    'assets/product-preview-placeholder.svg',
  ]) {
    copyStaticAsset(siteRoot, destination, path);
  }
  for (const widget of widgets) {
    for (const path of [
      widget.config.screenshots[0],
      ...(widget.config.logo ? [widget.config.logo] : []),
    ]) {
      copyReviewedFile(widget, path, join(repositoryRoot, 'packages'), destination);
    }
  }
  mkdirSync(join(destination, 'en'), { recursive: true });
  writeFileSync(join(destination, 'index.html'), renderPage('zh', widgets));
  writeFileSync(join(destination, 'en/index.html'), renderPage('en', widgets));
  return widgets;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const widgets = buildSite({ output: resolve(process.argv[2] ?? join(root, '_site')) });
  console.log(
    `Built ${widgets.length} widget preview(s) at ${resolve(process.argv[2] ?? '_site')}`,
  );
}

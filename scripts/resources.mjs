import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseHtml } from 'parse5';
import { parse as parseCss, walk } from 'css-tree';
import parseSrcset from 'parse-srcset';

/** Check static references against published files and declared network origins. */
export function validateResources(directory, config, files) {
  const published = new Set(files.map(file => file.path));
  const anchor = `https://widget.invalid/content/${config.id}/`;
  function reference(value, filename) {
    const text = value.trim();
    if (!text || text.startsWith('#') || /^(data|blob):/i.test(text)) return;
    const url = new URL(text, anchor + filename);
    if (/^[a-z][a-z\d+.-]*:/i.test(text) || text.startsWith('//')) {
      if (url.protocol !== 'https:' || !config.network.includes(url.origin)) throw new Error(`undeclared network resource: ${text}`);
      return;
    }
    if (text.startsWith('/') || !url.href.startsWith(anchor)) throw new Error(`runtime resource escapes widget: ${text}`);
    const path = decodeURIComponent(url.pathname.slice(new URL(anchor).pathname.length));
    if (path.includes('\\') || path.includes('\0') || !(path === 'index.html' || path === 'style.css' || path.startsWith('assets/'))) throw new Error(`runtime resources must be under assets/: ${text}`);
    if (!published.has(path)) throw new Error(`missing runtime resource: ${filename} -> ${text}`);
  }
  function stylesheet(text, filename, context = 'stylesheet') {
    const tree = parseCss(text, { context, parseCustomProperty: true });
    walk(tree, node => {
      if (node.type === 'Url') reference(node.value, filename);
      if (node.type === 'Atrule' && node.name.toLowerCase() === 'import') {
        node.prelude?.children?.forEach(child => { if (child.type === 'String') reference(child.value, filename); });
      }
    });
  }
  function html(node, filename) {
    const tag = node.tagName?.toLowerCase();
    const attrs = new Map((node.attrs ?? []).map(attr => [attr.name, attr.value]));
    if (['iframe', 'object', 'embed', 'base'].includes(tag)) throw new Error(`unsupported widget element: ${tag}`);
    if (tag === 'script' && !['application/json', 'application/ld+json', 'text/plain'].includes(attrs.get('type')) && !config.permissions.includes('script')) throw new Error('widget scripts require the script permission');
    const runtimeTags = ['script', 'img', 'video', 'audio', 'source', 'track', 'input', 'image', 'use', 'feimage'];
    if (runtimeTags.includes(tag)) {
      for (const key of ['src', 'poster', 'href']) if (attrs.has(key)) reference(attrs.get(key), filename);
      if (attrs.has('srcset')) for (const candidate of parseSrcset(attrs.get('srcset'))) reference(candidate.url, filename);
    }
    if (tag === 'link') for (const rel of (attrs.get('rel') ?? '').split(/\s+/)) {
      if (['stylesheet','preload','modulepreload','icon','prefetch','preconnect','dns-prefetch'].includes(rel) && attrs.has('href')) reference(attrs.get('href'), filename);
    }
    if (attrs.has('style')) stylesheet(attrs.get('style'), filename, 'declarationList');
    if (tag === 'style') stylesheet((node.childNodes ?? []).map(child => child.value ?? '').join(''), filename);
    for (const child of node.childNodes ?? []) html(child, filename);
    if (node.content) html(node.content, filename);
  }
  for (const file of files) {
    if (file.path.endsWith('.html')) html(parseHtml(readFileSync(join(directory, file.path), 'utf8')), file.path);
    if (file.path.endsWith('.css')) stylesheet(readFileSync(join(directory, file.path), 'utf8'), file.path);
  }
}

import * as fs from 'fs';
import * as path from 'path';
import { modules } from '../src/data/modules';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');

console.log('--- Starting Static Site Generation (SSG) Pre-rendering ---');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

const subDirTemplateHtml = templateHtml
  .replace(/href="\.\/assets\//g, 'href="../assets/')
  .replace(/src="\.\/assets\//g, 'src="../assets/')
  .replace(/href="\.\/favicon.svg"/g, 'href="../favicon.svg"');

let generatedCount = 0;

for (const mod of modules) {
  const modDir = path.join(DIST_DIR, mod.id);
  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  const seoText = mod.content.replace(/\[\[.*?\]\]/g, '').replace(/\$\$/g, '').slice(0, 500) + '...';

  let modHtml = subDirTemplateHtml
    .replace('<title>統計検定 3級 学習リファレンス</title>', `<title>${mod.title} | 統計検定 3級 学習リファレンス</title>`)
    .replace('<meta name="description" content="統計検定3級の合格を目指す学習リファレンス。" />', `<meta name="description" content="${mod.description}" />`)
    .replace('<meta property="og:title" content="統計検定 3級 学習リファレンス" />', `<meta property="og:title" content="${mod.title} | 統計検定 3級 学習リファレンス" />`)
    .replace('<meta property="og:description" content="統計検定3級対策サイト" />', `<meta property="og:description" content="${mod.description}" />`);

  const seoDataHtml = `<noscript id="seo-data">
    <h1>${mod.title}</h1>
    <p>${seoText}</p>
  </noscript>`;
  
  modHtml = modHtml.replace('<body>', `<body>\n    ${seoDataHtml}`);

  fs.writeFileSync(path.join(modDir, 'index.html'), modHtml);
  generatedCount++;
}

const staticPages = ['glossary', 'cheatsheet', 'privacy', 'about', 'guide'];
for (const page of staticPages) {
  const pageDir = path.join(DIST_DIR, page);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  let title = '';
  switch (page) {
    case 'glossary': title = '用語集'; break;
    case 'cheatsheet': title = '公式集'; break;
    case 'privacy': title = 'プライバシーポリシー'; break;
    case 'about': title = 'サイトについて'; break;
    case 'guide': title = '試験ガイド'; break;
  }

  let modHtml = subDirTemplateHtml
    .replace('<title>統計検定 3級 学習リファレンス</title>', `<title>${title} | 統計検定 3級 学習リファレンス</title>`)
    .replace('<meta property="og:title" content="統計検定 3級 学習リファレンス" />', `<meta property="og:title" content="${title} | 統計検定 3級 学習リファレンス" />`);

  fs.writeFileSync(path.join(pageDir, 'index.html'), modHtml);
  generatedCount++;
}

console.log(`✅ Generated ${generatedCount} static HTML files successfully!`);

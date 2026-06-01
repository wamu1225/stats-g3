import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { modules } from '../src/data/modules';
import { buildUsecaseHtml } from '../src/data/usecaseGuide';
import { glossary } from '../src/data/glossary';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://study-apps.com/stats-g3';

function stripMarkdown(text: string): string {
  return text
    .replace(/\[\[.*?\]\]/g, '')           // [[term:id]] / [[/term]] markers
    .replace(/\$\$[\s\S]*?\$\$/g, '')      // $$math$$ blocks
    .replace(/\$[^$]+\$/g, '')             // $inline math$
    .replace(/^#{1,6}\s+/gm, '')           // ## headings
    .replace(/\*\*(.*?)\*\*/g, '$1')       // **bold**
    .replace(/\*(.*?)\*/g, '$1')           // *italic*
    .replace(/^[-*+]\s+/gm, '')            // - list items
    .replace(/^\d+\.\s+/gm, '')            // 1. ordered lists
    .replace(/^\|.*\|$/gm, '')             // | table rows |
    .replace(/^[-|:\s]+$/gm, '')           // table separators
    .replace(/^---+$/gm, '')               // --- hr
    .replace(/[\u{1F300}-\u{1FFFF}]/gu, '') // emoji (surrogate range)
    .replace(/[💡🎯⚠️✅❌🔴🟡🟢]/g, '')    // common emoji
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

console.log('--- Starting Static Site Generation (SSG) Pre-rendering ---');

if (!fs.existsSync(INDEX_HTML_PATH)) {
  console.error('Error: dist/index.html not found. Run "npm run build" first.');
  process.exit(1);
}

const templateHtml = fs.readFileSync(INDEX_HTML_PATH, 'utf-8');

// ── ルートindex.htmlに静的コンテンツを注入 ──────────
const moduleListHtml = modules.map(m =>
  `<li style="margin-bottom:12px"><a href="/stats-g3/${m.id}/" style="color:#2563eb;font-weight:600;text-decoration:none">${m.title}</a><br><span style="color:#555;font-size:0.9rem">${m.description}</span></li>`
).join('\n');

const rootStaticContent = `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <h1 style="font-size:1.8rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:16px">統計検定 3級 学習リファレンス</h1>
  <p style="color:#444;margin-bottom:24px">データの整理・確率・確率分布・統計的推測をインタラクティブな図と数式で解説する統計検定3級対策サイトです。中学・高校レベルの数学知識で理解できるよう、直感的な説明・グラフ・確認クイズを提供しています。</p>
  <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:12px">学習モジュール一覧</h2>
  <ul style="list-style:none;padding:0">
${moduleListHtml}
  </ul>
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px;display:flex;gap:16px;flex-wrap:wrap">
    <a href="/stats-g3/glossary/" style="color:#2563eb">用語集</a>
    <a href="/stats-g3/cheatsheet/" style="color:#2563eb">公式集</a>
    <a href="/stats-g3/guide/" style="color:#2563eb">試験ガイド</a>
    <a href="/stats-g3/usecase/" style="color:#2563eb">統計手法の使い分けガイド</a>
    <a href="/stats-g3/about/" style="color:#2563eb">サイトについて</a>
    <a href="/stats-g3/privacy/" style="color:#2563eb;font-size:0.85rem">プライバシーポリシー</a>
  </nav>
  <p style="font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:12px">※本サイトは個人による学習支援サイトであり、統計質保証推進協会・日本統計学会の公式サイトではありません。</p>
</article>`;

let rootIndexHtml = templateHtml.replace('<div id="root"></div>', `<div id="root">${rootStaticContent}</div>`);
const homeJsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  'name': '統計検定 3級 学習リファレンス',
  'url': `${BASE_URL}/`,
  'description': 'データの整理・確率・確率分布・統計的推測をインタラクティブな図と数式で解説する統計検定3級対策サイト。',
  'inLanguage': 'ja'
});
rootIndexHtml = rootIndexHtml.replace('</head>', `<script type="application/ld+json">${homeJsonLd}</script>\n  </head>`);
fs.writeFileSync(INDEX_HTML_PATH, rootIndexHtml);

// base: './' generates relative paths — convert for subdirectory pages
const subDirTemplateHtml = templateHtml
  .replace(/href="\.\/assets\//g, 'href="../assets/')
  .replace(/src="\.\/assets\//g, 'src="../assets/')
  .replace(/href="\.\/favicon.svg"/g, 'href="../favicon.svg"')
  .replace(/href="\.\/icons.svg"/g, 'href="../icons.svg"');

let generatedCount = 0;

for (const mod of modules) {
  const modDir = path.join(DIST_DIR, mod.id);
  if (!fs.existsSync(modDir)) {
    fs.mkdirSync(modDir, { recursive: true });
  }

  const seoText = stripMarkdown(mod.content).slice(0, 2000);
  const pageUrl = `${BASE_URL}/${mod.id}/`;
  const pageTitle = `${mod.title} | 統計検定 3級 学習リファレンス`;

  let modHtml = subDirTemplateHtml
    .replace('<title>統計検定 3級 学習リファレンス</title>', `<title>${pageTitle}</title>`)
    .replace('<meta name="description" content="統計検定3級の合格を目指す学習リファレンス。データの整理・確率・確率分布・統計的推測をインタラクティブな図と数式でわかりやすく解説。" />', `<meta name="description" content="${mod.description}" />`)
    .replace('<meta property="og:title" content="統計検定 3級 学習リファレンス" />', `<meta property="og:title" content="${pageTitle}" />`)
    .replace('<meta property="og:description" content="データの整理・確率・確率分布・統計的推測をインタラクティブな図と数式で解説する3級対策サイト。" />', `<meta property="og:description" content="${mod.description}" />`)
    .replace('<meta property="og:url" content="https://study-apps.com/stats-g3/" />', `<meta property="og:url" content="${pageUrl}" />`)
    .replace('<link rel="canonical" href="https://study-apps.com/stats-g3/" />', `<link rel="canonical" href="${pageUrl}" />`)
    .replace('<meta name="twitter:title" content="統計検定 3級 学習リファレンス" />', `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace('<meta name="twitter:description" content="統計検定3級の合格を目指す学習リファレンス。データの整理・確率・確率分布・統計的推測をインタラクティブな図と数式でわかりやすく解説。" />', `<meta name="twitter:description" content="${mod.description}" />`);

  const seoContentHtml = `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g3/" style="color:#2563eb;text-decoration:none">← 学習リファレンス ホーム</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:12px">${mod.title}</h1>
  <p style="color:#555;margin-bottom:20px;font-size:1.05rem">${mod.description}</p>
  <div style="white-space:pre-line;color:#333">${seoText}</div>
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px">
    <a href="/stats-g3/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a>
  </nav>
  <p style="font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:12px">※本サイトは個人による学習支援サイトであり、統計質保証推進協会・日本統計学会の公式サイトではありません。</p>
</article>`;

  modHtml = modHtml.replace('<div id="root"></div>', `<div id="root">${seoContentHtml}</div>`);
  const modJsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    'name': mod.title,
    'description': mod.description,
    'url': pageUrl,
    'inLanguage': 'ja',
    'learningResourceType': 'Article',
    'provider': { '@type': 'Organization', 'name': 'study-apps.com', 'url': 'https://study-apps.com' }
  });
  modHtml = modHtml.replace('</head>', `<script type="application/ld+json">${modJsonLd}</script>\n  </head>`);

  fs.writeFileSync(path.join(modDir, 'index.html'), modHtml);
  generatedCount++;
}

const glossaryTermsHtml = Object.values(glossary).slice(0, 30).map((t: { term: string; level: string; explanation: string }) =>
  `<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #eee">
    <strong style="font-size:1rem;color:#1e3a5f">${t.term}</strong>
    <span style="display:inline-block;font-size:0.75rem;color:#fff;background:${t.level === '基礎' ? '#16a34a' : t.level === '中級' ? '#2563eb' : '#9333ea'};padding:1px 6px;border-radius:4px;margin-left:8px">${t.level}</span>
    <p style="margin:6px 0 0;color:#444;line-height:1.6">${t.explanation.replace(/\$[^$]+\$/g, '').replace(/\*\*(.*?)\*\*/g, '$1')}</p>
  </div>`
).join('\n');

const staticPageContents: Record<string, { title: string; description: string; bodyHtml: string }> = {
  glossary: {
    title: '用語集',
    description: '統計検定3級の頻出用語を一覧で解説。平均・分散・標準偏差・確率分布・仮説検定など試験に出る統計用語を網羅。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g3/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">用語集</h1>
  <p style="color:#555;margin-bottom:24px">統計検定3級の頻出用語を一覧で解説します。平均・分散・標準偏差・確率分布・仮説検定など試験に出る統計用語を網羅しています。</p>
${glossaryTermsHtml}
</article>`
  },
  cheatsheet: {
    title: '公式集',
    description: '統計検定3級の重要公式を一覧にまとめました。平均・分散・標準偏差・確率分布・推定・検定・回帰分析の公式をすばやく確認できます。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g3/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">公式集</h1>
  <p style="color:#555;margin-bottom:24px">統計検定3級の重要公式を分野別にまとめています。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">平均・分散・標準偏差</h2>
  <p style="color:#444">平均（算術平均）はデータの合計をデータ数で割った値。分散はデータの散らばりを表し、標準偏差は分散の正の平方根です。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">確率の基本ルール</h2>
  <p style="color:#444">和の法則：P(AまたはB) = P(A) + P(B) − P(AかつB)。積の法則（独立な場合）：P(AかつB) = P(A) × P(B)。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">二項分布</h2>
  <p style="color:#444">試行回数n、成功確率pのとき、成功回数Xは二項分布B(n,p)に従います。期待値はnp、分散はnp(1−p)です。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">正規分布・標準化</h2>
  <p style="color:#444">正規分布N(μ,σ²)において、標準化変量Z=(X−μ)/σは標準正規分布N(0,1)に従います。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">信頼区間（母平均）</h2>
  <p style="color:#444">標本平均から母平均の95%信頼区間：標本平均 ± 1.96 × (母標準偏差 / √n)。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">相関係数</h2>
  <p style="color:#444">相関係数rは−1から1の値をとり、1に近いほど正の相関、−1に近いほど負の相関が強いことを示します。</p>
  <p style="margin-top:24px"><a href="/stats-g3/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  },
  guide: {
    title: '試験ガイド',
    description: '統計検定3級の試験概要・出題範囲・学習の進め方を解説。合格基準・試験時間・推奨学習時間など受験に必要な情報をまとめました。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g3/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">試験ガイド</h1>
  <p style="color:#555;margin-bottom:24px">統計検定3級の試験概要・出題範囲・学習の進め方を解説します。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">試験概要</h2>
  <p style="color:#444">統計検定3級は、データの基本的な整理・分析・解釈の能力を問う試験です。高校数学程度の知識で受験できます。試験時間は60分、出題形式はマークシート（多肢選択式）です。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">主な出題範囲</h2>
  <ul style="color:#444;padding-left:20px">
    <li>データの整理（度数分布・ヒストグラム・代表値・散布度）</li>
    <li>データの可視化（グラフの読み取り・解釈）</li>
    <li>散布図・相関・クロス集計</li>
    <li>確率の基礎（確率の定義・加法定理・乗法定理）</li>
    <li>確率分布（二項分布・正規分布・期待値・分散）</li>
    <li>中心極限定理と標本分布</li>
    <li>推定（区間推定・信頼区間）</li>
    <li>仮説検定（t検定・比率の検定）</li>
    <li>回帰分析（単回帰・相関係数）</li>
  </ul>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">合格基準</h2>
  <p style="color:#444">概ね正答率70%以上が合格の目安とされています（試験回によって調整あり）。</p>
  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">推奨学習時間</h2>
  <p style="color:#444">高校数学の基礎がある場合：30〜60時間程度。初学者の場合：60〜100時間を目安に計画的に学習しましょう。</p>
  <p style="margin-top:24px;font-size:0.85rem;color:#888">※本ページの情報は個人による学習支援目的のものです。最新の試験情報は必ず公式サイトでご確認ください。</p>
  <p style="margin-top:16px"><a href="/stats-g3/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  },
  usecase: {
    title: '統計手法の使い分けガイド',
    description: '統計検定3級の範囲で、データのまとめ方・グラフ・確率分布・推定・検定・回帰を「目的から逆引き」できる早見表。代表値やグラフの選び方、二項・正規分布、母比率の推定・検定などを整理。',
    bodyHtml: buildUsecaseHtml('/stats-g3')
  },
  about: {
    title: 'サイトについて',
    description: '統計検定3級 学習リファレンスについて。サイトの目的・コンテンツ構成・利用方法を説明します。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g3/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">サイトについて</h1>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">このサイトについて</h2>
    <p style="color:#444">「統計検定 3級 学習リファレンス」は、統計検定3級の合格を目指す方のために作られた、個人運営の学習支援サイトです。</p>
    <p style="color:#444">中学・高校レベルの数学知識で理解できるよう、概念の直感的な説明・インタラクティブなグラフ・確認クイズを提供しています。</p>
    <p style="color:#888;font-size:0.9rem;border-left:3px solid #fbbf24;padding-left:12px;margin-top:12px">本サイトは個人による学習支援サイトであり、統計質保証推進協会および日本統計学会の公式サイトではありません。掲載内容は個人の見解に基づくものであり、公式の情報を保証するものではありません。試験の最新情報・申込方法・合否については、必ず公式サイトをご確認ください。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">コンテンツ構成</h2>
    <ul style="color:#444;padding-left:20px">
      <li><strong>学習モジュール</strong>：データの整理・確率・確率分布・推定・検定・回帰分析など</li>
      <li><strong>用語集</strong>：3級頻出用語の解説</li>
      <li><strong>公式集</strong>：重要公式の一覧</li>
      <li><strong>確認クイズ</strong>：各モジュールの理解度確認</li>
    </ul>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">編集・制作方針</h2>
    <p style="color:#444">本サイトのコンテンツは、統計検定の公式の出題範囲や一般に流通している統計学の教科書・参考書を参照しつつ、運営者が内容を一から再構成し、高校生など初学者がつまずきやすい点を補う形で独自に解説しています。他サイトの文章をそのまま転載することはありません。図解・確認クイズはすべて本サイト向けに独自に制作したものです。内容の誤りや古くなった情報に気づいた場合は、お問い合わせを受けて随時見直し・修正します。</p>
  </section>

  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">運営者について</h2>
    <p style="color:#444">本サイトは、統計学の学習を個人的に進める中で、同じように学んでいる方の助けになればと思い作成・公開しています。広告収入（Google AdSense）はサイトの維持運営費用に充てています。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">お問い合わせ</h2>
    <p style="color:#444">内容の誤り・ご意見・ご要望は<a href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer" style="color:#2563eb">こちらのGoogleフォーム</a>からお願いします。統計的な誤り・誤字脱字のご指摘も歓迎しています。</p>
  </section>
  <section>
    <h2 style="font-size:1.2rem;font-weight:700;margin-bottom:8px">免責事項</h2>
    <p style="color:#444">本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性・完全性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。また、本サイトは統計検定への合格を保証するものではありません。</p>
  </section>
  <p style="margin-top:32px"><a href="/stats-g3/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  },
  privacy: {
    title: 'プライバシーポリシー',
    description: '統計検定3級 学習リファレンスのプライバシーポリシー。個人情報の取り扱いについて説明します。',
    bodyHtml: `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="/stats-g3/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:8px">プライバシーポリシー</h1>
  <p style="color:#888;font-size:0.9rem;margin-bottom:24px">最終更新：2025年4月</p>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">1. サイトについて</h2>
    <p style="color:#444">本サイト「統計検定 3級 学習リファレンス」は、統計検定3級の学習を支援することを目的とした個人運営のサイトです。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">2. Google Analytics の利用について</h2>
    <p style="color:#444">本サイトでは、アクセス状況を把握するために <strong>Google Analytics</strong>（Google LLC 提供）を使用しています。閲覧したページのURL・滞在時間・使用デバイス・おおまかな地域情報などがCookieを通じてGoogleのサーバーに送信されます。個人を特定する情報は収集しません。</p>
    <p style="color:#444"><strong>利用目的：</strong>コンテンツ改善のためのアクセス分析</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">3. Google AdSense の利用について</h2>
    <p style="color:#444">本サイトでは、広告配信のために <strong>Google AdSense</strong>（Google LLC 提供）を使用しています。閲覧履歴・Cookieに保存された識別情報などが広告のパーソナライズに使用されます。</p>
    <p style="color:#444"><strong>利用目的：</strong>サイト運営費用の確保</p>
    <p style="color:#444"><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style="color:#2563eb">広告設定ページ</a>でパーソナライズ広告を無効にできます。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">4. Cookieについて</h2>
    <p style="color:#444">本サイトでは、Google Analytics および Google AdSense の機能提供のためにCookieを使用しています。ブラウザの設定からCookieを無効にすることができますが、一部機能が正常に動作しない場合があります。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">5. 学習進捗データについて</h2>
    <p style="color:#444">クイズの得点・完了状況は、お使いのブラウザの <strong>ローカルストレージ</strong> にのみ保存されます。このデータは外部サーバーへ送信されることはなく、運営者も閲覧できません。</p>
  </section>
  <section>
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">6. コンテンツの免責事項</h2>
    <p style="color:#444">本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。</p>
  </section>
  <p style="margin-top:32px"><a href="/stats-g3/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`
  }
};

for (const [page, config] of Object.entries(staticPageContents)) {
  const pageDir = path.join(DIST_DIR, page);
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }

  const pageUrl = `${BASE_URL}/${page}/`;
  const pageTitle = `${config.title} | 統計検定 3級 学習リファレンス`;

  let pageHtml = subDirTemplateHtml
    .replace('<title>統計検定 3級 学習リファレンス</title>', `<title>${pageTitle}</title>`)
    .replace('<meta name="description" content="統計検定3級の合格を目指す学習リファレンス。データの整理・確率・確率分布・統計的推測をインタラクティブな図と数式でわかりやすく解説。" />', `<meta name="description" content="${config.description}" />`)
    .replace('<meta property="og:title" content="統計検定 3級 学習リファレンス" />', `<meta property="og:title" content="${pageTitle}" />`)
    .replace('<meta property="og:description" content="データの整理・確率・確率分布・統計的推測をインタラクティブな図と数式で解説する3級対策サイト。" />', `<meta property="og:description" content="${config.description}" />`)
    .replace('<meta property="og:url" content="https://study-apps.com/stats-g3/" />', `<meta property="og:url" content="${pageUrl}" />`)
    .replace('<link rel="canonical" href="https://study-apps.com/stats-g3/" />', `<link rel="canonical" href="${pageUrl}" />`)
    .replace('<meta name="twitter:title" content="統計検定 3級 学習リファレンス" />', `<meta name="twitter:title" content="${pageTitle}" />`)
    .replace('<meta name="twitter:description" content="統計検定3級の合格を目指す学習リファレンス。データの整理・確率・確率分布・統計的推測をインタラクティブな図と数式でわかりやすく解説。" />', `<meta name="twitter:description" content="${config.description}" />`);

  pageHtml = pageHtml.replace('<div id="root"></div>', `<div id="root">${config.bodyHtml}</div>`);

  fs.writeFileSync(path.join(pageDir, 'index.html'), pageHtml);
  generatedCount++;
}

// ── sitemap.xml の生成 ──────────────────────────────
const today = new Date().toISOString().split('T')[0];

const moduleUrls = modules.map(m =>
  `  <url>\n    <loc>${BASE_URL}/${m.id}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
).join('\n');

const staticUrls = ['glossary', 'cheatsheet', 'guide', 'usecase', 'about', 'privacy'].map(p =>
  `  <url>\n    <loc>${BASE_URL}/${p}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
).join('\n');

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${BASE_URL}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${moduleUrls}
${staticUrls}
</urlset>`;

fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);

console.log(`✅ Generated ${generatedCount} static HTML files successfully!`);
console.log(`✅ Generated sitemap.xml with ${modules.length + 6} URLs.`);

// ── OGP Image Generation ─────────────────────────
const ogpSvg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#f8fafc"/>
  <rect width="1200" height="12" fill="#0075de"/>
  <rect x="0" y="0" width="360" height="630" fill="#0075de" fill-opacity="0.05"/>
  <rect x="80" y="230" width="8" height="160" rx="4" fill="#0075de"/>
  <text x="112" y="300" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="52" font-weight="700" fill="#0f172a">統計検定 3級</text>
  <text x="112" y="368" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="52" font-weight="700" fill="#0f172a">学習リファレンス</text>
  <text x="112" y="430" font-family="Yu Gothic UI,Yu Gothic,Meiryo,Hiragino Sans,sans-serif" font-size="26" fill="#64748b">データの整理・確率・確率分布・統計的推測</text>
  <text x="1120" y="600" text-anchor="end" font-family="Arial,Helvetica,sans-serif" font-size="22" fill="#94a3b8">study-apps.com</text>
</svg>`;

const ogpBuffer = await sharp(Buffer.from(ogpSvg)).png().toBuffer();
fs.writeFileSync(path.join(DIST_DIR, 'ogp.png'), ogpBuffer);
console.log('✅ Generated ogp.png');

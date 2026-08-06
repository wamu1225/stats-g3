import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import katex from 'katex';
import { modules } from '../src/data/modules';
import { chapterNames } from '../src/data/chapters';
import { buildUsecaseHtml } from '../src/data/usecaseGuide';
import { glossary } from '../src/data/glossary';
import { EXAM_CONFIG } from '../src/data/examConfig';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const INDEX_HTML_PATH = path.join(DIST_DIR, 'index.html');
const BASE_URL = 'https://study-apps.com/stats-g3';

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// KaTeXでサーバーサイド描画（2026-07-30・O-2-6続報：$...$を除去すると地の文が破綻するため実描画に変更）。
// MathDisplay.tsx と同じオプション・同じクラス名を使い、ハイドレーション後との見た目の一致を狙う。
function renderMath(formula: string, block: boolean): string {
  try {
    const html = katex.renderToString(formula, { displayMode: block, throwOnError: false, output: 'html' });
    return block ? `<div class="math-block-container" style="margin:1rem 0"><div class="katex-display">${html}</div></div>` : `<span class="katex-inline">${html}</span>`;
  } catch {
    return escHtml(formula);
  }
}

// [[...]]は図SVG埋め込み・term系マーカーのため除去。$$...$$/$...$はrenderMathでHTML化（escHtmlしない）。
const inlineHtml = (raw: string): string => {
  const s = raw.replace(/\[\[.*?\]\]/g, '').replace(/\[([^\]\n]+)\]\([^)\n]+\)/g, '$1');
  const tokens = s.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g);
  return tokens
    .map((t) => {
      if (t.startsWith('$$') && t.endsWith('$$') && t.length >= 4) return renderMath(t.slice(2, -2), true);
      if (t.startsWith('$') && t.endsWith('$') && t.length >= 2) return renderMath(t.slice(1, -1), false);
      return escHtml(t).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    })
    .join('');
};

// 表・見出し・リストを静的HTMLへ変換（旧stripMarkdownは表を丸ごと削除していたため新設。
// 本サイトはApp.tsx側にコールアウト専用スタイルが無いため💡⚠️等は地の文としてそのまま出す）

// App.tsx内のJSX図（[[key]]でReact専用に描画されるSVG）を静的HTMLでも表示する（2026-07-30・O-2-6続報）。
// 固定座標・固定数式（seeded PRNGを含め props/state非依存）のもののみ複製。regularization-cardは未使用のため対象外。
function mulberryRndG3(seed: number) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}
function ciSvgG3(): string {
  const muX = 176, n = 20, half = 30, top = 20, gap = 6.6;
  const rnd = mulberryRndG3(13);
  const bars = Array.from({ length: n }, (_, i) => {
    let off = (rnd() - 0.5) * 52;
    if (i === 6) off = 42;
    return { cx: muX + off, y: top + i * gap, miss: Math.abs(off) > half };
  });
  const H = top + n * gap + 8;
  const rows = bars.map((b) => {
    const col = b.miss ? '#dc2626' : 'var(--primary)';
    return `<g><line x1="${b.cx - half}" y1="${b.y}" x2="${b.cx + half}" y2="${b.y}" stroke="${col}" stroke-width="2" /><line x1="${b.cx - half}" y1="${b.y - 2.5}" x2="${b.cx - half}" y2="${b.y + 2.5}" stroke="${col}" stroke-width="1.5" /><line x1="${b.cx + half}" y1="${b.y - 2.5}" x2="${b.cx + half}" y2="${b.y + 2.5}" stroke="${col}" stroke-width="1.5" /><circle cx="${b.cx}" cy="${b.y}" r="2" fill="${col}" /></g>`;
  }).join('');
  return `<svg viewBox="0 0 340 ${H + 20}" role="img" aria-label="信頼区間の被覆：多数の95%信頼区間のうち約95%が母平均を含む" class="g3-fig-svg">
    <line x1="${muX}" y1="${top - 8}" x2="${muX}" y2="${H}" stroke="#334155" stroke-width="1.4" stroke-dasharray="4 3" />
    <text x="${muX}" y="${top - 12}" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">母平均 μ</text>${rows}
    <text x="${muX + 78}" y="${bars[6].y + 3}" font-size="8.5" font-weight="700" fill="#b91c1c">← μを外した区間</text>
  </svg>`;
}
function rejectionSvg(): string {
  const cxc = 170, yb = 116, ph = 84, sc = 46, c = 2.0;
  const px = (x: number) => cxc + x * sc;
  const py = (y: number) => yb - y * ph;
  const f = (x: number) => Math.exp(-(x * x) / 2);
  const build = (from: number, to: number) => { let pts = `${px(from).toFixed(1)},${yb} `; for (let x = from; x <= to + 1e-9; x += 0.1) pts += `${px(x).toFixed(1)},${py(f(x)).toFixed(1)} `; pts += `${px(to).toFixed(1)},${yb}`; return pts; };
  let curve = ''; for (let x = -3.4; x <= 3.4001; x += 0.1) curve += `${px(x).toFixed(1)},${py(f(x)).toFixed(1)} `;
  return `<svg viewBox="0 0 340 156" role="img" aria-label="仮説検定の棄却域：両裾の赤い領域が棄却域、中央が採択域" class="g3-fig-svg">
    <polygon points="${build(-3.4, -c)}" fill="#dc2626" fill-opacity="0.45" /><polygon points="${build(-c, c)}" fill="var(--primary)" fill-opacity="0.12" /><polygon points="${build(c, 3.4)}" fill="#dc2626" fill-opacity="0.45" />
    <polyline points="${curve.trim()}" fill="none" stroke="#475569" stroke-width="1.8" />
    <line x1="${px(-3.4)}" y1="${yb}" x2="${px(3.4)}" y2="${yb}" stroke="#94a3b8" stroke-width="1" />
    <line x1="${px(-c)}" y1="${yb}" x2="${px(-c)}" y2="${py(f(c)) - 4}" stroke="#b91c1c" stroke-width="1.3" stroke-dasharray="3 2" />
    <line x1="${px(c)}" y1="${yb}" x2="${px(c)}" y2="${py(f(c)) - 4}" stroke="#b91c1c" stroke-width="1.3" stroke-dasharray="3 2" />
    <text x="${cxc}" y="${py(0.42)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--primary-hover)">採択域</text>
    <text x="${cxc}" y="${py(0.42) + 12}" text-anchor="middle" font-size="8" fill="#64748b">H₀ を棄却しない（95%）</text>
    <text x="${px(-2.7)}" y="${py(0.05) - 4}" text-anchor="middle" font-size="9" font-weight="700" fill="#b91c1c">棄却域</text>
    <text x="${px(2.7)}" y="${py(0.05) - 4}" text-anchor="middle" font-size="9" font-weight="700" fill="#b91c1c">棄却域</text>
    <text x="${px(-c)}" y="${yb + 13}" text-anchor="middle" font-size="8.5" fill="#334155">−臨界値</text>
    <text x="${px(c)}" y="${yb + 13}" text-anchor="middle" font-size="8.5" fill="#334155">＋臨界値</text>
    <text x="${px(-2.7)}" y="${yb + 13}" text-anchor="middle" font-size="7.5" fill="#b91c1c">2.5%</text>
    <text x="${px(2.7)}" y="${yb + 13}" text-anchor="middle" font-size="7.5" fill="#b91c1c">2.5%</text>
  </svg>`;
}
function graphtypesSvg(): string {
  const cols = ['#12864b', '#f0913a', '#5b8def', '#e0607e'];
  const pie = (cx: number, cy: number, r: number) => {
    const segs = [0.45, 0.35, 0.2]; let a0 = -Math.PI / 2; let out = '';
    segs.forEach((s, i) => { const a1 = a0 + s * 2 * Math.PI; const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1); const large = s > 0.5 ? 1 : 0; out += `<path d="M${cx},${cy} L${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} Z" fill="${cols[i]}" fill-opacity="0.75" />`; a0 = a1; });
    return out;
  };
  const bars = [26, 40, 32, 52].map((h, i) => `<rect x="${12 + i * 13}" y="${72 - h}" width="9" height="${h}" rx="1.5" fill="var(--primary)" fill-opacity="0.75" />`).join('');
  const linePts = [[182, 60], [196, 44], [210, 52], [224, 30], [238, 36]];
  const lineDots = linePts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.4" fill="var(--primary)" />`).join('');
  const scatterPts = [[286, 58], [296, 50], [300, 60], [308, 42], [316, 48], [322, 34], [330, 40], [292, 62], [312, 54]];
  const scatterDots = scatterPts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="2.3" fill="var(--primary)" fill-opacity="0.7" />`).join('');
  return `<svg viewBox="0 0 344 104" role="img" aria-label="代表的なグラフ：棒グラフ・円グラフ・折れ線グラフ・散布図" class="g3-fig-svg">
    <g>${bars}<line x1="10" y1="72" x2="70" y2="72" stroke="#cbd5e1" stroke-width="1" /><text x="40" y="94" text-anchor="middle" font-size="9" font-weight="700" fill="#475569">棒グラフ</text><text x="40" y="104" text-anchor="middle" font-size="7.5" fill="#94a3b8">量の比較</text></g>
    <g>${pie(126, 46, 26)}<text x="126" y="94" text-anchor="middle" font-size="9" font-weight="700" fill="#475569">円グラフ</text><text x="126" y="104" text-anchor="middle" font-size="7.5" fill="#94a3b8">構成比</text></g>
    <g><polyline points="182,60 196,44 210,52 224,30 238,36" fill="none" stroke="var(--primary)" stroke-width="2.2" />${lineDots}<line x1="180" y1="72" x2="240" y2="72" stroke="#cbd5e1" stroke-width="1" /><text x="210" y="94" text-anchor="middle" font-size="9" font-weight="700" fill="#475569">折れ線</text><text x="210" y="104" text-anchor="middle" font-size="7.5" fill="#94a3b8">時間の変化</text></g>
    <g>${scatterDots}<line x1="282" y1="72" x2="336" y2="72" stroke="#cbd5e1" stroke-width="1" /><line x1="282" y1="72" x2="282" y2="30" stroke="#cbd5e1" stroke-width="1" /><text x="309" y="94" text-anchor="middle" font-size="9" font-weight="700" fill="#475569">散布図</text><text x="309" y="104" text-anchor="middle" font-size="7.5" fill="#94a3b8">2変数の関係</text></g>
  </svg>`;
}
function histshapesSvg(): string {
  const panels: { label: string; h: (i: number) => number }[] = [
    { label: '左右対称（山型）', h: (i) => Math.exp(-((i - 3.5) ** 2) / 4) },
    { label: '右裾が長い（右歪み）', h: (i) => Math.exp(-((i - 1.5) ** 2) / 2.2) + 0.15 * Math.exp(-((i - 5) ** 2) / 6) },
    { label: '左裾が長い（左歪み）', h: (i) => Math.exp(-((i - 5.5) ** 2) / 2.2) + 0.15 * Math.exp(-((i - 2) ** 2) / 6) },
    { label: '双峰型（2つの山）', h: (i) => Math.exp(-((i - 1.5) ** 2) / 1.6) + Math.exp(-((i - 5.5) ** 2) / 1.6) },
  ];
  const bins = 8, pw = 74, gap = 10, ph = 60, baseY = 74, x0 = 4;
  let out = '';
  panels.forEach((p, pi) => {
    const px = x0 + pi * (pw + gap);
    const hs = Array.from({ length: bins }, (_, i) => p.h(i));
    const mx = Math.max(...hs);
    hs.forEach((hv, i) => { const bw = pw / bins, bh = (hv / mx) * ph; out += `<rect x="${px + i * bw + 0.6}" y="${baseY - bh}" width="${bw - 1.2}" height="${bh}" fill="var(--primary)" fill-opacity="0.7" />`; });
    out += `<line x1="${px}" y1="${baseY}" x2="${px + pw}" y2="${baseY}" stroke="#cbd5e1" stroke-width="1" /><text x="${px + pw / 2}" y="${baseY + 13}" text-anchor="middle" font-size="8.5" fill="#475569">${p.label}</text>`;
  });
  return `<svg viewBox="0 0 340 92" role="img" aria-label="ヒストグラムの4つの形：左右対称・右歪み・左歪み・双峰" class="g3-fig-svg">${out}</svg>`;
}
function deviationSvg(): string {
  const x0 = 30, x1 = 314, axisY = 62;
  const X = (v: number) => x0 + ((v - 6) / 8) * (x1 - x0);
  const vals = [6, 8, 10, 12, 14], devs = ['−4', '−2', '0', '+2', '+4'], mean = 10, Xm = X(mean);
  const dots = vals.map((v, i) => {
    const x = X(v); const zero = v === mean; const neg = v < mean;
    const col = zero ? '#64748b' : neg ? '#5b8def' : '#e0607e';
    return `<g><circle cx="${x}" cy="${axisY}" r="3.4" fill="var(--primary)" /><text x="${x}" y="${axisY + 15}" text-anchor="middle" font-size="9" fill="#475569">${v}</text><text x="${x}" y="${axisY - 9}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${col}">${devs[i]}</text></g>`;
  }).join('');
  return `<svg viewBox="0 0 344 94" role="img" aria-label="6,8,10,12,14 の各データと平均10との偏差" class="g3-fig-svg">
    <line x1="${x0 - 6}" y1="${axisY}" x2="${x1 + 6}" y2="${axisY}" stroke="#cbd5e1" stroke-width="1.2" />
    <line x1="${Xm}" y1="24" x2="${Xm}" y2="${axisY + 18}" stroke="#64748b" stroke-width="1.4" stroke-dasharray="3 2" />
    <text x="${Xm}" y="17" text-anchor="middle" font-size="9.5" font-weight="700" fill="#64748b">平均 10</text>${dots}
  </svg>`;
}
function skewmeanSvg(): string {
  const x0 = 22, pw = 300, baseY = 84, top = 22;
  const f = (t: number) => t * t * Math.exp(-1.1 * t);
  const N = 80, tmax = 7;
  const fs = Array.from({ length: N + 1 }, (_, k) => f((k / N) * tmax));
  const mx = Math.max(...fs);
  const X = (t: number) => x0 + (t / tmax) * pw;
  const Y = (v: number) => baseY - (v / mx) * (baseY - top);
  const pts = fs.map((v, k) => `${X((k / N) * tmax).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const vline = (t: number, color: string, label: string, ly: number) => { const x = X(t); return `<g><line x1="${x}" y1="${ly + 4}" x2="${x}" y2="${baseY}" stroke="${color}" stroke-width="1.7" stroke-dasharray="3 2" /><text x="${x}" y="${ly}" text-anchor="middle" font-size="9.5" font-weight="700" fill="${color}">${label}</text></g>`; };
  return `<svg viewBox="0 0 344 112" role="img" aria-label="右に歪んだ分布での最頻値・中央値・平均の位置関係" class="g3-fig-svg">
    <polygon points="${X(0).toFixed(1)},${baseY} ${pts} ${X(tmax).toFixed(1)},${baseY}" fill="var(--primary)" fill-opacity="0.1" />
    <polyline points="${pts}" fill="none" stroke="var(--primary)" stroke-width="2" />
    <line x1="${x0}" y1="${baseY}" x2="${x0 + pw}" y2="${baseY}" stroke="#cbd5e1" stroke-width="1" />
    ${vline(1.82, '#12864b', '最頻値', 14)}${vline(2.30, '#5b8def', '中央値', 31)}${vline(2.73, '#e0607e', '平均', 14)}
    <text x="${x0 + pw}" y="99" text-anchor="end" font-size="8" fill="#94a3b8">値 →（右に長い裾）</text>
  </svg>`;
}
function ogiveSvg(): string {
  const x0 = 46, y0 = 90, pw = 268, ph = 62;
  const X = (s: number) => x0 + ((s - 40) / 60) * pw;
  const Y = (c: number) => y0 - c * ph;
  const data: [number, number][] = [[40, 0], [50, 0.08], [60, 0.30], [70, 0.62], [80, 0.86], [90, 0.97], [100, 1]];
  const line = data.map(([s, c]) => `${X(s).toFixed(1)},${Y(c).toFixed(1)}`).join(' ');
  const medS = 66;
  const dots = data.map(([s, c]) => `<circle cx="${X(s)}" cy="${Y(c)}" r="2.2" fill="var(--primary)" />`).join('');
  return `<svg viewBox="0 0 344 112" role="img" aria-label="累積相対度数グラフ（オージャイブ）からの中央値の読み取り" class="g3-fig-svg">
    <line x1="${x0}" y1="${y0}" x2="${x0 + pw}" y2="${y0}" stroke="#cbd5e1" stroke-width="1" /><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0 - ph - 4}" stroke="#cbd5e1" stroke-width="1" />
    <line x1="${x0}" y1="${Y(0.5)}" x2="${X(medS)}" y2="${Y(0.5)}" stroke="#e0607e" stroke-width="1.3" stroke-dasharray="3 2" />
    <line x1="${X(medS)}" y1="${Y(0.5)}" x2="${X(medS)}" y2="${y0}" stroke="#e0607e" stroke-width="1.3" stroke-dasharray="3 2" />
    <polyline points="${line}" fill="none" stroke="var(--primary)" stroke-width="2" />${dots}
    <text x="${x0 - 5}" y="${Y(0.5) + 3}" text-anchor="end" font-size="8.5" font-weight="700" fill="#e0607e">0.5</text>
    <text x="${x0 - 5}" y="${Y(1) + 3}" text-anchor="end" font-size="8" fill="#94a3b8">1.0</text>
    <text x="${x0 - 5}" y="${y0 + 3}" text-anchor="end" font-size="8" fill="#94a3b8">0</text>
    <text x="${X(medS)}" y="${y0 + 12}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#e0607e">中央値≈66</text>
    <text x="${x0 + pw}" y="${y0 + 12}" text-anchor="end" font-size="8" fill="#94a3b8">点数 →</text>
    <text x="${x0 - 8}" y="${y0 - ph - 8}" text-anchor="start" font-size="8" fill="#94a3b8">累積相対度数</text>
  </svg>`;
}
function samplingSvgG3(): string {
  const panels = [{ title: '単純無作為', cx: 8 }, { title: '層化', cx: 116 }, { title: 'クラスター', cx: 224 }];
  const pw = 96, py = 22, ph = 94;
  const rnd = mulberryRndG3(3);
  let out = '';
  panels.forEach((p) => {
    out += `<text x="${p.cx + pw / 2}" y="14" text-anchor="middle" font-size="10" font-weight="700" fill="#334155">${p.title}</text>`;
    out += `<rect x="${p.cx}" y="${py}" width="${pw}" height="${ph}" rx="6" fill="none" stroke="#cbd5e1" stroke-width="1" />`;
    if (p.title === '層化') for (let b = 0; b < 3; b++) out += `<rect x="${p.cx}" y="${py + b * (ph / 3)}" width="${pw}" height="${ph / 3}" fill="${b % 2 ? 'var(--primary)' : '#f59e0b'}" fill-opacity="0.06" />`;
    if (p.title === 'クラスター') { out += `<rect x="${p.cx + 4}" y="${py + 6}" width="40" height="38" rx="4" fill="var(--primary)" fill-opacity="0.14" stroke="var(--primary)" stroke-width="1.2" />`; out += `<rect x="${p.cx + pw / 2 + 4}" y="${py + ph / 2 - 2}" width="40" height="38" rx="4" fill="var(--primary)" fill-opacity="0.14" stroke="var(--primary)" stroke-width="1.2" />`; }
    for (let i = 0; i < 26; i++) {
      const dx = p.cx + 8 + rnd() * (pw - 16), dy = py + 8 + rnd() * (ph - 16);
      let picked = false;
      if (p.title === '単純無作為') picked = rnd() < 0.28;
      else if (p.title === '層化') picked = rnd() < 0.28;
      else picked = (dx > p.cx + 4 && dx < p.cx + 44 && dy > py + 6 && dy < py + 44) || (dx > p.cx + pw / 2 + 4 && dy > py + ph / 2 - 2);
      out += `<circle cx="${dx.toFixed(1)}" cy="${dy.toFixed(1)}" r="2.4" fill="${picked ? 'var(--primary)' : '#cbd5e1'}" />`;
    }
  });
  return `<svg viewBox="0 0 328 136" role="img" aria-label="標本抽出法：単純無作為・層化・クラスターの違い" class="g3-fig-svg">${out}<text x="164" y="132" text-anchor="middle" font-size="9" fill="#64748b">濃い点＝標本に選ばれた個体</text></svg>`;
}
function timeseriesSvgG3(): string {
  const N = 24, x0 = 30, y0 = 16, plotW = 288, plotH = 116;
  const rnd = mulberryRndG3(7);
  const raw: number[] = [];
  for (let t = 0; t < N; t++) raw.push(1 + 0.05 * t + 0.6 * Math.sin((2 * Math.PI * t) / 12) + (rnd() - 0.5) * 0.7);
  const half = 2;
  const ma = raw.map((_, t) => { let s = 0, c = 0; for (let j = -half; j <= half; j++) { if (t + j >= 0 && t + j < N) { s += raw[t + j]; c++; } } return s / c; });
  const all = raw.concat(ma), mn = Math.min(...all), mx = Math.max(...all);
  const sx = (t: number) => x0 + (t / (N - 1)) * plotW;
  const sy = (v: number) => y0 + plotH - ((v - mn) / (mx - mn)) * plotH;
  const rawPoly = raw.map((v, t) => `${sx(t).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const maPoly = ma.map((v, t) => `${sx(t).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
  const dots = raw.map((v, t) => `<circle cx="${sx(t)}" cy="${sy(v)}" r="1.7" fill="#94a3b8" />`).join('');
  return `<svg viewBox="0 0 328 182" role="img" aria-label="時系列：ぎざぎざの生データと、なめらかな移動平均のトレンド線" class="g3-fig-svg">
    <line x1="${x0}" y1="${y0 + plotH}" x2="${x0 + plotW}" y2="${y0 + plotH}" stroke="#cbd5e1" stroke-width="1" />
    <polyline points="${rawPoly}" fill="none" stroke="#94a3b8" stroke-width="1.3" />${dots}
    <polyline points="${maPoly}" fill="none" stroke="var(--primary)" stroke-width="2.8" />
    <line x1="${x0}" y1="${y0 + plotH + 16}" x2="${x0 + 18}" y2="${y0 + plotH + 16}" stroke="#94a3b8" stroke-width="1.3" />
    <text x="${x0 + 22}" y="${y0 + plotH + 19}" font-size="9.5" fill="#64748b">生データ（ノイズ）</text>
    <line x1="${x0 + 150}" y1="${y0 + plotH + 16}" x2="${x0 + 168}" y2="${y0 + plotH + 16}" stroke="var(--primary)" stroke-width="2.8" />
    <text x="${x0 + 172}" y="${y0 + plotH + 19}" font-size="9.5" fill="var(--primary)">移動平均＝トレンド</text>
  </svg>`;
}

const G3_FIGURES: Record<string, string> = {
  'ci': `<figure class="g3-figure">${ciSvgG3()}<figcaption class="g3-fig-cap">「95%信頼区間」の正しい意味。同じ調査を何度も行うと、標本ごとに少しずつ違う区間ができる。このうち<strong>約95%が母平均 μ を含み、約5%（20回に1回ほど）は外す（赤）</strong>。だから「この1本の区間に μ が入る確率が95%」ではなく「この作り方をくり返すと95%の区間が μ を含む」が正確な言い方。</figcaption></figure>`,
  'rejection': `<figure class="g3-figure">${rejectionSvg()}<figcaption class="g3-fig-cap">有意水準5%の両側検定のイメージ。分布の両裾にある赤い部分が<strong>棄却域</strong>（各2.5%）。検定統計量がこの赤い領域に入るほど「偶然では起こりにくい」ので、帰無仮説 H₀ を棄却する。中央の広い部分（採択域）に入れば「偶然の範囲」として H₀ を棄却しない。臨界値がその境目。</figcaption></figure>`,
  'graphtypes': `<figure class="g3-figure">${graphtypesSvg()}<figcaption class="g3-fig-cap">グラフは「何を伝えたいか」で選ぶ。<strong>棒グラフ</strong>は量の大小をくらべる、<strong>円グラフ</strong>は全体に占める割合（構成比）、<strong>折れ線</strong>は時間による変化やトレンド、<strong>散布図</strong>は2つの量の関係を見るのに向く。目的に合わないグラフを選ぶと誤解のもとになる。</figcaption></figure>`,
  'boxplot': `<figure class="g3-figure"><svg viewBox="0 0 360 116" role="img" aria-label="箱ひげ図：最小値・Q1・中央値・Q3・最大値と外れ値。箱の長さがIQR" class="g3-fig-svg">
    <line x1="60" y1="60" x2="110" y2="60" stroke="#64748b" stroke-width="1.5" /><line x1="200" y1="60" x2="250" y2="60" stroke="#64748b" stroke-width="1.5" />
    <line x1="60" y1="47" x2="60" y2="73" stroke="#64748b" stroke-width="1.5" /><line x1="250" y1="47" x2="250" y2="73" stroke="#64748b" stroke-width="1.5" />
    <rect x="110" y="40" width="90" height="40" fill="var(--primary)" fill-opacity="0.15" stroke="var(--primary)" stroke-width="1.6" />
    <line x1="150" y1="40" x2="150" y2="80" stroke="var(--primary)" stroke-width="2.6" />
    <circle cx="300" cy="60" r="4" fill="none" stroke="#dc2626" stroke-width="1.6" />
    <line x1="110" y1="30" x2="200" y2="30" stroke="#94a3b8" stroke-width="1" /><line x1="110" y1="30" x2="110" y2="36" stroke="#94a3b8" stroke-width="1" /><line x1="200" y1="30" x2="200" y2="36" stroke="#94a3b8" stroke-width="1" />
    <text x="155" y="23" text-anchor="middle" font-size="11" font-weight="700" fill="#475569">IQR = Q₃ − Q₁</text>
    <text x="60" y="101" text-anchor="middle" font-size="10" fill="#64748b">最小値</text><text x="110" y="101" text-anchor="middle" font-size="11" font-weight="700" fill="var(--primary)">Q₁</text><text x="150" y="101" text-anchor="middle" font-size="10" font-weight="700" fill="var(--primary)">中央値</text><text x="200" y="101" text-anchor="middle" font-size="11" font-weight="700" fill="var(--primary)">Q₃</text><text x="250" y="101" text-anchor="middle" font-size="10" fill="#64748b">最大値</text><text x="300" y="101" text-anchor="middle" font-size="10" fill="#b91c1c">外れ値</text>
  </svg><figcaption class="g3-fig-cap">箱ひげ図の読み方。箱の左端が Q₁、右端が Q₃ で、箱の長さが四分位範囲 IQR ＝ Q₃−Q₁（中央50%の散らばり）。箱の中の線が中央値。ひげは外れ値を除いた最小値・最大値まで伸び、その外側の点（赤）が外れ値。平均と標準偏差では見えない「分布の形・外れ値」が一目でわかる。</figcaption></figure>`,
  'histshapes': `<figure class="g3-figure">${histshapesSvg()}<figcaption class="g3-fig-cap">ヒストグラムの形で分布の性質が読める。<strong>左右対称</strong>は平均付近に集中（標準的）。<strong>右歪み</strong>は少数の大きな値が裾を引く（年収など）。<strong>左歪み</strong>はその逆（簡単な試験）。<strong>双峰型</strong>は山が2つ＝別グループ（男女など）が混ざっているサイン。</figcaption></figure>`,
  'deviation': `<figure class="g3-figure">${deviationSvg()}<figcaption class="g3-fig-cap">各データと平均10との差が<strong>偏差</strong>（点の上の数）。平均より小さい側が負・大きい側が正で、左右にちょうど打ち消し合うため<strong>偏差の合計は0</strong>になる。だから二乗してから平均する——それが分散。</figcaption></figure>`,
  'skewmean': `<figure class="g3-figure">${skewmeanSvg()}<figcaption class="g3-fig-cap">右に歪んだ分布（少数の大きな値が右の裾を作る）では、山の頂上が<strong>最頻値</strong>、真ん中が<strong>中央値</strong>、裾に引っぱられて右に寄るのが<strong>平均</strong>。この順で「最頻値 ≤ 中央値 ≤ 平均」になる。左右対称の分布なら三つは同じ位置に重なる。</figcaption></figure>`,
  'ogive': `<figure class="g3-figure">${ogiveSvg()}<figcaption class="g3-fig-cap">累積相対度数グラフ（オージャイブ）。横軸は点数（階級の上限）、縦軸はそこまでに全体の何割が入るか。<strong>縦軸の 0.5 から水平にたどり、曲線と交わった点の横軸が中央値</strong>（この例では約66点）。「70点以下は何％か」なども曲線から直接読み取れる。</figcaption></figure>`,
  'sampling': `<figure class="g3-figure">${samplingSvgG3()}<figcaption class="g3-fig-cap"><strong>単純無作為抽出</strong>は母集団全体から等確率でばらばらに選ぶ。<strong>層化抽出</strong>は似た者どうしの層（例：年代）に分けて各層から選び、偏りを抑える。<strong>クラスター抽出</strong>は集団（例：学校・地区）に分け、選んだ集団を丸ごと調べる（コストは低いが精度は下がりやすい）。</figcaption></figure>`,
  'timeseries': `<figure class="g3-figure">${timeseriesSvgG3()}<figcaption class="g3-fig-cap">生データ（灰）は短期のノイズで上下にぎざぎざ揺れて、長期の傾向が見えにくい。各点を「前後数点の平均」に置きかえる移動平均（色つき）を取ると、ノイズが打ち消し合ってなめらかになり、右肩上がりのトレンドがはっきり見える。</figcaption></figure>`,
  'venn': `<figure class="g3-figure"><svg viewBox="0 0 320 172" role="img" aria-label="加法定理のベン図：A∪B は A と B を足して重なり A∩B を引く" class="g3-fig-svg">
    <circle cx="124" cy="84" r="62" fill="var(--primary)" fill-opacity="0.16" stroke="var(--primary)" stroke-width="1.8" /><circle cx="196" cy="84" r="62" fill="#f59e0b" fill-opacity="0.14" stroke="#d97706" stroke-width="1.8" />
    <text x="86" y="62" text-anchor="middle" font-size="17" font-weight="800" fill="var(--primary)">A</text><text x="234" y="62" text-anchor="middle" font-size="17" font-weight="800" fill="#b45309">B</text>
    <text x="160" y="80" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">A∩B</text><text x="160" y="94" text-anchor="middle" font-size="8.5" fill="#64748b">（重なり）</text>
    <text x="160" y="162" text-anchor="middle" font-size="11" font-weight="700" fill="#334155">P(A∪B) ＝ P(A) ＋ P(B) − P(A∩B)</text>
  </svg><figcaption class="g3-fig-cap">「A または B」（A∪B）の確率は、A と B をそのまま足すと重なり A∩B を<strong>二重に数えて</strong>しまう。だから重なりの分 P(A∩B) を1回引く——これが加法定理。A と B が同時に起こらない（排反）なら重なりが無いので、そのまま足せる。</figcaption></figure>`,
};

// 行頭の絵文字マーカーは装飾でなくテキストラベルへ（2026-08-05・O-2-8：
// 生の絵文字グリフはOS/フォント依存で描画が不安定・アクセシビリティ上も弱い。
// 「識別に効くか」は保ったまま絵文字自体を落とす＝色彩系サイトが既に採用しているパターンに合わせる）。
const LINE_MARKERS: Record<string, string> = {
  '💡': 'ヒント',
  '🎯': '試験ポイント',
  '⚠️': '注意',
  '📌': 'まとめ',
  '📖': '発展',
};
// 見出し（### ⚠️ よくある誤解 等）は見出し文自体が既に意味を伝えるため、絵文字だけ剥がす（ラベル追加はしない）。
function stripLeadingMarker(text: string): string {
  const markerKey = Object.keys(LINE_MARKERS).find((mk) => text.startsWith(mk));
  return markerKey ? text.slice(markerKey.length).trim() : text;
}

function mdToHtml(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    const figKeyG3 = t.match(/^\[\[([a-z0-9-]+)\]\]$/);
    if (figKeyG3 && G3_FIGURES[figKeyG3[1]]) { out.push(G3_FIGURES[figKeyG3[1]]); i++; continue; }
    if (t === '' || /^\[\[.*?\]\]$/.test(t)) { i++; continue; }
    if (/^---+$/.test(t)) { out.push('<hr style="border:0;border-top:1px solid #ddd;margin:18px 0">'); i++; continue; }
    if (t.startsWith('#### ')) { out.push(`<h4 style="font-size:1rem;margin:16px 0 6px">${inlineHtml(stripLeadingMarker(t.slice(5)))}</h4>`); i++; continue; }
    if (t.startsWith('### ')) { out.push(`<h3 style="font-size:1.05rem;margin:18px 0 6px">${inlineHtml(stripLeadingMarker(t.slice(4)))}</h3>`); i++; continue; }
    if (t.startsWith('## ')) { out.push(`<h2 style="font-size:1.2rem;margin:22px 0 8px;border-left:4px solid #2563eb;padding-left:10px">${inlineHtml(stripLeadingMarker(t.slice(3)))}</h2>`); i++; continue; }
    if (t.startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(lines[i].trim()); i++; }
      const parsed = rows.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()))
        .filter((cells) => !cells.every((c) => /^:?-+:?$/.test(c) || c === ''));
      if (parsed.length) {
        const [head, ...body] = parsed;
        const th = head.map((c) => `<th style="text-align:left;padding:6px 10px;background:#eff6ff;border-bottom:2px solid #bfdbfe">${inlineHtml(c)}</th>`).join('');
        const trs = body.map((cells) => '<tr>' + cells.map((c) => `<td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top">${inlineHtml(c)}</td>`).join('') + '</tr>').join('');
        out.push(`<div style="overflow-x:auto;margin:14px 0"><table style="border-collapse:collapse;width:100%;font-size:0.92rem"><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table></div>`);
      }
      continue;
    }
    if (/^\d+\.\s/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s/, '')); i++; }
      out.push('<ol style="padding-left:20px">' + items.map((it) => `<li>${inlineHtml(it)}</li>`).join('') + '</ol>');
      continue;
    }
    if (/^[-*]\s/.test(t)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s/, '')); i++; }
      out.push('<ul style="padding-left:20px">' + items.map((it) => `<li>${inlineHtml(it)}</li>`).join('') + '</ul>');
      continue;
    }
    const markerKey = Object.keys(LINE_MARKERS).find((mk) => t.startsWith(mk));
    if (markerKey) {
      const rest = t.slice(markerKey.length).trim();
      // App.tsx と同じ規則：本文が自前の太字ラベルで始まるならそちらを優先し、ラベルの二重表示を防ぐ。
      const own = rest.match(/^\*\*([^*]+[：:])\*\*\s*/);
      const label = own ? own[1].replace(/[：:]$/, '') : LINE_MARKERS[markerKey];
      const body = own ? rest.slice(own[0].length) : rest;
      out.push(`<p style="margin:0 0 12px"><strong style="color:#2563eb">${label}：</strong>${inlineHtml(body)}</p>`); i++; continue;
    }
    out.push(`<p style="margin:0 0 12px">${inlineHtml(t)}</p>`); i++;
  }
  return out.join('\n');
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

  const seoText = mdToHtml(mod.content);
  const pageUrl = `${BASE_URL}/${mod.id}/`;
  const pageTitle = `${mod.title} | 統計検定 3級 学習リファレンス`;

  // クイズスニペット（最初の3問・静的HTMLにも本文として出す）。数式はrenderMathで実描画
  // （2026-08-04・stats-pre1/g2で同型の欠落=$...$未対応を発見・本サイトは現状該当データ無しだが同じ穴を予防）
  const quizSnippet = mod.quiz.slice(0, 3).map((q, qi) => {
    const correctAnswer = q.options[q.correctAnswer];
    const renderInline = (t: string) => t.split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g).map((tok) => {
      if (tok.startsWith('$$') && tok.endsWith('$$') && tok.length >= 4) return renderMath(tok.slice(2, -2), true);
      if (tok.startsWith('$') && tok.endsWith('$') && tok.length >= 2) return renderMath(tok.slice(1, -1), false);
      return escHtml(tok);
    }).join('').replace(/\*\*(.*?)\*\*/g, '$1');
    return `<div style="margin-bottom:12px;padding:12px;background:#f8fafc;border-radius:6px;border-left:3px solid #2563eb">
  <p style="margin:0 0 6px;font-weight:600;color:#1e3a5f">Q${qi + 1}. ${renderInline(q.question)}</p>
  <p style="margin:0;color:#444;font-size:0.92rem">A. ${renderInline(correctAnswer)}</p>
</div>`;
  }).join('\n');
  const quizSnippetHtml = `<section style="margin-top:28px">
  <h2 style="font-size:1.1rem;font-weight:700;margin-bottom:12px;color:#1e3a5f">確認クイズ（抜粋）</h2>
  ${quizSnippet}
  <p style="margin-top:12px;font-size:0.9rem;color:#555">全10問のクイズはサイトのインタラクティブ版でお試しください。</p>
</section>`;

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
  <div style="color:#333">${seoText}</div>
  ${quizSnippetHtml}
  <nav style="margin-top:32px;border-top:1px solid #ddd;padding-top:16px">
    <a href="/stats-g3/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a>
  </nav>
  <p style="font-size:0.8rem;color:#888;margin-top:20px;border-top:1px solid #eee;padding-top:12px">※本サイトは個人による学習支援サイトであり、統計質保証推進協会・日本統計学会の公式サイトではありません。</p>
</article>`;

  modHtml = modHtml.replace('<div id="root"></div>', `<div id="root">${seoContentHtml}</div>`);
  // O-2-10（2026-08-05）：下層ページにBreadcrumbListが欠落していた（LearningResourceのみ）。
  const modJsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'ホーム', 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 2, 'name': chapterNames[mod.chapter] ?? `第${mod.chapter}章`, 'item': `${BASE_URL}/` },
        { '@type': 'ListItem', 'position': 3, 'name': mod.title, 'item': pageUrl }
      ]
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LearningResource',
      'name': mod.title,
      'description': mod.description,
      'url': pageUrl,
      'inLanguage': 'ja',
      'learningResourceType': 'Article',
      'provider': { '@type': 'Organization', 'name': 'study-apps.com', 'url': 'https://study-apps.com' }
    }
  ]);
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
  <p style="color:#555;margin-bottom:24px">統計検定3級の試験概要・学習戦略・推奨リソースをまとめています。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 10px">試験の概要</h2>
  <table style="width:100%;border-collapse:collapse;font-size:0.9rem;margin-bottom:12px">
    <tbody>
      <tr style="border-bottom:1px solid #eee"><td style="padding:6px 0;color:#64748b">実施方式</td><td style="padding:6px 0;text-align:right;font-weight:600">CBT（Computer Based Testing）— 全国のテストセンターで通年受験可</td></tr>
      <tr style="border-bottom:1px solid #eee"><td style="padding:6px 0;color:#64748b">出題形式</td><td style="padding:6px 0;text-align:right;font-weight:600">多肢選択式（コンピュータ画面上で解答）</td></tr>
      <tr style="border-bottom:1px solid #eee"><td style="padding:6px 0;color:#64748b">問題数 / 試験時間</td><td style="padding:6px 0;text-align:right;font-weight:600">${EXAM_CONFIG.questionCount} / ${EXAM_CONFIG.duration}分（1問あたり約2分）</td></tr>
      <tr style="border-bottom:1px solid #eee"><td style="padding:6px 0;color:#64748b">合格基準</td><td style="padding:6px 0;text-align:right;font-weight:600">${EXAM_CONFIG.passingScoreLabel}（概ね${EXAM_CONFIG.passingQuestions}正答が目安）</td></tr>
      <tr style="border-bottom:1px solid #eee"><td style="padding:6px 0;color:#64748b">受験料</td><td style="padding:6px 0;text-align:right;font-weight:600">一般 6,000円 / 学割 4,000円（税込）</td></tr>
      <tr style="border-bottom:1px solid #eee"><td style="padding:6px 0;color:#64748b">電卓</td><td style="padding:6px 0;text-align:right;font-weight:600">持ち込み可（四則演算・ルート・メモリのある一般電卓。関数電卓は不可）</td></tr>
      <tr><td style="padding:6px 0;color:#64748b">再受験</td><td style="padding:6px 0;text-align:right;font-weight:600">前回受験終了から最短1週間後に可</td></tr>
    </tbody>
  </table>
  <p style="color:#166534;background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:0.88rem">3級は「統計リテラシーの入口」を問う試験。公式の丸暗記より、<strong>「なぜその数値が使われるのか」という概念の理解</strong>が合格への近道です。</p>
  <p style="font-size:0.8rem;color:#94a3b8">※ 受験料・試験形式は変更される場合があります。最新情報は<a href="https://www.toukei-kentei.jp/" target="_blank" rel="noopener noreferrer" style="color:#2563eb">統計検定公式サイト</a>でご確認ください。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:24px 0 10px">必要な学習時間の目安</h2>
  <p style="color:#444"><strong>完全初学者（文系・数学未履修）</strong>：30〜60時間（1〜2ヶ月）。中学・高校数学の復習も含む。</p>
  <p style="color:#444"><strong>高校数学既習者</strong>：15〜30時間（2〜4週間）。「データの分析」を理解済みの場合。</p>
  <p style="color:#444"><strong>理系・統計実務経験者</strong>：5〜15時間（1週間程度）。用語の厳密な定義確認と電卓操作が中心。</p>
  <p style="color:#64748b;font-size:0.88rem">※ 平日30〜60分・休日2時間のペースで1〜2ヶ月が標準的。短期集中（1日6時間×5日）でも合格ラインに到達可能ですが、定着度を考えると継続学習が推奨です。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:24px 0 10px">4段階の学習フェーズ</h2>
  <p style="color:#444"><strong>①全体像の把握（鳥瞰）</strong>：まず公式テキストや統計WEBを、計算を飛ばして1周通読する。「統計学で何ができるのか」というビッグピクチャーを掴むことに注力。細かな公式の暗記はこの段階では不要。</p>
  <p style="color:#444"><strong>②現状診断（過去問演習）</strong>：早い段階で過去問を1回分解いて、今の実力と弱点を把握する。CBT特有の「画面で問題を読みながら、手元の紙で計算する」リズムを体感しておくことが重要。</p>
  <p style="color:#444"><strong>③弱点補強と概念の深化</strong>：過去問で間違えた箇所を重点的に再学習。「標準偏差は何を意味するのか」「相関係数が0でも関係がないわけではない」など、数式を言葉で説明できるレベルまで深める。</p>
  <p style="color:#444"><strong>④アウトプットの高速化</strong>：公式問題集を繰り返し演習して、1問2分以内で解けるスピードを身につける。電卓のメモリ機能も反射的に使えるよう練習しておく。時間不足が最大の敵。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:24px 0 10px">推奨書籍</h2>
  <p style="color:#444"><strong>改訂版 統計検定3級対応 データの分析</strong>★★★★★必須：公式テキスト。試験範囲を網羅。辞書的に使うのが◎。まず通読して全体像を掴む。</p>
  <p style="color:#444"><strong>統計検定3級・4級 公式問題集（CBT対応版）</strong>★★★★★必須：唯一の公式問題集。解説が試験の「読み方」を教えてくれる。3周が目安。</p>
  <p style="color:#444"><strong>マンガでわかる統計学</strong>★★★★☆入門：概念の直感的理解に最適。数式への抵抗感がある人の入口として有効。挫折防止に。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:24px 0 10px">おすすめリソース</h2>
  <p style="color:#444"><strong>統計WEB「統計学の時間」（BC Learning）</strong>：初学者のための定番サイト。ステップ形式で3級の全範囲をわかりやすく解説。「聖書」と呼ぶ受験生も多い。</p>
  <p style="color:#444"><strong>Udemy「統計学入門コース」</strong>：約5.5時間の視聴で3級に必要な統計学を体系的にインプットできる。耳と目で学べるため、テキストが苦手な人に特に有効。</p>
  <p style="color:#444"><strong>オモワカ統計 / データサイエンスLab.</strong>（YouTube）：電卓の操作テクニックや、試験頻出ポイントを解説。隙間時間の活用に最適。</p>
  <p style="color:#444"><strong>生成AI（ChatGPT / Claude）</strong>：「中学生でもわかるように数式なしで説明して」と依頼すると抽象的な概念の理解が加速。24時間対応の個別指導として活用できる。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:24px 0 10px">重要出題分野</h2>
  <p style="color:#444"><strong>［最重要］グラフの読み取りと統計量の計算</strong>：ヒストグラム・箱ひげ図・散布図の読み取り、平均・標準偏差・四分位範囲の計算。毎回必ず出題される基礎中の基礎。</p>
  <p style="color:#444"><strong>［最重要］確率の計算</strong>：加法定理・条件付き確率・独立性・組合せの計算。素直な計算問題が多く確実に得点したいエリア。</p>
  <p style="color:#444"><strong>［重要］正規分布・標準化</strong>：Z = (X−μ)/σ の計算と標準正規分布表の読み取り。「μ±σの範囲に約68%」などの経験則も問われる。</p>
  <p style="color:#444"><strong>［重要］データの尺度と変数の種類</strong>：名義・順序・間隔・比例尺度の区分。それぞれの尺度で使える統計量（代表値・散布度）の適切な選択。</p>
  <p style="color:#444"><strong>［重要］相関係数と回帰直線</strong>：相関係数 r の値域・性質・因果との区別、回帰係数の解釈と予測計算。擬似相関・外挿の危険性も頻出。</p>
  <p style="color:#444"><strong>［標準］時系列データと指数</strong>：4変動成分（趨勢・循環・季節・不規則）の識別と移動平均の計算。指数の読み方。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:24px 0 10px">本番に向けた実践アドバイス</h2>
  <p style="color:#444"><strong>1問2分のペース配分</strong>：60分・30問で1問平均2分。グラフ読み取りや定義問題など計算不要な問題を素早く片付け、計算問題に時間を残す。詰まったらフラグを付けて次へ進む。</p>
  <p style="color:#444"><strong>電卓のメモリ機能を練習する</strong>：M+で偏差の二乗を加算し、MRで合計を呼び出すと分散の計算が大幅に速くなる。MCでリセットを忘れずに。本番前に必ず操作練習をしておく。</p>
  <p style="color:#444"><strong>CBTの画面操作に慣れる</strong>：統計数値表は別ウィンドウで開く形式。画面と手元の計算用紙を往復しながら解くリズムを事前に練習しておく。試験開始時に文字サイズ調整も忘れずに。</p>
  <p style="color:#444"><strong>用語の定義を正確に覚える</strong>：「信頼区間は母平均が含まれる確率ではない」「排反と独立は別の概念」など、紛らわしい定義の引っかけ問題が多い。言葉の意味を正確に押さえておく。</p>
  <p style="color:#444"><strong>CBT会場の環境に動じない準備をする</strong>：テストセンターは様々な試験の受験者が混在するマルチ会場。他の受験者の入退室やキーボード操作音が気になることがある。日常の学習を静かすぎる環境だけで行わず、ある程度の雑音下でも集中する練習をしておくと本番に強くなる。</p>
  <p style="color:#166534;background:#f0fdf4;border-radius:8px;padding:10px 12px;font-size:0.88rem">このサイトの学習リファレンスは、3級の試験範囲に沿って構成されています。各モジュールの理解度チェックで定着を確認しながら進めましょう。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:24px 0 10px">合格後の展望</h2>
  <p style="color:#444"><strong>2級へのステップアップ</strong>：3級合格後は速やかに2級への挑戦を検討したい。2級では、3級で学んだ「記述統計」を土台として、母集団のパラメータを標本から推論する「推測統計（仮説検定・区間推定）」が本格的に導入される。3級の内容を「他者に教えられるレベル」まで理解していれば、2級の学習効率は飛躍的に高まる。</p>
  <p style="color:#444"><strong>実務への応用と意思決定の質的向上</strong>：統計学の真価は検定合格そのものではなく、実社会の不確実な事象を「確率と統計」というレンズを通してクリアにすることにある。標準偏差や相関係数の概念を売上分析や顧客行動の把握に適用し、エビデンスに基づく提案（Evidence-Based Management）を実践することが資格取得の真の目的である。</p>

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
    <p style="color:#444">本サイトは、統計質保証推進協会および日本統計学会の公式サイトではありません。試験の出題範囲・申込方法・合否については、必ず公式サイトをご確認ください。本サイトのコンテンツは学習目的で作成されたものであり、内容の正確性・完全性を保証するものではありません。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">2. Google Analytics の利用について</h2>
    <p style="color:#444">本サイトでは、アクセス状況を把握するために <strong>Google Analytics</strong>（Google LLC 提供）を使用しています。</p>
    <p style="color:#444"><strong>送信される情報の例：</strong>閲覧したページのURL・滞在時間・使用デバイス・おおまかな地域情報（IPアドレスから推定）など。これらの情報はCookieを通じてGoogleのサーバーに送信されます。個人を特定する情報は収集しません。</p>
    <p style="color:#444"><strong>利用目的：</strong>コンテンツ改善のためのアクセス分析</p>
    <p style="color:#444"><strong>オプトアウト：</strong><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style="color:#2563eb">Google アナリティクス オプトアウト アドオン</a>をインストールすることで、データ送信を無効にできます。</p>
    <p style="color:#444">Googleのプライバシーポリシーは<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style="color:#2563eb">こちら</a>をご参照ください。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">3. Google AdSense の利用について</h2>
    <p style="color:#444">本サイトでは、広告配信のために <strong>Google AdSense</strong>（Google LLC 提供）を使用しています。</p>
    <p style="color:#444"><strong>送信される情報の例：</strong>閲覧履歴・Cookieに保存された識別情報など。これらは広告のパーソナライズ（行動ターゲティング）に使用されます。</p>
    <p style="color:#444"><strong>利用目的：</strong>サイト運営費用の確保</p>
    <p style="color:#444"><strong>オプトアウト：</strong><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style="color:#2563eb">広告設定ページ</a>でパーソナライズ広告を無効にできます。また、<a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style="color:#2563eb">Digital Advertising Alliance</a> のオプトアウトツールもご利用いただけます。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">4. Cookieについて</h2>
    <p style="color:#444">本サイトでは、Google Analytics および Google AdSense の機能提供のためにCookieを使用しています。ブラウザの設定からCookieを無効にすることができますが、一部機能が正常に動作しない場合があります。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">5. 学習進捗データについて</h2>
    <p style="color:#444">クイズの得点・完了状況は、お使いのブラウザの <strong>ローカルストレージ</strong> にのみ保存されます。このデータは外部サーバーへ送信されることはなく、運営者も閲覧できません。ブラウザのデータ削除により消去されます。</p>
  </section>
  <section style="margin-bottom:24px">
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">6. コンテンツの免責事項</h2>
    <p style="color:#444">本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。また、本サイトは統計検定への合格を保証するものではありません。</p>
  </section>
  <section>
    <h2 style="font-size:1.15rem;font-weight:700;margin-bottom:8px">7. 本ポリシーの変更</h2>
    <p style="color:#444">本ポリシーは予告なく変更される場合があります。変更後のポリシーはこのページへの掲載をもって効力を生じます。</p>
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

  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: config.title,
    description: config.description,
    url: pageUrl,
    inLanguage: 'ja',
    isPartOf: { '@type': 'WebSite', name: '統計検定 3級 学習リファレンス', url: `${BASE_URL}/` },
  };
  pageHtml = pageHtml.replace('</head>', `<script type="application/ld+json">${JSON.stringify(pageJsonLd)}</script>\n  </head>`);

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

import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="12" height="630" fill="#fbbf24"/>

  <text x="80" y="200" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="68" font-weight="700" fill="#ffffff">統計検定 3級</text>
  <text x="80" y="280" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="44" font-weight="600" fill="#dbeafe">学習リファレンス</text>

  <text x="80" y="380" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="24" fill="#bfdbfe">高校レベルのデータ整理・確率・推測の基礎を</text>
  <text x="80" y="416" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="24" fill="#bfdbfe">13モジュール+確認クイズで学べる無料サイト</text>

  <line x1="80" y1="500" x2="700" y2="500" stroke="#60a5fa" stroke-width="2"/>

  <text x="80" y="550" font-family="'Hiragino Kaku Gothic ProN','Hiragino Sans','Yu Gothic',Meiryo,sans-serif" font-size="22" fill="#93c5fd" font-weight="600">study-apps.com/stats-g3/</text>
</svg>`;

async function main() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const outPath = path.join(PUBLIC_DIR, 'ogp.png');
  await sharp(Buffer.from(svg)).png().toFile(outPath);
  console.log(`✓ Generated ogp.png (1200x630) at ${outPath}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

// 統計手法の使い分けガイド（早見表）の本文。
// prerender.ts（静的HTML＝クローラー用）と App.tsx（クライアント描画）の両方から
// import する単一ソース。base は '/stats-g3' または '' を渡す。
export function buildUsecaseHtml(base: string): string {
  const wrapOpen = '<div style="overflow-x:auto;margin:8px 0 20px"><table style="border-collapse:collapse;width:100%;min-width:520px">';
  const wrapClose = '</table></div>';
  const th = (t: string) => `<th style="text-align:left;padding:8px 10px;background:#eff6ff;border:1px solid #bfdbfe;font-size:0.9rem;white-space:nowrap">${t}</th>`;
  const td = (t: string) => `<td style="padding:8px 10px;border:1px solid #e5e7eb;font-size:0.9rem;color:#444">${t}</td>`;
  const lk = (id: string, label: string) => `<a href="${base}/${id}/" style="color:#2563eb;text-decoration:none">${label}</a>`;
  const row = (cells: string[]) => `<tr>${cells.map(td).join('')}</tr>`;
  return `<div style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:10px 16px;font-size:0.88rem;text-align:center;margin-bottom:16px;border-radius:6px;max-width:860px;margin-left:auto;margin-right:auto"><a href="https://study-apps.com/" style="color:#1e3a8a;text-decoration:none;font-weight:600">← study-apps.com 学習サイト集トップへ</a></div><article id="static-fallback" style="font-family:sans-serif;line-height:1.7;max-width:860px;margin:0 auto;padding:24px 16px">
  <nav style="margin-bottom:16px"><a href="${base}/" style="color:#2563eb;text-decoration:none">← ホームへ戻る</a></nav>
  <h1 style="font-size:1.6rem;font-weight:700;border-bottom:2px solid #2563eb;padding-bottom:8px;margin-bottom:20px">統計手法の使い分けガイド</h1>
  <p style="color:#555;margin-bottom:24px">統計検定3級の範囲で「このデータ・この目的には、どのまとめ方／どのグラフ／どの分布・手法を使うか」を逆引きできる早見表です。各行は本サイトの対応モジュールにリンクしています。個別の解説はリンク先で、ここでは<strong>目的から手法を選ぶ視点</strong>を整理します。</p>

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">1. データのまとめ方・見せ方</h2>
  <p style="color:#444;margin-bottom:4px">「何を知りたいか」から、まとめ方やグラフを選びます。</p>
  ${wrapOpen}<thead><tr>${th('目的')}${th('使う手法')}${th('参照')}</tr></thead><tbody>
  ${row(['データの中心を1つの数で表す', '平均値・中央値・最頻値（外れ値が多いときは中央値）', lk('1.1-descriptive','1.1')])}
  ${row(['データのばらつきを表す', '分散・標準偏差・四分位範囲', lk('1.1-descriptive','1.1')])}
  ${row(['分布の形を視覚的に見る', 'ヒストグラム・箱ひげ図', lk('1.2-visualization','1.2')])}
  ${row(['2つの量の関係を見る', '散布図・相関係数', lk('1.5-correlation','1.5')])}
  ${row(['時間にそった変化を読む', '折れ線グラフ・移動平均', lk('1.4-timeseries','1.4')])}
  ${row(['偏りなくデータを集める', '標本調査・実験の設計', lk('1.3-data-collection','1.3')])}
  </tbody>${wrapClose}

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">2. 確率・分布の選び方</h2>
  <p style="color:#444;margin-bottom:4px">「どんな現象か」から、当てはめる分布を選びます。</p>
  ${wrapOpen}<thead><tr>${th('状況')}${th('使うもの')}${th('参照')}</tr></thead><tbody>
  ${row(['起こりやすさを数で表す', '確率（場合の数・余事象）', lk('2.1-probability','2.1')])}
  ${row(['n回の試行での成功回数', '二項分布', lk('3.1-discrete','3.1')])}
  ${row(['連続量で左右対称・釣鐘型に分布する量', '正規分布', lk('3.2-continuous','3.2')])}
  ${row(['標本平均・標本比率の分布（大標本）', '正規分布で近似（中心極限定理）', lk('3.3-clt','3.3')])}
  </tbody>${wrapClose}

  <h2 style="font-size:1.2rem;font-weight:700;margin:20px 0 8px">3. 推測（推定・検定・予測）の選び方</h2>
  <p style="color:#444;margin-bottom:4px">「標本から母集団について何を言いたいか」で選びます。</p>
  ${wrapOpen}<thead><tr>${th('知りたいこと')}${th('使う手法')}${th('参照')}</tr></thead><tbody>
  ${row(['母平均を区間で見積もる', '母平均の推定（区間推定）', lk('4.1-estimation','4.1')])}
  ${row(['母比率を見積もる・調べる', '母比率の推定・検定', lk('4.4-proportion','4.4')])}
  ${row(['差や効果があると言えるか判断する', '仮説検定', lk('4.2-testing','4.2')])}
  ${row(['ある変数から別の変数を予測する', '回帰分析（最小二乗法）', lk('5.1-regression','5.1')])}
  </tbody>${wrapClose}

  <p style="margin-top:8px;font-size:0.85rem;color:#888">※ 早見表は典型的な対応を示すものです。データの種類（質的・量的）や標本の大きさによって適切な手法は変わります。詳細は各モジュールをご確認ください。</p>
  <p style="margin-top:16px"><a href="${base}/" style="color:#2563eb">← ホームへ戻る</a></p>
</article>`;
}

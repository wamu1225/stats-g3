// stats-app/src/components/MathDisplay.tsx
import React, { useMemo } from 'react';
import katex from 'katex';
import { Info } from 'lucide-react';

interface Props {
  formula: string;
  block?: boolean;
  /** このモジュール内で既に解説済みの記号（再掲を防ぐ）。渡された場合、初出の記号だけをガイドに表示し、
   *  表示した記号をこのSetへ書き足す。モジュール切り替え時に呼び出し側でリセットすること。 */
  shownSymbols?: Set<string>;
}

const symbolGuide: Record<string, { label: string; desc: string }> = {
  '\\mu': { label: 'μ (ミュー)', desc: '平均値。データの中心。' },
  '\\sigma^2': { label: 'σ² (シグマ二乗)', desc: '分散。ばらつきの大きさ。' },
  '\\sigma': { label: 'σ (シグマ)', desc: '標準偏差。ばらつきの尺度。' },
  '\\pi': { label: 'π (パイ)', desc: '円周率。' },
  'e': { label: 'e (ネイピア数)', desc: '自然対数の底。' },
  'x': { label: 'x (エックス)', desc: '観測値。' },
  'n': { label: 'n', desc: 'サンプルサイズ。データの数。' },
  '\\beta': { label: 'β (ベータ)', desc: '回帰係数。影響の強さ。' },
  '\\epsilon': { label: 'ε (イプシロン)', desc: '誤差項。' }
};

export const MathDisplay: React.FC<Props> = ({ formula, block, shownSymbols }) => {
  const html = useMemo(() => {
    try {
      return katex.renderToString(formula, {
        displayMode: block,
        throwOnError: false,
        output: 'html' // Ensure HTML output
      });
    } catch (e) {
      console.error('KaTeX rendering error:', e);
      return formula;
    }
  }, [formula, block]);

  // 記号の抽出：\mu 等のコマンド記号はそのまま含有判定。
  // 単一文字（e, x, n）は、\text や \frac 等のコマンド名に含まれる文字を誤検出しないよう、
  // コマンドを除去したうえで「独立した変数として現れる」場合だけ拾う（範囲=最大値−最小値 に e・x が出た不具合の修正）。
  const strippedFormula = formula.replace(/\\[a-zA-Z]+/g, ' ');
  const activeSymbols = Object.keys(symbolGuide).filter(s =>
    s.startsWith('\\')
      ? formula.includes(s)
      : new RegExp(`(^|[^a-zA-Z])${s}([^a-zA-Z]|$)`).test(strippedFormula)
  );
  // 同じモジュール内で既に解説した記号は再掲しない（式ごとに同じ「x: 観測値」等が繰り返される重複を解消）。
  const newSymbols = shownSymbols ? activeSymbols.filter(s => !shownSymbols.has(s)) : activeSymbols;
  newSymbols.forEach(s => shownSymbols?.add(s));

  if (!block) {
    return (
      <span 
        className="katex-inline"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  }

  return (
    <div className="math-block-container" style={{ margin: '1rem 0' }}>
      <div 
        className="katex-display"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
      
      {newSymbols.length > 0 && (
        <div className="symbol-guide" style={{
          marginTop: '1rem',
          background: '#f8fafc',
          padding: '0.75rem',
          borderRadius: '0.5rem',
          fontSize: '0.75rem',
          border: '1px dashed #cbd5e1',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
            <Info size={14} /> 記号の解説
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
            {newSymbols.map(s => (
              <div key={s}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{symbolGuide[s].label}</span>: 
                <span style={{ color: 'var(--text-muted)' }}> {symbolGuide[s].desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// src/components/ExamGuide.tsx  (stats-g3)
import React from 'react';
import { Target, BookOpen, Clock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const ExamGuide: React.FC = () => (
  <div className="privacy-page" style={{ maxWidth: '700px' }}>
    <h2 style={{ color: 'var(--primary)' }}>統計検定 3級 試験ガイド</h2>
    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
      ※ 最新情報は必ず統計質保証推進協会の公式サイトでご確認ください。
    </p>

    <section>
      <h3><Target size={16} style={{ display: 'inline', marginRight: '6px' }} />試験概要</h3>
      <ul style={{ fontSize: '0.9rem', lineHeight: 2 }}>
        <li><strong>出題形式：</strong>多肢選択式（マークシート）</li>
        <li><strong>問題数：</strong>30問程度</li>
        <li><strong>試験時間：</strong>60分</li>
        <li><strong>合格基準：</strong>概ね 70% 以上の正答率</li>
        <li><strong>受験資格：</strong>なし（誰でも受験可能）</li>
        <li><strong>対象レベル：</strong>高校数学の基礎（数学Ⅰ程度）</li>
      </ul>
    </section>

    <section>
      <h3><BookOpen size={16} style={{ display: 'inline', marginRight: '6px' }} />出題範囲</h3>
      <div style={{ fontSize: '0.875rem', lineHeight: 1.8 }}>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '1rem', marginBottom: '0.75rem' }}>
          <strong style={{ color: 'var(--primary)' }}>Chapter 1：データの整理</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
            <li>データの種類（量的・質的、離散・連続）</li>
            <li>代表値（平均・中央値・最頻値）</li>
            <li>散布度（分散・標準偏差・四分位範囲）</li>
            <li>ヒストグラム・箱ひげ図・散布図</li>
            <li>相関係数の読み方</li>
          </ul>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '1rem', marginBottom: '0.75rem' }}>
          <strong style={{ color: 'var(--primary)' }}>Chapter 2：確率の基礎</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
            <li>確率の定義・加法定理・余事象</li>
            <li>条件付き確率・独立性</li>
            <li>順列・組合せの数え方</li>
          </ul>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '1rem', marginBottom: '0.75rem' }}>
          <strong style={{ color: 'var(--primary)' }}>Chapter 3：確率分布</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
            <li>期待値・分散の意味と計算</li>
            <li>二項分布の特徴・計算</li>
            <li>正規分布・標準化・標準正規分布表の使い方</li>
          </ul>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.75rem', padding: '1rem' }}>
          <strong style={{ color: 'var(--primary)' }}>Chapter 4：統計的推測の入門</strong>
          <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.25rem' }}>
            <li>母集団・標本・無作為抽出の概念</li>
            <li>標本平均の分布・標準誤差</li>
            <li>信頼区間の意味（概念レベル）</li>
            <li>仮説検定の考え方（概念レベル）</li>
          </ul>
        </div>
      </div>
    </section>

    <section>
      <h3><Clock size={16} style={{ display: 'inline', marginRight: '6px' }} />推奨学習スケジュール</h3>
      <div style={{ fontSize: '0.875rem' }}>
        {[
          { week: '第1〜2週', task: 'Chapter 1「データの整理」完走 → クイズ全問正解目標' },
          { week: '第3週', task: 'Chapter 2「確率の基礎」完走 → 加法定理・条件付き確率を完全理解' },
          { week: '第4週', task: 'Chapter 3「確率分布」完走 → 二項分布・正規分布を計算で使いこなす' },
          { week: '第5週', task: 'Chapter 4「統計的推測」完走 → 概念を押さえる' },
          { week: '第6週〜', task: '全範囲クイズで弱点補強 → 過去問演習' },
        ].map(({ week, task }) => (
          <div key={week} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <span style={{ minWidth: '80px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', paddingTop: '2px' }}>{week}</span>
            <span style={{ flex: 1, lineHeight: 1.5 }}>{task}</span>
          </div>
        ))}
      </div>
    </section>

    <section>
      <h3><FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />3級で必ず覚える公式</h3>
      <div style={{ fontSize: '0.875rem', lineHeight: 2 }}>
        <div style={{ background: '#f8fafc', borderRadius: '0.75rem', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem' }}>
          <div style={{ marginBottom: '0.5rem' }}><strong>平均：</strong> x̄ = Σxᵢ / n</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>分散：</strong> s² = Σ(xᵢ − x̄)² / n</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>標準偏差：</strong> s = √s²</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>加法定理：</strong> P(A∪B) = P(A) + P(B) − P(A∩B)</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>余事象：</strong> P(Aᶜ) = 1 − P(A)</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>条件付き確率：</strong> P(A|B) = P(A∩B) / P(B)</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>二項分布：</strong> E[X] = np、V[X] = np(1−p)</div>
          <div style={{ marginBottom: '0.5rem' }}><strong>標準化：</strong> Z = (X − μ) / σ</div>
        </div>
      </div>
    </section>

    <section>
      <h3><CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px' }} />よくある試験の落とし穴</h3>
      <ul style={{ fontSize: '0.875rem', lineHeight: 2 }}>
        <li>分散と標準偏差の単位の違い（分散はデータの単位の二乗）</li>
        <li>加法定理でP(A∩B)の引き忘れ</li>
        <li>「排反」と「独立」の混同</li>
        <li>標準化のZスコアの計算符号ミス</li>
        <li>標準正規分布表の読み方（上側・下側の区別）</li>
      </ul>
    </section>

    <section>
      <h3><AlertCircle size={16} style={{ display: 'inline', marginRight: '6px' }} />免責事項</h3>
      <p className="privacy-disclaimer">
        ⚠️ 本サイトは統計質保証推進協会・日本統計学会の公式サイトではありません。
        試験の出題範囲・申込方法・合否については必ず公式サイトをご確認ください。
      </p>
    </section>
  </div>
);

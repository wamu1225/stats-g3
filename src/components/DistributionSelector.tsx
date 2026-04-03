// src/components/DistributionSelector.tsx  (stats-g3)
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, HelpCircle } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  options: { label: string; nextId: string | null; result?: string }[];
}

const flow: Record<string, Question> = {
  start: {
    id: 'start',
    text: '知りたいことはどれですか？',
    options: [
      { label: 'データの整理・グラフの読み方を学びたい', nextId: 'desc' },
      { label: '確率の計算を学びたい', nextId: 'prob' },
      { label: '確率分布（正規・二項）を理解したい', nextId: 'dist' },
      { label: '推定・検定の基礎を知りたい', nextId: 'infer' },
    ]
  },
  desc: {
    id: 'desc',
    text: 'どのテーマですか？',
    options: [
      { label: '平均・分散・標準偏差', nextId: null, result: '1.1-descriptive' },
      { label: 'ヒストグラム・散布図・相関', nextId: null, result: '1.2-visualization' },
      { label: '度数分布・相対度数', nextId: null, result: '1.1-descriptive' },
    ]
  },
  prob: {
    id: 'prob',
    text: '確率のどのテーマですか？',
    options: [
      { label: '確率の定義・加法定理・余事象', nextId: null, result: '2.1-probability' },
      { label: '条件付き確率・独立', nextId: null, result: '2.2-conditional' },
      { label: '順列・組合せの数え方', nextId: null, result: '2.3-counting' },
    ]
  },
  dist: {
    id: 'dist',
    text: 'どの確率分布ですか？',
    options: [
      { label: '二項分布（コイン・良品検査など）', nextId: null, result: '3.1-binomial' },
      { label: '正規分布・標準化', nextId: null, result: '3.2-normal' },
    ]
  },
  infer: {
    id: 'infer',
    text: 'どのテーマですか？',
    options: [
      { label: '標本と母集団・標本平均の分布', nextId: null, result: '4.1-sampling' },
      { label: '推定（信頼区間）の基礎', nextId: null, result: '4.2-estimation' },
      { label: '検定（仮説検定）の入門', nextId: null, result: '4.3-testing' },
    ]
  },
};

interface Props {
  onSelect: (id: string) => void;
}

export const DistributionSelector: React.FC<Props> = ({ onSelect }) => {
  const [currentId, setCurrentId] = useState('start');
  const [history, setHistory] = useState<string[]>([]);

  const handleOption = (nextId: string | null, result?: string) => {
    if (result) {
      onSelect(result);
    } else if (nextId) {
      setHistory([...history, currentId]);
      setCurrentId(nextId);
    }
  };

  const handleBack = () => {
    const prev = history[history.length - 1];
    if (prev) {
      setCurrentId(prev);
      setHistory(history.slice(0, -1));
    }
  };

  const current = flow[currentId];

  return (
    <div className="card" style={{ background: 'var(--primary)', color: 'white', border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Search size={20} />
        <h3 style={{ margin: 0 }}>目的から探す（逆引き診断）</h3>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentId}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
        >
          <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>{current.text}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {current.options.map((opt, i) => (
              <button
                key={i}
                className="btn"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
                onClick={() => handleOption(opt.nextId, opt.result)}
              >
                <span>{opt.label}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {history.length > 0 && (
        <button
          onClick={handleBack}
          style={{
            marginTop: '1.5rem',
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.875rem',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          前の質問に戻る
        </button>
      )}

      <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem', display: 'flex', gap: '0.5rem', color: 'rgba(255,255,255,0.8)' }}>
        <HelpCircle size={14} />
        <span>知りたい内容を選ぶだけで、適切な学習コンテンツへ導きます。</span>
      </div>
    </div>
  );
};

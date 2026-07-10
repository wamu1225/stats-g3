// src/components/InteractiveGraph.tsx  (stats-g3)
import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar } from 'recharts';

interface Props {
  type: string;
  renderContent?: (text: string) => React.ReactNode;
}

// --- 正規分布 ---
function NormalGraph() {
  const [mean, setMean] = useState(0);
  const [sd, setSd] = useState(1);
  const data = Array.from({ length: 81 }, (_, i) => {
    const x = -4 + i * 0.1;
    const y = Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));
    return { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(4)) };
  });
  return (
    <div className="interactive-graph">
      <div className="slider-row">
        <label>平均 μ = {mean}</label>
        <input type="range" min="-2" max="2" step="0.5" value={mean} onChange={e => setMean(Number(e.target.value))} />
        <label>標準偏差 σ = {sd}</label>
        <input type="range" min="0.5" max="2.5" step="0.5" value={sd} onChange={e => setSd(Number(e.target.value))} />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <XAxis dataKey="x" tickFormatter={v => v.toFixed(1)} />
          <YAxis />
          <Tooltip formatter={(v) => typeof v === 'number' ? v.toFixed(4) : String(v)} />
          <Area type="monotone" dataKey="y" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.15} dot={false} />
          <ReferenceLine x={mean} stroke="var(--primary)" strokeDasharray="3 3" label="μ" />
        </AreaChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        μ±1σ に約68%、μ±2σ に約95%のデータが入ります
      </p>
    </div>
  );
}

// --- 二項分布 ---
function BinomialGraph() {
  const [n, setN] = useState(10);
  const [p, setP] = useState(0.5);

  const binom = useCallback((n: number, k: number) => {
    let result = 1;
    for (let i = 0; i < k; i++) result = result * (n - i) / (i + 1);
    return result;
  }, []);

  const data = Array.from({ length: n + 1 }, (_, k) => ({
    k,
    prob: parseFloat((binom(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k)).toFixed(4))
  }));
  const mean = (n * p).toFixed(2);
  const variance = (n * p * (1 - p)).toFixed(2);

  return (
    <div className="interactive-graph">
      <div className="slider-row">
        <label>試行回数 n = {n}</label>
        <input type="range" min="5" max="20" step="1" value={n} onChange={e => setN(Number(e.target.value))} />
        <label>成功確率 p = {p}</label>
        <input type="range" min="0.1" max="0.9" step="0.1" value={p} onChange={e => setP(Number(e.target.value))} />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="k" label={{ value: '成功回数 k', position: 'insideBottom', offset: -5 }} />
          <YAxis />
          <Tooltip formatter={(v) => typeof v === 'number' ? v.toFixed(4) : String(v)} />
          <Bar dataKey="prob" fill="var(--primary)" fillOpacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        期待値 = np = {mean}　分散 = np(1-p) = {variance}
      </p>
    </div>
  );
}

// --- ヒストグラム（サンプルサイズ変化）---
function HistogramGraph() {
  const [n, setN] = useState(30);
  const seed = 42;
  const lcg = (s: number) => { let x = s; return () => { x = (1664525 * x + 1013904223) >>> 0; return x / 4294967296; }; };
  const rng = lcg(seed);
  const samples = Array.from({ length: n }, () => {
    // Box-Muller
    const u1 = rng(), u2 = rng();
    return parseFloat((Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)).toFixed(2));
  });
  const bins = [-3, -2.5, -2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2, 2.5, 3];
  const data = bins.slice(0, -1).map((b, i) => ({
    range: `${b}`,
    count: samples.filter(x => x >= b && x < bins[i + 1]).length
  }));
  return (
    <div className="interactive-graph">
      <div className="slider-row">
        <label>サンプルサイズ n = {n}</label>
        <input type="range" min="10" max="200" step="10" value={n} onChange={e => setN(Number(e.target.value))} />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <XAxis dataKey="range" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="var(--primary)" fillOpacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        n を増やすほど正規分布の形に近づきます（中心極限定理）
      </p>
    </div>
  );
}

// --- 散布図・相関 ---
function ScatterGraph() {
  const [r, setR] = useState(0.8);
  const seed = 123;
  const lcg = (s: number) => { let x = s; return () => { x = (1664525 * x + 1013904223) >>> 0; return x / 4294967296; }; };
  const rng = lcg(seed);
  const bm = () => {
    const u1 = rng() + 0.0001, u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
  const data = Array.from({ length: 50 }, () => {
    const x = bm();
    const y = r * x + Math.sqrt(1 - r * r) * bm();
    return { x: parseFloat(x.toFixed(2)), y: parseFloat(y.toFixed(2)) };
  });
  return (
    <div className="interactive-graph">
      <div className="slider-row">
        <label>相関係数 r = {r}</label>
        <input type="range" min="-1" max="1" step="0.1" value={r} onChange={e => setR(Number(e.target.value))} />
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data.sort((a, b) => a.x - b.x)}>
          <XAxis dataKey="x" tickFormatter={v => v.toFixed(1)} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="y" stroke="none" dot={{ fill: 'var(--primary)', r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        r が +1 に近いほど右上がり、-1 に近いほど右下がりになります
      </p>
    </div>
  );
}

export const InteractiveGraph: React.FC<Props> = ({ type }) => {
  switch (type) {
    case 'normal': return <NormalGraph />;
    case 'binomial': return <BinomialGraph />;
    case 'histogram': return <HistogramGraph />;
    case 'scatter': return <ScatterGraph />;
    // モジュールが使う型名を実在するグラフへ対応づける（未対応だと null で描画されず空になる）
    case 'regression': return <ScatterGraph />;   // 回帰＝散布図・相関で可視化
    case 't': return <NormalGraph />;              // 検定＝分布を可視化（暫定。将来的に棄却域つき図へ）
    default: return null;
  }
};

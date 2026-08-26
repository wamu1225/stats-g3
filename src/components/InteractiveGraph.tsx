// src/components/InteractiveGraph.tsx  (stats-g3)
import React, { useState, useCallback } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, BarChart, Bar, ScatterChart, Scatter, ZAxis } from 'recharts';

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

// --- 信頼区間の意味 ---
// 初学者が最も取り違えるのは「95%の確率で母平均がこの区間に入る」という読み方。
// 母平均は動かない定数で、標本ごとに動くのは区間の方。
// 20回の標本抽出を並べ、母平均の線を外す区間が出ることを見せる。
function ConfidenceIntervalGraph() {
  const MU = 168, SIGMA = 6;
  const [n, setN] = useState(30);
  const [seed, setSeed] = useState(0);

  // Box-Muller。seed から決まる擬似乱数なので、同じ seed なら同じ図になる（再現可能）。
  const draw = useCallback((k: number, size: number) => {
    let s = (k * 9301 + 49297) % 233280;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    let sum = 0;
    for (let i = 0; i < size; i++) {
      const u1 = Math.max(rnd(), 1e-9), u2 = rnd();
      sum += MU + SIGMA * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
    return sum / size;
  }, []);

  const se = SIGMA / Math.sqrt(n);
  const half = 1.96 * se;
  const trials = Array.from({ length: 20 }, (_, i) => {
    const xbar = draw(seed * 1000 + i * 37 + 11, n);
    return { xbar, lo: xbar - half, hi: xbar + half, hit: xbar - half <= MU && MU <= xbar + half };
  });
  const missed = trials.filter((t) => !t.hit).length;

  const W = 360, rowH = 17, padT = 28, padB = 46, padL = 34, padR = 14;
  const H = padT + rowH * 20 + padB;
  const span = Math.max(6, 1.96 * (SIGMA / Math.sqrt(10)) + 2);
  const X = (v: number) => padL + ((v - (MU - span)) / (2 * span)) * (W - padL - padR);

  return (
    <div className="interactive-graph">
      <div className="slider-row">
        <label>標本サイズ n = {n}</label>
        <input type="range" min="10" max="120" step="10" value={n} onChange={(e) => setN(Number(e.target.value))} />
        <button className="btn" style={{ width: 'auto', padding: '0.35rem 0.9rem', fontSize: '0.85rem' }} onClick={() => setSeed((s) => s + 1)}>
          20回とり直す
        </button>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="20回の標本から作った95%信頼区間と母平均の関係">
        <line x1={X(MU)} y1={padT - 8} x2={X(MU)} y2={H - padB + 4} stroke="#b91c1c" strokeWidth="1.8" />
        <text x={X(MU)} y={padT - 14} textAnchor="middle" fontSize="14" fontWeight="700" fill="#b91c1c">母平均 μ={MU}cm（動かない）</text>
        {trials.map((t, i) => {
          const y = padT + i * rowH + rowH / 2;
          const c = t.hit ? '#0f766e' : '#b91c1c';
          return (
            <g key={i}>
              <line x1={X(t.lo)} y1={y} x2={X(t.hi)} y2={y} stroke={c} strokeWidth={t.hit ? 2 : 3} />
              <line x1={X(t.lo)} y1={y - 3.5} x2={X(t.lo)} y2={y + 3.5} stroke={c} strokeWidth="1.5" />
              <line x1={X(t.hi)} y1={y - 3.5} x2={X(t.hi)} y2={y + 3.5} stroke={c} strokeWidth="1.5" />
              <circle cx={X(t.xbar)} cy={y} r="2.4" fill={c} />
              <text x={6} y={y + 4} fontSize="15" fill="#666">{i + 1}</text>
            </g>
          );
        })}
        <text x={W / 2} y={H - 30} textAnchor="middle" fontSize="14" fill="#555">身長（cm）</text>
        <text x={W / 2} y={H - 10} textAnchor="middle" fontSize="14" fill="#555">点＝標本平均、横棒＝95%信頼区間</text>
      </svg>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.7 }}>
        20回のうち <strong>{20 - missed}回</strong> が母平均をとらえ、<strong style={{ color: '#b91c1c' }}>{missed}回</strong> は外しました。
        動いているのは<strong>区間の方</strong>で、母平均は一本の線から動きません。
        「95%」は<strong>この手続きを繰り返したときに当たる割合</strong>であって、目の前の1本の区間に母平均が入る確率ではありません。
        n を大きくすると区間は細くなりますが、外す割合はおよそ5%のままです。
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
        <ScatterChart margin={{ top: 10, right: 12, bottom: 4, left: -8 }}>
          <XAxis type="number" dataKey="x" domain={[-3, 3]} tickFormatter={v => v.toFixed(0)} />
          <YAxis type="number" dataKey="y" domain={[-3, 3]} tickFormatter={v => v.toFixed(0)} />
          <ZAxis range={[36, 36]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v) => typeof v === 'number' ? v.toFixed(2) : String(v)} />
          {/* 回帰直線 y = r·x（標準化データなので傾き＝r）。r=1 なら全点がこの線上に並ぶ */}
          <ReferenceLine segment={[{ x: -3, y: -3 * r }, { x: 3, y: 3 * r }]} stroke="#dd5b2a" strokeWidth={2} ifOverflow="hidden" />
          <Scatter data={data} fill="var(--primary)" fillOpacity={0.75} />
        </ScatterChart>
      </ResponsiveContainer>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        オレンジは回帰直線（傾き＝r）。r が +1 に近いほど点が直線に集まり右上がり、−1 で右下がり、0 でばらばらになります。
      </p>
    </div>
  );
}

export const InteractiveGraph: React.FC<Props> = ({ type }) => {
  switch (type) {
    case 'ci': return <ConfidenceIntervalGraph />;
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

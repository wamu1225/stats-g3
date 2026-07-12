// stats-g3/src/App.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './App.css';
import { modules } from './data/modules';
import { comprehensiveQuizQuestions } from './data/comprehensiveQuiz';
import { glossary } from './data/glossary';
import { chapterNames } from './data/chapters';
import { InteractiveGraph } from './components/InteractiveGraph';
import { MathDisplay } from './components/MathDisplay';
import { Quiz } from './components/Quiz';
import { TermText } from './components/TermGlossary';
import { DistributionSelector } from './components/DistributionSelector';
import { ExamGuide } from './components/ExamGuide';
import { buildUsecaseHtml } from './data/usecaseGuide';
import { ChevronLeft, Book, LayoutDashboard, ArrowRight, Search as SearchIcon, X, Lightbulb, Target, ArrowDown, Dumbbell, Trash2, FileText, Shuffle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROGRESS_KEY = 'stats-g3-progress';
const COMPREHENSIVE_KEY = '__comprehensive__';

interface ProgressEntry { score: number; total: number; completedAt: string; }
type Progress = Record<string, ProgressEntry>;

function loadProgress(): Progress {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(p: Progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

// Draw n random items from an array
function sampleN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

type View = 'dashboard' | 'glossary' | 'cheatsheet' | 'randomquiz' | 'privacy' | 'about' | 'guide' | 'usecase';

function App() {
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  // Random quiz state
  const [rqQuestions, setRqQuestions] = useState<{ q: typeof modules[0]['quiz'][0]; moduleTitle: string; moduleId: string }[]>([]);
  const [rqIdx, setRqIdx] = useState(0);
  const [rqSelected, setRqSelected] = useState<number | null>(null);
  const [rqIsCorrect, setRqIsCorrect] = useState<boolean | null>(null);
  const [rqResults, setRqResults] = useState<{ moduleId: string; moduleTitle: string; correct: boolean }[]>([]);
  const [rqDone, setRqDone] = useState(false);

  const startRandomQuiz = useCallback(() => {
    // Use the dedicated comprehensive quiz question bank (shuffled)
    const qs = [...comprehensiveQuizQuestions]
      .sort(() => Math.random() - 0.5)
      .map(({ moduleId, moduleTitle, ...q }) => ({ q, moduleTitle, moduleId }));
    setRqQuestions(qs);
    setRqIdx(0);
    setRqSelected(null);
    setRqIsCorrect(null);
    setRqResults([]);
    setRqDone(false);
    setView('randomquiz');
    window.scrollTo(0, 0);
  }, []);

  const rqHandleSelect = (idx: number) => {
    if (rqSelected !== null) return;
    setRqSelected(idx);
    const correct = idx === rqQuestions[rqIdx].q.correctAnswer;
    setRqIsCorrect(correct);
  };

  const rqNext = () => {
    const cur = rqQuestions[rqIdx];
    const correct = rqSelected === cur.q.correctAnswer;
    const newResults = [...rqResults, { moduleId: cur.moduleId, moduleTitle: cur.moduleTitle, correct }];
    if (rqIdx + 1 < rqQuestions.length) {
      setRqResults(newResults);
      setRqIdx(rqIdx + 1);
      setRqSelected(null);
      setRqIsCorrect(null);
      window.scrollTo(0, 0);
    } else {
      setRqResults(newResults);
      setRqDone(true);
      const entry: ProgressEntry = { score: newResults.filter(r => r.correct).length, total: newResults.length, completedAt: new Date().toLocaleDateString('ja-JP') };
      const next = { ...loadProgress(), [COMPREHENSIVE_KEY]: entry };
      saveProgress(next);
      setProgress(next);
      window.scrollTo(0, 0);
    }
  };

  const updateModuleId = useCallback((id: string | null) => {
    const basePath = window.location.pathname.startsWith('/stats-g3/') ? '/stats-g3' : '';
    const newPath = id ? `${basePath}/${id}/` : `${basePath}/`;
    window.history.pushState(null, '', newPath);
    
    if (!id) {
      setActiveModuleId(null);
      setView('dashboard');
    } else {
      setActiveModuleId(id);
      setView('dashboard');
    }
    setQuizCompleted(false);
    window.scrollTo(0, 0);
  }, []);

  const switchView = useCallback((newView: View) => {
    setActiveModuleId(null);
    setView(newView);
    const basePath = window.location.pathname.startsWith('/stats-g3/') ? '/stats-g3' : '';
    const newPath = newView === 'dashboard' ? `${basePath}/` : `${basePath}/${newView}/`;
    window.history.pushState(null, '', newPath);
    window.scrollTo(0, 0);
  }, []);

  const handleQuizComplete = useCallback((moduleId: string, score: number, total: number) => {
    setQuizCompleted(true);
    const entry: ProgressEntry = { score, total, completedAt: new Date().toLocaleDateString('ja-JP') };
    const next = { ...loadProgress(), [moduleId]: entry };
    saveProgress(next);
    setProgress(next);
  }, []);

  useEffect(() => {
    const handlePath = () => {
      const segments = window.location.pathname.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1];
      
      const isCustomView = ['glossary', 'cheatsheet', 'privacy', 'about', 'guide', 'usecase'].includes(lastSegment || '');
      
      if (isCustomView) {
        setView(lastSegment as View);
        setActiveModuleId(null);
        if (lastSegment === 'privacy') document.title = 'プライバシーポリシー | 統計検定 3級 学習リファレンス';
        else if (lastSegment === 'about') document.title = 'サイトについて | 統計検定 3級 学習リファレンス';
        else if (lastSegment === 'guide') document.title = '試験ガイド | 統計検定 3級 学習リファレンス';
        else if (lastSegment === 'usecase') document.title = '統計手法の使い分けガイド | 統計検定 3級 学習リファレンス';
      } else if (lastSegment && lastSegment !== 'stats-g3') {
        const found = modules.find(m => m.id === lastSegment);
        if (found) {
          setActiveModuleId(found.id);
          setView('dashboard');
          document.title = `${found.title} | 統計検定 3級`;
        } else {
          setActiveModuleId(null);
          setView('dashboard');
        }
      } else {
        setActiveModuleId(null);
        setView('dashboard');
        document.title = '統計検定 3級 学習リファレンス';
      }
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  const parseInlineContent = useCallback((text: string): React.ReactNode => {
    function parseInline(t: string): React.ReactNode {
      const regex = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\*\*[\s\S]*?\*\*|\[\[term:.*?\]\][\s\S]*?\[\[\/term\]\]|\[\[translate:.*?\]\][\s\S]*?\[\[\/translate\]\]|\[\[darts\]\]|\[\[practical:.*?\]\][\s\S]*?\[\[\/practical\]\]|\[\[conjugate\]\]|\[\[hierarchy\]\]|\[\[boxplot\]\]|\[\[venn\]\]|\[\[timeseries\]\]|\[\[histshapes\]\]|\[\[sampling\]\]|\[\[interactive:.*?\]\]|\[\[regularization-card\]\])/g;
      const parts = t.split(regex);
      return (
        <>
          {parts.map((part, i) => {
            if (!part) return null;
            const key = `inline-${i}`;
            if (part.startsWith('$$') && part.endsWith('$$')) return <MathDisplay key={key} formula={part.slice(2, -2)} block={true} />;
            if (part.startsWith('$') && part.endsWith('$')) return <MathDisplay key={key} formula={part.slice(1, -1)} />;
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{parseInline(part.slice(2, -2))}</strong>;
            if (part.startsWith('[[term:')) {
              const idMatch = part.match(/\[\[term:(.*?)\]\]/);
              const contentMatch = part.match(/\]\]([\s\S]*?)\[\[\/term\]\]/);
              if (idMatch && contentMatch) return <TermText key={key} termId={idMatch[1]} onNavigate={updateModuleId} renderMath={parseInline}>{contentMatch[1]}</TermText>;
            }
            if (part.startsWith('[[translate:')) {
              const transMatch = part.match(/\[\[translate:(.*?)\]\]/);
              const contentMatch = part.match(/\]\]([\s\S]*?)\[\[\/translate\]\]/);
              if (transMatch && contentMatch) return <span key={key} className="formula-wrapper">{parseInline(contentMatch[1])}<span className="formula-translation">{transMatch[1]}</span></span>;
            }
            if (part === '[[darts]]') return (
              <div key={key} className="darts-container">
                <div className="dart-target"><Target size={32} color="#22c55e" className="target-svg" /><div className="dart-label">不偏性あり</div><div className="dart-desc">中心が真値を射抜いている</div></div>
                <div className="dart-target"><Target size={32} color="#3b82f6" className="target-svg" /><div className="dart-label">一致性あり</div><div className="dart-desc">n増で一点に集中する</div></div>
              </div>
            );
            if (part === '[[conjugate]]') return (
              <div key={key} className="conjugate-card">
                <div className="pair-row">
                  <div className="dist-box"><strong>二項分布</strong><br/><small>成功確率 p</small></div>
                  <div className="update-arrow"><ArrowRight size={16}/><span>共役</span></div>
                  <div className="dist-box"><strong>ベータ分布</strong><br/><small>形状 α, β</small></div>
                </div>
                <div className="update-arrow" style={{ margin: '8px 0' }}><ArrowDown size={16}/><span>更新</span></div>
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800 }}>α' = α + 成功数 , β' = β + 失敗数</div>
              </div>
            );
            if (part === '[[hierarchy]]') return (
              <div key={key} className="matryoshka-container">
                <div className="shell shell-outer"><span className="shell-label">集団の差 (学校)</span>
                  <div className="shell shell-mid"><span className="shell-label">個人の差 (クラス)</span><div className="shell shell-inner">データ</div></div>
                </div>
              </div>
            );
            if (part === '[[boxplot]]') return (
              <figure key={key} className="g3-figure">
                <svg viewBox="0 0 360 116" role="img" aria-label="箱ひげ図：最小値・Q1・中央値・Q3・最大値と外れ値。箱の長さがIQR" className="g3-fig-svg">
                  <line x1={60} y1={60} x2={110} y2={60} stroke="#64748b" strokeWidth={1.5} />
                  <line x1={200} y1={60} x2={250} y2={60} stroke="#64748b" strokeWidth={1.5} />
                  <line x1={60} y1={47} x2={60} y2={73} stroke="#64748b" strokeWidth={1.5} />
                  <line x1={250} y1={47} x2={250} y2={73} stroke="#64748b" strokeWidth={1.5} />
                  <rect x={110} y={40} width={90} height={40} fill="var(--primary)" fillOpacity={0.15} stroke="var(--primary)" strokeWidth={1.6} />
                  <line x1={150} y1={40} x2={150} y2={80} stroke="var(--primary)" strokeWidth={2.6} />
                  <circle cx={300} cy={60} r={4} fill="none" stroke="#dc2626" strokeWidth={1.6} />
                  <line x1={110} y1={30} x2={200} y2={30} stroke="#94a3b8" strokeWidth={1} />
                  <line x1={110} y1={30} x2={110} y2={36} stroke="#94a3b8" strokeWidth={1} />
                  <line x1={200} y1={30} x2={200} y2={36} stroke="#94a3b8" strokeWidth={1} />
                  <text x={155} y={23} textAnchor="middle" fontSize={11} fontWeight={700} fill="#475569">IQR = Q₃ − Q₁</text>
                  <text x={60} y={101} textAnchor="middle" fontSize={10} fill="#64748b">最小値</text>
                  <text x={110} y={101} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--primary)">Q₁</text>
                  <text x={150} y={101} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--primary)">中央値</text>
                  <text x={200} y={101} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--primary)">Q₃</text>
                  <text x={250} y={101} textAnchor="middle" fontSize={10} fill="#64748b">最大値</text>
                  <text x={300} y={101} textAnchor="middle" fontSize={10} fill="#b91c1c">外れ値</text>
                </svg>
                <figcaption className="g3-fig-cap">
                  箱ひげ図の読み方。箱の左端が Q₁、右端が Q₃ で、箱の長さが四分位範囲 IQR ＝ Q₃−Q₁（中央50%の散らばり）。箱の中の線が中央値。ひげは外れ値を除いた最小値・最大値まで伸び、その外側の点（赤）が外れ値。平均と標準偏差では見えない「分布の形・外れ値」が一目でわかる。
                </figcaption>
              </figure>
            );
            if (part === '[[histshapes]]') {
              const panels: { label: string; h: (i: number) => number }[] = [
                { label: '左右対称（山型）', h: (i) => Math.exp(-((i - 3.5) ** 2) / 4) },
                { label: '右裾が長い（右歪み）', h: (i) => Math.exp(-((i - 1.5) ** 2) / 2.2) + 0.15 * Math.exp(-((i - 5) ** 2) / 6) },
                { label: '左裾が長い（左歪み）', h: (i) => Math.exp(-((i - 5.5) ** 2) / 2.2) + 0.15 * Math.exp(-((i - 2) ** 2) / 6) },
                { label: '双峰型（2つの山）', h: (i) => Math.exp(-((i - 1.5) ** 2) / 1.6) + Math.exp(-((i - 5.5) ** 2) / 1.6) },
              ];
              const bins = 8, pw = 74, gap = 10, ph = 60, baseY = 74, x0 = 4;
              const nodes: React.ReactNode[] = [];
              panels.forEach((p, pi) => {
                const px = x0 + pi * (pw + gap);
                const hs = Array.from({ length: bins }, (_, i) => p.h(i));
                const mx = Math.max(...hs);
                hs.forEach((hv, i) => {
                  const bw = pw / bins;
                  const bh = (hv / mx) * ph;
                  nodes.push(<rect key={`${pi}-${i}`} x={px + i * bw + 0.6} y={baseY - bh} width={bw - 1.2} height={bh} fill="var(--primary)" fillOpacity={0.7} />);
                });
                nodes.push(<line key={`${pi}-b`} x1={px} y1={baseY} x2={px + pw} y2={baseY} stroke="#cbd5e1" strokeWidth={1} />);
                nodes.push(<text key={`${pi}-l`} x={px + pw / 2} y={baseY + 13} textAnchor="middle" fontSize={8.5} fill="#475569">{p.label}</text>);
              });
              return (
                <figure key={key} className="g3-figure">
                  <svg viewBox="0 0 340 92" role="img" aria-label="ヒストグラムの4つの形：左右対称・右歪み・左歪み・双峰" className="g3-fig-svg">{nodes}</svg>
                  <figcaption className="g3-fig-cap">
                    ヒストグラムの形で分布の性質が読める。<strong>左右対称</strong>は平均付近に集中（標準的）。<strong>右歪み</strong>は少数の大きな値が裾を引く（年収など）。<strong>左歪み</strong>はその逆（簡単な試験）。<strong>双峰型</strong>は山が2つ＝別グループ（男女など）が混ざっているサイン。
                  </figcaption>
                </figure>
              );
            }
            if (part === '[[sampling]]') {
              const panels = [{ title: '単純無作為', cx: 8 }, { title: '層化', cx: 116 }, { title: 'クラスター', cx: 224 }];
              const pw = 96, py = 22, ph = 94;
              let seed = 3;
              const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
              const nodes: React.ReactNode[] = [];
              panels.forEach((p) => {
                nodes.push(<text key={p.title + 't'} x={p.cx + pw / 2} y={14} textAnchor="middle" fontSize={10} fontWeight={700} fill="#334155">{p.title}</text>);
                nodes.push(<rect key={p.title + 'r'} x={p.cx} y={py} width={pw} height={ph} rx={6} fill="none" stroke="#cbd5e1" strokeWidth={1} />);
                if (p.title === '層化') for (let b = 0; b < 3; b++) nodes.push(<rect key={p.title + 'b' + b} x={p.cx} y={py + b * (ph / 3)} width={pw} height={ph / 3} fill={b % 2 ? 'var(--primary)' : '#f59e0b'} fillOpacity={0.06} />);
                if (p.title === 'クラスター') { nodes.push(<rect key={p.title + 'k0'} x={p.cx + 4} y={py + 6} width={40} height={38} rx={4} fill="var(--primary)" fillOpacity={0.14} stroke="var(--primary)" strokeWidth={1.2} />); nodes.push(<rect key={p.title + 'k1'} x={p.cx + pw / 2 + 4} y={py + ph / 2 - 2} width={40} height={38} rx={4} fill="var(--primary)" fillOpacity={0.14} stroke="var(--primary)" strokeWidth={1.2} />); }
                for (let i = 0; i < 26; i++) {
                  const dx = p.cx + 8 + rnd() * (pw - 16), dy = py + 8 + rnd() * (ph - 16);
                  let picked = false;
                  if (p.title === '単純無作為') picked = rnd() < 0.28;
                  else if (p.title === '層化') picked = rnd() < 0.28;
                  else picked = (dx > p.cx + 4 && dx < p.cx + 44 && dy > py + 6 && dy < py + 44) || (dx > p.cx + pw / 2 + 4 && dy > py + ph / 2 - 2);
                  nodes.push(<circle key={p.title + 'd' + i} cx={dx.toFixed(1)} cy={dy.toFixed(1)} r={2.4} fill={picked ? 'var(--primary)' : '#cbd5e1'} />);
                }
              });
              return (
                <figure key={key} className="g3-figure">
                  <svg viewBox="0 0 328 136" role="img" aria-label="標本抽出法：単純無作為・層化・クラスターの違い" className="g3-fig-svg">
                    {nodes}
                    <text x={164} y={132} textAnchor="middle" fontSize={9} fill="#64748b">濃い点＝標本に選ばれた個体</text>
                  </svg>
                  <figcaption className="g3-fig-cap">
                    <strong>単純無作為抽出</strong>は母集団全体から等確率でばらばらに選ぶ。<strong>層化抽出</strong>は似た者どうしの層（例：年代）に分けて各層から選び、偏りを抑える。<strong>クラスター抽出</strong>は集団（例：学校・地区）に分け、選んだ集団を丸ごと調べる（コストは低いが精度は下がりやすい）。
                  </figcaption>
                </figure>
              );
            }
            if (part === '[[timeseries]]') {
              const N = 24, x0 = 30, y0 = 16, plotW = 288, plotH = 116;
              let seed = 7;
              const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
              const raw: number[] = [];
              for (let t = 0; t < N; t++) raw.push(1 + 0.05 * t + 0.6 * Math.sin((2 * Math.PI * t) / 12) + (rnd() - 0.5) * 0.7);
              const half = 2;
              const ma = raw.map((_, t) => { let s = 0, c = 0; for (let j = -half; j <= half; j++) { if (t + j >= 0 && t + j < N) { s += raw[t + j]; c++; } } return s / c; });
              const all = raw.concat(ma), mn = Math.min(...all), mx = Math.max(...all);
              const sx = (t: number) => x0 + (t / (N - 1)) * plotW;
              const sy = (v: number) => y0 + plotH - ((v - mn) / (mx - mn)) * plotH;
              const rawPoly = raw.map((v, t) => `${sx(t).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
              const maPoly = ma.map((v, t) => `${sx(t).toFixed(1)},${sy(v).toFixed(1)}`).join(' ');
              return (
                <figure key={key} className="g3-figure">
                  <svg viewBox="0 0 328 182" role="img" aria-label="時系列：ぎざぎざの生データと、なめらかな移動平均のトレンド線" className="g3-fig-svg">
                    <line x1={x0} y1={y0 + plotH} x2={x0 + plotW} y2={y0 + plotH} stroke="#cbd5e1" strokeWidth={1} />
                    <polyline points={rawPoly} fill="none" stroke="#94a3b8" strokeWidth={1.3} />
                    {raw.map((v, t) => <circle key={t} cx={sx(t)} cy={sy(v)} r={1.7} fill="#94a3b8" />)}
                    <polyline points={maPoly} fill="none" stroke="var(--primary)" strokeWidth={2.8} />
                    <line x1={x0} y1={y0 + plotH + 16} x2={x0 + 18} y2={y0 + plotH + 16} stroke="#94a3b8" strokeWidth={1.3} />
                    <text x={x0 + 22} y={y0 + plotH + 19} fontSize={9.5} fill="#64748b">生データ（ノイズ）</text>
                    <line x1={x0 + 150} y1={y0 + plotH + 16} x2={x0 + 168} y2={y0 + plotH + 16} stroke="var(--primary)" strokeWidth={2.8} />
                    <text x={x0 + 172} y={y0 + plotH + 19} fontSize={9.5} fill="var(--primary)">移動平均＝トレンド</text>
                  </svg>
                  <figcaption className="g3-fig-cap">
                    生データ（灰）は短期のノイズで上下にぎざぎざ揺れて、長期の傾向が見えにくい。各点を「前後数点の平均」に置きかえる移動平均（色つき）を取ると、ノイズが打ち消し合ってなめらかになり、右肩上がりのトレンドがはっきり見える。
                  </figcaption>
                </figure>
              );
            }
            if (part === '[[venn]]') return (
              <figure key={key} className="g3-figure">
                <svg viewBox="0 0 320 172" role="img" aria-label="加法定理のベン図：A∪B は A と B を足して重なり A∩B を引く" className="g3-fig-svg">
                  <circle cx={124} cy={84} r={62} fill="var(--primary)" fillOpacity={0.16} stroke="var(--primary)" strokeWidth={1.8} />
                  <circle cx={196} cy={84} r={62} fill="#f59e0b" fillOpacity={0.14} stroke="#d97706" strokeWidth={1.8} />
                  <text x={86} y={62} textAnchor="middle" fontSize={17} fontWeight={800} fill="var(--primary)">A</text>
                  <text x={234} y={62} textAnchor="middle" fontSize={17} fontWeight={800} fill="#b45309">B</text>
                  <text x={160} y={80} textAnchor="middle" fontSize={11} fontWeight={700} fill="#334155">A∩B</text>
                  <text x={160} y={94} textAnchor="middle" fontSize={8.5} fill="#64748b">（重なり）</text>
                  <text x={160} y={162} textAnchor="middle" fontSize={11} fontWeight={700} fill="#334155">P(A∪B) ＝ P(A) ＋ P(B) − P(A∩B)</text>
                </svg>
                <figcaption className="g3-fig-cap">
                  「A または B」（A∪B）の確率は、A と B をそのまま足すと重なり A∩B を<strong>二重に数えて</strong>しまう。だから重なりの分 P(A∩B) を1回引く——これが加法定理。A と B が同時に起こらない（排反）なら重なりが無いので、そのまま足せる。
                </figcaption>
              </figure>
            );
            if (part.startsWith('[[interactive:')) {
              const typeMatch = part.match(/\[\[interactive:(.*?)\]\]/);
              if (typeMatch) {
                const type = typeMatch[1] as 'normal' | 't' | 'chi2' | 'f' | 'pca' | 'regression' | 'logistic' | 'mcmc' | 'gibbs' | 'update' | 'overfit' | 'outlier' | 'multico';
                return <InteractiveGraph key={key} type={type} renderContent={parseInline} />;
              }
            }
            if (part === '[[regularization-card]]') return (
              <div key={key} className="reg-card-container">
                <div className="reg-side lasso">
                  <div className="reg-header"><Trash2 size={20}/> <strong>Lasso (L1)</strong></div>
                  <div className="reg-metaphor">「断捨離」</div>
                  <ul className="reg-list">
                    <li>不要な係数を **完全に 0** にする</li>
                    <li>**変数選択** の機能がある</li>
                    <li>スパースな解を得やすい</li>
                  </ul>
                </div>
                <div className="reg-side ridge">
                  <div className="reg-header"><Dumbbell size={20}/> <strong>Ridge (L2)</strong></div>
                  <div className="reg-metaphor">「シェイプアップ」</div>
                  <ul className="reg-list">
                    <li>係数を **全体的に縮小** する</li>
                    <li>完全に 0 にはならない</li>
                    <li>マルチコに強く安定する</li>
                  </ul>
                </div>
              </div>
            );
            if (part.startsWith('[[practical:')) {
              const titleMatch = part.match(/\[\[practical:(.*?)\]\]/);
              const contentMatch = part.match(/\]\]([\s\S]*?)\[\[\/practical\]\]/);
              if (titleMatch && contentMatch) return <div key={key} className="column-practical"><div className="column-title"><Lightbulb size={16} /> 実務Tips: {titleMatch[1]}</div><div style={{ fontSize: '0.85rem' }}>{parseInline(contentMatch[1])}</div></div>;
            }
            return <span key={key} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
          })}
        </>
      );
    }
    return parseInline(text);
  }, [updateModuleId]);

  const parseContent = useCallback((text: string): React.ReactNode => {
    if (!text) return null;
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    const flushList = (key: string) => {
      if (currentList.length > 0) {
        result.push(<ul key={`list-${key}`}>{currentList}</ul>);
        currentList = [];
      }
    };
    lines.forEach((line, lineIdx) => {
      const trimmedLine = line.trim();
      const key = `line-${lineIdx}`;
      if (trimmedLine.startsWith('#### ')) { flushList(key); result.push(<h4 key={key} className="content-h4">{parseInlineContent(trimmedLine.slice(5))}</h4>); return; }
      if (trimmedLine.startsWith('### ')) { flushList(key); result.push(<h3 key={key} className="content-h3">{parseInlineContent(trimmedLine.slice(4))}</h3>); return; }
      if (trimmedLine.startsWith('## ')) { flushList(key); result.push(<h2 key={key} className="content-h2">{parseInlineContent(trimmedLine.slice(3))}</h2>); return; }
      if (trimmedLine.startsWith('---')) { flushList(key); result.push(<hr key={key} className="content-hr" />); return; }
      if (trimmedLine.startsWith('- ')) { currentList.push(<li key={`li-${lineIdx}`}>{parseInlineContent(trimmedLine.slice(2))}</li>); return; }
      if (trimmedLine === '') { flushList(key); return; }
      flushList(key);
      result.push(<p key={key} className="content-p">{parseInlineContent(line)}</p>);
    });
    flushList('final');
    return <>{result}</>;
  }, [parseInlineContent]);

  const filteredModules = useMemo(() => {
    if (!searchQuery) return modules;
    const q = searchQuery.toLowerCase();
    return modules.filter(m =>
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeModule = useMemo(() => modules.find(m => m.id === activeModuleId), [activeModuleId]);
  const nextModule = useMemo(() => {
    if (!activeModuleId) return null;
    const idx = modules.findIndex(m => m.id === activeModuleId);
    return idx >= 0 && idx < modules.length - 1 ? modules[idx + 1] : null;
  }, [activeModuleId]);
  const findModulesByTerm = useCallback((termId: string) => modules.filter(m => m.content.includes(`[[term:${termId}]]`)), []);

  const completedCount = Object.keys(progress).filter(id => modules.some(m => m.id === id)).length;
  const totalModules = modules.length;

  return (
    <div className="container" style={{ maxWidth: activeModuleId ? '800px' : view === 'glossary' ? '1000px' : '800px' }}>
      <header className="header">
        <div className="masthead" onClick={() => updateModuleId(null)}>
          <svg className="masthead-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x={5} y={23} width={7.5} height={12} rx={2.2} fill="currentColor" fillOpacity={0.45} />
            <rect x={16.25} y={15} width={7.5} height={20} rx={2.2} fill="currentColor" fillOpacity={0.7} />
            <rect x={27.5} y={7} width={7.5} height={28} rx={2.2} fill="currentColor" />
            <path d="M6 13 L18 9 L28 5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M23.5 4.5 L28.5 4.5 L28.5 9.5" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <h1 className="title">統計検定 <span className="title-lv">3級</span></h1>
            <p className="subtitle">はじめての統計・やさしい学習ノート</p>
          </div>
        </div>
        {!activeModuleId && view === 'dashboard' && (
          <div className="hero-banner">
            <p className="hero-lead">グラフと図解で、統計の「第一歩」をやさしく。</p>
            <div className="hero-chips">
              <span className="hero-chip">図解つき</span>
              <span className="hero-chip">動かせるグラフ</span>
              <span className="hero-chip">逆引き診断</span>
              <span className="hero-chip">全範囲クイズ</span>
            </div>
          </div>
        )}
      </header>

      {!activeModuleId && (
        <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => switchView('dashboard')} className={`nav-tab ${view === 'dashboard' ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> ロードマップ
            {completedCount > 0 && <span className="nav-progress-badge">{completedCount}/{totalModules}</span>}
          </button>
          <button onClick={() => switchView('glossary')} className={`nav-tab ${view === 'glossary' ? 'active' : ''}`}>
            <Book size={18} /> 用語集
          </button>
          <button onClick={() => switchView('cheatsheet')} className={`nav-tab ${view === 'cheatsheet' ? 'active' : ''}`}>
            <FileText size={18} /> 公式集
          </button>
          <button onClick={startRandomQuiz} className={`nav-tab ${view === 'randomquiz' ? 'active' : ''}`}>
            <Shuffle size={18} /> 全範囲クイズ
          </button>
          <button onClick={() => switchView('guide')} className={`nav-tab ${view === 'guide' ? 'active' : ''}`}>
            <Target size={18} /> 試験ガイド
          </button>
          <button onClick={() => switchView('usecase')} className={`nav-tab ${view === 'usecase' ? 'active' : ''}`}>
            <Lightbulb size={18} /> 使い分けガイド
          </button>
        </nav>
      )}

      <main>
        <AnimatePresence mode="wait">
          {activeModuleId ? (
            <motion.div key={activeModuleId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <button className="btn-back" onClick={() => updateModuleId(null)}><ChevronLeft size={18} /> 一覧に戻る</button>
              <div className="card">
                <span className="badge-chapter">Chapter {activeModule?.chapter}</span>
                <h2 style={{ marginTop: '0.5rem' }}>{parseContent(activeModule?.title || '')}</h2>
                <div className="content-body">{activeModule && parseContent(activeModule.content)}</div>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <Quiz
                  key={activeModuleId}
                  questions={activeModule?.quiz || []}
                  onComplete={(score, total) => handleQuizComplete(activeModuleId, score, total)}
                  renderContent={parseContent}
                />
              </div>
              {quizCompleted && (
                <div style={{ marginTop: '1rem' }}>
                  {activeModuleId && progress[activeModuleId] && (
                    <div className="score-banner">
                      {progress[activeModuleId].score} / {progress[activeModuleId].total} 問正解
                      {progress[activeModuleId].score === progress[activeModuleId].total && ' 🎉 パーフェクト！'}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="btn" onClick={() => updateModuleId(null)} style={{ flex: 1, background: '#f1f5f9', color: 'var(--text)', border: '1px solid #e2e8f0' }}>
                      <ChevronLeft size={16} /> 一覧に戻る
                    </button>
                    {nextModule && (
                      <button className="btn" onClick={() => updateModuleId(nextModule.id)} style={{ flex: 2 }}>
                        次のモジュールへ：{nextModule.title} <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          ) : view === 'randomquiz' ? (
            <motion.div key="rq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <button className="btn-back" onClick={() => switchView('dashboard')}><ChevronLeft size={18} /> 一覧に戻る</button>
              {rqDone ? (
                /* Results screen */
                <div>
                  <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                      {rqResults.filter(r => r.correct).length} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {rqResults.length} 問正解</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>全範囲クイズ完了</p>
                  </div>
                  {/* Breakdown by module */}
                  {(() => {
                    const byModule: Record<string, { title: string; correct: number; total: number }> = {};
                    rqResults.forEach(r => {
                      if (!byModule[r.moduleId]) byModule[r.moduleId] = { title: r.moduleTitle, correct: 0, total: 0 };
                      byModule[r.moduleId].total++;
                      if (r.correct) byModule[r.moduleId].correct++;
                    });
                    const weak = Object.entries(byModule).filter(([, v]) => v.correct < v.total);
                    return (
                      <div className="card">
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>モジュール別結果</h3>
                        {Object.entries(byModule).map(([id, v]) => (
                          <div key={id} className="rq-result-row">
                            <span className={`rq-result-dot ${v.correct === v.total ? 'ok' : 'ng'}`} />
                            <span style={{ flex: 1, fontSize: '0.85rem' }}>{v.title}</span>
                            <span style={{ fontSize: '0.8rem', color: v.correct === v.total ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{v.correct}/{v.total}</span>
                          </div>
                        ))}
                        {weak.length > 0 && (
                          <div style={{ marginTop: '1.25rem' }}>
                            <p style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>復習が必要なモジュール：</p>
                            <div className="links-row">
                              {weak.map(([id, v]) => (
                                <button key={id} className="btn-link" onClick={() => updateModuleId(id)}>
                                  {v.title} <ArrowRight size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  <button className="btn" onClick={startRandomQuiz} style={{ marginTop: '0.5rem' }}>
                    <Shuffle size={16} /> もう一度
                  </button>
                </div>
              ) : rqQuestions.length > 0 ? (
                /* Quiz screen */
                <div className="card" style={{ border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>全範囲クイズ</h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{rqQuestions[rqIdx].moduleTitle}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {rqIdx + 1} / {rqQuestions.length}
                    </span>
                  </div>
                  <div style={{ marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 600, lineHeight: 1.6 }}>
                    {parseContent(rqQuestions[rqIdx].q.question)}
                  </div>
                  <div className="quiz-options">
                    {rqQuestions[rqIdx].q.options.map((opt, i) => (
                      <button
                        key={`rq-${rqIdx}-${i}`}
                        className="btn"
                        style={{
                          background: rqSelected === i ? (i === rqQuestions[rqIdx].q.correctAnswer ? '#22c55e' : '#ef4444') : '#ffffff',
                          color: rqSelected === i ? 'white' : 'var(--text)',
                          justifyContent: 'space-between',
                          border: rqSelected === i ? 'none' : '1px solid #e2e8f0',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          boxShadow: 'none',
                          fontWeight: 500,
                          fontSize: '0.9rem',
                        }}
                        onClick={() => rqHandleSelect(i)}
                      >
                        <div style={{ flex: 1 }}>{parseContent(opt)}</div>
                        {rqSelected === i && (i === rqQuestions[rqIdx].q.correctAnswer ? <CheckCircle2 size={18} /> : <XCircle size={18} />)}
                      </button>
                    ))}
                  </div>
                  <AnimatePresence>
                    {rqSelected !== null && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
                        <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.6 }}>
                          <strong style={{ color: rqIsCorrect ? '#22c55e' : '#ef4444' }}>{rqIsCorrect ? '正解！' : '不正解...'}</strong><br />
                          {parseContent(rqQuestions[rqIdx].q.explanation)}
                        </p>
                        <button className="btn" style={{ marginTop: '1rem', width: 'auto', padding: '0.5rem 1rem' }} onClick={rqNext}>
                          {rqIdx + 1 < rqQuestions.length ? '次の問題へ' : '結果を見る'} <ArrowRight size={16} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : null}
            </motion.div>
          ) : view === 'cheatsheet' ? (
            <motion.div key="cs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800 }}>公式集</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>試験直前の確認用。各モジュールの重要公式をまとめました。</p>
              </div>
              {[1, 2, 3].map(ch => (
                <div key={ch}>
                  <div className="chapter-header">
                    <span className="badge-chapter" style={{ fontSize: '0.7rem' }}>Chapter {ch}</span>
                    <h3 className="content-h3" style={{ margin: '0.25rem 0 0' }}>{chapterNames[ch]}</h3>
                  </div>
                  {modules.filter(m => m.chapter === ch && m.keyFormulas && m.keyFormulas.length > 0).map(m => (
                    <div key={m.id} className="card cs-module-card" onClick={() => updateModuleId(m.id)} style={{ cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{m.title}</h4>
                        {progress[m.id] && (
                          <span className="progress-badge-small">
                            {progress[m.id].score}/{progress[m.id].total}点
                          </span>
                        )}
                      </div>
                      <div className="cs-formulas">
                        {m.keyFormulas!.map((kf, i) => (
                          <div key={i} className="cs-formula-row">
                            <span className="cs-label">{kf.label}</span>
                            <div className="cs-formula"><MathDisplay formula={kf.formula} /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </motion.div>
          ) : view === 'dashboard' ? (
            <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <DistributionSelector onSelect={updateModuleId} />
              <div className="search-container">
                <div className="search-input-wrapper">
                  <SearchIcon size={18} className="search-icon" />
                  <input type="text" placeholder="トピックを検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="search-clear"><X size={16} /></button>}
                </div>
              </div>
              <div className="roadmap-grid">
                {filteredModules.reduce<React.ReactNode[]>((acc, m, idx) => {
                  const prev = filteredModules[idx - 1];
                  if (!prev || prev.chapter !== m.chapter) {
                    acc.push(
                      <div key={`ch-${m.chapter}`} className="chapter-header">
                        <span className="badge-chapter" style={{ fontSize: '0.7rem' }}>Chapter {m.chapter}</span>
                        <h3 className="content-h3" style={{ margin: '0.25rem 0 0' }}>{chapterNames[m.chapter]}</h3>
                      </div>
                    );
                  }
                  const p = progress[m.id];
                  acc.push(
                    <div key={m.id} className="card-module" onClick={() => updateModuleId(m.id)}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-chapter">Chapter {m.chapter}</span>
                        {p && (
                          <span className={`progress-badge ${p.score === p.total ? 'perfect' : ''}`}>
                            {p.score === p.total ? '✓ ' : ''}{p.score}/{p.total}点
                          </span>
                        )}
                      </div>
                      <h4>{parseContent(m.title)}</h4>
                      <div className="module-desc">{parseContent(m.description)}</div>
                    </div>
                  );
                  return acc;
                }, [])}
                {!searchQuery && (
                  <>
                    <div className="chapter-header">
                      <span className="badge-chapter" style={{ fontSize: '0.7rem' }}>全範囲</span>
                      <h3 className="content-h3" style={{ margin: '0.25rem 0 0' }}>まとめ</h3>
                    </div>
                    <div className="card-module" style={{ cursor: 'pointer' }} onClick={startRandomQuiz}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge-chapter" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Shuffle size={12} /> 全範囲</span>
                        {progress[COMPREHENSIVE_KEY] && (
                          <span className={`progress-badge ${progress[COMPREHENSIVE_KEY].score === progress[COMPREHENSIVE_KEY].total ? 'perfect' : ''}`}>
                            {progress[COMPREHENSIVE_KEY].score === progress[COMPREHENSIVE_KEY].total ? '✓ ' : ''}{progress[COMPREHENSIVE_KEY].score}/{progress[COMPREHENSIVE_KEY].total}点
                          </span>
                        )}
                      </div>
                      <h4>全範囲クイズ</h4>
                      <div className="module-desc">全モジュールからランダム出題</div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : view === 'about' ? (
            <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="privacy-page">
                <h2>サイトについて</h2>

                <section>
                  <h3>このサイトについて</h3>
                  <p>「統計検定 3級 学習リファレンス」は、統計検定3級の合格を目指す方のために作られた、個人運営の学習支援サイトです。</p>
                  <p>数学的な素養が中学〜高校レベルの方でも理解できるよう、概念の直感的な説明・インタラクティブなグラフ・確認クイズを提供しています。</p>
                  <p className="privacy-disclaimer">⚠️ 本サイトは、統計質保証推進協会および日本統計学会の公式サイトではありません。試験の最新情報・申込方法・合否については、必ず公式サイトをご確認ください。</p>
                </section>

                <section>
                  <h3>コンテンツ構成</h3>
                  <ul>
                    <li><strong>学習モジュール（全10章）</strong>：確率分布・推定・検定・多変量解析・ベイズ統計・時系列分析など</li>
                    <li><strong>用語集</strong>：3級頻出用語の解説</li>
                    <li><strong>公式集</strong>：重要公式の一覧（印刷対応）</li>
                    <li><strong>全範囲クイズ</strong>：全モジュールからランダム出題</li>
                  </ul>
                </section>

                <section>
                  <h3>編集・制作方針</h3>
                  <p>本サイトのコンテンツは、統計検定の公式の出題範囲（試験要項）や、一般に流通している統計学の教科書・参考書を参照しつつ、運営者が内容を一から再構成し、高校生など初学者がつまずきやすい点を補う形で独自に解説しています。他サイトの文章をそのまま転載することはありません。</p>
                  <p>図解・確認クイズは、すべて本サイト向けに独自に制作したものです。内容の誤りや古くなった情報に気づいた場合は、お問い合わせを受けて随時見直し・修正します。</p>
                </section>

                <section>
                  <h3>運営者について</h3>
                  <p>本サイトは、統計学の学習を個人的に進める中で、同じように学んでいる方の助けになればと思い作成・公開しています。</p>
                  <p>お問い合わせは<a href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer">こちらのGoogleフォーム</a>からお願いします。</p>
                </section>

                <section>
                  <h3>免責事項</h3>
                  <p>本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性・完全性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。また、本サイトは統計検定への合格を保証するものではありません。</p>
                </section>
              </div>
            </motion.div>
          ) : view === 'guide' ? (
            <motion.div key="guide" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <ExamGuide />
            </motion.div>
          ) : view === 'usecase' ? (
            <motion.div key="usecase" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div dangerouslySetInnerHTML={{ __html: buildUsecaseHtml(window.location.pathname.startsWith('/stats-g3/') ? '/stats-g3' : '') }} />
            </motion.div>
          ) : view === 'privacy' ? (
            <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="privacy-page">
                <h2>プライバシーポリシー</h2>
                <p className="privacy-updated">最終更新：2025年4月</p>

                <section>
                  <h3>1. サイトについて</h3>
                  <p>本サイト「統計検定 3級 学習リファレンス」は、統計検定3級の学習を支援することを目的とした個人運営のサイトです。</p>
                  <p className="privacy-disclaimer">⚠️ 本サイトは、統計質保証推進協会および日本統計学会の公式サイトではありません。試験の出題範囲・申込方法・合否については、必ず公式サイトをご確認ください。本サイトのコンテンツは学習目的で作成されたものであり、内容の正確性・完全性を保証するものではありません。</p>
                </section>

                <section>
                  <h3>2. Google Analytics の利用について</h3>
                  <p>本サイトでは、アクセス状況を把握するために <strong>Google Analytics</strong>（Google LLC 提供）を使用しています。</p>
                  <p><strong>送信される情報の例：</strong>閲覧したページのURL・滞在時間・使用デバイス・おおまかな地域情報（IPアドレスから推定）など。これらの情報はCookieを通じてGoogleのサーバーに送信されます。個人を特定する情報は収集しません。</p>
                  <p><strong>利用目的：</strong>コンテンツ改善のためのアクセス分析</p>
                  <p><strong>オプトアウト：</strong><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google アナリティクス オプトアウト アドオン</a>をインストールすることで、データ送信を無効にできます。</p>
                  <p>Googleのプライバシーポリシーは<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">こちら</a>をご参照ください。</p>
                </section>

                <section>
                  <h3>3. Google AdSense の利用について</h3>
                  <p>本サイトでは、広告配信のために <strong>Google AdSense</strong>（Google LLC 提供）を使用しています。</p>
                  <p><strong>送信される情報の例：</strong>閲覧履歴・Cookieに保存された識別情報など。これらは広告のパーソナライズ（行動ターゲティング）に使用されます。</p>
                  <p><strong>利用目的：</strong>サイト運営費用の確保</p>
                  <p><strong>オプトアウト：</strong><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">広告設定ページ</a>でパーソナライズ広告を無効にできます。また、<a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">Digital Advertising Alliance</a> のオプトアウトツールもご利用いただけます。</p>
                </section>

                <section>
                  <h3>4. Cookieについて</h3>
                  <p>本サイトでは、Google Analytics および Google AdSense の機能提供のためにCookieを使用しています。ブラウザの設定からCookieを無効にすることができますが、一部機能が正常に動作しない場合があります。</p>
                </section>

                <section>
                  <h3>5. 学習進捗データについて</h3>
                  <p>クイズの得点・完了状況は、お使いのブラウザの <strong>ローカルストレージ</strong> にのみ保存されます。このデータは外部サーバーへ送信されることはなく、運営者も閲覧できません。ブラウザのデータ削除により消去されます。</p>
                </section>

                <section>
                  <h3>6. コンテンツの免責事項</h3>
                  <p>本サイトの解説・問題・公式は学習目的で作成されており、内容の正確性を保証するものではありません。本サイトの情報を利用したことによるいかなる損害についても、運営者は責任を負いかねます。また、本サイトは統計検定への合格を保証するものではありません。</p>
                </section>

                <section>
                  <h3>7. 本ポリシーの変更</h3>
                  <p>本ポリシーは予告なく変更される場合があります。変更後のポリシーはこのページへの掲載をもって効力を生じます。</p>
                </section>
              </div>
            </motion.div>
          ) : (
            /* Glossary view */
            <motion.div key="glos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="search-container" style={{ marginBottom: '2rem' }}>
                <div className="search-input-wrapper">
                  <SearchIcon size={18} className="search-icon" />
                  <input type="text" placeholder="用語を検索..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-input" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="search-clear"><X size={16} /></button>}
                </div>
              </div>
              <div className="glossary-grid">
                {Object.values(glossary)
                  .filter(term => !searchQuery || term.term.toLowerCase().includes(searchQuery.toLowerCase()) || term.explanation.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(term => {
                    const relatedModules = findModulesByTerm(term.id);
                    return (
                      <div key={term.id} id={`glossary-${term.id}`} className="card-glossary">
                        <div className="glossary-header">
                          <h4>{parseContent(term.term)}</h4>
                          <span className={`badge-level ${{ '基礎': 'basic', '中級': 'intermediate', '上級': 'advanced' }[term.level] ?? 'basic'}`}>{term.level}</span>
                        </div>
                        <div className="glossary-explanation">{parseContent(term.explanation)}</div>
                        {term.formula && (
                          <div className="glossary-formula">
                            <MathDisplay formula={term.formula} />
                          </div>
                        )}
                        {term.relatedTerms && term.relatedTerms.length > 0 && (
                          <div className="related-links">
                            <p className="label-related">関連用語：</p>
                            <div className="links-row">
                              {term.relatedTerms.map(rtId => glossary[rtId] && (
                                <button key={rtId} className="btn-link" onClick={() => {
                                  const el = document.getElementById(`glossary-${rtId}`);
                                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }}>
                                  {glossary[rtId].term} <ArrowRight size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {relatedModules.length > 0 && (
                          <div className="related-links">
                            <p className="label-related">解説ページ：</p>
                            <div className="links-row">
                              {relatedModules.map(m => (
                                <button key={m.id} className="btn-link" onClick={() => updateModuleId(m.id)}>
                                  {parseContent(m.title)} <ArrowRight size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="site-footer">
        <p className="footer-disclaimer">
          本サイトは個人による学習支援サイトであり、統計質保証推進協会および日本統計学会の公式サイトではありません。掲載内容は個人の見解に基づくものであり、公式の情報を保証するものではありません。
        </p>
        <div className="footer-links">
          <button className="footer-link" onClick={() => switchView('about')}>サイトについて</button>
          <button className="footer-link" onClick={() => switchView('privacy')}>プライバシーポリシー</button>
          <a className="footer-link" href="https://forms.gle/ccMv7oKwz6ysDHBe6" target="_blank" rel="noopener noreferrer">お問い合わせ</a>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} 統計検定 3級 学習リファレンス</p>
      </footer>
    </div>
  );
}

export default App;

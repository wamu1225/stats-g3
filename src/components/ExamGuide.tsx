// src/components/ExamGuide.tsx  (stats-g3)
import React from 'react';
import { CheckCircle2, Target, Lightbulb } from 'lucide-react';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="card" style={{ marginBottom: '1.5rem' }}>
    <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>{title}</h3>
    {children}
  </div>
);

const Row: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9', gap: '1rem' }}>
    <span style={{ fontSize: '0.85rem', color: '#64748b', flexShrink: 0 }}>{label}</span>
    <span style={{ fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>{value}</span>
  </div>
);

const PhaseCard: React.FC<{ phase: string; title: string; body: string }> = ({ phase, title, body }) => (
  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
    <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{phase}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</div>
      <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>{body}</div>
    </div>
  </div>
);

const BookItem: React.FC<{ title: string; stars: number; tag: string; desc: string }> = ({ title, stars, tag, desc }) => (
  <div style={{ padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{title}</span>
      <span className="stat-badge" style={{ background: stars === 5 ? '#ef4444' : stars === 4 ? '#3b82f6' : '#6b7280', color: 'white', fontSize: '0.65rem' }}>{tag}</span>
    </div>
    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{'★'.repeat(stars) + '☆'.repeat(5 - stars)}　{desc}</div>
  </div>
);

const ResourceItem: React.FC<{ name: string; type: string; desc: string }> = ({ name, type, desc }) => (
  <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
    <span className="stat-badge" style={{ flexShrink: 0, fontSize: '0.65rem', background: '#f1f5f9', color: '#475569' }}>{type}</span>
    <div>
      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{name}</div>
      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{desc}</div>
    </div>
  </div>
);

const FieldItem: React.FC<{ priority: '最重要' | '重要' | '標準'; title: string; detail: string }> = ({ priority, title, detail }) => {
  const color = priority === '最重要' ? '#ef4444' : priority === '重要' ? '#f59e0b' : '#3b82f6';
  return (
    <div style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
      <span className="stat-badge" style={{ flexShrink: 0, fontSize: '0.65rem', background: color, color: 'white' }}>{priority}</span>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>{detail}</div>
      </div>
    </div>
  );
};

export const ExamGuide: React.FC = () => (
  <div>
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
        <Target size={20} color="var(--primary)" />
        <h2 style={{ margin: 0, fontSize: '1.1rem' }}>試験ガイド</h2>
      </div>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
        統計検定3級の試験概要・学習戦略・推奨リソースをまとめています。
      </p>
    </div>

    {/* 試験の概要 */}
    <Section title="試験の概要">
      <Row label="実施方式" value="CBT（Computer Based Testing）— 全国のテストセンターで通年受験可" />
      <Row label="出題形式" value="多肢選択式（コンピュータ画面上で解答）" />
      <Row label="問題数 / 試験時間" value="30問程度 / 60分（1問あたり約2分）" />
      <Row label="合格基準" value="100点満点中 70点以上（概ね21問正答が目安）" />
      <Row label="受験料" value="一般 6,000円 / 学割 4,000円（税込）" />
      <Row label="電卓" value="持ち込み可（四則演算・ルート・メモリのある一般電卓。関数電卓は不可）" />
      <Row label="再受験" value="前回受験終了から最短1週間後に可" />
      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: '#f0fdf4', borderRadius: 8, fontSize: '0.8rem', color: '#166534' }}>
        <Lightbulb size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />
        3級は「統計リテラシーの入口」を問う試験。公式の丸暗記より、<strong>「なぜその数値が使われるのか」という概念の理解</strong>が合格への近道です。
      </div>
      <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#94a3b8' }}>
        ※ 受験料・試験形式は変更される場合があります。最新情報は<a href="https://www.toukei-kentei.jp/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>統計検定公式サイト</a>でご確認ください。
      </div>
    </Section>

    {/* 学習時間の目安 */}
    <Section title="必要な学習時間の目安">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {[
          { bg: '#fef2f2', border: '#fecaca', label: '完全初学者（文系・数学未履修）', time: '30〜60時間', period: '1〜2ヶ月', note: '中学・高校数学の復習も含む' },
          { bg: '#f0fdf4', border: '#bbf7d0', label: '高校数学既習者', time: '15〜30時間', period: '2〜4週間', note: '「データの分析」を理解済みの場合' },
          { bg: '#eff6ff', border: '#bfdbfe', label: '理系・統計実務経験者', time: '5〜15時間', period: '1週間程度', note: '用語の厳密な定義確認と電卓操作が中心' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10, padding: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.25rem' }}>{c.note}</div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.1rem' }}>{c.label}</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>{c.time}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.period}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b' }}>
        ※ 平日30〜60分・休日2時間のペースで1〜2ヶ月が標準的。短期集中（1日6時間×5日）でも合格ラインに到達可能ですが、定着度を考えると継続学習が推奨です。
      </div>
    </Section>

    {/* 4段階学習フェーズ */}
    <Section title="4段階の学習フェーズ">
      <PhaseCard
        phase="1"
        title="全体像の把握（鳥瞰）"
        body="まず公式テキストや統計WEBを、計算を飛ばして1周通読する。「統計学で何ができるのか」というビッグピクチャーを掴むことに注力。細かな公式の暗記はこの段階では不要。"
      />
      <PhaseCard
        phase="2"
        title="現状診断（過去問演習）"
        body="早い段階で過去問を1回分解いて、今の実力と弱点を把握する。CBT特有の「画面で問題を読みながら、手元の紙で計算する」リズムを体感しておくことが重要。"
      />
      <PhaseCard
        phase="3"
        title="弱点補強と概念の深化"
        body="過去問で間違えた箇所を重点的に再学習。「標準偏差は何を意味するのか」「相関係数が0でも関係がないわけではない」など、数式を言葉で説明できるレベルまで深める。"
      />
      <PhaseCard
        phase="4"
        title="アウトプットの高速化"
        body="公式問題集を繰り返し演習して、1問2分以内で解けるスピードを身につける。電卓のメモリ機能も反射的に使えるよう練習しておく。時間不足が最大の敵。"
      />
    </Section>

    {/* 推奨書籍 */}
    <Section title="推奨書籍">
      <BookItem title="改訂版 統計検定3級対応 データの分析" stars={5} tag="必須" desc="公式テキスト。試験範囲を網羅。辞書的に使うのが◎。まず通読して全体像を掴む。" />
      <BookItem title="統計検定3級・4級 公式問題集（CBT対応版）" stars={5} tag="必須" desc="唯一の公式問題集。解説が試験の「読み方」を教えてくれる。3周が目安。" />
      <BookItem title="マンガでわかる統計学" stars={4} tag="入門" desc="概念の直感的理解に最適。数式への抵抗感がある人の入口として有効。挫折防止に。" />
    </Section>

    {/* オンラインリソース */}
    <Section title="おすすめリソース">
      <ResourceItem name="統計WEB「統計学の時間」（BC Learning）" type="ウェブ" desc="初学者のための定番サイト。ステップ形式で3級の全範囲をわかりやすく解説。「聖書」と呼ぶ受験生も多い。" />
      <ResourceItem name="Udemy「統計学入門コース」" type="動画" desc="約5.5時間の視聴で3級に必要な統計学を体系的にインプットできる。耳と目で学べるため、テキストが苦手な人に特に有効。" />
      <ResourceItem name="オモワカ統計 / データサイエンスLab." type="YouTube" desc="電卓の操作テクニックや、試験頻出ポイントを解説。隙間時間の活用に最適。" />
      <ResourceItem name="生成AI（ChatGPT / Claude）" type="AI" desc="「中学生でもわかるように数式なしで説明して」と依頼すると抽象的な概念の理解が加速。24時間対応の個別指導として活用できる。" />
    </Section>

    {/* 重要出題分野 */}
    <Section title="重要出題分野">
      <FieldItem priority="最重要" title="グラフの読み取りと統計量の計算" detail="ヒストグラム・箱ひげ図・散布図の読み取り、平均・標準偏差・四分位範囲の計算。毎回必ず出題される基礎中の基礎。" />
      <FieldItem priority="最重要" title="確率の計算" detail="加法定理・条件付き確率・独立性・組合せの計算。素直な計算問題が多く確実に得点したいエリア。" />
      <FieldItem priority="重要" title="正規分布・標準化" detail="Z = (X−μ)/σ の計算と標準正規分布表の読み取り。「μ±σの範囲に約68%」などの経験則も問われる。" />
      <FieldItem priority="重要" title="データの尺度と変数の種類" detail="名義・順序・間隔・比例尺度の区分。それぞれの尺度で使える統計量（代表値・散布度）の適切な選択。" />
      <FieldItem priority="重要" title="相関係数と回帰直線" detail="相関係数 r の値域・性質・因果との区別、回帰係数の解釈と予測計算。擬似相関・外挿の危険性も頻出。" />
      <FieldItem priority="標準" title="時系列データと指数" detail="4変動成分（趨勢・循環・季節・不規則）の識別と移動平均の計算。指数の読み方。" />
    </Section>

    {/* 実践的アドバイス */}
    <Section title="本番に向けた実践アドバイス">
      {[
        { icon: '⏱', title: '1問2分のペース配分', body: '60分・30問で1問平均2分。グラフ読み取りや定義問題など計算不要な問題を素早く片付け、計算問題に時間を残す。詰まったらフラグを付けて次へ進む。' },
        { icon: '🔢', title: '電卓のメモリ機能を練習する', body: 'M+で偏差の二乗を加算し、MRで合計を呼び出すと分散の計算が大幅に速くなる。MCでリセットを忘れずに。本番前に必ず操作練習をしておく。' },
        { icon: '📊', title: 'CBTの画面操作に慣れる', body: '統計数値表は別ウィンドウで開く形式。画面と手元の計算用紙を往復しながら解くリズムを事前に練習しておく。試験開始時に文字サイズ調整も忘れずに。' },
        { icon: '💡', title: '用語の定義を正確に覚える', body: '「信頼区間は母平均が含まれる確率ではない」「排反と独立は別の概念」など、紛らわしい定義の引っかけ問題が多い。言葉の意味を正確に押さえておく。' },
        { icon: '🏢', title: 'CBT会場の環境に動じない準備をする', body: 'テストセンターは様々な試験の受験者が混在するマルチ会場。他の受験者の入退室やキーボード操作音が気になることがある。日常の学習を静かすぎる環境だけで行わず、ある程度の雑音下でも集中する練習をしておくと本番に強くなる。' },
      ].map(a => (
        <div key={a.title} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{a.icon}</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.15rem' }}>{a.title}</div>
            <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>{a.body}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: '#f0fdf4', borderRadius: 8, fontSize: '0.8rem', color: '#166534', display: 'flex', gap: '0.5rem' }}>
        <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>このサイトの学習リファレンスは、3級の試験範囲に沿って構成されています。各モジュールの理解度チェックで定着を確認しながら進めましょう。</span>
      </div>
    </Section>

    {/* 合格後の展望 */}
    <Section title="合格後の展望">
      <div style={{ padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>2級へのステップアップ</div>
        <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
          3級合格後は速やかに2級への挑戦を検討したい。2級では、3級で学んだ「記述統計」を土台として、母集団のパラメータを標本から推論する「推測統計（仮説検定・区間推定）」が本格的に導入される。3級の内容を「他者に教えられるレベル」まで理解していれば、2級の学習効率は飛躍的に高まる。
        </div>
      </div>
      <div style={{ padding: '0.6rem 0' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>実務への応用と意思決定の質的向上</div>
        <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
          統計学の真価は検定合格そのものではなく、実社会の不確実な事象を「確率と統計」というレンズを通してクリアにすることにある。標準偏差や相関係数の概念を売上分析や顧客行動の把握に適用し、エビデンスに基づく提案（Evidence-Based Management）を実践することが資格取得の真の目的である。
        </div>
      </div>
    </Section>
  </div>
);

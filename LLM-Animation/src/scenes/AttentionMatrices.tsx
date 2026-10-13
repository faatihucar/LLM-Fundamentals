import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Appear, Beat, Caption, Chip, Lead, Panel, Scene, clamp, hexA} from '../components';
import {C, FONT, MATH, MONO} from '../theme';
import raw from '../data/training.json';

// ---------------------------------------------------------------------------------------------
// Same tiny model as the training chapter: 6 tokens, d_model = 4, 2 heads of 2 dims.
// Q, K, V, attention and Wo are recomputed here from X and the stored weights so that every
// number on screen is consistent with the numbers it was computed from.
// ---------------------------------------------------------------------------------------------
type Mat = number[][];
type Data = {
  step0: {X: Mat};
  weights: {q: Mat; k: Mat; v: Mat; o: Mat};
  windows: {x: string[]}[];
  vocab: string[];
};
const DATA = raw as unknown as Data;
const TOK = DATA.windows[0].x;
const X = DATA.step0.X;
const W = DATA.weights;

const mm = (A: Mat, B: Mat): Mat => A.map((row) => B[0].map((_, j) => row.reduce((s, a, i) => s + a * B[i][j], 0)));
const cols = (A: Mat, from: number, to: number): Mat => A.map((r) => r.slice(from, to));
const softmaxRow = (r: number[]) => {
  const m = Math.max(...r.filter(Number.isFinite));
  const e = r.map((v) => (Number.isFinite(v) ? Math.exp(v - m) : 0));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
};

const Q = mm(X, W.q);
const K = mm(X, W.k);
const V = mm(X, W.v);
const head = (h: number) => {
  const q = cols(Q, 2 * h, 2 * h + 2);
  const k = cols(K, 2 * h, 2 * h + 2);
  const v = cols(V, 2 * h, 2 * h + 2);
  const scores = q.map((qr) => k.map((kr) => (qr[0] * kr[0] + qr[1] * kr[1]) / Math.SQRT2));
  const A = scores.map((r, i) => softmaxRow(r.map((s, j) => (j > i ? -Infinity : s))));
  return {q, k, v, scores, A, out: mm(A, v)};
};
const H1 = head(0);
const H2 = head(1);
const CONCAT = H1.out.map((r, i) => [...r, ...H2.out[i]]);
const OUT = mm(CONCAT, W.o);

const MODEL = 5;
const OKUR = 3;
const METNI = 2;

const fmt = (v: number, d = 2) => (v < 0 && Math.abs(v) >= 0.5 * 10 ** -d ? '−' : '') + Math.abs(v).toFixed(d);
const tint = (v: number) => hexA(v >= 0 ? C.q : C.k, Math.min(0.85, 0.12 + Math.abs(v) * 0.4));
const TOK_COLORS = [C.q, C.teal, C.v, C.pos, C.yellow, C.k];

// ---------------------------------------------------------------------------------------------
// Matrix view
// ---------------------------------------------------------------------------------------------
const MatView: React.FC<{
  data: Mat;
  title?: React.ReactNode;
  titleColor?: string;
  rows?: string[];
  cell?: number;
  h?: number;
  fs?: number;
  split?: number;
  shape?: string;
  hl?: (r: number, c: number) => string | undefined;
  dim?: (r: number, c: number) => boolean;
  text?: (r: number, c: number, v: number) => string;
  bg?: (r: number, c: number, v: number) => string;
}> = ({data, title, titleColor = C.text, rows, cell = 60, h = 40, fs = 16, split, shape, hl, dim, text, bg}) => (
  <div style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center'}}>
    {title && <div style={{fontSize: 26, fontWeight: 700, color: titleColor, marginBottom: 8}}>{title}</div>}
    <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
      {data.map((row, r) => (
        <div key={r} style={{display: 'flex', alignItems: 'center', gap: 4}}>
          {rows && (
            <div style={{width: 90, textAlign: 'right', paddingRight: 8, fontSize: 18, color: TOK_COLORS[r % 6]}}>{rows[r]}</div>
          )}
          {row.map((v, c) => {
            const border = hl?.(r, c);
            return (
              <div
                key={c}
                style={{
                  width: cell,
                  height: h,
                  borderRadius: 6,
                  marginLeft: split !== undefined && c === split ? 10 : 0,
                  background: bg ? bg(r, c, v) : tint(v),
                  border: border ? `3px solid ${border}` : '1px solid transparent',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: fs,
                  opacity: dim?.(r, c) ? 0.25 : 1,
                }}
              >
                {text ? text(r, c, v) : fmt(v)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
    {shape && <div style={{fontFamily: MONO, fontSize: 18, color: C.dim, marginTop: 8}}>{shape}</div>}
  </div>
);

const Op: React.FC<{children: React.ReactNode; at?: number}> = ({children, at = 0}) => (
  <Appear at={at} style={{fontSize: 52, color: C.dim, margin: '0 18px', alignSelf: 'center'}}>
    {children}
  </Appear>
);

// ---------------------------------------------------------------------------------------------
// 1 · token vectors → X
// ---------------------------------------------------------------------------------------------
const BeatX: React.FC = () => (
  <>
    <Lead>Cümle "Yapay zeka metni okur . Model" (6 kelime) → her kelimenin vektörü alt alta = X matrisi</Lead>
    <div style={{display: 'flex', gap: 60, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
        {TOK.map((t, r) => (
          <Appear key={r} at={15 + r * 16} x={-20} y={0} style={{display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{width: 150, textAlign: 'right'}}>
              <Chip size={24} color={TOK_COLORS[r]}>
                {t}
              </Chip>
            </div>
            <div style={{fontSize: 26, color: C.dim}}>→</div>
            <MatView data={[X[r]]} cell={84} h={46} fs={19} />
          </Appear>
        ))}
      </div>
      <Appear at={130} style={{display: 'flex', alignItems: 'center', gap: 20}}>
        <div style={{width: 18, height: 360, border: `3px solid ${C.accent}`, borderLeft: 'none', borderRadius: '0 14px 14px 0'}} />
        <div>
          <div style={{fontSize: 56, fontWeight: 800, fontFamily: MATH}}>X</div>
          <div style={{fontFamily: MONO, fontSize: 24, color: C.dim}}>6 × 4</div>
        </div>
      </Appear>
      <Appear at={150}>
        <Panel accent={C.accent} side="left" style={{width: 520, fontSize: 24, lineHeight: 1.55}}>
          <div>
            Her <b>satır</b> = bir token'ın vektörü (embedding + pozisyon)
          </div>
          <div>
            <b>Sütun</b> sayısı = d_model (burada 4, GPT-2'de 768)
          </div>
          <div>
            <b>Satır</b> sayısı = token sayısı (≤ context length)
          </div>
        </Panel>
      </Appear>
    </div>
    <Caption at={190}>Model kelimeleri tek tek değil, bu matrisi bir bütün olarak işler.</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 2 · learned weights vs computed Q/K/V
// ---------------------------------------------------------------------------------------------
const BeatW: React.FC = () => (
  <>
    <Lead>Öğrenilen ağırlıklar: Wq, Wk, Wv — her biri 4 × 4 sayı</Lead>
    <div style={{display: 'flex', gap: 70, justifyContent: 'center'}}>
      {(
        [
          ['Wq', W.q, C.q],
          ['Wk', W.k, C.k],
          ['Wv', W.v, C.v],
        ] as [string, Mat, string][]
      ).map(([name, m, c], i) => (
        <Appear key={name} at={15 + i * 25}>
          <MatView data={m} title={name} titleColor={c} cell={74} h={50} fs={18} shape="4 × 4" />
        </Appear>
      ))}
    </div>
    <div style={{display: 'flex', gap: 30, justifyContent: 'center', marginTop: 36}}>
      <Appear at={110}>
        <Panel accent={C.yellow} side="left" style={{width: 720, fontSize: 24, lineHeight: 1.45}}>
          <b>Wq, Wk, Wv</b> = modelin ağırlıkları. Eğitimde öğrenilir, bütün cümleler için <b>aynıdır</b>.
        </Panel>
      </Appear>
      <Appear at={135}>
        <Panel accent={C.teal} side="left" style={{width: 720, fontSize: 24, lineHeight: 1.45}}>
          <b>Q, K, V</b> = bu cümle için <b>hesaplanan</b> sonuçlar: X'in bu matrislerle çarpımı. Her cümlede yeniden.
        </Panel>
      </Appear>
    </div>
    <Caption at={190}>"QKV matrisleri" derken iki şey kastedilebilir: öğrenilen W'ler ya da onlarla hesaplanan Q, K, V.</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 3 · one token: q = x · Wq, element by element
// ---------------------------------------------------------------------------------------------
const COL_AT = [50, 150, 190, 230];
const BeatOneToken: React.FC = () => {
  const f = useCurrentFrame();
  const x = X[METNI];
  const q = Q[METNI];
  const active = COL_AT.reduce((a, t, j) => (f >= t ? j : a), -1);
  const done = (j: number) => f >= COL_AT[j] + 20;
  const k = K[METNI];
  const v = V[METNI];
  return (
    <>
      <Lead>Tek bir kelime için: "metni" kelimesinin vektörü × Wq = "metni"nin sorusu (q)</Lead>
      <Appear at={5} style={{textAlign: 'center', fontSize: 21, color: C.dim, marginTop: -14, marginBottom: 14}}>
        cümle: "Yapay zeka metni okur . Model" → "metni" 3. kelime; x = X matrisinin 3. satırı (4 sayı)
      </Appear>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Appear at={10}>
          <MatView data={[x]} title='x = tek kelime: "metni"' titleColor={C.v} cell={92} h={56} fs={20} hl={() => (active >= 0 ? C.yellow : undefined)} shape="1 kelime × 4 sayı" />
        </Appear>
        <Op at={20}>×</Op>
        <Appear at={25}>
          <MatView
            data={W.q}
            title="Wq (öğrenilen matris)"
            titleColor={C.q}
            cell={92}
            h={56}
            fs={20}
            hl={(_, c) => (c === active ? C.yellow : undefined)}
            dim={(_, c) => active >= 0 && c !== active && f < 280}
            shape="4 × 4 · her kelime için aynı"
          />
        </Appear>
        <Op at={35}>=</Op>
        <Appear at={40}>
          <MatView
            data={[q]}
            title='q = "metni"nin sorusu'
            titleColor={C.q}
            cell={92}
            h={56}
            fs={20}
            text={(_, c, val) => (done(c) ? fmt(val) : '?')}
            bg={(_, c, val) => (done(c) ? tint(val) : C.panel)}
            hl={(_, c) => (c === active ? C.yellow : undefined)}
            shape="1 × 4"
          />
        </Appear>
      </div>
      {active >= 0 && (
        <div style={{textAlign: 'center', fontFamily: MONO, fontSize: 25, marginTop: 30, minHeight: 40}}>
          q[{active}] = {x.map((xi, i) => `${fmt(xi)}×${fmt(W.q[i][active])}`).join(' + ')} ={' '}
          <b style={{color: C.yellow}}>{fmt(q[active])}</b>
          <div style={{fontFamily: FONT, fontSize: 19, color: C.dim, marginTop: 6}}>
            q'nun {active}. sayısı = x'in 4 sayısı × Wq'nun {active}. sütunu (sarı), tek tek çarpılıp toplanır · sayma 0'dan başlar
          </div>
        </div>
      )}
      <Appear at={300} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: 18, fontFamily: MONO, fontSize: 23}}>
        <div>
          <span style={{color: C.k}}>k</span> = x · Wk = [{k.map((n) => fmt(n)).join(', ')}]{' '}
          <span style={{fontFamily: FONT, color: C.dim}}>→ "metni"nin etiketi</span>
        </div>
        <div>
          <span style={{color: C.v}}>v</span> = x · Wv = [{v.map((n) => fmt(n)).join(', ')}]{' '}
          <span style={{fontFamily: FONT, color: C.dim}}>→ "metni"nin taşıdığı bilgi</span>
        </div>
      </Appear>
      <Caption at={360}>Aynı token vektörü üç ayrı matrisle çarpılır → üç rol: soru (q), etiket (k), taşıdığı bilgi (v).</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 4 · all tokens: Q, K, V
// ---------------------------------------------------------------------------------------------
const BeatQKV: React.FC = () => (
  <>
    <Lead>Bütün kelimeler birden: X (6 kelime × 4 sayı) · W (4×4) = Q, K, V (6×4)</Lead>
    <div style={{display: 'flex', gap: 40, justifyContent: 'center'}}>
      {(
        [
          ['Q = X·Wq', Q, C.q, 'her token\'ın sorusu'],
          ['K = X·Wk', K, C.k, 'her token\'ın etiketi'],
          ['V = X·Wv', V, C.v, 'her token\'ın bilgisi'],
        ] as [string, Mat, string, string][]
      ).map(([name, m, c, note], i) => (
        <Appear key={name} at={15 + i * 30} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
          <MatView data={m} title={name} titleColor={c} rows={i === 0 ? TOK : undefined} cell={70} h={46} fs={17} split={2} shape="6 × 4" />
          <div style={{fontSize: 21, color: C.dim, marginTop: 4}}>{note}</div>
        </Appear>
      ))}
    </div>
    <Appear at={120} style={{display: 'flex', justifyContent: 'center', gap: 120, marginTop: 14, fontSize: 22}}>
      <span style={{color: C.yellow}}>ilk 2 sütun → kafa 1</span>
      <span style={{color: C.k}}>son 2 sütun → kafa 2</span>
    </Appear>
    <Caption at={160}>Satır = kelime, sütun = sayı. 2 kafa: 4 ÷ 2 = kafa başına 2 sütun (belgedeki 768 ÷ 96 = 8'in küçüğü).</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 4b · where Q and K come from: multiply, then split into heads
// ---------------------------------------------------------------------------------------------
const Mini: React.FC<{data: Mat; title: React.ReactNode; color: string; sub: string; colColor?: (c: number) => string}> = ({
  data,
  title,
  color,
  sub,
  colColor,
}) => (
  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <MatView
      data={data}
      title={title}
      titleColor={color}
      cell={30}
      h={24}
      fs={10}
      text={() => ''}
      bg={(_, c, v) => hexA(colColor ? colColor(c) : color, Math.min(0.85, 0.2 + Math.abs(v) * 0.35))}
    />
    <div style={{width: 170, marginTop: 8, textAlign: 'center', fontSize: 17, lineHeight: 1.3, color: C.dim}}>
      {sub.split('\n').map((l) => (
        <div key={l}>{l}</div>
      ))}
    </div>
  </div>
);

const BeatOrigin: React.FC = () => (
  <>
    <Lead>Q ve K nereden geliyor? W'lerden ayrılmıyor — X ile ÇARPILIYOR</Lead>
    <div style={{display: 'flex', justifyContent: 'center', gap: 90}}>
      {(
        [
          ['Q', 'Wq', W.q, Q, C.q, '6 × 4\nher kelimenin sorusu'],
          ['K', 'Wk', W.k, K, C.k, '6 × 4\nher kelimenin etiketi'],
        ] as [string, string, Mat, Mat, string, string][]
      ).map(([n, wn, w, res, c, note], i) => (
        <Appear key={n} at={15 + i * 40} style={{display: 'flex', alignItems: 'center', gap: 14}}>
          <Mini data={X} title="X" color={C.accent} sub={'cümle\n6 kelime × 4 sayı'} />
          <span style={{fontSize: 34, color: C.dim}}>×</span>
          <Mini data={w} title={wn} color={c} sub={'4 × 4 · öğrenilen\nher cümlede aynı'} />
          <span style={{fontSize: 34, color: C.dim}}>=</span>
          <Mini data={res} title={n} color={c} sub={note} />
        </Appear>
      ))}
    </div>
    <Appear at={130} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 26}}>
      <div style={{fontSize: 23, width: 300, textAlign: 'right', lineHeight: 1.4}}>
        Kafalara bölme <b>bundan sonra</b>: Q'nun sütunları paylaştırılır
      </div>
      <Mini data={Q} title="Q" color={C.q} sub="6 × 4" colColor={(cc) => (cc < 2 ? C.yellow : C.k)} />
      <span style={{fontSize: 34, color: C.dim}}>→</span>
      <Mini data={cols(Q, 0, 2)} title="Q₁ (kafa 1)" color={C.yellow} sub={'6 × 2\nilk 2 sütun'} />
      <Mini data={cols(Q, 2, 4)} title="Q₂ (kafa 2)" color={C.k} sub={'6 × 2\nson 2 sütun'} />
      <div style={{fontSize: 22, color: C.dim, width: 240, lineHeight: 1.4}}>K ve V de aynı şekilde: K₁, K₂, V₁, V₂</div>
    </Appear>
    <Appear at={230}>
      <Panel accent={C.yellow} side="left" style={{marginTop: 22, fontSize: 23, lineHeight: 1.5, padding: '12px 26px'}}>
        Kafa 1'in puan tablosu: <b>Q₁ (6×2) · K₁ᵀ (2×6) = 6×6</b>. <b>ᵀ</b> (transpoz) K₁'i yan yatırır: her kelime bir sütun olur, böylece
        satır × sütun çarpılabilir.
      </Panel>
    </Appear>
    <Caption at={300}>Wq, Wk = kalıp (eğitimde öğrenilir) · X = malzeme (cümleden gelir). Önce çarp, sonra sütunları kafalara paylaştır.</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 5 · scores of head 1, one cell in detail, then mask and softmax
// ---------------------------------------------------------------------------------------------
const BeatScores: React.FC = () => {
  const f = useCurrentFrame();
  const phase = f < 270 ? 0 : f < 350 ? 1 : 2;
  const qm = H1.q[MODEL];
  const ko = H1.k[OKUR];
  return (
    <>
      <Lead>Kafa 1'in puan tablosu: her kelime her kelimeye soru sorar → skor = q · k / √2</Lead>
      <div style={{display: 'flex', gap: 50, alignItems: 'flex-start', justifyContent: 'center'}}>
        <Appear at={10}>
          <div style={{display: 'flex', marginLeft: 94, gap: 4, marginBottom: 6}}>
            {TOK.map((t, c) => (
              <div key={c} style={{width: 76, textAlign: 'center', fontSize: 17, color: TOK_COLORS[c]}}>
                {t}
              </div>
            ))}
          </div>
          <MatView
            data={phase < 2 ? H1.scores : H1.A}
            rows={TOK}
            cell={76}
            h={50}
            fs={18}
            text={(r, c, v) => (phase >= 1 && c > r ? (phase === 1 ? '−∞' : '0') : fmt(v))}
            bg={(r, c, v) =>
              phase >= 1 && c > r ? hexA(C.red, phase === 1 ? 0.4 : 0.1) : phase === 2 ? hexA(C.yellow, 0.1 + 0.8 * v) : tint(v)
            }
            hl={(r, c) => (r === MODEL && c === OKUR && f >= 40 ? C.yellow : undefined)}
          />
          <div style={{fontSize: 18, color: C.dim, marginLeft: 94, marginTop: 6}}>satır = soran (q) · sütun = cevap veren (k)</div>
        </Appear>
        <div style={{width: 680, display: 'flex', flexDirection: 'column', gap: 14}}>
          <Appear at={20}>
            <Panel accent={C.accent} side="left" style={{fontSize: 21, lineHeight: 1.45, padding: '12px 22px'}}>
              Bu tablo = kafa 1'de <b>her kelimenin her kelimeye eşleşme puanı</b>. Mavi / büyük = "buna bakmalıyım", turuncu / negatif =
              "bakmamalıyım". Şu an <b>maskesiz ham puan</b>.
            </Panel>
          </Appear>
          <Appear at={60}>
            <Panel accent={C.yellow} side="left" style={{fontFamily: MONO, fontSize: 20, lineHeight: 1.55, padding: '12px 22px'}}>
              <div>
                q("Model") = [{qm.map((n) => fmt(n)).join(', ')}]{' '}
                <span style={{fontFamily: FONT, color: C.dim}}>← Model'in kafa 1 sorusu (Q'nun ilk 2 sayısı)</span>
              </div>
              <div>
                k("okur") = [{ko.map((n) => fmt(n)).join(', ')}]{' '}
                <span style={{fontFamily: FONT, color: C.dim}}>← okur'un kafa 1 etiketi (K'nın ilk 2 sayısı)</span>
              </div>
              <div style={{marginTop: 4}}>
                skor = ({fmt(qm[0])}×{fmt(ko[0])} + {fmt(qm[1])}×{fmt(ko[1])}) / √2 = <b style={{color: C.yellow}}>{fmt(H1.scores[MODEL][OKUR])}</b>
              </div>
              <div style={{fontFamily: FONT, fontSize: 18, color: C.dim, marginTop: 4}}>
                Neden 2 sayı? 2 kafa var → kafa başına 2 · Neden √2? dₖ = 2 (kafanın q / k uzunluğu)
              </div>
            </Panel>
          </Appear>
          <Appear at={200}>
            <Panel side="left" accent={C.faint} style={{fontSize: 21, lineHeight: 1.6, padding: '12px 22px'}}>
              {(
                [
                  ['1 · Skorlar: her q her k ile çarpılır (nokta çarpımı)', 0],
                  ['2 · Maske: gelecekteki kelimeler −∞ (göremez)', 1],
                  [`3 · Softmax: satırlar yüzdeye döner, toplam 1 → "Model", "okur"a ${H1.A[MODEL][OKUR].toFixed(2)}`, 2],
                ] as [string, number][]
              ).map(([t, p]) => (
                <div key={p} style={{color: phase === p ? C.text : C.dim, fontWeight: phase === p ? 700 : 400}}>
                  {phase === p ? '▶ ' : ''}
                  {t}
                </div>
              ))}
            </Panel>
          </Appear>
        </div>
      </div>
      <Caption at={420}>Ortaya çıkan 6×6 tablo, "kim kime ne kadar bakıyor" sorusunun cevabı: attention ağırlıkları (A).</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 6 · weighted sum for one row
// ---------------------------------------------------------------------------------------------
const BeatWeighted: React.FC = () => {
  const f = useCurrentFrame();
  const a = H1.A[MODEL];
  const sum = H1.out[MODEL];
  return (
    <>
      <Lead>"Model" satırı: yeni vektör = Σ (ağırlık × v)</Lead>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center'}}>
        <div style={{display: 'flex', gap: 20, fontSize: 18, color: C.dim, width: 1100, lineHeight: 1.3}}>
          <div style={{width: 150, textAlign: 'right'}}>Model kime bakıyor</div>
          <div style={{width: 300}}>ağırlık: maske + softmax sonrası (toplam 1)</div>
          <div style={{width: 200, textAlign: 'center'}}>v = o kelimenin kafa 1'deki bilgisi</div>
          <div style={{width: 60}} />
          <div style={{width: 220, textAlign: 'center'}}>ağırlık × v = katkısı</div>
        </div>
        {TOK.map((t, j) => {
          const p = interpolate(f, [20 + j * 18, 45 + j * 18], [0, 1], clamp);
          return (
            <Appear key={j} at={20 + j * 18} style={{display: 'flex', alignItems: 'center', gap: 20, width: 1100}}>
              <div style={{width: 150, textAlign: 'right'}}>
                <Chip size={20} color={TOK_COLORS[j]}>
                  {t}
                </Chip>
              </div>
              <div style={{width: 300, display: 'flex', alignItems: 'center', gap: 10}}>
                <div style={{width: 200, height: 20, background: C.panel2, borderRadius: 6}}>
                  <div style={{width: 200 * a[j] * p, height: '100%', background: C.yellow, borderRadius: 6}} />
                </div>
                <span style={{fontFamily: MONO, fontSize: 20}}>{a[j].toFixed(2)}</span>
              </div>
              <div style={{width: 200, display: 'flex', justifyContent: 'center'}}>
                <MatView data={[H1.v[j]]} cell={70} h={36} fs={16} />
              </div>
              <div style={{width: 60, textAlign: 'center', fontSize: 26, color: C.dim}}>→</div>
              <div style={{width: 220, display: 'flex', justifyContent: 'center'}}>
                <MatView data={[H1.v[j].map((n) => n * a[j])]} cell={70} h={36} fs={16} />
              </div>
            </Appear>
          );
        })}
        <Appear at={150} style={{display: 'flex', alignItems: 'center', gap: 20, width: 1100, marginTop: 8}}>
          <div style={{width: 690, textAlign: 'right', fontSize: 24, fontWeight: 700}}>toplam = "Model"in kafa 1 çıktısı</div>
          <div style={{width: 60, textAlign: 'center', fontSize: 26, color: C.dim}}>=</div>
          <div style={{width: 220, display: 'flex', justifyContent: 'center'}}>
            <MatView data={[sum]} cell={70} h={40} fs={17} hl={() => C.yellow} />
          </div>
        </Appear>
        <Appear at={190} style={{fontFamily: MONO, fontSize: 21, marginTop: 4}}>
          ilk sayı:{' '}
          {TOK.map((_, j) => H1.v[j][0] * a[j])
            .map((n, j) => (j === 0 ? fmt(n) : `${n < 0 ? ' − ' : ' + '}${Math.abs(n).toFixed(2)}`))
            .join('')}{' '}
          ≈ <b style={{color: C.yellow}}>{fmt(sum[0])}</b>
        </Appear>
        <Appear at={230}>
          <Panel accent={C.v} side="left" style={{fontSize: 21, padding: '10px 22px', marginTop: 6}}>
            Aynı hesap her kelime için (6 satır) ve her kafa için yapılır → kafa 1'in çıktısı 6 × 2 olur.
          </Panel>
        </Appear>
      </div>
      <Caption at={280}>Her token, baktığı token'ların bilgisini (v) ağırlığı kadar alır. Bu, kafa 1'in "Model" için ürettiği yeni 2 sayı.</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 7 · two heads side by side, then concat
// ---------------------------------------------------------------------------------------------
const Heat: React.FC<{A: Mat; color: string; title: string}> = ({A, color, title}) => (
  <MatView
    data={A}
    title={title}
    titleColor={color}
    cell={46}
    h={34}
    fs={13}
    text={(r, c, v) => (c > r ? '' : v.toFixed(2))}
    bg={(r, c, v) => (c > r ? hexA(C.faint, 0.2) : hexA(color, 0.1 + 0.85 * v))}
  />
);

const BeatHeads: React.FC = () => (
  <>
    <Lead>İki kafa aynı cümleye kendi Q, K, V sütunlarıyla bakar (bölünen X değil, sütunlar) → sonuçlar yan yana</Lead>
    <div style={{display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center'}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 30}}>
        <Appear at={10}>
          <Heat A={H1.A} color={C.yellow} title="Kafa 1 · A" />
        </Appear>
        <Appear at={40}>
          <Heat A={H2.A} color={C.k} title="Kafa 2 · A" />
        </Appear>
      </div>
      <Op at={80}>→</Op>
      <div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
        <Appear at={90}>
          <MatView data={H1.out} title="Kafa 1 çıktısı" titleColor={C.yellow} cell={70} h={34} fs={15} shape="6 × 2" />
        </Appear>
        <Appear at={110}>
          <MatView data={H2.out} title="Kafa 2 çıktısı" titleColor={C.k} cell={70} h={34} fs={15} shape="6 × 2" />
        </Appear>
      </div>
      <Op at={150}>→</Op>
      <Appear at={160}>
        <MatView
          data={CONCAT}
          title="Concat (yan yana)"
          rows={TOK}
          cell={70}
          h={46}
          fs={16}
          split={2}
          bg={(_, c, v) => hexA(c < 2 ? C.yellow : C.k, Math.min(0.8, 0.15 + Math.abs(v) * 0.4))}
          shape="6 × 4"
        />
      </Appear>
    </div>
    <Caption at={200}>Her kafa kendi Q, K, V sütunlarıyla ayrı bir dikkat tablosu hesaplar; çıktıları birleşince yine 4 sayı olur.</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 8 · Wo
// ---------------------------------------------------------------------------------------------
const BeatWo: React.FC = () => {
  const f = useCurrentFrame();
  const c = CONCAT[MODEL];
  const out = OUT[MODEL];
  const filled = (j: number) => (j === 0 ? f >= 140 : f >= 200);
  return (
    <>
      <Lead>Wo: kafaların bilgisini birbirine karıştıran son matris (o = output)</Lead>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Appear at={10}>
          <MatView
            data={[c]}
            title='concat ("Model")'
            cell={92}
            h={56}
            fs={20}
            split={2}
            bg={(_, j, v) => hexA(j < 2 ? C.yellow : C.k, Math.min(0.8, 0.2 + Math.abs(v) * 0.4))}
            shape="kafa 1 | kafa 2"
          />
        </Appear>
        <Op at={20}>×</Op>
        <Appear at={25}>
          <MatView
            data={W.o}
            title="Wo"
            titleColor={C.teal}
            cell={92}
            h={56}
            fs={20}
            hl={(_, j) => (j === 0 && f >= 60 && f < 200 ? C.yellow : undefined)}
            shape="4 × 4 (öğrenilir)"
          />
        </Appear>
        <Op at={35}>=</Op>
        <Appear at={40}>
          <MatView
            data={[out]}
            title="çıktı"
            titleColor={C.teal}
            cell={92}
            h={56}
            fs={20}
            text={(_, j, v) => (filled(j) ? fmt(v) : '?')}
            bg={(_, j, v) => (filled(j) ? tint(v) : C.panel)}
            shape="1 × 4"
          />
        </Appear>
      </div>
      <Appear at={60} style={{textAlign: 'center', fontFamily: MONO, fontSize: 24, marginTop: 26}}>
        çıktı[0] ={' '}
        <span style={{color: C.yellow}}>
          {fmt(c[0])}×{fmt(W.o[0][0])} + {fmt(c[1])}×{fmt(W.o[1][0])}
        </span>{' '}
        +{' '}
        <span style={{color: C.k}}>
          {fmt(c[2])}×{fmt(W.o[2][0])} + {fmt(c[3])}×{fmt(W.o[3][0])}
        </span>{' '}
        = <b>{fmt(out[0])}</b>
      </Appear>
      <Appear at={100} style={{textAlign: 'center', fontSize: 22, marginTop: 6}}>
        <span style={{color: C.yellow}}>kafa 1'den gelen kısım</span> + <span style={{color: C.k}}>kafa 2'den gelen kısım</span>
      </Appear>
      <div style={{display: 'flex', gap: 30, justifyContent: 'center', marginTop: 28}}>
        <Appear at={230}>
          <Panel accent={C.red} side="left" style={{width: 700, fontSize: 23, lineHeight: 1.45}}>
            <b>Wo olmasaydı:</b> çıktının ilk 2 sayısı sadece kafa 1'den, son 2'si sadece kafa 2'den gelirdi. Kafalar birbirinden habersiz kalırdı.
          </Panel>
        </Appear>
        <Appear at={260}>
          <Panel accent={C.teal} side="left" style={{width: 700, fontSize: 23, lineHeight: 1.45}}>
            <b>Wo ile:</b> her çıktı sayısı bütün kafalardan bilgi alır. Wo da eğitimde öğrenilir (GPT-2'de 768 × 768).
          </Panel>
        </Appear>
      </div>
      <Caption at={330}>Multi-Head Attention'ın son adımı: concat · Wo. Çıktı yine d_model boyutunda (burada 4).</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 9 · the whole path with shapes
// ---------------------------------------------------------------------------------------------
const FLOW: [string, string, string][] = [
  ['X', '6 × 4', 'T × 768'],
  ['× Wq, Wk, Wv', '', ''],
  ['Q, K, V', '6 × 4', 'T × 768'],
  ['kafalara böl', '2 × (6 × 2)', '96 × (T × 8)'],
  ['softmax(QKᵀ/√dₖ)·V', 'her kafada', 'her kafada'],
  ['concat', '6 × 4', 'T × 768'],
  ['× Wo', '6 × 4', 'T × 768'],
];

const BeatFlow: React.FC = () => (
  <>
    <Lead>Bütün yol, boyutlarıyla</Lead>
    <div style={{display: 'grid', gridTemplateColumns: `190px repeat(${FLOW.length}, 1fr)`, rowGap: 48, columnGap: 10, alignItems: 'center', marginTop: 50}}>
      <div />
      {FLOW.map(([name], i) => (
        <Appear key={name} at={15 + i * 18} style={{textAlign: 'center'}}>
          <Chip size={22} color={[C.accent, C.dim, C.q, C.yellow, C.k, C.pos, C.teal][i]} style={{whiteSpace: 'normal', textAlign: 'center', minHeight: 70}}>
            {name}
          </Chip>
        </Appear>
      ))}
      <Appear at={150} style={{fontSize: 26, color: C.dim, textAlign: 'right'}}>
        bu örnek
      </Appear>
      {FLOW.map(([name, small], i) => (
        <Appear key={`s${name}`} at={150 + i * 8} style={{textAlign: 'center', fontFamily: MONO, fontSize: 27}}>
          {small}
        </Appear>
      ))}
      <Appear at={200} style={{fontSize: 26, color: C.dim, textAlign: 'right'}}>
        GPT-2 küçük
      </Appear>
      {FLOW.map(([name, , big], i) => (
        <Appear key={`b${name}`} at={200 + i * 8} style={{textAlign: 'center', fontFamily: MONO, fontSize: 27, color: C.yellow}}>
          {big}
        </Appear>
      ))}
    </div>
    <Caption at={240}>Boyut girişte ve çıkışta aynı; arada her token, cümlenin geri kalanından bilgi toplamış olur.</Caption>
  </>
);

export const ATTN_MATRICES_DUR = 3870;

export const AttentionMatrices: React.FC = () => (
  <Scene no={11} title="Matrislerle Attention" subtitle="token vektörü → Q, K, V → kafalar → Wo">
    <Beat from={0} dur={270} terms={['matrix', 'dmodel']}>
      <BeatX />
    </Beat>
    <Beat from={270} dur={270} terms={['param', 'wqkv']}>
      <BeatW />
    </Beat>
    <Beat from={540} dur={480} terms={['matmul', 'qkv']}>
      <BeatOneToken />
    </Beat>
    <Beat from={1020} dur={270} terms={['qkv', 'head']}>
      <BeatQKV />
    </Beat>
    <Beat from={1290} dur={420} terms={['matmul', 'transpose']}>
      <BeatOrigin />
    </Beat>
    <Beat from={1710} dur={540} terms={['dot', 'dk']}>
      <BeatScores />
    </Beat>
    <Beat from={2250} dur={480} terms={['attnweight', 'ctxvec']}>
      <BeatWeighted />
    </Beat>
    <Beat from={2730} dur={360} terms={['head', 'concat']}>
      <BeatHeads />
    </Beat>
    <Beat from={3090} dur={480} terms={['wo', 'concat']}>
      <BeatWo />
    </Beat>
    <Beat from={3570} dur={300} terms={['dmodel', 'softmax']}>
      <BeatFlow />
    </Beat>
  </Scene>
);

import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Appear, Beat, Caption, Chip, Lead, Panel, Scene, clamp, hexA, useProgress} from '../components';
import {C, FONT, MONO} from '../theme';
import raw from '../data/training.json';

// ---------------------------------------------------------------------------------------------
// Data: every number in this scene comes from scripts/train_tiny.py (a real 332-parameter model).
// ---------------------------------------------------------------------------------------------
type Mat = number[][];
type Pass = {
  E: Mat; P: Mat; X: Mat; Q: Mat; K: Mat; V: Mat;
  heads: {S: Mat; scaled: Mat; A: Mat}[];
  C: Mat; M: Mat; R1: Mat; N1: Mat; Hid: Mat; Fo: Mat; R2: Mat; N2: Mat; logits: Mat; probs: Mat;
  lossTok: number[]; loss: number;
};
type TrainingData = {
  paragraph: string; tokens: string[]; vocab: string[]; ids: number[]; ctx: number; params: number;
  windows: {x: string[]; y: string[]}[];
  step0: Pass; final: Pass;
  grad: {token: string; before: number[]; grad: number[]; after: number[]; lr: number; batchLoss: number};
  curve: number[];
  checkpoints: {step: number; probs: Mat; loss: number; lossTok: number[]}[];
  generation: {prompt: string[]; steps: {context: string[]; top: [string, number][]; chosen: string}[]};
  lr: number; steps: number;
};
const DATA = raw as unknown as TrainingData;
const S0 = DATA.step0;
const EX = DATA.windows[0];
const VOCAB = DATA.vocab;

export const TRAINING_DUR = 5070;
const TOTAL_STEPS = 13;

const VOCAB_COLORS = [C.q, C.teal, C.v, C.pos, C.yellow, C.k, C.red, C.accent, '#f472b6', '#a3e635'];
const tokColor = (t: string) => VOCAB_COLORS[Math.max(0, VOCAB.indexOf(t)) % VOCAB_COLORS.length];
const fmt = (v: number, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
const argmax = (row: number[]) => row.reduce((b, v, i) => (v > row[b] ? i : b), 0);

// ---------------------------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------------------------
const LABW = 250;
const COLW = (1720 - LABW) / 6;

const valColor = (v: number) => hexA(v >= 0 ? C.q : C.k, Math.min(0.85, 0.12 + Math.abs(v) * 0.35));

const VecCells: React.FC<{vals: number[]; split?: number; cell?: number}> = ({vals, split, cell = 54}) => (
  <div style={{display: 'flex', gap: 3}}>
    {vals.map((v, i) => (
      <div
        key={i}
        style={{
          width: cell,
          height: 42,
          borderRadius: 6,
          background: valColor(v),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 16,
          marginLeft: split !== undefined && i === split ? 10 : 0,
        }}
      >
        {fmt(v)}
      </div>
    ))}
  </div>
);

const StepTag: React.FC<{n: number; name: string}> = ({n, name}) => (
  <div style={{position: 'absolute', left: 0, top: -68, fontSize: 24, whiteSpace: 'nowrap'}}>
    <span style={{fontFamily: MONO, color: C.accent}}>
      ADIM {n} / {TOTAL_STEPS}
    </span>
    <b style={{marginLeft: 12}}>{name}</b>
  </div>
);

const TokenHeader: React.FC<{tokens: string[]; at?: number; sub?: (i: number) => string}> = ({tokens, at = 0, sub}) => (
  <div style={{display: 'flex', marginBottom: 18}}>
    <div style={{width: LABW}} />
    {tokens.map((t, i) => (
      <Appear key={i} at={at + i * 4} style={{width: COLW, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Chip size={26} color={tokColor(t)}>
          {t}
        </Chip>
        {sub && <div style={{fontSize: 17, color: C.dim, marginTop: 6, fontFamily: MONO}}>{sub(i)}</div>}
      </Appear>
    ))}
  </div>
);

const TokenRow: React.FC<{
  label: React.ReactNode;
  note?: string;
  at: number;
  color?: string;
  cell: (i: number) => React.ReactNode;
  dim?: boolean;
}> = ({label, note, at, color = C.text, cell, dim}) => (
  <div style={{display: 'flex', alignItems: 'center', marginBottom: 22, opacity: dim ? 0.5 : 1}}>
    <Appear at={at} x={-20} y={0} style={{width: LABW, paddingRight: 20, textAlign: 'right', boxSizing: 'border-box'}}>
      <div style={{fontSize: 25, fontWeight: 700, color}}>{label}</div>
      {note && <div style={{fontSize: 17, color: C.dim}}>{note}</div>}
    </Appear>
    {Array.from({length: 6}).map((_, i) => (
      <Appear key={i} at={at + 10 + i * 7} style={{width: COLW, display: 'flex', justifyContent: 'center'}}>
        {cell(i)}
      </Appear>
    ))}
  </div>
);

const FlowBar: React.FC<{items: string[]; active: number}> = ({items, active}) => (
  <div style={{display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 26, flexWrap: 'wrap'}}>
    {items.map((t, i) => (
      <div
        key={t}
        style={{
          fontSize: 19,
          padding: '6px 14px',
          borderRadius: 999,
          border: `2px solid ${i === active ? C.accent : C.panelBorder}`,
          background: i === active ? hexA(C.accent, 0.2) : 'transparent',
          color: i === active ? C.text : C.dim,
          fontWeight: i === active ? 700 : 400,
        }}
      >
        {t}
      </div>
    ))}
  </div>
);
const FLOW = ['Embedding + Pozisyon', 'Q, K, V', 'Attention', 'A·V + Wo', 'Add & Norm', 'FFN + Add & Norm', 'Linear + Softmax'];

// ---------------------------------------------------------------------------------------------
// 1 · Tokenizer
// ---------------------------------------------------------------------------------------------
const BeatTokenize: React.FC = () => (
  <>
    <StepTag n={1} name="Tokenizer" />
    <Lead>Eğitim verimiz kısa bir paragraf</Lead>
    <Appear at={5} style={{textAlign: 'center', fontSize: 50, fontWeight: 600}}>
      "{DATA.paragraph}"
    </Appear>
    <div style={{display: 'flex', justifyContent: 'center', gap: 12, marginTop: 56}}>
      {DATA.tokens.map((t, i) => (
        <Appear key={i} at={60 + i * 9} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8}}>
          <div style={{fontFamily: MONO, fontSize: 16, color: C.dim}}>t{i + 1}</div>
          <Chip size={28} color={tokColor(t)}>
            {t}
          </Chip>
          <div style={{fontSize: 22, color: C.dim}}>↓</div>
          <Chip size={24} mono filled color={tokColor(t)}>
            {DATA.ids[i]}
          </Chip>
        </Appear>
      ))}
    </div>
    <Appear at={190} style={{marginTop: 50, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10}}>
      <div style={{fontSize: 22, color: C.dim, marginRight: 8}}>Sözlük (vocab):</div>
      {VOCAB.map((v, i) => (
        <div key={v} style={{fontSize: 20, padding: '6px 10px', borderRadius: 8, border: `1px solid ${tokColor(v)}`}}>
          <span style={{fontFamily: MONO, color: tokColor(v)}}>{i}</span> {v}
        </div>
      ))}
    </Appear>
    <Caption at={240}>
      Basitlik için kelime düzeyi tokenizer: 11 token, 10 farklı kelime. "." iki kez geçiyor ama ID'si hep aynı (4).
    </Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 2 · DataLoader
// ---------------------------------------------------------------------------------------------
const WCHIP = 112;
const BeatWindows: React.FC = () => {
  const hi = useProgress(190, 215);
  return (
    <>
      <StepTag n={2} name="DataLoader" />
      <Lead>Context length = 6 → paragraf, bir token kaydırılarak 5 örneğe bölünür</Lead>
      <Appear at={5} style={{display: 'flex', justifyContent: 'center', gap: 12, fontSize: 22, marginBottom: 8}}>
        <div style={{width: 110}} />
        <div style={{width: WCHIP * 6 + 30, textAlign: 'center', color: C.q}}>Girdi (x)</div>
        <div style={{width: 70}} />
        <div style={{width: WCHIP * 6 + 30, textAlign: 'center', color: C.k}}>Hedef (y)</div>
      </Appear>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {DATA.windows.map((w, k) => (
          <Appear key={k} at={20 + k * 30}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                padding: '8px 0',
                borderRadius: 14,
                border: `2px solid ${k === 0 ? hexA(C.yellow, hi) : 'transparent'}`,
                background: k === 0 ? hexA(C.yellow, 0.08 * hi) : 'transparent',
              }}
            >
              <div style={{width: 110, textAlign: 'right', fontSize: 21, color: k === 0 ? C.yellow : C.dim}}>Örnek {k + 1}</div>
              <div style={{display: 'flex', gap: 6}}>
                {w.x.map((t, i) => (
                  <Chip key={i} size={19} width={WCHIP} color={tokColor(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
              <div style={{width: 70, textAlign: 'center', fontSize: 30, color: C.dim}}>→</div>
              <div style={{display: 'flex', gap: 6}}>
                {w.y.map((t, i) => (
                  <Chip key={i} size={19} width={WCHIP} color={tokColor(t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          </Appear>
        ))}
      </div>
      <Appear at={200} style={{textAlign: 'center', fontSize: 26, color: C.yellow, marginTop: 18}}>
        ↑ Örnek 1'i adım adım, her token'ıyla takip edeceğiz
      </Appear>
      <Caption at={240}>5 örnek tek batch: her örnekte 6 pozisyon, yani her eğitim adımında 5 × 6 = 30 tahmin yapılır.</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 3 · Embedding + position
// ---------------------------------------------------------------------------------------------
const BeatEmbed: React.FC = () => (
  <>
    <StepTag n={3} name="Embedding + Pozisyon" />
    <FlowBar items={FLOW} active={0} />
    <TokenHeader tokens={EX.x} at={5} sub={(i) => `ID ${VOCAB.indexOf(EX.x[i])} · sıra ${i + 1}`} />
    <TokenRow label="Embedding" note="sözlük tablosundaki satırı" at={40} color={C.q} cell={(i) => <VecCells vals={S0.E[i]} />} />
    <TokenRow label="+ Pozisyon" note="kendi sırasının vektörü" at={120} color={C.pos} cell={(i) => <VecCells vals={S0.P[i]} />} />
    <TokenRow label="= X" note="bloğa giren vektör" at={200} color={C.teal} cell={(i) => <VecCells vals={S0.X[i]} />} />
    <Caption at={280}>
      Her token 4 sayıyla temsil edilir (d_model = 4). Bu sayılar şu an rastgele — eğitim onları düzeltecek.
    </Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 4 · Q, K, V
// ---------------------------------------------------------------------------------------------
const BeatQKV: React.FC = () => (
  <>
    <StepTag n={4} name="Q, K, V" />
    <FlowBar items={FLOW} active={1} />
    <TokenHeader tokens={EX.x} at={5} sub={() => 'kafa 1 | kafa 2'} />
    <TokenRow label="Q = X·Wq" note="ne arıyorum?" at={30} color={C.q} cell={(i) => <VecCells vals={S0.Q[i]} split={2} />} />
    <TokenRow label="K = X·Wk" note="ne sunuyorum?" at={100} color={C.k} cell={(i) => <VecCells vals={S0.K[i]} split={2} />} />
    <TokenRow label="V = X·Wv" note="hangi bilgiyi veririm?" at={170} color={C.v} cell={(i) => <VecCells vals={S0.V[i]} split={2} />} />
    <Caption at={240}>Her token'ın X'i üç 4×4 matrisle çarpılır. 2 kafa var: ilk 2 sayı kafa 1'in, son 2 sayı kafa 2'nin.</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 5 · Attention inside head 1 (scores → mask → softmax), every token row
// ---------------------------------------------------------------------------------------------
const ACELL = 86;
const AttnGrid: React.FC<{phase: number; rowHi: number; head: number; cell?: number; labels?: boolean}> = ({
  phase,
  rowHi,
  head,
  cell = ACELL,
  labels = true,
}) => {
  const h = S0.heads[head];
  return (
    <div>
      {labels && (
        <div style={{display: 'flex', marginLeft: 150, gap: 6, marginBottom: 8}}>
          {EX.x.map((t, c) => (
            <div key={c} style={{width: cell, textAlign: 'center', fontSize: 18, color: tokColor(t)}}>
              {t}
            </div>
          ))}
        </div>
      )}
      {EX.x.map((t, r) => (
        <div
          key={r}
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 6,
            alignItems: 'center',
            borderRadius: 10,
            boxShadow: r === rowHi ? `0 0 0 3px ${C.accent}` : undefined,
          }}
        >
          {labels && <div style={{width: 138, marginRight: 6, textAlign: 'right', fontSize: 18, color: tokColor(t)}}>{t}</div>}
          {EX.x.map((_, c) => {
            const masked = c > r;
            let text = fmt(h.scaled[r][c]);
            let bg = valColor(h.scaled[r][c]);
            if (phase >= 1 && masked) {
              text = '−∞';
              bg = hexA(C.red, 0.4);
            }
            if (phase >= 2) {
              text = masked ? '0' : h.A[r][c].toFixed(2);
              bg = masked ? hexA(C.red, 0.1) : hexA(C.yellow, 0.12 + 0.75 * h.A[r][c]);
            }
            return (
              <div
                key={c}
                style={{
                  width: cell,
                  height: cell * 0.62,
                  borderRadius: 8,
                  background: bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: MONO,
                  fontSize: labels ? 17 : 12,
                  color: phase >= 2 && masked ? C.dim : C.text,
                }}
              >
                {labels ? text : ''}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

const ATT_STEPS: [string, string, number][] = [
  ['1 · Skor: Q·Kᵀ / √2', 'her token her token\'a soru sorar', 20],
  ['2 · Maske', 'gelecekteki token\'lar −∞', 140],
  ['3 · Softmax', 'her satır 0–1 arası, toplam 1', 250],
];

const BeatAttention: React.FC = () => {
  const f = useCurrentFrame();
  const phase = f < 140 ? 0 : f < 250 ? 1 : 2;
  const rowHi = f >= 340 ? Math.min(5, Math.floor((f - 340) / 40)) : -1;
  const A = S0.heads[0].A;
  const best = rowHi >= 0 ? argmax(A[rowHi]) : 0;
  return (
    <>
      <StepTag n={5} name="Attention (kafa 1)" />
      <FlowBar items={FLOW} active={2} />
      <div style={{display: 'flex', gap: 50}}>
        <Appear at={10}>
          <AttnGrid phase={phase} rowHi={rowHi} head={0} />
          <div style={{fontSize: 18, color: C.dim, marginLeft: 150, marginTop: 4}}>satır = soran token (Q) · sütun = bakılan token (K)</div>
        </Appear>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 12}}>
          {ATT_STEPS.map(([t, d, at], i) => (
            <Appear key={t} at={at}>
              <Panel accent={phase === i ? C.accent : C.faint} side="left" style={{padding: '12px 20px', opacity: phase === i ? 1 : 0.55}}>
                <div style={{fontSize: 26, fontWeight: 700}}>{t}</div>
                <div style={{fontSize: 20, color: C.dim}}>{d}</div>
              </Panel>
            </Appear>
          ))}
          {rowHi >= 0 && (
            <div style={{fontSize: 24, color: C.accent, marginTop: 6, minHeight: 64}}>
              "{EX.x[rowHi]}" satırı → en yüksek ağırlık: "{EX.x[best]}" ({A[rowHi][best].toFixed(2)})
            </div>
          )}
          <Appear at={400} style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 4}}>
            <AttnGrid phase={2} rowHi={-1} head={1} cell={30} labels={false} />
            <div style={{fontSize: 20, color: C.dim}}>Kafa 2 aynı anda kendi Q, K'siyle başka bir dağılım hesaplıyor.</div>
          </Appear>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 6 · weights · V, concat, Wo
// ---------------------------------------------------------------------------------------------
const BeatContext: React.FC = () => (
  <>
    <StepTag n={6} name="A·V, birleştir, Wo" />
    <FlowBar items={FLOW} active={3} />
    <TokenHeader tokens={EX.x} at={5} />
    <TokenRow label="Kafa 1: A·V" note="ağırlıklı toplam" at={30} color={C.q} cell={(i) => <VecCells vals={S0.C[i].slice(0, 2)} />} />
    <TokenRow label="Kafa 2: A·V" note="ağırlıklı toplam" at={90} color={C.k} cell={(i) => <VecCells vals={S0.C[i].slice(2)} />} />
    <TokenRow label="Birleştir" note="concat → 4 sayı" at={150} color={C.yellow} cell={(i) => <VecCells vals={S0.C[i]} split={2} />} />
    <TokenRow label="× Wo" note="Multi-Head çıktısı" at={210} color={C.teal} cell={(i) => <VecCells vals={S0.M[i]} />} />
    <Caption at={270}>Her token, baktığı token'ların V'lerinden ağırlıkları kadar alır; iki kafanın sonucu yan yana konup Wo ile karıştırılır.</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 7 · Add & Norm
// ---------------------------------------------------------------------------------------------
const BeatNorm1: React.FC = () => (
  <>
    <StepTag n={7} name="Add & Norm" />
    <FlowBar items={FLOW} active={4} />
    <TokenHeader tokens={EX.x} at={5} />
    <TokenRow label="X" note="bloğa giren" at={20} dim cell={(i) => <VecCells vals={S0.X[i]} />} />
    <TokenRow label="+ MHA çıktısı" at={60} color={C.teal} cell={(i) => <VecCells vals={S0.M[i]} />} />
    <TokenRow label="= X + MHA" note="residual" at={110} color={C.yellow} cell={(i) => <VecCells vals={S0.R1[i]} />} />
    <TokenRow label="LayerNorm" note="ortalama 0, varyans 1" at={170} color={C.v} cell={(i) => <VecCells vals={S0.N1[i]} />} />
  </>
);

// ---------------------------------------------------------------------------------------------
// 8 · Feed-forward + Add & Norm
// ---------------------------------------------------------------------------------------------
const HiddenBars: React.FC<{vals: number[]}> = ({vals}) => (
  <svg width={226} height={70}>
    <line x1={0} y1={50} x2={226} y2={50} stroke={C.faint} strokeWidth={1} />
    {vals.map((v, i) => {
      const h = Math.max(-18, Math.min(48, v * 28));
      return <rect key={i} x={2 + i * 14} y={h >= 0 ? 50 - h : 50} width={11} height={Math.abs(h)} rx={2} fill={C.q} />;
    })}
  </svg>
);

const BeatFFN: React.FC = () => (
  <>
    <StepTag n={8} name="Feed-Forward + Add & Norm" />
    <FlowBar items={FLOW} active={5} />
    <TokenHeader tokens={EX.x} at={5} />
    <TokenRow label="Girdi" note="Add & Norm sonrası" at={20} dim cell={(i) => <VecCells vals={S0.N1[i]} />} />
    <TokenRow label="Gizli katman" note="4 → 16, GELU" at={60} color={C.q} cell={(i) => <HiddenBars vals={S0.Hid[i]} />} />
    <TokenRow label="FFN çıktısı" note="16 → 4" at={130} color={C.k} cell={(i) => <VecCells vals={S0.Fo[i]} />} />
    <TokenRow label="Add & Norm" note="son temsil" at={190} color={C.v} cell={(i) => <VecCells vals={S0.N2[i]} />} />
    <Caption at={250}>Her token kendi içinde ayrı ayrı işlenir: 4 sayı 16'ya açılır, tekrar 4'e iner, sonra yine residual + LayerNorm.</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 9 · Linear + softmax over the 10-word vocab
// ---------------------------------------------------------------------------------------------
const PCELL = 84;
const ProbGrid: React.FC<{probs: Mat; at: number}> = ({probs, at}) => (
  <div>
    <div style={{display: 'flex', marginLeft: 170, gap: 5, marginBottom: 8}}>
      {VOCAB.map((v) => (
        <div key={v} style={{width: PCELL, textAlign: 'center', fontSize: 17, color: tokColor(v)}}>
          {v}
        </div>
      ))}
    </div>
    {EX.x.map((t, r) => {
      const target = VOCAB.indexOf(EX.y[r]);
      const best = argmax(probs[r]);
      const ok = best === target;
      return (
        <Appear key={r} at={at + r * 12} style={{display: 'flex', gap: 5, marginBottom: 6, alignItems: 'center'}}>
          <div style={{width: 158, marginRight: 7, textAlign: 'right', fontSize: 20, color: tokColor(t)}}>{t} →</div>
          {probs[r].map((p, c) => (
            <div
              key={c}
              style={{
                width: PCELL,
                height: 52,
                borderRadius: 8,
                boxSizing: 'border-box',
                background: hexA(C.yellow, 0.08 + 0.8 * p),
                border: c === target ? `3px solid ${C.v}` : `1px solid ${C.panelBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 17,
                fontWeight: c === best ? 800 : 400,
              }}
            >
              {p.toFixed(2)}
            </div>
          ))}
          <div style={{marginLeft: 18, fontSize: 21, width: 270}}>
            tahmin: <b style={{color: ok ? C.v : C.red}}>{VOCAB[best]}</b> {ok ? '✓' : '✗'}
            <div style={{fontSize: 17, color: C.dim}}>hedef: {EX.y[r]}</div>
          </div>
        </Appear>
      );
    })}
  </div>
);

const BeatProbs: React.FC = () => (
  <>
    <StepTag n={9} name="Linear + Softmax" />
    <FlowBar items={FLOW} active={6} />
    <ProbGrid probs={S0.probs} at={20} />
    <Caption at={200}>
      Linear: 4 sayı → sözlükteki 10 kelimeye birer skor. Softmax: olasılık. Yeşil çerçeve = doğru cevap. Model henüz rastgele tahmin ediyor.
    </Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 10 · Loss for every token
// ---------------------------------------------------------------------------------------------
const BeatLoss: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <StepTag n={10} name="Loss (hata)" />
      <Lead>Her pozisyonda: loss = −log(doğru kelimeye verilen olasılık)</Lead>
      <div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center'}}>
        {EX.x.map((t, r) => {
          const p = S0.probs[r][VOCAB.indexOf(EX.y[r])];
          const l = S0.lossTok[r];
          const grow = interpolate(f, [30 + r * 18, 60 + r * 18], [0, 1], clamp);
          return (
            <Appear key={r} at={20 + r * 18} style={{display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{width: 150, textAlign: 'right'}}>
                <Chip size={22} color={tokColor(t)}>
                  {t}
                </Chip>
              </div>
              <div style={{fontSize: 22, color: C.dim, width: 70, textAlign: 'center'}}>hedef</div>
              <div style={{width: 150}}>
                <Chip size={22} color={tokColor(EX.y[r])}>
                  {EX.y[r]}
                </Chip>
              </div>
              <div style={{fontFamily: MONO, fontSize: 22, width: 140}}>p = {p.toFixed(2)}</div>
              <div style={{width: 520, height: 26, background: C.panel2, borderRadius: 8}}>
                <div style={{width: (520 * l * grow) / 3.5, height: '100%', background: C.red, borderRadius: 8}} />
              </div>
              <div style={{fontFamily: MONO, fontSize: 22, width: 220}}>
                −log({p.toFixed(2)}) = {l.toFixed(2)}
              </div>
            </Appear>
          );
        })}
      </div>
      <Appear at={160} style={{display: 'flex', justifyContent: 'center', gap: 30, marginTop: 30}}>
        <Panel accent={C.red} side="left" style={{fontSize: 26}}>
          Örnek 1 ortalaması: <b style={{fontFamily: MONO}}>{S0.loss.toFixed(2)}</b>
        </Panel>
        <Panel accent={C.red} side="left" style={{fontSize: 26}}>
          Batch ortalaması (30 tahmin): <b style={{fontFamily: MONO}}>{DATA.grad.batchLoss.toFixed(2)}</b>
        </Panel>
      </Appear>
      <Caption at={230}>Olasılık 1'e yaklaştıkça loss 0'a iner. Rastgele bir model için loss ≈ −log(1/10) = 2.30.</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 11 · Backprop + one weight update
// ---------------------------------------------------------------------------------------------
const CHAIN = ['Embedding', '+ Pozisyon', 'Attention', 'Add & Norm', 'FFN', 'Add & Norm', 'Linear', 'Softmax', 'Loss'];
const BW = 160;
const BG = 22;

const BeatBackprop: React.FC = () => {
  const f = useCurrentFrame();
  const fwd = interpolate(f, [20, 100], [0, 1], clamp);
  const bwd = interpolate(f, [120, 220], [0, 1], clamp);
  const total = CHAIN.length * BW + (CHAIN.length - 1) * BG;
  const g = DATA.grad;
  return (
    <>
      <StepTag n={11} name="Geri yayılım (backprop)" />
      <Lead>Loss'u küçültmek için her ağırlığın hangi yöne itileceği hesaplanır</Lead>
      <div style={{position: 'relative', width: total, height: 170, margin: '10px auto 0'}}>
        {CHAIN.map((c, i) => {
          const reachedB = bwd > 0 && 1 - bwd <= (i + 0.5) / CHAIN.length;
          return (
            <div
              key={c}
              style={{
                position: 'absolute',
                left: i * (BW + BG),
                top: 50,
                width: BW,
                height: 64,
                borderRadius: 12,
                border: `2px solid ${i === CHAIN.length - 1 ? C.red : C.panelBorder}`,
                background: C.panel,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 21,
                fontWeight: 600,
              }}
            >
              {c}
              {reachedB && i < CHAIN.length - 1 && (
                <div style={{position: 'absolute', top: 76, fontSize: 19, color: C.red, fontFamily: MONO}}>∂L/∂W</div>
              )}
            </div>
          );
        })}
        <div style={{position: 'absolute', top: 14, left: 0, fontSize: 20, color: C.q, opacity: fwd > 0 ? 1 : 0}}>ileri yayılım →</div>
        <div
          style={{position: 'absolute', top: 14 + 0, left: fwd * (total - 20), width: 20, height: 20, borderRadius: 10, background: C.q, opacity: fwd > 0 && fwd < 1 ? 1 : 0}}
        />
        <div
          style={{position: 'absolute', top: 140, left: (1 - bwd) * (total - 20), width: 20, height: 20, borderRadius: 10, background: C.red, opacity: bwd > 0 && bwd < 1 ? 1 : 0}}
        />
      </div>
      <Appear at={230}>
        <Panel accent={C.yellow} style={{width: 1300, margin: '30px auto 0'}}>
          <div style={{fontSize: 26, fontWeight: 700, marginBottom: 14}}>
            Örnek güncelleme: "{g.token}" kelimesinin embedding satırı (η = {g.lr})
          </div>
          {[
            ['önce', g.before, 240],
            ['gradyan', g.grad, 270],
            [`sonra = önce − ${g.lr} × gradyan`, g.after, 300],
          ].map(([label, vals, at]) => (
            <Appear key={label as string} at={at as number} style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 10}}>
              <div style={{width: 420, fontSize: 23, textAlign: 'right'}}>{label as string}</div>
              <div style={{display: 'flex', gap: 6}}>
                {(vals as number[]).map((v, i) => (
                  <div
                    key={i}
                    style={{
                      width: 110,
                      height: 44,
                      borderRadius: 8,
                      background: valColor(v * ((label as string) === 'gradyan' ? 40 : 1)),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: MONO,
                      fontSize: 20,
                    }}
                  >
                    {fmt(v, (label as string) === 'gradyan' ? 4 : 3)}
                  </div>
                ))}
              </div>
            </Appear>
          ))}
        </Panel>
      </Appear>
      <Caption at={320}>
        W ← W − η · gradyan. Modeldeki {DATA.params} parametrenin hepsi her adımda böyle minik minik güncellenir.
      </Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 12 · Training loop: loss curve + predictions for every token
// ---------------------------------------------------------------------------------------------
const CW = 860;
const CH = 470;
const BeatLoop: React.FC = () => {
  const f = useCurrentFrame();
  const s = interpolate(f, [30, 450], [0, 1], clamp);
  const stepNow = Math.round(DATA.steps * s * s);
  const cp = [...DATA.checkpoints].reverse().find((c) => c.step <= stepNow) ?? DATA.checkpoints[0];
  const x = (i: number) => 70 + (i / DATA.steps) * (CW - 100);
  const y = (l: number) => 30 + (1 - l / 2.6) * (CH - 90);
  const path = DATA.curve
    .slice(0, stepNow + 1)
    .map((l, i) => `${i ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(l).toFixed(1)}`)
    .join(' ');
  return (
    <>
      <StepTag n={12} name="Eğitim döngüsü" />
      <Lead>Adım 3–11 her seferinde tekrarlanır: ileri → loss → geri → güncelle</Lead>
      <div style={{display: 'flex', gap: 40}}>
        <Panel style={{padding: 10}}>
          <svg width={CW} height={CH}>
            <line x1={70} y1={y(0)} x2={CW - 30} y2={y(0)} stroke={C.faint} strokeWidth={2} />
            <line x1={70} y1={y(2.6)} x2={70} y2={y(0)} stroke={C.faint} strokeWidth={2} />
            {[0, 1, 2].map((l) => (
              <text key={l} x={60} y={y(l) + 6} fill={C.dim} fontSize={18} textAnchor="end" fontFamily={MONO}>
                {l}
              </text>
            ))}
            {DATA.checkpoints.map((c) => (
              <line key={c.step} x1={x(c.step)} y1={y(0)} x2={x(c.step)} y2={y(0) + 10} stroke={C.dim} strokeWidth={2} />
            ))}
            <text x={CW - 30} y={y(0) + 40} fill={C.dim} fontSize={20} textAnchor="end" fontFamily={FONT}>
              eğitim adımı →
            </text>
            <text x={80} y={y(2.6) + 4} fill={C.dim} fontSize={20} fontFamily={FONT}>
              loss
            </text>
            <path d={path} fill="none" stroke={C.red} strokeWidth={4} />
            <circle cx={x(stepNow)} cy={y(DATA.curve[stepNow])} r={9} fill={C.red} />
          </svg>
        </Panel>
        <div style={{flex: 1}}>
          <div style={{fontFamily: MONO, fontSize: 30, fontWeight: 700}}>
            adım {stepNow} / {DATA.steps}
          </div>
          <div style={{fontFamily: MONO, fontSize: 24, color: C.red, marginBottom: 18}}>
            batch loss = {DATA.curve[stepNow].toFixed(3)}
          </div>
          <div style={{fontSize: 20, color: C.dim, marginBottom: 10}}>Örnek 1 — adım {cp.step} anındaki tahminler:</div>
          {EX.x.map((t, r) => {
            const target = VOCAB.indexOf(EX.y[r]);
            const best = argmax(cp.probs[r]);
            const p = cp.probs[r][target];
            const ok = best === target;
            return (
              <div key={r} style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10}}>
                <div style={{width: 120, textAlign: 'right', fontSize: 21, color: tokColor(t)}}>{t} →</div>
                <div style={{width: 120}}>
                  <Chip size={20} color={ok ? C.v : C.red}>
                    {VOCAB[best]}
                  </Chip>
                </div>
                <div style={{width: 200, height: 20, background: C.panel2, borderRadius: 6}}>
                  <div style={{width: 200 * p, height: '100%', background: ok ? C.v : C.red, borderRadius: 6}} />
                </div>
                <div style={{fontFamily: MONO, fontSize: 19, width: 70}}>{p.toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <Caption at={470} color={C.v}>
        Adım 0'da 6 tahminin hiçbiri doğru değildi; 30. adımda 3'ü, 80. adımda 6'sı da doğru; 500. adımda %95'in üzerinde emin.
      </Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 13 · Generation with the trained model
// ---------------------------------------------------------------------------------------------
const GEN_START = 40;
const GEN_STEP = 40;
const BeatGenerate: React.FC = () => {
  const f = useCurrentFrame();
  const gen = DATA.generation;
  const k = Math.min(gen.steps.length - 1, Math.max(0, Math.floor((f - GEN_START) / GEN_STEP)));
  const appended = Math.max(0, Math.min(gen.steps.length, Math.floor((f - GEN_START - 25) / GEN_STEP) + 1));
  const seq = [...gen.prompt, ...gen.steps.slice(0, appended).map((s) => s.chosen)];
  const ctxStart = Math.max(0, gen.prompt.length + k - DATA.ctx);
  const st = gen.steps[k];
  return (
    <>
      <StepTag n={13} name="Sonuç: metin üretimi" />
      <Lead>Eğitilmiş model, ilk 3 kelimeden paragrafın gerisini token token üretiyor</Lead>
      <div style={{display: 'flex', justifyContent: 'center', gap: 10, marginTop: 30, minHeight: 80}}>
        {seq.map((t, i) => {
          const inCtx = f >= GEN_START && i >= ctxStart && i < gen.prompt.length + k;
          const isNew = i >= gen.prompt.length;
          return (
            <div
              key={i}
              style={{
                padding: 4,
                borderRadius: 14,
                border: `3px solid ${inCtx ? C.yellow : 'transparent'}`,
              }}
            >
              <Chip size={30} color={isNew ? C.v : tokColor(t)} filled={isNew && i === seq.length - 1 && appended > 0}>
                {t}
              </Chip>
            </div>
          );
        })}
      </div>
      <Appear at={GEN_START} style={{textAlign: 'center', fontSize: 22, color: C.yellow, marginTop: 10}}>
        sarı çerçeve = modelin baktığı bağlam (en fazla 6 token)
      </Appear>
      <Appear at={GEN_START} style={{display: 'flex', justifyContent: 'center', marginTop: 36}}>
        <Panel accent={C.v} style={{width: 900}}>
          <div style={{fontSize: 24, color: C.dim, marginBottom: 14}}>Tur {k + 1}: sonraki token için en olası 3 kelime</div>
          {st.top.map(([tok, p], i) => (
            <div key={tok} style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10}}>
              <div style={{width: 140, textAlign: 'right', fontSize: 26, fontWeight: i === 0 ? 700 : 400}}>{tok}</div>
              <div style={{width: 560, height: 26, background: C.panel2, borderRadius: 8}}>
                <div style={{width: Math.max(3, 560 * p), height: '100%', background: i === 0 ? C.v : C.dim, borderRadius: 8}} />
              </div>
              <div style={{fontFamily: MONO, fontSize: 22}}>{p.toFixed(3)}</div>
            </div>
          ))}
        </Panel>
      </Appear>
      <Caption at={GEN_START + GEN_STEP * gen.steps.length} color={C.v}>
        Eğitimde gördüğü paragrafı birebir üretiyor — her seferinde tek token: next-token prediction.
      </Caption>
    </>
  );
};

export const Training: React.FC = () => (
  <Scene no={16} title="Eğitim: Adım Adım">
    <Beat from={0} dur={330} terms={['token', 'vocab']}>
      <BeatTokenize />
    </Beat>
    <Beat from={330} dur={300} terms={['batch', 'context']}>
      <BeatWindows />
    </Beat>
    <Beat from={630} dur={420} terms={['embedding', 'posvec']}>
      <BeatEmbed />
    </Beat>
    <Beat from={1050} dur={360} terms={['qkv', 'head']}>
      <BeatQKV />
    </Beat>
    <Beat from={1410} dur={600} terms={['softmax', 'causal']}>
      <BeatAttention />
    </Beat>
    <Beat from={2010} dur={360} terms={['concat', 'wo']}>
      <BeatContext />
    </Beat>
    <Beat from={2370} dur={270} terms={['residual', 'layernorm']}>
      <BeatNorm1 />
    </Beat>
    <Beat from={2640} dur={330} terms={['ffn', 'gelu']}>
      <BeatFFN />
    </Beat>
    <Beat from={2970} dur={420} terms={['logit', 'softmax']}>
      <BeatProbs />
    </Beat>
    <Beat from={3390} dur={360} terms={['loss', 'crossentropy']}>
      <BeatLoss />
    </Beat>
    <Beat from={3750} dur={390} terms={['gradient', 'backprop']}>
      <BeatBackprop />
    </Beat>
    <Beat from={4140} dur={540} terms={['optimizer', 'lr']}>
      <BeatLoop />
    </Beat>
    <Beat from={4680} dur={390} terms={['greedy', 'inference']}>
      <BeatGenerate />
    </Beat>
  </Scene>
);

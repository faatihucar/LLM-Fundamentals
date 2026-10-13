import React from 'react';
import {random} from 'remotion';
import {Appear, ArcSentence, Beat, Caption, Lead, MatrixGrid, Panel, ProbBars, Scene, hexA, useProgress} from '../components';
import {C, MATH, MONO} from '../theme';

export const SELFATT_DUR = 1560;

const QKV = [
  {k: 'Q', name: 'Query', q: '"Ben neyi arıyorum?"', d: 'Mevcut kelimenin diğerlerine sorduğu soru', w: '× Wq', c: C.q},
  {k: 'K', name: 'Key', q: '"Ben ne sunuyorum?"', d: 'Diğer kelimelerin eşleşebileceği etiket', w: '× Wk', c: C.k},
  {k: 'V', name: 'Value', q: '"Eşleşirsek sana hangi bilgiyi veririm?"', d: 'Aktarılacak asıl anlam', w: '× Wv', c: C.v},
];
const SRC = {x: 280, y: 245};

const Branch: React.FC<{i: number; at: number}> = ({i, at}) => {
  const p = useProgress(at, at + 25);
  const r = QKV[i];
  const ty = 70 + i * 165;
  const x2 = SRC.x + (690 - SRC.x) * p;
  const y2 = SRC.y + (ty - SRC.y) * p;
  return (
    <g>
      <line x1={SRC.x} y1={SRC.y} x2={x2} y2={y2} stroke={r.c} strokeWidth={4} />
      <text x={(SRC.x + 690) / 2} y={(SRC.y + ty) / 2 - 14} fill={r.c} fontSize={26} fontFamily={MONO} textAnchor="middle" opacity={p}>
        {r.w}
      </text>
    </g>
  );
};

const BeatQKV: React.FC = () => (
  <>
    <Lead>Her token, öğrenilen 3 matrisle 3 farklı role bürünür</Lead>
    <div style={{position: 'relative', height: 480}}>
      <svg width={1720} height={480} style={{position: 'absolute', left: 0, top: 0}}>
        {[0, 1, 2].map((i) => (
          <Branch key={i} i={i} at={40 + i * 35} />
        ))}
      </svg>
      <Appear at={10} style={{position: 'absolute', left: 50, top: 106, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={{textAlign: 'center', fontSize: 24, fontWeight: 700, marginBottom: 8}}>x = TEK bir kelimenin vektörü</div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 4, padding: 8, border: `2px solid ${C.dim}`, borderRadius: 10}}>
          {[0.7, 0.3, 0.9, 0.5, 0.2, 0.6].map((v, i) => (
            <div key={i} style={{width: 110, height: 26, borderRadius: 4, background: hexA(C.accent, v)}} />
          ))}
        </div>
        <div style={{textAlign: 'center', fontSize: 19, color: C.dim, marginTop: 8, lineHeight: 1.35}}>
          kutular = o kelimenin sayıları (d_model),
          <br />
          kelime listesi değil
        </div>
      </Appear>
      {QKV.map((r, i) => (
        <Appear key={r.k} at={60 + i * 35} x={-20} y={0} style={{position: 'absolute', left: 700, top: i * 165, width: 1000}}>
          <Panel accent={r.c} side="left" style={{display: 'flex', alignItems: 'center', gap: 28, height: 140}}>
            <div style={{fontSize: 70, fontWeight: 800, color: r.c, width: 60, textAlign: 'center'}}>{r.k}</div>
            <div>
              <div style={{fontSize: 32, fontWeight: 700}}>
                {r.name} <span style={{color: r.c}}>{r.q}</span>
              </div>
              <div style={{fontSize: 24, color: C.dim, marginTop: 4}}>{r.d}</div>
            </div>
          </Panel>
        </Appear>
      ))}
    </div>
    <Appear at={210}>
      <Panel style={{marginTop: 20, padding: '18px 30px'}}>
        <div style={{fontFamily: MONO, fontSize: 25, lineHeight: 1.55}}>
          {['q', 'k', 'v'].map((n, i) => (
            <div key={n}>
              <span style={{color: QKV[i].c}}>{n}_weights</span> = torch.nn.Linear(4, 3, bias=False)
            </div>
          ))}
        </div>
        <div style={{fontSize: 22, color: C.dim, marginTop: 8, lineHeight: 1.45}}>
          4 = embedding boyutu (d_model) · 3 = d<sub>k</sub> (q, k, v'nin boyu) · bias yok: saf matris çarpımı · Wq, Wk, Wv eğitimde öğrenilir
          <br />
          Cümledeki <b style={{color: C.text}}>her kelimenin ayrı bir x'i</b> var: 6 kelime → 6 vektör alt alta → <b style={{color: C.text}}>X matrisi</b> (bölüm 11'de sayılarla)
        </div>
      </Panel>
    </Appear>
  </>
);

const SENT = ['Bankadaki', 'adam', 'dosyaları', 'imzaladı', 'çünkü', 'o', 'çok', 'meşguldü.'];

const BeatExample: React.FC = () => (
  <>
    <Lead at={10}>
      Query <b style={{color: C.q}}>"o"</b> soruyor: "Benimle en çok hanginiz alakalı?"
    </Lead>
    <div style={{position: 'relative', height: 380}}>
      <ArcSentence
        tokens={SENT}
        from={5}
        width={1720}
        top={270}
        fromAt={20}
        arcs={[
          {to: 1, weight: 0.85, at: 80, label: '0.85'},
          {to: 2, weight: 0.08, at: 100, label: '0.08'},
          {to: 0, weight: 0.05, at: 120, label: '0.05'},
          {to: 3, weight: 0.02, at: 140, label: '0.02'},
        ]}
        tokenColor={(i) => (i === 1 ? C.yellow : undefined)}
      />
    </div>
    <Appear at={220} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 10}}>
      <div style={{fontSize: 24, color: C.dim, marginBottom: 12}}>softmax sonrası dikkat ağırlıkları (toplam = 1)</div>
      <ProbBars
        at={230}
        width={760}
        items={[
          {label: 'adam', v: 0.85, color: C.yellow},
          {label: 'dosyaları', v: 0.08, color: C.dim},
          {label: 'Bankadaki', v: 0.05, color: C.dim},
          {label: 'imzaladı', v: 0.02, color: C.dim},
        ]}
      />
    </Appear>
    <Caption at={340} color={C.yellow}>
      "o" artık sadece bir zamir değil: temsilinin %85'i "adam" kelimesinden gelen bilgiyle güncellendi.
    </Caption>
  </>
);

const S = [
  [2.1, 0.4, -0.3, 1.2],
  [1.5, 2.4, 0.2, 0.6],
  [0.3, 1.1, 2.0, 0.9],
  [0.8, 0.5, 1.7, 2.2],
];
const SCALED = S.map((r) => r.map((v) => v / 2));
const P = SCALED.map((r) => {
  const e = r.map(Math.exp);
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
});
const V = Array.from({length: 4}, (_, i) => Array.from({length: 6}, (__, j) => random(`v${i}-${j}`)));
const CTX = P.map((row) => V[0].map((_, j) => row.reduce((acc, w, k) => acc + w * V[k][j], 0)));

const StepCard: React.FC<{at: number; title: React.ReactNode; sub: string; color: string; children: React.ReactNode}> = ({
  at,
  title,
  sub,
  color,
  children,
}) => (
  <Appear at={at}>
    <Panel accent={color} style={{width: 370, height: 380, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{fontSize: 30, fontWeight: 700, fontFamily: MATH}}>{title}</div>
      <div style={{fontSize: 21, color: C.dim, textAlign: 'center', minHeight: 60, marginTop: 6}}>{sub}</div>
      <div style={{marginTop: 10}}>{children}</div>
    </Panel>
  </Appear>
);

const WORDS4 = ['Yapay', 'zeka', 'metni', 'okur'];
const Grid4: React.FC<{data: number[][]; color: string; max: number; digits?: number; colWords?: boolean}> = ({
  data,
  color,
  max,
  digits = 1,
  colWords = true,
}) => (
  <MatrixGrid
    rows={data.length}
    cols={data[0].length}
    cell={data[0].length > 4 ? 34 : 46}
    gap={5}
    fontSize={15}
    rowLabels={WORDS4}
    colLabels={colWords ? WORDS4 : undefined}
    labelW={62}
    labelSize={13}
    cellStyle={(r, c) => {
      const v = data[r][c];
      return {
        text: data[0].length > 4 ? '' : v.toFixed(digits),
        bg: hexA(color, 0.12 + 0.75 * Math.max(0, v / max)),
      };
    }}
  />
);

const Arrow: React.FC<{at: number}> = ({at}) => (
  <Appear at={at} style={{fontSize: 44, color: C.dim, alignSelf: 'center'}}>
    →
  </Appear>
);

const BeatFormula: React.FC = () => (
  <>
    <Appear at={10} style={{textAlign: 'center', fontFamily: MATH, fontSize: 56, marginBottom: 30}}>
      Attention(Q, K, V) = softmax(
      <span style={{display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', margin: '0 8px'}}>
        <span style={{display: 'block', borderBottom: `3px solid ${C.text}`, padding: '0 8px'}}>
          Q·K<sup>T</sup>
        </span>
        <span style={{display: 'block'}}>
          √d<sub>k</sub>
        </span>
      </span>
      ) · V
    </Appear>
    <div style={{display: 'flex', justifyContent: 'center', gap: 14}}>
      <StepCard at={60} color={C.q} title={<>1 · Q·K<sup>T</sup></>} sub="her Query her Key ile çarpılır → benzerlik skorları">
        <Grid4 data={S} color={C.q} max={2.4} />
      </StepCard>
      <Arrow at={120} />
      <StepCard at={130} color={C.pos} title={<>2 · ÷ √d<sub>k</sub></>} sub="ölçekle: varyans ≈ 1, softmax aşırı sivrilmesin">
        <Grid4 data={SCALED} color={C.pos} max={1.2} digits={2} />
      </StepCard>
      <Arrow at={190} />
      <StepCard at={200} color={C.yellow} title="3 · softmax" sub="her satır 0–1 arası, toplamı = 1">
        <Grid4 data={P} color={C.yellow} max={0.6} digits={2} />
      </StepCard>
      <Arrow at={260} />
      <StepCard at={270} color={C.v} title="4 · × V" sub="ağırlıklı toplam → context vector">
        <Grid4 data={CTX} color={C.v} max={0.8} colWords={false} />
        <div style={{fontSize: 15, color: C.dim, textAlign: 'center', marginTop: 6}}>satır = kelime · sütun = yeni vektörün sayıları</div>
      </StepCard>
    </div>
    <Appear at={330}>
      <Panel accent={C.q} side="left" style={{marginTop: 16, fontSize: 21, lineHeight: 1.5, padding: '12px 24px'}}>
        <b>Q·K<sup>T</sup> tablosu:</b> satır = soran kelime (q), sütun = cevap veren kelime (k), hücre = eşleşme puanı.{' '}
        <b>ᵀ</b> = K'yı yan yatırmak, ki satır × sütun çarpılabilsin.
        <br />
        Q·K<sup>T</sup> "kime ne kadar bakayım?" sorusunu cevaplar; asıl bilgi 4. adımda (× V) alınır.{' '}
        <span style={{color: C.dim}}>(Sayılar temsilî, maske yok.)</span>
      </Panel>
    </Appear>
    <Caption at={430}>
      Q soru sordu, K etiket sundu, alaka ölçüldü; her kelime diğerlerinden anlam (V) alıp yeni temsilini oluşturdu.
    </Caption>
  </>
);

export const SelfAttention: React.FC = () => (
  <Scene no={6} title="Self-Attention" subtitle="kelimeler birbirine bakar">
    <Beat from={0} dur={420} terms={['qkv', 'wqkv']}>
      <BeatQKV />
    </Beat>
    <Beat from={420} dur={540} terms={['attnweight', 'softmax']}>
      <BeatExample />
    </Beat>
    <Beat from={960} dur={600} terms={['transpose', 'dk']}>
      <BeatFormula />
    </Beat>
  </Scene>
);

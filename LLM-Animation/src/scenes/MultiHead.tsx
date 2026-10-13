import React from 'react';
import {Appear, ArcSentence, Beat, Caption, Lead, Scene, hexA, useProgress} from '../components';
import {C, FONT, MONO} from '../theme';

export const MULTIHEAD_DUR = 1350;

const SENT = ['Ali,', 'topu', 'hızla', 'kaleye', 'fırlattı.'];
const HEADS = [
  {name: 'Baş 1 · Özne–Fiil', q: 'İşi kim yaptı?', to: 0, c: C.q},
  {name: 'Baş 2 · Nesne–Fiil', q: 'Neyi fırlattı?', to: 1, c: C.k},
  {name: 'Baş 3 · Zarf–Fiil', q: 'Nasıl fırlattı?', to: 2, c: C.v},
  {name: 'Baş 4 · Yer–Yön', q: 'Nereye fırlattı?', to: 3, c: C.pos},
];

const BeatHeads: React.FC = () => (
  <>
    <Lead>Her kafa, cümledeki diğer kelimelere kendi sorusunu sorar — farklı açılardan bakan küçük gözler</Lead>
    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
      {HEADS.map((h, i) => {
        const at = 30 + i * 75;
        return (
          <Appear key={h.name} at={at} style={{display: 'flex', alignItems: 'center'}}>
            <div style={{width: 330, fontSize: 30, fontWeight: 700, color: h.c}}>{h.name}</div>
            <div style={{position: 'relative', width: 860, height: 150}}>
              <ArcSentence
                tokens={SENT}
                from={4}
                width={860}
                top={92}
                fontSize={28}
                fromAt={at}
                fromColor={h.c}
                arcs={[{to: h.to, weight: 0.6, at: at + 20, color: h.c}]}
                tokenColor={(t) => (t === h.to ? h.c : undefined)}
              />
            </div>
            <div style={{flex: 1, fontSize: 30, color: h.c, paddingLeft: 40}}>"{h.q}"</div>
          </Appear>
        );
      })}
    </div>
    <Caption at={380}>
      Tek baş en güçlü ilişkiye odaklanır; çok baş, farklı ilişkileri aynı anda (paralel) yakalar.
    </Caption>
  </>
);

const Line: React.FC<{x1: number; x2: number; y: number; at: number; label: string; fs?: number}> = ({x1, x2, y, at, label, fs = 22}) => {
  const p = useProgress(at, at + 18);
  const x = x1 + (x2 - x1) * p;
  return (
    <g opacity={p > 0 ? 1 : 0}>
      <line x1={x1} y1={y} x2={x - 10} y2={y} stroke={C.dim} strokeWidth={3} />
      <polygon points={`${x - 14},${y - 8} ${x},${y} ${x - 14},${y + 8}`} fill={C.dim} />
      <text x={(x1 + x2) / 2} y={y - 16} fill={C.dim} fontSize={fs} textAnchor="middle" fontFamily={MONO} opacity={p}>
        {label}
      </text>
    </g>
  );
};

const Box: React.FC<{
  at: number;
  left: number;
  top: number;
  w: number;
  h: number;
  color: string;
  children: React.ReactNode;
  glow?: number;
}> = ({at, left, top, w, h, color, children, glow = 0}) => (
  <Appear at={at} y={12} style={{position: 'absolute', left, top}}>
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 12,
        border: `2px solid ${color}`,
        background: hexA(color, 0.14),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        boxShadow: glow > 0 ? `0 0 ${30 * glow}px ${hexA(C.yellow, 0.8 * glow)}` : undefined,
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  </Appear>
);

const HEAD_LABELS = ['Kafa 1', 'Kafa 2', 'Kafa 3', '⋮', 'Kafa 96'];
const HEAD_COLORS = [C.q, C.k, C.v, C.dim, C.pos];
const HY = (i: number) => 76 + i * 68;

const LINES: [string, number][] = [
  ["1 · Her kafa X'in TAMAMINI kendi Wq/Wk/Wv parçasıyla çarpar: (2×768)·(768×8) = 2×8 → bölünen X değil, W'lerin sütunları", 60],
  ["2 · Her kafa kendi q'suyla diğer kelimelere kendi sorusunu sorar → 96 farklı bakış açısı", 150],
  ['3 · Birleştir: 96 × 8 = 768 sütun → 2×768', 230],
  ['4 · Wo ile karıştır: (2×768)·(768×768) = 2×768', 310],
];

const BeatDims: React.FC = () => {
  const glow = useProgress(400, 430);
  return (
    <>
      <Lead>X = "Yapay zeka" cümlesi: 2 token × 768 sayı · 96 kafa → kafa başına 768 / 96 = 8 sayı</Lead>
      <div style={{position: 'relative', height: 470}}>
        <svg width={1720} height={470} style={{position: 'absolute', left: 0, top: 0}}>
          <Line x1={140} x2={282} y={240} at={50} label="× kendi W'si" fs={19} />
          <Line x1={505} x2={590} y={240} at={140} label="dikkat" />
          <Line x1={700} x2={800} y={240} at={220} label="concat" />
          <Line x1={1150} x2={1240} y={240} at={300} label="× Wo" />
          <Line x1={1410} x2={1490} y={240} at={380} label="=" />
        </svg>
        <Box at={10} left={0} top={110} w={130} h={260} color={C.accent} glow={glow}>
          <div style={{fontSize: 50, fontWeight: 800}}>X</div>
          <div style={{fontSize: 18, color: C.dim}}>"Yapay zeka"</div>
          <div style={{fontFamily: MONO, fontSize: 19, marginTop: 6}}>2 token</div>
          <div style={{fontFamily: MONO, fontSize: 19}}>× 768 sayı</div>
        </Box>
        {HEAD_LABELS.map((l, i) => (
          <Box key={l} at={60 + i * 10} left={290} top={HY(i)} w={210} h={56} color={HEAD_COLORS[i]}>
            {l === '⋮' ? (
              <div style={{fontSize: 30}}>⋮</div>
            ) : (
              <div style={{fontSize: 20}}>
                <b>{l}</b> <span style={{fontFamily: MONO, color: C.dim}}>Q,K,V: 2×8</span>
              </div>
            )}
          </Box>
        ))}
        {HEAD_LABELS.map((l, i) => (
          <Box key={`o${l}`} at={150 + i * 10} left={600} top={HY(i)} w={110} h={56} color={HEAD_COLORS[i]}>
            <div style={{fontFamily: MONO, fontSize: 22}}>{l === '⋮' ? '⋮' : '2×8'}</div>
          </Box>
        ))}
        <Appear at={120} style={{position: 'absolute', left: 290, top: HY(5) - 4, width: 430, fontSize: 18, color: C.dim}}>
          2×8 = 2 token × 8 sayı (her kafanın kendi q, k, v'si)
        </Appear>
        <Appear at={230} style={{position: 'absolute', left: 810, top: 150, width: 330, textAlign: 'center'}}>
          <div style={{fontFamily: MONO, fontSize: 22, color: C.dim, marginBottom: 8}}>2 × (96·8)</div>
          <div style={{display: 'flex', height: 100, borderRadius: 12, overflow: 'hidden', border: `2px solid ${C.yellow}`}}>
            {Array.from({length: 12}).map((_, i) => (
              <div key={i} style={{flex: 1, background: hexA([C.q, C.k, C.v, C.pos][i % 4], 0.55)}} />
            ))}
          </div>
          <div style={{fontFamily: MONO, fontSize: 24, marginTop: 8}}>= 2×768</div>
        </Appear>
        <Box at={310} left={1250} top={165} w={150} h={150} color={C.teal}>
          <div style={{fontSize: 42, fontWeight: 800}}>
            W<sub style={{fontSize: 24}}>o</sub>
          </div>
          <div style={{fontFamily: MONO, fontSize: 20}}>768×768</div>
          <div style={{fontSize: 16, color: C.dim}}>tek matris</div>
        </Box>
        <Box at={390} left={1500} top={120} w={110} h={240} color={C.v} glow={glow}>
          <div style={{fontSize: 26, fontWeight: 800}}>Çıktı</div>
          <div style={{fontFamily: MONO, fontSize: 18}}>2 token</div>
          <div style={{fontFamily: MONO, fontSize: 18}}>× 768</div>
        </Box>
      </div>
      <div style={{marginTop: 4, marginLeft: 30}}>
        {LINES.map(([t, at]) => (
          <Appear key={t} at={at} style={{fontSize: 24, lineHeight: 1.5, fontFamily: FONT}}>
            {t}
          </Appear>
        ))}
      </div>
      <Caption at={440} color={C.yellow}>
        Boyut başta ve sonda aynı (2×768) — ama artık 96 farklı bakış açısını taşıyor.
      </Caption>
    </>
  );
};

export const MultiHead: React.FC = () => (
  <Scene no={10} title="Multi-Head Attention" subtitle="birçok bakış açısı">
    <Beat from={0} dur={620} terms={['head', 'qkv']}>
      <BeatHeads />
    </Beat>
    <Beat from={620} dur={730} terms={['concat', 'wo']}>
      <BeatDims />
    </Beat>
  </Scene>
);

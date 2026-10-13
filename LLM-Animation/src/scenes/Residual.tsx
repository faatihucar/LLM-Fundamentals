import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Appear, Beat, Caption, Lead, Panel, Scene, hexA, useProgress} from '../components';
import {C, FONT, MONO} from '../theme';

export const RESIDUAL_DUR = 840;

type Pt = [number, number];
const along = (pts: Pt[], t: number): Pt => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = t * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) {
      const r = segs[i] === 0 ? 0 : d / segs[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};
const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');

const IN: Pt[] = [
  [280, 280],
  [420, 280],
  [420, 150],
  [600, 150],
];
const OUT: Pt[] = [
  [1000, 150],
  [1200, 150],
  [1200, 246],
];
const SKIP: Pt[] = [
  [280, 280],
  [420, 280],
  [420, 420],
  [1200, 420],
  [1200, 314],
];

const Dot: React.FC<{pts: Pt[]; from: number; to: number; color: string}> = ({pts, from, to, color}) => {
  const f = useCurrentFrame();
  if (f < from || f > to + 10) return null;
  const [x, y] = along(pts, Math.min(1, (f - from) / (to - from)));
  return <circle cx={x} cy={y} r={11} fill={color} />;
};

const BeatSkip: React.FC = () => {
  const f = useCurrentFrame();
  const lines = useProgress(20, 50);
  const mhaGlow = f >= 115 && f <= 165 ? 1 : 0;
  const sumGlow = useProgress(200, 215);
  return (
    <>
      <Lead>Residual connection: bloğa giren girdiyi, bloğun çıktısına geri ekle</Lead>
      <svg width={1720} height={500}>
        <g opacity={lines}>
          <path d={poly(IN)} stroke={C.k} strokeWidth={4} fill="none" />
          <path d={poly(OUT)} stroke={C.k} strokeWidth={4} fill="none" />
          <path d={poly(SKIP)} stroke={C.v} strokeWidth={4} fill="none" strokeDasharray="14 10" />
          <text x={810} y={462} fill={C.v} fontSize={26} textAnchor="middle" fontFamily={FONT} fontWeight={700}>
            kestirme yol (skip connection)
          </text>
        </g>
        <rect x={120} y={230} width={160} height={100} rx={14} fill={hexA(C.accent, 0.15)} stroke={C.accent} strokeWidth={2} />
        <text x={200} y={275} fill={C.text} fontSize={36} fontWeight={800} textAnchor="middle" fontFamily={FONT}>
          X
        </text>
        <text x={200} y={310} fill={C.dim} fontSize={18} textAnchor="middle" fontFamily={MONO}>
          2 token × 768
        </text>
        <rect
          x={600}
          y={100}
          width={400}
          height={100}
          rx={14}
          fill={hexA(C.k, 0.15 + 0.25 * mhaGlow)}
          stroke={C.k}
          strokeWidth={2 + 2 * mhaGlow}
          opacity={lines}
        />
        <text x={800} y={160} fill={C.text} fontSize={30} fontWeight={700} textAnchor="middle" fontFamily={FONT} opacity={lines}>
          Multi-Head Attention
        </text>
        <circle cx={1200} cy={280} r={34} fill={hexA(C.yellow, 0.15 + 0.4 * sumGlow)} stroke={C.yellow} strokeWidth={3} opacity={lines} />
        <text x={1200} y={293} fill={C.yellow} fontSize={40} fontWeight={800} textAnchor="middle" fontFamily={FONT} opacity={lines}>
          +
        </text>
        <line x1={1234} y1={280} x2={1300} y2={280} stroke={C.yellow} strokeWidth={4} opacity={sumGlow} />
        <g opacity={sumGlow}>
          <rect x={1300} y={230} width={360} height={100} rx={14} fill={hexA(C.yellow, 0.15)} stroke={C.yellow} strokeWidth={2} />
          <text x={1480} y={275} fill={C.text} fontSize={30} fontWeight={700} textAnchor="middle" fontFamily={FONT}>
            X + MHA(X)
          </text>
          <text x={1480} y={310} fill={C.dim} fontSize={22} textAnchor="middle" fontFamily={MONO}>
            hâlâ 2×768
          </text>
        </g>
        <Dot pts={IN} from={60} to={115} color={C.k} />
        <Dot pts={OUT} from={165} to={200} color={C.k} />
        <Dot pts={SKIP} from={60} to={200} color={C.v} />
      </svg>
      <div style={{display: 'flex', gap: 24, justifyContent: 'center'}}>
        {[
          ['Ham, saf anlam bulanıklaşmaz', C.accent],
          ['Gradyanlar derin ağda kaybolmaz (vanishing gradient)', C.v],
          ['Boyut değişmez: 2×768', C.yellow],
        ].map(([t, c], i) => (
          <Appear key={t} at={230 + i * 25}>
            <Panel accent={c} side="left" style={{fontSize: 26, padding: '18px 26px'}}>
              {t}
            </Panel>
          </Appear>
        ))}
      </div>
    </>
  );
};

const VALS = [3.1, 7.4, -1.2, 5.6, 9.8, 0.4, 2.2, 6.1, -3.0, 4.4, 8.2, 1.1, 5.0, -0.6, 3.9, 6.7];
const MEAN = VALS.reduce((a, b) => a + b, 0) / VALS.length;
const VAR = VALS.reduce((a, b) => a + (b - MEAN) ** 2, 0) / VALS.length;
const NORM = VALS.map((v) => (v - MEAN) / Math.sqrt(VAR));
const Z = 260;

const BeatNorm: React.FC = () => {
  const p = useProgress(120, 220);
  const lerp = (a: number, b: number) => a + (b - a) * p;
  const meanY = Z - lerp(MEAN * 22, 0);
  return (
    <>
      <Lead>Toplamdan sonra sayılar büyüyebilir, dengesizleşebilir → Layer Normalization</Lead>
      <div style={{display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center'}}>
        <Appear at={10}>
          <Panel style={{padding: 16}}>
            <svg width={1200} height={430}>
              <line x1={0} y1={Z} x2={1200} y2={Z} stroke={C.faint} strokeWidth={2} />
              {VALS.map((v, i) => {
                const h = lerp(v * 22, NORM[i] * 70);
                return <rect key={i} x={20 + i * 67} y={h >= 0 ? Z - h : Z} width={48} height={Math.abs(h)} rx={5} fill={p > 0.5 ? C.teal : C.k} />;
              })}
              <line x1={0} y1={meanY} x2={1200} y2={meanY} stroke={C.yellow} strokeWidth={3} strokeDasharray="10 8" />
              <text x={1195} y={meanY - 10} fill={C.yellow} fontSize={22} textAnchor="end" fontFamily={FONT}>
                ortalama
              </text>
              <text x={10} y={420} fill={C.dim} fontSize={20} fontFamily={FONT}>
                bir token'ın vektörü (768 sayıdan 16'sı)
              </text>
            </svg>
          </Panel>
        </Appear>
        <Appear at={40}>
          <Panel accent={C.teal} style={{width: 360}}>
            <div style={{fontSize: 28, color: C.dim}}>ortalama</div>
            <div style={{fontFamily: MONO, fontSize: 52, fontWeight: 700}}>{lerp(MEAN, 0).toFixed(2)}</div>
            <div style={{fontSize: 28, color: C.dim, marginTop: 20}}>varyans</div>
            <div style={{fontFamily: MONO, fontSize: 52, fontWeight: 700}}>{lerp(VAR, 1).toFixed(2)}</div>
            <div style={{fontSize: 22, color: C.dim, marginTop: 20}}>(x − ortalama) / std</div>
          </Panel>
        </Appear>
      </div>
      <Caption at={250}>Her token'ın 768 sayısı kendi içinde ortalama 0, varyans 1 olacak şekilde yeniden ölçeklenir.</Caption>
    </>
  );
};

export const Residual: React.FC = () => (
  <Scene no={12} title="Residual & Layer Norm" subtitle="Add & Norm">
    <Beat from={0} dur={420} terms={['residual', 'vanish']}>
      <BeatSkip />
    </Beat>
    <Beat from={420} dur={420} terms={['layernorm', 'variance']}>
      <BeatNorm />
    </Beat>
  </Scene>
);

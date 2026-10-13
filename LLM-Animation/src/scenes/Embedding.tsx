import React from 'react';
import {Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {Appear, Beat, Caption, Lead, Panel, Scene, clamp, useProgress} from '../components';
import {C, FONT, MONO} from '../theme';

export const EMBEDDING_DUR = 1050;

const ROWS: [string, number, number, number][] = [
  ['Kedi', 0.95, 0.01, 0.2],
  ['Köpek', 0.98, 0.01, 0.35],
  ['Elma', 0.1, 0.9, 0.1],
  ['Karpuz', 0.15, 0.95, 0.6],
];
const COLS: [string, string][] = [
  ['Canlılık', C.v],
  ['Yiyecek', C.k],
  ['Büyüklük', C.pos],
];

const ValCell: React.FC<{v: number; color: string; at: number}> = ({v, color, at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 25], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
      <div style={{fontFamily: MONO, fontSize: 30, width: 84}}>{v.toFixed(2)}</div>
      <div style={{width: 230, height: 18, background: C.panel2, borderRadius: 9}}>
        <div style={{width: 230 * v * p, height: 18, background: color, borderRadius: 9}} />
      </div>
    </div>
  );
};

const BeatTable: React.FC = () => (
  <>
    <Lead>Embedding: kelimeyi, anlam taşıyan bir sayı vektörüne çevirmek</Lead>
    <Appear at={10} style={{textAlign: 'center', fontSize: 26, color: C.dim, marginBottom: 20}}>
      Diyelim ki model her kelimeyi sadece 3 özelliğe göre puanlıyor:
    </Appear>
    <Panel style={{width: 1400, margin: '0 auto', padding: '20px 40px'}}>
      <div style={{display: 'grid', gridTemplateColumns: '200px repeat(3, 1fr)', rowGap: 22, alignItems: 'center'}}>
        <div />
        {COLS.map(([n, c]) => (
          <Appear key={n} at={20} style={{fontSize: 28, fontWeight: 700, color: c}}>
            {n}
          </Appear>
        ))}
        {ROWS.map(([name, ...vals], r) => (
          <React.Fragment key={name}>
            <Appear at={35 + r * 22} style={{fontSize: 36, fontWeight: 700}}>
              {name}
            </Appear>
            {vals.map((v, c) => (
              <Appear key={c} at={35 + r * 22}>
                <ValCell v={v} color={COLS[c][1]} at={40 + r * 22} />
              </Appear>
            ))}
          </React.Fragment>
        ))}
      </div>
    </Panel>
    <Caption at={190}>
      ID (ör. 540) sadece bir etiket, anlam taşımaz. Embedding vektörü anlam taşır. Gerçek modellerde 768+ boyut.
    </Caption>
  </>
);

// 2-D view: x = Canlılık, y = Büyüklük
const PW = 940;
const PH = 560;
const M = 70;
const px = (x: number) => M + x * (PW - 2 * M - 40);
const py = (y: number) => PH - M - y * (PH - 2 * M);

const PTS = [
  {n: 'Kedi', x: 0.95, y: 0.2, c: C.v, dx: 0, dy: 44, anchor: 'middle' as const},
  {n: 'Köpek', x: 0.98, y: 0.35, c: C.v, dx: 18, dy: 9, anchor: 'start' as const},
  {n: 'Elma', x: 0.1, y: 0.1, c: C.k, dx: 0, dy: 44, anchor: 'middle' as const},
  {n: 'Karpuz', x: 0.15, y: 0.6, c: C.k, dx: 18, dy: 9, anchor: 'start' as const},
];

const Line: React.FC<{a: number; b: number; color: string; at: number; dashed?: boolean}> = ({a, b, color, at, dashed}) => {
  const p = useProgress(at, at + 25);
  const A = PTS[a];
  const B = PTS[b];
  const x1 = px(A.x);
  const y1 = py(A.y);
  const x2 = x1 + (px(B.x) - x1) * p;
  const y2 = y1 + (py(B.y) - y1) * p;
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={4} strokeDasharray={dashed ? '12 10' : undefined} />;
};

const Label: React.FC<{x: number; y: number; at: number; color: string; children: string; anchor?: 'start' | 'middle' | 'end'}> = ({
  x,
  y,
  at,
  color,
  children,
  anchor = 'middle',
}) => {
  const p = useProgress(at + 15, at + 35);
  return (
    <text x={x} y={y} fill={color} fontSize={24} fontWeight={700} textAnchor={anchor} opacity={p} fontFamily={FONT}>
      {children}
    </text>
  );
};

const BeatSpace: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Lead>Vektörler bir "anlam haritası"nda noktalar gibidir</Lead>
      <div style={{display: 'flex', gap: 40, alignItems: 'flex-start'}}>
        <Panel style={{padding: 10}}>
          <svg width={PW} height={PH} style={{overflow: 'visible'}}>
            <line x1={M} y1={PH - M} x2={PW - M} y2={PH - M} stroke={C.faint} strokeWidth={2} />
            <line x1={M} y1={PH - M} x2={M} y2={M - 20} stroke={C.faint} strokeWidth={2} />
            <text x={PW - M} y={PH - M + 40} fill={C.dim} fontSize={22} textAnchor="end" fontFamily={FONT}>
              Canlılık →
            </text>
            <text x={M - 14} y={M - 30} fill={C.dim} fontSize={22} fontFamily={FONT}>
              ↑ Büyüklük
            </text>
            <Line a={0} b={1} color={C.v} at={80} />
            <Line a={0} b={2} color={C.red} at={140} dashed />
            <Line a={2} b={3} color={C.pos} at={200} />
            <Label x={px(0.98)} y={py(0.35) - 40} at={80} color={C.v}>
              yakın → benzer
            </Label>
            <Label x={(px(0.95) + px(0.1)) / 2} y={(py(0.2) + py(0.1)) / 2 - 18} at={140} color={C.red}>
              uzak → farklı
            </Label>
            <Label x={px(0.12) + 40} y={(py(0.1) + py(0.6)) / 2} at={200} color={C.pos} anchor="start">
              aynı tür, farklı büyüklük
            </Label>
            {PTS.map((p, i) => {
              const s = interpolate(f, [15 + i * 10, 30 + i * 10], [0, 1], clamp);
              return (
                <g key={p.n} opacity={s}>
                  <circle cx={px(p.x)} cy={py(p.y)} r={13 * s} fill={p.c} />
                  <text x={px(p.x) + p.dx} y={py(p.y) + p.dy} fill={C.text} fontSize={28} fontWeight={700} textAnchor={p.anchor} fontFamily={FONT}>
                    {p.n}
                  </text>
                </g>
              );
            })}
          </svg>
        </Panel>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 22}}>
          {[
            ['Mesafe = benzerlik', 'Kedi ile Köpek\'in sayıları çok yakın', C.v, 80],
            ['Yön = ilişki', 'Elma → Karpuz: yiyecek aynı, büyüklük farklı', C.pos, 200],
            ['Çıkarım', '"Kediye benzeyen bir şey getir" → en yakın nokta: Köpek', C.yellow, 260],
          ].map(([t, d, c, at]) => (
            <Appear key={t as string} at={at as number}>
              <Panel accent={c as string} side="left">
                <div style={{fontSize: 32, fontWeight: 700}}>{t as string}</div>
                <div style={{fontSize: 25, color: C.dim, marginTop: 6}}>{d as string}</div>
              </Panel>
            </Appear>
          ))}
        </div>
      </div>
    </>
  );
};

const WORDS = [
  {n: 'muz', tx: 0.15, ty: 0.82, c: C.k},
  {n: 'elma', tx: 0.28, ty: 0.72, c: C.k},
  {n: 'kiraz', tx: 0.12, ty: 0.62, c: C.k},
  {n: 'kedi', tx: 0.68, ty: 0.34, c: C.v},
  {n: 'köpek', tx: 0.78, ty: 0.24, c: C.v},
  {n: 'at', tx: 0.64, ty: 0.15, c: C.v},
];
const LW = 820;
const LH = 520;

const STEPS = [
  ['1 · Rastgele başlangıç', 'Her kelimeye rastgele bir vektör atanır'],
  ['2 · Tahmin', '"Maymun ağaçtan ___ kopardı" → model: "taş" ✗'],
  ['3 · Hata (loss)', 'Doğrusu "muz" → ne kadar yanlış olduğu hesaplanır'],
  ['4 · Geri yayılım', 'Embedding sayıları azar azar düzeltilir'],
];

const BeatLearn: React.FC = () => {
  const move = useProgress(170, 330);
  const clusters = useProgress(300, 330);
  return (
    <>
      <Lead>Değerler nasıl öğrenilir? Eksenlere biz karar vermeyiz</Lead>
      <div style={{display: 'flex', gap: 40}}>
        <div style={{width: 780, display: 'flex', flexDirection: 'column', gap: 16}}>
          {STEPS.map(([t, d], i) => (
            <Appear key={t} at={10 + i * 50}>
              <Panel accent={[C.dim, C.q, C.red, C.v][i]} side="left" style={{padding: '18px 26px'}}>
                <div style={{fontSize: 30, fontWeight: 700}}>{t}</div>
                <div style={{fontSize: 24, color: C.dim, marginTop: 4}}>{d}</div>
              </Panel>
            </Appear>
          ))}
        </div>
        <Panel style={{padding: 10}}>
          <svg width={LW} height={LH}>
            <text x={LW * 0.2} y={40} fill={C.k} fontSize={24} opacity={clusters} fontFamily={FONT} textAnchor="middle">
              meyveler
            </text>
            <text x={LW * 0.72} y={LH - 20} fill={C.v} fontSize={24} opacity={clusters} fontFamily={FONT} textAnchor="middle">
              hayvanlar
            </text>
            {WORDS.map((w, i) => {
              const sx = 0.06 + random(`x${i}`) * 0.72;
              const sy = 0.1 + random(`y${i}`) * 0.8;
              const x = (sx + (w.tx - sx) * move) * LW;
              const y = (1 - (sy + (w.ty - sy) * move)) * LH;
              return (
                <g key={w.n}>
                  <circle cx={x} cy={y} r={12} fill={move > 0.5 ? w.c : C.dim} />
                  <text x={x + 18} y={y + 8} fill={C.text} fontSize={26} fontWeight={600} fontFamily={FONT}>
                    {w.n}
                  </text>
                </g>
              );
            })}
          </svg>
        </Panel>
      </div>
      <Caption at={240}>
        Eksenlerin adı yok (latent dimensions): benzer bağlamda geçen kelimeler zamanla birbirine yaklaşır.
      </Caption>
    </>
  );
};

export const Embedding: React.FC = () => (
  <Scene no={4} title="Embedding" subtitle="kelime → anlam vektörü">
    <Beat from={0} dur={360} terms={['embedding', 'vector']}>
      <BeatTable />
    </Beat>
    <Beat from={360} dur={330} terms={['dmodel', 'latent']}>
      <BeatSpace />
    </Beat>
    <Beat from={690} dur={360} terms={['loss', 'backprop']}>
      <BeatLearn />
    </Beat>
  </Scene>
);

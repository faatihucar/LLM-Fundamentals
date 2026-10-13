import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Appear, Badge, Beat, Caption, Lead, Panel, Scene, clamp, hexA, useProgress} from '../components';
import {C, FONT} from '../theme';

export const POSITION_DUR = 840;

const WORD = [0.6, -0.3, 0.8, 0.1, -0.5, 0.4, 0.2, -0.1];
const POS = [0.1, 0.3, -0.2, 0.4, 0.2, -0.3, 0.1, 0.3];

const Bars: React.FC<{vals: number[]; color: string; title: string; sub: string; at: number}> = ({vals, color, title, sub, at}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + 30], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <Panel accent={color} style={{width: 420, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{fontSize: 32, fontWeight: 700}}>{title}</div>
      <div style={{fontSize: 22, color: C.dim, marginBottom: 10}}>{sub}</div>
      <svg width={340} height={360}>
        <line x1={0} y1={180} x2={340} y2={180} stroke={C.faint} strokeWidth={2} />
        {vals.map((v, i) => {
          const h = v * 190 * p;
          return <rect key={i} x={10 + i * 41} y={h >= 0 ? 180 - h : 180} width={30} height={Math.abs(h)} rx={4} fill={color} />;
        })}
      </svg>
    </Panel>
  );
};

const Op: React.FC<{at: number; children: string}> = ({at, children}) => (
  <Appear at={at} style={{fontSize: 70, fontWeight: 700, color: C.dim, width: 80, textAlign: 'center'}}>
    {children}
  </Appear>
);

const BeatSum: React.FC = () => {
  const mix = useProgress(190, 250);
  const sum = WORD.map((w, i) => w + POS[i] * mix);
  return (
    <>
      <Lead>Self-attention kelimelerin sırasını bilmez → her token'a konum bilgisi eklenir</Lead>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20}}>
        <Appear at={15}>
          <Bars vals={WORD} color={C.q} title='"Kedi"' sub="word embedding (anlam)" at={20} />
        </Appear>
        <Op at={70}>+</Op>
        <Appear at={80}>
          <Bars vals={POS} color={C.pos} title="3. sıra" sub="positional (konum)" at={85} />
        </Appear>
        <Op at={150}>=</Op>
        <Appear at={160}>
          <Bars vals={sum} color={C.teal} title="Girdi vektörü" sub="Transformer'a giren" at={165} />
        </Appear>
      </div>
      <Caption at={270}>Artık vektör hem "Kedi" anlamını hem "3. sıra" imzasını taşıyor — ikisi basitçe toplanır.</Caption>
    </>
  );
};

const LearnedTable: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
      {Array.from({length: 6}).map((_, r) => (
        <div key={r} style={{display: 'flex', gap: 5, alignItems: 'center'}}>
          <div style={{width: 60, fontSize: 18, color: r === 2 ? C.yellow : C.dim}}>sıra {r + 1}</div>
          {Array.from({length: 8}).map((__, c) => (
            <div
              key={c}
              style={{
                width: 34,
                height: 24,
                borderRadius: 4,
                background: hexA(r === 2 ? C.yellow : C.pos, 0.25 + 0.25 * Math.sin(f / 9 + r * 1.7 + c)),
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

const Waves: React.FC = () => {
  const W = 400;
  const H = 180;
  const wave = (freq: number, phase: number) =>
    Array.from({length: 81})
      .map((_, i) => {
        const x = (i / 80) * W;
        const y = H / 2 - Math.sin((i / 80) * Math.PI * 2 * freq + phase) * 60;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  const mx = (3 / 8) * W;
  return (
    <svg width={W} height={H}>
      <path d={wave(0.5, 0)} stroke={C.pos} strokeWidth={3} fill="none" />
      <path d={wave(1, Math.PI / 2)} stroke={C.teal} strokeWidth={3} fill="none" />
      <path d={wave(2, 0)} stroke={C.yellow} strokeWidth={3} fill="none" opacity={0.8} />
      <line x1={mx} y1={0} x2={mx} y2={H} stroke={C.text} strokeWidth={2} strokeDasharray="6 6" />
      <text x={mx + 8} y={20} fill={C.text} fontSize={18} fontFamily={FONT}>
        3. sıra
      </text>
    </svg>
  );
};

const Rope: React.FC = () => {
  const f = useCurrentFrame();
  const R = 105;
  const cx = 170;
  const cy = 125;
  const theta = (28 * Math.PI) / 180;
  const colors = [C.q, C.v, C.yellow];
  return (
    <svg width={400} height={240}>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.faint} strokeWidth={2} />
      {[1, 2, 3].map((pos, i) => {
        const show = interpolate(f, [20 + i * 25, 40 + i * 25], [0, 1], clamp);
        const a = -theta * pos * show;
        const x = cx + R * Math.cos(a);
        const y = cy + R * Math.sin(a);
        return (
          <g key={pos} opacity={show}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={colors[i]} strokeWidth={5} strokeLinecap="round" />
            <text x={x + 10} y={y} fill={colors[i]} fontSize={18} fontFamily={FONT}>
              sıra {pos}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const METHODS = [
  {
    name: 'Learned (öğrenilen tablo)',
    desc: '[Max uzunluk × boyut] rastgele tablo; 3. sıradaki kelime 3. satırı alır',
    badge: 'GÜNCELLENİR',
    color: C.v,
    vis: <LearnedTable />,
  },
  {
    name: 'Sinüsoidal (sabit)',
    desc: 'Tablo yok: sıraya göre sin / cos formülüyle hesaplanır',
    badge: 'GÜNCELLENMEZ',
    color: C.yellow,
    vis: <Waves />,
  },
  {
    name: 'RoPE (döndürme)',
    desc: 'Vektörü sıraya göre döndürür; açı farkı = kelimeler arası mesafe',
    badge: 'EN YAYGIN',
    color: C.accent,
    vis: <Rope />,
  },
];

const BeatMethods: React.FC = () => (
  <>
    <Lead>Pozisyon bilgisi 3 yolla hazırlanabilir</Lead>
    <div style={{display: 'flex', gap: 30}}>
      {METHODS.map((m, i) => (
        <Appear key={m.name} at={15 + i * 60} style={{flex: 1}}>
          <Panel accent={m.color} style={{height: 500, display: 'flex', flexDirection: 'column'}}>
            <div style={{fontSize: 30, fontWeight: 700}}>{m.name}</div>
            <div style={{fontSize: 22, color: C.dim, marginTop: 8, minHeight: 64}}>{m.desc}</div>
            <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{m.vis}</div>
            <div>
              <Badge color={m.color}>{m.badge}</Badge>
            </div>
          </Panel>
        </Appear>
      ))}
    </div>
    <Caption at={260}>Geri yayılımda kelime embedding'leri her zaman güncellenir; pozisyon kısmı yönteme bağlı.</Caption>
  </>
);

export const Position: React.FC = () => (
  <Scene no={5} title="Positional Encoding" subtitle="sıra bilgisi">
    <Beat from={0} dur={400} terms={['posvec', 'selfattn']}>
      <BeatSum />
    </Beat>
    <Beat from={400} dur={440} terms={['learnedpos', 'sinus', 'rope']}>
      <BeatMethods />
    </Beat>
  </Scene>
);

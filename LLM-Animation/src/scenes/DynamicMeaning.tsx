import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Appear, ArcSentence, ArrowR, Beat, Caption, Chip, Lead, Panel, ProbBars, Scene, useProgress} from '../components';
import {C, MONO} from '../theme';

export const DYNAMIC_DUR = 1050;

const BASE = [0.21, -0.4, 0.73, 0.1, -0.25, 0.55, 0.3, -0.15];
const FIN = [0.4, 0.3, 0, -0.2, 0.5, 0, -0.1, 0.2];
const RIV = [-0.3, 0.1, -0.35, 0.5, -0.4, -0.2, 0.4, -0.1];

const MiniBars: React.FC<{base: number[]; delta: number[]; color: string; at: number}> = ({base, delta, color, at}) => {
  const p = useProgress(at, at + 40);
  return (
    <svg width={300} height={110}>
      <line x1={0} y1={55} x2={300} y2={55} stroke={C.faint} strokeWidth={2} />
      {base.map((b, i) => {
        const v = b + delta[i] * p;
        const h = v * 55;
        return <rect key={i} x={8 + i * 36} y={h >= 0 ? 55 - h : 55} width={26} height={Math.abs(h)} rx={3} fill={p > 0.5 ? color : C.dim} />;
      })}
    </svg>
  );
};

const LOOKUP: [string, string, boolean][] = [
  ['kedi ', '[ 0.12, −0.53, 0.88, … ]', false],
  ['banka', '[ 0.21, −0.40, 0.73, … ]', true],
  ['nehir', '[ 0.05,  0.61, −0.22, … ]', false],
];

const Output: React.FC<{at: number; ctx: string; label: string; color: string; delta: number[]}> = ({at, ctx, label, color, delta}) => (
  <Appear at={at}>
    <Panel accent={color} side="left" style={{display: 'flex', alignItems: 'center', gap: 24, padding: '18px 24px'}}>
      <div style={{width: 250}}>
        <div style={{fontFamily: MONO, fontSize: 24, color: C.dim}}>{ctx}</div>
        <div style={{fontSize: 30, fontWeight: 700, color, marginTop: 8}}>{label}</div>
      </div>
      <MiniBars base={BASE} delta={delta} color={color} at={at + 30} />
    </Panel>
  </Appear>
);

const BeatStaticDynamic: React.FC = () => (
  <>
    <Lead>Aynı "banka" vektörü, cümleye göre farklı bir anlama dönüşür</Lead>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20}}>
      <Appear at={10}>
        <Panel accent={C.dim} style={{width: 560}}>
          <div style={{fontSize: 28, fontWeight: 700}}>nn.Embedding (lookup table)</div>
          <div style={{marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8}}>
            {LOOKUP.map(([w, vec, hi]) => (
              <div
                key={w}
                style={{
                  fontFamily: MONO,
                  fontSize: 23,
                  padding: '8px 12px',
                  borderRadius: 8,
                  whiteSpace: 'pre',
                  border: `2px solid ${hi ? C.yellow : 'transparent'}`,
                  color: hi ? C.text : C.dim,
                }}
              >
                {w} → {vec}
              </div>
            ))}
          </div>
          <div style={{fontSize: 22, color: C.dim, marginTop: 14}}>
            Sabit liste: cümle ne olursa olsun "banka" hep <b style={{color: C.text}}>aynı vektörle</b> girer.
          </div>
        </Panel>
      </Appear>
      <Appear at={70} x={-20} y={0}>
        <ArrowR w={70} />
      </Appear>
      <Appear at={80}>
        <div
          style={{
            width: 230,
            height: 200,
            borderRadius: 18,
            border: `3px solid ${C.yellow}`,
            background: 'rgba(255, 209, 102, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{fontSize: 30, fontWeight: 700}}>Self-Attention</div>
          <div style={{fontSize: 20, color: C.dim, marginTop: 8, padding: '0 14px'}}>cümledeki diğer kelimelere bakar</div>
        </div>
      </Appear>
      <Appear at={110} x={-20} y={0}>
        <ArrowR w={70} />
      </Appear>
      <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
        <Output at={130} ctx="… para … banka …" label="finans anlamı" color={C.yellow} delta={FIN} />
        <Output at={230} ctx="… nehir … banka …" label="nehir anlamı" color={C.teal} delta={RIV} />
      </div>
    </div>
    <Caption at={320}>
      Eğitim: genel anlam tüm batch'lerden ağırlıklara yazılır. Çıkarım: anlamı o cümledeki kelimeler belirler.
    </Caption>
  </>
);

const TOKS = ['Mühendis,', 'bozulan', 'bilgisayarı', 'tamir etmek', 'için', 'tornavidayı'];

const BeatNextToken: React.FC = () => {
  const f = useCurrentFrame();
  const filled = f >= 400;
  return (
    <>
      <Lead>Next-token tahmini: "tornavidayı" kelimesinden sonra ne gelir?</Lead>
      <div style={{position: 'relative', height: 390}}>
        <ArcSentence
          tokens={[...TOKS, filled ? 'aldı' : '____']}
          from={5}
          width={1720}
          top={280}
          fontSize={34}
          fromAt={20}
          arcs={[
            {to: 3, weight: 0.6, at: 70, label: '0.60'},
            {to: 0, weight: 0.25, at: 90, label: '0.25'},
            {to: 2, weight: 0.1, at: 110, label: '0.10'},
            {to: 1, weight: 0.05, at: 130, label: '0.05'},
          ]}
          tokenColor={(i) => (i === 6 && filled ? C.v : undefined)}
        />
      </div>
      <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 50, marginTop: 30}}>
        <Appear at={200}>
          <Chip size={26} color={C.dim}>
            Softmax çıktısı
          </Chip>
        </Appear>
        <Appear at={210}>
          <ProbBars
            at={220}
            pct
            width={620}
            labelW={130}
            items={[
              {label: 'aldı', v: 0.85, color: C.v},
              {label: 'çıkardı', v: 0.1, color: C.dim},
              {label: 'unuttu', v: 0.04, color: C.dim},
              {label: 'yedi', v: 0.01, color: C.red},
            ]}
          />
        </Appear>
      </div>
      <Caption at={420} color={C.v}>
        "Arkama bakıp hangi kelimeleri dikkate almalıyım?" → tornavida + tamir + mühendis ⇒ <b>aldı</b>
      </Caption>
    </>
  );
};

export const DynamicMeaning: React.FC = () => (
  <Scene no={7} title="Dinamik Anlam" subtitle="sabit embedding → bağlama göre anlam → tahmin">
    <Beat from={0} dur={480} terms={['lookup', 'inference']}>
      <BeatStaticDynamic />
    </Beat>
    <Beat from={480} dur={570} terms={['nexttoken', 'probdist']}>
      <BeatNextToken />
    </Beat>
  </Scene>
);

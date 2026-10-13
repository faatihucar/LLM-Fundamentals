import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Appear, Beat, Lead, Scene, hexA} from '../components';
import {C} from '../theme';

export const SUMMARY_DUR = 720;

const ROWS: [string, React.ReactNode, string][] = [
  ['Tokenizer', 'Metni parçala, her token\'a ID ver', C.q],
  ['Embedding', 'ID → anlam taşıyan vektör (768+ boyut)', C.teal],
  ['+ Pozisyon', 'Sıra bilgisini ekle (Learned / Sinüsoidal / RoPE)', C.pos],
  [
    'Self-Attention',
    <>
      softmax(Q·K<sup>T</sup> / √d<sub>k</sub>) · V → bağlama göre anlam
    </>,
    C.yellow,
  ],
  ['Causal Mask', 'Gelecek token\'lar görünmez (−∞ → 0)', C.red],
  ['Multi-Head', '96 kafa, farklı ilişkiler → concat → Wo', C.k],
  ['Add & Norm + FFN', 'X + çıktı, LayerNorm, MLP · bu blok × N katman', C.v],
  ['Linear + Softmax', 'Sözlükteki her token için olasılık', C.accent],
  ['Sonraki token', 'Seç, cümleye ekle, başa dön ↺', C.text],
];
const STEP = 52;
const START = 30;

const Content: React.FC = () => {
  const f = useCurrentFrame();
  const active = Math.floor((f - START) / STEP);
  const done = active >= ROWS.length;
  return (
    <>
      <Lead>Bir token'ın yolculuğu — baştan sona</Lead>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8, width: 1400, margin: '0 auto'}}>
        {ROWS.map(([name, desc, color], i) => {
          const isActive = i === active;
          const visible = i <= active || done;
          return (
            <Appear key={name} at={START + i * STEP} x={-30} y={0}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 26,
                  padding: '10px 22px',
                  borderRadius: 14,
                  background: isActive ? hexA(color, 0.16) : 'transparent',
                  border: `2px solid ${isActive ? color : 'transparent'}`,
                  opacity: visible ? 1 : 0,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    background: hexA(color, 0.25),
                    border: `2px solid ${color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    fontWeight: 700,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{width: 360, fontSize: 32, fontWeight: 700, color}}>{name}</div>
                <div style={{fontSize: 28, color: isActive || done ? C.text : C.dim}}>{desc}</div>
              </div>
            </Appear>
          );
        })}
      </div>
    </>
  );
};

export const Summary: React.FC = () => (
  <Scene no={17} title="Özet" subtitle="tüm akış">
    <Beat from={0} dur={SUMMARY_DUR}>
      <Content />
    </Beat>
  </Scene>
);

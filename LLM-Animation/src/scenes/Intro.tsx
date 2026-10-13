import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Appear, ArrowR, Chip} from '../components';
import {C, FONT} from '../theme';

export const INTRO_DUR = 240;

const STEPS = ['Metin', 'Tokenizer', 'Embedding', '+ Pozisyon', 'Self-Attention', 'Multi-Head', 'Add & Norm', 'Tahmin'];
const COLORS = [C.dim, C.q, C.teal, C.pos, C.yellow, C.k, C.v, C.red];

export const Intro: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(1400px 800px at 50% -5%, #1c2a5c 0%, ${C.bg} 65%)`,
      fontFamily: FONT,
      color: C.text,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Appear at={5}>
      <div style={{fontSize: 130, fontWeight: 800, letterSpacing: -4}}>LLM Temelleri</div>
    </Appear>
    <Appear at={25}>
      <div style={{fontSize: 42, color: C.dim, marginTop: 6, textAlign: 'center'}}>
        Bir cümle, modelin içinde nasıl yolculuk eder?
      </div>
    </Appear>
    <div style={{display: 'flex', alignItems: 'center', marginTop: 100}}>
      {STEPS.map((s, i) => (
        <div key={s} style={{display: 'flex', alignItems: 'center'}}>
          {i > 0 && (
            <Appear at={58 + i * 12} x={-10} y={0}>
              <ArrowR w={34} />
            </Appear>
          )}
          <Appear at={55 + i * 12}>
            <Chip size={24} color={COLORS[i]}>
              {s}
            </Chip>
          </Appear>
        </div>
      ))}
    </div>
    <Appear at={170}>
      <div style={{fontSize: 26, color: C.dim, marginTop: 70}}>18 bölüm · terimlerin açıklaması en sondaki Sözlük'te</div>
    </Appear>
  </AbsoluteFill>
);

import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Beat, Scene, TermBox, clamp, hexA, useSpring} from '../components';
import {TermKey} from '../terms';
import {C, FONT} from '../theme';

export const TRANSFORMER_DUR = 1350;

const ENC_X = 40;
const DEC_X = 560;
const BW = 400;
const BH = 52;

type Block = {id: string; col: 'enc' | 'dec'; y: number; label: string; c?: string};

const BLOCKS: Block[] = [
  {id: 'inEnc', col: 'enc', y: 752, label: 'Girdi: "Artificial intelligence"'},
  {id: 'embEnc', col: 'enc', y: 688, label: 'Embedding + Pozisyon', c: C.pos},
  {id: 'mha', col: 'enc', y: 600, label: 'Multi-Head Attention', c: C.k},
  {id: 'an1', col: 'enc', y: 532, label: 'Add & Norm', c: C.yellow},
  {id: 'ffn', col: 'enc', y: 464, label: 'Feed-Forward (MLP)', c: C.q},
  {id: 'an2', col: 'enc', y: 396, label: 'Add & Norm', c: C.yellow},
  {id: 'inDec', col: 'dec', y: 752, label: 'Şimdiye kadar üretilen: "Yapay"'},
  {id: 'embDec', col: 'dec', y: 688, label: 'Embedding + Pozisyon', c: C.pos},
  {id: 'mmha', col: 'dec', y: 600, label: 'Masked Multi-Head Attention', c: C.k},
  {id: 'an3', col: 'dec', y: 532, label: 'Add & Norm', c: C.yellow},
  {id: 'cross', col: 'dec', y: 464, label: 'Cross-Attention', c: C.red},
  {id: 'an4', col: 'dec', y: 396, label: 'Add & Norm', c: C.yellow},
  {id: 'ffn2', col: 'dec', y: 328, label: 'Feed-Forward (MLP)', c: C.q},
  {id: 'an5', col: 'dec', y: 260, label: 'Add & Norm', c: C.yellow},
  {id: 'lin', col: 'dec', y: 140, label: 'Linear + Softmax', c: C.v},
  {id: 'out', col: 'dec', y: 72, label: 'Sonraki token → "zeka"'},
];

const STEP_TERMS: TermKey[][] = [
  ['embedding', 'posvec'],
  ['encoder', 'selfattn'],
  ['addnorm', 'layernorm'],
  ['ffn', 'gelu'],
  ['decoder', 'causal'],
  ['crossattn', 'qkv'],
  ['logit', 'lmhead'],
  ['decoderonly', 'decoder'],
];

const STEPS: {from: number; to: number; hi: string[]; title: string; text: string; gpt?: boolean}[] = [
  {
    from: 0,
    to: 170,
    hi: ['inEnc', 'embEnc', 'inDec', 'embDec'],
    title: 'Giriş',
    text: 'Metin → token → Embedding + Positional Encoding toplanır → X matrisi.',
  },
  {
    from: 170,
    to: 340,
    hi: ['mha'],
    title: 'Encoder · Multi-Head Attention',
    text: 'Girdi cümlesindeki kelimeler birbirini çift yönlü görür — maske yok.',
  },
  {
    from: 340,
    to: 480,
    hi: ['an1', 'an2', 'an3', 'an4', 'an5'],
    title: 'Add & Norm',
    text: 'Her alt bloktan sonra: residual toplama + LayerNorm.',
  },
  {
    from: 480,
    to: 630,
    hi: ['ffn', 'ffn2'],
    title: 'Feed-Forward (MLP)',
    text: 'Her token kendi içinde derin işlenir (genişlet → daralt), sonra yine Add & Norm.',
  },
  {
    from: 630,
    to: 800,
    hi: ['mmha'],
    title: 'Decoder · Masked MHA',
    text: 'Şimdiye kadar üretilen kelimeler kendi aralarında bakışır; gelecek maskelenir.',
  },
  {
    from: 800,
    to: 1000,
    hi: ['cross', 'encOut'],
    title: 'Cross-Attention',
    text: 'Q decoder\'dan gelir ("ne arıyorum?"), K ve V encoder\'dan gelir (orijinal cümlenin anlamı).',
  },
  {
    from: 1000,
    to: 1170,
    hi: ['lin', 'out'],
    title: 'Linear + Softmax',
    text: 'Sözlükteki her token için olasılık → en olası token seçilir, sona eklenir, döngü tekrarlar.',
  },
  {
    from: 1170,
    to: 99999,
    hi: ['inDec', 'embDec', 'mmha', 'an3', 'ffn2', 'an5', 'lin', 'out'],
    title: 'GPT nerede?',
    text: 'GPT gibi modeller sadece Decoder kısmını kullanır (cross-attention yok): Causal Multi-Head Attention + FFN, × N katman.',
    gpt: true,
  },
];
const ENC_ONLY = ['inEnc', 'embEnc', 'mha', 'an1', 'ffn', 'an2', 'cross', 'an4', 'encOut'];

const colX = (b: Block) => (b.col === 'enc' ? ENC_X : DEC_X);

const BlockView: React.FC<{b: Block; i: number; state: 'hi' | 'dim' | 'off'}> = ({b, i, state}) => {
  const s = useSpring(5 + i * 6);
  const color = b.c ?? C.dim;
  const isText = !b.c;
  const op = state === 'off' ? 0.12 : state === 'dim' ? 0.5 : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: colX(b),
        top: b.y,
        width: BW,
        height: BH,
        borderRadius: 12,
        border: isText ? 'none' : `${state === 'hi' ? 3 : 2}px solid ${color}`,
        background: isText ? 'transparent' : hexA(color, state === 'hi' ? 0.3 : 0.12),
        boxShadow: state === 'hi' && !isText ? `0 0 28px ${hexA(color, 0.7)}` : undefined,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isText ? 22 : 25,
        fontWeight: isText ? 400 : 700,
        color: isText && state === 'hi' ? C.text : isText ? C.dim : C.text,
        opacity: s * op,
        boxSizing: 'border-box',
      }}
    >
      {b.label}
    </div>
  );
};

const Diagram: React.FC = () => {
  const f = useCurrentFrame();
  const step = STEPS.find((s) => f >= s.from && f < s.to) ?? STEPS[0];
  const stateOf = (id: string): 'hi' | 'dim' | 'off' => {
    if (step.gpt && ENC_ONLY.includes(id)) return 'off';
    return step.hi.includes(id) ? 'hi' : 'dim';
  };
  const frames = interpolate(f, [40, 70], [0, 1], clamp);
  const encOut = stateOf('encOut');
  const cx = (col: 'enc' | 'dec') => (col === 'enc' ? ENC_X : DEC_X) + BW / 2;
  const textOp = interpolate(f, [step.from, step.from + 15, step.to - 12, step.to], [0, 1, 1, 0], clamp);
  const idx = STEPS.indexOf(step);
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <TermBox key={idx} keys={STEP_TERMS[idx]} opacity={textOp} />
      <svg width={1050} height={820} style={{position: 'absolute', left: 0, top: 0}}>
        <g opacity={frames * (step.gpt ? 0.15 : 1)}>
          <rect x={ENC_X - 16} y={382} width={BW + 32} height={286} rx={16} fill="none" stroke={C.faint} strokeWidth={2} strokeDasharray="8 6" />
          <text x={ENC_X - 16} y={370} fill={C.dim} fontSize={22} fontFamily={FONT}>
            Encoder × N
          </text>
        </g>
        <g opacity={frames}>
          <rect x={DEC_X - 16} y={246} width={BW + 32} height={422} rx={16} fill="none" stroke={C.faint} strokeWidth={2} strokeDasharray="8 6" />
          <text x={DEC_X - 16} y={234} fill={C.dim} fontSize={22} fontFamily={FONT}>
            Decoder × N
          </text>
        </g>
        {(['enc', 'dec'] as const).map((col) => {
          const bs = BLOCKS.filter((b) => b.col === col).sort((a, b) => b.y - a.y);
          return bs.slice(1).map((b, k) => (
            <line
              key={b.id}
              x1={cx(col)}
              y1={bs[k].y}
              x2={cx(col)}
              y2={b.y + BH}
              stroke={C.dim}
              strokeWidth={3}
              opacity={frames * (step.gpt && col === 'enc' ? 0.15 : 1)}
            />
          ));
        })}
        <g opacity={frames * (encOut === 'off' ? 0.12 : 1)}>
          <path
            d={`M ${cx('enc')} 382 L ${cx('enc')} 340 L 500 340 L 500 490 L ${DEC_X - 2} 490`}
            fill="none"
            stroke={encOut === 'hi' ? C.red : C.dim}
            strokeWidth={encOut === 'hi' ? 5 : 3}
          />
          <polygon points={`${DEC_X - 16},482 ${DEC_X - 2},490 ${DEC_X - 16},498`} fill={encOut === 'hi' ? C.red : C.dim} />
          <text x={370} y={328} fill={encOut === 'hi' ? C.red : C.dim} fontSize={22} textAnchor="middle" fontFamily={FONT} fontWeight={700}>
            encoder çıktısı → K, V
          </text>
          <text x={DEC_X + BW + 24} y={540} fill={encOut === 'hi' ? C.q : C.dim} fontSize={22} fontFamily={FONT} fontWeight={700}>
            ↑ Q
          </text>
        </g>
      </svg>
      {BLOCKS.map((b, i) => (
        <BlockView key={b.id} b={b} i={i} state={stateOf(b.id)} />
      ))}
      <div style={{position: 'absolute', left: 1060, top: 150, width: 660, opacity: textOp}}>
        <div style={{fontSize: 24, color: C.accent, fontWeight: 700}}>
          {idx + 1} / {STEPS.length}
        </div>
        <div style={{fontSize: 44, fontWeight: 800, marginTop: 8}}>{step.title}</div>
        <div style={{fontSize: 32, color: C.text, marginTop: 20, lineHeight: 1.45}}>{step.text}</div>
      </div>
    </div>
  );
};

export const Transformer: React.FC = () => (
  <Scene no={14} title="Transformer Mimarisi" subtitle="Encoder – Decoder">
    <Beat from={0} dur={TRANSFORMER_DUR}>
      <Diagram />
    </Beat>
  </Scene>
);

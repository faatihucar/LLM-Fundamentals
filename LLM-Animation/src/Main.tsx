import React from 'react';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {fade} from '@remotion/transitions/fade';
import {INTRO_DUR, Intro} from './scenes/Intro';
import {TOKENIZER_DUR, Tokenizer} from './scenes/Tokenizer';
import {CONTEXT_DUR, ContextLength} from './scenes/ContextLength';
import {DATALOADER_DUR, DataLoader} from './scenes/DataLoader';
import {EMBEDDING_DUR, Embedding} from './scenes/Embedding';
import {POSITION_DUR, Position} from './scenes/Position';
import {SELFATT_DUR, SelfAttention} from './scenes/SelfAttention';
import {DYNAMIC_DUR, DynamicMeaning} from './scenes/DynamicMeaning';
import {CAUSAL_DUR, Causal} from './scenes/Causal';
import {DROPOUT_DUR, Dropout} from './scenes/Dropout';
import {MULTIHEAD_DUR, MultiHead} from './scenes/MultiHead';
import {ATTN_MATRICES_DUR, AttentionMatrices} from './scenes/AttentionMatrices';
import {RESIDUAL_DUR, Residual} from './scenes/Residual';
import {FFN_DUR, FFN} from './scenes/FFN';
import {TRANSFORMER_DUR, Transformer} from './scenes/Transformer';
import {TRAINING_LOGIC_DUR, TrainingLogic} from './scenes/TrainingLogic';
import {TRAINING_DUR, Training} from './scenes/Training';
import {SUMMARY_DUR, Summary} from './scenes/Summary';
import {GLOSSARY_DUR, Glossary} from './scenes/Glossary';

export const FPS = 30;
export const TRANSITION = 15;

export const SCENES: {id: string; title: string; Comp: React.FC; dur: number}[] = [
  {id: '00-Giris', title: 'Giriş', Comp: Intro, dur: INTRO_DUR},
  {id: '01-Tokenizer', title: 'Tokenizer', Comp: Tokenizer, dur: TOKENIZER_DUR},
  {id: '02-Context-Length', title: 'Context Length', Comp: ContextLength, dur: CONTEXT_DUR},
  {id: '03-DataLoader', title: 'DataLoader', Comp: DataLoader, dur: DATALOADER_DUR},
  {id: '04-Embedding', title: 'Embedding', Comp: Embedding, dur: EMBEDDING_DUR},
  {id: '05-Pozisyon', title: 'Positional Encoding', Comp: Position, dur: POSITION_DUR},
  {id: '06-Self-Attention', title: 'Self-Attention', Comp: SelfAttention, dur: SELFATT_DUR},
  {id: '07-Dinamik-Anlam', title: 'Dinamik Anlam', Comp: DynamicMeaning, dur: DYNAMIC_DUR},
  {id: '08-Causal-Mask', title: 'Causal Mask', Comp: Causal, dur: CAUSAL_DUR},
  {id: '09-Dropout', title: 'Dropout', Comp: Dropout, dur: DROPOUT_DUR},
  {id: '10-Multi-Head', title: 'Multi-Head Attention', Comp: MultiHead, dur: MULTIHEAD_DUR},
  {id: '11-Matrislerle-Attention', title: 'Matrislerle Attention', Comp: AttentionMatrices, dur: ATTN_MATRICES_DUR},
  {id: '12-Residual-Norm', title: 'Residual & Layer Norm', Comp: Residual, dur: RESIDUAL_DUR},
  {id: '13-FFN', title: 'Feed-Forward (FFN / MLP)', Comp: FFN, dur: FFN_DUR},
  {id: '14-Transformer', title: 'Transformer Mimarisi', Comp: Transformer, dur: TRANSFORMER_DUR},
  {id: '15-Egitimin-Mantigi', title: 'Eğitimin Mantığı', Comp: TrainingLogic, dur: TRAINING_LOGIC_DUR},
  {id: '16-Egitim-Adim-Adim', title: 'Eğitim: Adım Adım', Comp: Training, dur: TRAINING_DUR},
  {id: '17-Ozet', title: 'Özet', Comp: Summary, dur: SUMMARY_DUR},
  {id: '18-Sozluk', title: 'Sözlük', Comp: Glossary, dur: GLOSSARY_DUR},
];

export const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0) - TRANSITION * (SCENES.length - 1);

/** Start frame of each scene inside the full video (scenes overlap by TRANSITION). */
export const sceneStart = (i: number) => SCENES.slice(0, i).reduce((a, s) => a + s.dur, 0) - TRANSITION * i;

export const Main: React.FC = () => {
  const children: React.ReactNode[] = [];
  SCENES.forEach((s, i) => {
    if (i > 0) {
      children.push(
        <TransitionSeries.Transition key={`t-${s.id}`} presentation={fade()} timing={linearTiming({durationInFrames: TRANSITION})} />,
      );
    }
    children.push(
      <TransitionSeries.Sequence key={s.id} durationInFrames={s.dur}>
        <s.Comp />
      </TransitionSeries.Sequence>,
    );
  });
  return <TransitionSeries>{children}</TransitionSeries>;
};

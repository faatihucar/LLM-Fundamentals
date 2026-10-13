import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Appear, Beat, Caption, Lead, MatrixGrid, Panel, Scene, clamp, hexA} from '../components';
import {C} from '../theme';

export const CAUSAL_DUR = 900;

const TOK = ['Yapay', 'zeka', 'dünyayı', 'değiştiriyor'];
const S = [
  [2.1, 0.4, -0.3, 1.2],
  [1.5, 2.4, 0.2, 0.6],
  [0.3, 1.1, 2.0, 0.9],
  [0.8, 0.5, 1.7, 2.2],
];
const P = S.map((row, r) => {
  const e = row.map((v, c) => (c <= r ? Math.exp(v) : 0));
  const s = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / s);
});

const STEPS: [string, string, number, number][] = [
  ['1 · Skorlar', 'Q·Kᵀ her zamanki gibi → N×N matris', 0, 200],
  ['2 · Maske', 'Diyagonalin üstü (gelecek) = −∞', 200, 370],
  ['3 · Softmax', '−∞ → 0, her satır yine toplam 1', 370, 520],
  ['4 · Sonuç', 'Gelecekteki kelimelerin ağırlığı = 0', 520, 9999],
];
const ROW_EXP = [
  '"Yapay" → sadece kendisine bakabilir',
  '"zeka" → Yapay, zeka',
  '"dünyayı" → Yapay, zeka, dünyayı',
  '"değiştiriyor" → kendisi ve öncekilerin hepsi',
];

const Content: React.FC = () => {
  const f = useCurrentFrame();
  const rowHi = f >= 520 ? Math.min(3, Math.floor((f - 520) / 85)) : -1;
  const soft = f >= 385;
  return (
    <>
      <Lead>Model bir token'ı işlerken kendisinden sonra gelenleri göremez</Lead>
      <div style={{display: 'flex', gap: 60, alignItems: 'flex-start', marginTop: 10}}>
        <Appear at={10} style={{marginLeft: 20}}>
          <MatrixGrid
            rows={4}
            cols={4}
            cell={118}
            gap={8}
            fontSize={28}
            labelW={190}
            labelSize={23}
            rowLabels={TOK}
            colLabels={TOK}
            rowStyle={(r) => (r === rowHi ? {boxShadow: `0 0 0 3px ${C.accent}`, background: hexA(C.accent, 0.08)} : {})}
            cellStyle={(r, c) => {
              const k = r * 4 + c;
              const show = interpolate(f, [30 + k * 5, 45 + k * 5], [0, 1], clamp);
              const masked = c > r;
              if (soft) {
                return masked
                  ? {text: '0', bg: hexA(C.red, 0.1), color: C.dim}
                  : {text: P[r][c].toFixed(2), bg: hexA(C.yellow, 0.15 + 0.7 * P[r][c])};
              }
              if (masked && f >= 210 + (r + c) * 8) {
                return {text: '−∞', bg: hexA(C.red, 0.45)};
              }
              return {text: S[r][c].toFixed(1), bg: hexA(C.q, 0.12 + 0.45 * Math.max(0, S[r][c] / 2.4)), opacity: show};
            }}
          />
          <div style={{fontSize: 20, color: C.dim, marginTop: 6, marginLeft: 190}}>satır = Query · sütun = Key</div>
        </Appear>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 14}}>
          {STEPS.map(([t, d, from, to], i) => {
            const active = f >= from && f < to;
            return (
              <Appear key={t} at={from === 0 ? 20 : from}>
                <Panel
                  accent={active ? C.accent : C.faint}
                  side="left"
                  style={{padding: '16px 24px', opacity: active ? 1 : 0.55, background: active ? C.panel2 : C.panel}}
                >
                  <div style={{fontSize: 29, fontWeight: 700}}>{t}</div>
                  <div style={{fontSize: 23, color: C.dim, marginTop: 2}}>{d}</div>
                </Panel>
              </Appear>
            );
          })}
          {rowHi >= 0 && (
            <div style={{fontSize: 30, fontWeight: 600, color: C.accent, marginTop: 10, paddingLeft: 10}}>{ROW_EXP[rowHi]}</div>
          )}
        </div>
      </div>
      <Caption at={640}>Neden? Next-token tahmininde kopya çekmesin → gelecek maskelenir. GPT gibi üretken modellerin temeli.</Caption>
    </>
  );
};

export const Causal: React.FC = () => (
  <Scene no={8} title="Causal (Masked) Self-Attention" subtitle="geleceğe bakmak yasak">
    <Beat from={0} dur={CAUSAL_DUR} terms={['causal', 'neginf']}>
      <Content />
    </Beat>
  </Scene>
);

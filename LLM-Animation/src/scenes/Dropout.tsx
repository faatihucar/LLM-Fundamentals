import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {Appear, Beat, Caption, Chip, Lead, MatrixGrid, Panel, Scene, hexA} from '../components';
import {C} from '../theme';

export const DROPOUT_DUR = 1080;
const MAIN_DUR = 720;

const TOK = ['Yapay', 'zeka', 'dünyayı', 'hızla', 'değişiyor'];
const W = [[1], [0.35, 0.65], [0.15, 0.25, 0.6], [0.1, 0.2, 0.3, 0.4], [0.05, 0.15, 0.2, 0.25, 0.35]];
const P_DROP = 0.3;

const Content: React.FC = () => {
  const f = useCurrentFrame();
  const step = f < 90 ? -1 : Math.floor((f - 90) / 50);
  const dropped = (r: number, c: number) => step >= 0 && c <= r && random(`d${step}-${r}-${c}`) < P_DROP;
  return (
    <>
      <Lead>Eğitim sırasında bazı bağlantılar rastgele kapatılır (sıfırlanır)</Lead>
      <div style={{display: 'flex', gap: 60, alignItems: 'flex-start'}}>
        <Appear at={10} style={{marginLeft: 20}}>
          <div style={{fontSize: 26, fontWeight: 700, color: step >= 0 ? C.red : C.dim, marginBottom: 12, marginLeft: 170}}>
            {step >= 0 ? `Eğitim adımı #${step + 1} — yeni rastgele maske` : 'Attention ağırlıkları (softmax sonrası)'}
          </div>
          <MatrixGrid
            rows={5}
            cols={5}
            cell={96}
            gap={6}
            fontSize={22}
            labelW={170}
            labelSize={20}
            rowLabels={TOK}
            colLabels={TOK}
            cellStyle={(r, c) => {
              if (c > r) return {text: '', bg: hexA(C.faint, 0.25), border: 'none'};
              const w = W[r][c];
              if (dropped(r, c)) return {text: '0', bg: hexA(C.red, 0.45), scale: 0.9};
              const shown = step >= 0 ? w / (1 - P_DROP) : w;
              return {text: shown.toFixed(2), bg: hexA(C.yellow, 0.12 + 0.6 * Math.min(1, shown))};
            }}
          />
          <div style={{fontSize: 20, color: C.dim, marginLeft: 170, marginTop: 4}}>p = 0.3 · kalanlar 1/(1−p) ile ölçeklenir</div>
        </Appear>
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 18}}>
          <Appear at={40} style={{fontSize: 28, color: C.dim}}>
            Nerede uygulanır?
          </Appear>
          <Appear at={60}>
            <Panel accent={C.yellow} side="left">
              <div style={{fontSize: 28, fontWeight: 700}}>1 · Attention ağırlıklarında</div>
              <div style={{fontSize: 23, color: C.dim, marginTop: 6}}>
                "banka" → "para" %90'lık bağ geçici kopar → model alternatif kelimelerden de bilgi toplamayı öğrenir
              </div>
            </Panel>
          </Appear>
          <Appear at={130}>
            <Panel accent={C.teal} side="left">
              <div style={{fontSize: 28, fontWeight: 700}}>2 · Context vector çıkışında</div>
              <div style={{fontSize: 23, color: C.dim, marginTop: 6}}>Nöronlar birbirine aşırı bağımlı olmasın (co-adaptation)</div>
            </Panel>
          </Appear>
          <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8}}>
            {['Ezberlemeyi önler', 'Daha dayanıklı temsiller', 'Kapasiteyi kullanır'].map((t, i) => (
              <Appear key={t} at={220 + i * 20}>
                <Chip size={24} color={C.v}>
                  ✓ {t}
                </Chip>
              </Appear>
            ))}
          </div>
        </div>
      </div>
      <Caption at={330}>Dropout sadece eğitimde açıktır; çıkarımda (inference) tüm bağlantılar kullanılır.</Caption>
    </>
  );
};


const FLOW: [string, string][] = [
  ['skorlar (Q·Kᵀ)', C.q],
  ['softmax', C.yellow],
  ['ağırlıklar (toplam 1)', C.yellow],
  ['dropout', C.red],
  ['× V', C.v],
];
const ROW = [0.42, 0.18, 0.13, 0.27];
const KEEP = [true, false, true, false];

const WhyNoSoftmax: React.FC = () => (
  <>
    <Lead>Neden dropout'tan sonra tekrar softmax yapılmıyor?</Lead>
    <Appear at={10} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12}}>
      {FLOW.map(([t, c], i) => (
        <React.Fragment key={t}>
          {i > 0 && <span style={{fontSize: 30, color: C.dim}}>→</span>}
          <Chip size={24} color={c}>
            {t}
          </Chip>
        </React.Fragment>
      ))}
    </Appear>
    <div style={{display: 'flex', gap: 30, marginTop: 30}}>
      <Appear at={50} style={{flex: 1}}>
        <Panel accent={C.red} style={{height: 210, fontSize: 23, lineHeight: 1.45}}>
          <div style={{fontSize: 27, fontWeight: 700, marginBottom: 8}}>Dropout'tan SONRA softmax yapılsaydı</div>
          Softmax her sayıyı e<sup>sayı</sup>'ya çevirir ve <b>e⁰ = 1</b>. Sıfırlanan ağırlık tekrar pozitif olurdu → kapattığımız bağlantı
          geri açılır, dropout boşa giderdi.
        </Panel>
      </Appear>
      <Appear at={100} style={{flex: 1}}>
        <Panel accent={C.k} style={{height: 210, fontSize: 23, lineHeight: 1.45}}>
          <div style={{fontSize: 27, fontWeight: 700, marginBottom: 8}}>Dropout softmax'tan ÖNCE yapılsaydı</div>
          Skoru 0 yapmak bağlantıyı kapatmaz (e⁰ = 1, orta bir değer). Kapatmak için <b>−∞</b> gerekir (e<sup>−∞</sup> = 0) — o da causal maskenin
          işi.
        </Panel>
      </Appear>
    </div>
    <Appear at={160} style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 28}}>
      <div style={{fontSize: 22, color: C.dim, width: 210, textAlign: 'right'}}>bir satırın ağırlıkları</div>
      {ROW.map((v, i) => (
        <Chip key={`a${i}`} size={22} mono color={C.yellow}>
          {v.toFixed(2)}
        </Chip>
      ))}
      <div style={{fontSize: 22, color: C.red}}>→ dropout (p = 0.5) →</div>
      {ROW.map((v, i) => (
        <Chip key={`b${i}`} size={22} mono color={KEEP[i] ? C.v : C.red}>
          {KEEP[i] ? (v * 2).toFixed(2) : '0'}
        </Chip>
      ))}
      <div style={{fontSize: 22, color: C.dim}}>→ doğrudan × V</div>
    </Appear>
    <Caption at={210}>
      Satır toplamı artık tam 1 değil (bu örnekte 1.10) ve bu bilinçli: kalanlar 1/(1−p) = 2 ile çarpılır, ortalamada toplam yine 1 olur.
    </Caption>
  </>
);

export const Dropout: React.FC = () => (
  <Scene no={9} title="Dropout" subtitle="ezberlemeye karşı">
    <Beat from={0} dur={MAIN_DUR} terms={['dropout', 'overfit']}>
      <Content />
    </Beat>
    <Beat from={MAIN_DUR} dur={DROPOUT_DUR - MAIN_DUR} terms={['softmax', 'neginf']}>
      <WhyNoSoftmax />
    </Beat>
  </Scene>
);

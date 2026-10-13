import React from 'react';
import {interpolate, random, useCurrentFrame} from 'remotion';
import {Appear, Beat, Caption, Chip, Lead, Panel, Scene, clamp, hexA, useProgress} from '../components';
import {C, FONT, MONO} from '../theme';
import raw from '../data/training.json';

type Knob = {
  word: string;
  dim: number;
  w0: number;
  loss0: number;
  grad0: number;
  eta: number;
  xs: number[];
  ys: number[];
  steps: {w: number; loss: number; grad: number}[];
};
type Data = {
  vocab: string[];
  params: number;
  curve: number[];
  steps: number;
  step0: {probs: number[][]; lossTok: number[]};
  knob: Knob;
};
const DATA = raw as unknown as Data;
const KNOB = DATA.knob;
const ROW = 2; // "Yapay zeka metni" → target "okur"
const PROBS = DATA.step0.probs[ROW];
const TARGET = DATA.vocab.indexOf('okur');
const P_TARGET = PROBS[TARGET];
const LOSS_TARGET = DATA.step0.lossTok[ROW];
const BEST = PROBS.reduce((b, v, i) => (v > PROBS[b] ? i : b), 0);
const fmt = (v: number, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);

export const TRAINING_LOGIC_DUR = 2520;

// ---------------------------------------------------------------------------------------------
// 1 · the model is a box of knobs
// ---------------------------------------------------------------------------------------------
const Knobs: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{display: 'grid', gridTemplateColumns: 'repeat(16, 34px)', gap: 10}}>
      {Array.from({length: 96}).map((_, i) => {
        const pos = random(`k${i}`);
        const wobble = Math.sin(f / 14 + i) * 0.05;
        const show = interpolate(f, [10 + i * 1.2, 20 + i * 1.2], [0, 1], clamp);
        return (
          <div key={i} style={{position: 'relative', width: 34, height: 70, opacity: show}}>
            <div style={{position: 'absolute', left: 15, top: 0, width: 4, height: 70, borderRadius: 2, background: C.faint}} />
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: (pos + wobble) * 56,
                width: 24,
                height: 14,
                borderRadius: 4,
                background: [C.q, C.k, C.v, C.pos, C.yellow, C.teal][i % 6],
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const BeatKnobs: React.FC = () => (
  <>
    <Lead>Model aslında çok sayıda ayarlanabilir düğmeden (parametre) oluşur</Lead>
    <div style={{display: 'flex', gap: 60, alignItems: 'center', justifyContent: 'center'}}>
      <Panel style={{padding: 30}}>
        <Knobs />
      </Panel>
      <div style={{display: 'flex', flexDirection: 'column', gap: 18, width: 640}}>
        <Appear at={40}>
          <div style={{fontSize: 64, fontWeight: 800, color: C.yellow}}>{DATA.params} düğme</div>
          <div style={{fontSize: 24, color: C.dim}}>bizim minik modelde (GPT-3'te 175 milyar)</div>
        </Appear>
        <Appear at={90}>
          <Panel accent={C.accent} side="left" style={{fontSize: 23, lineHeight: 1.5}}>
            Embedding tablosundaki sayılar, Wq · Wk · Wv · Wo, FFN'in ağırlıkları, LayerNorm, son Linear katman… hepsi birer düğme.
          </Panel>
        </Appear>
        <Appear at={140}>
          <Panel accent={C.v} side="left" style={{fontSize: 23, lineHeight: 1.5}}>
            Başta hepsi <b>rastgele</b>. Kimse elle ayarlamaz; model kendi hatalarından öğrenerek ayarlar.
          </Panel>
        </Appear>
      </div>
    </div>
    <Caption at={200}>Eğitim = bu düğmelerin, doğru tahmin yapacak ayarını bulmak.</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 2 · predict
// ---------------------------------------------------------------------------------------------
const BeatPredict: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Lead>1 · Tahmin: model sözlükteki her kelimeye bir olasılık verir</Lead>
      <div style={{display: 'flex', alignItems: 'center', gap: 34, justifyContent: 'center'}}>
        <Appear at={10} style={{display: 'flex', gap: 8}}>
          {['Yapay', 'zeka', 'metni'].map((t) => (
            <Chip key={t} size={28} color={C.q}>
              {t}
            </Chip>
          ))}
        </Appear>
        <Appear at={30} style={{fontSize: 40, color: C.dim}}>
          →
        </Appear>
        <Appear at={40}>
          <div
            style={{
              width: 190,
              height: 150,
              borderRadius: 18,
              border: `3px solid ${C.accent}`,
              background: hexA(C.accent, 0.12),
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{fontSize: 34, fontWeight: 800}}>Model</div>
            <div style={{fontSize: 18, color: C.dim}}>düğmeler rastgele</div>
          </div>
        </Appear>
        <Appear at={60} style={{fontSize: 40, color: C.dim}}>
          →
        </Appear>
        <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
          {DATA.vocab.map((w, i) => {
            const p = interpolate(f, [70 + i * 5, 100 + i * 5], [0, 1], clamp);
            const isT = i === TARGET;
            return (
              <div key={w} style={{display: 'flex', alignItems: 'center', gap: 12, opacity: Math.min(1, p * 2)}}>
                <div style={{width: 110, textAlign: 'right', fontSize: 22, fontWeight: isT ? 800 : 400, color: isT ? C.v : C.text}}>{w}</div>
                <div style={{width: 380, height: 22, background: C.panel2, borderRadius: 6, outline: isT ? `2px solid ${C.v}` : undefined}}>
                  <div style={{width: (380 * PROBS[i] * p) / 0.4, maxWidth: 380, height: '100%', borderRadius: 6, background: isT ? C.v : C.dim}} />
                </div>
                <div style={{fontFamily: MONO, fontSize: 20, width: 60}}>{(PROBS[i] * p).toFixed(2)}</div>
              </div>
            );
          })}
        </div>
      </div>
      <Caption at={160} color={C.v}>
        Doğru cevap "okur" ama model ona sadece {P_TARGET.toFixed(2)} verdi; en yüksek olasılığı "{DATA.vocab[BEST]}"a verdi.
      </Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 3 · loss = −log p
// ---------------------------------------------------------------------------------------------
const LW = 860;
const LH = 470;
const lx = (p: number) => 70 + p * (LW - 110);
const ly = (l: number) => 30 + (1 - l / 4) * (LH - 90);
const LOSS_PATH = Array.from({length: 99}, (_, i) => {
  const p = 0.02 + (i / 98) * 0.98;
  return `${i ? 'L' : 'M'} ${lx(p).toFixed(1)} ${ly(-Math.log(p)).toFixed(1)}`;
}).join(' ');

const BeatLoss: React.FC = () => {
  const draw = useProgress(10, 60);
  const good = useProgress(150, 180);
  return (
    <>
      <Lead>2 · Ne kadar yanlış? Loss = −log(doğru kelimeye verilen olasılık)</Lead>
      <div style={{display: 'flex', gap: 50, alignItems: 'center', justifyContent: 'center'}}>
        <Panel style={{padding: 10}}>
          <svg width={LW} height={LH}>
            <line x1={70} y1={ly(0)} x2={LW - 30} y2={ly(0)} stroke={C.faint} strokeWidth={2} />
            <line x1={70} y1={ly(4)} x2={70} y2={ly(0)} stroke={C.faint} strokeWidth={2} />
            {[0, 1, 2, 3, 4].map((l) => (
              <text key={l} x={58} y={ly(l) + 6} fill={C.dim} fontSize={18} textAnchor="end" fontFamily={MONO}>
                {l}
              </text>
            ))}
            {[0, 0.5, 1].map((p) => (
              <text key={p} x={lx(p)} y={ly(0) + 28} fill={C.dim} fontSize={18} textAnchor="middle" fontFamily={MONO}>
                {p}
              </text>
            ))}
            <text x={LW - 30} y={ly(0) + 56} fill={C.dim} fontSize={20} textAnchor="end" fontFamily={FONT}>
              doğru kelimenin olasılığı (p) →
            </text>
            <text x={80} y={ly(4) + 4} fill={C.dim} fontSize={20} fontFamily={FONT}>
              loss
            </text>
            <path d={LOSS_PATH} fill="none" stroke={C.red} strokeWidth={4} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            <g opacity={draw >= 1 ? 1 : 0}>
              <line x1={lx(P_TARGET)} y1={ly(0)} x2={lx(P_TARGET)} y2={ly(LOSS_TARGET)} stroke={C.yellow} strokeDasharray="6 6" strokeWidth={2} />
              <circle cx={lx(P_TARGET)} cy={ly(LOSS_TARGET)} r={11} fill={C.yellow} />
              <text x={lx(P_TARGET) + 18} y={ly(LOSS_TARGET) - 12} fill={C.yellow} fontSize={22} fontWeight={700} fontFamily={FONT}>
                şu an: p = {P_TARGET.toFixed(2)}, loss = {LOSS_TARGET.toFixed(2)}
              </text>
            </g>
            <g opacity={good}>
              <circle cx={lx(0.9)} cy={ly(-Math.log(0.9))} r={11} fill={C.v} />
              <text x={lx(0.9)} y={ly(-Math.log(0.9)) - 22} fill={C.v} fontSize={22} fontWeight={700} textAnchor="middle" fontFamily={FONT}>
                hedef: p → 1, loss → 0
              </text>
            </g>
          </svg>
        </Panel>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, width: 560}}>
          <Appear at={70}>
            <Panel accent={C.red} side="left" style={{fontSize: 23, lineHeight: 1.5}}>
              Doğru kelimeye <b>az</b> olasılık verdiyse ceza (loss) <b>büyük</b>.
            </Panel>
          </Appear>
          <Appear at={110}>
            <Panel accent={C.v} side="left" style={{fontSize: 23, lineHeight: 1.5}}>
              Olasılık 1'e yaklaştıkça ceza 0'a iner. <b>Amaç: loss'u küçültmek.</b>
            </Panel>
          </Appear>
          <Appear at={190}>
            <Panel accent={C.dim} side="left" style={{fontSize: 21, lineHeight: 1.5, color: C.dim}}>
              Bu ölçünün adı <b style={{color: C.text}}>cross-entropy</b>. Bütün pozisyonların loss'u ortalanır → tek bir sayı.
            </Panel>
          </Appear>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 4–5 · one knob: slope, then steps down the valley (real 1-D slice of the real loss)
// ---------------------------------------------------------------------------------------------
const KW = 900;
const KH = 470;
const Y_MIN = Math.min(...KNOB.ys) - 0.02;
const Y_MAX = Math.max(...KNOB.ys) + 0.02;
const kx = (w: number) => 70 + ((w - KNOB.xs[0]) / (KNOB.xs[KNOB.xs.length - 1] - KNOB.xs[0])) * (KW - 110);
const ky = (l: number) => 30 + (1 - (l - Y_MIN) / (Y_MAX - Y_MIN)) * (KH - 90);
const KNOB_PATH = KNOB.xs.map((x, i) => `${i ? 'L' : 'M'} ${kx(x).toFixed(1)} ${ky(KNOB.ys[i]).toFixed(1)}`).join(' ');

const KnobPlot: React.FC<{ball: {w: number; loss: number}; tangent?: boolean; trail?: {w: number; loss: number}[]; arrow?: boolean}> = ({
  ball,
  tangent,
  trail = [],
  arrow,
}) => {
  const dw = 0.55;
  return (
    <svg width={KW} height={KH}>
      <line x1={70} y1={KH - 60} x2={KW - 30} y2={KH - 60} stroke={C.faint} strokeWidth={2} />
      <line x1={70} y1={30} x2={70} y2={KH - 60} stroke={C.faint} strokeWidth={2} />
      <text x={KW - 30} y={KH - 26} fill={C.dim} fontSize={20} textAnchor="end" fontFamily={FONT}>
        düğmenin değeri (w) →
      </text>
      <text x={80} y={24} fill={C.dim} fontSize={20} fontFamily={FONT}>
        loss
      </text>
      <path d={KNOB_PATH} fill="none" stroke={C.red} strokeWidth={4} />
      {trail.map((s, i) => (
        <circle key={i} cx={kx(s.w)} cy={ky(s.loss)} r={7} fill={hexA(C.yellow, 0.45)} />
      ))}
      {tangent && (
        <line
          x1={kx(ball.w - dw)}
          y1={ky(ball.loss - KNOB.grad0 * dw)}
          x2={kx(ball.w + dw)}
          y2={ky(ball.loss + KNOB.grad0 * dw)}
          stroke={C.teal}
          strokeWidth={4}
        />
      )}
      {arrow && (
        <g>
          <line x1={kx(ball.w)} y1={KH - 80} x2={kx(ball.w) + 120} y2={KH - 80} stroke={C.v} strokeWidth={4} />
          <polygon points={`${kx(ball.w) + 120},${KH - 90} ${kx(ball.w) + 138},${KH - 80} ${kx(ball.w) + 120},${KH - 70}`} fill={C.v} />
          <text x={kx(ball.w) + 60} y={KH - 94} fill={C.v} fontSize={20} textAnchor="middle" fontWeight={700} fontFamily={FONT}>
            buraya git
          </text>
        </g>
      )}
      <circle cx={kx(ball.w)} cy={ky(ball.loss)} r={14} fill={C.yellow} stroke={C.bg} strokeWidth={3} />
    </svg>
  );
};

const BeatSlope: React.FC = () => {
  const showTangent = useProgress(90, 110) > 0.5;
  return (
    <>
      <Lead>3 · Hangi yöne çevirmeli? Tek bir düğmeye bakalım</Lead>
      <div style={{display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center'}}>
        <Appear at={10}>
          <Panel style={{padding: 10}}>
            <KnobPlot ball={{w: KNOB.w0, loss: KNOB.loss0}} tangent={showTangent} arrow={showTangent} />
          </Panel>
        </Appear>
        <div style={{display: 'flex', flexDirection: 'column', gap: 14, width: 560}}>
          <Appear at={30}>
            <Panel accent={C.accent} side="left" style={{fontSize: 21, lineHeight: 1.5}}>
              Düğme: son Linear katmanda "{KNOB.word}" kelimesine giden bir ağırlık. Diğer {DATA.params - 1} düğme sabit tutulup sadece bu
              oynatıldığında loss'un gerçek eğrisi.
            </Panel>
          </Appear>
          <Appear at={60}>
            <Panel accent={C.yellow} side="left" style={{fontSize: 22, lineHeight: 1.5, fontFamily: MONO}}>
              şu an: w = {fmt(KNOB.w0)} · loss = {KNOB.loss0.toFixed(3)}
            </Panel>
          </Appear>
          <Appear at={100}>
            <Panel accent={C.teal} side="left" style={{fontSize: 22, lineHeight: 1.5}}>
              <b>Eğim (gradyan) = {fmt(KNOB.grad0)}</b>. Negatif: w'yi artırırsam loss azalır.
            </Panel>
          </Appear>
          <Appear at={150}>
            <Panel accent={C.v} side="left" style={{fontSize: 22, lineHeight: 1.5}}>
              Kural: <b>eğimin tersi yönüne</b> git (yokuş aşağı).
            </Panel>
          </Appear>
        </div>
      </div>
      <Caption at={210}>Gradyan, her düğme için "biraz çevirirsem loss ne kadar ve hangi yönde değişir?" sorusunun cevabıdır.</Caption>
    </>
  );
};

const STEP_FRAMES = 50;
const BeatSteps: React.FC = () => {
  const f = useCurrentFrame();
  const n = KNOB.steps.length;
  const k = Math.min(n - 1, Math.max(0, Math.floor((f - 30) / STEP_FRAMES)));
  const t = interpolate((f - 30) % STEP_FRAMES, [0, 25], [0, 1], clamp);
  const from = KNOB.steps[Math.max(0, k - 1)];
  const to = KNOB.steps[k];
  const w = f < 30 ? KNOB.steps[0].w : from.w + (to.w - from.w) * t;
  const loss = f < 30 ? KNOB.steps[0].loss : from.loss + (to.loss - from.loss) * t;
  const shown = KNOB.steps.slice(0, Math.min(4, k + 1));
  return (
    <>
      <Lead>4 · Biraz çevir, tekrar bak: w ← w − η · eğim</Lead>
      <div style={{display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center'}}>
        <Panel style={{padding: 10}}>
          <KnobPlot ball={{w, loss}} trail={KNOB.steps.slice(0, k)} />
        </Panel>
        <div style={{display: 'flex', flexDirection: 'column', gap: 10, width: 600}}>
          {shown.map((s, i) => {
            const next = KNOB.steps[i + 1];
            return (
              <div key={i} style={{fontFamily: MONO, fontSize: 21, lineHeight: 1.45, background: C.panel, borderRadius: 12, padding: '10px 16px'}}>
                <div style={{color: C.yellow}}>
                  adım {i + 1}: w = {fmt(s.w)} · loss = {s.loss.toFixed(3)}
                </div>
                {next && (
                  <div style={{color: C.dim, fontSize: 19}}>
                    w ← {fmt(s.w)} − η × ({fmt(s.grad)}) = {fmt(next.w)}
                  </div>
                )}
              </div>
            );
          })}
          <Appear at={240}>
            <Panel accent={C.dim} side="left" style={{fontSize: 20, lineHeight: 1.5}}>
              <b>η (öğrenme oranı)</b> = adım büyüklüğü. Çok büyükse vadinin karşısına zıplar, çok küçükse çok yavaş iner. (Burada adımlar
              görünsün diye büyük seçildi.)
            </Panel>
          </Appear>
        </div>
      </div>
      <Caption at={300}>Top vadinin dibine yuvarlanır gibi: her adımda loss biraz daha küçülür ({KNOB.steps[0].loss.toFixed(3)} → {KNOB.steps[n - 1].loss.toFixed(3)}).</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 6 · backprop: all knobs at once
// ---------------------------------------------------------------------------------------------
const CHAIN = ['Embedding', 'Attention', 'Add & Norm', 'FFN', 'Add & Norm', 'Linear', 'Softmax', 'Loss'];
const CB = 170;
const CG = 26;
const BeatBackprop: React.FC = () => {
  const f = useCurrentFrame();
  const fwd = interpolate(f, [20, 90], [0, 1], clamp);
  const bwd = interpolate(f, [110, 220], [0, 1], clamp);
  const total = CHAIN.length * CB + (CHAIN.length - 1) * CG;
  return (
    <>
      <Lead>5 · Bütün düğmeler aynı anda: geri yayılım (backpropagation)</Lead>
      <div style={{position: 'relative', width: total, height: 210, margin: '20px auto 0'}}>
        {CHAIN.map((c, i) => {
          const reached = bwd > 0 && 1 - bwd <= (i + 0.5) / CHAIN.length;
          return (
            <div
              key={c}
              style={{
                position: 'absolute',
                left: i * (CB + CG),
                top: 60,
                width: CB,
                height: 70,
                borderRadius: 14,
                border: `2px solid ${i === CHAIN.length - 1 ? C.red : reached ? C.red : C.panelBorder}`,
                background: reached && i < CHAIN.length - 1 ? hexA(C.red, 0.12) : C.panel,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {c}
              {reached && i < CHAIN.length - 1 && <div style={{position: 'absolute', top: 82, fontSize: 18, color: C.red}}>eğimler hazır</div>}
            </div>
          );
        })}
        <div style={{position: 'absolute', top: 18, left: fwd * (total - 22), width: 22, height: 22, borderRadius: 11, background: C.q, opacity: fwd > 0 && fwd < 1 ? 1 : 0}} />
        <div style={{position: 'absolute', top: 18, left: 0, fontSize: 20, color: C.q, opacity: f > 20 && f < 100 ? 1 : 0}}>ileri: tahmin →</div>
        <div style={{position: 'absolute', top: 175, left: (1 - bwd) * (total - 22), width: 22, height: 22, borderRadius: 11, background: C.red, opacity: bwd > 0 && bwd < 1 ? 1 : 0}} />
        <div style={{position: 'absolute', top: 175, right: 0, fontSize: 20, color: C.red, opacity: f > 110 ? 1 : 0}}>← geri: eğimler</div>
      </div>
      <div style={{display: 'flex', gap: 30, justifyContent: 'center', marginTop: 30}}>
        <Appear at={140}>
          <Panel accent={C.red} side="left" style={{width: 760, fontSize: 23, lineHeight: 1.5}}>
            Loss'tan başlayıp geriye doğru, her katman kendinden sonrakinin eğimini kullanarak kendi düğmelerinin eğimini bulur (zincir kuralı).
          </Panel>
        </Appear>
        <Appear at={190}>
          <Panel accent={C.yellow} side="left" style={{width: 640, fontSize: 23, lineHeight: 1.5}}>
            Tek bir geri geçişte {DATA.params} düğmenin hepsinin eğimi hesaplanır; sonra hepsi aynı anda biraz çevrilir.
          </Panel>
        </Appear>
      </div>
      <Caption at={260}>PyTorch'ta bu iki satır: loss.backward() eğimleri hesaplar, optimizer.step() düğmeleri çevirir.</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 7 · repeat
// ---------------------------------------------------------------------------------------------
const CYCLE = ['1 · Tahmin', '2 · Loss', '3 · Gradyan', '4 · Güncelle'];
const CYCLE_COLORS = [C.q, C.red, C.teal, C.v];
const BeatRepeat: React.FC = () => {
  const f = useCurrentFrame();
  const lap = 40;
  const laps = Math.max(0, (f - 20) / lap);
  const angle = (laps % 1) * Math.PI * 2 - Math.PI / 2;
  const step = Math.min(DATA.steps, Math.round((Math.max(0, f - 20) / 260) ** 2 * DATA.steps));
  const R = 190;
  const cx = 300;
  const cy = 250;
  const CWW = 700;
  const CHH = 420;
  const px = (i: number) => 60 + (i / DATA.steps) * (CWW - 90);
  const py = (l: number) => 20 + (1 - l / 2.6) * (CHH - 70);
  const path = DATA.curve
    .slice(0, Math.max(1, step + 1))
    .map((l, i) => `${i ? 'L' : 'M'} ${px(i).toFixed(1)} ${py(l).toFixed(1)}`)
    .join(' ');
  return (
    <>
      <Lead>6 · Tekrarla: her turda bütün düğmeler biraz düzelir</Lead>
      <div style={{display: 'flex', gap: 60, alignItems: 'center', justifyContent: 'center'}}>
        <svg width={600} height={500}>
          <circle cx={cx} cy={cy} r={R} fill="none" stroke={C.faint} strokeWidth={3} strokeDasharray="10 8" />
          {f > 20 && <circle cx={cx + R * Math.cos(angle)} cy={cy + R * Math.sin(angle)} r={13} fill={C.yellow} />}
          {CYCLE.map((t, i) => {
            const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
            const x = cx + R * Math.cos(a);
            const y = cy + R * Math.sin(a);
            return (
              <g key={t}>
                <rect x={x - 85} y={y - 28} width={170} height={56} rx={14} fill={C.panel} stroke={CYCLE_COLORS[i]} strokeWidth={3} />
                <text x={x} y={y + 8} fill={C.text} fontSize={23} fontWeight={700} textAnchor="middle" fontFamily={FONT}>
                  {t}
                </text>
              </g>
            );
          })}
          <text x={cx} y={cy + 10} fill={C.yellow} fontSize={30} fontWeight={800} textAnchor="middle" fontFamily={MONO}>
            tur {step}
          </text>
        </svg>
        <Panel style={{padding: 10}}>
          <svg width={CWW} height={CHH}>
            <line x1={60} y1={py(0)} x2={CWW - 30} y2={py(0)} stroke={C.faint} strokeWidth={2} />
            <line x1={60} y1={py(2.6)} x2={60} y2={py(0)} stroke={C.faint} strokeWidth={2} />
            <text x={70} y={py(2.6) + 4} fill={C.dim} fontSize={20} fontFamily={FONT}>
              loss
            </text>
            <text x={CWW - 30} y={py(0) + 32} fill={C.dim} fontSize={20} textAnchor="end" fontFamily={FONT}>
              tur →
            </text>
            <path d={path} fill="none" stroke={C.red} strokeWidth={4} />
            <text x={CWW - 40} y={py(2.6) + 20} fill={C.red} fontSize={26} fontWeight={700} textAnchor="end" fontFamily={MONO}>
              loss = {DATA.curve[step].toFixed(3)}
            </text>
          </svg>
        </Panel>
      </div>
      <Caption at={250} color={C.v}>
        {DATA.steps} turda loss {DATA.curve[0].toFixed(2)} → {DATA.curve[DATA.steps].toFixed(2)}. Sıradaki bölüm bu döngünün bir turunu her sayısıyla gösteriyor.
      </Caption>
    </>
  );
};

export const TrainingLogic: React.FC = () => (
  <Scene no={15} title="Eğitimin Mantığı" subtitle="tahmin → hata → eğim → küçük adım → tekrar">
    <Beat from={0} dur={300} terms={['param']}>
      <BeatKnobs />
    </Beat>
    <Beat from={300} dur={300} terms={['probdist', 'logit']}>
      <BeatPredict />
    </Beat>
    <Beat from={600} dur={330} terms={['loss', 'crossentropy']}>
      <BeatLoss />
    </Beat>
    <Beat from={930} dur={420} terms={['gradient']}>
      <BeatSlope />
    </Beat>
    <Beat from={1350} dur={420} terms={['lr', 'gradient']}>
      <BeatSteps />
    </Beat>
    <Beat from={1770} dur={360} terms={['backprop', 'chain']}>
      <BeatBackprop />
    </Beat>
    <Beat from={2130} dur={390} terms={['optimizer', 'epoch']}>
      <BeatRepeat />
    </Beat>
  </Scene>
);

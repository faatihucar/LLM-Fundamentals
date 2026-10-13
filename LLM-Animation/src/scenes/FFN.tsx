import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Appear, ArcSentence, Beat, Caption, Chip, Lead, Panel, Scene, clamp, hexA, useProgress} from '../components';
import {C, FONT, MONO} from '../theme';
import raw from '../data/training.json';

type Data = {step0: {N1: number[][]; Pre: number[][]; Hid: number[][]; Fo: number[][]}; windows: {x: string[]}[]};
const DATA = raw as unknown as Data;
const ROW = 2; // "metni"
const fmt = (v: number, d = 2) => (v < 0 ? '−' : '') + Math.abs(v).toFixed(d);
const gelu = (x: number) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));

export const FFN_DUR = 2160;

// ---------------------------------------------------------------------------------------------
// 1 · what a Linear layer computes
// ---------------------------------------------------------------------------------------------
const XS = [1.0, 0.5, -1.0, 2.0];
const WS = [0.2, -0.4, 0.1, 0.3];
const B = 0.1;
const Y = XS.reduce((s, x, i) => s + x * WS[i], B);

const BeatLinear: React.FC = () => {
  const lines = useProgress(30, 70);
  const W = 900;
  const H = 440;
  const inY = (i: number) => 60 + i * 100;
  return (
    <>
      <Lead>Önce temel parça: Linear katman (bir "nöron")</Lead>
      <div style={{display: 'flex', gap: 50, alignItems: 'center', justifyContent: 'center'}}>
        <svg width={W} height={H}>
          {XS.map((x, i) => (
            <g key={i}>
              <line x1={170} y1={inY(i)} x2={170 + (640 - 170) * lines} y2={inY(i) + (210 - inY(i)) * lines} stroke={C.q} strokeWidth={3} />
              <circle cx={130} cy={inY(i)} r={36} fill={hexA(C.q, 0.2)} stroke={C.q} strokeWidth={3} />
              <text x={130} y={inY(i) + 8} fill={C.text} fontSize={24} fontWeight={700} textAnchor="middle" fontFamily={MONO}>
                {x}
              </text>
              <text x={40} y={inY(i) + 8} fill={C.dim} fontSize={22} textAnchor="middle" fontFamily={MONO}>
                x{i + 1}
              </text>
              <text
                x={170 + (640 - 170) * 0.45}
                y={inY(i) + (210 - inY(i)) * 0.45 - 10}
                fill={C.yellow}
                fontSize={22}
                fontWeight={700}
                textAnchor="middle"
                opacity={lines}
                fontFamily={MONO}
              >
                w{i + 1}={WS[i]}
              </text>
            </g>
          ))}
          <circle cx={690} cy={210} r={52} fill={hexA(C.v, 0.2)} stroke={C.v} strokeWidth={3} opacity={lines} />
          <text x={690} y={218} fill={C.text} fontSize={26} fontWeight={800} textAnchor="middle" opacity={lines} fontFamily={MONO}>
            {Y.toFixed(1)}
          </text>
          <text x={690} y={300} fill={C.dim} fontSize={20} textAnchor="middle" opacity={lines} fontFamily={FONT}>
            + bias {B}
          </text>
        </svg>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, width: 620}}>
          <Appear at={80}>
            <Panel accent={C.v} side="left" style={{fontFamily: MONO, fontSize: 22, lineHeight: 1.6}}>
              y = x1·w1 + x2·w2 + x3·w3 + x4·w4 + bias
              <br />= 1.0·0.2 + 0.5·(−0.4) + (−1.0)·0.1 + 2.0·0.3 + 0.1
              <br />= <b style={{color: C.v}}>{Y.toFixed(1)}</b>
            </Panel>
          </Appear>
          <Appear at={150}>
            <Panel accent={C.yellow} side="left" style={{fontSize: 22, lineHeight: 1.5}}>
              Ağırlıklar (w) ve bias öğrenilen düğmelerdir. 16 çıktı istiyorsak bunu 16 farklı ağırlık setiyle yaparız → 4 × 16'lık bir matris.
            </Panel>
          </Appear>
        </div>
      </div>
      <Caption at={210}>Linear = ağırlıklı toplam + bias, yani matris çarpımı. Wq, Wk, Wv, Wo ve son katman (lm_head) da birer Linear.</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 2 · activation (GELU)
// ---------------------------------------------------------------------------------------------
const PW = 820;
const PH = 460;
const gx = (x: number) => 60 + ((x + 3) / 6) * (PW - 90);
const gy = (y: number) => 30 + (1 - (y + 1) / 4) * (PH - 70);
const curve = (fn: (x: number) => number) =>
  Array.from({length: 121}, (_, i) => {
    const x = -3 + i * 0.05;
    return `${i ? 'L' : 'M'} ${gx(x).toFixed(1)} ${gy(fn(x)).toFixed(1)}`;
  }).join(' ');

const BeatActivation: React.FC = () => {
  const draw = useProgress(20, 70);
  const relu = useProgress(110, 140);
  return (
    <>
      <Lead>Aktivasyon fonksiyonu (GELU): ağa "kıvrım" katan parça</Lead>
      <div style={{display: 'flex', gap: 50, alignItems: 'center', justifyContent: 'center'}}>
        <Panel style={{padding: 10}}>
          <svg width={PW} height={PH}>
            <line x1={gx(-3)} y1={gy(0)} x2={gx(3)} y2={gy(0)} stroke={C.faint} strokeWidth={2} />
            <line x1={gx(0)} y1={gy(-1)} x2={gx(0)} y2={gy(3)} stroke={C.faint} strokeWidth={2} />
            <path d={curve((x) => x)} fill="none" stroke={C.dim} strokeWidth={2} strokeDasharray="8 8" />
            <text x={gx(1.3)} y={gy(2.75)} fill={C.dim} fontSize={20} textAnchor="end" fontFamily={FONT}>
              y = x (düz)
            </text>
            <path d={curve((x) => Math.max(0, x))} fill="none" stroke={C.k} strokeWidth={3} opacity={relu} />
            <text x={gx(-2.9)} y={gy(0.25)} fill={C.k} fontSize={20} opacity={relu} fontFamily={FONT}>
              ReLU
            </text>
            <path d={curve(gelu)} fill="none" stroke={C.v} strokeWidth={5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            <text x={gx(1.2)} y={gy(0.6)} fill={C.v} fontSize={24} fontWeight={700} opacity={draw} fontFamily={FONT}>
              GELU
            </text>
            {([
              [-1, -12, 34, 'end'],
              [0, 14, 34, 'start'],
              [2, -14, 6, 'end'],
            ] as [number, number, number, 'start' | 'end'][]).map(([x, dx, dy, anchor]) => (
              <g key={x} opacity={draw >= 1 ? 1 : 0}>
                <circle cx={gx(x)} cy={gy(gelu(x))} r={8} fill={C.yellow} />
                <text x={gx(x) + dx} y={gy(gelu(x)) + dy} fill={C.yellow} fontSize={20} textAnchor={anchor} fontFamily={MONO}>
                  GELU({x}) = {Math.abs(gelu(x)) < 0.005 ? '0.00' : fmt(gelu(x))}
                </text>
              </g>
            ))}
          </svg>
        </Panel>
        <div style={{display: 'flex', flexDirection: 'column', gap: 16, width: 620}}>
          <Appear at={60}>
            <Panel accent={C.red} side="left" style={{fontSize: 22, lineHeight: 1.5}}>
              Sadece Linear'ları arka arkaya koymak yine tek bir Linear'a eşittir → model sadece "düz" ilişkiler kurabilirdi.
            </Panel>
          </Appear>
          <Appear at={120}>
            <Panel accent={C.v} side="left" style={{fontSize: 22, lineHeight: 1.5}}>
              Araya kıvrımlı bir fonksiyon koyunca karmaşık ilişkileri öğrenebilir. GELU negatifleri büyük ölçüde söndürür, pozitifleri
              geçirir (ReLU'nun yumuşak hali).
            </Panel>
          </Appear>
        </div>
      </div>
      <Caption at={200}>Aktivasyon = Linear'ların arasına giren, düz olmayan (non-linear) fonksiyon. GPT'ler GELU kullanır.</Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 3 · FFN on one token with real numbers
// ---------------------------------------------------------------------------------------------
const Cells: React.FC<{vals: number[]; color: string}> = ({vals, color}) => (
  <div style={{display: 'flex', flexDirection: 'column', gap: 4}}>
    {vals.map((v, i) => (
      <div
        key={i}
        style={{
          width: 96,
          height: 50,
          borderRadius: 8,
          background: hexA(color, Math.min(0.85, 0.15 + Math.abs(v) * 0.35)),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontSize: 20,
        }}
      >
        {fmt(v)}
      </div>
    ))}
  </div>
);

const Bars16: React.FC<{vals: number[]; color: string; at: number}> = ({vals, color, at}) => {
  const p = useProgress(at, at + 30);
  return (
    <svg width={290} height={360}>
      <line x1={0} y1={180} x2={290} y2={180} stroke={C.faint} strokeWidth={2} />
      {vals.map((v, i) => {
        const h = Math.max(-170, Math.min(170, v * 170 * p));
        return <rect key={i} x={4 + i * 18} y={h >= 0 ? 180 - h : 180} width={13} height={Math.abs(h)} rx={2} fill={v >= 0 ? color : C.k} />;
      })}
    </svg>
  );
};

const Step: React.FC<{label: string; at: number}> = ({label, at}) => (
  <Appear at={at} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 6px'}}>
    <div style={{fontSize: 19, color: C.yellow, fontFamily: MONO, whiteSpace: 'nowrap'}}>{label}</div>
    <div style={{fontSize: 40, color: C.dim}}>→</div>
  </Appear>
);

const Col: React.FC<{title: string; sub: string; at: number; children: React.ReactNode}> = ({title, sub, at, children}) => (
  <Appear at={at} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
    <div style={{fontSize: 22, fontWeight: 700, marginBottom: 6}}>{title}</div>
    {children}
    <div style={{fontSize: 18, color: C.dim, marginTop: 6}}>{sub}</div>
  </Appear>
);

const BeatFFN: React.FC = () => (
  <>
    <Lead>FFN = Linear (genişlet) → GELU → Linear (daralt) · "metni" token'ı için gerçek sayılar</Lead>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Col title="girdi" sub="4 sayı" at={10}>
        <Cells vals={DATA.step0.N1[ROW]} color={C.q} />
      </Col>
      <Step label="Linear 4→16" at={50} />
      <Col title="16 sayı" sub="GELU'dan önce" at={60}>
        <Bars16 vals={DATA.step0.Pre[ROW]} color={C.q} at={65} />
      </Col>
      <Step label="GELU" at={130} />
      <Col title="16 sayı" sub="GELU'dan sonra" at={140}>
        <Bars16 vals={DATA.step0.Hid[ROW]} color={C.v} at={145} />
      </Col>
      <Step label="Linear 16→4" at={210} />
      <Col title="çıktı" sub="4 sayı" at={220}>
        <Cells vals={DATA.step0.Fo[ROW]} color={C.v} />
      </Col>
    </div>
    <Appear at={180} style={{textAlign: 'center', fontSize: 22, color: C.dim, marginTop: 14}}>
      turuncu çubuklar = negatif değerler: GELU'dan sonra sıfıra yaklaştılar
    </Appear>
    <Caption at={260}>Belgedeki gibi: önce 4 kat genişler (768 → 3072), kıvrım, sonra eski boyutuna döner (3072 → 768).</Caption>
  </>
);

// ---------------------------------------------------------------------------------------------
// 4 · attention vs FFN
// ---------------------------------------------------------------------------------------------
const TOKS = ['Yapay', 'zeka', 'metni', 'okur'];
const BeatVersus: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <>
      <Lead>Attention ile FFN arasındaki fark</Lead>
      <div style={{display: 'flex', gap: 34}}>
        <Appear at={10} style={{flex: 1}}>
          <Panel accent={C.yellow} style={{height: 450}}>
            <div style={{fontSize: 30, fontWeight: 700}}>Attention = iletişim</div>
            <div style={{fontSize: 22, color: C.dim, marginTop: 6}}>Token'lar birbirine bakar, bilgi alışverişi yapar</div>
            <div style={{position: 'relative', width: 760, height: 220, marginTop: 20}}>
              <ArcSentence
                tokens={TOKS}
                from={3}
                width={760}
                top={140}
                fontSize={28}
                fromAt={20}
                fromColor={C.yellow}
                arcs={[
                  {to: 0, weight: 0.2, at: 30, color: C.yellow},
                  {to: 1, weight: 0.3, at: 40, color: C.yellow},
                  {to: 2, weight: 0.5, at: 50, color: C.yellow},
                ]}
              />
            </div>
          </Panel>
        </Appear>
        <Appear at={90} style={{flex: 1}}>
          <Panel accent={C.v} style={{height: 450}}>
            <div style={{fontSize: 30, fontWeight: 700}}>FFN = tek başına düşünme</div>
            <div style={{fontSize: 22, color: C.dim, marginTop: 6}}>Her token ayrı ayrı, aynı ağırlıklarla işlenir</div>
            <div style={{display: 'flex', gap: 18, marginTop: 40, justifyContent: 'center'}}>
              {TOKS.map((t, i) => {
                const lit = interpolate(f, [110 + i * 15, 125 + i * 15], [0, 1], clamp);
                return (
                  <div key={t} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                    <Chip size={24} color={C.q}>
                      {t}
                    </Chip>
                    <div style={{fontSize: 28, color: C.dim}}>↓</div>
                    <div
                      style={{
                        width: 130,
                        height: 70,
                        borderRadius: 12,
                        border: `2px solid ${C.v}`,
                        background: hexA(C.v, 0.1 + 0.3 * lit),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                      }}
                    >
                      FFN
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </Appear>
      </div>
      <Caption at={190}>
        GPT-2'de bir bloğun parametrelerinin yaklaşık 2/3'ü FFN'de; modelin öğrendiği bilgilerin çoğunun burada saklandığı düşünülür.
      </Caption>
    </>
  );
};

// ---------------------------------------------------------------------------------------------
// 5 · the gated MLP used in usta_mlp.py
// ---------------------------------------------------------------------------------------------
const Box: React.FC<{children: React.ReactNode; color: string; at: number; w?: number}> = ({children, color, at, w = 220}) => (
  <Appear at={at}>
    <div
      style={{
        width: w,
        height: 70,
        borderRadius: 14,
        border: `3px solid ${color}`,
        background: hexA(color, 0.14),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 22,
        fontWeight: 700,
        fontFamily: MONO,
      }}
    >
      {children}
    </div>
  </Appear>
);

const BeatGated: React.FC = () => (
  <>
    <Lead>Senin koddaki UstaMLP: "gated" FFN — gate_proj ve up_proj ikisi de Linear (4 → 16) ve AYNI x'i alır</Lead>
    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24}}>
      <Box color={C.q} at={10} w={120}>
        x
      </Box>
      <div style={{display: 'flex', flexDirection: 'column', gap: 40}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <Box color={C.yellow} at={30}>
            gate_proj 4→16
          </Box>
          <Box color={C.v} at={60} w={120}>
            GELU
          </Box>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
          <Box color={C.pos} at={45} w={356}>
            up_proj 4→16
          </Box>
        </div>
      </div>
      <Box color={C.k} at={90} w={90}>
        ×
      </Box>
      <Box color={C.teal} at={110}>
        down_proj 16→4
      </Box>
    </div>
    <div style={{display: 'flex', gap: 30, justifyContent: 'center', marginTop: 40}}>
      <Appear at={140}>
        <Panel accent={C.yellow} side="left" style={{width: 520, fontSize: 22, lineHeight: 1.5}}>
          <b>gate_proj</b> = kapı: "bu 16 bilginin hangisi ne kadar geçsin?" GELU'dan sonra 0'a yakın çıkan sayı = o kapı kapalı.
        </Panel>
      </Appear>
      <Appear at={160}>
        <Panel accent={C.pos} side="left" style={{width: 520, fontSize: 22, lineHeight: 1.5}}>
          <b>up_proj</b> = içerik: bu token hakkındaki 16 bilgi. İkisi sayı sayı çarpılır, <b>down_proj</b> 16 → 4'e indirir.
        </Panel>
      </Appear>
    </div>
    <Appear at={190} style={{display: 'flex', justifyContent: 'center', marginTop: 24}}>
      <Panel style={{fontFamily: MONO, fontSize: 21, lineHeight: 1.6, padding: '14px 28px'}}>
        gate = gelu(gate_proj(x)) · up = up_proj(x) · out = down_proj(gate * up)
      </Panel>
    </Appear>
    <Caption at={220}>Fikir aynı: genişlet → kıvrım → daralt. Sadece bilginin ne kadarının geçeceğini ayrı bir "kapı" belirliyor.</Caption>
  </>
);

const UP = [2.0, 1.5, -1.0];
const GATE = [0.9, 0.0, 1.2];

const BeatGateExample: React.FC = () => (
  <>
    <Lead>Kapı nasıl çalışır? 16 yerine 3 sayıyla küçük bir örnek</Lead>
    <div style={{display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center'}}>
      {(
        [
          ['up_proj (bilgi)', UP, C.pos, 20],
          ['gate_proj → GELU (kapı)', GATE, C.yellow, 60],
          ['gate × up (süzülmüş)', UP.map((u, i) => u * GATE[i]), C.v, 110],
        ] as [string, number[], string, number][]
      ).map(([label, vals, color, at]) => (
        <Appear key={label} at={at} style={{display: 'flex', alignItems: 'center', gap: 20}}>
          <div style={{width: 340, textAlign: 'right', fontSize: 26, fontWeight: 700, color}}>{label}</div>
          {vals.map((v, i) => (
            <div
              key={i}
              style={{
                width: 120,
                height: 60,
                borderRadius: 10,
                border: `2px solid ${color}`,
                background: hexA(color, 0.14),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: MONO,
                fontSize: 26,
                opacity: at === 110 && i === 1 ? 0.45 : 1,
              }}
            >
              {fmt(v, 1)}
            </div>
          ))}
          {at === 110 && <div style={{fontSize: 22, color: C.dim, width: 330}}>← 2. bilginin kapısı kapalıydı (0.0), geçmedi</div>}
          {at !== 110 && <div style={{width: 330}} />}
        </Appear>
      ))}
    </div>
    <div style={{display: 'flex', gap: 28, justifyContent: 'center', marginTop: 30}}>
      <Appear at={150}>
        <Panel accent={C.teal} side="left" style={{width: 520, fontSize: 21, lineHeight: 1.5}}>
          <b>Benzetme:</b> up_proj 16 borudaki su, gate_proj her borunun vanası. Vanası kısık borudan su geçmez. (GELU'dan sonra kapı 1'den
          büyük ya da biraz negatif de olabilir.)
        </Panel>
      </Appear>
      <Appear at={185}>
        <Panel accent={C.accent} side="left" style={{width: 520, fontSize: 21, lineHeight: 1.5}}>
          <b>Düz FFN</b> (GPT-2, belgedeki şema): genişlet → GELU → daralt. <b>Gated FFN</b> (Gemma, LLaMA): kıvrımı ayrı bir kapı verir.
        </Panel>
      </Appear>
      <Appear at={220}>
        <Panel accent={C.v} side="left" style={{width: 520, fontSize: 21, lineHeight: 1.5}}>
          <b>Neden?</b> Deneylerde kapılı FFN daha iyi öğreniyor; adı <b>GeGLU / SwiGLU</b>. Güncel modellerin çoğu bunu kullanır.
        </Panel>
      </Appear>
    </div>
    <Caption at={260}>gate × up: her bilgi kendi kapısıyla çarpılır; sonra down_proj 16 sayıyı tekrar 4'e indirir.</Caption>
  </>
);

export const FFN: React.FC = () => (
  <Scene no={13} title="Feed-Forward (FFN / MLP)" subtitle="decoder bloğunun ikinci yarısı">
    <Beat from={0} dur={330} terms={['linear', 'bias']}>
      <BeatLinear />
    </Beat>
    <Beat from={330} dur={360} terms={['gelu', 'relu']}>
      <BeatActivation />
    </Beat>
    <Beat from={690} dur={420} terms={['ffn', 'activation']}>
      <BeatFFN />
    </Beat>
    <Beat from={1110} dur={360} terms={['selfattn', 'ffn']}>
      <BeatVersus />
    </Beat>
    <Beat from={1470} dur={360} terms={['gate', 'up']}>
      <BeatGated />
    </Beat>
    <Beat from={1830} dur={330} terms={['down', 'gelu']}>
      <BeatGateExample />
    </Beat>
  </Scene>
);

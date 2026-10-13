import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Appear, Beat, Caption, Lead, Panel, Scene, Typewriter, clamp, hexA} from '../components';
import {C, MONO} from '../theme';

export const CONTEXT_DUR = 900;

const N = 24;
const WIN = 8;
const CELL = 58;
const GAP = 8;

const SlidingWindow: React.FC = () => {
  const f = useCurrentFrame();
  const start = interpolate(f, [60, 300], [0, N - WIN], clamp);
  const at = Math.round(start);
  const total = N * CELL + (N - 1) * GAP;
  return (
    <div style={{position: 'relative', width: total, height: 150, margin: '0 auto'}}>
      {Array.from({length: N}).map((_, i) => {
        const inside = i >= at && i < at + WIN;
        const past = i < at;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: i * (CELL + GAP),
              top: 44,
              width: CELL,
              height: CELL,
              borderRadius: 10,
              background: inside ? hexA(C.accent, 0.35) : C.panel,
              border: `2px solid ${inside ? C.accent : C.panelBorder}`,
              opacity: past ? 0.28 : inside ? 1 : 0.6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontSize: 19,
              color: inside ? C.text : C.dim,
            }}
          >
            t{i + 1}
          </div>
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: start * (CELL + GAP) - 8,
          top: 34,
          width: WIN * (CELL + GAP) - GAP + 16,
          height: CELL + 20,
          border: `3px solid ${C.yellow}`,
          borderRadius: 14,
        }}
      />
      <div style={{position: 'absolute', left: start * (CELL + GAP), top: 0, fontSize: 22, color: C.yellow, whiteSpace: 'nowrap'}}>
        context window = 8 token
      </div>
      <div style={{position: 'absolute', left: 0, top: 126, fontSize: 20, color: C.dim, opacity: interpolate(f, [120, 150], [0, 1], clamp)}}>
        ← pencere dışı: görülmez
      </div>
    </div>
  );
};

const BeatWindow: React.FC = () => (
  <>
    <Lead>Context Length = modelin tek seferde görebildiği en uzun token dizisi</Lead>
    <Appear at={20}>
      <SlidingWindow />
    </Appear>
    <Appear at={190} style={{marginTop: 50, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
      <div style={{fontSize: 26, color: C.dim, marginBottom: 14}}>Pencereye hepsi birlikte sığmak zorunda:</div>
      <div style={{display: 'flex', width: 1300, height: 74, borderRadius: 14, overflow: 'hidden', fontSize: 26, fontWeight: 600}}>
        {[
          ['Sistem talimatları', C.pos, 2],
          ['Kullanıcı girdisi (mesajlar, dosyalar)', C.q, 3.4],
          ['Modelin cevabı', C.v, 2.6],
        ].map(([label, color, flex]) => (
          <div
            key={label as string}
            style={{
              flex: flex as number,
              background: hexA(color as string, 0.5),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {label as string}
          </div>
        ))}
      </div>
    </Appear>
    <Caption at={300}>Pencerenin dışındaki token'ları self-attention hiç görmez · Örn: 8k, 32k, 128k token</Caption>
  </>
);

const BeatModels: React.FC = () => (
  <>
    <Lead>Aynı modelin iki sürümü: -pt ve -it</Lead>
    <Appear at={10} style={{display: 'flex', justifyContent: 'center'}}>
      <div style={{background: C.panel2, border: `2px solid ${C.accent}`, borderRadius: 40, padding: '16px 40px', fontSize: 36}}>
        Soru: "Türkiye'nin başkenti neresidir?"
      </div>
    </Appear>
    <div style={{display: 'flex', gap: 40, marginTop: 36}}>
      <Appear at={45} style={{flex: 1}}>
        <Panel accent={C.k} style={{height: 430}}>
          <div style={{fontFamily: MONO, fontSize: 34, color: C.k}}>gemma-3-27b-pt</div>
          <div style={{fontSize: 24, color: C.dim, marginBottom: 20}}>Pre-trained · ham model</div>
          <div style={{fontSize: 30, fontStyle: 'italic', minHeight: 130, lineHeight: 1.4}}>
            <Typewriter text="Türkiye'nin en kalabalık şehirleri nelerdir? Türkiye'nin en uzun nehri hangisidir? …" at={75} cps={28} />
          </div>
          <div style={{fontSize: 26, color: C.dim, marginTop: 20, lineHeight: 1.4}}>
            Sadece next-token prediction → cevap vermez, metni <b style={{color: C.text}}>devam ettirir</b>. Özelleştirmek için ham
            madde.
          </div>
        </Panel>
      </Appear>
      <Appear at={110} style={{flex: 1}}>
        <Panel accent={C.v} style={{height: 430}}>
          <div style={{fontFamily: MONO, fontSize: 34, color: C.v}}>gemma-3-27b-it</div>
          <div style={{fontSize: 24, color: C.dim, marginBottom: 20}}>Instruction-tuned · talimat eğitimli</div>
          <div style={{fontSize: 30, minHeight: 130, lineHeight: 1.4}}>
            <Typewriter text="Türkiye'nin başkenti Ankara'dır." at={200} cps={22} />
          </div>
          <div style={{fontSize: 26, color: C.dim, marginTop: 20, lineHeight: 1.4}}>
            PT'nin üzerine <b style={{color: C.text}}>SFT + RLHF</b> → talimatı anlar, asistan gibi doğrudan cevap verir.
          </div>
        </Panel>
      </Appear>
    </div>
  </>
);

export const ContextLength: React.FC = () => (
  <Scene no={2} title="Context Length" subtitle="bağlam penceresi">
    <Beat from={0} dur={450} terms={['context', 'selfattn']}>
      <BeatWindow />
    </Beat>
    <Beat from={450} dur={450} terms={['pt', 'it', 'sft']}>
      <BeatModels />
    </Beat>
  </Scene>
);

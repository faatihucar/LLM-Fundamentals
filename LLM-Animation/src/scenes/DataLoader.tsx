import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {Appear, ArrowR, Beat, Caption, Chip, Lead, Panel, Scene, clamp, hexA} from '../components';
import {C, MONO} from '../theme';

export const DATALOADER_DUR = 1950;

const SEQ = ['Yapay', 'zeka', 'dünyayı', 'hızla', 'değiştiriyor', 've', 'gelişiyor'];
const CHIP_W = 170;

const PairRow: React.FC<{i: number; at: number}> = ({i, at}) => (
  <Appear at={at} style={{display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center'}}>
    <div style={{width: 110, fontSize: 22, color: C.dim, textAlign: 'right'}}>Örnek {i + 1}</div>
    <div style={{display: 'flex', gap: 6}}>
      {SEQ.slice(i, i + 4).map((t, j) => (
        <Chip key={j} size={22} color={C.q} width={CHIP_W}>
          {t}
        </Chip>
      ))}
    </div>
    <ArrowR w={56} />
    <div style={{display: 'flex', gap: 6}}>
      {SEQ.slice(i + 1, i + 5).map((t, j) => (
        <Chip key={j} size={22} color={C.k} width={CHIP_W}>
          {t}
        </Chip>
      ))}
    </div>
  </Appear>
);

const TASKS: [string, string][] = [
  ['Yapay', 'zeka'],
  ['Yapay zeka', 'dünyayı'],
  ['Yapay zeka dünyayı', 'hızla'],
  ['Yapay zeka dünyayı hızla', 'değiştiriyor'],
];

const BeatPairs: React.FC = () => (
  <>
    <Lead>Veri, birer token kaydırılarak girdi → hedef çiftlerine bölünür</Lead>
    <Appear at={10} style={{display: 'flex', justifyContent: 'center', gap: 12, fontSize: 24, marginBottom: 10}}>
      <div style={{width: 110}} />
      <div style={{width: CHIP_W * 4 + 18, textAlign: 'center', color: C.q}}>Girdi (x)</div>
      <div style={{width: 80}} />
      <div style={{width: CHIP_W * 4 + 18, textAlign: 'center', color: C.k}}>Hedef (y) = bir sağa kaymış</div>
    </Appear>
    <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
      {[0, 1, 2].map((i) => (
        <PairRow key={i} i={i} at={30 + i * 45} />
      ))}
    </div>
    <Appear at={200}>
      <Panel accent={C.yellow} side="left" style={{width: 1000, margin: '30px auto 0', padding: '20px 30px'}}>
        <div style={{fontSize: 26, color: C.dim, marginBottom: 8}}>Tek örnekten 4 tahmin görevi çıkar:</div>
        {TASKS.map(([ctx, target], k) => (
          <Appear key={k} at={215 + k * 18}>
            <div style={{fontFamily: MONO, fontSize: 26, lineHeight: 1.6}}>
              {ctx} → <span style={{color: C.k}}>{target}</span>
            </div>
          </Appear>
        ))}
      </Panel>
    </Appear>
    <Caption at={320}>Context length = 4 → her örnek 4 token. Model her pozisyonda bir sonraki token'ı tahmin etmeyi öğrenir.</Caption>
  </>
);

const Batch: React.FC = () => (
  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
    <div style={{border: `2px dashed ${C.yellow}`, borderRadius: 12, padding: 10, display: 'flex', flexDirection: 'column', gap: 6}}>
      {[C.q, C.k, C.v, C.pos].map((c, i) => (
        <div key={i} style={{width: 300, height: 24, borderRadius: 6, background: hexA(c, 0.55)}} />
      ))}
    </div>
    <ArrowR w={60} color={C.yellow} />
    <div style={{fontSize: 24}}>
      batch = 4 örnek
      <br />
      <span style={{color: C.dim}}>tek seferde modele</span>
    </div>
  </div>
);

const PERMS = [
  [0, 1, 2, 3],
  [2, 0, 3, 1],
  [3, 2, 1, 0],
  [1, 3, 0, 2],
];

const Shuffle: React.FC = () => {
  const f = useCurrentFrame();
  const k = Math.floor(f / 60);
  const cur = PERMS[k % 4];
  const prev = PERMS[(k + 3) % 4];
  const t = interpolate(f % 60, [0, 22], [0, 1], {...clamp, easing: Easing.inOut(Easing.ease)});
  return (
    <div style={{position: 'relative', height: 4 * 34, width: 400}}>
      {[C.q, C.k, C.v, C.pos].map((c, i) => {
        const y = (prev.indexOf(i) * (1 - t) + cur.indexOf(i) * t) * 34;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: y,
              left: 0,
              width: 400,
              height: 28,
              borderRadius: 6,
              background: hexA(c, 0.55),
              fontSize: 18,
              paddingLeft: 12,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            örnek {i + 1}
          </div>
        );
      })}
    </div>
  );
};

const Parallel: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: 'relative', width: 600, height: 140}}>
      {[0, 1, 2].map((w) => (
        <div
          key={w}
          style={{
            position: 'absolute',
            left: 0,
            top: w * 48,
            width: 130,
            height: 38,
            borderRadius: 8,
            background: C.panel2,
            border: `1px solid ${C.panelBorder}`,
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          CPU işçi {w + 1}
        </div>
      ))}
      {[0, 1, 2].map((w) =>
        [0, 1].map((d) => {
          const x = 145 + ((f * 5 + d * 140 + w * 60) % 280);
          return (
            <div
              key={`${w}-${d}`}
              style={{position: 'absolute', left: x, top: w * 48 + 12, width: 14, height: 14, borderRadius: 7, background: C.v}}
            />
          );
        }),
      )}
      <div
        style={{
          position: 'absolute',
          left: 450,
          top: 10,
          width: 140,
          height: 118,
          borderRadius: 12,
          background: hexA(C.v, 0.18),
          border: `2px solid ${C.v}`,
          fontSize: 28,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        GPU
      </div>
    </div>
  );
};

const SYNONYMS = ['hızla', 'çabucak', 'süratle'];

const Augment: React.FC = () => {
  const f = useCurrentFrame();
  const variant = SYNONYMS[1 + (Math.floor(f / 60) % 2)];
  const row = (toks: string[], hi: number) => (
    <div style={{display: 'flex', gap: 6}}>
      {toks.map((t, i) => (
        <Chip key={i} size={20} color={i === hi ? C.v : C.q}>
          {t}
        </Chip>
      ))}
    </div>
  );
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
      <div style={{fontSize: 18, color: C.dim}}>orijinal</div>
      {row(['Kedi', 'ağaca', SYNONYMS[0], 'tırmandı'], -1)}
      <div style={{fontSize: 18, color: C.dim}}>yeni örnek (eş anlamlı kelime)</div>
      {row(['Kedi', 'ağaca', variant, 'tırmandı'], 2)}
    </div>
  );
};

const PAD_CELL = 178;
const SHORT = ['Merhaba', 'dünya', '.', '<pad>', '<pad>'];
const LONG = ['Yapay', 'zeka', 'dünyayı', 'hızla', 'değiştiriyor', 've', 'gelişiyor'];
const LIMIT = 5;

const PadRow: React.FC<{toks: string[]; at: number; padAt: number; cutAt: number}> = ({toks, at, padAt, cutAt}) => {
  const f = useCurrentFrame();
  return (
    <Appear at={at} style={{display: 'flex', gap: 8}}>
      {toks.map((t, i) => {
        const isPad = t === '<pad>';
        const cut = i >= LIMIT && f >= cutAt;
        return (
          <div
            key={i}
            style={{
              width: PAD_CELL - 8,
              height: 64,
              borderRadius: 10,
              fontSize: isPad ? 22 : 24,
              fontFamily: isPad ? MONO : undefined,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isPad ? hexA(f >= padAt ? C.yellow : C.dim, 0.25) : hexA(C.q, 0.3),
              border: `2px solid ${isPad && f >= padAt ? C.yellow : 'transparent'}`,
              opacity: cut ? 0.2 : 1,
              boxSizing: 'border-box',
            }}
          >
            {t}
          </div>
        );
      })}
    </Appear>
  );
};

const BeatPad: React.FC = () => {
  const f = useCurrentFrame();
  const frame = interpolate(f, [90, 110], [0, 1], clamp);
  return (
    <>
      <Lead>Her örnek, modelin context length sınırına göre ayarlanır (ör. 5 token)</Lead>
      <div style={{display: 'flex', gap: 40, justifyContent: 'center', marginTop: 30}}>
        <div style={{width: 260, display: 'flex', flexDirection: 'column', gap: 44, paddingTop: 16}}>
          <Appear at={15} style={{fontSize: 28, height: 64, display: 'flex', alignItems: 'center'}}>
            Kısa örnek → <b style={{color: C.yellow, marginLeft: 8}}>doldur</b>
          </Appear>
          <Appear at={60} style={{fontSize: 28, height: 64, display: 'flex', alignItems: 'center'}}>
            Uzun örnek → <b style={{color: C.red, marginLeft: 8}}>kırp</b>
          </Appear>
        </div>
        <div style={{position: 'relative', paddingTop: 16}}>
          <div
            style={{
              position: 'absolute',
              left: -10,
              top: 4,
              width: LIMIT * PAD_CELL + 12,
              height: 64 * 2 + 44 + 24,
              border: `3px dashed ${C.yellow}`,
              borderRadius: 16,
              opacity: frame,
            }}
          />
          <div style={{position: 'absolute', left: 0, top: -30, fontSize: 22, color: C.yellow, opacity: frame}}>context length = 5</div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 44}}>
            <PadRow toks={SHORT} at={15} padAt={130} cutAt={9999} />
            <PadRow toks={LONG} at={60} padAt={9999} cutAt={160} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: LIMIT * PAD_CELL + 20,
              top: 16 + 64 + 44 + 70,
              fontSize: 24,
              color: C.red,
              opacity: interpolate(f, [160, 175], [0, 1], clamp),
            }}
          >
            ✂ kırpıldı (truncation)
          </div>
        </div>
      </div>
      <Caption at={190}>
        Context length sınırı 512 token ise DataLoader her örneği bu sınıra göre kırpar veya eksikleri &lt;pad&gt; ile tamamlar.
      </Caption>
    </>
  );
};

const Card: React.FC<{title: string; desc: string; color: string; at: number; children?: React.ReactNode}> = ({
  title,
  desc,
  color,
  at,
  children,
}) => (
  <Appear at={at}>
    <Panel accent={color} style={{height: 310}}>
      <div style={{fontSize: 32, fontWeight: 700}}>{title}</div>
      <div style={{fontSize: 22, color: C.dim, marginTop: 4}}>{desc}</div>
      <div style={{marginTop: 22}}>{children}</div>
    </Panel>
  </Appear>
);

const BeatOps: React.FC = () => (
  <>
    <Lead>DataLoader: veriyi modele hazır batch'ler halinde, kesintisiz akıtır</Lead>
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
      <Card title="1 · Batching (gruplama)" desc="Örnekler gruplar halinde işlenir" color={C.yellow} at={15}>
        <Batch />
      </Card>
      <Card title="2 · Shuffling (karıştırma)" desc="Her epoch'ta sıra değişir, model sırayı ezberlemez" color={C.pos} at={60}>
        <Shuffle />
      </Card>
      <Card title="3 · Parallel loading" desc="CPU veriyi hazırlarken GPU hiç beklemez" color={C.v} at={105}>
        <Parallel />
      </Card>
      <Card title="4 · Data Augmentation" desc="Az veri varsa sentetik olarak çeşitlendir" color={C.red} at={150}>
        <Augment />
      </Card>
    </div>
  </>
);

// ---------------------------------------------------------------------------------------------
// What happens to the tokens that do not fit?
// ---------------------------------------------------------------------------------------------
const LONG_TEXT = ['Yapay', 'zeka', 'metni', 'okur', '.', 'Model', 'sonraki', 'kelimeyi', 'tahmin', 'eder', '.', 'Sonra', 'tekrar', 'dener'];

const Strip: React.FC<{cell: number; fontSize?: number; dim?: (i: number) => boolean; color?: (i: number) => string | undefined}> = ({
  cell,
  fontSize = 20,
  dim,
  color,
}) => (
  <div style={{display: 'flex', gap: 6}}>
    {LONG_TEXT.map((t, i) => {
      const c = color?.(i);
      return (
        <div
          key={i}
          style={{
            width: cell,
            height: 52,
            borderRadius: 10,
            fontSize,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: c ? hexA(c, 0.28) : C.panel,
            border: `2px solid ${c ?? C.panelBorder}`,
            opacity: dim?.(i) ? 0.25 : 1,
            boxSizing: 'border-box',
          }}
        >
          {t}
        </div>
      );
    })}
  </div>
);

const Bracket: React.FC<{from: number; len: number; cell: number; color: string; label: string; at: number; top: number; dashed?: boolean}> = ({
  from,
  len,
  cell,
  color,
  label,
  at,
  top,
  dashed,
}) => (
  <Appear at={at} y={10} style={{position: 'absolute', left: from * (cell + 6), top, width: len * (cell + 6) - 6}}>
    <div style={{height: 14, border: `3px ${dashed ? 'dashed' : 'solid'} ${color}`, borderTop: 'none', borderRadius: '0 0 10px 10px'}} />
    <div style={{textAlign: 'center', fontSize: 21, color, fontWeight: 700, marginTop: 6, whiteSpace: 'nowrap'}}>{label}</div>
  </Appear>
);

const CHUNK_CELL = 100;
const BeatChunks: React.FC = () => {
  const f = useCurrentFrame();
  const col = (i: number) => (f < 40 ? undefined : i < 6 ? C.q : f >= 100 && i < 12 ? C.k : f >= 160 && i >= 12 ? C.dim : undefined);
  return (
    <>
      <Lead>Kırpılan token'lar ne olur? Eğitimde uzun metin atılmaz, art arda pencerelere bölünür</Lead>
      <div style={{position: 'relative', width: LONG_TEXT.length * (CHUNK_CELL + 6), margin: '30px auto 0', height: 170}}>
        <Strip cell={CHUNK_CELL} color={col} />
        <Bracket from={0} len={6} cell={CHUNK_CELL} color={C.q} label="Örnek 1 (context length = 6)" at={40} top={60} />
        <Bracket from={6} len={6} cell={CHUNK_CELL} color={C.k} label="Örnek 2: kesilen yer buradan devam eder" at={100} top={60} />
        <Bracket from={12} len={2} cell={CHUNK_CELL} color={C.dim} label="kalan 2 token" at={160} top={60} dashed />
      </div>
      <div style={{display: 'flex', gap: 30, justifyContent: 'center', marginTop: 20}}>
        <Appear at={190}>
          <Panel accent={C.yellow} side="left" style={{width: 640, fontSize: 25}}>
            <b>Ya</b> pencere dolsun diye <code style={{fontSize: 23}}>&lt;pad&gt;</code> ile doldurulur…
          </Panel>
        </Appear>
        <Appear at={205}>
          <Panel accent={C.red} side="left" style={{width: 640, fontSize: 25}}>
            <b>Ya da</b> atılır. Senin <code style={{fontSize: 23}}>TextDataset</code>'in bunu yapıyor.
          </Panel>
        </Appear>
      </div>
      <Caption at={230}>Örnek 1'e sığmayan kısım Örnek 2'nin başı olur — metnin sadece en sondaki kırıntısı kaybolabilir.</Caption>
    </>
  );
};

const STRIDE_CELL = 92;
const BeatStride: React.FC = () => (
  <>
    <Lead>stride: bir sonraki pencere kaç token kayar?</Lead>
    <Appear at={10} style={{fontSize: 26, fontWeight: 700, marginLeft: 60, color: C.q}}>
      stride = 6 (context length kadar) → pencereler yan yana
    </Appear>
    <div style={{position: 'relative', width: LONG_TEXT.length * (STRIDE_CELL + 6), margin: '10px auto 0', height: 130}}>
      <Strip cell={STRIDE_CELL} fontSize={18} />
      <Bracket from={0} len={6} cell={STRIDE_CELL} color={C.q} label="Örnek 1" at={20} top={60} />
      <Bracket from={6} len={6} cell={STRIDE_CELL} color={C.q} label="Örnek 2" at={35} top={60} />
    </div>
    <Appear at={80} style={{fontSize: 26, fontWeight: 700, marginLeft: 60, marginTop: 10, color: C.k}}>
      stride = 3 → pencereler üst üste biner
    </Appear>
    <div style={{position: 'relative', width: LONG_TEXT.length * (STRIDE_CELL + 6), margin: '10px auto 0', height: 230}}>
      <Strip cell={STRIDE_CELL} fontSize={18} />
      <Bracket from={0} len={6} cell={STRIDE_CELL} color={C.k} label="Örnek 1" at={95} top={60} />
      <Bracket from={3} len={6} cell={STRIDE_CELL} color={C.yellow} label="Örnek 2" at={110} top={120} />
      <Bracket from={6} len={6} cell={STRIDE_CELL} color={C.pos} label="Örnek 3" at={125} top={180} />
    </div>
    <Caption at={160}>
      Üst üste binince pencere sınırında bağlam kopmaz ama örnek sayısı ve eğitim süresi artar. 02 notebook'unda context_length = 12, stride = 12.
    </Caption>
  </>
);

const ChatWindow: React.FC = () => {
  const f = useCurrentFrame();
  const shift = Math.min(8, Math.max(0, Math.floor((f - 60) / 20)));
  const cell = 48;
  const total = 6 + shift;
  return (
    <div style={{position: 'relative', height: 120, marginTop: 20}}>
      <div style={{display: 'flex', gap: 5}}>
        {Array.from({length: 14}).map((_, i) => {
          const visible = i < total;
          const inWin = i >= total - 6 && i < total;
          return (
            <div
              key={i}
              style={{
                width: cell,
                height: 46,
                borderRadius: 8,
                fontSize: 16,
                fontFamily: MONO,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: inWin ? hexA(C.accent, 0.3) : C.panel,
                border: `2px solid ${inWin ? C.accent : C.panelBorder}`,
                opacity: visible ? (inWin ? 1 : 0.25) : 0,
              }}
            >
              t{i + 1}
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: 'absolute',
          top: -8,
          left: (total - 6) * (cell + 5) - 6,
          width: 6 * (cell + 5) + 7,
          height: 62,
          border: `3px solid ${C.yellow}`,
          borderRadius: 12,
        }}
      />
      <div style={{fontSize: 19, color: C.dim, marginTop: 16, opacity: shift > 0 ? 1 : 0}}>← pencereden çıkanları model artık görmüyor</div>
    </div>
  );
};

const BeatOverflow: React.FC = () => (
  <>
    <Lead>Gerçekten kaybolduğu iki durum</Lead>
    <div style={{display: 'flex', gap: 34}}>
      <Appear at={15} style={{flex: 1}}>
        <Panel accent={C.red} style={{height: 470}}>
          <div style={{fontSize: 30, fontWeight: 700}}>1 · Bölünemeyen tek bir örnek sığmazsa</div>
          <div style={{fontSize: 23, color: C.dim, marginTop: 8}}>Ör. bir soru–cevap çifti tek örnek olarak kalmalı</div>
          <div style={{display: 'flex', marginTop: 40, height: 64, borderRadius: 12, overflow: 'hidden', fontSize: 22, fontWeight: 600}}>
            <div style={{flex: 6, background: hexA(C.q, 0.45), display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              context length'e sığan kısım
            </div>
            <div
              style={{
                flex: 3,
                background: `repeating-linear-gradient(45deg, ${hexA(C.red, 0.5)} 0 10px, ${hexA(C.red, 0.2)} 10px 20px)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✂ atılır
            </div>
          </div>
          <div style={{fontSize: 24, marginTop: 40, lineHeight: 1.45}}>
            Fazlası gerçekten silinir (truncation) → modelin o kısmı hiç görmemesi demek. Bu yüzden veri, context length'e sığacak şekilde hazırlanır.
          </div>
        </Panel>
      </Appear>
      <Appear at={80} style={{flex: 1}}>
        <Panel accent={C.accent} style={{height: 470}}>
          <div style={{fontSize: 30, fontWeight: 700}}>2 · Modeli kullanırken (sohbet)</div>
          <div style={{fontSize: 23, color: C.dim, marginTop: 8}}>Yeni token'lar geldikçe pencere sağa kayar</div>
          <ChatWindow />
          <div style={{fontSize: 24, marginTop: 20, lineHeight: 1.45}}>
            En eski token'lar pencereden düşer; uzun sohbetlerde modelin baştakileri "unutması" bundan. Çözümlerden biri RAG.
          </div>
        </Panel>
      </Appear>
    </div>
    <Caption at={230}>Eğitimde: sonraki örneğe kayar · Bölünemeyen örnekte ve sohbette: pencereye sığmayan kısım görülmez.</Caption>
  </>
);

export const DataLoader: React.FC = () => (
  <Scene no={3} title="DataLoader" subtitle="veriyi eğitime hazırlamak">
    <Beat from={0} dur={420} terms={['nexttoken', 'context']}>
      <BeatPairs />
    </Beat>
    <Beat from={420} dur={420} terms={['batch', 'epoch']}>
      <BeatOps />
    </Beat>
    <Beat from={840} dur={240} terms={['pad', 'trunc']}>
      <BeatPad />
    </Beat>
    <Beat from={1080} dur={300} terms={['trunc', 'pad']}>
      <BeatChunks />
    </Beat>
    <Beat from={1380} dur={270} terms={['stride', 'epoch']}>
      <BeatStride />
    </Beat>
    <Beat from={1650} dur={300} terms={['trunc', 'rag']}>
      <BeatOverflow />
    </Beat>
  </Scene>
);

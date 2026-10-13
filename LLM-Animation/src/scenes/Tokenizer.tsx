import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Appear, ArrowD, Beat, Caption, Chip, Lead, Panel, Scene, Typewriter, clamp} from '../components';
import {C} from '../theme';

export const TOKENIZER_DUR = 900;

const TOK = ['Kitap', 'lık', 'çok', 'güzel', '.'];
const IDS = ['18324', '1093', '4410', '9071', '13'];
const TC = [C.q, C.teal, C.v, C.pos, C.yellow];

const BeatSplit: React.FC = () => {
  const f = useCurrentFrame();
  const plain = interpolate(f, [70, 95], [1, 0], clamp);
  const chips = interpolate(f, [85, 110], [0, 1], clamp);
  const gap = interpolate(f, [85, 125], [0, 34], clamp);
  return (
    <>
      <Lead>Tokenize: metni, modelin işleyebileceği küçük parçalara (token) bölmek</Lead>
      <div style={{position: 'relative', height: 330, marginTop: 40}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 76,
            fontWeight: 600,
            opacity: plain,
          }}
        >
          Kitaplık çok güzel.
        </div>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, display: 'flex', justifyContent: 'center', gap, opacity: chips}}>
          {TOK.map((t, i) => (
            <div key={i} style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
              <Chip size={58} color={TC[i]} style={{height: 110}}>
                {t}
              </Chip>
              <Appear at={150 + i * 10}>
                <ArrowD h={60} color={TC[i]} />
              </Appear>
              <Appear at={160 + i * 10}>
                <Chip size={34} mono color={TC[i]} filled>
                  {IDS[i]}
                </Chip>
              </Appear>
            </div>
          ))}
        </div>
      </div>
      <Appear at={205} style={{textAlign: 'center', fontSize: 26, color: C.dim, marginTop: 6}}>
        token → Token ID (sözlükteki numarası)
      </Appear>
      <Caption at={230}>Vocab (sözlük): her token'ın bir ID'si var. Model kelimelerle değil, bu sayılarla çalışır.</Caption>
    </>
  );
};

const TYPES = [
  {name: 'Kelime düzeyi', toks: ['Kitaplık', 'çok', 'güzel', '.'], note: 'Sözlük devasa olur, yeni kelimeyi tanımaz', color: C.red},
  {name: 'Harf düzeyi', toks: ['K', 'i', 't', 'a', 'p', 'l', 'ı', 'k', '…'], note: 'Sözlük küçük ama diziler çok uzun', color: C.yellow},
  {name: 'Alt kelime (subword)', toks: ['Kitap', 'lık', 'çok', 'güzel', '.'], note: "✓ Modern LLM'ler: BPE, WordPiece", color: C.v},
];

const BeatTypes: React.FC = () => (
  <>
    <Lead>Tokenleştirmenin 3 türü</Lead>
    <div style={{display: 'flex', flexDirection: 'column', gap: 24, marginTop: 20}}>
      {TYPES.map((t, i) => (
        <Appear key={t.name} at={15 + i * 55}>
          <Panel accent={t.color} side="left" style={{display: 'flex', alignItems: 'center', gap: 30, padding: '24px 34px'}}>
            <div style={{width: 330, fontSize: 34, fontWeight: 700}}>{t.name}</div>
            <div style={{flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap'}}>
              {t.toks.map((x, j) => (
                <Chip key={j} size={30} color={t.color}>
                  {x}
                </Chip>
              ))}
            </div>
            <div style={{width: 470, fontSize: 26, color: C.dim}}>{t.note}</div>
          </Panel>
        </Appear>
      ))}
    </div>
    <Caption at={200} color={C.v}>
      Kitaplık = Kitap + lık → bilinen parçalardan yeni kelimeler kurulur, sözlük küçük kalır.
    </Caption>
  </>
);

const BeatDetok: React.FC = () => (
  <>
    <Lead>Detokenize: modelin ürettiği ID'leri tekrar okunabilir metne çevirmek</Lead>
    <div style={{display: 'flex', justifyContent: 'center', gap: 20, marginTop: 30}}>
      {IDS.map((id, i) => (
        <Appear key={i} at={15 + i * 8}>
          <Chip size={40} mono color={TC[i]} filled>
            {id}
          </Chip>
        </Appear>
      ))}
    </div>
    <Appear at={60} style={{display: 'flex', justifyContent: 'center', margin: '22px 0'}}>
      <ArrowD h={90} label="Lookup table (sözlük): ID → token" color={C.accent} />
    </Appear>
    <div style={{textAlign: 'center', fontSize: 80, fontWeight: 600, minHeight: 110}}>
      <Typewriter text="Kitaplık çok güzel." at={90} cps={14} />
    </div>
    <div style={{display: 'flex', justifyContent: 'center', gap: 30, marginTop: 36}}>
      <Appear at={160}>
        <Panel accent={C.yellow} side="left" style={{width: 640, fontSize: 28}}>
          Büyük/küçük harf duyarlı: <b>"Kitap" ≠ "kitap"</b>
        </Panel>
      </Appear>
      <Appear at={185}>
        <Panel accent={C.teal} side="left" style={{width: 640, fontSize: 28}}>
          Boşluk ve noktalama da token olabilir
        </Panel>
      </Appear>
    </div>
  </>
);

export const Tokenizer: React.FC = () => (
  <Scene no={1} title="Tokenizer" subtitle="metin → token → ID">
    <Beat from={0} dur={330} terms={['token', 'tokenid']}>
      <BeatSplit />
    </Beat>
    <Beat from={330} dur={300} terms={['vocab', 'bpe']}>
      <BeatTypes />
    </Beat>
    <Beat from={630} dur={270} terms={['detok', 'lookup']}>
      <BeatDetok />
    </Beat>
  </Scene>
);

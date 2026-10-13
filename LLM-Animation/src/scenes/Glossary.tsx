import React from 'react';
import {Appear, Beat, Lead, Panel, Scene} from '../components';
import {C, MONO} from '../theme';

type Term = [term: string, definition: string, example?: string];
type Page = {title: string; color: string; terms: Term[]};

const PAGES: Page[] = [
  {
    title: 'Metinden sayılara',
    color: C.q,
    terms: [
      ['Token', 'Modelin işlediği küçük metin parçası: kelime, kelime parçası ya da noktalama.', '"Kitaplık" → "Kitap" + "lık"'],
      ['Vocab (sözlük)', "Modelin tanıdığı bütün token'ların listesi; her birinin bir numarası (ID) var.", 'GPT-2: 50.257 token'],
      ['Tokenizer / BPE', "Metni token'lara bölen araç. BPE, sık yan yana gelen parçaları birleştirerek alt kelime sözlüğü kurar.", '"ki" + "tap" → "kitap"'],
      ['Context length', 'Modelin bir seferde görebildiği en fazla token sayısı (bağlam penceresi).', '8k, 32k, 128k token'],
    ],
  },
  {
    title: 'Vektör ve matris',
    color: C.teal,
    terms: [
      ['Vektör', 'Sıralı bir sayı listesi.', '[0.12, −0.53, 0.88, 0.40]'],
      ['Matris', 'Satır ve sütunlardan oluşan sayı tablosu.', 'X: 6 token × 4 sayı'],
      ['Embedding', "Token'ın anlamını taşıyan vektör; büyük bir tablonun bir satırı. Eğitimde öğrenilir.", '"kedi" → [0.95, 0.01, 0.20]'],
      ['d_model (boyut)', 'Her token vektöründeki sayı adedi.', 'bizde 4 · GPT-2\'de 768'],
    ],
  },
  {
    title: 'İşlemler',
    color: C.yellow,
    terms: [
      ['Nokta çarpımı', 'İki vektörün karşılıklı elemanlarını çarpıp toplamak; ne kadar benzer olduklarını ölçer.', '[1,2]·[3,4] = 1·3 + 2·4 = 11'],
      ['Matris çarpımı', 'Satır × sütun nokta çarpımlarından oluşan tablo. Linear katmanların yaptığı iş.', '(6×4) · (4×4) = 6×4'],
      ['Transpoz (ᵀ)', 'Bir matrisin satırlarıyla sütunlarının yer değiştirmesi.', 'K: 6×2 → Kᵀ: 2×6'],
      ['Softmax', 'Sayıları 0–1 arası olasılıklara çevirir; toplamları 1 olur.', '[2, 1, 0] → [0.67, 0.24, 0.09]'],
    ],
  },
  {
    title: 'Ağın parçaları',
    color: C.pos,
    terms: [
      ['Parametre / ağırlık', 'Modelin eğitimde öğrendiği sayılar ("düğmeler").', 'bizim modelde 332 · GPT-3\'te 175 milyar'],
      ['Linear katman', 'Girdiyi ağırlıklarla çarpıp toplamak (+ bias): y = x·W + b.', 'Wq, Wk, Wv, Wo, lm_head'],
      ['Bias', 'Ağırlıklı toplama eklenen, öğrenilen sabit sayı; çıktıyı kaydırır.', 'y = 0.5 + 0.1 (bias)'],
      ['Aktivasyon (GELU, ReLU)', 'Linear katmanlar arasına giren kıvrımlı fonksiyon; ağın karmaşık ilişkiler öğrenmesini sağlar.', 'GELU(−1) = −0.16 · GELU(2) = 1.95'],
    ],
  },
  {
    title: 'Attention',
    color: C.k,
    terms: [
      ['Attention (dikkat)', "Her token'ın diğer token'lara ne kadar bakacağını hesaplayıp onlardan bilgi toplaması.", '"o" → %85 "adam"'],
      ['Q, K, V', 'Token vektörünün Wq, Wk, Wv ile çarpımı: soru (Query), etiket (Key), bilgi (Value).', 'q = x · Wq'],
      ['Head (kafa)', 'Kendi Q, K, V parçasıyla ayrı bir dikkat hesaplayan birim. Çok kafa = farklı ilişkiler.', '768 / 96 kafa = kafa başına 8'],
      ['Wo (çıkış projeksiyonu)', "Kafaların birleştirilmiş çıktısını karıştırıp d_model boyutuna döndüren öğrenilen matris.", 'concat · Wo'],
    ],
  },
  {
    title: 'Decoder bloğu',
    color: C.v,
    terms: [
      ['Causal maske', "Gelecekteki token'ları gizleyen maske: skor −∞ yapılır, softmax'tan sonra 0 olur.", 'üst üçgen = −∞'],
      ['Residual (kestirme yol)', 'Bir bloğun girdisini çıktısına eklemek. Ham bilgi ve gradyanlar kaybolmaz.', 'x + MHA(x)'],
      ['LayerNorm', "Her token vektörünü ortalama 0, varyans 1 olacak şekilde yeniden ölçeklemek.", '(x − ortalama) / std'],
      ['FFN / MLP', "Her token'a ayrı uygulanan küçük ağ: genişlet → GELU → daralt.", '768 → 3072 → 768'],
    ],
  },
  {
    title: 'Çıkış',
    color: C.accent,
    terms: [
      ['Decoder bloğu', 'Attention + Add & Norm + FFN + Add & Norm. GPT bunlardan N tanesini üst üste dizer.', 'GPT-2 küçük: 12 blok'],
      ['Logit', 'Softmax\'tan önceki ham skor; sözlükteki her kelime için bir sayı.', '[2.1, −0.3, 0.8, …]'],
      ['lm_head', 'En sondaki Linear katman: d_model → sözlük boyutu (logit\'ler).', '768 → 50.257'],
      ['Greedy / sampling', 'Sonraki token\'ı seçme yolu: en olasıyı al (greedy) ya da olasılığa göre rastgele seç (sampling, temperature, top-k).', 'generate()'],
    ],
  },
  {
    title: 'Eğitim — 1',
    color: C.red,
    terms: [
      ['Loss (cross-entropy)', "Tahminin ne kadar yanlış olduğu: −log(doğru token'ın olasılığı).", 'p = 0.24 → loss 1.43'],
      ['Gradyan', "Her parametre için loss'un eğimi: o düğmeyi biraz çevirince loss'un nasıl değiştiği.", 'eğim −0.27 → artır'],
      ['Geri yayılım (backprop)', "Loss'tan geriye doğru giderek bütün gradyanları tek seferde hesaplamak (zincir kuralı).", 'loss.backward()'],
      ['Optimizer (SGD, AdamW)', 'Gradyanlara bakıp parametreleri güncelleyen kural. AdamW adım büyüklüğünü kendisi ayarlar.', 'optimizer.step()'],
    ],
  },
  {
    title: 'Eğitim — 2',
    color: C.red,
    terms: [
      ['Öğrenme oranı (η, lr)', 'Her güncellemede ne kadar büyük adım atılacağı.', 'w ← w − η · gradyan'],
      ['Batch', 'Aynı anda işlenen örnek grubu; gradyan bu grubun ortalamasından hesaplanır.', 'batch_size = 4'],
      ['Epoch', 'Bütün veri setinin model tarafından bir kez baştan sona görülmesi.', '20 epoch = veri 20 kez'],
      ['Stride', 'DataLoader\'da bir sonraki pencerenin kaç token kaydığı.', 'stride < context → örtüşme'],
    ],
  },
  {
    title: 'Eğitim ve kullanım',
    color: C.yellow,
    terms: [
      ['Dropout', 'Eğitimde bazı değerleri rastgele sıfırlayarak ezberlemeyi önlemek; kullanırken kapalı.', 'model.train() / model.eval()'],
      ['Inference (çıkarım)', 'Eğitilmiş modeli kullanmak: tahmin yapmak, metin üretmek. Ağırlıklar artık değişmez.', 'model.generate(…)'],
      ['Overfitting (ezberleme)', 'Modelin eğitim verisini ezberleyip yeni verilerde kötü sonuç vermesi.', 'eğitim loss ↓, test loss ↑'],
      ['Fine-tuning / SFT', 'Önceden eğitilmiş modeli küçük, özel bir veriyle eğitmeye devam etmek.', 'gemma-3-27b-pt → -it'],
    ],
  },
  {
    title: 'Mimari ve pozisyon',
    color: C.teal,
    terms: [
      ['Encoder', 'Girdiyi iki yönlü (maskesiz) okuyup anlam haritası çıkaran kısım.', 'çeviride kaynak cümle'],
      ['Decoder', 'Token token üreten, causal maskeli kısım. GPT sadece decoder\'dır.', 'GPT, LLaMA, Gemma'],
      ['Cross-attention', "Q'nun decoder'dan, K ve V'nin encoder'dan geldiği attention.", 'çeviri modellerinde'],
      ['RoPE', 'Pozisyon bilgisini vektörü sıraya göre döndürerek veren yöntem; bugün en yaygın olanı.', 'açı farkı = mesafe'],
    ],
  },
];

const PAGE_DUR = 300;
export const GLOSSARY_DUR = PAGES.length * PAGE_DUR;

const PageView: React.FC<{page: Page; index: number}> = ({page, index}) => (
  <>
    <Lead>
      Sözlük {index + 1} / {PAGES.length} · <b style={{color: page.color}}>{page.title}</b>
    </Lead>
    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 26}}>
      {page.terms.map(([term, def, ex], i) => (
        <Appear key={term} at={10 + i * 14}>
          <Panel accent={page.color} side="left" style={{height: 250, display: 'flex', flexDirection: 'column'}}>
            <div style={{fontSize: 34, fontWeight: 800, color: page.color}}>{term}</div>
            <div style={{fontSize: 25, lineHeight: 1.45, marginTop: 12, flex: 1}}>{def}</div>
            {ex && <div style={{fontFamily: MONO, fontSize: 21, color: C.dim}}>örnek: {ex}</div>}
          </Panel>
        </Appear>
      ))}
    </div>
  </>
);

export const Glossary: React.FC = () => (
  <Scene no={18} title="Sözlük" subtitle="videoda geçen terimler">
    {PAGES.map((p, i) => (
      <Beat key={p.title} from={i * PAGE_DUR} dur={PAGE_DUR}>
        <PageView page={p} index={i} />
      </Beat>
    ))}
  </Scene>
);

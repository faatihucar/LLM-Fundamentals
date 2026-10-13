# LLM Temelleri — Animasyon

`LLM Fundamental.docx` notlarının Remotion ile hazırlanmış animasyonu (1920×1080, 30 fps, ~17,5 dk).

Her ekranın sağ üstündeki sarı kutular, o ekranda geçen terimleri (softmax, GELU, Q/K/V, head, Wo, FFN, logit,
loss, gradyan, RoPE …) tek cümleyle açıklar. Tümü en sondaki Sözlük bölümünde de toplu hâlde var.

## İzlemek

- Hazır video: depodaki [`assets/LLM-Temelleri.mp4`](../assets/LLM-Temelleri.mp4) (sıkıştırılmış kopya).
  `npm run render` tam kaliteli sürümü `out/LLM-Temelleri.mp4` olarak üretir (`out/` depoya eklenmez).
- İnteraktif (bölüm seçip ileri/geri sarmak için): `npm run studio` → tarayıcıda açılır.
  Sol menüde `LLM-Temelleri` tüm video, `Bolumler` klasöründe her konu ayrı ayrı.

## Bölümler (videodaki başlangıç zamanı)

| Zaman | Bölüm |
|------:|-------|
| 0:00 | Giriş |
| 0:07 | 01 · Tokenizer |
| 0:37 | 02 · Context Length (+ pt / it modeller) |
| 1:06 | 03 · DataLoader (+ kırpılan token'lar ne olur, stride) |
| 2:11 | 04 · Embedding |
| 2:45 | 05 · Positional Encoding |
| 3:13 | 06 · Self-Attention (token vektörü = tek kelime; X = alt alta dizilmiş vektörler; Q·Kᵀ tablosu) |
| 4:04 | 07 · Dinamik Anlam ve Next-Token |
| 4:39 | 08 · Causal Mask |
| 5:08 | 09 · Dropout (+ dropout'tan sonra neden softmax yok) |
| 5:44 | 10 · Multi-Head Attention (X = "Yapay zeka", 2 token × 768; bölünen W'lerin sütunları) |
| 6:28 | 11 · Matrislerle Attention (token vektörü → Q, K, V → kafalar → Wo) |
| 8:37 | 12 · Residual & Layer Norm |
| 9:04 | 13 · Feed-Forward (FFN / MLP, gate_proj / up_proj örneği) |
| 10:16 | 14 · Transformer Mimarisi |
| 11:00 | 15 · Eğitimin Mantığı (sezgisel) |
| 12:24 | 16 · Eğitim: Adım Adım (her sayısıyla) |
| 15:12 | 17 · Özet |
| 15:36 | 18 · Sözlük (44 terim) |

### 11 · Matrislerle Attention (iç kısımlar)

| Zaman | Konu |
|------:|------|
| 6:28 | X: cümlenin matrisi (6 kelime × 4 sayı) |
| 6:37 | Wq, Wk, Wv: öğrenilen matrisler |
| 6:46 | Tek kelime: "metni" × Wq = "metni"nin sorusu (q) |
| 7:02 | Bütün kelimeler birden: X × Wq = Q, X × Wk = K, X × Wv = V |
| 7:11 | Q ve K nereden geliyor? Önce çarp, sonra sütunları kafalara paylaştır |
| 7:25 | Kafa 1'in puan tablosu (skor → maske → softmax) |
| 7:43 | "Model" satırı × V: yeni vektör |
| 7:59 | İki kafa yan yana (concat) |
| 8:11 | × Wo |

### 16 · Eğitim: Adım Adım (alt adımlar)

| Zaman | Adım | Zaman | Adım |
|------:|------|------:|------|
| 12:24 | 1 · Tokenizer | 13:52 | 8 · Feed-Forward + Add & Norm |
| 12:35 | 2 · DataLoader | 14:03 | 9 · Linear + Softmax |
| 12:45 | 3 · Embedding + Pozisyon | 14:17 | 10 · Loss |
| 12:59 | 4 · Q, K, V | 14:29 | 11 · Geri yayılım |
| 13:11 | 5 · Attention (kafa 1) | 14:42 | 12 · Eğitim döngüsü |
| 13:31 | 6 · A·V, birleştir, Wo | 15:00 | 13 · Metin üretimi |
| 13:43 | 7 · Add & Norm | | |

Bölüm 11, 13, 15 ve 16'daki bütün sayılar gerçek bir eğitimden gelir: `scripts/train_tiny.py`, paragrafla
332 parametrelik minik bir Transformer'ı (d_model = 4, 2 kafa, context length 6) eğitir ve ara değerleri
(Wq/Wk/Wv/Wo, Q/K/V, attention, FFN, olasılıklar, loss, tek bir ağırlığın loss eğrisi) `src/data/training.json`
dosyasına yazar. Paragrafı ya da ayarları değiştirirsen önce `python scripts/train_tiny.py` (PyTorch gerekir),
sonra `npm run render` çalıştır.

## Komutlar

```bash
npm install          # ilk kurulum
npm run studio       # Remotion Studio (önizleme)
npm run render       # out/LLM-Temelleri.mp4 dosyasını yeniden üretir
npx remotion render 11-Matrislerle-Attention out/11.mp4   # tek bir bölümü ayrı video yapmak
```

### Windows notu (ffmpeg)

Yazarın bilgisayarında Remotion'ın kendi `ffmpeg.exe`'si Windows'un uygulama bütünlüğü politikasına takılıyor;
ayrıca ffmpeg, yolunda "ö" gibi ASCII dışı harf geçen klasörlerde çalışmıyor. Bu yüzden `remotion.config.ts`,
`~/.remotion-bin` klasörü **varsa** Remotion'ın ikili dosyalarını oradan alır (o klasördeki `ffmpeg.exe`,
Python'daki `imageio-ffmpeg` paketinin ffmpeg 7.1 sürümüdür). Klasör yoksa Remotion kendi dosyalarını kullanır;
başka bir bilgisayarda hiçbir şey yapman gerekmez. Remotion sürümünü yükseltirsen bu klasörü
`node_modules/@remotion/compositor-win32-x64-msvc` içeriğiyle yenileyip `ffmpeg.exe`'yi tekrar değiştirmen gerekir.

Terim açıklamaları `src/terms.ts` dosyasında; bir ekranda hangi terimlerin görüneceği sahnedeki
`<Beat terms={[...]}>` ile seçilir. Sahneler `src/scenes/` altında; her dosyanın başındaki `*_DUR` sabiti o bölümün süresidir (kare cinsinden, 30 kare = 1 sn).

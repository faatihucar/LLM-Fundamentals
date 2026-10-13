# LLM Temelleri — Notebook'lar

Bu klasördeki notebook'lar `LLM Fundamental.docx` belgesinin bölüm sırasını izler. Sırayla çalıştır;
her notebook kendi başına da çalışır (bir öncekine bağlı değildir). Kod, Ali Bayram'ın
"LLM from scratch" kursundaki `usta_*` modüllerine dayanır.

| Notebook | Belgedeki bölüm |
|---|---|
| `01_Tokenizer.ipynb` | Tokenizer |
| `02_Context_Length_ve_DataLoader.ipynb` | Context Length, DataLoader |
| `03_Embedding.ipynb` | Embedding |
| `04_Positional_Encoding.ipynb` | Embedding › Hibrit ve Tam LLM Giriş Akışı (pozisyon) |
| `05_Self_Attention.ipynb` | Self Attention |
| `06_Causal_Self_Attention.ipynb` | Causal (Masked) Self Attention |
| `07_Dropout.ipynb` | Dropout |
| `08_Multi_Head_Attention.ipynb` | Multi-Head Attention |
| `09_Residual_ve_Layer_Normalization.ipynb` | Residual Connection ve Layer Normalization |
| `10_Transformer_Decoder_Blogu.ipynb` | Transformer Mimarisi › Decoder Katmanı |
| `11_GPT_Modeli_ve_Sonraki_Token.ipynb` | Transformer Mimarisi › Linear + Softmax, GPT Gibi Modeller |
| `12_Egitim_ve_Metin_Uretimi.ipynb` | Eğitim (loss, geri yayılım) ve metin üretimi |

## Çalıştırma

- Çekirdek (kernel): **Python (nlp_env)** — notebook'lar bunu otomatik seçer.
- Gerekli paketler: `torch`, `transformers`, `tokenizers`, `tiktoken`, `sentencepiece`, `plotly`
  (`01_Tokenizer` ilk hücrede eksikleri kurar).
- **"İsteğe bağlı" başlıklı hücreler** gerçek modelleri indirir (Gemma ~2 GB, Qwen ~1.2 GB).
  Gemma için Hugging Face girişi gerekir: `login()` çalışınca token'ını açılan kutuya gir —
  **token'ı koda yazma.** Bu hücreleri atlarsan notebook'un geri kalanı yine çalışır.

## Kod dosyaları

| Dosya | Ne yapar | İlk kullanıldığı notebook |
|---|---|---|
| `usta_tokenizer.py` | 64 token'lık sözlükle metin ↔ ID | 01 |
| `text_dataset.py` | Kaydırmalı (girdi, hedef) veri seti + DataLoader | 02 |
| `usta_embedding.py` | `nn.Embedding` + RoPE pozisyon bilgisi | 04 |
| `usta_self_attention.py` | Q, K, V ile self-attention (maskesiz) | 06 |
| `usta_causal_attention.py` | Causal maske + dropout'lu attention | 06 |
| `usta_multi_head_attention.py` | Çok başlı causal attention | 08 |
| `usta_layer_norm.py` | LayerNorm | 09 |
| `usta_mlp.py` | GELU'lu feed-forward (MLP) | 10 |
| `usta_decoder_block.py` | MHA → Add & Norm → MLP → Add & Norm | 10 |
| `usta_model.py` | Embedding → N decoder bloğu → Linear; `generate()` | 11 |
| `plot_tokens.py` | Vektörleri 3B çizer (plotly) | 05 |

Veri: `text.txt` (eğitim metni), `tokenizer.json` (sözlük). `token_ids.txt`, `spm_tokenizer.*`,
`hf_tokenizer.json` ve `u_model.pth` notebook'lar çalışınca yeniden üretilir.

## Kaynaklar

- Kurs deposu ve Türkçe tokenizer: https://github.com/malibayram, https://huggingface.co/spaces/alibayram/turkish_tiktokenizer
- Transformer'ı adım adım görselleştirme: https://bbycroft.net/llm
- The Illustrated Transformer: https://jalammar.github.io/illustrated-transformer/
- Tokenizer deneme alanı: https://tiktokenizer.vercel.app/
- Makaleler: "Attention Is All You Need", GPT-2 / GPT-3

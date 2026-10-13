import torch.nn as nn

from usta_layer_norm import UstaLayerNorm
from usta_mlp import UstaMLP
from usta_multi_head_attention import UstaMultiHeadAttention


class UstaDecoderBlock(nn.Module):
  def __init__(self, embedding_dim, num_heads, context_length):
    super().__init__()

    self.self_attention = UstaMultiHeadAttention(embedding_dim, embedding_dim, context_length, num_heads, dropout_rate=0.1)
    self.norm1 = UstaLayerNorm(embedding_dim)
    # Feed-forward önce 4 kat genişler, sonra tekrar embedding_dim'e döner (belge: 768 -> 3072 -> 768)
    self.mlp = UstaMLP(embedding_dim, 4 * embedding_dim)
    self.norm2 = UstaLayerNorm(embedding_dim)

  def forward(self, x):
    # Add & Norm 1: residual (x + attention çıktısı), ardından LayerNorm
    x = self.norm1(x + self.self_attention(x))

    # Add & Norm 2: residual (x + MLP çıktısı), ardından LayerNorm
    x = self.norm2(x + self.mlp(x))

    return x

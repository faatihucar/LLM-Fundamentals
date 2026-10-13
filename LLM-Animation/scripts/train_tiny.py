"""Train a tiny one-block transformer on a short paragraph and dump every intermediate
value the "Eğitim: Adım Adım" scene shows (src/data/training.json).

    python scripts/train_tiny.py

Everything is word-level and tiny (d_model=4, 2 heads, context 6) so each number fits on screen.
"""
import json
import math
from pathlib import Path

import torch
import torch.nn as nn
import torch.nn.functional as F

PARAGRAPH = 'Yapay zeka metni okur. Model sonraki kelimeyi tahmin eder.'
TOKENS = ['Yapay', 'zeka', 'metni', 'okur', '.', 'Model', 'sonraki', 'kelimeyi', 'tahmin', 'eder', '.']
CTX, D, H, FF = 6, 4, 2, 16
DK = D // H
LR, STEPS, SEED = 0.1, 500, 9  # seed/lr picked for a smooth, spike-free loss curve
CHECKPOINTS = [0, 30, 80, 160, 500]

VOCAB = list(dict.fromkeys(TOKENS))
IDS = [VOCAB.index(t) for t in TOKENS]
V = len(VOCAB)
WINDOWS = [(IDS[i:i + CTX], IDS[i + 1:i + CTX + 1]) for i in range(len(IDS) - CTX)]


class TinyGPT(nn.Module):
    def __init__(self):
        super().__init__()
        self.emb = nn.Embedding(V, D)
        self.pos = nn.Embedding(CTX, D)
        self.wq = nn.Linear(D, D, bias=False)
        self.wk = nn.Linear(D, D, bias=False)
        self.wv = nn.Linear(D, D, bias=False)
        self.wo = nn.Linear(D, D, bias=False)
        self.ln1 = nn.LayerNorm(D)
        self.ff1 = nn.Linear(D, FF)
        self.ff2 = nn.Linear(FF, D)
        self.ln2 = nn.LayerNorm(D)
        self.out = nn.Linear(D, V, bias=False)

    def forward(self, x, rec=None):
        t = x.shape[-1]
        e = self.emb(x)
        p = self.pos(torch.arange(t))
        xx = e + p
        q, k, v = self.wq(xx), self.wk(xx), self.wv(xx)
        mask = torch.triu(torch.ones(t, t, dtype=torch.bool), 1)
        heads, ctx = [], []
        for h in range(H):
            sl = slice(h * DK, (h + 1) * DK)
            s = q[..., sl] @ k[..., sl].transpose(-1, -2)
            sc = s / math.sqrt(DK)
            a = torch.softmax(sc.masked_fill(mask, float('-inf')), -1)
            ctx.append(a @ v[..., sl])
            heads.append({'S': s, 'scaled': sc, 'A': a})
        c = torch.cat(ctx, -1)
        m = self.wo(c)
        r1 = xx + m
        n1 = self.ln1(r1)
        pre = self.ff1(n1)
        hid = F.gelu(pre)
        fo = self.ff2(hid)
        r2 = n1 + fo
        n2 = self.ln2(r2)
        logits = self.out(n2)
        if rec is not None:
            rec.update(E=e, P=p, X=xx, Q=q, K=k, V=v, heads=heads, C=c, M=m, R1=r1, N1=n1, Pre=pre, Hid=hid, Fo=fo, R2=r2, N2=n2,
                       logits=logits)
        return logits


def r(t, nd=3):
    if isinstance(t, torch.Tensor):
        t = t.detach().tolist()
    if isinstance(t, list):
        return [r(x, nd) for x in t]
    if isinstance(t, float) and math.isinf(t):
        return None
    return round(t, nd) if isinstance(t, float) else t


def example_pass(model, x, y):
    rec = {}
    with torch.no_grad():
        logits = model(torch.tensor(x), rec)
    probs = torch.softmax(logits, -1)
    loss_tok = -torch.log(probs[torch.arange(len(y)), torch.tensor(y)])
    out = {k: r(v) for k, v in rec.items() if k != 'heads'}
    out['heads'] = [{k: r(v) for k, v in h.items()} for h in rec['heads']]
    out.update(probs=r(probs), lossTok=r(loss_tok), loss=r(loss_tok.mean().item()))
    return out


def knob_sweep(model, xb, yb):
    """The batch loss as a function of ONE weight (all others frozen), plus gradient descent on it alone.

    Uses the output-layer weight with the largest gradient: its 1-D loss curve is convex, so the
    "ball rolling into the valley" picture is exact. The model is restored afterwards and no random
    numbers are drawn, so the real training below is unaffected.
    """
    def loss_and_grad(val):
        with torch.no_grad():
            model.out.weight[vi, di] = val
        model.zero_grad()
        loss = F.cross_entropy(model(xb).reshape(-1, V), yb.reshape(-1))
        loss.backward()
        return loss.item(), model.out.weight.grad[vi, di].item()

    model.zero_grad()
    F.cross_entropy(model(xb).reshape(-1, V), yb.reshape(-1)).backward()
    vi, di = divmod(int(model.out.weight.grad.abs().argmax()), D)
    w0 = model.out.weight[vi, di].item()

    span = 2.0
    while True:
        xs = [w0 + span * (k / 40 - 1) for k in range(81)]
        ys = [loss_and_grad(x)[0] for x in xs]
        best = min(range(81), key=ys.__getitem__)
        if 5 < best < 75:
            break
        span *= 2
    l0, g0 = loss_and_grad(w0)
    h = span / 40
    curvature = (ys[42] - 2 * ys[40] + ys[38]) / (2 * h) ** 2  # ys[40] is w0
    eta = 0.5 / curvature
    steps, w = [], w0
    for _ in range(7):
        l, g = loss_and_grad(w)
        steps.append({'w': round(w, 4), 'loss': round(l, 4), 'grad': round(g, 4)})
        w -= eta * g
    with torch.no_grad():
        model.out.weight[vi, di] = w0
    model.zero_grad()
    return {'word': VOCAB[vi], 'dim': di, 'w0': round(w0, 4), 'loss0': round(l0, 4), 'grad0': round(g0, 4),
            'eta': round(eta, 3), 'xs': [round(x, 4) for x in xs], 'ys': [round(y, 4) for y in ys], 'steps': steps}


def main():
    torch.manual_seed(SEED)
    model = TinyGPT()
    opt = torch.optim.SGD(model.parameters(), lr=LR)
    xb = torch.tensor([w[0] for w in WINDOWS])
    yb = torch.tensor([w[1] for w in WINDOWS])
    ex_x, ex_y = WINDOWS[0]

    step0 = example_pass(model, ex_x, ex_y)
    # weights in "x @ W" orientation (nn.Linear stores W transposed)
    weights = {name: r(getattr(model, 'w' + name).weight.T) for name in 'qkvo'}
    knob = knob_sweep(model, xb, yb)
    curve, checkpoints, grad = [], [], None
    for step in range(STEPS + 1):
        if step in CHECKPOINTS:
            ex = example_pass(model, ex_x, ex_y)
            checkpoints.append({'step': step, 'probs': ex['probs'], 'loss': ex['loss'], 'lossTok': ex['lossTok']})
        logits = model(xb)
        loss = F.cross_entropy(logits.reshape(-1, V), yb.reshape(-1))
        curve.append(round(loss.item(), 4))
        if step == STEPS:
            break
        opt.zero_grad()
        loss.backward()
        if step == 0:
            row = VOCAB.index('zeka')
            before = model.emb.weight[row].detach().clone()
            g = model.emb.weight.grad[row].detach().clone()
        opt.step()
        if step == 0:
            grad = {'token': 'zeka', 'before': r(before), 'grad': r(g, 4), 'after': r(model.emb.weight[row]), 'lr': LR,
                    'batchLoss': curve[0]}

    final = example_pass(model, ex_x, ex_y)

    generation, seq = [], [VOCAB.index(t) for t in ['Yapay', 'zeka', 'metni']]
    prompt = [VOCAB[i] for i in seq]
    with torch.no_grad():
        for _ in range(8):
            ctx = seq[-CTX:]
            p = torch.softmax(model(torch.tensor(ctx))[-1], -1)
            top = torch.topk(p, 3)
            nxt = int(top.indices[0])
            generation.append({'context': [VOCAB[i] for i in ctx],
                               'top': [[VOCAB[int(i)], round(float(v), 3)] for v, i in zip(top.values, top.indices)],
                               'chosen': VOCAB[nxt]})
            seq.append(nxt)

    data = {
        'paragraph': PARAGRAPH, 'tokens': TOKENS, 'vocab': VOCAB, 'ids': IDS, 'ctx': CTX,
        'dims': {'V': V, 'D': D, 'H': H, 'DK': DK, 'FF': FF},
        'params': sum(p.numel() for p in model.parameters()),
        'windows': [{'x': [VOCAB[i] for i in x], 'y': [VOCAB[i] for i in y]} for x, y in WINDOWS],
        'step0': step0, 'weights': weights, 'knob': knob,
        'grad': grad, 'curve': curve, 'checkpoints': checkpoints, 'final': final,
        'generation': {'prompt': prompt, 'steps': generation}, 'lr': LR, 'steps': STEPS,
    }
    out = Path(__file__).resolve().parent.parent / 'src' / 'data' / 'training.json'
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')
    print('loss', curve[0], '->', curve[-1], '| params', data['params'])
    print('example loss', step0['loss'], '->', final['loss'])
    print('generated:', ' '.join(prompt + [g['chosen'] for g in generation]))


if __name__ == '__main__':
    main()

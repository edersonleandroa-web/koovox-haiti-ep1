"""Texturas do projeto (rodar uma vez):  py scripts/make_textures.py

- public/textures/fundo-limpo.jpg : fundo quadriculado do usuário (ampliado 4x no Magnific) sem a
  fileira de pontos de poeira repetidos no meio da imagem
- public/textures/paper.jpg       : papel envelhecido (polaroid, documentos, mapa)
- public/textures/paper-wide.jpg  : papel largo para a folha do mapa
- public/textures/kraft.jpg       : papel kraft (pasta de arquivo)
- public/textures/newsprint.jpg   : papel jornal
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
TEX = os.path.join(ROOT, "public", "textures")
rng = np.random.default_rng(7)


def smooth_noise(w, h, cells, seed):
    r = np.random.default_rng(seed)
    small = r.random((cells, max(2, int(cells * h / w)))).astype(np.float32)
    img = Image.fromarray((small * 255).astype(np.uint8), "L").resize((w, h), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0 - 0.5


def paper(w, h, base, seed, fibers=900, stain=1.0, fine=4.0):
    lo = smooth_noise(w, h, 6, seed) * 1.0 + smooth_noise(w, h, 24, seed + 1) * 0.6 + smooth_noise(w, h, 90, seed + 2) * 0.35
    hf = np.random.default_rng(seed + 3).normal(0, 1, (h, w)).astype(np.float32)
    img = np.zeros((h, w, 3), np.float32)
    for c in range(3):
        img[..., c] = base[c] * (1 + 0.07 * stain * lo) + fine * hf
    # fibras
    layer = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(layer)
    r = np.random.default_rng(seed + 4)
    for _ in range(fibers):
        x, y = r.random() * w, r.random() * h
        a = r.random() * np.pi
        ln = 6 + r.random() * 26
        d.line([(x, y), (x + np.cos(a) * ln, y + np.sin(a) * ln)], fill=int(40 + r.random() * 60), width=1)
    fib = np.asarray(layer.filter(ImageFilter.GaussianBlur(0.6)), np.float32) / 255.0
    sign = np.where(smooth_noise(w, h, 40, seed + 5) > 0, 1.0, -1.0)
    img += (fib * 10.0 * sign)[..., None]
    # bordas levemente mais escuras (manuseio)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    edge = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))
    img *= (0.9 + 0.1 * np.clip(edge / (0.08 * min(w, h)), 0, 1))[..., None]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")


def clean_background():
    src = os.path.join(TEX, "fundo-4x.jpg")
    im = Image.open(src).convert("RGB")
    a = np.asarray(im, np.float32)
    L = a.mean(axis=2)
    H, W = L.shape
    y0, y1, x0, x1 = 1190, 1340, 420, 2480
    band = L[y0:y1, x0:x1]
    # linhas da grade: colunas/linhas muito mais claras que a média numa faixa alta
    colmean = L[700:1900, :].mean(axis=0)
    colbase = np.asarray(Image.fromarray(colmean[None, :].astype(np.float32)).resize((W, 1), Image.BILINEAR))[0]
    k = 61
    pad = np.pad(colmean, k // 2, mode="edge")
    colmed = np.array([np.median(pad[i:i + k]) for i in range(W)])
    gridcols = np.where(colmean - colmed > 6)[0]
    rowmean = L[:, 300:2700].mean(axis=1)
    padr = np.pad(rowmean, k // 2, mode="edge")
    rowmed = np.array([np.median(padr[i:i + k]) for i in range(H)])
    gridrows = np.where(rowmean - rowmed > 6)[0]
    # período vertical da grade (centros das linhas horizontais)
    centers = []
    for r_ in gridrows:
        if centers and r_ - centers[-1][-1] <= 3:
            centers[-1].append(r_)
        else:
            centers.append([r_])
    cy = np.array([np.mean(c) for c in centers])
    period = int(round(np.median(np.diff(cy)))) if len(cy) > 2 else 111
    # só os pontos de poeira fortes (bem mais claros que o entorno), fora das linhas da grade
    med = np.asarray(Image.fromarray(band.astype(np.uint8)).filter(ImageFilter.MedianFilter(21)), np.float32)
    mask = (band - med) > 70
    for c in gridcols:
        if x0 - 4 <= c < x1 + 4:
            mask[:, max(0, c - x0 - 3):max(0, c - x0 + 4)] = False
    for r_ in gridrows:
        if y0 - 4 <= r_ < y1 + 4:
            mask[max(0, r_ - y0 - 3):max(0, r_ - y0 + 4), :] = False
    # componentes conexos: mantém manchas compactas (>= 10 px), descarta riscos finos
    seen = np.zeros_like(mask)
    keep = np.zeros_like(mask)
    hh, ww = mask.shape
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        stack, comp = [(sy, sx)], []
        seen[sy, sx] = True
        while stack:
            yy, xx = stack.pop()
            comp.append((yy, xx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = yy + dy, xx + dx
                    if 0 <= ny < hh and 0 <= nx < ww and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        ys = [p[0] for p in comp]
        xs = [p[1] for p in comp]
        bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1
        if len(comp) >= 10 and max(bw, bh) <= 60 and len(comp) >= 0.2 * bw * bh:
            for p in comp:
                keep[p] = True
    m = Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.GaussianBlur(2))
    mf = np.asarray(m, np.float32)[..., None] / 255.0
    sub = a[y0:y1, x0:x1].copy()
    donor = a[y0 - period:y1 - period, x0:x1]  # mesma posição uma célula acima: textura e grade alinhadas
    a[y0:y1, x0:x1] = sub * (1 - mf) + donor * mf
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(os.path.join(TEX, "fundo-limpo.jpg"), quality=92)
    print("fundo-limpo.jpg ok; período da grade:", period, "pixels corrigidos:", int(keep.sum()))




if __name__ == "__main__":
    os.makedirs(TEX, exist_ok=True)
    clean_background()
    paper(1024, 1024, (233, 227, 211), 11).save(os.path.join(TEX, "paper.jpg"), quality=90)
    paper(2400, 1400, (226, 219, 201), 21, fibers=3500).save(os.path.join(TEX, "paper-wide.jpg"), quality=88)
    paper(1024, 1024, (196, 160, 108), 31, fibers=2200, stain=1.4, fine=5.0).save(os.path.join(TEX, "kraft.jpg"), quality=90)
    paper(1024, 1024, (222, 218, 205), 41, fibers=500, stain=0.7, fine=6.0).save(os.path.join(TEX, "newsprint.jpg"), quality=90)
    print("papéis ok")

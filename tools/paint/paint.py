"""Tiny painterly toolkit: masks from shapes, volume shading, texture, soft vignettes.

Coordinates are in the map's landmark units (about -80..80), scaled to pixels.
"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

PX = 4            # pixels per unit
SIZE = 640        # canvas edge in px (=160 units)
SS = 2            # supersampling for masks
O = SIZE / 2

H = W = SIZE
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
X = (xx - O) / PX          # unit coords
Y = (yy - O) / PX


def u2p(pts, ss=1):
    return [((x * PX + O) * ss, (y * PX + O) * ss) for x, y in pts]


def noise(scale=8, octaves=5, seed=0, persistence=0.55):
    """fbm noise in 0..1; `scale` = size of the biggest feature in units"""
    rng = np.random.default_rng(seed)
    out = np.zeros((H, W), np.float32)
    amp, tot = 1.0, 0.0
    cell = scale * PX
    for _ in range(octaves):
        n = max(2, int(W / cell) + 3)
        g = rng.random((n, n)).astype(np.float32)
        z = ndimage.zoom(g, (W + 2 * cell) / n, order=3)
        off = int(rng.integers(0, max(1, int(cell))))
        out += amp * z[off:off + H, off:off + W]
        tot += amp
        amp *= persistence
        cell = max(1.0, cell / 2)
    out /= tot
    out = (out - out.min()) / (out.max() - out.min() + 1e-6)
    return out


def poly(pts, blur=0.6):
    im = Image.new("L", (W * SS, H * SS), 0)
    ImageDraw.Draw(im).polygon(u2p(pts, SS), fill=255)
    im = im.resize((W, H), Image.LANCZOS)
    m = np.asarray(im, np.float32) / 255
    return ndimage.gaussian_filter(m, blur) if blur else m


def ellipse(cx, cy, rx, ry, blur=0.6):
    im = Image.new("L", (W * SS, H * SS), 0)
    (x0, y0), (x1, y1) = u2p([(cx - rx, cy - ry), (cx + rx, cy + ry)], SS)
    ImageDraw.Draw(im).ellipse([x0, y0, x1, y1], fill=255)
    im = im.resize((W, H), Image.LANCZOS)
    m = np.asarray(im, np.float32) / 255
    return ndimage.gaussian_filter(m, blur) if blur else m


def lines(segs, width, blur=0.5):
    """segs: list of point lists; width in units"""
    im = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(im)
    for s in segs:
        d.line(u2p(s, SS), fill=255, width=max(1, int(width * PX * SS)), joint="curve")
    im = im.resize((W, H), Image.LANCZOS)
    m = np.asarray(im, np.float32) / 255
    return ndimage.gaussian_filter(m, blur) if blur else m


def curve(fn, a, b, n=80):
    return [fn(a + (b - a) * i / (n - 1)) for i in range(n)]


def bezier(p0, p1, p2, p3, n=40):
    out = []
    for i in range(n):
        t = i / (n - 1)
        a = (1 - t) ** 3; b = 3 * (1 - t) ** 2 * t; c = 3 * (1 - t) * t ** 2; d = t ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def col(c):
    return np.array(c, np.float32) / 255


def lerp3(a, b, t):
    t = np.clip(t, 0, 1)[..., None]
    return col(a) * (1 - t) + col(b) * t


def ramp(stops, t):
    """stops: [(pos, rgb)...]; t: HxW"""
    t = np.clip(t, 0, 1)
    out = np.zeros((H, W, 3), np.float32)
    for (p0, c0), (p1, c1) in zip(stops[:-1], stops[1:]):
        sel = (t >= p0) & (t <= p1)
        k = ((t - p0) / max(1e-6, p1 - p0))[..., None]
        out[sel] = (col(c0) * (1 - k) + col(c1) * k)[sel]
    out[t < stops[0][0]] = col(stops[0][1])
    out[t > stops[-1][0]] = col(stops[-1][1])
    return out


def volume(mask, radius=6, light=(-0.6, -0.8), strength=1.0):
    """fake 3D: normals from a blurred mask; returns lambert-ish 0..~1.3 shading"""
    h = ndimage.gaussian_filter(mask, radius * PX / 2)
    gy, gx = np.gradient(h)
    k = 1.0 / (np.abs(gx).max() + np.abs(gy).max() + 1e-6) * 2.2
    nx, ny = -gx * k, -gy * k
    nz = np.ones_like(nx)
    ln = math.hypot(*light, 0.7)
    lx, ly, lz = light[0] / ln, light[1] / ln, 0.7 / ln
    dot = (nx * lx + ny * ly + nz * lz) / np.sqrt(nx * nx + ny * ny + nz * nz)
    return 1 + (dot - lz) * strength


class Canvas:
    def __init__(self, base=None):
        self.rgb = np.zeros((H, W, 3), np.float32) if base is None else base.copy()
        self.a = np.zeros((H, W), np.float32)

    def paint(self, mask, color, opacity=1.0):
        m = np.clip(mask * opacity, 0, 1)[..., None]
        c = color if np.ndim(color) == 3 else np.broadcast_to(col(color) if np.max(color) > 1.5 else np.array(color, np.float32), (H, W, 3))
        self.rgb = self.rgb * (1 - m) + c * m
        self.a = np.maximum(self.a, mask * opacity)

    def multiply(self, mask, factor):
        f = 1 + (np.asarray(factor, np.float32) - 1) * np.clip(mask, 0, 1)
        self.rgb = self.rgb * (f[..., None] if f.ndim == 2 else f)

    def glow(self, mask, color, radius=4, strength=1.0):
        g = ndimage.gaussian_filter(mask, radius * PX)
        g = g / (g.max() + 1e-6) * strength
        self.rgb = 1 - (1 - self.rgb) * (1 - g[..., None] * col(color))

    def shadow(self, mask, dx=2, dy=2, blur=2.5, strength=0.45):
        s = ndimage.shift(mask, (dy * PX, dx * PX), order=1)
        s = ndimage.gaussian_filter(s, blur * PX)
        self.multiply(np.ones_like(s), 1 - s * strength)

    def save(self, path, vignette, grade=True, size=None):
        rgb = np.clip(self.rgb, 0, 1)
        rgb = kuwahara(rgb, 2) * 0.75 + rgb * 0.25
        if grade:
            # sit in a sepia parchment world: warm the shadows, soften the whites, add a little paper grain
            lum = rgb.mean(-1, keepdims=True)
            warm = np.array([1.04, 0.99, 0.88], np.float32)
            rgb = np.clip(rgb * warm, 0, 1)
            rgb = rgb * 0.9 + lum * 0.1
            grain = noise(0.6, 2, seed=99)[..., None]
            rgb = np.clip(rgb * (0.96 + 0.08 * grain), 0, 1)
            rgb = rgb * 0.94 + np.array([0.06, 0.05, 0.03]) * 0.6
        a = np.clip(vignette, 0, 1)
        img = np.dstack([rgb, a])
        im = Image.fromarray((img * 255).astype(np.uint8), "RGBA")
        if size:
            im = im.resize((size, size), Image.LANCZOS)
        im.save(path)
        return im


def vignette(cx=0, cy=0, rx=70, ry=62, feather=9, seed=1, rough=7, bottom_flat=None):
    """an irregular painted patch with a soft, ragged edge"""
    d = np.sqrt(((X - cx) / rx) ** 2 + ((Y - cy) / ry) ** 2)
    n = noise(14, 4, seed) - 0.5
    n2 = noise(3, 3, seed + 7) - 0.5
    d = d + (n * rough + n2 * 2.4) / max(rx, ry)
    if bottom_flat is not None:
        d = np.maximum(d, (Y - bottom_flat) / 12 + 0.6)
    a = np.clip((1 - d) * max(rx, ry) / feather, 0, 1)
    return a ** 1.3


def sky(top, bottom, horizon=40, top_y=-80):
    t = (Y - top_y) / (horizon - top_y)
    return lerp3(top, bottom, t)


def kuwahara(rgb, r=2):
    """painterly smoothing: each pixel takes the mean of its calmest quadrant"""
    k = r + 1
    lum = rgb.mean(-1)
    means, vars_ = [], []
    for dy in (0, -r):
        for dx in (0, -r):
            sh = lambda a: ndimage.shift(a, (dy + r / 2 * 0, dx), order=0, mode="nearest")
            m = ndimage.uniform_filter(rgb, (k, k, 1), origin=(-(r // 2) if dy == 0 else r // 2, -(r // 2) if dx == 0 else r // 2, 0), mode="nearest")
            ml = ndimage.uniform_filter(lum, k, origin=(-(r // 2) if dy == 0 else r // 2, -(r // 2) if dx == 0 else r // 2), mode="nearest")
            m2 = ndimage.uniform_filter(lum * lum, k, origin=(-(r // 2) if dy == 0 else r // 2, -(r // 2) if dx == 0 else r // 2), mode="nearest")
            means.append(m); vars_.append(m2 - ml * ml)
    idx = np.argmin(np.stack(vars_), 0)
    out = np.zeros_like(rgb)
    for i, m in enumerate(means):
        out[idx == i] = m[idx == i]
    return out


def strokes(c, mask, color_fn, n, length, width, angle, jitter=0.5, seed=0, opacity=0.6):
    """scatter short brush strokes inside mask"""
    rng = np.random.default_rng(seed)
    ys, xs = np.nonzero(mask > 0.5)
    if len(xs) == 0:
        return
    pick = rng.integers(0, len(xs), n)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for i in pick:
        x, y = xs[i], ys[i]
        a = angle + rng.normal(0, jitter)
        L = length * PX * rng.uniform(0.6, 1.3)
        x2, y2 = x + math.cos(a) * L, y + math.sin(a) * L
        r, g, b = color_fn(x, y, rng)
        d.line([(x, y), (x2, y2)], fill=(int(r), int(g), int(b), int(255 * opacity)), width=max(1, int(width * PX)))
    arr = np.asarray(im, np.float32) / 255
    m = arr[..., 3] * np.clip(mask, 0, 1)
    c.rgb = c.rgb * (1 - m[..., None]) + arr[..., :3] * m[..., None]


def jag(pts, amp=2.0, step=2.0, seed=0):
    """subdivide a polyline and roughen it, for natural rock and ridge edges"""
    rng = np.random.default_rng(seed)
    out = []
    for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) / step))
        for i in range(n):
            t = i / n
            out.append((x0 + (x1 - x0) * t + rng.normal(0, amp * 0.5), y0 + (y1 - y0) * t + rng.normal(0, amp)))
    out.append(pts[-1])
    return out

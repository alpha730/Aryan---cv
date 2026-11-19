"""Painted art for the project cards: the palantír and its stand, Thrór's map, the Horn of Gondor."""
import sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage

OUT = sys.argv[1]
rng = np.random.default_rng(7)


def fbm(h, w, scale, octaves=5, seed=0):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32); amp = 1; tot = 0; cell = scale
    for _ in range(octaves):
        n = max(2, int(max(h, w) / cell) + 3)
        g = r.random((n, n)).astype(np.float32)
        z = ndimage.zoom(g, (max(h, w) + 2 * cell) / n, order=3)
        out += amp * z[:h, :w]; tot += amp; amp *= 0.55; cell = max(1, cell / 2)
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


def save(rgb, a, name):
    img = np.dstack([np.clip(rgb, 0, 1), np.clip(a, 0, 1)])
    Image.fromarray((img * 255).astype(np.uint8), "RGBA").save(f"{OUT}/{name}.webp", quality=88, method=6)
    Image.fromarray((img * 255).astype(np.uint8), "RGBA").save(f"{OUT}/{name}.png")


# ---------------------------------------------------------------- the palantír
S = 512
yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
cx = cy = S / 2; R = S * 0.47
dx, dy = (xx - cx) / R, (yy - cy) / R
r2 = dx * dx + dy * dy
inside = np.clip((1 - np.sqrt(r2)) * R / 1.5, 0, 1)
nz = np.sqrt(np.clip(1 - r2, 0, 1))
# deep smoky glass: dark at the rim, a faint inner cloud of blue
depth = fbm(S, S, 120, 5, 11)
swirl = fbm(S, S, 60, 5, 12)
base = np.array([0.02, 0.035, 0.05])
cloud = np.array([0.18, 0.34, 0.46])
k = np.clip((swirl - 0.45) * 2.2, 0, 1) * nz ** 1.5
rgb = base + (cloud - base) * (k * 0.55)[..., None] + (depth * 0.04)[..., None]
# fresnel rim (glass edge catching light)
fres = (1 - nz) ** 3
rgb += fres[..., None] * np.array([0.25, 0.38, 0.5]) * 0.9
# soft key highlight top-left, small sharp specular, and a window-shaped reflection
hl = np.exp(-(((dx + 0.38) / 0.32) ** 2 + ((dy + 0.42) / 0.2) ** 2))
rgb += hl[..., None] * 0.28
spec = np.exp(-(((dx + 0.42) / 0.07) ** 2 + ((dy + 0.48) / 0.045) ** 2))
rgb += spec[..., None] * 1.0
win = ((np.abs(dx - 0.3) < 0.12) & (np.abs(dy + 0.45) < 0.09)).astype(np.float32)
win = ndimage.gaussian_filter(win, 3) * nz
rgb += win[..., None] * 0.12
# bottom bounce light, warm from the brass stand
bounce = np.exp(-((dy - 0.85) / 0.22) ** 2) * (1 - np.abs(dx)) * nz ** 0.3
rgb += bounce[..., None] * np.array([0.35, 0.22, 0.08]) * 0.6
save(rgb, inside, "palantir")

# stand: a dark carved stone cup with a brass band
W2, H2 = 512, 180
yy, xx = np.mgrid[0:H2, 0:W2].astype(np.float32)
im = Image.new("L", (W2 * 2, H2 * 2), 0)
d = ImageDraw.Draw(im)
d.polygon([(70, 40), (954, 40), (820, 250), (700, 290), (324, 290), (204, 250)], fill=255)  # cup
d.rectangle([300, 280, 724, 330], fill=255)  # neck
d.ellipse([170, 300, 854, 356], fill=255)  # foot
mask = np.asarray(im.resize((W2, H2), Image.LANCZOS), np.float32) / 255
u = (xx - W2 / 2) / (W2 / 2)
shade = 0.35 + 0.75 * np.clip(1 - (u + 0.35) ** 2, 0, 1)
stone = np.array([0.16, 0.14, 0.13])
tex = fbm(H2, W2, 30, 4, 21)
rgb = stone[None, None] * (shade * (0.8 + 0.4 * tex))[..., None]
band = ((yy > 30) & (yy < 46)).astype(np.float32) + ((yy > 158) & (yy < 168)).astype(np.float32)
brass = np.array([0.72, 0.52, 0.2]) * (0.4 + 0.9 * np.clip(1 - (u + 0.3) ** 2, 0, 1))[..., None]
rgb = rgb * (1 - band[..., None]) + brass * band[..., None]
# carved leaves along the cup (dark grooves)
groove = np.zeros((H2, W2), np.float32)
for i in range(-6, 7):
    x0 = W2 / 2 + i * 34
    groove += np.exp(-(((xx - x0 - (yy - 60) * 0.25 * np.sign(i + 0.1)) / 2.2) ** 2)) * ((yy > 50) & (yy < 135))
rgb *= (1 - 0.45 * np.clip(groove, 0, 1))[..., None]
rgb += np.exp(-((yy - 26) / 8) ** 2)[..., None] * np.array([0.3, 0.42, 0.55]) * 0.4 * mask[..., None]  # glow from the orb on the rim
save(rgb, mask, "palantir-stand")

# ---------------------------------------------------------------- Thrór's map
W3, H3 = 680, 512
yy, xx = np.mgrid[0:H3, 0:W3].astype(np.float32)
n1 = fbm(H3, W3, 160, 5, 31); n2 = fbm(H3, W3, 18, 4, 32); n3 = fbm(H3, W3, 4, 3, 33)
paper = np.array([0.93, 0.85, 0.66])
rgb = paper * (0.82 + 0.18 * n1)[..., None] * (0.94 + 0.08 * n2)[..., None]
# stains, foxing and darkened edges
stain = np.clip((fbm(H3, W3, 90, 4, 34) - 0.62) * 4, 0, 1)
rgb *= (1 - 0.18 * stain)[..., None]
ex = np.minimum(xx, W3 - xx) / W3; ey = np.minimum(yy, H3 - yy) / H3
edge = np.clip(np.minimum(ex * 6, ey * 6), 0, 1)
rgb *= (0.55 + 0.45 * edge ** 0.6)[..., None]
rgb *= np.array([1.0, 0.96, 0.88])
# fold creases
for fx in (W3 / 3, 2 * W3 / 3):
    c = np.exp(-((xx - fx) / 3) ** 2); rgb *= (1 - 0.12 * c)[..., None]
    rgb += (np.exp(-((xx - fx - 4) / 3) ** 2) * 0.05)[..., None]
c = np.exp(-((yy - H3 / 2) / 3) ** 2); rgb *= (1 - 0.1 * c)[..., None]
# ragged torn edge alpha
rough = (fbm(H3, W3, 10, 4, 35) - 0.5) * 0.03
a = np.clip((np.minimum(ex, ey) - 0.012 + rough) * 140, 0, 1)
# faded brown ink: the Lonely Mountain, the river, a dragon, a compass hand
ink = Image.new("L", (W3, H3), 0)
d = ImageDraw.Draw(ink)
mx, my = W3 * 0.5, H3 * 0.46
d.line([(mx - 150, my + 70), (mx - 60, my - 40), (mx - 20, my - 90), (mx + 20, my - 40), (mx + 120, my + 70)], fill=210, width=4, joint="curve")
for i in range(-5, 6):
    d.line([(mx + i * 14, my - 70 + abs(i) * 10), (mx + i * 22, my + 50)], fill=120, width=2)
for k in range(9):
    x = mx - 260 + k * 36; y = my + 110 + 8 * math.sin(k)
    d.polygon([(x, y), (x + 14, y - 26), (x + 28, y)], outline=170, width=2)
river = [(mx + 10 + 26 * math.sin(t / 14) + t * 0.3, my + 60 + t) for t in range(0, 140, 4)]
d.line(river, fill=160, width=3, joint="curve")
# dragon: sinuous body with wings, in red
dragon = Image.new("L", (W3, H3), 0)
dd = ImageDraw.Draw(dragon)
body = [(mx - 70 + t * 1.6, my - 150 + 14 * math.sin(t / 9)) for t in range(0, 90, 3)]
dd.line(body, fill=230, width=5, joint="curve")
dd.polygon([(mx - 10, my - 155), (mx + 10, my - 205), (mx + 30, my - 160)], fill=200)
dd.polygon([(mx - 40, my - 150), (mx - 25, my - 195), (mx - 5, my - 150)], fill=170)
dd.ellipse([mx - 82, my - 160, mx - 66, my - 144], fill=230)
# compass hand
d.line([(W3 - 120, H3 - 120), (W3 - 70, H3 - 170)], fill=200, width=3)
d.polygon([(W3 - 70, H3 - 170), (W3 - 86, H3 - 162), (W3 - 78, H3 - 154)], fill=200)
# lettering scratches along the bottom
for k in range(5):
    x = 90 + k * 40
    d.line([(x, H3 - 70), (x + 26, H3 - 70)], fill=130, width=2)
inkm = np.asarray(ink.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255
inkm *= 0.6 + 0.4 * n3                        # broken, dry ink
drag = np.asarray(dragon.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255 * (0.6 + 0.4 * n3)
rgb = rgb * (1 - inkm[..., None] * 0.75) + np.array([0.3, 0.2, 0.1]) * inkm[..., None] * 0.75
rgb = rgb * (1 - drag[..., None] * 0.8) + np.array([0.55, 0.12, 0.08]) * drag[..., None] * 0.8
save(rgb, a, "thror-map")

# ---------------------------------------------------------------- the Horn of Gondor
W4, H4 = 640, 300
yy, xx = np.mgrid[0:H4, 0:W4].astype(np.float32)
# the horn curves from the bell (left, wide) to the mouthpiece (right, narrow)
def centre(t):
    return 100 + t * 460, 190 - 110 * t - 55 * math.sin(math.pi * t)
pts = [centre(i / 200) for i in range(201)]
radius = lambda t: 58 * (1 - t) ** 1.6 + 7
dist = np.full((H4, W4), 1e9, np.float32); tt = np.zeros((H4, W4), np.float32); side = np.zeros((H4, W4), np.float32)
for i, (px, py) in enumerate(pts):
    t = i / 200
    dd2 = np.sqrt((xx - px) ** 2 + (yy - py) ** 2) / radius(t)
    better = dd2 < dist
    dist[better] = dd2[better]; tt[better] = t
    side[better] = ((yy - py) / radius(t))[better]
mask = np.clip((1 - dist) * 18, 0, 1)
# ivory/horn colour, banded and streaked, darkening to the tip
grain = fbm(H4, W4, 30, 4, 41)
ivory = np.array([0.88, 0.8, 0.62]) * (1 - 0.35 * tt)[..., None]
streak = 0.93 + 0.07 * np.sin(tt * 38 + grain * 2.5) - 0.1 * np.clip(fbm(H4, W4, 40, 3, 42) - 0.6, 0, 1)
rgb = ivory * streak[..., None] * (0.9 + 0.15 * grain)[..., None]
light = 0.55 + 0.6 * np.clip(-side, -1, 1) * 0.5 + 0.35 * np.sqrt(np.clip(1 - side ** 2, 0, 1))
rgb *= light[..., None]
# silver bands with engraving, and the silver mouthpiece
for b0 in (0.08, 0.36, 0.62, 0.9):
    band = ((tt > b0) & (tt < b0 + 0.035)).astype(np.float32)
    silver = np.array([0.82, 0.84, 0.86]) * light[..., None] * (0.9 + 0.12 * np.sin(yy * 0.8)[..., None])
    rgb = rgb * (1 - band[..., None]) + silver * band[..., None]
mouth = (tt > 0.95).astype(np.float32)
rgb = rgb * (1 - mouth[..., None]) + (np.array([0.8, 0.82, 0.85]) * light[..., None]) * mouth[..., None]
# the bell opening: a dark ellipse at the wide end
bx, by = centre(0)
bell = np.clip((1 - np.sqrt(((xx - bx + 4) / 16) ** 2 + ((yy - by) / 52) ** 2)) * 10, 0, 1)
rgb = rgb * (1 - bell[..., None] * 0.85) + np.array([0.12, 0.08, 0.05]) * bell[..., None] * 0.85
# leather baldric strap
strap = np.zeros((H4, W4), np.float32)
s_im = Image.new("L", (W4, H4), 0); p0, p1 = centre(0.37), centre(0.63)
ImageDraw.Draw(s_im).line([(p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u + 120 * math.sin(math.pi * u)) for u in [i / 40 for i in range(41)]], fill=255, width=9, joint="curve")
strap = ndimage.gaussian_filter(np.asarray(s_im, np.float32) / 255, 1) * (1 - mask)
rgb = rgb * (1 - strap[..., None]) + np.array([0.36, 0.2, 0.1]) * (0.8 + 0.3 * grain)[..., None] * strap[..., None]
a = np.maximum(mask, strap)
# soft shadow under the horn
sh = ndimage.gaussian_filter(ndimage.shift(a, (10, 6), order=1), 8) * 0.35
rgb = rgb * a[..., None] + np.zeros(3) * (1 - a[..., None])
a_out = np.maximum(a, sh)
save(rgb, a_out, "horn")

# ---------------------------------------------------------------- the One Ring (for the logo mark)
S5 = 128
yy, xx = np.mgrid[0:S5, 0:S5].astype(np.float32)
dx, dy = (xx - S5 / 2) / (S5 / 2), (yy - S5 / 2) / (S5 / 2)
rr = np.sqrt(dx * dx + dy * dy)
R0, R1 = 0.62, 0.92
ring = np.clip((rr - R0) * 60, 0, 1) * np.clip((R1 - rr) * 60, 0, 1)
tube = np.clip((rr - R0) / (R1 - R0), 0, 1)
ny = np.cos((tube - 0.5) * math.pi)          # rounded cross-section
ang = np.arctan2(dy, dx)
key = 0.5 + 0.5 * np.cos(ang + 2.3)          # lit from the top-left
gold = np.array([1.0, 0.78, 0.32])
rgb = gold * (0.25 + 0.75 * ny * (0.45 + 0.55 * key))[..., None]
rgb += (np.exp(-((tube - 0.35) / 0.08) ** 2) * key ** 6 * 0.9)[..., None] * np.array([1, 0.95, 0.8])
rgb = np.clip(rgb, 0, 1)
save(rgb, ring, "ring")
print("ok")

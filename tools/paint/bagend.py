import sys, math
import numpy as np
from paint import *
from scipy import ndimage

c = Canvas(sky((150, 178, 196), (236, 222, 184), horizon=20, top_y=-80))
cl = noise(18, 5, 3)
c.paint(np.clip((cl - 0.5) * 3, 0, 1) * np.clip((10 - Y) / 60, 0, 1), (250, 244, 228), 0.55)  # soft clouds

# distant hills
far = poly([(-90, 10)] + curve(lambda x: (x, 4 - 9 * math.sin((x + 30) / 22) - 4 * math.cos(x / 9)), -90, 90) + [(90, 60), (-90, 60)])
c.paint(far, ramp([(0, (126, 150, 112)), (1, (150, 160, 118))], (Y + 10) / 30), 1)
c.multiply(far, 0.95 + 0.1 * noise(4, 4, 5))

# the Hill
hy = lambda t: 30 - 50 * math.exp(-abs(t / 50) ** 2.4) + 1.5 * math.sin(t / 7)
hill_pts = [(-80, 34)] + curve(lambda t: (t, hy(t)), -80, 80) + [(80, 60), (-80, 60)]
hill = poly(hill_pts)
grass = ramp([(0, (122, 156, 62)), (0.5, (92, 128, 44)), (1, (64, 92, 34))], (Y + 30) / 70)
c.paint(hill, grass)
c.multiply(hill, volume(hill, 14, (-0.7, -0.8), 0.8))
gn = noise(1.2, 3, 11)
c.multiply(hill, 0.85 + 0.3 * gn)                      # grass texture
c.multiply(hill, 0.9 + 0.2 * noise(6, 3, 12))
strokes(c, hill, lambda x, y, r: (70 + r.uniform(0, 70), 110 + r.uniform(0, 60), 30 + r.uniform(0, 30)), 2600, 1.6, 0.25, -math.pi / 2, 0.35, 5, 0.55)
c.multiply(hill, np.clip(0.55 + (30 - Y) / 30, 0.55, 1))  # darker at the foot
# grass fringe along the skyline
edge = np.clip(hill - ndimage.shift(hill, (6, 0), order=1), 0, 1)
strokes(c, np.maximum(edge, 0) * 2, lambda x, y, r: (100 + r.uniform(0, 50), 140 + r.uniform(0, 40), 50), 500, 1.4, 0.25, -math.pi / 2, 0.4, 6, 0.8)

# a big tree on top of the hill
tb = hy(-24) + 2
trunk = poly([(-26.5, tb), (-24.8, tb - 16), (-22.6, tb - 16), (-21, tb)])
c.paint(trunk, (78, 58, 38))
for i, (bx, by, r) in enumerate([(-24, tb-24, 11), (-33, tb-20, 8), (-14, tb-21, 8), (-19, tb-31, 8), (-30, tb-30, 7), (-24, tb-15, 6)]):
    blob = ellipse(bx, by, r, r * 0.85, 1.2)
    leaf = ramp([(0, (110, 142, 56)), (1, (46, 74, 30))], (Y - by + r) / (2 * r) + (X - bx) / (3 * r))
    c.paint(blob, leaf)
foliage = np.clip(sum(ellipse(bx, by, r, r * 0.85, 1.2) for bx, by, r in [(-24, tb-24, 11), (-33, tb-20, 8), (-14, tb-21, 8), (-19, tb-31, 8), (-30, tb-30, 7), (-24, tb-15, 6)]), 0, 1)
c.multiply(foliage, 0.6 + 0.6 * noise(1.4, 3, 21))
c.multiply(foliage, volume(foliage, 6, (-0.7, -0.8), 0.9))
strokes(c, foliage, lambda x, y, r: (60 + r.uniform(0, 70), 90 + r.uniform(0, 70), 30 + r.uniform(0, 20)), 900, 0.8, 0.5, 0, 3, 7, 0.7)

# chimney + smoke
chim = poly([(12, hy(12) + 4), (12, -30), (19, -30), (19, hy(19) + 4)])
c.paint(chim, (132, 92, 70))
c.multiply(chim, 0.85 + 0.3 * noise(1, 2, 31))
c.paint(poly([(11, -30), (20, -30), (20, -32), (11, -32)]), (96, 70, 56))
smoke = lines([curve(lambda t: (15.5 + 4 * math.sin(t / 5) + t * 0.15, -33 - t), 0, 34)], 4, 2.5)
c.paint(smoke * np.clip(1 - (-33 - Y) / 40, 0, 1), (236, 232, 222), 0.6)

# door surround: stone/earth ring, then the round green door
ring = ellipse(0, 14, 15.5, 15.5)
c.shadow(ring, 0, 0, 3, 0.4)
c.paint(ring, (128, 98, 70))
c.multiply(ring, 0.8 + 0.4 * noise(0.8, 2, 41))
door = ellipse(0, 14, 12, 12)
dc = ramp([(0, (52, 122, 66)), (1, (22, 70, 38))], (Y - 2) / 24 + (X + 12) / 60)
c.paint(door, dc)
# planks
for px in range(-10, 12, 3):
    c.multiply(door * np.clip(1 - np.abs(X - px) * 2, 0, 1), 0.7)
c.multiply(door, 0.9 + 0.2 * noise(0.6, 2, 42))
c.multiply(door, volume(door, 3, (-0.6, -0.8), 0.5))
c.multiply(ring - door * 1.0, 1)
inner = ellipse(0, 14, 12, 12) - ellipse(0.8, 14.8, 11, 11)
c.multiply(np.clip(inner, 0, 1), 0.55)                 # inner shadow on the door edge
knob = ellipse(0, 14, 1.8, 1.8, 0.4)
c.paint(knob, ramp([(0, (255, 226, 140)), (1, (150, 104, 30))], (Y - 12.5) / 3 + (X + 1.5) / 4))
c.glow(ellipse(-0.6, 13.4, 0.5, 0.5, 0.3), (255, 240, 200), 0.4, 0.8)

# round windows with a warm glow
for wx in (-28, 28):
    fr = ellipse(wx, 17, 6.8, 6.8)
    c.paint(fr, (110, 84, 60))
    gl = ellipse(wx, 17, 5.2, 5.2)
    c.paint(gl, ramp([(0, (255, 214, 130)), (1, (226, 140, 56))], (Y - 12) / 10))
    c.paint(np.clip(lines([[(wx, 11.5), (wx, 22.5)], [(wx - 5.5, 17), (wx + 5.5, 17)]], 0.9) * gl, 0, 1), (90, 66, 46))
    c.glow(gl, (255, 190, 100), 3.5, 0.35)

# hedges and shrubs around the foot of the hill
rng0 = np.random.default_rng(9)
bush = np.zeros((H, W), np.float32)
for _ in range(26):
    bx = rng0.uniform(-70, 70)
    if abs(bx) < 20: continue
    by = rng0.uniform(22, 30)
    bush = np.maximum(bush, ellipse(bx, by, rng0.uniform(4, 8), rng0.uniform(3, 5), 1))
c.shadow(bush, 1.5, 1.5, 2, 0.5)
c.paint(bush, ramp([(0, (96, 134, 52)), (1, (36, 62, 28))], (Y - 18) / 14))
c.multiply(bush, 0.6 + 0.6 * noise(0.9, 3, 61))
strokes(c, bush, lambda x, y, r: (70 + r.uniform(0, 80), 110 + r.uniform(0, 60), 40), 700, 0.7, 0.45, 0, 3, 8, 0.7)

# path, steps and garden fence
path = poly([(-5, 26)] + curve(lambda t: (-5 - 4 * math.sin(t / 9) - t * 0.05, 26 + t), 0, 34) + curve(lambda t: (6 + 3 * math.sin((34 - t) / 9) + (34 - t) * 0.12, 26 + 34 - t), 0, 34))
c.paint(path, (196, 170, 128))
c.multiply(path, 0.82 + 0.3 * noise(0.9, 3, 51))
fence = lines([[(-58, 36), (-19, 36)], [(-58, 33), (-19, 33)]] + [[(x, 31), (x, 39)] for x in range(-56, -18, 5)]
              + [[(19, 36), (58, 36)], [(19, 33), (58, 33)]] + [[(x, 31), (x, 39)] for x in range(20, 60, 5)], 0.8)
c.shadow(fence, 0.8, 0.8, 0.8, 0.4)
c.paint(fence, (226, 214, 186))
# flowers in the garden
rng = np.random.default_rng(4)
fl = np.zeros((H, W), np.float32)
fc = np.zeros((H, W, 3), np.float32)
for _ in range(140):
    x = rng.uniform(-62, 62); y = rng.uniform(24, 46)
    if abs(x) < 12: continue
    m = ellipse(x, y, 0.9, 0.9, 0.4)
    colr = col([(232, 90, 70), (250, 214, 90), (240, 236, 220), (200, 120, 190)][rng.integers(0, 4)])
    fc = fc * (1 - m[..., None]) + colr * m[..., None]
    fl = np.maximum(fl, m)
c.paint(fl, fc)

v = vignette(0, -6, 74, 58, 10, seed=2)
im = c.save(sys.argv[1], v)

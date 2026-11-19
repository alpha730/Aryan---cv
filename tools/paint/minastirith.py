import sys, math
import numpy as np
from scipy import ndimage
from paint import *

# morning light on the White City: seven tiers of pale stone against Mindolluin
c = Canvas(sky((146, 168, 196), (246, 226, 196), horizon=30, top_y=-80))
c.paint(np.clip((noise(18, 5, 91) - 0.5) * 3, 0, 1) * np.clip((10 - Y) / 70, 0, 1), (252, 244, 232), 0.5)

mt = poly(jag([(-90, 44), (-60, 30), (-28, -24), (-13, -48), (-3, -34), (8, -62), (20, -38), (30, -44), (60, 24), (90, 40), (90, 60), (-90, 60)], 1.4, 2, 92))
c.paint(mt, ramp([(0, (156, 150, 150)), (1, (96, 92, 96))], (Y + 60) / 100))
c.multiply(mt, volume(mt, 6, (-0.7, -0.6), 1.0))
c.multiply(mt, 0.72 + 0.45 * noise(2, 4, 93))
strokes(c, mt, lambda x, y, r: (150 + r.uniform(0, 60),) * 2 + (150 + r.uniform(0, 60),), 900, 2.4, 0.3, math.pi / 2 + 0.3, 0.3, 94, 0.3)
c.paint(mt * np.clip((-36 - Y) / 6 + noise(1.6, 3, 95) * 1.6 - 0.7, 0, 1), (246, 246, 246), 0.85)

# Pelennor fields
fld = poly([(-90, 40), (90, 38), (90, 80), (-90, 80)])
c.paint(fld, ramp([(0, (150, 152, 96)), (1, (100, 104, 60))], (Y - 38) / 30))
c.multiply(fld, 0.85 + 0.3 * noise(2, 3, 96))

# the seven circles, bottom to top, each a lit drum of stone with a darker band of shadow
for i in range(7):
    w = 46 - i * 5.6
    y = 42 - i * 8.6
    top = y - 8.6
    ry = 3.4 - i * 0.25
    pts = [(-w, top)] + [(-w, y)] + curve(lambda a: (w * math.cos(a), y + ry * math.sin(a)), math.pi, 0, 40) + [(w, top)] + curve(lambda a: (w * math.cos(a), top + ry * math.sin(a)), 0, math.pi, 40)
    m = poly(pts)
    c.shadow(m, 0, 1.5, 1.5, 0.35)
    shade = np.clip(0.5 + 0.5 * (-X / w), 0, 1)  # lit from the left
    c.paint(m, lerp3((244, 240, 230), (170, 166, 162), 1 - shade))
    c.multiply(m, 0.88 + 0.18 * noise(0.5, 2, 100 + i))
    # battlements and windows
    crenel = lines([[(x, top + ry * 0.2 - 0.5), (x, top + ry * 0.2 + 0.6)] for x in np.arange(-w + 1, w, 1.6)], 0.5, 0.2)
    c.multiply(crenel * m, 0.75)
    rng = np.random.default_rng(i + 7)
    for _ in range(int(w / 3)):
        wx = rng.uniform(-w + 2, w - 2); wy = rng.uniform(top + 3, y + 1)
        c.paint(poly([(wx - 0.4, wy + 1), (wx - 0.4, wy), (wx + 0.4, wy), (wx + 0.4, wy + 1)], 0.2), (90, 86, 90), 0.7)
    # roofs of houses peeking over each wall
    for _ in range(int(w / 2.5)):
        rx = rng.uniform(-w + 2, w - 2)
        c.paint(poly([(rx - 1.3, top + 0.3), (rx, top - 1.6), (rx + 1.3, top + 0.3)], 0.3), (120, 116, 124), 0.85)

# the great prow of rock splitting the city
prow = poly([(-1.6, 33.4), (-0.8, -18.2), (0.8, -18.2), (1.6, 33.4)])
c.shadow(prow, 1.2, 0, 1, 0.35)
c.paint(prow, ramp([(0, (226, 222, 214)), (1, (140, 136, 134))], (X + 1.6) / 3.2))
# the White Tower of Ecthelion
tower = poly([(-2.4, -17), (-2.4, -40), (0, -48), (2.4, -40), (2.4, -17)])
c.shadow(tower, 1, 0.5, 1, 0.4)
c.paint(tower, ramp([(0, (252, 250, 244)), (1, (178, 174, 172))], (X + 2.4) / 4.8))
c.glow(tower, (255, 250, 230), 3, 0.3)
c.paint(lines([[(0, -48), (0, -57)]], 0.4), (90, 80, 70))
flag = poly(curve(lambda t: (t, -57 + 0.8 * math.sin(t / 1.6)), 0, 10) + curve(lambda t: (t, -54 + 0.8 * math.sin(t / 1.6) - t * 0.12), 10, 0))
c.paint(flag, (30, 30, 34))
c.paint(ellipse(4, -55, 1.2, 1.0, 0.3), (240, 240, 236), 0.9)
# the great gate
gate = poly([(-3.5, 45.4), (-3.5, 39.4), (0, 36), (3.5, 39.4), (3.5, 45.4)])
c.paint(gate, (60, 56, 60))

v = vignette(0, -8, 72, 60, 10, seed=8)
c.save(sys.argv[1], v)

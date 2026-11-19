import sys, math
import numpy as np
from scipy import ndimage
from paint import *

# sunset over the Gulf of Lune: white towers on the quay, the last ship with a silver sail
c = Canvas(sky((92, 104, 150), (250, 206, 150), horizon=4, top_y=-80))
sun = ellipse(-56, -2, 9, 9, 1)
c.glow(sun, (255, 210, 140), 16, 0.7)
c.paint(sun, (255, 240, 210), 0.9)
c.paint(np.clip((noise(16, 5, 101) - 0.52) * 3, 0, 1) * np.clip((0 - Y) / 70, 0, 1), (246, 196, 170), 0.5)

# sea
sea = poly([(-90, 4), (90, 4), (90, 80), (-90, 80)])
c.paint(sea, ramp([(0, (196, 170, 160)), (0.3, (102, 120, 146)), (1, (46, 62, 90))], (Y - 4) / 40))
strokes(c, sea, lambda x, y, r: (240 + r.uniform(0, 15), 200 + r.uniform(0, 40), 150 + r.uniform(0, 50)) if abs(x / PX - O / PX - (-56)) < 18 else (150 + r.uniform(0, 60), 168 + r.uniform(0, 50), 196), 1100, 2.4, 0.22, 0, 0.04, 102, 0.55)
c.glow(poly([(-60, 4), (-52, 4), (-46, 40), (-66, 40)]), (255, 200, 140), 3, 0.35)

# far headland
hd = poly(jag([(20, 4), (40, -2), (60, -6), (90, -4), (90, 6)], 0.6, 2, 103))
c.paint(hd, (118, 112, 128))

# quay, towers
quay = poly(jag([(22, -10), (72, -10), (80, 6), (60, 9), (40, 8), (24, 6), (18, 3)], 0.5, 2, 104))
c.paint(quay, ramp([(0, (176, 166, 152)), (1, (104, 98, 96))], (Y + 10) / 18))
c.multiply(quay, 0.8 + 0.3 * noise(0.7, 3, 105))
c.multiply(quay * lines([[(16, y), (80, y)] for y in range(-8, 10, 3)], 0.2), 0.85)

def tower(x0, x1, top, base, cone):
    m = poly([(x0, base), (x0, top), (x1, top), (x1, base)])
    c.shadow(m, -1.5, 0.5, 1.5, 0.35)
    c.paint(m, ramp([(0, (172, 168, 176)), (1, (252, 240, 222))], (X - x0) / (x1 - x0)))  # sunset light from the left... warm on the right edge from sky
    c.multiply(m, 0.92 + 0.12 * noise(0.5, 2, int(x0)))
    cm = poly([(x0 - 1.5, top), ((x0 + x1) / 2, top - cone), (x1 + 1.5, top)])
    c.paint(cm, ramp([(0, (150, 140, 160)), (1, (90, 88, 110))], (X - x0) / (x1 - x0)))
    for wy in np.arange(top + 4, base - 3, 6):
        c.paint(poly([((x0 + x1) / 2 - 0.6, wy + 2), ((x0 + x1) / 2 - 0.6, wy), ((x0 + x1) / 2 + 0.6, wy), ((x0 + x1) / 2 + 0.6, wy + 2)], 0.2), (255, 210, 130), 0.9)
tower(34, 41, -40, -10, 14)
tower(56, 62, -36, -10, 12)
tower(45, 53, -50, -10, 18)

# the ship
hull = poly(curve(lambda t: (t, 4 + 0.012 * (t + 15) ** 2 * 0), -42, 12, 10) + [(12, 3)] + curve(lambda t: (t, 4 + 9 * math.sin(math.pi * (t + 42) / 54) * 0.9), 12, -42, 40))
c.shadow(hull, 1, 2, 2, 0.4)
c.paint(hull, ramp([(0, (210, 206, 210)), (1, (130, 124, 140))], (Y - 2) / 12))
c.multiply(hull, volume(hull, 3, (-0.7, -0.7), 0.6))
c.paint(lines([curve(lambda t: (-42 - 6 * math.sin(t * 2.4), 4 - t * 22), 0, 1, 20), curve(lambda t: (12 + 4 * math.sin(t * 2.5), 3 - t * 14), 0, 1, 20)], 1.4), (220, 214, 214))
c.paint(lines([[(-14, 7), (-14, -38)]], 0.7), (110, 96, 90))
sail = poly(curve(lambda t: (-29 + t * 30, -32 + 0 * t), 0, 1, 10) + curve(lambda t: (1 + 4 * math.sin(math.pi * t), -32 + 29 * t), 0, 1, 20) + curve(lambda t: (1 - t * 30, -3), 0, 1, 10) + curve(lambda t: (-29 + 3.5 * math.sin(math.pi * t), -3 - 29 * t), 0, 1, 20))
c.paint(sail, ramp([(0, (255, 246, 236)), (1, (196, 190, 206))], (X + 29) / 34))
c.multiply(sail, volume(sail, 4, (-0.8, -0.4), 0.5))
c.glow(sail, (255, 230, 200), 3, 0.25)
c.paint(lines([[(-14, -35), (-36, 4)], [(-14, -35), (8, 4)]], 0.25), (90, 80, 80), 0.6)
# a star over the mast
for (sx, sy, r) in [(-14, -45, 1.4), (-62, -40, 1.0)]:
    c.glow(ellipse(sx, sy, r * 0.4, r * 0.4, 0.2), (255, 250, 230), r * 1.2, 1.0)
    c.paint(lines([[(sx - r * 2, sy), (sx + r * 2, sy)], [(sx, sy - r * 2), (sx, sy + r * 2)]], 0.2, 0.3), (255, 252, 236), 0.9)
# reflection of the sail
p = int(O + 6 * PX)
idx = np.clip(2 * p - np.arange(H), 0, H - 1)
c.paint(sail[idx, :] * ndimage.gaussian_filter(sea, 2) * (0.6 + 0.4 * noise(1.5, 2, 106)), (240, 230, 220), 0.22)

v = vignette(0, -10, 76, 56, 10, seed=9)
c.save(sys.argv[1], v)

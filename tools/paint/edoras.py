import sys, math
import numpy as np
from scipy import ndimage
from paint import *

# golden afternoon over the plains of Rohan; Meduseld on its green hill, banners in the wind
c = Canvas(sky((128, 160, 192), (244, 226, 180), horizon=20, top_y=-80))
c.paint(np.clip((noise(20, 5, 81) - 0.5) * 3, 0, 1) * np.clip((0 - Y) / 60, 0, 1), (252, 244, 226), 0.55)

# white mountains behind
mt = poly(jag([(-90, 10), (-64, -18), (-50, -10), (-34, -34), (-18, -20), (-6, -26), (14, -12), (40, -36), (58, -20), (90, -4), (90, 40), (-90, 40)], 1.2, 2.5, 82))
c.paint(mt, ramp([(0, (150, 160, 180)), (1, (112, 120, 116))], (Y + 30) / 34))
c.multiply(mt, volume(mt, 6, (-0.7, -0.6), 0.6))
c.paint(mt * np.clip((-14 - Y) / 6 + noise(2, 3, 83) * 1.6 - 0.7, 0, 1), (246, 246, 244), 0.85)
c.paint(mt, (220, 220, 226), 0.15)

# plains
pl = poly(jag([(-90, 4), (-40, 2), (0, 5), (40, 1), (90, 4)], 0.6, 3, 9) + [(90, 80), (-90, 80)])
c.paint(pl, ramp([(0, (196, 176, 96)), (1, (150, 128, 60))], (Y - 20) / 40))
c.multiply(pl, 0.85 + 0.3 * noise(3, 4, 84))
strokes(c, pl, lambda x, y, r: (190 + r.uniform(0, 50), 160 + r.uniform(0, 50), 70), 1200, 1.4, 0.25, -math.pi / 2 + 0.3, 0.3, 85, 0.45)

# the hill
hy = lambda t: 38 - 46 * math.exp(-abs(t / 40) ** 2.2)
hill = poly([(-80, 40)] + curve(lambda t: (t, hy(t)), -80, 80) + [(80, 80), (-80, 80)])
c.shadow(hill, 2, 1, 3, 0.3)
c.paint(hill, ramp([(0, (150, 160, 70)), (1, (88, 102, 44))], (Y + 8) / 50))
c.multiply(hill, volume(hill, 12, (-0.7, -0.7), 0.7))
c.multiply(hill, 0.8 + 0.35 * noise(1.2, 3, 86))
strokes(c, hill, lambda x, y, r: (130 + r.uniform(0, 70), 140 + r.uniform(0, 50), 50 + r.uniform(0, 30)), 1600, 1.2, 0.25, -math.pi / 2, 0.4, 87, 0.5)

# the palisade wall around the hill
fence = []
for x in range(-54, 50, 2):
    y = 26 + 9 * (1 - (x / 54) ** 2)
    fence.append([(x, y), (x, y + 4.5)])
fm = lines(fence, 0.9, 0.3)
c.shadow(fm, 0.6, 0.8, 0.8, 0.4)
c.paint(fm, ramp([(0, (150, 112, 70)), (1, (90, 64, 40))], (X + 54) / 110))
c.paint(lines([curve(lambda x: (x, 26 + 9 * (1 - (x / 54) ** 2) + 0.3), -54, 48)], 0.6), (80, 56, 36))

# houses of the town
rng = np.random.default_rng(88)
for x, y, s in [(-36, 14, 1.0), (31, 12, 1.0), (-14, 10, 0.8), (12, 14, 0.8), (-26, 22, 0.75), (22, 21, 0.75), (2, 22, 0.7), (-44, 24, 0.7), (40, 22, 0.7)]:
    w = 5 * s; hh = 5 * s
    wall = poly([(x - w, y + hh), (x - w, y), (x + w, y), (x + w, y + hh)])
    c.shadow(wall, 1, 0.8, 1, 0.45)
    c.paint(wall, (140, 100, 62)); c.multiply(wall, 0.8 + 0.3 * noise(0.4, 2, int(x) + 300))
    roof = poly([(x - w - 1.5, y + 0.5), (x, y - 5.5 * s), (x + w + 1.5, y + 0.5)])
    c.paint(roof, ramp([(0, (222, 184, 96)), (1, (150, 112, 50))], (X - x + w) / (2 * w)))
    strokes(c, roof, lambda xx, yy, r: (230, 196, 110), 60, 1.2, 0.2, math.pi / 2, 0.2, int(x) + 400, 0.5)
    c.paint(ellipse(x + w * 0.3, y + hh * 0.5, 0.8, 1.0, 0.3), (255, 200, 110), 0.9)

# Meduseld: timber hall with a golden thatched roof and crossed gable horns
hall = poly([(-17, -8), (-17, -20), (17, -20), (17, -8)])
c.shadow(hall, 1.5, 1, 1.5, 0.5)
c.paint(hall, ramp([(0, (160, 110, 64)), (1, (96, 62, 36))], (X + 17) / 34))
for px in range(-15, 17, 3):
    c.multiply(hall * np.clip(1 - np.abs(X - px) * 1.5, 0, 1), 0.65)
door = poly([(-2.5, -8), (-2.5, -14), (0, -16), (2.5, -14), (2.5, -8)])
c.paint(door, (50, 30, 20))
c.glow(door, (255, 170, 80), 1, 0.25)
roof = poly([(-21, -19.5), (0, -40), (21, -19.5)])
c.paint(roof, ramp([(0, (250, 214, 110)), (0.6, (214, 164, 60)), (1, (150, 104, 36))], (X + 21) / 42 + (Y + 40) / 120))
strokes(c, roof, lambda x, y, r: (250, 210 + r.uniform(0, 30), 110 + r.uniform(0, 40)), 260, 2, 0.22, math.pi / 2 - 0.4, 0.3, 89, 0.6)
c.multiply(roof, 0.85 + 0.3 * noise(0.6, 2, 90))
c.glow(roof, (255, 220, 120), 3, 0.25)
c.paint(lines([[(-4, -36), (5, -47)], [(4, -36), (-5, -47)]], 0.8), (120, 80, 40))
# steps
c.paint(poly([(-4, -8), (4, -8), (6, 2), (-6, 2)]), (180, 168, 140))
c.multiply(lines([[(-6, y), (6, y)] for y in np.arange(-6, 2, 1.6)], 0.25), 0.7)
# banner
c.paint(lines([[(21, -20), (21, -52)]], 0.6), (70, 50, 30))
flag = poly(curve(lambda t: (21 + t, -51 + 1.4 * math.sin(t / 2.2)), 0, 14) + curve(lambda t: (21 + t, -45 + 1.4 * math.sin(t / 2.2) - t * 0.15), 14, 0))
c.paint(flag, ramp([(0, (40, 110, 60)), (1, (24, 70, 40))], (X - 21) / 14))
c.paint(ellipse(27, -47.5, 1.8, 1.4, 0.3), (240, 236, 220), 0.9)

v = vignette(0, -8, 74, 58, 10, seed=7)
c.save(sys.argv[1], v)

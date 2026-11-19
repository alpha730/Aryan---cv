import sys, math
import numpy as np
from scipy import ndimage
from paint import *

c = Canvas(sky((118, 150, 176), (240, 224, 186), horizon=10, top_y=-80))
c.paint(np.clip((noise(16, 5, 31) - 0.55) * 3, 0, 1) * np.clip((0 - Y) / 50, 0, 1), (252, 246, 232), 0.5)

def rock(pts, base, seed, light=(-0.7, -0.6)):
    m = poly(jag(pts, 1.6, 2.2, seed))
    c.paint(m, ramp([(0, base[0]), (1, base[1])], (Y + 50) / 100))
    c.multiply(m, volume(m, 5, light, 1.1))
    strata = noise(2.5, 4, seed)
    c.multiply(m, 0.7 + 0.5 * strata)
    strokes(c, m, lambda x, y, r: (90 + r.uniform(0, 70),) * 2 + (80 + r.uniform(0, 60),), 900, 2.2, 0.3, math.pi / 2 + 0.15, 0.25, seed, 0.35)
    return m

# far mountains with snow
far = poly([(-90, 0), (-50, -30), (-30, -20), (-8, -52), (10, -34), (24, -46), (50, -18), (90, -6), (90, 30), (-90, 30)])
c.paint(far, ramp([(0, (150, 160, 176)), (1, (178, 182, 186))], (Y + 50) / 70))
c.multiply(far, volume(far, 6, (-0.7, -0.6), 0.6))
snow = far * np.clip((-30 - Y) / 6 + noise(2, 3, 33) * 1.5 - 0.6, 0, 1)
c.paint(snow, (246, 246, 244), 0.85)
c.paint(far, (210, 214, 222), 0.25)   # haze

# valley floor, trees
floor = poly([(-90, 20), (90, 16), (90, 80), (-90, 80)])
c.paint(floor, ramp([(0, (98, 122, 64)), (1, (58, 84, 40))], (Y - 16) / 40))
c.multiply(floor, 0.8 + 0.4 * noise(1.5, 3, 34))

# cliffs left and right
L = rock([(-90, 60), (-90, -6), (-74, -14), (-62, -30), (-54, -26), (-46, -40), (-38, -30), (-34, -6), (-26, 10), (-22, 40), (-16, 60)], ((150, 136, 116), (88, 80, 70)), 35)
R = rock([(90, 60), (90, -10), (74, -22), (62, -42), (52, -34), (44, -36), (36, -14), (32, 8), (30, 40), (24, 60)], ((140, 128, 112), (82, 76, 66)), 36, (-0.9, -0.3))

# waterfalls down the left cliff
fall = lines([curve(lambda t: (-37 + 0.12 * t - 0.5 * math.sin(t / 6), -28 + t), 0, 66), curve(lambda t: (-31 + 0.1 * t - 0.4 * math.sin(t / 5), -8 + t), 0, 46)], 3.4, 1.0)
c.paint(fall, ramp([(0, (232, 242, 248)), (1, (190, 214, 228))], (Y + 4) / 46))
streak = fall * (0.7 + 0.6 * np.clip(noise(0.5, 2, 37) * 1.5 - 0.3, 0, 1))
c.multiply(fall, 0.85 + 0.25 * noise(0.4, 2, 38))
mist = ellipse(-30, 36, 13, 6, 4)
c.paint(mist, (240, 244, 246), 0.6)

# pines on the slopes
rng = np.random.default_rng(3)
pines = np.zeros((H, W), np.float32)
for _ in range(34):
    side = rng.choice([-1, 1])
    x = side * rng.uniform(28, 72); y = rng.uniform(22, 38)
    h = rng.uniform(8, 14)
    pines = np.maximum(pines, poly([(x, y - h), (x - h * 0.28, y), (x + h * 0.28, y)], 0.5))
c.shadow(pines, 1, 1, 1.2, 0.4)
c.paint(pines, ramp([(0, (70, 100, 56)), (1, (28, 52, 32))], (X + 60) / 120 * 0.4 + 0.4))
strokes(c, pines, lambda x, y, r: (40 + r.uniform(0, 60), 70 + r.uniform(0, 60), 40), 600, 0.6, 0.35, 0.5, 1.5, 39, 0.6)

# the Last Homely House: pale walls, slate roofs, warm windows
def building(x0, x1, y_top, y_bot, roof_h, pitch_peak=None):
    wall = poly([(x0, y_bot), (x0, y_top), (x1, y_top), (x1, y_bot)])
    c.shadow(wall, 1.5, 1, 1.8, 0.45)
    c.paint(wall, ramp([(0, (244, 236, 214)), (1, (206, 194, 168))], (X - x0) / (x1 - x0)))
    c.multiply(wall, 0.9 + 0.15 * noise(0.6, 2, int(x0) + 50))
    px = pitch_peak if pitch_peak is not None else (x0 + x1) / 2
    roof = poly([(x0 - 2, y_top + 0.5), (px, y_top - roof_h), (x1 + 2, y_top + 0.5)])
    c.paint(roof, ramp([(0, (110, 124, 140)), (1, (60, 70, 86))], (X - x0) / (x1 - x0)))
    c.multiply(roof, 0.85 + 0.25 * noise(0.5, 2, int(x0) + 60))
    return wall

building(17, 29, -10, 24, 19)
building(-14, 18, 5, 24, 19)
building(-26, -14, 12, 24, 9)
win = np.zeros((H, W), np.float32)
for (x, y0, y1, w) in [(2, 15, 24, 2.6), (-7, 12, 17, 1.8), (12, 12, 17, 1.8), (23, -2, 4, 1.8), (23, 13, 19, 1.8), (-20, 17, 21, 1.6)]:
    win = np.maximum(win, poly([(x - w, y1), (x - w, y0), (x, y0 - w), (x + w, y0), (x + w, y1)], 0.4))
c.paint(win, (255, 208, 120))
c.glow(win, (255, 190, 100), 2, 0.35)
# terrace and stair
terr = poly([(-32, 24), (34, 24), (34, 30), (-32, 30)])
c.paint(terr, (196, 184, 160))
c.multiply(terr, 0.85 + 0.25 * noise(0.5, 2, 70))
cols = lines([[(x, 24), (x, 30)] for x in range(-30, 36, 4)], 0.5)
c.multiply(cols, 0.6)

# river and the bridge
river = poly(curve(lambda t: (t, 40 - 2 * math.sin(t / 10) + 0.04 * t), -90, 90) + curve(lambda t: (t, 46 - 1.5 * math.sin(t / 12)), 90, -90))
c.paint(river, ramp([(0, (150, 180, 196)), (1, (90, 124, 146))], (X + 90) / 180))
c.multiply(river, 0.85 + 0.3 * noise(0.8, 2, 71))
strokes(c, river, lambda x, y, r: (232, 240, 244), 200, 2, 0.25, 0, 0.1, 72, 0.5)
bridge = lines([curve(lambda t: (t, 36 + 0.012 * (t + 13) ** 2 - 2.5), -30, 4)], 2.2)
c.shadow(bridge, 0.5, 2, 1.5, 0.5)
c.paint(bridge, (212, 202, 180))

v = vignette(0, -4, 76, 62, 10, seed=4)
c.save(sys.argv[1], v)

import sys, math
import numpy as np
from scipy import ndimage
from paint import *

# night at the West-gate: a sheer cliff, the still black lake, the doors drawn in starlit silver
c = Canvas(sky((22, 30, 52), (70, 82, 108), horizon=30, top_y=-80))
rng = np.random.default_rng(61)
for _ in range(60):
    c.glow(ellipse(rng.uniform(-80, 80), rng.uniform(-80, -20), 0.25, 0.25, 0.2), (230, 236, 255), 0.35, 0.8)
c.paint(ellipse(48, -58, 7, 7, 0.6), (236, 236, 222))
c.glow(ellipse(48, -58, 7, 7), (190, 200, 230), 10, 0.45)

cliff = poly(jag([(-90, 60), (-88, 8), (-64, 6), (-60, 8), (-52, -18), (-44, -26), (-38, -44), (-26, -38), (-14, -52), (-2, -44), (8, -56), (20, -44), (32, -50), (42, -30), (52, -22), (58, 4), (64, 4), (90, 10), (90, 60)], 1.6, 2, 62))
c.paint(cliff, ramp([(0, (96, 102, 116)), (1, (40, 44, 56))], (Y + 50) / 100))
c.multiply(cliff, volume(cliff, 6, (0.6, -0.7), 1.0))
c.multiply(cliff, 0.6 + 0.6 * noise(2.2, 4, 63))
strokes(c, cliff, lambda x, y, r: (70 + r.uniform(0, 70), 76 + r.uniform(0, 70), 96 + r.uniform(0, 60)), 1600, 2.0, 0.3, math.pi / 2 + 0.1, 0.3, 64, 0.35)
# the face of the wall is smooth where the doors are cut
face = poly([(-26, 44), (-26, -2), (-18, -16), (0, -22), (18, -16), (26, -2), (26, 44)], 2.5)
c.paint(face, (58, 62, 74), 0.6)
c.multiply(face, 0.85 + 0.25 * noise(0.8, 2, 65))

# the Doors: arch, pillars, tree, crown, star, all in moonlit ithildin
def tr(px, py):
    return (-25.5 + px * 0.085, -28 + py * 0.085)
def svg_pts(seq):
    return [tr(*p) for p in seq]
arch = curve(lambda a: tr(300 + 189 * math.cos(a), 348 - 189 * math.sin(a)), math.pi, 0, 60)
door_lines = [svg_pts([(96, 792), (96, 360)]), svg_pts([(126, 792), (126, 360)]), svg_pts([(474, 792), (474, 360)]), svg_pts([(504, 792), (504, 360)]),
              curve(lambda a: tr(300 + 204 * math.cos(a), 348 - 204 * math.sin(a)), math.pi, 0, 60),
              curve(lambda a: tr(300 + 174 * math.cos(a), 348 - 174 * math.sin(a)), math.pi, 0, 60)]
for sgn in (1, -1):
    for seg in [[(150, 792), (154, 660), (146, 540), (168, 444), (180, 392), (210, 350), (252, 322)], [(166, 470), (196, 440), (230, 424), (262, 424)],
                [(160, 560), (192, 526), (226, 512), (258, 514)], [(172, 404), (204, 372), (236, 360), (268, 362)], [(156, 650), (186, 618), (214, 606), (244, 610)]]:
        pts = seg if sgn == 1 else [(600 - x, y) for x, y in seg]
        door_lines.append(bezier(*[tr(*p) for p in pts[:4]]) + ([tr(*p) for p in pts[4:]] if len(pts) > 4 else []))
star = []
for i in range(17):
    a = -math.pi / 2 + i * math.pi / 8
    rr = 78 if i % 2 == 0 else 30
    star.append(tr(300 + math.cos(a) * rr, 540 + math.sin(a) * rr))
door_lines.append(star)
door_lines.append(svg_pts([(276, 436), (282, 414), (292, 428), (300, 408), (308, 428), (318, 414), (324, 436), (276, 436)]))
for k in range(7):
    a = -math.pi / 2 + (k - 3) * 0.3
    x, y = 300 + math.cos(a) * 150, 540 + math.sin(a) * 150
    door_lines += [svg_pts([(x - 9, y), (x + 9, y)]), svg_pts([(x, y - 9), (x, y + 9)])]
ith = lines(door_lines, 0.5, 0.35)
c.glow(ith, (170, 200, 255), 2.2, 0.75)
c.paint(ith, (226, 236, 255), 0.95)

# holly trees by the gate
for hx in (-44, 44):
    c.paint(poly([(hx - 1, 44), (hx - 0.7, 34), (hx + 0.7, 34), (hx + 1, 44)]), (30, 26, 26))
    h = poly(jag([(hx, 12), (hx - 9, 24), (hx - 7, 34), (hx, 37), (hx + 7, 34), (hx + 9, 24), (hx, 12)], 1, 1.4, hx + 70))
    c.paint(h, ramp([(0, (52, 74, 66)), (1, (14, 26, 26))], (Y - 12) / 26 + (X - hx) / 30))
    c.multiply(h, 0.6 + 0.6 * noise(0.8, 3, hx + 71))
    strokes(c, h, lambda x, y, r: (30 + r.uniform(0, 50), 56 + r.uniform(0, 50), 56), 360, 0.6, 0.45, 0, 3, hx + 72, 0.6)

# the dark lake, with the doors' reflection
lake = poly([(-90, 46)] + curve(lambda t: (t, 45 + 0.8 * math.sin(t / 6)), -90, 90) + [(90, 80), (-90, 80)])
c.paint(lake, ramp([(0, (40, 50, 70)), (1, (12, 16, 26))], (Y - 44) / 20))
p = int(O + 45 * PX)
idx = np.clip(2 * p - np.arange(H), 0, H - 1)
refl = ith[idx, :]
wav = 0.5 + 0.5 * np.sin(Y * 3.2 + noise(1, 2, 73) * 6)
c.paint(refl * lake * wav, (170, 190, 230), 0.35)
strokes(c, lake, lambda x, y, r: (120, 136, 170), 160, 3, 0.2, 0, 0.05, 74, 0.35)

v = vignette(0, -6, 74, 58, 10, seed=6)
c.save(sys.argv[1], v, grade=False)

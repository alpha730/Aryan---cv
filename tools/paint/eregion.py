import sys, math
import numpy as np
from scipy import ndimage
from paint import *

# dusk over the ruined forges: warm sky, cold stone, a gold ring glowing in the anvil's heat
c = Canvas(sky((96, 104, 132), (236, 188, 128), horizon=26, top_y=-80))
c.paint(np.clip((noise(14, 5, 41) - 0.5) * 3, 0, 1) * np.clip((10 - Y) / 60, 0, 1), (250, 214, 170), 0.45)

ground = poly(jag([(-90, 28), (-40, 26), (0, 29), (40, 26), (90, 28)], 0.8, 3, 2) + [(90, 80), (-90, 80)])
c.paint(ground, ramp([(0, (122, 112, 74)), (1, (70, 64, 46))], (Y - 26) / 30))
c.multiply(ground, 0.75 + 0.45 * noise(1.2, 3, 42))
strokes(c, ground, lambda x, y, r: (110 + r.uniform(0, 60), 110 + r.uniform(0, 50), 60), 900, 1.2, 0.25, -math.pi / 2, 0.5, 43, 0.5)

def stone(pts, seed, light=(-0.7, -0.6), tone=((196, 186, 170), (120, 112, 104))):
    m = poly(jag(pts, 0.6, 1.5, seed))
    c.shadow(m, 2, 1.5, 2, 0.4)
    c.paint(m, ramp([(0, tone[0]), (1, tone[1])], (X + 40) / 100 + (Y + 40) / 160))
    c.multiply(m, volume(m, 2.5, light, 0.9))
    c.multiply(m, 0.72 + 0.4 * noise(0.9, 3, seed))
    blocks = lines([[(x, -60), (x, 40)] for x in range(-60, 60, 4)] + [[(-70, y), (70, y)] for y in range(-60, 40, 3)], 0.25, 0.3)
    c.multiply(m * blocks, 0.75)
    moss = m * np.clip(noise(2, 3, seed + 5) * 2 - 1.1, 0, 1)
    c.paint(moss, (96, 112, 56), 0.6)
    return m

# broken arch
stone([(-37, -16), (-30, -34), (-20, -46), (-4, -52), (1, -45), (-5, -43), (-16, -38), (-24, -28), (-27, -16)], 44)
stone([(-36, 30), (-36, -12), (-26, -12), (-26, 30)], 45)
stone([(-39, -12), (-23, -12), (-23, -17), (-39, -17)], 46)
# broken pillar on the right
stone([(26, 30), (26, -2), (29, -7), (32, -3), (36, -8), (36, 30)], 47, (-0.9, -0.3))
stone([(40, 30), (42, 23), (51, 24), (52, 30)], 48)
stone([(-21, 30), (-20, 25), (-12, 25), (-11, 30)], 49)

# holly trees
for hx in (-56, 56):
    trunk = poly([(hx - 1.2, 30), (hx - 0.8, 16), (hx + 0.8, 16), (hx + 1.2, 30)])
    c.paint(trunk, (70, 52, 38))
    h = poly(jag([(hx, -14), (hx - 11, 4), (hx - 9, 18), (hx, 21), (hx + 9, 18), (hx + 11, 4), (hx, -14)], 1.2, 1.6, hx + 100))
    c.shadow(h, 1.5, 1.5, 1.8, 0.4)
    c.paint(h, ramp([(0, (60, 96, 50)), (1, (20, 44, 28))], (Y + 14) / 36 + (X - hx) / 40))
    c.multiply(h, 0.6 + 0.6 * noise(0.8, 3, hx + 200))
    strokes(c, h, lambda x, y, r: (40 + r.uniform(0, 70), 80 + r.uniform(0, 60), 40), 500, 0.6, 0.45, 0, 3, hx + 300, 0.7)
    rng = np.random.default_rng(hx + 400)
    for _ in range(10):
        bx, by = hx + rng.uniform(-7, 7), rng.uniform(-4, 16)
        c.paint(ellipse(bx, by, 0.9, 0.9, 0.3), (200, 30, 34))

# the anvil on its block
block = poly([(-9, 30), (-9, 22), (9, 22), (9, 30)])
c.paint(block, (110, 76, 50)); c.multiply(block, 0.7 + 0.4 * noise(0.5, 2, 50))
anvil = poly([(-14, 10), (10, 10), (18, 7), (18, 12), (9, 12), (7, 15), (6, 18), (7, 22), (-7, 22), (-6, 18), (-7, 15), (-9, 13), (-14, 13)])
c.shadow(anvil, 1, 1, 1.2, 0.5)
c.paint(anvil, ramp([(0, (150, 150, 156)), (0.35, (70, 72, 80)), (1, (30, 30, 36))], (Y - 9) / 14))
c.multiply(anvil, volume(anvil, 1.5, (-0.6, -0.8), 0.8))
# heat on the face of the anvil
c.glow(ellipse(-1, 10, 6, 1, 0.5), (255, 150, 60), 3, 0.5)
# hammer leaning on the pillar
c.paint(lines([[(16, 30), (27, 2)]], 1.0), (96, 70, 46))
c.paint(poly([(22, -2), (31, 1.4), (29, 6.8), (20, 3.4)]), (64, 64, 70))

# the Ring above the anvil: gold, glowing, with fire-letters
ring = np.clip(ellipse(-1, -8, 7, 7, 0.4) - ellipse(-1, -8, 4.8, 4.8, 0.4), 0, 1)
c.glow(ring, (255, 196, 90), 7, 0.9)
c.paint(ring, ramp([(0, (255, 240, 170)), (0.5, (230, 170, 50)), (1, (150, 90, 20))], (Y + 15) / 14 + (X + 8) / 30))
c.multiply(ring, volume(ring, 1.2, (-0.6, -0.8), 0.7))
c.glow(ellipse(-4, -12, 0.8, 0.8, 0.3), (255, 255, 230), 0.8, 0.9)
# sparks
rng = np.random.default_rng(51)
for _ in range(30):
    sx, sy = rng.normal(-1, 9), rng.uniform(-30, 8)
    c.glow(ellipse(sx, sy, 0.35, 0.35, 0.2), (255, 170, 70), 0.6, 0.9)

v = vignette(0, -6, 74, 58, 10, seed=5)
c.save(sys.argv[1], v)

/**
 * MorphEngine — GPU particles that melt and flow between painted emblems.
 *
 * Built on the WebGL2 engine of "Liquid Sculpture Hero" by Guglielmo
 * Giannattasio (guglielmogiannattasio.it, MIT license, via 21st.dev): the flow
 * map, curl-noise turbulence, capsule particles and the crisp-image cross-fade
 * come from there. The full-screen stage, the morphing between emblems and the
 * scroll keyframes were added for this site. Without WebGL2 the page shows
 * plain images instead.
 */

export type Rect = { x: number; y: number; w: number; h: number }

export interface Emblem {
  /** The crisp picture, on a transparent background. */
  image: HTMLCanvasElement
  /** TEX_W × rows × 4 floats: x, y (0–1 across the picture), seed, size. */
  home: Float32Array
  /** TEX_W × rows × 4 bytes: particle colour. */
  color: Uint8Array
  /** Share of the picture covered by paint; sizes the particles. */
  coverage: number
}

export interface Keyframe {
  emblem: number
  rect: Rect
  /** 0–1: how bright the emblem is (it dims behind text). */
  dim: number
}

export interface EngineOptions {
  reducedMotion: boolean
  /** A faint idle shimmer, which keeps the canvas drawing. */
  ambient: boolean
}

export const TEX_W = 1024
const SETTLE_FRAMES = 240

export function isLowPower() {
  const nav = navigator as Navigator & { deviceMemory?: number }
  return (
    (nav.hardwareConcurrency || 8) <= 4 ||
    (nav.deviceMemory || 8) <= 4 ||
    window.matchMedia("(pointer: coarse)").matches
  )
}

/** Rows of the particle textures; every emblem is sampled to TEX_W × rows points. */
export function particleRows(lowPower: boolean) {
  return lowPower ? 40 : 96
}

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v))
}

function smooth(t: number) {
  const x = clamp(t, 0, 1)
  return x * x * (3 - 2 * x)
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) }
}

/* ── shaders ─────────────────────────────────────────────────────────── */

const NOISE = `
float hash(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x), mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x), u.y); }
vec2 ambientField(vec2 uv, float t){
  vec2 q = uv*vec2(3.2,1.7);
  vec2 a = vec2(vnoise(q+vec2(t*0.11,0.0))-0.5, vnoise(q+vec2(5.2,t*0.08)+3.1)-0.5);
  vec2 q2 = uv*vec2(7.5,4.0) + vec2(-t*0.19, t*0.13);
  vec2 b = vec2(vnoise(q2+1.7)-0.5, vnoise(q2+9.3)-0.5);
  return a + b*0.45;
}
`

/* energy of the material at a point: shared by image and particles so the
   cross-fade is exactly complementary */
const ENERGY = `
float energyAt(vec2 px, vec2 mouse, float radius, float presence, float wakeEnergy){
  vec2 d = px - mouse;
  float f = exp(-dot(d,d)/(radius*radius))*presence;
  return smoothstep(0.06, 0.5, f*1.15 + wakeEnergy*1.7);
}
`

/* how far a particle has travelled from emblem A to emblem B: a sweep across
   the picture plus a little jitter, so the shape pours rather than jumps */
const MORPH = `
float morphAt(vec4 h, float t, float same){
  float spread = 0.45*(1.0 - same);
  float d = (h.x*0.6 + h.z*0.4)*spread;
  float m = clamp((t - d)/(1.0 - spread), 0.0, 1.0);
  return m*m*(3.0 - 2.0*m);
}
`

const FULL_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos*0.5+0.5; gl_Position = vec4(aPos,0.0,1.0); }
`

/* a quad covering just one emblem's rect */
const RECT_VS = `#version 300 es
layout(location=0) in vec2 aPos;
uniform vec4 uClip;
void main(){ gl_Position = vec4(mix(uClip.xy, uClip.zw, aPos*0.5+0.5), 0.0, 1.0); }
`

/* Flow map (cursor wake), in screen space. RGBA8: velocity around 128, energy in B. */
const FLOW_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uPrev;
uniform vec2 uTexel;
uniform vec2 uMouse;
uniform vec2 uVel;
uniform vec2 uSize;
uniform float uRadius;
uniform float uPresence;
uniform float uDecay;
vec2 decV(vec4 c){ return (c.rg*255.0-128.0)/127.0; }
void main(){
  vec2 v0 = decV(texture(uPrev, vUv));
  vec2 uv = vUv - v0*uTexel*2.5;
  vec4 c = texture(uPrev, uv)*0.52
    + 0.12*(texture(uPrev, uv+vec2(uTexel.x,0.0)) + texture(uPrev, uv-vec2(uTexel.x,0.0))
          + texture(uPrev, uv+vec2(0.0,uTexel.y)) + texture(uPrev, uv-vec2(0.0,uTexel.y)));
  vec2 v = decV(c);
  float p = c.b;
  vec2 d = (vUv-uMouse)*uSize;
  float f = exp(-dot(d,d)/(uRadius*uRadius))*uPresence;
  float sp = clamp(length(uVel)*2.5, 0.0, 1.0);
  v += uVel*f*0.22;
  p = max(p, f*sp);
  v *= uDecay;
  p *= uDecay;
  v = sign(v)*max(abs(v)-1.2/127.0, 0.0);
  p = max(p-1.2/255.0, 0.0);
  v = clamp(v, -1.0, 1.0);
  o = vec4((v*127.0+128.0)/255.0, p, 1.0);
}
`

/* GPGPU step: state = (offset.xy, velocity.xy) in CSS px, relative to where
   the particle belongs on its way from emblem A to emblem B. */
const SIM_FS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uState;
uniform sampler2D uHomeA;
uniform sampler2D uHomeB;
uniform sampler2D uFlow;
uniform vec4 uRectA;
uniform vec4 uRectB;
uniform vec2 uScreen;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uStrength;
uniform float uSpread;
uniform float uTurb;
uniform float uReturn;
uniform float uTime;
uniform float uDt;
uniform float uIntro;
uniform float uT;
uniform float uSame;
uniform float uStir;
${NOISE}
${MORPH}
vec2 curl(vec2 p){
  const float e = 0.35;
  float a = vnoise(p+vec2(0.0,e)) - vnoise(p-vec2(0.0,e));
  float b = vnoise(p+vec2(e,0.0)) - vnoise(p-vec2(e,0.0));
  return vec2(a, -b)/(2.0*e);
}
void main(){
  ivec2 ij = ivec2(gl_FragCoord.xy);
  vec4 hA = texelFetch(uHomeA, ij, 0);
  vec4 hB = texelFetch(uHomeB, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  vec2 off = st.xy;
  vec2 vel = st.zw;
  float m = morphAt(hA, uT, uSame);
  vec2 target = mix(uRectA.xy + hA.xy*uRectA.zw, uRectB.xy + hB.xy*uRectB.zw, m);
  float sd = hA.z;
  float light = 0.45 + sd*1.1;

  vec2 p = target + off;
  vec4 fl = texture(uFlow, clamp(p/uScreen, 0.0, 1.0));
  vec2 wake = (fl.rg*255.0-128.0)/127.0;
  float pr = fl.b;

  vec2 toM = p - uMouse;
  float r2 = dot(toM,toM);
  float f = exp(-r2/(uRadius*uRadius))*uPresence;
  vec2 n = toM*inversesqrt(r2+1.0);
  float e = clamp(pr*2.0 + f, 0.0, 1.0);
  // mid-flight between two emblems the material is at its most liquid
  float travel = 4.0*m*(1.0-m)*(1.0-uSame);

  vec2 acc = vec2(0.0);
  // blown outward and swirled around the cursor
  acc += n*f*1.25*uStrength*uSpread*light;
  acc += vec2(-n.y, n.x)*f*1.45*uStrength*uSpread*(0.4+sd);
  // carried by the liquid wake
  acc += (wake*42.0*uSpread*light - vel)*e*0.08;
  // curl-noise turbulence where the material is disturbed, flying, or forming
  vec2 q = p*0.0095 + vec2(uTime*0.35, -uTime*0.2);
  vec2 c = curl(q) + 0.5*curl(q*2.3 + 7.1);
  acc += c*(e*1.2*uSpread + uIntro*1.5 + travel*(1.2 + uStir*1.5))*uTurb*light;
  // elastic return to where it belongs
  float k = (0.006 + 0.02*uReturn)*(0.65+sd*0.7)*(1.0 - uIntro*0.75);
  acc -= off*k;

  vel += acc*uDt;
  vel *= pow(mix(0.93, 0.955, max(e, travel)), uDt);
  off += vel*uDt;
  if(dot(off,off) < 0.0004 && dot(vel,vel) < 0.0004){ off = vec2(0.0); vel = vec2(0.0); }
  o = vec4(off, vel);
}
`

/* Particles: one instanced quad per particle, a capsule stretched along velocity. */
const PART_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
uniform sampler2D uState;
uniform sampler2D uHomeA;
uniform sampler2D uHomeB;
uniform sampler2D uColA;
uniform sampler2D uColB;
uniform sampler2D uFlow;
uniform int uTexW;
uniform vec4 uRectA;
uniform vec4 uRectB;
uniform vec2 uScreen;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uPresence;
uniform float uDotA;
uniform float uDotB;
uniform float uTime;
uniform float uAmbient;
uniform float uStreak;
uniform float uIntroVis;
uniform float uT;
uniform float uSame;
uniform float uImgVis;
uniform float uDim;
out vec2 vLocal;
out float vHalfLen;
out float vR;
out vec3 vCol;
out float vA;
${NOISE}
${ENERGY}
${MORPH}
void main(){
  int id = gl_InstanceID;
  ivec2 ij = ivec2(id % uTexW, id / uTexW);
  vec4 hA = texelFetch(uHomeA, ij, 0);
  vec4 hB = texelFetch(uHomeB, ij, 0);
  vec4 st = texelFetch(uState, ij, 0);
  float m = morphAt(hA, uT, uSame);
  vec2 target = mix(uRectA.xy + hA.xy*uRectA.zw, uRectB.xy + hB.xy*uRectB.zw, m);

  float wakeE = texture(uFlow, clamp(target/uScreen, 0.0, 1.0)).b;
  float E = energyAt(target, uMouse, uRadius, uPresence, wakeE);
  float lift = smoothstep(0.35, 2.5, length(st.xy));
  float a = max(max(E, lift), max(1.0 - uImgVis, 1.0 - uIntroVis))*uDim;
  if(a < 0.01){ gl_Position = vec4(2.0,2.0,2.0,1.0); return; }

  vec2 base = target + st.xy;
  base -= ambientField(mix(hA.xy, hB.xy, m), uTime)*10.0*uAmbient;

  vec2 v = st.zw;
  float sp = length(v);
  vec2 dir = sp > 0.001 ? v/sp : vec2(1.0,0.0);
  float r = mix(uDotA*hA.w, uDotB*hB.w, m)*0.5;
  float len = min(sp*1.25, 18.0)*uStreak;
  vec2 lc = aCorner*vec2(r + len*0.5 + 1.0, r + 1.0);
  vec2 center = base - dir*len*0.5;
  vec2 world = center + dir*lc.x + vec2(-dir.y, dir.x)*lc.y;

  vec2 clip = world/uScreen*2.0-1.0;
  gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
  vLocal = lc;
  vHalfLen = len*0.5;
  vR = r;
  vec3 col = mix(texelFetch(uColA, ij, 0).rgb, texelFetch(uColB, ij, 0).rgb, m);
  // fast material catches the light, like liquid metal
  float glint = smoothstep(2.0, 16.0, sp);
  col = mix(col, min(col*1.18 + vec3(0.07,0.075,0.085), vec3(1.0)), glint*0.75);
  vCol = col;
  vA = a;
}
`

const PART_FS = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vHalfLen;
in float vR;
in vec3 vCol;
in float vA;
uniform float uDpr;
out vec4 o;
void main(){
  vec2 q = vec2(max(abs(vLocal.x)-vHalfLen, 0.0), vLocal.y);
  float d = length(q) - vR;
  float a = clamp(0.5 - d*uDpr, 0.0, 1.0);
  // comet tail: the trailing end thins out
  float tail = vHalfLen > 0.0 ? clamp(0.5 - vLocal.x/(2.0*(vHalfLen+vR)), 0.0, 1.0) : 0.0;
  a *= 1.0 - tail*0.55;
  a *= vA;
  if(a < 0.004) discard;
  o = vec4(vCol*a, a);
}
`

/* Image pass: one crisp emblem, gently lensed by the cursor, fading out where
   the material has turned liquid. The texture is premultiplied. */
const IMAGE_FS = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uImg;
uniform sampler2D uFlow;
uniform vec2 uScreen;
uniform float uDpr;
uniform vec4 uRect;
uniform vec2 uMouse;
uniform float uPresence;
uniform float uRadius;
uniform float uStrength;
uniform float uTime;
uniform float uAmbient;
uniform float uVis;
${NOISE}
${ENERGY}
void main(){
  vec2 px = vec2(gl_FragCoord.x, uScreen.y*uDpr - gl_FragCoord.y)/uDpr;
  vec2 uv = (px - uRect.xy)/uRect.zw;
  vec4 fl = texture(uFlow, clamp(px/uScreen, 0.0, 1.0));
  vec2 vel = (fl.rg*255.0-128.0)/127.0;
  vec2 toM = px - uMouse;
  float fall = exp(-dot(toM,toM)/(uRadius*uRadius))*uPresence;
  vec2 disp = -toM*0.22*uStrength*fall - vel*10.0*uStrength;
  disp += ambientField(uv, uTime)*10.0*uAmbient;
  vec2 suv = uv + disp/uRect.zw;
  vec4 tx = texture(uImg, suv);
  vec2 e = smoothstep(vec2(0.0), vec2(0.004,0.01), suv) * smoothstep(vec2(1.0), vec2(0.996,0.99), suv);
  float E = energyAt(px, uMouse, uRadius, uPresence, fl.b);
  o = tx*(e.x*e.y*(1.0 - E)*uVis);
}
`

/* ── helpers ─────────────────────────────────────────────────────────── */

type Prog = { p: WebGLProgram; u: Record<string, WebGLUniformLocation | null> }

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): Prog {
  const make = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(sh)
      gl.deleteShader(sh)
      throw new Error("Shader: " + log)
    }
    return sh
  }
  const p = gl.createProgram()!
  const v = make(gl.VERTEX_SHADER, vs)
  const f = make(gl.FRAGMENT_SHADER, fs)
  gl.attachShader(p, v)
  gl.attachShader(p, f)
  gl.bindAttribLocation(p, 0, "aPos")
  gl.linkProgram(p)
  gl.deleteShader(v)
  gl.deleteShader(f)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("Link: " + gl.getProgramInfoLog(p))
  const u: Record<string, WebGLUniformLocation | null> = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i)
    if (info) u[info.name] = gl.getUniformLocation(p, info.name)
  }
  return { p, u }
}

type GpuEmblem = { home: WebGLTexture; col: WebGLTexture; img: WebGLTexture; coverage: number }

/* ── engine ──────────────────────────────────────────────────────────── */

const TUNING = {
  strength: 1.05,
  radius: 200,
  dotSize: 1,
  spread: 1.1,
  turbulence: 1.25,
  returnSpeed: 0.85,
  speed: 0.8,
  ambientIntensity: 0.22,
}

export class MorphEngine {
  /** Called once, after the first frame has actually been drawn. */
  onFirstFrame: (() => void) | null = null

  private canvas: HTMLCanvasElement
  private gl: WebGL2RenderingContext
  private opts: EngineOptions
  private onFail: () => void
  private lowPower: boolean
  private stateFormat = { internal: 0, type: 0 }

  private pFlow!: Prog
  private pSim!: Prog
  private pPart!: Prog
  private pImg!: Prog
  private vao!: WebGLVertexArrayObject
  private quad!: WebGLBuffer

  private flowTex: WebGLTexture[] = []
  private flowFb: WebGLFramebuffer[] = []
  private flowW = 256
  private flowH = 160
  private flowIdx = 0
  private flowDirty = false

  private stateTex: WebGLTexture[] = []
  private stateFb: WebGLFramebuffer[] = []
  private stateIdx = 0
  private stateDirty = false
  private rows: number
  private n: number

  private emblems: GpuEmblem[] = []
  private homesCpu: Float32Array[] = []
  private frames: Keyframe[] = []
  private stage = 0
  private stir = 0

  private cssW = 1
  private cssH = 1

  private target = { x: -9999, y: -9999 }
  private mouse = { x: -9999, y: -9999 }
  private prevMouse = { x: -9999, y: -9999 }
  private mvel = { x: 0, y: 0 }
  private presence = 0
  private presenceTarget = 0
  private burst = 0
  private settle = 1e9
  private touchRelease = 0
  private flowing = 0

  private time = 0
  private introT = 1
  private raf = 0
  private running = false
  private last = 0
  private skip = 0
  private visible = true
  private destroyed = false
  private lost = false

  constructor(canvas: HTMLCanvasElement, rows: number, opts: EngineOptions, onFail: () => void) {
    this.canvas = canvas
    this.opts = opts
    this.onFail = onFail
    this.rows = rows
    this.n = TEX_W * rows
    // alpha: the page colour shows through everywhere the emblems are not
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance",
    }) as WebGL2RenderingContext | null
    if (!gl) throw new Error("WebGL2 unavailable")
    this.gl = gl
    this.lowPower = isLowPower()
    this.initGL()
    canvas.addEventListener("webglcontextlost", this.onLost, false)
  }

  private onLost = (e: Event) => {
    e.preventDefault()
    this.lost = true
    this.stop()
    this.onFail()
  }

  private initGL() {
    const gl = this.gl
    // float render targets: RGBA16F is enough (offsets in px, sub-pixel precision)
    const full = gl.getExtension("EXT_color_buffer_float")
    const half = full ? null : gl.getExtension("EXT_color_buffer_half_float")
    if (!full && !half) throw new Error("No float render targets")
    this.stateFormat = { internal: gl.RGBA16F, type: gl.HALF_FLOAT }

    this.pFlow = compile(gl, FULL_VS, FLOW_FS)
    this.pSim = compile(gl, FULL_VS, SIM_FS)
    this.pPart = compile(gl, PART_VS, PART_FS)
    this.pImg = compile(gl, RECT_VS, IMAGE_FS)

    this.vao = gl.createVertexArray()!
    gl.bindVertexArray(this.vao)
    this.quad = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    for (let i = 0; i < 2; i++) {
      const t = this.makeTex(gl.RGBA8, this.flowW, this.flowH, gl.RGBA, gl.UNSIGNED_BYTE, null, gl.LINEAR)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      this.flowTex.push(t)
      this.flowFb.push(fb)
    }
    this.clearFlow()

    for (let i = 0; i < 2; i++) {
      const t = this.makeTex(this.stateFormat.internal, TEX_W, this.rows, gl.RGBA, this.stateFormat.type, null, gl.NEAREST)
      const fb = gl.createFramebuffer()!
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Float FBO incomplete")
      this.stateTex.push(t)
      this.stateFb.push(fb)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.clearState()
  }

  private makeTex(
    internal: number,
    w: number,
    h: number,
    format: number,
    type: number,
    data: ArrayBufferView | null,
    filter: number
  ) {
    const gl = this.gl
    const t = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, t)
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return t
  }

  private clearFlow() {
    const gl = this.gl
    for (const fb of this.flowFb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, this.flowW, this.flowH)
      gl.clearColor(128 / 255, 128 / 255, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.flowDirty = false
  }

  private clearState() {
    const gl = this.gl
    for (const fb of this.stateFb) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb)
      gl.viewport(0, 0, TEX_W, this.rows)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    this.stateDirty = false
  }

  /** Uploads an emblem; returns its index. */
  addEmblem(e: Emblem) {
    const gl = this.gl
    const total = TEX_W * this.rows * 4
    if (e.home.length !== total || e.color.length !== total) throw new Error("Emblem sampled for another particle count")
    const home = this.makeTex(gl.RGBA32F, TEX_W, this.rows, gl.RGBA, gl.FLOAT, e.home, gl.NEAREST)
    const col = this.makeTex(gl.RGBA8, TEX_W, this.rows, gl.RGBA, gl.UNSIGNED_BYTE, e.color, gl.NEAREST)
    const img = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, img)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, e.image)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    this.emblems.push({ home, col, img, coverage: e.coverage })
    this.homesCpu.push(e.home)
    return this.emblems.length - 1
  }

  /** Where each emblem sits, in viewport CSS px, at every scroll keyframe. */
  setFrames(frames: Keyframe[]) {
    this.frames = frames
    this.wake()
  }

  /** Position along the keyframes: 2.5 is halfway from keyframe 2 to keyframe 3. */
  setStage(s: number) {
    if (Math.abs(s - this.stage) < 1e-6) return
    this.stir = Math.min(1, this.stir + Math.abs(s - this.stage) * 6)
    this.stage = s
    this.settle = 0
    this.wake()
  }

  setOptions(o: Partial<EngineOptions>) {
    this.opts = { ...this.opts, ...o }
    this.wake()
  }

  private get ready() {
    return this.emblems.length > 0 && this.frames.length > 1 && !this.destroyed && !this.lost
  }

  private pair() {
    const K = this.frames.length
    let i = Math.floor(this.stage)
    let t = this.stage - i
    if (i < 0) {
      i = 0
      t = 0
    }
    if (i >= K - 1) {
      i = K - 2
      t = 1
    }
    const A = this.frames[i]
    const B = this.frames[i + 1]
    return { A, B, t, same: A.emblem === B.emblem }
  }

  /** The ring is forged from embers rising off the bottom of the screen. */
  startIntro() {
    if (!this.ready || this.opts.reducedMotion) return
    const gl = this.gl
    const { A } = this.pair()
    const home = this.homesCpu[A.emblem]
    const st = new Float32Array(TEX_W * this.rows * 4)
    const W = this.cssW
    const H = this.cssH
    for (let i = 0; i < this.n; i++) {
      const tx = A.rect.x + home[i * 4] * A.rect.w
      const ty = A.rect.y + home[i * 4 + 1] * A.rect.h
      const sx = W * (0.5 + (Math.random() - 0.5) * 1.1)
      const sy = H * (1.02 + Math.random() * 0.35)
      st[i * 4] = sx - tx
      st[i * 4 + 1] = sy - ty
    }
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.texImage2D(gl.TEXTURE_2D, 0, this.stateFormat.internal, TEX_W, this.rows, 0, gl.RGBA, gl.FLOAT, st)
    this.introT = 0
    this.stateDirty = true
    this.settle = 0
    this.wake()
  }

  resize(cssW: number, cssH: number) {
    this.cssW = Math.max(1, cssW)
    this.cssH = Math.max(1, cssH)
    let dpr = Math.min(window.devicePixelRatio || 1, this.lowPower ? 1.5 : 2)
    const px = this.cssW * this.cssH * dpr * dpr
    if (px > 4.5e6) dpr = Math.max(1, Math.sqrt(4.5e6 / (this.cssW * this.cssH)))
    const w = Math.round(this.cssW * dpr)
    const h = Math.round(this.cssH * dpr)
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w
      this.canvas.height = h
    }
    const fh = clamp(Math.round((this.flowW * this.cssH) / this.cssW), 64, 512)
    if (fh !== this.flowH && !this.lost) {
      const gl = this.gl
      this.flowH = fh
      for (const t of this.flowTex) {
        gl.bindTexture(gl.TEXTURE_2D, t)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, this.flowW, this.flowH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      }
      this.clearFlow()
    }
    this.draw()
  }

  setVisible(v: boolean) {
    this.visible = v
    if (v) this.wake()
    else this.stop()
  }

  pointer(type: "move" | "down" | "up" | "leave", x: number, y: number, touch: boolean) {
    if (this.lost) return
    const now = performance.now()
    if (type === "leave" || type === "up") {
      if (touch) this.touchRelease = now + 260
      else this.presenceTarget = 0
      this.wake()
      return
    }
    if (this.mouse.x < -9000 || type === "down") {
      this.mouse.x = this.prevMouse.x = x
      this.mouse.y = this.prevMouse.y = y
    }
    this.target.x = x
    this.target.y = y
    this.presenceTarget = 1
    this.settle = 0
    if (type === "down") {
      this.burst = 1
      this.touchRelease = 0
    }
    this.wake()
  }

  private wake() {
    if (!this.ready || this.running || !this.visible) {
      if (this.ready && !this.running) this.draw()
      return
    }
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  private stop() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private radiusPx() {
    return TUNING.radius * clamp(this.cssW / 1400, 0.6, 1.25)
  }

  private strength() {
    return TUNING.strength * (this.opts.reducedMotion ? 0.5 : 1)
  }

  private frame = (now: number) => {
    if (!this.running) return
    const rawMs = now - this.last
    const dt = clamp(rawMs / 16.6667, 0.25, 3)
    this.last = now
    const o = this.opts
    const ambientOn = o.ambient && !o.reducedMotion

    if (this.touchRelease && now > this.touchRelease) {
      this.presenceTarget = 0
      this.touchRelease = 0
    }
    const ease = 1 - Math.pow(1 - 0.22, dt)
    this.mouse.x += (this.target.x - this.mouse.x) * ease
    this.mouse.y += (this.target.y - this.mouse.y) * ease
    const vx = (this.mouse.x - this.prevMouse.x) / dt
    const vy = (this.mouse.y - this.prevMouse.y) / dt
    this.prevMouse.x = this.mouse.x
    this.prevMouse.y = this.mouse.y
    this.mvel.x += (clamp(vx, -60, 60) - this.mvel.x) * 0.5
    this.mvel.y += (clamp(vy, -60, 60) - this.mvel.y) * 0.5
    const pk = this.presenceTarget > this.presence ? 0.1 : 0.035
    this.presence += (this.presenceTarget - this.presence) * (1 - Math.pow(1 - pk, dt))
    if (this.presence < 0.001 && this.presenceTarget === 0) this.presence = 0
    const fk = this.presenceTarget > this.flowing ? 0.05 : 0.018
    this.flowing += (this.presenceTarget - this.flowing) * (1 - Math.pow(1 - fk, dt))
    if (this.flowing < 0.002 && this.presenceTarget === 0) this.flowing = 0
    if (this.introT < 1) this.introT = Math.min(1, this.introT + Math.min(rawMs, 100) / 3200)
    this.stir *= Math.pow(0.94, dt)

    const { same, t } = this.pair()
    const morphing = !same && t > 0.001 && t < 0.999 && !o.reducedMotion
    const interacting = this.presence > 0.001 || this.burst > 0
    // settle is counted in simulated frames, so slow devices never snap mid-return
    this.settle = interacting || morphing ? 0 : this.settle + dt
    const active = interacting || morphing || this.settle < SETTLE_FRAMES || this.introT < 1

    if (!active) {
      if (this.flowDirty) this.clearFlow()
      if (this.stateDirty) this.clearState()
      if (!ambientOn) {
        this.draw()
        this.firstFrame()
        this.stop()
        return
      }
      this.raf = requestAnimationFrame(this.frame)
      if (this.skip++ % 2) return
      this.time += (dt * 2 * TUNING.speed) / 60
      this.draw()
      this.firstFrame()
      return
    }
    this.raf = requestAnimationFrame(this.frame)
    // the field speeds up while the material is being stirred
    this.time += (dt * TUNING.speed * (1 + this.flowing * 1.6)) / 60
    this.stepFlow(dt)
    this.stepSim(dt)
    this.burst = Math.max(0, this.burst - 0.1 * dt)
    this.draw()
    this.firstFrame()
  }

  private firstFrame() {
    if (this.onFirstFrame) {
      const cb = this.onFirstFrame
      this.onFirstFrame = null
      // one more frame so the compositor has presented the canvas
      requestAnimationFrame(() => cb())
    }
  }

  private stepFlow(dt: number) {
    const gl = this.gl
    const P = this.pFlow
    const dst = 1 - this.flowIdx
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.flowFb[dst])
    gl.viewport(0, 0, this.flowW, this.flowH)
    gl.disable(gl.BLEND)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uPrev, 0)
    gl.uniform2f(P.u.uTexel, 1 / this.flowW, 1 / this.flowH)
    gl.uniform2f(P.u.uMouse, this.mouse.x / this.cssW, this.mouse.y / this.cssH)
    gl.uniform2f(P.u.uVel, clamp(this.mvel.x / 40, -1, 1), clamp(this.mvel.y / 40, -1, 1))
    gl.uniform2f(P.u.uSize, this.cssW, this.cssH)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    gl.uniform1f(P.u.uPresence, Math.max(this.presence, this.burst))
    gl.uniform1f(P.u.uDecay, Math.pow(0.968, dt))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.flowIdx = dst
    this.flowDirty = true
  }

  private stepSim(dt: number) {
    const gl = this.gl
    const P = this.pSim
    const o = this.opts
    const { A, B, t, same } = this.pair()
    const dst = 1 - this.stateIdx
    const intro = o.reducedMotion ? 0 : Math.pow(1 - this.introT, 2)
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.stateFb[dst])
    gl.viewport(0, 0, TEX_W, this.rows)
    gl.disable(gl.BLEND)
    gl.useProgram(P.p)
    gl.bindVertexArray(this.vao)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.uniform1i(P.u.uState, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.emblems[A.emblem].home)
    gl.uniform1i(P.u.uHomeA, 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.emblems[B.emblem].home)
    gl.uniform1i(P.u.uHomeB, 2)
    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uFlow, 3)
    gl.uniform4f(P.u.uRectA, A.rect.x, A.rect.y, A.rect.w, A.rect.h)
    gl.uniform4f(P.u.uRectB, B.rect.x, B.rect.y, B.rect.w, B.rect.h)
    gl.uniform2f(P.u.uScreen, this.cssW, this.cssH)
    gl.uniform2f(P.u.uMouse, this.mouse.x, this.mouse.y)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    gl.uniform1f(P.u.uPresence, Math.max(this.presence, this.burst))
    gl.uniform1f(P.u.uStrength, this.strength() * (1 + this.burst * 1.5))
    gl.uniform1f(P.u.uSpread, TUNING.spread)
    gl.uniform1f(P.u.uTurb, TUNING.turbulence * (o.reducedMotion ? 0.3 : 1))
    gl.uniform1f(P.u.uReturn, TUNING.returnSpeed)
    gl.uniform1f(P.u.uTime, this.time)
    gl.uniform1f(P.u.uDt, dt)
    gl.uniform1f(P.u.uIntro, intro)
    gl.uniform1f(P.u.uT, t)
    gl.uniform1f(P.u.uSame, same ? 1 : 0)
    gl.uniform1f(P.u.uStir, this.stir)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    this.stateIdx = dst
    this.stateDirty = true
  }

  private dotFor(emblem: number, r: Rect) {
    const area = Math.max(1, this.emblems[emblem].coverage * r.w * r.h)
    return Math.sqrt(area / this.n) * 1.5 * TUNING.dotSize
  }

  private drawImage(emblem: number, r: Rect, vis: number, amb: number) {
    if (vis <= 0.002) return
    const gl = this.gl
    const I = this.pImg
    const mx = r.w * 0.06 + 24
    const my = r.h * 0.12 + 24
    const x0 = ((r.x - mx) / this.cssW) * 2 - 1
    const x1 = ((r.x + r.w + mx) / this.cssW) * 2 - 1
    const yTop = 1 - ((r.y - my) / this.cssH) * 2
    const yBot = 1 - ((r.y + r.h + my) / this.cssH) * 2
    gl.useProgram(I.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.emblems[emblem].img)
    gl.uniform1i(I.u.uImg, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(I.u.uFlow, 1)
    gl.uniform4f(I.u.uClip, x0, yBot, x1, yTop)
    gl.uniform2f(I.u.uScreen, this.cssW, this.cssH)
    gl.uniform1f(I.u.uDpr, this.canvas.width / this.cssW)
    gl.uniform4f(I.u.uRect, r.x, r.y, r.w, r.h)
    gl.uniform2f(I.u.uMouse, this.mouse.x, this.mouse.y)
    gl.uniform1f(I.u.uPresence, Math.max(this.presence, this.burst))
    gl.uniform1f(I.u.uRadius, this.radiusPx())
    gl.uniform1f(I.u.uStrength, this.strength())
    gl.uniform1f(I.u.uTime, this.time)
    gl.uniform1f(I.u.uAmbient, amb)
    gl.uniform1f(I.u.uVis, vis)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private draw() {
    if (!this.ready) return
    const gl = this.gl
    const o = this.opts
    const rm = o.reducedMotion
    const { A, B, t, same } = this.pair()
    const introVis = rm || this.introT >= 1 ? 1 : Math.pow(this.introT, 2.2)
    const base = o.ambient && !rm ? TUNING.ambientIntensity : 0
    const amb = base + this.flowing * 0.85 * (rm ? 0.3 : 1)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.bindVertexArray(this.vao)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    // the crisp pictures: one sliding emblem, or two cross-fading at the ends of a morph
    let covered: number
    let dim: number
    if (same) {
      const s = smooth(t)
      dim = lerp(A.dim, B.dim, s)
      this.drawImage(A.emblem, lerpRect(A.rect, B.rect, s), dim * introVis, amb)
      covered = 1
    } else if (rm) {
      this.drawImage(A.emblem, A.rect, A.dim * (1 - t), amb)
      this.drawImage(B.emblem, B.rect, B.dim * t, amb)
      dim = lerp(A.dim, B.dim, t)
      covered = 1
    } else {
      const vA = 1 - smooth(t / 0.07)
      const vB = smooth((t - 0.93) / 0.07)
      this.drawImage(A.emblem, A.rect, A.dim * vA * introVis, amb)
      this.drawImage(B.emblem, B.rect, B.dim * vB * introVis, amb)
      dim = lerp(A.dim, B.dim, t)
      covered = vA + vB
    }

    // particles are invisible while a picture covers them: skip them entirely
    if (!this.stateDirty && covered >= 0.999 && introVis >= 1) return

    const P = this.pPart
    gl.useProgram(P.p)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.stateTex[this.stateIdx])
    gl.uniform1i(P.u.uState, 0)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.emblems[A.emblem].home)
    gl.uniform1i(P.u.uHomeA, 1)
    gl.activeTexture(gl.TEXTURE2)
    gl.bindTexture(gl.TEXTURE_2D, this.emblems[B.emblem].home)
    gl.uniform1i(P.u.uHomeB, 2)
    gl.activeTexture(gl.TEXTURE3)
    gl.bindTexture(gl.TEXTURE_2D, this.emblems[A.emblem].col)
    gl.uniform1i(P.u.uColA, 3)
    gl.activeTexture(gl.TEXTURE4)
    gl.bindTexture(gl.TEXTURE_2D, this.emblems[B.emblem].col)
    gl.uniform1i(P.u.uColB, 4)
    gl.activeTexture(gl.TEXTURE5)
    gl.bindTexture(gl.TEXTURE_2D, this.flowTex[this.flowIdx])
    gl.uniform1i(P.u.uFlow, 5)
    gl.uniform1i(P.u.uTexW, TEX_W)
    gl.uniform4f(P.u.uRectA, A.rect.x, A.rect.y, A.rect.w, A.rect.h)
    gl.uniform4f(P.u.uRectB, B.rect.x, B.rect.y, B.rect.w, B.rect.h)
    gl.uniform2f(P.u.uScreen, this.cssW, this.cssH)
    gl.uniform2f(P.u.uMouse, this.mouse.x, this.mouse.y)
    gl.uniform1f(P.u.uRadius, this.radiusPx())
    gl.uniform1f(P.u.uPresence, Math.max(this.presence, this.burst))
    gl.uniform1f(P.u.uDotA, this.dotFor(A.emblem, A.rect))
    gl.uniform1f(P.u.uDotB, this.dotFor(B.emblem, B.rect))
    gl.uniform1f(P.u.uTime, this.time)
    gl.uniform1f(P.u.uAmbient, amb)
    gl.uniform1f(P.u.uStreak, 0.45 + 0.55 * introVis)
    gl.uniform1f(P.u.uIntroVis, introVis)
    gl.uniform1f(P.u.uT, t)
    gl.uniform1f(P.u.uSame, same ? 1 : 0)
    gl.uniform1f(P.u.uImgVis, covered)
    gl.uniform1f(P.u.uDim, dim)
    gl.uniform1f(P.u.uDpr, this.canvas.width / this.cssW)
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.n)
    gl.disable(gl.BLEND)
  }

  destroy() {
    this.destroyed = true
    this.stop()
    this.canvas.removeEventListener("webglcontextlost", this.onLost)
    const gl = this.gl
    if (!this.lost) {
      gl.deleteBuffer(this.quad)
      gl.deleteVertexArray(this.vao)
      for (const t of [...this.flowTex, ...this.stateTex]) gl.deleteTexture(t)
      for (const e of this.emblems) for (const t of [e.home, e.col, e.img]) gl.deleteTexture(t)
      for (const f of [...this.flowFb, ...this.stateFb]) gl.deleteFramebuffer(f)
      for (const p of [this.pFlow, this.pSim, this.pPart, this.pImg]) if (p) gl.deleteProgram(p.p)
    }
    gl.getExtension("WEBGL_lose_context")?.loseContext()
  }
}

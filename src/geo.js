// Planet math. The planet spins about its X axis. A point on the walking path is
// described in "path coordinates": z = distance along the path (units),
// s = sideways distance (positive = right of the path when walking), h = height above sea level.
// The camera and family always stay at the top of the planet (0, R, 0); the planet turns underneath.
import * as THREE from 'three'

export const R = 30
export const DEG = Math.PI / 180

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const lerp = (a, b, t) => a + (b - a) * t
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
export const easeOutBack = (t) => {
  const c1 = 1.5, c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}
export const angDist = (a, b) => Math.abs((((a - b) % 360) + 540) % 360 - 180)
// 0 → 1 between a..b, back to 0 between c..d
export const bump = (x, a, b, c, d) => smoothstep(a, b, x) * (1 - smoothstep(c, d, x))
// degrees on the planet → units along the path
export const zOf = (deg) => deg * DEG * R

export function pt(z, s, h, out = new THREE.Vector3()) {
  const a = z / R, lat = -s / R, r = R + h
  return out.set(r * Math.sin(lat), r * Math.cos(lat) * Math.cos(a), r * Math.cos(lat) * Math.sin(a))
}

const _m = new THREE.Matrix4()
export function pathMatrix(z, s, h, yaw = 0, sx = 1, sy = sx, sz = sx, out = new THREE.Matrix4()) {
  out.makeRotationX(z / R)
  out.multiply(_m.makeRotationZ(s / R))
  out.multiply(_m.makeTranslation(0, R + h, 0))
  if (yaw) out.multiply(_m.makeRotationY(yaw))
  out.multiply(_m.makeScale(sx, sy, sz))
  return out
}

// Direction an object at (z, s) with the given yaw is facing, in top-frame coordinates.
export function facing(z, s, yaw, out = new THREE.Vector3()) {
  const m = new THREE.Matrix4().makeRotationX(z / R)
  m.multiply(_m.makeRotationZ(s / R)).multiply(new THREE.Matrix4().makeRotationY(yaw))
  return out.set(0, 0, 1).transformDirection(m)
}

// Yaw that makes an object at (z, s) face a point (zc, sc) on the path.
export const yawToward = (z, s, zc, sc) => Math.atan2(s - sc, zc - z)

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash(i, j, k) {
  const n = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453
  return n - Math.floor(n)
}
export function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z)
  const xf = x - xi, yf = y - yi, zf = z - zi
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf)
  const l = (a, b, t) => a + (b - a) * t
  return l(
    l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
    l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v),
    w,
  )
}
export const fbm = (x, y, z) =>
  noise3(x, y, z) * 0.57 + noise3(x * 2.03 + 11, y * 2.03, z * 2.03) * 0.29 + noise3(x * 4.1, y * 4.1 + 7, z * 4.1) * 0.14

// Land and sea along the loop (degrees): India 336..30, ocean 30..72, US 72..288, ocean 288..336.
export const OCEANS = [[30, 72], [288, 336]]
export const isIndia = (theta) => angDist(theta, 3) < 70

export function terrainAt(ux, uy, uz) {
  const theta = ((Math.atan2(uz, uy) / DEG) % 360 + 360) % 360
  const lat = Math.asin(clamp(ux, -1, 1)) / DEG
  const al = Math.abs(lat)
  let d = Math.max(27 - angDist(theta, 3), 108 - angDist(theta, 180))
  const f = smoothstep(10, 30, al)
  if (f > 0) d += (fbm(ux * 2.2 + 5, uy * 2.2, uz * 2.2) - 0.5) * 46 * f
  const polar = smoothstep(62, 74, al + (noise3(ux * 6, uy * 6, uz * 6) - 0.5) * 8)
  if (polar > 0) d = Math.max(d, lerp(-30, 10, polar))
  const hill = smoothstep(8, 20, al) * Math.pow(fbm(ux * 4.5, uy * 4.5 + 3, uz * 4.5), 1.6) * 2.2
  const land = 0.05 + hill * smoothstep(0, 5, d) + polar * 0.35
  const sea = -0.42 + (noise3(ux * 40, uy * 40, uz * 40) - 0.5) * 0.06
  const h = lerp(sea, land, smoothstep(-0.8, 0.7, d))
  return { h, d, theta, lat, polar }
}

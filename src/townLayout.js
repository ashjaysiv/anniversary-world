// Where the extra world pieces go: US suburbs and skylines, an Indian village and temple, lighthouses,
// boats, lamps, farms and turbines. Pure layout (no drawing), so World.jsx can keep trees out of
// the buildings and Town.jsx can draw them. Everything stays clear of the chapter scenes.
import * as THREE from 'three'
import { CHAPTERS } from './config'
import { rng, angDist, terrainAt, pt, zOf, OCEANS } from './geo'

const u = new THREE.Vector3()
export function ground(a, s) {
  pt(zOf(a), s, 0, u).normalize()
  return terrainAt(u.x, u.y, u.z)
}
const signed = (a, b) => ((((a - b) % 360) + 540) % 360) - 180
// chapter scenes (India house, diyas and photo tower reach further)
const inZone = (a, s) => CHAPTERS.some((c) => angDist(a, c.angle) < ([1, 9].includes(c.id) ? 17 : 13) && Math.abs(s) < 9.5)
const DEGU = zOf(1) // path units per degree

export const SITES = []

function clear(a, s, r) {
  if (inZone(a, s)) return false
  for (const q of SITES) {
    const dz = signed(a, q.a) * DEGU, ds = s - q.s
    if (dz * dz + ds * ds < (r + q.r) ** 2) return false
  }
  return true
}

// Land under a footprint of radius r: returns {top, low} heights, or null if it is water, ice or too steep.
function land(a, s, r, minD = 2.2) {
  let top = -9, low = 9
  for (const [dz, ds] of [[0, 0], [r, r], [r, -r], [-r, r], [-r, -r]]) {
    const t = ground(a + dz / DEGU, s + ds)
    if (t.d < minD || t.polar > 0.2) return null
    top = Math.max(top, t.h)
    low = Math.min(low, t.h)
  }
  return top - low > 0.75 ? null : { top, low }
}

function place(kind, a, s, r, extra = {}, minD) {
  a = ((a % 360) + 360) % 360
  if (!clear(a, s, r)) return null
  const g = land(a, s, r * 0.8, minD)
  if (!g) return null
  const site = { kind, a, s, r, h: g.top - 0.02, drop: g.top - g.low + 0.12, ...extra }
  SITES.push(site)
  return site
}

// yaw that turns a building's front (+z) toward the path
const facePath = (s) => (s > 0 ? Math.PI / 2 : -Math.PI / 2)

const r = rng(77)
const pick = (arr) => arr[Math.floor(r() * arr.length)]

// ---------- landmarks ----------
place('lighthouse', 74.5, 3.4, 0.6, {}, 0.6)
place('lighthouse', 285.8, -3.4, 0.6, {}, 0.6)
place('lighthouse', 338.6, -5.4, 0.6, {}, 0.6)
place('lighthouse', 28.8, 4.2, 0.6, {}, 0.6)
place('gopuram', 342.5, 5.6, 1.7, { yaw: facePath(5.6) + 0.25 })
place('church', 173, 6.4, 1.1, { yaw: facePath(6.4) })
place('barn', 179.5, -6.6, 1.1, { yaw: facePath(-6.6) })
place('silo', 182.3, -7.8, 0.5)
place('waterTower', 112, -10.5, 0.8)
place('waterTower', 228, 10.5, 0.8)
for (const [a, s] of [[272, 10.5], [276, 13], [280, 10.8], [270.5, -11.5], [278, -12.5]]) place('turbine', a, s, 0.6, { yaw: 0.4 })

// ---------- city skylines ----------
function skyline(a0, a1, s0, s1, n) {
  for (let k = 0, made = 0; k < 400 && made < n; k++) {
    const a = a0 + r() * (a1 - a0), s = s0 + r() * (s1 - s0)
    const w = 0.7 + r() * 0.6, d = 0.7 + r() * 0.5
    const near = 1 - Math.min(1, Math.abs(signed(a, (a0 + a1) / 2)) / ((a1 - a0) / 2))
    const tall = 1.4 + r() * 1.6 + near * 2.4
    if (place('tower', a, s, Math.max(w, d) * 0.62, { w, d, tall, yaw: r() * 0.4 - 0.2, color: pick(TOWER) })) made++
  }
}
export const TOWER = ['#9fb4c8', '#c9c1b0', '#8ea3b5', '#d6cbb8', '#a7b9a8', '#b8c4d6', '#e0d6c2', '#b39f8c']
skyline(219, 236, -6.5, -14, 16)
skyline(139, 152, 10, 16.5, 10)

// ---------- US suburbs ----------
export const WALL = ['#f4e9d8', '#cfe0ea', '#f2d7c9', '#dfe8c8', '#e8d4ef', '#f6f0c2', '#c9d8f0', '#f0dcc0']
export const ROOF = ['#5c4b5e', '#7a4a3a', '#4a5a6e', '#8a5a44', '#3f5f5a', '#6e5a4a']
export const CAR = ['#d9433f', '#3b6fb0', '#f2b822', '#f4f4f2', '#3a3f4e', '#5aa84b', '#8a96a8']
for (let a = 77; a < 285; a += 3.6) {
  for (const side of [-1, 1]) {
    if (r() < 0.68) {
      const s = side * (3.9 + r() * 2.0)
      const two = r() < 0.32
      const h = place('house', a + r() * 1.2, s, 0.85, { yaw: facePath(s) + (r() - 0.5) * 0.2, wall: pick(WALL), roof: pick(ROOF), two, chimney: r() < 0.5 })
      if (h) {
        place('mailbox', h.a + 1.0, h.s - side * 1.15, 0.12, { color: pick(['#3b5f9a', '#3a3f4e', '#c23b3b']) })
        if (r() < 0.45) place('car', h.a - 2.5, h.s - side * 0.7, 0.42, { yaw: r() < 0.5 ? 0 : Math.PI, color: pick(CAR) })
      }
    }
    if (r() < 0.45) {
      const s = side * (7.3 + r() * 3.2)
      place('house', a + r() * 2, s, 0.85, { yaw: facePath(s) + (r() - 0.5) * 0.3, wall: pick(WALL), roof: pick(ROOF), two: r() < 0.4, chimney: r() < 0.5 })
    }
  }
}

// ---------- street lamps along the US path ----------
for (let a = 76, k = 0; a < 285; a += 2.6, k++) {
  const s = k % 2 ? 1.15 : -1.15
  place('lamp', a, s, 0.15, { yaw: s > 0 ? Math.PI / 2 : -Math.PI / 2 })
}

// ---------- Indian village ----------
export const INDIA_WALL = ['#f28da0', '#5cc6c0', '#f6cf55', '#a4d65e', '#f59a52', '#9db8f2', '#f4e4c6', '#e7a6d8']
for (let k = -24; k <= 30; k += 2.6) {
  for (const side of [-1, 1]) {
    for (const [s0, span, p] of [[3.6, 2.6, 0.6], [7.0, 5.5, 0.75]]) {
      if (r() > p) continue
      const s = side * (s0 + r() * span)
      place('indiaHouse', k + r(), s, 0.75, { yaw: facePath(s) + (r() - 0.5) * 0.3, wall: pick(INDIA_WALL), trim: pick(INDIA_WALL), upper: r() < 0.4, tank: r() < 0.6 })
    }
  }
}

// ---------- boats on both oceans ----------
export const BOATS = []
for (const [o0, o1] of OCEANS) {
  for (let k = 0, made = 0; k < 200 && made < 8; k++) {
    const a = o0 + 4 + r() * (o1 - o0 - 8)
    const s = (r() < 0.5 ? -1 : 1) * (2.5 + r() * 12)
    const t = ground(a, s)
    if (t.d > -2.5 || t.polar > 0.1) continue
    if (BOATS.some((b) => Math.hypot(signed(a, b.a) * DEGU, s - b.s) < 2.5)) continue
    BOATS.push({ a, s, ship: made === 0, yaw: r() * Math.PI * 2, ph: r() * 6, sail: pick(['#fbfaf5', '#f2b822', '#e9417a', '#fbfaf5']) })
    made++
  }
}

// True if (a, s) is inside a building's footprint (used to keep trees and rocks out).
export function townKeepout(a, s, pad = 0.25) {
  for (const q of SITES) {
    const dz = signed(a, q.a) * DEGU, ds = s - q.s
    if (dz * dz + ds * ds < (q.r + pad) ** 2) return true
  }
  return false
}

// Time of day and season along the loop: morning in India → bright US summers → golden autumn → warm evening back home.
import * as THREE from 'three'
import { clamp, lerp } from './geo'

const KEYS = [
  { p: 0, top: '#8cc4ea', bot: '#ffe3c2', sun: '#ffdcb0', si: 2.6, hs: '#dbe9ff', hg: '#b2906a', hi: 1.05, night: 0, dir: [0.7, 0.5, -0.4] },
  { p: 70, top: '#76b5ea', bot: '#dcf0fb', sun: '#fff1da', si: 3.0, hs: '#d6e8ff', hg: '#8f9c6c', hi: 1.05, night: 0, dir: [0.45, 0.85, -0.3] },
  { p: 170, top: '#67ace8', bot: '#def2fb', sun: '#fff6ea', si: 3.1, hs: '#d6e8ff', hg: '#8a9a68', hi: 1.05, night: 0, dir: [0.2, 1.0, -0.25] },
  { p: 215, top: '#7aa5d4', bot: '#f6dbab', sun: '#ffdaa2', si: 2.9, hs: '#e6e2f2', hg: '#9a8460', hi: 1.0, night: 0, dir: [-0.3, 0.8, -0.35] },
  { p: 258, top: '#6c86c0', bot: '#f4c497', sun: '#ffc088', si: 2.5, hs: '#d8d4ee', hg: '#8a6a52', hi: 0.95, night: 0.05, dir: [-0.55, 0.55, -0.35] },
  { p: 312, top: '#464e8e', bot: '#f2a57e', sun: '#ffa06e', si: 1.9, hs: '#b6b4e2', hg: '#7a5444', hi: 0.85, night: 0.35, dir: [-0.72, 0.36, -0.2] },
  { p: 360, top: '#1f2759', bot: '#ea9065', sun: '#ff9d5e', si: 1.45, hs: '#9da2dc', hg: '#6c4a3a', hi: 0.8, night: 0.8, dir: [-0.78, 0.26, -0.05] },
]
const NIGHT = { top: '#0c1333', bot: '#2e3c78', sun: '#b9c8ff', si: 1.4, hs: '#8794d6', hg: '#3a3150', hi: 0.75, night: 1, dir: [0.5, 0.7, -0.5] }

const C = (h) => new THREE.Color(h)
const toColors = (k) => ({ ...k, top: C(k.top), bot: C(k.bot), sun: C(k.sun), hs: C(k.hs), hg: C(k.hg), dir: new THREE.Vector3(...k.dir).normalize() })
const keys = KEYS.map(toColors)
const night = toColors(NIGHT)

export const pal = {
  top: new THREE.Color(), bot: new THREE.Color(), sun: new THREE.Color(), hs: new THREE.Color(), hg: new THREE.Color(),
  si: 1, hi: 1, night: 0, dir: new THREE.Vector3(),
  foliage: new THREE.Color(),
}

const SEASON = [
  [0, '#78bf55'], [75, '#a6d66c'], [120, '#7cc35a'], [165, '#5aa84b'], [200, '#7fa841'],
  [214, '#d99a38'], [240, '#de7b30'], [270, '#cf5b2c'], [300, '#c4552c'],
].map(([p, c]) => [p, C(c)])

function mixKey(out, a, b, t) {
  out.top.lerpColors(a.top, b.top, t)
  out.bot.lerpColors(a.bot, b.bot, t)
  out.sun.lerpColors(a.sun, b.sun, t)
  out.hs.lerpColors(a.hs, b.hs, t)
  out.hg.lerpColors(a.hg, b.hg, t)
  out.si = lerp(a.si, b.si, t)
  out.hi = lerp(a.hi, b.hi, t)
  out.night = lerp(a.night, b.night, t)
  out.dir.lerpVectors(a.dir, b.dir, t).normalize()
}

const tmp = toColors(KEYS[0])
export function updatePalette(p, nightMix) {
  p = clamp(p, 0, 360)
  let i = 1
  while (i < keys.length - 1 && p > keys[i].p) i++
  const a = keys[i - 1], b = keys[i]
  mixKey(tmp, a, b, clamp((p - a.p) / (b.p - a.p)))
  mixKey(pal, tmp, night, nightMix)

  let j = 1
  while (j < SEASON.length - 1 && p > SEASON[j][0]) j++
  const [pa, ca] = SEASON[j - 1], [pb, cb] = SEASON[j]
  pal.foliage.lerpColors(ca, cb, clamp((p - pa) / (pb - pa)))
}

export const treeGrowth = (p) => 0.72 + 0.5 * clamp(p / 360)

// Story layout. Angles are degrees around the planet (0 = the India house, 360 = back at it).
// Camera views are [z, s, h] in path coordinates relative to the stop (see geo.js).
// scene: seconds spent looking at the chapter's scene before the photos.
// layout: how the chapter's photos are arranged (corridor | sky | clothesline | arc).

export const CHAPTERS = [
  { id: 1, name: 'Two sides of the world', angle: 0, scene: 9, layout: 'sky',
    view: { pos: [-5.4, -0.6, 2.2], look: [3, 1.4, 2.0] } },
  { id: 2, name: 'The wedding and the move', angle: 20, scene: 7, corridorStart: 3.7 },
  { id: 3, name: 'The first home', angle: 88, scene: 10,
    view: { pos: [-3.6, -1.5, 1.9], look: [1.4, 2.5, 0.95] } },
  { id: 4, name: 'Then I came along', angle: 106, scene: 6 },
  { id: 5, name: 'The fun kid years', angle: 128, scene: 7, layout: 'clothesline' },
  { id: 6, name: 'Achoo arrives', angle: 158, scene: 7 },
  { id: 7, name: 'American adventures', angle: 198, scene: 10,
    view: { pos: [-6.2, 0, 1.7], look: [2, 0, 1.6] } },
  { id: 8, name: 'Back where it started', angle: 254, scene: 7 },
  { id: 9, name: 'What they are to us', angle: 360, scene: 10, layout: 'helix', photoSec: 2.6, finale: true,
    view: { pos: [-6.6, 0.8, 2.3], look: [4.5, -0.8, 3.6] } },
]

export const DEFAULT_VIEW = { pos: [-5.4, 0, 2.5], look: [3.2, 0, 0.95] }
export const WALK_VIEW = { pos: [-4.8, 0, 2.25], look: [4.5, 0, 0.8] }
export const FLIGHT_VIEW = { pos: [-5.4, 0, 3.9], look: [4, 0, 2.4] }
export const FINALE_VIEW = { pos: [2.3, 0, 1.12], look: [0, 0, 0.86] }
// On the way to the finale: up and to the side, so the camera never passes through the family.
export const APPROACH_VIEW = { pos: [2.6, -5.5, 3.0], look: [0, 0, 0.9] }

export const PHOTO_SECONDS = 4.4

// Family. Colors and heights are placeholders until we have the real details.
export const FAMILY = {
  nana: { appear: 19.5, height: 1.15, shirt: '#4a78b0', trousers: '#3a3f4e', skin: '#a8714c', hair: '#211812' },
  amma: { appear: 19.5, height: 1.06, saree: '#b8325a', border: '#e6b648', blouse: '#e6b648', skin: '#b07a55', hair: '#1c1410' },
  kid1: { appear: 105.5, girl: true, top: '#3aa7a0', dress: '#f07a5a', skin: '#ad7650', hair: '#211812',
    grow: [[105, 0.42], [128, 0.55], [198, 0.7], [254, 0.79], [360, 0.87]] },
  kid2: { appear: 157.5, top: '#f2b84b', shorts: '#c0504d', skin: '#b07a55', hair: '#211812',
    grow: [[157, 0.4], [198, 0.5], [254, 0.6], [360, 0.73]] },
}
export const ORDER = ['nana', 'kid1', 'kid2', 'amma']

// Where each member walks sideways (world x, + = left of screen) given who is present.
// At the very end the kids step to the outside so Nana and Amma stand together in the middle.
export const FINALE_ORDER = ['kid1', 'nana', 'amma', 'kid2']
export function formation(present, order = ORDER) {
  const keys = order.filter((k) => present.includes(k))
  const n = keys.length, gap = 0.5
  const out = {}
  keys.forEach((k, i) => (out[k] = ((n - 1) / 2 - i) * gap))
  return out
}

export function curve(points, p) {
  if (p <= points[0][0]) return points[0][1]
  for (let i = 1; i < points.length; i++) {
    const [a, va] = points[i - 1], [b, vb] = points[i]
    if (p <= b) return va + (vb - va) * ((p - a) / (b - a))
  }
  return points[points.length - 1][1]
}

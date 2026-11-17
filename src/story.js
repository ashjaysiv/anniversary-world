// The story timeline: one mutable object, advanced every frame by tick().
import { CHAPTERS, PHOTO_SECONDS } from './config'
import { clamp, easeInOut, bump } from './geo'
import { startMusic, fadeMusic } from './audio'

export const story = {
  phase: 'loading', // loading | begin | intro | walk | hold | outro | end
  progress: 0, // degrees around the planet
  idx: 0, // chapter we are at (or walking from)
  target: 0, // chapter we are walking to
  from: 0, to: 0, moveT: 0, moveDur: 1, fast: false,
  holdT: 0,
  paused: false,
  wide: 1, wideFrom: 1, wideTo: 1, wideT: 0, wideDur: 1,
  wideNight: 1,
  introT: 0,
  time: 0,
  photos: {}, // chapter id -> [{src, w, h}]
  textures: {}, // src -> THREE.Texture
  face: null, // [z, s] the family looks toward while stopped
}

export const photosFor = (idx) => story.photos[CHAPTERS[idx].id] ?? []

export function holdPlan(idx) {
  const ch = CHAPTERS[idx]
  const n = photosFor(idx).length
  const segs = [{ kind: 'scene', dur: ch.scene ?? 5 }]
  for (let i = 0; i < n; i++) segs.push({ kind: 'photo', i, dur: ch.photoSec ?? PHOTO_SECONDS })
  if (n) segs.push({ kind: 'scene', dur: 2 })
  if (ch.finale) segs.push({ kind: 'finale', dur: 6 })
  return segs
}

export function currentSegment() {
  if (story.phase !== 'hold') return null
  let t = story.holdT
  for (const s of holdPlan(story.idx)) {
    if (t < s.dur) return { ...s, t }
    t -= s.dur
  }
  return null
}

const holdTotal = (idx) => holdPlan(idx).reduce((a, s) => a + s.dur, 0)

// Seconds since the family arrived at chapter idx; 0 before, large once it is passed.
export function chapterTime(idx) {
  if (story.idx === idx && ['hold', 'outro', 'end'].includes(story.phase)) return story.holdT
  const a = CHAPTERS[idx].angle
  if (story.phase === 'begin' || story.phase === 'intro' || story.phase === 'loading') return 0
  return story.progress > a + 0.5 ? 999 : 0
}

// 0..1 how "in the plane" we are at a given progress.
export const flight = (p) => Math.max(bump(p, 28, 33.5, 68.5, 74), bump(p, 287, 292.5, 331, 337))
export const boarded = (p) => Math.max(bump(p, 27.4, 28.8, 73.2, 74.6), bump(p, 286.4, 287.8, 336.2, 337.6))

function setWide(to, dur) {
  story.wideFrom = story.wide
  story.wideTo = to
  story.wideT = 0
  story.wideDur = dur
}

function enterHold(i) {
  story.idx = i
  story.target = i
  story.progress = CHAPTERS[i].angle
  story.holdT = 0
  story.phase = 'hold'
}

function walkTo(target, fast) {
  target = clamp(target, 0, CHAPTERS.length - 1)
  story.from = story.progress
  story.to = CHAPTERS[target].angle
  story.target = target
  story.moveT = 0
  story.fast = fast
  const dist = Math.abs(story.to - story.from)
  story.moveDur = fast ? clamp(dist / 28, 1.2, 3.5) : clamp(dist / 3.2, 5, 18)
  story.phase = 'walk'
}

export function start() {
  if (story.phase !== 'begin') return
  story.phase = 'intro'
  story.introT = 0
  story.progress = 0
  story.idx = 0
  story.wideNight = 1
  setWide(0, 6.5)
  startMusic()
  const el = document.documentElement
  if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {})
}

export function jumpTo(i) {
  story.wide = 0
  setWide(0, 0.01)
  story.wideNight = 0.5
  enterHold(i)
}

export function next() {
  const last = CHAPTERS.length - 1
  switch (story.phase) {
    case 'begin': return start()
    case 'intro': setWide(0, 0.01); story.wide = 0; return enterHold(0)
    case 'hold': return story.idx < last ? walkTo(story.idx + 1, true) : beginOutro()
    case 'walk': return walkTo(story.fast && story.target > story.idx ? story.target + 1 : story.target, true)
  }
}

export function prev() {
  switch (story.phase) {
    case 'hold': return walkTo(story.idx - 1, true)
    case 'walk': return walkTo(story.target > story.idx ? story.idx : story.target - 1, true)
    case 'outro':
    case 'end':
      story.wideNight = 0.5
      setWide(0, 3)
      story.phase = 'hold'
      story.holdT = 0
      fadeMusic(0.55, 2)
      return
  }
}

export function togglePause() {
  if (['hold', 'walk', 'intro', 'outro'].includes(story.phase)) story.paused = !story.paused
}

export function restart() {
  story.phase = 'begin'
  story.progress = 0
  story.idx = 0
  story.target = 0
  story.holdT = 0
  story.paused = false
  story.wide = 1
  setWide(1, 0.01)
  story.wideNight = 1
}

function beginOutro() {
  story.phase = 'outro'
  story.wideNight = 0.7
  setWide(1, 9)
  fadeMusic(0.25, 9)
}

export function tick(dt) {
  story.time += dt
  if (story.wideT < story.wideDur) {
    story.wideT = Math.min(story.wideDur, story.wideT + (story.paused ? 0 : dt))
    story.wide = story.wideFrom + (story.wideTo - story.wideFrom) * easeInOut(story.wideT / story.wideDur)
  }
  if (story.paused) return
  switch (story.phase) {
    case 'intro':
      story.introT += dt
      if (story.wideT >= story.wideDur) enterHold(0)
      break
    case 'hold':
      story.holdT += dt
      if (story.holdT >= holdTotal(story.idx)) {
        if (story.idx < CHAPTERS.length - 1) walkTo(story.idx + 1, false)
        else beginOutro()
      }
      break
    case 'walk': {
      story.moveT += dt
      const k = clamp(story.moveT / story.moveDur)
      story.progress = story.from + (story.to - story.from) * easeInOut(k)
      if (k >= 1) enterHold(story.target)
      break
    }
    case 'outro':
    case 'end':
      story.holdT += dt
      if (story.phase === 'outro' && story.wideT >= story.wideDur) story.phase = 'end'
      break
  }
}

// Music: plays the score in score.js and keeps it in step with the story.
// - Each chapter stop has its own cue; the two flights have theirs; the ending has one.
// - On a walk the departing cue keeps playing for the first part, then the next chapter's cue
//   fades in as the family approaches. Skipping with the arrow keys crossfades faster.
// - Pausing the show pauses the music exactly where it is.
// - To use a real recording for any cue, put it at public/audio/music/<cue>.mp3
//   (cues: ch1 ... ch9, flightOut, flightHome, outro). It loops while that cue plays.
import { createScore, CUE_NAMES } from './score'
import { story, flight, currentSegment, chapterTime, holdPlan } from './story'
import { CHAPTERS } from './config'
import { bump, smoothstep } from './geo'

let ctx = null
let score = null
let lastCue = null
let prevHold = 0, prevIdx = -1, prevBlink = 0, finaleDone = false

const idxOf = (id) => CHAPTERS.findIndex((c) => c.id === id)
const cueOf = (i) => 'ch' + CHAPTERS[i].id

// Connects the music to an audio context (also used by the offline soundtrack test).
export function attachAudio(context) {
  ctx = context
  score = createScore(ctx)
  return score
}

// Must first be called from a key press: browsers only allow sound after one.
export function ensureAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    attachAudio(new AC({ latencyHint: 'playback' }))
    setInterval(() => ctx.state === 'running' && score.scheduleUntil(ctx.currentTime + 0.3), 40)
    loadRecordings()
  }
  if (ctx.state === 'suspended' && !story.paused) ctx.resume()
}

export const currentCue = () => score?.cue ?? '-'

async function loadRecordings() {
  for (const name of CUE_NAMES) {
    try {
      const r = await fetch(`audio/music/${name}.mp3`)
      if (!r.ok || !(r.headers.get('content-type') || '').startsWith('audio')) continue
      score.setOverride(name, await ctx.decodeAudioData(await r.arrayBuffer()))
    } catch {}
  }
}

function cueFor() {
  switch (story.phase) {
    case 'intro':
      return 'ch1'
    case 'hold':
      return cueOf(story.idx)
    case 'walk': {
      const p = story.progress
      if (flight(p) > 0.02) return p < 180 ? 'flightOut' : 'flightHome'
      const a = story.from, b = story.to
      const lo = Math.min(a, b), hi = Math.max(a, b)
      // legs with a flight: the departing cue plays until boarding, the arriving one after landing
      if ((lo < 30 && hi > 70) || (lo < 290 && hi > 333)) return Math.abs(p - a) < Math.abs(p - b) ? cueOf(story.idx) : cueOf(story.target)
      return story.moveT / story.moveDur < 0.3 ? cueOf(story.idx) : cueOf(story.target)
    }
    case 'outro':
    case 'end':
      return 'outro'
    default:
      return null
  }
}

function fadeFor(from, to) {
  if (!from) return 4 // first notes after the key press
  if (!to) return 2
  if (to === 'outro') return 6
  if (story.fast) return 1.2
  if (from.startsWith('flight') || to.startsWith('flight')) return 3
  return 3.5
}

// ch9 grows from a quiet start to the full theme over the photo tower, then calms for the finale.
function energy9(h) {
  const total = holdPlan(story.idx).reduce((s, x) => s + x.dur, 0)
  const photosEnd = total - 8
  if (currentSegment()?.kind === 'finale') return 0.3
  if (h < 10) return 0.12 + 0.1 * (h / 10)
  return 0.25 + 0.75 * smoothstep(10, 10 + (photosEnd - 10) * 0.7, h)
}

// Called every frame.
export function updateMusic() {
  if (!score) return
  if (story.paused && ctx.state === 'running') ctx.suspend()
  if (!story.paused && ctx.state === 'suspended') ctx.resume()
  if (story.paused) return

  const cue = cueFor()
  if (cue !== lastCue) {
    score.setCue(cue, fadeFor(lastCue, cue))
    lastCue = cue
  }

  const p = story.progress
  const t7 = chapterTime(idxOf(7))
  const rain = t7 > 100 ? 0 : bump(t7, 1.4, 2.8, 7.8, 9.4)
  score.params.rain = rain
  score.setRain(rain)
  score.setMuffle(rain * 0.55)
  score.params.india = smoothstep(318, 338, p)

  if (story.phase === 'hold') {
    const id = CHAPTERS[story.idx].id
    const h = story.holdT
    const crossed = (x) => prevIdx === story.idx && prevHold < x && h >= x
    if (id === 1 && crossed(3.6)) score.event('rings') // the rings travel along the phone line
    if (id === 9) {
      score.params.energy = energy9(h)
      if (h < 1) finaleDone = false
      if (crossed(1.5)) score.event('lanterns')
      if (!finaleDone && currentSegment()?.kind === 'finale') {
        score.event('finale')
        finaleDone = true
      }
    } else finaleDone = false
    prevHold = h
    prevIdx = story.idx
  } else {
    prevIdx = -1
    if (story.phase !== 'outro' && story.phase !== 'end') finaleDone = false
  }

  // the horror movie scare in the first apartment (same 6.5 s cycle as the TV in scenes.jsx)
  const blink = story.time % 6.5
  const tvInView = currentSegment()?.kind !== 'photo'
  if (cue === 'ch3' && tvInView && Math.abs(p - CHAPTERS[idxOf(3)].angle) < 8 && prevBlink < 5.5 && blink >= 5.5) score.event('scare')
  prevBlink = blink
}

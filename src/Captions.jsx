// Storybook captions: an HTML layer over the 3D scene. Words fade in one by one; italic asides
// arrive after a short pause. Which card shows is worked out from the story clock every frame.
import { useEffect, useState } from 'react'
import { story, currentSegment, verseInfo } from './story'
import { CHAPTERS } from './config'
import { OPENING, AT_STOP, ON_WALK, VERSES, FINALE, schedule, ASIDE_PAUSE } from './narration'

const WORD_STEP = 0.14 // seconds between words appearing

function pick(prefix, cards, t) {
  const sch = schedule(cards)
  for (let i = 0; i < sch.length; i++) if (t >= sch[i].start && t < sch[i].end) return { key: prefix + i, card: sch[i].card }
  return null
}

export function activeCard() {
  const ph = story.phase
  if (ph === 'opening') return pick('op', OPENING, story.openingT)
  const ch = CHAPTERS[story.idx]
  if (ph === 'walk' && story.target > story.idx) return pick(`w${ch.id}-`, ON_WALK[ch.id], story.moveT)
  if (ch.layout === 'helix') {
    if (ph === 'outro' || ph === 'end') return { key: 'finale', card: FINALE }
    if (ph !== 'hold') return null
    const seg = currentSegment()
    if (!seg) return null
    if (seg.kind === 'finale') return { key: 'finale', card: FINALE }
    if (seg.v === undefined) return null
    // A verse's cards stay up for the whole verse; with two cards, the second takes over when it starts.
    const { t, dur } = verseInfo(seg.v)
    const sch = schedule(VERSES[seg.v].cards)
    for (let i = sch.length - 1; i >= 0; i--) {
      if (t >= sch[i].start) return t < dur - 0.4 ? { key: `v${seg.v}-${i}`, card: sch[i].card } : null
    }
    return null
  }
  if (ph === 'hold') return pick(`c${ch.id}-`, AT_STOP[ch.id], story.holdT)
  return null
}

function Card({ card, out }) {
  let delay = 0.15
  const spans = []
  card.parts.forEach(([text, kind], pi) => {
    if (kind === 'i') delay += ASIDE_PAUSE
    text.split(/\s+/).filter(Boolean).forEach((w, wi) => {
      spans.push(
        <span key={`${pi}-${wi}`} className={kind === 'i' ? 'w i' : 'w'} style={{ animationDelay: `${delay.toFixed(2)}s` }}>
          {w}
        </span>,
        ' ',
      )
      delay += WORD_STEP
    })
  })
  return <div className={`cap ${card.style ?? 'line'}${out ? ' out' : ''}`}>{spans}</div>
}

export function Captions() {
  const [shown, setShown] = useState([]) // [{key, card, out}]
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    let raf, lastKey = null
    const loop = () => {
      const a = activeCard()
      const key = a?.key ?? null
      if (key !== lastKey) {
        lastKey = key
        setShown((prev) => [...prev.filter((x) => !x.out).map((x) => ({ ...x, out: true })), ...(a ? [{ ...a, out: false }] : [])])
        setTimeout(() => setShown((prev) => prev.filter((x) => !x.out)), 1000)
      }
      setPaused((p) => (p !== story.paused ? story.paused : p))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  const lineOn = shown.some((x) => !x.out && (x.card.style ?? 'line') === 'line')
  return (
    <div className={`captions${paused ? ' paused' : ''}`}>
      <div className={`cap-fade${lineOn ? ' on' : ''}`} />
      {shown.map((x) => <Card key={x.key} card={x.card} out={x.out} />)}
    </div>
  )
}

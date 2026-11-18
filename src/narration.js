// The anniversary message, as caption cards.
// A card is made of parts: [text] or [text, 'i'] for an italic aside that arrives after a short pause.
// at: earliest start, in seconds after arriving at the stop (or after the opening / walk begins).
// style: 'title' (large script, top of screen) or 'line' (storybook caption, bottom of screen).

export const WPS = 2.3 // words per second a sofa audience reads comfortably
export const ASIDE_PAUSE = 0.8
export const GAP = 0.5 // breathing space between cards

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length
export const cardWords = (card) => card.parts.reduce((n, [t]) => n + words(t), 0)
export const readTime = (card) =>
  1.2 + cardWords(card) / WPS + card.parts.filter((p) => p[1] === 'i').length * ASIDE_PAUSE

export const OPENING = [
  { style: 'title', parts: [['Happy 25th Wedding Anniversary!']] },
  { parts: [['25 years of a beautiful story that Achoo and I got to be a part of.']] },
  { parts: [['A journey that is core to what we have become, and what we will be.']] },
  { parts: [['A story that became our world.']] },
]

// Cards that play while stopped at a chapter, keyed by chapter id.
export const AT_STOP = {
  1: [
    { at: 0.8, parts: [['Your journey may have started over calls, with Nana in the US and Amma in India…']] },
    { parts: [['…at a time when international phone bills weren’t cheap.']], beat: 'coins' },
    { parts: [['But little did you know then what it would become.']] },
    { parts: [['Its first official commitment was online, too: an online engagement.']], beat: 'rings' },
  ],
  2: [{ at: 0.8, parts: [['Your marriage was the coming together of two worlds, to make ours.']] }],
  3: [
    { at: 0.8, parts: [['The first part of it was in the US, building memories:']] },
    { parts: [['Nana teaching Amma how to cook, many nights of horror movies…']] },
  ],
  4: [{ at: 0.6, parts: [['Then I came along.'], ['Obviously, the best part.', 'i']] }],
  6: [{ at: 0.6, parts: [['And then came Achoo,'], ['obviously the second best part,', 'i'], ['completing the family of four.']] }],
  7: [{ at: 0.8, parts: [['We built a lot of fun memories in the US…']] }],
  8: [{ at: 0.8, parts: [['…before we moved back to India, where everything began.']] }],
}

// Cards that play while walking away from a chapter, keyed by the chapter walked from.
export const ON_WALK = {
  3: [{ at: 0.6, parts: [['…and roaming the US.']] }],
}

// Chapter 9: the spiral tower. Each verse opens with a wide shot of its moment, then climbs its photos.
// shot: seconds of the wide shot. view: camera [z, s, h] in path coordinates at the India house.
export const VERSES = [
  { key: 'givers', shot: 5, view: { pos: [-3.4, 0.5, 1.5], look: [0.6, 0.1, 1.2] },
    cards: [{ parts: [['Through these 25 years, for us, you are givers, who brought us to where we are.']] }] },
  { key: 'protectors', shot: 7, view: { pos: [-4.6, 0.4, 2.1], look: [0.5, 0, 0.9] },
    cards: [{ parts: [['You are protectors, who kept us safe in this vast world…'], ['sometimes a little too much, but okay, we’ve had our moments.', 'i']] }] },
  { key: 'strength', shot: 5.5, view: { pos: [-5.6, 1.8, 2.0], look: [-0.6, -2.0, 1.9] },
    cards: [{ parts: [['You taught us what it means to be strong, and to stand up for what we want.']] }] },
  { key: 'dreams', shot: 6, view: { pos: [-6.0, 0.8, 1.8], look: [2.0, -0.2, 2.3] },
    cards: [{ parts: [['You believed in our goals and ambitions. In fact, you created those dreams for us, knowing we could take a big leap forward.']] }] },
  { key: 'stoodby', shot: 5, view: { pos: [2.6, 0.2, 1.4], look: [-0.6, 0, 0.65] },
    cards: [{ parts: [['You stood by us, even when we were at fault.']] }] },
  { key: 'noteasy', shot: 6.5, view: { pos: [-4.8, -1.4, 1.9], look: [1.6, 2.4, 1.7] },
    cards: [
      { parts: [['You didn’t have it easy: from working late into the night, to giving up the US life for an Indian way of life…']] },
      { parts: [['…to Amma pausing her career to give us the best one we could have.']] },
    ] },
  { key: 'force', shot: 6, view: { pos: [-8.0, 0.8, 1.4], look: [4.5, -1, 6.5] },
    cards: [{ parts: [['Together, in these 25 years, you were and are a powerful force for us.']] }] },
]

export const FINALE = { style: 'title', parts: [['Thank you, and Happy Wedding Anniversary!']] }

// Lays cards out one after another: [{card, start, end}].
export function schedule(cards = []) {
  let t = 0
  return cards.map((card) => {
    const start = Math.max(card.at ?? 0, t)
    const end = start + readTime(card)
    t = end + GAP
    return { card, start, end }
  })
}

export const scheduleEnd = (cards) => {
  const s = schedule(cards)
  return s.length ? s[s.length - 1].end : 0
}

// Start time of the card marked with a beat name at a stop (scenes time their moments to it).
export function beatTime(chapterId, beat) {
  const hit = schedule(AT_STOP[chapterId]).find((x) => x.card.beat === beat)
  return hit ? hit.start : 0
}

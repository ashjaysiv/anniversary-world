// The score: a small orchestra synthesized in Web Audio, so the music needs no files and works offline.
// Each part of the story has a cue (tempo, key, chords, instruments, melody). audio.js picks the cue
// from where the story is; cues crossfade when it changes. One "family theme" (THEME) is introduced
// on the flute in chapter 1 and comes back in full in chapter 9 and the ending.
// This file has no browser-only imports, so it also renders in an OfflineAudioContext for testing.

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12)
const C = (b, n) => ({ b, n }) // b: bass note, n: chord voicing (MIDI numbers)

// ---------- chords ----------
// D major (India, the family theme)
const D = C(38, [62, 66, 69, 74])
const D_Cs = C(37, [61, 64, 69]) // A/C#
const Bm = C(35, [62, 66, 71])
const G = C(43, [62, 67, 71])
const A = C(45, [61, 64, 69])
const GoverD = C(38, [62, 67, 71])
const AoverD = C(38, [61, 64, 69])
// flights: floating, lydian colours over a pedal
const Dmaj9 = C(38, [66, 69, 73, 76])
const EoverD = C(38, [64, 68, 71, 76])
const Bm7 = C(35, [62, 66, 69, 74])
const Gmaj7 = C(43, [62, 66, 71, 74])
// F major (the first American home, the baby)
const F = C(41, [65, 69, 72])
const Dm = C(38, [65, 69, 74])
const Bb = C(46, [65, 70, 74])
const Cc = C(36, [64, 67, 72])
const CoverE = C(40, [64, 67, 72])
// G major (kid years, Achoo)
const Gg = C(43, [67, 71, 74])
const Cg = C(36, [67, 72, 76])
const Dg = C(38, [66, 69, 74])
const Em = C(40, [67, 71, 76])
const DoverFs = C(42, [66, 69, 74])
// A major (adventures)
const Aa = C(45, [64, 69, 73, 76])
const Ea = C(40, [64, 68, 71, 76])
const Fsm = C(42, [66, 69, 73, 78])
const Da = C(38, [66, 69, 74, 78])

// ---------- melodies: one array per bar, notes are [beat, midi, beats] ----------
const THEME = [
  [[0, 78, 2], [2, 76, 1], [3, 74, 1]],
  [[0, 76, 3], [3, 69, 1]],
  [[0, 71, 1], [1, 74, 1], [2, 78, 2]],
  [[0, 76, 3.5]],
  [[0, 81, 2], [2, 78, 1], [3, 76, 1]],
  [[0, 74, 1], [1, 76, 1], [2, 78, 2]],
  [[0, 76, 2], [2, 74, 1], [3, 76, 1]],
  [[0, 74, 4]],
]
const THEME_CHORDS = [D, D_Cs, Bm, G, D, G, A, D]

const WEDDING = [
  [[0, 74, 0.5], [0.5, 76, 0.5], [1, 78, 1], [2, 81, 1], [3, 78, 0.5], [3.5, 76, 0.5]],
  [[0, 74, 1], [1, 71, 0.5], [1.5, 74, 0.5], [2, 76, 2]],
  [[0, 76, 0.5], [0.5, 78, 0.5], [1, 81, 1], [2, 83, 1], [3, 81, 1]],
  [[0, 78, 0.5], [0.5, 76, 0.5], [1, 74, 2.5]],
  [[0, 81, 0.5], [0.5, 83, 0.5], [1, 86, 1], [2, 83, 0.5], [2.5, 81, 0.5], [3, 78, 1]],
  [[0, 79, 1], [1, 78, 0.5], [1.5, 76, 0.5], [2, 74, 2]],
  [[0, 76, 0.5], [0.5, 78, 0.5], [1, 76, 0.5], [1.5, 74, 0.5], [2, 73, 1], [3, 76, 1]],
  [[0, 74, 3]],
]
const FLY = [[[0, 81, 3], [3, 78, 1]], [[0, 80, 4]], [[0, 78, 2], [2, 74, 2]], [[0, 74, 4]]]
const HOME = [
  [[0, 81, 0.5], [0.5, 79, 0.5], [1, 77, 1], [2.5, 72, 0.5], [3, 77, 1]],
  [[0, 81, 0.75], [1, 77, 0.5], [1.5, 74, 1.5], [3.5, 77, 0.5]],
  [[0, 79, 0.5], [0.5, 77, 0.5], [1, 74, 0.5], [1.5, 70, 1.5], [3, 74, 1]],
  [[0, 76, 0.5], [0.5, 79, 0.5], [1, 84, 1], [2, 79, 2]],
]
const LULLABY = [
  [[0, 81, 1], [1, 79, 0.5], [1.5, 77, 0.5], [2, 79, 1]],
  [[0, 76, 1], [1, 72, 2]],
  [[0, 74, 1], [1, 77, 1], [2, 81, 1]],
  [[0, 79, 3]],
  [[0, 81, 1], [1, 79, 0.5], [1.5, 77, 0.5], [2, 79, 1]],
  [[0, 76, 1], [1, 79, 1], [2, 84, 1]],
  [[0, 82, 1], [1, 81, 1], [2, 79, 1]],
  [[0, 77, 3]],
]
const FUN = [
  [[0, 79, 0.5], [0.5, 79, 0.5], [1, 83, 0.5], [1.5, 86, 1], [3, 83, 0.5], [3.5, 81, 0.5]],
  [[0, 79, 0.5], [0.5, 76, 0.5], [1, 79, 1.5], [3, 84, 1]],
  [[0, 81, 0.5], [0.5, 83, 0.5], [1, 81, 0.5], [1.5, 78, 0.5], [2, 74, 1], [3, 81, 1]],
  [[0, 79, 2], [2.5, 74, 0.5], [3, 79, 0.5], [3.5, 83, 0.5]],
  [[0, 83, 0.5], [0.5, 86, 0.5], [1, 88, 1], [2, 86, 0.5], [2.5, 83, 0.5], [3, 79, 1]],
  [[0, 84, 1], [1, 83, 0.5], [1.5, 79, 1.5], [3, 76, 1]],
  [[0, 78, 0.5], [0.5, 81, 0.5], [1, 86, 1], [2, 84, 1], [3, 81, 1]],
  [[0, 81, 1.5], [1.5, 78, 0.5], [2, 74, 2]],
]
const ACHOO = [
  [[0, 83, 1.5], [1.5, 81, 0.5], [2, 79, 1], [3, 81, 1]],
  [[0, 78, 2], [2, 74, 1], [3, 76, 1]],
  [[0, 79, 1.5], [1.5, 76, 0.5], [2, 83, 2]],
  [[0, 81, 3], [3, 79, 1]],
  [[0, 86, 1.5], [1.5, 83, 0.5], [2, 81, 1], [3, 83, 1]],
  [[0, 81, 2], [2, 78, 1], [3, 79, 1]],
  [[0, 76, 1], [1, 79, 1], [2, 83, 1], [3, 81, 1]],
  [[0, 79, 4]],
]
const ADVENTURE = [
  [[0, 76, 0.5], [0.5, 78, 0.5], [1, 81, 1], [2, 76, 1], [3, 73, 1]],
  [[0, 71, 0.5], [0.5, 73, 0.5], [1, 76, 1.5], [2.5, 71, 0.5], [3, 68, 1]],
  [[0, 73, 0.5], [0.5, 76, 0.5], [1, 78, 1], [2, 81, 1], [3, 78, 0.5], [3.5, 76, 0.5]],
  [[0, 74, 1], [1, 78, 1], [2, 76, 2]],
]
const LEAVING = [
  [[0, 78, 2], [2, 76, 1], [3, 74, 1]],
  [[0, 71, 3], [3, 74, 1]],
  [[0, 76, 1.5], [1.5, 74, 0.5], [2, 69, 2]],
  [[0, 76, 4]],
]
const RETURN = [[[0, 74, 2], [2, 76, 2]], [[0, 78, 4]], [[0, 81, 2], [2, 78, 2]], [[0, 76, 2], [2, 74, 2]]]
const ENDING = [[[0, 78, 2], [2, 76, 1], [3, 74, 1]], [[0, 76, 4]], [[0, 74, 4]], []]

// Plays the notes of `line` that start within the current beat.
function mel(b, line, fn, shift = 0) {
  const bar = line[b.bar % line.length]
  for (const [off, m, len] of bar) {
    if (off >= b.beat && off < b.beat + 1) fn(b.t + (off - b.beat) * b.spb, m + shift, len * b.spb)
  }
}
// Two eighth notes per beat from an index pattern over [bass+12, ...chord].
function eighths(b, pattern, fn) {
  const tones = [b.chord.b + 12, ...b.chord.n]
  for (let s = 0; s < 2; s++) {
    const k = pattern[(b.beat * 2 + s) % pattern.length]
    fn(b.t + (s * b.spb) / 2, typeof k === 'number' ? tones[k % tones.length] + (k >= tones.length ? 12 : 0) : null, s)
  }
}
const thirdOf = (c) => c.n.find((m) => [3, 4].includes((((m - c.b) % 12) + 12) % 12)) ?? c.n[1]
const TANPURA = [-5, 0, 0, -12] // Pa, Sa, Sa, low Sa

// ---------- cues ----------
const CUES = {
  // Two sides of the world: tender and far apart. Tanpura and piano; the flute plays the family theme.
  ch1: {
    bpm: 64, level: 0.82, chords: [D, D, ...THEME_CHORDS],
    play(b, x) {
      x.tanpura(b.t, 62 + TANPURA[b.i % 4], 0.5)
      if (b.beat === 0) x.pad(b.t, b.chord.n, b.spb * 4 + 0.4, 0.42, { cut: 1100 })
      if (b.bar >= 1) {
        const tones = [b.chord.b + 24, ...b.chord.n]
        x.piano(b.t, tones[b.beat % tones.length], b.beat === 0 ? 0.42 : 0.3, 3, -0.2)
      }
      if (b.bar >= 2 && b.beat === 0) x.bass(b.t, b.chord.b, b.spb * 3.6, 0.3)
      mel(b, [[], [], ...THEME], (t, m, d) => x.flute(t, m, d, 0.5, { bend: true }))
    },
    events: {
      rings: (x, t) => [86, 93, 90, 98].forEach((m, k) => x.bell(t + k * 0.22, m, 0.26, 3.2, k % 2 ? 0.4 : -0.4)),
    },
  },

  // The wedding: festive. Mridangam, veena ostinato, temple bells, a bright melody on flute and reed.
  ch2: {
    bpm: 112, level: 0.76, chords: [D, G, A, D],
    enter(x, t) {
      ;[93, 90, 88, 86, 81, 78, 76, 74].forEach((m, k) => x.bell(t + k * 0.09, m, 0.3, 2.4, (k % 3) * 0.3 - 0.3))
      x.stroke(t, 'dhin', 0.8)
    },
    play(b, x) {
      const strokes = ['dhin', null, 'ki', 'na', 'tha', 'ki', 'na', 'ki']
      for (let s = 0; s < 2; s++) {
        const st = strokes[b.beat * 2 + s], tt = b.t + (s * b.spb) / 2
        if (st) x.stroke(tt, st, 0.55)
        x.shaker(tt, s ? 0.1 : 0.06)
      }
      const vee = [0, 7, 12, 7, 16, 12, 7, 12]
      for (let s = 0; s < 2; s++) x.pluck(b.t + (s * b.spb) / 2, b.chord.b + 24 + vee[b.beat * 2 + s], 0.3, 0.9, -0.3, 3000)
      if (b.beat === 0 || b.beat === 2) x.bass(b.t, b.chord.b, b.spb * 1.6, 0.42)
      if (b.beat === 0) x.pad(b.t, b.chord.n, b.spb * 4 + 0.2, 0.22, { cut: 1800 })
      if (b.beat === 0 && b.bar % 2 === 0) x.bell(b.t, b.chord.n[b.chord.n.length - 1] + 12, 0.18, 2.5, 0.35)
      mel(b, WEDDING, (t, m, d) => {
        x.flute(t, m, d * 0.95, 0.5, { bend: d > b.spb * 0.9 })
        x.reed(t, m - 12, d * 0.95, 0.32)
      })
    },
  },

  // Flying to America: wonder and open sky. Lydian chords, shimmering bells, long flute notes.
  flightOut: {
    bpm: 76, level: 0.72, chords: [Dmaj9, EoverD, Bm7, Gmaj7],
    enter: (x, t) => x.riser(t, 3, 0.2),
    play(b, x) {
      if (b.beat === 0) {
        x.pad(b.t, b.chord.n, b.spb * 4 + 0.6, 0.5, { cut: 2400 })
        x.bass(b.t, b.chord.b, b.spb * 4, 0.36)
      }
      for (let s = 0; s < 2; s++) {
        const n = b.chord.n, m = n[(b.i * 2 + s + b.bar) % n.length] + 12
        x.bell(b.t + (s * b.spb) / 2, m, 0.1, 1.8, s ? 0.5 : -0.5)
      }
      mel(b, FLY, (t, m, d) => x.flute(t, m, d, 0.42))
    },
  },

  // The first home: cosy and a little comic. Pizzicato walking bass, marimba, brushes.
  ch3: {
    bpm: 100, level: 1.6, chords: [F, Dm, Bb, Cc],
    play(b, x) {
      const third = ((thirdOf(b.chord) - b.chord.b) % 12 + 12) % 12
      const walk = [0, third, 7, third]
      x.pluck(b.t, b.chord.b + 12 + walk[b.beat], 0.42, 0.55, -0.1, 1400)
      if (b.beat === 1 || b.beat === 3) {
        b.chord.n.forEach((m) => x.marimba(b.t + b.spb / 2, m, 0.16, 0.3))
        x.brush(b.t, 0.28)
      }
      x.shaker(b.t + b.spb / 2, 0.05)
      if (b.beat === 0) x.pad(b.t, b.chord.n, b.spb * 4, 0.2, { cut: 1300 })
      mel(b, HOME, (t, m) => x.marimba(t, m, 0.42, -0.15))
    },
    events: {
      // the horror movie on the TV makes everyone jump
      scare(x, t, bus) {
        x.thump(t, 70, 32, 1.2, 0.9)
        x.strings(t, 77, 0.9, 0.3, -0.3)
        x.strings(t, 78, 0.9, 0.3, 0.3)
        x.strings(t, 84, 0.9, 0.22, 0)
        const g = bus.dry.gain
        g.cancelScheduledValues(t)
        g.setValueAtTime(1, t)
        g.linearRampToValueAtTime(0.25, t + 0.08)
        g.setValueAtTime(0.25, t + 0.6)
        g.linearRampToValueAtTime(1, t + 1.1)
      },
    },
  },

  // Then I came along: a lullaby in 3/4 on a music box.
  ch4: {
    bpm: 84, beats: 3, level: 1.4, chords: [F, CoverE, Dm, Bb, F, Cc, Bb, Cc],
    play(b, x) {
      if (b.beat === 0) {
        x.piano(b.t, b.chord.b + 12, 0.3, 2.6, -0.2)
        x.pad(b.t, b.chord.n, b.spb * 3 + 0.3, 0.3, { cut: 1000 })
        if (b.bar % 4 === 0) x.bell(b.t, b.chord.n[2] + 24, 0.1, 3, 0.4)
      } else {
        b.chord.n.forEach((m) => x.piano(b.t, m, 0.13, 1.4, 0.1))
      }
      mel(b, LULLABY, (t, m) => x.musicbox(t, m + 12, 0.42, 0.15))
    },
  },

  // The fun kid years: bouncy and playful. Marimba, claps, a whistled tune.
  ch5: {
    bpm: 126, level: 1.15, chords: [Gg, Cg, Dg, Gg, Em, Cg, Dg, Dg],
    play(b, x) {
      if (b.beat === 0 || b.beat === 2) x.kick(b.t, 0.5)
      if (b.beat === 1 || b.beat === 3) x.clap(b.t, 0.26)
      x.shaker(b.t, 0.05)
      x.shaker(b.t + b.spb / 2, 0.09)
      const bounce = [0, 7, 12, 7]
      x.pluck(b.t, b.chord.b + bounce[b.beat], 0.42, 0.4, 0, 900)
      eighths(b, [1, 2, 3, 2, 1, 3, 2, 3], (t, m) => m && x.marimba(t, m, 0.2, 0.35))
      mel(b, FUN, (t, m, d) => x.flute(t, m, Math.min(d, b.spb * 1.5), 0.45))
    },
  },

  // Achoo arrives: warm and full-hearted. Piano arpeggios, strings, a heartbeat on the downbeat.
  ch6: {
    bpm: 92, level: 0.67, chords: [Gg, DoverFs, Em, Cg],
    enter(x, t) {
      ;[79, 83, 86, 91, 95].forEach((m, k) => x.bell(t + k * 0.14, m, 0.26, 2.8, k % 2 ? 0.35 : -0.35))
    },
    play(b, x) {
      eighths(b, [0, 1, 2, 3, 4, 3, 2, 1], (t, m) => m && x.piano(t, m, 0.24, 2, 0.15))
      if (b.beat === 0) {
        x.pad(b.t, b.chord.n, b.spb * 4 + 0.4, 0.38, { cut: 1600 })
        x.bass(b.t, b.chord.b, b.spb * 3.5, 0.42)
        x.kick(b.t, 0.32)
        x.kick(b.t + b.spb * 0.4, 0.2)
        if (b.bar % 2 === 0) x.bell(b.t, b.chord.n[2] + 12, 0.13, 2.6, -0.4)
      }
      mel(b, ACHOO, (t, m, d) => x.flute(t, m, d, 0.48, { bend: d >= b.spb }))
    },
  },

  // American adventures: a road trip. Strummed guitar, driving bass, drums. When the rain comes
  // the band drops out and only a warm pad and piano stay, under the umbrella.
  ch7: {
    bpm: 116, level: 1.05, chords: [Aa, Ea, Fsm, Da],
    play(b, x) {
      if ((b.p.rain ?? 0) > 0.3) {
        if (b.beat === 0) {
          x.pad(b.t, b.chord.n, b.spb * 4 + 0.5, 0.45, { cut: 900 })
          b.chord.n.forEach((m, k) => x.piano(b.t + k * 0.06, m, 0.2, 3, 0))
        }
        return
      }
      const strum = { 0: 1, 2: 1, 3: -1, 5: -1, 6: 1, 7: -1 }
      for (let s = 0; s < 2; s++) {
        const dir = strum[b.beat * 2 + s], tt = b.t + (s * b.spb) / 2
        if (dir) x.strum(tt, b.chord.n, dir, dir > 0 ? 0.3 : 0.18)
        x.pluck(tt, b.chord.b, 0.38, 0.3, 0, 700)
        x.shaker(tt, s ? 0.09 : 0.05)
      }
      if (b.beat === 0 || b.beat === 2) x.kick(b.t, 0.5)
      if (b.beat === 1 || b.beat === 3) x.brush(b.t, 0.34)
      mel(b, ADVENTURE, (t, m, d) => x.flute(t, m, d * 0.95, 0.45))
    },
  },

  // Back where it started: bittersweet. Piano and strings, the theme's colours in a minor key.
  ch8: {
    bpm: 68, level: 0.71, chords: [Bm, G, D, A],
    play(b, x) {
      eighths(b, [0, 1, 2, 3, 2, 1, 2, 3], (t, m) => m && x.piano(t, m, 0.22, 2.4, 0.1))
      if (b.beat === 0) {
        x.pad(b.t, b.chord.n, b.spb * 4 + 0.5, 0.34, { cut: 1100 })
        x.bass(b.t, b.chord.b, b.spb * 3.6, 0.3)
      }
      mel(b, LEAVING, (t, m, d) => x.flute(t, m, d, 0.42, { bend: true }))
    },
  },

  // Flying home: hopeful and building. The tanpura fades in as India comes into view.
  flightHome: {
    bpm: 76, level: 0.72, chords: [G, A, Bm, D],
    enter: (x, t) => x.riser(t, 3, 0.2),
    play(b, x) {
      if (b.beat === 0) {
        x.pad(b.t, b.chord.n, b.spb * 4 + 0.6, 0.5, { cut: 2200 })
        x.bass(b.t, b.chord.b, b.spb * 4, 0.38)
      }
      for (let s = 0; s < 2; s++) {
        const n = b.chord.n, m = n[(b.i * 2 + s + b.bar) % n.length] + 12
        x.bell(b.t + (s * b.spb) / 2, m, 0.1, 1.8, s ? 0.5 : -0.5)
      }
      const india = b.p.india ?? 0
      if (india > 0.05) x.tanpura(b.t, 62 + TANPURA[b.i % 4], 0.5 * india)
      mel(b, RETURN, (t, m, d) => x.flute(t, m, d, 0.45, { bend: true }))
    },
  },

  // What they are to us: the family theme in full. It grows layer by layer with `energy` (set from
  // how far into the photo tower we are) and swells at the finale.
  ch9: {
    bpm: 70, level: 0.88, chords: THEME_CHORDS,
    play(b, x) {
      const e = b.p.energy ?? 0.5
      x.tanpura(b.t, 62 + TANPURA[b.i % 4], 0.45)
      if (e < 0.3) {
        const tones = [b.chord.b + 24, ...b.chord.n]
        x.piano(b.t, tones[b.beat % tones.length], 0.28, 2.6, -0.15)
      } else {
        eighths(b, [0, 1, 2, 3, 2, 1, 2, 3], (t, m) => m && x.piano(t, m, 0.24, 2.4, -0.15))
      }
      if (e > 0.15 && b.beat === 0) x.pad(b.t, b.chord.n, b.spb * 4 + 0.5, 0.25 + 0.3 * e, { cut: 1000 + 1400 * e })
      if (e > 0.25) mel(b, THEME, (t, m, d) => x.flute(t, m, d, 0.5, { bend: true }))
      if (e > 0.85 && b.cycle % 2 === 1) mel(b, THEME, (t, m) => x.bell(t, m + 12, 0.12, 2.4, 0.3))
      if (e > 0.45 && b.beat === 0) x.bass(b.t, b.chord.b, b.spb * 3.8, 0.4)
      if (e > 0.55) {
        if (b.beat === 0) x.stroke(b.t, 'tha', 0.4)
        if (b.beat === 2) x.stroke(b.t, 'ki', 0.25)
        if (b.beat === 3) x.stroke(b.t + b.spb / 2, 'na', 0.25)
        x.shaker(b.t + b.spb / 2, 0.06 * e)
      }
      if (e > 0.7 && b.beat === 0) x.strings(b.t, thirdOf(b.chord) + 12, b.spb * 4, 0.32, 0.3)
      if (e > 0.8 && b.beat === 0) x.bell(b.t, b.chord.n[b.chord.n.length - 1] + 12, 0.1, 2.4, -0.4)
    },
    events: {
      // sky lanterns rising
      lanterns: (x, t) => [74, 78, 81, 86, 90, 93].forEach((m, k) => x.bell(t + k * 0.2, m, 0.2, 3, (k % 3) * 0.3 - 0.3)),
      // the last shot of the two of them
      finale(x, t) {
        x.pad(t, [50, 57, 62, 66, 69, 74, 78, 81], 7, 0.7, { cut: 3000, atk: 1.4, rel: 3 })
        ;[86, 90, 93, 98].forEach((m, k) => x.bell(t + k * 0.32, m, 0.25, 4, k % 2 ? 0.4 : -0.4))
        x.thump(t, 46, 38, 3.5, 0.45)
        x.strings(t, 78, 6, 0.35, 0)
      },
    },
  },

  // The ending: the theme's first and last phrases, then a quiet drone that can sit under the end screen.
  outro: {
    bpm: 60, level: 1.35, chords: [D, GoverD, D, AoverD],
    play(b, x) {
      x.tanpura(b.t, 62 + TANPURA[b.i % 4], 0.35)
      if (b.beat === 0) {
        x.pad(b.t, b.chord.n, b.spb * 4 + 0.8, 0.34, { cut: 1000 })
        if (b.bar % 2 === 0) x.bell(b.t, b.chord.n[b.chord.n.length - 1] + 12, 0.09, 3, 0.3)
        if (b.cycle > 0) x.piano(b.t, b.chord.b + 24, 0.14, 3, -0.2)
      }
      if (b.cycle === 0) mel(b, ENDING, (t, m, d) => x.piano(t, m, 0.34, Math.max(2.5, d), 0))
    },
  },
}

export const CUE_NAMES = Object.keys(CUES)
export { CUES } // for offline tests

// ---------- engine ----------
export function createScore(ctx, destination = ctx.destination) {
  const now = () => ctx.currentTime
  const sr = ctx.sampleRate

  const master = ctx.createGain()
  master.gain.value = 0.68
  const muffle = ctx.createBiquadFilter()
  muffle.type = 'lowpass'
  muffle.frequency.value = 20000
  muffle.Q.value = 0.5
  const comp = ctx.createDynamicsCompressor()
  comp.threshold.value = -16
  comp.knee.value = 10
  comp.ratio.value = 3.5
  comp.attack.value = 0.008
  comp.release.value = 0.3
  master.connect(muffle)
  muffle.connect(comp)
  comp.connect(destination)

  // reverb: generated impulse, darkened with a one-pole low-pass
  const reverb = ctx.createConvolver()
  {
    const len = Math.floor(sr * 3.2), ir = ctx.createBuffer(2, len, sr)
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c)
      let y = 0
      for (let i = 0; i < len; i++) {
        const x = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6)
        y += 0.32 * (x - y)
        d[i] = i < sr * 0.015 ? 0 : y
      }
    }
    reverb.buffer = ir
  }
  const revOut = ctx.createGain()
  revOut.gain.value = 1.4
  reverb.connect(revOut)
  revOut.connect(master)

  const noise = ctx.createBuffer(1, sr * 2, sr)
  {
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }

  // rain ambience, bypassing the muffle filter so it stays crisp
  const rainGain = ctx.createGain()
  rainGain.gain.value = 0
  {
    const src = ctx.createBufferSource()
    src.buffer = noise
    src.loop = true
    const hp = ctx.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 500
    const lp = ctx.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 3000
    src.connect(hp)
    hp.connect(lp)
    lp.connect(rainGain)
    rainGain.connect(comp)
    src.start()
  }

  const params = {}
  const overrides = {}
  let live = [] // buses currently sounding
  let cur = null

  // ---------- instruments (bound to a bus) ----------
  function instruments(bus) {
    const out = (t, pan = 0, rev = 0.3) => {
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t)
      let node = g
      if (pan) {
        const p = ctx.createStereoPanner()
        p.pan.value = pan
        g.connect(p)
        node = p
      }
      node.connect(bus.dry)
      if (rev) {
        const s = ctx.createGain()
        s.gain.value = rev
        node.connect(s)
        s.connect(bus.wet)
      }
      return g
    }
    const osc = (type, f, t, end, dest, amp = 1) => {
      const o = ctx.createOscillator()
      o.type = type
      o.frequency.setValueAtTime(f, t)
      if (amp === 1) o.connect(dest)
      else {
        const a = ctx.createGain()
        a.gain.value = amp
        o.connect(a)
        a.connect(dest)
      }
      o.start(t)
      o.stop(end)
      return o
    }
    const noiseSrc = (t, end) => {
      const s = ctx.createBufferSource()
      s.buffer = noise
      s.start(t, Math.random() * 1.5)
      s.stop(end)
      return s
    }
    const filter = (type, f, q = 0.7) => {
      const b = ctx.createBiquadFilter()
      b.type = type
      b.frequency.value = f
      b.Q.value = q
      return b
    }
    const decay = (g, t, peak, tc, atk = 0.004) => {
      g.gain.linearRampToValueAtTime(peak, t + atk)
      g.gain.setTargetAtTime(0, t + atk, tc)
    }
    const vibrato = (o, f, t, depth = 0.006, rate = 5) => {
      const l = ctx.createOscillator(), lg = ctx.createGain()
      l.frequency.value = rate
      lg.gain.setValueAtTime(0, t)
      lg.gain.linearRampToValueAtTime(f * depth, t + 0.45)
      l.connect(lg)
      lg.connect(o.frequency)
      l.start(t)
      return l
    }

    const x = {
      piano(t, m, v = 0.4, d = 3, pan = 0) {
        const f = mtof(m), end = t + d + 0.3
        const g = out(t, pan, 0.35)
        const lp = filter('lowpass', 0, 0.3)
        lp.frequency.setValueAtTime(Math.min(9000, f * 9), t)
        lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.6, 220), t + d * 0.6)
        lp.connect(g)
        ;[1, 0.5, 0.22, 0.1].forEach((a, k) => osc('sine', f * (k + 1) * (1 + k * k * 0.0005), t, end, lp, a))
        decay(g, t, v * 0.2, d / 5)
      },
      pad(t, ms, d, v = 0.4, { cut = 1400, atk = 1.0, rel = 1.6 } = {}) {
        const end = t + d + rel + 0.2
        const g = out(t, 0, 0.6)
        const lp = filter('lowpass', cut, 0.6)
        lp.connect(g)
        const L = ctx.createStereoPanner(), Rr = ctx.createStereoPanner()
        L.pan.value = -0.45
        Rr.pan.value = 0.45
        L.connect(lp)
        Rr.connect(lp)
        for (const m of ms) {
          const f = mtof(m)
          osc('sawtooth', f * 0.9955, t, end, L)
          osc('sawtooth', f * 1.0045, t, end, Rr)
        }
        const peak = (v * 0.07) / Math.sqrt(ms.length)
        g.gain.linearRampToValueAtTime(peak, t + atk)
        g.gain.setValueAtTime(peak, t + d)
        g.gain.linearRampToValueAtTime(0, t + d + rel)
      },
      strings(t, m, d, v = 0.3, pan = 0) {
        const f = mtof(m), end = t + d + 0.8
        const g = out(t, pan, 0.6)
        const lp = filter('lowpass', 2200, 0.5)
        lp.connect(g)
        const a = osc('sawtooth', f * 0.997, t, end, lp), b2 = osc('sawtooth', f * 1.003, t, end, lp)
        vibrato(a, f, t + 0.2).stop(end)
        vibrato(b2, f, t + 0.25, 0.005, 5.4).stop(end)
        g.gain.linearRampToValueAtTime(v * 0.06, t + 0.35)
        g.gain.setValueAtTime(v * 0.06, t + d)
        g.gain.linearRampToValueAtTime(0, t + d + 0.6)
      },
      flute(t, m, d, v = 0.5, { bend = false, pan = 0.1 } = {}) {
        const f = mtof(m), end = t + d + 0.35
        const g = out(t, pan, 0.45)
        const o = osc('sine', f, t, end, g)
        const o2 = osc('sine', f * 2, t, end, g, 0.16)
        const o3 = osc('sine', f * 3, t, end, g, 0.04)
        if (bend) {
          // a small slide into the note, like a bansuri
          for (const [node, k] of [[o, 1], [o2, 2], [o3, 3]]) {
            node.frequency.setValueAtTime(f * k * 0.944, t)
            node.frequency.exponentialRampToValueAtTime(f * k, t + 0.12)
          }
        }
        if (d > 0.4) {
          vibrato(o, f, t + 0.2).stop(end)
          vibrato(o2, f * 2, t + 0.2).stop(end)
        }
        const br = noiseSrc(t, end), bp = filter('bandpass', f * 2, 2), bg = ctx.createGain()
        bg.gain.setValueAtTime(v * 0.05, t)
        bg.gain.linearRampToValueAtTime(v * 0.008, t + Math.min(0.15, d))
        bg.gain.setValueAtTime(v * 0.008, t + d)
        bg.gain.linearRampToValueAtTime(0, t + d + 0.15)
        br.connect(bp)
        bp.connect(bg)
        bg.connect(g)
        g.gain.linearRampToValueAtTime(v * 0.15, t + 0.07)
        g.gain.setValueAtTime(v * 0.15, t + d)
        g.gain.linearRampToValueAtTime(0, t + d + 0.2)
      },
      reed(t, m, d, v = 0.3, pan = -0.15) {
        const f = mtof(m), end = t + d + 0.3
        const g = out(t, pan, 0.4)
        const lp = filter('lowpass', 2600, 0.7), pk = filter('peaking', 1100, 1.2)
        pk.gain.value = 6
        lp.connect(pk)
        pk.connect(g)
        const o = osc('sawtooth', f, t, end, lp)
        o.frequency.setValueAtTime(f * 0.96, t)
        o.frequency.exponentialRampToValueAtTime(f, t + 0.08)
        vibrato(o, f, t + 0.15, 0.008, 5.6).stop(end)
        g.gain.linearRampToValueAtTime(v * 0.05, t + 0.04)
        g.gain.setValueAtTime(v * 0.05, t + d)
        g.gain.linearRampToValueAtTime(0, t + d + 0.15)
      },
      pluck(t, m, v = 0.35, d = 1.2, pan = 0, bright = 3500) {
        const f = mtof(m), end = t + d + 0.2
        const g = out(t, pan, 0.25)
        const lp = filter('lowpass', 0, 1.2)
        lp.frequency.setValueAtTime(Math.max(bright, f * 2), t)
        lp.frequency.exponentialRampToValueAtTime(Math.max(f * 1.2, 120), t + 0.25)
        lp.connect(g)
        osc('sawtooth', f, t, end, lp, 0.6)
        osc('triangle', f, t, end, lp)
        decay(g, t, v * 0.18, d / 4, 0.003)
      },
      strum(t, ms, dir = 1, v = 0.3) {
        const notes = dir > 0 ? ms : [...ms].reverse()
        notes.forEach((m, k) => x.pluck(t + k * 0.014, m, v, 1.0, (k / notes.length - 0.5) * 0.5, 2800))
      },
      marimba(t, m, v = 0.35, pan = 0) {
        const f = mtof(m)
        const g = out(t, pan, 0.25)
        g.gain.setValueAtTime(v * 0.25, t)
        ;[[1, 1, 0.22], [3.98, 0.3, 0.05], [9.2, 0.06, 0.02]].forEach(([r, a, tc]) => {
          const pg = ctx.createGain()
          pg.gain.setValueAtTime(0, t)
          decay(pg, t, a, tc, 0.002)
          osc('sine', f * r, t, t + 1.2, pg)
          pg.connect(g)
        })
      },
      bell(t, m, v = 0.25, d = 3, pan = 0) {
        const f = mtof(m)
        const g = out(t, pan, 0.55)
        g.gain.setValueAtTime(v * 0.2, t)
        ;[[1, 1, 1], [2, 0.5, 0.6], [2.76, 0.4, 0.45], [4.07, 0.22, 0.3], [5.4, 0.15, 0.2]].forEach(([r, a, dk]) => {
          const pg = ctx.createGain()
          pg.gain.setValueAtTime(0, t)
          decay(pg, t, a, (d * dk) / 4, 0.002)
          osc('sine', f * r, t, t + d + 0.2, pg)
          pg.connect(g)
        })
      },
      musicbox(t, m, v = 0.4, pan = 0) {
        const f = mtof(m)
        const g = out(t, pan, 0.5)
        g.gain.setValueAtTime(v * 0.2, t)
        ;[[1, 1, 0.5], [3, 0.25, 0.15], [5.98, 0.08, 0.06]].forEach(([r, a, tc]) => {
          const pg = ctx.createGain()
          pg.gain.setValueAtTime(0, t)
          decay(pg, t, a, tc, 0.002)
          osc('sine', f * r, t, t + 2.4, pg)
          pg.connect(g)
        })
      },
      bass(t, m, d, v = 0.4) {
        const f = mtof(m), end = t + d + 0.3
        const g = out(t, 0, 0.08)
        const lp = filter('lowpass', 600, 0.5)
        lp.connect(g)
        osc('sine', f, t, end, lp)
        osc('triangle', f, t, end, lp, 0.4)
        g.gain.linearRampToValueAtTime(v * 0.42, t + 0.012)
        g.gain.setTargetAtTime(v * 0.28, t + 0.012, 0.15)
        g.gain.setValueAtTime(v * 0.28, t + d)
        g.gain.linearRampToValueAtTime(0, t + d + 0.15)
      },
      tanpura(t, m, v = 0.5, d = 3.4) {
        const f = mtof(m), end = t + d + 0.2
        const g = out(t, 0, 0.5)
        const jw = filter('peaking', f * 7, 4)
        jw.gain.value = 10
        jw.frequency.setValueAtTime(f * 7, t)
        jw.frequency.exponentialRampToValueAtTime(f * 3, t + d)
        const lp = filter('lowpass', 3200, 0.5)
        jw.connect(lp)
        lp.connect(g)
        osc('sawtooth', f, t, end, jw)
        osc('sawtooth', f * 1.002, t, end, jw, 0.6)
        decay(g, t, v * 0.05, d / 3, 0.01)
      },
      thump(t, f0, f1, d, v) {
        const g = out(t, 0, 0.2)
        const o = osc('sine', f0, t, t + d + 0.1, g)
        o.frequency.exponentialRampToValueAtTime(f1, t + d * 0.4)
        decay(g, t, v * 0.6, d / 4, 0.003)
      },
      hit(t, type, f, q, d, v, pan = 0, rev = 0.15) {
        const g = out(t, pan, rev)
        const fl = filter(type, f, q)
        noiseSrc(t, t + d + 0.05).connect(fl)
        fl.connect(g)
        decay(g, t, v, d / 3, 0.002)
      },
      ping(t, f, tc, v, pan = 0) {
        const g = out(t, pan, 0.2)
        const o = osc('sine', f * 1.03, t, t + tc * 6, g)
        o.frequency.exponentialRampToValueAtTime(f, t + 0.04)
        decay(g, t, v, tc, 0.002)
      },
      // mridangam strokes
      stroke(t, kind, v = 0.5) {
        if (kind === 'tha' || kind === 'dhin') {
          x.thump(t, 150, 82, 0.4, v * 0.9)
          x.hit(t, 'bandpass', 800, 1, 0.04, v * 0.2)
        }
        if (kind === 'ki') {
          x.ping(t, 587, 0.05, v * 0.25, 0.2)
          x.hit(t, 'bandpass', 3200, 1.5, 0.03, v * 0.3, 0.2)
        }
        if (kind === 'na' || kind === 'dhin') {
          x.ping(t, 587, 0.14, v * 0.3, 0.15)
          x.hit(t, 'bandpass', 2500, 1.5, 0.03, v * 0.2, 0.15)
        }
      },
      kick: (t, v = 0.5) => x.thump(t, 115, 42, 0.38, v),
      brush(t, v = 0.3) {
        x.hit(t, 'bandpass', 2300, 0.8, 0.17, v * 0.5, -0.1)
        x.thump(t, 220, 180, 0.08, v * 0.15)
      },
      clap(t, v = 0.3) {
        for (let k = 0; k < 3; k++) x.hit(t + k * 0.012, 'bandpass', 1400, 1.2, 0.04, v * 0.5, 0.1)
        x.hit(t + 0.03, 'bandpass', 1400, 1, 0.16, v * 0.35, 0.1, 0.35)
      },
      shaker: (t, v = 0.08) => x.hit(t, 'highpass', 7000, 0.7, 0.05, v * 0.6, 0.3, 0.05),
      riser(t, d, v = 0.2) {
        const g = out(t, 0, 0.5)
        const bp = filter('bandpass', 250, 3)
        bp.frequency.setValueAtTime(250, t)
        bp.frequency.exponentialRampToValueAtTime(5000, t + d)
        noiseSrc(t, t + d + 0.3).connect(bp)
        bp.connect(g)
        g.gain.linearRampToValueAtTime(v, t + d)
        g.gain.linearRampToValueAtTime(0, t + d + 0.25)
      },
    }
    return x
  }

  function makeBus(name) {
    const def = CUES[name]
    const fade = ctx.createGain(), wetFade = ctx.createGain()
    fade.gain.value = 0
    wetFade.gain.value = 0
    fade.connect(master)
    wetFade.connect(reverb)
    const dry = ctx.createGain(), wet = ctx.createGain()
    dry.connect(fade)
    wet.connect(wetFade)
    const t0 = now() + 0.05
    const bus = { name, def, fade, wetFade, dry, wet, t0, nextT: t0, i: 0, dying: Infinity, src: null }
    bus.x = instruments(bus)
    if (overrides[name]) {
      const s = ctx.createBufferSource()
      s.buffer = overrides[name]
      s.loop = true
      s.connect(dry)
      s.start(t0)
      bus.src = s
    } else if (def.enter) def.enter(bus.x, t0, bus)
    return bus
  }

  function fadeBus(bus, to, dur) {
    const t = now()
    for (const g of [bus.fade.gain, bus.wetFade.gain]) {
      g.cancelScheduledValues(t)
      g.setValueAtTime(g.value, t)
      g.linearRampToValueAtTime(to * (bus.src ? 1 : bus.def.level ?? 1), t + dur)
    }
  }

  const glideLast = {}
  function glide(key, param, to, seconds) {
    const last = glideLast[key]
    if (last !== undefined && Math.abs(to - last) <= Math.abs(last) * 0.02 + 1e-4) return
    glideLast[key] = to
    const t = now()
    param.cancelScheduledValues(t)
    param.setValueAtTime(param.value, t)
    param.linearRampToValueAtTime(to, t + seconds)
  }

  function retire(bus) {
    try { bus.src?.stop() } catch {}
    bus.fade.disconnect()
    bus.wetFade.disconnect()
  }

  return {
    params,
    get cue() { return cur?.name ?? null },

    // Switch to cue `name` (or null for silence), crossfading over `dur` seconds.
    setCue(name, dur = 3) {
      if ((cur?.name ?? null) === name) return
      if (cur) {
        fadeBus(cur, 0, dur)
        cur.dying = now() + dur + 0.2
      }
      if (!name || !CUES[name]) return void (cur = null)
      // coming straight back to a cue that is still fading out picks it up where it was
      let bus = live.find((b) => b.name === name)
      if (bus) bus.dying = Infinity
      else live.push((bus = makeBus(name)))
      fadeBus(bus, 1, Math.max(0.3, dur * 0.8))
      cur = bus
    },

    // Schedule notes up to time tEnd (call often with a little lookahead).
    scheduleUntil(tEnd) {
      const t = now()
      live = live.filter((b) => (t > b.dying ? (retire(b), false) : true))
      for (const bus of live) {
        if (bus.src) continue
        const def = bus.def, spb = 60 / def.bpm, beats = def.beats ?? 4
        while (bus.nextT < tEnd) {
          const bar = Math.floor(bus.i / beats)
          if (bus.nextT >= t - 0.02 && bus.nextT < bus.dying) {
            def.play({
              t: bus.nextT, i: bus.i, bar, beat: bus.i % beats, spb,
              chord: def.chords[bar % def.chords.length],
              cycle: Math.floor(bar / def.chords.length),
              age: bus.nextT - bus.t0, p: params,
            }, bus.x)
          }
          bus.i++
          bus.nextT += spb
        }
      }
    },

    // One-off musical moments (rings, the TV scare, lanterns, the finale) on the current cue.
    event(name) {
      const fn = cur && !cur.src && cur.def.events?.[name]
      if (fn) fn(cur.x, now() + 0.02, cur)
    },

    // These glide to the new value; calls with (nearly) the same value as last time do nothing.
    setMuffle(k) {
      glide('muffle', muffle.frequency, 20000 * Math.pow(900 / 20000, k), 0.4)
    },
    setRain(k) {
      glide('rain', rainGain.gain, k * 0.12, 0.6)
    },
    setVolume(v, seconds = 1) {
      glide('volume', master.gain, v, seconds)
    },
    // Replace a cue with a recording (an AudioBuffer). It loops while that cue plays.
    setOverride(name, buffer) {
      overrides[name] = buffer
    },
  }
}

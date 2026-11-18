# 25 Years World

A walk around a small planet, from the India house to the US and back, for Amma and Nana's 25th.

## Run it

    npm install        (once)
    npm run dev        open http://localhost:5173 while working on it
    npm run build      makes the final version in dist/
    npm run preview    plays dist/ at http://localhost:4173. Use this on the day; it needs no internet.

## Keys

| Key | What it does |
| --- | --- |
| any key | start, on the spinning-planet screen |
| Space / Enter / P | pause and resume |
| Right / PageDown | skip to the next chapter |
| Left / PageUp | go back one chapter |
| F | full screen on or off (Esc also leaves full screen) |

With no keys pressed it plays start to finish by itself, in about 8½ minutes.

## The message

Every caption lives in `src/narration.js`:
- `OPENING`: the lines over the turning planet after the first key press
- `AT_STOP`: lines at each chapter, keyed by chapter number
- `ON_WALK`: lines while walking away from a chapter
- `VERSES`: the seven verses of the spiral, each with its moment in the scene and its camera shot
- `FINALE`: the closing title

Edit the text there and the timing adjusts itself. Each stop stays long enough for its lines to be read at a gentle pace (`WPS`, words per second). A part written as `['…', 'i']` is an italic aside that arrives after a short pause.

## Adding photos

1. Add the photo's path to the chapter's list in `photos.json`. Paths are relative to this folder
   (the originals live two folders up, in `wedding_video/`).
   For a print that was photographed sideways on a table, use
   `{ "src": "...", "crop": [left, top, width, height], "rotate": -90 }`.
2. Run `npm run photos`. It resizes everything into `public/photos/` and updates the list the app reads.

Each photo gets its own close-up. Chapter 9 photos build a spiral tower beside the house, in list order; the camera climbs inside it (2.6 s per photo, set by `photoSec` in config.js).

## Music

The score is synthesized live in the browser (`src/score.js`), so it needs no files and works offline.
Every chapter has its own cue, and so do both flights and the ending. The music follows the story clock (`src/audio.js`):
the outgoing cue plays as the family leaves a stop, the next one fades in as they arrive, the
flights get their own music, and pausing pauses the music too. It also matches the scripted moments:
the rings in chapter 1, the TV scare in chapter 3, the rain in chapter 7, and the lanterns and finale in chapter 9.

| Cue | Mood |
| --- | --- |
| ch1 | tender, far apart: tanpura, piano, the family theme on flute |
| ch2 | wedding: mridangam, veena, temple bells, festive melody |
| flightOut | open sky: shimmering bells, long flute notes |
| ch3 | cosy first home: pizzicato bass, marimba, brushes; jumps at the TV scare |
| ch4 | lullaby in 3/4 on a music box |
| ch5 | playful: marimba, claps, whistled tune |
| ch6 | warm, full-hearted: piano, strings, a heartbeat |
| ch7 | road trip: guitar strums, drums; drops to a soft pad while it rains |
| ch8 | bittersweet: piano and strings |
| flightHome | hopeful, building; tanpura fades in as India comes into view |
| ch9 | the family theme in full, growing through the photo tower, swelling at the finale |
| outro | the theme's first and last phrases, then a quiet drone for the end screen |

To use a real recording for any cue instead, put it at `public/audio/music/<cue>.mp3` (for example
`public/audio/music/ch2.mp3`). It loops while that cue plays and crossfades the same way.
`?debug` shows which cue is playing.

## The world

- Flags (`src/Flag.jsx`, drawn in code): India on the India house, the US on the first apartment and the family house.
- Extra scenery is laid out in `src/townLayout.js` and drawn by `src/Town.jsx`:
  - US side: suburbs with mailboxes, cars and street lamps, two city skylines, a church, a barn and silo, water towers, wind turbines.
  - India side: a colourful village and a temple gopuram.
  - At sea: lighthouses on the shores, and sailboats and a cargo ship on both oceans.
- Placement is seeded, so the world is the same every run. Nothing is placed inside a chapter scene, and trees keep out of building footprints.

## Tuning

- `src/config.js`: chapter positions, camera views, seconds per scene and per photo, family colors.
- Debug URL options: `?debug` (status overlay), `?ch=5` (jump to a chapter), `?ch=5&t=8` (seconds into it),
  `?p=50` (freeze at a spot on the path), `?speed=10` (fast-forward), `?opening` (start the opening lines right away).

## Putting it online (GitHub Pages)

Every push to `main` builds the site and publishes it with `.github/workflows/deploy.yml`.
For the first deploy, open the repo's Settings → Pages and set Source to **GitHub Actions**.
The site then appears at `https://<user>.github.io/<repo>/`.

Commit `public/photos/` after you run `npm run photos`. The originals are not in the repo, so the build cannot regenerate them.

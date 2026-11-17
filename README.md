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

With no keys pressed it plays start to finish by itself, in about 6½ minutes.

## Adding photos

1. Add the photo's path to the chapter's list in `photos.json`.
   For a print that was photographed sideways on a table, use
   `{ "src": "...", "crop": [left, top, width, height], "rotate": -90 }`.
2. Run `npm run photos`. It resizes everything into `public/photos/` and updates the list the app reads.

Each photo gets its own close-up. Chapter 9 photos build a spiral tower beside the house, in list order; the camera climbs inside it (2.6 s per photo, set by `photoSec` in config.js).

## Music (optional)

Put a track at `public/audio/music.mp3` and it loops quietly under the walk.

## Tuning

- `src/config.js`: chapter positions, camera views, seconds per scene and per photo, family colors.
- Debug URL options: `?debug` (status overlay), `?ch=5` (jump to a chapter), `?ch=5&t=8` (seconds into it),
  `?p=50` (freeze at a spot on the path), `?speed=10` (fast-forward).

## Putting it online (GitHub Pages)

Every push to `main` builds the site and publishes it with `.github/workflows/deploy.yml`.
For the first deploy, open the repo's Settings → Pages and set Source to **GitHub Actions**.
The site then appears at `https://<user>.github.io/<repo>/`.

Commit `public/photos/` after you run `npm run photos`. The originals are not in the repo, so the build cannot regenerate them.

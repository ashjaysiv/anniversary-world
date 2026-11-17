// Resizes the photos listed in photos.json into public/photos as WebP
// (1600 px long side, EXIF rotation applied) and writes public/photos/manifest.json.
// Usage: npm run photos
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const list = JSON.parse(fs.readFileSync(path.join(root, 'photos.json'), 'utf8'))
const outDir = path.join(root, 'public', 'photos')
fs.mkdirSync(outDir, { recursive: true })

// Refuse to run if any source is missing, so a wrong path never wipes the existing photos.
const missingSrc = Object.entries(list)
  .filter(([ch]) => /^\d+$/.test(ch))
  .flatMap(([, files]) => files.map((e) => path.resolve(root, typeof e === 'string' ? e : e.src)))
  .filter((p) => !fs.existsSync(p))
if (missingSrc.length) {
  console.error(`Stopped: ${missingSrc.length} photo(s) not found, nothing was changed:\n  ` + missingSrc.join('\n  '))
  process.exit(1)
}

for (const f of fs.readdirSync(outDir)) {
  if (/^ch\d+-\d+\.webp$/.test(f)) fs.unlinkSync(path.join(outDir, f))
}

const manifest = {}
let missing = 0
for (const [ch, files] of Object.entries(list)) {
  if (!/^\d+$/.test(ch)) continue
  manifest[ch] = []
  let n = 0
  for (const entry of files) {
    const e = typeof entry === 'string' ? { src: entry } : entry
    const { crop, rotate } = e
    const src = path.resolve(root, e.src) // relative paths are relative to the project folder
    if (!fs.existsSync(src)) {
      console.warn(`  missing: ${src}`)
      missing++
      continue
    }
    n++
    const name = `ch${ch}-${String(n).padStart(2, '0')}.webp`
    // Bake EXIF orientation first so crop coordinates match what an image viewer shows.
    let img = sharp(await sharp(src).rotate().toBuffer())
    if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] })
    if (rotate) img = sharp(await img.toBuffer()).rotate(rotate)
    const info = await img
      .resize({ width: list._maxSize?.[ch] ?? 1600, height: list._maxSize?.[ch] ?? 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(outDir, name))
    manifest[ch].push({ src: `photos/${name}`, w: info.width, h: info.height })
    console.log(`  ${name}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB  <- ${path.basename(src)}`)
  }
}

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log(`Wrote manifest with ${Object.values(manifest).flat().length} photos${missing ? `, ${missing} missing` : ''}.`)

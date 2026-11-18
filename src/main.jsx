import * as THREE from 'three'
import { createRoot } from 'react-dom/client'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/cormorant-garamond/600.css'
import '@fontsource/dancing-script/700.css'
import App from './App'
import { story } from './story'

async function boot() {
  let manifest = {}
  try {
    const r = await fetch('photos/manifest.json')
    if (r.ok) manifest = await r.json()
  } catch {}
  const loader = new THREE.TextureLoader()
  const textures = {}
  await Promise.all(
    Object.values(manifest).flat().map(
      (p) =>
        new Promise((res) =>
          loader.load(
            p.src,
            (t) => {
              t.colorSpace = THREE.SRGBColorSpace
              t.anisotropy = 8
              textures[p.src] = t
              res()
            },
            undefined,
            () => res(),
          ),
        ),
    ),
  )
  story.photos = manifest
  story.textures = textures
  // Load the caption fonts up front so the first words never flash in a fallback font.
  await Promise.all(
    ['600 40px "Cormorant Garamond"', 'italic 500 40px "Cormorant Garamond"', '700 40px "Dancing Script"'].map((f) =>
      document.fonts?.load(f).catch(() => {}),
    ),
  )
  createRoot(document.getElementById('root')).render(<App />)
}

boot()

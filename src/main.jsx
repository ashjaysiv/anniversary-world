import * as THREE from 'three'
import { createRoot } from 'react-dom/client'
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
  createRoot(document.getElementById('root')).render(<App />)
}

boot()

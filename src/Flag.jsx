// A waving flag on a pole. kind: 'in' (India) or 'us' (United States). The cloth is drawn on a canvas,
// so there are no image files. The pole stands at the group's origin; the flag flies toward +x.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { story } from './story'
import { Cyl, Ball, mat } from './kit'

const textures = {}

function star(g, cx, cy, r) {
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.4 : r
    g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
  }
  g.closePath()
  g.fill()
}

function drawUS(g, W, H) {
  for (let i = 0; i < 13; i++) {
    g.fillStyle = i % 2 ? '#ffffff' : '#b22234'
    g.fillRect(0, (i * H) / 13, W, H / 13 + 1)
  }
  const cw = W * 0.4, ch = (H * 7) / 13
  g.fillStyle = '#3c3b6e'
  g.fillRect(0, 0, cw, ch)
  g.fillStyle = '#ffffff'
  for (let row = 0; row < 9; row++) {
    const n = row % 2 ? 5 : 6
    for (let k = 0; k < n; k++) {
      const x = ((row % 2 ? 2 : 1) + k * 2) * (cw / 12), y = (row + 1) * (ch / 10)
      star(g, x, y, ch / 22)
    }
  }
}

function drawIN(g, W, H) {
  ;['#ff9933', '#ffffff', '#138808'].forEach((c, i) => {
    g.fillStyle = c
    g.fillRect(0, (i * H) / 3, W, H / 3 + 1)
  })
  const cx = W / 2, cy = H / 2, r = (H / 3) * 0.42
  g.strokeStyle = '#000080'
  g.fillStyle = '#000080'
  g.lineWidth = r * 0.12
  g.beginPath()
  g.arc(cx, cy, r, 0, Math.PI * 2)
  g.stroke()
  g.lineWidth = r * 0.05
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    g.beginPath()
    g.moveTo(cx, cy)
    g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
    g.stroke()
  }
  g.beginPath()
  g.arc(cx, cy, r * 0.18, 0, Math.PI * 2)
  g.fill()
}

function flagTexture(kind) {
  if (textures[kind]) return textures[kind]
  const c = document.createElement('canvas')
  c.width = 380
  c.height = kind === 'us' ? 200 : 254
  const g = c.getContext('2d')
  ;(kind === 'us' ? drawUS : drawIN)(g, c.width, c.height)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return (textures[kind] = t)
}

export function Flag({ kind = 'us', pole = 1.6, size = 0.6, ...p }) {
  const w = size, h = kind === 'us' ? size / 1.9 : size / 1.5
  const cloth = useRef()
  const { geo, base } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(w, h, 12, 4)
    geo.translate(w / 2 + 0.03, 0, 0)
    return { geo, base: Float32Array.from(geo.attributes.position.array) }
  }, [w, h])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ map: flagTexture(kind), side: THREE.DoubleSide, roughness: 0.75 }), [kind])
  useFrame(() => {
    const pos = geo.attributes.position, t = story.time
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1]
      const k = x / w // 0 at the pole, 1 at the free end
      pos.setZ(i, Math.sin(x * 9 - t * 4.2 + y * 2) * 0.045 * k + Math.sin(x * 4 - t * 2.3) * 0.03 * k)
      pos.setY(i, y - k * k * 0.03)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  })
  return (
    <group {...p}>
      <Cyl r={0.018} hgt={pole} seg={6} c="#d8d8d8" m={mat('#d8d8d8', { metal: 0.4, rough: 0.4 })} position-y={pole / 2} />
      <Ball r={0.035} detail={0} c="#f2c14e" position-y={pole + 0.02} />
      <mesh ref={cloth} geometry={geo} material={material} position-y={pole - h / 2 - 0.03} castShadow />
    </group>
  )
}

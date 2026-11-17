// Small building blocks for the low-poly props.
import * as THREE from 'three'
import { useMemo, forwardRef } from 'react'
import { R } from './geo'

const cache = new Map()
export function mat(color, { rough = 0.85, metal = 0, e, ei = 1 } = {}) {
  const key = `${color}|${rough}|${metal}|${e}|${ei}`
  if (!cache.has(key)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, flatShading: true })
    if (e) { m.emissive = new THREE.Color(e); m.emissiveIntensity = ei }
    cache.set(key, m)
  }
  return cache.get(key)
}

export const Box = forwardRef(({ s = [1, 1, 1], c = '#ffffff', m, shadow = true, ...p }, ref) => (
  <mesh ref={ref} castShadow={shadow} receiveShadow material={m ?? mat(c)} {...p}>
    <boxGeometry args={s} />
  </mesh>
))
export const Cyl = forwardRef(({ r = 0.5, rt, rb, hgt = 1, seg = 8, c = '#ffffff', m, shadow = true, ...p }, ref) => (
  <mesh ref={ref} castShadow={shadow} receiveShadow material={m ?? mat(c)} {...p}>
    <cylinderGeometry args={[rt ?? r, rb ?? r, hgt, seg]} />
  </mesh>
))
export const Ball = forwardRef(({ r = 0.5, detail = 1, c = '#ffffff', m, shadow = true, ...p }, ref) => (
  <mesh ref={ref} castShadow={shadow} receiveShadow material={m ?? mat(c)} {...p}>
    <icosahedronGeometry args={[r, detail]} />
  </mesh>
))
export const Cone = forwardRef(({ r = 0.5, hgt = 1, seg = 6, c = '#ffffff', m, shadow = true, ...p }, ref) => (
  <mesh ref={ref} castShadow={shadow} receiveShadow material={m ?? mat(c)} {...p}>
    <coneGeometry args={[r, hgt, seg]} />
  </mesh>
))

// A cylinder stretched between two points (for bent arms and the like).
export function Limb({ from, to, r = 0.045, c = '#ffffff' }) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const dir = b.clone().sub(a)
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  return <Cyl r={r} hgt={dir.length()} seg={6} c={c} position={mid.toArray()} quaternion={q} />
}

// Triangular roof: width along x, depth along z, apex height hgt, base at y=0.
export function Gable({ w = 2, d = 2, hgt = 0.8, c = '#6a4a5a', m, ...p }) {
  const geo = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, hgt); sh.closePath()
    const g = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false })
    g.translate(0, 0, -d / 2)
    return g
  }, [w, d, hgt])
  return <mesh geometry={geo} castShadow receiveShadow material={m ?? mat(c)} {...p} />
}

// Places children on the planet at path coordinates relative to the parent chapter group.
export function At({ z = 0, s = 0, h = 0, yaw = 0, children, innerRef, ...rest }) {
  return (
    <group rotation-x={z / R}>
      <group rotation-z={s / R}>
        <group position-y={R + h} rotation-y={yaw} ref={innerRef} {...rest}>
          {children}
        </group>
      </group>
    </group>
  )
}

let glowTex = null
export function glowTexture() {
  if (glowTex) return glowTex
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.55)')
  grd.addColorStop(0.6, 'rgba(255,255,255,0.12)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  glowTex = new THREE.CanvasTexture(c)
  glowTex.colorSpace = THREE.SRGBColorSpace
  return glowTex
}

export function glowMaterial(color = '#ffd27a', opacity = 1) {
  return new THREE.SpriteMaterial({
    map: glowTexture(), color, transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, toneMapped: false, fog: false,
  })
}

export function Glow({ color = '#ffd27a', size = 1, opacity = 1, spriteRef, ...p }) {
  const m = useMemo(() => glowMaterial(color, opacity), [color])
  return <sprite ref={spriteRef} material={m} scale={[size, size, size]} {...p} />
}

// Photo frames placed at each chapter, plus the camera pose used to look at each one.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DEG, clamp, easeOutBack, pt, facing, yawToward, smoothstep } from './geo'
import { CHAPTERS, DEFAULT_VIEW } from './config'
import { story, photosFor, currentSegment, chapterTime } from './story'
import { At, Box, Cyl, glowMaterial, mat } from './kit'
import { pal } from './palette'

const sizeOf = (p, L) => {
  const a = p.w / p.h
  return a >= 1 ? { w: L, hh: L / a } : { w: L * a, hh: L }
}

const layoutCache = new Map()
export function photoLayout(idx) {
  if (layoutCache.has(idx)) return layoutCache.get(idx)
  const ch = CHAPTERS[idx]
  const photos = photosFor(idx)
  const view = ch.view ?? DEFAULT_VIEW
  const [zc, sc] = view.pos
  const n = photos.length
  let out
  switch (ch.layout) {
    case 'sky':
      out = photos.map((p, i) => {
        const d = sizeOf(p, 1.6), z = 2.6 + i * 2.0, s = -1.5 - i * 0.4
        return { ...d, z, s, hc: 3.0, yaw: yawToward(z, s, zc, sc), kind: 'float' }
      })
      break
    case 'clothesline':
      out = photos.map((p, i) => {
        const d = sizeOf(p, 1.05), s = (i - (n - 1) / 2) * 1.2
        return { ...d, z: 3.6, s, hc: 2.5 - 0.1 - d.hh / 2, yaw: Math.PI, kind: 'hang' }
      })
      break
    case 'helix': {
      // A spiral tower of photos ahead-left of the house, rising in date order. Photos face inward;
      // the camera climbs inside the tower to look at each one. A doorway is left open at the
      // bottom on the side facing the family so the camera can fly in without passing through a photo.
      const { cz = 5.5, cs = -1.0, r = 3.0, perTurn = 12, rise = 0.13, base = 1.15 } = ch.helix ?? {}
      let slot = 0
      out = photos.map((p, i) => {
        let phi, hc
        for (;;) {
          phi = (slot / perTurn) * Math.PI * 2
          hc = base + slot * rise
          slot++
          const toFamily = Math.abs(Math.atan2(Math.sin(phi - Math.PI), Math.cos(phi - Math.PI)))
          if (!(hc < 3.1 && toFamily < 0.65)) break
        }
        const z = cz + Math.cos(phi) * r, s = cs + Math.sin(phi) * r
        return { ...sizeOf(p, 1.15), z, s, hc, yaw: yawToward(z, s, cz, cs), kind: 'helix', delay: 1.0 + i * 0.11 }
      })
      break
    }
    case 'arc':
      out = photos.map((p, i) => {
        const d = sizeOf(p, 1.35)
        const t = n === 1 ? 0.5 : i / (n - 1)
        const ang = -1.15 + t * 1.75
        const z = 0.8 + Math.cos(ang) * 3.4, s = Math.sin(ang) * 3.4
        return { ...d, z, s, hc: Math.max(1.2, d.hh / 2 + 0.5), yaw: yawToward(z, s, zc, sc), kind: 'easel' }
      })
      break
    default:
      out = photos.map((p, i) => {
        const d = sizeOf(p, 1.45)
        const side = i % 2 === 0 ? 1 : -1
        const row = Math.floor(i / 2)
        // Each row further back stands taller and a little wider, so it shows above the row in front.
        const z = (ch.corridorStart ?? 1.6) + row * 2.3
        const s = side * (1.85 + row * 0.35)
        const hc = Math.max(1.2, d.hh / 2 + 0.5) + row * 1.15
        return { ...d, z, s, hc, yaw: yawToward(z, s, zc, sc), kind: 'easel' }
      })
  }
  layoutCache.set(idx, out)
  return out
}

// Camera position and look target (top frame) that fills the screen with photo i of chapter idx.
export function photoFocus(idx, i, aspect, fov, outPos, outLook, captionRoom = false) {
  const L = photoLayout(idx)[i]
  if (!L) return false
  pt(L.z, L.s, L.hc, outLook)
  const n = facing(L.z, L.s, L.yaw)
  const tanH = Math.tan((fov * DEG) / 2)
  const fill = captionRoom ? 0.66 : 0.84
  const dist = Math.max((L.hh + 0.3) / fill, (L.w + 0.2) / (0.84 * aspect)) / (2 * tanH)
  outPos.copy(outLook).addScaledVector(n, dist)
  if (captionRoom) {
    // Slide the view down so the photo sits in the upper part of the screen, clear of the caption.
    const up = outLook.clone().normalize().multiplyScalar(-0.15 * 2 * tanH * dist)
    outPos.add(up)
    outLook.add(up)
  }
  return true
}

function Photo({ L, tex, ch, idx, i }) {
  const grow = useRef(), glow = useRef(), inner = useRef()
  const v = useRef(0)
  const m = 0.06, mb = L.kind === 'hang' ? 0.17 : 0.06
  const W = L.w + 2 * m, H = L.hh + m + mb
  const photoMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }), [tex])
  const glowMat = useMemo(() => glowMaterial('#ffe2a8', 0), [])
  const pop = useRef()
  // A soft self-glow keeps the cream frames cream in the evening light.
  const frameMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#fbf7ee', emissive: '#fbf3e2', emissiveIntensity: 0.12, roughness: 0.8, flatShading: true, transparent: true }), [])
  const wp = useMemo(() => new THREE.Vector3(), [])
  useFrame((state, dt) => {
    frameMat.emissiveIntensity = 0.12 + pal.night * 0.5
    // Floating photos drift away once their part of the story is over (they'd hang over the ending otherwise).
    const gone = L.kind === 'float' && story.progress > ch.angle + 40
    const waiting = L.delay !== undefined && chapterTime(idx) < L.delay
    const on = story.progress >= ch.angle - 4 && !gone && !waiting && !['begin', 'loading'].includes(story.phase) ? 1 : 0
    const prev = v.current
    v.current = clamp(v.current + (on ? dt / 1.3 : -dt / 0.6))
    const e = v.current
    grow.current.visible = e > 0.001
    // Photos on easels grow up from the ground; floating ones grow from their own center.
    const sc = Math.max(easeOutBack(e), 0.0001)
    if (L.kind === 'easel') grow.current.scale.setScalar(sc)
    else pop.current.scale.setScalar(sc)
    const seg = currentSegment()
    const focused = seg && story.idx === idx && seg.kind === 'photo' && seg.i === i ? 1 : 0
    // When the camera flies past a photo (in and out of the tower), the photo fades instead of flashing.
    pop.current.getWorldPosition(wp)
    const near = smoothstep(0.45, 1.15, wp.distanceTo(state.camera.position))
    photoMat.opacity = frameMat.opacity = near
    glowMat.opacity = (Math.sin(e * Math.PI) * 0.9 + e * (0.16 + focused * 0.22)) * near
    const t = story.time + i * 1.7
    if (L.kind === 'float') inner.current.position.y = L.hc + Math.sin(t * 0.9) * 0.08
    if (L.kind === 'hang') inner.current.rotation.z = Math.sin(t * 1.2) * 0.05
    if (prev === e && e === 0) grow.current.visible = false
  })
  return (
    <At z={L.z} s={L.s} yaw={L.yaw}>
      <group ref={grow}>
        <group ref={inner} position-y={L.hc}>
          <group ref={pop}>
            <Box s={[W, H, 0.04]} m={frameMat} position-y={-(mb - m) / 2} />
            <mesh material={photoMat} position-z={0.021}>
              <planeGeometry args={[L.w, L.hh]} />
            </mesh>
            {L.kind === 'helix' && (
              <mesh material={photoMat} position-z={-0.021} rotation-y={Math.PI}>
                <planeGeometry args={[L.w, L.hh]} />
              </mesh>
            )}
            <sprite ref={glow} material={glowMat} position-z={-0.06} scale={[W * 2.1, H * 1.8, 1]} />
            {L.kind === 'hang' && <Box s={[0.05, 0.12, 0.05]} c="#e9748e" position={[0, L.hh / 2 + m, 0.03]} />}
          </group>
        </group>
        {L.kind === 'easel' && (
          <>
            <Cyl r={0.025} hgt={L.hc} seg={5} c="#8a6242" position={[-L.w * 0.3, L.hc / 2 - 0.05, -0.05]} rotation-z={-0.05} />
            <Cyl r={0.025} hgt={L.hc} seg={5} c="#8a6242" position={[L.w * 0.3, L.hc / 2 - 0.05, -0.05]} rotation-z={0.05} />
            <Cyl r={0.022} hgt={L.hc * 1.05} seg={5} c="#7a5436" position={[0, L.hc / 2, -0.32]} rotation-x={-0.28} />
          </>
        )}
      </group>
    </At>
  )
}

export function PhotoSets() {
  return CHAPTERS.map((ch, idx) => {
    const photos = photosFor(idx)
    const layout = photoLayout(idx)
    return (
      <group key={ch.id} rotation-x={ch.angle * DEG}>
        {layout.map((L, i) => {
          const tex = story.textures[photos[i].src]
          return tex ? <Photo key={i} L={L} tex={tex} ch={ch} idx={idx} i={i} /> : null
        })}
      </group>
    )
  })
}

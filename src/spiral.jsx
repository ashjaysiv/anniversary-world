// The moments that play around the family while the spiral tower of photos is climbed.
// One per verse of the message (see VERSES in narration.js). Coordinates are path coordinates
// at the India house: the family stands at z=0, the photo tower is centred near z=5.5, s=-1.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { lerp, smoothstep, bump, easeOutBack, pt, rng, clamp } from './geo'
import { story, verseInfo } from './story'
import { VERSES } from './narration'
import { At, Box, Cyl, Ball, Cone, mat, Glow, glowMaterial, glowTexture } from './kit'

const vIdx = (key) => VERSES.findIndex((v) => v.key === key)
// Seconds since a verse began (negative before it, and whenever we aren't at the end of the story).
export const sinceVerse = (key) => verseInfo(vIdx(key)).t
// 0 → 1 → 0 across a verse, easing in and out.
export function verseFactor(key, inT = 1.2, outT = 1.2) {
  const { t, dur } = verseInfo(vIdx(key))
  return t < 0 ? 0 : bump(t, 0, inT, dur - outT, dur)
}
// "Sometimes a little too much": the rain umbrella pops open under a clear sky as the aside appears.
export function umbrellaJoke() {
  const t = sinceVerse('protectors')
  const shot = VERSES[vIdx('protectors')].shot
  return t < 0 ? 0 : bump(t, 2.6, 3.0, shot - 0.6, shot + 0.2)
}
export const stoodFactor = () => verseFactor('stoodby', 1.0, 1.5)

const TOWER = { z: 5.5, s: -1 }
const PARENTS = [-0.75, 0.75] // s of Nana and Amma
const KIDS = [-0.25, 0.25]

// ---------- 1. givers: light flows from Nana and Amma to the kids, then up the tower ----------
function Motes() {
  const N = 56
  const refs = useRef([])
  const seeds = useMemo(() => { const r = rng(41); return Array.from({ length: N }, () => r()) }, [])
  const p = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const f = verseFactor('givers', 1.0, 2.0)
    const t = sinceVerse('givers')
    refs.current.forEach((sp, i) => {
      if (!sp) return
      sp.visible = f > 0.01
      if (!sp.visible) return
      const u = (t * 0.3 + i / N + seeds[i] * 0.05) % 1
      const sp0 = PARENTS[i % 2], sk = KIDS[i % 2]
      let z, s, h, a
      if (u < 0.42) {
        const q = u / 0.42
        z = 0.12; s = lerp(sp0, sk, q); h = 0.85 + Math.sin(q * Math.PI) * 0.5; a = smoothstep(0, 0.15, q)
      } else {
        const q = (u - 0.42) / 0.58
        const sw = q * 5 + seeds[i] * 6
        z = lerp(0.12, TOWER.z + Math.cos(sw) * 1.6, q); s = lerp(sk, TOWER.s + Math.sin(sw) * 1.6, q)
        h = 0.7 + q * 8.5; a = 1 - smoothstep(0.7, 1, q)
      }
      sp.position.copy(pt(z, s, h, p))
      sp.material.opacity = a * f * 0.95
    })
  })
  return Array.from({ length: N }, (_, i) => (
    <Glow key={i} color={i % 3 ? '#ffd27a' : '#fff0c8'} size={0.6} opacity={0} spriteRef={(r) => (refs.current[i] = r)} />
  ))
}

// ---------- 2. protectors: a snow-globe dome over the family ----------
function Dome() {
  const ref = useRef()
  const shell = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d6ecff', emissive: '#b9dcff', emissiveIntensity: 0.7, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, flatShading: true }), [])
  const rim = useMemo(() => new THREE.MeshBasicMaterial({ color: '#e6f4ff', transparent: true, opacity: 0, toneMapped: false }), [])
  useFrame(() => {
    const f = verseFactor('protectors', 1.6, 1.8)
    const t = sinceVerse('protectors')
    ref.current.visible = f > 0.01
    if (!ref.current.visible) return
    ref.current.scale.setScalar(Math.max(0.001, easeOutBack(clamp(t / 1.6))) * (0.6 + 0.4 * f))
    shell.opacity = 0.2 * f + 0.04 * Math.sin(story.time * 2)
    rim.opacity = 0.75 * f
  })
  return (
    <At z={0.05} innerRef={ref}>
      <mesh material={shell} position-y={0.07}>
        <sphereGeometry args={[1.55, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh material={rim} position-y={0.09} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[1.5, 1.6, 40]} />
      </mesh>
    </At>
  )
}

// ---------- 3. strength: a sapling grows into a banyan tree ----------
function Banyan() {
  const ref = useRef(), roots = useRef()
  const rootSpots = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: 12 }, (_, i) => {
      const a = (i / 12) * Math.PI * 2 + r() * 0.4, d = 0.7 + r() * 0.75
      return [Math.cos(a) * d, Math.sin(a) * d, 1.55 + r() * 0.4]
    })
  }, [])
  useFrame(() => {
    const t = sinceVerse('strength')
    const g = t < 0 ? 0 : smoothstep(0.2, 4.4, t)
    ref.current.visible = t >= 0
    ref.current.scale.setScalar(0.12 + 0.88 * g)
    roots.current.scale.y = Math.max(0.001, smoothstep(0.55, 1, g))
  })
  return (
    <At z={-1.0} s={-3.0} innerRef={ref}>
      <Cyl rt={0.22} rb={0.4} hgt={1.8} seg={8} c="#6b4a32" position-y={0.9} />
      {[0, 1.6, 3.2, 4.8].map((a) => (
        <Cone key={a} r={0.18} hgt={0.5} seg={4} c="#5e412c" position={[Math.cos(a) * 0.32, 0.2, Math.sin(a) * 0.32]} rotation-z={Math.cos(a) * 0.5} rotation-x={-Math.sin(a) * 0.5} />
      ))}
      {[[0, 2.35, 0, 1.15, '#3f8a3c'], [1.05, 2.15, 0.25, 0.85, '#4d9a44'], [-1.05, 2.2, -0.2, 0.9, '#46913f'], [0.2, 2.55, 0.95, 0.8, '#4d9a44'], [-0.3, 2.5, -0.95, 0.8, '#3f8a3c']].map(([x, y, z, r, c], i) => (
        <Ball key={i} r={r} detail={0} c={c} position={[x, y, z]} scale={[1, 0.72, 1]} />
      ))}
      <group ref={roots}>
        {rootSpots.map(([x, z, top], i) => (
          <Cyl key={i} r={0.025} hgt={top} seg={4} c="#7a5a40" position={[x, top / 2, z]} />
        ))}
      </group>
    </At>
  )
}

// ---------- 4. dreams: paper planes and a kite soar up and become stars ----------
function Dreams() {
  const planes = useRef([]), stars = useRef([]), kite = useRef()
  const P = useMemo(() => [
    { start: 0.5, s0: KIDS[0], drift: 1.6, k: 0 },
    { start: 1.1, s0: KIDS[1], drift: -1.4, k: 1.3 },
    { start: 1.7, s0: 0, drift: 0.6, k: 2.6 },
  ], [])
  const p = useMemo(() => new THREE.Vector3(), [])
  const path = (pl, u) => pt(0.3 + u * 10, pl.s0 + Math.sin(u * 2.6 + pl.k) * pl.drift, 0.75 + u * u * 12 + Math.sin(u * 9) * 0.15, p)
  useFrame(() => {
    const t = sinceVerse('dreams')
    P.forEach((pl, i) => {
      const m = planes.current[i], st = stars.current[i]
      if (!m || !st) return
      const u = t < 0 ? -1 : (t - pl.start) / 4.5
      m.visible = u > 0 && u < 1
      if (m.visible) {
        m.position.copy(path(pl, u))
        m.rotation.set(-0.35 - u * 0.6, Math.sin(u * 2.6 + pl.k) * 0.6, Math.sin(u * 7) * 0.3)
        m.scale.setScalar(1 - smoothstep(0.75, 1, u))
      }
      // Once a plane is gone it stays on as a twinkling star.
      st.visible = u > 0.75
      if (st.visible) {
        st.position.copy(path(pl, 1))
        st.material.opacity = smoothstep(0.75, 1, u) * (0.75 + 0.25 * Math.sin(story.time * 3 + i * 2))
        const sz = 0.8 + 1.4 * bump(u, 0.75, 1, 1.05, 1.6)
        st.scale.set(sz, sz, sz)
      }
    })
    kite.current.visible = t > 0.4
    if (kite.current.visible) {
      const k = smoothstep(0.4, 4, t)
      kite.current.position.y = 1.2 + k * 4.3 + Math.sin(story.time * 0.7) * 0.25
      kite.current.rotation.z = Math.sin(story.time * 0.9) * 0.2
    }
  })
  const paper = mat('#fbfaf5', { rough: 0.6 })
  return (
    <>
      {P.map((_, i) => (
        <group key={i} ref={(r) => (planes.current[i] = r)} visible={false}>
          <mesh material={paper} rotation-x={Math.PI / 2} scale={[2.4, 2.4, 0.5]} castShadow>
            <coneGeometry args={[0.13, 0.36, 3]} />
          </mesh>
          <Glow color="#fff4d6" size={0.9} opacity={0.55} position={[0, 0, -0.35]} />
        </group>
      ))}
      {P.map((_, i) => <Glow key={i} color="#fff4d6" size={1} opacity={0} spriteRef={(r) => (stars.current[i] = r)} />)}
      <At z={2.4} s={1.5}>
        <group ref={kite} visible={false}>
          <mesh rotation-z={Math.PI / 4} material={mat('#3b8fd9')} castShadow><planeGeometry args={[0.5, 0.5]} /></mesh>
          <mesh rotation-z={Math.PI / 4} position-z={-0.01} scale={0.55} material={mat('#f2b822')}><planeGeometry args={[0.5, 0.5]} /></mesh>
          {[0, 1, 2, 3].map((i) => <Box key={i} s={[0.1, 0.05, 0.02]} c={i % 2 ? '#e9417a' : '#f2b822'} position={[Math.sin(i) * 0.08, -0.45 - i * 0.2, 0]} shadow={false} />)}
        </group>
      </At>
    </>
  )
}

// ---------- 5. stood by us: one warm light around all four ----------
function Halo() {
  const ref = useRef()
  useFrame(() => {
    const f = stoodFactor()
    ref.current.visible = f > 0.01
    ref.current.material.opacity = f * (0.5 + 0.06 * Math.sin(story.time * 2.2))
  })
  return <Glow color="#ffd59a" size={3.6} opacity={0} spriteRef={ref} position={pt(0.05, 0, 0.75).toArray()} />
}

// ---------- 6. not easy: deep night, a plane heading home, a briefcase set down ----------
function NotEasy() {
  const plane = useRef(), blink = useRef(), bag = useRef()
  const p = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const t = sinceVerse('noteasy')
    const u = t < 0 ? -1 : (t - 0.4) / 6.5
    plane.current.visible = u > 0 && u < 1
    if (plane.current.visible) {
      plane.current.position.copy(pt(9, lerp(-12, 16, u), 5.2 + Math.sin(u * 3) * 0.3, p))
      blink.current.material.opacity = Math.sin(story.time * 7) > 0.3 ? 0.9 : 0.1
    }
    const f = verseFactor('noteasy', 1.0, 1.5)
    bag.current.visible = f > 0.01 && t > 1.0
    bag.current.scale.setScalar(Math.max(0.001, easeOutBack(clamp((t - 1.0) / 0.8))) * f)
  })
  return (
    <>
      <group ref={plane} visible={false} rotation-y={-Math.PI / 2}>
        <Cyl r={0.12} hgt={1.0} seg={8} c="#e9e6df" rotation-x={Math.PI / 2} shadow={false} />
        <Box s={[1.3, 0.03, 0.28]} c="#d9d6cf" shadow={false} />
        <Box s={[0.03, 0.25, 0.2]} c="#d9433f" position={[0, 0.15, -0.45]} shadow={false} />
        <Glow color="#ff5a4a" size={0.6} spriteRef={blink} position={[0, -0.12, 0]} />
      </group>
      <At z={-0.45} s={1.25} yaw={Math.PI - 0.4} innerRef={bag}>
        <Box s={[0.34, 0.24, 0.1]} c="#5a3a26" position-y={0.19} />
        <Box s={[0.12, 0.05, 0.03]} c="#2e1e14" position-y={0.34} />
        <Box s={[0.35, 0.02, 0.105]} c="#c9a24a" position-y={0.24} shadow={false} />
      </At>
    </>
  )
}

// ---------- 7. a force: fireworks above the tower ----------
function Fireworks() {
  const B = 8, PER = 70, LIFE = 2.4, PERIOD = 6.2
  const ref = useRef()
  const data = useMemo(() => {
    const r = rng(77)
    const cols = ['#ffd27a', '#ff6f91', '#7fd0ff', '#b8f28a', '#ffa64d', '#f0b3ff']
    return Array.from({ length: B }, (_, k) => ({
      start: 0.4 + k * 0.72,
      c: pt(TOWER.z + Math.cos(k * 2.4) * 2.2, TOWER.s + Math.sin(k * 2.4) * 2.2, 10.5 + (k % 3) * 1.3),
      color: new THREE.Color(cols[k % cols.length]),
      dirs: Array.from({ length: PER }, () => {
        const u = r() * 2 - 1, th = r() * Math.PI * 2, q = Math.sqrt(1 - u * u)
        return new THREE.Vector3(q * Math.cos(th), u, q * Math.sin(th)).multiplyScalar(0.8 + r() * 0.3)
      }),
    }))
  }, [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(B * PER * 3), 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(B * PER * 3), 3))
    return g
  }, [])
  const material = useMemo(() => new THREE.PointsMaterial({ size: 0.42, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false }), [])
  useFrame(() => {
    const t = sinceVerse('force')
    ref.current.visible = t >= 0
    if (t < 0) return
    const pos = geo.attributes.position, col = geo.attributes.color
    data.forEach((b, k) => {
      const age = t < b.start ? -1 : (t - b.start) % PERIOD
      const live = age >= 0 && age < LIFE
      const fade = live ? Math.pow(1 - age / LIFE, 1.5) : 0
      const spread = live ? 2.4 * (1 - Math.exp(-age * 2.2)) : 0
      b.dirs.forEach((d, j) => {
        const i = k * PER + j
        pos.setXYZ(i, b.c.x + d.x * spread, b.c.y + d.y * spread - 0.35 * age * age, b.c.z + d.z * spread)
        col.setXYZ(i, b.color.r * fade, b.color.g * fade, b.color.b * fade)
      })
    })
    pos.needsUpdate = col.needsUpdate = true
  })
  return <points ref={ref} geometry={geo} material={material} frustumCulled={false} visible={false} />
}

export function SpiralMoments() {
  return (
    <>
      <Motes />
      <Dome />
      <Banyan />
      <Dreams />
      <Halo />
      <NotEasy />
      <Fireworks />
    </>
  )
}

// How much the lanterns flare once the last verse begins (stays up through the end).
export const lanternFlare = () => {
  const t = sinceVerse('force')
  return t < 0 ? 0 : smoothstep(0, 2.5, t)
}

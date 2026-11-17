// Props and little scripted moments for each chapter stop.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DEG, R, clamp, lerp, smoothstep, bump, pt, zOf, yawToward, rng } from './geo'
import { CHAPTERS } from './config'
import { story, chapterTime } from './story'
import { pal } from './palette'
import { At, Box, Cyl, Ball, Cone, Gable, mat, Glow, glowMaterial } from './kit'
import { AmmaOnPhone } from './Characters'

const HALF_PI = Math.PI / 2
const idxOf = (id) => CHAPTERS.findIndex((c) => c.id === id)
const showing = () => !['begin', 'loading'].includes(story.phase)

// Window glass that glows in the evening. extra(p) adds a story-specific glow.
function useWindowMat(extra = () => 0) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: '#39445a', emissive: '#ffc773', emissiveIntensity: 0, flatShading: true, roughness: 0.4 }), [])
  useFrame(() => { m.emissiveIntensity = pal.night * 1.4 + extra(story.progress) })
  return m
}

function Tree({ trunk = 0.8, r = 0.55, c = '#5f9e48', apples = 0, seed = 1, ...p }) {
  const fruit = useMemo(() => {
    const g = rng(seed)
    return Array.from({ length: apples }, () => {
      const th = g() * Math.PI * 2, ph = g() * 1.2 + 0.2
      return [Math.cos(th) * Math.sin(ph) * r * 0.95, trunk + 0.3 + Math.cos(ph) * r * 0.8, Math.sin(th) * Math.sin(ph) * r * 0.95]
    })
  }, [])
  return (
    <group {...p}>
      <Cyl rt={0.07} rb={0.1} hgt={trunk + 0.2} seg={6} c="#7b5537" position-y={(trunk + 0.2) / 2} />
      <Ball r={r} detail={0} c={c} position-y={trunk + 0.3} />
      <Ball r={r * 0.7} detail={0} c={c} position={[r * 0.45, trunk + 0.55, 0.1]} />
      {fruit.map((q, i) => <Ball key={i} r={0.06} detail={0} c="#d6262f" position={q} shadow={false} />)}
    </group>
  )
}

function Palm({ ...p }) {
  return (
    <group {...p}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Cyl key={i} rt={0.06 - i * 0.006} rb={0.075 - i * 0.006} hgt={0.46} seg={6} c="#9a7350" position={[i * i * 0.025, 0.23 + i * 0.44, 0]} />
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i} position={[0.4, 2.2, 0]} rotation-y={(i / 8) * Math.PI * 2}>
          <Box s={[0.18, 0.025, 0.85]} c={i % 2 ? '#5d9c3c' : '#4f8c34'} position={[0, -0.18, 0.38]} rotation-x={0.5} />
        </group>
      ))}
      {[0, 2.1, 4.2].map((a) => <Ball key={a} r={0.08} detail={0} c="#6b4a2a" position={[0.4 + Math.cos(a) * 0.1, 2.08, Math.sin(a) * 0.1]} />)}
    </group>
  )
}

// ================= Chapter 1 & 9: the India house =================
function IndiaHouse() {
  const lit = (p) => smoothstep(330, 350, p) * 2.4
  const win = useWindowMat((p) => lit(p) + (p < 12 ? 0.5 : 0))
  const lights = useRef()
  const bulbs = useMemo(() => {
    const out = []
    for (let i = 0; i <= 12; i++) out.push([-1.25 + i * 0.208, 1.2, 0.98])
    for (let i = 0; i <= 9; i++) out.push([-1.2 + i * 0.2, 2.2, 0.83])
    return out
  }, [])
  const bulbMats = useMemo(() => ['#ffd36b', '#ff8a5c', '#fff2c2', '#ff6f91'].map((c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false })), [])
  useFrame(() => {
    const l = smoothstep(332, 346, story.progress)
    lights.current.visible = l > 0.01
    const t = story.time
    bulbMats.forEach((m, i) => m.color.setScalar(1).multiplyScalar(0.6 + 0.6 * (0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.6))))
  })
  return (
    <group>
      <Box s={[2.7, 0.14, 2.1]} c="#d9c39e" position-y={0.07} />
      <Box s={[2.5, 1.0, 1.9]} c="#f4e4c6" position-y={0.64} />
      <Box s={[2.62, 0.09, 2.02]} c="#c8643c" position-y={1.18} />
      <Box s={[2.1, 0.92, 1.62]} c="#f7ebd2" position={[-0.18, 1.68, -0.08]} />
      <Box s={[2.2, 0.09, 1.72]} c="#c8643c" position={[-0.18, 2.18, -0.08]} />
      <Box s={[2.5, 0.22, 0.05]} c="#e9b64a" position={[0, 1.34, 0.98]} />
      <Box s={[0.05, 0.22, 0.25]} c="#e9b64a" position={[1.24, 1.34, 0.86]} />
      <Box s={[0.5, 0.74, 0.05]} c="#7a3b22" position={[0.35, 0.5, 0.96]} />
      <Box s={[0.6, 0.06, 0.06]} c="#c8643c" position={[0.35, 0.9, 0.97]} />
      <Box s={[0.8, 0.07, 0.35]} c="#cbb08a" position={[0.35, 0.17, 1.12]} />
      <Box s={[0.6, 0.06, 0.22]} c="#cbb08a" position={[0.35, 0.1, 1.33]} />
      {[[-0.68, 0.7, 0.96], [-0.68, 1.68, 0.74], [0.42, 1.68, 0.74]].map((q, i) => (
        <group key={i} position={q}>
          <Box s={[0.5, 0.42, 0.05]} c="#c8643c" />
          <Box s={[0.4, 0.33, 0.03]} m={win} position-z={0.02} />
        </group>
      ))}
      <Cyl r={0.17} hgt={0.3} seg={8} c="#2f3a33" position={[-0.85, 2.38, -0.4]} />
      <Box s={[0.32, 0.38, 0.32]} c="#c8643c" position={[1.0, 0.33, 1.25]} />
      <Ball r={0.18} detail={0} c="#4f8c34" position={[1.0, 0.64, 1.25]} />
      <group ref={lights}>
        {bulbs.map((q, i) => (
          <mesh key={i} position={q} material={bulbMats[i % 4]}>
            <icosahedronGeometry args={[0.035, 0]} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Kolam() {
  const ref = useRef()
  useFrame(() => (ref.current.visible = story.progress < 300))
  const dots = []
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (Math.abs(i) + Math.abs(j) <= 3) dots.push([i * 0.11, j * 0.11])
  return (
    <group ref={ref}>
      {dots.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.075, z]} rotation-x={-HALF_PI} material={mat('#fbfaf5')}>
          <circleGeometry args={[0.022, 6]} />
        </mesh>
      ))}
      <mesh position-y={0.074} rotation-x={-HALF_PI} material={mat('#fbfaf5')}>
        <ringGeometry args={[0.36, 0.385, 24]} />
      </mesh>
    </group>
  )
}

function Rangoli() {
  const ref = useRef()
  useFrame(() => {
    const v = smoothstep(334, 348, story.progress)
    ref.current.visible = v > 0.01
    ref.current.scale.setScalar(Math.max(v, 0.001))
  })
  const ring = (n, r, size, color, y, rot = 0) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2 + rot
      return (
        <mesh key={`${r}-${i}`} position={[Math.cos(a) * r, y, Math.sin(a) * r]} rotation={[-HALF_PI, 0, -a]} scale={[1.6, 1, 1]} material={mat(color)}>
          <circleGeometry args={[size, 6]} />
        </mesh>
      )
    })
  return (
    <group ref={ref}>
      <mesh position-y={0.074} rotation-x={-HALF_PI} material={mat('#f6c94c')}><circleGeometry args={[0.1, 10]} /></mesh>
      {ring(8, 0.2, 0.07, '#e9417a', 0.075)}
      {ring(12, 0.34, 0.06, '#ff8a2a', 0.076, 0.2)}
      {ring(16, 0.47, 0.045, '#3b8fd9', 0.077)}
      {ring(20, 0.58, 0.03, '#fbfaf5', 0.078, 0.1)}
    </group>
  )
}

function PhoneTable() {
  const coins = useRef([])
  const table = useRef()
  useFrame(() => {
    const t = chapterTime(0)
    const n = t > 100 ? 14 : Math.min(14, Math.floor(Math.max(0, t - 1.2) * 1.8))
    coins.current.forEach((c, i) => c && (c.visible = i < n))
    table.current.visible = story.progress < 300
  })
  return (
    <group ref={table}>
      <Box s={[0.42, 0.04, 0.32]} c="#8a5a3a" position-y={0.46} />
      {[[-0.17, -0.12], [0.17, -0.12], [-0.17, 0.12], [0.17, 0.12]].map(([x, z], i) => (
        <Cyl key={i} r={0.02} hgt={0.45} seg={5} c="#6e4428" position={[x, 0.225, z]} />
      ))}
      <Box s={[0.16, 0.07, 0.14]} c="#c23b3b" position={[-0.08, 0.515, 0]} />
      {Array.from({ length: 14 }, (_, i) => (
        <Cyl key={i} r={0.045} hgt={0.016} seg={10} m={mat('#f2c14e', { metal: 0.6, rough: 0.35 })} position={[0.12, 0.49 + i * 0.017, 0.02 + (i % 2) * 0.004]} ref={(r) => (coins.current[i] = r)} />
      ))}
    </group>
  )
}

function PhoneArc() {
  const { curve, core, halo } = useMemo(() => {
    const p0 = pt(2.0, 2.6, 2.3)
    const p1 = pt(zOf(44), 1.0, 26)
    const p2 = pt(zOf(CHAPTERS[idxOf(3)].angle) + 1.4, 3.1, 2.4)
    const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2)
    return { curve, core: new THREE.TubeGeometry(curve, 240, 0.03, 6), halo: new THREE.TubeGeometry(curve, 240, 0.1, 6) }
  }, [])
  const coreMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffe6a6', transparent: true, toneMapped: false }), [])
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffb35c', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), [])
  const pulses = useRef([])
  const rings = useRef()
  const tmp = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const t0 = chapterTime(0)
    const grow = !showing() || story.phase === 'intro' ? 0 : t0 > 100 ? 1 : smoothstep(0.5, 3.4, t0)
    const fade = 1 - smoothstep(50, 78, story.progress)
    const total = core.index.count
    core.setDrawRange(0, Math.floor((total * grow) / 3) * 3)
    halo.setDrawRange(0, Math.floor((halo.index.count * grow) / 3) * 3)
    coreMat.opacity = fade
    haloMat.opacity = 0.3 * fade
    pulses.current.forEach((s, i) => {
      if (!s) return
      const u = (((story.time * 0.07 + i / 6) % 1) * grow)
      s.position.copy(curve.getPoint(i % 2 ? u : grow - u, tmp))
      s.material.opacity = 0.85 * fade * (grow > 0.02 ? 1 : 0)
    })
    const rt = t0 > 100 ? 1 : smoothstep(3.6, 7.6, t0)
    rings.current.visible = t0 > 3.6 && fade > 0.01 && story.progress < 300
    if (rings.current.visible) {
      curve.getPoint(lerp(0.32, 0.03, rt), rings.current.position)
      rings.current.position.y += 0.35 * rt
      rings.current.rotation.y = story.time * 1.4
    }
  })
  return (
    <group>
      <mesh geometry={core} material={coreMat} frustumCulled={false} />
      <mesh geometry={halo} material={haloMat} frustumCulled={false} />
      {Array.from({ length: 6 }, (_, i) => (
        <Glow key={i} color="#ffd27a" size={0.7} spriteRef={(r) => (pulses.current[i] = r)} />
      ))}
      <group ref={rings} visible={false} scale={1.4}>
        <mesh rotation-y={0.5} position-x={-0.07} material={mat('#f2c14e', { metal: 0.8, rough: 0.25 })}>
          <torusGeometry args={[0.14, 0.025, 8, 24]} />
        </mesh>
        <mesh rotation-y={-0.5} position-x={0.07} material={mat('#f2c14e', { metal: 0.8, rough: 0.25 })}>
          <torusGeometry args={[0.14, 0.025, 8, 24]} />
        </mesh>
        <Glow color="#ffe2a0" size={0.55} opacity={0.45} />
      </group>
    </group>
  )
}

function Diyas() {
  const ref = useRef()
  const flames = useRef([])
  const spots = useMemo(() => {
    const out = []
    for (let i = 0; i < 9; i++) for (const side of [-1, 1]) out.push([-7 + i * 1.05, side * 0.95])
    return out
  }, [])
  useFrame(() => {
    const v = smoothstep(336, 350, story.progress)
    ref.current.visible = v > 0.01
    flames.current.forEach((f, i) => {
      if (!f) return
      const fl = 0.8 + 0.2 * Math.sin(story.time * 9 + i * 2.1) * Math.sin(story.time * 5.3 + i)
      f.material.opacity = v * fl
      f.scale.setScalar(0.42 * fl)
    })
  })
  return (
    <group ref={ref}>
      {spots.map(([z, s], i) => (
        <At key={i} z={z} s={s}>
          <Cyl rt={0.07} rb={0.04} hgt={0.05} seg={8} c="#b8603a" position-y={0.09} />
          <Cone r={0.018} hgt={0.06} seg={5} m={mat('#ffd36b', { e: '#ffb347', ei: 2 })} position-y={0.15} shadow={false} />
          <Glow color="#ffb04a" size={0.42} position-y={0.16} spriteRef={(r) => (flames.current[i] = r)} />
        </At>
      ))}
    </group>
  )
}

function SkyLanterns() {
  const N = 25
  const items = useMemo(() => {
    const g = rng(25)
    return Array.from({ length: N }, (_, i) => ({ start: 1.5 + i * 0.32 + g() * 0.3, x: (g() - 0.5) * 6, z: 1 + g() * 4.5, sp: 0.35 + g() * 0.25, ph: g() * 6 }))
  }, [])
  const refs = useRef([])
  const glowMat = useMemo(() => glowMaterial('#ffae5c', 0.9), [])
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffcf8a', emissive: '#ff9a3c', emissiveIntensity: 1.6, flatShading: true, toneMapped: false }), [])
  useFrame(() => {
    const t = chapterTime(idxOf(9))
    items.forEach((it, i) => {
      const g = refs.current[i]
      if (!g) return
      const u = t > 500 ? -1 : t - it.start
      g.visible = u > 0 && story.progress > 340
      if (!g.visible) return
      const y = 0.4 + u * it.sp + Math.min(u, 2) * 0.1
      g.position.set(it.x + Math.sin(u * 0.4 + it.ph) * 0.4, y, it.z + u * 0.05)
      g.scale.setScalar(smoothstep(0, 1.2, u))
    })
  })
  return (
    <group>
      {items.map((_, i) => (
        <group key={i} ref={(r) => (refs.current[i] = r)} visible={false}>
          <mesh material={body}><cylinderGeometry args={[0.1, 0.075, 0.2, 6]} /></mesh>
          <sprite material={glowMat} scale={[0.9, 0.9, 0.9]} />
        </group>
      ))}
    </group>
  )
}

function HomeGlow() {
  const ref = useRef()
  useFrame(() => (ref.current.intensity = smoothstep(338, 352, story.progress) * 3.2))
  return <pointLight ref={ref} position={[0, 1.1, 1.3]} color="#ffb070" distance={6} decay={1.4} />
}

function IndiaHome() {
  const ammaYaw = yawToward(1.0, 1.55, -5.4, -0.6)
  return (
    <group>
      <At z={2.4} s={3.35} yaw={HALF_PI + 0.3}><IndiaHouse /></At>
      <At z={-0.2} s={4.6}><Palm rotation-y={0.4} /></At>
      <At z={5.4} s={3.6}><Palm rotation-y={2.2} scale={0.9} /></At>
      <At z={6.0} s={-5.7}><Palm rotation-y={4} scale={1.05} /></At>
      <At z={-2.4} s={-3.2}><Palm rotation-y={1} scale={0.85} /></At>
      <At z={2.55} s={1.85} yaw={HALF_PI + 0.3}><Kolam /><Rangoli /></At>
      <At z={1.0} s={1.55} yaw={ammaYaw}><AmmaOnPhone /></At>
      <At z={0.55} s={1.05} yaw={ammaYaw}><PhoneTable /></At>
      <PhoneArc />
      <Diyas />
      <At z={0} s={0}><SkyLanterns /><HomeGlow /></At>
    </group>
  )
}

// ================= Chapter 2: wedding =================
function Garland({ from, to, n = 11, sag = 0.22 }) {
  const beads = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    beads.push([lerp(from[0], to[0], t), lerp(from[1], to[1], t) - Math.sin(t * Math.PI) * sag, lerp(from[2], to[2], t)])
  }
  return beads.map((q, i) => <Ball key={i} r={0.045} detail={0} c={i % 3 === 0 ? '#ffd23f' : '#ff8c1a'} position={q} shadow={false} />)
}

function Petals() {
  const ref = useRef()
  const N = 70
  const items = useMemo(() => {
    const g = rng(2)
    return Array.from({ length: N }, () => ({ x: (g() - 0.5) * 2.6, z: (g() - 0.5) * 2.6, y: g() * 2.4, sp: 0.35 + g() * 0.3, rot: g() * 6, c: ['#ff6f91', '#ff8c1a', '#ffd23f', '#e9417a'][Math.floor(g() * 4)] }))
  }, [])
  const geo = useMemo(() => new THREE.PlaneGeometry(0.07, 0.05), [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, toneMapped: false }), [])
  const m4 = useMemo(() => new THREE.Matrix4(), [])
  const q = useMemo(() => new THREE.Quaternion(), [])
  const e = useMemo(() => new THREE.Euler(), [])
  const one = useMemo(() => new THREE.Vector3(1, 1, 1), [])
  const v = useMemo(() => new THREE.Vector3(), [])
  const colored = useRef(false)
  useFrame((_, dt) => {
    const t = chapterTime(idxOf(2))
    const on = t > 0 && t < 100 ? smoothstep(0, 1, t) : 0
    ref.current.visible = on > 0.01
    material.opacity = on
    if (!colored.current) {
      const c = new THREE.Color()
      items.forEach((it, i) => ref.current.setColorAt(i, c.set(it.c)))
      ref.current.instanceColor.needsUpdate = true
      colored.current = true
    }
    if (!ref.current.visible) return
    items.forEach((it, i) => {
      it.y -= it.sp * dt
      if (it.y < 0.08) it.y = 2.4
      it.rot += dt * 2
      e.set(it.rot, it.rot * 0.7, 0)
      q.setFromEuler(e)
      ref.current.setMatrixAt(i, m4.compose(v.set(it.x + Math.sin(it.rot) * 0.1, it.y, it.z), q, one))
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return <instancedMesh ref={ref} args={[geo, material, N]} frustumCulled={false} />
}

function Mandap() {
  const posts = [[-1.05, -0.9], [1.05, -0.9], [-1.05, 0.9], [1.05, 0.9]]
  return (
    <group>
      <Box s={[2.4, 0.03, 2.1]} c="#f1d9a6" position-y={0.04} />
      {posts.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cyl r={0.06} hgt={1.95} seg={8} c="#e6b648" position-y={0.98} />
          {[0.4, 0.9, 1.4].map((y) => <Cyl key={y} r={0.075} hgt={0.06} seg={8} c="#c8102e" position-y={y} />)}
          {[0, 1].map((k) => (
            <Box key={k} s={[0.12, 0.9, 0.02]} c="#4f9a3a" position={[x > 0 ? 0.12 : -0.12, 0.55, k ? 0.08 : -0.08]} rotation-z={x > 0 ? -0.25 : 0.25} />
          ))}
        </group>
      ))}
      <Box s={[2.4, 0.08, 2.1]} c="#b8324a" position-y={2.0} />
      <Box s={[2.46, 0.05, 2.16]} c="#e6b648" position-y={1.95} />
      <Cone r={1.45} hgt={0.6} seg={4} c="#d9433f" position-y={2.34} rotation-y={Math.PI / 4} />
      <Ball r={0.09} detail={1} c="#f2c14e" position-y={2.7} />
      <Garland from={[-1.05, 1.9, 0.92]} to={[1.05, 1.9, 0.92]} />
      <Garland from={[-1.05, 1.9, -0.92]} to={[1.05, 1.9, -0.92]} />
      <Garland from={[-1.07, 1.9, -0.9]} to={[-1.07, 1.9, 0.9]} n={9} />
      <Garland from={[1.07, 1.9, -0.9]} to={[1.07, 1.9, 0.9]} n={9} />
      <Petals />
    </group>
  )
}

// ================= Chapter 3: first apartment =================
function Apartment() {
  const win = useWindowMat()
  const screen = useMemo(() => new THREE.MeshBasicMaterial({ color: '#9fc4ff', toneMapped: false }), [])
  const lamp = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fff1c4', toneMapped: false }), [])
  const tvLight = useRef(), roomLight = useRef()
  const puffs = useRef([])
  const PUFFS = 9
  useFrame(() => {
    const t = story.time
    const near = smoothstep(14, 4, Math.abs(story.progress - CHAPTERS[idxOf(3)].angle))
    const blinkCycle = t % 6.5
    const off = blinkCycle > 5.6 && blinkCycle < 5.85 ? 1 : 0
    const scare = bump(blinkCycle, 5.5, 5.6, 6.0, 6.2)
    const flick = 0.75 + 0.25 * Math.sin(t * 17) * Math.sin(t * 7.3)
    screen.color.setRGB(0.55 + scare * 0.45, 0.7 - scare * 0.5, 1.0 - scare * 0.7).multiplyScalar(flick * (1 + scare))
    lamp.color.setScalar(off ? 0.15 : 1)
    tvLight.current.intensity = near * (1.4 + scare * 3) * flick
    roomLight.current.intensity = near * (off ? 0 : 1.6)
    puffs.current.forEach((p, i) => {
      if (!p) return
      const u = (t * 0.45 + i / PUFFS) % 1
      const spice = i % 3 === 2
      p.position.set(0.88 + Math.sin(u * 6 + i) * 0.06 + (spice ? 0.12 : 0), 0.7 + u * 0.95, -0.78)
      p.scale.setScalar(0.05 + u * 0.12)
      p.material.opacity = (1 - u) * 0.75
    })
  })
  return (
    <group>
      <Box s={[3.3, 0.1, 2.3]} c="#c49a6c" position-y={0.05} />
      <Box s={[3.3, 1.75, 0.08]} c="#eedfc4" position={[0, 0.92, -1.11]} />
      <Box s={[0.08, 1.75, 2.3]} c="#e6d3b4" position={[-1.61, 0.92, 0]} />
      <Box s={[0.08, 1.75, 2.3]} c="#e6d3b4" position={[1.61, 0.92, 0]} />
      <Box s={[0.06, 1.75, 1.1]} c="#e6d3b4" position={[0, 0.92, -0.56]} />
      <Box s={[3.4, 0.1, 2.4]} c="#b06049" position-y={1.83} />
      <Box s={[3.4, 1.45, 2.4]} c="#b9654f" position-y={2.6} />
      <Box s={[3.5, 0.1, 2.5]} c="#8e4a3a" position-y={3.37} />
      <Box s={[0.5, 0.35, 0.4]} c="#cfcfcf" position={[1.0, 3.6, -0.4]} />
      {[-1.05, 0, 1.05].map((x) => (
        <group key={x} position={[x, 2.6, 1.21]}>
          <Box s={[0.55, 0.55, 0.04]} c="#f2ede4" />
          <Box s={[0.45, 0.45, 0.03]} m={win} position-z={0.02} />
        </group>
      ))}
      {/* TV room */}
      <Box s={[0.9, 0.02, 1.0]} c="#7a4e7e" position={[-0.8, 0.11, -0.2]} />
      <Box s={[0.32, 0.32, 0.62]} c="#6b4a35" position={[-1.38, 0.26, -0.3]} />
      <Box s={[0.08, 0.44, 0.66]} c="#2b2b33" position={[-1.3, 0.64, -0.3]} />
      <mesh material={screen} position={[-1.255, 0.64, -0.3]} rotation-y={HALF_PI}>
        <planeGeometry args={[0.56, 0.36]} />
      </mesh>
      <Box s={[0.5, 0.24, 0.95]} c="#6f5a9a" position={[-0.42, 0.24, -0.3]} />
      <Box s={[0.13, 0.42, 0.95]} c="#5d4b86" position={[-0.2, 0.44, -0.3]} />
      <Box s={[0.5, 0.3, 0.1]} c="#5d4b86" position={[-0.42, 0.34, 0.2]} />
      <Box s={[0.5, 0.3, 0.1]} c="#5d4b86" position={[-0.42, 0.34, -0.8]} />
      <Cyl rt={0.08} rb={0.05} hgt={0.06} seg={8} c="#e9417a" position={[-0.5, 0.4, -0.15]} />
      <mesh material={lamp} position={[-0.8, 1.66, -0.3]}><icosahedronGeometry args={[0.07, 1]} /></mesh>
      <pointLight ref={tvLight} position={[-1.0, 0.7, -0.3]} color="#9fc0ff" distance={3} decay={1.5} />
      <pointLight ref={roomLight} position={[0.2, 1.4, 0.1]} color="#ffd9a0" distance={4} decay={1.5} />
      {/* kitchen */}
      <Box s={[1.5, 0.5, 0.48]} c="#ddd5c4" position={[0.8, 0.35, -0.82]} />
      <Box s={[1.54, 0.04, 0.52]} c="#8a7a6a" position={[0.8, 0.62, -0.82]} />
      <Box s={[0.5, 0.03, 0.36]} c="#2b2b33" position={[0.88, 0.655, -0.82]} />
      <Cyl r={0.1} hgt={0.13} seg={10} c="#9aa0a8" position={[0.88, 0.735, -0.82]} />
      <Box s={[0.42, 1.2, 0.42]} c="#f4f4f2" position={[1.33, 0.7, -0.82]} />
      <Box s={[1.0, 0.04, 0.16]} c="#8a5a3a" position={[0.55, 1.2, -1.0]} />
      {['#d6262f', '#f2b822', '#e07a2e', '#5a8f3a', '#8b4a2a'].map((c, i) => (
        <Cyl key={c} r={0.035} hgt={0.09} seg={6} c={c} position={[0.18 + i * 0.17, 1.265, -1.0]} />
      ))}
      {Array.from({ length: PUFFS }, (_, i) => (
        <mesh key={i} ref={(r) => (puffs.current[i] = r)}>
          <icosahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={i % 3 === 2 ? '#ff9a52' : '#ffffff'} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// ================= Chapter 4: baby =================
function Crib() {
  const mobile = useRef()
  useFrame((_, dt) => (mobile.current.rotation.y += dt * 0.6))
  return (
    <group>
      <Box s={[0.95, 0.08, 0.55]} c="#fbfaf5" position-y={0.34} />
      <Box s={[0.88, 0.08, 0.48]} c="#a9cdea" position-y={0.42} />
      <Box s={[0.4, 0.05, 0.4]} c="#f7c6d0" position={[0.18, 0.48, 0]} />
      {[[-0.46, -0.26], [0.46, -0.26], [-0.46, 0.26], [0.46, 0.26]].map(([x, z], i) => (
        <Cyl key={i} r={0.025} hgt={0.78} seg={5} c="#fbfaf5" position={[x, 0.39, z]} />
      ))}
      {[-0.26, 0.26].map((z) => (
        <group key={z}>
          <Box s={[0.95, 0.035, 0.035]} c="#fbfaf5" position={[0, 0.74, z]} />
          {Array.from({ length: 9 }, (_, i) => <Cyl key={i} r={0.012} hgt={0.34} seg={4} c="#fbfaf5" position={[-0.4 + i * 0.1, 0.57, z]} shadow={false} />)}
        </group>
      ))}
      <Cyl r={0.015} hgt={0.7} seg={4} c="#fbfaf5" position={[-0.46, 1.1, 0]} />
      <Box s={[0.4, 0.02, 0.02]} c="#fbfaf5" position={[-0.27, 1.45, 0]} />
      <group ref={mobile} position={[-0.07, 1.43, 0]}>
        {[['#f6c94c', 0], ['#e9748e', 1], ['#7fb3d5', 2], ['#9bd27a', 3]].map(([c, i]) => {
          const a = (i / 4) * Math.PI * 2
          return (
            <group key={i} position={[Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17]}>
              <Cyl r={0.004} hgt={0.18} seg={3} c="#ffffff" position-y={-0.09} shadow={false} />
              <mesh position-y={-0.2} material={mat(c)}><octahedronGeometry args={[0.045, 0]} /></mesh>
            </group>
          )
        })}
      </group>
    </group>
  )
}

function Teddy(p) {
  return (
    <group {...p}>
      <Ball r={0.12} detail={1} c="#b07a4a" position-y={0.12} />
      <Ball r={0.09} detail={1} c="#b07a4a" position-y={0.3} />
      <Ball r={0.035} detail={0} c="#8a5a36" position={[-0.07, 0.38, 0]} />
      <Ball r={0.035} detail={0} c="#8a5a36" position={[0.07, 0.38, 0]} />
      <Ball r={0.035} detail={0} c="#e8c9a8" position={[0, 0.29, 0.08]} />
    </group>
  )
}

function Blocks(p) {
  const c = ['#d9433f', '#f2b822', '#3b8fd9', '#5aa84b', '#e9748e', '#9b6fd0']
  const at = [[0, 0, 0], [0.15, 0, 0.02], [0.3, 0, -0.01], [0.07, 0.14, 0], [0.22, 0.14, 0.01], [0.15, 0.28, 0]]
  return (
    <group {...p}>
      {at.map((q, i) => <Box key={i} s={[0.13, 0.13, 0.13]} c={c[i]} position={[q[0], q[1] + 0.065, q[2]]} rotation-y={i * 0.2} />)}
    </group>
  )
}

function Stroller(p) {
  return (
    <group {...p}>
      <Box s={[0.36, 0.25, 0.55]} c="#7fb3d5" position-y={0.42} />
      <mesh position={[0, 0.55, -0.15]} material={mat('#5d93ba')} castShadow>
        <sphereGeometry args={[0.2, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <Cyl r={0.015} hgt={0.5} seg={4} c="#444" position={[0, 0.65, 0.42]} rotation-x={0.6} />
      {[[-0.17, -0.2], [0.17, -0.2], [-0.17, 0.2], [0.17, 0.2]].map(([x, z], i) => (
        <Cyl key={i} r={0.09} hgt={0.04} seg={10} c="#333" position={[x, 0.1, z]} rotation-z={HALF_PI} />
      ))}
    </group>
  )
}

// ================= Chapter 5: fun kid years =================
function Swing(p) {
  const seat = useRef(), seat2 = useRef()
  useFrame(() => {
    seat.current.rotation.x = Math.sin(story.time * 1.9) * 0.55
    seat2.current.rotation.x = Math.sin(story.time * 1.9 + 2) * 0.3
  })
  return (
    <group {...p}>
      {[-1, 1].map((x) => (
        <group key={x} position-x={x * 0.8}>
          <Cyl r={0.04} hgt={1.72} seg={6} c="#d9433f" position={[0, 0.82, 0.17]} rotation-x={-0.2} />
          <Cyl r={0.04} hgt={1.72} seg={6} c="#d9433f" position={[0, 0.82, -0.17]} rotation-x={0.2} />
        </group>
      ))}
      <Cyl r={0.045} hgt={1.75} seg={6} c="#e6b648" position-y={1.66} rotation-z={HALF_PI} />
      {[[-0.38, seat], [0.38, seat2]].map(([x, r], i) => (
        <group key={i} ref={r} position={[x, 1.64, 0]}>
          <Cyl r={0.008} hgt={1.2} seg={3} c="#555" position={[-0.13, -0.6, 0]} shadow={false} />
          <Cyl r={0.008} hgt={1.2} seg={3} c="#555" position={[0.13, -0.6, 0]} shadow={false} />
          <Box s={[0.34, 0.04, 0.15]} c={i ? '#3b8fd9' : '#f2b822'} position-y={-1.2} />
        </group>
      ))}
    </group>
  )
}

function Chalk() {
  const flat = (c, s, pos, r = 0) => (
    <mesh key={`${pos[0]},${pos[1]},${r}`} position={[pos[0], 0.074, pos[1]]} rotation={[-HALF_PI, 0, r]} material={mat(c, { rough: 1 })}>
      <planeGeometry args={s} />
    </mesh>
  )
  const squares = [[0, -2.6], [0, -2.15], [-0.23, -1.7], [0.23, -1.7], [0, -1.25], [-0.23, -0.8], [0.23, -0.8]]
  const pastel = ['#f7b2c4', '#a8d8f0', '#fff0a0', '#c7f0b0', '#e2c2f5', '#ffd0a8', '#f7b2c4']
  return (
    <group>
      {squares.map((q, i) => flat(pastel[i], [0.38, 0.38], q))}
      <mesh position={[0.05, 0.074, 1.0]} rotation-x={-HALF_PI} material={mat('#fff0a0', { rough: 1 })}>
        <circleGeometry args={[0.18, 12]} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2
        return flat('#fff0a0', [0.04, 0.16], [0.05 + Math.cos(a) * 0.3, 1.0 + Math.sin(a) * 0.3], -a + HALF_PI)
      })}
      {flat('#a8d8f0', [0.5, 0.05], [-0.2, 1.8], 0.3)}
      {flat('#f7b2c4', [0.5, 0.05], [0.2, 1.9], -0.4)}
    </group>
  )
}

function Kite(p) {
  const ref = useRef()
  useFrame(() => {
    ref.current.rotation.z = Math.sin(story.time * 0.9) * 0.2
    ref.current.position.y = 5.4 + Math.sin(story.time * 0.6) * 0.3
  })
  return (
    <group {...p}>
      <group ref={ref}>
        <mesh rotation-z={Math.PI / 4} material={mat('#e9417a')} castShadow>
          <planeGeometry args={[0.55, 0.55]} />
        </mesh>
        <mesh rotation-z={Math.PI / 4} position-z={-0.01} scale={0.55} material={mat('#f2b822')}>
          <planeGeometry args={[0.55, 0.55]} />
        </mesh>
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[0.1, 0.05, 0.02]} c={i % 2 ? '#3b8fd9' : '#f2b822'} position={[Math.sin(i) * 0.08, -0.5 - i * 0.22, 0]} shadow={false} />)}
      </group>
    </group>
  )
}

function Clothesline() {
  return (
    <group>
      <Tree trunk={2.3} r={0.75} position-x={2.55} seed={3} />
      <Tree trunk={2.2} r={0.7} position-x={-2.55} seed={4} />
      <Cyl r={0.012} hgt={5.0} seg={4} c="#f4f1e6" position-y={2.48} rotation-z={HALF_PI} shadow={false} />
    </group>
  )
}

// ================= Chapter 6 & 8: the family house =================
function BigHouse({ boxes = false }) {
  const win = useWindowMat()
  return (
    <group>
      <Box s={[3.0, 0.1, 2.2]} c="#cdbfa8" position-y={0.05} />
      <Box s={[2.9, 1.1, 2.1]} c="#9db4c8" position-y={0.65} />
      <Box s={[2.98, 0.08, 2.18]} c="#f6f3ea" position-y={1.22} />
      <Box s={[2.9, 0.9, 2.1]} c="#a9bfd1" position-y={1.71} />
      <Gable w={2.4} d={3.2} hgt={0.95} c="#5c4b5e" position-y={2.16} rotation-y={HALF_PI} />
      <Box s={[0.28, 0.7, 0.28]} c="#a8574a" position={[0.9, 2.65, -0.4]} />
      <Box s={[2.9, 0.08, 0.7]} c="#d8cdb8" position={[0, 0.13, 1.4]} />
      {[-1.3, -0.2, 1.3].map((x) => <Cyl key={x} r={0.045} hgt={1.0} seg={6} c="#f6f3ea" position={[x, 0.65, 1.7]} />)}
      <Box s={[3.0, 0.07, 0.8]} c="#6c5a6e" position={[0, 1.18, 1.4]} rotation-x={0.12} />
      <Box s={[0.48, 0.8, 0.05]} c="#a8433a" position={[0.3, 0.52, 1.06]} />
      {[[-0.85, 0.7, 1.06], [1.05, 0.7, 1.06], [-0.85, 1.72, 1.06], [0.15, 1.72, 1.06], [1.05, 1.72, 1.06]].map((q, i) => (
        <group key={i} position={q}>
          <Box s={[0.5, 0.48, 0.04]} c="#f6f3ea" />
          <Box s={[0.4, 0.38, 0.03]} m={win} position-z={0.02} />
        </group>
      ))}
      {boxes && <MovingBoxes position={[0.4, 0, 2.3]} />}
    </group>
  )
}

function Fence({ len = 6, ...p }) {
  const n = Math.round(len / 0.28)
  return (
    <group {...p}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position-z={-len / 2 + i * 0.28}>
          <Box s={[0.05, 0.42, 0.09]} c="#fbfaf5" position-y={0.21} />
          <Cone r={0.05} hgt={0.07} seg={4} c="#fbfaf5" position-y={0.455} rotation-y={Math.PI / 4} />
        </group>
      ))}
      <Box s={[0.03, 0.05, len]} c="#fbfaf5" position={[0.04, 0.3, -0.14]} />
      <Box s={[0.03, 0.05, len]} c="#fbfaf5" position={[0.04, 0.14, -0.14]} />
    </group>
  )
}

function FlowerBed({ n = 14, seed = 1, w = 1.6, ...p }) {
  const items = useMemo(() => {
    const g = rng(seed)
    return Array.from({ length: n }, () => [(g() - 0.5) * w, (g() - 0.5) * 0.4, ['#e9417a', '#f6c94c', '#b98ae0', '#ff8a52', '#fbfaf5'][Math.floor(g() * 5)]])
  }, [])
  return (
    <group {...p}>
      <Box s={[w + 0.2, 0.06, 0.6]} c="#7a5a3e" position-y={0.03} />
      {items.map(([x, z, c], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cyl r={0.01} hgt={0.18} seg={3} c="#4f8c34" position-y={0.09} shadow={false} />
          <Ball r={0.05} detail={0} c={c} position-y={0.2} />
        </group>
      ))}
    </group>
  )
}

function Balloons(p) {
  const ref = useRef()
  useFrame(() => (ref.current.rotation.z = Math.sin(story.time * 0.8) * 0.08))
  const cols = ['#e9417a', '#3b8fd9', '#f2b822', '#5aa84b']
  return (
    <group {...p}>
      <Box s={[0.08, 0.9, 0.08]} c="#fbfaf5" position-y={0.45} />
      <group ref={ref} position-y={0.85}>
        {cols.map((c, i) => {
          const x = (i - 1.5) * 0.17, y = 0.7 + (i % 2) * 0.18
          return (
            <group key={c}>
              <Cyl r={0.004} hgt={y} seg={3} c="#ffffff" position={[x / 2, y / 2, 0]} rotation-z={-x / y} shadow={false} />
              <Ball r={0.13} detail={1} c={c} position={[x, y + 0.12, 0]} scale={[1, 1.2, 1]} m={mat(c, { rough: 0.3 })} />
            </group>
          )
        })}
      </group>
    </group>
  )
}

// ================= Chapter 7: adventures =================
function Maple({ c = '#d9532c', ...p }) {
  return (
    <group {...p}>
      <Cyl rt={0.07} rb={0.1} hgt={0.95} seg={6} c="#6e4a32" position-y={0.47} />
      <Ball r={0.55} detail={0} c={c} position-y={1.15} />
      <Ball r={0.4} detail={0} c="#e8862f" position={[0.3, 1.35, 0.15]} />
      <Ball r={0.36} detail={0} c="#c43c2a" position={[-0.25, 1.4, -0.12]} />
    </group>
  )
}

function mapleLeafShape() {
  const half = [[0, 0.5], [0.07, 0.33], [0.2, 0.38], [0.16, 0.18], [0.36, 0.24], [0.3, 0.08], [0.4, 0.02], [0.14, -0.12], [0.18, -0.24], [0.03, -0.2], [0.03, -0.42]]
  const pts = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])]
  const s = new THREE.Shape()
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)))
  return s
}

function CanadaSign(p) {
  const leaf = useMemo(() => new THREE.ShapeGeometry(mapleLeafShape()), [])
  return (
    <group {...p}>
      <Cyl r={0.04} hgt={1.3} seg={6} c="#7b5537" position={[-0.55, 0.65, 0]} />
      <Cyl r={0.04} hgt={1.3} seg={6} c="#7b5537" position={[0.55, 0.65, 0]} />
      <Box s={[1.3, 0.62, 0.05]} c="#fbfaf5" position-y={1.05} />
      <Box s={[0.3, 0.62, 0.06]} c="#d52b1e" position={[-0.5, 1.05, 0]} />
      <Box s={[0.3, 0.62, 0.06]} c="#d52b1e" position={[0.5, 1.05, 0]} />
      <mesh geometry={leaf} position={[0, 1.04, 0.032]} scale={0.6} material={mat('#d52b1e')} />
    </group>
  )
}

function SchoolBus(p) {
  return (
    <group {...p}>
      <Box s={[0.92, 0.85, 2.3]} c="#f2b822" position={[0, 0.63, 0]} />
      <Box s={[0.86, 0.45, 0.5]} c="#f2b822" position={[0, 0.43, 1.38]} />
      <Box s={[0.94, 0.05, 2.32]} c="#222" position={[0, 0.5, 0]} />
      <Box s={[0.94, 0.04, 2.32]} c="#222" position={[0, 0.66, 0]} />
      {[-0.8, -0.4, 0, 0.4, 0.8].map((z) => (
        <group key={z}>
          <Box s={[0.02, 0.24, 0.3]} c="#33405a" position={[0.47, 0.88, z]} shadow={false} />
          <Box s={[0.02, 0.24, 0.3]} c="#33405a" position={[-0.47, 0.88, z]} shadow={false} />
        </group>
      ))}
      <Box s={[0.8, 0.26, 0.02]} c="#33405a" position={[0, 0.88, 1.16]} shadow={false} />
      {[[-0.42, 1.0], [0.42, 1.0], [-0.42, -0.75], [0.42, -0.75]].map(([x, z], i) => (
        <Cyl key={i} r={0.19} hgt={0.12} seg={10} c="#222" position={[x, 0.19, z]} rotation-z={HALF_PI} />
      ))}
      <mesh position={[-0.49, 0.75, 0.6]} rotation-y={-HALF_PI} material={mat('#d52b1e')}>
        <circleGeometry args={[0.12, 8]} />
      </mesh>
    </group>
  )
}

function Basket(p) {
  return (
    <group {...p}>
      <Cyl rt={0.2} rb={0.15} hgt={0.22} seg={8} c="#b98a4a" position-y={0.11} />
      {[[-0.07, 0], [0.07, 0.03], [0, -0.08], [0.02, 0.09], [-0.1, 0.08]].map(([x, z], i) => (
        <Ball key={i} r={0.06} detail={0} c="#d6262f" position={[x, 0.24, z]} />
      ))}
    </group>
  )
}

function FallingLeaves({ from = 205, to = 300, ...p }) {
  const ref = useRef()
  const N = 40
  const items = useMemo(() => {
    const g = rng(8)
    return Array.from({ length: N }, () => ({ x: (g() - 0.5) * 9, z: (g() - 0.3) * 8, y: g() * 3, sp: 0.25 + g() * 0.2, rot: g() * 6, c: ['#d9532c', '#e8862f', '#c43c2a', '#f2b822'][Math.floor(g() * 4)] }))
  }, [])
  const geo = useMemo(() => new THREE.PlaneGeometry(0.1, 0.08), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, flatShading: true }), [])
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), one: new THREE.Vector3(1, 1, 1) }), [])
  const colored = useRef(false)
  useFrame((_, dt) => {
    const on = story.progress > from && story.progress < to
    ref.current.visible = on
    if (!colored.current) {
      const c = new THREE.Color()
      items.forEach((it, i) => ref.current.setColorAt(i, c.set(it.c)))
      ref.current.instanceColor.needsUpdate = true
      colored.current = true
    }
    if (!on) return
    items.forEach((it, i) => {
      it.y -= it.sp * dt
      if (it.y < 0.1) it.y = 3
      it.rot += dt * 1.5
      tmp.e.set(it.rot, it.rot * 0.6, it.rot * 0.3)
      tmp.q.setFromEuler(tmp.e)
      ref.current.setMatrixAt(i, tmp.m.compose(tmp.v.set(it.x + Math.sin(it.rot) * 0.3, it.y, it.z), tmp.q, tmp.one))
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <group {...p}>
      <instancedMesh ref={ref} args={[geo, material, N]} frustumCulled={false} />
    </group>
  )
}

// ================= Chapter 8: moving back =================
function MovingBoxes(p) {
  const stack = [[0, 0, 0, 0.5], [0.55, 0, 0.05, 0.45], [0.25, 0.47, 0.02, 0.42], [-0.5, 0, 0.1, 0.4], [1.05, 0, -0.1, 0.38], [0.6, 0.45, 0.05, 0.35], [-0.5, 0.4, 0.08, 0.32]]
  return (
    <group {...p}>
      {stack.map(([x, y, z, s], i) => (
        <group key={i} position={[x, y + s / 2, z]} rotation-y={i * 0.25}>
          <Box s={[s, s * 0.9, s]} c="#c49a6a" />
          <Box s={[s + 0.005, 0.02, 0.08]} c="#e8d6b0" position-y={s * 0.45} shadow={false} />
        </group>
      ))}
      <group position={[-1.1, 0, 0.3]} rotation-y={0.3}>
        <Box s={[0.4, 0.55, 0.18]} c="#c23b3b" position-y={0.31} />
        <Box s={[0.14, 0.04, 0.03]} c="#333" position-y={0.62} />
      </group>
    </group>
  )
}

function Truck(p) {
  return (
    <group {...p}>
      <Box s={[1.05, 1.15, 1.9]} c="#f4f4f2" position={[0, 0.78, -0.3]} />
      <Box s={[0.95, 0.8, 0.75]} c="#3b6fb0" position={[0, 0.58, 1.05]} />
      <Box s={[0.85, 0.3, 0.02]} c="#33405a" position={[0, 0.78, 1.43]} shadow={false} />
      {[[-0.5, 1.0], [0.5, 1.0], [-0.5, -0.8], [0.5, -0.8]].map(([x, z], i) => (
        <Cyl key={i} r={0.2} hgt={0.14} seg={10} c="#222" position={[x, 0.2, z]} rotation-z={HALF_PI} />
      ))}
    </group>
  )
}

// ================= all chapters =================
export function Scenes() {
  const A = (id) => CHAPTERS[idxOf(id)].angle * DEG
  return (
    <>
      <group rotation-x={A(1)}><IndiaHome /></group>

      <group rotation-x={A(2)}>
        <At z={0} s={0}><Mandap /></At>
        <At z={-1.6} s={2.4}><Palm scale={0.9} /></At>
        <At z={1.2} s={-2.8}><Palm scale={1.0} rotation-y={2} /></At>
        <At z={-2.5} s={-2.2}><Palm scale={0.8} rotation-y={4} /></At>
      </group>

      <group rotation-x={A(3)}>
        <At z={1.4} s={3.15} yaw={HALF_PI + 0.45}><Apartment /></At>
        <At z={-1.2} s={-2.6}><Tree seed={7} /></At>
        <At z={3.4} s={-2.3}><Tree seed={8} r={0.6} /></At>
      </group>

      <group rotation-x={A(4)}>
        <At z={-0.4} s={2.2} yaw={HALF_PI + 0.9}><Crib /></At>
        <At z={0.5} s={1.25} yaw={Math.PI - 0.3}><Teddy /></At>
        <At z={0.6} s={-1.3} yaw={Math.PI + 0.4}><Blocks /></At>
        <At z={-0.6} s={-2.2} yaw={-HALF_PI - 0.6}><Stroller /></At>
        <At z={-2.2} s={3.4}><Tree seed={9} /></At>
      </group>

      <group rotation-x={A(5)}>
        <At z={0.2} s={-3.0} yaw={HALF_PI}><Swing /></At>
        <At z={0}><Chalk /></At>
        <At z={0.9} s={1.15}><Ball r={0.14} detail={1} c="#e9417a" position-y={0.14} m={mat('#e9417a', { rough: 0.4 })} /></At>
        <At z={-0.6} s={1.6} yaw={0.5}>
          <Box s={[0.18, 0.1, 0.3]} c="#3b8fd9" position-y={0.09} />
          {[[-0.09, -0.1], [0.09, -0.1], [-0.09, 0.1], [0.09, 0.1]].map(([x, z], i) => <Cyl key={i} r={0.04} hgt={0.03} seg={8} c="#222" position={[x, 0.04, z]} rotation-z={HALF_PI} />)}
        </At>
        <At z={3.6}><Clothesline /></At>
        <At z={7} s={-1.5}><Kite /></At>
      </group>

      <group rotation-x={A(6)}>
        <At z={1.8} s={4.4} yaw={-HALF_PI + Math.PI + 0.25}><BigHouse /></At>
        <At z={1.2} s={2.75}><Fence len={7} /></At>
        <At z={-0.4} s={3.25} yaw={HALF_PI}><FlowerBed seed={2} /></At>
        <At z={3.9} s={3.25} yaw={HALF_PI}><FlowerBed seed={3} w={1.2} /></At>
        <At z={-0.9} s={2.5} yaw={Math.PI}><Balloons /></At>
        <At z={0.4} s={-3.1}><Tree seed={10} r={0.65} /></At>
        <At z={-2.5} s={-2.6}><FlowerBed seed={4} w={1.0} /></At>
      </group>

      <group rotation-x={A(7)}>
        {[[-2.5, -3.4], [0.2, -3.5], [2.9, -3.6], [-1.2, -5.4], [1.6, -5.5], [4.2, -5.0]].map(([z, s], i) => (
          <At key={i} z={z} s={s}><Tree apples={9} seed={20 + i} c="#5aa046" /></At>
        ))}
        <At z={0.4} s={-1.45}><Basket /></At>
        <At z={-1.8} s={-1.5}><Basket /></At>
        {[[-0.4, 4.4, '#d9532c'], [3.0, 4.2, '#e8862f'], [-3.0, 5.2, '#c43c2a'], [5.0, 3.6, '#d9532c']].map(([z, s, c], i) => (
          <At key={i} z={z} s={s}><Maple c={c} /></At>
        ))}
        <At z={4.2} s={2.3} yaw={Math.PI - 0.5}><CanadaSign /></At>
        <At z={-1.0} s={2.9} yaw={0}><SchoolBus /></At>
        <At z={0}><FallingLeaves /></At>
      </group>

      <group rotation-x={A(8)}>
        <At z={1.4} s={4.3} yaw={-HALF_PI + Math.PI + 0.3}><BigHouse boxes /></At>
        <At z={2.2} s={-3.8} yaw={0.15}><Truck /></At>
        <At z={3.6} s={-3.0}><Maple c="#c43c2a" /></At>
        <At z={-2.8} s={3.0}><Maple /></At>
        <At z={0}><FallingLeaves from={240} to={287} /></At>
      </group>
    </>
  )
}

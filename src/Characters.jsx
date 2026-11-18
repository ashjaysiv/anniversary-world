// The four family figures, their footprints, the plane and the rain-and-umbrella moment.
import * as THREE from 'three'
import { useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { R, DEG, clamp, lerp, smoothstep, bump, pt, zOf, pathMatrix, OCEANS, rng } from './geo'
import { FAMILY, ORDER, FINALE_ORDER, formation, curve, CHAPTERS } from './config'
import { story, boarded, flight, chapterTime, currentSegment } from './story'
import { Box, Cyl, Ball, Cone, mat, Glow, Limb } from './kit'
import { umbrellaJoke, stoodFactor } from './spiral'

// ---------- figures (local space: faces +Z, feet at y=0) ----------
function Arm({ side, y, color, skin, len = 0.36, armRef }) {
  return (
    <group position={[side * 0.2, y, 0]} ref={armRef}>
      <Cyl r={0.048} hgt={len} seg={6} c={color} position-y={-len / 2} />
      <Ball r={0.05} detail={0} c={skin} position-y={-len - 0.02} />
    </group>
  )
}
function Leg({ side, color, shoe = '#2a2420', len = 0.46, legRef, x = 0.08 }) {
  return (
    <group position={[side * x, len + 0.02, 0]} ref={legRef}>
      <Cyl r={0.062} hgt={len} seg={6} c={color} position-y={-len / 2} />
      <Box s={[0.1, 0.06, 0.17]} c={shoe} position={[0, -len - 0.0, 0.03]} />
    </group>
  )
}

export function Nana({ rig }) {
  const f = FAMILY.nana
  return (
    <group>
      <Leg side={1} color={f.trousers} legRef={(r) => (rig.legL = r)} />
      <Leg side={-1} color={f.trousers} legRef={(r) => (rig.legR = r)} />
      <group ref={(r) => (rig.body = r)}>
        <Cyl rt={0.17} rb={0.15} hgt={0.44} seg={8} c={f.shirt} position-y={0.7} />
        <Cyl r={0.06} hgt={0.06} seg={6} c={f.skin} position-y={0.95} />
        <Ball r={0.14} detail={1} c={f.skin} position-y={1.06} />
        <Ball r={0.146} detail={1} c={f.hair} position={[0, 1.11, -0.012]} scale={[1, 0.62, 1]} />
        <Box s={[0.1, 0.022, 0.03]} c={f.hair} position={[0, 1.02, 0.128]} />
        <Arm side={1} y={0.9} color={f.shirt} skin={f.skin} armRef={(r) => (rig.armL = r)} />
        <Arm side={-1} y={0.9} color={f.shirt} skin={f.skin} armRef={(r) => (rig.armR = r)} />
      </group>
    </group>
  )
}

export function Amma({ rig, phone }) {
  const f = FAMILY.amma
  return (
    <group>
      <group ref={(r) => (rig.body = r)}>
        <Cyl rt={0.13} rb={0.25} hgt={0.62} seg={9} c={f.saree} position-y={0.31} />
        <Cyl r={0.256} hgt={0.06} seg={9} c={f.border} position-y={0.03} />
        <Cyl rt={0.145} rb={0.135} hgt={0.3} seg={8} c={f.blouse} position-y={0.74} />
        <Box s={[0.06, 0.5, 0.05]} c={f.saree} position={[0.03, 0.72, 0.135]} rotation-z={0.62} />
        <Box s={[0.07, 0.55, 0.05]} c={f.saree} position={[0.1, 0.66, -0.13]} rotation-z={-0.2} />
        <Cyl r={0.055} hgt={0.06} seg={6} c={f.skin} position-y={0.92} />
        <Ball r={0.135} detail={1} c={f.skin} position-y={1.02} />
        <Ball r={0.14} detail={1} c={f.hair} position={[0, 1.065, -0.015]} scale={[1, 0.66, 1]} />
        <Ball r={0.075} detail={0} c={f.hair} position={[0, 1.0, -0.14]} />
        <Ball r={0.013} detail={0} c="#c8102e" position={[0, 1.055, 0.132]} shadow={false} />
        <Arm side={1} y={0.86} color={f.skin} skin={f.skin} len={0.34} armRef={(r) => (rig.armL = r)} />
        {phone ? (
          <group>
            <Limb from={[-0.2, 0.86, 0]} to={[-0.27, 0.7, 0.07]} r={0.046} c={f.skin} />
            <Limb from={[-0.27, 0.7, 0.07]} to={[-0.15, 0.99, 0.06]} r={0.042} c={f.skin} />
            <Ball r={0.048} detail={0} c={f.skin} position={[-0.14, 1.0, 0.06]} />
            <Box s={[0.035, 0.15, 0.05]} c="#2b2b33" position={[-0.125, 1.02, 0.03]} rotation-x={0.3} />
          </group>
        ) : (
          <group position={[-0.2, 0.86, 0]} ref={(r) => (rig.armR = r)}>
            <Cyl r={0.045} hgt={0.34} seg={6} c={f.skin} position-y={-0.17} />
            <Ball r={0.05} detail={0} c={f.skin} position-y={-0.36} />
          </group>
        )}
      </group>
    </group>
  )
}

function Kid({ k, rig }) {
  const f = FAMILY[k]
  return (
    <group>
      <Leg side={1} color={f.skin} shoe="#ffffff" len={0.36} x={0.075} legRef={(r) => (rig.legL = r)} />
      <Leg side={-1} color={f.skin} shoe="#ffffff" len={0.36} x={0.075} legRef={(r) => (rig.legR = r)} />
      <group ref={(r) => (rig.body = r)}>
        {f.girl ? (
          <>
            <Cyl rt={0.13} rb={0.23} hgt={0.26} seg={9} c={f.dress} position-y={0.4} />
            <Cyl rt={0.14} rb={0.135} hgt={0.26} seg={8} c={f.dress} position-y={0.62} />
            <Box s={[0.3, 0.035, 0.27]} c="#fbfaf5" position-y={0.515} shadow={false} />
          </>
        ) : (
          <>
            <Cyl rt={0.13} rb={0.14} hgt={0.13} seg={8} c={f.shorts} position-y={0.4} />
            <Cyl rt={0.15} rb={0.145} hgt={0.3} seg={8} c={f.top} position-y={0.6} />
          </>
        )}
        <Ball r={0.17} detail={1} c={f.skin} position-y={0.92} />
        <Ball r={0.177} detail={1} c={f.hair} position={[0, 0.98, -0.018]} scale={[1, 0.66, 1]} />
        {f.girl && (
          <>
            <Box s={[0.3, 0.26, 0.08]} c={f.hair} position={[0, 0.84, -0.12]} />
            {[-1, 1].map((x) => (
              <group key={x}>
                <Ball r={0.07} detail={0} c={f.hair} position={[x * 0.19, 0.86, -0.05]} />
                <Ball r={0.028} detail={0} c={f.dress} position={[x * 0.17, 0.93, -0.04]} shadow={false} />
              </group>
            ))}
          </>
        )}
        <Arm side={1} y={0.72} color={f.girl ? f.dress : f.top} skin={f.skin} len={0.28} armRef={(r) => (rig.armL = r)} />
        <Arm side={-1} y={0.72} color={f.girl ? f.dress : f.top} skin={f.skin} len={0.28} armRef={(r) => (rig.armR = r)} />
      </group>
    </group>
  )
}

function animateRig(rig, phase, amt) {
  const sw = Math.sin(phase) * amt
  if (rig.legL) rig.legL.rotation.x = sw * 0.55
  if (rig.legR) rig.legR.rotation.x = -sw * 0.55
  if (rig.armL) rig.armL.rotation.x = -sw * 0.45
  if (rig.armR && !rig.phone) rig.armR.rotation.x = sw * 0.45
  if (rig.body) rig.body.position.y = Math.abs(Math.cos(phase)) * 0.025 * amt
}

// Amma alone at the India house on the phone (chapter 1).
export function AmmaOnPhone() {
  const ref = useRef()
  const rig = useMemo(() => ({ phone: true }), [])
  useFrame(() => {
    const t = story.time
    ref.current.visible = story.progress < 8
    if (rig.body) rig.body.rotation.y = Math.sin(t * 0.7) * 0.12
    if (rig.armL) rig.armL.rotation.x = Math.sin(t * 1.3) * 0.25 - 0.2
  })
  return (
    <group ref={ref}>
      <Amma rig={rig} phone />
    </group>
  )
}

// ---------- the walking family (lives at the top of the planet, not on it) ----------
const MEMBERS = ORDER.map((k) => ({ k, appear: FAMILY[k].appear }))
const presentAt = (p) => MEMBERS.filter((m) => p >= m.appear).map((m) => m.k)
const growth = (k, p) => (FAMILY[k].grow ? curve(FAMILY[k].grow, p) : 1)

export function Family() {
  const refs = useRef({})
  const rigs = useMemo(() => Object.fromEntries(ORDER.map((k) => [k, {}])), [])
  const state = useMemo(() => Object.fromEntries(ORDER.map((k) => [k, { x: 0, v: 0, yaw: 0, phase: Math.random() * 6, amt: 0 }])), [])
  const lastP = useRef(0)
  const sparkle = useRef({})

  useFrame((_, dt) => {
    dt = Math.min(dt, 0.05)
    const p = story.progress
    const speed = (Math.abs(p - lastP.current) * DEG * R) / Math.max(dt, 1e-4)
    const dir = Math.sign(p - lastP.current)
    lastP.current = p
    const present = presentAt(p)
    const finale = currentSegment()?.kind === 'finale' || story.phase === 'outro' || story.phase === 'end'
    const form = formation(present, finale ? FINALE_ORDER : ORDER)
    const board = boarded(p)
    const walking = story.phase === 'walk' && speed > 0.05
    const face = story.face
    for (const k of ORDER) {
      const g = refs.current[k], st = state[k]
      if (!g) continue
      const on = present.includes(k) && !['begin', 'loading'].includes(story.phase) ? 1 : 0
      st.v += (on - st.v) * (1 - Math.exp(-dt * 5))
      const scale = st.v * (1 - board) * growth(k, p)
      g.visible = scale > 0.01
      g.scale.setScalar(Math.max(scale, 0.0001))
      // "You stood by us": everyone draws in close together.
      if (form[k] !== undefined) st.x += (form[k] * (1 - 0.3 * stoodFactor()) - st.x) * (1 - Math.exp(-dt * 3))
      g.position.set(st.x, R + 0.066, 0)
      let targetYaw = dir < 0 ? Math.PI : 0
      if (!walking && face) targetYaw = Math.atan2(-face[1] - st.x, face[0])
      let dy = targetYaw - st.yaw
      dy = Math.atan2(Math.sin(dy), Math.cos(dy))
      st.yaw += dy * (1 - Math.exp(-dt * 4))
      g.rotation.y = st.yaw
      st.amt += ((walking ? 1 : 0) - st.amt) * (1 - Math.exp(-dt * 6))
      st.phase += dt * Math.min(speed, 3) * 7.5 / Math.max(growth(k, p), 0.5)
      animateRig(rigs[k], st.phase, st.amt)
      const sp = sparkle.current[k]
      if (sp) {
        sp.position.set(st.x, R + 0.6 * growth(k, p), 0)
        sp.material.opacity = Math.sin(clamp(st.v) * Math.PI) * 0.9
        sp.visible = sp.material.opacity > 0.01 && board < 0.5
      }
    }
  })

  return (
    <group>
      {ORDER.map((k) => (
        <group key={k} ref={(r) => (refs.current[k] = r)} visible={false}>
          {k === 'nana' && <Nana rig={rigs[k]} />}
          {k === 'amma' && <Amma rig={rigs[k]} />}
          {(k === 'kid1' || k === 'kid2') && <Kid k={k} rig={rigs[k]} />}
        </group>
      ))}
      {ORDER.map((k) => (
        <Glow key={k} color="#fff0c0" size={1.8} opacity={0} spriteRef={(r) => (sparkle.current[k] = r)} />
      ))}
      <Umbrella />
    </group>
  )
}

// ---------- footprints ----------
export function Footprints() {
  const ref = useRef()
  const prints = useMemo(() => {
    const out = []
    const inSea = (a) => OCEANS.some(([x, y]) => a > x - 2.5 && a < y + 2.5)
    let foot = 0
    for (let a = 20.2; a < 359.4; a += 0.62) {
      if (inSea(a)) continue
      foot ^= 1
      const present = presentAt(a)
      const form = formation(present)
      present.forEach((k, i) => {
        const g = growth(k, a)
        const off = (foot ^ (i & 1) ? 1 : -1) * 0.065 * g
        out.push({ a: a + i * 0.11, s: -(form[k] + off), g })
      })
    }
    out.sort((x, y) => x.a - y.a)
    return out
  }, [])
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(0.05, 7)
    g.rotateX(-Math.PI / 2)
    g.scale(1, 1, 1.75)
    return g
  }, [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: '#b49a68', transparent: true, opacity: 0.55, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, toneMapped: false }), [])
  const gold = useMemo(() => new THREE.Color('#ffd98a'), [])
  const base = useMemo(() => new THREE.Color('#b49a68'), [])
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    prints.forEach((pr, i) => ref.current.setMatrixAt(i, pathMatrix(zOf(pr.a), pr.s, 0.071, 0, pr.g, 1, pr.g, m)))
    ref.current.instanceMatrix.needsUpdate = true
    ref.current.computeBoundingSphere()
  }, [])
  useFrame(() => {
    const lim = story.progress - 0.9
    let lo = 0, hi = prints.length
    while (lo < hi) { const mid = (lo + hi) >> 1; if (prints[mid].a < lim) lo = mid + 1; else hi = mid }
    ref.current.count = lo
    const glow = Math.max(story.phase === 'outro' || story.phase === 'end' ? smoothstep(0.15, 0.8, story.wide) : 0, stoodFactor())
    material.color.lerpColors(base, gold, glow)
    material.opacity = 0.55 + glow * 0.4
  })
  return <instancedMesh ref={ref} args={[geo, material, prints.length]} frustumCulled={false} />
}

// ---------- plane ----------
export function Plane() {
  const ref = useRef(), prop = useRef()
  useFrame((_, dt) => {
    const p = story.progress
    const vis = Math.max(bump(p, 27, 28.6, 73.4, 75), bump(p, 286, 287.6, 336.4, 338))
    const f = flight(p)
    ref.current.visible = vis > 0.01
    ref.current.scale.setScalar(Math.max(vis, 0.001) * 0.95)
    const back = p > 200
    ref.current.position.set(Math.sin(story.time * 0.6) * 0.15 * f, R + 0.25 + 2.3 * f + Math.sin(story.time * 1.3) * 0.06 * f, 0.9)
    const climbing = back ? (p < 312 ? 1 : -1) : (p < 51 ? 1 : -1)
    ref.current.rotation.x = -climbing * 0.12 * (f > 0.05 && f < 0.95 ? 1 : 0.15)
    ref.current.rotation.z = Math.sin(story.time * 0.6) * 0.08 * f
    if (prop.current) prop.current.rotation.z += dt * 30
  })
  return (
    <group ref={ref} visible={false}>
      <Cyl rt={0.2} rb={0.2} hgt={1.7} seg={10} c="#f7f5f0" rotation-x={Math.PI / 2} />
      <Cone r={0.2} hgt={0.4} seg={10} c="#f7f5f0" rotation-x={Math.PI / 2} position-z={1.05} />
      <Cone r={0.2} hgt={0.5} seg={10} c="#f7f5f0" rotation-x={-Math.PI / 2} position-z={-1.1} />
      <Cyl r={0.205} hgt={0.12} seg={10} c="#e6a43a" rotation-x={Math.PI / 2} position-z={0.3} />
      <Box s={[2.3, 0.04, 0.5]} c="#e9e6df" position={[0, -0.05, 0.1]} />
      <Box s={[0.9, 0.035, 0.28]} c="#e9e6df" position={[0, 0.05, -1.1]} />
      <Box s={[0.04, 0.45, 0.35]} c="#d9433f" position={[0, 0.3, -1.12]} />
      {[-0.55, 0.55].map((x) => (
        <Cyl key={x} r={0.08} hgt={0.32} seg={8} c="#c9c6c0" rotation-x={Math.PI / 2} position={[x, -0.12, 0.2]} />
      ))}
      {[-0.4, -0.2, 0, 0.2, 0.4, 0.6].map((z) => (
        <group key={z}>
          <Box s={[0.02, 0.06, 0.08]} c="#33405a" position={[0.198, 0.06, z]} shadow={false} />
          <Box s={[0.02, 0.06, 0.08]} c="#33405a" position={[-0.198, 0.06, z]} shadow={false} />
        </group>
      ))}
    </group>
  )
}

// ---------- rain and umbrella (chapter 7) ----------
const RAIN_CH = CHAPTERS.findIndex((c) => c.id === 7)
export const rainAmount = () => {
  const t = chapterTime(RAIN_CH)
  return t > 100 ? 0 : bump(t, 1.4, 2.8, 7.8, 9.4)
}

function Umbrella() {
  const ref = useRef()
  useFrame(() => {
    const r = Math.max(rainAmount(), umbrellaJoke())
    ref.current.visible = r > 0.01
    ref.current.scale.setScalar(Math.max(r, 0.001))
    ref.current.position.set(0, R + 0.066, 0.05)
    ref.current.rotation.z = Math.sin(story.time * 1.5) * 0.04
  })
  return (
    <group ref={ref} visible={false}>
      <Cyl r={0.014} hgt={1.2} seg={4} c="#3a3a3a" position-y={0.95} />
      <Cone r={0.78} hgt={0.32} seg={8} c="#d9433f" position-y={1.62} />
      <Cone r={0.8} hgt={0.05} seg={8} c="#f2c14e" position-y={1.47} />
    </group>
  )
}

export function Rain() {
  const ref = useRef(), cloud = useRef()
  const N = 420
  const drops = useMemo(() => {
    const r = rng(9)
    return Array.from({ length: N }, () => ({ x: (r() - 0.5) * 9, z: (r() - 0.2) * 8, y: r() * 4.5, sp: 5 + r() * 3 }))
  }, [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 6), 3))
    return g
  }, [])
  const material = useMemo(() => new THREE.LineBasicMaterial({ color: '#cfe3ff', transparent: true, opacity: 0 }), [])
  useFrame((_, dt) => {
    const r = rainAmount()
    material.opacity = r * 0.7
    ref.current.visible = r > 0.01
    cloud.current.visible = r > 0.01
    cloud.current.scale.setScalar(Math.max(r, 0.001))
    cloud.current.position.set(0.3, R + 4.3, 1.6)
    if (r <= 0.01) return
    const pos = geo.attributes.position
    drops.forEach((d, i) => {
      d.y -= d.sp * dt
      if (d.y < 0) d.y += 4.2
      const y = R + d.y
      pos.setXYZ(i * 2, d.x, y, d.z)
      pos.setXYZ(i * 2 + 1, d.x - 0.02, y - 0.22, d.z)
    })
    pos.needsUpdate = true
  })
  return (
    <>
      <lineSegments ref={ref} geometry={geo} material={material} frustumCulled={false} visible={false} />
      <group ref={cloud} visible={false}>
        {[[-0.9, 0, 0, 0.7], [0, 0.18, 0.1, 0.85], [0.85, 0, -0.1, 0.68], [0.35, -0.12, 0.45, 0.6], [-0.45, -0.1, -0.4, 0.6]].map(([x, y, z, s], i) => (
          <Ball key={i} r={s} detail={1} c="#a9b1c2" position={[x, y, z]} scale={[1, 0.62, 1]} shadow={false} />
        ))}
      </group>
    </>
  )
}

// The planet itself, the path, trees, clouds, sky, stars and lights.
import * as THREE from 'three'
import { useMemo, useRef, useLayoutEffect, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { R, DEG, pt, zOf, pathMatrix, terrainAt, isIndia, rng, angDist, noise3, lerp, clamp } from './geo'
import { CHAPTERS } from './config'
import { story } from './story'
import { pal, treeGrowth } from './palette'
import { glowMaterial } from './kit'
import { townKeepout } from './townLayout'

const COL = Object.fromEntries(Object.entries({
  deep: '#2a6597', shallow: '#4fa6c6', sand: '#ecd8a4', snow: '#eef3f8',
  inGrass: '#a9bd5e', inSoil: '#d08f5c', inGrass2: '#8fb054',
  usGrass: '#7dba5b', usGrass2: '#62a24c', usMeadow: '#9cc762', rock: '#a29b8c',
}).map(([k, v]) => [k, new THREE.Color(v)]))

function buildPlanet() {
  const g = new THREE.IcosahedronGeometry(1, 50)
  const pos = g.attributes.position
  const n = pos.count
  const v = new THREE.Vector3()
  const cache = new Map()
  const dirs = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) {
    v.fromBufferAttribute(pos, i).normalize()
    dirs.set([v.x, v.y, v.z], i * 3)
    const key = `${v.x.toFixed(5)},${v.y.toFixed(5)},${v.z.toFixed(5)}`
    let h = cache.get(key)
    if (h === undefined) { h = terrainAt(v.x, v.y, v.z).h; cache.set(key, h) }
    pos.setXYZ(i, v.x * (R + h), v.y * (R + h), v.z * (R + h))
  }
  const colors = new Float32Array(n * 3)
  const c = new THREE.Color()
  for (let f = 0; f < n; f += 3) {
    const cx = (dirs[f * 3] + dirs[f * 3 + 3] + dirs[f * 3 + 6]) / 3
    const cy = (dirs[f * 3 + 1] + dirs[f * 3 + 4] + dirs[f * 3 + 7]) / 3
    const cz = (dirs[f * 3 + 2] + dirs[f * 3 + 5] + dirs[f * 3 + 8]) / 3
    const L = Math.hypot(cx, cy, cz)
    const t = terrainAt(cx / L, cy / L, cz / L)
    const nz = noise3(cx * 9, cy * 9 + 2, cz * 9)
    if (t.polar > 0.5) c.copy(COL.snow)
    else if (t.d < -4) c.copy(COL.deep)
    else if (t.d < 0) c.lerpColors(COL.deep, COL.shallow, (t.d + 4) / 4)
    else if (t.d < 1.4) c.copy(COL.sand)
    else if (isIndia(t.theta)) c.lerpColors(nz > 0.68 ? COL.inSoil : COL.inGrass, COL.inGrass2, nz * 0.6)
    else c.lerpColors(COL.usGrass, nz > 0.55 ? COL.usMeadow : COL.usGrass2, nz)
    if (t.polar <= 0.5 && t.h > 0.9) c.lerp(COL.rock, clamp((t.h - 0.9) / 0.8) * 0.7)
    const j = 0.95 + 0.09 * noise3(cx * 60, cy * 60, cz * 60)
    for (let k = 0; k < 3; k++) colors.set([c.r * j, c.g * j, c.b * j], (f + k) * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  g.computeVertexNormals()
  return g
}

export function Planet() {
  const geo = useMemo(buildPlanet, [])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={0.92} />
    </mesh>
  )
}

const PATH_RANGES = [[-24, 29.4], [72.6, 287.4]]
export function PathRibbon() {
  const geo = useMemo(() => {
    const verts = [], idx = []
    const p = new THREE.Vector3()
    for (const [a0, a1] of PATH_RANGES) {
      const base = verts.length / 3
      let k = 0
      for (let a = a0; a <= a1 + 1e-6; a += 0.3, k++) {
        const w = 0.6 + 0.06 * Math.sin(a * 1.7) + 0.04 * Math.sin(a * 5.3)
        pt(zOf(a), -w, 0.066, p); verts.push(p.x, p.y, p.z)
        pt(zOf(a), w, 0.066, p); verts.push(p.x, p.y, p.z)
        if (k > 0) {
          const i = base + k * 2
          idx.push(i - 2, i - 1, i, i - 1, i + 1, i)
        }
      }
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial color="#e6cf9c" roughness={1} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  )
}

// ---------- trees, rocks, flowers ----------
function genScatter() {
  const r = rng(11)
  const trees = [], rocks = [], flowers = []
  const u = new THREE.Vector3()
  const blocked = (a, s, rad) => CHAPTERS.some((c) => angDist(a, c.angle) < 10 && Math.abs(s) < rad) || townKeepout(a, s)
  for (let k = 0; k < 4000 && trees.length < 560; k++) {
    const a = r() * 360
    const s = (r() < 0.5 ? -1 : 1) * (2.6 + Math.pow(r(), 1.25) * 17)
    pt(zOf(a), s, 0, u).normalize()
    const t = terrainAt(u.x, u.y, u.z)
    if (t.d < 2.2 || t.polar > 0.25 || blocked(a, s, 8)) continue
    const india = isIndia(a)
    const type = india ? (r() < 0.72 ? 'palm' : 'round') : r() < 0.66 ? 'round' : 'pine'
    trees.push({ a, s, h: t.h - 0.04, type, sc: 0.8 + r() * 0.55, yaw: r() * 6.28, tint: 0.82 + r() * 0.3 })
  }
  for (let k = 0; k < 1500 && rocks.length < 200; k++) {
    const a = r() * 360
    const s = (r() < 0.5 ? -1 : 1) * (1.4 + r() * 12)
    pt(zOf(a), s, 0, u).normalize()
    const t = terrainAt(u.x, u.y, u.z)
    if (t.d < 0.5 || t.polar > 0.3 || blocked(a, s, 5)) continue
    rocks.push({ a, s, h: t.h - 0.03, bush: r() < 0.55 && t.d > 1.5, sc: 0.5 + r() * 0.9, yaw: r() * 6.28, tint: 0.85 + r() * 0.3 })
  }
  const FL = ['#f4f1e6', '#f6c94c', '#e9748e', '#b98ae0', '#ff9a52'].map((c) => new THREE.Color(c))
  for (let k = 0; k < 3000 && flowers.length < 650; k++) {
    const a = r() * 360
    const s = (r() < 0.5 ? -1 : 1) * (0.85 + Math.pow(r(), 1.6) * 7)
    pt(zOf(a), s, 0, u).normalize()
    const t = terrainAt(u.x, u.y, u.z)
    if (t.d < 2 || t.polar > 0.2 || blocked(a, s, 3.6)) continue
    flowers.push({ a, s, h: t.h, color: FL[Math.floor(r() * FL.length)], sc: 0.7 + r() * 0.6 })
  }
  return { trees, rocks, flowers }
}

function palmGeometries() {
  const trunkParts = []
  for (let i = 0; i < 4; i++) {
    const c = new THREE.CylinderGeometry(0.055 - i * 0.006, 0.07 - i * 0.006, 0.42, 5)
    c.translate(i * i * 0.03, 0.21 + i * 0.4, 0)
    trunkParts.push(c)
  }
  const leaves = []
  for (let i = 0; i < 7; i++) {
    const b = new THREE.BoxGeometry(0.16, 0.02, 0.75)
    b.translate(0, 0, 0.36)
    b.rotateX(0.55)
    b.rotateY((i / 7) * Math.PI * 2)
    b.translate(0.27, 1.62, 0)
    leaves.push(b)
  }
  const nuts = new THREE.IcosahedronGeometry(0.07, 0)
  nuts.translate(0.3, 1.52, 0.06)
  return { trunk: mergeGeometries(trunkParts), leaves: mergeGeometries(leaves), nuts }
}

function roundFoliage() {
  const a = new THREE.IcosahedronGeometry(0.5, 0)
  a.translate(0, 0.95, 0)
  const b = new THREE.IcosahedronGeometry(0.34, 0)
  b.translate(0.26, 1.2, 0.1)
  const c = new THREE.IcosahedronGeometry(0.3, 0)
  c.translate(-0.22, 1.18, -0.1)
  return mergeGeometries([a, b, c])
}

function Instances({ items, geometry, material, matrix, color, shadow = true, frameUpdate }) {
  const ref = useRef()
  const m = useMemo(() => new THREE.Matrix4(), [])
  const write = (p) => {
    items.forEach((it, i) => ref.current.setMatrixAt(i, matrix(it, m, p)))
    ref.current.instanceMatrix.needsUpdate = true
  }
  useLayoutEffect(() => {
    write(story.progress)
    if (color) {
      const c = new THREE.Color()
      items.forEach((it, i) => ref.current.setColorAt(i, color(it, c)))
      ref.current.instanceColor.needsUpdate = true
    }
    ref.current.computeBoundingSphere()
  }, [])
  const last = useRef(-1)
  useFrame(() => {
    if (!frameUpdate) return
    if (Math.abs(story.progress - last.current) > 0.4) {
      last.current = story.progress
      write(story.progress)
    }
  })
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={shadow} receiveShadow frustumCulled={false} />
}

export function Scatter() {
  const { trees, rocks, flowers } = useMemo(genScatter, [])
  const geos = useMemo(() => {
    const palm = palmGeometries()
    const trunk = new THREE.CylinderGeometry(0.06, 0.09, 0.75, 5)
    trunk.translate(0, 0.37, 0)
    const pine = new THREE.ConeGeometry(0.42, 1.15, 6)
    pine.translate(0, 1.05, 0)
    const pine2 = new THREE.ConeGeometry(0.32, 0.8, 6)
    pine2.translate(0, 1.55, 0)
    const rock = new THREE.DodecahedronGeometry(0.2, 0)
    rock.translate(0, 0.06, 0)
    const bush = new THREE.IcosahedronGeometry(0.24, 0)
    bush.translate(0, 0.12, 0)
    const flower = new THREE.IcosahedronGeometry(0.045, 0)
    flower.translate(0, 0.08, 0)
    return { palm, trunk, round: roundFoliage(), pine: mergeGeometries([pine, pine2]), rock, bush, flower }
  }, [])
  const mats = useMemo(() => ({
    trunk: new THREE.MeshStandardMaterial({ color: '#7b5537', flatShading: true, roughness: 0.9 }),
    palmTrunk: new THREE.MeshStandardMaterial({ color: '#9a7350', flatShading: true, roughness: 0.9 }),
    palmLeaf: new THREE.MeshStandardMaterial({ color: '#5d9c3c', flatShading: true, roughness: 0.85 }),
    nut: new THREE.MeshStandardMaterial({ color: '#6b4a2a', flatShading: true }),
    round: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.85 }),
    pine: new THREE.MeshStandardMaterial({ color: '#3f7d4b', flatShading: true, roughness: 0.85 }),
    rock: new THREE.MeshStandardMaterial({ color: '#aaa394', flatShading: true }),
    bush: new THREE.MeshStandardMaterial({ color: '#5f9e48', flatShading: true }),
    flower: new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 0.6 }),
  }), [])

  useFrame(() => mats.round.color.copy(pal.foliage))

  const by = (t) => trees.filter((x) => x.type === t)
  const palms = useMemo(() => by('palm'), [])
  const rounds = useMemo(() => by('round'), [])
  const pines = useMemo(() => by('pine'), [])
  const usTrees = useMemo(() => [...rounds, ...pines], [])
  const treeM = (it, m, p) => pathMatrix(zOf(it.a), it.s, it.h, it.yaw, it.sc * treeGrowth(p), it.sc * treeGrowth(p), it.sc * treeGrowth(p), m)
  const plainM = (it, m) => pathMatrix(zOf(it.a), it.s, it.h, it.yaw || 0, it.sc, it.sc, it.sc, m)
  const tint = (it, c) => c.setScalar(it.tint)
  const bushes = useMemo(() => rocks.filter((r) => r.bush), [])
  const stones = useMemo(() => rocks.filter((r) => !r.bush), [])

  return (
    <group>
      <Instances items={palms} geometry={geos.palm.trunk} material={mats.palmTrunk} matrix={treeM} frameUpdate />
      <Instances items={palms} geometry={geos.palm.leaves} material={mats.palmLeaf} matrix={treeM} color={tint} frameUpdate />
      <Instances items={palms} geometry={geos.palm.nuts} material={mats.nut} matrix={treeM} frameUpdate shadow={false} />
      <Instances items={usTrees} geometry={geos.trunk} material={mats.trunk} matrix={treeM} frameUpdate />
      <Instances items={rounds} geometry={geos.round} material={mats.round} matrix={treeM} color={tint} frameUpdate />
      <Instances items={pines} geometry={geos.pine} material={mats.pine} matrix={treeM} color={tint} frameUpdate />
      <Instances items={stones} geometry={geos.rock} material={mats.rock} matrix={plainM} color={tint} />
      <Instances items={bushes} geometry={geos.bush} material={mats.bush} matrix={plainM} color={tint} />
      <Instances items={flowers} geometry={geos.flower} material={mats.flower} matrix={plainM} color={(it, c) => c.copy(it.color)} shadow={false} />
    </group>
  )
}

// ---------- clouds ----------
export function Clouds() {
  const ref = useRef()
  const items = useMemo(() => {
    const r = rng(5), out = []
    for (let i = 0; i < 46; i++) {
      const a = r() * 360
      const overSea = (a > 32 && a < 70) || (a > 290 && a < 334)
      const s = (r() < 0.5 ? -1 : 1) * (overSea ? 2 + r() * 20 : 5 + r() * 20)
      const h = overSea && Math.abs(s) < 5 ? 6.2 + r() * 2.5 : 4.5 + r() * 4
      const n = 3 + Math.floor(r() * 3)
      for (let k = 0; k < n; k++)
        out.push({ a, s, h, ox: (k - n / 2) * 0.55 + r() * 0.2, oy: r() * 0.25, oz: (r() - 0.5) * 0.4, sc: 0.45 + r() * 0.4 })
    }
    return out
  }, [])
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', flatShading: true, roughness: 1, emissive: '#ffffff', emissiveIntensity: 0.18, transparent: true, opacity: 0.95 }), [])
  const matrix = (it, m) => {
    pathMatrix(zOf(it.a), it.s, it.h, 0, 1, 1, 1, m)
    return m.multiply(new THREE.Matrix4().compose(new THREE.Vector3(it.ox, it.oy, it.oz), new THREE.Quaternion(), new THREE.Vector3(it.sc, it.sc * 0.7, it.sc)))
  }
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.x += dt * 0.0035 })
  return (
    <group ref={ref}>
      <Instances items={items} geometry={geo} material={material} matrix={matrix} shadow={false} />
    </group>
  )
}

// ---------- sky ----------
export function Sky() {
  const material = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, toneMapped: false,
    uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 bot; varying vec3 vDir;
      void main(){ float h = clamp(vDir.y * 1.25 + 0.2, 0.0, 1.0); vec3 c = mix(bot, top, pow(h, 0.75)); gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
  }), [])
  useFrame(() => {
    material.uniforms.top.value.copy(pal.top)
    material.uniforms.bot.value.copy(pal.bot)
  })
  return (
    <mesh material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[700, 32, 16]} />
    </mesh>
  )
}

export function Stars() {
  const ref = useRef()
  const geo = useMemo(() => {
    const r = rng(3), p = []
    for (let i = 0; i < 1800; i++) {
      const u = r() * 2 - 1, th = r() * Math.PI * 2
      const y = Math.abs(u) * 0.95 + 0.05, q = Math.sqrt(1 - y * y)
      p.push(q * Math.cos(th) * 600, (r() < 0.85 ? y : -y * 0.5) * 600, q * Math.sin(th) * 600)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    return g
  }, [])
  const material = useMemo(() => new THREE.PointsMaterial({ color: '#fff6e0', size: 1.8, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }), [])
  useFrame(() => {
    material.opacity = clamp(pal.night * 1.1)
    if (ref.current) ref.current.visible = material.opacity > 0.01
  })
  return <points ref={ref} geometry={geo} material={material} renderOrder={-9} frustumCulled={false} />
}

// ---------- lights ----------
export function Lights() {
  const sun = useRef(), hemi = useRef()
  const { scene } = useThree()
  const target = useMemo(() => new THREE.Object3D(), [])
  const sunGlow = useMemo(() => {
    const s = new THREE.Sprite(glowMaterial('#ffe6b0', 0.9))
    s.scale.setScalar(140)
    s.renderOrder = -8
    return s
  }, [])
  useEffect(() => {
    target.position.set(0, R, 2)
    scene.add(target)
    scene.add(sunGlow)
    sun.current.target = target
    return () => { scene.remove(target); scene.remove(sunGlow) }
  }, [])
  useFrame(() => {
    const L = sun.current
    L.position.copy(pal.dir).multiplyScalar(40).add(target.position)
    L.color.copy(pal.sun)
    L.intensity = pal.si
    hemi.current.color.copy(pal.hs)
    hemi.current.groundColor.copy(pal.hg)
    hemi.current.intensity = pal.hi
    sunGlow.position.copy(pal.dir).multiplyScalar(560)
    sunGlow.material.color.copy(pal.sun)
  })
  return (
    <>
      <hemisphereLight ref={hemi} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
    </>
  )
}

// Draws the extra world pieces laid out in town.js. Every static building is merged into three meshes
// (walls/roofs, windows, lamps) so hundreds of them cost only a few draw calls. Windows and lamps
// glow at night. Wind turbine blades turn and boats bob on the water.
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { pathMatrix, zOf } from './geo'
import { SITES, BOATS, ground } from './townLayout'
import { story } from './story'
import { pal } from './palette'
import { Box, Cyl, Gable } from './kit'

const prep = (g) => {
  const n = g.index ? g.toNonIndexed() : g
  n.deleteAttribute('uv')
  return n
}
const cache = {}
const P = {
  box: () => (cache.box ??= prep(new THREE.BoxGeometry(1, 1, 1))),
  cyl: (seg) => (cache['c' + seg] ??= prep(new THREE.CylinderGeometry(1, 1, 1, seg))),
  cone: (seg) => (cache['k' + seg] ??= prep(new THREE.ConeGeometry(1, 1, seg))),
  ball: () => (cache.ball ??= prep(new THREE.IcosahedronGeometry(1, 0))),
  gable: () => {
    if (cache.gable) return cache.gable
    const sh = new THREE.Shape()
    sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 1); sh.closePath()
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false })
    g.translate(0, 0, -0.5)
    return (cache.gable = prep(g))
  },
}

function makeBuilder() {
  const parts = { body: [], glass: [], light: [] }
  const base = new THREE.Matrix4(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler()
  const v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color()
  function add(cat, geo, pos, size, color, rot) {
    const g = geo.clone()
    m.compose(v.set(...pos), q.setFromEuler(e.set(...(rot ?? [0, 0, 0]))), sc.set(...size)).premultiply(base)
    g.applyMatrix4(m)
    col.set(color)
    const n = g.attributes.position.count, arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) arr.set([col.r, col.g, col.b], i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3))
    parts[cat].push(g)
  }
  return {
    parts,
    at: (site) => pathMatrix(zOf(site.a), site.s, site.h, site.yaw ?? 0, 1, 1, 1, base),
    box: (pos, size, c, cat = 'body', rot) => add(cat, P.box(), pos, size, c, rot),
    cyl: (pos, r, h, c, seg = 8, cat = 'body', rot) => add(cat, P.cyl(seg), pos, [r, h, r], c, rot),
    cone: (pos, r, h, c, seg = 8, cat = 'body', rot) => add(cat, P.cone(seg), pos, [r, h, r], c, rot),
    ball: (pos, size, c, cat = 'body') => add(cat, P.ball(), pos, Array.isArray(size) ? size : [size, size, size], c),
    gable: (pos, w, d, h, c, rotY = 0) => add('body', P.gable(), pos, [w, h, d], c, [0, rotY, 0]),
  }
}

const GLASS = '#9fc4e0'
const foundation = (B, s, w, d) => B.box([0, -s.drop / 2 + 0.02, 0], [w, s.drop + 0.04, d], '#b5aa98')

const BUILD = {
  house(B, s) {
    const H = s.two ? 1.25 : 0.78
    foundation(B, s, 1.36, 1.06)
    B.box([0, H / 2, 0], [1.3, H, 1.0], s.wall)
    B.box([0, H + 0.02, 0], [1.38, 0.05, 1.08], '#f6f3ea')
    B.gable([0, H + 0.04, 0], 1.46, 1.16, 0.55, s.roof)
    B.box([0.28, 0.21, 0.505], [0.22, 0.4, 0.02], '#8a4a3a')
    B.box([0.28, 0.03, 0.62], [0.36, 0.06, 0.22], '#d8cdb8')
    const rows = s.two ? [0.45, 0.95] : [0.45]
    for (const y of rows) {
      B.box([-0.3, y, 0.505], [0.3, 0.24, 0.02], GLASS, 'glass')
      B.box([0.655, y, 0], [0.02, 0.24, 0.3], GLASS, 'glass')
      B.box([-0.655, y, 0], [0.02, 0.24, 0.3], GLASS, 'glass')
    }
    if (s.two) B.box([0.28, 0.95, 0.505], [0.3, 0.24, 0.02], GLASS, 'glass')
    if (s.chimney) B.box([0.35, H + 0.42, -0.2], [0.14, 0.5, 0.14], '#a8574a')
  },
  indiaHouse(B, s) {
    const H = 0.75
    foundation(B, s, 1.16, 0.96)
    B.box([0, H / 2, 0], [1.1, H, 0.9], s.wall)
    B.box([0, H + 0.005, 0], [1.12, 0.03, 0.92], '#d9c9a8')
    B.box([0, H + 0.06, 0.43], [1.12, 0.1, 0.04], s.trim)
    B.box([0, H + 0.06, -0.43], [1.12, 0.1, 0.04], s.trim)
    B.box([0.54, H + 0.06, 0], [0.04, 0.1, 0.9], s.trim)
    B.box([-0.54, H + 0.06, 0], [0.04, 0.1, 0.9], s.trim)
    B.box([0.25, 0.25, 0.455], [0.24, 0.48, 0.02], '#7a3b22')
    B.box([-0.25, 0.42, 0.452], [0.34, 0.3, 0.015], s.trim)
    B.box([-0.25, 0.42, 0.462], [0.24, 0.2, 0.02], '#39445a', 'glass')
    if (s.upper) {
      B.box([-0.18, H + 0.3, -0.1], [0.6, 0.58, 0.55], s.trim)
      B.box([-0.18, H + 0.32, 0.18], [0.22, 0.18, 0.02], '#39445a', 'glass')
      B.box([-0.18, H + 0.6, -0.1], [0.64, 0.04, 0.59], '#d9c9a8')
    }
    if (s.tank) B.cyl([0.3, H + 0.18, -0.2], 0.13, 0.28, '#2f3a33', 10)
  },
  gopuram(B, s) {
    foundation(B, s, 2.3, 1.7)
    B.box([0, 0.35, 0], [2.2, 0.7, 1.6], '#e8d5a8')
    const cols = ['#e9417a', '#f6c94c', '#3b8fd9', '#5aa84b', '#f28a2e', '#b98ae0']
    for (let k = 0; k < 6; k++) {
      const y = 0.7 + k * 0.36
      B.box([0, y + 0.18, 0], [1.6 - k * 0.22, 0.36, 1.0 - k * 0.12], cols[k])
      B.box([0, y + 0.36, 0], [1.66 - k * 0.22, 0.04, 1.06 - k * 0.12], '#f4e4c6')
    }
    B.cyl([0, 3.02, 0], 0.18, 0.62, '#d9433f', 8, 'body', [0, 0, Math.PI / 2])
    for (const x of [-0.2, 0, 0.2]) {
      B.ball([x, 3.22, 0], 0.06, '#f2c14e')
      B.cone([x, 3.32, 0], 0.04, 0.12, '#f2c14e', 6)
    }
    B.box([0, 0.3, 0.805], [0.45, 0.6, 0.02], '#4a2a1a')
    B.box([0, 0.64, 0.81], [0.6, 0.08, 0.03], '#c8643c')
    B.box([0.8, 0.95, 0.81], [0.2, 0.2, 0.02], '#ffd36b', 'light')
    B.box([-0.8, 0.95, 0.81], [0.2, 0.2, 0.02], '#ffd36b', 'light')
  },
  church(B, s) {
    foundation(B, s, 1.0, 1.6)
    B.box([0, 0.4, 0], [0.9, 0.8, 1.5], '#f4f1e8')
    B.gable([0, 0.82, 0], 1.0, 1.6, 0.55, '#6e5a6e')
    B.box([0, 1.0, 0.62], [0.36, 1.2, 0.36], '#f4f1e8')
    B.cone([0, 1.97, 0.62], 0.27, 0.75, '#6e5a6e', 4, 'body', [0, Math.PI / 4, 0])
    B.box([0, 2.45, 0.62], [0.03, 0.2, 0.03], '#d8c070')
    B.box([0, 2.48, 0.62], [0.12, 0.03, 0.03], '#d8c070')
    for (const z of [-0.45, 0.05]) {
      B.box([0.455, 0.45, z], [0.02, 0.32, 0.16], '#c9a0dc', 'glass')
      B.box([-0.455, 0.45, z], [0.02, 0.32, 0.16], '#c9a0dc', 'glass')
    }
    B.box([0, 0.28, 0.805], [0.22, 0.44, 0.02], '#7a4a3a')
  },
  barn(B, s) {
    foundation(B, s, 1.45, 1.05)
    B.box([0, 0.45, 0], [1.4, 0.9, 1.0], '#b23a32')
    B.gable([0, 0.9, 0], 1.5, 1.1, 0.6, '#5a4a42')
    B.box([0, 0.32, 0.505], [0.55, 0.6, 0.02], '#8e2c26')
    B.box([0, 0.32, 0.518], [0.7, 0.04, 0.01], '#f4f1e8', 'body', [0, 0, 0.83])
    B.box([0, 0.32, 0.518], [0.7, 0.04, 0.01], '#f4f1e8', 'body', [0, 0, -0.83])
    B.box([0, 0.63, 0.518], [0.6, 0.04, 0.01], '#f4f1e8')
    B.box([0, 1.12, 0.505], [0.22, 0.2, 0.02], '#f4f1e8')
  },
  silo(B) {
    B.cyl([0, 0.85, 0], 0.32, 1.7, '#c9c6c0', 10)
    B.ball([0, 1.72, 0], [0.33, 0.2, 0.33], '#8e8b85')
    for (const y of [0.6, 1.2]) B.cyl([0, y, 0], 0.325, 0.05, '#8e8b85', 10)
  },
  waterTower(B) {
    for (const [x, z] of [[0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3]]) B.cyl([x, 0.75, z], 0.035, 1.5, '#7a8590', 5)
    B.cyl([0, 1.75, 0], 0.55, 0.6, '#a9c2d6', 12)
    B.cyl([0, 1.75, 0], 0.56, 0.08, '#f6f3ea', 12)
    B.cone([0, 2.2, 0], 0.58, 0.3, '#7f95a8', 12)
  },
  lighthouse(B, s) {
    foundation(B, s, 0.8, 0.8)
    B.box([0.45, 0.25, 0], [0.5, 0.5, 0.6], '#f4f1e8')
    B.gable([0.45, 0.5, 0], 0.6, 0.7, 0.3, '#d9433f')
    for (let k = 0; k < 5; k++) B.cyl([0, 0.24 + k * 0.48, 0], 0.33 - k * 0.025, 0.48, k % 2 ? '#d9433f' : '#f6f3ea', 10)
    B.cyl([0, 2.45, 0], 0.32, 0.06, '#3a3f4e', 10)
    B.cyl([0, 2.65, 0], 0.18, 0.34, '#fff1b0', 8, 'light')
    B.cone([0, 2.95, 0], 0.24, 0.28, '#d9433f', 8)
    B.ball([0, 3.12, 0], 0.04, '#3a3f4e')
  },
  tower(B, s) {
    const { w, d, tall, color } = s
    foundation(B, s, w + 0.06, d + 0.06)
    B.box([0, tall / 2, 0], [w, tall, d], color)
    for (let y = 0.32; y < tall - 0.2; y += 0.3) B.box([0, y, 0], [w + 0.02, 0.11, d + 0.02], '#4f6f90', 'glass')
    B.box([0, tall + 0.05, 0], [w * 0.92, 0.1, d * 0.92], '#6b7380')
    if (tall > 3.2) {
      B.box([0, tall + 0.35, 0], [w * 0.55, 0.5, d * 0.55], color)
      B.cyl([0, tall + 0.95, 0], 0.02, 0.7, '#cfd4da', 5)
    }
  },
  lamp(B) {
    B.cyl([0, 0.5, 0], 0.022, 1.0, '#3a3f4e', 6)
    B.box([0, 0.98, 0.12], [0.03, 0.03, 0.26], '#3a3f4e')
    B.box([0, 0.95, 0.25], [0.09, 0.05, 0.12], '#3a3f4e')
    B.box([0, 0.92, 0.25], [0.07, 0.02, 0.09], '#fff1c4', 'light')
  },
  mailbox(B, s) {
    B.box([0, 0.17, 0], [0.035, 0.34, 0.035], '#7b5537')
    B.box([0, 0.38, 0], [0.09, 0.09, 0.17], s.color)
    B.box([0.05, 0.42, -0.03], [0.01, 0.08, 0.03], '#d9433f')
  },
  car(B, s) {
    B.box([0, 0.14, 0], [0.4, 0.14, 0.82], s.color)
    B.box([0, 0.27, -0.04], [0.36, 0.13, 0.44], s.color)
    B.box([0, 0.27, -0.04], [0.37, 0.09, 0.45], '#33405a', 'glass')
    for (const [x, z] of [[0.2, 0.26], [-0.2, 0.26], [0.2, -0.26], [-0.2, -0.26]]) B.cyl([x, 0.07, z], 0.07, 0.06, '#222222', 8, 'body', [0, 0, Math.PI / 2])
  },
  turbine(B) {
    B.cyl([0, 1.3, 0], 0.05, 2.6, '#f4f4f2', 6)
    B.box([0, 2.62, -0.05], [0.12, 0.12, 0.3], '#f4f4f2')
  },
}

function Turbine({ site }) {
  const rotor = useRef()
  const matrix = useMemo(() => pathMatrix(zOf(site.a), site.s, site.h, site.yaw), [])
  useFrame((_, dt) => (rotor.current.rotation.z += dt * 1.6))
  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      <group ref={rotor} position={[0, 2.62, 0.12]}>
        {[0, 1, 2].map((k) => (
          <group key={k} rotation-z={(k / 3) * Math.PI * 2}>
            <Box s={[0.06, 0.95, 0.015]} c="#f4f4f2" position-y={0.48} shadow={false} />
          </group>
        ))}
      </group>
    </group>
  )
}

function Boat({ b }) {
  const bob = useRef()
  const matrix = useMemo(() => pathMatrix(zOf(b.a), b.s, ground(b.a, b.s).h - 0.02, b.yaw), [])
  useFrame(() => {
    const t = story.time + b.ph
    bob.current.position.y = Math.sin(t * 1.3) * 0.03
    bob.current.rotation.z = Math.sin(t * 0.9) * 0.06
    bob.current.rotation.x = Math.sin(t * 0.7) * 0.03
  })
  return (
    <group matrix={matrix} matrixAutoUpdate={false}>
      <group ref={bob}>
        {b.ship ? (
          <>
            <Box s={[0.55, 0.3, 2.0]} c="#c23b3b" position-y={0.12} />
            <Box s={[0.56, 0.04, 2.01]} c="#3a3f4e" position-y={0.29} />
            {[-0.45, 0, 0.45].flatMap((z, i) => [-0.12, 0.12].map((x, j) => (
              <Box key={`${i}${j}`} s={[0.22, 0.2, 0.42]} c={['#3b6fb0', '#f2b822', '#5aa84b', '#e07a2e', '#8a96a8', '#d9433f'][i * 2 + j]} position={[x, 0.41, z + 0.15]} />
            )))}
            <Box s={[0.5, 0.42, 0.35]} c="#f4f4f2" position={[0, 0.52, -0.75]} />
            <Cyl r={0.07} hgt={0.3} seg={8} c="#3a3f4e" position={[0, 0.85, -0.82]} />
          </>
        ) : (
          <>
            <Box s={[0.3, 0.12, 0.8]} c="#fbfaf5" position-y={0.04} />
            <Box s={[0.31, 0.03, 0.81]} c="#3b6fb0" position-y={0.09} />
            <Cyl r={0.012} hgt={0.95} seg={4} c="#8a6a4a" position-y={0.55} />
            <Gable w={0.42} d={0.015} hgt={0.72} c={b.sail} position-y={0.16} rotation-y={Math.PI / 2} />
          </>
        )}
      </group>
    </group>
  )
}

export function Town() {
  const geos = useMemo(() => {
    const B = makeBuilder()
    for (const s of SITES) {
      B.at(s)
      BUILD[s.kind]?.(B, s)
    }
    const merged = {}
    for (const [k, list] of Object.entries(B.parts)) merged[k] = list.length ? mergeGeometries(list) : null
    return merged
  }, [])
  const mats = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 }),
    glass: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.35, emissive: '#ffc773', emissiveIntensity: 0 }),
    light: new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, emissive: '#ffd27a', emissiveIntensity: 0.3 }),
  }), [])
  useFrame(() => {
    mats.glass.emissiveIntensity = pal.night * 1.2
    mats.light.emissiveIntensity = 0.3 + pal.night * 2.4
  })
  const turbines = useMemo(() => SITES.filter((s) => s.kind === 'turbine'), [])
  return (
    <group>
      {geos.body && <mesh geometry={geos.body} material={mats.body} castShadow receiveShadow />}
      {geos.glass && <mesh geometry={geos.glass} material={mats.glass} />}
      {geos.light && <mesh geometry={geos.light} material={mats.light} />}
      {turbines.map((s, i) => <Turbine key={i} site={s} />)}
      {BOATS.map((b, i) => <Boat key={i} b={b} />)}
    </group>
  )
}

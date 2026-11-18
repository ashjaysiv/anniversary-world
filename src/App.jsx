import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Planet, PathRibbon, Scatter, Clouds, Sky, Stars, Lights } from './World'
import { Family, Footprints, Plane, Rain } from './Characters'
import { PhotoSets } from './Photos'
import { Town } from './Town'
import { Scenes } from './scenes'
import { CameraRig, useKeys } from './CameraRig'
import { story, currentSegment } from './story'
import { CHAPTERS } from './config'
import { Captions } from './Captions'
import { currentCue } from './audio'

function Scene() {
  const planet = useRef()
  return (
    <>
      <Sky />
      <Stars />
      <Lights />
      <group ref={planet}>
        <Planet />
        <PathRibbon />
        <Scatter />
        <Town />
        <Clouds />
        <Footprints />
        <Scenes />
        <PhotoSets />
      </group>
      <Family />
      <Plane />
      <Rain />
      <CameraRig planet={planet} />
    </>
  )
}

// Only shown with ?debug in the URL.
function Hud() {
  const [, setN] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setN((n) => n + 1), 200)
    return () => clearInterval(t)
  }, [])
  const seg = currentSegment()
  const ch = CHAPTERS[story.idx]
  const v = seg?.v !== undefined ? ` v${seg.v + 1}` : ''
  return (
    <div id="hud">
      {`${story.phase}${story.paused ? ' (paused)' : ''}  ch${ch.id} ${ch.name}\n`}
      {`progress ${story.progress.toFixed(1)}°  hold ${story.holdT.toFixed(1)}s  ${seg ? seg.kind + (seg.i !== undefined ? ' ' + (seg.i + 1) : '') + v : ''}
`}
      {`music ${currentCue()}`}
    </div>
  )
}

export default function App() {
  useKeys()
  const debug = new URLSearchParams(location.search).has('debug')
  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 50, near: 0.1, far: 2000, position: [0, 60, 90] }}
        gl={{ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: debug }}
      >
        <Scene />
      </Canvas>
      <Captions />
      {debug && <Hud />}
    </>
  )
}

// Drives the story clock each frame, turns the planet, and moves the camera.
import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { DEG, lerp, pt, bump } from './geo'
import { CHAPTERS, DEFAULT_VIEW, WALK_VIEW, FLIGHT_VIEW, FINALE_VIEW, APPROACH_VIEW } from './config'
import { story, tick, flight, currentSegment, verseInfo, next, prev, togglePause, restart, start, jumpTo } from './story'
import { VERSES } from './narration'
import { pal, updatePalette } from './palette'
import { photoFocus } from './Photos'
import { ensureAudio, updateMusic } from './audio'

const V = () => new THREE.Vector3()

function poseOf(view, outPos, outLook) {
  pt(...view.pos, outPos)
  pt(...view.look, outLook)
}

function slerpPos(a, b, t, out) {
  const ra = a.length(), rb = b.length()
  const ua = a.clone().divideScalar(ra), ub = b.clone().divideScalar(rb)
  const dot = THREE.MathUtils.clamp(ua.dot(ub), -1, 1)
  const om = Math.acos(dot)
  if (om < 1e-4) return out.copy(a).lerp(b, t)
  const s = Math.sin(om)
  out.copy(ua).multiplyScalar(Math.sin((1 - t) * om) / s).addScaledVector(ub, Math.sin(t * om) / s)
  return out.multiplyScalar(lerp(ra, rb, t))
}

export function useKeys() {
  useEffect(() => {
    const onKey = (e) => {
      const k = e.key
      if (story.phase !== 'loading') ensureAudio() // sound can only start from a key press
      if (k === 'f' || k === 'F') {
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen?.().catch(() => {})
        return
      }
      if (story.phase === 'loading') return
      if (story.phase === 'begin') { e.preventDefault(); return start() }
      if (k === ' ' || k === 'Enter') { e.preventDefault(); return story.phase === 'end' ? restart() : togglePause() }
      if (k === 'p' || k === 'P') return togglePause()
      if (k === 'ArrowRight' || k === 'PageDown' || k === 'ArrowDown') { e.preventDefault(); story.paused = false; return next() }
      if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowUp') { e.preventDefault(); story.paused = false; return prev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export function CameraRig({ planet }) {
  const { camera, scene, gl } = useThree()
  const s = useMemo(() => ({
    pos: V(), look: V(), tPos: V(), tLook: V(), aPos: V(), aLook: V(), bPos: V(), bLook: V(),
    wPos: V(), wLook: V(), outPos: V(), outLook: V(), up: new THREE.Vector3(0, 1, 0), tUp: V(), init: false,
  }), [])
  useMemo(() => { scene.fog = new THREE.Fog('#ffffff', 16, 62) }, [scene])

  const speed = parseFloat(new URLSearchParams(location.search).get('speed')) || 1 // debug fast-forward
  useFrame((_, raw) => {
    const dt = Math.min(raw, 0.05) * speed
    if (story.phase === 'loading') {
      story.phase = 'begin'
      // Upload every photo to the GPU now, on the begin screen, so nothing stutters mid-show.
      Object.values(story.textures).forEach((t) => gl.initTexture(t))
      const q = new URLSearchParams(location.search)
      const ch = parseInt(q.get('ch'), 10)
      if (ch >= 1 && ch <= CHAPTERS.length) {
        jumpTo(ch - 1)
        story.holdT = parseFloat(q.get('t')) || 0
      }
      // ?p=deg freezes the walk at a spot on the path (for checking scenery)
      if (q.has('opening')) start()
      const p = parseFloat(q.get('p'))
      if (!Number.isNaN(p)) {
        jumpTo(0)
        Object.assign(story, { phase: 'walk', progress: p, from: p, to: p, moveDur: 1e9, paused: true })
      }
    }
    tick(dt)
    // The 'not easy' verse darkens the evening into deep night for its whole length.
    const ne = verseInfo(VERSES.findIndex((v) => v.key === 'noteasy'))
    const dimTarget = ne.t >= 0 ? bump(ne.t, 0.2, 2.5, ne.dur - 1.5, ne.dur + 0.5) : 0
    story.dim += (dimTarget - story.dim) * (1 - Math.exp(-dt * 3))
    updateMusic()
    updatePalette(story.progress, Math.max(story.wide * story.wideNight, story.dim * 0.8))
    if (planet.current) planet.current.rotation.x = -story.progress * DEG

    // where the close-up camera wants to be
    let k = 1.8
    s.tUp.set(0, 1, 0)
    const ch = CHAPTERS[story.idx]
    const seg = currentSegment()
    if (story.phase === 'walk') {
      poseOf(WALK_VIEW, s.aPos, s.aLook)
      poseOf(FLIGHT_VIEW, s.bPos, s.bLook)
      const f = flight(story.progress)
      s.tPos.lerpVectors(s.aPos, s.bPos, f)
      s.tLook.lerpVectors(s.aLook, s.bLook, f)
      k = story.fast ? 3 : 1.6
      story.face = null
    } else {
      const view = seg?.kind === 'finale' ? FINALE_VIEW : seg?.approach ? APPROACH_VIEW : seg?.kind === 'verse' ? VERSES[seg.v].view : ch.view ?? DEFAULT_VIEW
      poseOf(view, s.tPos, s.tLook)
      story.face = view.pos
      if (seg?.kind === 'photo') {
        // In the spiral a caption sits under each photo, so frame the photo a little smaller and higher.
        if (photoFocus(story.idx, seg.i, camera.aspect, camera.fov, s.aPos, s.aLook, ch.layout === 'helix')) {
          s.tPos.copy(s.aPos)
          s.tLook.copy(s.aLook)
          s.tUp.copy(s.aLook).normalize() // photos stand upright on the curved ground
        }
        k = (ch.photoSec ?? 4.4) < 3.5 ? 2.8 : 1.5 // quick slideshows settle faster
      }
      if (seg?.kind === 'finale') k = 0.7
      if (seg?.kind === 'verse') k = 1.7
    }
    if (!s.init) { s.pos.copy(s.tPos); s.look.copy(s.tLook); s.init = true }
    const a = 1 - Math.exp(-dt * k)
    s.pos.lerp(s.tPos, a)
    s.look.lerp(s.tLook, a)
    s.up.lerp(s.tUp, a).normalize()

    // the wide orbit used on the begin screen and at the end
    const ang = story.time * 0.045 + 0.6
    s.wPos.set(Math.sin(ang) * 80, 52, Math.cos(ang) * 80)
    s.wLook.set(0, 5, 0)

    const w = story.wide
    slerpPos(s.pos, s.wPos, w, s.outPos)
    s.outLook.lerpVectors(s.look, s.wLook, w)
    camera.position.copy(s.outPos)
    camera.up.copy(s.up).lerp(s.wPos.clone().set(0, 1, 0), w).normalize()
    camera.lookAt(s.outLook)

    scene.fog.color.copy(pal.bot)
    scene.fog.near = lerp(16, 80, w)
    scene.fog.far = lerp(62, 200, w)
  })
  return null
}

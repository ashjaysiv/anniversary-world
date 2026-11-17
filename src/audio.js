// Optional background music: drop a file at public/audio/music.mp3 and it loops under the walk.
// If the file is missing, everything still works silently.
let music = null
let fade = null

export function startMusic() {
  if (music) return
  music = new Audio('audio/music.mp3')
  music.loop = true
  music.volume = 0
  music.addEventListener('error', () => (music = null))
  music.play().then(() => fadeMusic(0.55, 4)).catch(() => (music = null))
}

export function fadeMusic(to, seconds) {
  if (!music) return
  clearInterval(fade)
  const from = music.volume, steps = Math.max(1, Math.round(seconds * 20))
  let i = 0
  fade = setInterval(() => {
    if (!music) return clearInterval(fade)
    i++
    music.volume = Math.min(1, Math.max(0, from + (to - from) * (i / steps)))
    if (i >= steps) clearInterval(fade)
  }, 50)
}

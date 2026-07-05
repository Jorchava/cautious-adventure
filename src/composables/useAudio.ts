import { ref } from 'vue'
import type { SoundKey } from '@/types/game.types'

// Module-level singleton — shared across all useAudio() calls
let soundLib: typeof import('@pixi/sound') | null = null
const loadedKeys = new Set<SoundKey>()
const isMuted = ref(false)

const SOUND_PATHS: Record<SoundKey, string> = {
  reel_spin: '/audio/reel_spin.ogg',
  reel_stop: '/audio/reel_stop.ogg',
  win_small: '/audio/win_small.ogg',
  win_medium: '/audio/win_medium.ogg',
  win_big: '/audio/win_big.ogg',
  free_spins_trigger: '/audio/free_spins_trigger.ogg',
  button_click: '/audio/button_click.ogg',
  autoplay_stop: '/audio/autoplay_stop.ogg',
}

async function loadSoundLib(): Promise<void> {
  if (soundLib) return  // Idempotent — never double-import
  try {
    soundLib = await import('@pixi/sound')
  } catch { /* @pixi/sound unavailable — silent */ }
}

export async function preload(): Promise<void> {
  await loadSoundLib()
  if (!soundLib) return

  for (const [key, path] of Object.entries(SOUND_PATHS) as [SoundKey, string][]) {
    // Skip keys already registered — makes preload() idempotent
    if (loadedKeys.has(key)) continue

    try {
      // Check Content-Type, not just status code.
      // Vite dev server returns index.html (200, text/html) for missing assets.
      // We need an actual audio file, so reject anything that isn't audio.
      const exists = await fetch(path, { method: 'HEAD' })
        .then(r => {
          const type = r.headers.get('content-type') ?? ''
          return r.ok && (type.includes('audio') || type.includes('octet-stream'))
        })
        .catch(() => false)

      if (!exists) continue  // skip if file absent/wrong type

      soundLib.sound.add(key, { url: path, preload: true })
      loadedKeys.add(key)
    } catch { /* individual file failed — skip it */ }
  }
}

export function play(key: SoundKey): void {
  if (isMuted.value || !soundLib) return
  if (!loadedKeys.has(key)) return  // Not loaded — skip silently
  try { soundLib.sound.play(key) } catch { /* silent */ }
}

export function stop(key: SoundKey): void {
  if (!soundLib || !loadedKeys.has(key)) return
  try { soundLib.sound.stop(key) } catch { /* silent */ }
}

export function setMuted(muted: boolean): void {
  isMuted.value = muted
  if (muted && soundLib) {
    loadedKeys.forEach(key => {
      try { soundLib!.sound.stop(key) } catch { /* silent */ }
    })
  }
}

export function useAudio() {
  return { play, stop, setMuted, isMuted, preload }
}

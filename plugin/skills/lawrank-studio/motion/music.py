"""Music beds under the narration: written here, note by note, so there is nothing to license.

  bed(mood, seconds, sr) -> mono float32, peak about 1.0 (mix.py sets the level and ducks it under the voice)

Moods: warm (soft piano over a pad, 76 bpm), hopeful (brighter, light pulse, 92 bpm), steady (muted plucks and a soft
kick, 100 bpm), serious (minor, slow, low strings). A firm's own licensed track can replace them: put
<mood>.mp3 (or .wav / .m4a) in the "LawRank Studio/Music" folder on the Drive and mix.py uses that instead."""
import numpy as np

MOODS = {
    #           bpm  key  chords (scale degrees as semitone offsets of each chord's root, minor flag)   parts
    'warm':    (76, 50, [(0, 0), (7, 0), (9, 1), (5, 0)], ('pad', 'piano', 'bass')),            # D: I V vi IV
    'hopeful': (92, 55, [(5, 0), (0, 0), (7, 0), (9, 1)], ('pad', 'piano', 'bass', 'shaker', 'kick')),  # G: IV I V vi
    'steady':  (100, 53, [(9, 1), (5, 0), (0, 0), (7, 0)], ('pad', 'pluck', 'bass', 'kick', 'shaker')),  # F: vi IV I V
    'serious': (70, 45, [(0, 1), (8, 0), (3, 0), (10, 0)], ('strings', 'bell', 'bass')),        # A minor: i VI III VII
}
LOOK_MOOD = {'thread': 'warm', 'flat': 'hopeful', 'cards': 'steady', 'silhouette': 'serious'}


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)


def _env(n, sr, a=.005, decay=3.0):
    t = np.arange(n) / sr; e = np.exp(-t * decay); k = max(1, int(a * sr)); e[:k] *= np.linspace(0, 1, k); return e


def _tone(f, d, sr, parts, decay=3.0, a=.005):
    n = int(d * sr); t = np.arange(n) / sr; x = np.zeros(n)
    for k, amp in enumerate(parts, 1):
        x += amp * np.sin(2 * np.pi * f * k * t * (1 + .0007 * (k - 1) ** 2)) * np.exp(-t * decay * (1 + .45 * (k - 1)))
    return x * _env(n, sr, a, 0)


def _reverb(x, sr, length=2.2, wet=.28, seed=3):
    rng = np.random.default_rng(seed); n = int(length * sr); t = np.arange(n) / sr
    ir = rng.standard_normal(n) * np.exp(-t * 3.2); ir[:int(.012 * sr)] = 0
    ir = np.cumsum(ir) - np.convolve(np.cumsum(ir), np.ones(8) / 8, 'same')        # soften the hiss: a crude low-pass
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    N = 1 << int(np.ceil(np.log2(len(x) + n))); y = np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(ir, N), N)[:len(x)]
    return x * (1 - wet) + y * wet * 2.2


def _chord(root, minor):
    return [root, root + (3 if minor else 4), root + 7]


def bed(mood: str, seconds: float, sr: int = 24000, seed: int = 7) -> np.ndarray:
    bpm, key, prog, parts = MOODS.get(mood, MOODS['warm'])
    beat = 60 / bpm; bar = 4 * beat; N = int(sr * (seconds + 2.5)); out = np.zeros(N)
    rng = np.random.default_rng(seed)
    def put(x, at, g=1.0):
        i = int(at * sr)
        if i >= N: return
        x = x[:N - i]; out[i:i + len(x)] += x * g
    nbars = int(np.ceil(seconds / bar)) + 1
    for b in range(nbars):
        r, mn = prog[b % len(prog)]
        if b == nbars - 1: r, mn = prog[0] if mood != 'serious' else (0, 1)  # land home under the end card
        notes = _chord(key + r, mn); t0 = b * bar
        if 'pad' in parts or 'strings' in parts:
            d = bar + .6; n = int(d * sr); t = np.arange(n) / sr
            sw = np.minimum(1, t / .5) * np.minimum(1, (d - t) / .6)
            for m in notes:
                f = hz(m + 12); x = sum(np.sin(2 * np.pi * f * (1 + dt) * t + p) for dt, p in ((-.003, 0), (0, 1.3), (.004, 2.1)))
                x += .25 * np.sin(2 * np.pi * 2 * f * t)
                if 'strings' in parts: x *= .8 + .2 * np.sin(2 * np.pi * 5.2 * t)
                put(x * sw, t0, .05 if 'pad' in parts else .065)
        if 'bass' in parts:
            put(_tone(hz(key + r - 12), bar, sr, (1, .35, .1), decay=.9, a=.02), t0, .22)
            if mood in ('hopeful', 'steady'): put(_tone(hz(key + r - 12), beat * 2, sr, (1, .3), decay=1.5, a=.02), t0 + 2.5 * beat, .14)
        if 'piano' in parts:                        # broken chord in eighths: root, fifth, octave, third ...
            pat = [notes[0], notes[2], notes[0] + 12, notes[1] + 12, notes[2], notes[0] + 12, notes[1] + 12, notes[2] + 12]
            for i, m in enumerate(pat):
                v = .11 * (1.0 if i % 4 == 0 else .72) * (.9 + .2 * rng.random())
                put(_tone(hz(m + 12), 1.6, sr, (1, .42, .16, .08, .04), decay=2.6), t0 + i * beat / 2 + rng.normal(0, .004), v)
        if 'pluck' in parts:
            for i in range(8):
                m = notes[(0, 2, 1, 2)[i % 4]] + 12
                put(_tone(hz(m + 12), .5, sr, (1, .5, .25, .12), decay=9), t0 + i * beat / 2, .1 if i % 2 == 0 else .07)
        if 'bell' in parts:
            for i, m in enumerate((notes[2] + 12, notes[1] + 12)):
                put(_tone(hz(m + 12), 2.4, sr, (1, 0, .3, 0, .12), decay=1.4), t0 + i * 2 * beat + .02, .07)
        if 'kick' in parts:
            for i in range(4):
                n = int(.35 * sr); t = np.arange(n) / sr; f = 45 + 75 * np.exp(-t * 28)
                put(np.sin(2 * np.pi * np.cumsum(f) / sr) * np.exp(-t * 9), t0 + i * beat, .2 if i % 2 == 0 else .12)
        if 'shaker' in parts:
            for i in range(8):
                n = int(.08 * sr); z = np.diff(rng.standard_normal(n + 1)); z *= np.exp(-np.arange(n) / sr * 55)
                put(z, t0 + i * beat / 2 + beat / 4, .025 if i % 2 else .015)
    out = _reverb(out, sr)[:int(sr * seconds)]
    fade_in, fade_out = int(.6 * sr), int(min(2.2, seconds / 4) * sr)
    out[:fade_in] *= np.linspace(0, 1, fade_in); out[-fade_out:] *= np.linspace(1, 0, fade_out) ** 1.5
    return (out / (np.abs(out).max() + 1e-9)).astype(np.float32)


def duck(voice: np.ndarray, sr: int, depth=.6) -> np.ndarray:
    """A gain curve that dips the music while someone speaks (fast down, slow back up)."""
    win = int(.03 * sr); e = np.sqrt(np.convolve(voice ** 2, np.ones(win) / win, 'same'))
    on = (e > .02).astype(np.float32); hop = int(.01 * sr); s = on[::hop]; g = np.zeros_like(s); cur = 0.0
    for i, x in enumerate(s):                       # attack 60 ms, release 450 ms, on 10 ms steps
        cur += (x - cur) * (.17 if x > cur else .022); g[i] = cur
    g = np.repeat(g, hop)[:len(voice)]
    if len(g) < len(voice): g = np.pad(g, (0, len(voice) - len(g)), 'edge')
    return 1 - depth * g

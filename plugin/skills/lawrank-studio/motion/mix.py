"""Soundtrack for a motion piece: narration + the family's sound plan (a few quiet, synthesized effects) + a music
bed that dips under the voice. No stock audio: effects and music are generated here, so there is nothing to license,
unless the firm puts its own licensed track in "LawRank Studio/Music" (see music.py)."""
import json, base64, os, subprocess, numpy as np, soundfile as sf
from pathlib import Path
import music as M

def mood_for(sb: dict) -> str:
    """The storyboard's "music" (warm, hopeful, steady, serious or none), else one that suits its look."""
    if os.environ.get('LR_MUSIC') == 'off': return 'none'
    return sb.get('music') or M.LOOK_MOOD.get(sb.get('look'), 'warm')

def own_track(mood: str, seconds: float, sr: int):
    """The firm's licensed track for this mood, if they added one: trimmed to length, faded out."""
    d = Path(os.environ.get('LR_MUSIC_DIR', ''))
    f = next((x for x in sorted(d.glob(f'{mood}*')) if x.suffix.lower() in ('.mp3', '.wav', '.m4a', '.aac')), None) if d.name else None
    if not f: return None
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(f), '-t', f'{seconds:.2f}', '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True)
    if r.returncode or not r.stdout: return None
    x = np.frombuffer(r.stdout, np.float32).copy(); x = np.pad(x, (0, max(0, int(sr * seconds) - len(x))))
    k = int(min(2.2, seconds / 4) * sr); x[-k:] *= np.linspace(1, 0, k) ** 1.5; k0 = int(.3 * sr); x[:k0] *= np.linspace(0, 1, k0)
    return x / (np.abs(x).max() + 1e-9)

def mix(vo_dir: Path, plan: dict, out: Path):
    T = json.load(open(vo_dir / 'timing.json')); sr = T['sr']; end = plan['end']
    N = int(sr * (end + .3)); m = np.zeros(N, np.float32); rng = np.random.default_rng(5); t = lambda d: np.arange(int(sr * d)) / sr
    def put(x, at):
        i = max(0, int(at * sr)); x = x[:max(0, N - i)]; m[i:i + len(x)] += x
    def env(d, r=4.):
        n = int(sr * d); e = np.exp(-np.linspace(0, r, n)); a = max(1, int(.006 * sr)); e[:a] *= np.linspace(0, 1, a); return e
    def lp(x, a):
        y = np.empty_like(x); s = 0.
        for i, v in enumerate(x): s += a * (v - s); y[i] = s
        return y
    for l in T['lines']:
        a, _ = sf.read(vo_dir / f"{l['id']}.wav", dtype='float32'); put(a / (np.abs(a).max() + 1e-9) * .85, l['t'])
    voice = m.copy()
    def noise_sweep(g, d=.45):
        n = lp(rng.standard_normal(int(sr * d)).astype(np.float32), .08); w = np.sin(np.linspace(0, np.pi, len(n))) ** 2; return n / np.abs(n).max() * w * g
    tone = lambda f, d, g, r=6: (np.sin(2 * np.pi * f * t(d)) * env(d, r)).astype(np.float32) * g
    FX = {
        'whoosh': lambda: noise_sweep(.07), 'soft': lambda: noise_sweep(.04),
        'pop': lambda: tone(880, .09, .05), 'chime': lambda: tone(880, .12, .035) + tone(1320, .12, .018, 8),
        'thud': lambda: tone(75, .22, .32, 7), 'clink': lambda: tone(1320, .18, .05, 5) + tone(1980, .18, .025, 7),
        'impact': lambda: tone(70, .22, .35, 7) + (lp(rng.standard_normal(int(sr * .3)).astype(np.float32), .25) * env(.3, 6) * .22)[:int(sr * .22)],
        'buzz': lambda: (np.sign(np.sin(2 * np.pi * 150 * t(.22))) * (.5 + .5 * np.sin(2 * np.pi * 24 * t(.22))) * env(.22, 2)).astype(np.float32) * .035,
        'crackle': lambda: (lambda z: z / np.abs(z).max() * .06)(lp(rng.standard_normal(int(sr * .35)).astype(np.float32), .5) * env(.35, 5)),
        'rumble': lambda: (lambda z: z / np.abs(z).max() * np.sin(np.linspace(0, np.pi, len(z))) * .12)(lp(rng.standard_normal(int(sr * 1.6)).astype(np.float32), .01)),
    }
    beds = []
    for s in plan['sfx']:
        if s['kind'] == 'rain': beds.append(s); continue
        x = FX[s['kind']](); put(x.astype(np.float32), s['at'] - (.05 if s['kind'] in ('whoosh', 'soft') else 0))
    for b in beds:                       # a rain bed between 'at' and 'until'
        z = lp(rng.standard_normal(N).astype(np.float32), .35); z -= lp(z, .02); z *= .05 / (np.abs(z).max() + 1e-9)
        f = np.zeros(N, np.float32); a0, a1, b0 = int(sr * b['at']), int(sr * (b['at'] + 1.2)), int(sr * b['until'])
        f[a0:a1] = np.linspace(0, 1, a1 - a0); f[a1:b0] = 1; k = min(int(sr * 1.5), N - b0); f[b0:b0 + k] = np.linspace(1, 0, k); m += z * f
    sbf = vo_dir / 'storyboard.json'; mood = mood_for(json.load(open(sbf)) if sbf.exists() else {})
    if mood == 'none':
        # a quiet warm pad so the gaps between passages never feel empty
        pad = sum(np.sin(2 * np.pi * f * np.arange(N) / sr) for f in (110, 164.8, 220)).astype(np.float32) * (.5 + .5 * np.sin(2 * np.pi * .07 * np.arange(N) / sr)).astype(np.float32)
        fade = np.minimum(1, np.arange(N) / (sr * 1.5)) * np.minimum(1, (N - np.arange(N)) / (sr * 2.0)); m += pad / np.abs(pad).max() * .012 * fade.astype(np.float32)
    else:
        bed = own_track(mood, N / sr, sr)
        bed = M.bed(mood, N / sr, sr) if bed is None else bed
        m += (bed[:N] * M.duck(voice, sr) * .16).astype(np.float32)
    # loud enough for a phone speaker (speech near -17 dBFS), with a soft limiter instead of hard clipping
    talk = np.abs(voice) > .02
    if talk.any():
        m *= min(3.0, 10 ** ((-17 - 20 * np.log10(np.sqrt(np.mean(m[talk] ** 2)) + 1e-9)) / 20))
    over = np.abs(m) > .8; m[over] = np.sign(m[over]) * (.8 + .18 * np.tanh((np.abs(m[over]) - .8) / .18))
    wav = out.with_suffix('.wav'); sf.write(wav, m, sr)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '128k', str(out)], check=True); wav.unlink()
    return 'data:audio/mpeg;base64,' + base64.b64encode(out.read_bytes()).decode()

"""Passage-based narration (v2): Kokoro reads complete sentences and short passages in one go, using its own
sentence/clause pausing, so delivery stays connected. Sync points come from the audio itself:
sentence starts are taken from the real pauses in the waveform, words inside a sentence are placed by
their phoneme length. Each line's tail is checked so no word is clipped."""
import json, os, re, sys, numpy as np, soundfile as sf
from pathlib import Path
from kokoro_onnx import Kokoro
# the studio passes its model folder (~/.lawrank-studio/models/kokoro) in LR_KOKORO_DIR
MODEL = Path(os.environ.get('LR_KOKORO_DIR', Path(__file__).resolve().parent.parent / '.models' / 'kokoro'))

def load(): return Kokoro(str(MODEL / 'kokoro-v1.0.fp16.onnx'), str(MODEL / 'voices-v1.0.bin'))

def trim(a, sr):
    loud = np.where(np.abs(a) > .008)[0]; a = a[max(0, loud[0] - int(.03 * sr)): min(len(a), loud[-1] + int(.16 * sr))].copy()
    f = int(.012 * sr); a[-f:] *= np.linspace(1, 0, f); return a

def silences(a, sr, min_len=.17, thr=.012):
    win = int(sr * .01); rms = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, 'same')); q = rms < thr; out, s = [], None
    for i in range(0, len(a), win):
        if q[i] and s is None: s = i
        if not q[i] and s is not None:
            if (i - s) / sr >= min_len: out.append(((s / sr), (i / sr)))
            s = None
    return out

def word_times(k, text, a, sr):
    sents = [s.strip() for s in re.findall(r'[^.?!]+[.?!]*', text) if s.strip()]
    need = len(sents) - 1
    for ml in (.17, .12, .08, .05):
        gaps = silences(a, sr, min_len=ml)
        if len(gaps) >= need: break
    # pick the len(sents)-1 longest internal pauses as sentence boundaries, in order
    inner = sorted(sorted(gaps, key=lambda g: g[1] - g[0], reverse=True)[:max(0, len(sents) - 1)])
    starts = [0.0] + [g[1] for g in inner]; ends = [g[0] for g in inner] + [len(a) / sr]
    out_s, out_w = [], []
    for s, t0, t1 in zip(sents, starts, ends):
        out_s.append({'text': s, 't': round(t0, 3), 'end': round(t1, 3)})
        ws = s.split(); weights = [max(1, len(k.tokenizer.phonemize(re.sub(r'[^\w\']', '', w) or w))) + (3 if w[-1] in ',;:—' else 0) for w in ws]
        tot, acc = sum(weights), 0
        for w, wt in zip(ws, weights): out_w.append({'w': w, 't': round(t0 + (t1 - t0) * acc / tot, 3)}); acc += wt
    return out_s, out_w

def run(script_path, out_dir):
    S = json.load(open(script_path)); k = load(); out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    T, t = {'voice': S['voice'], 'lines': []}, 0.0
    for L in S['lines']:
        kw = dict(voice=S['voice'], speed=L.get('speed', S.get('speed', 1.0)), lang='en-us', sentence_pause=S.get('sentence_pause', .3), clause_pause=S.get('clause_pause', .12))
        if S.get('exact_sentences') or L.get('exact_sentences'):
            # read each sentence on its own and join them with the same natural pause: exact sync points
            parts, pieces, off = [s.strip() for s in re.findall(r'[^.?!]+[.?!]*', L['say']) if s.strip()], [], 0.0
            sr = 24000; sents, words = [], []
            for j, ptxt in enumerate(parts):
                b, sr = k.create(ptxt, **kw); b = trim(np.asarray(b, np.float32), sr)
                s1, w1 = word_times(k, ptxt, b, sr)
                sents.append({'text': ptxt, 't': round(off, 3), 'end': round(off + len(b) / sr, 3)}); words += [{'w': x['w'], 't': round(x['t'] + off, 3)} for x in w1]
                pieces.append(b); off += len(b) / sr
                if j < len(parts) - 1: gap = np.zeros(int(sr * S.get('sentence_pause', .3) * 1.4), np.float32); pieces.append(gap); off += len(gap) / sr
            a = np.concatenate(pieces); t += L.get('gap', .3)
        else:
            a, sr = k.create(L['say'], **kw)
            a = trim(np.asarray(a, np.float32), sr); t += L.get('gap', .3)
            sents, words = word_times(k, L['say'], a, sr)
        for x in sents: x['t'] = round(x['t'] + t, 3); x['end'] = round(x['end'] + t, 3)
        for x in words: x['t'] = round(x['t'] + t, 3)
        tail = float(np.sqrt(np.mean(a[-int(.03 * sr):] ** 2)))
        sf.write(out / f"{L['id']}.wav", a, sr)
        T['lines'].append({'id': L['id'], 'text': L['say'], 't': round(t, 3), 'd': round(len(a) / sr, 3), 'end': round(t + len(a) / sr, 3), 'sentences': sents, 'words': words, 'tail_ok': tail < .01})
        t += len(a) / sr
    T['sr'] = sr; T['end'] = round(t, 3); T['clipped'] = [l['id'] for l in T['lines'] if not l['tail_ok']]
    json.dump(T, open(out / 'timing.json', 'w'), indent=1); return T

if __name__ == '__main__':
    T = run(sys.argv[1], sys.argv[2])
    for l in T['lines']:
        print(f"{l['t']:6.2f}–{l['end']:6.2f} {l['id']}"); [print(f"        {s['t']:6.2f} {s['text']}") for s in l['sentences']]
    print('end', T['end'], 'clipped', T['clipped'] or 'none')

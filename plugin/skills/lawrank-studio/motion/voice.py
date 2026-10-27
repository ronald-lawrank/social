"""Narration for a motion piece, from one of several voices, always into the same timing.json.

Voices (script["provider"]):
  elevenlabs  the most natural read; the service returns the time of every character, so sync is exact (needs a key)
  openai      natural and cheap; word times come from OpenAI's transcription of the audio (needs a key)
  chatterbox  free and private, runs on this laptop (`lr setup` installs it, about 3 GB); sentences are
              read one at a time so their start times are exact, words inside are placed by syllable length
  kokoro      the built-in voice: small, fast, always there. Every other voice falls back to it, line by line
              cannot mix voices, so a failure re-reads the whole piece with Kokoro and says why in timing.json

Kokoro reads complete sentences and short passages in one go, using its own sentence/clause pausing, so delivery
stays connected. Sync points come from the audio itself: sentence starts are taken from the real pauses in the
waveform, words inside a sentence are placed by their phoneme length. Each line's tail is checked so no word is
clipped."""
import base64, difflib, json, os, re, subprocess, sys, tempfile, urllib.error, urllib.request, uuid
import numpy as np, soundfile as sf
from pathlib import Path
# the studio passes its model folder (~/.lawrank-studio/models/kokoro) in LR_KOKORO_DIR
MODEL = Path(os.environ.get('LR_KOKORO_DIR', Path(__file__).resolve().parent.parent / '.models' / 'kokoro'))
SR = 24000
SENT = r'[^.?!]+[.?!]*'

# one persona per storyboard "voice" name; each provider has its closest match
PERSONAS = {
    'af_heart':   {'gender': 'female', 'accent': 'american', 'elevenlabs': 'EXAVITQu4vr4xnSDxMaL', 'openai': 'coral'},    # Sarah
    'af_bella':   {'gender': 'female', 'accent': 'american', 'elevenlabs': 'cgSgspJ2msm6clMCkdW9', 'openai': 'nova'},     # Jessica
    'af_nicole':  {'gender': 'female', 'accent': 'american', 'elevenlabs': 'XrExE9yKIg1WjnnlVkGX', 'openai': 'shimmer'},  # Matilda
    'am_michael': {'gender': 'male', 'accent': 'american', 'elevenlabs': 'nPczCjzI2devNBz1zQrb', 'openai': 'ash'},        # Brian
    'am_fenrir':  {'gender': 'male', 'accent': 'american', 'elevenlabs': 'pqHfZKP75CvOlQylNhV4', 'openai': 'onyx'},       # Bill
    'am_puck':    {'gender': 'male', 'accent': 'american', 'elevenlabs': 'TX3LPaxmHKxFdv7VPQFz', 'openai': 'verse'},      # Liam
    'bf_emma':    {'gender': 'female', 'accent': 'british', 'elevenlabs': 'Xb7hH8MSUJpSbSDYk0k2', 'openai': 'fable'},     # Alice
}
STYLE = ("Warm, calm and trustworthy, like a local attorney talking to a neighbour. Natural pace, clear words, "
         "no announcer voice, no drama.")


class VoiceError(Exception):
    pass


# ---------- shared ----------

def load(): from kokoro_onnx import Kokoro; return Kokoro(str(MODEL / 'kokoro-v1.0.fp16.onnx'), str(MODEL / 'voices-v1.0.bin'))

def create_args(k, **kw):
    """Only the arguments this kokoro-onnx accepts: sentence_pause/clause_pause exist in some builds and not in
    released ones (0.4.x takes text, voice, speed, lang, is_phonemes, trim), so they're dropped when unsupported."""
    import inspect
    try:
        params = inspect.signature(k.create).parameters
    except (TypeError, ValueError):
        return kw
    if any(p.kind == p.VAR_KEYWORD for p in params.values()):
        return kw
    return {n: v for n, v in kw.items() if n in params}

def trim(a, sr, with_offset=False):
    loud = np.where(np.abs(a) > .008)[0]
    if not len(loud): return (a, 0.0) if with_offset else a
    s0 = max(0, loud[0] - int(.03 * sr)); a = a[s0: min(len(a), loud[-1] + int(.16 * sr))].copy()
    f = int(.012 * sr); a[-f:] *= np.linspace(1, 0, f); return (a, s0 / sr) if with_offset else a

def resample(a, sr):
    if sr == SR: return a
    n = int(round(len(a) * SR / sr)); return np.interp(np.linspace(0, len(a) - 1, n), np.arange(len(a)), a).astype(np.float32)

def silences(a, sr, min_len=.17, thr=.012):
    win = int(sr * .01); rms = np.sqrt(np.convolve(a ** 2, np.ones(win) / win, 'same')); q = rms < thr; out, s = [], None
    for i in range(0, len(a), win):
        if q[i] and s is None: s = i
        if not q[i] and s is not None:
            if (i - s) / sr >= min_len: out.append(((s / sr), (i / sr)))
            s = None
    return out

def syllables(w):
    w = re.sub(r"[^a-z']", '', w.lower()) or w
    if re.fullmatch(r"[\d,.$%]+", w): return 3
    return max(1, len(re.findall(r'[aeiouy]+', w)) - (1 if w.endswith('e') and len(w) > 3 else 0))

def word_times(k, text, a, sr):
    """Sentence starts from the longest pauses in the audio; words inside by phoneme (Kokoro) or syllable length."""
    sents = [s.strip() for s in re.findall(SENT, text) if s.strip()]
    need = len(sents) - 1; gaps = []
    for ml in (.17, .12, .08, .05):
        gaps = silences(a, sr, min_len=ml)
        if len(gaps) >= need: break
    # pick the len(sents)-1 longest internal pauses as sentence boundaries, in order
    inner = sorted(sorted(gaps, key=lambda g: g[1] - g[0], reverse=True)[:max(0, len(sents) - 1)])
    starts = [0.0] + [g[1] for g in inner]; ends = [g[0] for g in inner] + [len(a) / sr]
    out_s, out_w = [], []
    weight = (lambda w: len(k.tokenizer.phonemize(re.sub(r'[^\w\']', '', w) or w))) if k is not None else (lambda w: 3 * syllables(w))
    for s, t0, t1 in zip(sents, starts, ends):
        out_s.append({'text': s, 't': round(t0, 3), 'end': round(t1, 3)})
        ws = s.split(); weights = [max(1, weight(w)) + (3 if w[-1] in ',;:—' else 0) for w in ws]
        tot, acc = sum(weights), 0
        for w, wt in zip(ws, weights): out_w.append({'w': w, 't': round(t0 + (t1 - t0) * acc / tot, 3)}); acc += wt
    return out_s, out_w

def sentences_from_words(text, words, length):
    """Sentence spans when every word already has a time (ElevenLabs, OpenAI)."""
    sents, out, i = [s.strip() for s in re.findall(SENT, text) if s.strip()], [], 0
    for s in sents:
        n = len(s.split()); ws = words[i:i + n]; i += n
        out.append({'text': s, 't': ws[0]['t'] if ws else (out[-1]['end'] if out else 0.0)})
    for j, s in enumerate(out): s['end'] = out[j + 1]['t'] if j + 1 < len(out) else round(length, 3)
    return out

def match_words(text, heard, length):
    """Put the script's words on the times of the words a transcriber heard (numbers and names may be heard
    differently: unmatched words are spread between their matched neighbours)."""
    norm = lambda w: re.sub(r"[^a-z0-9]", '', w.lower())
    mine = text.split(); A = [norm(w) for w in mine]; B = [norm(h['w']) for h in heard]
    t = [None] * len(mine)
    for blk in difflib.SequenceMatcher(None, A, B, autojunk=False).get_matching_blocks():
        for k in range(blk.size): t[blk.a + k] = heard[blk.b + k]['t']
    known = [(i, x) for i, x in enumerate(t) if x is not None] or [(0, 0.0)]
    if known[0][0] != 0: known.insert(0, (0, 0.0)); t[0] = 0.0
    if known[-1][0] != len(mine) - 1: known.append((len(mine) - 1, max(known[-1][1], length - .35)))
    for (i0, a), (i1, b) in zip(known, known[1:]):
        for i in range(i0 + 1, i1): t[i] = a + (b - a) * (i - i0) / (i1 - i0)
        t[i1] = b
    return [{'w': w, 't': round(float(x), 3)} for w, x in zip(mine, t)]

def _http(url, data=None, headers=None, timeout=120, raw=False):
    req = urllib.request.Request(url, data=data, headers=headers or {}, method='POST' if data is not None else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
    except urllib.error.HTTPError as e:
        msg = e.read().decode('utf-8', 'replace')[:300]
        raise VoiceError(f'{url.split("/")[2]} said {e.code}: {msg}')
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        raise VoiceError(f'could not reach {url.split("/")[2]}: {e}')
    return body if raw else json.loads(body)


# ---------- providers: each reads one line and returns (audio float32 at SR, words or None) ----------

class KokoroVoice:
    name, exact_words = 'kokoro', False
    def __init__(self, S): self.k = load(); self.S = S
    def read(self, text, L):
        S = self.S
        kw = create_args(self.k, voice=S['voice'], speed=L.get('speed', S.get('speed', 1.0)), lang='en-gb' if S['voice'].startswith('b') else 'en-us',
                         sentence_pause=S.get('sentence_pause', .3), clause_pause=S.get('clause_pause', .12))
        a, sr = self.k.create(text, **kw)
        return resample(np.asarray(a, np.float32), sr)
    def weights(self): return self.k


class ChatterboxVoice:
    """Runs in its own Python (torch); one worker process reads every sentence of the piece, so the model loads once.
    Chatterbox copies the voice of a short sample. In order: the firm's own sample ("LawRank Studio/Voices/<voice>.wav"
    on the Drive, passed in LR_VOICES_DIR), else Chatterbox's own voice for the warm-female persona, else a sample of
    the persona that Kokoro reads once and keeps (so "deeper male" stays male)."""
    name, exact_words = 'chatterbox', False
    REF_TEXT = ("Thanks for calling. Tell me what happened, and we'll go through your options together, one step at a time. "
                "There's no pressure, and no cost to talk.")
    def __init__(self, S):
        self.S = S; py = os.environ.get('LR_CHATTERBOX_PY')
        if not py or not Path(py).exists():
            raise VoiceError('Chatterbox is not installed on this laptop (lr voice install chatterbox)')
        self.py, self.cache = py, {}
    def reference(self):
        v = self.S['voice']
        if self.S.get('reference'): return self.S['reference']
        own = Path(os.environ.get('LR_VOICES_DIR', '') or '/nonexistent')
        mine = next((f for f in sorted(own.glob(f'{v}.*')) if f.suffix.lower() in ('.wav', '.mp3', '.m4a', '.flac')), None)
        if mine: return str(mine)
        if v == 'af_heart': return None
        ref = MODEL.parent / 'chatterbox-voices' / f'{v}.wav'
        if not ref.exists():
            try:
                k = load(); a, sr = k.create(self.REF_TEXT, **create_args(k, voice=v, speed=1.0, lang='en-gb' if v.startswith('b') else 'en-us'))
                ref.parent.mkdir(parents=True, exist_ok=True); sf.write(ref, trim(np.asarray(a, np.float32), sr), sr)
            except Exception:
                return None                  # no Kokoro model: Chatterbox's own voice
        return str(ref)
    def prefetch(self, texts):
        work = Path(tempfile.mkdtemp(prefix='lr-cb-'))
        job = {'texts': texts, 'out': str(work), 'model': os.environ.get('LR_CHATTERBOX_MODEL', 'standard'), 'exaggeration': self.S.get('exaggeration', .45), 'cfg_weight': self.S.get('cfg_weight', .5),
               'reference': self.reference()}
        (work / 'job.json').write_text(json.dumps(job))
        r = subprocess.run([self.py, str(Path(__file__).with_name('chatterbox_worker.py')), str(work / 'job.json')],
                           capture_output=True, text=True, timeout=60 * 30)
        if r.returncode: raise VoiceError('Chatterbox failed: ' + r.stderr.strip()[-300:])
        for i, t in enumerate(texts):
            a, sr = sf.read(work / f'{i}.wav', dtype='float32'); self.cache[t] = resample(a, sr)
    def read(self, text, L):
        if text not in self.cache: self.prefetch([text])
        return self.cache[text]
    def weights(self): return None


class ElevenLabsVoice:
    name, exact_words = 'elevenlabs', True
    def __init__(self, S):
        self.key = os.environ.get('ELEVENLABS_API_KEY')
        if not self.key: raise VoiceError('no ElevenLabs key on this laptop (lr voice key elevenlabs <key>)')
        self.S = S; p = PERSONAS.get(S['voice'], PERSONAS['af_heart'])
        self.voice_id = S.get('voice_id') or os.environ.get('LR_ELEVENLABS_VOICE') or p['elevenlabs']; self.persona = p
        self.model = os.environ.get('LR_ELEVENLABS_MODEL', 'eleven_multilingual_v2'); self.prev = ''
    def _pick_voice(self):
        """The voice we asked for is gone from this account: choose the closest one the account has."""
        vs = _http('https://api.elevenlabs.io/v1/voices', headers={'xi-api-key': self.key}).get('voices', [])
        def score(v):
            lb = {k: str(x).lower() for k, x in (v.get('labels') or {}).items()}
            return (lb.get('gender') == self.persona['gender']) * 2 + (self.persona['accent'] in lb.get('accent', '')) + ('narrat' in lb.get('use_case', '') or 'narrat' in lb.get('use case', ''))
        if not vs: raise VoiceError('this ElevenLabs account has no voices')
        return max(vs, key=score)['voice_id']
    def read(self, text, L, retry=True):
        body = {'text': text, 'model_id': self.model, 'previous_text': self.prev or None,
                'voice_settings': {'stability': .5, 'similarity_boost': .75, 'style': .15, 'use_speaker_boost': True,
                                   'speed': max(.7, min(1.2, L.get('speed', self.S.get('speed', 1.0))))}}
        try:
            r = _http(f'https://api.elevenlabs.io/v1/text-to-speech/{self.voice_id}/with-timestamps?output_format=pcm_24000',
                      json.dumps(body).encode(), {'xi-api-key': self.key, 'Content-Type': 'application/json'})
        except VoiceError as e:
            if retry and ('voice_not_found' in str(e) or ' 404' in str(e)):
                self.voice_id = self._pick_voice(); return self.read(text, L, False)
            raise
        a = np.frombuffer(base64.b64decode(r['audio_base64']), '<i2').astype(np.float32) / 32768
        al = r.get('alignment') or r.get('normalized_alignment') or {}
        chars, starts = al.get('characters', []), al.get('character_start_times_seconds', [])
        heard, cur, t0 = [], '', None
        for ch, st in zip(chars, starts):
            if ch.isspace():
                if cur: heard.append({'w': cur, 't': t0}); cur = ''
            else:
                if not cur: t0 = st
                cur += ch
        if cur: heard.append({'w': cur, 't': t0})
        self.prev = (self.prev + ' ' + text)[-500:]
        return a, heard
    def weights(self): return None


class OpenAIVoice:
    name, exact_words = 'openai', True
    def __init__(self, S):
        self.key = os.environ.get('OPENAI_API_KEY')
        if not self.key: raise VoiceError('no OpenAI key on this laptop (lr voice key openai <key>)')
        self.S = S; self.voice = S.get('voice_id') or os.environ.get('LR_OPENAI_VOICE') or PERSONAS.get(S['voice'], PERSONAS['af_heart'])['openai']
        self.model = os.environ.get('LR_OPENAI_TTS_MODEL', 'gpt-4o-mini-tts')
        self.hdr = {'Authorization': f'Bearer {self.key}'}
    def read(self, text, L):
        body = {'model': self.model, 'voice': self.voice, 'input': text, 'response_format': 'pcm', 'instructions': self.S.get('style') or STYLE,
                'speed': max(.8, min(1.25, L.get('speed', self.S.get('speed', 1.0))))}
        pcm = _http('https://api.openai.com/v1/audio/speech', json.dumps(body).encode(), dict(self.hdr, **{'Content-Type': 'application/json'}), raw=True)
        a = np.frombuffer(pcm, '<i2').astype(np.float32) / 32768
        return a, self.hear(a)
    def hear(self, a):
        """Word times from a transcription of the audio we just made."""
        wav = Path(tempfile.mkstemp(suffix='.wav')[1]); sf.write(wav, a, SR)
        b = '----lr' + uuid.uuid4().hex; parts = []
        for k, v in (('model', 'whisper-1'), ('response_format', 'verbose_json'), ('timestamp_granularities[]', 'word')):
            parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode())
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="line.wav"\r\nContent-Type: audio/wav\r\n\r\n'.encode()
                     + wav.read_bytes() + f'\r\n--{b}--\r\n'.encode()); wav.unlink()
        try:
            r = _http('https://api.openai.com/v1/audio/transcriptions', b''.join(parts), dict(self.hdr, **{'Content-Type': f'multipart/form-data; boundary={b}'}))
        except VoiceError:
            return None                  # no word times: fall back to pauses + syllables for this line
        return [{'w': w['word'], 't': w['start']} for w in r.get('words', [])]
    def weights(self): return None


PROVIDERS = {'elevenlabs': ElevenLabsVoice, 'openai': OpenAIVoice, 'chatterbox': ChatterboxVoice, 'kokoro': KokoroVoice}


# ---------- reading a script ----------

def _read_line(v, L, S):
    """One line → (audio, sentences, words), times from the start of the line."""
    text = L['say']; gap = np.zeros(int(SR * S.get('sentence_pause', .3) * 1.4), np.float32)
    if v.exact_words:
        a, heard = v.read(text, L)
        a, off = trim(a, SR, with_offset=True)
        if heard:
            words = match_words(text, [{'w': h['w'], 't': max(0.0, h['t'] - off)} for h in heard], len(a) / SR)
            return a, sentences_from_words(text, words, len(a) / SR), words
        s, w = word_times(None, text, a, SR); return a, s, w
    if S.get('exact_sentences') or L.get('exact_sentences') or v.name == 'chatterbox':
        # read each sentence on its own and join them with the same natural pause: exact sync points
        parts, pieces, off = [s.strip() for s in re.findall(SENT, text) if s.strip()], [], 0.0
        sents, words = [], []
        for j, ptxt in enumerate(parts):
            b = trim(np.asarray(v.read(ptxt, L), np.float32), SR)
            s1, w1 = word_times(v.weights(), ptxt, b, SR)
            sents.append({'text': ptxt, 't': round(off, 3), 'end': round(off + len(b) / SR, 3)}); words += [{'w': x['w'], 't': round(x['t'] + off, 3)} for x in w1]
            pieces.append(b); off += len(b) / SR
            if j < len(parts) - 1: pieces.append(gap); off += len(gap) / SR
        return np.concatenate(pieces), sents, words
    a = trim(np.asarray(v.read(text, L), np.float32), SR)
    s, w = word_times(v.weights(), text, a, SR); return a, s, w

def _read_all(v, S, out):
    if hasattr(v, 'prefetch'):
        v.prefetch([s.strip() for L in S['lines'] for s in re.findall(SENT, L['say']) if s.strip()])
    T, t = {'voice': S['voice'], 'provider': v.name, 'lines': []}, 0.0
    for L in S['lines']:
        a, sents, words = _read_line(v, L, S); t += L.get('gap', .3)
        for x in sents: x['t'] = round(x['t'] + t, 3); x['end'] = round(x['end'] + t, 3)
        for x in words: x['t'] = round(x['t'] + t, 3)
        tail = float(np.sqrt(np.mean(a[-int(.03 * SR):] ** 2)))
        sf.write(out / f"{L['id']}.wav", a, SR)
        T['lines'].append({'id': L['id'], 'text': L['say'], 't': round(t, 3), 'd': round(len(a) / SR, 3), 'end': round(t + len(a) / SR, 3), 'sentences': sents, 'words': words, 'tail_ok': tail < .01})
        t += len(a) / SR
    T['sr'] = SR; T['end'] = round(t, 3); T['clipped'] = [l['id'] for l in T['lines'] if not l['tail_ok']]
    return T

def run(script_path, out_dir):
    S = json.load(open(script_path)); out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    want = S.get('provider', 'kokoro'); T, problems = None, []
    for name in dict.fromkeys([want, 'kokoro']):
        try:
            T = _read_all(PROVIDERS[name](S), S, out); break
        except VoiceError as e:
            problems.append(f'{name}: {e}')
    if T is None: raise VoiceError('; '.join(problems))
    if problems: T['fallback'] = problems
    json.dump(T, open(out / 'timing.json', 'w'), indent=1); return T

if __name__ == '__main__':
    T = run(sys.argv[1], sys.argv[2])
    print('voice', T['provider'], *(['(fell back:', *T['fallback'], ')'] if T.get('fallback') else []))
    for l in T['lines']:
        print(f"{l['t']:6.2f}–{l['end']:6.2f} {l['id']}"); [print(f"        {s['t']:6.2f} {s['text']}") for s in l['sentences']]
    print('end', T['end'], 'clipped', T['clipped'] or 'none')

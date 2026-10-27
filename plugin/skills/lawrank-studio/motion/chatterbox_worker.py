"""Reads a list of sentences with Chatterbox (Resemble AI, MIT licence). Runs in the Chatterbox Python that
`lr voice install chatterbox` sets up, never in the studio's own Python (it needs torch).

  python chatterbox_worker.py job.json      job: {"texts": [...], "out": dir, "exaggeration", "cfg_weight", "reference", "model"}

Writes <out>/<i>.wav for every text. "reference" is an optional voice sample (a few clean seconds of one speaker)
that Chatterbox copies; without it Chatterbox uses its own voice. "model": "turbo" uses the smaller, faster
Chatterbox Turbo (it ignores exaggeration and cfg_weight)."""
import json, sys
from pathlib import Path

import soundfile as sf
import torch

job = json.loads(Path(sys.argv[1]).read_text())
turbo = job.get("model") == "turbo"
if turbo:
    from chatterbox.tts_turbo import ChatterboxTurboTTS as Model
else:
    from chatterbox.tts import ChatterboxTTS as Model
dev = "cuda" if torch.cuda.is_available() else "mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu"
model = Model.from_pretrained(device=dev)
ref = job.get("reference") if job.get("reference") and Path(job["reference"]).exists() else None
if ref:
    model.prepare_conditionals(ref, exaggeration=0.0 if turbo else job.get("exaggeration", .45))
kw = {} if turbo else {"exaggeration": job.get("exaggeration", .45), "cfg_weight": job.get("cfg_weight", .5)}
for i, text in enumerate(job["texts"]):
    wav = model.generate(text, **kw)
    sf.write(Path(job["out"]) / f"{i}.wav", wav.squeeze(0).cpu().numpy(), model.sr)

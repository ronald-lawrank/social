/* LawRank motion system (GSAP 3.15 + CustomEase). One vocabulary for every entrance, exit and swap,
   so all scenes move the same way. Following the official GSAP skills: timelines with defaults, the
   position parameter, autoAlpha (hides fully-transparent elements), transforms only for movement. */
gsap.registerPlugin(CustomEase);
CustomEase.create('lr.out', '0.22,1,0.36,1');     // entrances: quick start, long soft settle
CustomEase.create('lr.in', '0.55,0,0.75,0.4');    // exits: leave without a bounce
CustomEase.create('lr.move', '0.65,0,0.35,1');    // camera / object moves
const M = {
  IN: .42, OUT: .26, RISE: 24, LIFT: 12, GAP: .06,
  enter(tl, el, t, o = {}) { return tl.fromTo(el, { autoAlpha: 0, y: o.y ?? M.RISE, x: o.x ?? 0 }, { autoAlpha: 1, y: 0, x: 0, duration: o.d ?? M.IN, ease: 'lr.out' }, t); },
  exit(tl, el, t, o = {}) { return tl.to(el, { autoAlpha: 0, y: o.y ?? -M.LIFT, duration: o.d ?? M.OUT, ease: 'lr.in' }, t); },
  fadeIn(tl, el, t, d = .35) { return tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: d, ease: 'power1.out' }, t); },
  fadeOut(tl, el, t, d = .26) { return tl.to(el, { autoAlpha: 0, duration: d, ease: 'power1.in' }, t); },
  // swap: the outgoing element is gone before the incoming one starts, so they never compete
  swap(tl, out, inn, t, o = {}) { M.fadeOut(tl, out, t, o.out ?? .2); return M.fadeIn(tl, inn, t + (o.out ?? .2) + M.GAP, o.in ?? .3); },
};

/* Player: the narration track is the clock; the timeline is seeked to audio.currentTime every frame. */
const PLAYERS = [];
function mount(def, CUE) {
  const card = document.createElement('section'); card.className = 'card'; card.id = def.id;
  card.innerHTML = `<div class="left"><div class="phone"><div class="stage">${def.html(CUE)}</div></div>
    <div class="ctrl"><button class="play">Play</button><button class="restart" title="Restart">↺</button>
    <select class="speed"><option value="1">1×</option><option value="0.5">0.5×</option></select>
    <label><input type="checkbox" class="snd" checked> Sound</label><span class="time">0.0s</span></div>
    <input type="range" class="scrub" min="0" max="${CUE.end}" step="0.01" value="0"></div><div class="right">${def.context(CUE)}</div>`;
  document.getElementById('concepts').appendChild(card);
  const stage = card.querySelector('.stage'), ph = card.querySelector('.phone'), $ = s => stage.querySelector(s);
  const fit = () => { const k = ph.clientWidth / 1080; stage.style.transform = `scale(${k})`; ph.style.height = 1920 * k + 'px'; }; fit(); addEventListener('resize', fit);
  const tl = gsap.timeline({ paused: true, defaults: { immediateRender: false, ease: 'lr.out', duration: M.IN } });
  def.build(tl, CUE, $); tl.to({}, { duration: .01 }, CUE.end - .01);
  const audio = new Audio(CUE.audio); audio.preload = 'auto';
  const btn = card.querySelector('.play'), scrub = card.querySelector('.scrub'), time = card.querySelector('.time');
  const P = { id: def.id, tl, audio, playing: false, end: CUE.end, cue: CUE };
  const show = t => { tl.seek(t, true); scrub.value = t; time.textContent = t.toFixed(1) + 's / ' + CUE.end.toFixed(1) + 's'; };
  P.stop = () => { P.playing = false; audio.pause(); btn.textContent = 'Play'; };
  P.play = () => { PLAYERS.forEach(o => o !== P && o.stop()); if (audio.currentTime >= CUE.end - .05) audio.currentTime = 0; P.playing = true; audio.play(); btn.textContent = 'Pause'; };
  btn.onclick = () => P.playing ? P.stop() : P.play();
  card.querySelector('.restart').onclick = () => { audio.currentTime = 0; show(0); P.play(); };
  card.querySelector('.speed').onchange = e => { audio.playbackRate = +e.target.value; };
  card.querySelector('.snd').onchange = e => { audio.muted = !e.target.checked; };
  scrub.oninput = () => { P.stop(); audio.currentTime = +scrub.value; show(+scrub.value); };
  audio.addEventListener('ended', () => P.stop());
  gsap.ticker.add(() => { if (P.playing) { const t = Math.min(audio.currentTime, CUE.end); show(t); if (t >= CUE.end - .01) P.stop(); } });
  const p0 = def.poster(CUE); audio.currentTime = p0; show(p0);
  P.show = show; P.stage = stage; PLAYERS.push(P); return P;
}

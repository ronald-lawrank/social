// Cue + sound plan for one motion piece, computed by the family itself from the measured narration.
//   node motion/cues.js <family> <timing.json> <storyboard.json>   -> prints {cues, sfx, end, lines}
const fs = require('fs'), vm = require('vm'), path = require('path');
const [fam, timingF, sbF] = process.argv.slice(2);
const ctx = vm.createContext({ FAMILIES: {}, Math, JSON, Object, Array, String, Number, Error, Set });
const load = f => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
if (fam === 'scenes') {                       // composed videos: the composer and the scene library first
  load(path.join(__dirname, 'runtime', 'compose.js'));
  for (const f of fs.readdirSync(path.join(__dirname, 'scenes')).filter(f => f.endsWith('.js')).sort())
    try { load(path.join(__dirname, 'scenes', f)); } catch (e) { console.error(`scene file ${f} didn't load: ${e.message}`); }   // one broken file never stops the rest
}
load(path.join(__dirname, 'families', fam + '.js'));
const F = ctx.FAMILIES[fam]; if (!F) { console.error('unknown family ' + fam); process.exit(2); }
const T = JSON.parse(fs.readFileSync(timingF, 'utf8')), S = JSON.parse(fs.readFileSync(sbF, 'utf8'));
const L = Object.fromEntries(T.lines.map(l => [l.id, l]));
const norm = w => w.toLowerCase().replace(/[^a-z0-9']/g, '');
const h = { L, S: (lid, i) => L[lid].sentences[i], W: (lid, w) => (L[lid].words.find(x => norm(x.w).startsWith(norm(w))) || L[lid].words[0]).t };
const missing = F.lines(S).filter(id => !L[id]);
if (missing.length) { console.error('storyboard is missing lines: ' + missing.join(', ')); process.exit(3); }
let cues;
try { cues = F.cues(h, S); } catch (e) { console.error(e.message); process.exit(4); }
const r = v => Array.isArray(v) ? v.map(r) : Math.round(v * 1000) / 1000;
for (const k in cues) cues[k] = r(cues[k]);
console.log(JSON.stringify({ cues, sfx: F.sfx(cues, S).map(s => ({ ...s, at: r(s.at) })), end: cues.end }));

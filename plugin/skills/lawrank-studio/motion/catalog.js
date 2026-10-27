// The scene library as data, for the writer's docs and the storyboard checker.
//   node motion/catalog.js   -> {scenes: {type: {label, about, good, practice, fields, example}}, looks: [...], transitions: [...]}
const fs = require('fs'), vm = require('vm'), path = require('path');
const ctx = vm.createContext({ FAMILIES: {}, Math, JSON, Object, Array, String, Number, Error, Set });
const load = f => vm.runInContext(fs.readFileSync(f, 'utf8'), ctx, { filename: f });
load(path.join(__dirname, 'runtime', 'compose.js'));
const broken = {};
for (const f of fs.readdirSync(path.join(__dirname, 'scenes')).filter(f => f.endsWith('.js')).sort())
  try { load(path.join(__dirname, 'scenes', f)); } catch (e) { broken[f] = e.message; }
const looks = [...fs.readFileSync(path.join(__dirname, 'runtime', 'looks.js'), 'utf8').matchAll(/^  (\w+)\(\) \{/gm)].map(m => m[1]);
const scenes = {};
for (const [k, s] of Object.entries(vm.runInContext('SCENES', ctx)))
  scenes[k] = { label: s.label, about: s.about, good: s.good, practice: s.practice || 'any', fields: s.fields || {}, example: s.example || null, looks: s.looks || 'all' };
console.log(JSON.stringify({ scenes, looks, transitions: Object.keys(vm.runInContext('TRANSITIONS', ctx)), broken }));

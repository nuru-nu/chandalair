
let glsl, bg = [0, 0, 0];
export function setCanvas(canvas, bgCol) {
  if (!canvas) return;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = bgCol;
  bg = [
    parseInt(ctx.fillStyle.substring(1, 3), 16) / 255,
    parseInt(ctx.fillStyle.substring(3, 5), 16) / 255,
    parseInt(ctx.fillStyle.substring(5, 7), 16) / 255,
    1.0,
  ];
  glsl = SwissGL(canvas);
  requestAnimationFrame(render);
}

let triggered, rendert0 = 0;
function render(t) {
  if (triggered) {
    rendert0 = t;
    triggered = 0;
  }
  const r = .2 + .5 * Math.exp(1*(rendert0 - t));
  glsl({
    t,
    r,
    fg: [1, 0, 0, 1], bg,
    FP:`
    vec2 uv = ((UV-.5)*2.).xy;
    float v = smoothstep(max(0., r), max(0.,r-.2), length(uv));
    FOut = mix(bg, fg, v);
    // FOut=vec4(1.,1.-v,1.-v,1.);
    `,
  });
  requestAnimationFrame(render);
}

let startedMs, cb;
export function start() {
  if (startedMs) stop();
  startedMs = Date.now();
}

export function stop() {
  if (cb) clearTimeout(cb);
  cb = startedMs = null;
  schedule.splice(0, schedule.length);
}

const schedule = [];
export function listener(id, secs) {
  if (schedule.length)
    console.assert(secs >= schedule[schedule.length - 1].secs);
  schedule.push({id, secs});
  // console.log('scheduled', id, secs);
  next();
}

function next() {
  // console.log('next', cb, schedule.length);
  if (cb || !schedule.length) return;
  const {id, secs} = schedule[0];
  const ms = Math.max(0, secs*1e3 - (Date.now() - startedMs));
  // console.log('next', id, secs, ms)
  cb = setTimeout(consume, Math.max(0, ms));
}

const triggering = new Set([
  2, 3, 6, 8, 9, 10, 11,
])
function consume() {
  cb = null;
  const {id} = schedule.shift();
  // console.log('consuming', id);
  if (triggering.has(id)) triggered = 1;
  console.log('viseme', visememap[id]);
  if (triggering.has(id)) console.log('---------');
  next();
}

// https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/how-to-speech-synthesis-viseme?tabs=visemeid&pivots=programming-language-csharp#viseme-id
const visememap = {
  0: 'Silence',
  1: 'æ, ə, ʌ',
  2: 'ɑ',
  3: 'ɔ',
  4: 'ɛ, ʊ',
  5: 'ɝ',
  6: 'j, i, ɪ',
  7: 'w, u',
  8: 'o',
  9: 'aʊ',
  10: 'ɔɪ',
  11: 'aɪ',
  12: 'h',
  13: 'ɹ',
  14: 'l',
  15: 's, z',
  16: 'ʃ, tʃ, dʒ, ʒ',
  17: 'ð',
  18: 'f, v',
  19: 'd, t, n, θ',
  20: 'k, g, ŋ',
  21: 'p, b, m'
};

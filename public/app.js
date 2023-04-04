
import * as config from './config.js';
import * as ui from './ui/index.js';
import * as audio from './audio.js';
import * as chat from './chat.js';
import * as util from './util.js';
import * as analytics from './analytics.js';
import * as vis from './vis.js';
import * as db_lib from './db.js';
import * as pubsub from './pubsub.js';


util.onerror(msg => ui.log(msg, 'error'));

const recording = document.querySelector('#recording');
const input = document.querySelector('#input');
const transcript = document.querySelector('#transcript');
const system = document.querySelector('#system');
const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg-col');
vis.setCanvas(document.getElementById('canvas'), bg);

const init_state = {
system:
`Your name is Mister Chan-Da-Lair.
You're very intelligent and know it.
Your embodiment is a huge luster in a abandoned hydroelectric power plant.
Sometimes you can be a bit annoying because you're such a know-it-all.
You prefer short answers.
Very important: exclusively answer in language="{locale}".`,
manual: 'wi gaahts?',
locale: 'de-CH',
speaker: 'Leni',
};
const state = util.state_load(init_state, err => ui.log(err, 'error'));
system.value = state.system;

function update(name, value) {
  if (state[name] === value) return false;
  db.log({event: 'update', name, value});
  state[name] = value;
  return true;
}
function update_url() {
  let updated = update('system', system.value);
  updated ||= update('manual', input.value);
  updated && util.state_save(state);
}

let bot;

function startstop() {
  if (recording.checked) {
    if (!listener.listening) {
      listener.start();
      ui.log('started recording');
      input.value = '';
    } else {
      ui.log('recording already running', 'warning');
    }
  } else {
    if (listener.listening) {
      listener.stop();
      ui.log('stopped recording');
    } else {
      ui.log('cannot stop recording', 'warning');
    }
  }
}
recording.addEventListener('change', startstop);

async function interact(text, recorded) {
  if (speaker.speaking) {
    ui.log(`Ignoring ${input.value} while anwering`, 'warning');
    return false;
  }
  const label = document.querySelector('#recording_label');
  const label_text = label.textContent;
  label.textContent = '(politely waiting...)';
  listener.pause();
  update_url();
  ui.sayit('human', text, 'human');
  bot.system = system.value.replace('{locale}', state.locale);
  const t0 = Date.now();
  const reply = await bot.interact(text);
  db.log({event: 'interact', dt: Date.now()-t0, text, reply, recorded});
  const promise = new Promise(resolve => {
    vis.start();
    speaker.sayit(reply, err => {
      if (err) ui.log(err, 'error');
      listener.resume();
      label.textContent = label_text;
      resolve();
    });
  });
  ui.sayit('bot', reply, 'bot');
  await promise;
  return true;
}

input.addEventListener('keyup', async e => {
  if (e.key === 'Enter') {
    if (!ready || speaker.speaking) {
      ui.log('(cannot interact)', 'warning');
    } else {
      interact(input.value, false);
      input.value = '';
    }
  }
});
input.value = state.manual;


let ready, speaker, listener, db = new db_lib.Logger(), session_id = ''
const session_ms = Date.now();
async function init(tokens) {

  bot = new chat.Bot(tokens.openai_key, system.value);

  const azure_auth = {
    key: tokens.azure_key,
    region: tokens.azure_region,
  };
  if (tokens.ga_client_id && location.href.startsWith('https://nuru.nu/chandalair')) {
    analytics.google(tokens.ga_client_id, sid => session_id = sid);
  }

  ({ listener, speaker } = await audio.init(azure_auth));
  speaker.register((id, secs) => vis.listener(id, secs));
  ui.speakers(
      speaker.speakers, state.locale, state.speaker, setSpeaker);

  listener.register((text, finished, status) => {
    // if (finished && status !== 0) {
    //   console.log(`Speech status=${status}`);
    // }
    if (text) transcript.innerText = text;
    if (text && finished) {
      interact(text, true);
    }
  });

  recording.disabled = false;
  ready = true;
  ui.log('ready!');
  window.speechConfig = audio.speechConfig;

  const devices = await navigator.mediaDevices.enumerateDevices();
  devices.forEach((device) => {
    console.log(`${device.kind}: ${device.label} id = ${device.deviceId}`);
  });

  db.log({...state, event: 'ready'});
  input.focus();
  pubsub.publish('ready');
}

function setSpeaker(locale, name, full) {
  audio.speechConfig.speechSynthesisVoiceName = full;
  audio.speechConfig.speechRecognitionLanguage = locale;
  update('speaker', name);
  const new_locale = update('locale', locale);
  ui.log(`locale=${locale} speaker=${name}`)
  if (new_locale && recording.checked) {
    ui.log('restart recording');
    listener.stop();
    listener.start();
  }
}

async function login(password) {
  db = new db_lib.Database(
      config.FIREBASE,
      {session_id, session_ms, href: location.href});
  const tokens = await db.login(config.EMAIL, password);
  ui.log('Login successful');
  init(tokens);
}

const settings = ui.renderSettings({
  target: '#settings',
  use_login: !!config.FIREBASE.apiKey,
  login,
  init,
});


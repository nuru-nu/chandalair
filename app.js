
import * as ui from './ui.js';
import * as audio from './audio.js';
import * as chat from './chat.js';
import * as util from './util.js';
import * as analytics from './analytics.js';
import * as vis from './vis.js';


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

function update() {
  state.system = system.value;
  state.manual = input.value;
  util.state_save(state);
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

async function interact(text) {
  if (speaker.speaking) {
    ui.log(`Ignoring ${input.value} while anwering`, 'warning');
    return false;
  }
  const label = document.querySelector('#recording_label');
  const label_text = label.textContent;
  label.textContent = '(politely waiting...)';
  listener.pause();
  update();
  ui.sayit('human', text, 'human');
  bot.system = system.value.replace('{locale}', state.locale);
  const reply = await bot.interact(text);
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
      interact(input.value);
      input.value = '';
    }
  }
});
input.value = state.manual;
input.focus();


let ready, speaker, listener;
async function init() {
  const tokens = await (await fetch('token.php')).json();

  bot = new chat.Bot(tokens.openai_key, system.value);

  const azure_auth = {
    token: tokens.azure_token,
    region: tokens.azure_region,
  };
  if (location.href.startsWith('https://nuru.nu/chandalair')) {
    analytics.google('G-0LRXMPENQ2');
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
      interact(text);
    }
  });

  recording.disabled = false;
  ready = true;
  ui.log('ready!');
  window.speechConfig = audio.speechConfig;
}

let previous_locale = state.locale;
function setSpeaker(locale, name, full) {
  audio.speechConfig.speechSynthesisVoiceName = full;
  audio.speechConfig.speechRecognitionLanguage = locale;
  state.speaker = name;
  state.locale = locale;
  ui.log(`locale=${locale} speaker=${name}`)
  if (previous_locale != locale && recording.checked) {
    ui.log('restart recording');
    listener.stop();
    listener.start();
  }
}

ui.log('initializing...');
init();

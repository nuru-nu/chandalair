

import { el, style } from './utils.js';

export { render as renderSettings } from './settings.js';

const e = s => (
  String(s).replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
);

const favorites = {
  'de-CH': 'Leni',
  'en-US': 'Nancy',
}
const main_locales = new Set([
  'en-IE', 'en-US', 'en-IN', 'en-GB',
  'de-CH', 'de-DE',
  'fr-CA', 'fr-FR', 'fr-CH',
  'sv-SE',
]);

style(`
.speakers .is_extra { display: none; }
.speakers.show_extra .is_extra { display: inline-block; }
`);

export function speakers(speakers, init_locale, init_speaker, cb) {
  init_locale = init_locale || 'en-US';
  if (init_speaker) favorites[init_locale] = init_speaker;

  const locales = {};
  speakers.filter(s => s.Locale.length <= 5).forEach(s => (locales[s.Locale] ??= []).push(s));
  const localeopts = Object.keys(locales).map(
     locale => `
     <option value="${e(locale)}" ${main_locales.has(locale) ? '' : 'class="is_extra"'}>
      ${e(locale)}
     </option>
     `).join('');
  const [root, {localesel, speakersel, wpm, extra}] = el(
      '#speaker', 'div.speakers', `
      <label>extra<input type="checkbox" class="extra"></label>
      <label>WPM<input type="checkbox" class="wpm"></label>
      <select class="locale">${localeopts}</select>
      <select class="speaker"></select>
      `, {localesel: '.locale', speakersel: '.speaker', wpm: '.wpm', extra: '.extra'}
  );
  extra.addEventListener('change', () => root.classList.toggle('show_extra'));
  wpm.addEventListener('change', update);
  function update() {
    const locale = locales[localesel.value];
    speakersel.innerHTML = '';
    speakersel.innerHTML = locale.map(
      s => `
        <option value="${e(s.LocalName)}">
          ${e(s.LocalName)}${wpm.checked ? ' (' + e(s.WordsPerMinute) + ')' : ''}
        </option>`).join('');
    if (favorites[localesel.value]) speakersel.value = favorites[localesel.value];
    select();
  }
  function select() {
    favorites[localesel.value] = speakersel.value;
    const full = locales[localesel.value].filter(
      s => s.LocalName === speakersel.value)[0].Name;
    cb(localesel.value, speakersel.value, full);
  }
  localesel.addEventListener('change', update);
  speakersel.addEventListener('change', select);
  localesel.value = init_locale;
  update();
}

export function log(message, cls) {
  const [msg, _] = el('#log', '<div', `
    <span class="timestamp">${new Date().toLocaleTimeString()}</span>
    <span class="message">${e(message)}</span>
  `);
  if (cls) msg.classList.add(cls);
}

export const warn = message => log(message, 'warning');
export const err = message => log(message, 'error');

export function sayit(who, text, cls) {
  const [msg, {message}] = el('#messages', '<div', `
    <div class="header">
      <span class="who">${e(who)}</span>
      <span class="timestamp">${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="message">${e(text)}</div>
  `, {message: '.message'});
  if (cls) msg.classList.add(cls);
  return function(text) {
    message.textContent += text;
  }
}

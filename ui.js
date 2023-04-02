
function el(target, type, html, selectors) {
  selectors = selectors || {};
  if ('string' === typeof target) target = document.querySelector(target);
  let method = 'append';
  if (type.startsWith('<')) {
    method = 'prepend';
    type = type.substr(1);
  }
  const root = document.createElement(type);
  root.innerHTML = html;
  target[method](root);
  const ret = {};
  Object.entries(selectors).forEach(([name, selector]) => ret[name] = root.querySelector(selector));
  return [root, ret];
}

const e = s => (
  String(s).replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
);

const favorites = {
  'de-CH': 'Leni',
  'en-US': 'Nancy',
}

export function speakers(speakers, init_locale, init_speaker, cb) {
  init_locale = init_locale || 'en-US';
  if (init_speaker) favorites[init_locale] = init_speaker;

  const locales = {};
  speakers.forEach(s => (locales[s.Locale] ??= []).push(s));
  const localeopts = Object.keys(locales).map(
     locale => `<option value="${e(locale)}">${e(locale)}</option>`).join('');
  const [_, {localesel, speakersel}] = el(
      '#speaker', 'div', `
      <select class="locale">${localeopts}</select>
      <select class="speaker"></select>
      `, {localesel: '.locale', speakersel: '.speaker'}
  );
  function update() {
    const locale = locales[localesel.value];
    speakersel.innerHTML = '';
    speakersel.innerHTML = locale.map(
      s => `<option value="${e(s.LocalName)}">${e(s.LocalName)}</option>`).join('');
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

export function sayit(who, message, cls) {
  const [msg, _] = el('#messages', '<div', `
    <div class="header">
      <span class="who">${e(who)}</span>
      <span class="timestamp">${new Date().toLocaleTimeString()}</span>
    </div>
    <div class="message">${e(message)}</div>
  `);
  if (cls) msg.classList.add(cls);
}

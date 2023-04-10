import { el, style } from './utils.js';
import * as pubsub from '../pubsub.js';

style(`
  .settings {
    background: var(--hl-col);
    padding: 0.5em;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
`);

export function render({target, use_login, login, init}) {
  const [root, els] = el(target, 'div.settings', `
    <div class="use_login">
      Login with password:
      <input type="password">
      <button class="login">login</button>
    </div>
    <div class="use_keys">
      Specify API keys:
      <div>
        OpenAI key:
        <input type="text" class="openai_key">
      </div>
      <div>
        Azure speech region:
        <input type="text" class="azure_region">
      </div>
      <div>
        Azure speech API key:
        <input type="text" class="azure_key">
      </div>
      <button class="connect">connect</button>
      <button class="reset">reset</button>
    </div>
  `, {
    use_login: '.use_login',
    password: 'input[type="password"]',
    login: '.login',
    openai_key: '.openai_key',
    azure_key: '.azure_key',
    azure_region: '.azure_region',
    connect: '.connect',
    reset: '.reset',
  });

  function _login() {
    sessionStorage.setItem('password', els.password.value);
    login(els.password.value);
  }

  els.login.addEventListener('click', _login);
  els.password.addEventListener('keyup', e => e.key === 'Enter' && _login());

  els.openai_key.value = localStorage.getItem('openai_key') || '';
  els.azure_region.value = localStorage.getItem('azure_region') || '';
  els.azure_key.value = localStorage.getItem('azure_key') || '';
  els.reset.addEventListener('click', () => {
    localStorage.setItem('openai_key', '');
    localStorage.setItem('azure_region', '');
    localStorage.setItem('azure_key', '');
    els.openai.value = els.azure_region.value = els.azure_key.value = '';
  });
  els.connect.addEventListener('click', () => {
    localStorage.setItem('openai_key', els.openai_key.value);
    localStorage.setItem('azure_region', els.azure_region.value);
    localStorage.setItem('azure_key', els.azure_key.value);
    init({
      openai_key: els.openai_key.value,
      azure_region: els.azure_region.value,
      azure_key: els.azure_key.value,
    });
  });

  pubsub.subscribe('ready', () => root.style.display = 'none');

  if (use_login) {
    els.password.focus();
    if (sessionStorage.getItem('password')) {
      els.password.value = sessionStorage.getItem('password');
      _login();
    }
    } else {
    els.use_login.style.display = 'none';
  }
}

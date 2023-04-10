
export function el(target, type, html, selectors) {
  selectors = selectors || {};
  if ('string' === typeof target) target = document.querySelector(target);
  let method = 'append';
  if (type.startsWith('<')) {
    method = 'prepend';
    type = type.substr(1);
  }
  let classes;
  [type, ...classes] = type.split('.');
  const root = document.createElement(type);
  root.classList.add(...classes);
  root.innerHTML = html;
  target[method](root);
  const ret = {};
  Object.entries(selectors).forEach(([name, selector]) => ret[name] = root.querySelector(selector));
  return [root, ret];
}

export function style(css) {
  const sheet = document.createElement("style");
  sheet.innerText = css;
  document.head.appendChild(sheet);
}

export const e = s => (
  String(s).replace(/>/g, '&gt;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
);

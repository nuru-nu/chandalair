
// https://stackoverflow.com/questions/30106476
function b64EncodeUnicode(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      function toSolidBytes(match, p1) {
          return String.fromCharCode('0x' + p1);
  }));
}
function b64DecodeUnicode(str) {
  return decodeURIComponent(atob(str).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
}


export function state_save(state) {
  location.hash = b64EncodeUnicode(JSON.stringify(state));
}

export function state_copy(state) {
  
}

export function state_clear() {
  location.hash = '';
}

export function state_load(defaults, errcb) {
  const merged = {...defaults};
  errcb = errcb || console.log;
  try {
    const json = location.hash.substring(1);
    if (json) {
      const state = JSON.parse(b64DecodeUnicode(json));
      for (const [k, v] of Object.entries(state)) {
        if (merged.hasOwnProperty(k)) {
          merged[k] = v;
        } else {
          errcb(`load_state: ignoring k=${k}`);
        }
      }
    }
  } catch (e) {
    errcb(`Could not load state: ${e}`);
  }
  return merged;
}

export function onerror(handler) {
  function onerror(e) {
    console.log(e);
    handler(e.error || e.reason);
  }

  window.addEventListener("error", onerror);
  window.addEventListener("unhandledrejection", onerror);
}


const listeners = {};

export function subscribe(event, listener) {
  (listeners[event] ??= new Set()).add(listener);
}

export function publish(event, data) {
  for (const listener of (listeners[event] || [])) {
    listener(event, data);
  }
}

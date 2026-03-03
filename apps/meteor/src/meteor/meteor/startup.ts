export function startup(cb: () => void) {
  if (typeof document !== 'undefined' && document.readyState !== 'loading') {
    cb();
  } else if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => cb());
  } else {
    cb(); // Fallback for pure JS environments (like vitest)
  }
}
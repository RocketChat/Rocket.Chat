// WebKit and Electron can report `hasFocus()` as true for a hidden tab or a blurred window.
export const isWindowActive = (): boolean => document.visibilityState === 'visible' && document.hasFocus();

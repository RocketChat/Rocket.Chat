export const canRunBrowserBackend = (): boolean =>
	typeof Worker === 'function' && typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';

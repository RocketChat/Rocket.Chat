/**
 * True when the browser can run the E2EE search index: SQLite compiled to WebAssembly in a worker. A browser that can
 * run it but cannot save it (no OPFS, or storage refused) keeps the index in memory only, and the search panel says so.
 */
export const canRunBrowserBackend = (): boolean =>
	typeof Worker === 'function' && typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';

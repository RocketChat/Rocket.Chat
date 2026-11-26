// Hermes has no ResizeObserver; Fuselage's Callout reads it. A no-op keeps the first layout.
if (typeof globalThis.ResizeObserver === 'undefined') {
	globalThis.ResizeObserver = class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver;
}

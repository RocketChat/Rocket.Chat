// Ponyfill for queueMicrotask
export const queueMicrotask =
	(typeof window !== 'undefined' && window.queueMicrotask) ||
	((cb: () => void): void => {
		Promise.resolve().then(cb);
	});

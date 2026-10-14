import { after } from 'node:test';

import { JSDOM } from 'jsdom';
import * as uuid from 'uuid';

// Jest's jsdom environment cancels the window's pending timers when a test file ends. The Node.js timers used here
// (sinon fakes them) would keep the process alive instead, so they are tracked and cancelled after the last test.
const pendingTimers = new Set<ReturnType<typeof setTimeout>>();
const {
	setTimeout: nodeSetTimeout,
	setInterval: nodeSetInterval,
	clearTimeout: nodeClearTimeout,
	clearInterval: nodeClearInterval,
} = globalThis;

globalThis.setTimeout = Object.assign(
	(callback: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => {
		const timer = nodeSetTimeout(() => {
			pendingTimers.delete(timer);
			callback(...args);
		}, ms);
		pendingTimers.add(timer);
		return timer;
	},
	{ __promisify__: nodeSetTimeout.__promisify__ },
) as typeof setTimeout;
globalThis.setInterval = ((callback: (...args: unknown[]) => void, ms?: number, ...args: unknown[]) => {
	const timer = nodeSetInterval(callback, ms, ...args);
	pendingTimers.add(timer);
	return timer;
}) as typeof setInterval;
globalThis.clearTimeout = ((timer?: ReturnType<typeof setTimeout>) => {
	if (timer) pendingTimers.delete(timer);
	nodeClearTimeout(timer);
}) as typeof clearTimeout;
globalThis.clearInterval = ((timer?: ReturnType<typeof setInterval>) => {
	if (timer) pendingTimers.delete(timer);
	nodeClearInterval(timer);
}) as typeof clearInterval;

const cancelPendingTimers = (): void => {
	for (const timer of pendingTimers) {
		nodeClearTimeout(timer);
	}
	pendingTimers.clear();
};

after(cancelPendingTimers);

const { window } = new JSDOM('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>', {
	url: 'http://localhost/',
	pretendToBeVisual: true,
});

// Jest runs tests with the jsdom window as the global object. Here each property keeps one owner and the other side reads and writes through it, so a test that changes window.navigator or fakes setTimeout is seen by the code under test.
const linkTo = (owner: object, mirror: object, key: string): void => {
	const own = Object.getOwnPropertyDescriptor(mirror, key);
	if (own && !own.configurable) {
		return;
	}
	Object.defineProperty(mirror, key, {
		configurable: true,
		get: () => (owner as Record<string, unknown>)[key],
		set: (value) => {
			(owner as Record<string, unknown>)[key] = value;
		},
	});
};

const ownedByJsdom = new Set([
	'navigator',
	'Navigator',
	'DOMException',
	'EventTarget',
	'Event',
	'CustomEvent',
	'MessageEvent',
	'CloseEvent',
	'AbortController',
	'AbortSignal',
	'Blob',
	'File',
	'FormData',
]);
const ownedByNode = [
	'setTimeout',
	'clearTimeout',
	'setInterval',
	'clearInterval',
	'queueMicrotask',
	'performance',
	'crypto',
	'atob',
	'btoa',
	'console',
	'URL',
	'URLSearchParams',
];

for (const key of Object.getOwnPropertyNames(window)) {
	if (!key.startsWith('_') && (!(key in globalThis) || ownedByJsdom.has(key))) {
		linkTo(window, globalThis, key);
	}
}
for (const key of ownedByNode) {
	linkTo(globalThis, window, key);
}

// Jest's jsdom environment has no fetch API
for (const key of ['fetch', 'Request', 'Response', 'Headers']) {
	delete (globalThis as Record<string, unknown>)[key];
}

// jsdom aliases webkitURL to its own URL class, which has no createObjectURL
Object.defineProperty(window, 'webkitURL', { configurable: true, get: () => globalThis.URL });

// browser APIs jsdom lacks, which tests install on either window or the global
for (const key of [
	'Notification',
	'MediaRecorder',
	'RocketChatDesktop',
	'matchMedia',
	'AudioContext',
	'webkitAudioContext',
	'MediaStream',
	'RTCPeerConnection',
	'PublicKeyCredential',
]) {
	if (!(key in window) && !(key in globalThis)) {
		linkTo(window, globalThis, key);
	}
}

const defineOnWindow = (key: string, value: unknown): void => {
	Object.defineProperty(window, key, { configurable: true, writable: true, value });
	linkTo(window, globalThis, key);
};

const urlByBlob = new WeakMap<Blob, string>();
const blobByUrl = new Map<string, Blob>();

globalThis.URL.createObjectURL = (blob: Blob): string => {
	const url = urlByBlob.get(blob) ?? `blob://${uuid.v4()}`;
	urlByBlob.set(blob, url);
	blobByUrl.set(url, blob);
	return url;
};

globalThis.URL.revokeObjectURL = (url: string): void => {
	const blob = blobByUrl.get(url);
	if (!blob) {
		return;
	}

	urlByBlob.delete(blob);
	blobByUrl.delete(url);
};

defineOnWindow(
	'ResizeObserver',
	class implements ResizeObserver {
		disconnect(): void {
			// no-op mock
		}

		observe(): void {
			// no-op mock
		}

		unobserve(): void {
			// no-op mock
		}
	},
);

Object.defineProperty(window.navigator, 'serviceWorker', {
	value: {
		register: () => Promise.resolve(),
		addEventListener: () => undefined,
		removeEventListener: () => undefined,
	},
});

defineOnWindow(
	'IntersectionObserver',
	class implements IntersectionObserver {
		readonly root: Document | Element | null = null;

		readonly rootMargin: string = '';

		readonly scrollMargin: string = '';

		readonly thresholds: ReadonlyArray<number> = [];

		disconnect(): void {
			// no-op mock
		}

		observe(): void {
			// no-op mock
		}

		takeRecords(): IntersectionObserverEntry[] {
			return [];
		}

		unobserve(): void {
			// no-op mock
		}
	},
);

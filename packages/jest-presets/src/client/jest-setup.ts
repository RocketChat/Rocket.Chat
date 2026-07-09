import { webcrypto } from 'node:crypto';
import { TextEncoder, TextDecoder } from 'node:util';

import { toHaveNoViolations } from 'jest-axe';
import * as uuid from 'uuid';

import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

const urlByBlob = new WeakMap<Blob, string>();
const blobByUrl = new Map<string, Blob>();

Object.defineProperty(globalThis, 'crypto', {
	value: webcrypto,
});

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

globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

Object.defineProperty(global.navigator, 'serviceWorker', {
	value: {
		register: jest.fn(),
		addEventListener: jest.fn(),
		removeEventListener: jest.fn(),
	},
});

globalThis.IntersectionObserver = class implements IntersectionObserver {
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
};

globalThis.TextEncoder = TextEncoder as any;
globalThis.TextDecoder = TextDecoder as any;

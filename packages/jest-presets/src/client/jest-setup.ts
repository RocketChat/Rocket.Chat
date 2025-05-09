import { TextEncoder, TextDecoder } from 'node:util';

import { toHaveNoViolations } from 'jest-axe';
import * as uuid from 'uuid';

import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

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

globalThis.IntersectionObserver = class IntersectionObserver {
	root = null;

	rootMargin = '';

	thresholds = [];

	disconnect() {
		return null;
	}

	observe() {
		return null;
	}

	takeRecords() {
		return [];
	}

	unobserve() {
		return null;
	}
};

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder as any;

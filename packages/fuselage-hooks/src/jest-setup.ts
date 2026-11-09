import { TextEncoder } from 'node:util';

import { configure } from '@testing-library/react';

configure({ reactStrictMode: true });

Object.assign(globalThis, { TextEncoder });

let spyConsoleError: jest.SpyInstance;
let spyConsoleWarn: jest.SpyInstance;

beforeAll(() => {
	spyConsoleError = jest.spyOn(console, 'error');
	spyConsoleWarn = jest.spyOn(console, 'warn');
});

afterAll(() => {
	try {
		expect(spyConsoleError).not.toHaveBeenCalled();
		expect(spyConsoleWarn).not.toHaveBeenCalled();
	} finally {
		spyConsoleError?.mockRestore();
		spyConsoleWarn?.mockRestore();
	}
});

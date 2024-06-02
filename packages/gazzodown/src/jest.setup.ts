import { TextEncoder, TextDecoder } from 'util';

import '@testing-library/jest-dom';

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder as any;

globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
	observe: jest.fn(),
	unobserve: jest.fn(),
	disconnect: jest.fn(),
}));

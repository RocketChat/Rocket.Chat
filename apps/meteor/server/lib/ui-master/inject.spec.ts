import type { NextHandleFunction } from 'connect';
import express from 'express';
import request from 'supertest';

let connectHandler: NextHandleFunction;

jest.mock(
	'meteor/webapp',
	() => ({
		WebApp: {
			connectHandlers: {
				use: jest.fn((fn: NextHandleFunction) => {
					connectHandler = fn;
				}),
			},
		},
	}),
	{ virtual: true },
);

jest.mock(
	'meteor/meteorhacks:inject-initial',
	() => ({
		Inject: {
			rawBody: jest.fn(),
			rawModHtml: jest.fn(),
		},
	}),
	{ virtual: true },
);

jest.mock(
	'meteor/reactive-dict',
	() => {
		return {
			ReactiveDict: class {
				private store = new Map<string, unknown>();

				get(key: string) {
					return this.store.get(key);
				}

				set(key: string, val: unknown) {
					this.store.set(key, val);
				}
			},
		};
	},
	{ virtual: true },
);

jest.mock('../utils/getURL', () => ({
	getURL: (key: string) => `/${key}`,
}));

describe('ui-master inject', () => {
	let app: express.Express;

	beforeAll(async () => {
		await import('./inject');
		app = express();
		app.use((req, res, next) => {
			connectHandler(req, res, next);
		});
	});

	it('should set Content-Length based on UTF-8 byte length rather than string length', async () => {
		const { addStyle } = await import('./inject');

		const nonAsciiContent = 'body { font-family: "Noto Sans", "🚀", "café", "你好"; content: "★"; }';
		addStyle('css-theme-test', nonAsciiContent);

		const byteLength = Buffer.byteLength(nonAsciiContent, 'utf-8');
		const stringLength = nonAsciiContent.length;

		// Verify byte length differs from string length due to multi-byte characters
		expect(byteLength).toBeGreaterThan(stringLength);

		const response = await request(app).get('/css-theme-test_hash.css');

		expect(response.status).toBe(200);
		expect(response.headers['content-type']).toBe('text/css; charset=UTF-8');
		expect(response.headers['content-length']).toBe(String(byteLength));
		expect(response.text).toBe(nonAsciiContent);
	});

	it('should serve JS with correct Content-Length for multi-byte content', async () => {
		const { addScript } = await import('./inject');

		const nonAsciiScript = 'console.log("Hello, 🌍! Café au lait — Привет");';
		addScript('js-test', nonAsciiScript);

		const byteLength = Buffer.byteLength(nonAsciiScript, 'utf-8');
		const stringLength = nonAsciiScript.length;

		expect(byteLength).toBeGreaterThan(stringLength);

		const response = await request(app).get('/js-test_hash.js').buffer(true);

		expect(response.status).toBe(200);
		expect(response.headers['content-type']).toBe('application/javascript; charset=UTF-8');
		expect(response.headers['content-length']).toBe(String(byteLength));
		expect(response.text).toBe(nonAsciiScript);
	});
});

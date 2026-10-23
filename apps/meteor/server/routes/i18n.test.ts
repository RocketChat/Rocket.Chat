import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';

type Handler = (req: unknown, res: unknown) => Promise<void>;

let handler: Handler | undefined;

p.noCallThru().load('./i18n', {
	'meteor/webapp': {
		WebApp: {
			connectHandlers: {
				use: (_path: string, fn: Handler) => {
					handler = fn;
				},
			},
		},
	},
});

describe('i18n route', () => {
	let previousAssets: unknown;

	beforeEach(() => {
		previousAssets = (globalThis as { Assets?: unknown }).Assets;
	});

	afterEach(() => {
		(globalThis as { Assets?: unknown }).Assets = previousAssets;
	});

	it('should send the byte length of the locale file as Content-Length', async () => {
		const locale = JSON.stringify({ Hello: 'Olá, ação' });
		(globalThis as { Assets?: unknown }).Assets = { getTextAsync: async () => locale };

		const headers: Record<string, unknown> = {};
		let body: string | undefined;
		const res = {
			setHeader: (name: string, value: unknown) => {
				headers[name.toLowerCase()] = value;
			},
			writeHead: () => undefined,
			end: (data?: string) => {
				body = data;
			},
		};

		await handler?.({ url: '/pt-BR.json', headers: { host: 'localhost' } }, res);

		expect(body).to.equal(locale);
		expect(headers['content-length']).to.equal(Buffer.byteLength(locale));
	});
});

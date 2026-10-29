import { Writable } from 'node:stream';

import { Settings } from '@rocket.chat/core-services';
import type { NextFunction, Request, Response } from 'express';

import { getFederationRoutes } from './routes';

jest.mock('@rocket.chat/core-services', () => ({
	Settings: { get: jest.fn() },
	License: { hasModule: jest.fn() },
	FederationMatrix: {},
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {},
	errCodes: {},
	NotAllowedError: class NotAllowedError extends Error {},
}));

type Outcome = { handledWith: number } | 'passed-on';

const requestWellKnown = (url: string): Promise<Outcome> =>
	new Promise((resolve) => {
		const res = Object.assign(new Writable({ write: (_chunk, _encoding, callback) => callback() }), {
			statusCode: 200,
			status(code: number) {
				this.statusCode = code;
				return this;
			},
			setHeader: () => undefined,
		});
		res.on('finish', () => resolve({ handledWith: res.statusCode }));
		const req = { method: 'GET', url, headers: {} };

		getFederationRoutes('1.0.0').wellKnown.router(req as Request, res as unknown as Response, (() => resolve('passed-on')) as NextFunction);
	});

describe('federation /.well-known routes', () => {
	beforeEach(() => {
		jest.mocked(Settings.get).mockResolvedValue(false);
	});

	it('answer the Matrix server discovery path', async () => {
		await expect(requestWellKnown('/.well-known/matrix/server')).resolves.toEqual({ handledWith: 403 });
	});

	// Other protocols serve their own documents under /.well-known, such as OAuth discovery for MCP clients.
	it.each(['/.well-known/oauth-authorization-server', '/.well-known/oauth-protected-resource/api/v1/mcp'])(
		'leave %s to the next handler',
		async (url) => {
			await expect(requestWellKnown(url)).resolves.toBe('passed-on');
		},
	);
});

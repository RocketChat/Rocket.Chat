import { Settings } from '@rocket.chat/core-services';
import { createRootApp, mountRouter } from '@rocket.chat/http-router';
import type { HttpBindings } from '@rocket.chat/http-router';

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

const requestWellKnown = async (url: string): Promise<Outcome> => {
	const app = createRootApp();
	mountRouter(app, getFederationRoutes('1.0.0').wellKnown);
	app.notFound((c) => c.text('passed-on'));

	const response = await app.request(url, undefined, {} as HttpBindings);
	const body = await response.text();
	return body === 'passed-on' ? body : { handledWith: response.status };
};

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

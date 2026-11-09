import { federationSDK } from '@rocket.chat/federation-sdk';
import { Hono } from 'hono';

import { canAccessResourceMiddleware } from './canAccessResource.js';

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		verifyRequestSignature: jest.fn(),
		canAccessResource: jest.fn(),
	},
	errCodes: {
		M_UNAUTHORIZED: { errcode: 'M_UNAUTHORIZED', error: 'Unauthorized', status: 401 },
		M_UNKNOWN: { errcode: 'M_UNKNOWN', error: 'Unknown error' },
	},
}));

const mockVerifyRequestSignature = federationSDK.verifyRequestSignature as jest.MockedFunction<typeof federationSDK.verifyRequestSignature>;
const mockCanAccessResource = federationSDK.canAccessResource as jest.MockedFunction<typeof federationSDK.canAccessResource>;

const app = new Hono().get('/rooms/:roomId', canAccessResourceMiddleware('room'), (c) => c.json({ handled: true }, 201));

const request = (headers: Record<string, string> = { Authorization: 'X-Matrix origin="remote.local"' }) =>
	app.request('/rooms/!room:remote.local', { headers });

describe('canAccessResourceMiddleware', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should answer with the route handler response when the server is authenticated and can access the resource', async () => {
		mockVerifyRequestSignature.mockResolvedValue('remote.local');
		mockCanAccessResource.mockResolvedValue(true);

		const response = await request();

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual({ handled: true });
		expect(mockCanAccessResource).toHaveBeenCalledWith('room', '!room:remote.local', 'remote.local');
	});

	it('should answer 403 without reaching the route handler when the server cannot access the resource', async () => {
		mockVerifyRequestSignature.mockResolvedValue('remote.local');
		mockCanAccessResource.mockResolvedValue(false);

		const response = await request();

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ errcode: 'M_FORBIDDEN', error: 'Access denied to resource' });
	});

	it('should answer 401 without checking access when the request is not signed', async () => {
		const response = await request({});

		expect(response.status).toBe(401);
		expect(mockCanAccessResource).not.toHaveBeenCalled();
	});
});

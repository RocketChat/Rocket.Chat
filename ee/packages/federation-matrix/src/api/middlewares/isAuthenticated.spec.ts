import { federationSDK } from '@rocket.chat/federation-sdk';
import { Hono } from 'hono';

import { isAuthenticatedMiddleware } from './isAuthenticated';
import { logger } from '../logger';

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: { verifyRequestSignature: jest.fn() },
	errCodes: {
		M_UNAUTHORIZED: { errcode: 'M_UNAUTHORIZED', error: 'Unauthorized', status: 401 },
		M_UNKNOWN: { errcode: 'M_UNKNOWN', error: 'Unknown error' },
	},
}));

jest.mock('../logger', () => ({
	logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const app = new Hono().use(isAuthenticatedMiddleware()).get('/', (c) => c.text('passed'));

const signedRequest = () => app.request('/', { headers: { authorization: 'X-Matrix origin=remote.example,key="ed25519:a",sig="s"' } });

describe('isAuthenticatedMiddleware', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('passes a request whose signature is verified', async () => {
		jest.mocked(federationSDK.verifyRequestSignature).mockResolvedValue('remote.example');

		const res = await signedRequest();

		expect(res.status).toBe(200);
		expect(logger.warn).not.toHaveBeenCalled();
	});

	it('logs a request without an authorization header', async () => {
		const res = await app.request('/');

		expect(res.status).toBe(401);
		expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Missing Authorization header', path: '/' }));
	});

	it('logs a request whose signature is not verified', async () => {
		jest.mocked(federationSDK.verifyRequestSignature).mockResolvedValue(undefined);

		const res = await signedRequest();

		expect(res.status).toBe(401);
		expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Signature not verified', path: '/' }));
	});

	it('logs the error when verification throws', async () => {
		const err = new Error('boom');
		jest.mocked(federationSDK.verifyRequestSignature).mockRejectedValue(err);

		const res = await signedRequest();

		expect(res.status).toBe(500);
		expect(logger.error).toHaveBeenCalledWith(expect.objectContaining({ path: '/', err }));
	});
});

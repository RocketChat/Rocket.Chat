import { Settings } from '@rocket.chat/core-services';
import { Hono } from 'hono';

import { isFederationDomainAllowedMiddleware } from './isFederationDomainAllowed';
import { logger } from '../logger';

jest.mock('@rocket.chat/core-services', () => ({
	Settings: { get: jest.fn() },
}));

jest.mock('../logger', () => ({
	logger: { warn: jest.fn(), info: jest.fn() },
}));

const app = new Hono().use(isFederationDomainAllowedMiddleware).get('/', (c) => c.text('passed'));

const requestWith = (authorization: string) => app.request('/', { headers: { authorization } });

describe('isFederationDomainAllowedMiddleware', () => {
	beforeAll(() => {
		jest.mocked(Settings.get).mockResolvedValue('allowed.example, other.example');
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('passes a request whose quoted origin is on the allow list', async () => {
		const res = await requestWith('X-Matrix origin="allowed.example",destination="rocket.chat",key="ed25519:a",sig="s"');

		expect(res.status).toBe(200);
	});

	it('passes a request whose unquoted origin is on the allow list', async () => {
		const res = await requestWith('X-Matrix origin=allowed.example,destination=rocket.chat,key="ed25519:a",sig="s"');

		expect(res.status).toBe(200);
		expect(logger.warn).not.toHaveBeenCalled();
	});

	it('reads parameter names case-insensitively', async () => {
		const res = await requestWith('X-Matrix Origin=allowed.example,DESTINATION=rocket.chat,Key="ed25519:a",sig="s"');

		expect(res.status).toBe(200);
		expect(logger.warn).not.toHaveBeenCalled();
	});

	it('forbids an origin that is not on the allow list', async () => {
		const res = await requestWith('X-Matrix origin=denied.example,key="ed25519:a",sig="s"');

		expect(res.status).toBe(403);
		expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ path: '/', origin: 'denied.example' }));
	});

	it('does not read a parameter ending in origin as the origin', async () => {
		const res = await requestWith('X-Matrix x-origin=allowed.example,key="ed25519:a",sig="s"');

		expect(res.status).toBe(401);
		expect(await res.json()).toMatchObject({ errcode: 'M_MISSING_ORIGIN' });
		expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ path: '/', headerParams: ['x-origin', 'key', 'sig'] }));
	});

	it('rejects a request without an authorization header', async () => {
		const res = await app.request('/');

		expect(res.status).toBe(401);
		expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ msg: 'Missing Authorization header' }));
	});
});

import { Settings } from '@rocket.chat/core-services';
import { Hono } from 'hono';

import { isFederationDomainAllowedMiddleware } from './isFederationDomainAllowed';

jest.mock('@rocket.chat/core-services', () => ({
	Settings: { get: jest.fn() },
}));

const app = new Hono().use(isFederationDomainAllowedMiddleware).get('/', (c) => c.text('passed'));

const requestWith = (authorization: string) => app.request('/', { headers: { authorization } });

describe('isFederationDomainAllowedMiddleware', () => {
	beforeAll(() => {
		jest.mocked(Settings.get).mockResolvedValue('allowed.example, other.example');
	});

	it('passes a request whose quoted origin is on the allow list', async () => {
		const res = await requestWith('X-Matrix origin="allowed.example",destination="rocket.chat",key="ed25519:a",sig="s"');

		expect(res.status).toBe(200);
	});

	it('passes a request whose unquoted origin is on the allow list', async () => {
		const res = await requestWith('X-Matrix origin=allowed.example,destination=rocket.chat,key="ed25519:a",sig="s"');

		expect(res.status).toBe(200);
	});

	it('forbids an origin that is not on the allow list', async () => {
		const res = await requestWith('X-Matrix origin=denied.example,key="ed25519:a",sig="s"');

		expect(res.status).toBe(403);
	});

	it('does not read a parameter ending in origin as the origin', async () => {
		const res = await requestWith('X-Matrix x-origin=allowed.example,key="ed25519:a",sig="s"');

		expect(res.status).toBe(401);
		expect(await res.json()).toMatchObject({ errcode: 'M_MISSING_ORIGIN' });
	});

	it('rejects a request without an authorization header', async () => {
		const res = await app.request('/');

		expect(res.status).toBe(401);
	});
});

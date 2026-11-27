import { mockModel } from '@rocket.chat/models/testing';
import { Hono } from 'hono';

import { aiEngineAuthentication, type AiEngineVariables } from './aiAgentsEngineAuth';
import { createEngineCredential } from '../../lib/ai-agents/engineCredentials';

const findOneByCredentialId = jest.fn();
const handled = jest.fn();

const app = new Hono<{ Variables: AiEngineVariables }>();
app.use(aiEngineAuthentication);
app.get('/', (c) => {
	handled(c.get('aiEngineId'));
	return c.json({ engineId: c.get('aiEngineId') });
});

describe('aiEngineAuthentication', () => {
	const { credential, token } = createEngineCredential(new Date(), 90);

	beforeAll(() => {
		mockModel('AiEngines', { findOneByCredentialId });
	});

	beforeEach(() => {
		handled.mockClear();
		findOneByCredentialId
			.mockReset()
			.mockImplementation(async (id: string) => (id === credential.id ? { _id: 'engine-1', credentials: [credential] } : null));
	});

	it('passes a request with a current credential on, as its engine, uncached', async () => {
		const response = await app.request('/', { headers: { authorization: `Bearer ${token}` } });

		expect(response.status).toBe(200);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(handled).toHaveBeenCalledWith('engine-1');
	});

	it.each([
		['no credential', {}],
		['a wrong secret', { authorization: `Bearer ${credential.id}.${createEngineCredential(new Date(), 1).token.split('.')[1]}` }],
		['a Rocket.Chat login', { 'x-user-id': 'admin-1', 'x-auth-token': 'login-token' }],
	])('answers 401 to a request with %s, the same refusal every time', async (_label, headers) => {
		const response = await app.request('/', { headers });

		expect(response.status).toBe(401);
		expect(response.headers.get('www-authenticate')).toBe('Bearer');
		expect(response.headers.get('cache-control')).toBe('no-store');
		await expect(response.json()).resolves.toEqual({ success: false, error: 'unauthorized' });
		expect(handled).not.toHaveBeenCalled();
	});
});

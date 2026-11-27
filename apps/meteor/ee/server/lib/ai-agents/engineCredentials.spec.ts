import { createHash } from 'node:crypto';

import type { IAiEngine } from '@rocket.chat/core-typings';
import { mockModel } from '@rocket.chat/models/testing';

import { authenticateEngineRequest, createEngineCredential } from './engineCredentials';

const DAY_MS = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-20T12:00:00Z');

const findOneByCredentialId = jest.fn();

const engineWith = (...credentials: IAiEngine['credentials']): IAiEngine =>
	({ _id: 'engine-1', name: 'QA engine', credentials, createdBy: 'admin-1', createdAt: now, _updatedAt: now }) as IAiEngine;

// shaped like Random.secret(), which login tokens and personal access tokens use; synthetic
const LOGIN_TOKEN = 'aGVsbG8td29ybGQtdGhpcy1pcy1hLWxvZ2luLXRva2Vu';

const bearer = (token: string) => new Headers({ authorization: `Bearer ${token}` });

describe('createEngineCredential', () => {
	it('keeps only the SHA-256 of the secret and expires after the given number of days', () => {
		const { credential, token } = createEngineCredential(now, 90);

		const [id, secret] = token.split('.');
		expect(credential.id).toBe(id);
		expect(Buffer.from(secret, 'base64url')).toHaveLength(32);
		expect(credential.verifier).toBe(createHash('sha256').update(secret).digest('hex'));
		expect(JSON.stringify(credential)).not.toContain(secret);
		expect(credential.expiresAt.getTime() - now.getTime()).toBe(90 * DAY_MS);
	});

	it('never issues the same token twice', () => {
		const tokens = new Set(Array.from({ length: 50 }, () => createEngineCredential(now, 1).token));

		expect(tokens.size).toBe(50);
	});
});

describe('authenticateEngineRequest', () => {
	let token: string;
	let credential: IAiEngine['credentials'][number];

	beforeAll(() => {
		mockModel('AiEngines', { findOneByCredentialId });
	});

	beforeEach(() => {
		({ token, credential } = createEngineCredential(now, 90));
		findOneByCredentialId.mockReset().mockImplementation(async (id: string) => (id === credential.id ? engineWith(credential) : null));
	});

	it('names the engine whose current credential the request carries', async () => {
		await expect(authenticateEngineRequest(bearer(token), now)).resolves.toEqual({ engineId: 'engine-1', credentialId: credential.id });
	});

	it('accepts either of two active credentials, as during a rotation', async () => {
		const second = createEngineCredential(now, 90);
		findOneByCredentialId.mockResolvedValue(engineWith(credential, second.credential));

		await expect(authenticateEngineRequest(bearer(token), now)).resolves.toMatchObject({ credentialId: credential.id });
		await expect(authenticateEngineRequest(bearer(second.token), now)).resolves.toMatchObject({ credentialId: second.credential.id });
	});

	it('refuses a request with no authorization header', async () => {
		await expect(authenticateEngineRequest(new Headers(), now)).resolves.toBeUndefined();
		expect(findOneByCredentialId).not.toHaveBeenCalled();
	});

	it('refuses the right secret for a credential id that is not linked', async () => {
		const other = createEngineCredential(now, 90);

		await expect(authenticateEngineRequest(bearer(`${other.credential.id}.${token.split('.')[1]}`), now)).resolves.toBeUndefined();
	});

	it('refuses a wrong secret for a linked credential id', async () => {
		const other = createEngineCredential(now, 90);

		await expect(authenticateEngineRequest(bearer(`${credential.id}.${other.token.split('.')[1]}`), now)).resolves.toBeUndefined();
	});

	it('refuses an expired credential, from the moment it expires', async () => {
		await expect(authenticateEngineRequest(bearer(token), credential.expiresAt)).resolves.toBeUndefined();
		await expect(authenticateEngineRequest(bearer(token), new Date(credential.expiresAt.getTime() - 1))).resolves.toBeDefined();
	});

	it('refuses a revoked credential', async () => {
		findOneByCredentialId.mockResolvedValue(engineWith({ ...credential, revokedAt: now }));

		await expect(authenticateEngineRequest(bearer(token), now)).resolves.toBeUndefined();
	});

	it('refuses a valid credential sent alongside a Rocket.Chat login', async () => {
		const headers = new Headers({ 'authorization': `Bearer ${token}`, 'x-user-id': 'admin-1', 'x-auth-token': 'login-token' });

		await expect(authenticateEngineRequest(headers, now)).resolves.toBeUndefined();
		expect(findOneByCredentialId).not.toHaveBeenCalled();
	});

	it.each([
		['a login token in the Rocket.Chat headers', new Headers({ 'x-user-id': 'admin-1', 'x-auth-token': LOGIN_TOKEN })],
		['a login token as a bearer', bearer(LOGIN_TOKEN)],
		['an OAuth access token as a bearer', bearer('6f1d2c3b4a5968778695a4b3c2d1e0f1a2b3c4d5')],
		['the secret without its credential id', new Headers({ authorization: 'Bearer SECRET' })],
		['another scheme', new Headers({ authorization: 'Basic YWRtaW46cGFzc3dvcmQ=' })],
		['an oversized header', bearer(`${'A'.repeat(17)}.${'B'.repeat(10_000)}`)],
	])('refuses %s without looking anything up', async (_label, headers) => {
		await expect(authenticateEngineRequest(headers, now)).resolves.toBeUndefined();
		expect(findOneByCredentialId).not.toHaveBeenCalled();
	});
});

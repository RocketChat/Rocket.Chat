import { createHash } from 'node:crypto';

import { mockModel } from '@rocket.chat/models/testing';
import request from 'supertest';

import { OAuth2Server } from './oauth';

const oAuthAppsModel = { findOneActiveByClientId: jest.fn(), findOneActiveByClientIdAndClientSecret: jest.fn() };
const oAuthAuthCodesModel = { upsertByAuthCode: jest.fn(), findOneByAuthCode: jest.fn(), deleteOne: jest.fn() };
const oAuthAccessTokensModel = { insertOne: jest.fn() };
const usersModel = { findOne: jest.fn(), updateOne: jest.fn() };

const client = {
	clientId: 'client-id',
	clientSecret: 'client-secret',
	redirectUri: 'https://client.example/callback',
	active: true,
};

const codeVerifier = 'verifier-'.repeat(6);
const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

const authorizeQuery = new URLSearchParams({
	response_type: 'code',
	client_id: client.clientId,
	redirect_uri: client.redirectUri,
	state: 'client-state',
});

const { app } = new OAuth2Server({});

// The consent page posts its form back to the authorize URL, so the client's parameters arrive in the query string.
const approve = (query: URLSearchParams) =>
	request(app).post(`/oauth/authorize?${query}`).type('form').send({
		allow: 'yes',
		access_token: 'login-token',
		client_id: client.clientId,
		redirect_uri: client.redirectUri,
		response_type: 'code',
	});

const storedCode = (fields: Record<string, unknown> = {}) => ({
	authCode: 'auth-code',
	clientId: client.clientId,
	userId: 'user-id',
	expires: new Date(Date.now() + 60_000),
	redirectUri: client.redirectUri,
	...fields,
});

const exchange = (fields: Record<string, string>) =>
	request(app)
		.post('/oauth/token')
		.type('form')
		.send({ grant_type: 'authorization_code', code: 'auth-code', client_id: client.clientId, redirect_uri: client.redirectUri, ...fields });

describe('OAuth2Server', () => {
	beforeAll(() => {
		mockModel('OAuthApps', oAuthAppsModel);
		mockModel('OAuthAuthCodes', oAuthAuthCodesModel);
		mockModel('OAuthAccessTokens', oAuthAccessTokensModel);
		mockModel('Users', usersModel);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		oAuthAppsModel.findOneActiveByClientId.mockResolvedValue(client as never);
		oAuthAppsModel.findOneActiveByClientIdAndClientSecret.mockImplementation(
			async (_clientId, clientSecret) => (clientSecret === client.clientSecret ? client : null) as never,
		);
		usersModel.findOne.mockResolvedValue({ _id: 'user-id' } as never);
		oAuthAuthCodesModel.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
		oAuthAccessTokensModel.insertOne.mockResolvedValue({ acknowledged: true, insertedId: 'token-id' });
	});

	describe('POST /oauth/authorize', () => {
		it('stores the PKCE challenge of the authorization request with the code', async () => {
			const query = new URLSearchParams(authorizeQuery);
			query.set('code_challenge', codeChallenge);
			query.set('code_challenge_method', 'S256');

			const response = await approve(query);

			expect(response.status).toBe(302);
			const location = new URL(response.headers.location);
			expect(location.searchParams.get('state')).toBe('client-state');
			expect(oAuthAuthCodesModel.upsertByAuthCode).toHaveBeenCalledWith(
				location.searchParams.get('code'),
				expect.objectContaining({ clientId: client.clientId, userId: 'user-id', codeChallenge, codeChallengeMethod: 'S256' }),
			);
		});

		it('stores no challenge when the client does not use PKCE', async () => {
			const response = await approve(authorizeQuery);

			expect(response.status).toBe(302);
			expect(oAuthAuthCodesModel.upsertByAuthCode).toHaveBeenCalledWith(
				expect.any(String),
				expect.not.objectContaining({ codeChallenge: expect.anything() }),
			);
		});

		it('refuses the plain challenge method', async () => {
			const query = new URLSearchParams(authorizeQuery);
			query.set('code_challenge', codeVerifier);
			query.set('code_challenge_method', 'plain');

			const response = await approve(query);

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({ error: 'invalid_request' });
			expect(oAuthAuthCodesModel.upsertByAuthCode).not.toHaveBeenCalled();
		});
	});

	describe('POST /oauth/token', () => {
		it('issues a token when the verifier matches the stored challenge', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode({ codeChallenge, codeChallengeMethod: 'S256' }) as never);

			const response = await exchange({ client_secret: client.clientSecret, code_verifier: codeVerifier });

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({ access_token: expect.any(String), token_type: 'Bearer' });
		});

		it('rejects a verifier that does not match the stored challenge', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode({ codeChallenge, codeChallengeMethod: 'S256' }) as never);

			const response = await exchange({ client_secret: client.clientSecret, code_verifier: 'other-'.repeat(8) });

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({ error: 'invalid_grant' });
			expect(oAuthAccessTokensModel.insertOne).not.toHaveBeenCalled();
			expect(oAuthAuthCodesModel.deleteOne).toHaveBeenCalledWith({ authCode: 'auth-code' });
		});

		it('rejects a code issued with a challenge when the request carries no verifier', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode({ codeChallenge, codeChallengeMethod: 'S256' }) as never);

			const response = await exchange({ client_secret: client.clientSecret });

			expect(response.status).toBe(400);
			expect(oAuthAccessTokensModel.insertOne).not.toHaveBeenCalled();
		});

		// Without this, anyone holding a confidential client's code could redeem it with a verifier of their own choosing.
		it('requires the client secret even when the request carries a PKCE verifier', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode({ codeChallenge, codeChallengeMethod: 'S256' }) as never);

			const response = await exchange({ code_verifier: codeVerifier });

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: 'invalid_request', error_description: 'Missing parameter: `client_secret`' });
			expect(oAuthAuthCodesModel.findOneByAuthCode).not.toHaveBeenCalled();
		});

		it.each([
			['a malformed Basic header', (test: request.Test) => test.set('Authorization', 'Basic !!!')],
			['Basic credentials with an empty secret', (test: request.Test) => test.auth(client.clientId, '')],
		])('does not take %s for the client secret', async (_case, withHeader) => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode({ codeChallenge, codeChallengeMethod: 'S256' }) as never);

			const response = await withHeader(exchange({ code_verifier: codeVerifier }));

			expect(response.status).toBe(400);
			expect(response.body).toEqual({ error: 'invalid_request', error_description: 'Missing parameter: `client_secret`' });
			expect(oAuthAccessTokensModel.insertOne).not.toHaveBeenCalled();
		});

		it('accepts the client secret through HTTP Basic authentication', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode({ codeChallenge, codeChallengeMethod: 'S256' }) as never);

			const response = await exchange({ code_verifier: codeVerifier }).auth(client.clientId, client.clientSecret);

			expect(response.status).toBe(200);
		});

		it('keeps issuing tokens to clients that do not use PKCE', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode() as never);

			const response = await exchange({ client_secret: client.clientSecret });

			expect(response.status).toBe(200);
		});
	});
});

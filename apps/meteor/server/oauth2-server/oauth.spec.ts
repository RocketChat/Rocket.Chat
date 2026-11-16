import { createHash } from 'node:crypto';

import { mockModel } from '@rocket.chat/models/testing';
import request from 'supertest';

import { OAuth2Server } from './oauth';

const oAuthAppsModel = { findOneActiveByClientId: jest.fn(), findOneActiveByClientIdAndClientSecret: jest.fn() };
const oAuthAuthCodesModel = { upsertByAuthCode: jest.fn(), findOneByAuthCode: jest.fn(), deleteOne: jest.fn() };
const oAuthAccessTokensModel = { insertOne: jest.fn(), findOneByRefreshToken: jest.fn(), deleteOne: jest.fn() };
const oAuthRefreshTokensModel = { findOneByRefreshToken: jest.fn(), deleteOne: jest.fn() };
const usersModel = { findOne: jest.fn(), updateOne: jest.fn(), findOneActiveById: jest.fn() };

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

const refresh = () =>
	request(app)
		.post('/oauth/token')
		.type('form')
		.send({ grant_type: 'refresh_token', refresh_token: 'refresh-token', client_id: client.clientId, client_secret: client.clientSecret });

describe('OAuth2Server', () => {
	beforeAll(() => {
		mockModel('OAuthApps', oAuthAppsModel);
		mockModel('OAuthAuthCodes', oAuthAuthCodesModel);
		mockModel('OAuthAccessTokens', oAuthAccessTokensModel);
		mockModel('OAuthRefreshTokens', oAuthRefreshTokensModel);
		mockModel('Users', usersModel);
	});

	beforeEach(() => {
		jest.clearAllMocks();
		oAuthAppsModel.findOneActiveByClientId.mockResolvedValue(client as never);
		oAuthAppsModel.findOneActiveByClientIdAndClientSecret.mockImplementation(
			async (_clientId, clientSecret) => (clientSecret === client.clientSecret ? client : null) as never,
		);
		usersModel.findOne.mockResolvedValue({ _id: 'user-id' } as never);
		usersModel.findOneActiveById.mockResolvedValue({ _id: 'user-id' } as never);
		oAuthAccessTokensModel.findOneByRefreshToken.mockResolvedValue(null);
		oAuthAuthCodesModel.deleteOne.mockResolvedValue({ acknowledged: true, deletedCount: 1 });
		oAuthAccessTokensModel.insertOne.mockResolvedValue({ acknowledged: true, insertedId: 'token-id' });
	});

	describe('GET /oauth/authorize', () => {
		it.each([
			['a client id that is not a string', new URLSearchParams({ 'response_type': 'code', 'client_id[$ne]': 'none' }), client],
			['an unknown or inactive client', authorizeQuery, null],
		])('sends a request with %s to the error page', async (_case, query, foundClient) => {
			oAuthAppsModel.findOneActiveByClientId.mockResolvedValue(foundClient as never);

			const response = await request(app).get(`/oauth/authorize?${query}`);

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe('/oauth/error/404');
		});

		it('sends a request with a redirect URI that the client did not register to the invalid redirect page', async () => {
			const query = new URLSearchParams(authorizeQuery);
			query.set('redirect_uri', 'https://attacker.example/callback');

			const response = await request(app).get(`/oauth/authorize?${query}`);

			expect(response.status).toBe(302);
			expect(response.headers.location).toBe('/oauth/error/invalid_redirect_uri');
		});
	});

	describe('POST /oauth/authorize', () => {
		it.each([
			['the user denies consent', { allow: 'no', access_token: 'login-token' }, true],
			['the request has no login token', { allow: 'yes' }, true],
			['the login token belongs to no user', { allow: 'yes', access_token: 'login-token' }, false],
		])('answers 401 and issues no code when %s', async (_case, fields, userFound) => {
			usersModel.findOne.mockResolvedValue((userFound ? { _id: 'user-id' } : null) as never);

			const response = await request(app)
				.post(`/oauth/authorize?${authorizeQuery}`)
				.type('form')
				.send({ client_id: client.clientId, redirect_uri: client.redirectUri, response_type: 'code', ...fields });

			expect(response.status).toBe(401);
			expect(oAuthAuthCodesModel.upsertByAuthCode).not.toHaveBeenCalled();
			expect(usersModel.updateOne).not.toHaveBeenCalled();
		});

		it('accepts any of the redirect URIs that the client registered', async () => {
			oAuthAppsModel.findOneActiveByClientId.mockResolvedValue({
				...client,
				redirectUri: `https://other.example/callback,${client.redirectUri}`,
			} as never);

			const consentPage = await request(app).get(`/oauth/authorize?${authorizeQuery}`);
			const approval = await approve(authorizeQuery);

			expect(consentPage.headers.location).toBeUndefined();
			const location = new URL(approval.headers.location);
			expect(`${location.origin}${location.pathname}`).toBe(client.redirectUri);
		});

		it('records the client as authorized for the user who approves it', async () => {
			const response = await approve(authorizeQuery);

			expect(response.status).toBe(302);
			expect(usersModel.updateOne).toHaveBeenCalledWith({ _id: 'user-id' }, { $addToSet: { 'oauth.authorizedClients': client.clientId } });
		});

		it('issues no code for a redirect URI that the client did not register', async () => {
			const response = await request(app).post(`/oauth/authorize?${authorizeQuery}`).type('form').send({
				allow: 'yes',
				access_token: 'login-token',
				client_id: client.clientId,
				redirect_uri: 'https://attacker.example/callback',
				response_type: 'code',
			});

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({ error: 'invalid_client' });
			expect(oAuthAuthCodesModel.upsertByAuthCode).not.toHaveBeenCalled();
		});

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

		it('issues a token for a request that sends its parameters as query parameters', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode() as never);
			const query = new URLSearchParams({
				grant_type: 'authorization_code',
				code: 'auth-code',
				client_id: client.clientId,
				client_secret: client.clientSecret,
				redirect_uri: client.redirectUri,
			});

			const response = await request(app).post(`/oauth/token?${query}`);

			expect(response.status).toBe(200);
			expect(response.body).toMatchObject({ access_token: expect.any(String) });
		});

		it.each([
			['an unknown code', { client_secret: client.clientSecret }, null, 'Invalid authCode'],
			['a wrong client secret', { client_secret: 'wrong-secret' }, storedCode(), 'Invalid clientId'],
		])('refuses a token request with %s with a server error', async (_case, fields, foundCode, description) => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(foundCode as never);

			const response = await exchange(fields);

			expect(response.status).toBe(503);
			expect(response.body).toEqual({ error: 'server_error', error_description: description });
			expect(oAuthAccessTokensModel.insertOne).not.toHaveBeenCalled();
		});

		it('refuses an expired authorization code', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode({ expires: new Date(Date.now() - 1000) }) as never);

			const response = await exchange({ client_secret: client.clientSecret });

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({ error: 'invalid_grant' });
			expect(oAuthAccessTokensModel.insertOne).not.toHaveBeenCalled();
		});

		it('refuses the refresh token of a deactivated user with a server error', async () => {
			oAuthAccessTokensModel.findOneByRefreshToken.mockResolvedValue({
				refreshToken: 'refresh-token',
				clientId: client.clientId,
				userId: 'user-id',
				refreshTokenExpiresAt: new Date(Date.now() + 60_000),
			} as never);
			usersModel.findOneActiveById.mockResolvedValue(null);

			const response = await refresh();

			expect(response.status).toBe(503);
			expect(response.body).toEqual({ error: 'server_error', error_description: 'Invalid token' });
			expect(oAuthAccessTokensModel.insertOne).not.toHaveBeenCalled();
		});

		it('refreshes a legacy refresh token once and refuses it after that with a server error', async () => {
			const legacyTokens = new Map([
				[
					'refresh-token',
					{ refreshToken: 'refresh-token', clientId: client.clientId, userId: 'user-id', expires: new Date(Date.now() + 60_000) },
				],
			]);
			oAuthRefreshTokensModel.findOneByRefreshToken.mockImplementation(
				async (refreshToken: string) => legacyTokens.get(refreshToken) ?? null,
			);
			oAuthRefreshTokensModel.deleteOne.mockImplementation(async ({ refreshToken }: { refreshToken: string }) =>
				legacyTokens.delete(refreshToken),
			);

			const first = await refresh();
			const second = await refresh();

			expect(first.status).toBe(200);
			expect(first.body).toMatchObject({ access_token: expect.any(String), refresh_token: expect.any(String) });
			expect(second.status).toBe(503);
			expect(second.body).toEqual({ error: 'server_error', error_description: 'Invalid token' });
			expect(oAuthAccessTokensModel.insertOne).toHaveBeenCalledTimes(1);
		});

		it.each([
			['current', oAuthAccessTokensModel, { refreshTokenExpiresAt: new Date(Date.now() - 1000) }],
			['legacy', oAuthRefreshTokensModel, { expires: new Date(Date.now() - 1000) }],
		])('refuses an expired %s refresh token', async (_case, model, expiry) => {
			model.findOneByRefreshToken.mockResolvedValue({
				refreshToken: 'refresh-token',
				clientId: client.clientId,
				userId: 'user-id',
				...expiry,
			} as never);

			const response = await refresh();

			expect(response.status).toBe(400);
			expect(response.body).toMatchObject({ error: 'invalid_grant' });
			expect(oAuthAccessTokensModel.insertOne).not.toHaveBeenCalled();
		});

		it('keeps issuing tokens to clients that do not use PKCE', async () => {
			oAuthAuthCodesModel.findOneByAuthCode.mockResolvedValue(storedCode() as never);

			const response = await exchange({ client_secret: client.clientSecret });

			expect(response.status).toBe(200);
		});
	});
});

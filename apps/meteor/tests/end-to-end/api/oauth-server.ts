import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

async function authorizeAndExchange(loginToken: string, cId: string, cSecret: string, redirectUri: string) {
	const authRes = await request
		.post(`/oauth/authorize`)
		.type('form')
		.send({
			token: loginToken,
			client_id: cId,
			response_type: 'code',
			redirect_uri: redirectUri,
			state: 'test-state',
			allow: 'yes',
		})
		.expect(302);

	const location = new URL(authRes.headers.location);
	const code = location.searchParams.get('code') as string;

	const tokenRes = await request
		.post(`/oauth/token`)
		.type('form')
		.send({
			grant_type: 'authorization_code',
			code,
			client_id: cId,
			client_secret: cSecret,
			redirect_uri: redirectUri,
		})
		.expect(200);

	return { accessToken: tokenRes.body.access_token as string, refreshToken: tokenRes.body.refresh_token as string };
}

describe('[OAuth Server]', () => {
	let oAuthAppId: string;
	let clientId: string;
	let clientSecret: string;
	let code: string;
	let refreshToken: string;
	let accessToken: string;
	let refreshedAccessToken: string;
	const redirectUri = 'http://asd.com';

	before((done) => getCredentials(done));

	after(async () => {
		await request
			.post(api('oauth-apps.delete'))
			.set(credentials)
			.send({ appId: oAuthAppId })
			.expect('Content-Type', 'application/json')
			.expect(200);
	});

	describe('[/oauth-apps.create]', () => {
		it('should create the oauth app', async () => {
			const data = {
				name: 'api-test',
				redirectUri: 'http://test.com,http://asd.com',
				active: true,
			};

			await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send(data)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('application');
					expect(res.body.application).to.have.property('_id');
					expect(res.body.application).to.have.property('name', data.name);
					expect(res.body.application).to.have.property('redirectUri', data.redirectUri);
					expect(res.body.application).to.have.property('active', data.active);
					expect(res.body.application).to.have.property('clientId');
					expect(res.body.application).to.have.property('clientSecret');
					oAuthAppId = res.body.application._id;
					clientId = res.body.application.clientId;
					clientSecret = res.body.application.clientSecret;
				});
		});

		it('should authorize oauth to retrieve code', async () => {
			const params = new URLSearchParams({
				scope: 'user',
				response_type: 'token,code',
				response_mode: 'form_post',
				state: 'xus2t6ix57g',
			});

			await request
				.post(`/oauth/authorize?${params.toString()}`)
				.type('form')
				.send({
					token: credentials['X-Auth-Token'],
					client_id: clientId,
					response_type: 'code',
					redirect_uri: redirectUri,
					allow: 'yes',
				})
				.expect(302)
				.expect((res: Response) => {
					expect(res.headers).to.have.property('location');
					const location = new URL(res.headers.location);
					expect(location.origin).to.be.equal(redirectUri);
					expect(location.searchParams.get('code')).to.be.string;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					code = location.searchParams.get('code')!;
				});
		});

		it('should use code to retrieve access_token', async () => {
			await request
				.post(`/oauth/token`)
				.type('form')
				.send({
					grant_type: 'authorization_code',
					code,
					client_id: clientId,
					client_secret: clientSecret,
					redirect_uri: redirectUri,
				})
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('token_type', 'Bearer');
					expect(res.body).to.have.property('access_token');
					expect(res.body).to.have.property('expires_in');
					expect(res.body).to.have.property('refresh_token');
					accessToken = res.body.access_token;
					refreshToken = res.body.refresh_token;
				});
		});

		it('should return bad request if payload has non string parameters in refresh_token grant', async () => {
			await request
				.post(`/oauth/token`)
				.send({
					grant_type: 'refresh_token',
					client_id: { $ne: null },
					client_secret: { $ne: null },
					refresh_token: { $ne: null },
				})
				.expect((res: Response) => {
					expect(res.status).to.be.equal(400);
					expect(res.body).to.have.property('error').that.is.a('string').and.equal('invalid_request');
				});
		});

		it('should return bad request if payload has non string parameters in authorization_code grant', async () => {
			await request
				.post(`/oauth/token`)
				.send({
					grant_type: 'authorization_code',
					client_id: { $ne: null },
					client_secret: { $ne: null },
					code: { $ne: null },
					redirect_uri: { $ne: null },
				})
				.expect((res: Response) => {
					expect(res.status).to.be.equal(400);
					expect(res.body).to.have.property('error').that.is.a('string').and.equal('invalid_request');
				});
		});

		it('should be able to refresh the access_token', async () => {
			await request
				.post(`/oauth/token`)
				.type('form')
				.send({
					grant_type: 'refresh_token',
					refresh_token: refreshToken,
					client_id: clientId,
					client_secret: clientSecret,
				})
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('token_type', 'Bearer');
					expect(res.body).to.have.property('access_token').and.not.be.equal(accessToken);
					expect(res.body).to.have.property('expires_in');
					expect(res.body).to.have.property('refresh_token');
					refreshedAccessToken = res.body.access_token;
				});
		});

		it('should not be able to get user info with old access_token', async () => {
			await request.get(`/oauth/userinfo`).auth(accessToken, { type: 'bearer' }).expect(401);
		});

		it('should be able to get user info with refreshed access_token', async () => {
			await request
				.get(`/oauth/userinfo`)
				.auth(refreshedAccessToken, { type: 'bearer' })
				.expect('Content-Type', 'application/json; charset=utf-8')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('sub', 'rocketchat.internal.admin.test');
				});
		});
	});

	describe('[oauth credentials]', () => {
		let accessToken: string;

		before(() => {
			accessToken = refreshedAccessToken;
		});

		it('should be able to use oauth credentials to access v1 endpoints (/v1/me)', async () => {
			await request
				.get(api('me'))
				.auth(accessToken, { type: 'bearer' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('_id', 'rocketchat.internal.admin.test');
				});
		});

		it('should be able to use oauth credentials to access v1 endpoints (/v1/users.info)', async () => {
			await request
				.get(api('users.info'))
				.query({ username: 'rocketchat.internal.admin.test' })
				.auth(accessToken, { type: 'bearer' })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('user._id', 'rocketchat.internal.admin.test');
				});
		});

		const malformedTokenPayloads = [
			{ query: { 'access_token[$ne]': 'null' }, description: '$ne operator' },
			{ query: { 'access_token[$exists]': 'true' }, description: '$exists operator' },
			{ query: { 'access_token[$gt]': '' }, description: '$gt operator' },
			{ query: { 'access_token[$regex]': '.*' }, description: '$regex operator' },
			{ query: { access_token: 'invalid-token' }, description: 'invalid string token' },
		];

		malformedTokenPayloads.forEach(({ query, description }) => {
			it(`should reject access_token with ${description}`, async () => {
				await request
					.get(api('me'))
					.query(query)
					.expect('Content-Type', 'application/json')
					.expect(401)
					.expect((res: Response) => {
						expect(res.body).to.have.property('status', 'error');
						expect(res.body).to.have.property('message', 'You must be logged in to do this.');
					});
			});
		});
	});

	describe('[user deactivation revokes OAuth tokens]', () => {
		let testUser: Awaited<ReturnType<typeof createUser>>;
		let testUserCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
		let deactivationClientId: string;
		let deactivationClientSecret: string;
		let deactivationAppId: string;
		let userAccessToken: string;
		let userRefreshToken: string;
		const redirectUri = 'http://asd.com';

		before(async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);

			const appRes = await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({ name: 'deactivation-test-app', redirectUri: `http://test.com,${redirectUri}`, active: true })
				.expect(200);

			deactivationAppId = appRes.body.application._id;
			deactivationClientId = appRes.body.application.clientId;
			deactivationClientSecret = appRes.body.application.clientSecret;

			const tokens = await authorizeAndExchange(
				testUserCredentials['X-Auth-Token'],
				deactivationClientId,
				deactivationClientSecret,
				redirectUri,
			);
			userAccessToken = tokens.accessToken;
			userRefreshToken = tokens.refreshToken;

			// Verify tokens work before deactivation
			await request.get(api('me')).auth(userAccessToken, { type: 'bearer' }).expect(200);

			// Deactivate the user
			await request.post(api('users.setActiveStatus')).set(credentials).send({ userId: testUser._id, activeStatus: false }).expect(200);
		});

		after(async () => {
			await request.post(api('oauth-apps.delete')).set(credentials).send({ appId: deactivationAppId }).expect(200);
			await deleteUser(testUser);
		});

		it('should reject the access token after user deactivation', async () => {
			await request.get(api('me')).auth(userAccessToken, { type: 'bearer' }).expect(401);
		});

		it('should reject the access token on /oauth/userinfo after user deactivation', async () => {
			await request.get(`/oauth/userinfo`).auth(userAccessToken, { type: 'bearer' }).expect(401);
		});

		it('should reject the refresh token grant after user deactivation', async () => {
			await request
				.post(`/oauth/token`)
				.type('form')
				.send({
					grant_type: 'refresh_token',
					refresh_token: userRefreshToken,
					client_id: deactivationClientId,
					client_secret: deactivationClientSecret,
				})
				.expect((res: Response) => {
					expect(res.status).to.not.equal(200);
					expect(res.body).to.have.property('error');
					expect(res.body).to.not.have.property('access_token');
				});
		});

		it('should still reject the access token after user reactivation (token was deleted, not just blocked)', async () => {
			await request.post(api('users.setActiveStatus')).set(credentials).send({ userId: testUser._id, activeStatus: true }).expect(200);

			await request.get(api('me')).auth(userAccessToken, { type: 'bearer' }).expect(401);

			// Reactivated user can obtain new tokens via a fresh OAuth flow
			const reactivatedCredentials = await login(testUser.username, password);
			const newTokens = await authorizeAndExchange(
				reactivatedCredentials['X-Auth-Token'],
				deactivationClientId,
				deactivationClientSecret,
				redirectUri,
			);

			await request
				.get(api('me'))
				.auth(newTokens.accessToken, { type: 'bearer' })
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('_id', testUser._id);
				});
		});
	});

	describe('[users.deactivateIdle revokes OAuth tokens]', () => {
		let idleUser: Awaited<ReturnType<typeof createUser>>;
		let idleUserCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
		let idleClientId: string;
		let idleClientSecret: string;
		let idleAppId: string;
		let idleAccessToken: string;
		let idleRefreshToken: string;
		const redirectUri = 'http://asd.com';

		before(async () => {
			idleUser = await createUser();
			idleUserCredentials = await login(idleUser.username, password);

			const appRes = await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({ name: 'idle-deactivation-test-app', redirectUri: `http://test.com,${redirectUri}`, active: true })
				.expect(200);

			idleAppId = appRes.body.application._id;
			idleClientId = appRes.body.application.clientId;
			idleClientSecret = appRes.body.application.clientSecret;

			const tokens = await authorizeAndExchange(idleUserCredentials['X-Auth-Token'], idleClientId, idleClientSecret, redirectUri);
			idleAccessToken = tokens.accessToken;
			idleRefreshToken = tokens.refreshToken;

			// Verify tokens work before deactivation
			await request.get(api('me')).auth(idleAccessToken, { type: 'bearer' }).expect(200);

			// Deactivate via deactivateIdle using daysIdle=0 to catch all users with no recent login
			await request
				.post(api('users.deactivateIdle'))
				.set(credentials)
				.send({ daysIdle: 0, role: idleUser.roles?.[0] ?? 'user' })
				.expect(200);
		});

		after(async () => {
			await request.post(api('oauth-apps.delete')).set(credentials).send({ appId: idleAppId }).expect(200);
			await deleteUser(idleUser);
		});

		it('should reject the access token after idle deactivation', async () => {
			await request.get(api('me')).auth(idleAccessToken, { type: 'bearer' }).expect(401);
		});

		it('should reject the refresh token grant after idle deactivation', async () => {
			await request
				.post(`/oauth/token`)
				.type('form')
				.send({
					grant_type: 'refresh_token',
					refresh_token: idleRefreshToken,
					client_id: idleClientId,
					client_secret: idleClientSecret,
				})
				.expect((res: Response) => {
					expect(res.status).to.not.equal(200);
					expect(res.body).to.have.property('error');
					expect(res.body).to.not.have.property('access_token');
				});
		});
	});
});

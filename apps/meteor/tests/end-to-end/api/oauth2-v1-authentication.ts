import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';

/**
 * End-to-end tests to verify OAuth2 authentication works correctly with v1 API endpoints.
 * These tests ensure that the fix for third-party login maintains OAuth2 token authentication.
 */
describe('[OAuth2 v1 Endpoint Authentication]', () => {
	let oAuthAppId: string;
	let clientId: string;
	let clientSecret: string;
	let code: string;
	let accessToken: string;
	const redirectUri = 'http://localhost:3000';

	before((done) => getCredentials(done));

	after(async () => {
		if (oAuthAppId) {
			await request
				.post(api('oauth-apps.delete'))
				.set(credentials)
				.send({ appId: oAuthAppId })
				.expect('Content-Type', 'application/json')
				.expect(200);
		}
	});

	describe('OAuth2 Token Authentication Flow', () => {
		it('should create an OAuth app for testing', async () => {
			const data = {
				name: 'oauth2-v1-auth-test',
				redirectUri,
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
					expect(res.body.application).to.have.property('clientId');
					expect(res.body.application).to.have.property('clientSecret');
					oAuthAppId = res.body.application._id;
					clientId = res.body.application.clientId;
					clientSecret = res.body.application.clientSecret;
				});
		});

		it('should authorize OAuth to retrieve authorization code', async () => {
			const params = new URLSearchParams({
				scope: 'user',
				response_type: 'code',
				response_mode: 'form_post',
				state: 'test-state',
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
					expect(location.searchParams.get('code')).to.be.string;
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					code = location.searchParams.get('code')!;
				});
		});

		it('should exchange authorization code for access token', async () => {
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
				});
		});
	});

	describe('OAuth2 Token with v1 API Endpoints', () => {
		describe('GET endpoints with OAuth2 token in Authorization header', () => {
			it('should authenticate successfully for users.info endpoint', async () => {
				await request
					.get(api('users.info'))
					.auth(accessToken, { type: 'bearer' })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('user');
						expect(res.body.user).to.have.property('_id');
						expect(res.body.user).to.have.property('username');
					});
			});

			it('should authenticate successfully for me endpoint', async () => {
				await request
					.get(api('me'))
					.auth(accessToken, { type: 'bearer' })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('_id');
						expect(res.body).to.have.property('username');
					});
			});

			it('should authenticate successfully for users.list endpoint', async () => {
				await request
					.get(api('users.list'))
					.auth(accessToken, { type: 'bearer' })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('users');
						expect(res.body.users).to.be.an('array');
					});
			});

			it('should authenticate successfully for rooms.get endpoint', async () => {
				await request
					.get(api('rooms.get'))
					.auth(accessToken, { type: 'bearer' })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('update');
						expect(res.body).to.have.property('remove');
					});
			});

			it('should authenticate successfully for settings endpoint', async () => {
				await request
					.get(api('settings'))
					.auth(accessToken, { type: 'bearer' })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('settings');
					});
			});
		});

		describe('GET endpoints with OAuth2 token in query parameter', () => {
			it('should authenticate successfully for users.info with token in query', async () => {
				await request
					.get(api('users.info'))
					.query({ access_token: accessToken })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('user');
					});
			});

			it('should authenticate successfully for me with token in query', async () => {
				await request
					.get(api('me'))
					.query({ access_token: accessToken })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('_id');
					});
			});
		});

		describe('POST endpoints with OAuth2 token', () => {
			it('should authenticate successfully for channels.list endpoint', async () => {
				await request
					.get(api('channels.list'))
					.auth(accessToken, { type: 'bearer' })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('channels');
						expect(res.body.channels).to.be.an('array');
					});
			});

			it('should authenticate successfully for subscriptions.get endpoint', async () => {
				await request
					.get(api('subscriptions.get'))
					.auth(accessToken, { type: 'bearer' })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('update');
					});
			});
		});

		describe('Error cases', () => {
			it('should reject invalid OAuth2 token', async () => {
				await request.get(api('users.info')).auth('invalid-token', { type: 'bearer' }).expect(401);
			});

			it('should reject expired or malformed OAuth2 token', async () => {
				await request.get(api('users.info')).auth('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid', { type: 'bearer' }).expect(401);
			});

			it('should reject request without authentication when required', async () => {
				await request
					.get(api('users.list'))
					.expect(401)
					.expect((res: Response) => {
						expect(res.body).to.have.property('status', 'error');
					});
			});
		});

		describe('OAuth2 token with mixed query parameters', () => {
			it('should handle OAuth2 token with additional query params', async () => {
				await request
					.get(api('users.list'))
					.query({
						access_token: accessToken,
						count: 5,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('users');
						expect(res.body.users).to.be.an('array');
					});
			});

			it('should handle OAuth2 token in header with query params', async () => {
				await request
					.get(api('users.list'))
					.auth(accessToken, { type: 'bearer' })
					.query({
						count: 5,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('users');
					});
			});
		});
	});

	describe('OAuth2 vs Regular Auth Comparison', () => {
		it('should return the same user data for OAuth2 token and regular auth token', async () => {
			// Get user info with regular auth
			const regularAuthResponse = await request
				.get(api('users.info'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200);

			// Get user info with OAuth2 token
			const oauth2Response = await request
				.get(api('users.info'))
				.auth(accessToken, { type: 'bearer' })
				.expect('Content-Type', 'application/json')
				.expect(200);

			// Both should return the same user
			expect(oauth2Response.body.user._id).to.equal(regularAuthResponse.body.user._id);
			expect(oauth2Response.body.user.username).to.equal(regularAuthResponse.body.user.username);
		});

		it('should have same access level for OAuth2 token and regular auth', async () => {
			// Get rooms with regular auth
			const regularAuthResponse = await request.get(api('rooms.get')).set(credentials).expect(200);

			// Get rooms with OAuth2 token
			const oauth2Response = await request.get(api('rooms.get')).auth(accessToken, { type: 'bearer' }).expect(200);

			// Both should succeed
			expect(oauth2Response.body.success).to.equal(true);
			expect(regularAuthResponse.body.success).to.equal(true);
		});
	});
});

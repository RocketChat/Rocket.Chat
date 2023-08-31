import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[OAuth Server]', function () {
	this.retries(0);

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
});

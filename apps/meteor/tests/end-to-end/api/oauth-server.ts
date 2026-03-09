import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';

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
	});

	describe('[PKCE flow]', () => {
    let pkceAppId: string;
    let pkceClientId: string;
    let pkceClientSecret: string;
    let pkceCode: string;
    let pkceCodeVerifier: string;
    let pkceAccessToken: string;
    const pkceRedirectUri = 'http://asd.com';

    function generateCodeVerifier(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        for (let i = 0; i < 64; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    async function generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    after(async () => {
    if (pkceAppId) {
        await request.post(api('oauth-apps.delete')).set(credentials).send({ appId: pkceAppId }).expect(200);
    }
});

    it('should create oauth app for PKCE test', async () => {
        await request
            .post(api('oauth-apps.create'))
            .set(credentials)
            .send({ name: 'pkce-test-app', redirectUri: pkceRedirectUri, active: true })
            .expect(200)
            .expect((res: Response) => {
                expect(res.body).to.have.property('success', true);
                pkceAppId = res.body.application._id;
                pkceClientId = res.body.application.clientId;
                pkceClientSecret = res.body.application.clientSecret;
            });
    });

    it('should authorize with PKCE code_challenge and retrieve code', async () => {
        pkceCodeVerifier = generateCodeVerifier();
        const pkceCodeChallenge = await generateCodeChallenge(pkceCodeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            state: 'pkcetest123',
            code_challenge: pkceCodeChallenge,
            code_challenge_method: 'S256',
        });

        await request
            .post(`/oauth/authorize?${params.toString()}`)
            .type('form')
            .send({ token: credentials['X-Auth-Token'], client_id: pkceClientId, response_type: 'code', redirect_uri: pkceRedirectUri, allow: 'yes' })
            .expect(302)
            .expect((res: Response) => {
                const location = new URL(res.headers.location);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                pkceCode = location.searchParams.get('code')!;
                expect(pkceCode).to.be.a('string');
            });
    });

    it('should exchange code + code_verifier for access token', async () => {
        await request
            .post('/oauth/token')
            .type('form')
            .send({ grant_type: 'authorization_code', code: pkceCode, client_id: pkceClientId, client_secret: pkceClientSecret, redirect_uri: pkceRedirectUri, code_verifier: pkceCodeVerifier })
            .expect(200)
            .expect((res: Response) => {
                expect(res.body).to.have.property('access_token');
                pkceAccessToken = res.body.access_token;
            });
    });

    it('should access /oauth/userinfo with PKCE access token', async () => {
        await request.get('/oauth/userinfo').auth(pkceAccessToken, { type: 'bearer' }).expect(200);
    });
});
});

import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { updatePermission } from '../../data/permissions.helper';

describe('[OAuthApps]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/oauth-apps.list]', () => {
		it('should return an error when the user does not have the necessary permission', (done) => {
			updatePermission('manage-oauth-apps', []).then(() => {
				request
					.get(api('oauth-apps.list'))
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-allowed');
					})
					.end(done);
			});
		});
		it('should return an array of oauth apps', (done) => {
			updatePermission('manage-oauth-apps', ['admin']).then(() => {
				request
					.get(api('oauth-apps.list'))
					.set(credentials)
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('oauthApps').and.to.be.an('array');
					})
					.end(done);
			});
		});
	});

	describe('[/oauth-apps.get]', () => {
		it('should return a single oauthApp by id', (done) => {
			request
				.get(api('oauth-apps.get?appId=zapier'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal('zapier');
				})
				.end(done);
		});
		it('should return a single oauthApp by client id', (done) => {
			request
				.get(api('oauth-apps.get?clientId=zapier'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal('zapier');
				})
				.end(done);
		});
	});

	describe('[/oauth-apps.create]', () => {
		it('should return an error when the user does not have the necessary permission', async () => {
			await updatePermission('manage-oauth-apps', []);

			await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name: 'error',
					redirectUri: 'error',
					active: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(403);
			await updatePermission('manage-oauth-apps', ['admin']);
		});

		it("should return an error when the 'name' property is invalid", async () => {
			await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name: '',
					redirectUri: 'error',
					active: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-name');
				});
		});

		it("should return an error when the 'redirectUri' property is invalid", async () => {
			await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name: 'error',
					redirectUri: '',
					active: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-redirectUri');
				});
		});

		it("should return an error when the 'active' property is not a boolean", async () => {
			await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name: 'error',
					redirectUri: 'error',
					active: 'anything',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				});
		});

		it('should create an oauthApp', async () => {
			const name = `new app ${Date.now()}`;
			const redirectUri = 'http://localhost:3000';
			const active = true;

			await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name,
					redirectUri,
					active,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('application.name', name);
					expect(res.body).to.have.nested.property('application.redirectUri', redirectUri);
					expect(res.body).to.have.nested.property('application.active', active);
				});
		});
	});

	describe('[/oauth-apps.update]', () => {
		let appId;

		before((done) => {
			const name = 'test-oauth-app';
			const redirectUri = 'https://test.com';
			const active = true;
			request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name,
					redirectUri,
					active,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.end((err, res) => {
					appId = res.body.application._id;
					done();
				});
		});

		it("should update an app's name, its Active and Redirect URI fields correctly by its id", async () => {
			const name = `new app ${Date.now()}`;
			const redirectUri = 'http://localhost:3000';
			const active = false;

			await request
				.post(api(`oauth-apps.update`))
				.set(credentials)
				.send({
					appId,
					name,
					redirectUri,
					active,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('active', active);
					expect(res.body).to.have.property('redirectUri', redirectUri);
					expect(res.body).to.have.property('name', name);
				});
		});
	});

	describe('[/oauth-apps.delete]', () => {
		let appId;

		before((done) => {
			const name = 'test-oauth-app';
			const redirectUri = 'https://test.com';
			const active = true;
			request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name,
					redirectUri,
					active,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.end((err, res) => {
					appId = res.body.application._id;
					done();
				});
		});

		it('should delete an app by its id', async () => {
			await request
				.post(api(`oauth-apps.delete`))
				.set(credentials)
				.send({
					appId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.equals(true);
				});
		});
	});
});

import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { updatePermission } from '../../data/permissions.helper.js';

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

	describe('[/oauth-apps.create]', function () {
		it('should return an error when the user does not have the necessary permission', async function () {
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
				.expect(400)
				.expect((res) => {
					console.log('res.body ->', res.body);
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				});

			await updatePermission('manage-oauth-apps', ['admin']);
		});

		it("should return an error when the 'name' property is invalid", async function () {
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

		it("should return an error when the 'redirectUri' property is invalid", async function () {
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

		it("should return an error when the 'active' property is not a boolean", async function () {
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

		it('should create an oauthApp', async function () {
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
});

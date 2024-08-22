import type { IOAuthApps } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';

describe('[OAuthApps]', () => {
	const createdAppsIds: IOAuthApps['_id'][] = [];

	before((done) => getCredentials(done));

	after(() =>
		Promise.all([
			updatePermission('manage-oauth-apps', ['admin']),
			...createdAppsIds.map((appId) =>
				request.post(api(`oauth-apps.delete`)).set(credentials).send({
					appId,
				}),
			),
		]),
	);

	describe('[/oauth-apps.list]', () => {
		it('should return an error when the user does not have the necessary permission', (done) => {
			void updatePermission('manage-oauth-apps', []).then(() => {
				void request
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
			void updatePermission('manage-oauth-apps', ['admin']).then(() => {
				void request
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
		before(() => updatePermission('manage-oauth-apps', ['admin']));
		after(() => updatePermission('manage-oauth-apps', ['admin']));

		it('should return a single oauthApp by id', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ appId: 'zapier' })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal('zapier');
					expect(res.body.oauthApp).to.have.property('clientSecret');
				});
		});
		it('should return a single oauthApp by client id', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ clientId: 'zapier' })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal('zapier');
					expect(res.body.oauthApp).to.have.property('clientSecret');
				});
		});
		it('should return only non sensitive information if user does not have the permission to manage oauth apps when searching by clientId', async () => {
			await updatePermission('manage-oauth-apps', []);
			await request
				.get(api('oauth-apps.get'))
				.query({ clientId: 'zapier' })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal('zapier');
					expect(res.body.oauthApp.clientId).to.be.equal('zapier');
					expect(res.body.oauthApp).to.not.have.property('clientSecret');
				});
		});
		it('should return only non sensitive information if user does not have the permission to manage oauth apps when searching by appId', async () => {
			await updatePermission('manage-oauth-apps', []);
			await request
				.get(api('oauth-apps.get'))
				.query({ appId: 'zapier' })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal('zapier');
					expect(res.body.oauthApp.clientId).to.be.equal('zapier');
					expect(res.body.oauthApp).to.not.have.property('clientSecret');
				});
		});
		it('should fail returning an oauth app when an invalid id is provided (avoid NoSQL injections)', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ _id: '{ "$ne": "" }' })
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'OAuth app not found.');
				});
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
					createdAppsIds.push(res.body.application._id);
				});
		});
	});

	describe('[/oauth-apps.update]', () => {
		let appId: IOAuthApps['_id'];

		before((done) => {
			const name = 'test-oauth-app';
			const redirectUri = 'https://test.com';
			const active = true;
			void request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name,
					redirectUri,
					active,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.end((_err, res) => {
					appId = res.body.application._id;
					createdAppsIds.push(appId);
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
		let appId: IOAuthApps['_id'];

		before((done) => {
			const name = 'test-oauth-app';
			const redirectUri = 'https://test.com';
			const active = true;
			void request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name,
					redirectUri,
					active,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.end((_err, res) => {
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

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
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
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
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
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

	describe('[/oauth-apps.get]', () => {
		let clientId = '';
		let _id = '';
		let clientSecret = '';

		before(async () => {
			await updatePermission('manage-oauth-apps', ['admin']);

			const res = await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name: `new app ${Date.now()}`,
					redirectUri: 'http://localhost:3000',
					active: true,
				});

			if (res.statusCode !== 200 || !res.body?.success || !res.body.application?._id || !res.body.application?.clientId) {
				console.error(res);
				throw new Error('Failed to create oauth app for tests');
			}

			clientId = res.body.application.clientId;
			_id = res.body.application._id;
			clientSecret = res.body.application.clientSecret;
			createdAppsIds.push(_id);
		});
		after(() => updatePermission('manage-oauth-apps', ['admin']));

		it('should return a single oauthApp by client id', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ clientId })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal(_id);
					expect(res.body.oauthApp).to.have.property('clientSecret');

					if (clientSecret) {
						expect(res.body.oauthApp.clientSecret).to.be.equal(clientSecret);
					}
				});
		});

		it('should return a single oauthApp by _id', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ _id })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal(_id);
					expect(res.body.oauthApp.clientId).to.be.equal(clientId);
					expect(res.body.oauthApp).to.have.property('clientSecret');
					if (clientSecret) {
						expect(res.body.oauthApp.clientSecret).to.be.equal(clientSecret);
					}
				});
		});

		it('should return a single oauthApp by appId (deprecated)', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ appId: _id })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal(_id);
					expect(res.body.oauthApp.clientId).to.be.equal(clientId);
					expect(res.body.oauthApp).to.have.property('clientSecret');
					if (clientSecret) {
						expect(res.body.oauthApp.clientSecret).to.be.equal(clientSecret);
					}
				});
		});

		it('should return only non sensitive information if user does not have the permission to manage oauth apps when searching by clientId', async () => {
			await updatePermission('manage-oauth-apps', []);
			await request
				.get(api('oauth-apps.get'))
				.query({ clientId })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal(_id);
					expect(res.body.oauthApp.clientId).to.be.equal(clientId);
					expect(res.body.oauthApp).to.not.have.property('clientSecret');
				});
		});

		it('should return only non sensitive information if user does not have the permission to manage oauth apps when searching by _id', async () => {
			await updatePermission('manage-oauth-apps', []);
			await request
				.get(api('oauth-apps.get'))
				.query({ _id })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal(_id);
					expect(res.body.oauthApp.clientId).to.be.equal(clientId);
					expect(res.body.oauthApp).to.not.have.property('clientSecret');
				});
		});

		it('should return only non sensitive information if user does not have the permission to manage oauth apps when searching by appId (deprecated)', async () => {
			await updatePermission('manage-oauth-apps', []);
			await request
				.get(api('oauth-apps.get'))
				.query({ appId: _id })
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('oauthApp');
					expect(res.body.oauthApp._id).to.be.equal(_id);
					expect(res.body.oauthApp.clientId).to.be.equal(clientId);
					expect(res.body.oauthApp).to.not.have.property('clientSecret');
				});
		});

		it('should fail returning an oauth app when an invalid id is provided (avoid NoSQL injections)', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ _id: { $ne: '' } })
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.include('must be string').and.include('must match exactly one schema in oneOf [invalid-params]');
				});
		});

		it('should fail returning an oauth app when an invalid id string is provided (avoid NoSQL injections)', () => {
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

		it('should fail returning an oauth app when an invalid clientId is provided (avoid NoSQL injections)', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ clientId: { $ne: '' } })
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.include('must be string').and.include('must match exactly one schema in oneOf [invalid-params]');
				});
		});

		it('should fail returning an oauth app when an invalid clientId string is provided (avoid NoSQL injections)', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ clientId: '{ "$ne": "" }' })
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'OAuth app not found.');
				});
		});

		it('should fail returning an oauth app when an invalid appId is provided (avoid NoSQL injections; deprecated)', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ appId: { $ne: '' } })
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
					expect(res.body.error).to.include('must be string').and.include('must match exactly one schema in oneOf [invalid-params]');
				});
		});

		it('should fail returning an oauth app when an invalid appId string is provided (avoid NoSQL injections; deprecated)', () => {
			return request
				.get(api('oauth-apps.get'))
				.query({ appId: '{ "$ne": "" }' })
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'OAuth app not found.');
				});
		});
	});

	describe('[/oauth-apps.update]', () => {
		let appId: IOAuthApps['_id'];

		before(async () => {
			await updatePermission('manage-oauth-apps', ['admin']);
			const name = 'test-oauth-app';
			const redirectUri = 'https://test.com';
			const active = true;
			const res = await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name,
					redirectUri,
					active,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			appId = res.body.application._id;
			createdAppsIds.push(appId);
		});

		after(async () => {
			await updatePermission('manage-oauth-apps', ['admin']);
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

		it('should fail updating an app if user does NOT have the manage-oauth-apps permission', async () => {
			const name = `new app ${Date.now()}`;
			const redirectUri = 'http://localhost:3000';
			const active = false;

			await updatePermission('manage-oauth-apps', []);
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
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('[/oauth-apps.delete]', () => {
		let appId: IOAuthApps['_id'];

		before(async () => {
			await updatePermission('manage-oauth-apps', ['admin']);
			const name = 'test-oauth-app';
			const redirectUri = 'https://test.com';
			const active = true;
			const res = await request
				.post(api('oauth-apps.create'))
				.set(credentials)
				.send({
					name,
					redirectUri,
					active,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
			appId = res.body.application._id;
		});

		after(async () => {
			await updatePermission('manage-oauth-apps', ['admin']);
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

		it('should fail deleting an app by its id if user does NOT have the manage-oauth-apps permission', async () => {
			await updatePermission('manage-oauth-apps', []);
			await request
				.post(api(`oauth-apps.delete`))
				.set(credentials)
				.send({
					appId,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});
});

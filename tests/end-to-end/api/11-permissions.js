/* eslint-env mocha */
/* globals expect */

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Permissions]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	//DEPRECATED
	// TODO: Remove this after three versions have been released. That means at 0.69 this should be gone.
	describe('[/permissions]', () => {
		it('should return all permissions that exists on the server, with respective roles', (done) => {
			request.get(api('permissions'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.be.a('array');

					const firstElement = res.body[0];
					expect(firstElement).to.have.property('_id');
					expect(firstElement).to.have.property('roles').and.to.be.a('array');
					expect(firstElement).to.have.property('_updatedAt');
				})
				.end(done);
		});
	});

	describe('[/permissions.list]', () => {
		it('should return all permissions that exists on the server, with respective roles', (done) => {
			request.get(api('permissions.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('permissions');

					const firstElement = res.body.permissions[0];
					expect(firstElement).to.have.property('_id');
					expect(firstElement).to.have.property('roles').and.to.be.a('array');
					expect(firstElement).to.have.property('_updatedAt');
				})
				.end(done);
		});
	});

	describe('[/permissions.update]', () => {
		it('should change the permissions on the server', (done) => {
			const permissions = [
				{
					'_id': 'add-oauth-service',
					'roles': ['admin', 'user']
				}
			];
			request.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions	})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('permissions');

					const firstElement = res.body.permissions[0];
					expect(firstElement).to.have.property('_id');
					expect(firstElement).to.have.property('roles').and.to.be.a('array');
					expect(firstElement).to.have.property('_updatedAt');
				})
				.end(done);
		});
		it('should 400 when trying to set an unknown permission', (done) => {
			const permissions = [
				{
					'_id': 'this-permission-does-not-exist',
					'roles': ['admin']
				}
			];
			request.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions	})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should 400 when trying to assign a permission to an unknown role', (done) => {
			const permissions = [
				{
					'_id': 'add-oauth-service',
					'roles': ['this-role-does-not-exist']
				}
			];
			request.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions	})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should 400 when trying to set permissions to a string', (done) => {
			const permissions = '';
			request.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions	})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});
});

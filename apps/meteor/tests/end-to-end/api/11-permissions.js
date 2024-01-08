import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[Permissions]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/permissions.listAll]', () => {
		it('should return an array with update and remove properties', (done) => {
			request
				.get(api('permissions.listAll'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('update').and.to.be.an('array');
					expect(res.body).to.have.property('remove').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an array with update and remov properties when search by "updatedSince" query parameter', (done) => {
			request
				.get(api('permissions.listAll?updatedSince=2018-11-27T13:52:01Z'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('update').and.to.be.an('array');
					expect(res.body).to.have.property('remove').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return an error when updatedSince query parameter is not a valid ISODate string', (done) => {
			request
				.get(api('permissions.listAll?updatedSince=fsafdf'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('[/permissions.update]', () => {
		it('should change the permissions on the server', (done) => {
			const permissions = [
				{
					_id: 'add-oauth-service',
					roles: ['admin', 'user'],
				},
			];
			request
				.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions })
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
					_id: 'this-permission-does-not-exist',
					roles: ['admin'],
				},
			];
			request
				.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions })
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
					_id: 'add-oauth-service',
					roles: ['this-role-does-not-exist'],
				},
			];
			request
				.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should 400 when trying to set permissions to a string', (done) => {
			const permissions = '';
			request
				.post(api('permissions.update'))
				.set(credentials)
				.send({ permissions })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});
});

import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import type { TestUser } from '../../data/users.helper.js';

describe('[Permissions]', () => {
	before((done) => getCredentials(done));

	after(() => updatePermission('add-oauth-service', ['admin']));

	describe('[/permissions.listAll]', () => {
		it('should return an array with update and remove properties', (done) => {
			void request
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
			void request
				.get(api('permissions.listAll'))
				.query({ updatedSince: '2018-11-27T13:52:01Z' })
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
			void request
				.get(api('permissions.listAll'))
				.query({ updatedSince: 'fsafdf' })
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
		let testUser: TestUser<IUser>;
		let testUserCredentials: Credentials;
		before(async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
			await updatePermission('access-permissions', ['admin']);
		});

		after(async () => {
			await updatePermission('access-permissions', ['admin']);
			await deleteUser(testUser);
		});

		it('should change the permissions on the server', (done) => {
			const permissions = [
				{
					_id: 'add-oauth-service',
					roles: ['admin', 'user'],
				},
			];
			void request
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
			void request
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
			void request
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
			void request
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
		it('should fail updating permission if user does NOT have the access-permissions permission', async () => {
			const permissions = [
				{
					_id: 'add-oauth-service',
					roles: ['admin', 'user'],
				},
			];
			await request
				.post(api('permissions.update'))
				.set(testUserCredentials)
				.send({ permissions })
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});
});

import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';
import { password, adminUsername } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Roles]', function () {
	this.retries(0);
	const isEnterprise = Boolean(process.env.IS_EE);

	before((done) => getCredentials(done));

	describe.skip('[/roles.create]', () => {
		const testRoleName = `role.test.${Date.now()}`;
		it('should throw an error when not running EE to create a role', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (isEnterprise) {
				this.skip();
				return;
			}
			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'This is an enterprise feature [error-action-not-allowed]');
					expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
				});
		});

		it('should successfully create a role in EE', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}
			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', testRoleName);
				});
		});
	});

	describe('[/roles.update]', () => {
		const testRoleName = `role.test.${Date.now()}`;
		const newTestRoleName = `role.test.updated.${Date.now()}`;
		let testRoleId = '';

		before('Create a new role with Users scope', async () => {
			if (!isEnterprise) {
				return;
			}

			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', testRoleName);
					testRoleId = res.body.role._id;
				});
		});

		after(async () => {
			if (!isEnterprise) {
				return;
			}
			await request.post(api('roles.delete')).set(credentials).send({
				roleId: testRoleId,
			});
		});

		it('should throw an error when not running EE to update a role', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (isEnterprise) {
				this.skip();
				return;
			}
			await request
				.post(api('roles.update'))
				.set(credentials)
				.send({
					name: testRoleName,
					roleId: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'This is an enterprise feature [error-action-not-allowed]');
					expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
				});
		});

		it('should successfully update a role in EE', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.update'))
				.set(credentials)
				.send({
					name: newTestRoleName,
					roleId: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', newTestRoleName);
				});
		});
	});

	describe('[/roles.getUsersInRole]', () => {
		let testUser: IUser;
		let testUserCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
		const testRoleName = `role.getUsersInRole.${Date.now()}`;
		let testRoleId = '';

		before(async () => {
			await updatePermission('access-permissions', ['admin']);
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);

			if (!isEnterprise) {
				return;
			}

			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', testRoleName);
					testRoleId = res.body.role._id;
				});
		});

		after(async () => {
			await deleteUser(testUser);
			if (!isEnterprise) {
				return;
			}

			await request.post(api('roles.delete')).set(credentials).send({
				roleId: testRoleId,
			});
		});

		it('should successfully get an empty list of users in a role if no user has been assigned to it', async function () {
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.get(api('roles.getUsersInRole'))
				.set(credentials)
				.query({
					role: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('total', 0);
					expect(res.body).to.have.property('users').that.is.an('array').that.is.empty;
				});
		});

		it('should successfully get a list of users in a role', async function () {
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.addUserToRole'))
				.set(credentials)
				.send({
					roleId: testRoleId,
					username: adminUsername,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('roles.getUsersInRole'))
				.set(credentials)
				.query({
					role: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('total', 1);
					expect(res.body).to.have.property('users').that.is.an('array').of.length(1);
					expect(res.body.users[0]).to.have.property('_id', credentials['X-User-Id']);
				});
		});

		it('should fail getting a list of users in a role in case an invalid role is provided', async function () {
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.get(api('roles.getUsersInRole'))
				.set(credentials)
				.query({
					role: 'invalid-role',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-roleId');
				});
		});

		it('should fail when user does NOT have the access-permissions permission', async () => {
			await request
				.get(api('roles.getUsersInRole'))
				.set(testUserCredentials)
				.query({
					role: 'admin',
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});
	});

	describe('[/roles.delete]', () => {
		let testUser: IUser;
		let testUserCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
		const testRoleName = `role.delete.${Date.now()}`;
		let testRoleId = '';

		before(async () => {
			if (!isEnterprise) {
				return;
			}

			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
			await updatePermission('access-permissions', ['admin']);
			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', testRoleName);
					testRoleId = res.body.role._id;
				});
		});

		after(async () => {
			if (!isEnterprise) {
				return;
			}
			await deleteUser(testUser);
		});

		it('should fail deleting a role when user does NOT have the access-permissions permission', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.delete'))
				.set(testUserCredentials)
				.send({
					roleId: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('should fail deleting a role in EE in case an invalid role is provided', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.delete'))
				.set(credentials)
				.send({
					roleId: 'invalid-role',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-roleId');
					expect(res.body).to.have.property('error', 'This role does not exist [error-invalid-roleId]');
				});
		});

		it('should successfully delete a role in EE', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.delete'))
				.set(credentials)
				.send({
					roleId: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});

	describe('[/roles.removeUserFromRole]', () => {
		let testUser: IUser;
		let testUserCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
		const testRoleName = `role.removeUsersFromRole.${Date.now()}`;
		let testRoleId = '';

		before(async () => {
			await updatePermission('access-permissions', ['admin']);
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
			if (!isEnterprise) {
				return;
			}

			await request
				.post(api('roles.create'))
				.set(credentials)
				.send({
					name: testRoleName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('role');
					expect(res.body.role).to.have.property('name', testRoleName);
					testRoleId = res.body.role._id;
				});
			await request
				.post(api('roles.addUserToRole'))
				.set(credentials)
				.send({
					roleId: testRoleId,
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		after(async () => {
			await request.post(api('roles.delete')).set(credentials).send({
				roleId: testRoleId,
			});
			await deleteUser(testUser);
		});

		it('should fail removing a user from a role when user does NOT have the access-permissions permission', async () => {
			await request
				.post(api('roles.removeUserFromRole'))
				.set(testUserCredentials)
				.send({
					roleId: testRoleId,
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('should fail removing an invalid user from a role', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.removeUserFromRole'))
				.set(credentials)
				.send({
					roleId: testRoleId,
					username: 'invalid-username',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-user');
					expect(res.body).to.have.property('error', 'There is no user with this username [error-invalid-user]');
				});
		});

		it('should fail removing a user from an invalid role', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.removeUserFromRole'))
				.set(credentials)
				.send({
					roleId: 'invalid-role',
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-roleId');
					expect(res.body).to.have.property('error', 'This role does not exist [error-invalid-roleId]');
				});
		});

		it('should fail removing a user from a role they do not have', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.removeUserFromRole'))
				.set(credentials)
				.send({
					roleId: 'admin',
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-user-not-in-role');
					expect(res.body).to.have.property('error', 'User is not in this role [error-user-not-in-role]');
				});
		});

		it('should successfully remove a user from a role', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!isEnterprise) {
				this.skip();
				return;
			}

			await request
				.post(api('roles.removeUserFromRole'))
				.set(credentials)
				.send({
					roleId: testRoleId,
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
				});
			await request
				.get(api('roles.getUsersInRole'))
				.set(credentials)
				.query({
					role: testRoleId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('total', 0);
					expect(res.body).to.have.property('users');
					expect(res.body.users).to.be.an('array').that.is.empty;
				});
		});
	});
});

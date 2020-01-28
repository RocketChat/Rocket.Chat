import {
	getCredentials,
	api,
	request,
	credentials,
	group,
	login,
	apiRoleNameUsers,
	apiRoleNameSubscriptions,
	apiRoleScopeUsers,
	apiRoleDescription,
	apiRoleScopeSubscriptions,
} from '../../data/api-data.js';
import { password } from '../../data/user';
import { updatePermission } from '../../data/permissions.helper';
import { createUser, login as doLogin } from '../../data/users.helper';

describe('[Roles]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('GET [/roles.list]', () => {
		it('should return all roles', (done) => {
			request.get(api('roles.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('roles').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('POST [/roles.create]', () => {
		it('should create a new role with Users scope', (done) => {
			request.post(api('roles.create'))
				.set(credentials)
				.send({
					name: apiRoleNameUsers,
					description: apiRoleDescription,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('role._id', apiRoleNameUsers);
					expect(res.body).to.have.nested.property('role.name', apiRoleNameUsers);
					expect(res.body).to.have.nested.property('role.scope', apiRoleScopeUsers);
					expect(res.body).to.have.nested.property('role.description', apiRoleDescription);
				})
				.end(done);
		});

		it('should create a new role with Subscriptions scope', (done) => {
			request.post(api('roles.create'))
				.set(credentials)
				.send({
					name: apiRoleNameSubscriptions,
					scope: apiRoleScopeSubscriptions,
					description: apiRoleDescription,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('role._id', apiRoleNameSubscriptions);
					expect(res.body).to.have.nested.property('role.name', apiRoleNameSubscriptions);
					expect(res.body).to.have.nested.property('role.scope', apiRoleScopeSubscriptions);
					expect(res.body).to.have.nested.property('role.description', apiRoleDescription);
				})
				.end(done);
		});
	});

	describe('POST [/roles.addUserToRole]', () => {
		it('should assign a role with User scope to an user', (done) => {
			request.post(api('roles.addUserToRole'))
				.set(credentials)
				.send({
					roleName: apiRoleNameUsers,
					username: login.user,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('role._id', apiRoleNameUsers);
					expect(res.body).to.have.nested.property('role.name', apiRoleNameUsers);
					expect(res.body).to.have.nested.property('role.scope', apiRoleScopeUsers);
				})
				.end(done);
		});

		it('should assign a role with Subscriptions scope to an user', (done) => {
			request.post(api('roles.addUserToRole'))
				.set(credentials)
				.send({
					roleName: apiRoleNameSubscriptions,
					username: login.user,
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('role._id', apiRoleNameSubscriptions);
					expect(res.body).to.have.nested.property('role.name', apiRoleNameSubscriptions);
					expect(res.body).to.have.nested.property('role.scope', apiRoleScopeSubscriptions);
				})
				.end(done);
		});
	});

	describe('GET [/roles.getUsersInRole]', () => {
		let userCredentials;
		before((done) => {
			createUser().then((createdUser) => {
				doLogin(createdUser.username, password).then((createdUserCredentials) => {
					userCredentials = createdUserCredentials;
					updatePermission('access-permissions', ['admin', 'user']).then(done);
				});
			});
		});
		it('should return an error when "role" query param is not provided', (done) => {
			request.get(api('roles.getUsersInRole'))
				.set(userCredentials)
				.query({
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.errorType).to.be.equal('error-param-not-provided');
				})
				.end(done);
		});
		it('should return an error when the user does not the necessary permission', (done) => {
			updatePermission('access-permissions', ['admin']).then(() => {
				request.get(api('roles.getUsersInRole'))
					.set(userCredentials)
					.query({
						role: 'admin',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.errorType).to.be.equal('error-not-allowed');
					})
					.end(done);
			});
		});
		it('should return an error when the user try access rooms permissions and does not have the necessary permission', (done) => {
			updatePermission('access-permissions', ['admin', 'user']).then(() => {
				updatePermission('view-other-user-channels', []).then(() => {
					request.get(api('roles.getUsersInRole'))
						.set(userCredentials)
						.query({
							role: 'admin',
							roomId: 'GENERAL',
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.errorType).to.be.equal('error-not-allowed');
						})
						.end(done);
				});
			});
		});
		it('should return the list of users', (done) => {
			updatePermission('access-permissions', ['admin', 'user']).then(() => {
				updatePermission('view-other-user-channels', ['admin', 'user']).then(() => {
					request.get(api('roles.getUsersInRole'))
						.set(userCredentials)
						.query({
							role: 'admin',
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.users).to.be.an('array');
						})
						.end(done);
				});
			});
		});
		it('should return the list of users when find by room Id', (done) => {
			request.get(api('roles.getUsersInRole'))
				.set(userCredentials)
				.query({
					role: 'admin',
					roomId: 'GENERAL',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.users).to.be.an('array');
				})
				.end(done);
		});
	});
});

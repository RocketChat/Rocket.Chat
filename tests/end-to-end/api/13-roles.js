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
});

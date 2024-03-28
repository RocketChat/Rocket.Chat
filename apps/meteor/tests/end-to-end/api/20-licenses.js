import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('licenses', function () {
	let createdUser;
	this.retries(0);

	before((done) => getCredentials(done));
	let unauthorizedUserCredentials;

	before(async () => {
		createdUser = await createUser();
		unauthorizedUserCredentials = await login(createdUser.username, password);
	});

	after(() => deleteUser(createdUser));

	describe('[/licenses.add]', () => {
		it('should fail if not logged in', (done) => {
			request
				.post(api('licenses.add'))
				.send({
					license: '',
				})
				.unauthorized()
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if user is unauthorized', (done) => {
			request
				.post(api('licenses.add'))
				.set(unauthorizedUserCredentials)
				.send({
					license: '',
				})
				.forbidden()
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				})
				.end(done);
		});

		it('should fail if license is invalid', (done) => {
			request
				.post(api('licenses.add'))
				.set(credentials)
				.send({
					license: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
	});

	describe('[/licenses.get]', () => {
		it('should fail if not logged in', (done) => {
			request
				.get(api('licenses.get'))
				.unauthorized()
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if user is unauthorized', (done) => {
			request
				.get(api('licenses.get'))
				.set(unauthorizedUserCredentials)
				.forbidden()
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				})
				.end(done);
		});

		it('should return licenses if user is logged in and is authorized', (done) => {
			request
				.get(api('licenses.get'))
				.set(credentials)
				.success()
				.expect((res) => {
					expect(res.body).to.have.property('licenses').and.to.be.an('array');
				})

				.end(done);
		});
	});

	describe('[/licenses.info]', () => {
		it('should fail if not logged in', (done) => {
			request
				.get(api('licenses.info'))
				.unauthorized()
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return limited information if user is unauthorized', (done) => {
			request
				.get(api('licenses.info'))
				.set(unauthorizedUserCredentials)
				.success()
				.expect((res) => {
					expect(res.body).to.have.property('license').and.to.be.an('object');
					expect(res.body.license).to.not.have.property('license');
					expect(res.body.license).to.have.property('tags').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return unrestricted info if user is logged in and is authorized', (done) => {
			request
				.get(api('licenses.info'))
				.set(credentials)
				.success()
				.expect((res) => {
					expect(res.body).to.have.property('license').and.to.be.an('object');
					if (process.env.IS_EE) {
						expect(res.body.license).to.have.property('license').and.to.be.an('object');
					}
					expect(res.body.license).to.have.property('tags').and.to.be.an('array');
				})

				.end(done);
		});
	});

	describe('[/licenses.isEnterprise]', () => {
		it('should fail if not logged in', (done) => {
			request
				.get(api('licenses.isEnterprise'))
				.unauthorized()
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should pass if user has user role', (done) => {
			request
				.get(api('licenses.isEnterprise'))
				.set(unauthorizedUserCredentials)
				.success()
				.expect((res) => {
					expect(res.body).to.have.property('isEnterprise', Boolean(process.env.IS_EE));
				})
				.end(done);
		});

		it('should pass if user has admin role', (done) => {
			request
				.get(api('licenses.isEnterprise'))
				.set(credentials)
				.success()
				.expect((res) => {
					expect(res.body).to.have.property('isEnterprise', Boolean(process.env.IS_EE));
				})
				.end(done);
		});
	});
});

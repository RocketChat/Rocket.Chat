import type { Credentials } from '@rocket.chat/api-client';
import type { IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('licenses', () => {
	let createdUser: TestUser<IUser>;

	before((done) => getCredentials(done));
	let unauthorizedUserCredentials: Credentials;

	before(async () => {
		createdUser = await createUser();
		unauthorizedUserCredentials = await login(createdUser.username, password);
	});

	after(() => deleteUser(createdUser));

	describe('[/licenses.add]', () => {
		it('should fail if not logged in', (done) => {
			void request
				.post(api('licenses.add'))
				.send({
					license: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if user is unauthorized', (done) => {
			void request
				.post(api('licenses.add'))
				.set(unauthorizedUserCredentials)
				.send({
					license: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				})
				.end(done);
		});

		it('should fail if license is invalid', (done) => {
			void request
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
			void request
				.get(api('licenses.get'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if user is unauthorized', (done) => {
			void request
				.get(api('licenses.get'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				})
				.end(done);
		});

		it('should return licenses if user is logged in and is authorized', (done) => {
			void request
				.get(api('licenses.get'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('licenses').and.to.be.an('array');
				})

				.end(done);
		});
	});

	describe('[/licenses.info]', () => {
		it('should fail if not logged in', (done) => {
			void request
				.get(api('licenses.info'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return limited information if user is unauthorized', (done) => {
			void request
				.get(api('licenses.info'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('license').and.to.be.an('object');
					expect(res.body.license).to.not.have.property('license');
					expect(res.body.license).to.have.property('tags').and.to.be.an('array');
				})
				.end(done);
		});

		it('should return unrestricted info if user is logged in and is authorized', (done) => {
			void request
				.get(api('licenses.info'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
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
			void request
				.get(api('licenses.isEnterprise'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should pass if user has user role', (done) => {
			void request
				.get(api('licenses.isEnterprise'))
				.set(unauthorizedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('isEnterprise', Boolean(process.env.IS_EE));
				})
				.end(done);
		});

		it('should pass if user has admin role', (done) => {
			void request
				.get(api('licenses.isEnterprise'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('isEnterprise', Boolean(process.env.IS_EE));
				})
				.end(done);
		});
	});
});

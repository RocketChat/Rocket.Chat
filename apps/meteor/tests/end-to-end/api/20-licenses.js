import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { password } from '../../data/user.js';
import { createUser, login as doLogin } from '../../data/users.helper';

describe('licenses', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/licenses.add]', () => {
		let unauthorizedUserCredentials;
		before(async () => {
			const createdUser = await createUser();
			unauthorizedUserCredentials = await doLogin(createdUser.username, password);
		});

		it('should fail if not logged in', (done) => {
			request
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
			request
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
		let unauthorizedUserCredentials;
		before(async () => {
			const createdUser = await createUser();
			unauthorizedUserCredentials = await doLogin(createdUser.username, password);
		});

		it('should fail if not logged in', (done) => {
			request
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
			request
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
			request
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
});

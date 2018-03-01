/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import {getCredentials, api, login, request, credentials} from '../../data/api-data.js';
import {adminEmail, adminUsername, adminPassword} from '../../data/user.js';
import supertest from 'supertest';

describe('miscellaneous', function() {
	this.retries(0);

	before(done => getCredentials(done));

	describe('API default', () => {
	// Required by mobile apps
		it('/info', (done) => {
			request.get('/api/info')
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('version');
				})
				.end(done);
		});
	});

	it('/login', () => {
		expect(credentials).to.have.property('X-Auth-Token').with.length.at.least(1);
		expect(credentials).to.have.property('X-User-Id').with.length.at.least(1);
	});

	it('/login (wrapper username)', (done) => {
		request.post(api('login'))
			.send({
				user: {
					username: adminUsername
				},
				password: adminPassword
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end(done);
	});

	it('/login (wrapper email)', (done) => {
		request.post(api('login'))
			.send({
				user: {
					email: adminEmail
				},
				password: adminPassword
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.end(done);
	});

	it('/me', (done) => {
		request.get(api('me'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('_id', credentials['X-User-Id']);
				expect(res.body).to.have.property('username', login.user);
				expect(res.body).to.have.property('active');
				expect(res.body).to.have.property('name');
				expect(res.body).to.have.nested.property('emails[0].address', adminEmail);
			})
			.end(done);
	});
});

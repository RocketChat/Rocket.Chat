/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import supertest from 'supertest';
const request = supertest('http://localhost:3000');
const prefix = '/api/v1/';


import {username, email, password, adminUsername, adminEmail, adminPassword} from '../data/user.js';

function api(path) {
	return prefix + path;
}

function log(res) {
	console.log(res.req.path);
	console.log({
		body: res.body,
		headers: res.headers
	});
}

const credentials = {
	['X-Auth-Token']: undefined,
	['X-User-Id']: undefined
};

const login = {
	user: adminUsername,
	password: adminPassword
};

var targetUserId = undefined;

describe('API default', () => {
	// Required by mobile apps
	it('/info', (done) => {
		request.get('/api/info')
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('version');
				expect(res.body).to.have.deep.property('build.date');
				expect(res.body).to.have.deep.property('build.nodeVersion');
				expect(res.body).to.have.deep.property('build.arch');
				expect(res.body).to.have.deep.property('build.platform');
				expect(res.body).to.have.deep.property('build.osRelease');
				expect(res.body).to.have.deep.property('build.totalMemory');
				expect(res.body).to.have.deep.property('build.freeMemory');
				expect(res.body).to.have.deep.property('build.cpus');
			})
			.end(done);
	});
});

describe('API v1', () => {
	before((done) => {
		request.post(api('login'))
			.send(login)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				credentials['X-Auth-Token'] = res.body.data.authToken;
				credentials['X-User-Id'] = res.body.data.userId;
			})
			.end(done);
	});

	it('/login', () => {
		expect(credentials).to.have.property('X-Auth-Token').with.length.at.least(1);
		expect(credentials).to.have.property('X-User-Id').with.length.at.least(1);
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
				expect(res.body).to.have.deep.property('emails[0].address', adminEmail);
			})
			.end(done);
	});

	describe('Users', () => {
		it('/users.create', (done) => {
			request.post(api('users.create'))
				.set(credentials)
				.send({
					email: email,
					name: username,
					username: username,
					password: password,
					active: true,
					roles: ['user'],
					joinDefaultChannels: true,
					verified:true
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('user.username', username);
					expect(res.body).to.have.deep.property('user.emails[0].address', email);
					expect(res.body).to.have.deep.property('user.active', true);
					expect(res.body).to.have.deep.property('user.name', username);
					targetUserId = res.body.user._id;
				})
				.end(done);
		});

		it('/users.info', (done) => {
			request.get(api('users.info'))
				.set(credentials)
				.query({
					userId: targetUserId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('user.username', username);
					expect(res.body).to.have.deep.property('user.emails[0].address', email);
					expect(res.body).to.have.deep.property('user.active', true);
					expect(res.body).to.have.deep.property('user.name', username);
				})
				.end(done);
		});

		it('/users.getPresence', (done) => {
			request.get(api('users.getPresence'))
				.set(credentials)
				.query({
					userId: targetUserId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('presence', 'offline');
				})
				.end(done);
		});

		it('/users.list', (done) => {
			request.get(api('users.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

	});

});

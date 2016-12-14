/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import supertest from 'supertest';
const request = supertest('http://localhost:3000');
const prefix = '/api/v1/';

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
	user: process.env.ADMIN_USERNAME,
	password: process.env.ADMIN_PASS
};

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
				expect(res.body).to.have.deep.property('emails[0].address', process.env.ADMIN_EMAIL);
			})
			.end(done);
	});

});

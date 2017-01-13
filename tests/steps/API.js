/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import supertest from 'supertest';
import {imgURL} from '../data/interactions.js';
import {publicChannelName, privateChannelName} from '../data/channel.js';
const request = supertest('http://localhost:3000');
const prefix = '/api/v1/';


import {username, email, password, adminUsername, adminEmail, adminPassword} from '../data/user.js';
const apiUsername = 'api'+username;
const apiEmail = 'api'+email;
const apiPublicChannelName= 'api'+publicChannelName;
const apiPrivateChannelName = 'api'+privateChannelName;
var targetUserId = undefined;
var channelId = undefined;

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
					email: apiEmail,
					name: apiUsername,
					username: apiUsername,
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
					expect(res.body).to.have.deep.property('user.username', apiUsername);
					expect(res.body).to.have.deep.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.deep.property('user.active', true);
					expect(res.body).to.have.deep.property('user.name', apiUsername);
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
					expect(res.body).to.have.deep.property('user.username', apiUsername);
					expect(res.body).to.have.deep.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.deep.property('user.active', true);
					expect(res.body).to.have.deep.property('user.name', apiUsername);
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

		it.skip('/users.setAvatar', (done) => {
			request.post(api('users.setAvatar'))
				.set(credentials)
				.send(imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('/users.update', (done) => {
			request.post(api('users.update'))
				.set(credentials)
				.send({
					userId: targetUserId,
					data :{
						email: apiEmail,
						name: 'edited'+apiUsername,
						username: 'edited'+apiUsername,
						password: password,
						active: true,
						roles: ['user']
					}
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('user.username', 'edited'+apiUsername);
					expect(res.body).to.have.deep.property('user.emails[0].address', apiEmail);
					expect(res.body).to.have.deep.property('user.active', true);
					expect(res.body).to.have.deep.property('user.name', 'edited'+apiUsername);
				})
				.end(done);
		});
	});

	describe('channels', () => {
		it('/channels.create', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: apiPublicChannelName
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 0);
					channelId = res.body.channel._id;
				})
				.end(done);
		});

		it('/channels.info', (done) => {
			request.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: channelId
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 0);
				})
				.end(done);
		});

		it('/channels.invite', (done) => {
			request.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: channelId,
					userId: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('channel._id');
					expect(res.body).to.have.deep.property('channel.name', apiPublicChannelName);
					expect(res.body).to.have.deep.property('channel.t', 'c');
					expect(res.body).to.have.deep.property('channel.msgs', 0);
				})
				.end(done);
		});

		it('/channels.setDescription', (done) => {
			request.post(api('channels.setDescription'))
				.set(credentials)
				.send({
					roomId: channelId,
					description: 'this is a description for a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('description', 'this is a description for a channel for api tests');
				})
				.end(done);
		});

		it('/channels.setTopic', (done) => {
			request.post(api('channels.setTopic'))
				.set(credentials)
				.send({
					roomId: channelId,
					topic: 'this is a topic of a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('topic', 'this is a topic of a channel for api tests');
				})
				.end(done);
		});

		it('/channels.setPurpose', (done) => {
			request.post(api('channels.setPurpose'))
				.set(credentials)
				.send({
					roomId: channelId,
					purpose: 'this is a purpose of a channel for api tests'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.deep.property('purpose', 'this is a purpose of a channel for api tests');
				})
				.end(done);
		});
	});


});

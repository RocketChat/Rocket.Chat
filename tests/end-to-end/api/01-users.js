/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import {getCredentials, api, login, request, credentials, apiEmail, apiUsername, targetUser, log} from '../../data/api-data.js';
import {adminEmail, password} from '../../data/user.js';
import {imgURL} from '../../data/interactions.js';
import supertest from 'supertest';

describe('Users', function() {
	this.retries(0);

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

	it('/users.create', (done) => {
		request.post(api('users.create'))
			.set(credentials)
			.send({
				email: apiEmail,
				name: apiUsername,
				username: apiUsername,
				password,
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
				targetUser._id = res.body.user._id;
			})
			.end(done);
	});

	it('/users.info', (done) => {
		request.get(api('users.info'))
			.set(credentials)
			.query({
				userId: targetUser._id
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
				userId: targetUser._id
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

	it.skip('/users.list', (done) => {
	//filtering user list
		request.get(api('users.list'))
			.set(credentials)
			.query({
				name: { '$regex': 'g' }
			})
			.field('username', 1)
			.sort('createdAt', -1)
			.expect(log)
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
			.attach('avatarUrl', imgURL)
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
				userId: targetUser._id,
				data :{
					email: apiEmail,
					name: `edited${ apiUsername }`,
					username: `edited${ apiUsername }`,
					password,
					active: true,
					roles: ['user']
				}
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.deep.property('user.username', `edited${ apiUsername }`);
				expect(res.body).to.have.deep.property('user.emails[0].address', apiEmail);
				expect(res.body).to.have.deep.property('user.active', true);
				expect(res.body).to.have.deep.property('user.name', `edited${ apiUsername }`);
			})
			.end(done);
	});
});

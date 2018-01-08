/* eslint-env mocha */

import supertest from 'supertest';
import {adminUsername, adminPassword} from '../../data/user.js';

export const request = supertest.agent('http://localhost:8080');
export const rcrequest = supertest.agent('http://localhost:3000');
export const credentials = {
	username: 'admin',
	password: 'admin'
};
const clientconfig = '{"queryBuilder":[{"_class":"io.redlink.smarti.model.config.ComponentConfiguration","name":"conversationmlt","displayName":"conversationmlt","type":"conversationmlt","enabled":true,"unbound":false,"pageSize":3,"filter":["support_area"]},{"_class":"io.redlink.smarti.model.config.ComponentConfiguration","name":"conversationsearch","displayName":"conversationsearch","type":"conversationsearch","enabled":true,"unbound":false,"pageSize":3,"filter":["support_area"]}]}';

describe('[Smarti Connection]', () => {

	describe('[Status]', function () {
		describe('health', () => {
			it('Smarti should be UP', (done) => {
				request.get('/system/health')
					.expect(200)
					.expect('Content-Type', 'application/vnd.spring-boot.actuator.v1+json;charset=UTF-8')
					.expect((res) => {
						expect(res.body).to.have.property('status', 'UP');
					})
					.end(done);
			});
		});
		describe('Info', () => {
			it('Access Smarti info', (done) => {
				request.get('/system/info')
					.expect(200)
					.expect('Content-Type', 'application/vnd.spring-boot.actuator.v1+json;charset=UTF-8')
					.end(done);
			});
		});
	});

	describe('[Smarti Configuration]', function () {
		describe('[Client]', () => {
			var clientid;
			var token;
			var authToken;
			var userId;

			it('check if client already exists', function (done) {
				request.get('/client')
					.auth(credentials['username'], credentials['password'])
					.expect(200)
					.expect(function (res) {
						if (typeof res.body[0] !== 'undefined') {
							clientid = res.body[0].id;
						}
						else {
							clientid = undefined;
						}
						console.log('check if client exists', clientid)
					})
					.end(done);
			});

			it('create new client', function (done) {
				if (typeof clientid !== 'undefined') {
					console.log('client was alread there', clientid);
					done();
				}
				else {
					request.post('/client')
						.send({
							defaultClient: true,
							description: '',
							name: 'testclient'
						})
						.set('Accept', 'application/json')
						.end(function (err, res) {
							clientid = res.body.id;
							expect(res.status).to.be.equal(200);
							console.log('clientid', res.body.id);
							done();
						});
				}
			});

			it('check if right client was picked', function (done) {
				request.get('/client')
					.expect(200)
					.expect(function (res) {
						expect(res.body[0].id, clientid);
						expect(clientid).to.not.equal(undefined);
					})
					.end(done);
			});

			it('post query-builder', function (done) {
				let code = '/client/' + clientid + '/config';
				console.log('config post', code);
				request.post(code)
					.set('Content-Type', 'application/json')
					.send(clientconfig)
					.expect(200)
					.end(function (err, res) {
						console.log('post config', res.body);
						done();
					});
			});

			it('post access token', function (done) {
				let code = '/client/' + clientid + '/token';
				request.post(code)
					.set('Content-Type', 'application/json')
					.send({})
					.end(function (err, res) {
						token = res.body.token;
						expect(res.status).to.be.equal(201);
						console.log('token', res.body.token);
						done();
					});
			});

			it('Login to Rocket.Chat api', function (done) {
				rcrequest.post('/api/v1/login')
					.set('Content-Type', 'application/json')
					.send({
						username: adminUsername,
						password: adminPassword
					})
					.end(function (err, res) {
						authToken = res.body.data.authToken;
						userId = res.body.data.userId;
						expect(res.status).to.be.equal(200);
						console.log('authToken', authToken);
						console.log('userId', userId);
						done();
					});
			});

			it('Update access token in Rocket.Chat', function (done) {
				console.log('authToken-o', authToken);
				console.log('userId-o', userId);
				rcrequest.post('/api/v1/settings/Assistify_AI_Smarti_Auth_Token')
					.set('X-Auth-Token', authToken)
					.set('X-User-Id', userId)
					.send({
						value: token
					})
					.expect(200)
					.end(done);
			});

			it('Logout from Rocketchat api', function (done) {
				console.log('authToken-o', authToken);
				console.log('userId-o', userId);
				rcrequest.get('/api/v1/logout')
					.set('X-Auth-Token', authToken)
					.set('X-User-Id', userId)
					.expect(200)
					.end(done);
			});
		});
	});

	describe('[RC Configuration]', function () {
		var authToken;
		var userId;

		it('Login to Rocket.Chat api', function (done) {
			rcrequest.post('/api/v1/login')
				.set('Content-Type', 'application/json')
				.send({
					username: adminUsername,
					password: adminPassword
				})
				.end(function (err, res) {
					authToken = res.body.data.authToken;
					userId = res.body.data.userId;
					expect(res.status).to.be.equal(200);
					console.log('authToken', authToken);
					console.log('userId', userId);
					done();
				});
		});

		it('Check Assistify_AI_Smarti_Domain', function (done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_Smarti_Domain')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function (err, res) {
					expect(res.status).to.be.equal(200);
					expect(res.body.value).to.be.equal('testclient');
					console.log('', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Source', function (done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_Source')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function (err, res) {
					expect(res.status).to.be.equal(200);
					expect(res.body.value).to.be.equal('0');
					console.log('Assistify_AI_Source', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Enabled', function (done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_Enabled')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function (err, res) {
					expect(res.status).to.be.equal(200);
					expect(res.body.value).to.be.equal(true);
					console.log('Assistify_AI_Enabled', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_RocketChat_Webhook_Token', function (done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_RocketChat_Webhook_Token')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function (err, res) {
					expect(res.status).to.be.equal(200);
					expect(res.body.value).to.be.equal('key123');
					console.log('Assistify_AI_RocketChat_Webhook_Token', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Smarti_Base_URL', function (done) {
			rcrequest.get('/api/v1/settings/Assistify_AI_Smarti_Base_URL')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function (err, res) {
					expect(res.status).to.be.equal(200);
					expect(res.body.value).to.be.equal('http://localhost:8080/');
					console.log('Assistify_AI_Smarti_Base_URL', res.body.value);
					done();
				});
		});

		it('Logout from Rocketchat api', function (done) {
			console.log('authToken-o', authToken);
			console.log('userId-o', userId);
			rcrequest.get('/api/v1/logout')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(done);
		});
	});

	// describe.skip('[BREAK]', ()=> {
	// 	it('BREAK', ()=> {
	// 		true.should.equal(false);
	// 	});
	// });

});

// OVERWRITE_SETTING_Assistify_AI_Smarti_Domain: testclient
// - OVERWRITE_SETTING_Assistify_AI_Source: 0
// - OVERWRITE_SETTING_Assistify_AI_Enabled: true
// - OVERWRITE_SETTING_Assistify_AI_RocketChat_Webhook_Token: key123
// - OVERWRITE_SETTING_Assistify_AI_Smarti_Base_URL: http://localhost:8080/

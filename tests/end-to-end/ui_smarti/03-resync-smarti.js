/* eslint-env mocha */

import supertest from 'supertest';
import { adminEmail, adminUsername, adminPassword } from '../../data/user';
// eslint-disable-next-line import/no-useless-path-segments
import { credentials } from '../ui_smarti/00-preparation'; // directly address the folder to support continued testing
import { checkIfUserIsAdmin } from '../../data/checks';
import sideNav from '../../pageobjects/side-nav.page';
import assistify from '../../pageobjects/assistify.page';
import mainContent from '../../pageobjects/main-content.page';


export const clientname = 'syncclient';
export const smarti_url_active = 'http://localhost:8080/';
export const smarti_url_inactive = 'http://localhost:8081/';
export const smarti = supertest.agent(smarti_url_active);
export const rocketchat = supertest.agent('http://localhost:3000');


let auto_token;
let auto_clientId;
describe('[Smarti Configuration]', function() {
	describe('[Smarti Configuration]', function() {
		describe('[Client]', () => {
			it('check if client already exists', function(done) {
				JSON.stringify(smarti.get('/client'), '', 2);
				smarti.get('/client')
					.auth(credentials.username, credentials.password)
					.expect(200)
					.expect(function(res) {
						for (const cl in res.body) {
							if (res.body[cl].name === clientname) {
								auto_clientId = res.body[cl].id;
								console.log('check if client exists', auto_clientId);
							}
						}
					})
					.end(done);
			});

			it('delete client if exists', function(done) {
				if (typeof auto_clientId !== 'undefined') {
					console.log('client was alread there', auto_clientId);
					smarti.del(`/client/${ auto_clientId }`)
						.expect(204)
						.end(done);
				} else {
					done();
				}
			});

			it('create new client', function(done) {
				smarti.post('/client')
					.send({
						defaultClient: true,
						description: '',
						name: clientname,
					})
					.set('Accept', 'application/json')
					.end(function(err, res) {
						auto_clientId = res.body.id;
						res.status.should.be.equal(201);
						console.log('clientid', res.body.id);
						done();
					});
			});

			it('check if right client was picked', function(done) {
				smarti.get('/client')
					.expect(200)
					.expect(function(res) {
						for (const cl in res.body) {
							if (res.body[cl].name === clientname) {
								res.body[cl].id.should.be.equal(auto_clientId);
							}
						}
						auto_clientId.should.not.equal(undefined);
					})
					.end(done);
			});

			it('post access token', function(done) {
				const code = `/client/${ auto_clientId }/token`;
				smarti.post(code)
					.set('Content-Type', 'application/json')
					.send({})
					.end(function(err, res) {
						auto_token = res.body.token;
						res.status.should.be.equal(201);
						console.log('token', res.body.token);
						done();
					});
			});
		});
	});

	describe('[Rocket-Chat Configuration]', () => {
		let authToken;
		let userId;

		it('Login to Rocket.Chat api', function(done) {
			rocketchat.post('/api/v1/login')
				.set('Content-Type', 'application/json')
				.send({
					username: adminUsername,
					password: adminPassword,
				})
				.end(function(err, res) {
					authToken = res.body.data.authToken;
					userId = res.body.data.userId;
					res.status.should.be.equal(200);
					console.log('authToken', authToken);
					console.log('userId', userId);
					done();
				});
		});

		it('Update access token in Rocket.Chat', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rocketchat.post('/api/v1/settings/Assistify_AI_Smarti_Auth_Token')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: auto_token,
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: enable Knowledgebase', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rocketchat.post('/api/v1/settings/Assistify_AI_Enabled')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: true,
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: activate Smarti', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rocketchat.post('/api/v1/settings/Assistify_AI_Source')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: '0',
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: set Smarti client', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rocketchat.post('/api/v1/settings/Assistify_AI_Smarti_Domain')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: clientname,
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: set Rocket.Chat Weebhook token', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rocketchat.post('/api/v1/settings/Assistify_AI_RocketChat_Webhook_Token')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: 'key123',
				})
				.expect(200)
				.end(done);
		});

		it('Rocket.Chat Settings: set Smarti base url', function(done) {
			// console.log('authToken-o', authToken);
			// console.log('userId-o', userId);
			rocketchat.post('/api/v1/settings/Assistify_AI_Smarti_Base_URL')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.send({
					value: smarti_url_active,
				})
				.expect(200)
				.end(done);
		});

		it('Check Assistify_AI_Smarti_Domain', function(done) {
			rocketchat.get('/api/v1/settings/Assistify_AI_Smarti_Domain')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal(clientname);
					console.log('', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Source', function(done) {
			rocketchat.get('/api/v1/settings/Assistify_AI_Source')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal('0');
					console.log('Assistify_AI_Source', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Enabled', function(done) {
			rocketchat.get('/api/v1/settings/Assistify_AI_Enabled')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal(true);
					console.log('Assistify_AI_Enabled', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_RocketChat_Webhook_Token', function(done) {
			rocketchat.get('/api/v1/settings/Assistify_AI_RocketChat_Webhook_Token')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal('key123');
					console.log('Assistify_AI_RocketChat_Webhook_Token', res.body.value);
					done();
				});
		});

		it('Check Assistify_AI_Smarti_Base_URL', function(done) {
			rocketchat.get('/api/v1/settings/Assistify_AI_Smarti_Base_URL')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(function(err, res) {
					res.status.should.be.equal(200);
					res.body.value.should.be.equal(smarti_url_active);
					console.log('Assistify_AI_Smarti_Base_URL', res.body.value);
					done();
				});
		});

		it('Logout from Rocketchat api', function(done) {
			console.log('authToken-o', authToken);
			console.log('userId-o', userId);
			rocketchat.post('/api/v1/logout')
				.set('X-Auth-Token', authToken)
				.set('X-User-Id', userId)
				.expect(200)
				.end(done);
		});
	});
});

const messages = ['Nachricht im Thema wurde synchronisiert',
	'Nachricht in der Anfrage wurde synchronisiert',
	`1. Nachricht in der 1. Anfrage wurde nicht synchronisiert ${ Date.now() }`,
	`2. Nachricht in der 1. Anfrage wurde nicht synchronisiert ${ Date.now() }`,
	'Nachricht in der 2. Anfrage wurde nicht synchronisiert',
	'1. Nachricht in der automatisch synchronisiert Anfrage wurde synchronisiert',
	'2. Nachricht in der automatisch synchronisiert Anfrage wurde nicht synchronisiert',
	'3. Nachricht in der automatisch synchronisiert Anfrage wurde synchronisiert',
];
const sync_request1 = `sync_request1-${ Date.now() }`;
const unsync_request1 = `unsync_request1-${ Date.now() }`;
const unsync_request2 = `unsync_request2-${ Date.now() }`;
const autosync_request1 = `autosync_request1-${ Date.now() }`;


function loginRC() {
	return new Promise((resolve) => {
		rocketchat.post('/api/v1/login')
			.set('Content-Type', 'application/json')
			.send({
				username: adminUsername,
				password: adminPassword,
			})
			.end(function(err, res) {
				const { authToken, userId } = res.body.data;
				res.status.should.be.equal(200);
				console.log('authToken', authToken);
				console.log('userId', userId);
				resolve([authToken, userId]);
			});
	});
}

async function changeSmartiStatus(status, done) {
	const login_credentials = await loginRC();

	await rocketchat.post('/api/v1/settings/Assistify_AI_Smarti_Base_URL')
		.set('X-Auth-Token', login_credentials[0])
		.set('X-User-Id', login_credentials[1])
		.send({
			value: status,
		})
		.expect(200)
		.then(rocketchat.post('/api/v1/logout')
			.set('X-Auth-Token', login_credentials[0])
			.set('X-User-Id', login_credentials[1])
			.expect(200)
			.end(done));
}


describe('[Test Sync]', function() {
	before(() => {
		browser.pause(5000); // wait some time to make sure that all settings on both sides are actually persisted

		checkIfUserIsAdmin(adminUsername, adminEmail, adminPassword); // is broken -- if not admin it will log in as user or create a user
	});

	describe('[Test full Sync]', function() {

		describe.skip('Test synced messaging', function() {
			let conversationId;

			after((done) => {
				smarti.del(`/conversation/${ conversationId }`)
					.auth(credentials.username, credentials.password)
					.expect(204)
					.end(done);
			});

			it('Send synced message in Request', (done) => {
				sideNav.createChannel(sync_request1, false, false);
				mainContent.sendMessage(messages[1]);
				browser.pause(500);
				smarti.get('/conversation/')
					.auth(credentials.username, credentials.password)
					.query({ client: auto_clientId })
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content[0].messages;
						let found = false;
						for (let i = 0; i < msgs.length; i++) {
							if (msgs[i].content === messages[1]) {
								found = true;
								conversationId = res.body.content[0].id;
								break;
							}
						}
						found.should.be.equal(true);

					})
					.end(done);
			});
		});

		describe('Test unsynced messaging', function() {

			it('Make Smarti unavailable', (done) => {
				changeSmartiStatus(smarti_url_inactive, done);
			});

			it('Send unsynced message in Request', (done) => {
				sideNav.createChannel(unsync_request1, false, false);
				mainContent.sendMessage(messages[2]);
				browser.pause(500);
				smarti.get('/conversation/')
					.auth(credentials.username, credentials.password)
					.query({ client: auto_clientId })
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content;
						msgs.length.should.be.equal(0);
					})
					.end(done);
			});

			it('Send second unsynced message in Request', (done) => {
				mainContent.sendMessage(messages[3]);
				browser.pause(500);
				smarti.get('/conversation/')
					.auth(credentials.username, credentials.password)
					.query({ client: auto_clientId })
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content;
						msgs.length.should.be.equal(0);
					})
					.end(done);
			});

			it.skip('Send unsynced message in second Request', (done) => {
				sideNav.createChannel(unsync_request2, false, false);
				mainContent.sendMessage(messages[4]);
				browser.pause(500);
				smarti.get('/conversation/')
					.auth(credentials.username, credentials.password)
					.query({ client: auto_clientId })
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content;
						msgs.length.should.be.equal(0);
					})
					.end(done);
			});

			it('Make Smarti available', (done) => {
				changeSmartiStatus(smarti_url_active, done);
			});

			it('Trigger full resync', (done) => {
				assistify.openAdminView();
				assistify.assistifyAdminUi.waitForVisible(5000);
				assistify.assistifyAdminUi.click();
				assistify.knowledgebaseUiExpand.waitForVisible(5000);
				assistify.knowledgebaseUiExpand.click();

				assistify.resyncFullButton.waitForVisible(5000);
				assistify.resyncFullButton.click();
				sideNav.preferencesClose.waitForVisible(5000);
				sideNav.preferencesClose.click();
				browser.pause(10000);
				done();
			});

			it('shall find the conversation in Smarti', (done) => {
				const { roomId } = assistify;
				roomId.should.not.be.empty;
				smarti.get('/conversation')
					.set('X-Auth-Token', auto_token)
					.set('Accept', 'application/json')
					.expect((res) => {
						res.body.content.should.not.be.empty;

						const currentConversation = res.body.content.filter((conversation) => conversation.meta.channel_id[0] === roomId)[0];
						currentConversation.should.not.be.empty;
						const msgs = currentConversation.messages;
						let found = false;
						for (let i = 0; i < msgs.length; i++) {
							if (msgs[i].content === messages[2]) {
								found = true;
								break;
							}
						}
						found.should.be.equal(true);
					})
					.end(done);
			});
		});

		describe('[Cleanup Full Sync Test', () => {
			it('Cleanup all Conversations in Smarti', (done) => {
				smarti.get('/conversation/')
					.auth(credentials.username, credentials.password)
					.query({ client: auto_clientId })
					.expect(200)
					.expect(function(res) {
						const msgs = res.body.content;
						for (let i = 0; i < msgs.length; i++) {
							smarti.del(`/conversation/${ msgs[i].id }`)
								.auth(credentials.username, credentials.password)
								.expect(204)
								.end();
						}

					})
					.end(done);
			});
		});
	});

	describe.skip('[Test auto Sync]', function() {
		it('Send synced message in Request', (done) => {
			browser.pause(500);
			sideNav.createChannel(autosync_request1, false, false);
			mainContent.sendMessage(messages[5]);
			browser.pause(500);
			smarti.get('/conversation/')
				.auth(credentials.username, credentials.password)
				.query({ client: auto_clientId })
				.expect(200)
				.expect(function(res) {
					const msgs = res.body.content[0].messages;
					let found = false;
					for (let i = 0; i < msgs.length; i++) {
						if (msgs[i].content === messages[5]) {
							found = true;
							break;
						}
					}
					found.should.be.equal(true);

				})
				.end(done);
		});

		it('Make Smarti unavailable', (done) => {
			changeSmartiStatus(smarti_url_inactive, done);
		});

		it('Send unsynced message in Request', (done) => {
			mainContent.sendMessage(messages[6]);
			browser.pause(500);
			smarti.get('/conversation/')
				.auth(credentials.username, credentials.password)
				.query({ client: auto_clientId })
				.expect(200)
				.expect(function(res) {
					const conversations = res.body.content;
					conversations.length.should.be.equal(1);
					conversations[0].messages.length.should.be.equal(1);
					conversations[0].messages[0].content.should.be.equal(messages[5]);
				})
				.end(done);
		});

		it('Make Smarti available', (done) => {
			changeSmartiStatus(smarti_url_active, done);
		});

		it('Send last synced message in Request', (done) => {
			mainContent.sendMessage(messages[7]);
			browser.pause(2000);
			smarti.get('/conversation/')
				.auth(credentials.username, credentials.password)
				.query({ client: auto_clientId })
				.expect(200)
				.expect(function(res) {
					const conversations = res.body.content;
					conversations.length.should.be.equal(1);
					conversations[0].messages.length.should.be.equal(3);
				})
				.end(done);
		});
	});
});

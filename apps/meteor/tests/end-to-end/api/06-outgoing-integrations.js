import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { createIntegration, removeIntegration } from '../../data/integration.helper';
import { updatePermission } from '../../data/permissions.helper';
import { password } from '../../data/user';
import { createUser, login } from '../../data/users.helper';

describe('[Outgoing Integrations]', function () {
	this.retries(0);

	let integration;
	let integrationCreatedByAnUser;
	let user;
	let userCredentials;

	before((done) => getCredentials(done));

	before((done) => {
		updatePermission('manage-incoming-integrations', [])
			.then(() => updatePermission('manage-own-incoming-integrations', []))
			.then(() => updatePermission('manage-own-outgoing-integrations', []))
			.then(() => updatePermission('manage-outgoing-integrations', []))
			.then(done);
	});

	after((done) => {
		updatePermission('manage-incoming-integrations', ['admin'])
			.then(() => updatePermission('manage-own-incoming-integrations', ['admin']))
			.then(() => updatePermission('manage-own-outgoing-integrations', ['admin']))
			.then(() => updatePermission('manage-outgoing-integrations', ['admin']))
			.then(done);
	});

	describe('[/integrations.create]', () => {
		it('should return an error when the user DOES NOT have the permission "manage-outgoing-integrations" to add an outgoing integration', (done) => {
			updatePermission('manage-outgoing-integrations', []).then(() => {
				request
					.post(api('integrations.create'))
					.set(credentials)
					.send({
						type: 'webhook-outgoing',
						name: 'Guggy',
						enabled: true,
						username: 'rocket.cat',
						urls: ['http://text2gif.guggy.com/guggify'],
						scriptEnabled: false,
						channel: '#general',
						triggerWords: ['!guggy'],
						alias: 'guggy',
						avatar: 'http://res.guggy.com/logo_128.png',
						emoji: ':ghost:',
						event: 'sendMessage',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'not_authorized');
					})
					.end(done);
			});
		});

		it('should return an error when the user DOES NOT have the permission "manage-own-outgoing-integrations" to add an outgoing integration', (done) => {
			updatePermission('manage-own-outgoing-integrations', []).then(() => {
				request
					.post(api('integrations.create'))
					.set(credentials)
					.send({
						type: 'webhook-outgoing',
						name: 'Guggy',
						enabled: true,
						username: 'rocket.cat',
						urls: ['http://text2gif.guggy.com/guggify'],
						scriptEnabled: false,
						channel: '#general',
						triggerWords: ['!guggy'],
						alias: 'guggy',
						avatar: 'http://res.guggy.com/logo_128.png',
						emoji: ':ghost:',
						event: 'sendMessage',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'not_authorized');
					})
					.end(done);
			});
		});

		it('should return an error when the user sends an invalid type of integration', (done) => {
			request
				.post(api('integrations.create'))
				.set(credentials)
				.send({
					type: 'webhook-outgoing-invalid',
					name: 'Guggy',
					enabled: true,
					username: 'rocket.cat',
					urls: ['http://text2gif.guggy.com/guggify'],
					scriptEnabled: false,
					channel: '#general',
					triggerWords: ['!guggy'],
					alias: 'guggy',
					avatar: 'http://res.guggy.com/logo_128.png',
					emoji: ':ghost:',
					event: 'sendMessage',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Invalid integration type.');
				})
				.end(done);
		});

		it('should add the integration successfully when the user ONLY has the permission "manage-outgoing-integrations" to add an outgoing integration', (done) => {
			let integrationId;
			updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				request
					.post(api('integrations.create'))
					.set(credentials)
					.send({
						type: 'webhook-outgoing',
						name: 'Guggy',
						enabled: true,
						username: 'rocket.cat',
						urls: ['http://text2gif.guggy.com/guggify'],
						scriptEnabled: false,
						channel: '#general',
						triggerWords: ['!guggy'],
						alias: 'guggy',
						avatar: 'http://res.guggy.com/logo_128.png',
						emoji: ':ghost:',
						event: 'sendMessage',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('integration').and.to.be.an('object');
						integrationId = res.body.integration._id;
					})
					.end(() => removeIntegration(integrationId, 'outgoing').then(done));
			});
		});

		it('should add the integration successfully when the user ONLY has the permission "manage-own-outgoing-integrations" to add an outgoing integration', (done) => {
			updatePermission('manage-outgoing-integrations', []).then(() => {
				updatePermission('manage-own-outgoing-integrations', ['admin']).then(() => {
					request
						.post(api('integrations.create'))
						.set(credentials)
						.send({
							type: 'webhook-outgoing',
							name: 'Guggy',
							enabled: true,
							username: 'rocket.cat',
							urls: ['http://text2gif.guggy.com/guggify'],
							scriptEnabled: false,
							channel: '#general',
							triggerWords: ['!guggy'],
							alias: 'guggy',
							avatar: 'http://res.guggy.com/logo_128.png',
							emoji: ':ghost:',
							event: 'sendMessage',
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('integration').and.to.be.an('object');
							integration = res.body.integration;
						})
						.end(done);
				});
			});
		});

		it('should create an outgoing integration successfully', (done) => {
			request
				.post(api('integrations.create'))
				.set(credentials)
				.send({
					type: 'webhook-outgoing',
					name: 'Guggy',
					enabled: true,
					username: 'rocket.cat',
					urls: ['http://text2gif.guggy.com/guggify'],
					scriptEnabled: false,
					channel: '#general',
					triggerWords: ['!guggy'],
					alias: 'guggy',
					avatar: 'http://res.guggy.com/logo_128.png',
					emoji: ':ghost:',
					event: 'sendMessage',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					integration._id = res.body.integration._id;
					expect(res.body).to.have.nested.property('integration.name', 'Guggy');
					expect(res.body).to.have.nested.property('integration.type', 'webhook-outgoing');
					expect(res.body).to.have.nested.property('integration.enabled', true);
					expect(res.body).to.have.nested.property('integration.username', 'rocket.cat');
					expect(res.body).to.have.nested.property('integration.event', 'sendMessage');
				})
				.end(done);
		});
	});

	describe('[/integrations.list]', () => {
		before((done) => {
			createUser().then((createdUser) => {
				user = createdUser;
				login(user.username, password).then((credentials) => {
					userCredentials = credentials;
					updatePermission('manage-outgoing-integrations', ['user']).then(() => {
						createIntegration(
							{
								type: 'webhook-outgoing',
								name: 'Guggy',
								enabled: true,
								username: 'rocket.cat',
								urls: ['http://text2gif.guggy.com/guggify'],
								scriptEnabled: false,
								channel: '#general',
								triggerWords: ['!guggy'],
								alias: 'guggy',
								avatar: 'http://res.guggy.com/logo_128.png',
								emoji: ':ghost:',
								event: 'sendMessage',
							},
							userCredentials,
						).then((integration) => {
							integrationCreatedByAnUser = integration;
							done();
						});
					});
				});
			});
		});

		it('should return the list of outgoing integrations', (done) => {
			request
				.get(api('integrations.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const integrationCreatedByAdmin = res.body.integrations.find((createdIntegration) => createdIntegration._id === integration._id);
					expect(integrationCreatedByAdmin).to.be.an('object');
					expect(integrationCreatedByAdmin._id).to.be.equal(integration._id);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('items');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('should return the list create by the user only', (done) => {
			updatePermission('manage-outgoing-integrations', []).then(() => {
				updatePermission('manage-own-outgoing-integrations', ['user']).then(() => {
					request
						.get(api('integrations.list'))
						.set(userCredentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							const integrationCreatedByAdmin = res.body.integrations.find(
								(createdIntegration) => createdIntegration._id === integration._id,
							);
							expect(integrationCreatedByAdmin).to.be.equal(undefined);
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('items');
							expect(res.body).to.have.property('total');
						})
						.end(done);
				});
			});
		});

		it('should return unauthorized error when the user does not have any integrations permissions', (done) => {
			updatePermission('manage-incoming-integrations', []).then(() => {
				updatePermission('manage-own-incoming-integrations', []).then(() => {
					updatePermission('manage-outgoing-integrations', []).then(() => {
						updatePermission('manage-outgoing-integrations', []).then(() => {
							request
								.get(api('integrations.list'))
								.set(credentials)
								.expect('Content-Type', 'application/json')
								.expect(403)
								.expect((res) => {
									expect(res.body).to.have.property('success', false);
									expect(res.body).to.have.property('error', 'unauthorized');
								})
								.end(done);
						});
					});
				});
			});
		});
	});

	describe('[/integrations.history]', () => {
		it('should return an error when the user DOES NOT the necessary permission', (done) => {
			updatePermission('manage-outgoing-integrations', []).then(() => {
				updatePermission('manage-own-outgoing-integrations', []).then(() => {
					request
						.get(api('integrations.history'))
						.set(credentials)
						.query({
							id: integration._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('error', 'unauthorized');
						})
						.end(done);
				});
			});
		});

		it('should return the history of outgoing integrations', (done) => {
			updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				request
					.get(api('integrations.history'))
					.set(credentials)
					.query({
						id: integration._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('history').and.to.be.an('array');
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('items');
						expect(res.body).to.have.property('total');
					})
					.end(done);
			});
		});
	});

	describe('[/integrations.get]', () => {
		it('should return an error when the required "integrationId" query parameters is not sent', (done) => {
			request
				.get(api('integrations.get'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', `must have required property 'integrationId' [invalid-params]`);
				})
				.end(done);
		});

		it('should return an error when the user DOES NOT have the permission "manage-outgoing-integrations" to get an outgoing integration', (done) => {
			updatePermission('manage-outgoing-integrations', []).then(() => {
				request
					.get(api(`integrations.get?integrationId=${integration._id}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'not-authorized');
					})
					.end(done);
			});
		});

		it('should return an error when the user DOES NOT have the permission "manage-outgoing-integrations" to get an outgoing integration created by another user', (done) => {
			updatePermission('manage-outgoing-integrations', []).then(() => {
				request
					.get(api(`integrations.get?integrationId=${integrationCreatedByAnUser._id}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'not-authorized');
					})
					.end(done);
			});
		});

		it('should return an error when the user sends an invalid integration', (done) => {
			updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				request
					.get(api('integrations.get?integrationId=invalid'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'The integration does not exists.');
					})
					.end(done);
			});
		});

		it('should return the integration successfully when the user is able to see only your own integrations', (done) => {
			updatePermission('manage-outgoing-integrations', [])
				.then(() => updatePermission('manage-own-outgoing-integrations', ['user']))
				.then(() => {
					request
						.get(api(`integrations.get?integrationId=${integrationCreatedByAnUser._id}`))
						.set(userCredentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('integration');
							expect(res.body.integration._id).to.be.equal(integrationCreatedByAnUser._id);
						})
						.end(done);
				});
		});

		it('should return the integration successfully', (done) => {
			updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				request
					.get(api(`integrations.get?integrationId=${integration._id}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('integration');
						expect(res.body.integration._id).to.be.equal(integration._id);
					})
					.end(done);
			});
		});
	});

	describe('[/integrations.remove]', () => {
		it('should return an error when the user DOES NOT have the permission "manage-outgoing-integrations" to remove an outgoing integration', (done) => {
			updatePermission('manage-outgoing-integrations', []).then(() => {
				request
					.post(api('integrations.remove'))
					.set(credentials)
					.send({
						integrationId: integration._id,
						type: 'webhook-outgoing',
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'unauthorized');
					})
					.end(done);
			});
		});

		it('should return an error when the user DOES NOT have the permission "manage-own-outgoing-integrations" to remove an outgoing integration', (done) => {
			updatePermission('manage-own-incoming-integrations', []).then(() => {
				request
					.post(api('integrations.remove'))
					.set(credentials)
					.send({
						integrationId: integration._id,
						type: 'webhook-outgoing',
					})
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'unauthorized');
					})
					.end(done);
			});
		});

		it('should return an error when the user sends an invalid type of integration', (done) => {
			updatePermission('manage-own-outgoing-integrations', ['admin']).then(() => {
				request
					.post(api('integrations.remove'))
					.set(credentials)
					.send({
						integrationId: integration._id,
						type: 'invalid-type',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error').include(`must match exactly one schema in oneOf`);
					})
					.end(done);
			});
		});

		it('should remove the integration successfully when the user at least one of the necessary permission to remove an outgoing integration', (done) => {
			updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				request
					.post(api('integrations.remove'))
					.set(credentials)
					.send({
						integrationId: integration._id,
						type: integration.type,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});

		it('the normal user should remove the integration successfully when the user have the "manage-own-outgoing-integrations" to remove an outgoing integration', (done) => {
			updatePermission('manage-own-outgoing-integrations', ['user']).then(() => {
				request
					.post(api('integrations.remove'))
					.set(userCredentials)
					.send({
						integrationId: integrationCreatedByAnUser._id,
						type: integrationCreatedByAnUser.type,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					})
					.end(done);
			});
		});
	});
});

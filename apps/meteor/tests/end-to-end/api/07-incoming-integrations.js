import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { createIntegration, removeIntegration } from '../../data/integration.helper';
import { updatePermission } from '../../data/permissions.helper';
import { createRoom } from '../../data/rooms.helper.js';
import { password } from '../../data/user';
import { createUser, login } from '../../data/users.helper';

describe('[Incoming Integrations]', function () {
	this.retries(0);

	let integration;
	let integrationCreatedByAnUser;
	let user;
	let userCredentials;
	let channel;
	let testChannelName;

	before((done) => getCredentials(done));

	before((done) => {
		updatePermission('manage-incoming-integrations', [])
			.then(() => updatePermission('manage-own-incoming-integrations', []))
			.then(() => updatePermission('manage-own-outgoing-integrations', []))
			.then(() => updatePermission('manage-outgoing-integrations', []));

		testChannelName = `channel.test.${Date.now()}-${Math.random()}`;

		createRoom({ type: 'c', name: testChannelName }).end((err, res) => {
			channel = res.body.channel;

			return done();
		});
	});

	after((done) => {
		updatePermission('manage-incoming-integrations', ['admin'])
			.then(() => updatePermission('manage-own-incoming-integrations', ['admin']))
			.then(() => updatePermission('manage-own-outgoing-integrations', ['admin']))
			.then(() => updatePermission('manage-outgoing-integrations', ['admin']))
			.then(done);
	});

	describe('[/integrations.create]', () => {
		it('should return an error when the user DOES NOT have the permission "manage-incoming-integrations" to add an incoming integration', (done) => {
			updatePermission('manage-incoming-integrations', []).then(() => {
				request
					.post(api('integrations.create'))
					.set(credentials)
					.send({
						type: 'webhook-incoming',
						name: 'Incoming test',
						enabled: true,
						alias: 'test',
						username: 'rocket.cat',
						scriptEnabled: false,
						overrideDestinationChannelEnabled: true,
						channel: '#general',
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

		it('should return an error when the user DOES NOT have the permission "manage-own-incoming-integrations" to add an incoming integration', (done) => {
			updatePermission('manage-own-incoming-integrations', []).then(() => {
				request
					.post(api('integrations.create'))
					.set(credentials)
					.send({
						type: 'webhook-incoming',
						name: 'Incoming test',
						enabled: true,
						alias: 'test',
						username: 'rocket.cat',
						scriptEnabled: false,
						overrideDestinationChannelEnabled: true,
						channel: '#general',
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
					type: 'webhook-incoming-invalid',
					name: 'Incoming test',
					enabled: true,
					alias: 'test',
					username: 'rocket.cat',
					scriptEnabled: false,
					overrideDestinationChannelEnabled: true,
					channel: '#general',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Invalid integration type.');
				})
				.end(done);
		});

		it('should add the integration successfully when the user ONLY has the permission "manage-incoming-integrations" to add an incoming integration', (done) => {
			let integrationId;
			updatePermission('manage-own-incoming-integrations', ['admin']).then(() => {
				request
					.post(api('integrations.create'))
					.set(credentials)
					.send({
						type: 'webhook-incoming',
						name: 'Incoming test',
						enabled: true,
						alias: 'test',
						username: 'rocket.cat',
						scriptEnabled: false,
						overrideDestinationChannelEnabled: false,
						channel: '#general',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('integration').and.to.be.an('object');
						integrationId = res.body.integration._id;
					})
					.end(() => removeIntegration(integrationId, 'incoming').then(done));
			});
		});

		it('should add the integration successfully when the user ONLY has the permission "manage-own-incoming-integrations" to add an incoming integration', (done) => {
			updatePermission('manage-incoming-integrations', []).then(() => {
				updatePermission('manage-own-incoming-integrations', ['admin']).then(() => {
					request
						.post(api('integrations.create'))
						.set(credentials)
						.send({
							type: 'webhook-incoming',
							name: 'Incoming test 2',
							enabled: true,
							alias: 'test2',
							username: 'rocket.cat',
							scriptEnabled: false,
							overrideDestinationChannelEnabled: false,
							channel: '#general',
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

		it('should execute the incoming integration', (done) => {
			request
				.post(`/hooks/${integration._id}/${integration.token}`)
				.send({
					text: 'Example message',
				})
				.expect(200)
				.end(done);
		});

		it("should return an error when sending 'channel' field telling its configuration is disabled", (done) => {
			request
				.post(`/hooks/${integration._id}/${integration.token}`)
				.send({
					text: 'Example message',
					channel: [testChannelName],
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'overriding destination channel is disabled for this integration');
				})
				.end(done);
		});

		it("should return an error when sending 'roomId' field telling its configuration is disabled", (done) => {
			request
				.post(`/hooks/${integration._id}/${integration.token}`)
				.send({
					text: 'Example message',
					roomId: channel._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'overriding destination channel is disabled for this integration');
				})
				.end(done);
		});
		it('should send a message for a channel that is specified in the webhooks configuration', (done) => {
			const successfulMesssage = `Message sent successfully at #${Date.now()}`;
			request
				.post(`/hooks/${integration._id}/${integration.token}`)
				.send({
					text: successfulMesssage,
				})
				.expect(200)
				.end(() => {
					return request
						.get(api('channels.messages'))
						.set(credentials)
						.query({
							roomId: 'GENERAL',
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('messages').and.to.be.an('array');
							expect(!!res.body.messages.find((m) => m.msg === successfulMesssage)).to.be.true;
						})
						.end(done);
				});
		});
		it('should send a message for a channel that is not specified in the webhooks configuration', async () => {
			await request
				.put(api('integrations.update'))
				.set(credentials)
				.send({
					type: 'webhook-incoming',
					overrideDestinationChannelEnabled: true,
					integrationId: integration._id,
					username: 'rocket.cat',
					channel: '#general',
					scriptEnabled: true,
					enabled: true,
					name: integration.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('integration');
					expect(res.body.integration.overrideDestinationChannelEnabled).to.be.equal(true);
				});
			const successfulMesssage = `Message sent successfully at #${Date.now()}`;
			await request
				.post(`/hooks/${integration._id}/${integration.token}`)
				.send({
					text: successfulMesssage,
					channel: [testChannelName],
				})
				.expect(200);

			return request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: channel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					expect(!!res.body.messages.find((m) => m.msg === successfulMesssage)).to.be.true;
				});
		});
	});

	describe('[/integrations.history]', () => {
		it('should return an error when trying to get history of incoming integrations', (done) => {
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

	describe('[/integrations.list]', () => {
		before((done) => {
			createUser().then((createdUser) => {
				user = createdUser;
				login(user.username, password).then((credentials) => {
					userCredentials = credentials;
					updatePermission('manage-incoming-integrations', ['user']).then(() => {
						createIntegration(
							{
								type: 'webhook-incoming',
								name: 'Incoming test',
								enabled: true,
								alias: 'test',
								username: 'rocket.cat',
								scriptEnabled: false,
								overrideDestinationChannelEnabled: true,
								channel: '#general',
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

		it('should return the list of incoming integrations', (done) => {
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

		it('should return the list of integrations created by the user only', (done) => {
			updatePermission('manage-incoming-integrations', []).then(() => {
				updatePermission('manage-own-incoming-integrations', ['user']).then(() => {
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

		it('should return an error when the user DOES NOT have the permission "manage-incoming-integrations" to get an incoming integration', (done) => {
			updatePermission('manage-incoming-integrations', []).then(() => {
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

		it('should return an error when the user DOES NOT have the permission "manage-incoming-integrations" to get an incoming integration created by another user', (done) => {
			updatePermission('manage-incoming-integrations', []).then(() => {
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
			updatePermission('manage-incoming-integrations', ['admin']).then(() => {
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
			updatePermission('manage-incoming-integrations', [])
				.then(() => updatePermission('manage-own-incoming-integrations', ['user']))
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
			updatePermission('manage-incoming-integrations', ['admin']).then(() => {
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

	describe('[/integrations.update]', () => {
		it('should update an integration by id and return the new data', (done) => {
			request
				.put(api('integrations.update'))
				.set(credentials)
				.send({
					type: 'webhook-incoming',
					name: 'Incoming test updated',
					enabled: true,
					alias: 'test updated',
					username: 'rocket.cat',
					scriptEnabled: true,
					overrideDestinationChannelEnabled: true,
					channel: '#general',
					integrationId: integration._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('integration');
					expect(res.body.integration._id).to.be.equal(integration._id);
					expect(res.body.integration.name).to.be.equal('Incoming test updated');
					expect(res.body.integration.alias).to.be.equal('test updated');
				})
				.end(done);
		});

		it('should have integration updated on subsequent gets', (done) => {
			request
				.get(api(`integrations.get?integrationId=${integration._id}`))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('integration');
					expect(res.body.integration._id).to.be.equal(integration._id);
					expect(res.body.integration.name).to.be.equal('Incoming test updated');
					expect(res.body.integration.alias).to.be.equal('test updated');
				})
				.end(done);
		});
	});

	describe('[/integrations.remove]', () => {
		it('should return an error when the user DOES NOT have the permission "manage-incoming-integrations" to remove an incoming integration', (done) => {
			updatePermission('manage-incoming-integrations', []).then(() => {
				request
					.post(api('integrations.remove'))
					.set(credentials)
					.send({
						integrationId: integration._id,
						type: 'webhook-incoming',
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

		it('should return an error when the user DOES NOT have the permission "manage-own-incoming-integrations" to remove an incoming integration', (done) => {
			updatePermission('manage-own-incoming-integrations', []).then(() => {
				request
					.post(api('integrations.remove'))
					.set(credentials)
					.send({
						integrationId: integration._id,
						type: 'webhook-incoming',
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
			updatePermission('manage-own-incoming-integrations', ['admin']).then(() => {
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

		it('should remove the integration successfully when the user at least one of the necessary permission to remove an incoming integration', (done) => {
			updatePermission('manage-incoming-integrations', ['admin']).then(() => {
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

		it('the normal user should remove the integration successfully when the user have the "manage-own-incoming-integrations" to remove an incoming integration', (done) => {
			updatePermission('manage-own-incoming-integrations', ['user']).then(() => {
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

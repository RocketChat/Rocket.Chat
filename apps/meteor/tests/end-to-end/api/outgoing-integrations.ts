import { after, afterEach, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import type { IIntegration, IOutgoingIntegration, IRoom, IUser } from '@rocket.chat/core-typings';
import { assert, expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { createIntegration, removeIntegration } from '../../data/integration.helper';
import { updatePermission } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Outgoing Integrations]', () => {
	let integrationCreatedByAnUser: IIntegration;
	let user: TestUser<IUser>;
	let userCredentials: Credentials;

	before((_t, done) => getCredentials(done));

	before(async () => {
		user = await createUser();
		userCredentials = await login(user.username, password);
		await updatePermission('manage-outgoing-integrations', ['user']);
		integrationCreatedByAnUser = await createIntegration(
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
		);
	});

	before(async () => {
		await Promise.all([
			updatePermission('manage-incoming-integrations', []),
			updatePermission('manage-own-incoming-integrations', []),
			updatePermission('manage-own-outgoing-integrations', []),
			updatePermission('manage-outgoing-integrations', []),
		]);
	});

	after(async () =>
		Promise.all([
			updatePermission('manage-incoming-integrations', ['admin']),
			updatePermission('manage-own-incoming-integrations', ['admin']),
			updatePermission('manage-own-outgoing-integrations', ['admin']),
			updatePermission('manage-outgoing-integrations', ['admin']),
			deleteUser(user),
		]),
	);

	let integration: IIntegration;

	describe('[/integrations.create]', () => {
		it('should return an error when the user DOES NOT have the permission "manage-outgoing-integrations" to add an outgoing integration', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', []).then(() => {
				void request
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
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-forbidden');
					})
					.end(done);
			});
		});

		it('should return an error when the user DOES NOT have the permission "manage-own-outgoing-integrations" to add an outgoing integration', (_t, done) => {
			void updatePermission('manage-own-outgoing-integrations', []).then(() => {
				void request
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
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-forbidden');
					})
					.end(done);
			});
		});

		it('should return an error when the user sends an invalid type of integration', (_t, done) => {
			void request
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

		it('should add the integration successfully when the user ONLY has the permission "manage-outgoing-integrations" to add an outgoing integration', (_t, done) => {
			let integrationId: IIntegration['_id'];
			void updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				void request
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

		it('should add the integration successfully when the user ONLY has the permission "manage-own-outgoing-integrations" to add an outgoing integration', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', []).then(() => {
				void updatePermission('manage-own-outgoing-integrations', ['admin']).then(() => {
					void request
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

		it('should create an outgoing integration successfully', (_t, done) => {
			let integrationId: IIntegration['_id'];
			void request
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
					expect(res.body).to.have.nested.property('integration.name', 'Guggy');
					expect(res.body).to.have.nested.property('integration.type', 'webhook-outgoing');
					expect(res.body).to.have.nested.property('integration.enabled', true);
					expect(res.body).to.have.nested.property('integration.username', 'rocket.cat');
					expect(res.body).to.have.nested.property('integration.event', 'sendMessage');
					integrationId = res.body.integration._id;
				})
				.end(() => removeIntegration(integrationId, 'outgoing').then(done));
		});
	});

	describe('[/integrations.list]', () => {
		it('should return the list of outgoing integrations', (_t, done) => {
			void request
				.get(api('integrations.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const integrationCreatedByAdmin = (res.body.integrations as IIntegration[]).find(
						(createdIntegration) => createdIntegration._id === integration._id,
					);
					assert.isDefined(integrationCreatedByAdmin);
					expect(integrationCreatedByAdmin).to.be.an('object');
					expect(integrationCreatedByAdmin._id).to.be.equal(integration._id);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('items');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});

		it('should return the list create by the user only', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', []).then(() => {
				void updatePermission('manage-own-outgoing-integrations', ['user']).then(() => {
					void request
						.get(api('integrations.list'))
						.set(userCredentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							const integrationCreatedByAdmin = (res.body.integrations as IIntegration[]).find(
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

		it('should return unauthorized error when the user does not have any integrations permissions', async () => {
			await Promise.all([
				updatePermission('manage-incoming-integrations', []),
				updatePermission('manage-own-incoming-integrations', []),
				updatePermission('manage-outgoing-integrations', []),
				updatePermission('manage-outgoing-integrations', []),
			]);

			await request
				.get(api('integrations.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-forbidden');
				});
		});
	});

	describe('[/integrations.history]', () => {
		it('should return an error when the user DOES NOT the necessary permission', async () => {
			await updatePermission('manage-outgoing-integrations', []);
			await updatePermission('manage-own-outgoing-integrations', []);
			await request
				.get(api('integrations.history'))
				.set(credentials)
				.query({
					id: integration._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-forbidden');
				});
		});

		it('should return the history of outgoing integrations', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				void request
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
		it('should return an error when the required "integrationId" query parameters is not sent', (_t, done) => {
			void request
				.get(api('integrations.get'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', `must have required property 'integrationId'`);
				})
				.end(done);
		});

		it('should return an error when the user DOES NOT have the permission "manage-outgoing-integrations" to get an outgoing integration', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', []).then(() => {
				void request
					.get(api('integrations.get'))
					.query({ integrationId: integration._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-forbidden');
					})
					.end(done);
			});
		});

		it('should return an error when the user DOES NOT have the permission "manage-outgoing-integrations" to get an outgoing integration created by another user', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', []).then(() => {
				void request
					.get(api('integrations.get'))
					.query({ integrationId: integrationCreatedByAnUser._id })
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-forbidden');
					})
					.end(done);
			});
		});

		it('should return an error when the user sends an invalid integration', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				void request
					.get(api('integrations.get'))
					.query({ integrationId: 'invalid' })
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

		it('should return the integration successfully when the user is able to see only your own integrations', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', [])
				.then(() => updatePermission('manage-own-outgoing-integrations', ['user']))
				.then(() => {
					void request
						.get(api('integrations.get'))
						.query({ integrationId: integrationCreatedByAnUser._id })
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

		it('should return the integration successfully', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				void request
					.get(api('integrations.get'))
					.query({ integrationId: integration._id })
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
		let userIntegration: IIntegration;
		let adminIntegration: IIntegration;
		let privateGroup: IRoom;

		const webhook = {
			type: 'webhook-outgoing' as const,
			enabled: true,
			event: 'sendMessage' as const,
			username: 'rocket.cat',
			urls: ['http://example.com/hook'],
			scriptEnabled: true,
			script: 'class Script { prepare_outgoing_request({ request }) { return request; } }',
			channel: '#general',
			triggerWords: ['!hook'],
			token: 'outgoing-webhook-token',
		};

		const update = (userCredentials: Credentials, target: IIntegration, body: Record<string, unknown> = {}) =>
			request
				.put(api('integrations.update'))
				.set(userCredentials)
				.send({ ...webhook, integrationId: target._id, name: target.name, ...body });

		const stored = async (integration: IIntegration) =>
			(await request.get(api('integrations.get')).set(credentials).query({ integrationId: integration._id })).body
				.integration as IOutgoingIntegration;

		const grant = (own: string[], all: string[]) =>
			Promise.all([
				updatePermission('manage-own-outgoing-integrations', [...own, 'admin']),
				updatePermission('manage-outgoing-integrations', [...all, 'admin']),
			]);

		before(async () => {
			await grant(['user'], []);
			userIntegration = await createIntegration(
				{ ...webhook, name: 'User webhook', urls: ['http://example.com/user-hook'] },
				userCredentials,
			);
			adminIntegration = await createIntegration({ ...webhook, name: 'Admin webhook' }, credentials);
			privateGroup = (await createRoom({ type: 'p', name: `outgoing-update-${Date.now()}` })).body.group;
		});

		after(async () => {
			await removeIntegration(userIntegration._id, 'outgoing');
			await removeIntegration(adminIntegration._id, 'outgoing');
			await deleteRoom({ type: 'p', roomId: privateGroup._id });
			await Promise.all([updatePermission('manage-own-outgoing-integrations', []), updatePermission('manage-outgoing-integrations', [])]);
		});

		it('should let a user who manages only their own webhooks update their webhook', async () => {
			await grant(['user'], []);

			const res = await update(userCredentials, userIntegration, {
				name: 'Renamed by its creator',
				urls: ['http://example.com/renamed'],
			}).expect(200);

			expect(res.body.integration).to.include({ name: 'Renamed by its creator' });
			expect(res.body.integration.urls).to.deep.equal(['http://example.com/renamed']);
			expect(res.body.integration._updatedBy).to.have.property('username', user.username);
		});

		it('should refuse that user on a webhook created by someone else, and keep the webhook', async () => {
			await grant(['user'], []);
			const previous = await stored(adminIntegration);

			const res = await update(userCredentials, adminIntegration, { name: 'Taken over' }).expect(400);

			expect(res.body).to.have.property('errorType', 'invalid_integration');
			expect((await stored(adminIntegration)).name).to.equal(previous.name);
		});

		it('should refuse a user with no outgoing webhook permission, and keep the webhook', async () => {
			await grant([], []);
			const previous = await stored(userIntegration);

			const res = await update(userCredentials, userIntegration, { name: 'No permission' }).expect(403);

			expect(res.body).to.have.property('errorType', 'error-forbidden');
			expect((await stored(userIntegration)).name).to.equal(previous.name);
		});

		it('should let a user who manages all webhooks update a webhook created by someone else', async () => {
			await grant([], ['user']);

			const res = await update(userCredentials, adminIntegration, { name: 'Renamed by a manager' }).expect(200);

			expect(res.body.integration).to.include({ name: 'Renamed by a manager' });
		});

		it('should find the webhook by its target URL', async () => {
			await grant(['user'], []);
			const { urls } = await stored(userIntegration);

			const res = await update(userCredentials, userIntegration, {
				integrationId: undefined,
				target_url: urls?.[0],
				name: 'Found by its URL',
				urls,
			}).expect(200);

			expect(res.body.integration).to.include({ _id: userIntegration._id, name: 'Found by its URL' });
		});

		it('should refuse a room the user is not a member of, and keep the channel', async () => {
			await grant(['user'], []);

			const res = await update(userCredentials, userIntegration, { channel: `#${privateGroup.name}` }).expect(400);

			expect(res.body).to.have.property('errorType', 'error-invalid-channel');
			expect((await stored(userIntegration)).channel).to.deep.equal(['#general']);
		});

		it('should refuse a channel that does not start with # or @, and keep the channel', async () => {
			await grant(['user'], []);

			const res = await update(userCredentials, userIntegration, { channel: 'general' }).expect(400);

			expect(res.body).to.have.property('errorType', 'error-invalid-channel-start-with-chars');
			expect((await stored(userIntegration)).channel).to.deep.equal(['#general']);
		});

		it('should refuse a webhook without any URL, and keep its URLs', async () => {
			await grant(['user'], []);
			const previous = await stored(userIntegration);

			const res = await update(userCredentials, userIntegration, { urls: [' '] }).expect(400);

			expect(res.body).to.have.property('errorType', 'error-invalid-urls');
			expect((await stored(userIntegration)).urls).to.deep.equal(previous.urls);
		});

		it('should keep the error of a script that does not compile, and replace it once the script compiles', async () => {
			await grant(['user'], []);

			await update(userCredentials, userIntegration, { script: 'class Script {' }).expect(200);
			const broken = await stored(userIntegration);
			expect(broken).to.have.property('scriptError');
			expect(broken).to.not.have.property('scriptCompiled');

			await update(userCredentials, userIntegration).expect(200);
			const fixed = await stored(userIntegration);
			expect(fixed).to.have.property('scriptCompiled');
			expect(fixed).to.not.have.property('scriptError');
		});
	});

	describe('[/integrations.remove]', () => {
		it('should return an error when the user DOES NOT have the permission "manage-outgoing-integrations" to remove an outgoing integration', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', []).then(() => {
				void request
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
						expect(res.body).to.have.property('errorType', 'error-forbidden');
					})
					.end(done);
			});
		});

		it('should return an error when the user DOES NOT have the permission "manage-own-outgoing-integrations" to remove an outgoing integration', (_t, done) => {
			void updatePermission('manage-own-incoming-integrations', []).then(() => {
				void request
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
						expect(res.body).to.have.property('errorType', 'error-forbidden');
					})
					.end(done);
			});
		});

		it('should return an error when the user sends an invalid type of integration', (_t, done) => {
			void updatePermission('manage-own-outgoing-integrations', ['admin']).then(() => {
				void request
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

		it('should remove the integration successfully when the user at least one of the necessary permission to remove an outgoing integration', (_t, done) => {
			void updatePermission('manage-outgoing-integrations', ['admin']).then(() => {
				void request
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

		it('the normal user should remove the integration successfully when the user have the "manage-own-outgoing-integrations" to remove an outgoing integration', (_t, done) => {
			void updatePermission('manage-own-outgoing-integrations', ['user']).then(() => {
				void request
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

	describe('[/integrations.clearHistory] and [/integrations.replayOutgoing]', () => {
		let integrationId: IIntegration['_id'];

		before(async () => {
			await updatePermission('manage-outgoing-integrations', ['admin']);
			const created = await createIntegration(
				{
					type: 'webhook-outgoing',
					name: 'clear-replay-test',
					enabled: true,
					username: 'rocket.cat',
					urls: ['http://example.com/hook'],
					scriptEnabled: false,
					channel: '#general',
					triggerWords: ['!clearreplaytest'],
					event: 'sendMessage',
				},
				credentials,
			);
			integrationId = created._id;
		});

		after(async () => {
			await updatePermission('manage-outgoing-integrations', ['admin']);
			await removeIntegration(integrationId, 'outgoing');
			await Promise.all([updatePermission('manage-outgoing-integrations', []), updatePermission('manage-own-outgoing-integrations', [])]);
		});

		afterEach(() => updatePermission('manage-outgoing-integrations', ['admin']));

		describe('[/integrations.clearHistory]', () => {
			it('should fail when unauthenticated', async () => {
				await request.post(api('integrations.clearHistory')).send({ integrationId }).expect(401);
			});

			it('should fail with 400 when integrationId is not provided', async () => {
				await request.post(api('integrations.clearHistory')).set(credentials).send({}).expect(400);
			});

			it('should fail with 400 when the integration does not exist', async () => {
				await request
					.post(api('integrations.clearHistory'))
					.set(credentials)
					.send({ integrationId: 'does-not-exist' })
					.expect(400)
					.expect((res) => expect(res.body).to.have.property('success', false));
			});

			it('should fail with 403 when the user lacks the manage-outgoing-integrations permission', async () => {
				await Promise.all([updatePermission('manage-outgoing-integrations', []), updatePermission('manage-own-outgoing-integrations', [])]);
				await request
					.post(api('integrations.clearHistory'))
					.set(credentials)
					.send({ integrationId })
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-forbidden');
						expect(res.body).to.have.property('error', 'Unauthorized');
					});
			});

			it('should clear the integration history', async () => {
				await request
					.post(api('integrations.clearHistory'))
					.set(credentials)
					.send({ integrationId })
					.expect(200)
					.expect((res) => expect(res.body).to.have.property('success', true));
			});
		});

		describe('[/integrations.replayOutgoing]', () => {
			it('should fail when unauthenticated', async () => {
				await request.post(api('integrations.replayOutgoing')).send({ integrationId, historyId: 'x' }).expect(401);
			});

			it('should fail with 400 when required params are missing', async () => {
				await request.post(api('integrations.replayOutgoing')).set(credentials).send({ integrationId }).expect(400);
			});

			it('should fail with 400 when the integration does not exist', async () => {
				await request
					.post(api('integrations.replayOutgoing'))
					.set(credentials)
					.send({ integrationId: 'does-not-exist', historyId: 'x' })
					.expect(400)
					.expect((res) => expect(res.body).to.have.property('success', false));
			});

			it('should fail with 400 when the history does not exist', async () => {
				await request
					.post(api('integrations.replayOutgoing'))
					.set(credentials)
					.send({ integrationId, historyId: 'does-not-exist' })
					.expect(400)
					.expect((res) => expect(res.body).to.have.property('success', false));
			});

			it('should fail with 400 when the user lacks permission (integration becomes inaccessible)', async () => {
				await Promise.all([updatePermission('manage-outgoing-integrations', []), updatePermission('manage-own-outgoing-integrations', [])]);
				await request
					.post(api('integrations.replayOutgoing'))
					.set(credentials)
					.send({ integrationId, historyId: 'x' })
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-invalid-integration');
					});
			});
		});
	});
});

import type { Credentials } from '@rocket.chat/api-client';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { before, describe, after, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { sendSimpleMessage } from '../../data/chat.helper';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

const resetAutoTranslateDefaults = async () => {
	await Promise.all([
		updateSetting('AutoTranslate_Enabled', false),
		updateSetting('AutoTranslate_AutoEnableOnJoinRoom', false),
		updateSetting('Language', ''),
		updatePermission('auto-translate', ['admin']),
	]);
};

const resetE2EDefaults = async () => {
	await Promise.all([updateSetting('E2E_Enabled_Default_PrivateRooms', false), updateSetting('E2E_Enable', false)]);
};

describe('AutoTranslate', () => {
	before((done) => getCredentials(done));

	describe('[AutoTranslate]', () => {
		describe('[/autotranslate.getSupportedLanguages', () => {
			before(() => resetAutoTranslateDefaults());
			after(() => resetAutoTranslateDefaults());

			it('should throw an error when the "AutoTranslate_Enabled" setting is disabled', (done) => {
				void request
					.get(api('autotranslate.getSupportedLanguages'))
					.set(credentials)
					.query({
						targetLanguage: 'en',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('AutoTranslate is disabled.');
					})
					.end(done);
			});
			it('should throw an error when the user does not have the "auto-translate" permission', (done) => {
				void updateSetting('AutoTranslate_Enabled', true).then(() => {
					void updatePermission('auto-translate', []).then(() => {
						void request
							.get(api('autotranslate.getSupportedLanguages'))
							.set(credentials)
							.query({
								targetLanguage: 'en',
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.a.property('success', false);
								expect(res.body.errorType).to.be.equal('error-action-not-allowed');
								expect(res.body.error).to.be.equal('Auto-Translate is not allowed [error-action-not-allowed]');
							})
							.end(done);
					});
				});
			});

			it('should return a list of languages', async () => {
				await updatePermission('auto-translate', ['admin']);
				await request
					.get(api('autotranslate.getSupportedLanguages'))
					.set(credentials)
					.query({
						targetLanguage: 'en',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body.languages).to.be.an('array');
					});
			});
		});

		describe('[/autotranslate.saveSettings', () => {
			let testGroupId: IRoom['_id'];
			let testChannelId: IRoom['_id'];

			before(async () => {
				await Promise.all([
					resetAutoTranslateDefaults(),
					updateSetting('E2E_Enable', true),
					updateSetting('E2E_Enabled_Default_PrivateRooms', true),
				]);

				testGroupId = (await createRoom({ type: 'p', name: `e2etest-autotranslate-${Date.now()}` })).body.group._id;
				testChannelId = (await createRoom({ type: 'c', name: `test-autotranslate-${Date.now()}` })).body.channel._id;
			});

			after(async () => {
				await Promise.all([
					resetAutoTranslateDefaults(),
					resetE2EDefaults(),
					deleteRoom({ type: 'p', roomId: testGroupId }),
					deleteRoom({ type: 'c', roomId: testChannelId }),
				]);
			});

			it('should throw an error when the "AutoTranslate_Enabled" setting is disabled', (done) => {
				void request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: testChannelId,
						field: 'autoTranslate',
						defaultLanguage: 'en',
						value: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('AutoTranslate is disabled.');
					})
					.end(done);
			});
			it('should throw an error when the user does not have the "auto-translate" permission', (done) => {
				void updateSetting('AutoTranslate_Enabled', true).then(() => {
					void updatePermission('auto-translate', []).then(() => {
						void request
							.post(api('autotranslate.saveSettings'))
							.set(credentials)
							.send({
								roomId: testChannelId,
								defaultLanguage: 'en',
								field: 'autoTranslateLanguage',
								value: 'en',
							})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.a.property('success', false);
								expect(res.body.errorType).to.be.equal('error-action-not-allowed');
								expect(res.body.error).to.be.equal('Auto-Translate is not allowed [error-action-not-allowed]');
							})
							.end(done);
					});
				});
			});
			it('should throw an error when the bodyParam "roomId" is not provided', (done) => {
				void updatePermission('auto-translate', ['admin']).then(() => {
					void request
						.post(api('autotranslate.saveSettings'))
						.set(credentials)
						.send({})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
						})
						.end(done);
				});
			});
			it('should throw an error when the bodyParam "field" is not provided', (done) => {
				void request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: testChannelId,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "value" is not provided', (done) => {
				void request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: testChannelId,
						field: 'autoTranslate',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "autoTranslate" is not a boolean', (done) => {
				void request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: testChannelId,
						field: 'autoTranslate',
						value: 'test',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "autoTranslateLanguage" is not a string', (done) => {
				void request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: testChannelId,
						field: 'autoTranslateLanguage',
						value: 12,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "field" is invalid', (done) => {
				void request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: testChannelId,
						field: 'invalid',
						value: 12,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "roomId" is invalid or the user is not subscribed', (done) => {
				void request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: 'invalid',
						field: 'autoTranslateLanguage',
						value: 'en',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.errorType).to.be.equal('error-invalid-subscription');
						expect(res.body.error).to.be.equal('Invalid subscription [error-invalid-subscription]');
					})
					.end(done);
			});
			it('should throw an error when E2E encryption is enabled', async () => {
				await request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: testGroupId,
						field: 'autoTranslate',
						defaultLanguage: 'en',
						value: true,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-e2e-enabled');
					});
			});
			it('should return success when the setting is saved correctly', (done) => {
				void request
					.post(api('autotranslate.saveSettings'))
					.set(credentials)
					.send({
						roomId: testChannelId,
						field: 'autoTranslateLanguage',
						value: 'en',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
					})
					.end(done);
			});
		});

		describe('[/autotranslate.translateMessage', () => {
			let messageSent: IMessage;
			let testChannelId: IRoom['_id'];

			before(async () => {
				await resetAutoTranslateDefaults();

				testChannelId = (await createRoom({ type: 'c', name: `test-autotranslate-message-${Date.now()}` })).body.channel._id;
				const res = await sendSimpleMessage({
					roomId: testChannelId,
					text: 'Isso é um teste',
				});
				messageSent = res.body.message;
			});

			after(async () => {
				await Promise.all([resetAutoTranslateDefaults(), deleteRoom({ type: 'c', roomId: testChannelId })]);
			});

			it('should throw an error when the "AutoTranslate_Enabled" setting is disabled', (done) => {
				void request
					.post(api('autotranslate.translateMessage'))
					.set(credentials)
					.send({
						messageId: 'test',
						targetLanguage: 'en',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('AutoTranslate is disabled.');
					})
					.end(done);
			});
			it('should throw an error when the bodyParam "messageId" is not provided', (done) => {
				void updateSetting('AutoTranslate_Enabled', true).then(() => {
					void updatePermission('auto-translate', ['admin']).then(() => {
						void request
							.post(api('autotranslate.translateMessage'))
							.set(credentials)
							.send({})
							.expect('Content-Type', 'application/json')
							.expect(400)
							.expect((res) => {
								expect(res.body).to.have.a.property('success', false);
							})
							.end(done);
					});
				});
			});
			it('should throw an error when the bodyParam "messageId" is invalid', (done) => {
				void request
					.post(api('autotranslate.translateMessage'))
					.set(credentials)
					.send({
						messageId: 'invalid',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body.error).to.be.equal('Message not found.');
					})
					.end(done);
			});
			it('should return success when the translate is successful', (done) => {
				void request
					.post(api('autotranslate.translateMessage'))
					.set(credentials)
					.send({
						messageId: messageSent._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
					})
					.end(done);
			});
		});

		describe('Autoenable setting', () => {
			let userA: TestUser<IUser>;
			let userB: TestUser<IUser>;
			let credA: Credentials;
			let credB: Credentials;
			let channel: IRoom;
			const channelsToRemove: IRoom[] = [];

			const createChannel = async (members: string[] | undefined, cred: Credentials) =>
				(await createRoom({ type: 'c', members, name: `channel-test-${Date.now()}`, credentials: cred })).body.channel;

			const setLanguagePref = async (language: string, cred: Credentials) => {
				await request
					.post(api('users.setPreferences'))
					.set(cred)
					.send({ data: { language } })
					.expect(200)
					.expect('Content-Type', 'application/json')
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			};

			const getSub = async (roomId: IRoom['_id'], cred: Credentials) =>
				(
					await request
						.get(api('subscriptions.getOne'))
						.set(cred)
						.query({
							roomId,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('subscription').and.to.be.an('object');
						})
				).body.subscription;

			before(async () => {
				await Promise.all([
					updateSetting('AutoTranslate_Enabled', true),
					updateSetting('AutoTranslate_AutoEnableOnJoinRoom', true),
					updateSetting('Language', 'pt-BR'),
				]);

				userA = await createUser();
				userB = await createUser();

				credA = await login(userA.username, password);
				credB = await login(userB.username, password);

				channel = await createChannel(undefined, credA);

				await setLanguagePref('en', credB);
				channelsToRemove.push(channel);
			});

			after(async () => {
				await Promise.all([
					updateSetting('AutoTranslate_AutoEnableOnJoinRoom', false),
					updateSetting('AutoTranslate_Enabled', false),
					updateSetting('Language', ''),
					deleteUser(userA),
					deleteUser(userB),
					channelsToRemove.map(() => deleteRoom({ type: 'c', roomId: channel._id })),
				]);
			});

			it("should do nothing if the user hasn't changed his language preference", async () => {
				const sub = await getSub(channel._id, credA);
				expect(sub).to.not.have.property('autoTranslate');
				expect(sub).to.not.have.property('autoTranslateLanguage');
			});

			it("should do nothing if the user changed his language preference to be the same as the server's", async () => {
				await setLanguagePref('pt-BR', credA);

				const sub = await getSub(channel._id, credA);
				expect(sub).to.not.have.property('autoTranslate');
				expect(sub).to.not.have.property('autoTranslateLanguage');
			});

			it('should enable autotranslate with the correct language when joining a room', async () => {
				await request
					.post(api('channels.join'))
					.set(credB)
					.send({
						roomId: channel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				const sub = await getSub(channel._id, credB);
				expect(sub).to.have.property('autoTranslate');
				expect(sub).to.have.property('autoTranslateLanguage').and.to.be.equal('en');
			});

			it('should enable autotranslate with the correct language when creating a new room', async () => {
				await setLanguagePref('en', credA);

				const newChannel = await createChannel(undefined, credA);
				const sub = await getSub(newChannel._id, credA);
				expect(sub).to.have.property('autoTranslate');
				expect(sub).to.have.property('autoTranslateLanguage').and.to.be.equal('en');
				channelsToRemove.push(newChannel);
			});

			it('should enable autotranslate for all the members added to the room upon creation', async () => {
				const newChannel = await createChannel([userA.username, userB.username], credA);
				const subA = await getSub(newChannel._id, credA);
				expect(subA).to.have.property('autoTranslate');
				expect(subA).to.have.property('autoTranslateLanguage').and.to.be.equal('en');

				const subB = await getSub(newChannel._id, credB);
				expect(subB).to.have.property('autoTranslate');
				expect(subB).to.have.property('autoTranslateLanguage').and.to.be.equal('en');
				channelsToRemove.push(newChannel);
			});

			it('should enable autotranslate with the correct language when added to a room', async () => {
				const newChannel = await createChannel(undefined, credA);
				await request
					.post(api('channels.invite'))
					.set(credA)
					.send({
						roomId: newChannel._id,
						userId: userB._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200);

				const sub = await getSub(newChannel._id, credB);
				expect(sub).to.have.property('autoTranslate');
				expect(sub).to.have.property('autoTranslateLanguage').and.to.be.equal('en');
				channelsToRemove.push(newChannel);
			});

			it('should change the auto translate language when the user changes his language preference', async () => {
				await setLanguagePref('es', credA);
				const newChannel = await createChannel(undefined, credA);
				const subscription = await getSub(newChannel._id, credA);

				expect(subscription).to.have.property('autoTranslate', true);
				expect(subscription).to.have.property('autoTranslateLanguage', 'es');
				channelsToRemove.push(newChannel);
			});
		});
	});
});

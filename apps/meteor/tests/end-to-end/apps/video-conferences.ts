import { after, before, describe, it } from 'node:test';

import type { Credentials } from '@rocket.chat/api-client';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import type { IUser, VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import type { Response } from 'supertest';

import { getCredentials, request, api, credentials } from '../../data/api-data';
import { cleanupApps, installTestApp } from '../../data/apps/helper';
import { withDatabase } from '../../data/database.helper';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom, getSubscriptionByRoomId } from '../../data/rooms.helper';
import { adminUsername, password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

describe('Apps - Video Conferences', () => {
	before((_t, done) => getCredentials(done));

	const roomName = `apps-e2etest-room-${Date.now()}-videoconf`;
	let roomId: string | undefined;

	before(async () => {
		const res = await createRoom({
			type: 'p',
			name: roomName,
			username: undefined,
			members: undefined,
			credentials: undefined,
			extraData: undefined,
		});

		roomId = res.body.group._id;
	});

	after(() =>
		Promise.all([cleanupApps(), deleteRoom({ type: 'p', roomId: roomId as string }), updateSetting('VideoConf_Default_Provider', '')]),
	);

	describe('[With No App]', () => {
		before(async () => {
			await cleanupApps();
		});

		it('should fail to load capabilities', async () => {
			await request
				.get(api('video-conference.capabilities'))
				.set(credentials)
				.send()
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
					expect(res.body.error).to.be.equal('no-videoconf-provider-app');
				});
		});

		it('should fail to start a call', async () => {
			await request
				.post(api('video-conference.start'))
				.set(credentials)
				.send({
					roomId,
				})
				.expect(400)
				.expect((res: Response) => {
					expect(res.body.success).to.be.equal(false);
					expect(res.body.error).to.be.equal('no-videoconf-provider-app');
				});
		});
	});

	(IS_EE ? describe : describe.skip)('[With Test App]', () => {
		before(async () => {
			await cleanupApps();
			await installTestApp();
			await updateSetting('Discussion_enabled', true);
		});

		after(async () => {
			await updateSetting('VideoConf_Default_Provider', '');
			await updateSetting('Discussion_enabled', true);
			if (!process.env.IS_EE) {
				return;
			}

			await updateSetting('VideoConf_Enable_Persistent_Chat', false);
			await updateSetting('VideoConf_Persistent_Chat_Discussion_Name', '[date] - Video Call Persisted Chat');
		});

		describe('[/video-conference.capabilities]', () => {
			it('should fail to load capabilities with no default provider', async () => {
				await updateSetting('VideoConf_Default_Provider', '');
				await request
					.get(api('video-conference.capabilities'))
					.set(credentials)
					.send()
					.expect(400)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(false);
						expect(res.body.error).to.be.equal('no-active-video-conf-provider');
					});
			});

			it('should fail to load capabilities with an invalid default provider', async () => {
				await updateSetting('VideoConf_Default_Provider', 'invalid');
				await request
					.get(api('video-conference.capabilities'))
					.set(credentials)
					.send()
					.expect(400)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(false);
						expect(res.body.error).to.be.equal('no-active-video-conf-provider');
					});
			});

			it('should fail to load capabilities with a default provider lacking configuration', async () => {
				await updateSetting('VideoConf_Default_Provider', 'unconfigured');
				await request
					.get(api('video-conference.capabilities'))
					.set(credentials)
					.send()
					.expect(400)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(false);
						expect(res.body.error).to.be.equal('video-conf-provider-not-configured');
					});
			});

			it('should load capabilities successfully with a valid default provider', async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
				await request
					.get(api('video-conference.capabilities'))
					.set(credentials)
					.send()
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body.providerName).to.be.equal('test');
						expect(res.body.capabilities).to.be.an('object');
						expect(res.body.capabilities).to.have.a.property('mic').equal(true);
						expect(res.body.capabilities).to.have.a.property('cam').equal(false);
						expect(res.body.capabilities).to.have.a.property('title').equal(true);
						expect(res.body.capabilities).to.have.a.property('persistentChat').equal(false);
					});
			});
		});

		describe('[/video-conference.start]', () => {
			it('should fail to start a call with no default provider', async () => {
				await updateSetting('VideoConf_Default_Provider', '');
				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
					})
					.expect(400)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(false);
						expect(res.body.error).to.be.equal('no-active-video-conf-provider');
					});
			});

			it('should fail to start a call with an invalid default provider', async () => {
				await updateSetting('VideoConf_Default_Provider', 'invalid');
				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
					})
					.expect(400)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(false);
						expect(res.body.error).to.be.equal('no-active-video-conf-provider');
					});
			});

			it('should fail to start a call with a default provider lacking configuration', async () => {
				await updateSetting('VideoConf_Default_Provider', 'unconfigured');
				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
					})
					.expect(400)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(false);
						expect(res.body.error).to.be.equal('video-conf-provider-not-configured');
					});
			});

			it('should start a call successfully with a valid default provider', async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body.data).to.be.an('object');
						expect(res.body.data).to.have.a.property('providerName').equal('test');
						expect(res.body.data).to.have.a.property('type').equal('videoconference');
						expect(res.body.data).to.have.a.property('callId').that.is.a('string');
						// expect(res.body.data).to.have.a.property('rid').equal(roomId);
						// expect(res.body.data).to.have.a.property('createdBy').that.is.an('object').with.a.property('username').equal(adminUsername);
					});
			});

			it('should start a call successfully when sending a title', async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
						title: 'Conference Title',
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body.data).to.be.an('object');
						expect(res.body.data).to.have.a.property('providerName').equal('test');
						expect(res.body.data).to.have.a.property('type').equal('videoconference');
						expect(res.body.data).to.have.a.property('callId').that.is.a('string');
					});
			});

			it('should start a call successfully when sending the allowRinging attribute', async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
						title: 'Conference Title',
						allowRinging: true,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body.data).to.be.an('object');
						expect(res.body.data).to.have.a.property('providerName').equal('test');
						expect(res.body.data).to.have.a.property('type').equal('videoconference');
						expect(res.body.data).to.have.a.property('callId').that.is.a('string');
					});
			});

			it('should start a call successfully when using a provider that supports persistent chat', async () => {
				await updateSetting('VideoConf_Default_Provider', 'persistentchat');
				await updateSetting('VideoConf_Enable_Persistent_Chat', true);

				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body.data).to.be.an('object');
						expect(res.body.data).to.have.a.property('providerName').equal('persistentchat');
						expect(res.body.data).to.have.a.property('type').equal('videoconference');
						expect(res.body.data).to.have.a.property('callId').that.is.a('string');
					});
			});

			it('should start a call successfully when using a provider that supports persistent chat with the feature disabled', async () => {
				await updateSetting('VideoConf_Default_Provider', 'persistentchat');
				await updateSetting('VideoConf_Enable_Persistent_Chat', false);

				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body.data).to.be.an('object');
						expect(res.body.data).to.have.a.property('providerName').equal('persistentchat');
						expect(res.body.data).to.have.a.property('type').equal('videoconference');
						expect(res.body.data).to.have.a.property('callId').that.is.a('string');
					});
			});

			it('should start a call successfully when using a provider that supports persistent chat with discussions disabled', async () => {
				await updateSetting('VideoConf_Default_Provider', 'persistentchat');
				await updateSetting('VideoConf_Enable_Persistent_Chat', true);
				await updateSetting('Discussion_enabled', false);

				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body.data).to.be.an('object');
						expect(res.body.data).to.have.a.property('providerName').equal('persistentchat');
						expect(res.body.data).to.have.a.property('type').equal('videoconference');
						expect(res.body.data).to.have.a.property('callId').that.is.a('string');
					});
			});
		});

		describe('[/video-conference.join]', () => {
			let callId: string | undefined;

			before(async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
				const res = await request.post(api('video-conference.start')).set(credentials).send({
					roomId,
				});
				callId = res.body.data.callId;
			});

			it('should join a videoconference successfully', async () => {
				await request
					.post(api('video-conference.join'))
					.set(credentials)
					.send({
						callId,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body).to.have.a.property('providerName').equal('test');
						const userId = credentials['X-User-Id'];
						expect(res.body).to.have.a.property('url').equal(`test/videoconference/${callId}/${roomName}/${userId}`);
					});
			});

			it('should join a videoconference using the specified state', async () => {
				await request
					.post(api('video-conference.join'))
					.set(credentials)
					.send({
						callId,
						state: {
							mic: true,
							cam: false,
						},
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body).to.have.a.property('providerName').equal('test');
						const userId = credentials['X-User-Id'];
						expect(res.body).to.have.a.property('url').equal(`test/videoconference/${callId}/${roomName}/${userId}/mic`);
					});
			});
		});

		describe('[/video-conference.join] anonymous access', () => {
			let publicRoomId: string;
			let callId: string | undefined;
			let regularUser: Awaited<ReturnType<typeof createUser>>;
			let regularUserCredentials: Awaited<ReturnType<typeof login>>;

			before(async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');

				const roomRes = await createRoom({ type: 'c', name: `videoconf-anon-test-room-${Date.now()}` });
				publicRoomId = roomRes.body.channel._id;

				const startRes = await request.post(api('video-conference.start')).set(credentials).send({ roomId: publicRoomId });
				callId = startRes.body.data.callId;

				regularUser = await createUser({ roles: ['user'], active: true });
				regularUserCredentials = await login(regularUser.username, password);
			});

			after(() =>
				Promise.all([
					deleteRoom({ type: 'c', roomId: publicRoomId }),
					deleteUser(regularUser),
					updateSetting('Accounts_AllowAnonymousRead', false),
				]),
			);

			it('should allow an unauthenticated user to join when Accounts_AllowAnonymousRead is enabled', async () => {
				await updateSetting('Accounts_AllowAnonymousRead', true);

				await request
					.post(api('video-conference.join'))
					.send({ callId })
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('providerName', 'test');
					});
			});

			it('should allow an authenticated user to join when Accounts_AllowAnonymousRead is enabled', async () => {
				await updateSetting('Accounts_AllowAnonymousRead', true);

				await request
					.post(api('video-conference.join'))
					.set(regularUserCredentials)
					.send({ callId })
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('providerName', 'test');
					});
			});

			it('should allow an authenticated user to join when Accounts_AllowAnonymousRead is disabled', async () => {
				await updateSetting('Accounts_AllowAnonymousRead', false);

				await request
					.post(api('video-conference.join'))
					.set(regularUserCredentials)
					.send({ callId })
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('providerName', 'test');
					});
			});

			it('should reject an unauthenticated user when Accounts_AllowAnonymousRead is disabled', async () => {
				await updateSetting('Accounts_AllowAnonymousRead', false);

				await request
					.post(api('video-conference.join'))
					.send({ callId })
					.expect(401)
					.expect((res: Response) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body).to.have.a.property('error', 'You must be logged in to do this.');
					});
			});
		});

		describe('[/video-conference.info]', () => {
			let callId: string | undefined;

			before(async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
				const res = await request.post(api('video-conference.start')).set(credentials).send({
					roomId,
				});

				callId = res.body.data.callId;
			});

			it('should load the video conference data successfully', async () => {
				await request
					.get(api('video-conference.info'))
					.set(credentials)
					.query({
						callId,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
						expect(res.body).to.have.a.property('providerName').equal('test');
						expect(res.body).to.not.have.a.property('providerData');
						expect(res.body).to.have.a.property('_id').equal(callId);
						expect(res.body).to.have.a.property('url').equal(`test/videoconference/${callId}/${roomName}`);
						expect(res.body).to.have.a.property('type').equal('videoconference');
						expect(res.body).to.have.a.property('rid').equal(roomId);
						expect(res.body).to.have.a.property('users').that.is.an('array').with.lengthOf(0);
						expect(res.body).to.have.a.property('status').equal(1);
						expect(res.body).to.have.a.property('title').equal(roomName);
						expect(res.body).to.have.a.property('messages').that.is.an('object');
						expect(res.body.messages).to.have.a.property('started').that.is.a('string');
						expect(res.body).to.have.a.property('createdBy').that.is.an('object');
						expect(res.body.createdBy).to.have.a.property('_id').equal(credentials['X-User-Id']);
						expect(res.body.createdBy).to.have.a.property('username').equal(adminUsername);
					});
			});
		});

		describe('[video-conference.start + video-conference.info]', () => {
			describe('[Test provider with the persistent chat feature disabled]', () => {
				let callId: string | undefined;

				before(async () => {
					await updateSetting('VideoConf_Default_Provider', 'test');
					await updateSetting('Discussion_enabled', true);

					if (process.env.IS_EE) {
						await updateSetting('VideoConf_Enable_Persistent_Chat', false);
					}
					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId = res.body.data.callId;
				});

				it('should load the video conference data successfully', async () => {
					await request
						.get(api('video-conference.info'))
						.set(credentials)
						.query({
							callId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('providerName').equal('test');
							expect(res.body).to.not.have.a.property('providerData');
							expect(res.body).to.have.a.property('_id').equal(callId);
							expect(res.body).to.have.a.property('url').equal(`test/videoconference/${callId}/${roomName}`);
							expect(res.body).to.have.a.property('type').equal('videoconference');
							expect(res.body).to.have.a.property('rid').equal(roomId);
							expect(res.body).to.have.a.property('users').that.is.an('array').with.lengthOf(0);
							expect(res.body).to.have.a.property('status').equal(1);
							expect(res.body).to.have.a.property('title').equal(roomName);
							expect(res.body).to.have.a.property('messages').that.is.an('object');
							expect(res.body.messages).to.have.a.property('started').that.is.a('string');
							expect(res.body).to.have.a.property('createdBy').that.is.an('object');
							expect(res.body.createdBy).to.have.a.property('_id').equal(credentials['X-User-Id']);
							expect(res.body.createdBy).to.have.a.property('username').equal(adminUsername);
							expect(res.body).to.not.have.a.property('discussionRid');
						});
				});
			});

			describe('[Test provider with the persistent chat feature enabled]', () => {
				let callId: string | undefined;

				before(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await updateSetting('VideoConf_Default_Provider', 'test');
					await updateSetting('Discussion_enabled', true);
					await updateSetting('VideoConf_Enable_Persistent_Chat', true);
					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId = res.body.data.callId;
				});

				it('should load the video conference data successfully', async () => {
					await request
						.get(api('video-conference.info'))
						.set(credentials)
						.query({
							callId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('providerName').equal('test');
							expect(res.body).to.not.have.a.property('providerData');
							expect(res.body).to.have.a.property('_id').equal(callId);
							expect(res.body).to.have.a.property('url').equal(`test/videoconference/${callId}/${roomName}`);
							expect(res.body).to.have.a.property('type').equal('videoconference');
							expect(res.body).to.have.a.property('rid').equal(roomId);
							expect(res.body).to.have.a.property('users').that.is.an('array').with.lengthOf(0);
							expect(res.body).to.have.a.property('status').equal(1);
							expect(res.body).to.have.a.property('title').equal(roomName);
							expect(res.body).to.have.a.property('messages').that.is.an('object');
							expect(res.body.messages).to.have.a.property('started').that.is.a('string');
							expect(res.body).to.have.a.property('createdBy').that.is.an('object');
							expect(res.body.createdBy).to.have.a.property('_id').equal(credentials['X-User-Id']);
							expect(res.body.createdBy).to.have.a.property('username').equal(adminUsername);
							expect(res.body).to.not.have.a.property('discussionRid');
						});
				});
			});

			describe('[Persistent Chat provider with the persistent chat feature enabled]', () => {
				let callId: string | undefined;
				let discussionRid: string | undefined;

				before(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await updateSetting('VideoConf_Default_Provider', 'persistentchat');
					await updateSetting('Discussion_enabled', true);
					await updateSetting('VideoConf_Enable_Persistent_Chat', true);
					await updateSetting('VideoConf_Persistent_Chat_Discussion_Name', 'Chat History');
					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId = res.body.data.callId;
				});

				it('should include a discussion room id on the response', async () => {
					await request
						.get(api('video-conference.info'))
						.set(credentials)
						.query({
							callId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('providerName').equal('persistentchat');
							expect(res.body).to.not.have.a.property('providerData');
							expect(res.body).to.have.a.property('_id').equal(callId);
							expect(res.body).to.have.a.property('discussionRid').that.is.a('string');

							discussionRid = res.body.discussionRid;
							expect(res.body).to.have.a.property('url').equal(`pchat/videoconference/${callId}/${discussionRid}`);
						});
				});

				it('should have created the discussion room using the configured name', async () => {
					await request
						.get(api('rooms.info'))
						.set(credentials)
						.query({
							roomId: discussionRid,
						})
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('room').and.to.be.an('object');
							expect(res.body.room).to.have.a.property('_id').equal(discussionRid);
							expect(res.body.room)
								.to.have.a.property('fname')
								.that.is.a('string')
								.that.satisfies((msg: string) => !msg.startsWith('Chat History'))
								.that.satisfies((msg: string) => msg.includes('Chat History'));
						});
				});

				it('should have created a subscription with open = false', async () => {
					await request
						.get(api('subscriptions.getOne'))
						.set(credentials)
						.query({
							roomId: discussionRid,
						})
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('subscription').and.to.be.an('object');
							expect(res.body.subscription).to.have.a.property('rid').equal(discussionRid);
							expect(res.body.subscription)
								.to.have.a.property('fname')
								.that.is.a('string')
								.that.satisfies((msg: string) => !msg.startsWith('Chat History'))
								.that.satisfies((msg: string) => msg.includes('Chat History'));
							expect(res.body.subscription).to.have.a.property('open', false);
							expect(res.body.subscription).to.have.a.property('alert', false);
						});
				});
			});

			describe('[Persistent Chat provider with the persistent chat feature enabled and encryption forced on private rooms]', () => {
				let callId: string | undefined;

				before(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await updateSetting('VideoConf_Default_Provider', 'persistentchat');
					await updateSetting('Discussion_enabled', true);
					await updateSetting('VideoConf_Enable_Persistent_Chat', true);
					await Promise.all([updateSetting('E2E_Enable', true), updateSetting('E2E_Force_Encryption_For_Private_Rooms', true)]);

					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId = res.body.data?.callId;
				});

				after(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await Promise.all([updateSetting('E2E_Enable', false), updateSetting('E2E_Force_Encryption_For_Private_Rooms', false)]);
				});

				it('should start the call and treat persistent chat as disabled', async () => {
					expect(callId).to.be.a('string');

					await request
						.get(api('video-conference.info'))
						.set(credentials)
						.query({
							callId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('_id').equal(callId);
							expect(res.body).to.have.a.property('rid').equal(roomId);
							// the call must be fully started, since persistent chat is skipped instead of attempted
							expect(res.body).to.have.a.property('url').that.is.a('string');
							expect(res.body).to.have.a.property('status').equal(1);
							expect(res.body).to.have.a.property('messages').that.is.an('object');
							expect(res.body.messages).to.have.a.property('started').that.is.a('string');
							// even with VideoConf_Enable_Persistent_Chat on, enforcing encryption disables persistent chat
							expect(res.body).to.not.have.a.property('discussionRid');
						});
				});
			});

			describe('[Persistent Chat provider with the persistent chat feature enabled and encryption forced but E2EE off]', () => {
				let callId: string | undefined;
				let discussionRid: string | undefined;

				before(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await updateSetting('VideoConf_Default_Provider', 'persistentchat');
					await updateSetting('Discussion_enabled', true);
					await updateSetting('VideoConf_Enable_Persistent_Chat', true);
					// the encryption policy only takes effect while E2EE is enabled, so persistent chat must keep working
					await Promise.all([updateSetting('E2E_Enable', false), updateSetting('E2E_Force_Encryption_For_Private_Rooms', true)]);

					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId = res.body.data?.callId;
				});

				after(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await Promise.all([
						updateSetting('E2E_Force_Encryption_For_Private_Rooms', false),
						...(discussionRid ? [deleteRoom({ type: 'p', roomId: discussionRid })] : []),
					]);
				});

				it('should still create the persistent chat discussion', async () => {
					expect(callId).to.be.a('string');

					await request
						.get(api('video-conference.info'))
						.set(credentials)
						.query({
							callId,
						})
						.expect(200)
						.expect((res: Response) => {
							discussionRid = res.body.discussionRid;
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('_id').equal(callId);
							expect(res.body).to.have.a.property('discussionRid').that.is.a('string');
						});
				});
			});

			describe('[Persistent Chat provider with the persistent chat feature enabled and custom discussion names]', () => {
				let callId: string | undefined;
				let discussionRid: string | undefined;
				let chatDate: string;

				before(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await updateSetting('VideoConf_Default_Provider', 'persistentchat');
					await updateSetting('Discussion_enabled', true);
					await updateSetting('VideoConf_Enable_Persistent_Chat', true);
					await updateSetting('VideoConf_Persistent_Chat_Discussion_Name', 'Date [date] between');
					chatDate = new Date().toISOString().substring(0, 10);
					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId = res.body.data.callId;
				});

				it('should include a discussion room id on the response', async () => {
					await request
						.get(api('video-conference.info'))
						.set(credentials)
						.query({
							callId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('providerName').equal('persistentchat');
							expect(res.body).to.not.have.a.property('providerData');
							expect(res.body).to.have.a.property('_id').equal(callId);
							expect(res.body).to.have.a.property('discussionRid').that.is.a('string');

							discussionRid = res.body.discussionRid;
							expect(res.body).to.have.a.property('url').equal(`pchat/videoconference/${callId}/${discussionRid}`);
						});
				});

				it('should have created the discussion room using the configured name', async () => {
					await request
						.get(api('rooms.info'))
						.set(credentials)
						.query({
							roomId: discussionRid,
						})
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('room').and.to.be.an('object');
							expect(res.body.room).to.have.a.property('_id').equal(discussionRid);
							expect(res.body.room)
								.to.have.a.property('fname')
								.that.is.a('string')
								.that.satisfies((msg: string) => msg.includes(`Date ${chatDate} between`));
						});
				});
			});

			describe('[Persistent Chat provider with the persistent chat feature disabled]', () => {
				let callId: string | undefined;

				before(async () => {
					await updateSetting('VideoConf_Default_Provider', 'persistentchat');
					await updateSetting('Discussion_enabled', true);
					if (process.env.IS_EE) {
						await updateSetting('VideoConf_Enable_Persistent_Chat', false);
					}
					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId = res.body.data.callId;
				});

				it('should not include a discussion room id on the response', async () => {
					await request
						.get(api('video-conference.info'))
						.set(credentials)
						.query({
							callId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('providerName').equal('persistentchat');
							expect(res.body).to.not.have.a.property('providerData');
							expect(res.body).to.have.a.property('_id').equal(callId);
							expect(res.body).to.not.have.a.property('discussionRid');

							expect(res.body).to.have.a.property('url').equal(`pchat/videoconference/${callId}/none`);
						});
				});
			});

			describe('[Persistent Chat provider with the persistent chat feature enabled but discussions disabled]', () => {
				let callId: string | undefined;

				before(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await updateSetting('VideoConf_Default_Provider', 'persistentchat');
					await updateSetting('Discussion_enabled', false);
					await updateSetting('VideoConf_Enable_Persistent_Chat', true);
					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId = res.body.data.callId;
				});

				it('should not include a discussion room id on the response', async () => {
					await request
						.get(api('video-conference.info'))
						.set(credentials)
						.query({
							callId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('providerName').equal('persistentchat');
							expect(res.body).to.not.have.a.property('providerData');
							expect(res.body).to.have.a.property('_id').equal(callId);
							expect(res.body).to.not.have.a.property('discussionRid');

							expect(res.body).to.have.a.property('url').equal(`pchat/videoconference/${callId}/none`);
						});
				});
			});
		});

		describe('[/video-conference.list]', () => {
			describe('[Test provider]', () => {
				let callId1: string | undefined;
				let callId2: string | undefined;

				before(async () => {
					await updateSetting('VideoConf_Default_Provider', 'test');
					await updateSetting('Discussion_enabled', true);
					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});
					callId1 = res.body.data.callId;

					const res2 = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId2 = res2.body.data.callId;
				});

				it('should load the list of video conferences sorted by new', async () => {
					await request
						.get(api('video-conference.list'))
						.set(credentials)
						.query({
							roomId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('count').that.is.greaterThanOrEqual(2);
							expect(res.body).to.have.a.property('data').that.is.an('array').with.lengthOf(res.body.count);

							const call2 = res.body.data[0];
							const call1 = res.body.data[1];

							expect(call1).to.have.a.property('_id').equal(callId1);
							expect(call1).to.have.a.property('url').equal(`test/videoconference/${callId1}/${roomName}`);
							expect(call1).to.have.a.property('type').equal('videoconference');
							expect(call1).to.have.a.property('rid').equal(roomId);
							expect(call1).to.have.a.property('users').that.is.an('array').with.lengthOf(0);
							expect(call1).to.have.a.property('status').equal(1);
							expect(call1).to.have.a.property('title').equal(roomName);
							expect(call1).to.have.a.property('messages').that.is.an('object');
							expect(call1.messages).to.have.a.property('started').that.is.a('string');
							expect(call1).to.have.a.property('createdBy').that.is.an('object');
							expect(call1.createdBy).to.have.a.property('_id').equal(credentials['X-User-Id']);
							expect(call1.createdBy).to.have.a.property('username').equal(adminUsername);
							expect(call1).to.not.have.a.property('discussionRid');

							expect(call2).to.have.a.property('_id').equal(callId2);
						});
				});

				it('should paginate video conferences list with count parameter', async () => {
					await request
						.get(api('video-conference.list'))
						.set(credentials)
						.query({
							roomId,
							count: 1,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('total').that.is.greaterThanOrEqual(2);
							expect(res.body).to.have.a.property('data').that.is.an('array').with.lengthOf(1);
							expect(res.body.data[0]).to.have.a.property('_id').equal(callId2);
						});
				});

				it('should paginate video conferences list with offset parameter', async () => {
					await request
						.get(api('video-conference.list'))
						.set(credentials)
						.query({
							roomId,
							count: 1,
							offset: 1,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('total').that.is.greaterThanOrEqual(2);
							expect(res.body).to.have.a.property('data').that.is.an('array').with.lengthOf(1);
							expect(res.body.data[0]).to.have.a.property('_id').equal(callId1);
						});
				});
			});

			describe('[Persistent Chat Provider]', () => {
				let callId1: string | undefined;
				let callId2: string | undefined;
				let callId3: string | undefined;
				let callId4: string | undefined;

				before(async () => {
					if (!process.env.IS_EE) {
						return;
					}

					await updateSetting('Discussion_enabled', true);
					await updateSetting('VideoConf_Default_Provider', 'test');
					const res = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});
					callId1 = res.body.data.callId;

					await updateSetting('VideoConf_Default_Provider', 'persistentchat');
					await updateSetting('VideoConf_Enable_Persistent_Chat', false);
					const res2 = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId2 = res2.body.data.callId;

					await updateSetting('VideoConf_Enable_Persistent_Chat', true);
					const res3 = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId3 = res3.body.data.callId;

					await updateSetting('Discussion_enabled', false);
					const res4 = await request.post(api('video-conference.start')).set(credentials).send({
						roomId,
					});

					callId4 = res4.body.data.callId;
				});

				it('should load the list of video conferences sorted by new', async () => {
					await request
						.get(api('video-conference.list'))
						.set(credentials)
						.query({
							roomId,
						})
						.expect(200)
						.expect((res: Response) => {
							expect(res.body.success).to.be.equal(true);
							expect(res.body).to.have.a.property('count').that.is.greaterThanOrEqual(4);
							expect(res.body).to.have.a.property('data').that.is.an('array').with.lengthOf(res.body.count);

							const call4 = res.body.data[0];
							const call3 = res.body.data[1];
							const call2 = res.body.data[2];
							const call1 = res.body.data[3];

							expect(call1).to.have.a.property('_id').equal(callId1);
							expect(call1).to.have.a.property('url').equal(`test/videoconference/${callId1}/${roomName}`);
							expect(call1).to.have.a.property('type').equal('videoconference');
							expect(call1).to.have.a.property('rid').equal(roomId);
							expect(call1).to.have.a.property('users').that.is.an('array').with.lengthOf(0);
							expect(call1).to.have.a.property('status').equal(1);
							expect(call1).to.have.a.property('title').equal(roomName);
							expect(call1).to.have.a.property('messages').that.is.an('object');
							expect(call1.messages).to.have.a.property('started').that.is.a('string');
							expect(call1).to.have.a.property('createdBy').that.is.an('object');
							expect(call1.createdBy).to.have.a.property('_id').equal(credentials['X-User-Id']);
							expect(call1.createdBy).to.have.a.property('username').equal(adminUsername);
							expect(call1).to.not.have.a.property('discussionRid');

							expect(call2).to.have.a.property('_id').equal(callId2);
							expect(call2).to.not.have.a.property('discussionRid');

							expect(call3).to.have.a.property('_id').equal(callId3);
							expect(call3).to.have.a.property('discussionRid').that.is.a('string');

							expect(call4).to.have.a.property('_id').equal(callId4);
							expect(call4).to.not.have.a.property('discussionRid');
						});
				});
			});
		});

		describe('[Read-Only Channel]', () => {
			let readOnlyRoomId: string;
			let regularUser: Awaited<ReturnType<typeof createUser>>;
			let regularUserCredentials: Awaited<ReturnType<typeof login>>;

			before(async () => {
				// Create a regular user
				regularUser = await createUser({ username: `regular.user.${Date.now()}`, roles: ['user'] });
				regularUserCredentials = await login(regularUser.username, password);

				const readOnlyRoomRes = await createRoom({
					type: 'c',
					name: `read-only-channel-${Date.now()}`,
					username: undefined,
					members: [regularUser.username],
					credentials,
					readOnly: true,
				});
				readOnlyRoomId = readOnlyRoomRes.body.channel._id;

				// Set up video conference provider
				await updateSetting('VideoConf_Default_Provider', 'test');
			});

			before(async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
			});

			after(async () => {
				await Promise.all([
					...(readOnlyRoomId ? [deleteRoom({ type: 'c', roomId: readOnlyRoomId })] : []),
					deleteUser(regularUser),
					updatePermission('post-readonly', ['admin', 'owner', 'moderator']),
				]);
			});

			it('should fail to start a call in read-only channel as a regular user', async () => {
				await request
					.post(api('video-conference.start'))
					.set(regularUserCredentials)
					.send({
						roomId: readOnlyRoomId,
					})
					.expect(403)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(false);
					});
			});

			it('should successfully start a call in read-only channel as admin', async () => {
				await request
					.post(api('video-conference.start'))
					.set(credentials)
					.send({
						roomId: readOnlyRoomId,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
					});
			});

			it('should successfully start a call in read-only channel as regular user with post-readonly permission', async () => {
				await updatePermission('post-readonly', ['admin', 'owner', 'moderator', 'user']);

				await request
					.post(api('video-conference.start'))
					.set(regularUserCredentials)
					.send({
						roomId: readOnlyRoomId,
					})
					.expect(200)
					.expect((res: Response) => {
						expect(res.body.success).to.be.equal(true);
					});
			});
		});

		describe('[Conference actions]', () => {
			let actionsRoomId: string;
			let callId: string;
			let member: TestUser<IUser>;
			let guest: TestUser<IUser>;
			let outsider: TestUser<IUser>;
			let memberCredentials: Credentials;
			let guestCredentials: Credentials;
			let outsiderCredentials: Credentials;
			let discussionId: string;

			const getCall = async () => (await request.get(api('video-conference.info')).set(credentials).query({ callId }).expect(200)).body;
			const callUser = async (userId: string) =>
				(await getCall()).users.find(({ _id }: { _id: string }) => _id === userId) as Record<string, unknown> | undefined;

			before(async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
				[member, guest, outsider] = await Promise.all([createUser(), createUser(), createUser()]);
				[memberCredentials, guestCredentials, outsiderCredentials] = await Promise.all([
					login(member.username, password),
					login(guest.username, password),
					login(outsider.username, password),
				]);
				actionsRoomId = (await createRoom({ type: 'p', name: `videoconf-actions-${Date.now()}`, members: [member.username], credentials }))
					.body.group._id;
				callId = (await request.post(api('video-conference.start')).set(credentials).send({ roomId: actionsRoomId }).expect(200)).body.data
					.callId;
			});

			after(async () => {
				if (discussionId) {
					await deleteRoom({ type: 'p', roomId: discussionId });
				}
				await deleteRoom({ type: 'p', roomId: actionsRoomId });
				await Promise.all([deleteUser(member), deleteUser(guest), deleteUser(outsider)]);
			});

			describe('[/video-conference.add-participants]', () => {
				it('should give a user from outside the room access to the call', async () => {
					const res = await request
						.post(api('video-conference.add-participants'))
						.set(credentials)
						.send({ callId, users: [guest.username] })
						.expect(200);

					expect(res.body.added).to.deep.equal([guest._id]);
					await request.get(api('video-conference.info')).set(guestCredentials).query({ callId }).expect(200);
				});

				it('should fail to add participants when the user cannot access the call', async () => {
					await request
						.post(api('video-conference.add-participants'))
						.set(outsiderCredentials)
						.send({ callId, users: [outsider.username] })
						.expect(404);

					expect(await callUser(outsider._id)).to.be.undefined;
				});
			});

			describe('[/video-conference.ring]', () => {
				it('should ring a member who is not in the call', async () => {
					const res = await request.post(api('video-conference.ring')).set(credentials).send({ callId, userId: guest._id }).expect(200);

					expect(res.body.rang).to.be.true;
					expect(await callUser(guest._id)).to.have.property('ringingAt');
				});

				it('should fail to ring when the user does not have the videoconf-ring-users permission', async () => {
					await updatePermission('videoconf-ring-users', ['admin']);
					try {
						await request.post(api('video-conference.ring')).set(memberCredentials).send({ callId, userId: guest._id }).expect(403);
					} finally {
						await updatePermission('videoconf-ring-users', ['admin', 'owner', 'moderator', 'user']);
					}
				});

				it('should fail to ring when the user cannot access the call', async () => {
					await request.post(api('video-conference.ring')).set(outsiderCredentials).send({ callId, userId: guest._id }).expect(404);
				});
			});

			describe('[/video-conference.decline]', () => {
				it("should record the decline on the caller's own membership and keep the call going", async () => {
					await request.post(api('video-conference.decline')).set(guestCredentials).send({ callId }).expect(200);

					expect(await callUser(guest._id)).to.have.property('declined', true);
					expect((await getCall()).endedAt).to.be.undefined;
				});

				it('should fail to decline when the user cannot access the call', async () => {
					await request.post(api('video-conference.decline')).set(outsiderCredentials).send({ callId }).expect(404);

					expect(await callUser(outsider._id)).to.be.undefined;
				});
			});

			describe('[/video-conference.heartbeat]', () => {
				const markLeft = (userId: string, leftReason: 'reported' | 'timeout') =>
					withDatabase((db) =>
						db
							.collection<VideoConference>('rocketchat_video_conference')
							.updateOne(
								{ _id: callId },
								{ $set: { 'users.$[user].leftAt': new Date(), 'users.$[user].leftReason': leftReason } },
								{ arrayFilters: [{ 'user._id': userId }] },
							),
					);

				it('should keep out a member who reported leaving the call', async () => {
					await markLeft(guest._id, 'reported');

					await request.post(api('video-conference.heartbeat')).set(guestCredentials).send({ callId }).expect(200);

					expect(await callUser(guest._id)).to.include({ leftReason: 'reported' });
				});

				it('should bring back a member whose presence timed out', async () => {
					await markLeft(guest._id, 'timeout');

					await request.post(api('video-conference.heartbeat')).set(guestCredentials).send({ callId }).expect(200);

					const user = await callUser(guest._id);
					expect(user).to.not.have.any.keys('leftAt', 'leftReason');
					expect(user).to.have.property('lastSeenAt');
				});

				it('should fail to send a heartbeat when the user cannot access the call', async () => {
					await request.post(api('video-conference.heartbeat')).set(outsiderCredentials).send({ callId }).expect(404);
				});
			});

			describe('[/video-conference.rename]', () => {
				it('should let the user who started the call rename it', async () => {
					await request.post(api('video-conference.rename')).set(credentials).send({ callId, title: '  Planning  ' }).expect(200);

					expect((await getCall()).title).to.equal('Planning');
				});

				it('should fail to rename the call as a member who did not start it', async () => {
					await request.post(api('video-conference.rename')).set(memberCredentials).send({ callId, title: 'By member' }).expect(403);

					expect((await getCall()).title).to.equal('Planning');
				});

				it('should fail to rename the call to a blank name', async () => {
					const res = await request.post(api('video-conference.rename')).set(credentials).send({ callId, title: '   ' }).expect(400);

					expect(res.body).to.have.property('error', 'error-invalid-name');

					expect((await getCall()).title).to.equal('Planning');
				});

				it('should fail to rename when the user cannot access the call', async () => {
					await request.post(api('video-conference.rename')).set(outsiderCredentials).send({ callId, title: 'By outsider' }).expect(404);
				});
			});

			describe('[/video-conference.share-chat]', () => {
				it('should fail to share the chat when the user cannot access the call', async () => {
					await request.post(api('video-conference.share-chat')).set(outsiderCredentials).send({ callId, mode: 'invite' }).expect(404);

					const res = await request.get(api('subscriptions.getOne')).set(guestCredentials).query({ roomId: actionsRoomId }).expect(200);
					expect(res.body.subscription).to.be.null;
				});

				it('should invite the call members who cannot read the chat into the room', async () => {
					const res = await request.post(api('video-conference.share-chat')).set(credentials).send({ callId, mode: 'invite' }).expect(200);

					expect(res.body.rid).to.equal(actionsRoomId);
					expect(await getSubscriptionByRoomId(actionsRoomId, guestCredentials)).to.have.property('rid', actionsRoomId);
				});

				it('should move the chat to a discussion that the call members who cannot read the room can join', async () => {
					await updateSetting('Discussion_enabled', true);
					await request
						.post(api('video-conference.add-participants'))
						.set(credentials)
						.send({ callId, users: [outsider.username] })
						.expect(200);

					const res = await request
						.post(api('video-conference.share-chat'))
						.set(credentials)
						.send({ callId, mode: 'discussion' })
						.expect(200);
					discussionId = res.body.rid;

					expect(discussionId).to.not.equal(actionsRoomId);
					expect(await getSubscriptionByRoomId(discussionId, outsiderCredentials)).to.have.property('prid', actionsRoomId);
					const roomSubscription = await request
						.get(api('subscriptions.getOne'))
						.set(outsiderCredentials)
						.query({ roomId: actionsRoomId })
						.expect(200);
					expect(roomSubscription.body.subscription).to.be.null;
				});
			});

			describe('[/video-conference.cancel]', () => {
				let directCallId: string;
				let dmId: string;

				before(async () => {
					dmId = (await createRoom({ type: 'd', username: member.username, credentials })).body.room._id;
					directCallId = (
						await request.post(api('video-conference.start')).set(credentials).send({ roomId: dmId, allowRinging: true }).expect(200)
					).body.data.callId;
				});

				after(() => deleteRoom({ type: 'd', roomId: dmId }));

				const getDirectCall = async () =>
					(await request.get(api('video-conference.info')).set(credentials).query({ callId: directCallId }).expect(200)).body;

				it('should fail to cancel when the user cannot access the call', async () => {
					const res = await request
						.post(api('video-conference.cancel'))
						.set(outsiderCredentials)
						.send({ callId: directCallId })
						.expect(400);

					expect(res.body).to.have.property('error', 'invalid-params');

					expect((await getDirectCall()).status).to.equal(VideoConferenceStatus.CALLING);
				});

				it('should end a ringing direct call as declined by the caller', async () => {
					await request.post(api('video-conference.cancel')).set(credentials).send({ callId: directCallId }).expect(200);

					const call = await getDirectCall();
					expect(call.status).to.equal(VideoConferenceStatus.DECLINED);
					expect(call.endedBy).to.have.property('_id', credentials['X-User-Id']);
				});
			});
		});
	});
});

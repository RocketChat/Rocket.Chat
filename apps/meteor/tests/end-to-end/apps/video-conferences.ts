import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, api, credentials } from '../../data/api-data';
import { cleanupApps, installTestApp } from '../../data/apps/helper';
import { updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { adminUsername } from '../../data/user';
import { IS_EE } from '../../e2e/config/constants';

describe('Apps - Video Conferences', () => {
	before((done) => getCredentials(done));

	const roomName = `apps-e2etest-room-${Date.now()}-videoconf`;
	let roomId: string | undefined;

	before(async () => {
		const res = await createRoom({
			type: 'p',
			name: roomName,
			username: undefined,
			token: undefined,
			agentId: undefined,
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

			it('should start a call successfully when using a provider that supports persistent chat', async function () {
				if (!process.env.IS_EE) {
					this.skip();
					return;
				}

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

			it('should start a call successfully when using a provider that supports persistent chat with the feature disabled', async function () {
				if (!process.env.IS_EE) {
					this.skip();
					return;
				}

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

			it('should start a call successfully when using a provider that supports persistent chat with discussions disabled', async function () {
				if (!process.env.IS_EE) {
					this.skip();
					return;
				}

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

				it('should load the video conference data successfully', async function () {
					if (!process.env.IS_EE) {
						this.skip();
						return;
					}

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

				it('should include a discussion room id on the response', async function () {
					if (!process.env.IS_EE) {
						this.skip();
						return;
					}

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

				it('should have created the discussion room using the configured name', async function () {
					if (!process.env.IS_EE) {
						this.skip();
						return;
					}

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

				it('should have created a subscription with open = false', async function () {
					if (!process.env.IS_EE) {
						this.skip();
						return;
					}

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

				it('should include a discussion room id on the response', async function () {
					if (!process.env.IS_EE) {
						this.skip();
						return;
					}

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

				it('should have created the discussion room using the configured name', async function () {
					if (!process.env.IS_EE) {
						this.skip();
						return;
					}

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

				it('should not include a discussion room id on the response', async function () {
					if (!process.env.IS_EE) {
						this.skip();
						return;
					}

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

				it('should load the list of video conferences sorted by new', async function () {
					if (!process.env.IS_EE) {
						this.skip();
						return;
					}

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
	});
});

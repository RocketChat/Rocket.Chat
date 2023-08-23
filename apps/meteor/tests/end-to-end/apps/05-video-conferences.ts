import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import type { Response } from 'supertest';

import { getCredentials, request, api, credentials } from '../../data/api-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';
import { updateSetting } from '../../data/permissions.helper';
import { createRoom } from '../../data/rooms.helper';
import { adminUsername } from '../../data/user';

describe('Apps - Video Conferences', function () {
	this.retries(0);

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
		});

		roomId = res.body.group._id;
	});

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

	describe('[With Test App]', () => {
		before(async () => {
			await cleanupApps();
			await installTestApp();
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

		describe('[/video-conference.list]', () => {
			let callId1: string | undefined;
			let callId2: string | undefined;

			before(async () => {
				await updateSetting('VideoConf_Default_Provider', 'test');
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

						expect(call2).to.have.a.property('_id').equal(callId2);
					});
			});
		});
	});
});

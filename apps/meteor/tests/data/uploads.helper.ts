import type { Response } from 'supertest';
import { expect } from 'chai';
import { after, before, it } from 'mocha';

import { api, request, credentials } from './api-data.js';
import { password } from './user';
import { createUser, login } from './users.helper';
import { imgURL } from './interactions';
import { updateSetting } from './permissions.helper';
import { createRoom, deleteRoom } from './rooms.helper';
import { createVisitor } from './livechat/rooms';

export async function testFileUploads(
	filesEndpoint: 'channels.files' | 'groups.files' | 'im.files',
	roomType: 'c' | 'd' | 'p',
	invalidRoomError = 'error-room-not-found',
) {
	let testRoom: Record<string, any>;
	const propertyMap = {
		c: 'channel',
		p: 'group',
		d: 'room',
	};

	before(async function () {
		await updateSetting('VoIP_Enabled', true);
		await updateSetting('Message_KeepHistory', true);

		testRoom = (
			await createRoom({
				type: roomType,
				...(roomType === 'd' ? { username: 'rocket.cat' } : { name: `channel-files-${Date.now()}` }),
			} as any)
		).body[propertyMap[roomType]];
	});

	after(async function () {
		await Promise.all([
			deleteRoom({ type: 'c', roomId: testRoom._id }),
			updateSetting('VoIP_Enabled', false),
			updateSetting('Message_KeepHistory', false),
		]);
	});

	const createVoipRoom = async function () {
		const testUser = await createUser({ roles: ['user', 'livechat-agent'] });
		const testUserCredentials = await login(testUser.username, password);
		const visitor = await createVisitor();
		const roomResponse = await createRoom({
			token: visitor.token,
			type: 'v',
			agentId: testUser._id,
			credentials: testUserCredentials,
			name: null,
			username: null,
			members: null,
			extraData: null,
		});

		return roomResponse.body.room;
	};

	it('should fail if invalid channel', function (done) {
		request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: 'invalid',
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('errorType', invalidRoomError);
			})
			.end(done);
	});

	it('should fail for room type v', async function () {
		const { _id } = await createVoipRoom();
		request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: _id,
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('errorType', 'error-room-not-found');
			});
	});

	it('should succeed when searching by roomId', function (done) {
		request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
			})
			.success()
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array');
			})
			.end(done);
	});

	it('should succeed when searching by roomId even requested with count and offset params', function (done) {
		request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
				count: 5,
				offset: 0,
			})
			.success()
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array');
			})
			.end(done);
	});

	it('should succeed when searching by roomName', function (done) {
		if (!testRoom.name) {
			this.skip();
		}
		request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomName: testRoom.name,
			})
			.success()
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array');
			})
			.end(done);
	});

	it('should succeed when searching by roomName even requested with count and offset params', function (done) {
		if (!testRoom.name) {
			this.skip();
		}
		request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomName: testRoom.name,
				count: 5,
				offset: 0,
			})
			.success()
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array');
			})
			.end(done);
	});

	it('should not return thumbnails', async function () {
		await request
			.post(api(`rooms.upload/${testRoom._id}`))
			.set(credentials)
			.attach('file', imgURL)
			.success()
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', true);
			});

		await request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
			})
			.success()
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array').with.lengthOf(1);

				const { files } = res.body;

				files.forEach(function (file: unknown) {
					expect(file).to.not.have.property('originalFileId');
				});
			});
	});

	it('should not return hidden files', async function () {
		let msgId;
		let fileId: string;

		await request
			.post(api(`rooms.upload/${testRoom._id}`))
			.set(credentials)
			.attach('file', imgURL)
			.success()
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', true);

				msgId = res.body.message._id;
				fileId = res.body.message.file._id;
			});

		await request
			.post(api('chat.delete'))
			.set(credentials)
			.send({
				roomId: testRoom._id,
				msgId,
			})
			.success();

		await request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
			})
			.success()
			.expect(function (res: Response) {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array').with.lengthOf(1);

				const { files } = res.body;
				files.forEach(function (file: unknown) {
					expect(file).to.have.property('_id').to.not.be.equal(fileId);
				});
			});
	});
}

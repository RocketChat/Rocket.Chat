import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, it } from 'mocha';
import type { Response } from 'supertest';

import { api, request, credentials } from './api-data';
import { imgURL, soundURL } from './interactions';
import { updateSetting } from './permissions.helper';
import { createRoom, deleteRoom } from './rooms.helper';
import { createUser, deleteUser } from './users.helper';

export async function testFileUploads(
	filesEndpoint: 'channels.files' | 'groups.files' | 'im.files',
	roomType: 'c' | 'd' | 'p',
	invalidRoomError = 'error-room-not-found',
) {
	let testRoom: IRoom;
	const propertyMap = {
		c: 'channel',
		p: 'group',
		d: 'room',
	};
	let user: any;

	before(async () => {
		await Promise.all([updateSetting('Message_KeepHistory', true)]);
		user = await createUser();

		testRoom = (
			await createRoom({
				type: roomType,
				...(roomType === 'd' ? { username: user.username } : { name: `channel-files-${Date.now()}` }),
			} as any)
		).body[propertyMap[roomType]];
	});

	after(() =>
		Promise.all([deleteRoom({ type: 'c' as const, roomId: testRoom._id }), updateSetting('Message_KeepHistory', false), deleteUser(user)]),
	);

	it('should fail if invalid channel', (done) => {
		void request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: 'invalid',
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('errorType', invalidRoomError);
			})
			.end(done);
	});

	it('should succeed when searching by roomId', (done) => {
		void request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array');
			})
			.end(done);
	});

	it('should succeed when searching by roomId even requested with count and offset params', (done) => {
		void request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
				count: 5,
				offset: 0,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array');
			})
			.end(done);
	});

	it('should succeed when searching by roomName', function (done) {
		if (!testRoom.name) {
			this.skip();
		}
		void request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomName: testRoom.name,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array');
			})
			.end(done);
	});

	it('should succeed when searching by roomName even requested with count and offset params', function (done) {
		if (!testRoom.name) {
			this.skip();
		}
		void request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomName: testRoom.name,
				count: 5,
				offset: 0,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array');
			})
			.end(done);
	});

	let fileId: string;
	it('should not return thumbnails', async () => {
		await request
			.post(api(`rooms.media/${testRoom._id}`))
			.set(credentials)
			.attach('file', imgURL)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				fileId = res.body.file._id;
			});

		await request
			.post(api(`rooms.mediaConfirm/${testRoom._id}/${fileId}`))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200);

		await request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array').with.lengthOf(1);

				const { files } = res.body;

				files.forEach((file: unknown) => {
					expect(file).to.not.have.property('originalFileId');
				});
			});
	});

	it('should not return hidden files', async () => {
		let msgId;

		await request
			.post(api(`rooms.media/${testRoom._id}`))
			.set(credentials)
			.attach('file', imgURL)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				fileId = res.body.file._id;
			});
		await request
			.post(api(`rooms.mediaConfirm/${testRoom._id}/${fileId}`))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				msgId = res.body.message._id;
			});

		await request
			.post(api('chat.delete'))
			.set(credentials)
			.send({
				roomId: testRoom._id,
				msgId,
			})
			.expect('Content-Type', 'application/json')
			.expect(200);

		await request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array').with.lengthOf(1);

				const { files } = res.body;
				files.forEach((file: unknown) => {
					expect(file).to.have.property('_id').to.not.be.equal(fileId);
				});
			});
	});

	it('should properly filter files by name or typeGroup', async () => {
		const fileOneName = 'image-zyxwv.png';
		const fileTwoName = 'sound-abcde.png';
		const fileIdsToConfirm: string[] = [];

		// Post 2 files, one image and one audio
		await Promise.all([
			request
				.post(api(`rooms.media/${testRoom._id}`))
				.set(credentials)
				.attach('file', imgURL, { filename: fileOneName })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(typeof res.body?.file?._id).to.equal('string');
					fileIdsToConfirm.push(res.body.file._id);
				}),
			request
				.post(api(`rooms.media/${testRoom._id}`))
				.set(credentials)
				.attach('file', soundURL, { filename: fileTwoName })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res: Response) => {
					expect(res.body).to.have.property('success', true);
					expect(typeof res.body?.file?._id).to.equal('string');
					fileIdsToConfirm.push(res.body.file._id);
				}),
		]);

		// Confirm the files
		await Promise.all(
			fileIdsToConfirm.map((fileId) =>
				request
					.post(api(`rooms.mediaConfirm/${testRoom._id}/${fileId}`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200),
			),
		);

		// test filtering by name
		const nameFilterTest = request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
				name: fileOneName,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array').with.lengthOf(1);

				const { files } = res.body;

				expect(files[0].name).to.equal(fileOneName);
			});

		// test filtering by typeGroup
		const typeGroupFilterTest = request
			.get(api(filesEndpoint))
			.set(credentials)
			.query({
				roomId: testRoom._id,
				typeGroup: 'audio',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res: Response) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('files').and.to.be.an('array').with.lengthOf(1);

				const { files } = res.body;

				expect(files[0].name).to.equal(fileTwoName);
			});

		await Promise.all([nameFilterTest, typeGroupFilterTest]);
	});
}

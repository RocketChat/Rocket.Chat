import fs from 'fs';
import path from 'path';

import { expect } from 'chai';
import { after, afterEach, before, beforeEach, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { sendSimpleMessage } from '../../data/chat.helper';
import { imgURL } from '../../data/interactions.js';
import { updateEEPermission, updatePermission, updateSetting } from '../../data/permissions.helper';
import { closeRoom, createRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

describe('[Rooms]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	it('/rooms.get', (done) => {
		request
			.get(api('rooms.get'))
			.set(credentials)
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('update');
				expect(res.body).to.have.property('remove');
			})
			.end(done);
	});

	it('/rooms.get?updatedSince', (done) => {
		request
			.get(api('rooms.get'))
			.set(credentials)
			.query({
				updatedSince: new Date(),
			})
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('update').that.have.lengthOf(0);
				expect(res.body).to.have.property('remove').that.have.lengthOf(0);
			})
			.end(done);
	});

	describe('/rooms.saveNotification:', () => {
		let testChannel;
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` }).end((err, res) => {
				testChannel = res.body.channel;
				done();
			});
		});
		it('/rooms.saveNotification:', (done) => {
			request
				.post(api('rooms.saveNotification'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					notifications: {
						disableNotifications: '0',
						emailNotifications: 'nothing',
						audioNotificationValue: 'beep',
						desktopNotifications: 'nothing',
						mobilePushNotifications: 'mentions',
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/rooms.upload', () => {
		let testChannel;
		let user;
		let userCredentials;

		before(async () => {
			user = await createUser({ joinDefaultChannels: false });
			userCredentials = await login(user.username, password);
		});

		after(async () => {
			await deleteUser(user);
			user = undefined;

			await updateSetting('FileUpload_Restrict_to_room_members', false);
			await updateSetting('FileUpload_ProtectFiles', true);
		});

		const testChannelName = `channel.test.upload.${Date.now()}-${Math.random()}`;

		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName }).end((err, res) => {
				testChannel = res.body.channel;
				done();
			});
		});
		it("don't upload a file to room with file field other than file", (done) => {
			request
				.post(api(`rooms.upload/${testChannel._id}`))
				.set(credentials)
				.attach('test', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', '[invalid-field]');
					expect(res.body).to.have.property('errorType', 'invalid-field');
				})
				.end(done);
		});
		it("don't upload a file to room with empty file", (done) => {
			request
				.post(api(`rooms.upload/${testChannel._id}`))
				.set(credentials)
				.attach('file', '')
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', res.body.error);
				})
				.end(done);
		});
		it("don't upload a file to room with more than 1 file", (done) => {
			request
				.post(api(`rooms.upload/${testChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.attach('file', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Just 1 file is allowed');
				})
				.end(done);
		});

		let fileNewUrl;
		let fileOldUrl;
		it('upload a file to room', (done) => {
			request
				.post(api(`rooms.upload/${testChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const { message } = res.body;
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message._id', message._id);
					expect(res.body).to.have.nested.property('message.rid', testChannel._id);
					expect(res.body).to.have.nested.property('message.file._id', message.file._id);
					expect(res.body).to.have.nested.property('message.file.type', message.file.type);
					fileNewUrl = `/file-upload/${message.file._id}/${message.file.name}`;
					fileOldUrl = `/ufs/GridFS:Uploads/${message.file._id}/${message.file.name}`;
				})
				.end(done);
		});

		it('should be able to get the file', async () => {
			await request.get(fileNewUrl).set(credentials).expect('Content-Type', 'image/png').expect(200);
			await request.get(fileOldUrl).set(credentials).expect('Content-Type', 'image/png').expect(200);
		});

		it('should be able to get the file when no access to the room', async () => {
			await request.get(fileNewUrl).set(userCredentials).expect('Content-Type', 'image/png').expect(200);
			await request.get(fileOldUrl).set(userCredentials).expect('Content-Type', 'image/png').expect(200);
		});

		it('should not be able to get the file when no access to the room if setting blocks', async () => {
			await updateSetting('FileUpload_Restrict_to_room_members', true);
			await request.get(fileNewUrl).set(userCredentials).expect(403);
			await request.get(fileOldUrl).set(userCredentials).expect(403);
		});

		it('should be able to get the file if member and setting blocks outside access', async () => {
			await updateSetting('FileUpload_Restrict_to_room_members', true);
			await request.get(fileNewUrl).set(credentials).expect('Content-Type', 'image/png').expect(200);
			await request.get(fileOldUrl).set(credentials).expect('Content-Type', 'image/png').expect(200);
		});

		it('should not be able to get the file without credentials', async () => {
			await request.get(fileNewUrl).attach('file', imgURL).expect(403);
			await request.get(fileOldUrl).attach('file', imgURL).expect(403);
		});

		it('should be able to get the file without credentials if setting allows', async () => {
			await updateSetting('FileUpload_ProtectFiles', false);
			await request.get(fileNewUrl).expect('Content-Type', 'image/png').expect(200);
			await request.get(fileOldUrl).expect('Content-Type', 'image/png').expect(200);
		});
	});

	describe('/rooms.favorite', () => {
		let testChannel;
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName }).end((err, res) => {
				testChannel = res.body.channel;
				done();
			});
		});
		it('should favorite the room when send favorite: true by roomName', (done) => {
			request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomName: testChannelName,
					favorite: true,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should unfavorite the room when send favorite: false by roomName', (done) => {
			request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomName: testChannelName,
					favorite: false,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should favorite the room when send favorite: true by roomId', (done) => {
			request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					favorite: true,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should unfavorite room when send favorite: false by roomId', (done) => {
			request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					favorite: false,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should return an error when send an invalid room', (done) => {
			request
				.post(api('rooms.favorite'))
				.set(credentials)
				.send({
					roomId: 'foo',
					favorite: false,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
	});

	describe('/rooms.nameExists', () => {
		it('should return 401 unauthorized when user is not logged in', (done) => {
			request
				.get(api('rooms.nameExists'))
				.expect('Content-Type', 'application/json')
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		// eslint-disable-next-line no-unused-vars
		let testChannel;
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName }).end((err, res) => {
				testChannel = res.body.channel;
				done();
			});
		});
		it('should return true if this room name exists', (done) => {
			request
				.get(api('rooms.nameExists'))
				.set(credentials)
				.query({
					roomName: testChannelName,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('exists', true);
				})
				.end(done);
		});

		it('should return an error when send an invalid room', (done) => {
			request
				.get(api('rooms.nameExists'))
				.set(credentials)
				.query({
					roomId: 'foo',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error');
				})
				.end(done);
		});
	});

	describe('[/rooms.cleanHistory]', () => {
		let publicChannel;
		let privateChannel;
		let directMessageChannel;
		let user;
		beforeEach((done) => {
			const username = `user.test.${Date.now()}`;
			const email = `${username}@rocket.chat`;
			request
				.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					user = res.body.user;
					done(err);
				});
		});

		let userCredentials;
		beforeEach((done) => {
			request
				.post(api('login'))
				.send({
					user: user.username,
					password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					userCredentials = {};
					userCredentials['X-Auth-Token'] = res.body.data.authToken;
					userCredentials['X-User-Id'] = res.body.data.userId;
				})
				.end(done);
		});
		afterEach((done) => {
			request
				.post(api('users.delete'))
				.set(credentials)
				.send({
					userId: user._id,
				})
				.end(done);
			user = undefined;
		});
		it('create a public channel', (done) => {
			createRoom({ type: 'c', name: `testeChannel${+new Date()}` }).end((err, res) => {
				publicChannel = res.body.channel;
				done();
			});
		});
		it('create a private channel', (done) => {
			createRoom({ type: 'p', name: `testPrivateChannel${+new Date()}` }).end((err, res) => {
				privateChannel = res.body.group;
				done(err);
			});
		});
		it('create a direct message', (done) => {
			createRoom({ type: 'd', username: 'rocket.cat' }).end((err, res) => {
				directMessageChannel = res.body.room.rid;
				done(err);
			});
		});
		it('should return success when send a valid public channel', (done) => {
			request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should successfully delete an image and thumbnail from public channel', (done) => {
			request
				.post(api(`rooms.upload/${publicChannel._id}`))
				.set(credentials)
				.attach('file', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					const { message } = res.body;
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('message._id', message._id);
					expect(res.body).to.have.nested.property('message.rid', publicChannel._id);
					expect(res.body).to.have.nested.property('message.file._id', message.file._id);
					expect(res.body).to.have.nested.property('message.file.type', message.file.type);
				});

			request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '9999-12-31T23:59:59.000Z',
					oldest: '0001-01-01T00:00:00.000Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomId: publicChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array');
					expect(res.body.files).to.have.lengthOf(0);
				})
				.end(done);
		});
		it('should return success when send a valid private channel', (done) => {
			request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: privateChannel._id,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return success when send a valid Direct Message channel', (done) => {
			request
				.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: directMessageChannel,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return not allowed error when try deleting messages with user without permission', (done) => {
			request
				.post(api('rooms.cleanHistory'))
				.set(userCredentials)
				.send({
					roomId: directMessageChannel,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				})
				.end(done);
		});
	});

	describe('[/rooms.info]', () => {
		let testChannel;
		let testGroup;
		let testDM;
		const expectedKeys = [
			'_id',
			'name',
			'fname',
			't',
			'msgs',
			'usersCount',
			'u',
			'customFields',
			'ts',
			'ro',
			'sysMes',
			'default',
			'_updatedAt',
		];
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
		const testGroupName = `group.test.${Date.now()}-${Math.random()}`;
		after((done) => {
			closeRoom({ type: 'd', roomId: testDM._id }).then(done);
		});
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName }).end((err, res) => {
				testChannel = res.body.channel;
				done();
			});
		});
		it('create a group', (done) => {
			createRoom({ type: 'p', name: testGroupName }).end((err, res) => {
				testGroup = res.body.group;
				done();
			});
		});
		it('create a Direct message room with rocket.cat', (done) => {
			createRoom({ type: 'd', username: 'rocket.cat' }).end((err, res) => {
				testDM = res.body.room;
				done();
			});
		});
		it('should return the info about the created channel correctly searching by roomId', (done) => {
			request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.keys(expectedKeys);
				})
				.end(done);
		});
		it('should return the info about the created channel correctly searching by roomName', (done) => {
			request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomName: testChannel.name,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.all.keys(expectedKeys);
				})
				.end(done);
		});
		it('should return the info about the created group correctly searching by roomId', (done) => {
			request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.all.keys(expectedKeys);
				})
				.end(done);
		});
		it('should return the info about the created group correctly searching by roomName', (done) => {
			request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomName: testGroup.name,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.all.keys(expectedKeys);
				})
				.end(done);
		});
		it('should return the info about the created DM correctly searching by roomId', (done) => {
			request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testDM._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
				})
				.end(done);
		});
		it('should return name and _id of public channel when it has the "fields" query parameter limiting by name', (done) => {
			request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					fields: JSON.stringify({ name: 1 }),
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');
					expect(res.body.room).to.have.property('name').and.to.be.equal(testChannelName);
					expect(res.body.room).to.have.all.keys(['_id', 'name']);
				})
				.end(done);
		});
	});

	describe('[/rooms.leave]', () => {
		let testChannel;
		let testGroup;
		let testDM;
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
		const testGroupName = `group.test.${Date.now()}-${Math.random()}`;
		after((done) => {
			closeRoom({ type: 'd', roomId: testDM._id }).then(done);
		});
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName }).end((err, res) => {
				testChannel = res.body.channel;
				done();
			});
		});
		it('create a group', (done) => {
			createRoom({ type: 'p', name: testGroupName }).end((err, res) => {
				testGroup = res.body.group;
				done();
			});
		});
		it('create a Direct message room with rocket.cat', (done) => {
			createRoom({ type: 'd', username: 'rocket.cat' }).end((err, res) => {
				testDM = res.body.room;
				done();
			});
		});
		it('should return an Error when trying leave a DM room', (done) => {
			request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testDM._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				})
				.end(done);
		});
		it('should return an Error when trying to leave a public channel and you are the last owner', (done) => {
			request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-you-are-last-owner');
				})
				.end(done);
		});
		it('should return an Error when trying to leave a private group and you are the last owner', (done) => {
			request
				.post(api('rooms.leave'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-you-are-last-owner');
				})
				.end(done);
		});
		it('should return an Error when trying to leave a public channel and not have the necessary permission(leave-c)', (done) => {
			updatePermission('leave-c', []).then(() => {
				request
					.post(api('rooms.leave'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
					})
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
					})
					.end(done);
			});
		});
		it('should return an Error when trying to leave a private group and not have the necessary permission(leave-p)', (done) => {
			updatePermission('leave-p', []).then(() => {
				request
					.post(api('rooms.leave'))
					.set(credentials)
					.send({
						roomId: testGroup._id,
					})
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-allowed');
					})
					.end(done);
			});
		});
		it('should leave the public channel when the room has at least another owner and the user has the necessary permission(leave-c)', (done) => {
			updatePermission('leave-c', ['admin']).then(() => {
				request
					.post(api('channels.addAll'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
					})
					.end(() => {
						request
							.post(api('channels.addOwner'))
							.set(credentials)
							.send({
								roomId: testChannel._id,
								userId: 'rocket.cat',
							})
							.end(() => {
								request
									.post(api('rooms.leave'))
									.set(credentials)
									.send({
										roomId: testChannel._id,
									})
									.expect(200)
									.expect((res) => {
										expect(res.body).to.have.property('success', true);
									})
									.end(done);
							});
					});
			});
		});
		it('should leave the private group when the room has at least another owner and the user has the necessary permission(leave-p)', (done) => {
			updatePermission('leave-p', ['admin']).then(() => {
				request
					.post(api('groups.addAll'))
					.set(credentials)
					.send({
						roomId: testGroup._id,
					})
					.end(() => {
						request
							.post(api('groups.addOwner'))
							.set(credentials)
							.send({
								roomId: testGroup._id,
								userId: 'rocket.cat',
							})
							.end(() => {
								request
									.post(api('rooms.leave'))
									.set(credentials)
									.send({
										roomId: testGroup._id,
									})
									.expect(200)
									.expect((res) => {
										expect(res.body).to.have.property('success', true);
									})
									.end(done);
							});
					});
			});
		});
	});

	describe('/rooms.createDiscussion', () => {
		let testChannel;
		const testChannelName = `channel.test.${Date.now()}-${Math.random()}`;
		let messageSent;
		before((done) => {
			createRoom({ type: 'c', name: testChannelName }).end((err, res) => {
				testChannel = res.body.channel;
				sendSimpleMessage({
					roomId: testChannel._id,
				}).end((err, res) => {
					messageSent = res.body.message;
					done();
				});
			});
		});
		it('should throw an error when the user tries to create a discussion and the feature is disabled', (done) => {
			updateSetting('Discussion_enabled', false).then(() => {
				request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testChannel._id,
						t_name: 'valid name',
					})
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
					})
					.end(() => updateSetting('Discussion_enabled', true).then(done));
			});
		});
		it('should throw an error when the user tries to create a discussion and does not have at least one of the required permissions', (done) => {
			updatePermission('start-discussion', []).then(() => {
				updatePermission('start-discussion-other-user', []).then(() => {
					request
						.post(api('rooms.createDiscussion'))
						.set(credentials)
						.send({
							prid: testChannel._id,
							t_name: 'valid name',
						})
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.property('errorType', 'error-action-not-allowed');
						})
						.end(() => {
							updatePermission('start-discussion', ['admin', 'user', 'guest'])
								.then(() => updatePermission('start-discussion-other-user', ['admin', 'user', 'guest']))
								.then(done);
						});
				});
			});
		});
		it('should throw an error when the user tries to create a discussion without the required parameter "prid"', (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Body parameter "prid" is required.');
				})
				.end(done);
		});
		it('should throw an error when the user tries to create a discussion without the required parameter "t_name"', (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Body parameter "t_name" is required.');
				})
				.end(done);
		});
		it('should throw an error when the user tries to create a discussion with the required parameter invalid "users"(different from an array)', (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: 'valid name',
					users: 'invalid-type-of-users',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Body parameter "users" must be an array.');
				})
				.end(done);
		});
		it("should throw an error when the user tries to create a discussion with the channel's id invalid", (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: 'invalid-id',
					t_name: 'valid name',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-room');
				})
				.end(done);
		});
		it("should throw an error when the user tries to create a discussion with the message's id invalid", (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: 'valid name',
					pmid: 'invalid-message',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-message');
				})
				.end(done);
		});
		it('should create a discussion successfully when send only the required parameters', (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussion').and.to.be.an('object');
					expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
					expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}`);
				})
				.end(done);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "reply"', (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
					reply: 'reply from discussion tests',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussion').and.to.be.an('object');
					expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
					expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}`);
				})
				.end(done);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "users"', (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
					reply: 'reply from discussion tests',
					users: ['rocket.cat'],
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussion').and.to.be.an('object');
					expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
					expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}`);
				})
				.end(done);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "pmid"', (done) => {
			request
				.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${testChannel.name}`,
					reply: 'reply from discussion tests',
					users: ['rocket.cat'],
					pmid: messageSent._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussion').and.to.be.an('object');
					expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
					expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}`);
				})
				.end(done);
		});

		describe('it should create a *private* discussion if the parent channel is public and inside a private team', async () => {
			let privateTeam;

			it('should create a team', (done) => {
				request
					.post(api('teams.create'))
					.set(credentials)
					.send({
						name: `test-team-${Date.now()}`,
						type: 1,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('team');
						expect(res.body).to.have.nested.property('team._id');
						privateTeam = res.body.team;
					})
					.end(done);
			});

			it('should add the public channel to the team', (done) => {
				request
					.post(api('teams.addRooms'))
					.set(credentials)
					.send({
						rooms: [testChannel._id],
						teamId: privateTeam._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success');
					})
					.end(done);
			});

			it('should create a private discussion inside the public channel', (done) => {
				request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testChannel._id,
						t_name: `discussion-create-from-tests-${testChannel.name}-team`,
					})
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('discussion').and.to.be.an('object');
						expect(res.body.discussion).to.have.property('prid').and.to.be.equal(testChannel._id);
						expect(res.body.discussion).to.have.property('fname').and.to.be.equal(`discussion-create-from-tests-${testChannel.name}-team`);
						expect(res.body.discussion).to.have.property('t').and.to.be.equal('p');
					})
					.end(done);
			});
		});
	});

	describe('/rooms.getDiscussions', () => {
		let testChannel;
		const testChannelName = `channel.test.getDiscussions${Date.now()}-${Math.random()}`;
		let discussion;
		before((done) => {
			createRoom({ type: 'c', name: testChannelName }).end((err, res) => {
				testChannel = res.body.channel;
				request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testChannel._id,
						t_name: `discussion-create-from-tests-${testChannel.name}`,
					})
					.end((err, res) => {
						discussion = res.body.discussion;
						done();
					});
			});
		});
		after(() => closeRoom({ type: 'p', roomId: discussion._id }));
		it('should throw an error when the user tries to gets a list of discussion without a required parameter "roomId"', (done) => {
			request
				.get(api('rooms.getDiscussions'))
				.set(credentials)
				.query({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The parameter "roomId" or "roomName" is required [error-roomid-param-not-provided]');
				})
				.end(done);
		});
		it('should throw an error when the user tries to gets a list of discussion and he cannot access the room', (done) => {
			updatePermission('view-c-room', []).then(() => {
				request
					.get(api('rooms.getDiscussions'))
					.set(credentials)
					.query({})
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'Not Allowed');
					})
					.end(() => updatePermission('view-c-room', ['admin', 'user', 'bot', 'anonymous']).then(done));
			});
		});
		it('should return a list of discussions with ONE discussion', (done) => {
			request
				.get(api('rooms.getDiscussions'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussions').and.to.be.an('array');
					expect(res.body.discussions).to.have.lengthOf(1);
				})
				.end(done);
		});
	});

	describe('[/rooms.autocomplete.channelAndPrivate]', () => {
		it('should return an error when the required parameter "selector" is not provided', (done) => {
			request
				.get(api('rooms.autocomplete.channelAndPrivate'))
				.set(credentials)
				.query({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal("The 'selector' param is required");
				})
				.end(done);
		});
		it('should return the rooms to fill auto complete', (done) => {
			request
				.get(api('rooms.autocomplete.channelAndPrivate?selector={}'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').and.to.be.an('array');
				})
				.end(done);
		});
	});
	describe('[/rooms.autocomplete.channelAndPrivate.withPagination]', () => {
		it('should return an error when the required parameter "selector" is not provided', (done) => {
			request
				.get(api('rooms.autocomplete.channelAndPrivate.withPagination'))
				.set(credentials)
				.query({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal("The 'selector' param is required");
				})
				.end(done);
		});
		it('should return the rooms to fill auto complete', (done) => {
			request
				.get(api('rooms.autocomplete.channelAndPrivate.withPagination?selector={}'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').and.to.be.an('array');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});
		it('should return the rooms to fill auto complete even requested with count and offset params', (done) => {
			request
				.get(api('rooms.autocomplete.channelAndPrivate.withPagination?selector={}'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').and.to.be.an('array');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});
	});

	describe('[/rooms.autocomplete.availableForTeams]', () => {
		it('should return the rooms to fill auto complete', (done) => {
			request
				.get(api('rooms.autocomplete.availableForTeams'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return the filtered rooms to fill auto complete', (done) => {
			request
				.get(api('rooms.autocomplete.availableForTeams?name=group'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').and.to.be.an('array');
				})
				.end(done);
		});
	});
	describe('[/rooms.autocomplete.adminRooms]', () => {
		let testGroup;
		const testGroupName = `channel.test.adminRoom${Date.now()}-${Math.random()}`;
		const name = {
			name: testGroupName,
		};
		before((done) => {
			createRoom({ type: 'p', name: testGroupName }).end((err, res) => {
				testGroup = res.body.group;
				request
					.post(api('rooms.createDiscussion'))
					.set(credentials)
					.send({
						prid: testGroup._id,
						t_name: `${testGroupName}-discussion`,
					})
					.end(done);
			});
		});
		(IS_EE ? it : it.skip)('should return an error when the required parameter "selector" is not provided', (done) => {
			updateEEPermission('can-audit', ['admin']).then(() => {
				request
					.get(api('rooms.autocomplete.adminRooms'))
					.set(credentials)
					.query({})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal("The 'selector' param is required");
					})
					.end(done);
			});
		});
		it('should return the rooms to fill auto complete', (done) => {
			request
				.get(api('rooms.autocomplete.adminRooms?selector={}'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return FIX	 the rooms to fill auto complete', (done) => {
			request
				.get(api('rooms.autocomplete.adminRooms?'))
				.set(credentials)
				.query({
					selector: JSON.stringify(name),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('items').and.to.be.an('array');
					expect(res.body).to.have.property('items').that.have.lengthOf(2);
				})
				.end(done);
		});
	});
	describe('/rooms.adminRooms', () => {
		const suffix = `test-${Date.now()}`;
		const fnameRoom = `Ελληνικά-${suffix}`;
		const nameRoom = `Ellinika-${suffix}`;
		const discussionRoomName = `${nameRoom}-discussion`;

		let testGroup;

		before((done) => {
			updateSetting('UI_Allow_room_names_with_special_chars', true).then(() => {
				createRoom({ type: 'p', name: fnameRoom }).end((err, res) => {
					testGroup = res.body.group;
					request
						.post(api('rooms.createDiscussion'))
						.set(credentials)
						.send({
							prid: testGroup._id,
							t_name: discussionRoomName,
						})
						.end(done);
				});
			});
		});

		it('should throw an error when the user tries to gets a list of discussion and he cannot access the room', (done) => {
			updatePermission('view-room-administration', []).then(() => {
				request
					.get(api('rooms.adminRooms'))
					.set(credentials)
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-authorized');
					})
					.end(() => updatePermission('view-room-administration', ['admin']).then(done));
			});
		});
		it('should return a list of admin rooms', (done) => {
			request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return a list of admin rooms even requested with count and offset params', (done) => {
			request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should search the list of admin rooms using non-latin characters when UI_Allow_room_names_with_special_chars setting is toggled', (done) => {
			updateSetting('UI_Allow_room_names_with_special_chars', true).then(() => {
				request
					.get(api('rooms.adminRooms'))
					.set(credentials)
					.query({
						filter: fnameRoom,
					})
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms').and.to.be.an('array');
						expect(res.body.rooms).to.have.lengthOf(1);
						expect(res.body.rooms[0].fname).to.be.equal(fnameRoom);
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('count');
					})
					.end(done);
			});
		});
		it('should search the list of admin rooms using latin characters only when UI_Allow_room_names_with_special_chars setting is disabled', (done) => {
			updateSetting('UI_Allow_room_names_with_special_chars', false).then(() => {
				request
					.get(api('rooms.adminRooms'))
					.set(credentials)
					.query({
						filter: nameRoom,
					})
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('rooms').and.to.be.an('array');
						expect(res.body.rooms).to.have.lengthOf(1);
						expect(res.body.rooms[0].name).to.be.equal(nameRoom);
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('total');
						expect(res.body).to.have.property('count');
					})
					.end(done);
			});
		});
		it('should filter by only rooms types', (done) => {
			request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					types: ['p'],
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body.rooms).to.have.lengthOf.at.least(1);
					expect(res.body.rooms[0].t).to.be.equal('p');
					expect(res.body.rooms.find((room) => room.name === nameRoom)).to.exist;
					expect(res.body.rooms.find((room) => room.name === discussionRoomName)).to.not.exist;
				})
				.end(done);
		});
		it('should filter by only name', (done) => {
			request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					filter: nameRoom,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body.rooms).to.have.lengthOf(1);
					expect(res.body.rooms[0].name).to.be.equal(nameRoom);
				})
				.end(done);
		});
		it('should filter by type and name at the same query', (done) => {
			request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					filter: nameRoom,
					types: ['p'],
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body.rooms).to.have.lengthOf(1);
					expect(res.body.rooms[0].name).to.be.equal(nameRoom);
				})
				.end(done);
		});
		it('should return an empty array when filter by wrong type and correct room name', (done) => {
			request
				.get(api('rooms.adminRooms'))
				.set(credentials)
				.query({
					filter: nameRoom,
					types: ['c'],
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('rooms').and.to.be.an('array');
					expect(res.body.rooms).to.have.lengthOf(0);
				})
				.end(done);
		});
	});

	describe('update group dms name', () => {
		let testUser;
		let roomId;

		before(async () => {
			testUser = await createUser();

			const rocketcat = 'rocket.cat';
			const usernames = [testUser.username, rocketcat].join(',');

			const result = await request.post(api('dm.create')).set(credentials).send({
				usernames,
			});

			roomId = result.body.room.rid;
		});

		it('should update group name if user changes username', (done) => {
			updateSetting('UI_Use_Real_Name', false).then(() => {
				request
					.post(api('users.update'))
					.set(credentials)
					.send({
						userId: testUser._id,
						data: {
							username: `changed.username.${testUser.username}`,
						},
					})
					.end(() => {
						request
							.get(api('subscriptions.getOne'))
							.set(credentials)
							.query({ roomId })
							.end((err, res) => {
								const { subscription } = res.body;
								expect(subscription.name).to.equal(`rocket.cat,changed.username.${testUser.username}`);
								done();
							});
					});
			});
		});

		it('should update group name if user changes name', (done) => {
			updateSetting('UI_Use_Real_Name', true).then(() => {
				request
					.post(api('users.update'))
					.set(credentials)
					.send({
						userId: testUser._id,
						data: {
							name: `changed.name.${testUser.username}`,
						},
					})
					.end(() => {
						request
							.get(api('subscriptions.getOne'))
							.set(credentials)
							.query({ roomId })
							.end((err, res) => {
								const { subscription } = res.body;
								expect(subscription.fname).to.equal(`changed.name.${testUser.username}, Rocket.Cat`);
								done();
							});
					});
			});
		});
	});

	describe('/rooms.delete', () => {
		let testChannel;
		before('create an channel', async () => {
			const result = await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;
		});
		it('should throw an error when roomId is not provided', (done) => {
			request
				.post(api('rooms.delete'))
				.set(credentials)
				.send({})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', "The 'roomId' param is required");
				})
				.end(done);
		});
		it('should delete a room when the request is correct', (done) => {
			request
				.post(api('rooms.delete'))
				.set(credentials)
				.send({ roomId: testChannel._id })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should throw an error when the room id doesn exist', (done) => {
			request
				.post(api('rooms.delete'))
				.set(credentials)
				.send({ roomId: 'invalid' })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('/rooms.saveRoomSettings', () => {
		let testChannel;
		const randomString = `randomString${Date.now()}`;

		before('create a channel', async () => {
			const result = await createRoom({ type: 'c', name: `channel.test.${Date.now()}-${Math.random()}` });
			testChannel = result.body.channel;
		});

		it('should update the room settings', (done) => {
			const imageDataUri = `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), imgURL)).toString('base64')}`;

			request
				.post(api('rooms.saveRoomSettings'))
				.set(credentials)
				.send({
					rid: testChannel._id,
					roomAvatar: imageDataUri,
					featured: true,
					roomName: randomString,
					roomTopic: randomString,
					roomAnnouncement: randomString,
					roomDescription: randomString,
					roomType: 'p',
					readOnly: true,
					reactWhenReadOnly: true,
					default: true,
					favorite: {
						favorite: true,
						defaultValue: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.end(done);
		});

		it('should have reflected on rooms.info', (done) => {
			request
				.get(api('rooms.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.be.an('object');

					expect(res.body.room).to.have.property('_id', testChannel._id);
					expect(res.body.room).to.have.property('name', randomString);
					expect(res.body.room).to.have.property('topic', randomString);
					expect(res.body.room).to.have.property('announcement', randomString);
					expect(res.body.room).to.have.property('description', randomString);
					expect(res.body.room).to.have.property('t', 'p');
					expect(res.body.room).to.have.property('featured', true);
					expect(res.body.room).to.have.property('ro', true);
					expect(res.body.room).to.have.property('default', true);
					expect(res.body.room).to.have.property('favorite', true);
					expect(res.body.room).to.have.property('reactWhenReadOnly', true);
				})
				.end(done);
		});
	});
});

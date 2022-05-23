import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { password } from '../../data/user';
import { closeRoom, createRoom } from '../../data/rooms.helper';
import { imgURL } from '../../data/interactions.js';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { sendSimpleMessage } from '../../data/chat.helper';
import { createUser } from '../../data/users.helper';

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
				})
				.end(done);
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
					console.log('rooms.cleanHistory', res.body);
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
		it('should return an error when the required parameter "selector" is not provided', (done) => {
			updatePermission('can-audit', ['admin']).then(() => {
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
});

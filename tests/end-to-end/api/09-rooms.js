import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { password } from '../../data/user';
import { closeRoom, createRoom } from '../../data/rooms.helper';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { sendSimpleMessage } from '../../data/chat.helper';

describe('[Rooms]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	it('/rooms.get', (done) => {
		request.get(api('rooms.get'))
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
		request.get(api('rooms.get'))
			.set(credentials)
			.query({
				updatedSince: new Date,
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
			createRoom({ type: 'c', name: `channel.test.${ Date.now() }` })
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('/rooms.saveNotification:', (done) => {
			request.post(api('rooms.saveNotification'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					notifications: {
						disableNotifications: '0',
						emailNotifications: 'nothing',
						audioNotificationValue: 'beep',
						desktopNotifications: 'nothing',
						desktopNotificationDuration: '2',
						audioNotifications: 'all',
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

	describe('/rooms.favorite', () => {
		let testChannel;
		const testChannelName = `channel.test.${ Date.now() }`;
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName })
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('should favorite the room when send favorite: true by roomName', (done) => {
			request.post(api('rooms.favorite'))
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
			request.post(api('rooms.favorite'))
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
			request.post(api('rooms.favorite'))
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
			request.post(api('rooms.favorite'))
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
			request.post(api('rooms.favorite'))
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
			const username = `user.test.${ Date.now() }`;
			const email = `${ username }@rocket.chat`;
			request.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					user = res.body.user;
					done();
				});
		});

		let userCredentials;
		beforeEach((done) => {
			request.post(api('login'))
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
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id,
			}).end(done);
			user = undefined;
		});
		it('create a public channel', (done) => {
			createRoom({ type: 'c', name: `testeChannel${ +new Date() }` })
				.end((err, res) => {
					publicChannel = res.body.channel;
					done();
				});
		});
		it('create a private channel', (done) => {
			createRoom({ type: 'p', name: `testPrivateChannel${ +new Date() }` })
				.end((err, res) => {
					privateChannel = res.body.group;
					done();
				});
		});
		it('create a direct message', (done) => {
			createRoom({ type: 'd', username: 'rocket.cat' })
				.end((err, res) => {
					directMessageChannel = res.body.room;
					done();
				});
		});
		it('should return success when send a valid public channel', (done) => {
			request.post(api('rooms.cleanHistory'))
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
			request.post(api('rooms.cleanHistory'))
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
			request.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: directMessageChannel._id,
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
			request.post(api('rooms.cleanHistory'))
				.set(userCredentials)
				.send({
					roomId: directMessageChannel._id,
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
		const expectedKeys = ['_id', 'name', 'fname', 't', 'msgs', 'usersCount', 'u', 'customFields', 'ts', 'ro', 'sysMes', 'default', '_updatedAt'];
		const testChannelName = `channel.test.${ Date.now() }-${ Math.random() }`;
		const testGroupName = `group.test.${ Date.now() }-${ Math.random() }`;
		after((done) => {
			closeRoom({ type: 'd', roomId: testDM._id })
				.then(done);
		});
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName })
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('create a group', (done) => {
			createRoom(({ type: 'p', name: testGroupName }))
				.end((err, res) => {
					testGroup = res.body.group;
					done();
				});
		});
		it('create a Direct message room with rocket.cat', (done) => {
			createRoom(({ type: 'd', username: 'rocket.cat' }))
				.end((err, res) => {
					testDM = res.body.room;
					done();
				});
		});
		it('should return the info about the created channel correctly searching by roomId', (done) => {
			request.get(api('rooms.info'))
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
			request.get(api('rooms.info'))
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
			request.get(api('rooms.info'))
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
			request.get(api('rooms.info'))
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
			request.get(api('rooms.info'))
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
			request.get(api('rooms.info'))
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
		const testChannelName = `channel.test.${ Date.now() }-${ Math.random() }`;
		const testGroupName = `group.test.${ Date.now() }-${ Math.random() }`;
		after((done) => {
			closeRoom({ type: 'd', roomId: testDM._id })
				.then(done);
		});
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName })
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('create a group', (done) => {
			createRoom(({ type: 'p', name: testGroupName }))
				.end((err, res) => {
					testGroup = res.body.group;
					done();
				});
		});
		it('create a Direct message room with rocket.cat', (done) => {
			createRoom(({ type: 'd', username: 'rocket.cat' }))
				.end((err, res) => {
					testDM = res.body.room;
					done();
				});
		});
		it('should return an Error when trying leave a DM room', (done) => {
			request.post(api('rooms.leave'))
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
			request.post(api('rooms.leave'))
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
			request.post(api('rooms.leave'))
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
				request.post(api('rooms.leave'))
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
				request.post(api('rooms.leave'))
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
				request.post(api('channels.addAll'))
					.set(credentials)
					.send({
						roomId: testChannel._id,
					})
					.end(() => {
						request.post(api('channels.addOwner'))
							.set(credentials)
							.send({
								roomId: testChannel._id,
								userId: 'rocket.cat',
							})
							.end(() => {
								request.post(api('rooms.leave'))
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
				request.post(api('groups.addAll'))
					.set(credentials)
					.send({
						roomId: testGroup._id,
					})
					.end(() => {
						request.post(api('groups.addOwner'))
							.set(credentials)
							.send({
								roomId: testGroup._id,
								userId: 'rocket.cat',
							})
							.end(() => {
								request.post(api('rooms.leave'))
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
		const testChannelName = `channel.test.${ Date.now() }`;
		let messageSent;
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName })
				.end((err, res) => {
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
				request.post(api('rooms.createDiscussion'))
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
					request.post(api('rooms.createDiscussion'))
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
							updatePermission('start-discussion', ['admin'])
								.then(() => updatePermission('start-discussion-other-user', ['admin']))
								.then(done);
						});
				});
			});
		});
		it('should throw an error when the user tries to create a discussion without the required parameter "prid"', (done) => {
			request.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Body parameter \"prid\" is required.');
				})
				.end(done);
		});
		it('should throw an error when the user tries to create a discussion without the required parameter "t_name"', (done) => {
			request.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Body parameter \"t_name\" is required.');
				})
				.end(done);
		});
		it('should throw an error when the user tries to create a discussion with the required parameter invalid "users"(different from an array)', (done) => {
			request.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: 'valid name',
					users: 'invalid-type-of-users',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Body parameter \"users\" must be an array.');
				})
				.end(done);
		});
		it('should throw an error when the user tries to create a discussion with the channel\'s id invalid', (done) => {
			request.post(api('rooms.createDiscussion'))
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
		it('should throw an error when the user tries to create a discussion with the message\'s id invalid', (done) => {
			request.post(api('rooms.createDiscussion'))
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
			request.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${ testChannel.name }`,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussion').and.to.be.an('object');
				})
				.end(done);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "reply"', (done) => {
			request.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${ testChannel.name }`,
					reply: 'reply from discussion tests',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussion').and.to.be.an('object');
				})
				.end(done);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "users"', (done) => {
			request.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${ testChannel.name }`,
					reply: 'reply from discussion tests',
					users: ['rocket.cat'],
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussion').and.to.be.an('object');
				})
				.end(done);
		});
		it('should create a discussion successfully when send the required parameters plus the optional parameter "pmid"', (done) => {
			request.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${ testChannel.name }`,
					reply: 'reply from discussion tests',
					users: ['rocket.cat'],
					pmid: messageSent._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('discussion').and.to.be.an('object');
				})
				.end(done);
		});
	});

	describe('/rooms.getDiscussions', () => {
		let testChannel;
		const testChannelName = `channel.test.getDiscussions${ Date.now() }`;
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName })
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('create a discussion', (done) => {
			request.post(api('rooms.createDiscussion'))
				.set(credentials)
				.send({
					prid: testChannel._id,
					t_name: `discussion-create-from-tests-${ testChannel.name }`,
				})
				.end(done);
		});
		it('should throw an error when the user tries to gets a list of discussion without a required parameter "roomId"', (done) => {
			request.get(api('rooms.getDiscussions'))
				.set(credentials)
				.query({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The parameter \"roomId\" or \"roomName\" is required [error-roomid-param-not-provided]');
				})
				.end(done);
		});
		it('should throw an error when the user tries to gets a list of discussion and he cannot access the room', (done) => {
			updatePermission('view-c-room', []).then(() => {
				request.get(api('rooms.getDiscussions'))
					.set(credentials)
					.query({})
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'Not Allowed');
					})
					.end(() => updatePermission('view-c-room', ['admin']).then(done));
			});
		});
		it('should return a list of discussions with ONE discussion', (done) => {
			request.get(api('rooms.getDiscussions'))
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
});

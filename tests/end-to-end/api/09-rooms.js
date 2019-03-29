import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { password } from '../../data/user';
import { closeRoom, createRoom } from '../../data/rooms.helper';
import { updatePermission } from '../../data/permissions.helper';
import { imgURL } from '../../data/interactions.js';

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

	describe('/rooms.upload', () => {
		let testChannel;
		const testChannelName = `channel.test.upload.${ Date.now() }`;
		it('create an channel', (done) => {
			createRoom({ type: 'c', name: testChannelName })
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('don\'t upload a file to room with file field other than file', (done) => {
			request.post(api(`rooms.upload/${ testChannel._id }`))
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
		it('don\'t upload a file to room with empty file', (done) => {
			request.post(api(`rooms.upload/${ testChannel._id }`))
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
		it('don\'t upload a file to room with more than 1 file', (done) => {
			request.post(api(`rooms.upload/${ testChannel._id }`))
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
			request.post(api(`rooms.upload/${ testChannel._id }`))
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
});

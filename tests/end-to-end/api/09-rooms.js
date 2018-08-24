/* eslint-env mocha */
/* globals expect */

import { getCredentials, api, request, credentials} from '../../data/api-data.js';
import { password } from '../../data/user';

describe('[Rooms]', function() {
	this.retries(0);

	before(done => getCredentials(done));

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
				updatedSince: new Date
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
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.test.${ Date.now() }`
				})
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
						mobilePushNotifications: 'mentions'
					}
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
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: testChannelName
				})
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
					favorite: true
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
					favorite: false
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
					favorite: true
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
					favorite: false
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
					favorite: false
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
					password
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
		afterEach(done => {
			request.post(api('users.delete')).set(credentials).send({
				userId: user._id
			}).end(done);
			user = undefined;
		});
		it('create a public channel', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `testeChannel${ +new Date() }`
				})
				.end((err, res) => {
					publicChannel = res.body.channel;
					done();
				});
		});
		it('create a private channel', (done) => {
			request.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `testPrivateChannel${ +new Date() }`
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					privateChannel = res.body.group;
				})
				.end(done);
		});
		it('create a direct message', (done) => {
			request.post(api('im.create'))
				.set(credentials)
				.send({
					username: 'rocket.cat'
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					directMessageChannel = res.body.room;
				})
				.end(done);
		});
		it('should return success when send a valid public channel', (done) => {
			request.post(api('rooms.cleanHistory'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					latest: '2016-12-09T13:42:25.304Z',
					oldest: '2016-08-30T13:42:25.304Z'
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
					oldest: '2016-08-30T13:42:25.304Z'
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
					oldest: '2016-08-30T13:42:25.304Z'
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
					oldest: '2016-08-30T13:42:25.304Z'
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
});

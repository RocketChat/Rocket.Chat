/* eslint-env mocha */
/* globals expect */

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

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
		it('should favorite the room when send favorite: true', (done) => {
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

		it('should unfavorite room when send favorite: false', (done) => {
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
});

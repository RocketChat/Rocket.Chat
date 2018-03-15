/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import {
	getCredentials,
	api,
	login,
	request,
	credentials,
	apiEmail,
	apiUsername,
	targetUser,
	log,
	apiPublicChannelName,
	channel
} from '../../data/api-data.js';
import { adminEmail, password } from '../../data/user.js';
import supertest from 'supertest';

function getRoomInfo(roomId) {
	return new Promise((resolve/*, reject*/) => {
		request.get(api('channels.info'))
			.set(credentials)
			.query({
				roomId
			})
			.end((err, req) => {
				resolve(req.body);
			});
	});
}

describe('[Channels]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	it('/channels.create', (done) => {
		request.post(api('channels.create'))
			.set(credentials)
			.send({
				name: apiPublicChannelName
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', apiPublicChannelName);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', 0);
				channel._id = res.body.channel._id;
			})
			.end(done);
	});

	it('/channels.info', (done) => {
		request.get(api('channels.info'))
			.set(credentials)
			.query({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', apiPublicChannelName);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', 0);
			})
			.end(done);
	});

	it('/channels.invite', async(done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.invite'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', apiPublicChannelName);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			})
			.end(done);
	});

	it('/channels.addModerator', (done) => {
		request.post(api('channels.addModerator'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.removeModerator', (done) => {
		request.post(api('channels.removeModerator'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.addOwner', (done) => {
		request.post(api('channels.addOwner'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.removeOwner', (done) => {
		request.post(api('channels.removeOwner'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.kick', async(done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.kick'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', apiPublicChannelName);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			})
			.end(done);
	});

	it('/channels.invite', async(done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.invite'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', apiPublicChannelName);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			})
			.end(done);
	});

	it('/channels.addOwner', (done) => {
		request.post(api('channels.addOwner'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.setDescription', (done) => {
		request.post(api('channels.setDescription'))
			.set(credentials)
			.send({
				roomId: channel._id,
				description: 'this is a description for a channel for api tests'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('description', 'this is a description for a channel for api tests');
			})
			.end(done);
	});

	it('/channels.setTopic', (done) => {
		request.post(api('channels.setTopic'))
			.set(credentials)
			.send({
				roomId: channel._id,
				topic: 'this is a topic of a channel for api tests'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('topic', 'this is a topic of a channel for api tests');
			})
			.end(done);
	});

	it('/channels.setPurpose', (done) => {
		request.post(api('channels.setPurpose'))
			.set(credentials)
			.send({
				roomId: channel._id,
				purpose: 'this is a purpose of a channel for api tests'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('purpose', 'this is a purpose of a channel for api tests');
			})
			.end(done);
	});

	it('/channels.history', (done) => {
		request.get(api('channels.history'))
			.set(credentials)
			.query({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('messages');
			})
			.end(done);
	});

	it('/channels.cleanHistory', (done) => {
		request.post(api('channels.cleanHistory'))
			.set(credentials)
			.send({
				roomId: channel._id,
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

	it('/channels.archive', (done) => {
		request.post(api('channels.archive'))
			.set(credentials)
			.send({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.unarchive', (done) => {
		request.post(api('channels.unarchive'))
			.set(credentials)
			.send({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.close', (done) => {
		request.post(api('channels.close'))
			.set(credentials)
			.send({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.close', (done) => {
		request.post(api('channels.close'))
			.set(credentials)
			.send({
				roomName: apiPublicChannelName
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error', `The channel, ${ apiPublicChannelName }, is already closed to the sender`);
			})
			.end(done);
	});

	it('/channels.open', (done) => {
		request.post(api('channels.open'))
			.set(credentials)
			.send({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.list', (done) => {
		request.get(api('channels.list'))
			.set(credentials)
			.query({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
			})
			.end(done);
	});

	it('/channels.list.joined', (done) => {
		request.get(api('channels.list.joined'))
			.set(credentials)
			.query({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
			})
			.end(done);
	});

	it('/channels.rename', async(done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.rename'))
			.set(credentials)
			.send({
				roomId: channel._id,
				name: `EDITED${ apiPublicChannelName }`
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${ apiPublicChannelName }`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			})
			.end(done);
	});

	it('/channels.getIntegrations', (done) => {
		request.get(api('channels.getIntegrations'))
			.set(credentials)
			.query({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count', 0);
				expect(res.body).to.have.property('total', 0);
			})
			.end(done);
	});

	it('/channels.addAll', (done) => {
		request.post(api('channels.addAll'))
			.set(credentials)
			.send({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${ apiPublicChannelName }`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
			})
			.end(done);
	});

	it('/channels.setJoinCode', async(done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.setJoinCode'))
			.set(credentials)
			.send({
				roomId: channel._id,
				joinCode: '123'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${ apiPublicChannelName }`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs);
			})
			.end(done);
	});

	it('/channels.setReadOnly', async(done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.setReadOnly'))
			.set(credentials)
			.send({
				roomId: channel._id,
				readOnly: true
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${ apiPublicChannelName }`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs);
			})
			.end(done);
	});

	it('GET /channels.notifications', (done) => {
		request.get(api('channels.notifications'))
			.set(credentials)
			.query({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('subscription').and.to.be.an('object');
			})
			.end(done);
	});

	it('POST /channels.notifications', (done) => {
		request.post(api('channels.notifications'))
			.set(credentials)
			.send({
				roomId: channel._id,
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

	it('/channels.leave', async(done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.leave'))
			.set(credentials)
			.send({
				roomId: channel._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${ apiPublicChannelName }`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			})
			.end(done);
	});

	it('/channels.setType', async(done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.setType'))
			.set(credentials)
			.send({
				roomId: channel._id,
				type: 'p'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${ apiPublicChannelName }`);
				expect(res.body).to.have.nested.property('channel.t', 'p');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			})
			.end(done);
	});

	describe('/channels.delete:', () => {
		let testChannel;
		it('/channels.create', (done) => {
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
		it('/channels.delete', (done) => {
			request.post(api('channels.delete'))
				.set(credentials)
				.send({
					roomName: testChannel.name
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('/channels.info', (done) => {
			request.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-room-not-found');
				})
				.end(done);
		});
	});
});

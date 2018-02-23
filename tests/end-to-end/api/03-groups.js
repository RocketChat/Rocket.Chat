/* eslint-env mocha */
/* globals expect */
/* eslint no-unused-vars: 0 */

import {getCredentials, api, login, request, credentials, group, log, apiPrivateChannelName } from '../../data/api-data.js';
import {adminEmail, password} from '../../data/user.js';
import supertest from 'supertest';

function getRoomInfo(roomId) {
	return new Promise((resolve/*, reject*/) => {
		request.get(api('groups.info'))
			.set(credentials)
			.query({
				roomId
			})
			.end((err, req) => {
				resolve(req.body);
			});
	});
}

describe('[Groups]', function() {
	this.retries(0);

	before(done => getCredentials(done));

	it('/groups.create', (done) => {
		request.post(api('groups.create'))
			.set(credentials)
			.send({
				name: apiPrivateChannelName
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', apiPrivateChannelName);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', 0);
				group._id = res.body.group._id;
			})
			.end(done);
	});

	it('/groups.info', (done) => {
		request.get(api('groups.info'))
			.set(credentials)
			.query({
				roomId: group._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', apiPrivateChannelName);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', 0);
			})
			.end(done);
	});

	it('/groups.invite', async(done) => {
		const roomInfo = await getRoomInfo(group._id);

		request.post(api('groups.invite'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', apiPrivateChannelName);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', roomInfo.group.msgs + 1);
			})
			.end(done);
	});

	it('/groups.addModerator', (done) => {
		request.post(api('groups.addModerator'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.removeModerator', (done) => {
		request.post(api('groups.removeModerator'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.addOwner', (done) => {
		request.post(api('groups.addOwner'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.removeOwner', (done) => {
		request.post(api('groups.removeOwner'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.kick', (done) => {
		request.post(api('groups.kick'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.invite', async(done) => {
		const roomInfo = await getRoomInfo(group._id);

		request.post(api('groups.invite'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', apiPrivateChannelName);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', roomInfo.group.msgs + 1);
			})
			.end(done);
	});

	it('/groups.addOwner', (done) => {
		request.post(api('groups.addOwner'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.setDescription', (done) => {
		request.post(api('groups.setDescription'))
			.set(credentials)
			.send({
				roomId: group._id,
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

	it('/groups.setTopic', (done) => {
		request.post(api('groups.setTopic'))
			.set(credentials)
			.send({
				roomId: group._id,
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

	it('/groups.setPurpose', (done) => {
		request.post(api('groups.setPurpose'))
			.set(credentials)
			.send({
				roomId: group._id,
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

	it('/groups.history', (done) => {
		request.get(api('groups.history'))
			.set(credentials)
			.query({
				roomId: group._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('messages');
			})
			.end(done);
	});

	it('/groups.archive', (done) => {
		request.post(api('groups.archive'))
			.set(credentials)
			.send({
				roomId: group._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.unarchive', (done) => {
		request.post(api('groups.unarchive'))
			.set(credentials)
			.send({
				roomId: group._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.close', (done) => {
		request.post(api('groups.close'))
			.set(credentials)
			.send({
				roomId: group._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.close', (done) => {
		request.post(api('groups.close'))
			.set(credentials)
			.send({
				roomName: apiPrivateChannelName
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error', `The private group, ${ apiPrivateChannelName }, is already closed to the sender`);
			})
			.end(done);
	});

	it('/groups.open', (done) => {
		request.post(api('groups.open'))
			.set(credentials)
			.send({
				roomId: group._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.list', (done) => {
		request.get(api('groups.list'))
			.set(credentials)
			.query({
				roomId: group._id
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

	it('/groups.couters', (done) => {
		request.get(api('groups.couters'))
			.set(credentials)
			.query({
				roomId: group._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('joined', true);
				expect(res.body).to.have.property('members');
				expect(res.body).to.have.property('unreads');
				expect(res.body).to.have.property('unreadsFrom');
				expect(res.body).to.have.property('msgs');
				expect(res.body).to.have.property('latest');
				expect(res.body).to.have.property('userMentions');
			})
			.end(done);
	});

	it('/groups.rename', async(done) => {
		const roomInfo = await getRoomInfo(group._id);

		request.post(api('groups.rename'))
			.set(credentials)
			.send({
				roomId: group._id,
				name: `EDITED${ apiPrivateChannelName }`
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', `EDITED${ apiPrivateChannelName }`);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', roomInfo.group.msgs + 1);
			})
			.end(done);
	});

	it('/groups.getIntegrations', (done) => {
		request.get(api('groups.getIntegrations'))
			.set(credentials)
			.query({
				roomId: group._id
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

	it('/groups.setReadOnly', (done) => {
		request.post(api('groups.setReadOnly'))
			.set(credentials)
			.send({
				roomId: group._id,
				readOnly: true
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it.skip('/groups.leave', (done) => {
		request.post(api('groups.leave'))
			.set(credentials)
			.send({
				roomId: group._id
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.setType', (done) => {
		request.post(api('groups.setType'))
			.set(credentials)
			.send({
				roomId: group._id,
				type: 'c'
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	describe('/groups.delete', () => {
		let testGroup;
		it('/groups.create', (done) => {
			request.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `group.test.${ Date.now() }`
				})
				.end((err, res) => {
					testGroup = res.body.group;
					done();
				});
		});
		it('/groups.delete', (done) => {
			request.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: testGroup.name
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('/groups.info', (done) => {
			request.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id
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

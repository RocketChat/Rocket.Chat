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

describe('groups', function() {
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

	describe('/groups.setCustomFields:', () => {
		let cfchannel;
		it('create group with customFields', (done) => {
			const customFields = {'field0':'value0'};
			request.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${ Date.now() }`,
					customFields
				})
				.end((err, res) => {
					cfchannel = res.body.group;
					done();
				});
		});
		it('get customFields using groups.info', (done) => {
			request.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: cfchannel._id
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group.customFields.field0', 'value0');
				})
				.end(done);
		});
		it('change customFields', async(done) => {
			const customFields = {'field9':'value9'};
			request.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomId: cfchannel._id,
					customFields
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', cfchannel.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.customFields.field9', 'value9');
					expect(res.body).to.have.not.nested.property('group.customFields.field0', 'value0');
				})
				.end(done);
		});
		it('get customFields using groups.info', (done) => {
			request.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: cfchannel._id
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group.customFields.field9', 'value9');
				})
				.end(done);
		});
		it('delete group with customFields', (done) => {
			request.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: cfchannel.name
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('create group without customFields', (done) => {
			request.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${ Date.now() }`
				})
				.end((err, res) => {
					cfchannel = res.body.group;
					done();
				});
		});
		it('set customFields with one nested field', async(done) => {
			const customFields = {'field1':'value1'};
			request.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomId: cfchannel._id,
					customFields
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', cfchannel.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.customFields.field1', 'value1');
				})
				.end(done);
		});
		it('set customFields with multiple nested fields', async(done) => {
			const customFields = {'field2':'value2', 'field3':'value3', 'field4':'value4'};

			request.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
					customFields
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', cfchannel.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.customFields.field2', 'value2');
					expect(res.body).to.have.nested.property('group.customFields.field3', 'value3');
					expect(res.body).to.have.nested.property('group.customFields.field4', 'value4');
					expect(res.body).to.have.not.nested.property('group.customFields.field1', 'value1');
				})
				.end(done);
		});
		it('set customFields to empty object', async(done) => {
			const customFields = {};

			request.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
					customFields
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', cfchannel.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.not.nested.property('group.customFields.field2', 'value2');
					expect(res.body).to.have.not.nested.property('group.customFields.field3', 'value3');
					expect(res.body).to.have.not.nested.property('group.customFields.field4', 'value4');
				})
				.end(done);
		});
		it('set customFields as a string -> should return 400', async(done) => {
			const customFields = '';

			request.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
					customFields
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('delete group with empty customFields', (done) => {
			request.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: cfchannel.name
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
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

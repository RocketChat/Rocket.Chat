import {
	getCredentials,
	api,
	request,
	credentials,
	apiPublicChannelName,
	channel,
} from '../../data/api-data.js';
import { adminUsername } from '../../data/user.js';

function getRoomInfo(roomId) {
	return new Promise((resolve/* , reject*/) => {
		request.get(api('channels.info'))
			.set(credentials)
			.query({
				roomId,
			})
			.end((err, req) => {
				resolve(req.body);
			});
	});
}

describe('[Channels]', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	before('Creating channel', (done) => {
		request.post(api('channels.create'))
			.set(credentials)
			.send({
				name: apiPublicChannelName,
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

	describe('[/channels.info]', () => {
		let testChannel = {};
		let channelMessage = {};
		it('creating new channel...', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: apiPublicChannelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testChannel = res.body.channel;
				})
				.end(done);
		});
		it('should return channel basic structure', (done) => {
			request.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
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
		it('sending a message...', (done) => {
			request.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid: testChannel._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					channelMessage = res.body.message;
				})
				.end(done);
		});
		it('REACTing with last message', (done) => {
			request.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: channelMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('STARring last message', (done) => {
			request.post(api('chat.starMessage'))
				.set(credentials)
				.send({
					messageId: channelMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('PINning last message', (done) => {
			request.post(api('chat.pinMessage'))
				.set(credentials)
				.send({
					messageId: channelMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return channel structure with "lastMessage" object including pin, reaction and star(should be an array) infos', (done) => {
			request.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('channel').and.to.be.an('object');
					const { channel } = res.body;
					expect(channel).to.have.property('lastMessage').and.to.be.an('object');
					expect(channel.lastMessage).to.have.property('reactions').and.to.be.an('object');
					expect(channel.lastMessage).to.have.property('pinned').and.to.be.a('boolean');
					expect(channel.lastMessage).to.have.property('pinnedAt').and.to.be.a('string');
					expect(channel.lastMessage).to.have.property('pinnedBy').and.to.be.an('object');
					expect(channel.lastMessage).to.have.property('starred').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return all channels messages where the last message of array should have the "star" array with USERS star ONLY', (done) => {
			request.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					const { messages } = res.body;
					const lastMessage = messages.filter((message) => message._id === channelMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred[0]._id).to.be.equal(adminUsername);
				})
				.end(done);
		});
	});

	it('/channels.invite', async (done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.invite'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat',
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
				userId: 'rocket.cat',
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
				userId: 'rocket.cat',
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
				userId: 'rocket.cat',
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
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/channels.kick', async (done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.kick'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat',
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

	it('/channels.invite', async (done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.invite'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat',
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
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	describe('/channels.setDescription', () => {
		it('should set the description of the channel with a string', (done) => {
			request.post(api('channels.setDescription'))
				.set(credentials)
				.send({
					roomId: channel._id,
					description: 'this is a description for a channel for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('description', 'this is a description for a channel for api tests');
				})
				.end(done);
		});
		it('should set the description of the channel with an empty string(remove the description)', (done) => {
			request.post(api('channels.setDescription'))
				.set(credentials)
				.send({
					roomId: channel._id,
					description: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('description', '');
				})
				.end(done);
		});
	});

	describe('/channels.setTopic', () => {
		it('should set the topic of the channel with a string', (done) => {
			request.post(api('channels.setTopic'))
				.set(credentials)
				.send({
					roomId: channel._id,
					topic: 'this is a topic of a channel for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('topic', 'this is a topic of a channel for api tests');
				})
				.end(done);
		});
		it('should set the topic of the channel with an empty string(remove the topic)', (done) => {
			request.post(api('channels.setTopic'))
				.set(credentials)
				.send({
					roomId: channel._id,
					topic: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('topic', '');
				})
				.end(done);
		});
	});

	describe('/channels.setAnnouncement', () => {
		it('should set the announcement of the channel with a string', (done) => {
			request.post(api('channels.setAnnouncement'))
				.set(credentials)
				.send({
					roomId: channel._id,
					announcement: 'this is an announcement of a channel for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('announcement', 'this is an announcement of a channel for api tests');
				})
				.end(done);
		});
		it('should set the announcement of the channel with an empty string(remove the announcement)', (done) => {
			request.post(api('channels.setAnnouncement'))
				.set(credentials)
				.send({
					roomId: channel._id,
					announcement: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('announcement', '');
				})
				.end(done);
		});
	});

	describe('/channels.setPurpose', () => {
		it('should set the purpose of the channel with a string', (done) => {
			request.post(api('channels.setPurpose'))
				.set(credentials)
				.send({
					roomId: channel._id,
					purpose: 'this is a purpose of a channel for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('purpose', 'this is a purpose of a channel for api tests');
				})
				.end(done);
		});
		it('should set the announcement of channel with an empty string(remove the purpose)', (done) => {
			request.post(api('channels.setPurpose'))
				.set(credentials)
				.send({
					roomId: channel._id,
					purpose: '',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('purpose', '');
				})
				.end(done);
		});
	});

	it('/channels.history', (done) => {
		request.get(api('channels.history'))
			.set(credentials)
			.query({
				roomId: channel._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('messages');
			})
			.end(done);
	});

	it('/channels.archive', (done) => {
		request.post(api('channels.archive'))
			.set(credentials)
			.send({
				roomId: channel._id,
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
				roomId: channel._id,
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
				roomId: channel._id,
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
				roomName: apiPublicChannelName,
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
				roomId: channel._id,
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
				roomId: channel._id,
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
				roomId: channel._id,
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
	it('/channels.counters', (done) => {
		request.get(api('channels.counters'))
			.set(credentials)
			.query({
				roomId: channel._id,
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
	it('/channels.members', (done) => {
		request.get(api('channels.members'))
			.set(credentials)
			.query({
				roomId: channel._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('members').and.to.be.an('array');
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
				expect(res.body).to.have.property('offset');
			})
			.end(done);
	});

	it('/channels.rename', async (done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.rename'))
			.set(credentials)
			.send({
				roomId: channel._id,
				name: `EDITED${ apiPublicChannelName }`,
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
				roomId: channel._id,
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
				roomId: channel._id,
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

	it('/channels.addLeader', (done) => {
		request.post(api('channels.addLeader'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
			})
			.end(done);
	});
	it('/channels.removeLeader', (done) => {
		request.post(api('channels.removeLeader'))
			.set(credentials)
			.send({
				roomId: channel._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});


	describe('/channels.setCustomFields:', () => {
		let cfchannel;
		it('create channel with customFields', (done) => {
			const customFields = { field0: 'value0' };
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${ Date.now() }`,
					customFields,
				})
				.end((err, res) => {
					cfchannel = res.body.channel;
					done();
				});
		});
		it('get customFields using channels.info', (done) => {
			request.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: cfchannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel.customFields.field0', 'value0');
				})
				.end(done);
		});
		it('change customFields', async (done) => {
			const customFields = { field9: 'value9' };
			request.post(api('channels.setCustomFields'))
				.set(credentials)
				.send({
					roomId: cfchannel._id,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', cfchannel.name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.customFields.field9', 'value9');
					expect(res.body).to.have.not.nested.property('channel.customFields.field0', 'value0');
				})
				.end(done);
		});
		it('get customFields using channels.info', (done) => {
			request.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: cfchannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel.customFields.field9', 'value9');
				})
				.end(done);
		});
		it('delete channels with customFields', (done) => {
			request.post(api('channels.delete'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('create channel without customFields', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${ Date.now() }`,
				})
				.end((err, res) => {
					cfchannel = res.body.channel;
					done();
				});
		});
		it('set customFields with one nested field', async (done) => {
			const customFields = { field1: 'value1' };
			request.post(api('channels.setCustomFields'))
				.set(credentials)
				.send({
					roomId: cfchannel._id,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', cfchannel.name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.customFields.field1', 'value1');
				})
				.end(done);
		});
		it('set customFields with multiple nested fields', async (done) => {
			const customFields = { field2: 'value2', field3: 'value3', field4: 'value4' };

			request.post(api('channels.setCustomFields'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', cfchannel.name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.customFields.field2', 'value2');
					expect(res.body).to.have.nested.property('channel.customFields.field3', 'value3');
					expect(res.body).to.have.nested.property('channel.customFields.field4', 'value4');
					expect(res.body).to.have.not.nested.property('channel.customFields.field1', 'value1');
				})
				.end(done);
		});
		it('set customFields to empty object', async (done) => {
			const customFields = {};

			request.post(api('channels.setCustomFields'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', cfchannel.name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.not.nested.property('channel.customFields.field2', 'value2');
					expect(res.body).to.have.not.nested.property('channel.customFields.field3', 'value3');
					expect(res.body).to.have.not.nested.property('channel.customFields.field4', 'value4');
				})
				.end(done);
		});
		it('set customFields as a string -> should return 400', async (done) => {
			const customFields = '';

			request.post(api('channels.setCustomFields'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('delete channel with empty customFields', (done) => {
			request.post(api('channels.delete'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	it('/channels.setJoinCode', async (done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.setJoinCode'))
			.set(credentials)
			.send({
				roomId: channel._id,
				joinCode: '123',
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

	it('/channels.setReadOnly', async (done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.setReadOnly'))
			.set(credentials)
			.send({
				roomId: channel._id,
				readOnly: true,
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

	it('/channels.setDefault', async (done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.setDefault'))
			.set(credentials)
			.send({
				roomId: channel._id,
				default: true,
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

	it('/channels.leave', async (done) => {
		const roomInfo = await getRoomInfo(channel._id);

		request.post(api('channels.leave'))
			.set(credentials)
			.send({
				roomId: channel._id,
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

	describe('/channels.setType', () => {
		it('should change the type public channel to private', async (done) => {
			const roomInfo = await getRoomInfo(channel._id);

			request.post(api('channels.setType'))
				.set(credentials)
				.send({
					roomId: channel._id,
					type: 'p',
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
	});

	describe('/channels.delete:', () => {
		let testChannel;
		it('/channels.create', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.test.${ Date.now() }`,
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
					roomName: testChannel.name,
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
					roomId: testChannel._id,
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

	describe('/channels.getAllUserMentionsByChannel', () => {
		it('should return and array of mentions by channel', (done) => {
			request.get(api('channels.getAllUserMentionsByChannel'))
				.set(credentials)
				.query({
					roomId: channel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('mentions').and.to.be.an('array');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
				})
				.end(done);
		});
	});

	describe('/channels.roles', () => {
		let testChannel;
		it('/channels.create', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.roles.test.${ Date.now() }`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('/channels.invite', async (done) => {
			request.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addModerator', (done) => {
			request.post(api('channels.addModerator'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addLeader', (done) => {
			request.post(api('channels.addLeader'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of role <-> user relationships in a channel', (done) => {
			request.get(api('channels.roles'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('roles').that.is.an('array').that.has.lengthOf(2);

					expect(res.body.roles[0]).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[0]).to.have.a.property('rid').that.is.equal(testChannel._id);
					expect(res.body.roles[0]).to.have.a.property('roles').that.is.an('array').that.includes('moderator', 'leader');
					expect(res.body.roles[0]).to.have.a.property('u').that.is.an('object');
					expect(res.body.roles[0].u).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[0].u).to.have.a.property('username').that.is.a('string');

					expect(res.body.roles[1]).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[1]).to.have.a.property('rid').that.is.equal(testChannel._id);
					expect(res.body.roles[1]).to.have.a.property('roles').that.is.an('array').that.includes('owner');
					expect(res.body.roles[1]).to.have.a.property('u').that.is.an('object');
					expect(res.body.roles[1].u).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[1].u).to.have.a.property('username').that.is.a('string');
				})
				.end(done);
		});
	});

	describe('/channels.moderators', () => {
		let testChannel;
		it('/channels.create', (done) => {
			request.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.roles.test.${ Date.now() }`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('/channels.invite', async (done) => {
			request.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addModerator', (done) => {
			request.post(api('channels.addModerator'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of moderators with rocket.cat as a moderator', (done) => {
			request.get(api('channels.moderators'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('moderators').that.is.an('array').that.has.lengthOf(1);
					expect(res.body.moderators[0].username).to.be.equal('rocket.cat');
				})
				.end(done);
		});
	});
});

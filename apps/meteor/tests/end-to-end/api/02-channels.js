import { expect } from 'chai';

import { getCredentials, api, request, credentials, apiPublicChannelName, channel, reservedWords } from '../../data/api-data.js';
import { adminUsername, password } from '../../data/user.js';
import { createUser, login } from '../../data/users.helper';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom } from '../../data/rooms.helper';
import { createVisitor } from '../../data/livechat/rooms';
import { createIntegration, removeIntegration } from '../../data/integration.helper';

function getRoomInfo(roomId) {
	return new Promise((resolve /* , reject*/) => {
		request
			.get(api('channels.info'))
			.set(credentials)
			.query({
				roomId,
			})
			.end((err, req) => {
				resolve(req.body);
			});
	});
}

describe('[Channels]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before('Creating channel', (done) => {
		request
			.post(api('channels.create'))
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
			request
				.post(api('channels.create'))
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
			request
				.get(api('channels.info'))
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
			request
				.post(api('chat.sendMessage'))
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
			request
				.post(api('chat.react'))
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
			request
				.post(api('chat.starMessage'))
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
			request
				.post(api('chat.pinMessage'))
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
			request
				.get(api('channels.info'))
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
			request
				.get(api('channels.messages'))
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
		it('should return all channels messages where the last message of array should have the "star" array with USERS star ONLY even requested with count and offset params', (done) => {
			request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					count: 5,
					offset: 0,
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

	describe('[/channels.online]', () => {
		const createUserAndChannel = async () => {
			const testUser = await createUser();
			const testUserCredentials = await login(testUser.username, password);

			await request.post(api('users.setStatus')).set(testUserCredentials).send({
				message: '',
				status: 'online',
			});

			const roomName = `group-test-${Date.now()}`;

			const roomResponse = await createRoom({
				name: roomName,
				type: 'c',
				members: [testUser.username],
			});

			return {
				testUser,
				testUserCredentials,
				room: roomResponse.body.channel,
			};
		};

		it('should return an error if no query', () =>
			request
				.get(api('channels.online'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Invalid query');
				}));

		it('should return an error if passing an empty query', () =>
			request
				.get(api('channels.online'))
				.set(credentials)
				.query('query={}')
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Invalid query');
				}));

		it('should return an array with online members', async () => {
			const { testUser, testUserCredentials, room } = await createUserAndChannel();

			return request
				.get(api('channels.online'))
				.set(testUserCredentials)
				.query(`query={"_id": "${room._id}"}`)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('online');

					const expected = {
						_id: testUser._id,
						username: testUser.username,
					};
					expect(res.body.online).to.deep.include(expected);
				});
		});

		it('should return an empty array if requesting user is not in channel', async () => {
			const outsider = await createUser();
			const outsiderCredentials = await login(outsider.username, password);

			const { testUser, room } = await createUserAndChannel();

			return request
				.get(api('channels.online'))
				.set(outsiderCredentials)
				.query(`query={"_id": "${room._id}"}`)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('online');

					const expected = {
						_id: testUser._id,
						username: testUser.username,
					};
					expect(res.body.online).to.deep.include(expected);
				});
		});
	});

	describe('[/channels.files]', () => {
		before(() => updateSetting('VoIP_Enabled', true));
		const createVoipRoom = async () => {
			const testUser = await createUser({ roles: ['user', 'livechat-agent'] });
			const testUserCredentials = await login(testUser.username, password);
			const visitor = await createVisitor();
			const roomResponse = await createRoom({
				token: visitor.token,
				type: 'v',
				agentId: testUser._id,
				credentials: testUserCredentials,
			});
			return roomResponse.body.room;
		};
		it('should fail if invalid channel', (done) => {
			request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomId: 'invalid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-room-not-found');
				})
				.end(done);
		});

		it('should fail for room type v', async () => {
			const { _id } = await createVoipRoom();
			request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomId: _id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-room-not-found');
				});
		});

		it('should succeed when searching by roomId', (done) => {
			request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array');
				})
				.end(done);
		});

		it('should succeed when searching by roomId even requested with count and offset params', (done) => {
			request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array');
				})
				.end(done);
		});

		it('should succeed when searching by roomName', (done) => {
			request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomName: 'general',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array');
				})
				.end(done);
		});

		it('should succeed when searching by roomName even requested with count and offset params', (done) => {
			request
				.get(api('channels.files'))
				.set(credentials)
				.query({
					roomName: 'general',
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('files').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('[/channels.join]', () => {
		let testChannelNoCode;
		let testChannelWithCode;
		let testUser;
		let testUserCredentials;
		before('Create test user', (done) => {
			const username = `user.test.${Date.now()}`;
			const email = `${username}@rocket.chat`;
			request
				.post(api('users.create'))
				.set(credentials)
				.send({ email, name: username, username, password })
				.end((err, res) => {
					testUser = res.body.user;
					done();
				});
		});
		before('Login as test user', (done) => {
			request
				.post(api('login'))
				.send({
					user: testUser.username,
					password,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testUserCredentials = {};
					testUserCredentials['X-Auth-Token'] = res.body.data.authToken;
					testUserCredentials['X-User-Id'] = res.body.data.userId;
				})
				.end(done);
		});
		before('Create no code channel', (done) => {
			request
				.post(api('channels.create'))
				.set(testUserCredentials)
				.send({
					name: `${apiPublicChannelName}-nojoincode`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testChannelNoCode = res.body.channel;
				})
				.end(done);
		});
		before('Create code channel', (done) => {
			request
				.post(api('channels.create'))
				.set(testUserCredentials)
				.send({
					name: `${apiPublicChannelName}-withjoincode`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testChannelWithCode = res.body.channel;
				})
				.end(done);
		});
		before('Set code for channel', (done) => {
			request
				.post(api('channels.setJoinCode'))
				.set(testUserCredentials)
				.send({
					roomId: testChannelWithCode._id,
					joinCode: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should fail if invalid channel', (done) => {
			request
				.post(api('channels.join'))
				.set(credentials)
				.send({
					roomId: 'invalid',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-room-not-found');
				})
				.end(done);
		});

		it('should succeed when joining code-free channel without join code', (done) => {
			request
				.post(api('channels.join'))
				.set(credentials)
				.send({
					roomId: testChannelNoCode._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id', testChannelNoCode._id);
				})
				.end(done);
		});

		it('should fail when joining code-needed channel without join code and no join-without-join-code permission', (done) => {
			updatePermission('join-without-join-code', []).then(() => {
				request
					.post(api('channels.join'))
					.set(credentials)
					.send({
						roomId: testChannelWithCode._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.nested.property('errorType', 'error-code-invalid');
					})
					.end(done);
			});
		});

		it('should succeed when joining code-needed channel without join code and with join-without-join-code permission', (done) => {
			updatePermission('join-without-join-code', ['admin']).then(() => {
				request
					.post(api('channels.join'))
					.set(credentials)
					.send({
						roomId: testChannelWithCode._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('channel._id', testChannelWithCode._id);
					})
					.end(done);
			});
		});

		it('leave channel', (done) => {
			request
				.post(api('channels.leave'))
				.set(credentials)
				.send({
					roomId: testChannelWithCode._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});

		it('should succeed when joining code-needed channel with join code', (done) => {
			request
				.post(api('channels.join'))
				.set(credentials)
				.send({
					roomId: testChannelWithCode._id,
					joinCode: '123',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id', testChannelWithCode._id);
				})
				.end(done);
		});
	});

	it('/channels.invite', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		return request
			.post(api('channels.invite'))
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
			});
	});

	it('/channels.addModerator', (done) => {
		request
			.post(api('channels.addModerator'))
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
		request
			.post(api('channels.removeModerator'))
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
		request
			.post(api('channels.addOwner'))
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
		request
			.post(api('channels.removeOwner'))
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

	it('/channels.kick', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		return request
			.post(api('channels.kick'))
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
			});
	});

	it('/channels.invite', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		return request
			.post(api('channels.invite'))
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
			});
	});

	it('/channels.addOwner', (done) => {
		request
			.post(api('channels.addOwner'))
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
			request
				.post(api('channels.setDescription'))
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
			request
				.post(api('channels.setDescription'))
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
			request
				.post(api('channels.setTopic'))
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
			request
				.post(api('channels.setTopic'))
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
			request
				.post(api('channels.setAnnouncement'))
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
			request
				.post(api('channels.setAnnouncement'))
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
			request
				.post(api('channels.setPurpose'))
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
			request
				.post(api('channels.setPurpose'))
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

	describe('/channels.history', () => {
		it('should return an array of members by channel', (done) => {
			request
				.get(api('channels.history'))
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

		it('should return an array of members by channel even requested with count and offset params', (done) => {
			request
				.get(api('channels.history'))
				.set(credentials)
				.query({
					roomId: channel._id,
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});
	});

	it('/channels.archive', (done) => {
		request
			.post(api('channels.archive'))
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
		request
			.post(api('channels.unarchive'))
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
		request
			.post(api('channels.close'))
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
		request
			.post(api('channels.close'))
			.set(credentials)
			.send({
				roomName: apiPublicChannelName,
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error', `The channel, ${apiPublicChannelName}, is already closed to the sender`);
			})
			.end(done);
	});

	it('/channels.open', (done) => {
		request
			.post(api('channels.open'))
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
		request
			.get(api('channels.list'))
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
		request
			.get(api('channels.list.joined'))
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
		request
			.get(api('channels.counters'))
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

	describe('/channels.members', () => {
		it('should return an array of members by channel', (done) => {
			request
				.get(api('channels.members'))
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

		it('should return an array of members by channel even requested with count and offset params', (done) => {
			request
				.get(api('channels.members'))
				.set(credentials)
				.query({
					roomId: channel._id,
					count: 5,
					offset: 0,
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

		it('should return an filtered array of members by channel', (done) => {
			request
				.get(api('channels.members'))
				.set(credentials)
				.query({
					roomId: channel._id,
					filter: 'rocket.cat',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('members').and.to.be.an('array');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
				})
				.end(done);
		});
	});

	it('/channels.rename', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		function failRenameChannel(name) {
			it(`should not rename a channel to the reserved name ${name}`, (done) => {
				request
					.post(api('channels.rename'))
					.set(credentials)
					.send({
						roomId: channel._id,
						name,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', `${name} is already in use :( [error-field-unavailable]`);
					})
					.end(done);
			});
		}

		reservedWords.forEach((name) => {
			failRenameChannel(name);
		});

		return request
			.post(api('channels.rename'))
			.set(credentials)
			.send({
				roomId: channel._id,
				name: `EDITED${apiPublicChannelName}`,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${apiPublicChannelName}`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			});
	});

	describe('/channels.getIntegrations', () => {
		let integrationCreatedByAnUser;
		let userCredentials;
		let createdChannel;
		before((done) => {
			createRoom({ name: `test-integration-channel-${Date.now()}`, type: 'c' }).end((err, res) => {
				createdChannel = res.body.channel;
				createUser().then((createdUser) => {
					const user = createdUser;
					login(user.username, password).then((credentials) => {
						userCredentials = credentials;
						updatePermission('manage-incoming-integrations', ['user']).then(() => {
							updatePermission('manage-own-incoming-integrations', ['user']).then(() => {
								createIntegration(
									{
										type: 'webhook-incoming',
										name: 'Incoming test',
										enabled: true,
										alias: 'test',
										username: 'rocket.cat',
										scriptEnabled: false,
										channel: `#${createdChannel.name}`,
									},
									userCredentials,
								).then((integration) => {
									integrationCreatedByAnUser = integration;
									done();
								});
							});
						});
					});
				});
			});
		});

		after((done) => {
			removeIntegration(integrationCreatedByAnUser._id, 'incoming').then(done);
		});

		it('should return the list of integrations of created channel and it should contain the integration created by user when the admin DOES have the permission', (done) => {
			updatePermission('manage-incoming-integrations', ['admin']).then(() => {
				request
					.get(api('channels.getIntegrations'))
					.set(credentials)
					.query({
						roomId: createdChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						const integrationCreated = res.body.integrations.find(
							(createdIntegration) => createdIntegration._id === integrationCreatedByAnUser._id,
						);
						expect(integrationCreated).to.be.an('object');
						expect(integrationCreated._id).to.be.equal(integrationCreatedByAnUser._id);
						expect(res.body).to.have.property('offset');
						expect(res.body).to.have.property('total');
					})
					.end(done);
			});
		});

		it('should return the list of integrations created by the user only', (done) => {
			updatePermission('manage-own-incoming-integrations', ['admin']).then(() => {
				updatePermission('manage-incoming-integrations', []).then(() => {
					request
						.get(api('channels.getIntegrations'))
						.set(credentials)
						.query({
							roomId: createdChannel._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							const integrationCreated = res.body.integrations.find(
								(createdIntegration) => createdIntegration._id === integrationCreatedByAnUser._id,
							);
							expect(integrationCreated).to.be.equal(undefined);
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('total');
						})
						.end(done);
				});
			});
		});

		it('should return unauthorized error when the user does not have any integrations permissions', (done) => {
			updatePermission('manage-incoming-integrations', []).then(() => {
				updatePermission('manage-own-incoming-integrations', []).then(() => {
					updatePermission('manage-outgoing-integrations', []).then(() => {
						updatePermission('manage-own-outgoing-integrations', []).then(() => {
							request
								.get(api('channels.getIntegrations'))
								.set(credentials)
								.query({
									roomId: createdChannel._id,
								})
								.expect('Content-Type', 'application/json')
								.expect(403)
								.expect((res) => {
									expect(res.body).to.have.property('success', false);
									expect(res.body).to.have.property('error', 'unauthorized');
								})
								.end(done);
						});
					});
				});
			});
		});
	});

	it('/channels.addAll', (done) => {
		request
			.post(api('channels.addAll'))
			.set(credentials)
			.send({
				roomId: channel._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${apiPublicChannelName}`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
			})
			.end(done);
	});

	it('/channels.addLeader', (done) => {
		request
			.post(api('channels.addLeader'))
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
		request
			.post(api('channels.removeLeader'))
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
			request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${Date.now()}`,
					customFields,
				})
				.end((err, res) => {
					cfchannel = res.body.channel;
					done();
				});
		});
		it('get customFields using channels.info', (done) => {
			request
				.get(api('channels.info'))
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
		it('change customFields', async () => {
			const customFields = { field9: 'value9' };
			return request
				.post(api('channels.setCustomFields'))
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
				});
		});
		it('get customFields using channels.info', (done) => {
			request
				.get(api('channels.info'))
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
			request
				.post(api('channels.delete'))
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
			request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${Date.now()}`,
				})
				.end((err, res) => {
					cfchannel = res.body.channel;
					done();
				});
		});
		it('set customFields with one nested field', async () => {
			const customFields = { field1: 'value1' };
			return request
				.post(api('channels.setCustomFields'))
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
				});
		});
		it('set customFields with multiple nested fields', async () => {
			const customFields = { field2: 'value2', field3: 'value3', field4: 'value4' };

			return request
				.post(api('channels.setCustomFields'))
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
				});
		});
		it('set customFields to empty object', (done) => {
			const customFields = {};

			request
				.post(api('channels.setCustomFields'))
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
		it('set customFields as a string -> should return 400', (done) => {
			const customFields = '';

			request
				.post(api('channels.setCustomFields'))
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
			request
				.post(api('channels.delete'))
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

	it('/channels.setJoinCode', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		return request
			.post(api('channels.setJoinCode'))
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
				expect(res.body).to.have.nested.property('channel.name', `EDITED${apiPublicChannelName}`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs);
			});
	});

	it('/channels.setReadOnly', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		return request
			.post(api('channels.setReadOnly'))
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
				expect(res.body).to.have.nested.property('channel.name', `EDITED${apiPublicChannelName}`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			});
	});

	it('/channels.setDefault', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		return request
			.post(api('channels.setDefault'))
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
				expect(res.body).to.have.nested.property('channel.name', `EDITED${apiPublicChannelName}`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs);
			});
	});

	it('/channels.leave', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		return request
			.post(api('channels.leave'))
			.set(credentials)
			.send({
				roomId: channel._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('channel._id');
				expect(res.body).to.have.nested.property('channel.name', `EDITED${apiPublicChannelName}`);
				expect(res.body).to.have.nested.property('channel.t', 'c');
				expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
			});
	});

	describe('/channels.setType', () => {
		it('should change the type public channel to private', async () => {
			const roomInfo = await getRoomInfo(channel._id);

			request
				.post(api('channels.setType'))
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
					expect(res.body).to.have.nested.property('channel.name', `EDITED${apiPublicChannelName}`);
					expect(res.body).to.have.nested.property('channel.t', 'p');
					expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
				});
		});
	});

	describe('/channels.delete:', () => {
		let testChannel;
		it('/channels.create', (done) => {
			request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.test.${Date.now()}`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('/channels.delete', (done) => {
			request
				.post(api('channels.delete'))
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
			request
				.get(api('channels.info'))
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
		it('should return an array of mentions by channel', (done) => {
			request
				.get(api('channels.getAllUserMentionsByChannel'))
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
		it('should return an array of mentions by channel even requested with count and offset params', (done) => {
			request
				.get(api('channels.getAllUserMentionsByChannel'))
				.set(credentials)
				.query({
					roomId: channel._id,
					count: 5,
					offset: 0,
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
			request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.roles.test.${Date.now()}`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('/channels.invite', (done) => {
			request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addModerator', (done) => {
			request
				.post(api('channels.addModerator'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addLeader', (done) => {
			request
				.post(api('channels.addLeader'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of role <-> user relationships in a channel', (done) => {
			request
				.get(api('channels.roles'))
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
			request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.roles.test.${Date.now()}`,
				})
				.end((err, res) => {
					testChannel = res.body.channel;
					done();
				});
		});
		it('/channels.invite', (done) => {
			request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addModerator', (done) => {
			request
				.post(api('channels.addModerator'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of moderators with rocket.cat as a moderator', (done) => {
			request
				.get(api('channels.moderators'))
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
	describe('/channels.anonymousread', () => {
		after(() => updateSetting('Accounts_AllowAnonymousRead', false));
		it('should return an error when the setting "Accounts_AllowAnonymousRead" is disabled', (done) => {
			updateSetting('Accounts_AllowAnonymousRead', false).then(() => {
				request
					.get(api('channels.anonymousread'))
					.query({
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body).to.have.a.property('error');
						expect(res.body).to.have.a.property('errorType');
						expect(res.body.errorType).to.be.equal('error-not-allowed');
						expect(res.body.error).to.be.equal('Enable "Allow Anonymous Read" [error-not-allowed]');
					})
					.end(done);
			});
		});
		it('should return the messages list when the setting "Accounts_AllowAnonymousRead" is enabled', (done) => {
			updateSetting('Accounts_AllowAnonymousRead', true).then(() => {
				request
					.get(api('channels.anonymousread'))
					.query({
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('messages').that.is.an('array');
					})
					.end(done);
			});
		});
		it('should return the messages list when the setting "Accounts_AllowAnonymousRead" is enabled even requested with count and offset params', (done) => {
			updateSetting('Accounts_AllowAnonymousRead', true).then(() => {
				request
					.get(api('channels.anonymousread'))
					.query({
						roomId: 'GENERAL',
						count: 5,
						offset: 0,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', true);
						expect(res.body).to.have.a.property('messages').that.is.an('array');
					})
					.end(done);
			});
		});
	});

	describe('/channels.convertToTeam', () => {
		before((done) => {
			request
				.post(api('channels.create'))
				.set(credentials)
				.send({ name: `channel-${Date.now()}` })
				.then((response) => {
					this.newChannel = response.body.channel;
				})
				.then(() => done());
		});

		it('should fail to convert channel if lacking edit-room permission', (done) => {
			updatePermission('create-team', []).then(() => {
				updatePermission('edit-room', ['admin']).then(() => {
					request
						.post(api('channels.convertToTeam'))
						.set(credentials)
						.send({ channelId: this.newChannel._id })
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should fail to convert channel if lacking create-team permission', (done) => {
			updatePermission('create-team', ['admin']).then(() => {
				updatePermission('edit-room', []).then(() => {
					request
						.post(api('channels.convertToTeam'))
						.set(credentials)
						.send({ channelId: this.newChannel._id })
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should successfully convert a channel to a team', (done) => {
			updatePermission('create-team', ['admin']).then(() => {
				updatePermission('edit-room', ['admin']).then(() => {
					request
						.post(api('channels.convertToTeam'))
						.set(credentials)
						.send({ channelId: this.newChannel._id })
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
						})
						.end(done);
				});
			});
		});

		it('should fail to convert channel without the required parameters', (done) => {
			request.post(api('channels.convertToTeam')).set(credentials).send({}).expect(400).end(done);
		});

		it("should fail to convert channel if it's already taken", (done) => {
			request
				.post(api('channels.convertToTeam'))
				.set(credentials)
				.send({ channelId: this.newChannel._id })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
				})
				.end(done);
		});
	});

	describe.skip('/channels.setAutojoin', () => {
		// let testTeam;
		let testChannel;
		// let testUser1;
		// let testUser2;
		before(async () => {
			const teamCreateRes = await request
				.post(api('teams.create'))
				.set(credentials)
				.send({ name: `team-${Date.now()}` });

			const { team } = teamCreateRes.body;

			const user1 = await createUser();
			const user2 = await createUser();

			const channelCreateRes = await request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `team-channel-${Date.now()}`,
					extraData: {
						teamId: team._id,
					},
				});

			const { channel } = channelCreateRes.body;

			// testTeam = team;
			testChannel = channel;
			// testUser1 = user1;
			// testUser2 = user2;

			await request
				.post(api('teams.addMembers'))
				.set(credentials)
				.send({
					name: team.name,
					members: [{ userId: user1._id }, { userId: user2._id }],
				});
		});

		it('should add all existing team members', async () => {
			const resAutojoin = await request
				.post(api('channels.setAutojoin'))
				.set(credentials)
				.send({ roomName: testChannel.name, autojoin: true })
				.expect(200);
			expect(resAutojoin.body).to.have.a.property('success', true);

			const channelInfoResponse = await request.get(api('channels.info')).set(credentials).query({ roomId: testChannel._id });
			const { channel } = channelInfoResponse.body;

			return expect(channel.usersCount).to.be.equals(3);
		});
	});

	context("Setting: 'Use Real Name': true", () => {
		before(async () => {
			await updateSetting('UI_Use_Real_Name', true);

			await request
				.post(api('channels.join'))
				.set(credentials)
				.send({
					roomId: channel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id', channel._id);
				});

			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid: channel._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
		after(async () => {
			await updateSetting('UI_Use_Real_Name', false);

			await request
				.post(api('channels.leave'))
				.set(credentials)
				.send({
					roomId: channel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id', channel._id);
				});
		});

		it('/channels.list', (done) => {
			request
				.get(api('channels.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('channels').and.to.be.an('array');

					const retChannel = res.body.channels.find(({ _id }) => _id === channel._id);

					expect(retChannel).to.have.nested.property('lastMessage.u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});

		it('/channels.list.joined', (done) => {
			request
				.get(api('channels.list.joined'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('channels').and.to.be.an('array');

					const retChannel = res.body.channels.find(({ _id }) => _id === channel._id);

					expect(retChannel).to.have.nested.property('lastMessage.u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});
	});
});

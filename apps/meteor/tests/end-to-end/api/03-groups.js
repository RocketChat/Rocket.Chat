import { expect } from 'chai';

import { getCredentials, api, request, credentials, group, apiPrivateChannelName } from '../../data/api-data.js';
import { adminUsername, password } from '../../data/user.js';
import { createUser, login } from '../../data/users.helper';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom } from '../../data/rooms.helper';
import { createIntegration, removeIntegration } from '../../data/integration.helper';

function getRoomInfo(roomId) {
	return new Promise((resolve /* , reject*/) => {
		request
			.get(api('groups.info'))
			.set(credentials)
			.query({
				roomId,
			})
			.end((err, req) => {
				resolve(req.body);
			});
	});
}

describe('[Groups]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before('/groups.create', (done) => {
		request
			.post(api('groups.create'))
			.set(credentials)
			.send({
				name: apiPrivateChannelName,
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
	describe('/groups.create (encrypted)', () => {
		it('should create a new encrypted group', async () => {
			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `encrypted-${apiPrivateChannelName}`,
					extraData: {
						encrypted: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group.name', `encrypted-${apiPrivateChannelName}`);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.msgs', 0);
					expect(res.body).to.have.nested.property('group.encrypted', true);
				});
		});

		it('should create the encrypted room by default', async () => {
			await updateSetting('E2E_Enabled_Default_PrivateRooms', true);
			try {
				await request
					.post(api('groups.create'))
					.set(credentials)
					.send({
						name: `default-encrypted-${apiPrivateChannelName}`,
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.nested.property('group.name', `default-encrypted-${apiPrivateChannelName}`);
						expect(res.body).to.have.nested.property('group.t', 'p');
						expect(res.body).to.have.nested.property('group.msgs', 0);
						expect(res.body).to.have.nested.property('group.encrypted', true);
					});
			} finally {
				await updateSetting('E2E_Enabled_Default_PrivateRooms', false);
			}
		});
	});
	describe('[/groups.info]', () => {
		let testGroup = {};
		let groupMessage = {};
		it('creating new group...', (done) => {
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: apiPrivateChannelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testGroup = res.body.group;
				})
				.end(done);
		});
		it('should return group basic structure', (done) => {
			request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
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
		it('sending a message...', (done) => {
			request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid: testGroup._id,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					groupMessage = res.body.message;
				})
				.end(done);
		});
		it('REACTing with last message', (done) => {
			request
				.post(api('chat.react'))
				.set(credentials)
				.send({
					emoji: ':squid:',
					messageId: groupMessage._id,
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
					messageId: groupMessage._id,
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
					messageId: groupMessage._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should return group structure with "lastMessage" object including pin, reaction and star(should be an array) infos', (done) => {
			request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('group').and.to.be.an('object');
					const { group } = res.body;
					expect(group).to.have.property('lastMessage').and.to.be.an('object');
					expect(group.lastMessage).to.have.property('reactions').and.to.be.an('object');
					expect(group.lastMessage).to.have.property('pinned').and.to.be.a('boolean');
					expect(group.lastMessage).to.have.property('pinnedAt').and.to.be.a('string');
					expect(group.lastMessage).to.have.property('pinnedBy').and.to.be.an('object');
					expect(group.lastMessage).to.have.property('starred').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return all groups messages where the last message of array should have the "star" array with USERS star ONLY', (done) => {
			request
				.get(api('groups.messages'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					const { messages } = res.body;
					const lastMessage = messages.filter((message) => message._id === groupMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred[0]._id).to.be.equal(adminUsername);
				})
				.end(done);
		});
		it('should return all groups messages where the last message of array should have the "star" array with USERS star ONLY even requested with count and offset params', (done) => {
			request
				.get(api('groups.messages'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array');
					const { messages } = res.body;
					const lastMessage = messages.filter((message) => message._id === groupMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred[0]._id).to.be.equal(adminUsername);
				})
				.end(done);
		});
	});

	it('/groups.invite', async () => {
		const roomInfo = await getRoomInfo(group._id);
		return request
			.post(api('groups.invite'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', apiPrivateChannelName);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', roomInfo.group.msgs + 1);
			});
	});

	it('/groups.addModerator', (done) => {
		request
			.post(api('groups.addModerator'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.removeModerator', (done) => {
		request
			.post(api('groups.removeModerator'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.addOwner', (done) => {
		request
			.post(api('groups.addOwner'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.removeOwner', (done) => {
		request
			.post(api('groups.removeOwner'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.addLeader', (done) => {
		request
			.post(api('groups.addLeader'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.a.property('success', true);
			})
			.end(done);
	});

	it('/groups.removeLeader', (done) => {
		request
			.post(api('groups.removeLeader'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.kick', (done) => {
		request
			.post(api('groups.kick'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.invite', async () => {
		const roomInfo = await getRoomInfo(group._id);

		return request
			.post(api('groups.invite'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', apiPrivateChannelName);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', roomInfo.group.msgs + 1);
			});
	});

	it('/groups.addOwner', (done) => {
		request
			.post(api('groups.addOwner'))
			.set(credentials)
			.send({
				roomId: group._id,
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	describe('/groups.setDescription', () => {
		it('should set the description of the group with a string', (done) => {
			request
				.post(api('groups.setDescription'))
				.set(credentials)
				.send({
					roomId: group._id,
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
		it('should set the description of the group with an empty string(remove the description)', (done) => {
			request
				.post(api('groups.setDescription'))
				.set(credentials)
				.send({
					roomId: group._id,
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

	describe('/groups.setTopic', () => {
		it('should set the topic of the group with a string', (done) => {
			request
				.post(api('groups.setTopic'))
				.set(credentials)
				.send({
					roomId: group._id,
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
		it('should set the topic of the group with an empty string(remove the topic)', (done) => {
			request
				.post(api('groups.setTopic'))
				.set(credentials)
				.send({
					roomId: group._id,
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

	describe('/groups.setPurpose', () => {
		it('should set the purpose of the group with a string', (done) => {
			request
				.post(api('groups.setPurpose'))
				.set(credentials)
				.send({
					roomId: group._id,
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
		it('should set the purpose of the group with an empty string(remove the purpose)', (done) => {
			request
				.post(api('groups.setPurpose'))
				.set(credentials)
				.send({
					roomId: group._id,
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

	describe('/groups.history', () => {
		it('should return groups history when searching by roomId', (done) => {
			request
				.get(api('groups.history'))
				.set(credentials)
				.query({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages');
				})
				.end(done);
		});
		it('should return groups history when searching by roomId even requested with count and offset params', (done) => {
			request
				.get(api('groups.history'))
				.set(credentials)
				.query({
					roomId: group._id,
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

	it('/groups.archive', (done) => {
		request
			.post(api('groups.archive'))
			.set(credentials)
			.send({
				roomId: group._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.unarchive', (done) => {
		request
			.post(api('groups.unarchive'))
			.set(credentials)
			.send({
				roomId: group._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.close', (done) => {
		request
			.post(api('groups.close'))
			.set(credentials)
			.send({
				roomId: group._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.close', (done) => {
		request
			.post(api('groups.close'))
			.set(credentials)
			.send({
				roomName: apiPrivateChannelName,
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
				expect(res.body).to.have.property('error', `The private group, ${apiPrivateChannelName}, is already closed to the sender`);
			})
			.end(done);
	});

	it('/groups.open', (done) => {
		request
			.post(api('groups.open'))
			.set(credentials)
			.send({
				roomId: group._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it('/groups.list', (done) => {
		request
			.get(api('groups.list'))
			.set(credentials)
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.property('count');
				expect(res.body).to.have.property('total');
				expect(res.body).to.have.property('groups').and.to.be.an('array');
			})
			.end(done);
	});

	describe('[/groups.online]', () => {
		const createUserAndChannel = async (setAsOnline = true) => {
			const testUser = await createUser();
			const testUserCredentials = await login(testUser.username, password);

			if (setAsOnline) {
				await request.post(api('users.setStatus')).set(testUserCredentials).send({
					message: '',
					status: 'online',
				});
			}

			const roomName = `group-test-${Date.now()}`;

			const roomResponse = await createRoom({
				name: roomName,
				type: 'p',
				members: [testUser.username],
				credentials: testUserCredentials,
			});

			return {
				testUser,
				testUserCredentials,
				room: roomResponse.body.group,
			};
		};

		it('should return an error if no query', () =>
			request
				.get(api('groups.online'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Invalid query');
				}));

		it('should return an error if passing an empty query', () =>
			request
				.get(api('groups.online'))
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

			const response = await request.get(api('groups.online')).set(testUserCredentials).query(`query={"_id": "${room._id}"}`);

			const { body } = response;

			const expected = {
				_id: testUser._id,
				username: testUser.username,
			};

			expect(body.online).to.deep.include(expected);
		});

		it('should return an empty array if members are offline', async () => {
			const { testUserCredentials, room } = await createUserAndChannel(false);

			const response = await request.get(api('groups.online')).set(testUserCredentials).query(`query={"_id": "${room._id}"}`);

			const { body } = response;

			expect(body.online).to.deep.equal([]);
		});

		it('should return an error if requesting user is not in group', async () => {
			const outsider = await createUser();
			const outsiderCredentials = await login(outsider.username, password);

			const { room } = await createUserAndChannel();

			return request
				.get(api('groups.online'))
				.set(outsiderCredentials)
				.query(`query={"_id": "${room._id}"}`)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				});
		});
	});
	describe('/groups.files', () => {
		it('should return group members when searching by roomId', (done) => {
			request
				.get(api('groups.members'))
				.set(credentials)
				.query({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('members').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return group members when searching by roomId even requested with count and offset params', (done) => {
			request
				.get(api('groups.members'))
				.set(credentials)
				.query({
					roomId: group._id,
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('members').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('/groups.files', () => {
		it('should return group files when searching by roomId', (done) => {
			request
				.get(api('groups.files'))
				.set(credentials)
				.query({
					roomId: group._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('files').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return group files when searching by roomId even requested with count and offset params', (done) => {
			request
				.get(api('groups.files'))
				.set(credentials)
				.query({
					roomId: group._id,
					count: 5,
					offset: 0,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('files').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('/groups.listAll', () => {
		it('should fail if the user doesnt have view-room-administration permission', (done) => {
			updatePermission('view-room-administration', []).then(() => {
				request
					.get(api('groups.listAll'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('error', 'unauthorized');
					})
					.end(done);
			});
		});
		it('should succeed if user has view-room-administration permission', (done) => {
			updatePermission('view-room-administration', ['admin']).then(() => {
				request
					.get(api('groups.listAll'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('groups').and.to.be.an('array');
					})
					.end(done);
			});
		});
	});

	it('/groups.counters', (done) => {
		request
			.get(api('groups.counters'))
			.set(credentials)
			.query({
				roomId: group._id,
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

	it('/groups.rename', async () => {
		const roomInfo = await getRoomInfo(group._id);

		return request
			.post(api('groups.rename'))
			.set(credentials)
			.send({
				roomId: group._id,
				name: `EDITED${apiPrivateChannelName}`,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
				expect(res.body).to.have.nested.property('group._id');
				expect(res.body).to.have.nested.property('group.name', `EDITED${apiPrivateChannelName}`);
				expect(res.body).to.have.nested.property('group.t', 'p');
				expect(res.body).to.have.nested.property('group.msgs', roomInfo.group.msgs + 1);
			});
	});

	describe('/groups.getIntegrations', () => {
		let integrationCreatedByAnUser;
		let userCredentials;
		let createdGroup;
		before((done) => {
			createRoom({ name: `test-integration-group-${Date.now()}`, type: 'p' }).end((err, res) => {
				createdGroup = res.body.group;
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
										channel: `#${createdGroup.name}`,
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

		it('should return the list of integrations of create group and it should contain the integration created by user when the admin DOES have the permission', (done) => {
			updatePermission('manage-incoming-integrations', ['admin']).then(() => {
				request
					.get(api('groups.getIntegrations'))
					.set(credentials)
					.query({
						roomId: createdGroup._id,
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
						.get(api('groups.getIntegrations'))
						.set(credentials)
						.query({
							roomId: createdGroup._id,
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
								.get(api('groups.getIntegrations'))
								.set(credentials)
								.query({
									roomId: createdGroup._id,
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

	it('/groups.setReadOnly', (done) => {
		request
			.post(api('groups.setReadOnly'))
			.set(credentials)
			.send({
				roomId: group._id,
				readOnly: true,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	it.skip('/groups.leave', (done) => {
		request
			.post(api('groups.leave'))
			.set(credentials)
			.send({
				roomId: group._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(200)
			.expect((res) => {
				expect(res.body).to.have.property('success', true);
			})
			.end(done);
	});

	describe('/groups.setAnnouncement', () => {
		it('should set the announcement of the group with a string', (done) => {
			request
				.post(api('groups.setAnnouncement'))
				.set(credentials)
				.send({
					roomId: group._id,
					announcement: 'this is an announcement of a group for api tests',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('announcement', 'this is an announcement of a group for api tests');
				})
				.end(done);
		});
		it('should set the announcement of the group with an empty string(remove the announcement)', (done) => {
			request
				.post(api('groups.setAnnouncement'))
				.set(credentials)
				.send({
					roomId: group._id,
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

	describe('/groups.setType', () => {
		it('should change the type of the group to a channel', (done) => {
			request
				.post(api('groups.setType'))
				.set(credentials)
				.send({
					roomId: group._id,
					type: 'c',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/groups.setCustomFields:', () => {
		let cfchannel;
		it('create group with customFields', (done) => {
			const customFields = { field0: 'value0' };
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${Date.now()}`,
					customFields,
				})
				.end((err, res) => {
					cfchannel = res.body.group;
					done();
				});
		});
		it('get customFields using groups.info', (done) => {
			request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: cfchannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group.customFields.field0', 'value0');
				})
				.end(done);
		});
		it('change customFields', async () => {
			const customFields = { field9: 'value9' };
			return request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomId: cfchannel._id,
					customFields,
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
				});
		});
		it('get customFields using groups.info', (done) => {
			request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: cfchannel._id,
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
			request
				.post(api('groups.delete'))
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
		it('create group without customFields', (done) => {
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${Date.now()}`,
				})
				.end((err, res) => {
					cfchannel = res.body.group;
					done();
				});
		});
		it('set customFields with one nested field', async () => {
			const customFields = { field1: 'value1' };
			return request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomId: cfchannel._id,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('group._id');
					expect(res.body).to.have.nested.property('group.name', cfchannel.name);
					expect(res.body).to.have.nested.property('group.t', 'p');
					expect(res.body).to.have.nested.property('group.customFields.field1', 'value1');
				});
		});
		it('set customFields with multiple nested fields', async () => {
			const customFields = { field2: 'value2', field3: 'value3', field4: 'value4' };

			return request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
					customFields,
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
				});
		});
		it('set customFields to empty object', async () => {
			const customFields = {};

			return request
				.post(api('groups.setCustomFields'))
				.set(credentials)
				.send({
					roomName: cfchannel.name,
					customFields,
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
				});
		});
		it('set customFields as a string -> should return 400', (done) => {
			const customFields = '';

			request
				.post(api('groups.setCustomFields'))
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
		it('delete group with empty customFields', (done) => {
			request
				.post(api('groups.delete'))
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

	describe('/groups.delete', () => {
		let testGroup;
		it('/groups.create', (done) => {
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `group.test.${Date.now()}`,
				})
				.end((err, res) => {
					testGroup = res.body.group;
					done();
				});
		});
		it('/groups.delete', (done) => {
			request
				.post(api('groups.delete'))
				.set(credentials)
				.send({
					roomName: testGroup.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('/groups.info', (done) => {
			request
				.get(api('groups.info'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
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

	describe('/groups.roles', () => {
		let testGroup;
		it('/groups.create', (done) => {
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `group.roles.test.${Date.now()}`,
				})
				.end((err, res) => {
					testGroup = res.body.group;
					done();
				});
		});
		it('/groups.invite', (done) => {
			request
				.post(api('groups.invite'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/groups.addModerator', (done) => {
			request
				.post(api('groups.addModerator'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/groups.addLeader', (done) => {
			request
				.post(api('groups.addLeader'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of roles <-> user relationships in a private group', (done) => {
			request
				.get(api('groups.roles'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('roles').that.is.an('array').that.has.lengthOf(2);

					expect(res.body.roles[0]).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[0]).to.have.a.property('rid').that.is.equal(testGroup._id);
					expect(res.body.roles[0]).to.have.a.property('roles').that.is.an('array').that.includes('moderator', 'leader');
					expect(res.body.roles[0]).to.have.a.property('u').that.is.an('object');
					expect(res.body.roles[0].u).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[0].u).to.have.a.property('username').that.is.a('string');

					expect(res.body.roles[1]).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[1]).to.have.a.property('rid').that.is.equal(testGroup._id);
					expect(res.body.roles[1]).to.have.a.property('roles').that.is.an('array').that.includes('owner');
					expect(res.body.roles[1]).to.have.a.property('u').that.is.an('object');
					expect(res.body.roles[1].u).to.have.a.property('_id').that.is.a('string');
					expect(res.body.roles[1].u).to.have.a.property('username').that.is.a('string');
				})
				.end(done);
		});
	});

	describe('/groups.moderators', () => {
		let testGroup;
		it('/groups.create', (done) => {
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `group.roles.test.${Date.now()}`,
				})
				.end((err, res) => {
					testGroup = res.body.group;
					done();
				});
		});
		it('/groups.invite', (done) => {
			request
				.post(api('groups.invite'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/groups.addModerator', (done) => {
			request
				.post(api('groups.addModerator'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of moderators with rocket.cat as a moderator', (done) => {
			request
				.get(api('groups.moderators'))
				.set(credentials)
				.query({
					roomId: testGroup._id,
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

	describe('/groups.setEncrypted', () => {
		let testGroup;
		it('/groups.create', (done) => {
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({
					name: `group.encrypted.test.${Date.now()}`,
				})
				.end((err, res) => {
					testGroup = res.body.group;
					done();
				});
		});

		it('should return an error when passing no boolean param', (done) => {
			request
				.post(api('groups.setEncrypted'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					encrypted: 'no-boolean',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'The bodyParam "encrypted" is required');
				})
				.end(done);
		});

		it('should set group as encrypted correctly and return the new data', (done) => {
			request
				.post(api('groups.setEncrypted'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					encrypted: true,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('group');
					expect(res.body.group).to.have.property('_id', testGroup._id);
					expect(res.body.group).to.have.property('encrypted', true);
				})
				.end(done);
		});

		it('should return the updated room encrypted', async () => {
			const roomInfo = await getRoomInfo(testGroup._id);
			expect(roomInfo).to.have.a.property('success', true);
			expect(roomInfo.group).to.have.a.property('_id', testGroup._id);
			expect(roomInfo.group).to.have.a.property('encrypted', true);
		});

		it('should set group as unencrypted correctly and return the new data', (done) => {
			request
				.post(api('groups.setEncrypted'))
				.set(credentials)
				.send({
					roomId: testGroup._id,
					encrypted: false,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('group');
					expect(res.body.group).to.have.property('_id', testGroup._id);
					expect(res.body.group).to.have.property('encrypted', false);
				})
				.end(done);
		});

		it('should return the updated room unencrypted', async () => {
			const roomInfo = await getRoomInfo(testGroup._id);
			expect(roomInfo).to.have.a.property('success', true);
			expect(roomInfo.group).to.have.a.property('_id', testGroup._id);
			expect(roomInfo.group).to.have.a.property('encrypted', false);
		});
	});

	describe('/groups.convertToTeam', () => {
		before((done) => {
			request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `group-${Date.now()}` })
				.expect(200)
				.expect((response) => {
					this.newGroup = response.body.group;
				})
				.then(() => done());
		});

		it('should fail to convert group if lacking edit-room permission', (done) => {
			updatePermission('create-team', []).then(() => {
				updatePermission('edit-room', ['admin']).then(() => {
					request
						.post(api('groups.convertToTeam'))
						.set(credentials)
						.send({ roomId: this.newGroup._id })
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should fail to convert group if lacking create-team permission', (done) => {
			updatePermission('create-team', ['admin']).then(() => {
				updatePermission('edit-room', []).then(() => {
					request
						.post(api('groups.convertToTeam'))
						.set(credentials)
						.send({ roomId: this.newGroup._id })
						.expect(403)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', false);
						})
						.end(done);
				});
			});
		});

		it('should successfully convert a group to a team', (done) => {
			updatePermission('create-team', ['admin']).then(() => {
				updatePermission('edit-room', ['admin']).then(() => {
					request
						.post(api('groups.convertToTeam'))
						.set(credentials)
						.send({ roomId: this.newGroup._id })
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
						})
						.end(done);
				});
			});
		});

		it('should fail to convert group without the required parameters', (done) => {
			request.post(api('groups.convertToTeam')).set(credentials).send({}).expect(400).end(done);
		});

		it("should fail to convert group if it's already taken", (done) => {
			request
				.post(api('groups.convertToTeam'))
				.set(credentials)
				.send({ roomId: this.newGroup._id })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
				})
				.end(done);
		});
	});

	context("Setting: 'Use Real Name': true", () => {
		let realNameGroup;

		before(async () => {
			await updateSetting('UI_Use_Real_Name', true);

			await request
				.post(api('groups.create'))
				.set(credentials)
				.send({ name: `group-${Date.now()}` })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);

					realNameGroup = res.body.group;
				});

			await request
				.post(api('chat.sendMessage'))
				.set(credentials)
				.send({
					message: {
						text: 'Sample message',
						rid: realNameGroup._id,
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
				.post(api('groups.delete'))
				.set(credentials)
				.send({ roomId: realNameGroup._id })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('/groups.list', (done) => {
			request
				.get(api('groups.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('groups').and.to.be.an('array');

					const retGroup = res.body.groups.find(({ _id }) => _id === realNameGroup._id);

					expect(retGroup).to.have.nested.property('lastMessage.u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});

		it('/groups.listAll', (done) => {
			request
				.get(api('groups.listAll'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('groups').and.to.be.an('array');

					const retGroup = res.body.groups.find(({ _id }) => _id === realNameGroup._id);

					expect(retGroup).to.have.nested.property('lastMessage.u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});
	});
});

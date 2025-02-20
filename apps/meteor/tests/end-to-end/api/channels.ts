import type { Credentials } from '@rocket.chat/api-client';
import { TEAM_TYPE, type IIntegration, type IMessage, type IRoom, type ITeam, type IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect, assert } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials, reservedWords } from '../../data/api-data';
import { pinMessage, sendMessage, starMessage } from '../../data/chat.helper';
import { CI_MAX_ROOMS_PER_GUEST as maxRoomsPerGuest } from '../../data/constants';
import { createIntegration, removeIntegration } from '../../data/integration.helper';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { createTeam, deleteTeam } from '../../data/teams.helper';
import { testFileUploads } from '../../data/uploads.helper';
import { adminUsername, password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, login, deleteUser } from '../../data/users.helper';

function getRoomInfo(roomId: IRoom['_id']) {
	return new Promise<{ channel: IRoom }>((resolve) => {
		void request
			.get(api('channels.info'))
			.set(credentials)
			.query({
				roomId,
			})
			.end((_err, req) => {
				resolve(req.body);
			});
	});
}

describe('[Channels]', () => {
	let channel: Pick<IRoom, '_id' | 'name'>;
	const apiPublicChannelName = `api-channel-test-${Date.now()}`;

	before((done) => getCredentials(done));

	before('Creating channel', (done) => {
		void request
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
				channel = {
					_id: res.body.channel._id,
					name: res.body.channel.name,
				};
			})
			.end(done);
	});

	after(async () => {
		await deleteRoom({ type: 'c', roomId: channel._id });
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
		void request
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

	it('/channels.addModerator should fail with missing room Id', (done) => {
		void request
			.post(api('channels.addModerator'))
			.set(credentials)
			.send({
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
			})
			.end(done);
	});

	it('/channels.addModerator should fail with missing user Id', (done) => {
		void request
			.post(api('channels.addModerator'))
			.set(credentials)
			.send({
				roomId: channel._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
			})
			.end(done);
	});

	it('/channels.removeModerator', (done) => {
		void request
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

	it('/channels.removeModerator should fail on invalid room id', (done) => {
		void request
			.post(api('channels.removeModerator'))
			.set(credentials)
			.send({
				userId: 'rocket.cat',
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
			})
			.end(done);
	});

	it('/channels.removeModerator should fail on invalid user id', (done) => {
		void request
			.post(api('channels.removeModerator'))
			.set(credentials)
			.send({
				roomId: channel._id,
			})
			.expect('Content-Type', 'application/json')
			.expect(400)
			.expect((res) => {
				expect(res.body).to.have.property('success', false);
			})
			.end(done);
	});

	it('/channels.addOwner', (done) => {
		void request
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
		void request
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
		void request
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

	it('/channels.archive', (done) => {
		void request
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
		void request
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
		void request
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
		void request
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
		void request
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

	describe('/channels.list', () => {
		let testChannel: IRoom;
		before(async () => {
			await updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']);
			await updatePermission('view-joined-room', ['guest', 'bot', 'app', 'anonymous']);
			testChannel = (await createRoom({ type: 'c', name: `channels.messages.test.${Date.now()}` })).body.channel;
		});

		after(async () => {
			await updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']);
			await updatePermission('view-joined-room', ['guest', 'bot', 'app', 'anonymous']);
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('should succesfully return a list of channels', async () => {
			await request
				.get(api('channels.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('channels').that.is.an('array');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				});
		});

		it('should correctly filter channel by id', async () => {
			await request
				.get(api('channels.list'))
				.set(credentials)
				.query({
					_id: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('channels').that.is.an('array').of.length(1);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total');
				});
		});

		it('should not be succesful when user does NOT have the permission to view channels or joined rooms', async () => {
			await updatePermission('view-c-room', []);
			await updatePermission('view-joined-room', []);
			await request
				.get(api('channels.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		it('should be succesful when user does NOT have the permission to view channels, but can view joined rooms', async () => {
			await updatePermission('view-c-room', []);
			await updatePermission('view-joined-room', ['admin']);
			await request
				.get(api('channels.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('channels').that.is.an('array');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				});
		});

		it('should be succesful when user does NOT have the permission to view joined rooms, but can view channels', async () => {
			await updatePermission('view-c-room', ['admin']);
			await updatePermission('view-joined-room', []);
			await request
				.get(api('channels.list'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('channels').that.is.an('array');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
				});
		});

		it('should paginate', async () => {
			const {
				body: { channels: channels1 },
			} = await request.get(api('channels.list')).set(credentials);
			const {
				body: { channels: channels2 },
			} = await request.get(api('channels.list')).set(credentials).query({ offset: 1 });
			expect(channels1).to.not.deep.equal(channels2);
		});
	});

	it('/channels.list.joined', (done) => {
		void request
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
		void request
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

	it('/channels.rename', async () => {
		const roomInfo = await getRoomInfo(channel._id);

		function failRenameChannel(name: string) {
			it(`should not rename a channel to the reserved name ${name}`, (done) => {
				void request
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

	it('/channels.addAll', (done) => {
		void request
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
		void request
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
		void request
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

	describe('[/channels.create]', () => {
		let guestUser: TestUser<IUser>;
		let invitedUser: TestUser<IUser>;
		let invitedUserCredentials: Credentials;
		let room: IRoom;
		let teamId: ITeam['_id'];

		before(async () => {
			guestUser = await createUser({ roles: ['guest'] });
			invitedUser = await createUser();
			invitedUserCredentials = await login(invitedUser.username, password);

			await updatePermission('create-team', ['admin', 'user']);
			const teamCreateRes = await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `team-${Date.now()}`,
					type: 0,
					members: [invitedUser.username],
				});

			teamId = teamCreateRes.body.team._id;
			await updatePermission('create-team-channel', ['owner']);
		});
		after(async () => {
			await deleteUser(guestUser);
			await deleteUser(invitedUser);
			await updatePermission('create-team-channel', ['admin', 'owner', 'moderator']);
		});

		it(`should fail when trying to use an existing room's name`, async () => {
			await request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: 'general',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.nested.property('errorType', 'error-duplicate-channel-name');
				});
		});

		it('should not add guest users to more rooms than defined in the license', async function () {
			// TODO this is not the right way to do it. We're doing this way for now just because we have separate CI jobs for EE and CE,
			// ideally we should have a single CI job that adds a license and runs both CE and EE tests.
			if (!process.env.IS_EE) {
				this.skip();
			}

			const promises = [];
			for (let i = 0; i < maxRoomsPerGuest; i++) {
				promises.push(
					createRoom({
						type: 'c',
						name: `channel.test.${Date.now()}-${Math.random()}`,
						members: [guestUser.username],
					}),
				);
			}
			const channelIds = (await Promise.all(promises)).map((r) => r.body.channel).map((channel) => channel._id);

			void request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.test.${Date.now()}-${Math.random()}`,
					members: [guestUser.username],
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					room = res.body.group;
				})
				.then(() => {
					void request
						.get(api('channels.members'))
						.set(credentials)
						.query({
							roomId: room._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('members').and.to.be.an('array');
							expect(res.body.members).to.have.lengthOf(1);
						});
				});

			await Promise.all(channelIds.map((id) => deleteRoom({ type: 'c', roomId: id })));
		});

		it('should successfully create a channel in a team', async () => {
			await request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `team-channel-${Date.now()}`,
					extraData: { teamId },
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('channel');
					expect(res.body.channel).to.have.property('teamId', teamId);
				});
		});

		it('should fail creating a channel in a team when member does not have the necessary permission', async () => {
			await request
				.post(api('channels.create'))
				.set(invitedUserCredentials)
				.send({
					name: `team-channel-${Date.now()}`,
					extraData: { teamId },
				})
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'unauthorized');
				});
		});
	});

	describe('[/channels.info]', () => {
		const testChannelName = `api-channel-test-${Date.now()}.${Random.id()}`;
		let testChannel: IRoom;

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('creating new channel...', (done) => {
			void request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: testChannelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					testChannel = res.body.channel;
				})
				.end(done);
		});
		it('should fail to create the same channel twice', (done) => {
			void request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: testChannelName,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.contain('error-duplicate-channel-name');
				})
				.end(done);
		});
		it('should return channel basic structure', (done) => {
			void request
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
					expect(res.body).to.have.nested.property('channel.name', testChannelName);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.msgs', 0);
				})
				.end(done);
		});

		let channelMessage: IMessage;

		it('sending a message...', (done) => {
			void request
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
			void request
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
			void request
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
			void request
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
		it('should return channel structure with "lastMessage" object including pin, reactions and star(should be an array) infos', (done) => {
			void request
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
			void request
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
					const messages = res.body.messages as IMessage[];
					const lastMessage = messages.filter((message) => message._id === channelMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred?.[0]._id).to.be.equal(adminUsername);
				})
				.end(done);
		});
		it('should return all channels messages where the last message of array should have the "star" array with USERS star ONLY even requested with count and offset params', (done) => {
			void request
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
					const messages = res.body.messages as IMessage[];
					const lastMessage = messages.filter((message) => message._id === channelMessage._id)[0];
					expect(lastMessage).to.have.property('starred').and.to.be.an('array');
					expect(lastMessage.starred?.[0]._id).to.be.equal(adminUsername);
				})
				.end(done);
		});
		describe('Additional Visibility Tests', () => {
			let outsiderUser: IUser;
			let insideUser: IUser;
			let nonTeamUser: IUser;
			let outsiderCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let insideCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let nonTeamCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };

			let privateChannel: IRoom;
			let publicChannel: IRoom;
			let publicTeam: ITeam;
			let privateTeam: ITeam;
			let privateChannelInPublicTeam: IRoom;
			let publicChannelInPublicTeam: IRoom;
			let privateChannelInPrivateTeam: IRoom;
			let publicChannelInPrivateTeam: IRoom;

			before(async () => {
				[outsiderUser, insideUser, nonTeamUser] = await Promise.all([
					createUser({ username: `e_${Random.id()}` }),
					createUser({ username: `f_${Random.id()}` }),
					createUser({ username: `g_${Random.id()}` }),
				]);
				[outsiderCredentials, insideCredentials, nonTeamCredentials] = await Promise.all([
					login(outsiderUser.username, password),
					login(insideUser.username, password),
					login(nonTeamUser.username, password),
				]);

				// Create a public team and a private team
				[publicTeam, privateTeam] = await Promise.all([
					createTeam(insideCredentials, `channels.info.team.public.${Random.id()}`, TEAM_TYPE.PUBLIC, [outsiderUser.username as string]),
					createTeam(insideCredentials, `channels.info.team.private.${Random.id()}`, TEAM_TYPE.PRIVATE, [outsiderUser.username as string]),
				]);

				const [
					privateInPublicResponse,
					publicInPublicResponse,
					privateInPrivateResponse,
					publicInPrivateResponse,
					privateRoomResponse,
					publicRoomResponse,
				] = await Promise.all([
					createRoom({
						type: 'p',
						name: `teamPublic.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPublic.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `teamPrivate.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPrivate.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `channels.info.private.${Date.now()}`,
						credentials: insideCredentials,
					}),
					createRoom({
						type: 'c',
						name: `channels.info.public.${Date.now()}`,
						credentials: insideCredentials,
					}),
				]);

				privateChannelInPublicTeam = privateInPublicResponse.body.group;
				publicChannelInPublicTeam = publicInPublicResponse.body.channel;
				privateChannelInPrivateTeam = privateInPrivateResponse.body.group;
				publicChannelInPrivateTeam = publicInPrivateResponse.body.channel;
				privateChannel = privateRoomResponse.body.group;
				publicChannel = publicRoomResponse.body.channel;
			});

			after(async () => {
				await Promise.all([
					deleteRoom({ type: 'p', roomId: privateChannel._id }),
					deleteRoom({ type: 'c', roomId: publicChannel._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPublicTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPublicTeam._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPrivateTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPrivateTeam._id }),
				]);

				await Promise.all([deleteTeam(credentials, publicTeam.name), deleteTeam(credentials, privateTeam.name)]);

				await Promise.all([deleteUser(outsiderUser), deleteUser(insideUser), deleteUser(nonTeamUser)]);
			});

			it('should not fetch private room info by user not part of room', async () => {
				await request
					.get(api('channels.info'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch private room info by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.info'))
					.set(insideCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400);

				expect(response.body.success).to.be.false;
			});

			it('should fetch public room info by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.info'))
					.set(insideCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body).to.have.property('channel');
			});

			it('should fetch public room info by user not part of room - because public', async () => {
				const response = await request
					.get(api('channels.info'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body).to.have.property('channel');
			});

			it('should not fetch a private channel info inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.info'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel info inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.info'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel info inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.info'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should fetch a public channel info inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.info'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('channel');
					});
			});

			it('should fetch a public channel info inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.info'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('channel');
					});
			});

			it('should fetch a public channel info inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.info'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('channel');
					});
			});

			it('should fetch a public channel info inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.info'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('channel');
					});
			});

			it('should fetch a public channel info inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.info'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('channel');
					});
			});

			it('should not fetch a public channel info inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.info'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel info inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.info'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel info inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.info'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel info inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.info'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
		});
	});

	describe('[/channels.online]', () => {
		const createdChannels: IRoom[] = [];
		const createdUsers: TestUser<IUser>[] = [];

		const createUserAndChannel = async () => {
			const testUser = await createUser();
			const testUserCredentials = await login(testUser.username, password);
			createdUsers.push(testUser);

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
			createdChannels.push(roomResponse.body.channel);

			return {
				testUser,
				testUserCredentials,
				room: roomResponse.body.channel,
			};
		};

		after(async () => {
			await Promise.all([
				createdUsers.map((user) => deleteUser(user)),
				createdChannels.map((channel) => deleteRoom({ type: 'c', roomId: channel._id })),
			]);
		});

		it('should return an error if no query', () =>
			void request
				.get(api('channels.online'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'Invalid query');
				}));

		it('should return an error if passing an empty query', () =>
			void request
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
				.query({ _id: room._id })
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
				.query({ _id: room._id })
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

	describe('[/channels.files]', async () => {
		await testFileUploads('channels.files', 'c');
	});

	describe('[/channels.join]', () => {
		let testChannelNoCode: IRoom;
		let testChannelWithCode: IRoom;
		let testUser: TestUser<IUser>;
		let testUserCredentials: Credentials;

		before('Create test user', async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
			testChannelNoCode = (await createRoom({ type: 'c', credentials: testUserCredentials, name: `${apiPublicChannelName}-nojoincode` }))
				.body.channel;
			testChannelWithCode = (
				await createRoom({ type: 'c', credentials: testUserCredentials, name: `${apiPublicChannelName}-withjoincode` })
			).body.channel;
			await updatePermission('edit-room', ['admin', 'owner', 'moderator']);
		});

		after(async () => {
			await Promise.all([
				deleteRoom({ type: 'c', roomId: testChannelNoCode._id }),
				deleteRoom({ type: 'c', roomId: testChannelWithCode._id }),
				deleteUser(testUser),
				updatePermission('edit-room', ['admin', 'owner', 'moderator']),
				updatePermission('join-without-join-code', ['admin', 'bot', 'app']),
			]);
		});

		before('Set code for channel', (done) => {
			void request
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
			void request
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

		describe('code-free channel', () => {
			it('should succeed when joining code-free channel without join code', (done) => {
				void request
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
		});

		describe('code-needed channel', () => {
			describe('without join-without-join-code permission', () => {
				before('set join-without-join-code permission to false', async () => {
					await updatePermission('join-without-join-code', []);
				});

				it('should fail when joining code-needed channel without join code and no join-without-join-code permission', (done) => {
					void request
						.post(api('channels.join'))
						.set(credentials)
						.send({
							roomId: testChannelWithCode._id,
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.nested.property('errorType', 'error-code-required');
						})
						.end(done);
				});

				it('should fail when joining code-needed channel with incorrect join code and no join-without-join-code permission', (done) => {
					void request
						.post(api('channels.join'))
						.set(credentials)
						.send({
							roomId: testChannelWithCode._id,
							joinCode: 'WRONG_CODE',
						})
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body).to.have.nested.property('errorType', 'error-code-invalid');
						})
						.end(done);
				});

				it('should succeed when joining code-needed channel with join code', (done) => {
					void request
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

			describe('with join-without-join-code permission', () => {
				before('set join-without-join-code permission to true', async () => {
					await updatePermission('join-without-join-code', ['admin']);
				});

				before('leave channel', (done) => {
					void request
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

				it('should succeed when joining code-needed channel without join code and with join-without-join-code permission', (done) => {
					void request
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
		});
	});

	describe('/channels.setDescription', () => {
		it('should set the description of the channel with a string', (done) => {
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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
			void request
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

	describe('/channels.members', () => {
		let testUser: TestUser<IUser>;

		before(async () => {
			testUser = await createUser();
			await updateSetting('Accounts_SearchFields', 'username, name, bio, nickname');
			await request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: channel._id,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200);
		});

		after(async () => {
			await Promise.all([updateSetting('Accounts_SearchFields', 'username, name, bio, nickname'), deleteUser(testUser)]);
		});

		it('should return an array of members by channel', (done) => {
			void request
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
			void request
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
			void request
				.get(api('channels.members'))
				.set(credentials)
				.query({
					roomId: channel._id,
					filter: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('members').and.to.be.an('array');
					expect(res.body).to.have.property('count', 1);
					expect(res.body.members[0]._id).to.be.equal(testUser._id);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
				})
				.end(done);
		});

		describe('Additional Visibility Tests', () => {
			let outsiderUser: IUser;
			let insideUser: IUser;
			let nonTeamUser: IUser;
			let outsiderCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let insideCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let nonTeamCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };

			let privateChannel: IRoom;
			let publicChannel: IRoom;
			let publicTeam: ITeam;
			let privateTeam: ITeam;
			let privateChannelInPublicTeam: IRoom;
			let publicChannelInPublicTeam: IRoom;
			let privateChannelInPrivateTeam: IRoom;
			let publicChannelInPrivateTeam: IRoom;

			before(async () => {
				[outsiderUser, insideUser, nonTeamUser] = await Promise.all([
					createUser({ username: `e_${Random.id()}` }),
					createUser({ username: `f_${Random.id()}` }),
					createUser({ username: `g_${Random.id()}` }),
				]);
				[outsiderCredentials, insideCredentials, nonTeamCredentials] = await Promise.all([
					login(outsiderUser.username, password),
					login(insideUser.username, password),
					login(nonTeamUser.username, password),
				]);

				// Create a public team and a private team
				[publicTeam, privateTeam] = await Promise.all([
					createTeam(insideCredentials, `channels.members.team.public.${Random.id()}`, TEAM_TYPE.PUBLIC, [outsiderUser.username as string]),
					createTeam(insideCredentials, `channels.members.team.private.${Random.id()}`, TEAM_TYPE.PRIVATE, [
						outsiderUser.username as string,
					]),
				]);

				const [
					privateInPublicResponse,
					publicInPublicResponse,
					privateInPrivateResponse,
					publicInPrivateResponse,
					privateRoomResponse,
					publicRoomResponse,
				] = await Promise.all([
					createRoom({
						type: 'p',
						name: `teamPublic.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPublic.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `teamPrivate.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPrivate.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `rooms.members.private.${Date.now()}`,
						credentials: insideCredentials,
					}),
					createRoom({
						type: 'c',
						name: `rooms.members.public.${Date.now()}`,
						credentials: insideCredentials,
					}),
				]);

				privateChannelInPublicTeam = privateInPublicResponse.body.group;
				publicChannelInPublicTeam = publicInPublicResponse.body.channel;
				privateChannelInPrivateTeam = privateInPrivateResponse.body.group;
				publicChannelInPrivateTeam = publicInPrivateResponse.body.channel;
				privateChannel = privateRoomResponse.body.group;
				publicChannel = publicRoomResponse.body.channel;
			});

			after(async () => {
				await Promise.all([
					deleteRoom({ type: 'p', roomId: privateChannel._id }),
					deleteRoom({ type: 'c', roomId: publicChannel._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPublicTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPublicTeam._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPrivateTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPrivateTeam._id }),
				]);

				await Promise.all([deleteTeam(credentials, publicTeam.name), deleteTeam(credentials, privateTeam.name)]);

				await Promise.all([deleteUser(outsiderUser), deleteUser(insideUser), deleteUser(nonTeamUser)]);
			});

			it('should not fetch private room members by user not part of room', async () => {
				await request
					.get(api('channels.members'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch private room members by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.members'))
					.set(insideCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400);

				expect(response.body.success).to.be.false;
			});

			it('should fetch public room members by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.members'))
					.set(insideCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body.members).to.be.an('array');
			});

			it('should fetch public room members by user not part of room - because public', async () => {
				await updatePermission('view-c-room', ['admin', 'user', 'guest']);
				const response = await request
					.get(api('channels.members'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body.members).to.be.an('array');
			});

			it('should not fetch a private channel members inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.members'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel members inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.members'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel members inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.members'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should fetch a public channel members inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.members'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should fetch a public channel members inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.members'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should fetch a public channel members inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.members'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should fetch a public channel members inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.members'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should fetch a public channel members inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.members'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.members).to.be.an('array');
					});
			});

			it('should not fetch a public channel members inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.members'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel members inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.members'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel members inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.members'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel members inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.members'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
		});
	});

	describe('/channels.getIntegrations', () => {
		let integrationCreatedByAnUser: IIntegration;
		let userCredentials: Credentials;
		let createdChannel: IRoom;
		let user: TestUser<IUser>;

		before((done) => {
			void createRoom({ name: `test-integration-channel-${Date.now()}`, type: 'c' }).end((_err, res) => {
				createdChannel = res.body.channel;
				void createUser().then((createdUser) => {
					user = createdUser;
					void login(user.username, password).then((credentials) => {
						userCredentials = credentials;
						void updatePermission('manage-incoming-integrations', ['user']).then(() => {
							void updatePermission('manage-own-incoming-integrations', ['user']).then(() => {
								void createIntegration(
									{
										type: 'webhook-incoming',
										name: 'Incoming test',
										enabled: true,
										alias: 'test',
										username: 'rocket.cat',
										scriptEnabled: false,
										overrideDestinationChannelEnabled: true,
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

		after(async () => {
			await Promise.all([
				deleteRoom({ type: 'c', roomId: createdChannel._id }),
				removeIntegration(integrationCreatedByAnUser._id, 'incoming'),
				updatePermission('manage-incoming-integrations', ['admin']),
				updatePermission('manage-own-incoming-integrations', ['admin']),
				deleteUser(user),
			]);
		});

		it('should return the list of integrations of created channel and it should contain the integration created by user when the admin DOES have the permission', async () => {
			await updatePermission('manage-incoming-integrations', ['admin']);
			await request
				.get(api('channels.getIntegrations'))
				.set(credentials)
				.query({
					roomId: createdChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const integrationCreated = (res.body.integrations as IIntegration[]).find(
						(createdIntegration) => createdIntegration._id === integrationCreatedByAnUser._id,
					);
					assert.isDefined(integrationCreated);
					expect(integrationCreated).to.be.an('object');
					expect(integrationCreated._id).to.be.equal(integrationCreatedByAnUser._id);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
				});
		});

		it('should return the list of integrations created by the user only', async () => {
			await updatePermission('manage-own-incoming-integrations', ['admin']);
			await updatePermission('manage-incoming-integrations', []);
			await request
				.get(api('channels.getIntegrations'))
				.set(credentials)
				.query({
					roomId: createdChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const integrationCreated = (res.body.integrations as IIntegration[]).find(
						(createdIntegration) => createdIntegration._id === integrationCreatedByAnUser._id,
					);
					expect(integrationCreated).to.be.equal(undefined);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('total');
				});
		});

		it('should return unauthorized error when the user does not have any integrations permissions', async () => {
			await Promise.all([
				updatePermission('manage-incoming-integrations', []),
				updatePermission('manage-own-incoming-integrations', []),
				updatePermission('manage-outgoing-integrations', []),
				updatePermission('manage-own-outgoing-integrations', []),
			]);
			await request
				.get(api('channels.getIntegrations'))
				.set(credentials)
				.query({
					roomId: createdChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
		});

		describe('Additional Visibility Tests', () => {
			let outsiderUser: IUser;
			let insideUser: IUser;
			let nonTeamUser: IUser;
			let outsiderCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let insideCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let nonTeamCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };

			let privateChannel: IRoom;
			let publicChannel: IRoom;
			let publicTeam: ITeam;
			let privateTeam: ITeam;
			let privateChannelInPublicTeam: IRoom;
			let publicChannelInPublicTeam: IRoom;
			let privateChannelInPrivateTeam: IRoom;
			let publicChannelInPrivateTeam: IRoom;

			before(async () => {
				[outsiderUser, insideUser, nonTeamUser] = await Promise.all([
					createUser({ username: `e_${Random.id()}` }),
					createUser({ username: `f_${Random.id()}` }),
					createUser({ username: `g_${Random.id()}` }),
				]);
				[outsiderCredentials, insideCredentials, nonTeamCredentials] = await Promise.all([
					login(outsiderUser.username, password),
					login(insideUser.username, password),
					login(nonTeamUser.username, password),
				]);

				// Create a public team and a private team
				[publicTeam, privateTeam] = await Promise.all([
					createTeam(insideCredentials, `channels.getIntegrations.team.public.${Random.id()}`, TEAM_TYPE.PUBLIC, [
						outsiderUser.username as string,
					]),
					createTeam(insideCredentials, `channels.getIntegrations.team.private.${Random.id()}`, TEAM_TYPE.PRIVATE, [
						outsiderUser.username as string,
					]),
				]);

				const [
					privateInPublicResponse,
					publicInPublicResponse,
					privateInPrivateResponse,
					publicInPrivateResponse,
					privateRoomResponse,
					publicRoomResponse,
				] = await Promise.all([
					createRoom({
						type: 'p',
						name: `teamPublic.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPublic.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `teamPrivate.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPrivate.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `channels.getIntegrations.private.${Date.now()}`,
						credentials: insideCredentials,
					}),
					createRoom({
						type: 'c',
						name: `channels.getIntegrations.public.${Date.now()}`,
						credentials: insideCredentials,
					}),
				]);

				privateChannelInPublicTeam = privateInPublicResponse.body.group;
				publicChannelInPublicTeam = publicInPublicResponse.body.channel;
				privateChannelInPrivateTeam = privateInPrivateResponse.body.group;
				publicChannelInPrivateTeam = publicInPrivateResponse.body.channel;
				privateChannel = privateRoomResponse.body.group;
				publicChannel = publicRoomResponse.body.channel;

				await updatePermission('manage-incoming-integrations', ['admin', 'user']);
			});

			after(async () => {
				await Promise.all([
					deleteRoom({ type: 'p', roomId: privateChannel._id }),
					deleteRoom({ type: 'c', roomId: publicChannel._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPublicTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPublicTeam._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPrivateTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPrivateTeam._id }),
				]);

				await Promise.all([deleteTeam(credentials, publicTeam.name), deleteTeam(credentials, privateTeam.name)]);

				await Promise.all([deleteUser(outsiderUser), deleteUser(insideUser), deleteUser(nonTeamUser)]);

				await updatePermission('manage-incoming-integrations', ['admin']);
			});

			it('should not fetch private room integrations by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.getIntegrations'))
					.set(insideCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400);

				expect(response.body.success).to.be.false;
			});

			it('should fetch public room integrations by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.getIntegrations'))
					.set(insideCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body).to.have.property('integrations');
			});

			it('should fetch public room integrations by user not part of room - because public', async () => {
				const response = await request
					.get(api('channels.getIntegrations'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body).to.have.property('integrations');
			});

			it('should not fetch a private channel integrations inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel integrations inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel integrations inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should fetch a public channel integrations inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('integrations');
					});
			});

			it('should fetch a public channel integrations inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('integrations');
					});
			});

			it('should fetch a public channel integrations inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('integrations');
					});
			});

			it('should fetch a public channel integrations inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('integrations');
					});
			});

			it('should fetch a public channel integrations inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('integrations');
					});
			});

			it('should not fetch a public channel integrations inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel integrations inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel integrations inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel integrations inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.getIntegrations'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
		});
	});

	describe('/channels.setCustomFields:', () => {
		let withCFChannel: IRoom;
		let withoutCFChannel: IRoom;

		after(async () => {
			await deleteRoom({ type: 'c', roomId: withCFChannel._id });
		});

		it('create channel with customFields', (done) => {
			const customFields = { field0: 'value0' };
			void request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${Date.now()}`,
					customFields,
				})
				.end((_err, res) => {
					withCFChannel = res.body.channel;
					done();
				});
		});
		it('get customFields using channels.info', (done) => {
			void request
				.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: withCFChannel._id,
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
					roomId: withCFChannel._id,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', withCFChannel.name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.customFields.field9', 'value9');
					expect(res.body).to.have.not.nested.property('channel.customFields.field0', 'value0');
				});
		});
		it('get customFields using channels.info', (done) => {
			void request
				.get(api('channels.info'))
				.set(credentials)
				.query({
					roomId: withCFChannel._id,
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
			void request
				.post(api('channels.delete'))
				.set(credentials)
				.send({
					roomName: withCFChannel.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('create channel without customFields', (done) => {
			void request
				.post(api('channels.create'))
				.set(credentials)
				.send({
					name: `channel.cf.${Date.now()}`,
				})
				.end((_err, res) => {
					withoutCFChannel = res.body.channel;
					done();
				});
		});
		it('set customFields with one nested field', async () => {
			const customFields = { field1: 'value1' };
			return request
				.post(api('channels.setCustomFields'))
				.set(credentials)
				.send({
					roomId: withoutCFChannel._id,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', withoutCFChannel.name);
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
					roomName: withoutCFChannel.name,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', withoutCFChannel.name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.customFields.field2', 'value2');
					expect(res.body).to.have.nested.property('channel.customFields.field3', 'value3');
					expect(res.body).to.have.nested.property('channel.customFields.field4', 'value4');
					expect(res.body).to.have.not.nested.property('channel.customFields.field1', 'value1');
				});
		});
		it('set customFields to empty object', (done) => {
			const customFields = {};

			void request
				.post(api('channels.setCustomFields'))
				.set(credentials)
				.send({
					roomName: withoutCFChannel.name,
					customFields,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', withoutCFChannel.name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.not.nested.property('channel.customFields.field2', 'value2');
					expect(res.body).to.have.not.nested.property('channel.customFields.field3', 'value3');
					expect(res.body).to.have.not.nested.property('channel.customFields.field4', 'value4');
				})
				.end(done);
		});
		it('set customFields as a string -> should return 400', (done) => {
			const customFields = '';

			void request
				.post(api('channels.setCustomFields'))
				.set(credentials)
				.send({
					roomName: withoutCFChannel.name,
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
			void request
				.post(api('channels.delete'))
				.set(credentials)
				.send({
					roomName: withoutCFChannel.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('/channels.setDefault', () => {
		let testChannel: IRoom;
		const name = `setDefault-${Date.now()}`;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name })).body.channel;
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('should set channel as default', async () => {
			const roomInfo = await getRoomInfo(testChannel._id);

			return request
				.post(api('channels.setDefault'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					default: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs);
					expect(res.body).to.have.nested.property('channel.default', true);
				});
		});
		it('should unset channel as default', async () => {
			const roomInfo = await getRoomInfo(testChannel._id);

			return request
				.post(api('channels.setDefault'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					default: false,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id');
					expect(res.body).to.have.nested.property('channel.name', name);
					expect(res.body).to.have.nested.property('channel.t', 'c');
					expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs);
					expect(res.body).to.have.nested.property('channel.default', false);
				});
		});
	});

	describe('/channels.setType', () => {
		let testChannel: IRoom;
		const name = `setType-${Date.now()}`;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name })).body.channel;
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('should change the type public channel to private', async () => {
			const roomInfo = await getRoomInfo(testChannel._id);

			void request
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
					expect(res.body).to.have.nested.property('channel.name', name);
					expect(res.body).to.have.nested.property('channel.t', 'p');
					expect(res.body).to.have.nested.property('channel.msgs', roomInfo.channel.msgs + 1);
				});
		});
	});

	describe('/channels.delete', () => {
		let testChannel: IRoom;
		let testTeamChannel: IRoom;
		let testModeratorTeamChannel: IRoom;
		let invitedUser: TestUser<IUser>;
		let moderatorUser: TestUser<IUser>;
		let invitedUserCredentials: Credentials;
		let moderatorUserCredentials: Credentials;
		let teamId: ITeam['_id'];
		let teamMainRoomId: IRoom['_id'];

		before(async () => {
			testChannel = (await createRoom({ name: `channel.test.${Date.now()}`, type: 'c' })).body.channel;
			invitedUser = await createUser();
			moderatorUser = await createUser();
			invitedUserCredentials = await login(invitedUser.username, password);
			moderatorUserCredentials = await login(moderatorUser.username, password);

			await updatePermission('create-team', ['admin', 'user']);
			const teamCreateRes = await request
				.post(api('teams.create'))
				.set(credentials)
				.send({
					name: `team-${Date.now()}`,
					type: 0,
					members: [invitedUser.username, moderatorUser.username],
				});
			teamId = teamCreateRes.body.team._id;
			teamMainRoomId = teamCreateRes.body.team.roomId;

			await updatePermission('delete-team-channel', ['owner', 'moderator']);
			await updatePermission('create-team-channel', ['admin', 'owner', 'moderator', 'user']);
			const teamChannelResponse = await createRoom({
				name: `channel.test.${Date.now()}`,
				type: 'c',
				extraData: { teamId },
				credentials: invitedUserCredentials,
			});
			testTeamChannel = teamChannelResponse.body.channel;

			await request
				.post(api('channels.addModerator'))
				.set(credentials)
				.send({
					userId: moderatorUser._id,
					roomId: teamMainRoomId,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
			const teamModeratorChannelResponse = await createRoom({
				name: `channel.test.moderator.${Date.now()}`,
				type: 'c',
				extraData: { teamId },
				credentials: moderatorUserCredentials,
			});
			testModeratorTeamChannel = teamModeratorChannelResponse.body.channel;
		});
		after(async () => {
			await deleteUser(invitedUser);
			await deleteUser(moderatorUser);
			await updatePermission('create-team-channel', ['admin', 'owner', 'moderator']);
			await updatePermission('delete-team-channel', ['admin', 'owner', 'moderator']);
		});
		it('should succesfully delete a channel', async () => {
			await request
				.post(api('channels.delete'))
				.set(credentials)
				.send({
					roomName: testChannel.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
		it(`should fail retrieving a channel's info after it's been deleted`, async () => {
			await request
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
				});
		});
		it(`should fail deleting a team's channel when member does not have the necessary permission in the team`, async () => {
			await request
				.post(api('channels.delete'))
				.set(invitedUserCredentials)
				.send({
					roomName: testTeamChannel.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.a.property('error');
					expect(res.body).to.have.a.property('errorType');
					expect(res.body.errorType).to.be.equal('error-not-allowed');
				});
		});
		it(`should fail deleting a team's channel when member has the necessary permission in the team, but not in the deleted room`, async () => {
			await request
				.post(api('channels.delete'))
				.set(moderatorUserCredentials)
				.send({
					roomName: testTeamChannel.name,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.a.property('error');
					expect(res.body).to.have.a.property('errorType');
					expect(res.body.errorType).to.be.equal('error-not-allowed');
				});
		});
		it(`should successfully delete a team's channel when member has both team and channel permissions`, async () => {
			await request
				.post(api('channels.delete'))
				.set(moderatorUserCredentials)
				.send({
					roomId: testModeratorTeamChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});
	});

	describe('/channels.getAllUserMentionsByChannel', () => {
		it('should return an array of mentions by channel', (done) => {
			void request
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
			void request
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
		let testChannel: IRoom;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.roles.test.${Date.now()}` })).body.channel;
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('/channels.invite', (done) => {
			void request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addModerator', (done) => {
			void request
				.post(api('channels.addModerator'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addLeader', (done) => {
			void request
				.post(api('channels.addLeader'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of role <-> user relationships in a channel', (done) => {
			void request
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
		let testChannel: IRoom;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.moderators.test.${Date.now()}` })).body.channel;
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('/channels.invite', (done) => {
			void request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('/channels.addModerator', (done) => {
			void request
				.post(api('channels.addModerator'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'rocket.cat',
				})
				.end(done);
		});
		it('should return an array of moderators with rocket.cat as a moderator', (done) => {
			void request
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

		describe('Additional Visibility Tests', () => {
			let outsiderUser: IUser;
			let insideUser: IUser;
			let nonTeamUser: IUser;
			let outsiderCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let insideCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let nonTeamCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };

			let privateChannel: IRoom;
			let publicChannel: IRoom;
			let publicTeam: ITeam;
			let privateTeam: ITeam;
			let privateChannelInPublicTeam: IRoom;
			let publicChannelInPublicTeam: IRoom;
			let privateChannelInPrivateTeam: IRoom;
			let publicChannelInPrivateTeam: IRoom;

			before(async () => {
				[outsiderUser, insideUser, nonTeamUser] = await Promise.all([
					createUser({ username: `e_${Random.id()}` }),
					createUser({ username: `f_${Random.id()}` }),
					createUser({ username: `g_${Random.id()}` }),
				]);
				[outsiderCredentials, insideCredentials, nonTeamCredentials] = await Promise.all([
					login(outsiderUser.username, password),
					login(insideUser.username, password),
					login(nonTeamUser.username, password),
				]);

				// Create a public team and a private team
				[publicTeam, privateTeam] = await Promise.all([
					createTeam(insideCredentials, `channels.moderators.team.public.${Random.id()}`, TEAM_TYPE.PUBLIC, [
						outsiderUser.username as string,
					]),
					createTeam(insideCredentials, `channels.moderators.team.private.${Random.id()}`, TEAM_TYPE.PRIVATE, [
						outsiderUser.username as string,
					]),
				]);

				const [
					privateInPublicResponse,
					publicInPublicResponse,
					privateInPrivateResponse,
					publicInPrivateResponse,
					privateRoomResponse,
					publicRoomResponse,
				] = await Promise.all([
					createRoom({
						type: 'p',
						name: `teamPublic.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPublic.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `teamPrivate.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPrivate.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `channels.moderators.private.${Date.now()}`,
						credentials: insideCredentials,
					}),
					createRoom({
						type: 'c',
						name: `channels.moderators.public.${Date.now()}`,
						credentials: insideCredentials,
					}),
				]);

				privateChannelInPublicTeam = privateInPublicResponse.body.group;
				publicChannelInPublicTeam = publicInPublicResponse.body.channel;
				privateChannelInPrivateTeam = privateInPrivateResponse.body.group;
				publicChannelInPrivateTeam = publicInPrivateResponse.body.channel;
				privateChannel = privateRoomResponse.body.group;
				publicChannel = publicRoomResponse.body.channel;
			});

			after(async () => {
				await Promise.all([
					deleteRoom({ type: 'p', roomId: privateChannel._id }),
					deleteRoom({ type: 'c', roomId: publicChannel._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPublicTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPublicTeam._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPrivateTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPrivateTeam._id }),
				]);

				await Promise.all([deleteTeam(credentials, publicTeam.name), deleteTeam(credentials, privateTeam.name)]);

				await Promise.all([deleteUser(outsiderUser), deleteUser(insideUser), deleteUser(nonTeamUser)]);
			});

			it('should not fetch private room moderators by user not part of room', async () => {
				await request
					.get(api('channels.moderators'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch private room moderators by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.moderators'))
					.set(insideCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400);

				expect(response.body.success).to.be.false;
			});

			it('should fetch public room moderators by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.moderators'))
					.set(insideCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body).to.have.property('moderators');
			});

			it('should fetch public room moderators by user not part of room - because public', async () => {
				const response = await request
					.get(api('channels.moderators'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body).to.have.property('moderators');
			});

			it('should not fetch a private channel moderators inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.moderators'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel moderators inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.moderators'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel moderators inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.moderators'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should fetch a public channel moderators inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.moderators'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('moderators');
					});
			});

			it('should fetch a public channel moderators inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.moderators'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('moderators');
					});
			});

			it('should fetch a public channel moderators inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.moderators'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('moderators');
					});
			});

			it('should fetch a public channel moderators inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.moderators'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('moderators');
					});
			});

			it('should fetch a public channel moderators inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.moderators'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('moderators');
					});
			});

			it('should not fetch a public channel moderators inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.moderators'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel moderators inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.moderators'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel moderators inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.moderators'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel moderators inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.moderators'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
		});
	});

	describe('/channels.anonymousread', () => {
		let testChannel: IRoom;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.anonymousread.test.${Date.now()}` })).body.channel;
		});

		after(async () => {
			await Promise.all([updateSetting('Accounts_AllowAnonymousRead', false), deleteRoom({ type: 'c', roomId: testChannel._id })]);
		});

		it('should return an error when the setting "Accounts_AllowAnonymousRead" is disabled', (done) => {
			void updateSetting('Accounts_AllowAnonymousRead', false).then(() => {
				void request
					.get(api('channels.anonymousread'))
					.query({
						roomId: testChannel._id,
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.a.property('success', false);
						expect(res.body).to.have.a.property('error', 'Enable "Allow Anonymous Read" [error-not-allowed]');
					})
					.end(done);
			});
		});
		it('should return the messages list when the setting "Accounts_AllowAnonymousRead" is enabled', (done) => {
			void updateSetting('Accounts_AllowAnonymousRead', true).then(() => {
				void request
					.get(api('channels.anonymousread'))
					.query({
						roomId: testChannel._id,
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
			void updateSetting('Accounts_AllowAnonymousRead', true).then(() => {
				void request
					.get(api('channels.anonymousread'))
					.query({
						roomId: testChannel._id,
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
		describe('Additional Visibility Tests', () => {
			let outsiderUser: IUser;
			let insideUser: IUser;
			let nonTeamUser: IUser;
			let outsiderCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let insideCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let nonTeamCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };

			let privateTeam: ITeam;
			let publicChannelInPrivateTeam: IRoom;

			before(async () => {
				[outsiderUser, insideUser, nonTeamUser] = await Promise.all([
					createUser({ username: `e_${Random.id()}` }),
					createUser({ username: `f_${Random.id()}` }),
					createUser({ username: `g_${Random.id()}` }),
				]);
				[outsiderCredentials, insideCredentials, nonTeamCredentials] = await Promise.all([
					login(outsiderUser.username, password),
					login(insideUser.username, password),
					login(nonTeamUser.username, password),
				]);

				// Create a private team
				privateTeam = await createTeam(insideCredentials, `channels.anonymousread.team.private.${Random.id()}`, TEAM_TYPE.PRIVATE, [
					outsiderUser.username as string,
				]);

				const publicInPrivateResponse = await createRoom({
					type: 'c',
					name: `teamPrivate.publicChannel.${Date.now()}`,
					credentials: insideCredentials,
					extraData: {
						teamId: privateTeam._id,
					},
				});

				publicChannelInPrivateTeam = publicInPrivateResponse.body.channel;

				await updateSetting('Accounts_AllowAnonymousRead', true);
			});

			after(async () => {
				await deleteRoom({ type: 'c', roomId: publicChannelInPrivateTeam._id });

				await Promise.all([deleteTeam(credentials, privateTeam.name)]);

				await Promise.all([deleteUser(outsiderUser), deleteUser(insideUser), deleteUser(nonTeamUser)]);

				await updateSetting('Accounts_AllowAnonymousRead', false);
			});

			it('should fetch a public channel messages inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.anonymousread'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages');
					});
			});

			it('should fetch a public channel messages inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.anonymousread'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('messages');
					});
			});

			it('should not fetch a public channel messages inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.anonymousread'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(404)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a public channel messages inside a private team when unauthenticated', async () => {
				await request
					.get(api('channels.anonymousread'))
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(404)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
		});
	});

	describe('/channels.convertToTeam', () => {
		let testChannel: IRoom;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.convertToTeam.test.${Date.now()}` })).body.channel;
		});

		after(async () => {
			assert.isDefined(testChannel.name);
			await Promise.all([
				updatePermission('create-team', ['admin', 'user']),
				updatePermission('edit-room', ['admin', 'owner', 'moderator']),
				deleteTeam(credentials, testChannel.name),
			]);
		});

		it('should fail to convert channel if lacking create-team permission', async () => {
			await updatePermission('create-team', []);
			await updatePermission('edit-room', ['admin']);

			await request
				.post(api('channels.convertToTeam'))
				.set(credentials)
				.send({ channelId: testChannel._id })
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
				});
		});

		it('should fail to convert channel if lacking edit-room permission', async () => {
			await updatePermission('create-team', ['admin']);
			await updatePermission('edit-room', []);

			await request
				.post(api('channels.convertToTeam'))
				.set(credentials)
				.send({ channelId: testChannel._id })
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
				});
		});

		it(`should return an error when the channel's name and id are sent as parameter`, (done) => {
			void request
				.post(api('channels.convertToTeam'))
				.set(credentials)
				.send({
					channelName: testChannel.name,
					channelId: testChannel._id,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error').include(`must match exactly one schema in oneOf`);
				})
				.end(done);
		});

		it(`should successfully convert a channel to a team when the channel's id is sent as parameter`, async () => {
			await updatePermission('create-team', ['admin']);
			await updatePermission('edit-room', ['admin']);

			await request
				.post(api('channels.convertToTeam'))
				.set(credentials)
				.send({ channelId: testChannel._id })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
				});
		});

		it(`should successfully convert a channel to a team when the channel's name is sent as parameter`, async () => {
			await request
				.post(api('teams.convertToChannel'))
				.set(credentials)
				.send({ teamName: testChannel.name })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
				});

			await request
				.post(api('channels.convertToTeam'))
				.set(credentials)
				.send({ channelName: testChannel.name })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
				});
		});

		it('should fail to convert channel without the required parameters', (done) => {
			void request.post(api('channels.convertToTeam')).set(credentials).send({}).expect(400).end(done);
		});

		it("should fail to convert channel if it's already taken", (done) => {
			void request
				.post(api('channels.convertToTeam'))
				.set(credentials)
				.send({ channelId: testChannel._id })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
				})
				.end(done);
		});
	});

	describe("Setting: 'Use Real Name': true", () => {
		let testChannel: IRoom;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.anonymousread.test.${Date.now()}` })).body.channel;
		});
		before(async () => {
			await updateSetting('UI_Use_Real_Name', true);

			await request
				.post(api('channels.join'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.nested.property('channel._id', testChannel._id);
				});

			await request
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
				});
		});

		after(async () => {
			await Promise.all([
				updateSetting('Accounts_AllowAnonymousRead', false),
				updateSetting('UI_Use_Real_Name', false),
				deleteRoom({ type: 'c', roomId: testChannel._id }),
			]);
		});

		it('should return the last message user real name', (done) => {
			void request
				.get(api('channels.info'))
				.query({
					roomId: testChannel._id,
				})
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const { channel } = res.body;

					expect(channel._id).to.be.equal(testChannel._id);
					expect(channel).to.have.nested.property('lastMessage.u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});

		it('/channels.list.joined', (done) => {
			void request
				.get(api('channels.list.joined'))
				.set(credentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('channels').and.to.be.an('array');

					const retChannel = (res.body.channels as IRoom[]).find(({ _id }) => _id === testChannel._id);

					expect(retChannel).to.have.nested.property('lastMessage.u.name', 'RocketChat Internal Admin Test');
				})
				.end(done);
		});

		it('/channels.list.join should return empty list when member of no group', async () => {
			const user = await createUser({ joinDefaultChannels: false });
			const newCreds = await login(user.username, password);
			await request
				.get(api('channels.list.joined'))
				.set(newCreds)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('count').that.is.equal(0);
					expect(res.body).to.have.property('total').that.is.equal(0);
					expect(res.body).to.have.property('channels').and.to.be.an('array').and.that.has.lengthOf(0);
				});
		});
	});

	describe('[/channels.messages]', () => {
		let testChannel: IRoom;
		let emptyChannel: IRoom;
		let firstUser: IUser;
		let secondUser: IUser;

		before(async () => {
			await updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']);
			emptyChannel = (await createRoom({ type: 'c', name: `channels.messages.empty.test.${Date.now()}` })).body.channel;
			testChannel = (await createRoom({ type: 'c', name: `channels.messages.test.${Date.now()}` })).body.channel;

			firstUser = await createUser({ joinDefaultChannels: false });
			secondUser = await createUser({ joinDefaultChannels: false });

			const messages = [
				{
					rid: testChannel._id,
					msg: `@${firstUser.username} youre being mentioned`,
					mentions: [{ username: firstUser.username, _id: firstUser._id, name: firstUser.name }],
				},
				{
					rid: testChannel._id,
					msg: `@${secondUser.username} youre being mentioned`,
					mentions: [{ username: secondUser.username, _id: secondUser._id, name: secondUser.name }],
				},
				{
					rid: testChannel._id,
					msg: `A simple message`,
				},
				{
					rid: testChannel._id,
					msg: `A pinned simple message`,
				},
			];

			const [, , starredMessage, pinnedMessage] = await Promise.all(messages.map((message) => sendMessage({ message })));

			await Promise.all([
				starMessage({ messageId: starredMessage.body.message._id }),
				pinMessage({ messageId: pinnedMessage.body.message._id }),
			]);
		});

		after(async () => {
			await updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']);
			await deleteRoom({ type: 'c', roomId: testChannel._id });
		});

		it('should return an empty array of messages when inspecting a new room', async () => {
			await request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: emptyChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array').that.is.empty;
					expect(res.body).to.have.property('count', 0);
					expect(res.body).to.have.property('total', 0);
				});
		});

		it('should return an array of messages when inspecting a room with messages', async () => {
			await request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('messages').and.to.be.an('array').that.has.lengthOf(5);
					expect(res.body).to.have.property('count', 5);
					expect(res.body).to.have.property('total', 5);

					const pinnedMessage = res.body.messages.find((message: any) => message.t === 'message_pinned');
					expect(pinnedMessage).to.not.be.undefined;
				});
		});

		it('should not return message when the user does NOT have the necessary permission', async () => {
			await updatePermission('view-c-room', []);
			await request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('error', 'User does not have the permissions required for this action [error-unauthorized]');
				});
			await updatePermission('view-c-room', ['admin', 'user', 'bot', 'app', 'anonymous']);
		});

		it('should return messages that mention a single user', async () => {
			await request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					mentionIds: firstUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(1);
					expect(res.body.messages[0]).to.have.nested.property('mentions').that.is.an('array').and.to.have.lengthOf(1);
					expect(res.body.messages[0].mentions[0]).to.have.property('_id', firstUser._id);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
				});
		});

		it('should return messages that mention multiple users', async () => {
			await request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					mentionIds: `${firstUser._id},${secondUser._id}`,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(2);
					expect(res.body).to.have.property('count', 2);
					expect(res.body).to.have.property('total', 2);

					const mentionIds = res.body.messages.map((message: any) => message.mentions[0]._id);
					expect(mentionIds).to.include.members([firstUser._id, secondUser._id]);
				});
		});

		it('should return messages that are starred by a specific user', async () => {
			await request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					starredIds: 'rocketchat.internal.admin.test',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(1);
					expect(res.body.messages[0]).to.have.nested.property('starred').that.is.an('array').and.to.have.lengthOf(1);
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
				});
		});

		// Return messages that are pinned
		it('should return messages that are pinned', async () => {
			await request
				.get(api('channels.messages'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					pinned: true,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.messages).to.have.lengthOf(1);
					expect(res.body.messages[0]).to.have.nested.property('pinned').that.is.an('boolean').and.to.be.true;
					expect(res.body.messages[0]).to.have.nested.property('pinnedBy').that.is.an('object');
					expect(res.body.messages[0].pinnedBy).to.have.property('_id', 'rocketchat.internal.admin.test');
					expect(res.body).to.have.property('count', 1);
					expect(res.body).to.have.property('total', 1);
				});
		});

		describe('Additional Visibility Tests', () => {
			let outsiderUser: IUser;
			let insideUser: IUser;
			let nonTeamUser: IUser;
			let outsiderCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let insideCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };
			let nonTeamCredentials: { 'X-Auth-Token': string; 'X-User-Id': string };

			let privateChannel: IRoom;
			let publicChannel: IRoom;
			let publicTeam: ITeam;
			let privateTeam: ITeam;
			let privateChannelInPublicTeam: IRoom;
			let publicChannelInPublicTeam: IRoom;
			let privateChannelInPrivateTeam: IRoom;
			let publicChannelInPrivateTeam: IRoom;

			before(async () => {
				[outsiderUser, insideUser, nonTeamUser] = await Promise.all([
					createUser({ username: `e_${Random.id()}` }),
					createUser({ username: `f_${Random.id()}` }),
					createUser({ username: `g_${Random.id()}` }),
				]);
				[outsiderCredentials, insideCredentials, nonTeamCredentials] = await Promise.all([
					login(outsiderUser.username, password),
					login(insideUser.username, password),
					login(nonTeamUser.username, password),
				]);

				// Create a public team and a private team
				[publicTeam, privateTeam] = await Promise.all([
					createTeam(insideCredentials, `channels.messages.team.public.${Random.id()}`, TEAM_TYPE.PUBLIC, [
						outsiderUser.username as string,
					]),
					createTeam(insideCredentials, `channels.messages.team.private.${Random.id()}`, TEAM_TYPE.PRIVATE, [
						outsiderUser.username as string,
					]),
				]);

				const [
					privateInPublicResponse,
					publicInPublicResponse,
					privateInPrivateResponse,
					publicInPrivateResponse,
					privateRoomResponse,
					publicRoomResponse,
				] = await Promise.all([
					createRoom({
						type: 'p',
						name: `teamPublic.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPublic.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: publicTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `teamPrivate.privateChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'c',
						name: `teamPrivate.publicChannel.${Date.now()}`,
						credentials: insideCredentials,
						extraData: {
							teamId: privateTeam._id,
						},
					}),
					createRoom({
						type: 'p',
						name: `channels.messages.private.${Date.now()}`,
						credentials: insideCredentials,
					}),
					createRoom({
						type: 'c',
						name: `channels.messages.public.${Date.now()}`,
						credentials: insideCredentials,
					}),
				]);

				privateChannelInPublicTeam = privateInPublicResponse.body.group;
				publicChannelInPublicTeam = publicInPublicResponse.body.channel;
				privateChannelInPrivateTeam = privateInPrivateResponse.body.group;
				publicChannelInPrivateTeam = publicInPrivateResponse.body.channel;
				privateChannel = privateRoomResponse.body.group;
				publicChannel = publicRoomResponse.body.channel;
			});

			after(async () => {
				await Promise.all([
					deleteRoom({ type: 'p', roomId: privateChannel._id }),
					deleteRoom({ type: 'c', roomId: publicChannel._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPublicTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPublicTeam._id }),
					deleteRoom({ type: 'p', roomId: privateChannelInPrivateTeam._id }),
					deleteRoom({ type: 'c', roomId: publicChannelInPrivateTeam._id }),
				]);

				await Promise.all([deleteTeam(credentials, publicTeam.name), deleteTeam(credentials, privateTeam.name)]);

				await Promise.all([deleteUser(outsiderUser), deleteUser(insideUser), deleteUser(nonTeamUser)]);
			});

			it('should not fetch private room messages by user not part of room', async () => {
				await request
					.get(api('channels.messages'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch private room messages by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.messages'))
					.set(insideCredentials)
					.query({ roomId: privateChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(400);

				expect(response.body.success).to.be.false;
			});

			it('should fetch public room messages by user who is part of the room', async () => {
				const response = await request
					.get(api('channels.messages'))
					.set(insideCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body.messages).to.be.an('array');
			});

			it('should fetch public room messages by user not part of room - because public', async () => {
				await updatePermission('view-c-room', ['admin', 'user', 'guest']);
				const response = await request
					.get(api('channels.messages'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannel._id })
					.expect('Content-Type', 'application/json')
					.expect(200);

				expect(response.body.success).to.be.true;
				expect(response.body.messages).to.be.an('array');
			});

			it('should not fetch a private channel messages inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.messages'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel messages inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.messages'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel messages inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.messages'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should fetch a public channel messages inside a public team by someone part of the room ', async () => {
				await request
					.get(api('channels.messages'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.messages).to.be.an('array');
					});
			});

			it('should fetch a public channel messages inside a public team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.messages'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.messages).to.be.an('array');
					});
			});

			it('should fetch a public channel messages inside a public team by someone not part of the team ', async () => {
				await request
					.get(api('channels.messages'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPublicTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.messages).to.be.an('array');
					});
			});

			it('should fetch a public channel messages inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.messages'))
					.set(insideCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.messages).to.be.an('array');
					});
			});

			it('should fetch a public channel messages inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.messages'))
					.set(outsiderCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body.messages).to.be.an('array');
					});
			});

			it('should not fetch a public channel messages inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.messages'))
					.set(nonTeamCredentials)
					.query({ roomId: publicChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(403)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel messages inside a private team by someone part of the room', async () => {
				await request
					.get(api('channels.messages'))
					.set(insideCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel messages inside a private team by someone not part of the room, but part of team', async () => {
				await request
					.get(api('channels.messages'))
					.set(outsiderCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});

			it('should not fetch a private channel messages inside a private team by someone not part of team', async () => {
				await request
					.get(api('channels.messages'))
					.set(nonTeamCredentials)
					.query({ roomId: privateChannelInPrivateTeam._id })
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
					});
			});
		});
	});
});

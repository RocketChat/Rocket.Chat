import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IThreadMessage, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { sendSimpleMessage } from '../../data/chat.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Commands]', () => {
	before((done) => getCredentials(done));

	describe('[/commands.get]', () => {
		it('should return an error when call the endpoint without "command" required parameter', (done) => {
			void request
				.get(api('commands.get'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The query param "command" must be provided.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with an invalid command', (done) => {
			void request
				.get(api('commands.get'))
				.set(credentials)
				.query({
					command: 'invalid-command',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('There is no command in the system by the name of: invalid-command');
				})
				.end(done);
		});
		it('should return success when parameters are correct', (done) => {
			void request
				.get(api('commands.get'))
				.set(credentials)
				.query({
					command: 'help',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('command');
					expect(res.body.command).to.have.property('command');
					expect(res.body.command).to.have.property('description');
					expect(res.body.command).to.have.property('clientOnly');
					expect(res.body.command).to.have.property('providesPreview');
				})
				.end(done);
		});
	});

	describe('[/commands.list]', () => {
		it('should return a list of commands', (done) => {
			void request
				.get(api('commands.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('commands').and.to.be.an('array');
				})
				.end(done);
		});
		it('should return a list of commands even requested with count and offset params', (done) => {
			void request
				.get(api('commands.list'))
				.set(credentials)
				.query({
					count: 5,
					offset: 0,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('commands').and.to.be.an('array');
				})
				.end(done);
		});
	});

	describe('[/commands.run]', () => {
		let testChannel: IRoom;
		let threadMessage: IThreadMessage;

		before(async () => {
			testChannel = (await createRoom({ type: 'c', name: `channel.test.commands.${Date.now()}` })).body.channel;
			const { body: { message } = {} } = await sendSimpleMessage({
				roomId: testChannel._id,
				text: 'Message to create thread',
			});

			threadMessage = (
				await sendSimpleMessage({
					roomId: testChannel._id,
					text: 'Thread Message',
					tmid: message._id,
				})
			).body.message;
		});

		after(() => deleteRoom({ type: 'c', roomId: testChannel._id }));

		it('should return an error when call the endpoint without "command" required parameter', (done) => {
			void request
				.post(api('commands.run'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('You must provide a command to run.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with the param "params" and it is not a string', (done) => {
			void request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'help',
					params: true,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The parameters for the command must be a single string.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint without "roomId" required parameter', (done) => {
			void request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'help',
					params: 'params',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal("The room's id where to execute this command must be provided and be a string.");
				})
				.end(done);
		});
		it('should return an error when call the endpoint with the param "tmid" and it is not a string', (done) => {
			void request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'help',
					params: 'params',
					roomId: 'GENERAL',
					tmid: true,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The tmid parameter when provided must be a string.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with the invalid "command" param', (done) => {
			void request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'invalid-command',
					params: 'params',
					roomId: 'GENERAL',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('The command provided does not exist (or is disabled).');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with an invalid thread id', (done) => {
			void request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'tableflip',
					params: 'params',
					roomId: 'GENERAL',
					tmid: 'invalid-thread',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Invalid thread.');
				})
				.end(done);
		});
		it('should return an error when call the endpoint with a valid thread id of wrong channel', (done) => {
			void request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'tableflip',
					params: 'params',
					roomId: 'GENERAL',
					tmid: threadMessage.tmid,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body.error).to.be.equal('Invalid thread.');
				})
				.end(done);
		});
		it('should return success when parameters are correct', (done) => {
			void request
				.post(api('commands.run'))
				.set(credentials)
				.send({
					command: 'tableflip',
					params: 'params',
					roomId: threadMessage.rid,
					tmid: threadMessage.tmid,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('Command archive', function () {
		describe('unauthorized cases', () => {
			let user: TestUser<IUser>;
			let credentials: Credentials;

			this.beforeAll(async () => {
				user = await createUser({
					joinDefaultChannels: true,
				});
				credentials = await login(user.username, password);
			});

			this.afterAll(async () => {
				await deleteUser(user);
			});

			it('should return an error when the user is not logged in', async () => {
				await request
					.post(api('commands.run'))
					.send({ command: 'archive', roomId: 'GENERAL' })
					.expect(401)
					.expect((res) => {
						expect(res.body).to.have.property('status', 'error');
					});
			});

			it('should return an error when the user has not enough permissions', async () => {
				await request
					.post(api('commands.run'))
					.set(credentials)
					.send({
						command: 'archive',
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-authorized');
					});
			});
		});

		describe('authorized cases', function () {
			this.afterAll(async () => {
				await request
					.post(api('commands.run'))
					.set(credentials)
					.send({
						command: 'unarchive',
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			});

			it('should return a success when the user has enough permissions', async () => {
				await request
					.post(api('commands.run'))
					.set(credentials)
					.send({
						command: 'archive',
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			});
		});
	});

	describe('Command unarchive', function () {
		describe('unauthorized cases', () => {
			let user: TestUser<IUser>;
			let credentials: Credentials;
			this.beforeAll(async () => {
				user = await createUser({
					joinDefaultChannels: true,
				});
				credentials = await login(user.username, password);
			});

			this.afterAll(async () => {
				await deleteUser(user);
			});

			it('should return an error when the user is not logged in', async () => {
				await request
					.post(api('commands.run'))
					.send({ command: 'unarchive', roomId: 'GENERAL' })
					.expect(401)
					.expect((res) => {
						expect(res.body).to.have.property('status', 'error');
					});
			});

			it('should return an error when the user has not enough permissions', async () => {
				await request
					.post(api('commands.run'))
					.set(credentials)
					.send({
						command: 'unarchive',
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body).to.have.property('errorType', 'error-not-authorized');
					});
			});
		});

		describe('authorized cases', () => {
			before(async () => {
				await request
					.post(api('commands.run'))
					.set(credentials)
					.send({
						command: 'archive',
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			});
			it('should return a success when the user has enough permissions', async () => {
				await request
					.post(api('commands.run'))
					.set(credentials)
					.send({
						command: 'unarchive',
						roomId: 'GENERAL',
					})
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('success', true);
					});
			});
		});
	});

	describe('Command "invite-all-from"', function () {
		let group: IRoom;
		let group1: IRoom;
		let channel: IRoom;
		let user1: TestUser<IUser>;
		let user2: TestUser<IUser>;
		let user1Credentials: Credentials;
		let user2Credentials: Credentials;

		this.beforeAll(async () => {
			user1 = await createUser();
			user2 = await createUser();

			[user1Credentials, user2Credentials] = await Promise.all([login(user1.username, password), login(user2.username, password)]);
		});

		this.beforeAll(async () => {
			const [response1, response2, response3] = await Promise.all([
				createRoom({ type: 'p', name: `room1-${Date.now()}.${Random.id()}`, credentials: user1Credentials }),
				createRoom({ type: 'c', name: `room2-${Date.now()}.${Random.id()}`, credentials: user2Credentials }),
				createRoom({ type: 'p', name: `room3-${Date.now()}.${Random.id()}` }),
			]);
			group = response1.body.group;
			channel = response2.body.channel;
			group1 = response3.body.group;
		});

		this.afterAll(async () => {
			await Promise.all([
				deleteRoom({ type: 'p', roomId: group._id }),
				deleteRoom({ type: 'c', roomId: channel._id }),
				deleteRoom({ type: 'p', roomId: group1._id }),
			]);
			await Promise.all([deleteUser(user1), deleteUser(user2)]);
		});

		it('should not add users from group which is not accessible by current user', async () => {
			await request
				.post(api('commands.run'))
				.set(user2Credentials)
				.send({
					roomId: channel._id,
					command: 'invite-all-from',
					params: `#${group.name}`,
					msg: {
						_id: Random.id(),
						rid: channel._id,
						msg: `invite-all-from #${group.name}`,
					},
					triggerId: Random.id(),
				})
				.expect(200)
				.expect(async (res) => {
					expect(res.body).to.have.a.property('success', true);
				});

			await request
				.get(api('channels.members'))
				.query({ roomId: channel._id })
				.set(user2Credentials)
				.expect(200)
				.expect((res) => {
					const isUser1Added = res.body.members.some((member: IUser) => member.username === user1.username);
					expect(isUser1Added).to.be.false;
				});
		});

		it('should not add users to a room that is not accessible by the current user', async () => {
			await request
				.post(api('commands.run'))
				.set(user1Credentials)
				.send({
					roomId: group1._id,
					command: 'invite-all-from',
					params: `#${group.name}`,
					msg: {
						_id: Random.id(),
						rid: group1._id,
						msg: `invite-all-from #${group.name}`,
					},
					triggerId: Random.id(),
				})
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.a.property('error', 'unauthorized');
				});
		});

		it('should add users from group which is accessible by current user', async () => {
			await request
				.post(api('groups.invite'))
				.set(user1Credentials)
				.send({
					roomId: group._id,
					userId: user2._id,
				})
				.expect(200);

			await request
				.post(api('commands.run'))
				.set(user2Credentials)
				.send({
					roomId: channel._id,
					command: 'invite-all-from',
					params: `#${group.name}`,
					msg: {
						_id: Random.id(),
						rid: channel._id,
						msg: `invite-all-from #${group.name}`,
					},
					triggerId: Random.id(),
				})
				.expect(200)
				.expect(async (res) => {
					expect(res.body).to.have.a.property('success', true);
				});

			await request
				.get(api('channels.members'))
				.set(user2Credentials)
				.query({ roomId: channel._id })
				.expect(200)
				.expect((res) => {
					const isUser1Added = res.body.members.some((member: IUser) => member.username === user1.username);
					expect(isUser1Added).to.be.true;
				});
		});
	});
});

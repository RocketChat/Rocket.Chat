import type { Credentials } from '@rocket.chat/api-client';
import type { IOmnichannelRoom, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { api, credentials, getCredentials, methodCall, methodCallAnon, request } from '../../data/api-data';
import { closeOmnichannelRoom, createAgent, createLivechatRoom, createVisitor, makeAgentAvailable } from '../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

describe('Meteor.methods', () => {
	before((done) => getCredentials(done));

	describe('[@listCustomUserStatus]', () => {
		it('should fail if not logged in', async () => {
			const res = await request
				.post(methodCall('listCustomUserStatus'))
				.send({
					message: JSON.stringify({
						method: 'listCustomUserStatus',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should return custom status for the current user', async () => {
			const res = await request
				.post(methodCall('listCustomUserStatus'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'listCustomUserStatus',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.a.property('success', true);
			expect(res.body).to.have.a.property('message').that.is.a('string');

			const data = JSON.parse(res.body.message);
			expect(data).to.have.a.property('result').that.is.an('array');
		});
	});

	describe('[@permissions:get]', () => {
		const date = {
			$date: new Date().getTime(),
		};

		it('should fail if not logged in', async () => {
			const res = await request
				.post(methodCall('permissions:get'))
				.send({
					message: JSON.stringify({
						method: 'permissions/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should return all permissions', async () => {
			const res = await request
				.post(methodCall('permissions:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'permissions/get',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.a.property('success', true);
			expect(res.body).to.have.a.property('message').that.is.a('string');

			const data = JSON.parse(res.body.message);
			expect(data).to.have.a.property('result').that.is.an('array');
			expect(data.result.length).to.be.above(1);
		});

		it('should return all permissions after the given date', async () => {
			const res = await request
				.post(methodCall('permissions:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'permissions/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.a.property('success', true);
			expect(res.body).to.have.a.property('message').that.is.a('string');

			const data = JSON.parse(res.body.message);
			expect(data).to.have.a.property('result').that.is.an('object');
			expect(data.result).to.have.a.property('update').that.is.an('array');
		});
	});

	describe('[@public-settings:get]', () => {
		const date = {
			$date: new Date().getTime(),
		};

		it('should fail if not logged in', async () => {
			const res = await request
				.post(methodCall('public-settings:get'))
				.send({
					message: JSON.stringify({
						method: 'public-settings/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should return the list of public settings', async () => {
			const res = await request
				.post(methodCall('public-settings:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'public-settings/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.a.property('success', true);
			expect(res.body).to.have.a.property('message').that.is.a('string');

			const data = JSON.parse(res.body.message);
			expect(data).to.have.a.property('result').that.is.an('object');
		});
	});

	describe('[@private-settings:get]', () => {
		const date = {
			$date: 0,
		};

		after(() =>
			Promise.all([
				updatePermission('view-privileged-setting', ['admin']),
				updatePermission('edit-privileged-setting', ['admin']),
				updatePermission('manage-selected-settings', ['admin']),
			]),
		);

		it('should fail if not logged in', async () => {
			const res = await request
				.post(methodCall('private-settings:get'))
				.send({
					message: JSON.stringify({
						method: 'private-settings/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should return nothing when user doesnt have any permission', (done) => {
			void updatePermission('view-privileged-setting', [])
				.then(() => updatePermission('edit-privileged-setting', []))
				.then(() => updatePermission('manage-selected-settings', []))
				.then(() => {
					void request
						.post(methodCall('private-settings:get'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'private-settings/get',
								params: [date],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('array');
							expect(data.result.length).to.be.equal(0);
						})
						.end(done);
				});
		});

		it('should return properties when user has any related permissions', async () => {
			await updatePermission('view-privileged-setting', ['admin']);

			const res = await request
				.post(methodCall('private-settings:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'private-settings/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.a.property('success', true);
			expect(res.body).to.have.a.property('message').that.is.a('string');

			const data = JSON.parse(res.body.message);
			expect(data).to.have.a.property('result').that.is.an('object');
			expect(data.result).to.have.a.property('update').that.is.an('array');
			expect(data.result.update.length).to.not.equal(0);
		});

		it('should return properties when user has all related permissions', (done) => {
			void updatePermission('view-privileged-setting', ['admin'])
				.then(() => updatePermission('edit-privileged-setting', ['admin']))
				.then(() => updatePermission('manage-selected-settings', ['admin']))
				.then(() => {
					void request
						.post(methodCall('private-settings:get'))
						.set(credentials)
						.send({
							message: JSON.stringify({
								method: 'private-settings/get',
								params: [date],
								id: 'id',
								msg: 'method',
							}),
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res) => {
							expect(res.body).to.have.a.property('success', true);
							expect(res.body).to.have.a.property('message').that.is.a('string');

							const data = JSON.parse(res.body.message);
							expect(data).to.have.a.property('result').that.is.an('object');
							expect(data.result).to.have.a.property('update').that.is.an('array');
							expect(data.result.update.length).to.not.equal(0);
						})
						.end(done);
				});
		});
	});

	describe('[@subscriptions:get]', () => {
		const date = {
			$date: new Date().getTime(),
		};

		it('should fail if not logged in', async () => {
			const res = await request
				.post(methodCall('subscriptions:get'))
				.send({
					message: JSON.stringify({
						method: 'subscriptions/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should return all subscriptions', async () => {
			const res = await request
				.post(methodCall('subscriptions:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'subscriptions/get',
						params: [],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.a.property('success', true);
			expect(res.body).to.have.a.property('message').that.is.a('string');

			const data = JSON.parse(res.body.message);
			expect(data).to.have.a.property('result').that.is.an('array');
			expect(data.result.length).to.be.above(1);
		});

		it('should return all subscriptions after the given date', async () => {
			const res = await request
				.post(methodCall('subscriptions:get'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'subscriptions/get',
						params: [date],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			expect(res.body).to.have.a.property('success', true);
			expect(res.body).to.have.a.property('message').that.is.a('string');

			const data = JSON.parse(res.body.message);
			expect(data).to.have.a.property('result').that.is.an('object');
			expect(data.result).to.have.a.property('update').that.is.an('array');
		});
	});

	describe('[@registerUser]', () => {
		before(() => updateSetting('Accounts_AllowAnonymousRead', true));
		after(() => updateSetting('Accounts_AllowAnonymousRead', false));

		it('should not register a user without an email', async () => {
			const res = await request
				.post(methodCallAnon('registerUser'))
				.send({
					message: JSON.stringify({ msg: 'method', id: 'id', method: 'registerUser', params: [{ email: null }] }),
				})
				.expect('Content-Type', 'application/json')
				.expect(400);

			const data = JSON.parse(res.body.message);
			expect(data).to.have.property('error');
			expect(data).to.not.have.property('result');
		});

		it('should no longer expose the Accounts_AllowAnonymousWrite setting', async () => {
			await request.get(api('settings/Accounts_AllowAnonymousWrite')).set(credentials).expect(400);
		});
	});

	describe('[@getRoomByTypeAndName]', () => {
		let testUser: TestUser<IUser>;
		let testUser2: TestUser<IUser>;
		let testUserCredentials: Credentials;
		let dmId: IRoom['_id'];
		let room: IRoom;
		let privateRoom: IRoom;

		before(async () => {
			testUser = await createUser();
			testUser2 = await createUser();
			testUserCredentials = await login(testUser.username, password);
		});

		before(async () => {
			room = (
				await createRoom({
					type: 'c',
					name: `channel.test.${Date.now()}-${Math.random()}`,
				})
			).body.channel;
		});

		before('create direct conversation with user', (done) => {
			void request
				.post(methodCall('createDirectMessage'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'createDirectMessage',
						params: [testUser2.username],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((_err, res) => {
					const result = JSON.parse(res.body.message);
					expect(result.result).to.be.an('object');
					expect(result.result).to.have.property('rid').that.is.an('string');

					dmId = result.result.rid;
					done();
				});
		});

		before(async () => {
			privateRoom = (
				await createRoom({
					type: 'p',
					name: `private.test.${Date.now()}-${Math.random()}`,
				})
			).body.group;
		});

		after(async () => {
			await Promise.all([
				deleteRoom({ type: 'd', roomId: dmId }),
				deleteRoom({ type: 'c', roomId: room._id }),
				deleteRoom({ type: 'p', roomId: privateRoom._id }),
				deleteUser(testUser),
				deleteUser(testUser2),
				updateSetting('Accounts_AllowAnonymousRead', false),
			]);
		});

		it('should throw error when anonymous user tries to read private channel with anonymous read enabled', async () => {
			await updateSetting('Accounts_AllowAnonymousRead', true);

			const payload = {
				message: JSON.stringify({
					msg: 'method',
					id: '2',
					method: 'getRoomByTypeAndName',
					params: ['p', privateRoom.name],
				}),
			};

			const res = await request.post(methodCallAnon('getRoomByTypeAndName')).send(payload);

			expect(res.body).to.have.property('message');
			const parsedMessage = JSON.parse(res.body.message);

			expect(parsedMessage).to.have.property('error');
			expect(parsedMessage.error).to.have.property('error');
			expect(parsedMessage.error.error).to.equal('error-invalid-user');

			await updateSetting('Accounts_AllowAnonymousRead', false);
		});

		it("should throw an error if the user isn't logged in", (done) => {
			void request
				.post(methodCall('getRoomByTypeAndName'))
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', dmId],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((_err, res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
					expect(res.body.message).to.be.equal('You must be logged in to do this.');
					done();
				});
		});

		it("should throw an error if name isn't provided", (done) => {
			void request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', null],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((_err, res) => {
					expect(res.body).to.have.property('message');

					const parsedResponse = JSON.parse(res.body.message);

					expect(parsedResponse).to.have.property('error');
					expect(parsedResponse.error).to.have.property('error');
					expect(parsedResponse.error.error).to.equal('error-invalid-room');
					done();
				});
		});

		it("should throw an error if type isn't provided", (done) => {
			void request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: [null, dmId],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((_err, res) => {
					expect(res.body).to.have.property('message');

					const parsedResponse = JSON.parse(res.body.message);

					expect(parsedResponse).to.have.property('error');
					expect(parsedResponse.error).to.have.property('error');
					expect(parsedResponse.error.error).to.equal('error-invalid-room');
					done();
				});
		});

		it("should throw an error if the user doesn't have access to the room", (done) => {
			void request
				.post(methodCall('getRoomByTypeAndName'))
				.set(testUserCredentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', dmId],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((_err, res) => {
					expect(res.body).to.have.property('message');

					const parsedResponse = JSON.parse(res.body.message);
					expect(parsedResponse).to.have.property('error');
					expect(parsedResponse.error).to.have.property('error');
					expect(parsedResponse.error.error).to.equal('error-no-permission');
					done();
				});
		});

		it("should throw an error if the room doesn't exist", (done) => {
			void request
				.post(methodCall('getRoomByTypeAndName'))
				.set(testUserCredentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', 'testId'],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((_err, res) => {
					expect(res.body).to.have.property('message');

					const parsedResponse = JSON.parse(res.body.message);

					expect(parsedResponse).to.have.property('error');
					expect(parsedResponse.error).to.have.property('error');
					expect(parsedResponse.error.error).to.equal('error-invalid-room');
					done();
				});
		});

		it('should return the room object for a Public Channel if anonymous read is enabled', async () => {
			await updateSetting('Accounts_AllowAnonymousRead', true);

			const res = await request.post(methodCallAnon('getRoomByTypeAndName')).send({
				message: JSON.stringify({
					method: 'getRoomByTypeAndName',
					params: ['c', room._id],
					id: 'id',
					msg: 'method',
				}),
			});

			expect(res.body.success).to.equal(true);
			const parsedResponse = JSON.parse(res.body.message);
			expect(parsedResponse.result.name).to.equal(room.name);

			await updateSetting('Accounts_AllowAnonymousRead', false);
		});

		it('should return the room object for a DM', (done) => {
			void request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', dmId],
						id: 'id',
						msg: 'method',
					}),
				})
				.end((_err, res) => {
					expect(res.body.success).to.equal(true);
					const parsedResponse = JSON.parse(res.body.message);
					expect(parsedResponse.result._id).to.equal(dmId);
					done();
				});
		});

		it('should return the room object for a DM addressed by username', async () => {
			const res = await request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', testUser2.username],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200);

			const parsedResponse = JSON.parse(res.body.message);
			expect(parsedResponse.result._id).to.equal(dmId);
			expect(parsedResponse.result.t).to.equal('d');
		});

		it('should throw error when the DM addressed by username does not exist', async () => {
			const stranger = await createUser();

			const res = await request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', stranger.username],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(400);

			const parsedResponse = JSON.parse(res.body.message);
			expect(parsedResponse).to.have.property('error');
			expect(parsedResponse.error.error).to.equal('error-invalid-room');

			await deleteUser(stranger);
		});

		it('should return the room object for a group DM addressed by a comma separated username list', async () => {
			const usernames = `${testUser.username},${testUser2.username}`;

			const groupDm = (await request.post(api('im.create')).set(credentials).send({ usernames }).expect(200)).body.room;

			const res = await request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', usernames],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200);

			const parsedResponse = JSON.parse(res.body.message);
			expect(parsedResponse.result._id).to.equal(groupDm._id);

			await deleteRoom({ type: 'd', roomId: groupDm._id });
		});

		it('should keep resolving a DM by username after the other member is renamed', async () => {
			const renamedUser = await createUser();
			const renamedDmId = (await request.post(api('im.create')).set(credentials).send({ username: renamedUser.username }).expect(200)).body
				.room._id;

			const username = `renamed.${Date.now()}`;
			await request.post(api('users.update')).set(credentials).send({ userId: renamedUser._id, data: { username } }).expect(200);

			const res = await request
				.post(methodCall('getRoomByTypeAndName'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'getRoomByTypeAndName',
						params: ['d', username],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect(200);

			const parsedResponse = JSON.parse(res.body.message);
			expect(parsedResponse.result._id).to.equal(renamedDmId);

			await deleteRoom({ type: 'd', roomId: renamedDmId });
			await deleteUser(renamedUser);
		});
	});

	(IS_EE ? describe : describe.skip)('[@auditGetAuditions] EE', () => {
		let testUser: TestUser<IUser>;
		let testUserCredentials: Credentials;

		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
		const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

		before('create test user', async () => {
			testUser = await createUser();
			testUserCredentials = await login(testUser.username, password);
		});

		before('generate audits data', async () => {
			await request.post(api('audit.messages')).set(credentials).send({
				type: '',
				msg: 'test1234',
				startDate,
				endDate,
				rid: 'GENERAL',
				users: [],
			});
		});

		after(() => Promise.all([deleteUser(testUser)]));

		it('should fail if the user does not have permissions to get auditions', async () => {
			await request
				.get(api('audit.auditions'))
				.set(testUserCredentials)
				.query({ startDate, endDate })
				.expect('Content-Type', 'application/json')
				.expect(403)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
				});
		});

		it('should not return more user data than necessary - e.g. passwords, hashes, tokens', async () => {
			await request
				.get(api('audit.auditions'))
				.set(credentials)
				.query({ startDate, endDate })
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', true);
					expect(res.body).to.have.a.property('auditions').that.is.an('array');
					expect(res.body.auditions.length).to.be.greaterThan(0);
					res.body.auditions.forEach((item: any) => {
						expect(item).to.have.all.keys('_id', 'ts', 'results', 'u', 'fields', '_updatedAt');
						expect(item.u).to.not.have.property('services');
						expect(item.u).to.not.have.property('roles');
						expect(item.u).to.not.have.property('lastLogin');
						expect(item.u).to.not.have.property('statusConnection');
						expect(item.u).to.not.have.property('emails');
					});
				});
		});
	});

	describe('[@joinRoom]', async () => {
		let room: IOmnichannelRoom;
		let user: TestUser<IUser>;
		let userCredentials: Credentials;

		before(async () => {
			await updateSetting('Livechat_enabled', true);
			await createAgent();
			await makeAgentAvailable();

			const visitor = await createVisitor();
			room = await createLivechatRoom(visitor.token);
			await closeOmnichannelRoom(room._id);

			user = await createUser();
			await createAgent(user.username);
			userCredentials = await login(user.username, password);
		});

		after(() => Promise.all([deleteUser(user), updateSetting('Livechat_enabled', false)]));

		it('should not allow an agent to join a closed livechat room', async () => {
			await request
				.post(api('rooms.join'))
				.set(userCredentials)
				.send({ roomId: room._id })
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.a.property('success', false);
					expect(res.body).to.have.a.property('errorType', 'room-closed');
				});
		});
	});
});

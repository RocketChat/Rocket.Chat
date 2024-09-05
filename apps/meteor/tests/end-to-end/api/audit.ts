import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { expect } from 'chai';
import EJSON from 'ejson';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials, methodCall } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import { createUser, deleteUser, login } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Audit Panel', () => {
	let testChannel: IRoom;
	let testPrivateChannel: IRoom;
	let dummyUser: IUser;
	let auditor: IUser;
	let auditorCredentials: Credentials;
	before((done) => getCredentials(done));
	before(async () => {
		testChannel = (await createRoom({ type: 'c', name: `chat.api-test-${Date.now()}` })).body.channel;
		testPrivateChannel = (await createRoom({ type: 'p', name: `chat.api-test-${Date.now()}` })).body.group;
		dummyUser = await createUser();
		auditor = await createUser({ roles: ['user', 'auditor'] });

		auditorCredentials = await login(auditor.username, password);
	});
	after(async () => {
		await deleteRoom({ type: 'c', roomId: testChannel._id });
		await deleteUser({ _id: dummyUser._id });
		await deleteUser({ _id: auditor._id });
		await deleteRoom({ type: 'p', roomId: testPrivateChannel._id });
	});

	describe('audit/rooms.members [no permissions]', () => {
		before(async () => {
			await updatePermission('view-members-list-all-rooms', []);
		});
		after(async () => {
			await updatePermission('view-members-list-all-rooms', ['admin', 'auditor']);
		});
		it('should fail if user does not have view-members-list-all-rooms permission', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: 'GENERAL',
				})
				.expect(403);
			await request
				.get(api('audit/rooms.members'))
				.set(auditorCredentials)
				.query({
					roomId: 'GENERAL',
				})
				.expect(403);
		});
	});

	describe('audit/rooms.members', () => {
		it('should fail if user is not logged in', async () => {
			await request
				.get(api('audit/rooms.members'))
				.query({
					roomId: 'GENERAL',
				})
				.expect(401);
		});
		it('should fail if roomId is invalid', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: Random.id(),
				})
				.expect(404);
		});
		it('should fail if roomId is not present', async () => {
			await request.get(api('audit/rooms.members')).set(credentials).query({}).expect(400);
		});
		it('should fail if roomId is an empty string', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: '',
				})
				.expect(400);
		});
		it('should fetch the members of a room', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
				});
		});
		it('should persist a log entry', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
				});

			await request
				.post(methodCall('auditGetAuditions'))
				.set(credentials)
				.send({
					message: EJSON.stringify({
						method: 'auditGetAuditions',
						params: [{ startDate: new Date(Date.now() - 86400000), endDate: new Date() }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const message = JSON.parse(res.body.message);

					expect(message.result).to.be.an('array').with.lengthOf.greaterThan(1);
					const entry = message.result.find((audition: any) => {
						return audition.fields.rids.includes(testChannel._id);
					});
					expect(entry).to.have.property('u').that.is.an('object').deep.equal({
						_id: 'rocketchat.internal.admin.test',
						username: 'rocketchat.internal.admin.test',
						name: 'RocketChat Internal Admin Test',
					});
					expect(entry).to.have.property('fields').that.is.an('object');
					const { fields } = entry;

					expect(fields).to.have.property('msg', 'Room_members_list');
					expect(fields).to.have.property('rids').that.is.an('array').with.lengthOf(1);
				});
		});
		it('should fetch the members of a room with offset and count', async () => {
			await request
				.post(methodCall('addUsersToRoom'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'addUsersToRoom',
						params: [{ rid: testChannel._id, users: [dummyUser.username] }],
						id: 'id',
						msg: 'method',
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});

			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					offset: 1,
					count: 1,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
					expect(res.body.members[0].username).to.be.equal(dummyUser.username);
					expect(res.body.total).to.be.equal(2);
					expect(res.body.offset).to.be.equal(1);
					expect(res.body.count).to.be.equal(1);
				});
		});

		it('should filter by username', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: dummyUser.username,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
					expect(res.body.members[0].username).to.be.equal(dummyUser.username);
				});
		});

		it('should filter by user name', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: dummyUser.name,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(1);
					expect(res.body.members[0].name).to.be.equal(dummyUser.name);
				});
		});

		it('should sort by username', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					sort: '{ "username": -1 }',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(2);
					expect(res.body.members[1].username).to.be.equal('rocketchat.internal.admin.test');
					expect(res.body.members[0].username).to.be.equal(dummyUser.username);
				});
		});

		it('should not allow nosqlinjection on filter param', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: '{ "$ne": "rocketchat.internal.admin.test" }',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members).to.have.lengthOf(0);
				});

			await request
				.get(api('audit/rooms.members'))
				.set(credentials)
				.query({
					roomId: testChannel._id,
					filter: { username: 'rocketchat.internal.admin.test' },
				})
				.expect(400);
		});

		it('should allow to fetch info even if user is not in the room', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(auditorCredentials)
				.query({
					roomId: testChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members[0].username).to.be.equal('rocketchat.internal.admin.test');
					expect(res.body.members[1].username).to.be.equal(dummyUser.username);
					expect(res.body.total).to.be.equal(2);
				});
		});

		it('should allow to fetch info from private rooms', async () => {
			await request
				.get(api('audit/rooms.members'))
				.set(auditorCredentials)
				.query({
					roomId: testPrivateChannel._id,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body.members).to.be.an('array');
					expect(res.body.members[0].username).to.be.equal('rocketchat.internal.admin.test');
					expect(res.body.total).to.be.equal(1);
				});
		});
	});
});

import type { Credentials } from '@rocket.chat/api-client';
import type { IInvite, IInviteSummary, IPermission, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('Invites', () => {
	let testInviteID: IInvite['_id'];
	let testInviteToken: IInvite['inviteToken'];

	before((done) => getCredentials(done));
	describe('POST [/findOrCreateInvite]', () => {
		it('should fail if not logged in', async () => {
			const res = await request
				.post(api('findOrCreateInvite'))
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should fail if invalid roomid', async () => {
			const res = await request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'invalid',
					days: 1,
					maxUses: 10,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-invalid-room');
		});

		it('should create an invite for GENERAL', async () => {
			const res = await request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('days', 1);
			expect(res.body).to.have.property('maxUses', 10);
			expect(res.body).to.have.property('uses');
			expect(res.body).to.have.property('_id');
			expect(res.body).to.have.property('inviteToken');
			expect(res.body.inviteToken).to.be.a('string');
			testInviteID = res.body._id;
			testInviteToken = res.body.inviteToken;
		});

		it('should return an existing invite for GENERAL', async () => {
			const res = await request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('days', 1);
			expect(res.body).to.have.property('maxUses', 10);
			expect(res.body).to.have.property('uses');
			expect(res.body).to.have.property('_id', testInviteID);
			expect(res.body).to.have.property('inviteToken', testInviteToken);
		});
	});

	describe('GET [/listInvites]', () => {
		it('should fail if not logged in', async () => {
			const res = await request.get(api('listInvites')).expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should return the existing invite for GENERAL without invite credentials', async () => {
			const res = await request.get(api('listInvites')).set(credentials).expect(200);

			const invite = res.body.find((invite: IInviteSummary) => invite._id === testInviteID);
			expect(invite).to.exist;
			expect(invite).to.not.have.property('inviteToken');
			expect(invite).to.not.have.property('url');
		});
	});

	describe('Invite creation and management permissions', () => {
		let originalPermissions: Pick<IPermission, '_id' | 'roles'>[] = [];
		let creator: TestUser<IUser>;
		let manager: TestUser<IUser>;
		let creatorCredentials: Credentials;
		let managerCredentials: Credentials;
		let roomId: string;
		let inviteId: string;

		before(async () => {
			const permissionResponse = await request.get(api('permissions.listAll')).set(credentials).expect(200);
			originalPermissions = permissionResponse.body.update
				.filter(({ _id }: IPermission) => _id === 'create-invite-links' || _id === 'manage-invite-links')
				.map(({ _id, roles }: IPermission) => ({ _id, roles }));
			expect(originalPermissions).to.have.lengthOf(2);
			await request
				.post(api('permissions.update'))
				.set(credentials)
				.send({
					permissions: originalPermissions.map(({ _id, roles }) => ({
						_id,
						roles: [...roles.filter((role) => role !== 'user' && role !== 'bot'), _id === 'create-invite-links' ? 'user' : 'bot'],
					})),
				})
				.expect(200);
			creator = await createUser({ roles: ['user'] });
			manager = await createUser({ roles: ['bot'], joinDefaultChannels: false });
			creatorCredentials = await login(creator.username, password);
			managerCredentials = await login(manager.username, password);
			const room = await createRoom({ type: 'p', name: `private-invite-test-${Date.now()}` });
			roomId = room.body.group._id;
			const invite = await request.post(api('findOrCreateInvite')).set(credentials).send({ rid: roomId, days: 1, maxUses: 10 }).expect(200);
			inviteId = invite.body._id;
		});

		after(async () => {
			try {
				await Promise.all([
					roomId ? deleteRoom({ type: 'p', roomId }) : undefined,
					creator ? deleteUser(creator) : undefined,
					manager ? deleteUser(manager) : undefined,
				]);
			} finally {
				if (originalPermissions.length) {
					await request.post(api('permissions.update')).set(credentials).send({ permissions: originalPermissions }).expect(200);
				}
			}
		});

		it('should deny workspace-wide listing and removal to a creator-only user', async () => {
			await request.get(api('listInvites')).set(creatorCredentials).expect(403);
			await request
				.delete(api(`removeInvite/${inviteId}`))
				.set(creatorCredentials)
				.expect(403);
		});

		it('should deny token retrieval for a private room the creator has not joined', async () => {
			await request.post(api('findOrCreateInvite')).set(creatorCredentials).send({ rid: roomId, days: 1, maxUses: 10 }).expect(400);
		});

		it('should allow scoped creation after the creator joins the room', async () => {
			await request.post(api('groups.invite')).set(credentials).send({ roomId, userId: creator._id }).expect(200);
			const response = await request
				.post(api('findOrCreateInvite'))
				.set(creatorCredentials)
				.send({ rid: roomId, days: 1, maxUses: 10 })
				.expect(200);
			expect(response.body.inviteToken).to.be.a('string');
			await request
				.delete(api(`removeInvite/${response.body._id}`))
				.set(credentials)
				.expect(200);
		});

		it('should let a manager list and remove invites without room membership', async () => {
			const response = await request.get(api('listInvites')).set(managerCredentials).expect(200);
			const invite = response.body.find((invite: IInviteSummary) => invite._id === inviteId);
			expect(invite).to.exist;
			expect(invite).to.not.have.property('inviteToken');
			expect(invite).to.not.have.property('url');
			await request.post(api('findOrCreateInvite')).set(managerCredentials).send({ rid: roomId, days: 1, maxUses: 10 }).expect(400);
			await request
				.delete(api(`removeInvite/${inviteId}`))
				.set(managerCredentials)
				.expect(200);
			await request.get(api('groups.info')).set(managerCredentials).query({ roomId }).expect(400);
		});
	});

	describe('POST [/useInviteToken]', () => {
		it('should fail if not logged in', async () => {
			const res = await request.post(api('useInviteToken')).expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should fail if invalid token', async () => {
			const res = await request
				.post(api('useInviteToken'))
				.set(credentials)
				.send({
					token: 'invalid',
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-invalid-token');
		});

		it('should fail if missing token', async () => {
			const res = await request.post(api('useInviteToken')).set(credentials).send({}).expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'invalid-params');
		});

		it('should use the existing invite for GENERAL with inviteToken', async () => {
			const res = await request.post(api('useInviteToken')).set(credentials).send({ token: testInviteToken }).expect(200);

			expect(res.body).to.have.property('success', true);
		});

		it('should fail when using _id as token', async () => {
			const res = await request
				.post(api('useInviteToken'))
				.set(credentials)
				.send({
					token: testInviteID,
				})
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'error-invalid-token');
		});
	});

	describe('POST [/validateInviteToken]', () => {
		it('should warn if invalid token', async () => {
			const res = await request
				.post(api('validateInviteToken'))
				.set(credentials)
				.send({
					token: 'invalid',
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('valid', false);
		});

		it('should succeed when valid inviteToken', async () => {
			const res = await request.post(api('validateInviteToken')).set(credentials).send({ token: testInviteToken }).expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('valid', true);
		});

		it('should fail when using _id as token', async () => {
			const res = await request
				.post(api('validateInviteToken'))
				.set(credentials)
				.send({
					token: testInviteID,
				})
				.expect(200);

			expect(res.body).to.have.property('success', true);
			expect(res.body).to.have.property('valid', false);
		});
	});

	describe('POST [/useInviteToken] - banned user', () => {
		let room: IRoom;
		let bannedUser: TestUser<IUser>;
		let bannedUserCredentials: Credentials;
		let banTestInviteToken: IInvite['inviteToken'];

		before(async () => {
			bannedUser = await createUser();
			bannedUserCredentials = await login(bannedUser.username, password);

			const result = await createRoom({ type: 'p', name: `invite-ban-test-${Date.now()}` });
			room = result.body.group;

			// Add user then ban them
			await request.post(api('groups.invite')).set(credentials).send({ roomId: room._id, userId: bannedUser._id }).expect(200);
			await request.post(api('rooms.banUser')).set(credentials).send({ roomId: room._id, userId: bannedUser._id }).expect(200);

			// Create invite link for the room
			const invite = await request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({ rid: room._id, days: 1, maxUses: 10 })
				.expect(200);
			banTestInviteToken = invite.body.inviteToken;
		});

		after(async () => {
			await deleteRoom({ type: 'p', roomId: room._id });
			await deleteUser(bannedUser);
		});

		it('should fail if user is banned from the room', async () => {
			await request
				.post(api('useInviteToken'))
				.set(bannedUserCredentials)
				.send({ token: banTestInviteToken })
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-user-is-banned');
				});
		});

		it('should succeed after the user is unbanned', async () => {
			await request.post(api('rooms.unbanUser')).set(credentials).send({ roomId: room._id, userId: bannedUser._id }).expect(200);

			await request
				.post(api('useInviteToken'))
				.set(bannedUserCredentials)
				.send({ token: banTestInviteToken })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.have.property('rid', room._id);
				});
		});
	});

	describe('DELETE [/removeInvite]', () => {
		it('should fail if not logged in', async () => {
			const res = await request.delete(api(`removeInvite/${testInviteID}`)).expect(401);

			expect(res.body).to.have.property('status', 'error');
			expect(res.body).to.have.property('message');
		});

		it('should fail if invalid token', async () => {
			const res = await request.delete(api('removeInvite/invalid')).set(credentials).expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'invalid-invitation-id');
		});

		it('should succeed when valid token', async () => {
			const res = await request
				.delete(api(`removeInvite/${testInviteID}`))
				.set(credentials)
				.expect(200);

			expect(res.body).to.equal(true);
		});

		it('should fail when deleting the same invite again', async () => {
			const res = await request
				.delete(api(`removeInvite/${testInviteID}`))
				.set(credentials)
				.expect(400);

			expect(res.body).to.have.property('success', false);
			expect(res.body).to.have.property('errorType', 'invalid-invitation-id');
		});
	});
});

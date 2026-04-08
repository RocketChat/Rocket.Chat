import type { Credentials } from '@rocket.chat/api-client';
import type { IInvite, IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('Invites', () => {
	let testInviteID: IInvite['_id'];

	before((done) => getCredentials(done));
	describe('POST [/findOrCreateInvite]', () => {
		it('should fail if not logged in', (done) => {
			void request
				.post(api('findOrCreateInvite'))
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if invalid roomid', (done) => {
			void request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'invalid',
					days: 1,
					maxUses: 10,
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-room');
				})
				.end(done);
		});

		it('should create an invite for GENERAL', (done) => {
			void request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('days', 1);
					expect(res.body).to.have.property('maxUses', 10);
					expect(res.body).to.have.property('uses');
					expect(res.body).to.have.property('_id');
					testInviteID = res.body._id;
				})
				.end(done);
		});

		it('should return an existing invite for GENERAL', (done) => {
			void request
				.post(api('findOrCreateInvite'))
				.set(credentials)
				.send({
					rid: 'GENERAL',
					days: 1,
					maxUses: 10,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('days', 1);
					expect(res.body).to.have.property('maxUses', 10);
					expect(res.body).to.have.property('uses');
					expect(res.body).to.have.property('_id', testInviteID);
				})
				.end(done);
		});
	});

	describe('GET [/listInvites]', () => {
		it('should fail if not logged in', (done) => {
			void request
				.get(api('listInvites'))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should return the existing invite for GENERAL', (done) => {
			void request
				.get(api('listInvites'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body[0]).to.have.property('_id', testInviteID);
				})
				.end(done);
		});
	});

	describe('POST [/useInviteToken]', () => {
		it('should fail if not logged in', (done) => {
			void request
				.post(api('useInviteToken'))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if invalid token', (done) => {
			void request
				.post(api('useInviteToken'))
				.set(credentials)
				.send({
					token: 'invalid',
				})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-invalid-token');
				})
				.end(done);
		});

		it('should fail if missing token', (done) => {
			void request
				.post(api('useInviteToken'))
				.set(credentials)
				.send({})
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-params');
				})
				.end(done);
		});

		it('should use the existing invite for GENERAL', (done) => {
			void request
				.post(api('useInviteToken'))
				.set(credentials)
				.send({
					token: testInviteID,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
	});

	describe('POST [/validateInviteToken]', () => {
		it('should warn if invalid token', (done) => {
			void request
				.post(api('validateInviteToken'))
				.set(credentials)
				.send({
					token: 'invalid',
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('valid', false);
				})
				.end(done);
		});

		it('should succeed when valid token', (done) => {
			void request
				.post(api('validateInviteToken'))
				.set(credentials)
				.send({
					token: testInviteID,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('valid', true);
				})
				.end(done);
		});
	});

	describe('POST [/useInviteToken] - banned user', () => {
		let room: IRoom;
		let bannedUser: TestUser<IUser>;
		let bannedUserCredentials: Credentials;
		let inviteId: IInvite['_id'];

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
			inviteId = invite.body._id;
		});

		after(async () => {
			await deleteRoom({ type: 'p', roomId: room._id });
			await deleteUser(bannedUser);
		});

		it('should fail if user is banned from the room', async () => {
			await request
				.post(api('useInviteToken'))
				.set(bannedUserCredentials)
				.send({ token: inviteId })
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
				.send({ token: inviteId })
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					expect(res.body).to.have.property('room').and.to.have.property('rid', room._id);
				});
		});
	});

	describe('DELETE [/removeInvite]', () => {
		it('should fail if not logged in', (done) => {
			void request
				.delete(api(`removeInvite/${testInviteID}`))
				.expect(401)
				.expect((res) => {
					expect(res.body).to.have.property('status', 'error');
					expect(res.body).to.have.property('message');
				})
				.end(done);
		});

		it('should fail if invalid token', (done) => {
			void request
				.delete(api('removeInvite/invalid'))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-invitation-id');
				})
				.end(done);
		});

		it('should succeed when valid token', (done) => {
			void request
				.delete(api(`removeInvite/${testInviteID}`))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.equal(true);
				})
				.end(done);
		});

		it('should fail when deleting the same invite again', (done) => {
			void request
				.delete(api(`removeInvite/${testInviteID}`))
				.set(credentials)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'invalid-invitation-id');
				})
				.end(done);
		});
	});
});

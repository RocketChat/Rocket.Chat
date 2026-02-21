import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, deleteUser, login } from '../../data/users.helper';

describe('[Rooms Ban]', () => {
	let testChannel: IRoom;
	let testUser: TestUser<IUser>;
	let testUserWithoutPermission: TestUser<IUser>;
	let testUserWithoutPermissionCredentials: Credentials;

	before(async () => {
		await getCredentials();

		// Create test users
		testUser = await createUser();
		testUserWithoutPermission = await createUser();

		await login(testUser.username, password);
		testUserWithoutPermissionCredentials = await login(testUserWithoutPermission.username, password);

		// Create test channel
		testChannel = (await createRoom({ type: 'c', name: `ban-test-channel-${Date.now()}` })).body.channel;

		// Add test user to the channel
		await request
			.post(api('channels.invite'))
			.set(credentials)
			.send({
				roomId: testChannel._id,
				userId: testUser._id,
			})
			.expect(200);

		// Ensure admin has remove-user permission
		await updatePermission('remove-user', ['admin', 'owner', 'moderator']);
	});

	after(async () => {
		await deleteRoom({ type: 'c', roomId: testChannel._id });
		await deleteUser(testUser);
		await deleteUser(testUserWithoutPermission);
	});

	describe('/rooms.ban', () => {
		it('should ban a user by userId', async () => {
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail when trying to ban an already banned user', async () => {
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-user-already-banned');
				});
		});

		it('should unban the user for subsequent tests', async () => {
			await request
				.post(api('rooms.unban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect(200);
		});

		it('should ban a user by username', async () => {
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail when neither userId nor username is provided', async () => {
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should fail when the caller does not have permission', async () => {
			// First unban the user so we can try to ban again
			await request
				.post(api('rooms.unban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect(200);

			// Try to ban without permission
			await request
				.post(api('rooms.ban'))
				.set(testUserWithoutPermissionCredentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				});
		});

		it('should fail when room does not exist', async () => {
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: 'invalid-room-id',
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should fail when user does not exist', async () => {
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: 'invalid-user-id',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-user-not-found');
				});
		});

		it('should fail when user is not in the room', async () => {
			// Create a new user that is not in the room
			const newUser = await createUser();

			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: newUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-user-not-in-room');
				});

			await deleteUser(newUser);
		});
	});

	describe('/rooms.unban', () => {
		before(async () => {
			// Ensure user is banned for unban tests
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				});
		});

		it('should unban a user by userId', async () => {
			await request
				.post(api('rooms.unban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail when trying to unban a user who is not banned', async () => {
			await request
				.post(api('rooms.unban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-user-not-banned');
				});
		});

		it('should unban a user by username', async () => {
			// First ban the user
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					username: testUser.username,
				})
				.expect(200);

			// Then unban by username
			await request
				.post(api('rooms.unban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					username: testUser.username,
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				});
		});

		it('should fail when neither userId nor username is provided', async () => {
			await request
				.post(api('rooms.unban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should fail when the caller does not have permission', async () => {
			// First ban the user
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect(200);

			// Try to unban without permission
			await request
				.post(api('rooms.unban'))
				.set(testUserWithoutPermissionCredentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
					expect(res.body).to.have.property('errorType', 'error-not-allowed');
				});

			// Clean up - unban the user
			await request
				.post(api('rooms.unban'))
				.set(credentials)
				.send({
					roomId: testChannel._id,
					userId: testUser._id,
				});
		});
	});

	describe('Banned user behavior', () => {
		let bannedUser: TestUser<IUser>;
		let bannedUserCredentials: Credentials;
		let publicChannel: IRoom;

		before(async () => {
			// Create a user and a public channel
			bannedUser = await createUser();
			bannedUserCredentials = await login(bannedUser.username, password);
			publicChannel = (await createRoom({ type: 'c', name: `ban-public-test-${Date.now()}` })).body.channel;

			// Add user to channel
			await request
				.post(api('channels.invite'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					userId: bannedUser._id,
				})
				.expect(200);

			// Ban the user
			await request
				.post(api('rooms.ban'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					userId: bannedUser._id,
				})
				.expect(200);
		});

		after(async () => {
			await deleteRoom({ type: 'c', roomId: publicChannel._id });
			await deleteUser(bannedUser);
		});

		it('should not show the room in the banned user subscription list', async () => {
			await request
				.get(api('subscriptions.get'))
				.set(bannedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const subscriptions = res.body.update || [];
					const roomSubscription = subscriptions.find((sub: { rid: string }) => sub.rid === publicChannel._id);
					expect(roomSubscription).to.be.undefined;
				});
		});

		it('should prevent banned user from joining the room again', async () => {
			await request
				.post(api('channels.join'))
				.set(bannedUserCredentials)
				.send({
					roomId: publicChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should prevent banned user from accessing room info', async () => {
			await request
				.get(api('rooms.info'))
				.set(bannedUserCredentials)
				.query({
					roomId: publicChannel._id,
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				});
		});

		it('should allow user to access room after being unbanned', async () => {
			// Unban the user
			await request
				.post(api('rooms.unban'))
				.set(credentials)
				.send({
					roomId: publicChannel._id,
					userId: bannedUser._id,
				})
				.expect(200);

			// User should now be able to see the room in subscriptions
			await request
				.get(api('subscriptions.get'))
				.set(bannedUserCredentials)
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
					const subscriptions = res.body.update || [];
					const roomSubscription = subscriptions.find((sub: { rid: string }) => sub.rid === publicChannel._id);
					expect(roomSubscription).to.not.be.undefined;
				});
		});
	});
});

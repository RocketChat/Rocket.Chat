import type { IRoom, IRoomNativeFederated, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { MatrixEvent, Room, RoomEmittedEvents } from 'matrix-js-sdk';
import { RoomStateEvent } from 'matrix-js-sdk';

import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { acceptRoomInvite, addUserToRoom, getRoomInfo, getSubscriptionByRoomId } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { getRequestConfig, createUser, deleteUser } from '../../../../../apps/meteor/tests/data/users.helper';
import type { TestUser, IRequestConfig } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { federationConfig } from '../helper/config';
import { SynapseClient } from '../helper/synapse-client';

function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
	const controller = new AbortController();

	const timeoutId = setTimeout(() => {
		controller.abort();
	}, ms);

	return fn(controller.signal).finally(() => {
		clearTimeout(timeoutId);
	});
}

const waitForRoomEvent = async (
	room: Room,
	eventType: RoomEmittedEvents,
	validateEvent: (event: MatrixEvent) => void,
	timeoutMs = 5000,
) => {
	return withTimeout(async (signal) => {
		return new Promise((resolve, reject) => {
			const listener = (event: MatrixEvent) => {
				validateEvent(event);
				resolve(true);
			};
			room.once(eventType, listener);
			signal.addEventListener('abort', () => {
				room.off(eventType, listener);
				reject(new Error('Aborted'));
			});
		});
	}, timeoutMs);
};

(IS_EE ? describe : describe.skip)('Federation DMs', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	// let rc1User1RequestConfig: IRequestConfig;
	let hs1AdminApp: SynapseClient;
	// let hs1User1App: SynapseClient;

	beforeAll(async () => {
		// Create admin request config for RC1
		rc1AdminRequestConfig = await getRequestConfig(
			federationConfig.rc1.url,
			federationConfig.rc1.adminUser,
			federationConfig.rc1.adminPassword,
		);

		// Create user1 in RC1 using federation config values
		await createUser(
			{
				username: federationConfig.rc1.additionalUser1.username,
				password: federationConfig.rc1.additionalUser1.password,
				email: `${federationConfig.rc1.additionalUser1.username}@rocket.chat`,
				name: federationConfig.rc1.additionalUser1.username,
			},
			rc1AdminRequestConfig,
		);

		// Create admin Synapse client for HS1
		hs1AdminApp = new SynapseClient(federationConfig.hs1.url, federationConfig.hs1.adminUser, federationConfig.hs1.adminPassword);
		await hs1AdminApp.initialize();
	});

	afterAll(async () => {
		if (hs1AdminApp) {
			await hs1AdminApp.close();
		}
		// if (hs1User1App) {
		// 	await hs1User1App.close();
		// }
	});

	describe('1:1 Direct Messages', () => {
		describe('Synapse as the resident server', () => {
			describe('Room list name validations', () => {
				let rcUser: TestUser<IUser>;
				let rcUserConfig: IRequestConfig;
				let hs1Room: Room;
				let subscriptionInvite: ISubscription;
				let rcRoom: IRoom;

				const userDm = `dm-federation-user-${Date.now()}`;
				const userDmId = `@${userDm}:${federationConfig.rc1.domain}`;
				const userDmName = `DM Federation User ${Date.now()}`;

				beforeAll(async () => {
					// create both RC and Synapse users
					rcUser = await createUser(
						{
							username: userDm,
							password: 'random',
							email: `${userDm}}@rocket.chat`,
							name: userDmName,
						},
						rc1AdminRequestConfig,
					);

					rcUserConfig = await getRequestConfig(federationConfig.rc1.url, rcUser.username, 'random');
				});

				afterAll(async () => {
					// delete both RC and Synapse users
					await deleteUser(rcUser, {}, rc1AdminRequestConfig);
				});

				it('should create a DM and invite user from rc', async () => {
					hs1Room = (await hs1AdminApp.createDM([userDmId])) as Room;

					expect(hs1Room).toHaveProperty('roomId');

					await retry('this is an async operation, so we need to wait for the room to be created in RC', async () => {
						const roomsResponse = await rcUserConfig.request.get(api('rooms.get')).set(rcUserConfig.credentials).expect(200);

						expect(roomsResponse.body).toHaveProperty('success', true);
						expect(roomsResponse.body).toHaveProperty('update');

						rcRoom = roomsResponse.body.update.find((room: IRoomNativeFederated) => room.federation.mrid === hs1Room.roomId);

						expect(rcRoom).toHaveProperty('_id');
						expect(rcRoom).toHaveProperty('t', 'd');
						expect(rcRoom).toHaveProperty('uids');
						expect(rcRoom).not.toHaveProperty('fname');

						subscriptionInvite = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig.credentials, rcUserConfig.request);

						expect(subscriptionInvite).toHaveProperty('status', 'INVITED');
						expect(subscriptionInvite).toHaveProperty('fname', `@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`);
					});
				});

				it('should accept the DM invitation from rc', async () => {
					const membersBefore = await hs1Room.getMembers();

					expect(membersBefore.length).toBe(2);

					const invitedMember = membersBefore.find((member) => member.userId === userDmId);

					expect(invitedMember).toHaveProperty('membership', 'invite');

					const waitForRoomEventPromise = waitForRoomEvent(hs1Room, RoomStateEvent.Members, ({ event }) => {
						expect(event).toHaveProperty('content.membership', 'join');
						expect(event).toHaveProperty('state_key', userDmId);
					});

					const response = await acceptRoomInvite(rcRoom._id, rcUserConfig);
					expect(response.success).toBe(true);

					await waitForRoomEventPromise;
				});

				it('should display the fname properly', async () => {
					const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig.credentials, rcUserConfig.request);

					expect(sub).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);
				});

				it('should return own user name as the room name when user is alone in the DM', async () => {
					await hs1AdminApp.matrixClient.leave(hs1Room.roomId);

					await retry(
						'this is an async operation, so we need to wait for the event to be processed',
						async () => {
							const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig.credentials, rcUserConfig.request);

							expect(sub).toHaveProperty('name', userDm);
							expect(sub).toHaveProperty('fname', userDmName);

							const roomInfo = await getRoomInfo(rcRoom._id, rcUserConfig);

							expect(roomInfo).toHaveProperty('room');

							expect(roomInfo.room).toHaveProperty('usersCount', 1);
							expect(roomInfo.room).not.toHaveProperty('fname');
							expect(roomInfo.room).toHaveProperty('uids');
							expect(roomInfo.room?.uids).toHaveLength(1);
							expect(roomInfo.room?.uids).toEqual([rcUser._id]);

							expect(roomInfo.room).toHaveProperty('usernames');
							expect(roomInfo.room?.usernames).toHaveLength(1);
							expect(roomInfo.room?.usernames).toEqual([rcUser.username]);
						},
						{ delayMs: 100 },
					);
				});
			});

			describe('Permission validations', () => {
				let rcUser: TestUser<IUser>;
				let rcUserConfig: IRequestConfig;
				let hs1Room: Room;
				let subscriptionInvite: ISubscription;
				let rcRoom: IRoom;

				const userDm = `dm-federation-user-${Date.now()}`;
				const userDmId = `@${userDm}:${federationConfig.rc1.domain}`;

				beforeAll(async () => {
					// create both RC and Synapse users
					rcUser = await createUser(
						{
							username: userDm,
							password: 'random',
							email: `${userDm}}@rocket.chat`,
							name: `DM Federation User ${Date.now()}`,
						},
						rc1AdminRequestConfig,
					);

					rcUserConfig = await getRequestConfig(federationConfig.rc1.url, rcUser.username, 'random');
				});

				afterAll(async () => {
					// delete both RC and Synapse users
					await deleteUser(rcUser, {}, rc1AdminRequestConfig);
				});

				it('should create a DM and invite user from rc', async () => {
					hs1Room = (await hs1AdminApp.createDM([userDmId])) as Room;

					expect(hs1Room).toHaveProperty('roomId');

					await retry('this is an async operation, so we need to wait for the room to be created in RC', async () => {
						const roomsResponse = await rcUserConfig.request.get(api('rooms.get')).set(rcUserConfig.credentials).expect(200);
						expect(roomsResponse.body).toHaveProperty('success', true);
						expect(roomsResponse.body).toHaveProperty('update');

						rcRoom = roomsResponse.body.update.find((room: IRoomNativeFederated) => room.federation.mrid === hs1Room.roomId);

						expect(rcRoom).toHaveProperty('_id');
						expect(rcRoom).toHaveProperty('t', 'd');
						expect(rcRoom).toHaveProperty('uids');
						expect(rcRoom).not.toHaveProperty('fname');

						subscriptionInvite = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig.credentials, rcUserConfig.request);

						expect(subscriptionInvite).toHaveProperty('status', 'INVITED');
						expect(subscriptionInvite).toHaveProperty('fname', `@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`);
					});
				});

				it('should accept the DM invitation from rc', async () => {
					const membersBefore = await hs1Room.getMembers();

					expect(membersBefore.length).toBe(2);

					const invitedMember = membersBefore.find((member) => member.userId === userDmId);

					expect(invitedMember).toHaveProperty('membership', 'invite');

					await Promise.all([
						waitForRoomEvent(hs1Room, RoomStateEvent.Members, ({ event }) => {
							expect(event).toHaveProperty('content.membership', 'join');
							expect(event).toHaveProperty('state_key', userDmId);
						}),
						(async () => {
							const response = await acceptRoomInvite(rcRoom._id, rcUserConfig);
							expect(response.success).toBe(true);
						})(),
					]);
				});

				it('should display the fname properly', async () => {
					const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig.credentials, rcUserConfig.request);

					expect(sub).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);
				});

				it('should be able to leave the DM from Rocket.Chat', async () => {
					const leaveEventPromise = waitForRoomEvent(hs1Room, RoomStateEvent.Members, ({ event }) => {
						expect(event).toHaveProperty('content.membership', 'leave');
						expect(event).toHaveProperty('state_key', userDmId);
					});

					const response = await rcUserConfig.request
						.post(api('rooms.leave'))
						.set(rcUserConfig.credentials)
						.send({
							roomId: subscriptionInvite.rid,
						})
						.expect(200);

					expect(response.body).toHaveProperty('success', true);

					await leaveEventPromise;
				});
			});
		});

		describe('Rocket.Chat as the resident server', () => {
			let hs1User: SynapseClient;
			let rcUser: TestUser<IUser>;
			let rcUserConfig: IRequestConfig;
			let hs1Room: Room;

			const userDm = `dm-rc-federation-user-${Date.now()}`;
			const userDmName = `DM RC Federation User ${Date.now()}`;

			beforeAll(async () => {
				// Create RC user
				rcUser = await createUser(
					{
						username: userDm,
						password: 'random',
						email: `${userDm}@rocket.chat`,
						name: userDmName,
					},
					rc1AdminRequestConfig,
				);

				rcUserConfig = await getRequestConfig(federationConfig.rc1.url, rcUser.username, 'random');

				// Create Synapse user
				hs1User = new SynapseClient(
					federationConfig.hs1.url,
					federationConfig.hs1.additionalUser1.username,
					federationConfig.hs1.additionalUser1.password,
				);
				await hs1User.initialize();
			});

			afterAll(async () => {
				await deleteUser(rcUser, {}, rc1AdminRequestConfig);
				if (hs1User) {
					await hs1User.close();
				}
			});

			describe('Reject invite flow', () => {
				let rcRoom: IRoomNativeFederated;

				it('should create a DM and invite user from synapse', async () => {
					// Create DM from RC user to Synapse user
					const response = await rcUserConfig.request
						.post(api('dm.create'))
						.set(rcUserConfig.credentials)
						.send({
							username: federationConfig.hs1.additionalUser1.matrixUserId,
						})
						.expect(200);

					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('room');

					const roomInfo = await getRoomInfo(response.body.room._id, rcUserConfig);

					expect(roomInfo).toHaveProperty('room');

					rcRoom = roomInfo.room as IRoomNativeFederated;

					expect(rcRoom).toHaveProperty('_id');
					expect(rcRoom).toHaveProperty('t', 'd');
					expect(rcRoom).toHaveProperty('federated', true);
					expect(rcRoom).toHaveProperty('federation.mrid');

					// Wait for the room to appear in Synapse
					await retry('this is an async operation, so we need to wait for the room to be created in Synapse', async () => {
						hs1Room = (await hs1User.matrixClient.getRoom(rcRoom.federation.mrid)) as Room;

						expect(hs1Room).toBeDefined();
						expect(hs1Room.getMyMembership()).toBe('invite');
					});
				});

				it('should display the fname properly after reject the invitation', async () => {
					// Reject the invitation from Synapse
					await hs1User.matrixClient.leave(hs1Room.roomId);

					await retry('this is an async operation, so we need to wait for the rejection to be processed', async () => {
						const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig.credentials, rcUserConfig.request);

						expect(sub).toHaveProperty('name', userDm);
						expect(sub).toHaveProperty('fname', userDmName);
					});
				});
			});

			describe('Accept invite flow', () => {
				let rcRoom: IRoomNativeFederated;

				it('should display the fname properly after accept the invitation', async () => {
					// Create a new DM since the previous one was rejected
					const response = await rcUserConfig.request
						.post(api('dm.create'))
						.set(rcUserConfig.credentials)
						.send({
							username: federationConfig.hs1.additionalUser1.matrixUserId,
						})
						.expect(200);

					expect(response.body).toHaveProperty('success', true);

					const roomInfo = await getRoomInfo(response.body.room._id, rcUserConfig);

					expect(roomInfo).toHaveProperty('room');

					rcRoom = roomInfo.room as IRoomNativeFederated;

					// Wait for invitation in Synapse
					await retry('waiting for room invitation', async () => {
						const room = await hs1User.matrixClient.getRoom(rcRoom.federation.mrid);

						expect(room).toBeDefined();
						expect(room!.getMyMembership()).toBe('invite');
					});

					// Accept the invitation
					await hs1User.matrixClient.joinRoom(rcRoom.federation.mrid);

					await retry('this is an async operation, so we need to wait for the join to be processed', async () => {
						const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig.credentials, rcUserConfig.request);

						// After acceptance, should display the Synapse user's ID
						expect(sub).toHaveProperty('fname', federationConfig.hs1.additionalUser1.matrixUserId);
					});
				});

				it('should allow the external user to leave the DM', async () => {
					// Synapse user leaves first
					await hs1User.matrixClient.leave(rcRoom.federation.mrid);

					await retry('waiting for leave event to be processed', async () => {
						const roomInfo = await getRoomInfo(rcRoom._id, rcUserConfig);

						expect(roomInfo.room).toHaveProperty('usersCount', 1);
					});
				});

				it('should not allow to leave if the user is the only member', async () => {
					// Try to leave immediately (Synapse user hasn't joined)
					const leaveResponse = await rcUserConfig.request
						.post(api('rooms.leave'))
						.set(rcUserConfig.credentials)
						.send({
							roomId: rcRoom._id,
						})
						.expect(400);

					expect(leaveResponse.body).toHaveProperty('success', false);
					expect(leaveResponse.body).toHaveProperty('error');
				});
			});
		});
	});

	describe('Multiple user DMs', () => {
		describe('Synapse as the resident server', () => {
			let rcUser1: TestUser<IUser>;
			let rcUserConfig1: IRequestConfig;

			let rcUser2: TestUser<IUser>;
			let rcUserConfig2: IRequestConfig;

			let rcUser3: TestUser<IUser>;
			// let rcUserConfig3: IRequestConfig;

			let rcRoom1: IRoom;

			let hs1Room: Room;

			let pendingInvitation1: ISubscription;
			let pendingInvitation2: ISubscription;
			// let pendingInvitation2: any;

			// let invitedRoomId1: string;
			// let invitedRoomId2: string;

			const userDm1 = `dm-federation-user1-${Date.now()}`;
			const userDm1Name = `DM Federation User1 ${Date.now()}`;
			const userDmId1 = `@${userDm1}:${federationConfig.rc1.domain}`;

			const userDm2 = `dm-federation-user2-${Date.now()}`;
			const userDm2Name = `DM Federation User2 ${Date.now()}`;
			const userDmId2 = `@${userDm2}:${federationConfig.rc1.domain}`;

			beforeAll(async () => {
				// create both RC and Synapse users
				rcUser1 = await createUser(
					{
						username: userDm1,
						password: 'random',
						email: `${userDm1}}@rocket.chat`,
						name: userDm1Name,
					},
					rc1AdminRequestConfig,
				);

				rcUserConfig1 = await getRequestConfig(federationConfig.rc1.url, rcUser1.username, 'random');

				rcUser2 = await createUser(
					{
						username: userDm2,
						password: 'random',
						email: `${userDm2}}@rocket.chat`,
						name: userDm2Name,
					},
					rc1AdminRequestConfig,
				);

				rcUserConfig2 = await getRequestConfig(federationConfig.rc1.url, rcUser2.username, 'random');
			});

			afterAll(async () => {
				// delete both RC and Synapse users
				await Promise.all([
					deleteUser(rcUser1, {}, rc1AdminRequestConfig),
					deleteUser(rcUser2, {}, rc1AdminRequestConfig),
					rcUser3 && deleteUser(rcUser3, {}, rc1AdminRequestConfig),
				]);
			});

			describe('Room list name validations', () => {
				it('should create a group DM with multiple RC users', async () => {
					hs1Room = (await hs1AdminApp.createDM([userDmId1, userDmId2])) as Room;

					expect(hs1Room).toHaveProperty('roomId');

					await retry('this is an async operation, so we need to wait for the room to be created in RC', async () => {
						const roomsResponse = await rcUserConfig1.request.get(api('rooms.get')).set(rcUserConfig1.credentials).expect(200);

						expect(roomsResponse.body).toHaveProperty('success', true);
						expect(roomsResponse.body).toHaveProperty('update');

						rcRoom1 = roomsResponse.body.update.find((room: IRoomNativeFederated) => room.federation.mrid === hs1Room.roomId);

						expect(rcRoom1).toHaveProperty('_id');
						expect(rcRoom1).toHaveProperty('t', 'd');
						expect(rcRoom1).toHaveProperty('uids');
						expect(rcRoom1).not.toHaveProperty('fname');
					});
					const membersBefore = await hs1Room.getMembers();

					expect(membersBefore.length).toBe(3);

					const invitedMember = membersBefore.find((member) => member.userId === userDmId1);

					expect(invitedMember).toHaveProperty('membership', 'invite');
				});

				it('should display the name of the inviter to user1 on RC', async () => {
					// check pending invitations for user 1
					pendingInvitation1 = await getSubscriptionByRoomId(rcRoom1._id, rcUserConfig1.credentials, rcUserConfig1.request);

					expect(pendingInvitation1).toHaveProperty('status', 'INVITED');
					expect(pendingInvitation1).toHaveProperty('fname', `@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`);
					expect(pendingInvitation1).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);
				});

				it('should have user1 as regular user of the group DM on RC', async () => {
					expect(pendingInvitation1).not.toHaveProperty('roles');
				});

				it('should display the name of the inviter to user2on RC', async () => {
					// check pending invitations for user 1
					pendingInvitation2 = await getSubscriptionByRoomId(rcRoom1._id, rcUserConfig2.credentials, rcUserConfig2.request);

					expect(pendingInvitation2).toHaveProperty('status', 'INVITED');
					expect(pendingInvitation2).toHaveProperty('fname', `@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`);
					expect(pendingInvitation2).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);
				});

				it('should have user2 as regular user of the group DM on RC', async () => {
					expect(pendingInvitation2).not.toHaveProperty('roles');
				});

				it('should display the name of all users on RC after the invited user accepts the invitation', async () => {
					const waitForRoomEventPromise1 = waitForRoomEvent(hs1Room, RoomStateEvent.Members, ({ event }) => {
						expect(event).toHaveProperty('content.membership', 'join');
						expect(event).toHaveProperty('state_key', userDmId1);
					});

					const response = await acceptRoomInvite(rcRoom1._id, rcUserConfig1);
					expect(response.success).toBe(true);

					await waitForRoomEventPromise1;

					await retry(
						'this is an async operation, so we need to wait for the event to be processed',
						async () => {
							const sub = await getSubscriptionByRoomId(rcRoom1._id, rcUserConfig1.credentials, rcUserConfig1.request);

							expect(sub).not.toHaveProperty('status');
							expect(sub).toHaveProperty('name', `${federationConfig.hs1.adminMatrixUserId}, ${userDm2}`);
							expect(sub).toHaveProperty('fname', `${federationConfig.hs1.adminMatrixUserId}, ${userDm2Name}`);
						},
						{ delayMs: 100 },
					);
				});

				it('should have a correct roomsCount as 3 after first user accept the invitation', async () => {
					const roomInfo = await getRoomInfo(rcRoom1._id, rcUserConfig1);

					expect(roomInfo).toHaveProperty('room');
					expect(roomInfo.room).toHaveProperty('usersCount', 3);
				});

				it('should update the display name if the inviter from Synapse leaves the group DM', async () => {
					await hs1AdminApp.matrixClient.leave(hs1Room.roomId);

					await retry(
						'this is an async operation, so we need to wait for the event to be processed',
						async () => {
							const sub = await getSubscriptionByRoomId(rcRoom1._id, rcUserConfig1.credentials, rcUserConfig1.request);

							expect(sub).not.toHaveProperty('status');
							expect(sub).toHaveProperty('name', userDm2);
							expect(sub).toHaveProperty('fname', userDm2Name);
						},
						{ delayMs: 100 },
					);
				});

				it('should have a correct roomsCount as 2 after user leaves', async () => {
					const roomInfo = await getRoomInfo(rcRoom1._id, rcUserConfig1);

					expect(roomInfo).toHaveProperty('room');
					expect(roomInfo.room).toHaveProperty('usersCount', 2);
				});

				it.todo('should respect max users allowed in a group DM when adding users');
			});

			describe('Permission validations', () => {
				const userDm3 = `dm-federation-user3-${Date.now()}`;
				const userDm3Name = `DM Federation User3 ${Date.now()}`;
				const userDmId3 = `@${userDm3}:${federationConfig.rc1.domain}`;

				beforeAll(async () => {
					rcUser3 = await createUser(
						{
							username: userDm3,
							password: 'random',
							email: `${userDm3}}@rocket.chat`,
							name: userDm3Name,
						},
						rc1AdminRequestConfig,
					);
				});

				// TODO maybe we should allow it
				it('should fail if a user from rc try to add another user to the group DM', async () => {
					const response = await addUserToRoom({
						usernames: [userDmId3],
						rid: rcRoom1._id,
						config: rcUserConfig1,
					});

					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('message');

					// Parse the error message from the DDP response
					const messageData = JSON.parse(response.body.message);

					expect(messageData).toHaveProperty('error.error', 'error-not-allowed');
				});

				it('should allow a user to leave the group DM', async () => {
					const response = await rcUserConfig1.request
						.post(api('rooms.leave'))
						.set(rcUserConfig1.credentials)
						.send({
							roomId: rcRoom1._id,
						})
						.expect(200);

					expect(response.body).toHaveProperty('success', true);
				});

				it('should delete the room entirely if no local users in the room', async () => {
					// User2 leaves the room (user1 already left in previous test)
					const response = await rcUserConfig2.request
						.post(api('rooms.leave'))
						.set(rcUserConfig2.credentials)
						.send({
							roomId: rcRoom1._id,
						})
						.expect(200);

					expect(response.body).toHaveProperty('success', true);

					// Verify room is no longer accessible to RC users
					await retry('waiting for room cleanup', async () => {
						const roomsResponse = await rcUserConfig1.request.get(api('rooms.get')).set(rcUserConfig1.credentials).expect(200);

						const room = roomsResponse.body.update?.find((r: IRoom) => r._id === rcRoom1._id);

						// Room should not be in active rooms list
						expect(room).toBeUndefined();
					});
				});
			});

			describe('Turning a 1:1 DM into a group DM', () => {
				let rcUserA: TestUser<IUser>;
				let rcUserConfigA: IRequestConfig;

				let rcUserB: TestUser<IUser>;
				let rcUserConfigB: IRequestConfig;

				let hs1RoomConverted: Room;
				let rcRoomConverted: IRoom;

				const userDmA = `dm-federation-userA-${Date.now()}`;
				const userDmAName = `DM Federation UserA ${Date.now()}`;
				const userDmIdA = `@${userDmA}:${federationConfig.rc1.domain}`;

				const userDmB = `dm-federation-userB-${Date.now()}`;
				const userDmBName = `DM Federation UserB ${Date.now()}`;
				const userDmIdB = `@${userDmB}:${federationConfig.rc1.domain}`;

				beforeAll(async () => {
					// Create two RC users
					rcUserA = await createUser(
						{
							username: userDmA,
							password: 'random',
							email: `${userDmA}@rocket.chat`,
							name: userDmAName,
						},
						rc1AdminRequestConfig,
					);

					rcUserConfigA = await getRequestConfig(federationConfig.rc1.url, rcUserA.username, 'random');

					rcUserB = await createUser(
						{
							username: userDmB,
							password: 'random',
							email: `${userDmB}@rocket.chat`,
							name: userDmBName,
						},
						rc1AdminRequestConfig,
					);

					rcUserConfigB = await getRequestConfig(federationConfig.rc1.url, rcUserB.username, 'random');

					// Create 1:1 DM from Synapse with userA
					hs1RoomConverted = (await hs1AdminApp.createDM([userDmIdA])) as Room;

					expect(hs1RoomConverted).toHaveProperty('roomId');

					await retry('this is an async operation, so we need to wait for the room to be created in RC', async () => {
						const roomsResponse = await rcUserConfigA.request.get(api('rooms.get')).set(rcUserConfigA.credentials).expect(200);

						expect(roomsResponse.body).toHaveProperty('success', true);
						expect(roomsResponse.body).toHaveProperty('update');

						rcRoomConverted = roomsResponse.body.update.find(
							(room: IRoomNativeFederated) => room.federation.mrid === hs1RoomConverted.roomId,
						);

						expect(rcRoomConverted).toHaveProperty('_id');
						expect(rcRoomConverted).toHaveProperty('t', 'd');
					});

					// UserA accepts the invitation
					const waitForJoinEventPromise = waitForRoomEvent(hs1RoomConverted, RoomStateEvent.Members, ({ event }) => {
						expect(event).toHaveProperty('content.membership', 'join');
						expect(event).toHaveProperty('state_key', userDmIdA);
					});

					const response = await acceptRoomInvite(rcRoomConverted._id, rcUserConfigA);
					expect(response.success).toBe(true);

					await waitForJoinEventPromise;

					// Now add userB to convert it to a group DM
					await hs1AdminApp.matrixClient.invite(hs1RoomConverted.roomId, userDmIdB);
				});

				afterAll(async () => {
					await Promise.all([deleteUser(rcUserA, {}, rc1AdminRequestConfig), deleteUser(rcUserB, {}, rc1AdminRequestConfig)]);
				});

				it('should show the invite to the third user', async () => {
					await retry('this is an async operation, so we need to wait for the invite to reach RC', async () => {
						const pendingInvitationB = await getSubscriptionByRoomId(rcRoomConverted._id, rcUserConfigB.credentials, rcUserConfigB.request);

						expect(pendingInvitationB).toHaveProperty('status', 'INVITED');
						expect(pendingInvitationB).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);
					});

					const membersInMatrix = await hs1RoomConverted.getMembers();

					expect(membersInMatrix.length).toBe(3);

					const invitedMemberB = membersInMatrix.find((member) => member.userId === userDmIdB);

					expect(invitedMemberB).toHaveProperty('membership', 'invite');
				});

				it('should update the room name to reflect the three users after the third user accepts the invitation', async () => {
					const waitForRoomEventPromise = waitForRoomEvent(hs1RoomConverted, RoomStateEvent.Members, ({ event }) => {
						expect(event).toHaveProperty('content.membership', 'join');
						expect(event).toHaveProperty('state_key', userDmIdB);
					});

					const response = await acceptRoomInvite(rcRoomConverted._id, rcUserConfigB);
					expect(response.success).toBe(true);

					await waitForRoomEventPromise;

					await retry(
						'this is an async operation, so we need to wait for the room name to be updated',
						async () => {
							// Check userA's subscription
							const subA = await getSubscriptionByRoomId(rcRoomConverted._id, rcUserConfigA.credentials, rcUserConfigA.request);

							expect(subA).not.toHaveProperty('status');
							expect(subA).toHaveProperty('name', `${federationConfig.hs1.adminMatrixUserId}, ${userDmB}`);
							expect(subA).toHaveProperty('fname', `${federationConfig.hs1.adminMatrixUserId}, ${userDmBName}`);

							// Check userB's subscription
							const subB = await getSubscriptionByRoomId(rcRoomConverted._id, rcUserConfigB.credentials, rcUserConfigB.request);

							expect(subB).not.toHaveProperty('status');
							expect(subB).toHaveProperty('name', `${federationConfig.hs1.adminMatrixUserId}, ${userDmA}`);
							expect(subB).toHaveProperty('fname', `${federationConfig.hs1.adminMatrixUserId}, ${userDmAName}`);
						},
						{ delayMs: 100 },
					);

					// Verify room info shows correct user count
					const roomInfo = await getRoomInfo(rcRoomConverted._id, rcUserConfigA);

					expect(roomInfo).toHaveProperty('room');
					expect(roomInfo.room).toHaveProperty('usersCount', 3);
				});
			});
		});

		describe('Rocket.Chat as the resident server', () => {
			let hs1User1: SynapseClient;

			beforeAll(async () => {
				hs1User1 = new SynapseClient(
					federationConfig.hs1.url,
					federationConfig.hs1.additionalUser1.username,
					federationConfig.hs1.additionalUser1.password,
				);
				await hs1User1.initialize();
			});

			afterAll(async () => {
				await hs1User1.close();
			});

			describe('Room list name validations', () => {
				let rcRoom: IRoomNativeFederated;
				let hs1Room1: Room;

				let rcUser1: TestUser<IUser>;
				let rcUserConfig1: IRequestConfig;

				let rcUser2: TestUser<IUser>;
				let rcUserConfig2: IRequestConfig;

				const rcUserName1 = `dm-rc-multi-user1-${Date.now()}`;
				const rcUserFullName1 = `DM RC Multi User1 ${Date.now()}`;

				const rcUserName2 = `dm-rc-multi-user2-${Date.now()}`;
				const rcUserFullName2 = `DM RC Multi User2 ${Date.now()}`;

				beforeAll(async () => {
					// Create RC user
					rcUser1 = await createUser(
						{
							username: rcUserName1,
							password: 'random',
							email: `${rcUserName1}@rocket.chat`,
							name: rcUserFullName1,
						},
						rc1AdminRequestConfig,
					);

					rcUserConfig1 = await getRequestConfig(federationConfig.rc1.url, rcUser1.username, 'random');

					rcUser2 = await createUser(
						{
							username: rcUserName2,
							password: 'random',
							email: `${rcUserName2}@rocket.chat`,
							name: rcUserFullName2,
						},
						rc1AdminRequestConfig,
					);

					rcUserConfig2 = await getRequestConfig(federationConfig.rc1.url, rcUser2.username, 'random');
				});

				afterAll(async () => {
					await deleteUser(rcUser1, {}, rc1AdminRequestConfig);
					await deleteUser(rcUser2, {}, rc1AdminRequestConfig);
				});

				it('should create a group DM with a Synapse and Rocket.Chat user', async () => {
					// Create group DM from RC user to two Synapse users
					const response = await rcUserConfig1.request
						.post(api('dm.create'))
						.set(rcUserConfig1.credentials)
						.send({
							usernames: [federationConfig.hs1.adminMatrixUserId, rcUser2.username].join(','),
						})
						.expect(200);

					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('room');

					const roomInfo = await getRoomInfo(response.body.room._id, rcUserConfig1);

					expect(roomInfo).toHaveProperty('room');

					rcRoom = roomInfo.room as IRoomNativeFederated;

					expect(rcRoom).toHaveProperty('_id');
					expect(rcRoom).toHaveProperty('t', 'd');
					expect(rcRoom).toHaveProperty('federation.mrid');

					// Wait for invitation in Synapse
					await retry('waiting for room invitation', async () => {
						hs1Room1 = (await hs1AdminApp.matrixClient.getRoom(rcRoom.federation.mrid)) as Room;

						expect(hs1Room1).toBeDefined();
						expect(hs1Room1.getMyMembership()).toBe('invite');
					});
				});

				it('should display the fname containing the two invited users for the inviter', async () => {
					// Check the subscription for the inviter
					const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig1.credentials, rcUserConfig1.request);

					// Should contain both invited users in the name
					expect(sub).toHaveProperty('name', `${federationConfig.hs1.adminMatrixUserId}, ${rcUser2.username}`);
					expect(sub).toHaveProperty('fname', `${federationConfig.hs1.adminMatrixUserId}, ${rcUser2.name}`);
				});

				it.failing("should display only the inviter's username for the invited user on Rocket.Chat", async () => {
					const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig2.credentials, rcUserConfig2.request);

					expect(sub).toHaveProperty('status', 'INVITED');
					expect(sub).toHaveProperty('name', rcUser1.name);
					expect(sub).toHaveProperty('fname', rcUser1.username);
				});

				it.failing('should keep the fname to the RC invited user when the Synapse invited user accepts the DM', async () => {
					const waitForRoomEventPromise1 = waitForRoomEvent(hs1Room1, RoomStateEvent.Members, ({ event }) => {
						expect(event).toHaveProperty('content.membership', 'join');
						expect(event).toHaveProperty('state_key', federationConfig.hs1.adminMatrixUserId);
					});

					await hs1AdminApp.matrixClient.joinRoom(rcRoom.federation.mrid);

					await waitForRoomEventPromise1;

					await retry(
						'this is an async operation, so we need to wait for the event to be processed',
						async () => {
							const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig2.credentials, rcUserConfig2.request);

							expect(sub).toHaveProperty('status', 'INVITED');
							expect(sub).toHaveProperty('name', rcUser1.name);
							expect(sub).toHaveProperty('fname', rcUser1.username);
						},
						{ delayMs: 100 },
					);
				});

				it('should update the fname when a user leaves the DM', async () => {
					await hs1AdminApp.matrixClient.leave(rcRoom.federation.mrid);

					await retry(
						'this is an async operation, so we need to wait for the event to be processed',
						async () => {
							const sub = await getSubscriptionByRoomId(rcRoom._id, rcUserConfig1.credentials, rcUserConfig1.request);

							expect(sub).toHaveProperty('name', rcUser2.username);
							expect(sub).toHaveProperty('fname', rcUser2.name);
						},
						{ delayMs: 100 },
					);
				});

				it('should validate the room name for group DMs on Synapse', async () => {
					// TODO this should probably change
					expect(hs1Room1.name).toBe('Group chat with 3 members');
				});
			});

			describe('Permission validations', () => {
				let rcRoom: IRoomNativeFederated;
				let hs1Room1: Room;
				let rcUser3: TestUser<IUser>;

				let rcUser1: TestUser<IUser>;
				let rcUserConfig1: IRequestConfig;

				let rcUser2: TestUser<IUser>;
				let rcUserConfig2: IRequestConfig;

				const rcUserName1 = `dm-rc-perm-user1-${Date.now()}`;
				const rcUserFullName1 = `DM RC Perm User1 ${Date.now()}`;

				const rcUserName2 = `dm-rc-perm-user2-${Date.now()}`;
				const rcUserFullName2 = `DM RC Perm User2 ${Date.now()}`;

				const userDm3 = `dm-federation-user3-${Date.now()}`;
				const userDm3Name = `DM Federation User3 ${Date.now()}`;
				const userDmId3 = `@${userDm3}:${federationConfig.rc1.domain}`;

				beforeAll(async () => {
					// Create RC user
					rcUser1 = await createUser(
						{
							username: rcUserName1,
							password: 'random',
							email: `${rcUserName1}@rocket.chat`,
							name: rcUserFullName1,
						},
						rc1AdminRequestConfig,
					);

					rcUserConfig1 = await getRequestConfig(federationConfig.rc1.url, rcUser1.username, 'random');

					rcUser2 = await createUser(
						{
							username: rcUserName2,
							password: 'random',
							email: `${rcUserName2}@rocket.chat`,
							name: rcUserFullName2,
						},
						rc1AdminRequestConfig,
					);

					rcUserConfig2 = await getRequestConfig(federationConfig.rc1.url, rcUser2.username, 'random');

					rcUser3 = await createUser(
						{
							username: userDm3,
							password: 'random',
							email: `${userDm3}}@rocket.chat`,
							name: userDm3Name,
						},
						rc1AdminRequestConfig,
					);
				});

				afterAll(async () => {
					await Promise.all([
						deleteUser(rcUser1, {}, rc1AdminRequestConfig),
						deleteUser(rcUser2, {}, rc1AdminRequestConfig),
						deleteUser(rcUser3, {}, rc1AdminRequestConfig),
					]);
				});

				it('should create a group DM with a Synapse and Rocket.Chat user', async () => {
					// Create group DM from RC user to two Synapse users
					const response = await rcUserConfig1.request
						.post(api('dm.create'))
						.set(rcUserConfig1.credentials)
						.send({
							usernames: [federationConfig.hs1.adminMatrixUserId, rcUser2.username].join(','),
						})
						.expect(200);

					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('room');

					const roomInfo = await getRoomInfo(response.body.room._id, rcUserConfig1);

					expect(roomInfo).toHaveProperty('room');

					rcRoom = roomInfo.room as IRoomNativeFederated;

					expect(rcRoom).toHaveProperty('_id');
					expect(rcRoom).toHaveProperty('t', 'd');
					expect(rcRoom).toHaveProperty('federation.mrid');

					// Wait for invitation in Synapse
					await retry('waiting for room invitation', async () => {
						hs1Room1 = (await hs1AdminApp.matrixClient.getRoom(rcRoom.federation.mrid)) as Room;

						expect(hs1Room1).toBeDefined();
						expect(hs1Room1).toHaveProperty('roomId', rcRoom.federation.mrid);
						expect(hs1Room1.getMyMembership()).toBe('invite');
					});
				});

				it('should accept the invitation by the Rocket.Chat user', async () => {
					const response = await acceptRoomInvite(rcRoom._id, rcUserConfig2);
					expect(response.success).toBe(true);
				});

				// TODO maybe we should allow it
				// is this working now?
				it.failing('should fail if a user from rc try to add another user to the group DM', async () => {
					const response = await addUserToRoom({
						usernames: [rcUser3.username],
						rid: rcRoom._id,
						config: rcUserConfig1,
					});

					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('message');

					// Parse the error message from the DDP response
					const messageData = JSON.parse(response.body.message);

					expect(messageData).toHaveProperty('error.error', 'error-not-allowed');
				});

				// TODO we're creating DMs with powerlevel 50 for invites, so this is not working
				it.failing('should add another user by another user than the initial inviter', async () => {
					await hs1AdminApp.matrixClient.joinRoom(rcRoom.federation.mrid);

					await retry('waiting for join', async () => {
						const members = await hs1Room1.getMembers();
						expect(members.length).toBe(3);
					});

					await hs1AdminApp.inviteUserToRoom(hs1Room1.roomId, userDmId3);

					await retry('waiting for user4 to receive invitation', async () => {
						const members = await hs1Room1.getMembers();
						const user4Member = members.find((m) => m.userId === userDmId3);
						expect(user4Member).toBeDefined();
						expect(user4Member?.membership).toBe('invite');
					});
				});
			});

			describe('Duplicated rooms', () => {
				describe('When the third user leaves a DM', () => {
					describe('When there is an existing non-federated DM with the same users', () => {
						let rcRoom: IRoomNativeFederated;
						let rcRoomNonFed: IRoomNativeFederated;

						let hs1Room1: Room;

						const rcUser1 = {
							username: `dm-rc-dup1-user1-${Date.now()}`,
							fullName: `DM RC Dup1 User1 ${Date.now()}`,
							get matrixId() {
								return `@${this.username}:${federationConfig.rc1.domain}`;
							},
							config: {} as IRequestConfig,
							user: {} as TestUser<IUser>,
						};

						const rcUser2 = {
							username: `dm-rc-dup1-user2-${Date.now()}`,
							fullName: `DM RC Dup1 User2 ${Date.now()}`,
							get matrixId() {
								return `@${this.username}:${federationConfig.rc1.domain}`;
							},
							config: {} as IRequestConfig,
							user: {} as TestUser<IUser>,
						};

						beforeAll(async () => {
							// Create RC user
							rcUser1.user = await createUser(
								{
									username: rcUser1.username,
									password: 'random',
									email: `${rcUser1.username}@rocket.chat`,
									name: rcUser1.fullName,
								},
								rc1AdminRequestConfig,
							);

							rcUser1.config = await getRequestConfig(federationConfig.rc1.url, rcUser1.username, 'random');

							rcUser2.user = await createUser(
								{
									username: rcUser2.username,
									password: 'random',
									email: `${rcUser2.username}@rocket.chat`,
									name: rcUser2.fullName,
								},
								rc1AdminRequestConfig,
							);

							rcUser2.config = await getRequestConfig(federationConfig.rc1.url, rcUser2.username, 'random');
						});

						afterAll(async () => {
							await Promise.all([
								deleteUser(rcUser1.user, {}, rc1AdminRequestConfig),
								deleteUser(rcUser2.user, {}, rc1AdminRequestConfig),
								// deleteUser(rcUser3.user, {}, rc1AdminRequestConfig),
							]);
						});

						beforeAll(async () => {
							// First create a federated DM between rcUser1 and rcUser2 and the Synapse user, so this is the oldest room
							const fedDmResponse = await rcUser1.config.request
								.post(api('dm.create'))
								.set(rcUser1.config.credentials)
								.send({
									usernames: [rcUser2.username, federationConfig.hs1.adminMatrixUserId].join(','),
								})
								.expect(200);

							expect(fedDmResponse.body).toHaveProperty('success', true);

							const roomInfo = await getRoomInfo(fedDmResponse.body.room._id, rcUser1.config);

							expect(roomInfo).toHaveProperty('room');

							rcRoom = roomInfo.room as IRoomNativeFederated;

							expect(rcRoom).toHaveProperty('_id');
							expect(rcRoom).toHaveProperty('t', 'd');
							expect(rcRoom).toHaveProperty('federation.mrid');

							// Wait for invitation in Synapse
							await retry('waiting for room invitation', async () => {
								hs1Room1 = hs1AdminApp.matrixClient.getRoom(rcRoom.federation.mrid) as Room;

								expect(hs1Room1).toBeDefined();
								expect(hs1Room1).toHaveProperty('roomId', rcRoom.federation.mrid);
								expect(hs1Room1.getMyMembership()).toBe('invite');
							});

							// Accept the invitation
							await hs1AdminApp.matrixClient.joinRoom(rcRoom.federation.mrid);

							await retry('wait for the join to be processed', async () => {
								expect(hs1Room1.getMyMembership()).toBe('join');

								const sub = await getSubscriptionByRoomId(rcRoom._id, rcUser2.config.credentials, rcUser2.config.request);

								// After acceptance, should display the Synapse user's ID
								expect(sub).toHaveProperty('fname', `${federationConfig.hs1.adminMatrixUserId}, ${rcUser1.fullName}`);
							});

							// Then create non-federated DM between rcUser1 and rcUser2 which should be returned on duplication
							const nonFedDmResponse = await rcUser1.config.request
								.post(api('dm.create'))
								.set(rcUser1.config.credentials)
								.send({
									username: rcUser2.username,
								})
								.expect(200);

							expect(nonFedDmResponse.body).toHaveProperty('success', true);

							const roomInfoNonFed = await getRoomInfo(nonFedDmResponse.body.room._id, rcUser1.config);

							rcRoomNonFed = roomInfoNonFed.room as IRoomNativeFederated;
						});

						it('should have two DMs with same users', async () => {
							const roomsResponse = await rcUser1.config.request.get(api('rooms.get')).set(rcUser1.config.credentials).expect(200);

							const dmRooms = roomsResponse.body.update.filter(
								(room: IRoomNativeFederated) =>
									room.t === 'd' &&
									room.usernames &&
									room.usernames.length === 2 &&
									room.usernames.includes(rcUser1.username) &&
									room.usernames.includes(rcUser2.username),
							);

							// at this time there should be only one DM with only two users (the non-federated one)
							expect(dmRooms.length).toBe(1);

							// now the synapse user leaves the federated DM
							await hs1AdminApp.matrixClient.leave(rcRoom.federation.mrid);

							await retry(
								'wait for the leave to be processed',
								async () => {
									expect(hs1Room1.getMyMembership()).toBe('leave');

									const sub = await getSubscriptionByRoomId(rcRoom._id, rcUser1.config.credentials, rcUser1.config.request);

									// After leave, should display only the RC user's full name
									expect(sub).toHaveProperty('fname', rcUser2.fullName);
								},
								{ delayMs: 100 },
							);

							// now there should be two DMs with the same users
							const roomsResponseAfterLeave = await rcUser1.config.request
								.get(api('rooms.get'))
								.set(rcUser1.config.credentials)
								.expect(200);

							const dmRoomsAfterLeave = roomsResponseAfterLeave.body.update.filter(
								(room: IRoomNativeFederated) =>
									room.t === 'd' &&
									room.usernames &&
									room.usernames.length === 2 &&
									room.usernames.includes(rcUser1.username) &&
									room.usernames.includes(rcUser2.username),
							);

							expect(dmRoomsAfterLeave.length).toBe(2);
						});

						it('should return the non-federated room when trying to create a new DM with same users', async () => {
							const response = await rcUser1.config.request
								.post(api('dm.create'))
								.set(rcUser1.config.credentials)
								.send({
									username: rcUser2.username,
								})
								.expect(200);

							expect(response.body).toHaveProperty('success', true);

							expect(response.body).toHaveProperty('room._id', rcRoomNonFed._id);
						});
					});

					describe('When there is only federated DMs', () => {
						let rcRoom: IRoomNativeFederated;
						let rcRoom1on1: IRoomNativeFederated;

						let hs1Room1: Room;

						const rcUser1 = {
							username: `dm-rc-dup2-user1-${Date.now()}`,
							fullName: `DM RC Dup2 User1 ${Date.now()}`,
							get matrixId() {
								return `@${this.username}:${federationConfig.rc1.domain}`;
							},
							config: {} as IRequestConfig,
							user: {} as TestUser<IUser>,
						};

						const rcUser2 = {
							username: `dm-rc-dup2-user2-${Date.now()}`,
							fullName: `DM RC Dup2 User2 ${Date.now()}`,
							get matrixId() {
								return `@${this.username}:${federationConfig.rc1.domain}`;
							},
							config: {} as IRequestConfig,
							user: {} as TestUser<IUser>,
						};

						beforeAll(async () => {
							// Create RC user
							rcUser1.user = await createUser(
								{
									username: rcUser1.username,
									password: 'random',
									email: `${rcUser1.username}@rocket.chat`,
									name: rcUser1.fullName,
								},
								rc1AdminRequestConfig,
							);

							rcUser1.config = await getRequestConfig(federationConfig.rc1.url, rcUser1.username, 'random');

							rcUser2.user = await createUser(
								{
									username: rcUser2.username,
									password: 'random',
									email: `${rcUser2.username}@rocket.chat`,
									name: rcUser2.fullName,
								},
								rc1AdminRequestConfig,
							);

							rcUser2.config = await getRequestConfig(federationConfig.rc1.url, rcUser2.username, 'random');
						});

						afterAll(async () => {
							await Promise.all([
								deleteUser(rcUser1.user, {}, rc1AdminRequestConfig),
								deleteUser(rcUser2.user, {}, rc1AdminRequestConfig),
								// deleteUser(rcUser3.user, {}, rc1AdminRequestConfig),
							]);
						});

						it('should create a federated DM between rcUser1 and the Synapse user', async () => {
							// Create federated DM between rcUser1 and the Synapse user
							const fedDmResponse = await rcUser1.config.request
								.post(api('dm.create'))
								.set(rcUser1.config.credentials)
								.send({
									username: federationConfig.hs1.adminMatrixUserId,
								})
								.expect(200);

							expect(fedDmResponse.body).toHaveProperty('success', true);

							const roomInfo = await getRoomInfo(fedDmResponse.body.room._id, rcUser1.config);

							expect(roomInfo).toHaveProperty('room');

							rcRoom1on1 = roomInfo.room as IRoomNativeFederated;

							expect(rcRoom1on1).toHaveProperty('_id');
							expect(rcRoom1on1).toHaveProperty('t', 'd');
							expect(rcRoom1on1).toHaveProperty('federation.mrid');
							expect(rcRoom1on1).toHaveProperty('usersCount', 2);

							// Wait for invitation in Synapse
							await retry('waiting for room invitation', async () => {
								hs1Room1 = hs1AdminApp.matrixClient.getRoom(rcRoom1on1.federation.mrid) as Room;

								expect(hs1Room1).toBeDefined();
								expect(hs1Room1).toHaveProperty('roomId', rcRoom1on1.federation.mrid);
								expect(hs1Room1.getMyMembership()).toBe('invite');
							});

							// Accept the invitation
							await hs1AdminApp.matrixClient.joinRoom(rcRoom1on1.federation.mrid);

							await retry('wait for the join to be processed', async () => {
								expect(hs1Room1.getMyMembership()).toBe('join');

								const sub = await getSubscriptionByRoomId(rcRoom1on1._id, rcUser1.config.credentials, rcUser1.config.request);

								// After acceptance, should display the Synapse user's ID
								expect(sub).toHaveProperty('fname', `${federationConfig.hs1.adminMatrixUserId}`);
							});
						});

						it('should create a federated DM between rcUser1 and rcUser2 and the Synapse user', async () => {
							const fedDmResponse = await rcUser1.config.request
								.post(api('dm.create'))
								.set(rcUser1.config.credentials)
								.send({
									usernames: [federationConfig.hs1.adminMatrixUserId, rcUser2.username].join(','),
								})
								.expect(200);

							expect(fedDmResponse.body).toHaveProperty('success', true);

							const roomInfo = await getRoomInfo(fedDmResponse.body.room._id, rcUser1.config);

							expect(roomInfo).toHaveProperty('room');

							rcRoom = roomInfo.room as IRoomNativeFederated;

							expect(rcRoom).toHaveProperty('_id');
							expect(rcRoom).toHaveProperty('t', 'd');
							expect(rcRoom).toHaveProperty('federation.mrid');
							expect(rcRoom).toHaveProperty('usersCount', 3);

							// Wait for invitation in Synapse
							await retry(
								'waiting for room invitation',
								async () => {
									hs1Room1 = hs1AdminApp.matrixClient.getRoom(rcRoom.federation.mrid) as Room;

									expect(hs1Room1).toBeDefined();
									expect(hs1Room1).toHaveProperty('roomId', rcRoom.federation.mrid);
									expect(hs1Room1.getMyMembership()).toBe('invite');
								},
								{ delayMs: 100 },
							);

							// Accept the invitation
							await hs1AdminApp.matrixClient.joinRoom(rcRoom.federation.mrid);

							await retry(
								'wait for the join to be processed',
								async () => {
									expect(hs1Room1.getMyMembership()).toBe('join');

									const sub = await getSubscriptionByRoomId(rcRoom._id, rcUser2.config.credentials, rcUser2.config.request);

									// After acceptance, should display the Synapse user's ID
									expect(sub).toHaveProperty('fname', `${federationConfig.hs1.adminMatrixUserId}, ${rcUser1.fullName}`);
								},
								{ delayMs: 100 },
							);

							const response = await acceptRoomInvite(rcRoom._id, rcUser2.config);
							expect(response.success).toBe(true);

							await retry(
								'wait for the join to be processed',
								async () => {
									const sub = await getSubscriptionByRoomId(rcRoom._id, rcUser2.config.credentials, rcUser2.config.request);

									expect(sub).not.toHaveProperty('status');
								},
								{ delayMs: 100 },
							);
						});

						it('should have a single DM with same users before one leaves', async () => {
							const roomsResponse = await rcUser1.config.request.get(api('rooms.get')).set(rcUser1.config.credentials).expect(200);

							const dmRooms = roomsResponse.body.update.filter(
								(room: IRoomNativeFederated) =>
									room.t === 'd' &&
									room.usernames &&
									room.usernames.length === 2 &&
									room.usernames.includes(rcUser1.username) &&
									room.usernames.includes(federationConfig.hs1.adminMatrixUserId),
							);

							// at this time there should be only one DM with only two users (the non-federated one)
							expect(dmRooms.length).toBe(1);
						});

						it('should leave the federated DM with three users', async () => {
							// now the rc user leaves the federated DM
							const response = await rcUser2.config.request
								.post(api('rooms.leave'))
								.set(rcUser2.config.credentials)
								.send({
									roomId: rcRoom._id,
								})
								.expect(200);

							expect(response.body).toHaveProperty('success', true);

							// Verify room is no longer accessible to RC users
							await retry('waiting for room cleanup', async () => {
								const roomsResponse = await rcUser2.config.request.get(api('rooms.get')).set(rcUser2.config.credentials).expect(200);

								expect(roomsResponse.body).toHaveProperty('update');
								expect(roomsResponse.body.update).toBeInstanceOf(Array);

								const room = roomsResponse.body.update?.find((r: IRoom) => r._id === rcRoom._id);

								// Room should not be in active rooms list
								expect(room).toBeUndefined();
							});
						});

						it('should have two DMs with same users', async () => {
							// now there should be two DMs with the same users
							const roomsResponseAfterLeave = await rcUser1.config.request
								.get(api('rooms.get'))
								.set(rcUser1.config.credentials)
								.expect(200);

							const dmRoomsAfterLeave = roomsResponseAfterLeave.body.update.filter(
								(room: IRoomNativeFederated) =>
									room.t === 'd' &&
									room.usernames &&
									room.usernames.length === 2 &&
									room.usernames.includes(rcUser1.username) &&
									room.usernames.includes(federationConfig.hs1.adminMatrixUserId),
							);

							expect(dmRoomsAfterLeave.length).toBe(2);
						});

						it('should return the oldest room when trying to create a new DM with same users', async () => {
							const response = await rcUser1.config.request
								.post(api('dm.create'))
								.set(rcUser1.config.credentials)
								.send({
									username: federationConfig.hs1.adminMatrixUserId,
								})
								.expect(200);

							expect(response.body).toHaveProperty('success', true);

							expect(response.body).toHaveProperty('room._id', rcRoom1on1._id);
						});
					});
				});
			});

			describe('Turning a 1:1 DM into a group DM', () => {
				let rcRoom: IRoomNativeFederated;
				let hs1Room1: Room;

				const rcUser1 = {
					username: `dm-rc-dup-user1-${Date.now()}`,
					fullName: `DM RC Dup User1 ${Date.now()}`,
					get matrixId() {
						return `@${this.username}:${federationConfig.rc1.domain}`;
					},
					config: {} as IRequestConfig,
					user: {} as TestUser<IUser>,
				};

				const rcUser2 = {
					username: `dm-rc-dup-user2-${Date.now()}`,
					fullName: `DM RC Dup User2 ${Date.now()}`,
					get matrixId() {
						return `@${this.username}:${federationConfig.rc1.domain}`;
					},
					config: {} as IRequestConfig,
					user: {} as TestUser<IUser>,
				};

				beforeAll(async () => {
					// Create RC user
					rcUser1.user = await createUser(
						{
							username: rcUser1.username,
							password: 'random',
							email: `${rcUser1.username}@rocket.chat`,
							name: rcUser1.fullName,
						},
						rc1AdminRequestConfig,
					);

					rcUser1.config = await getRequestConfig(federationConfig.rc1.url, rcUser1.username, 'random');

					rcUser2.user = await createUser(
						{
							username: rcUser2.username,
							password: 'random',
							email: `${rcUser2.username}@rocket.chat`,
							name: rcUser2.fullName,
						},
						rc1AdminRequestConfig,
					);

					rcUser2.config = await getRequestConfig(federationConfig.rc1.url, rcUser2.username, 'random');
				});

				afterAll(async () => {
					await Promise.all([
						deleteUser(rcUser1.user, {}, rc1AdminRequestConfig),
						deleteUser(rcUser2.user, {}, rc1AdminRequestConfig),
						// deleteUser(rcUser3.user, {}, rc1AdminRequestConfig),
					]);
				});

				it('should not allow a user to turn a non-federated 1:1 DM into a group DM by adding a third external user', async () => {
					// Create 1:1 DM between two RC users
					const dmCreate = await rcUser1.config.request
						.post(api('dm.create'))
						.set(rcUser1.config.credentials)
						.send({
							username: rcUser2.username,
						})
						.expect(200);

					expect(dmCreate.body).toHaveProperty('success', true);
					expect(dmCreate.body).toHaveProperty('room');

					const response = await addUserToRoom({
						usernames: [federationConfig.hs1.additionalUser1.matrixUserId],
						rid: dmCreate.body.room._id,
						config: rcUser1.config,
					});

					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('message');

					// Parse the error message from the DDP response
					const messageData = JSON.parse(response.body.message);

					expect(messageData).toHaveProperty('error.error', 'error-cant-invite-for-direct-room');
				});

				it('should create a 1:1 a federated DM between', async () => {
					// Create 1:1 DM from RC user to another RC user
					const response = await rcUser1.config.request
						.post(api('dm.create'))
						.set(rcUser1.config.credentials)
						.send({
							username: federationConfig.hs1.adminMatrixUserId,
						})
						.expect(200);

					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('room');

					const roomInfo = await getRoomInfo(response.body.room._id, rcUser1.config);

					expect(roomInfo).toHaveProperty('room');

					rcRoom = roomInfo.room as IRoomNativeFederated;

					expect(rcRoom).toHaveProperty('_id');
					expect(rcRoom).toHaveProperty('t', 'd');
					expect(rcRoom).toHaveProperty('federation.mrid');
					expect(rcRoom).toHaveProperty('usersCount', 2);
				});

				it('should show the room name with only the invited Synapse user', async () => {
					// Check the subscription for the inviter
					const sub = await getSubscriptionByRoomId(rcRoom._id, rcUser1.config.credentials, rcUser1.config.request);

					// Should contain both invited users in the name
					expect(sub).toHaveProperty('name', federationConfig.hs1.adminMatrixUserId);
					expect(sub).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);
				});

				it('should show the invite to the third user', async () => {
					// invite from rocket.chat
					const response = await addUserToRoom({
						usernames: [federationConfig.hs1.additionalUser1.matrixUserId],
						rid: rcRoom._id,
						config: rcUser1.config,
					});

					expect(response.body).toHaveProperty('success', true);

					// Wait for invitation in Synapse
					await retry('waiting for room invitation', async () => {
						hs1Room1 = hs1User1.matrixClient.getRoom(rcRoom.federation.mrid) as Room;

						expect(hs1Room1).toBeDefined();
						expect(hs1Room1).toHaveProperty('roomId', rcRoom.federation.mrid);
						expect(hs1Room1.getMyMembership()).toBe('invite');
					});
				});

				it('should update the room name to reflect the three users after the third user accepts the invitation', async () => {
					await hs1User1.matrixClient.joinRoom(rcRoom.federation.mrid);

					await retry(
						'wait for the room name to be updated',
						async () => {
							const subA = await getSubscriptionByRoomId(rcRoom._id, rcUser1.config.credentials, rcUser1.config.request);

							expect(subA).not.toHaveProperty('status');
							expect(subA).toHaveProperty(
								'name',
								`${federationConfig.hs1.adminMatrixUserId}, ${federationConfig.hs1.additionalUser1.matrixUserId}`,
							);
							expect(subA).toHaveProperty(
								'fname',
								`${federationConfig.hs1.adminMatrixUserId}, ${federationConfig.hs1.additionalUser1.matrixUserId}`,
							);
						},
						{ delayMs: 100 },
					);

					// Verify room info shows correct user count
					const roomInfo = await getRoomInfo(rcRoom._id, rcUser1.config);

					expect(roomInfo).toHaveProperty('room');
					expect(roomInfo.room).toHaveProperty('usersCount', 3);
				});

				// TODO we're creating DMs with powerlevel 50 for invites, so this is not working
				it.failing('should invite a fourth user from Rocket.Chat by a Synapse user', async () => {
					await hs1User1.inviteUserToRoom(hs1Room1.roomId, rcUser2.matrixId);

					await retry('waiting for fourth user to receive invitation', async () => {
						const subscriptionInvite = await getSubscriptionByRoomId(rcRoom._id, rcUser2.config.credentials, rcUser2.config.request);

						expect(subscriptionInvite).toHaveProperty('status', 'INVITED');
						expect(subscriptionInvite).toHaveProperty(
							'fname',
							`${federationConfig.hs1.adminMatrixUserId}, ${federationConfig.hs1.additionalUser1.matrixUserId}, ${rcUser1.matrixId}`,
						);
					});
				});
			});
		});
	});
});

import type { IRoom, IRoomNativeFederated, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { MatrixEvent, Room, RoomEmittedEvents } from 'matrix-js-sdk';
import { RoomStateEvent } from 'matrix-js-sdk';

import { api } from '../../../../../apps/meteor/tests/data/api-data';
import {
	acceptRoomInvite,
	getRoomInfo,
	getSubscriptionByRoomId,
	getSubscriptions,
} from '../../../../../apps/meteor/tests/data/rooms.helper';
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

				it('should leave the DM from Rocket.Chat', async () => {
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

			it.todo('should reflect the revoke invitation in the RC user subscriptions');
		});

		describe('Rocket.Chat as the resident server', () => {
			it.todo('should create a DM and invite user from synapse');
			// const createResponse = await createDirectMessage({
			// 	usernames: [federationConfig.hs1.adminMatrixUserId],
			// 	config: rc1AdminRequestConfig,
			// });

			// expect(createResponse.status).toBe(200);
			// expect(createResponse.body).toHaveProperty('success', true);
			// // createResponse.body.room._rid;

			// const sub = await getSubscriptions(rc1AdminRequestConfig).then((subs) =>
			// 	subs.update.find((subscription) => subscription.rid === createResponse.body.room._rid),
			// );
			// expect(sub).toHaveProperty('rid', createResponse.body.room._rid);

			// expect(sub).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);

			it.todo('should display the fname properly after reject the invitation');
			it.todo('should display the fname properly after accept the invitation');
			it.todo('should allow the user to leave the DM if it is not the only member');
			it.todo('should not allow to leave if the user is the only member');
		});
	});

	describe('Multiple user DMs', () => {
		describe('Synapse as the resident server', () => {
			let rcUser1: TestUser<IUser>;
			let rcUser2: TestUser<IUser>;

			let rcUserConfig1: IRequestConfig;
			let rcUserConfig2: IRequestConfig;

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
				await Promise.all([deleteUser(rcUser1, {}, rc1AdminRequestConfig), deleteUser(rcUser2, {}, rc1AdminRequestConfig)]);
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

						// check pending invitations for user 1
						pendingInvitation1 = await getSubscriptionByRoomId(rcRoom1._id, rcUserConfig1.credentials);

						expect(pendingInvitation1).toHaveProperty('status', 'INVITED');
						expect(pendingInvitation1).toHaveProperty('fname', `@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`);

						// check pending invitations for user 2
						pendingInvitation2 = await getSubscriptionByRoomId(rcRoom1._id, rcUserConfig2.credentials);

						expect(pendingInvitation2).toHaveProperty('status', 'INVITED');

						// TODO fix fname update
						// expect(pendingInvitation2).toHaveProperty('fname', `@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`);
					});
					const membersBefore = await hs1Room.getMembers();

					expect(membersBefore.length).toBe(3);

					const invitedMember = membersBefore.find((member) => member.userId === userDmId1);

					expect(invitedMember).toHaveProperty('membership', 'invite');
				});

				it('should display the name of the inviter on RC', async () => {
					expect(pendingInvitation1).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);
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
							const sub = await getSubscriptionByRoomId(rcRoom1._id, rcUserConfig1.credentials);

							expect(sub).not.toHaveProperty('status');
							expect(sub).toHaveProperty('name', `${federationConfig.hs1.adminMatrixUserId}, ${userDm2}`);
							expect(sub).toHaveProperty('fname', `${federationConfig.hs1.adminMatrixUserId}, ${userDm2Name}`);
						},
						{ delayMs: 100 },
					);
				});
				it.todo('should update the display the name if the inviter from Synapse leaves the group DM');

				it.todo('should respect max users allowed in a group DM when adding users');
				it.todo('should update roomsCount after first user accept the invitation');
				it.todo('should not update last message when third user accepts the invitation');
			});
			describe('Permission validations', () => {
				it.todo('should allow a user to add another user to the group DM');
				it.todo('should allow a user to leave the group DM');
			});
			describe('Turning a 1:1 DM into a group DM', () => {
				it.todo('should show the invite to the third user');
				it.todo('should update the room name to reflect the three users after the third user accepts the invitation');
			});
		});
		describe('Rocket.Chat as the resident server', () => {
			describe('Room list name validations', () => {
				it.todo('should display the fname containing the two invited users for the inviter');
				it.todo("should display only the inviter's username for the invited user");
				it.todo('should update the fname when a user leaves the DM');
				it.todo('should update the fname when a user is added to the DM');
			});
			describe('Permission validations', () => {
				it.todo('should add a user to the DM');
				it.todo('should add another user by another user than the initial inviter');
			});
			describe('Duplicated rooms', () => {
				describe('When the third user leaves a DM', () => {
					describe('When there is an existing non-federated DM with the same users', () => {
						it.todo('should have two DMs with same users');
						it.todo('should return the non-federated room when trying to create a new DM with same users');
					});
					describe('When there is only federated DMs', () => {
						it.todo('should have two DMs with same users');
						it.todo('should return the oldest room when trying to create a new DM with same users');
					});
				});
			});
			describe('Turning a 1:1 DM into a group DM', () => {
				it.todo('should show the invite to the third user');
				it.todo('should update the room name to reflect the three users after the third user accepts the invitation');
			});
		});
	});
});

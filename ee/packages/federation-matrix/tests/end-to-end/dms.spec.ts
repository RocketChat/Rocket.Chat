import type { IUser } from '@rocket.chat/core-typings';
import type { MatrixEvent, Room, RoomEmittedEvents } from 'matrix-js-sdk';
import { RoomStateEvent } from 'matrix-js-sdk';

import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { acceptRoomInvite, createDirectMessage, createRoom, getSubscriptions } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { getRequestConfig, createUser, deleteUser } from '../../../../../apps/meteor/tests/data/users.helper';
import type { TestUser, IRequestConfig } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { federationConfig } from '../helper/config';
import { SynapseClient } from '../helper/synapse-client';

const waitForRoomEvent = async (room: Room, eventType: RoomEmittedEvents, validateEvent: (event: MatrixEvent) => void, timeoutMs = 5000) =>
	Promise.race([
		new Promise<void>((resolve, reject) => {
			room.once(eventType, async (event: MatrixEvent) => {
				try {
					await validateEvent(event);
					resolve();
				} catch (error) {
					reject(error);
				}
			});
		}),
		new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for event')), timeoutMs)),
	]);

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

		// Create user1 request config for RC1
		// rc1User1RequestConfig = await getRequestConfig(
		// 	federationConfig.rc1.url,
		// 	federationConfig.rc1.additionalUser1.username,
		// 	federationConfig.rc1.additionalUser1.password,
		// );

		// Create admin Synapse client for HS1
		hs1AdminApp = new SynapseClient(federationConfig.hs1.url, federationConfig.hs1.adminUser, federationConfig.hs1.adminPassword);
		await hs1AdminApp.initialize();

		// Create user1 Synapse client for HS1
		// hs1User1App = new SynapseClient(
		// 	federationConfig.hs1.url,
		// 	federationConfig.hs1.additionalUser1.matrixUserId,
		// 	federationConfig.hs1.additionalUser1.password,
		// );
		// await hs1User1App.initialize();
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
		let rcUser: TestUser<IUser>;
		let rcUserConfig: IRequestConfig;
		let hs1Room: Room | null;
		let invitedRoomId: string;

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

		describe('Residend Synapse', () => {
			it('should create a DM and invite user from rc', async () => {
				hs1Room = await hs1AdminApp.createDM([userDmId]);

				expect(hs1Room).toHaveProperty('roomId');

				const subs = await getSubscriptions(rcUserConfig);

				const pendingInvitation = subs.update.find(
					(subscription) =>
						subscription.status === 'INVITED' &&
						subscription.fname?.includes(`@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`),
				);

				expect(pendingInvitation).toHaveProperty('rid');

				const membersBefore = await hs1Room!.getMembers();

				expect(membersBefore.length).toBe(2);

				const invitedMember = membersBefore.find((member) => member.userId === userDmId);

				expect(invitedMember).toHaveProperty('membership', 'invite');

				invitedRoomId = pendingInvitation!.rid;

				const response = await acceptRoomInvite(invitedRoomId, rcUserConfig);
				expect(response.success).toBe(true);

				await waitForRoomEvent(hs1Room!, RoomStateEvent.Members, ({ event }) => {
					expect(event).toHaveProperty('content.membership', 'join');
					expect(event).toHaveProperty('state_key', userDmId);
				});
			});

			it('should leave the DM from Rocket.Chat', async () => {
				const subs = await getSubscriptions(rcUserConfig);

				const dmSubscription = subs.update.find(
					(subscription) =>
						subscription.t === 'd' && subscription.fname?.includes(`@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`),
				);

				expect(dmSubscription).toHaveProperty('rid');

				const response = await rcUserConfig.request
					.post(api('rooms.leave'))
					.set(rcUserConfig.credentials)
					.send({
						roomId: invitedRoomId,
					})
					.expect(200);

				expect(response.body).toHaveProperty('success', true);

				await waitForRoomEvent(hs1Room!, RoomStateEvent.Members, ({ event }) => {
					expect(event).toHaveProperty('content.membership', 'leave');
					expect(event).toHaveProperty('state_key', userDmId);
				});
			});

			it.todo('should reflect the revoke invitation in the RC user subscriptions');
		});

		describe('Resident RC', () => {
			it('should create a DM and invite user from synapse', async () => {
				const createResponse = await createDirectMessage({
					usernames: [federationConfig.hs1.adminMatrixUserId],
					config: rc1AdminRequestConfig,
				});

				expect(createResponse.status).toBe(200);
				expect(createResponse.body).toHaveProperty('success', true);
				// createResponse.body.room._rid;

				const sub = await getSubscriptions(rc1AdminRequestConfig).then((subs) =>
					subs.update.find((subscription) => subscription.rid === createResponse.body.room._rid),
				);
				expect(sub).toHaveProperty('rid', createResponse.body.room._rid);

				expect(sub).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);
			});

			it.todo('should display the fname properly after reject the invitation');
			it.todo('should display the fname properly after accept the invitation');
			it.todo('should allow the user to leave the DM if it is not the only member');
			it.todo('should not allow to leave if the user is the only member');
		});
	});

	describe('Multiple user DMs', () => {
		describe('Resident RC', () => {
			describe('fname display', () => {
				it.todo('should display the fname containing the two invited users for the inviter');
				it.todo("should display only the inviter's username for the invited user");
				it.todo('should update the fname when a user leaves the DM');
				it.todo('should update the fname when a user is added to the DM');
			});
			describe('permissions', () => {
				it.todo('should possible to add a user to the DM');
				it.todo('should possible to add for another user besides the initial inviter');
			});
		});
	});

	describe('Group Direct Messages', () => {
		let rcUser1: TestUser<IUser>;
		let rcUser2: TestUser<IUser>;

		let rcUserConfig1: IRequestConfig;
		let rcUserConfig2: IRequestConfig;

		let hs1Room: Room | null;
		let invitedRoomId1: string;
		let invitedRoomId2: string;

		const userDm1 = `dm-federation-user1-${Date.now()}`;
		const userDmId1 = `@${userDm1}:${federationConfig.rc1.domain}`;

		const userDm2 = `dm-federation-user2-${Date.now()}`;
		const userDmId2 = `@${userDm2}:${federationConfig.rc1.domain}`;

		beforeAll(async () => {
			// create both RC and Synapse users
			rcUser1 = await createUser(
				{
					username: userDm1,
					password: 'random',
					email: `${userDm1}}@rocket.chat`,
					name: `DM Federation User ${Date.now()}`,
				},
				rc1AdminRequestConfig,
			);

			rcUserConfig1 = await getRequestConfig(federationConfig.rc1.url, rcUser1.username, 'random');

			rcUser2 = await createUser(
				{
					username: userDm2,
					password: 'random',
					email: `${userDm2}}@rocket.chat`,
					name: `DM Federation User ${Date.now()}`,
				},
				rc1AdminRequestConfig,
			);

			rcUserConfig2 = await getRequestConfig(federationConfig.rc1.url, rcUser2.username, 'random');
		});

		afterAll(async () => {
			// delete both RC and Synapse users
			// await Promise.all([deleteUser(rcUser1, {}, rc1AdminRequestConfig), deleteUser(rcUser2, {}, rc1AdminRequestConfig)]);
		});

		it('should create a DM from Synapse', async () => {
			hs1Room = await hs1AdminApp.createDM([userDmId1, userDmId2, '@diego:rc.host']);

			console.log('Created HS1 room:', hs1Room);

			expect(hs1Room).toHaveProperty('roomId');

			const subs1 = await getSubscriptions(rcUserConfig1);

			console.log('Subscriptions for user 1:', subs1);

			const pendingInvitation1 = subs1.update.find(
				(subscription) =>
					subscription.status === 'INVITED' &&
					subscription.fname?.includes(`@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`),
			);

			console.log('pendingInvitation1 ->', pendingInvitation1);

			expect(pendingInvitation1).toHaveProperty('rid');
			expect(pendingInvitation1).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);

			const membersBefore = await hs1Room!.getMembers();

			expect(membersBefore.length).toBe(3);

			const invitedMember = membersBefore.find((member) => member.userId === userDmId1);

			expect(invitedMember).toHaveProperty('membership', 'invite');

			invitedRoomId1 = pendingInvitation1!.rid;

			const waitForRoomEventPromise1 = waitForRoomEvent(hs1Room!, RoomStateEvent.Members, ({ event }) => {
				console.log('RECEIVED EVENT', event);

				expect(event).toHaveProperty('content.membership', 'join');
				expect(event).toHaveProperty('state_key', userDmId1);
			});

			const response = await acceptRoomInvite(invitedRoomId1, rcUserConfig1);
			expect(response.success).toBe(true);

			await waitForRoomEventPromise1;

			// approve user 2
			const subs2 = await getSubscriptions(rcUserConfig2);

			console.log('Subscriptions for user 2:', subs2);

			const pendingInvitation2 = subs2.update.find(
				(subscription) =>
					subscription.status === 'INVITED' &&
					subscription.fname?.includes(`@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`),
			);

			console.log('pendingInvitation2 ->', pendingInvitation2);

			expect(pendingInvitation2).toHaveProperty('rid');
			expect(pendingInvitation2).toHaveProperty('fname', federationConfig.hs1.adminMatrixUserId);

			const membersBefore2 = await hs1Room!.getMembers();

			expect(membersBefore2.length).toBe(3);

			const invitedMember2 = membersBefore2.find((member) => member.userId === userDmId2);

			expect(invitedMember2).toHaveProperty('membership', 'invite');

			invitedRoomId2 = pendingInvitation2!.rid;

			const waitForRoomEventPromise2 = waitForRoomEvent(hs1Room!, RoomStateEvent.Members, ({ event }) => {
				console.log('RECEIVED EVENT2222', event);

				expect(event).toHaveProperty('content.membership', 'join');
				expect(event).toHaveProperty('state_key', userDmId2);
			});

			const response2 = await acceptRoomInvite(invitedRoomId2, rcUserConfig2);
			expect(response2.success).toBe(true);

			console.log('response2 ->', response2);

			await waitForRoomEventPromise2;
		});

		it.skip('should leave the DM from Rocket.Chat', async () => {
			const subs = await getSubscriptions(rcUserConfig);

			const dmSubscription = subs.update.find(
				(subscription) =>
					subscription.t === 'd' && subscription.fname?.includes(`@${federationConfig.hs1.adminUser}:${federationConfig.hs1.domain}`),
			);

			expect(dmSubscription).toHaveProperty('rid');

			const response = await rcUserConfig.request
				.post(api('rooms.leave'))
				.set(rcUserConfig.credentials)
				.send({
					roomId: invitedRoomId,
				})
				.expect(200);

			expect(response.body).toHaveProperty('success', true);

			await Promise.race([
				new Promise<void>((resolve) => {
					hs1Room?.once(RoomStateEvent.Members, ({ event }) => {
						expect(event).toHaveProperty('content.membership', 'leave');
						expect(event).toHaveProperty('state_key', userDmId);

						resolve();
					});
				}),
				new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout waiting for membership change')), 5000)),
			]);
		});
	});
});

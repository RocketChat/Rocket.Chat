import type { IRoomNativeFederated, IUser } from '@rocket.chat/core-typings';
import { Visibility } from 'matrix-js-sdk';

import type {} from '../../../../../apps/meteor/app/api/server/v1/rooms.ts';
import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { createRoom, acceptRoomInvite, getRoomMembers } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { type IRequestConfig, getRequestConfig, createUser } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { federationConfig } from '../helper/config';
import { SynapseClient } from '../helper/synapse-client';

(IS_EE ? describe : describe.skip)('Federation Ban/Unban', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	let rc1User1RequestConfig: IRequestConfig;
	let hs1AdminApp: SynapseClient;

	beforeAll(async () => {
		rc1AdminRequestConfig = await getRequestConfig(
			federationConfig.rc1.url,
			federationConfig.rc1.adminUser,
			federationConfig.rc1.adminPassword,
		);

		await createUser(
			{
				username: federationConfig.rc1.additionalUser1.username,
				password: federationConfig.rc1.additionalUser1.password,
				email: `${federationConfig.rc1.additionalUser1.username}@rocket.chat`,
				name: federationConfig.rc1.additionalUser1.username,
			},
			rc1AdminRequestConfig,
		);

		rc1User1RequestConfig = await getRequestConfig(
			federationConfig.rc1.url,
			federationConfig.rc1.additionalUser1.username,
			federationConfig.rc1.additionalUser1.password,
		);

		hs1AdminApp = new SynapseClient(federationConfig.hs1.url, federationConfig.hs1.adminUser, federationConfig.hs1.adminPassword);
		await hs1AdminApp.initialize();
	});

	afterAll(async () => {
		if (hs1AdminApp) {
			await hs1AdminApp.close();
		}
	});

	describe('Ban from RC side', () => {
		let channelName: string;
		let federatedChannelId: string;

		beforeAll(async () => {
			channelName = `fed-ban-rc-${Date.now()}`;

			const createResponse = await createRoom({
				type: 'p',
				name: channelName,
				members: [federationConfig.hs1.adminMatrixUserId, federationConfig.rc1.additionalUser1.username],
				extraData: { federated: true },
				config: rc1AdminRequestConfig,
			});

			federatedChannelId = createResponse.body.group._id;

			// Accept invitation on Synapse side
			await hs1AdminApp.acceptInvitationForRoomName(channelName);

			// Accept invitation for the local RC user
			await acceptRoomInvite(federatedChannelId, rc1User1RequestConfig);

			// Wait for Synapse to see the RC user
			await retry(
				'wait for RC user on Synapse',
				async () => {
					const member = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.additionalUser1.matrixUserId);
					expect(member).not.toBeNull();
					expect(member!.membership).toBe('join');
				},
				{ retries: 10, delayMs: 2000 },
			);
		}, 30000);

		it('should ban the RC user via rooms.banUser', async () => {
			const response = await rc1AdminRequestConfig.request.post(api('rooms.banUser')).set(rc1AdminRequestConfig.credentials).send({
				roomId: federatedChannelId,
				userId: rc1User1RequestConfig.credentials['X-User-Id'],
			});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
		});

		it('should list the banned user via rooms.bannedUsers', async () => {
			const response = await rc1AdminRequestConfig.request
				.get(api('rooms.bannedUsers'))
				.set(rc1AdminRequestConfig.credentials)
				.query({ roomId: federatedChannelId });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
			expect(response.body.bannedUsers).toEqual(
				expect.arrayContaining([expect.objectContaining({ _id: rc1User1RequestConfig.credentials['X-User-Id'] })]),
			);
		});

		it('should reflect ban on Synapse side', async () => {
			await retry(
				'wait for ban on Synapse',
				async () => {
					const member = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.additionalUser1.matrixUserId);
					expect(member).not.toBeNull();
					expect(member!.membership).toBe('ban');
				},
				{ retries: 10, delayMs: 2000 },
			);
		});

		it('should not list banned user in room members', async () => {
			const membersResponse = await getRoomMembers(federatedChannelId, rc1AdminRequestConfig);
			const banned = membersResponse.members.find((m: IUser) => m._id === rc1User1RequestConfig.credentials['X-User-Id']);
			expect(banned).toBeUndefined();
		});

		it('should unban the user via rooms.unbanUser', async () => {
			const response = await rc1AdminRequestConfig.request.post(api('rooms.unbanUser')).set(rc1AdminRequestConfig.credentials).send({
				roomId: federatedChannelId,
				userId: rc1User1RequestConfig.credentials['X-User-Id'],
			});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
		});

		it('should no longer list the user as banned', async () => {
			const response = await rc1AdminRequestConfig.request
				.get(api('rooms.bannedUsers'))
				.set(rc1AdminRequestConfig.credentials)
				.query({ roomId: federatedChannelId });

			expect(response.status).toBe(200);
			const bannedIds = (response.body.bannedUsers || []).map((u: any) => u._id);
			expect(bannedIds).not.toContain(rc1User1RequestConfig.credentials['X-User-Id']);
		});

		it('should reflect unban on Synapse side', async () => {
			await retry(
				'wait for unban on Synapse',
				async () => {
					const member = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.additionalUser1.matrixUserId);
					expect(member).not.toBeNull();
					expect(member!.membership).not.toBe('ban');
				},
				{ retries: 10, delayMs: 2000 },
			);
		});
	});

	describe('Ban from Synapse side', () => {
		let channelName: string;
		let federatedChannelId: string;
		let synapseRoomId: string;

		beforeAll(async () => {
			channelName = `fed-ban-synapse-${Date.now()}`;
			synapseRoomId = await hs1AdminApp.createRoom(channelName, Visibility.Private);

			await hs1AdminApp.inviteUserToRoom(synapseRoomId, federationConfig.rc1.additionalUser1.matrixUserId);
			await hs1AdminApp.inviteUserToRoom(synapseRoomId, federationConfig.rc1.adminMatrixUserId);

			const roomsResponse = await rc1AdminRequestConfig.request.get(api('rooms.get')).set(rc1AdminRequestConfig.credentials).expect(200);

			expect(roomsResponse.body).toHaveProperty('success', true);
			expect(roomsResponse.body).toHaveProperty('update');

			const rcRoom = roomsResponse.body.update.find(
				(room: IRoomNativeFederated) => room.federation?.mrid === synapseRoomId,
			) as IRoomNativeFederated | null;

			expect(rcRoom).not.toBeNull();

			federatedChannelId = rcRoom!._id;

			// Accept invitation for the local RC user
			await acceptRoomInvite(federatedChannelId, rc1User1RequestConfig);
			await acceptRoomInvite(federatedChannelId, rc1AdminRequestConfig);

			// Wait for Synapse to see the RC user
			await retry(
				'wait for RC user on Synapse',
				async () => {
					const member = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.additionalUser1.matrixUserId);
					expect(member).not.toBeNull();
					expect(member!.membership).toBe('join');
				},
				{ retries: 10, delayMs: 2000 },
			);
		}, 30000);

		it('should ban the RC user from Synapse', async () => {
			await hs1AdminApp.banUser(synapseRoomId, federationConfig.rc1.additionalUser1.matrixUserId, 'federation ban test');
		});

		it('should reflect ban on RC side', async () => {
			await retry(
				'wait for ban to propagate to RC',
				async () => {
					const response = await rc1AdminRequestConfig.request
						.get(api('rooms.bannedUsers'))
						.set(rc1AdminRequestConfig.credentials)
						.query({ roomId: federatedChannelId });

					expect(response.status).toBe(200);
					expect(response.body.bannedUsers).toEqual(
						expect.arrayContaining([expect.objectContaining({ _id: rc1User1RequestConfig.credentials['X-User-Id'] })]),
					);
				},
				{ retries: 10, delayMs: 2000 },
			);
		});

		it('should not list banned user in room members on RC side', async () => {
			const membersResponse = await getRoomMembers(federatedChannelId, rc1AdminRequestConfig);
			const banned = membersResponse.members.find((m: IUser) => m._id === rc1User1RequestConfig.credentials['X-User-Id']);
			expect(banned).toBeUndefined();
		});

		it('should unban the RC user from Synapse', async () => {
			await hs1AdminApp.unbanUser(synapseRoomId, federationConfig.rc1.additionalUser1.matrixUserId);
		});

		it('should reflect unban on RC side', async () => {
			await retry(
				'wait for unban to propagate to RC',
				async () => {
					const response = await rc1AdminRequestConfig.request
						.get(api('rooms.bannedUsers'))
						.set(rc1AdminRequestConfig.credentials)
						.query({ roomId: federatedChannelId });

					expect(response.status).toBe(200);
					const bannedIds = (response.body.bannedUsers || []).map((u: any) => u._id);
					expect(bannedIds).not.toContain(rc1User1RequestConfig.credentials['X-User-Id']);
				},
				{ retries: 10, delayMs: 2000 },
			);
		});
	});
});

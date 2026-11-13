import assert from 'node:assert/strict';

import type { IMessage, IRoomNativeFederated, IUser } from '@rocket.chat/core-typings';
import { Visibility } from 'matrix-js-sdk';

import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { sendMessage } from '../../../../../apps/meteor/tests/data/messages.helper';
import { retry } from '../../../../../apps/meteor/tests/data/retry';
import { acceptRoomInvite, getGroupHistory } from '../../../../../apps/meteor/tests/data/rooms.helper';
import {
	type IRequestConfig,
	type TestUser,
	createUser,
	deleteUser,
	getRequestConfig,
} from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { federationConfig } from '../helper/config';
import { SynapseClient } from '../helper/synapse-client';

const roomVersions = [
	{ roomVersion: '11', requestedVersion: '11' },
	// Synapse's configured default, which every other spec runs on
	{ roomVersion: '12', requestedVersion: undefined },
];

(IS_EE ? describe : describe.skip).each(roomVersions)(
	'Federation rooms on room version $roomVersion',
	({ roomVersion, requestedVersion }) => {
		let rc1AdminRequestConfig: IRequestConfig;
		let rcUser: TestUser<IUser>;
		let rcUserConfig: IRequestConfig;
		let hs1AdminApp: SynapseClient;

		const rcUsername = `fed-room-v${roomVersion}-user-${Date.now()}`;
		const rcUserMatrixId = `@${rcUsername}:${federationConfig.rc1.domain}`;

		const findRcRoom = async (matrixRoomId: string) => {
			const response = await rcUserConfig.request.get(api('rooms.get')).set(rcUserConfig.credentials).expect(200);

			const rcRoom = response.body.update.find((room: IRoomNativeFederated) => room.federation?.mrid === matrixRoomId) as
				IRoomNativeFederated | undefined;

			assert(rcRoom);
			return rcRoom;
		};

		beforeAll(async () => {
			rc1AdminRequestConfig = await getRequestConfig(
				federationConfig.rc1.url,
				federationConfig.rc1.adminUser,
				federationConfig.rc1.adminPassword,
			);

			rcUser = await createUser(
				{ username: rcUsername, password: 'random', email: `${rcUsername}@rocket.chat`, name: rcUsername },
				rc1AdminRequestConfig,
			);
			rcUserConfig = await getRequestConfig(federationConfig.rc1.url, rcUsername, 'random');

			hs1AdminApp = new SynapseClient(federationConfig.hs1.url, federationConfig.hs1.adminUser, federationConfig.hs1.adminPassword);
			await hs1AdminApp.initialize();
		}, 60000);

		afterAll(async () => {
			await hs1AdminApp?.close();

			if (rcUser) {
				await deleteUser(rcUser, {}, rc1AdminRequestConfig);
			}
		});

		describe('group created on Synapse', () => {
			const channelName = `fed-room-v${roomVersion}-group-${Date.now()}`;
			let matrixRoomId: string;
			let rcRoom: IRoomNativeFederated;

			it(`should create a version ${roomVersion} room on Synapse`, async () => {
				matrixRoomId = await hs1AdminApp.createRoom(channelName, Visibility.Private, requestedVersion);

				await retry(
					'waiting for Synapse to sync the room state',
					() => {
						expect(hs1AdminApp.matrixClient.getRoom(matrixRoomId)?.getVersion()).toBe(roomVersion);
					},
					{ retries: 10, delayMs: 1000 },
				);
			});

			it('should bring the invite to Rocket.Chat with Synapse as the room origin', async () => {
				await hs1AdminApp.inviteUserToRoom(matrixRoomId, rcUserMatrixId);

				await retry(
					'waiting for the invite to reach Rocket.Chat',
					async () => {
						rcRoom = await findRcRoom(matrixRoomId);
					},
					{ retries: 10, delayMs: 2000 },
				);

				expect(rcRoom).toHaveProperty('t', 'p');
				expect(rcRoom).toHaveProperty('federation.origin', federationConfig.hs1.domain);
			}, 30000);

			it('should join the room on Synapse when the invite is accepted', async () => {
				await acceptRoomInvite(rcRoom._id, rcUserConfig);

				await retry(
					'waiting for the join to reach Synapse',
					async () => {
						const member = await hs1AdminApp.findRoomMember(channelName, rcUserMatrixId);

						expect(member?.membership).toBe('join');
					},
					{ retries: 10, delayMs: 2000 },
				);
			}, 30000);

			it('should deliver a Synapse message to Rocket.Chat', async () => {
				const messageText = `from synapse v${roomVersion} ${Date.now()}`;
				await hs1AdminApp.sendTextMessage(channelName, messageText);

				await retry(
					'waiting for the message to reach Rocket.Chat',
					async () => {
						const history = await getGroupHistory(rcRoom._id, rcUserConfig);

						expect(history.messages.some((message: IMessage) => message.msg === messageText)).toBe(true);
					},
					{ retries: 10, delayMs: 1000 },
				);
			});

			it('should deliver a Rocket.Chat message to Synapse', async () => {
				const messageText = `from rocket.chat v${roomVersion} ${Date.now()}`;
				await sendMessage({ rid: rcRoom._id, msg: messageText, config: rcUserConfig });

				const synapseMessage = await hs1AdminApp.findMessageInRoom(channelName, messageText);

				expect(synapseMessage?.sender).toBe(rcUserMatrixId);
			});
		});

		describe('DM created on Synapse', () => {
			let matrixRoomId: string;
			let rcRoom: IRoomNativeFederated;

			const findSynapseMessage = (messageText: string) =>
				hs1AdminApp.matrixClient
					.getRoom(matrixRoomId)
					?.timeline.find((event) => event.getType() === 'm.room.message' && event.getContent().body === messageText);

			it(`should create a version ${roomVersion} DM on Synapse`, async () => {
				const room = await hs1AdminApp.createDM([rcUserMatrixId], requestedVersion);
				assert(room);
				matrixRoomId = room.roomId;

				await retry(
					'waiting for Synapse to sync the room state',
					() => {
						expect(hs1AdminApp.matrixClient.getRoom(matrixRoomId)?.getVersion()).toBe(roomVersion);
					},
					{ retries: 10, delayMs: 1000 },
				);
			});

			it('should bring the DM invite to Rocket.Chat with Synapse as the room origin', async () => {
				await retry(
					'waiting for the invite to reach Rocket.Chat',
					async () => {
						rcRoom = await findRcRoom(matrixRoomId);
					},
					{ retries: 10, delayMs: 2000 },
				);

				expect(rcRoom).toHaveProperty('t', 'd');
				expect(rcRoom).toHaveProperty('federation.origin', federationConfig.hs1.domain);
			}, 30000);

			it('should join the DM on Synapse when the invite is accepted', async () => {
				await acceptRoomInvite(rcRoom._id, rcUserConfig);

				await retry(
					'waiting for the join to reach Synapse',
					async () => {
						expect(hs1AdminApp.matrixClient.getRoom(matrixRoomId)?.getMember(rcUserMatrixId)?.membership).toBe('join');
					},
					{ retries: 10, delayMs: 2000 },
				);
			}, 30000);

			it('should deliver a Synapse message to Rocket.Chat', async () => {
				const messageText = `dm from synapse v${roomVersion} ${Date.now()}`;
				await hs1AdminApp.matrixClient.sendTextMessage(matrixRoomId, messageText);

				await retry(
					'waiting for the message to reach Rocket.Chat',
					async () => {
						const response = await rcUserConfig.request
							.get(api('dm.history'))
							.set(rcUserConfig.credentials)
							.query({ roomId: rcRoom._id })
							.expect(200);

						expect(response.body.messages.some((message: IMessage) => message.msg === messageText)).toBe(true);
					},
					{ retries: 10, delayMs: 1000 },
				);
			});

			it('should deliver a Rocket.Chat message to Synapse', async () => {
				const messageText = `dm from rocket.chat v${roomVersion} ${Date.now()}`;
				await sendMessage({ rid: rcRoom._id, msg: messageText, config: rcUserConfig });

				await retry(
					'waiting for the message to reach Synapse',
					async () => {
						expect(findSynapseMessage(messageText)?.getSender()).toBe(rcUserMatrixId);
					},
					{ retries: 10, delayMs: 1000 },
				);
			});
		});
	},
);

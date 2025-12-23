import type { IMessage, IUser } from '@rocket.chat/core-typings';

import {
	createRoom,
	getRoomInfo,
	getGroupHistory,
	findRoomMember,
	addUserToRoom,
	addUserToRoomSlashCommand,
	acceptRoomInvite,
	rejectRoomInvite,
	getRoomMembers,
	getSubscriptions,
} from '../../../../../apps/meteor/tests/data/rooms.helper';
import { type IRequestConfig, getRequestConfig, createUser, deleteUser } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry';
import { federationConfig } from '../helper/config';
import { createDDPListener } from '../helper/ddp-listener';
import { SynapseClient } from '../helper/synapse-client';

// import { KnownMembership } from 'matrix-js-sdk';
// import { t } from 'i18next';

(IS_EE ? describe : describe.skip)('Federation', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	let rc1User1RequestConfig: IRequestConfig;
	let hs1AdminApp: SynapseClient;
	let hs1User1App: SynapseClient;

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
		rc1User1RequestConfig = await getRequestConfig(
			federationConfig.rc1.url,
			federationConfig.rc1.additionalUser1.username,
			federationConfig.rc1.additionalUser1.password,
		);

		// Create admin Synapse client for HS1
		hs1AdminApp = new SynapseClient(federationConfig.hs1.url, federationConfig.hs1.adminUser, federationConfig.hs1.adminPassword);
		await hs1AdminApp.initialize();

		// Create user1 Synapse client for HS1
		hs1User1App = new SynapseClient(
			federationConfig.hs1.url,
			federationConfig.hs1.additionalUser1.matrixUserId,
			federationConfig.hs1.additionalUser1.password,
		);
		await hs1User1App.initialize();
	});

	afterAll(async () => {
		if (hs1AdminApp) {
			await hs1AdminApp.close();
		}
		if (hs1User1App) {
			await hs1User1App.close();
		}
	});

	describe('Rooms', () => {
		describe('Create direct message rooms', () => {
			// Creating a fresh user for this test suite to avoid collisions,
			// since DMs are unique for each user pair
			let userRequestConfig: IRequestConfig;
			let createdUser: IUser;
			beforeAll(async () => {
				const user = { username: `user-${Date.now()}`, password: '123' };
				createdUser = await createUser(user, rc1AdminRequestConfig);
				userRequestConfig = await getRequestConfig(federationConfig.rc1.url, user.username, user.password);
			});

			afterAll(async () => {
				await deleteUser(createdUser, {}, rc1AdminRequestConfig);
			});

			it('It should create a federated room when federated members are added', async () => {
				const response = await createRoom({
					type: 'd',
					username: federationConfig.hs1.adminMatrixUserId,
					config: userRequestConfig,
				});

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body).toHaveProperty('room');
				expect(response.body.room).toHaveProperty('_id');
				expect(response.body.room).toHaveProperty('t', 'd');

				const roomInfo = await getRoomInfo(response.body.room._id, userRequestConfig);
				expect(roomInfo.room).toHaveProperty('federated', true);
			});

			it('It should create a non-federated room when only local members are added', async () => {
				const response = await createRoom({
					type: 'd',
					username: federationConfig.rc1.additionalUser1.username,
					config: userRequestConfig,
				});

				expect(response.status).toBe(200);
				expect(response.body).toHaveProperty('success', true);
				expect(response.body).toHaveProperty('room');
				expect(response.body.room).toHaveProperty('_id');
				expect(response.body.room).toHaveProperty('t', 'd');

				const roomInfo = await getRoomInfo(response.body.room._id, userRequestConfig);
				expect(roomInfo.room).not.toHaveProperty('federated');
			});
		});

		describe('Create a room on RC as private, explicitly not federated, with federated users in creation modal', () => {
			describe('Add 1 federated user in the creation modal', () => {
				it('It should not allow the creation of the room', async () => {
					const channelName = `non-federated-channel-single-fed-${Date.now()}`;

					// RC view: Attempt to create a non-federated private room with 1 federated user
					const response = await createRoom({
						type: 'p',
						name: channelName,
						members: [federationConfig.hs1.adminMatrixUserId],
						extraData: {
							federated: false,
						},
						config: rc1AdminRequestConfig,
					});

					// RC view: Verify the room creation failed
					expect(response.status).toBe(400);
					expect(response.body).toHaveProperty('success', false);
					expect(response.body).toHaveProperty('errorType', 'error-federated-users-in-non-federated-rooms');
				});
			});

			describe('Add 2 federated users in the creation modal', () => {
				it('It should not allow the creation of the room', async () => {
					const channelName = `non-federated-channel-multi-fed-${Date.now()}`;

					// RC view: Attempt to create a non-federated private room with 2 federated users
					const response = await createRoom({
						type: 'p',
						name: channelName,
						members: [federationConfig.hs1.adminMatrixUserId, federationConfig.hs1.additionalUser1.matrixUserId],
						extraData: {
							federated: false,
						},
						config: rc1AdminRequestConfig,
					});

					// RC view: Verify the room creation failed
					expect(response.status).toBe(400);
					expect(response.body).toHaveProperty('success', false);
					expect(response.body).toHaveProperty('errorType', 'error-federated-users-in-non-federated-rooms');
				});
			});

			describe('Add 1 federated user and 1 local user in the creation modal', () => {
				it('It should not allow the creation of the room', async () => {
					const channelName = `non-federated-channel-mixed-${Date.now()}`;

					// RC view: Attempt to create a non-federated private room with 1 federated user and 1 local user
					const response = await createRoom({
						type: 'p',
						name: channelName,
						members: [federationConfig.hs1.adminMatrixUserId, federationConfig.rc1.additionalUser1.username],
						extraData: {
							federated: false,
						},
						config: rc1AdminRequestConfig,
					});

					// RC view: Verify the room creation failed
					expect(response.status).toBe(400);
					expect(response.body).toHaveProperty('success', false);
					expect(response.body).toHaveProperty('errorType', 'error-federated-users-in-non-federated-rooms');
				});
			});
		});

		describe('Create a room on RC as private, do not mark as federated and', () => {
			let nonFederatedChannel: { _id: string; name: string; t: string; federated?: boolean };

			beforeEach(async () => {
				const channelName = `non-federated-channel-${Date.now()}`;

				// Create a non-federated private room (without federated members)
				const createResponse = await createRoom({
					type: 'p',
					name: channelName,
					members: [],
					extraData: {
						federated: false,
					},
					config: rc1AdminRequestConfig,
				});

				nonFederatedChannel = createResponse.body.group;

				expect(nonFederatedChannel).toHaveProperty('_id');
				expect(nonFederatedChannel).toHaveProperty('name', channelName);
				expect(nonFederatedChannel).toHaveProperty('t', 'p');
				expect(nonFederatedChannel).not.toHaveProperty('federated', true);
			}, 10000);

			// No cleanup needed - rooms are left for debugging purposes

			describe('Go to the members list and try to add a federated user', () => {
				it('It should not allow and show an error message', async () => {
					// RC view: Attempt to add a federated user to the non-federated room
					const response = await addUserToRoom({
						usernames: [federationConfig.hs1.adminMatrixUserId],
						rid: nonFederatedChannel._id,
						config: rc1AdminRequestConfig,
					});

					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('message');

					// Parse the error message from the DDP response
					const messageData = JSON.parse(response.body.message);
					expect(messageData).toHaveProperty('error');
					expect(messageData.error).toHaveProperty('error', 'error-federated-users-in-non-federated-rooms');

					// RC view: Verify the federated user was NOT added to the room's member list
					const federatedUserInRoom = await findRoomMember(
						nonFederatedChannel._id,
						federationConfig.hs1.adminMatrixUserId,
						{ initialDelay: 0 },
						rc1AdminRequestConfig,
					);
					expect(federatedUserInRoom).toBeNull();

					// RC view: Verify room remains non-federated
					const roomInfo = await getRoomInfo(nonFederatedChannel._id, rc1AdminRequestConfig);
					expect(roomInfo.room).not.toHaveProperty('federated', true);
				});
			});

			describe('Go to the composer and use the /invite slash command to add a federated user', () => {
				it('It should not allow and show an error message', async () => {
					// Set up DDP listener to catch ephemeral messages
					const ddpListener = createDDPListener(federationConfig.rc1.url, rc1AdminRequestConfig);

					// Connect to DDP and subscribe to ephemeral messages
					await ddpListener.connect();

					// RC view: Execute the /invite slash command to add a federated user
					const response = await addUserToRoomSlashCommand({
						usernames: [federationConfig.hs1.adminMatrixUserId],
						rid: nonFederatedChannel._id,
						config: rc1AdminRequestConfig,
					});

					// The slash command returns success but broadcasts ephemeral messages
					// instead of throwing errors
					expect(response.body).toHaveProperty('success', true);
					expect(response.body).toHaveProperty('message');
					const messageData = JSON.parse(response.body.message);
					expect(messageData).toHaveProperty('msg', 'result');

					// Wait for the ephemeral message to be broadcast
					const ephemeralMessage = await ddpListener.waitForEphemeralMessage(
						'You cannot add external users to a non-federated room',
						5000, // 5 second timeout
						nonFederatedChannel._id,
					);

					// Verify the ephemeral message content
					expect(ephemeralMessage.msg).toContain('You cannot add external users to a non-federated room');
					expect(ephemeralMessage.u.username).toBe('rocket.cat');
					expect(ephemeralMessage.private).toBe(true);
					expect(ephemeralMessage.rid).toBe(nonFederatedChannel._id); // Verify it's for the correct room

					// RC view: Verify the federated user was NOT added to the room's member list
					const federatedUserInRoom = await findRoomMember(
						nonFederatedChannel._id,
						federationConfig.hs1.adminMatrixUserId,
						{},
						rc1AdminRequestConfig,
					);
					expect(federatedUserInRoom).toBeNull();

					// RC view: Verify room remains non-federated
					const roomInfo = await getRoomInfo(nonFederatedChannel._id, rc1AdminRequestConfig);
					expect(roomInfo.room).not.toHaveProperty('federated', true);

					ddpListener.disconnect();
				});
			});
		});

		describe('Create a room on RC as private and federated and', () => {
			describe('Add 1 federated user in the creation modal', () => {
				let channelName: string;
				let federatedChannel: any;

				beforeAll(async () => {
					channelName = `federated-channel-${Date.now()}`;

					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [federationConfig.hs1.adminMatrixUserId],
						extraData: {
							federated: true,
						},
						config: rc1AdminRequestConfig,
					});

					// For private groups, the response has 'group' property, not 'channel'
					federatedChannel = createResponse.body.group;

					expect(federatedChannel).toHaveProperty('_id');
					expect(federatedChannel).toHaveProperty('name', channelName);
					expect(federatedChannel).toHaveProperty('t', 'p');
					expect(federatedChannel).toHaveProperty('federated', true);
					expect(federatedChannel).toHaveProperty('federation');
					expect((federatedChannel as any).federation).toHaveProperty('version', 1);

					const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
					expect(acceptedRoomId).not.toBe('');

					// TODO: Figure out why syncing events are not working and uncomment this when we get the state change from
					// invite to join
					// const joinedRoomId = await this.hs1App.getRoomIdByRoomNameAndMembership(channelName, KnownMembership.Join);
					// expect(acceptedRoomId, 'Expected to have joined the room, but joinedRoomId is different from acceptedRoomId').to.equal(joinedRoomId);
				}, 10000);

				it('It should show the room on the remote Element or RC', async () => {
					// RC view: Check in RC
					const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
					expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
					expect(roomInfo.room).toHaveProperty('federated', true);

					// Synapse view: Check in Element
					const elementRoom = hs1AdminApp.getRoom(channelName);
					expect(elementRoom).toHaveProperty('name', channelName);
				});

				it('It should show the new user in the members list', async () => {
					// RC view: Check in RC that the federated user is in the members list
					const rc1AdminUserInRC = await findRoomMember(
						federatedChannel._id,
						federationConfig.rc1.adminUser,
						{ initialDelay: 0 },
						rc1AdminRequestConfig,
					);
					const hs1AdminUserInRC = await findRoomMember(
						federatedChannel._id,
						federationConfig.hs1.adminMatrixUserId,
						{ initialDelay: 0 },
						rc1AdminRequestConfig,
					);

					expect(rc1AdminUserInRC).not.toBeNull();
					expect(hs1AdminUserInRC).not.toBeNull();
					expect(hs1AdminUserInRC?.federated).toBe(true);

					// Synapse view: Check in Element (Matrix) that the federated user is in the members list
					const rc1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId, {
						delay: 2000,
					});
					const hs1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId, {
						delay: 2000,
					});
					expect(rc1AdminUserInSynapse).not.toBeNull();
					expect(hs1AdminUserInSynapse).not.toBeNull();
				});

				it('It should show the system message that the user was invited', async () => {
					// RC view: Check in RC. We don't check in Synapse because this is not part of the protocol
					// Get the room history to find the system message
					const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
					expect(Array.isArray(historyResponse.messages)).toBe(true);

					// Look for a system message about the user being invited
					// Members added during room creation are invited (status: 'INVITED'), not auto-joined
					const inviteMessage = historyResponse.messages.find(
						(message: IMessage) => message.t === 'ui' && message.msg && message.msg === federationConfig.hs1.adminMatrixUserId,
					);

					expect(inviteMessage).toBeDefined();
					expect(inviteMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					expect(inviteMessage?.u?.username).toBe(federationConfig.rc1.adminUser);
				});
			});

			describe('Add 2 or more federated users in the creation modal', () => {
				let channelName: string;
				let federatedChannel: any;

				beforeAll(async () => {
					channelName = `federated-channel-multi-${Date.now()}`;

					// Create room with both federated users
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [federationConfig.hs1.adminMatrixUserId, federationConfig.hs1.additionalUser1.matrixUserId],
						extraData: {
							federated: true,
						},
						config: rc1AdminRequestConfig,
					});

					// For private groups, the response has 'group' property, not 'channel'
					federatedChannel = createResponse.body.group;

					expect(federatedChannel).toHaveProperty('_id');
					expect(federatedChannel).toHaveProperty('name', channelName);
					expect(federatedChannel).toHaveProperty('t', 'p');
					expect(federatedChannel).toHaveProperty('federated', true);
					expect(federatedChannel).toHaveProperty('federation');
					expect((federatedChannel as any).federation).toHaveProperty('version', 1);

					// Accept invitations for both users
					const acceptedRoomId1 = await hs1AdminApp.acceptInvitationForRoomName(channelName);
					expect(acceptedRoomId1).not.toBe('');

					const acceptedRoomId2 = await hs1User1App.acceptInvitationForRoomName(channelName);
					expect(acceptedRoomId2).not.toBe('');

					// TODO: Figure out why syncing events are not working and uncomment this when we get the state change from
					// invite to join
					// const joinedRoomId = await this.hs1App.getRoomIdByRoomNameAndMembership(channelName, KnownMembership.Join);
					// expect(acceptedRoomId, 'Expected to have joined the room, but joinedRoomId is different from acceptedRoomId').to.equal(joinedRoomId);
				}, 15000);

				it('It should show the room on all the involved remote Element or RC', async () => {
					// RC view: Check in RC
					const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
					expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
					expect(roomInfo.room).toHaveProperty('federated', true);

					// Synapse view: Check in Element for admin user
					const elementRoom1 = hs1AdminApp.getRoom(channelName);
					expect(elementRoom1).toHaveProperty('name', channelName);

					// Synapse view: Check in Element for user1
					const elementRoom2 = hs1User1App.getRoom(channelName);
					expect(elementRoom2).toHaveProperty('name', channelName);
				});

				it('It should show the new users in the members list of all RCs involved', async () => {
					// RC view: Check in RC that both federated users are in the members list
					const rc1AdminUserInRC = await findRoomMember(federatedChannel._id, federationConfig.rc1.adminUser, {}, rc1AdminRequestConfig);
					const hs1AdminUserInRC = await findRoomMember(
						federatedChannel._id,
						federationConfig.hs1.adminMatrixUserId,
						{},
						rc1AdminRequestConfig,
					);
					const hs1User1InRC = await findRoomMember(
						federatedChannel._id,
						federationConfig.hs1.additionalUser1.matrixUserId,
						{},
						rc1AdminRequestConfig,
					);

					expect(rc1AdminUserInRC).not.toBeNull();
					expect(hs1AdminUserInRC).not.toBeNull();
					expect(hs1User1InRC).not.toBeNull();
					expect(hs1AdminUserInRC?.federated).toBe(true);
					expect(hs1User1InRC?.federated).toBe(true);

					// Synapse view: Check in Synapse (Matrix) for admin user that all users are in the members list
					const rc1AdminUserInSynapseAdmin = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId);
					const hs1AdminUserInSynapseAdmin = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId);
					const hs1User1InSynapseAdmin = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.additionalUser1.matrixUserId, {
						initialDelay: 2000,
					});

					expect(rc1AdminUserInSynapseAdmin).not.toBeNull();
					expect(hs1AdminUserInSynapseAdmin).not.toBeNull();
					expect(hs1User1InSynapseAdmin).not.toBeNull();

					// Synapse view: Check in Synapse (Matrix) for additional user that all users are in the members list
					const rc1AdminUserInSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId);
					const hs1AdminUserInSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId);
					const hs1User1InSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.hs1.additionalUser1.matrixUserId);

					expect(rc1AdminUserInSynapseUser1).not.toBeNull();
					expect(hs1AdminUserInSynapseUser1).not.toBeNull();
					expect(hs1User1InSynapseUser1).not.toBeNull();
				});

				it('It should show the system messages that the users were invited', async () => {
					// RC view: Check in RC. We don't check in Synapse because this is not part of the protocol
					// Get the room history to find the system messages
					const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
					expect(Array.isArray(historyResponse.messages)).toBe(true);

					// Look for system messages about both users being invited
					// Members added during room creation are invited (status: 'INVITED'), not auto-joined
					const adminInviteMessage = historyResponse.messages.find(
						(message: IMessage) => message.t === 'ui' && message.msg && message.msg === federationConfig.hs1.adminMatrixUserId,
					);

					const hs1User1InviteMessage = historyResponse.messages.find(
						(message: IMessage) => message.t === 'ui' && message.msg && message.msg === federationConfig.hs1.additionalUser1.matrixUserId,
					);

					expect(adminInviteMessage).toBeDefined();
					expect(adminInviteMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					expect(adminInviteMessage?.u?.username).toBe(federationConfig.rc1.adminUser);

					expect(hs1User1InviteMessage).toBeDefined();
					expect(hs1User1InviteMessage?.msg).toContain(federationConfig.hs1.additionalUser1.matrixUserId);
					expect(hs1User1InviteMessage?.u?.username).toBe(federationConfig.rc1.adminUser);
				});

				it('It should show the system messages that the users joined when they accept the invites', async () => {
					// RC view: Check in RC. We don't check in Synapse because this is not part of the protocol
					// Get the room history to find the system messages
					const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
					expect(Array.isArray(historyResponse.messages)).toBe(true);

					// Look for system messages about both users joining after accepting invites
					// 'uj' (user joined) message types
					const adminJoinedMessage = historyResponse.messages.find(
						(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
					);

					const hs1User1JoinedMessage = historyResponse.messages.find(
						(message: IMessage) =>
							message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.additionalUser1.matrixUserId),
					);

					expect(adminJoinedMessage).toBeDefined();
					expect(adminJoinedMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					expect(adminJoinedMessage?.u?.username).toBe(federationConfig.hs1.adminMatrixUserId);

					expect(hs1User1JoinedMessage).toBeDefined();
					expect(hs1User1JoinedMessage?.msg).toContain(federationConfig.hs1.additionalUser1.matrixUserId);
					expect(hs1User1JoinedMessage?.u?.username).toBe(federationConfig.hs1.additionalUser1.matrixUserId);
				});
			});

			describe('Add 1 federated user and 1 local user in the creation modal', () => {
				let channelName: string;
				let federatedChannel: any;

				beforeAll(async () => {
					channelName = `federated-channel-mixed-${Date.now()}`;

					// Create room with 1 federated user (from Synapse) and 1 local user (from RC)
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [
							federationConfig.hs1.adminMatrixUserId, // federated user
							federationConfig.rc1.additionalUser1.username, // local user
						],
						extraData: {
							federated: true,
						},
						config: rc1AdminRequestConfig,
					});

					// For private groups, the response has 'group' property, not 'channel'
					federatedChannel = createResponse.body.group;

					expect(federatedChannel).toHaveProperty('_id');
					expect(federatedChannel).toHaveProperty('name', channelName);
					expect(federatedChannel).toHaveProperty('t', 'p');
					expect(federatedChannel).toHaveProperty('federated', true);
					expect(federatedChannel).toHaveProperty('federation');
					expect((federatedChannel as any).federation).toHaveProperty('version', 1);

					// Accept invitation for the federated user
					const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
					expect(acceptedRoomId).not.toBe('');

					// Accept invitation for the local user (rc1User1)
					await acceptRoomInvite(federatedChannel._id, rc1User1RequestConfig);
				}, 15000);

				it('It should show the room on the remote Element or RC and local for the second user', async () => {
					// RC view: Check in RC (admin view)
					const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
					expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
					expect(roomInfo.room).toHaveProperty('federated', true);

					// RC view: Check in RC (user1 view - local user)
					const roomInfoUser1 = await getRoomInfo(federatedChannel._id, rc1User1RequestConfig);
					expect(roomInfoUser1.room).toHaveProperty('_id', federatedChannel._id);
					expect(roomInfoUser1.room).toHaveProperty('federated', true);

					// Synapse view: Check in Synapse (Matrix) for federated user
					const room = hs1AdminApp.getRoom(channelName);
					expect(room).toHaveProperty('name', channelName);
					expect(room.getMyMembership()).toBe('join');
				});

				it('It should show the 2 new users in the members list', async () => {
					// RC view: Check in RC (admin view) that both users are in the members list
					const rc1AdminUserInRC = await findRoomMember(federatedChannel._id, federationConfig.rc1.adminUser, {}, rc1AdminRequestConfig);
					const rc1User1InRC = await findRoomMember(
						federatedChannel._id,
						federationConfig.rc1.additionalUser1.username,
						{},
						rc1AdminRequestConfig,
					);
					const hs1AdminUserInRC = await findRoomMember(
						federatedChannel._id,
						federationConfig.hs1.adminMatrixUserId,
						{},
						rc1AdminRequestConfig,
					);

					expect(rc1AdminUserInRC).not.toBeNull();
					expect(rc1User1InRC).not.toBeNull();
					expect(hs1AdminUserInRC).not.toBeNull();
					expect(hs1AdminUserInRC?.federated).toBe(true);

					// RC view: Check in RC (user1 view) that both users are in the members list
					const rc1AdminUserInRCUser1 = await findRoomMember(
						federatedChannel._id,
						federationConfig.rc1.adminUser,
						{},
						rc1User1RequestConfig,
					);
					const rc1User1InRCUser1 = await findRoomMember(
						federatedChannel._id,
						federationConfig.rc1.additionalUser1.username,
						{},
						rc1User1RequestConfig,
					);
					const hs1AdminUserInRCUser1 = await findRoomMember(
						federatedChannel._id,
						federationConfig.hs1.adminMatrixUserId,
						{},
						rc1User1RequestConfig,
					);

					expect(rc1AdminUserInRCUser1).not.toBeNull();
					expect(rc1User1InRCUser1).not.toBeNull();
					expect(hs1AdminUserInRCUser1).not.toBeNull();
					expect(hs1AdminUserInRCUser1?.federated).toBe(true);

					// Synapse view: Check in Synapse (Matrix) that both users are in the members list
					const rc1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId, {
						initialDelay: 2000,
					});
					const rc1User1InSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.additionalUser1.matrixUserId, {
						initialDelay: 2000,
					});
					const hs1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId, {
						initialDelay: 2000,
					});

					expect(rc1AdminUserInSynapse).not.toBeNull();
					expect(rc1User1InSynapse).not.toBeNull();
					expect(hs1AdminUserInSynapse).not.toBeNull();
				});

				it('It should show the 2 system messages that the users were invited', async () => {
					// RC view: Check in RC (admin view) for system messages about both users being invited
					const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
					expect(Array.isArray(historyResponse.messages)).toBe(true);

					// Look for system messages about both users being invited
					// Members added during room creation are invited (status: 'INVITED'), not auto-joined
					const localUserInviteMessage = historyResponse.messages.find(
						(message: IMessage) => message.t === 'ui' && message.msg && message.msg === federationConfig.rc1.additionalUser1.username,
					);

					const federatedUserInviteMessage = historyResponse.messages.find(
						(message: IMessage) => message.t === 'ui' && message.msg && message.msg === federationConfig.hs1.adminMatrixUserId,
					);

					expect(localUserInviteMessage).toBeDefined();
					expect(localUserInviteMessage?.msg).toContain(federationConfig.rc1.additionalUser1.username);
					expect(localUserInviteMessage?.u?.username).toBe(federationConfig.rc1.adminUser);

					expect(federatedUserInviteMessage).toBeDefined();
					expect(federatedUserInviteMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					expect(federatedUserInviteMessage?.u?.username).toBe(federationConfig.rc1.adminUser);

					// RC view: Check in RC (user1 view) for system messages about both users being invited
					const historyResponseUser1 = await getGroupHistory(federatedChannel._id, rc1User1RequestConfig);
					expect(Array.isArray(historyResponseUser1.messages)).toBe(true);

					const localUserInviteMessageUser1 = historyResponseUser1.messages.find(
						(message: IMessage) => message.t === 'ui' && message.msg && message.msg === federationConfig.rc1.additionalUser1.username,
					);

					const federatedUserInviteMessageUser1 = historyResponseUser1.messages.find(
						(message: IMessage) => message.t === 'ui' && message.msg && message.msg === federationConfig.hs1.adminMatrixUserId,
					);

					expect(localUserInviteMessageUser1).toBeDefined();
					expect(federatedUserInviteMessageUser1).toBeDefined();
				});
			});
		});

		describe('Create a room on RC as private and federated, then invite users', () => {
			describe('Go to the members list and', () => {
				describe('Add a federated user', () => {
					let channelName: string;
					let federatedChannel: any;

					beforeAll(async () => {
						channelName = `federated-channel-invite-single-${Date.now()}`;

						// Create empty federated room without members
						const createResponse = await createRoom({
							type: 'p',
							name: channelName,
							members: [],
							extraData: {
								federated: true,
							},
							config: rc1AdminRequestConfig,
						});

						federatedChannel = createResponse.body.group;

						expect(federatedChannel).toHaveProperty('_id');
						expect(federatedChannel).toHaveProperty('name', channelName);
						expect(federatedChannel).toHaveProperty('t', 'p');
						expect(federatedChannel).toHaveProperty('federated', true);
						expect(federatedChannel).toHaveProperty('federation');
						expect((federatedChannel as any).federation).toHaveProperty('version', 1);

						// Wait for federation setup to complete (Matrix room creation and mrid assignment)
						// This ensures the room.federation.mrid field is properly set before adding users
						await new Promise((resolve) => setTimeout(resolve, 2000));

						// Add federated user to the room
						const addUserResponse = await addUserToRoom({
							usernames: [federationConfig.hs1.adminMatrixUserId],
							rid: federatedChannel._id,
							config: rc1AdminRequestConfig,
						});

						expect(addUserResponse.body).toHaveProperty('success', true);

						// Accept invitation for the federated user
						const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
						expect(acceptedRoomId).not.toBe('');
					}, 15000);

					it('It should show the room on the remote Element or RC', async () => {
						// RC view: Check in RC
						const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
						expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
						expect(roomInfo.room).toHaveProperty('federated', true);

						// Synapse view: Check in Element
						const elementRoom = hs1AdminApp.getRoom(channelName);
						expect(elementRoom).toHaveProperty('name', channelName);
					});

					it('It should show the new user in the members list', async () => {
						// RC view: Check in RC that both users are in the members list
						const rc1AdminUserInRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.rc1.adminUser,
							{ initialDelay: 0 },
							rc1AdminRequestConfig,
						);
						const hs1AdminUserInRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.adminMatrixUserId,
							{ initialDelay: 0 },
							rc1AdminRequestConfig,
						);

						expect(rc1AdminUserInRC).not.toBeNull();
						expect(hs1AdminUserInRC).not.toBeNull();
						expect(hs1AdminUserInRC?.federated).toBe(true);

						// Synapse view: Check in Element (Matrix) that both users are in the members list
						const rc1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId, {
							delay: 2000,
						});
						const hs1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId, {
							delay: 2000,
						});
						expect(rc1AdminUserInSynapse).not.toBeNull();
						expect(hs1AdminUserInSynapse).not.toBeNull();
					});

					it('It should show the system message that the user joined', async () => {
						// RC view: Check in RC
						// Get the room history to find the system messages
						const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
						expect(Array.isArray(historyResponse.messages)).toBe(true);

						// Look for system messages about the user joining after accepting invite
						// look for 'uj' (user joined) message types
						const joinedMessage = historyResponse.messages.find(
							(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
						);

						expect(joinedMessage).toBeDefined();
						expect(joinedMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					});
				});

				describe('Add 2 or more federated users at the same time', () => {
					let channelName: string;
					let federatedChannel: any;

					beforeAll(async () => {
						channelName = `federated-channel-invite-multi-${Date.now()}`;

						// Create empty federated room without members
						const createResponse = await createRoom({
							type: 'p',
							name: channelName,
							members: [],
							extraData: {
								federated: true,
							},
							config: rc1AdminRequestConfig,
						});

						federatedChannel = createResponse.body.group;

						expect(federatedChannel).toHaveProperty('_id');
						expect(federatedChannel).toHaveProperty('name', channelName);
						expect(federatedChannel).toHaveProperty('t', 'p');
						expect(federatedChannel).toHaveProperty('federated', true);
						expect(federatedChannel).toHaveProperty('federation');
						expect((federatedChannel as any).federation).toHaveProperty('version', 1);

						// Wait for federation setup to complete (Matrix room creation and mrid assignment)
						// This ensures the room.federation.mrid field is properly set before adding users
						await new Promise((resolve) => setTimeout(resolve, 2000));

						// Add both federated users to the room
						const addUserResponse = await addUserToRoom({
							usernames: [federationConfig.hs1.adminMatrixUserId, federationConfig.hs1.additionalUser1.matrixUserId],
							rid: federatedChannel._id,
							config: rc1AdminRequestConfig,
						});

						expect(addUserResponse.body).toHaveProperty('success', true);

						// Accept invitations for both users
						const acceptedRoomId1 = await hs1AdminApp.acceptInvitationForRoomName(channelName);
						expect(acceptedRoomId1).not.toBe('');

						const acceptedRoomId2 = await hs1User1App.acceptInvitationForRoomName(channelName);
						expect(acceptedRoomId2).not.toBe('');
					}, 15000);

					it('It should show the room on all the involved remote Element or RC', async () => {
						// RC view: Check in RC
						const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
						expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
						expect(roomInfo.room).toHaveProperty('federated', true);

						// Synapse view: Check in Element for admin user
						const elementRoom1 = hs1AdminApp.getRoom(channelName);
						expect(elementRoom1).toHaveProperty('name', channelName);

						// Synapse view: Check in Element for user1
						const elementRoom2 = hs1User1App.getRoom(channelName);
						expect(elementRoom2).toHaveProperty('name', channelName);
					});

					it('It should show the new users in the members list of all RCs involved', async () => {
						// RC view: Check in RC that all users are in the members list
						const rc1AdminUserInRC = await findRoomMember(federatedChannel._id, federationConfig.rc1.adminUser, {}, rc1AdminRequestConfig);
						const hs1AdminUserInRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.adminMatrixUserId,
							{},
							rc1AdminRequestConfig,
						);
						const hs1User1InRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.additionalUser1.matrixUserId,
							{},
							rc1AdminRequestConfig,
						);

						expect(rc1AdminUserInRC).not.toBeNull();
						expect(hs1AdminUserInRC).not.toBeNull();
						expect(hs1User1InRC).not.toBeNull();
						expect(hs1AdminUserInRC?.federated).toBe(true);
						expect(hs1User1InRC?.federated).toBe(true);

						// Synapse view: Check in Synapse (Matrix) for admin user that all users are in the members list
						const rc1AdminUserInSynapseAdmin = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId);
						const hs1AdminUserInSynapseAdmin = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId);
						const hs1User1InSynapseAdmin = await hs1AdminApp.findRoomMember(
							channelName,
							federationConfig.hs1.additionalUser1.matrixUserId,
							{
								initialDelay: 2000,
							},
						);

						expect(rc1AdminUserInSynapseAdmin).not.toBeNull();
						expect(hs1AdminUserInSynapseAdmin).not.toBeNull();
						expect(hs1User1InSynapseAdmin).not.toBeNull();

						// Synapse view: Check in Synapse (Matrix) for additional user that all users are in the members list
						const rc1AdminUserInSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId);
						const hs1AdminUserInSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId);
						const hs1User1InSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.hs1.additionalUser1.matrixUserId);

						expect(rc1AdminUserInSynapseUser1).not.toBeNull();
						expect(hs1AdminUserInSynapseUser1).not.toBeNull();
						expect(hs1User1InSynapseUser1).not.toBeNull();
					});

					it('It should show the system messages that the users joined', async () => {
						// RC view: Check in RC
						// Get the room history to find the system messages
						const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
						expect(Array.isArray(historyResponse.messages)).toBe(true);

						// Look for system messages about both users joining after accepting invites
						// 'uj' (user joined) message types
						const adminJoinedMessage = historyResponse.messages.find(
							(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
						);

						expect(adminJoinedMessage).toBeDefined();
						expect(adminJoinedMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);

						// Look for 'uj' (user joined) message types
						const hs1User1JoinedMessage = historyResponse.messages.find(
							(message: IMessage) =>
								message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.additionalUser1.matrixUserId),
						);

						expect(hs1User1JoinedMessage).toBeDefined();
						expect(hs1User1JoinedMessage?.msg).toContain(federationConfig.hs1.additionalUser1.matrixUserId);
					});
				});

				describe('Add 1 federated user and 1 local user at the same time', () => {
					let channelName: string;
					let federatedChannel: any;

					beforeAll(async () => {
						channelName = `federated-channel-invite-mixed-${Date.now()}`;

						// Create empty federated room without members
						const createResponse = await createRoom({
							type: 'p',
							name: channelName,
							members: [],
							extraData: {
								federated: true,
							},
							config: rc1AdminRequestConfig,
						});

						federatedChannel = createResponse.body.group;

						expect(federatedChannel).toHaveProperty('_id');
						expect(federatedChannel).toHaveProperty('name', channelName);
						expect(federatedChannel).toHaveProperty('t', 'p');
						expect(federatedChannel).toHaveProperty('federated', true);
						expect(federatedChannel).toHaveProperty('federation');
						expect((federatedChannel as any).federation).toHaveProperty('version', 1);

						// Wait for federation setup to complete (Matrix room creation and mrid assignment)
						// This ensures the room.federation.mrid field is properly set before adding users
						await new Promise((resolve) => setTimeout(resolve, 2000));

						// Add 1 federated user and 1 local user to the room
						const addUserResponse = await addUserToRoom({
							usernames: [federationConfig.hs1.adminMatrixUserId, federationConfig.rc1.additionalUser1.username],
							rid: federatedChannel._id,
							config: rc1AdminRequestConfig,
						});

						expect(addUserResponse.body).toHaveProperty('success', true);

						// Accept invitation for the federated user
						const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
						expect(acceptedRoomId).not.toBe('');

						// Accept invitation for the local user (rc1User1)
						await acceptRoomInvite(federatedChannel._id, rc1User1RequestConfig);
					}, 15000);

					it('It should show the room on the remote Element or RC and local for the second user', async () => {
						// RC view: Check in RC (admin view)
						const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
						expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
						expect(roomInfo.room).toHaveProperty('federated', true);

						// RC view: Check in RC (user1 view - local user)
						const roomInfoUser1 = await getRoomInfo(federatedChannel._id, rc1User1RequestConfig);
						expect(roomInfoUser1.room).toHaveProperty('_id', federatedChannel._id);
						expect(roomInfoUser1.room).toHaveProperty('federated', true);

						// Synapse view: Check in Synapse (Matrix) for federated user
						const room = hs1AdminApp.getRoom(channelName);
						expect(room).toHaveProperty('name', channelName);
						expect(room.getMyMembership()).toBe('join');
					});

					it('It should show the 2 new users in the members list', async () => {
						// RC view: Check in RC (admin view) that all users are in the members list
						const rc1AdminUserInRC = await findRoomMember(federatedChannel._id, federationConfig.rc1.adminUser, {}, rc1AdminRequestConfig);
						const rc1User1InRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.rc1.additionalUser1.username,
							{},
							rc1AdminRequestConfig,
						);
						const hs1AdminUserInRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.adminMatrixUserId,
							{},
							rc1AdminRequestConfig,
						);

						expect(rc1AdminUserInRC).not.toBeNull();
						expect(rc1User1InRC).not.toBeNull();
						expect(hs1AdminUserInRC).not.toBeNull();
						expect(hs1AdminUserInRC?.federated).toBe(true);

						// RC view: Check in RC (user1 view) that all users are in the members list
						const rc1AdminUserInRCUser1 = await findRoomMember(
							federatedChannel._id,
							federationConfig.rc1.adminUser,
							{},
							rc1User1RequestConfig,
						);
						const rc1User1InRCUser1 = await findRoomMember(
							federatedChannel._id,
							federationConfig.rc1.additionalUser1.username,
							{},
							rc1User1RequestConfig,
						);
						const hs1AdminUserInRCUser1 = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.adminMatrixUserId,
							{},
							rc1User1RequestConfig,
						);

						expect(rc1AdminUserInRCUser1).not.toBeNull();
						expect(rc1User1InRCUser1).not.toBeNull();
						expect(hs1AdminUserInRCUser1).not.toBeNull();
						expect(hs1AdminUserInRCUser1?.federated).toBe(true);

						// Synapse view: Check in Synapse (Matrix) that all users are in the members list
						const rc1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId, {
							initialDelay: 2000,
						});
						const rc1User1InSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.additionalUser1.matrixUserId, {
							initialDelay: 2000,
						});
						const hs1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId, {
							initialDelay: 2000,
						});

						expect(rc1AdminUserInSynapse).not.toBeNull();
						expect(rc1User1InSynapse).not.toBeNull();
						expect(hs1AdminUserInSynapse).not.toBeNull();
					});

					it('It should show the 2 system messages that the user joined', async () => {
						// RC view: Check in RC (admin view) for system messages about both users joining
						const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
						expect(Array.isArray(historyResponse.messages)).toBe(true);

						// 'uj' (user joined) message types
						const localUserJoinedMessage = historyResponse.messages.find(
							(message: IMessage) =>
								message.t === 'uj' && message.msg && message.msg.includes(federationConfig.rc1.additionalUser1.username),
						);

						expect(localUserJoinedMessage).toBeDefined();
						expect(localUserJoinedMessage?.msg).toContain(federationConfig.rc1.additionalUser1.username);

						const federatedUserJoinedMessage = historyResponse.messages.find(
							(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
						);

						expect(federatedUserJoinedMessage).toBeDefined();
						expect(federatedUserJoinedMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);

						// RC view: Check in RC (user1 view) for system messages about both users joining
						const historyResponseUser1 = await getGroupHistory(federatedChannel._id, rc1User1RequestConfig);
						expect(Array.isArray(historyResponseUser1.messages)).toBe(true);

						// Look for 'uj' (user joined) message types
						const localUserJoinedMessageUser1 = historyResponseUser1.messages.find(
							(message: IMessage) =>
								message.t === 'uj' && message.msg && message.msg.includes(federationConfig.rc1.additionalUser1.username),
						);

						expect(localUserJoinedMessageUser1).toBeDefined();
						expect(localUserJoinedMessageUser1?.msg).toContain(federationConfig.rc1.additionalUser1.username);

						const federatedUserJoinedMessageUser1 = historyResponseUser1.messages.find(
							(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
						);

						expect(federatedUserJoinedMessageUser1).toBeDefined();
						expect(federatedUserJoinedMessageUser1?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					});
				});
			});

			describe('Go to the composer and use the /invite slash command to', () => {
				describe('Add a federated user', () => {
					let channelName: string;
					let federatedChannel: any;

					beforeAll(async () => {
						channelName = `federated-channel-slash-single-${Date.now()}`;

						// Create empty federated room without members
						const createResponse = await createRoom({
							type: 'p',
							name: channelName,
							members: [],
							extraData: {
								federated: true,
							},
							config: rc1AdminRequestConfig,
						});

						federatedChannel = createResponse.body.group;

						expect(federatedChannel).toHaveProperty('_id');
						expect(federatedChannel).toHaveProperty('name', channelName);
						expect(federatedChannel).toHaveProperty('t', 'p');
						expect(federatedChannel).toHaveProperty('federated', true);
						expect(federatedChannel).toHaveProperty('federation');
						expect((federatedChannel as any).federation).toHaveProperty('version', 1);

						// Wait for federation setup to complete (Matrix room creation and mrid assignment)
						// This ensures the room.federation.mrid field is properly set before adding users
						await new Promise((resolve) => setTimeout(resolve, 2000));

						// Add federated user to the room using slash command
						const addUserResponse = await addUserToRoomSlashCommand({
							usernames: [federationConfig.hs1.adminMatrixUserId],
							rid: federatedChannel._id,
							config: rc1AdminRequestConfig,
						});

						expect(addUserResponse.body).toHaveProperty('success', true);

						// Accept invitation for the federated user
						const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
						expect(acceptedRoomId).not.toBe('');
					}, 15000);

					it('It should show the room on the remote Element or RC', async () => {
						// RC view: Check in RC
						const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
						expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
						expect(roomInfo.room).toHaveProperty('federated', true);

						// Synapse view: Check in Element
						const elementRoom = hs1AdminApp.getRoom(channelName);
						expect(elementRoom).toHaveProperty('name', channelName);
					});

					it('It should show the new user in the members list', async () => {
						// RC view: Check in RC that both users are in the members list
						const rc1AdminUserInRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.rc1.adminUser,
							{ initialDelay: 0 },
							rc1AdminRequestConfig,
						);
						const hs1AdminUserInRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.adminMatrixUserId,
							{ initialDelay: 0 },
							rc1AdminRequestConfig,
						);

						expect(rc1AdminUserInRC).not.toBeNull();
						expect(hs1AdminUserInRC).not.toBeNull();
						expect(hs1AdminUserInRC?.federated).toBe(true);

						// Synapse view: Check in Element (Matrix) that both users are in the members list
						const rc1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId, {
							delay: 2000,
						});
						const hs1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId, {
							delay: 2000,
						});
						expect(rc1AdminUserInSynapse).not.toBeNull();
						expect(hs1AdminUserInSynapse).not.toBeNull();
					});

					it('It should show the system message that the user joined', async () => {
						// RC view: Check in RC
						// Get the room history to find the system messages
						const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
						expect(Array.isArray(historyResponse.messages)).toBe(true);

						// Look for system messages about the user joining after accepting invite
						// 'uj' (user joined) message types
						const joinedMessage = historyResponse.messages.find(
							(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
						);

						expect(joinedMessage).toBeDefined();
						expect(joinedMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					});
				});

				describe('Add 2 or more federated users at the same time', () => {
					let channelName: string;
					let federatedChannel: any;

					beforeAll(async () => {
						channelName = `federated-channel-slash-multi-${Date.now()}`;

						// Create empty federated room without members
						const createResponse = await createRoom({
							type: 'p',
							name: channelName,
							members: [],
							extraData: {
								federated: true,
							},
							config: rc1AdminRequestConfig,
						});

						federatedChannel = createResponse.body.group;

						expect(federatedChannel).toHaveProperty('_id');
						expect(federatedChannel).toHaveProperty('name', channelName);
						expect(federatedChannel).toHaveProperty('t', 'p');
						expect(federatedChannel).toHaveProperty('federated', true);
						expect(federatedChannel).toHaveProperty('federation');
						expect((federatedChannel as any).federation).toHaveProperty('version', 1);

						// Wait for federation setup to complete (Matrix room creation and mrid assignment)
						// This ensures the room.federation.mrid field is properly set before adding users
						await new Promise((resolve) => setTimeout(resolve, 2000));

						// Add both federated users to the room using slash command
						const addUserResponse = await addUserToRoomSlashCommand({
							usernames: [federationConfig.hs1.adminMatrixUserId, federationConfig.hs1.additionalUser1.matrixUserId],
							rid: federatedChannel._id,
							config: rc1AdminRequestConfig,
						});

						expect(addUserResponse.body).toHaveProperty('success', true);

						// Accept invitations for both users
						const acceptedRoomId1 = await hs1AdminApp.acceptInvitationForRoomName(channelName);
						expect(acceptedRoomId1).not.toBe('');

						const acceptedRoomId2 = await hs1User1App.acceptInvitationForRoomName(channelName);
						expect(acceptedRoomId2).not.toBe('');
					}, 15000);

					it('It should show the room on all the involved remote Element or RC', async () => {
						// RC view: Check in RC
						const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
						expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
						expect(roomInfo.room).toHaveProperty('federated', true);

						// Synapse view: Check in Element for admin user
						const elementRoom1 = hs1AdminApp.getRoom(channelName);
						expect(elementRoom1).toHaveProperty('name', channelName);

						// Synapse view: Check in Element for user1
						const elementRoom2 = hs1User1App.getRoom(channelName);
						expect(elementRoom2).toHaveProperty('name', channelName);
					});

					it('It should show the new users in the members list of all RCs involved', async () => {
						// RC view: Check in RC that all users are in the members list
						const rc1AdminUserInRC = await findRoomMember(federatedChannel._id, federationConfig.rc1.adminUser, {}, rc1AdminRequestConfig);
						const hs1AdminUserInRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.adminMatrixUserId,
							{},
							rc1AdminRequestConfig,
						);
						const hs1User1InRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.additionalUser1.matrixUserId,
							{},
							rc1AdminRequestConfig,
						);

						expect(rc1AdminUserInRC).not.toBeNull();
						expect(hs1AdminUserInRC).not.toBeNull();
						expect(hs1User1InRC).not.toBeNull();
						expect(hs1AdminUserInRC?.federated).toBe(true);
						expect(hs1User1InRC?.federated).toBe(true);

						// Synapse view: Check in Synapse (Matrix) for admin user that all users are in the members list
						const rc1AdminUserInSynapseAdmin = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId);
						const hs1AdminUserInSynapseAdmin = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId);
						const hs1User1InSynapseAdmin = await hs1AdminApp.findRoomMember(
							channelName,
							federationConfig.hs1.additionalUser1.matrixUserId,
							{
								initialDelay: 2000,
							},
						);

						expect(rc1AdminUserInSynapseAdmin).not.toBeNull();
						expect(hs1AdminUserInSynapseAdmin).not.toBeNull();
						expect(hs1User1InSynapseAdmin).not.toBeNull();

						// Synapse view: Check in Synapse (Matrix) for additional user that all users are in the members list
						const rc1AdminUserInSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId);
						const hs1AdminUserInSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId);
						const hs1User1InSynapseUser1 = await hs1User1App.findRoomMember(channelName, federationConfig.hs1.additionalUser1.matrixUserId);

						expect(rc1AdminUserInSynapseUser1).not.toBeNull();
						expect(hs1AdminUserInSynapseUser1).not.toBeNull();
						expect(hs1User1InSynapseUser1).not.toBeNull();
					});

					it('It should show the system messages that the user joined on all RCs involved', async () => {
						// RC view: Check in RC
						// Get the room history to find the system messages
						const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
						expect(Array.isArray(historyResponse.messages)).toBe(true);

						// Look for system messages about both users joining after accepting invites
						// 'uj' (user joined) message types
						const adminJoinedMessage = historyResponse.messages.find(
							(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
						);

						expect(adminJoinedMessage).toBeDefined();
						expect(adminJoinedMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);

						const hs1User1JoinedMessage = historyResponse.messages.find(
							(message: IMessage) =>
								message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.additionalUser1.matrixUserId),
						);

						expect(hs1User1JoinedMessage).toBeDefined();
						expect(hs1User1JoinedMessage?.msg).toContain(federationConfig.hs1.additionalUser1.matrixUserId);
					});
				});

				describe('Add 1 federated user and 1 local user at the same time', () => {
					let channelName: string;
					let federatedChannel: any;

					beforeAll(async () => {
						channelName = `federated-channel-slash-mixed-${Date.now()}`;

						// Create empty federated room without members
						const createResponse = await createRoom({
							type: 'p',
							name: channelName,
							members: [],
							extraData: {
								federated: true,
							},
							config: rc1AdminRequestConfig,
						});

						federatedChannel = createResponse.body.group;

						expect(federatedChannel).toHaveProperty('_id');
						expect(federatedChannel).toHaveProperty('name', channelName);
						expect(federatedChannel).toHaveProperty('t', 'p');
						expect(federatedChannel).toHaveProperty('federated', true);
						expect(federatedChannel).toHaveProperty('federation');
						expect((federatedChannel as any).federation).toHaveProperty('version', 1);

						// Wait for federation setup to complete (Matrix room creation and mrid assignment)
						// This ensures the room.federation.mrid field is properly set before adding users
						await new Promise((resolve) => setTimeout(resolve, 2000));

						// Add 1 federated user and 1 local user to the room using slash command
						const addUserResponse = await addUserToRoomSlashCommand({
							usernames: [federationConfig.hs1.adminMatrixUserId, federationConfig.rc1.additionalUser1.username],
							rid: federatedChannel._id,
							config: rc1AdminRequestConfig,
						});

						expect(addUserResponse.body).toHaveProperty('success', true);

						// Accept invitation for the federated user
						const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
						expect(acceptedRoomId).not.toBe('');

						// Accept invitation for the local user (rc1User1)
						await acceptRoomInvite(federatedChannel._id, rc1User1RequestConfig);
					}, 15000);

					it('It should show the room on the remote Element or RC and local for the second user', async () => {
						// RC view: Check in RC (admin view)
						const roomInfo = await getRoomInfo(federatedChannel._id, rc1AdminRequestConfig);
						expect(roomInfo.room).toHaveProperty('_id', federatedChannel._id);
						expect(roomInfo.room).toHaveProperty('federated', true);

						// RC view: Check in RC (user1 view - local user)
						const roomInfoUser1 = await getRoomInfo(federatedChannel._id, rc1User1RequestConfig);
						expect(roomInfoUser1.room).toHaveProperty('_id', federatedChannel._id);
						expect(roomInfoUser1.room).toHaveProperty('federated', true);

						// Synapse view: Check in Synapse (Matrix) for federated user
						const room = hs1AdminApp.getRoom(channelName);
						expect(room).toHaveProperty('name', channelName);
						expect(room.getMyMembership()).toBe('join');
					});

					it('It should show the 2 new users in the members list', async () => {
						// RC view: Check in RC (admin view) that all users are in the members list
						const rc1AdminUserInRC = await findRoomMember(federatedChannel._id, federationConfig.rc1.adminUser, {}, rc1AdminRequestConfig);
						const rc1User1InRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.rc1.additionalUser1.username,
							{},
							rc1AdminRequestConfig,
						);
						const hs1AdminUserInRC = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.adminMatrixUserId,
							{},
							rc1AdminRequestConfig,
						);

						expect(rc1AdminUserInRC).not.toBeNull();
						expect(rc1User1InRC).not.toBeNull();
						expect(hs1AdminUserInRC).not.toBeNull();
						expect(hs1AdminUserInRC?.federated).toBe(true);

						// RC view: Check in RC (user1 view) that all users are in the members list
						const rc1AdminUserInRCUser1 = await findRoomMember(
							federatedChannel._id,
							federationConfig.rc1.adminUser,
							{},
							rc1User1RequestConfig,
						);
						const rc1User1InRCUser1 = await findRoomMember(
							federatedChannel._id,
							federationConfig.rc1.additionalUser1.username,
							{},
							rc1User1RequestConfig,
						);
						const hs1AdminUserInRCUser1 = await findRoomMember(
							federatedChannel._id,
							federationConfig.hs1.adminMatrixUserId,
							{},
							rc1User1RequestConfig,
						);

						expect(rc1AdminUserInRCUser1).not.toBeNull();
						expect(rc1User1InRCUser1).not.toBeNull();
						expect(hs1AdminUserInRCUser1).not.toBeNull();
						expect(hs1AdminUserInRCUser1?.federated).toBe(true);

						// Synapse view: Check in Synapse (Matrix) that all users are in the members list
						const rc1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId, {
							initialDelay: 2000,
						});
						const rc1User1InSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.additionalUser1.matrixUserId, {
							initialDelay: 2000,
						});
						const hs1AdminUserInSynapse = await hs1AdminApp.findRoomMember(channelName, federationConfig.hs1.adminMatrixUserId, {
							initialDelay: 2000,
						});

						expect(rc1AdminUserInSynapse).not.toBeNull();
						expect(rc1User1InSynapse).not.toBeNull();
						expect(hs1AdminUserInSynapse).not.toBeNull();
					});

					it('It should show the 2 system messages that the user joined', async () => {
						// RC view: Check in RC (admin view) for system messages about both users joining
						const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
						expect(Array.isArray(historyResponse.messages)).toBe(true);

						// Look for system messages about both users joining after accepting invites
						// 'uj' (user joined) message types
						const localUserJoinedMessage = historyResponse.messages.find(
							(message: IMessage) =>
								message.t === 'uj' && message.msg && message.msg.includes(federationConfig.rc1.additionalUser1.username),
						);

						expect(localUserJoinedMessage).toBeDefined();
						expect(localUserJoinedMessage?.msg).toContain(federationConfig.rc1.additionalUser1.username);

						const federatedUserJoinedMessage = historyResponse.messages.find(
							(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
						);

						expect(federatedUserJoinedMessage).toBeDefined();
						expect(federatedUserJoinedMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);

						// RC view: Check in RC (user1 view) for system messages about both users joining
						const historyResponseUser1 = await getGroupHistory(federatedChannel._id, rc1User1RequestConfig);
						expect(Array.isArray(historyResponseUser1.messages)).toBe(true);

						// Look for 'uj' (user joined) message types
						const localUserJoinedMessageUser1 = historyResponseUser1.messages.find(
							(message: IMessage) =>
								message.t === 'uj' && message.msg && message.msg.includes(federationConfig.rc1.additionalUser1.username),
						);

						const federatedUserJoinedMessageUser1 = historyResponseUser1.messages.find(
							(message: IMessage) => message.t === 'uj' && message.msg && message.msg.includes(federationConfig.hs1.adminMatrixUserId),
						);

						expect(localUserJoinedMessageUser1).toBeDefined();
						expect(localUserJoinedMessageUser1?.msg).toContain(federationConfig.rc1.additionalUser1.username);

						expect(federatedUserJoinedMessageUser1).toBeDefined();
						expect(federatedUserJoinedMessageUser1?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					});
				});
			});
		});

		describe('Accept/Reject invitation permissions', () => {
			describe('User tries to accept another user invitation', () => {
				let channelName: string;
				let federatedChannel: any;

				beforeAll(async () => {
					channelName = `federated-channel-accept-permission-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [federationConfig.rc1.additionalUser1.username],
						extraData: {
							federated: true,
						},
						config: rc1AdminRequestConfig,
					});

					federatedChannel = createResponse.body.group;

					expect(federatedChannel).toHaveProperty('_id');
					expect(federatedChannel).toHaveProperty('name', channelName);
					expect(federatedChannel).toHaveProperty('t', 'p');
					expect(federatedChannel).toHaveProperty('federated', true);
				}, 10000);

				it('It should not allow admin to accept invitation on behalf of another user', async () => {
					// RC view: Admin tries to accept rc1User1's invitation
					const response = await acceptRoomInvite(federatedChannel._id, rc1AdminRequestConfig);
					expect(response.success).toBe(false);
					expect(response.error).toBe(
						'Failed to handle invite: No subscription found or user does not have permission to accept or reject this invite',
					);
				});

				it('It should not allow admin to reject invitation on behalf of another user', async () => {
					// RC view: Admin tries to reject rc1User1's invitation
					const response = await rejectRoomInvite(federatedChannel._id, rc1AdminRequestConfig);
					expect(response.success).toBe(false);
					expect(response.error).toBe(
						'Failed to handle invite: No subscription found or user does not have permission to accept or reject this invite',
					);
				});
			});
		});

		describe('Inviting a RC user from Synapse', () => {
			describe('Room that already contains previous events', () => {
				let matrixRoomId: string;
				let channelName: string;
				let rid: string;
				beforeAll(async () => {
					channelName = `federated-channel-from-synapse-${Date.now()}`;
					matrixRoomId = await hs1AdminApp.createRoom(channelName);

					await hs1AdminApp.matrixClient.sendTextMessage(matrixRoomId, 'Message from admin');
					await hs1AdminApp.matrixClient.invite(matrixRoomId, federationConfig.hs1.additionalUser1.matrixUserId);
					await hs1User1App.matrixClient.joinRoom(matrixRoomId);
					await hs1User1App.matrixClient.sendTextMessage(matrixRoomId, 'Message from user1');
					await hs1AdminApp.matrixClient.invite(matrixRoomId, federationConfig.rc1.adminMatrixUserId);

					const subscriptions = await getSubscriptions(rc1AdminRequestConfig);

					const pendingInvitation = subscriptions.update.find(
						(subscription) => subscription.status === 'INVITED' && subscription.fname?.includes(channelName),
					);

					expect(pendingInvitation).not.toBeUndefined();

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					rid = pendingInvitation!.rid!;

					await acceptRoomInvite(rid, rc1AdminRequestConfig);
				}, 15000);

				describe('It should reflect all the members and messagens on the rocket.chat side', () => {
					it('It should show all the three users in the members list', async () => {
						await retry(
							'Getting room members until all are present',
							async () => {
								const members = await getRoomMembers(rid, rc1AdminRequestConfig);

								expect(members.members.length).toBe(3);
								expect(members.members.find((member: IUser) => member.username === federationConfig.rc1.adminUser)).not.toBeNull();
								expect(
									members.members.find((member: IUser) => member.username === federationConfig.rc1.additionalUser1.username),
								).not.toBeNull();
								expect(members.members.find((member: IUser) => member.username === federationConfig.hs1.adminMatrixUserId)).not.toBeNull();
							},
							{ delayMs: 200 },
						);
					});
				});
			});
		});

		describe('Rejecting an invitation from Synapse', () => {
			let matrixRoomId: string;
			let channelName: string;
			let rid: string;

			beforeAll(async () => {
				channelName = `federated-channel-reject-from-synapse-${Date.now()}`;
				matrixRoomId = await hs1AdminApp.createRoom(channelName);

				await hs1AdminApp.matrixClient.invite(matrixRoomId, federationConfig.rc1.adminMatrixUserId);

				const subscriptions = await getSubscriptions(rc1AdminRequestConfig);

				const pendingInvitation = subscriptions.update.find(
					(subscription) => subscription.status === 'INVITED' && subscription.fname?.includes(channelName),
				);

				expect(pendingInvitation).not.toBeUndefined();

				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				rid = pendingInvitation!.rid!;
			}, 15000);

			it('should allow RC user to reject the invite and remove the subscription', async () => {
				const rejectResponse = await rejectRoomInvite(rid, rc1AdminRequestConfig);
				expect(rejectResponse.success).toBe(true);

				const subscriptions = await getSubscriptions(rc1AdminRequestConfig);
				const invitedSub = subscriptions.update.find((sub) => sub.fname?.includes(channelName));
				expect(invitedSub).toBeFalsy();
			});
		});

		describe('Revoked invitation flow from Synapse', () => {
			describe('Synapse revokes an invitation before the RC user responds', () => {
				let matrixRoomId: string;
				let channelName: string;
				let rid: string;

				beforeAll(async () => {
					channelName = `federated-channel-revoked-${Date.now()}`;
					matrixRoomId = await hs1AdminApp.createRoom(channelName);

					// hs1 invites RC user
					await hs1AdminApp.matrixClient.invite(matrixRoomId, federationConfig.rc1.adminMatrixUserId);
					const subscriptions = await getSubscriptions(rc1AdminRequestConfig);

					const pendingInvitation = subscriptions.update.find(
						(subscription) => subscription.status === 'INVITED' && subscription.fname?.includes(channelName),
					);

					expect(pendingInvitation).not.toBeUndefined();

					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					rid = pendingInvitation!.rid!;

					// hs1 revokes the invitation by kicking the invited user
					await hs1AdminApp.matrixClient.kick(matrixRoomId, federationConfig.rc1.adminMatrixUserId, 'Invitation revoked');
				}, 15000);

				it('should fail when RC user tries to accept the revoked invitation', async () => {
					const acceptResponse = await acceptRoomInvite(rid, rc1AdminRequestConfig);
					expect(acceptResponse.success).toBe(false);
				});

				it('should allow RC user to reject the revoked invitation and remove the subscription', async () => {
					const rejectResponse = await rejectRoomInvite(rid, rc1AdminRequestConfig);
					expect(rejectResponse.success).toBe(true);

					const subscriptions = await getSubscriptions(rc1AdminRequestConfig);
					const invitedSub = subscriptions.update.find((sub) => sub.fname?.includes(channelName));
					expect(invitedSub).toBeFalsy();
				});

				it('should have the RC user with leave membership on Synapse side after revoked invitation', async () => {
					const member = await hs1AdminApp.findRoomMember(channelName, federationConfig.rc1.adminMatrixUserId);
					expect(member?.membership).toBe('leave');
				});
			});
		});
	});
});

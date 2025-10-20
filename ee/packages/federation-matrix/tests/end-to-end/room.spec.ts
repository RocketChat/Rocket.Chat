import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { SynapseClient } from '../helper/synapse-client';
import { federationConfig } from '../helper/config';
import { getRequestConfig, createUser } from '../../../../../apps/meteor/tests/data/users.helper';
import { createRoom, getRoomInfo, getGroupHistory, findRoomMember } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { IMessage } from '@rocket.chat/core-typings';
// import { KnownMembership } from 'matrix-js-sdk';
// import { t } from 'i18next';


(IS_EE ? describe : describe.skip)('Federation', () => {
	let rc1AdminRequestConfig: any;
	let rc1User1Username: string;
	let rc1User1Password: string;
	let rc1User1MatrixId: string;
	let rc1User1: any;
	let rc1User1RequestConfig: any;
	let hs1AdminApp: SynapseClient;
	let hs1User1Username: string;
	let hs1User1Password: string;
	let hs1User1MatrixId: string;
	let hs1User1App: SynapseClient;

	beforeAll(async () => {
		const timestamp = Date.now();
		// Create admin request config for RC1
		rc1AdminRequestConfig = await getRequestConfig(
			federationConfig.rc1.apiUrl,
			federationConfig.rc1.adminUser,
			federationConfig.rc1.adminPassword
		);

		// Generate dynamic user1 for RC1
		rc1User1Username = `rcuser-${timestamp}`;
		rc1User1Password = `rcpass-${timestamp}`;
		rc1User1MatrixId = `@${rc1User1Username}:${federationConfig.rc1.apiUrl.replace('https://', '').replace('http://', '')}`;

		// Create user1 in RC1
		rc1User1 = await createUser({
			username: rc1User1Username,
			password: rc1User1Password,
			email: `${rc1User1Username}@rocket.chat`,
			name: rc1User1Username,
		}, rc1AdminRequestConfig);

		// Create user1 request config for RC1
		rc1User1RequestConfig = await getRequestConfig(
			federationConfig.rc1.apiUrl,
			rc1User1Username,
			rc1User1Password
		);

		// Create admin Synapse client for HS1
		hs1AdminApp = new SynapseClient(
			federationConfig.hs1.url,
			federationConfig.hs1.adminUser,
			federationConfig.hs1.adminPassword
		);
		await hs1AdminApp.initialize();

		// User previously created in Synapse
		hs1User1Username = `alice`;
		hs1User1Password = `alice`;
		hs1User1MatrixId = `@${hs1User1Username}:${federationConfig.hs1.homeserver}`;

		// Create user1 Synapse client for HS1
		hs1User1App = new SynapseClient(
			federationConfig.hs1.url,
			hs1User1MatrixId,
			hs1User1Password
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
		describe('Create a room on RC as private and federated and: ', () => {

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
					const elementRoom = await hs1AdminApp.getRoom(channelName);
					expect(elementRoom).toHaveProperty('name', channelName);
				});

				it('It should show the new user in the members list', async () => {
					// RC view: Check in RC that the federated user is in the members list
					const rc1AdminUserInRC = await findRoomMember(
						federatedChannel._id, 
						federationConfig.rc1.adminUser, 
						{ initialDelay: 0 },
						rc1AdminRequestConfig
					);
					const hs1AdminUserInRC = await findRoomMember(
						federatedChannel._id, 
						federationConfig.hs1.adminMatrixUserId, 
						{ initialDelay: 0 },
						rc1AdminRequestConfig
					);
					
					expect(rc1AdminUserInRC).not.toBeNull();
					expect(hs1AdminUserInRC).not.toBeNull();
					expect(hs1AdminUserInRC?.federated).toBe(true);

					// Synapse view: Check in Element (Matrix) that the federated user is in the members list
					const rc1AdminUserInSynapse = await hs1AdminApp.findRoomMember(
						channelName, 
						federationConfig.rc1.adminMatrixUserId,
						{ delay: 2000 }
					);
					const hs1AdminUserInSynapse = await hs1AdminApp.findRoomMember(
						channelName, 
						federationConfig.hs1.adminMatrixUserId,
						{ delay: 2000 }
					);
					expect(rc1AdminUserInSynapse).not.toBeNull();
					expect(hs1AdminUserInSynapse).not.toBeNull();
				});

				it('It should show the system message that the user added', async () => {
					// RC view: Check in RC. We don't check in Synapse because this is not part of the protocol
					// Get the room history to find the system message
					const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
					expect(Array.isArray(historyResponse.messages)).toBe(true);

					// Look for a system message about the user joining
					// System messages typically have t: 'uj' (user joined) and the msg contains the username
					const joinMessage = historyResponse.messages.find((message: IMessage) => 
						message.t === 'uj' && 
						message.msg && 
						message.msg === federationConfig.hs1.adminMatrixUserId
					);
					
					expect(joinMessage).toBeDefined();
					expect(joinMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					expect(joinMessage?.u?.username).toBe(federationConfig.hs1.adminMatrixUserId);
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
						members: [
							federationConfig.hs1.adminMatrixUserId,
							hs1User1MatrixId
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
				const elementRoom1 = await hs1AdminApp.getRoom(channelName);
				expect(elementRoom1).toHaveProperty('name', channelName);

				// Synapse view: Check in Element for user1
				const elementRoom2 = await hs1User1App.getRoom(channelName);
				expect(elementRoom2).toHaveProperty('name', channelName);
			});

			it('It should show the new users in the members list of all RCs involved', async () => {
				// RC view: Check in RC that both federated users are in the members list
				const rc1AdminUserInRC = await findRoomMember(
					federatedChannel._id, 
					federationConfig.rc1.adminUser, 
					{},
					rc1AdminRequestConfig
				);
				const hs1AdminUserInRC = await findRoomMember(
					federatedChannel._id, 
					federationConfig.hs1.adminMatrixUserId, 
					{},
					rc1AdminRequestConfig
				);
				const hs1User1InRC = await findRoomMember(
					federatedChannel._id, 
					hs1User1MatrixId, 
					{},
					rc1AdminRequestConfig
				);
				
				expect(rc1AdminUserInRC).not.toBeNull();
				expect(hs1AdminUserInRC).not.toBeNull();
				expect(hs1User1InRC).not.toBeNull();
				expect(hs1AdminUserInRC?.federated).toBe(true);
				expect(hs1User1InRC?.federated).toBe(true);

					// Synapse view: Check in Synapse (Matrix) for admin user that all users are in the members list
					const rc1AdminUserInSynapseAdmin = await hs1AdminApp.findRoomMember(
						channelName, 
						federationConfig.rc1.adminMatrixUserId,
					);
					const hs1AdminUserInSynapseAdmin = await hs1AdminApp.findRoomMember(
						channelName, 
						federationConfig.hs1.adminMatrixUserId,
					);
					const hs1User1InSynapseAdmin = await hs1AdminApp.findRoomMember(
						channelName, 
						hs1User1MatrixId,
						{ initialDelay: 2000 }
					);
					
					expect(rc1AdminUserInSynapseAdmin).not.toBeNull();
					expect(hs1AdminUserInSynapseAdmin).not.toBeNull();
					expect(hs1User1InSynapseAdmin).not.toBeNull();

					// Synapse view: Check in Synapse (Matrix) for additional user that all users are in the members list
					const rc1AdminUserInSynapseUser1 = await hs1User1App.findRoomMember(
						channelName, 
						federationConfig.rc1.adminMatrixUserId,
					);
					const hs1AdminUserInSynapseUser1 = await hs1User1App.findRoomMember(
						channelName, 
						federationConfig.hs1.adminMatrixUserId,
					);
					const hs1User1InSynapseUser1 = await hs1User1App.findRoomMember(
						channelName, 
						hs1User1MatrixId,
					);
					
					expect(rc1AdminUserInSynapseUser1).not.toBeNull();
					expect(hs1AdminUserInSynapseUser1).not.toBeNull();
					expect(hs1User1InSynapseUser1).not.toBeNull();
				});

				it('It should show the system messages that the user added on all RCs involved', async () => {
					// RC view: Check in RC. We don't check in Synapse because this is not part of the protocol
					// Get the room history to find the system messages
					const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
					expect(Array.isArray(historyResponse.messages)).toBe(true);

					// Look for system messages about both users joining
					// System messages typically have t: 'uj' (user joined) and the msg contains the username
					const adminJoinMessage = historyResponse.messages.find((message: IMessage) => 
						message.t === 'uj' && 
						message.msg && 
						message.msg === federationConfig.hs1.adminMatrixUserId
					);
					
					const hs1User1JoinMessage = historyResponse.messages.find((message: IMessage) => 
						message.t === 'uj' && 
						message.msg && 
						message.msg === hs1User1MatrixId
					);
					
					expect(adminJoinMessage).toBeDefined();
					expect(adminJoinMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					expect(adminJoinMessage?.u?.username).toBe(federationConfig.hs1.adminMatrixUserId);

					expect(hs1User1JoinMessage).toBeDefined();
					expect(hs1User1JoinMessage?.msg).toContain(hs1User1MatrixId);
					expect(hs1User1JoinMessage?.u?.username).toBe(hs1User1MatrixId);
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
							rc1User1Username // local user
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

					// Accept invitation for the federated user (local user is already added automatically)
					const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
					expect(acceptedRoomId).not.toBe('');
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
				const rc1AdminUserInRC = await findRoomMember(
					federatedChannel._id, 
					federationConfig.rc1.adminUser, 
					{},
					rc1AdminRequestConfig
				);
				const rc1User1InRC = await findRoomMember(
					federatedChannel._id, 
					rc1User1Username, 
					{},
					rc1AdminRequestConfig
				);
				const hs1AdminUserInRC = await findRoomMember(
					federatedChannel._id, 
					federationConfig.hs1.adminMatrixUserId, 
					{},
					rc1AdminRequestConfig
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
						rc1User1RequestConfig
					);
					const rc1User1InRCUser1 = await findRoomMember(
						federatedChannel._id, 
						rc1User1Username, 
						{},
						rc1User1RequestConfig
					);
					const hs1AdminUserInRCUser1 = await findRoomMember(
						federatedChannel._id, 
						federationConfig.hs1.adminMatrixUserId, 
						{},
						rc1User1RequestConfig
					);
					
					expect(rc1AdminUserInRCUser1).not.toBeNull();
					expect(rc1User1InRCUser1).not.toBeNull();
					expect(hs1AdminUserInRCUser1).not.toBeNull();
					expect(hs1AdminUserInRCUser1?.federated).toBe(true);

					// Synapse view: Check in Synapse (Matrix) that both users are in the members list
					const rc1AdminUserInSynapse = await hs1AdminApp.findRoomMember(
						channelName, 
						federationConfig.rc1.adminMatrixUserId,
						{ initialDelay: 2000 }
					);
					const rc1User1InSynapse = await hs1AdminApp.findRoomMember(
						channelName, 
						rc1User1MatrixId,
						{ initialDelay: 2000 }
					);
					const hs1AdminUserInSynapse = await hs1AdminApp.findRoomMember(
						channelName, 
						federationConfig.hs1.adminMatrixUserId,
						{ initialDelay: 2000 }
					);
					
					expect(rc1AdminUserInSynapse).not.toBeNull();
					expect(rc1User1InSynapse).not.toBeNull();
					expect(hs1AdminUserInSynapse).not.toBeNull();
				});

				it('It should show the 2 system messages that the user added', async () => {
					// RC view: Check in RC (admin view) for system messages about both users joining
					const historyResponse = await getGroupHistory(federatedChannel._id, rc1AdminRequestConfig);
					expect(Array.isArray(historyResponse.messages)).toBe(true);

					// Look for system messages about both users joining
					const localUserJoinMessage = historyResponse.messages.find((message: IMessage) => 
						message.t === 'uj' && 
						message.msg && 
						message.msg === rc1User1Username
					);
					
					const federatedUserJoinMessage = historyResponse.messages.find((message: IMessage) => 
						message.t === 'uj' && 
						message.msg && 
						message.msg === federationConfig.hs1.adminMatrixUserId
					);
					
					expect(localUserJoinMessage).toBeDefined();
					expect(localUserJoinMessage?.msg).toContain(rc1User1Username);
					expect(localUserJoinMessage?.u?.username).toBe(rc1User1Username);

					expect(federatedUserJoinMessage).toBeDefined();
					expect(federatedUserJoinMessage?.msg).toContain(federationConfig.hs1.adminMatrixUserId);
					expect(federatedUserJoinMessage?.u?.username).toBe(federationConfig.hs1.adminMatrixUserId);

					// RC view: Check in RC (user1 view) for system messages about both users joining
					const historyResponseUser1 = await getGroupHistory(federatedChannel._id, rc1User1RequestConfig);
					expect(Array.isArray(historyResponseUser1.messages)).toBe(true);

					const localUserJoinMessageUser1 = historyResponseUser1.messages.find((message: IMessage) => 
						message.t === 'uj' && 
						message.msg && 
						message.msg === rc1User1Username
					);
					
					const federatedUserJoinMessageUser1 = historyResponseUser1.messages.find((message: IMessage) => 
						message.t === 'uj' && 
						message.msg && 
						message.msg === federationConfig.hs1.adminMatrixUserId
					);
					
					expect(localUserJoinMessageUser1).toBeDefined();
					expect(federatedUserJoinMessageUser1).toBeDefined();
				});

			});
		});
	});
});

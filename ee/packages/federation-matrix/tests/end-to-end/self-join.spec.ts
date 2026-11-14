import type { IUser } from '@rocket.chat/core-typings';

import { createRoom, findRoomMember, addUserToRoom } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { type IRequestConfig, getRequestConfig, createUser, deleteUser } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { federationConfig } from '../helper/config';
import { SynapseClient } from '../helper/synapse-client';

(IS_EE ? describe : describe.skip)('Federation - Self Join', () => {
	let rc1AdminRequestConfig: IRequestConfig;
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

		hs1AdminApp = new SynapseClient(federationConfig.hs1.url, federationConfig.hs1.adminUser, federationConfig.hs1.adminPassword);
		await hs1AdminApp.initialize();
	});

	afterAll(async () => {
		if (hs1AdminApp) {
			await hs1AdminApp.close();
		}
	});

	describe('Local user self-joins a federated room via channels.join (no inviter)', () => {
		let channelName: string;
		let federatedChannel: any;
		let selfJoinUser: IUser;
		let selfJoinUserRequestConfig: IRequestConfig;

		beforeAll(async () => {
			channelName = `federation-self-join-${Date.now()}`;

			const createResponse = await createRoom({
				type: 'p',
				name: channelName,
				members: [federationConfig.hs1.adminMatrixUserId],
				extraData: {
					federated: true,
				},
				config: rc1AdminRequestConfig,
			});

			federatedChannel = createResponse.body.group;

			expect(federatedChannel).toHaveProperty('_id');
			expect(federatedChannel).toHaveProperty('federated', true);

			const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
			expect(acceptedRoomId).not.toBe('');

			const userCredentials = { username: `self-join-user-${Date.now()}`, password: 'testpass123' };
			selfJoinUser = await createUser(
				{
					...userCredentials,
					email: `${userCredentials.username}@rocket.chat`,
					name: userCredentials.username,
				},
				rc1AdminRequestConfig,
			);

			selfJoinUserRequestConfig = await getRequestConfig(federationConfig.rc1.url, userCredentials.username, userCredentials.password);
		}, 15000);

		afterAll(async () => {
			if (selfJoinUser) {
				await deleteUser(selfJoinUser, {}, rc1AdminRequestConfig);
			}
		});

		it('should allow a local user to self-join the federated room', async () => {
			const requestInstance = selfJoinUserRequestConfig.request!;
			const credentialsInstance = selfJoinUserRequestConfig.credentials!;

			const response = await requestInstance.post('/api/v1/channels.join').set(credentialsInstance).send({ roomId: federatedChannel._id });

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('success', true);
		});

		it('should show the self-joined user in the room members list', async () => {
			const member = await findRoomMember(
				federatedChannel._id,
				selfJoinUser.username!,
				{ maxRetries: 5, delay: 1000 },
				rc1AdminRequestConfig,
			);

			expect(member).not.toBeNull();
		});

		it.skip('should register the self-joined user on the Matrix homeserver', async () => {
			const member = await findRoomMember(federatedChannel._id, selfJoinUser.username!, {}, rc1AdminRequestConfig);

			expect(member).not.toBeNull();
			expect(member?.federated).toBe(true);
		});

		it.skip('should make the self-joined user visible on the Synapse side', async () => {
			const synapseUser = await hs1AdminApp.findRoomMember(channelName, `@${selfJoinUser.username}:${federationConfig.rc1.domain}`, {
				initialDelay: 2000,
			});

			expect(synapseUser).not.toBeNull();
		});
	});

	describe('Comparison: invited user vs self-joined user in the same federated room', () => {
		let channelName: string;
		let federatedChannel: any;
		let selfJoinUser: IUser;
		let selfJoinUserRequestConfig: IRequestConfig;

		beforeAll(async () => {
			channelName = `federation-compare-${Date.now()}`;

			const createResponse = await createRoom({
				type: 'p',
				name: channelName,
				members: [federationConfig.hs1.adminMatrixUserId],
				extraData: {
					federated: true,
				},
				config: rc1AdminRequestConfig,
			});

			federatedChannel = createResponse.body.group;

			expect(federatedChannel).toHaveProperty('federated', true);

			const acceptedRoomId = await hs1AdminApp.acceptInvitationForRoomName(channelName);
			expect(acceptedRoomId).not.toBe('');

			await addUserToRoom({
				usernames: [federationConfig.rc1.additionalUser1.username],
				rid: federatedChannel._id,
				config: rc1AdminRequestConfig,
			});

			const userCredentials = { username: `self-join-compare-${Date.now()}`, password: 'testpass123' };
			selfJoinUser = await createUser(
				{
					...userCredentials,
					email: `${userCredentials.username}@rocket.chat`,
					name: userCredentials.username,
				},
				rc1AdminRequestConfig,
			);

			selfJoinUserRequestConfig = await getRequestConfig(federationConfig.rc1.url, userCredentials.username, userCredentials.password);

			const requestInstance = selfJoinUserRequestConfig.request!;
			const credentialsInstance = selfJoinUserRequestConfig.credentials!;

			await requestInstance.post('/api/v1/channels.join').set(credentialsInstance).send({ roomId: federatedChannel._id });
		}, 20000);

		afterAll(async () => {
			if (selfJoinUser) {
				await deleteUser(selfJoinUser, {}, rc1AdminRequestConfig);
			}
		});

		it('should show both users in the room members list', async () => {
			const invitedMember = await findRoomMember(
				federatedChannel._id,
				federationConfig.rc1.additionalUser1.username,
				{},
				rc1AdminRequestConfig,
			);

			const selfJoinedMember = await findRoomMember(
				federatedChannel._id,
				selfJoinUser.username!,
				{ maxRetries: 5, delay: 1000 },
				rc1AdminRequestConfig,
			);

			expect(invitedMember).not.toBeNull();
			expect(selfJoinedMember).not.toBeNull();
		});

		it('should have federation metadata for the invited user', async () => {
			const invitedMember = await findRoomMember(
				federatedChannel._id,
				federationConfig.rc1.additionalUser1.username,
				{},
				rc1AdminRequestConfig,
			);

			expect(invitedMember).not.toBeNull();
			expect(invitedMember?.federated).toBe(true);
		});

		it.skip('should have federation metadata for the self-joined user', async () => {
			const selfJoinedMember = await findRoomMember(federatedChannel._id, selfJoinUser.username!, {}, rc1AdminRequestConfig);

			expect(selfJoinedMember).not.toBeNull();
			expect(selfJoinedMember?.federated).toBe(true);
		});
	});
});

import type { IUser } from '@rocket.chat/core-typings';

import type {} from '../../../../../apps/meteor/app/api/server/v1/permissions.ts';
import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { addUserToRoom, createRoom, getSubscriptions } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { createUser, deleteUser, getRequestConfig } from '../../../../../apps/meteor/tests/data/users.helper';
import type { IRequestConfig, TestUser } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
import { retry } from '../../../../../apps/meteor/tests/end-to-end/api/helpers/retry.ts';
import { federationConfig } from '../helper/config';
import { SynapseClient } from '../helper/synapse-client';

(IS_EE ? describe : describe.skip)('Federation Permissions', () => {
	let rc1AdminRequestConfig: IRequestConfig;
	let rc1User1RequestConfig: IRequestConfig;
	let hs1AdminApp: SynapseClient;

	beforeAll(async () => {
		// Create admin request config for RC1
		rc1AdminRequestConfig = await getRequestConfig(
			federationConfig.rc1.url,
			federationConfig.rc1.adminUser,
			federationConfig.rc1.adminPassword,
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
		await rc1AdminRequestConfig.request
			.post(api('permissions.update'))
			.set(rc1AdminRequestConfig.credentials)
			.send({ permissions: [{ _id: 'access-federation', roles: ['admin'] }] })
			.expect('Content-Type', 'application/json')
			.expect(200);
	});

	afterAll(async () =>
		// Add permissions for access-federation to any user but admin
		rc1AdminRequestConfig.request
			.post(api('permissions.update'))
			.set(rc1AdminRequestConfig.credentials)
			.send({ permissions: [{ _id: 'access-federation', roles: ['admin', 'user'] }] })
			.expect('Content-Type', 'application/json')
			.expect(200),
	);

	afterAll(async () => hs1AdminApp.close());

	describe('Access Federation Permission', () => {
		describe('Users without access-federation permission', () => {
			beforeAll(async () => {
				await rc1AdminRequestConfig.request
					.post(api('permissions.update'))
					.set(rc1AdminRequestConfig.credentials)
					.send({ permissions: [{ _id: 'access-federation', roles: ['admin'] }] })
					.expect('Content-Type', 'application/json')
					.expect(200);
			});

			afterAll(async () => {
				// Add permissions for access-federation to any user but admin
				await rc1AdminRequestConfig.request
					.post(api('permissions.update'))
					.set(rc1AdminRequestConfig.credentials)
					.send({ permissions: [{ _id: 'access-federation', roles: ['admin', 'user'] }] })
					.expect('Content-Type', 'application/json')
					.expect(200);
			});

			describe('Inviting from a remote server', () => {
				let user: TestUser<IUser>;

				let matrixRoomId: string;

				beforeAll(async () => {
					user = await createUser(
						{
							username: `g3-${Date.now()}`,
							password: '1',
							roles: ['user'],
						},
						rc1AdminRequestConfig,
					);
				});

				afterAll(async () => {
					await deleteUser(user, {}, rc1AdminRequestConfig);
				});

				let channelName: string;

				beforeAll(async () => {
					channelName = `federated-room-${Date.now()}`;
					matrixRoomId = await hs1AdminApp.createRoom(channelName);
				});

				it('should throw an error if a remote user tries to invite a user without access-federation permission to a room', async () => {
					await expect(hs1AdminApp.matrixClient.invite(matrixRoomId, `@${user.username}:${federationConfig.rc1.url}`)).rejects.toThrow();
					const subscriptions = await getSubscriptions(rc1AdminRequestConfig);
					const invitedSub = subscriptions.update.find((sub) => sub.fname?.includes(channelName));
					expect(invitedSub).toBeUndefined();
				});

				it('should be able to invite a user to a room if the user has access-federation permission', async () => {
					await expect(hs1AdminApp.matrixClient.invite(matrixRoomId, federationConfig.rc1.adminMatrixUserId)).resolves.not.toThrow();

					await retry('waiting for invitation to be processed', async () => {
						const subscriptions = await getSubscriptions(rc1AdminRequestConfig);

						const pendingInvitation = subscriptions.update.find(
							(subscription) => subscription.status === 'INVITED' && subscription.fname?.includes(channelName),
						);
						expect(pendingInvitation).not.toBeUndefined();
					});
				});
			});

			it('should throw an error if a user without access-federation permission tries to create a federated room', async () => {
				const channelName = `federated-room-${Date.now()}`;
				const createResponse = await createRoom({
					type: 'p',
					name: channelName,
					members: [],
					extraData: {
						federated: true,
					},
					config: rc1User1RequestConfig,
				});

				expect(createResponse.status).toBe(400);
				expect(createResponse.body).toHaveProperty('success', false);
				expect(createResponse.body).toHaveProperty('errorType', 'error-not-authorized-federation');
			});

			describe('Inviting from a local server', () => {
				let channelName: string;

				let createResponse;
				let addUserResponse;

				beforeAll(async () => {
					channelName = `federated-room-${Date.now()}`;
					createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: rc1AdminRequestConfig,
					});
					expect(createResponse.status).toBe(200);
					expect(createResponse.body).toHaveProperty('success', true);
					expect(createResponse.body).toHaveProperty('group');
					expect(createResponse.body.group).toHaveProperty('_id');
					expect(createResponse.body.group).toHaveProperty('t', 'p');
					expect(createResponse.body.group).toHaveProperty('federated', true);
				});
				let user: TestUser<IUser>;

				beforeAll(async () => {
					user = await createUser(
						{
							username: `g3-${Date.now()}`,
							password: '1',
							roles: ['user'],
						},
						rc1AdminRequestConfig,
					);
				});

				afterAll(async () => {
					await deleteUser(user, {}, rc1AdminRequestConfig);
				});
				it('should not be able to add a user without access-federation permission to a room', async () => {
					const addUserResponse = await addUserToRoom({
						usernames: [user.username],
						rid: createResponse.body.group._id,
						config: rc1AdminRequestConfig,
					});

					expect(addUserResponse.status).toBe(200);
					expect(addUserResponse.body).toHaveProperty('success', true);
					expect(addUserResponse.body.message).toMatch(/error-not-authorized-federation/);
				});

				it("should be able to add a remote user to a room regardless of the user's access-federation permission defined locally", async () => {
					addUserResponse = await addUserToRoom({
						usernames: [federationConfig.hs1.adminMatrixUserId],
						rid: createResponse.body.group._id,
						config: rc1AdminRequestConfig,
					});

					expect(addUserResponse.status).toBe(200);
					expect(addUserResponse.body).toHaveProperty('success', true);
					expect(addUserResponse.body).toHaveProperty('message');
					expect(addUserResponse.body.message).toMatch('{"msg":"result","id":"id","result":true}');
				});
			});
		});

		describe('Users with access-federation permission', () => {
			let user: TestUser<IUser>;

			beforeAll(async () => {
				user = await createUser(
					{
						username: `g3-${Date.now()}`,
						password: '1',
						roles: ['user', 'admin'],
					},
					rc1AdminRequestConfig,
				);
			});

			afterAll(async () => {
				await deleteUser(user, {}, rc1AdminRequestConfig);
			});

			it('should be able to create a federated room if the user has access-federation permission', async () => {
				const channelName = `federated-room-${Date.now()}`;
				const createResponse = await createRoom({
					type: 'p',
					name: channelName,
					members: [],
					extraData: {
						federated: true,
					},
					config: rc1AdminRequestConfig,
				});

				expect(createResponse.status).toBe(200);
				expect(createResponse.body).toHaveProperty('success', true);
				expect(createResponse.body).toHaveProperty('group');
				expect(createResponse.body.group).toHaveProperty('_id');
				expect(createResponse.body.group).toHaveProperty('t', 'p');
				expect(createResponse.body.group).toHaveProperty('federated', true);
			});

			describe('Add a user with access-federation permission to a room', () => {
				beforeAll(async () =>
					rc1AdminRequestConfig.request
						.post(api('permissions.update'))
						.set(rc1AdminRequestConfig.credentials)
						.send({ permissions: [{ _id: 'access-federation', roles: ['admin', 'user'] }] })
						.expect('Content-Type', 'application/json')
						.expect(200),
				);

				it('should be able to add a user with access-federation permission to a room', async () => {
					const createResponse = await createRoom({
						type: 'p',
						name: `federated-room-${Date.now()}`,
						members: [],
						extraData: {
							federated: true,
						},
						config: rc1AdminRequestConfig,
					}).expect(200);

					const addUserResponse = await addUserToRoom({
						usernames: [user.username],
						rid: createResponse.body.group._id,
						config: rc1AdminRequestConfig,
					}).expect(200);

					expect(addUserResponse.body).toHaveProperty('success', true);
					expect(addUserResponse.body).toHaveProperty('message');
					expect(addUserResponse.body.message).toMatch('{"msg":"result","id":"id","result":true}');
				});
			});
		});
	});
});

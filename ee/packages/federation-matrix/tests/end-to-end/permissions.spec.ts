import type { IRoomNativeFederated, IUser } from '@rocket.chat/core-typings';

import type {} from '../../../../../apps/meteor/app/api/server/v1/permissions.ts';
import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { addUserToRoom, createRoom, getSubscriptionByRoomId, getSubscriptions } from '../../../../../apps/meteor/tests/data/rooms.helper';
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
					await expect(hs1AdminApp.matrixClient.invite(matrixRoomId, `@${user.username}:${federationConfig.rc1.domain}`)).rejects.toThrow();
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

					expect(addUserResponse.status).toBe(400);
					expect(addUserResponse.body).toHaveProperty('success', false);
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

	describe('Federation_Service_Validate_User_Domain Setting', () => {
		const rcValidUser1 = {
			username: `valid-user1-${Date.now()}`,
			fullName: `Valid User1 ${Date.now()}`,
			get matrixId() {
				return `@${this.username}:${federationConfig.rc1.domain}`;
			},
			config: {} as IRequestConfig,
			user: {} as TestUser<IUser>,
		};

		const rcValidUser2 = {
			username: `valid-user2-${Date.now()}`,
			fullName: `Valid User2 ${Date.now()}`,
			get matrixId() {
				return `@${this.username}:${federationConfig.rc1.domain}`;
			},
			config: {} as IRequestConfig,
			user: {} as TestUser<IUser>,
		};

		beforeAll(async () => {
			// Ensure access-federation is granted to all users
			await rc1AdminRequestConfig.request
				.post(api('permissions.update'))
				.set(rc1AdminRequestConfig.credentials)
				.send({ permissions: [{ _id: 'access-federation', roles: ['admin', 'user'] }] })
				.expect('Content-Type', 'application/json')
				.expect(200);

			// Create RC users
			rcValidUser1.user = await createUser(
				{
					username: rcValidUser1.username,
					password: 'random',
					email: `${rcValidUser1.username}@${federationConfig.rc1.domain}`,
					name: rcValidUser1.fullName,
				},
				rc1AdminRequestConfig,
			);

			await rc1AdminRequestConfig.request
				.post(api('users.update'))
				.set(rc1AdminRequestConfig.credentials)
				.send({
					userId: rcValidUser1.user._id,
					data: {
						verified: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			rcValidUser1.config = await getRequestConfig(federationConfig.rc1.url, rcValidUser1.username, 'random');

			rcValidUser2.user = await createUser(
				{
					username: rcValidUser2.username,
					password: 'random',
					email: `${rcValidUser2.username}@${federationConfig.rc1.domain}`,
					name: rcValidUser2.fullName,
				},
				rc1AdminRequestConfig,
			);

			await rc1AdminRequestConfig.request
				.post(api('users.update'))
				.set(rc1AdminRequestConfig.credentials)
				.send({
					userId: rcValidUser2.user._id,
					data: {
						verified: true,
					},
				})
				.expect('Content-Type', 'application/json')
				.expect(200);

			rcValidUser2.config = await getRequestConfig(federationConfig.rc1.url, rcValidUser2.username, 'random');
		});

		afterAll(async () => {
			await Promise.all([
				deleteUser(rcValidUser1.user, {}, rc1AdminRequestConfig),
				deleteUser(rcValidUser2.user, {}, rc1AdminRequestConfig),
			]);
		});

		describe('When setting is enabled', () => {
			beforeAll(async () => {
				// Enable email domain validation
				await rc1AdminRequestConfig.request
					.post(api('settings/Federation_Service_Validate_User_Domain'))
					.set(rc1AdminRequestConfig.credentials)
					.send({ value: true })
					.expect('Content-Type', 'application/json')
					.expect(200);
			});

			afterAll(async () => {
				// Disable email domain validation
				await rc1AdminRequestConfig.request
					.post(api('settings/Federation_Service_Validate_User_Domain'))
					.set(rc1AdminRequestConfig.credentials)
					.send({ value: false })
					.expect('Content-Type', 'application/json')
					.expect(200);
			});

			describe('User with verified email matching federation domain', () => {
				it('should be able to create a federated room', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: rcValidUser1.config,
					});

					expect(createResponse.status).toBe(200);
					expect(createResponse.body).toHaveProperty('success', true);
					expect(createResponse.body).toHaveProperty('group');
					expect(createResponse.body.group).toHaveProperty('federated', true);
				});

				it('should be able to be added to a federated room', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: rcValidUser1.config,
					});

					expect(createResponse.status).toBe(200);

					const addUserResponse = await addUserToRoom({
						usernames: [rcValidUser2.username],
						rid: createResponse.body.group._id,
						config: rcValidUser1.config,
					});

					expect(addUserResponse.status).toBe(200);
					expect(addUserResponse.body).toHaveProperty('success', true);
				});

				it('should be able to be added to a federated room during creation', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [rcValidUser2.username],
						extraData: {
							federated: true,
						},
						config: rcValidUser1.config,
					});

					expect(createResponse.status).toBe(200);
					expect(createResponse.body).toHaveProperty('success', true);
					expect(createResponse.body).toHaveProperty('group');
					expect(createResponse.body.group).toHaveProperty('federated', true);
				});
			});

			describe('User with verified email NOT matching federation domain', () => {
				let userWithNonMatchingEmail: TestUser<IUser>;
				let userRequestConfig: IRequestConfig;

				beforeAll(async () => {
					userWithNonMatchingEmail = await createUser(
						{
							username: `user-nonmatching-${Date.now()}`,
							password: 'password123',
							email: `user-nonmatching-${Date.now()}@external-domain.com`,
							roles: ['user'],
						},
						rc1AdminRequestConfig,
					);

					// Verify the user's email
					await rc1AdminRequestConfig.request
						.post(api('users.update'))
						.set(rc1AdminRequestConfig.credentials)
						.send({
							userId: userWithNonMatchingEmail._id,
							data: {
								verified: true,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200);

					userRequestConfig = await getRequestConfig(federationConfig.rc1.url, userWithNonMatchingEmail.username, 'password123');
				});

				afterAll(async () => {
					await deleteUser(userWithNonMatchingEmail, {}, rc1AdminRequestConfig);
				});

				it('should NOT be able to create a federated room', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: userRequestConfig,
					});

					expect(createResponse.status).toBe(400);
					expect(createResponse.body).toHaveProperty('success', false);
					expect(createResponse.body).toHaveProperty('errorType', 'error-not-authorized-federation');
				});

				it('should NOT be able to be added to a federated room', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: rcValidUser1.config,
					});

					expect(createResponse.status).toBe(200);

					const addUserResponse = await addUserToRoom({
						usernames: [userWithNonMatchingEmail.username],
						rid: createResponse.body.group._id,
						config: rcValidUser1.config,
					});

					expect(addUserResponse.status).toBe(400);
					expect(addUserResponse.body).toHaveProperty('success', false);
					expect(addUserResponse.body.message).toMatch(/error-not-authorized-federation/);
				});

				it('should NOT be able to be added to a federated room during creation', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [userWithNonMatchingEmail.username],
						extraData: {
							federated: true,
						},
						config: userRequestConfig,
					});

					expect(createResponse.status).toBe(400);
					expect(createResponse.body).toHaveProperty('success', false);
					expect(createResponse.body).toHaveProperty('errorType', 'error-not-authorized-federation');
				});
			});

			describe('User with unverified email matching federation domain', () => {
				let userWithUnverifiedEmail: TestUser<IUser>;
				let userRequestConfig: IRequestConfig;

				beforeAll(async () => {
					userWithUnverifiedEmail = await createUser(
						{
							username: `user-unverified-${Date.now()}`,
							password: 'password123',
							email: `user-unverified-${Date.now()}@${federationConfig.rc1.domain}`,
							roles: ['user'],
						},
						rc1AdminRequestConfig,
					);

					userRequestConfig = await getRequestConfig(federationConfig.rc1.url, userWithUnverifiedEmail.username, 'password123');
				});

				afterAll(async () => {
					await deleteUser(userWithUnverifiedEmail, {}, rc1AdminRequestConfig);
				});

				it('should NOT be able to create a federated room', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: userRequestConfig,
					});

					expect(createResponse.status).toBe(400);
					expect(createResponse.body).toHaveProperty('success', false);
					expect(createResponse.body).toHaveProperty('errorType', 'error-not-authorized-federation');
				});

				it('should NOT be able to be added to a federated room', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: rcValidUser1.config,
					});

					expect(createResponse.status).toBe(200);

					const addUserResponse = await addUserToRoom({
						usernames: [userWithUnverifiedEmail.username],
						rid: createResponse.body.group._id,
						config: rcValidUser1.config,
					});

					expect(addUserResponse.status).toBe(400);
					expect(addUserResponse.body).toHaveProperty('success', false);
					expect(addUserResponse.body.message).toMatch(/error-not-authorized-federation/);
				});
			});

			describe('User without email', () => {
				let userWithoutEmail: TestUser<IUser>;
				let userRequestConfig: IRequestConfig;

				beforeAll(async () => {
					userWithoutEmail = await createUser(
						{
							username: `user-noemail-${Date.now()}`,
							password: 'password123',
							roles: ['user'],
						},
						rc1AdminRequestConfig,
					);

					userRequestConfig = await getRequestConfig(federationConfig.rc1.url, userWithoutEmail.username, 'password123');
				});

				afterAll(async () => {
					await deleteUser(userWithoutEmail, {}, rc1AdminRequestConfig);
				});

				it('should NOT be able to create a federated room', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: userRequestConfig,
					});

					expect(createResponse.status).toBe(400);
					expect(createResponse.body).toHaveProperty('success', false);
					expect(createResponse.body).toHaveProperty('errorType', 'error-not-authorized-federation');
				});

				it('should NOT be able to be added to a federated room', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: rcValidUser1.config,
					});

					expect(createResponse.status).toBe(200);

					const addUserResponse = await addUserToRoom({
						usernames: [userWithoutEmail.username],
						rid: createResponse.body.group._id,
						config: rcValidUser1.config,
					});

					expect(addUserResponse.status).toBe(400);
					expect(addUserResponse.body).toHaveProperty('success', false);
					expect(addUserResponse.body.message).toMatch(/error-not-authorized-federation/);
				});
			});

			describe('Remote invitations with email domain validation', () => {
				let userWithMatchingEmail: TestUser<IUser>;
				let userWithNonMatchingEmail: TestUser<IUser>;
				let matrixRoomId: string;

				let userWithMatchingEmailRequestConfig: IRequestConfig;
				let userWithNonMatchingEmailRequestConfig: IRequestConfig;

				const channelName = `federated-room-${Date.now()}`;

				beforeAll(async () => {
					userWithMatchingEmail = await createUser(
						{
							username: `user-remote-matching-${Date.now()}`,
							password: 'password123',
							email: `user-remote-matching-${Date.now()}@${federationConfig.rc1.domain}`,
							roles: ['user'],
						},
						rc1AdminRequestConfig,
					);

					userWithMatchingEmailRequestConfig = await getRequestConfig(
						federationConfig.rc1.url,
						userWithMatchingEmail.username,
						'password123',
					);

					// Verify the user's email
					await rc1AdminRequestConfig.request
						.post(api('users.update'))
						.set(rc1AdminRequestConfig.credentials)
						.send({
							userId: userWithMatchingEmail._id,
							data: {
								verified: true,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200);

					userWithNonMatchingEmail = await createUser(
						{
							username: `user-remote-nonmatching-${Date.now()}`,
							password: 'password123',
							email: `user-remote-nonmatching-${Date.now()}@external-domain.com`,
							roles: ['user'],
						},
						rc1AdminRequestConfig,
					);

					userWithNonMatchingEmailRequestConfig = await getRequestConfig(
						federationConfig.rc1.url,
						userWithNonMatchingEmail.username,
						'password123',
					);

					// Verify the user's email
					await rc1AdminRequestConfig.request
						.post(api('users.update'))
						.set(rc1AdminRequestConfig.credentials)
						.send({
							userId: userWithNonMatchingEmail._id,
							data: {
								verified: true,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200);

					matrixRoomId = await hs1AdminApp.createRoom(channelName);
				});

				afterAll(async () => {
					await deleteUser(userWithMatchingEmail, {}, rc1AdminRequestConfig);
					await deleteUser(userWithNonMatchingEmail, {}, rc1AdminRequestConfig);
				});

				it('should accept invitation for user with verified email matching federation domain', async () => {
					await expect(
						hs1AdminApp.matrixClient.invite(matrixRoomId, `@${userWithMatchingEmail.username}:${federationConfig.rc1.domain}`),
					).resolves.not.toThrow();

					await retry('this is an async operation, so we need to wait for the room to be created in RC', async () => {
						const roomsResponse = await userWithMatchingEmailRequestConfig.request
							.get(api('rooms.get'))
							.set(userWithMatchingEmailRequestConfig.credentials)
							.expect(200);

						expect(roomsResponse.body).toHaveProperty('success', true);
						expect(roomsResponse.body).toHaveProperty('update');

						const rcRoomConverted = roomsResponse.body.update.find((room: IRoomNativeFederated) => room.federation.mrid === matrixRoomId);

						expect(rcRoomConverted).toHaveProperty('_id');
						expect(rcRoomConverted).toHaveProperty('t', 'p');

						const subA = await getSubscriptionByRoomId(
							rcRoomConverted._id,
							userWithMatchingEmailRequestConfig.credentials,
							userWithMatchingEmailRequestConfig.request,
						);

						expect(subA).toHaveProperty('fname', `${channelName}:${federationConfig.hs1.domain}`);
						expect(subA).toHaveProperty('status', 'INVITED');
					});
				});

				it('should reject invitation for user with verified email NOT matching federation domain', async () => {
					await expect(
						hs1AdminApp.matrixClient.invite(matrixRoomId, `@${userWithNonMatchingEmail.username}:${federationConfig.rc1.domain}`),
					).rejects.toThrow();

					const subscriptions = await getSubscriptions(userWithNonMatchingEmailRequestConfig);
					const invitedSub = subscriptions.update.find((sub) => sub.name === userWithNonMatchingEmail.username);
					expect(invitedSub).toBeUndefined();
				});
			});
		});

		describe('When setting is disabled', () => {
			beforeAll(async () => {
				// Disable email domain validation
				await rc1AdminRequestConfig.request
					.post(api('settings/Federation_Service_Validate_User_Domain'))
					.set(rc1AdminRequestConfig.credentials)
					.send({ value: false })
					.expect('Content-Type', 'application/json')
					.expect(200);
			});

			describe('User with any email domain', () => {
				let userWithNonMatchingEmail: TestUser<IUser>;
				let userRequestConfig: IRequestConfig;

				beforeAll(async () => {
					userWithNonMatchingEmail = await createUser(
						{
							username: `user-any-domain-${Date.now()}`,
							password: 'password123',
							email: `user-any-domain-${Date.now()}@external-domain.com`,
							roles: ['user'],
						},
						rc1AdminRequestConfig,
					);

					// Verify the user's email
					await rc1AdminRequestConfig.request
						.post(api('users.update'))
						.set(rc1AdminRequestConfig.credentials)
						.send({
							userId: userWithNonMatchingEmail._id,
							data: {
								verified: true,
							},
						})
						.expect('Content-Type', 'application/json')
						.expect(200);

					userRequestConfig = await getRequestConfig(federationConfig.rc1.url, userWithNonMatchingEmail.username, 'password123');
				});

				afterAll(async () => {
					await deleteUser(userWithNonMatchingEmail, {}, rc1AdminRequestConfig);
				});

				it('should be able to create a federated room regardless of email domain', async () => {
					const channelName = `federated-room-${Date.now()}`;
					const createResponse = await createRoom({
						type: 'p',
						name: channelName,
						members: [],
						extraData: {
							federated: true,
						},
						config: userRequestConfig,
					});

					expect(createResponse.status).toBe(200);
					expect(createResponse.body).toHaveProperty('success', true);
					expect(createResponse.body).toHaveProperty('group');
					expect(createResponse.body.group).toHaveProperty('federated', true);
				});

				it('should be able to be added to a federated room regardless of email domain', async () => {
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

					const addUserResponse = await addUserToRoom({
						usernames: [userWithNonMatchingEmail.username],
						rid: createResponse.body.group._id,
						config: rc1AdminRequestConfig,
					});

					expect(addUserResponse.status).toBe(200);
					expect(addUserResponse.body).toHaveProperty('success', true);
				});
			});
		});
	});
});

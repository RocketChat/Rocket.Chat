import { api } from '../../../../../apps/meteor/tests/data/api-data';
import { addUserToRoom, createRoom } from '../../../../../apps/meteor/tests/data/rooms.helper';
import { getRequestConfig } from '../../../../../apps/meteor/tests/data/users.helper';
import type { IRequestConfig } from '../../../../../apps/meteor/tests/data/users.helper';
import { IS_EE } from '../../../../../apps/meteor/tests/e2e/config/constants';
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
	});

	beforeAll(async () => {
		// Remove permissions for access-federation to any user but admin
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

	afterAll(async () => {
		await hs1AdminApp.close();
	});

	describe('Access Federation Permission', () => {
		it('should throw an error if a user without access-federation permission tries to create a federated room', async () => {
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

			expect(createResponse.status).toBe(400);
			expect(createResponse.body).toHaveProperty('success', false);
			expect(createResponse.body).toHaveProperty('errorType', 'error-not-authorized-federation');
		});

		it('should be able to create a federated room if the user has access-federation permission', async () => {
			const channelName = `federated-room-${Date.now()}`;
			const createResponse = await createRoom({
				type: 'p',
				name: channelName,
				members: [],
				config: rc1AdminRequestConfig,
			});

			expect(createResponse.status).toBe(200);
			expect(createResponse.body).toHaveProperty('success', true);
			expect(createResponse.body).toHaveProperty('room');
			expect(createResponse.body.room).toHaveProperty('_id');
			expect(createResponse.body.room).toHaveProperty('t', 'p');
			expect(createResponse.body.room).toHaveProperty('federated', true);
		});

		it('should not be able to add a user without access-federation permission to a room', async () => {
			const createResponse = await createRoom({
				type: 'p',
				name: `federated-room-${Date.now()}`,
				members: [],
				config: rc1AdminRequestConfig,
			});

			expect(createResponse.status).toBe(200);
			expect(createResponse.body).toHaveProperty('success', true);
			expect(createResponse.body).toHaveProperty('room');
			expect(createResponse.body.room).toHaveProperty('_id');
			expect(createResponse.body.room).toHaveProperty('t', 'p');
			expect(createResponse.body.room).toHaveProperty('federated', true);

			const addUserResponse = await addUserToRoom({
				usernames: [federationConfig.hs1.adminMatrixUserId],
				rid: createResponse.body.room._id,
				config: rc1User1RequestConfig,
			});

			expect(addUserResponse.status).toBe(400);
			expect(addUserResponse.body).toHaveProperty('success', false);
			expect(addUserResponse.body).toHaveProperty('errorType', 'error-not-authorized-federation');
		});
	});
});

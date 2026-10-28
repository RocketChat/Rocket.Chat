import { FederationMatrix } from '@rocket.chat/core-services';
import { federationSDK } from '@rocket.chat/federation-sdk';
import { Users } from '@rocket.chat/models';

import { getMatrixInviteRoutes } from './invite';

jest.mock('@rocket.chat/core-services', () => ({
	FederationMatrix: {
		canUserAccessFederation: jest.fn(),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	Users: {
		findOneByUsername: jest.fn(),
	},
}));

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		verifyRequestSignature: jest.fn(),
		getConfig: jest.fn(),
		processInvite: jest.fn(),
	},
	NotAllowedError: class NotAllowedError extends Error {},
	errCodes: {
		M_UNAUTHORIZED: { errcode: 'M_UNAUTHORIZED', error: 'Unauthorized', status: 401 },
		M_UNKNOWN: { errcode: 'M_UNKNOWN', error: 'Unknown error' },
	},
}));

const mockVerifyRequestSignature = federationSDK.verifyRequestSignature as jest.MockedFunction<typeof federationSDK.verifyRequestSignature>;
const mockGetConfig = federationSDK.getConfig as jest.MockedFunction<typeof federationSDK.getConfig>;
const mockProcessInvite = federationSDK.processInvite as jest.MockedFunction<typeof federationSDK.processInvite>;
const mockFindOneByUsername = Users.findOneByUsername as jest.MockedFunction<typeof Users.findOneByUsername>;
const mockCanUserAccessFederation = FederationMatrix.canUserAccessFederation as jest.MockedFunction<
	typeof FederationMatrix.canUserAccessFederation
>;

const OUR_SERVER_NAME = 'rocketchat.local';

const buildInviteEvent = (stateKey: string) => ({
	type: 'm.room.member',
	state_key: stateKey,
	sender: '@attacker:attacker.com',
	room_id: '!room:attacker.com',
	origin_server_ts: 1600000000000,
	depth: 1,
	prev_events: [],
	auth_events: [],
	content: { membership: 'invite' },
});

const sendInvite = async (event: unknown) =>
	getMatrixInviteRoutes()
		.getHonoRouter()
		.request('/v2/invite/!room:attacker.com/$event', {
			method: 'PUT',
			headers: {
				'Authorization': 'X-Matrix origin="attacker.com"',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				room_version: '10',
				event,
				invite_room_state: [{ type: 'm.room.create', state_key: '', content: { creator: '@attacker:attacker.com' } }],
			}),
		});

describe('PUT /_matrix/federation/v2/invite/:roomId/:eventId', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		mockVerifyRequestSignature.mockResolvedValue({ origin: 'attacker.com' } as any);
		mockGetConfig.mockImplementation((key) => (key === 'serverName' ? OUR_SERVER_NAME : undefined) as any);
		mockFindOneByUsername.mockResolvedValue({ _id: 'victimId', username: 'victim' } as any);
		mockCanUserAccessFederation.mockResolvedValue(true);
		mockProcessInvite.mockImplementation(async (event: any) => ({ event }) as any);
	});

	it('should reject an invite whose state_key belongs to another homeserver', async () => {
		const response = await sendInvite(buildInviteEvent(`@victim:attacker.com`));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			errcode: 'M_UNKNOWN',
			error: 'The invite event must be for a user of this server',
		});
		expect(mockFindOneByUsername).not.toHaveBeenCalled();
		expect(mockProcessInvite).not.toHaveBeenCalled();
	});

	it('should reject an invite whose state_key is not a valid user ID', async () => {
		const response = await sendInvite(buildInviteEvent('victim'));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			errcode: 'M_UNKNOWN',
			error: 'The invite event state_key is not a valid user ID',
		});
		expect(mockFindOneByUsername).not.toHaveBeenCalled();
		expect(mockProcessInvite).not.toHaveBeenCalled();
	});

	it('should reject an invite whose state_key has an empty localpart', async () => {
		const response = await sendInvite(buildInviteEvent(`@:${OUR_SERVER_NAME}`));

		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({
			errcode: 'M_UNKNOWN',
			error: 'The invite event state_key is not a valid user ID',
		});
		expect(mockFindOneByUsername).not.toHaveBeenCalled();
		expect(mockProcessInvite).not.toHaveBeenCalled();
	});

	it('should reject an invite addressed to a user that does not exist on this server', async () => {
		mockFindOneByUsername.mockResolvedValue(null);

		const response = await sendInvite(buildInviteEvent(`@ghost:${OUR_SERVER_NAME}`));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			errcode: 'M_FORBIDDEN',
			error: 'User does not have permission to access federation',
		});
		expect(mockProcessInvite).not.toHaveBeenCalled();
	});

	it('should accept a state_key whose localpart contains characters the spec allows', async () => {
		const response = await sendInvite(buildInviteEvent(`@victim+1/2:${OUR_SERVER_NAME}`));

		expect(response.status).toBe(200);
		expect(mockFindOneByUsername).toHaveBeenCalledWith('victim+1/2');
	});

	it('should process an invite addressed to a user of this server', async () => {
		const response = await sendInvite(buildInviteEvent(`@victim:${OUR_SERVER_NAME}`));

		expect(response.status).toBe(200);
		expect(mockFindOneByUsername).toHaveBeenCalledWith('victim');
		expect(mockProcessInvite).toHaveBeenCalledTimes(1);
	});
});

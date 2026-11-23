import { NotAllowedError, federationSDK } from '@rocket.chat/federation-sdk';

import { getMatrixMakeLeaveRoutes } from './make-leave';

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		verifyRequestSignature: jest.fn(),
		makeLeave: jest.fn(),
	},
	NotAllowedError: class NotAllowedError extends Error {},
	errCodes: {
		M_UNAUTHORIZED: { errcode: 'M_UNAUTHORIZED', error: 'Unauthorized', status: 401 },
		M_UNKNOWN: { errcode: 'M_UNKNOWN', error: 'Unknown error' },
	},
}));

class ForbiddenError extends Error {
	readonly errcode = 'M_FORBIDDEN';
}

const sdk = federationSDK as unknown as Record<keyof typeof federationSDK, jest.Mock>;

const roomId = '!room:remote.example';
const verifiedOrigin = 'remote.example';

const makeLeave = (userId: string) =>
	getMatrixMakeLeaveRoutes()
		.getHonoRouter()
		.request(`/v1/make_leave/${encodeURIComponent(roomId)}/${encodeURIComponent(userId)}`, {
			method: 'GET',
			headers: { Authorization: 'X-Matrix origin="unverified.example"' },
		});

describe('GET /_matrix/federation/v1/make_leave/:roomId/:userId', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		sdk.verifyRequestSignature.mockResolvedValue(verifiedOrigin);
		sdk.makeLeave.mockResolvedValue({
			event: {
				type: 'm.room.member',
				sender: '@alice:remote.example',
				state_key: '@alice:remote.example',
				content: { membership: 'leave' },
				origin_server_ts: 1,
			},
			room_version: '12',
		});
	});

	it('should build the leave for the server that signed the request', async () => {
		const response = await makeLeave('@alice:remote.example');

		expect(response.status).toBe(200);
		expect(sdk.makeLeave).toHaveBeenCalledWith(roomId, '@alice:remote.example', verifiedOrigin);
	});

	it('should answer 403 with the SDK message when the SDK forbids the leave', async () => {
		sdk.makeLeave.mockRejectedValue(new ForbiddenError('User @victim:rocketchat.local does not belong to remote.example'));

		const response = await makeLeave('@victim:rocketchat.local');

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			errcode: 'M_FORBIDDEN',
			error: 'User @victim:rocketchat.local does not belong to remote.example',
		});
	});

	it('should answer 403 when federation settings do not allow leaving the room', async () => {
		sdk.makeLeave.mockRejectedValue(new NotAllowedError('not allowed'));

		const response = await makeLeave('@alice:remote.example');

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			errcode: 'M_FORBIDDEN',
			error: 'This server does not allow leaving this room based on federation settings.',
		});
	});

	it('should answer 500 for an error that carries another errcode', async () => {
		sdk.makeLeave.mockRejectedValue(Object.assign(new Error('room not found'), { errcode: 'M_NOT_FOUND' }));

		const response = await makeLeave('@alice:remote.example');

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ errcode: 'M_UNKNOWN', error: 'room not found' });
	});
});

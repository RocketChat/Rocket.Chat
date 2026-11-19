import { NotAllowedError, federationSDK } from '@rocket.chat/federation-sdk';

import { getMatrixSendLeaveRoutes } from './send-leave';

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		verifyRequestSignature: jest.fn(),
		sendLeave: jest.fn(),
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
const eventId = '$leave';

const buildLeaveEvent = (sender: string) => ({
	type: 'm.room.member',
	sender,
	state_key: sender,
	origin: 'remote.example',
	origin_server_ts: 1600000000000,
	depth: 10,
	content: { membership: 'leave' },
});

const sendLeave = (event: ReturnType<typeof buildLeaveEvent>) =>
	getMatrixSendLeaveRoutes()
		.getHonoRouter()
		.request(`/v2/send_leave/${encodeURIComponent(roomId)}/${encodeURIComponent(eventId)}`, {
			method: 'PUT',
			headers: {
				'Authorization': 'X-Matrix origin="remote.example"',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(event),
		});

describe('PUT /_matrix/federation/v2/send_leave/:roomId/:eventId', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		sdk.verifyRequestSignature.mockResolvedValue('remote.example');
		sdk.sendLeave.mockImplementation(async (_roomId: string, _eventId: string, event: { sender: string }, origin: string) => {
			if (event.sender.split(':')[1] !== origin) {
				throw new ForbiddenError(`Leave sender ${event.sender} does not belong to ${origin}`);
			}
		});
	});

	it('should accept a leave sent by a user of the requesting server', async () => {
		const event = buildLeaveEvent('@alice:remote.example');

		const response = await sendLeave(event);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({});
		expect(sdk.sendLeave).toHaveBeenCalledWith(roomId, eventId, event, 'remote.example');
	});

	it('should answer 403 when the leave sender belongs to another server than the requesting one', async () => {
		const event = buildLeaveEvent('@victim:rocketchat.local');

		const response = await sendLeave(event);

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			errcode: 'M_FORBIDDEN',
			error: 'Leave sender @victim:rocketchat.local does not belong to remote.example',
		});
		expect(sdk.sendLeave).toHaveBeenCalledWith(roomId, eventId, event, 'remote.example');
	});

	it('should answer 403 when federation settings do not allow leaving the room', async () => {
		sdk.sendLeave.mockRejectedValue(new NotAllowedError('not allowed'));

		const response = await sendLeave(buildLeaveEvent('@alice:remote.example'));

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			errcode: 'M_FORBIDDEN',
			error: 'This server does not allow leaving this room based on federation settings.',
		});
	});

	it('should answer 500 for an error that carries another errcode', async () => {
		sdk.sendLeave.mockRejectedValue(Object.assign(new Error('room not found'), { errcode: 'M_NOT_FOUND' }));

		const response = await sendLeave(buildLeaveEvent('@alice:remote.example'));

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({ errcode: 'M_UNKNOWN', error: 'room not found' });
	});
});

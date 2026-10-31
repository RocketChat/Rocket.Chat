import { federationSDK } from '@rocket.chat/federation-sdk';

import { getMatrixTransactionsRoutes } from './transactions';

jest.mock('@rocket.chat/federation-sdk', () => ({
	federationSDK: {
		verifyRequestSignature: jest.fn(),
		canAccessResource: jest.fn(),
		processIncomingTransaction: jest.fn(),
		getStateIds: jest.fn(),
		getState: jest.fn(),
		getEventById: jest.fn(),
		getBackfillEvents: jest.fn(),
	},
	errCodes: {
		M_UNAUTHORIZED: { errcode: 'M_UNAUTHORIZED', error: 'Unauthorized', status: 401 },
		M_UNKNOWN: { errcode: 'M_UNKNOWN', error: 'Unknown error' },
	},
}));

const sdk = federationSDK as unknown as Record<keyof typeof federationSDK, jest.Mock>;

const roomId = '!room:remote.example';
const encodedRoomId = encodeURIComponent(roomId);

const request = (path: string, init: RequestInit = {}, authorization: string | null = 'X-Matrix origin="remote.example"') =>
	getMatrixTransactionsRoutes()
		.getHonoRouter()
		.request(path, {
			...init,
			headers: {
				...(authorization && { Authorization: authorization }),
				'Content-Type': 'application/json',
			},
		});

const transaction = { origin: 'remote.example', origin_server_ts: 1600000000000, pdus: [{ type: 'm.room.message' }], edus: [] };

const sendTransaction = (body: unknown = transaction, authorization?: string | null) =>
	request('/v1/send/txn-1', { method: 'PUT', body: JSON.stringify(body) }, authorization);

describe('Matrix federation transaction routes', () => {
	beforeEach(() => {
		jest.resetAllMocks();
		sdk.verifyRequestSignature.mockResolvedValue('remote.example');
		sdk.canAccessResource.mockResolvedValue(true);
		sdk.processIncomingTransaction.mockResolvedValue(undefined);
	});

	describe('PUT /v1/send/:txnId', () => {
		it('should process a signed transaction and report no failed PDUs', async () => {
			const response = await sendTransaction();

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ pdus: {} });
			expect(sdk.processIncomingTransaction).toHaveBeenCalledWith(transaction);
		});

		it('should verify the signature against the method, the path and the body', async () => {
			await sendTransaction();

			expect(sdk.verifyRequestSignature).toHaveBeenCalledWith('X-Matrix origin="remote.example"', 'PUT', '/v1/send/txn-1', transaction);
		});

		it('should answer 500 and process nothing when the signature cannot be verified', async () => {
			sdk.verifyRequestSignature.mockRejectedValue(new Error('key server is down'));

			const response = await sendTransaction();

			expect(response.status).toBe(500);
			expect(sdk.processIncomingTransaction).not.toHaveBeenCalled();
		});

		it('should refuse a transaction with no signature', async () => {
			const response = await sendTransaction(transaction, null);

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ errcode: 'M_UNAUTHORIZED', error: 'Missing Authorization header' });
			expect(sdk.processIncomingTransaction).not.toHaveBeenCalled();
		});

		it('should refuse a transaction with an invalid signature', async () => {
			sdk.verifyRequestSignature.mockResolvedValue(null);

			const response = await sendTransaction();

			expect(response.status).toBe(401);
			expect(await response.json()).toEqual({ errcode: 'M_UNAUTHORIZED', error: 'Unauthorized' });
			expect(sdk.processIncomingTransaction).not.toHaveBeenCalled();
		});

		it('should refuse a transaction with no origin', async () => {
			const { origin: _origin, ...body } = transaction;

			const response = await sendTransaction(body);

			expect(response.status).toBe(400);
			expect(sdk.processIncomingTransaction).not.toHaveBeenCalled();
		});

		it('should ask the origin to slow down when too many transactions are running', async () => {
			sdk.processIncomingTransaction.mockRejectedValue(new Error('too-many-concurrent-transactions'));

			const response = await sendTransaction();

			expect(response.status).toBe(429);
			expect(await response.json()).toEqual({ errcode: 'M_UNKNOWN', error: 'Too many concurrent transactions' });
		});

		it('should refuse a transaction with too many events', async () => {
			sdk.processIncomingTransaction.mockRejectedValue(new Error('too-many-events'));

			const response = await sendTransaction();

			expect(response.status).toBe(400);
			expect(await response.json()).toEqual({ errcode: 'M_UNKNOWN', error: 'Too many PDUs or EDUs' });
		});

		it('should answer 500 on any other failure, so that the origin sends the transaction again', async () => {
			sdk.processIncomingTransaction.mockRejectedValue(new Error('database is down'));

			const response = await sendTransaction();

			expect(response.status).toBe(500);
			expect(await response.json()).toEqual({ errcode: 'M_UNKNOWN', error: 'Failed to process transaction' });
		});
	});

	describe('access to resources', () => {
		const eventId = encodeURIComponent('$event');

		const reads: [string, string, keyof typeof sdk, 'room' | 'event', string][] = [
			['state_ids', `/v1/state_ids/${encodedRoomId}?event_id=${eventId}`, 'getStateIds', 'room', roomId],
			['state', `/v1/state/${encodedRoomId}?event_id=${eventId}`, 'getState', 'room', roomId],
			['event', `/v1/event/${eventId}`, 'getEventById', 'event', '$event'],
			['backfill', `/v1/backfill/${encodedRoomId}?limit=10&v=${eventId}`, 'getBackfillEvents', 'room', roomId],
		];

		it.each(reads)('should refuse %s to a server with no access', async (_name, path, method, entityType, resourceId) => {
			sdk.canAccessResource.mockResolvedValue(false);

			const response = await request(path);

			expect(response.status).toBe(403);
			expect(await response.json()).toEqual({ errcode: 'M_FORBIDDEN', error: 'Access denied to resource' });
			expect(sdk.canAccessResource).toHaveBeenCalledWith(entityType, resourceId, 'remote.example');
			expect(sdk[method]).not.toHaveBeenCalled();
		});

		it('should answer 500 when access cannot be checked', async () => {
			sdk.canAccessResource.mockRejectedValue(new Error('database is down'));

			const response = await request(`/v1/state/${encodedRoomId}?event_id=${eventId}`);

			expect(response.status).toBe(500);
			expect(sdk.getState).not.toHaveBeenCalled();
		});

		it('should refuse an unsigned read', async () => {
			const response = await request(`/v1/state/${encodedRoomId}?event_id=${eventId}`, {}, null);

			expect(response.status).toBe(401);
			expect(sdk.getState).not.toHaveBeenCalled();
		});
	});

	describe('GET /v1/state_ids/:roomId', () => {
		it('should return the state ids at the event', async () => {
			const stateIds = { auth_chain_ids: ['$auth'], pdu_ids: ['$pdu'] };
			sdk.getStateIds.mockResolvedValue(stateIds);

			const response = await request(`/v1/state_ids/${encodedRoomId}?event_id=$event`);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(stateIds);
			expect(sdk.getStateIds).toHaveBeenCalledWith(roomId, '$event');
		});

		it('should verify the signature against the path and the query', async () => {
			sdk.getStateIds.mockResolvedValue({ auth_chain_ids: [], pdu_ids: [] });

			await request(`/v1/state_ids/room?event_id=$event`);

			expect(sdk.verifyRequestSignature).toHaveBeenCalledWith(expect.any(String), 'GET', '/v1/state_ids/room?event_id=$event', undefined);
		});

		it('should answer 404 with no event id', async () => {
			const response = await request(`/v1/state_ids/${encodedRoomId}`);

			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ errcode: 'M_NOT_FOUND', error: 'Event not found' });
			expect(sdk.getStateIds).not.toHaveBeenCalled();
		});
	});

	describe('GET /v1/state/:roomId', () => {
		it('should return the state at the event', async () => {
			const state = { auth_chain: [{ type: 'auth' }], pdus: [{ type: 'pdu' }] };
			sdk.getState.mockResolvedValue(state);

			const response = await request(`/v1/state/${encodedRoomId}?event_id=$event`);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(state);
			expect(sdk.getState).toHaveBeenCalledWith(roomId, '$event');
		});

		it('should answer 404 with no event id', async () => {
			const response = await request(`/v1/state/${encodedRoomId}`);

			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ errcode: 'M_NOT_FOUND', error: 'Event not found' });
			expect(sdk.getState).not.toHaveBeenCalled();
		});
	});

	describe('GET /v1/event/:eventId', () => {
		it('should wrap the event as a transaction from its origin', async () => {
			const event = { type: 'm.room.message', origin_server_ts: 1600000000000 };
			sdk.getEventById.mockResolvedValue({ event, origin: 'other.example' });

			const response = await request('/v1/event/$event');

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ origin_server_ts: 1600000000000, origin: 'other.example', pdus: [event] });
		});

		it('should answer 404 for an unknown event', async () => {
			sdk.getEventById.mockResolvedValue(null);

			const response = await request('/v1/event/$event');

			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({ errcode: 'M_NOT_FOUND', error: 'Event not found' });
		});
	});

	describe('GET /v1/backfill/:roomId', () => {
		const backfill = { origin: 'local.example', origin_server_ts: 1600000000000, pdus: [] };

		it('should return the events before the given ones', async () => {
			sdk.getBackfillEvents.mockResolvedValue(backfill);

			const response = await request(`/v1/backfill/${encodedRoomId}?limit=10&v=$one&v=$two`);

			expect(response.status).toBe(200);
			expect(await response.json()).toEqual(backfill);
			expect(sdk.getBackfillEvents).toHaveBeenCalledWith(roomId, ['$one', '$two'], 10);
		});

		it('should never read more than 100 events', async () => {
			sdk.getBackfillEvents.mockResolvedValue(backfill);

			await request(`/v1/backfill/${encodedRoomId}?limit=5000&v=$one`);

			expect(sdk.getBackfillEvents).toHaveBeenCalledWith(roomId, ['$one'], 100);
		});

		it.each([
			['no limit', 'v=$one'],
			['a limit of zero', 'limit=0&v=$one'],
			['no event', 'limit=10'],
		])('should refuse a request with %s', async (_name, query) => {
			const response = await request(`/v1/backfill/${encodedRoomId}?${query}`);

			expect(response.status).toBe(400);
			expect(sdk.getBackfillEvents).not.toHaveBeenCalled();
		});

		it('should answer 500 when the events cannot be read', async () => {
			sdk.getBackfillEvents.mockRejectedValue(new Error('database is down'));

			const response = await request(`/v1/backfill/${encodedRoomId}?limit=10&v=$one`);

			expect(response.status).toBe(500);
			expect(await response.json()).toEqual({ errcode: 'M_UNKNOWN', error: 'Failed to get backfill events' });
		});
	});
});

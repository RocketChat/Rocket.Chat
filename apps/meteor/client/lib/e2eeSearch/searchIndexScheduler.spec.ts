import type { IMessage } from '@rocket.chat/core-typings';

import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';
import { createSearchIndexCrawler } from './searchIndexCrawler';
import { createSearchIndexScheduler } from './searchIndexScheduler';
import type { SearchIndexRoom } from './searchIndexScheduler';
import { createSyncMessagesServerMock } from '../../../tests/mocks/client/syncMessagesServerMock';
import type { AnySyncMessagesParams } from '../../../tests/mocks/client/syncMessagesServerMock';

const NOW = Date.parse('2026-10-26T12:00:00Z');
const HOUR = 60 * 60 * 1000;
const REQUEST_MS = 50;
const PAUSE_MS = 1000;
const PAGE_SIZE = 10;

/** An HTTP error as `fetch` reports it: the `Response`, with its status, headers and JSON body. */
const httpError = (status: number, headers: Record<string, string> = {}, body: unknown = { success: false }) => {
	const response = {
		status,
		headers: { get: (name: string) => headers[name] ?? null },
		json: async () => body,
		clone: () => response,
	};
	return response;
};

type SetupOptions = {
	rooms: SearchIndexRoom[];
	messagesPerRoom?: number;
	random?: () => number;
	/** Uses the scheduler's own pause between requests instead of the short one of these specs. */
	defaultPause?: boolean;
	/** Uses the scheduler's own back-off delays instead of the short ones of these specs. */
	defaultBackoff?: boolean;
};

const setup = async ({ rooms, messagesPerRoom = 25, random = () => 0.5, defaultPause = false, defaultBackoff = false }: SetupOptions) => {
	const server = createSyncMessagesServerMock({ startAt: NOW });
	for (const { rid } of rooms) {
		for (let i = 0; i < messagesPerRoom; i++) server.addHistory(`${rid}-m${i}`, rid, NOW - 100 * HOUR + i * HOUR);
	}

	const backend = createFakeSearchIndexBackend();
	await backend.open({ userId: 'u1' });
	const removeRoom = jest.spyOn(backend, 'removeRoom');

	const failures: unknown[] = [];
	const requests: { at: number; params: AnySyncMessagesParams }[] = [];
	let inFlight = 0;
	let maxInFlight = 0;
	const syncMessages = jest.fn(async (params: AnySyncMessagesParams) => {
		requests.push({ at: Date.now(), params });
		inFlight++;
		maxInFlight = Math.max(maxInFlight, inFlight);
		try {
			await new Promise((resolve) => setTimeout(resolve, REQUEST_MS));
			const failure = failures.shift();
			if (failure) throw failure;
			return await server.syncMessages(params);
		} finally {
			inFlight--;
		}
	});

	const missingKeys = new Set<string>();
	const indexed = new Map<string, number>();
	const crawler = createSearchIndexCrawler({
		backend,
		syncMessages,
		decryptMessage: async (message) => {
			if (missingKeys.has(message.rid)) return message;
			indexed.set(message._id, new Date(message._updatedAt).getTime());
			return { ...message, e2e: 'done' } as IMessage;
		},
		writer: {
			remove: async (ids) => {
				ids.forEach((id) => indexed.delete(id));
			},
			flush: async () => undefined,
		},
		now: () => server.now(),
		pageSize: PAGE_SIZE,
	});

	const onError = jest.fn();
	const scheduler = createSearchIndexScheduler({
		crawler,
		backend,
		getRooms: () => rooms,
		...(!defaultPause && { pauseMs: PAUSE_MS }),
		...(!defaultBackoff && { backoffBaseMs: 1000, backoffMaxMs: 60_000 }),
		random,
		onError,
	});

	const roomsOf = () => requests.map(({ params }) => params.roomId);
	const gaps = () => requests.slice(1).map(({ at }, i) => at - requests[i].at);

	return {
		server,
		backend,
		removeRoom,
		failures,
		requests,
		syncMessages,
		missingKeys,
		indexed,
		onError,
		scheduler,
		roomsOf,
		gaps,
		maxInFlight: () => maxInFlight,
	};
};

const twoRooms: SearchIndexRoom[] = [
	{ rid: 'old', lastActivityAt: NOW - 10 * HOUR },
	{ rid: 'recent', lastActivityAt: NOW - HOUR },
];

describe('createSearchIndexScheduler', () => {
	beforeEach(() => {
		jest.useFakeTimers({ now: NOW });
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe('activity', () => {
		it('sends the first request at once and keeps indexing while the user is active', async () => {
			const { scheduler, requests } = await setup({ rooms: twoRooms });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS);
			expect(requests).toHaveLength(1);

			await jest.advanceTimersByTimeAsync(PAUSE_MS + REQUEST_MS);
			expect(requests).toHaveLength(2);
			expect(scheduler.getProgress().status).toBe('indexing');

			scheduler.stop();
		});

		it('waits 12 seconds between two requests by default', async () => {
			const { scheduler, requests, gaps } = await setup({ rooms: twoRooms, defaultPause: true });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(3 * (REQUEST_MS + 12_000) - 1);
			scheduler.stop();

			expect(requests).toHaveLength(3);
			for (const gap of gaps()) expect(gap).toBe(REQUEST_MS + 12_000);
		});
	});

	describe('pacing', () => {
		it('sends one request at a time, with the pause between two requests', async () => {
			const { scheduler, requests, gaps, maxInFlight } = await setup({ rooms: twoRooms });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(20_000);
			scheduler.stop();

			expect(requests.length).toBeGreaterThan(3);
			expect(maxInFlight()).toBe(1);
			for (const gap of gaps()) expect(gap).toBeGreaterThanOrEqual(REQUEST_MS + PAUSE_MS);
		});

		it('backfills the most recently active room first', async () => {
			const rooms: SearchIndexRoom[] = [
				{ rid: 'a', lastActivityAt: NOW - 3 * HOUR },
				{ rid: 'b', lastActivityAt: NOW - HOUR },
				{ rid: 'c', lastActivityAt: NOW - 2 * HOUR },
			];
			const { scheduler, roomsOf } = await setup({ rooms, messagesPerRoom: 5 });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(3 * (REQUEST_MS + PAUSE_MS));
			scheduler.stop();

			expect(roomsOf().slice(0, 3)).toEqual(['b', 'c', 'a']);
		});

		it('runs the catch-up of rooms that have a saved lastUpdate before any backfill page', async () => {
			const { scheduler, backend, requests } = await setup({ rooms: twoRooms });
			await backend.setRoomState('old', { lastUpdate: NOW - 50 * HOUR, backfillCursor: `${NOW - 50 * HOUR}`, backfillDone: false });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS);
			scheduler.stop();

			expect(requests[0].params).toMatchObject({ roomId: 'old', type: 'UPDATED', next: `${NOW - 50 * HOUR}_` });
		});

		it('indexes every message of every room, and never sends a sync call without a cursor', async () => {
			const { scheduler, server, indexed, requests } = await setup({ rooms: twoRooms });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(60_000);
			scheduler.stop();

			expect(indexed).toEqual(new Map([...server.liveVersions('old'), ...server.liveVersions('recent')]));
			for (const { params } of requests) {
				expect(params).not.toHaveProperty('lastUpdate');
				expect(Boolean(params.next) !== Boolean(params.previous)).toBe(true);
			}
		});

		it('sends no request after stop', async () => {
			const { scheduler, requests } = await setup({ rooms: twoRooms });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS);
			scheduler.stop();
			await jest.advanceTimersByTimeAsync(60_000);

			expect(requests).toHaveLength(1);
		});
	});

	describe('back-off', () => {
		it('waits for Retry-After on a 429, then asks for the same page again', async () => {
			const { scheduler, requests, failures } = await setup({ rooms: twoRooms });
			failures.push(httpError(429, { 'Retry-After': '30' }));

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS + 30_000 - 1);
			expect(requests).toHaveLength(1);

			await jest.advanceTimersByTimeAsync(1);
			expect(requests).toHaveLength(2);
			expect(requests[1].params).toEqual(requests[0].params);

			scheduler.stop();
		});

		it('honours a Retry-After given as an HTTP date', async () => {
			const { scheduler, requests, failures } = await setup({ rooms: twoRooms });
			failures.push(httpError(503, { 'Retry-After': new Date(NOW + REQUEST_MS + 20_000).toUTCString() }));

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS);
			await jest.advanceTimersByTimeAsync(19_000);
			expect(requests).toHaveLength(1);

			await jest.advanceTimersByTimeAsync(1000);
			expect(requests).toHaveLength(2);

			scheduler.stop();
		});

		it('honours the X-RateLimit-Reset time that the Rocket.Chat rate limiter sends instead of Retry-After', async () => {
			const { scheduler, requests, failures } = await setup({ rooms: twoRooms });
			failures.push(httpError(429, { 'X-RateLimit-Reset': `${NOW + REQUEST_MS + 40_000}` }));

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS + 39_000);
			expect(requests).toHaveLength(1);

			await jest.advanceTimersByTimeAsync(1000);
			expect(requests).toHaveLength(2);

			scheduler.stop();
		});

		it('backs off exponentially with jitter on 5xx, and starts again from the base delay after a success', async () => {
			const { scheduler, failures, gaps } = await setup({ rooms: twoRooms, random: () => 0.25 });
			failures.push(httpError(500), httpError(502), httpError(503), undefined, httpError(500));

			scheduler.start();
			await jest.advanceTimersByTimeAsync(20_000);
			scheduler.stop();

			// The delay is half the exponential step plus a random part of the other half: 0.625 of 1 s, 2 s, 4 s.
			expect(gaps().slice(0, 5)).toEqual([REQUEST_MS + 625, REQUEST_MS + 1250, REQUEST_MS + 2500, REQUEST_MS + PAUSE_MS, REQUEST_MS + 625]);
		});

		it('backs off from 10 seconds up to 10 minutes by default', async () => {
			const { scheduler, failures, gaps } = await setup({ rooms: twoRooms, random: () => 1, defaultBackoff: true });
			failures.push(...Array.from({ length: 8 }, () => httpError(500)));

			scheduler.start();
			await jest.advanceTimersByTimeAsync(35 * 60_000);
			scheduler.stop();

			expect(gaps().slice(0, 8)).toEqual(
				[10_000, 20_000, 40_000, 80_000, 160_000, 320_000, 600_000, 600_000].map((delay) => REQUEST_MS + delay),
			);
		});

		it('spreads the delay of two clients with the jitter', async () => {
			const low = await setup({ rooms: twoRooms, random: () => 0 });
			const high = await setup({ rooms: twoRooms, random: () => 0.999 });
			low.failures.push(httpError(500));
			high.failures.push(httpError(500));

			low.scheduler.start();
			high.scheduler.start();
			await jest.advanceTimersByTimeAsync(5000);
			low.scheduler.stop();
			high.scheduler.stop();

			expect(low.gaps()[0]).toBe(REQUEST_MS + 500);
			expect(high.gaps()[0]).toBeGreaterThan(REQUEST_MS + 990);
		});
	});

	describe('room access', () => {
		it('removes the room from the index on a 403 and sends no more requests for it', async () => {
			const { scheduler, failures, removeRoom, roomsOf, backend } = await setup({ rooms: twoRooms });
			await backend.upsert([{ id: 'x', rid: 'recent', uid: 'u2', username: 'bob', ts: NOW, updatedAt: NOW, kind: 'text', body: 'secret' }]);
			failures.push(httpError(403));

			scheduler.start();
			await jest.advanceTimersByTimeAsync(30_000);
			scheduler.stop();

			expect(removeRoom).toHaveBeenCalledWith('recent');
			expect(await backend.search({ text: 'secret' })).toEqual([]);
			expect(roomsOf().filter((rid) => rid === 'recent')).toHaveLength(1);
			expect(roomsOf()).toContain('old');
		});

		it("removes the room on the server's not-allowed answer (400 error-not-allowed) for a room the user left", async () => {
			const { scheduler, failures, removeRoom } = await setup({ rooms: twoRooms });
			failures.push(httpError(400, {}, { success: false, error: 'Not allowed', errorType: 'error-not-allowed' }));

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS);
			scheduler.stop();

			expect(removeRoom).toHaveBeenCalledWith('recent');
		});

		it('removes a room that the user left after the page in flight, and sends no more requests for it', async () => {
			const { scheduler, removeRoom, roomsOf, backend } = await setup({ rooms: twoRooms });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS / 2);
			expect(roomsOf()).toEqual(['recent']);

			const removed = scheduler.removeRoom('recent');
			await jest.advanceTimersByTimeAsync(0);
			expect(removeRoom).not.toHaveBeenCalled();

			await jest.advanceTimersByTimeAsync(REQUEST_MS);
			await removed;
			await jest.advanceTimersByTimeAsync(30_000);
			await scheduler.stop();

			expect(removeRoom).toHaveBeenCalledWith('recent');
			expect(await backend.getRoomState('recent')).toBeUndefined();
			expect(roomsOf().filter((rid) => rid === 'recent')).toHaveLength(1);
			expect(roomsOf()).toContain('old');
		});

		it('reports another error, skips that room and goes on with the next one', async () => {
			const { scheduler, failures, removeRoom, onError, roomsOf } = await setup({ rooms: twoRooms });
			const error = httpError(400, {}, { success: false, errorType: 'error-invalid-params' });
			failures.push(error);

			scheduler.start();
			await jest.advanceTimersByTimeAsync(30_000);
			scheduler.stop();

			expect(onError).toHaveBeenCalledWith(error);
			expect(removeRoom).not.toHaveBeenCalled();
			expect(roomsOf().filter((rid) => rid === 'recent')).toHaveLength(1);
			expect(roomsOf().filter((rid) => rid === 'old').length).toBeGreaterThan(1);
		});
	});

	describe('restart', () => {
		it('tries a room that an error skipped again after a stop and a start', async () => {
			const { scheduler, failures, roomsOf } = await setup({ rooms: [{ rid: 'recent', lastActivityAt: NOW }] });
			failures.push(httpError(400, {}, { success: false, errorType: 'error-invalid-params' }));

			scheduler.start();
			await jest.advanceTimersByTimeAsync(10_000);
			expect(roomsOf()).toEqual(['recent']);

			scheduler.stop();
			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS);
			scheduler.stop();

			expect(roomsOf()).toEqual(['recent', 'recent']);
		});
	});

	describe('room keys', () => {
		it('indexes the pending messages of a room when its key arrives, with no server request', async () => {
			const { scheduler, missingKeys, indexed, requests, server } = await setup({
				rooms: [{ rid: 'recent', lastActivityAt: NOW }],
				messagesPerRoom: 5,
			});
			missingKeys.add('recent');

			scheduler.start();
			await jest.advanceTimersByTimeAsync(10_000);
			expect(indexed.size).toBe(0);
			expect(scheduler.getProgress().pendingDecrypt).toBe(5);
			const sent = requests.length;

			missingKeys.clear();
			scheduler.retryPendingDecrypt('recent');
			await jest.advanceTimersByTimeAsync(0);

			expect(indexed).toEqual(server.liveVersions('recent'));
			expect(scheduler.getProgress().pendingDecrypt).toBe(0);
			expect(requests).toHaveLength(sent);

			scheduler.stop();
		});

		it('counts a live message that failed to decrypt as pending, and indexes it when the key of its room arrives', async () => {
			const { scheduler, missingKeys, indexed } = await setup({
				rooms: [{ rid: 'recent', lastActivityAt: NOW }],
				messagesPerRoom: 0,
			});
			const live = {
				_id: 'live1',
				rid: 'recent',
				t: 'e2e',
				e2e: 'pending',
				msg: 'ciphertext',
				ts: new Date(NOW),
				_updatedAt: new Date(NOW),
			};

			scheduler.addPendingDecrypt(live as unknown as IMessage);
			expect(scheduler.getProgress().pendingDecrypt).toBe(0);

			scheduler.start();
			await jest.advanceTimersByTimeAsync(10_000);
			missingKeys.add('recent');
			scheduler.addPendingDecrypt(live as unknown as IMessage);
			expect(scheduler.getProgress().pendingDecrypt).toBe(1);

			missingKeys.clear();
			scheduler.retryPendingDecrypt('recent');
			await jest.advanceTimersByTimeAsync(0);

			expect(indexed.has('live1')).toBe(true);
			expect(scheduler.getProgress().pendingDecrypt).toBe(0);

			scheduler.stop();
		});
	});

	describe('progress', () => {
		it('counts the rooms whose backfill is done and the indexed messages, and tells the subscribers', async () => {
			const { scheduler } = await setup({ rooms: twoRooms, messagesPerRoom: 15 });
			const listener = jest.fn();
			scheduler.subscribe(listener);

			expect(scheduler.getProgress()).toEqual({ status: 'stopped', rooms: 2, roomsDone: 0, indexed: 0, pendingDecrypt: 0 });

			scheduler.start();
			await jest.advanceTimersByTimeAsync(REQUEST_MS);
			expect(scheduler.getProgress()).toMatchObject({ status: 'indexing', rooms: 2, roomsDone: 0, indexed: PAGE_SIZE });

			await jest.advanceTimersByTimeAsync(60_000);
			expect(scheduler.getProgress()).toEqual({ status: 'done', rooms: 2, roomsDone: 2, indexed: 30, pendingDecrypt: 0 });
			expect(listener).toHaveBeenCalled();

			scheduler.stop();
			expect(scheduler.getProgress().status).toBe('stopped');
		});
	});
});

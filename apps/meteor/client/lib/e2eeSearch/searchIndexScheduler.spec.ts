import type { IMessage } from '@rocket.chat/core-typings';

import { createSearchIndexCrawler } from './searchIndexCrawler';
import { createSearchIndexScheduler, DEFAULT_BACKOFF_BASE_MS, DEFAULT_BACKOFF_MAX_MS, DEFAULT_PAUSE_MS } from './searchIndexScheduler';
import type { SearchIndexRoom, SearchIndexScheduler } from './searchIndexScheduler';
import { createSearchIndexWriter } from './searchIndexWriter';
import { createMemorySearchIndexBackend } from '../../../tests/mocks/client/memorySearchIndexBackend';
import { createSyncMessagesServerMock } from '../../../tests/mocks/client/syncMessagesServerMock';
import type { AnySyncMessagesParams } from '../../../tests/mocks/client/syncMessagesServerMock';

const NOW = Date.parse('2026-10-26T12:00:00Z');
const REQUEST_MS = 50;
const PAUSE_MS = 1000;
const active = new Set<SearchIndexScheduler>();
const httpError = (status: number, headers: Record<string, string> = {}, body: unknown = {}) => {
	const response = { status, headers: { get: (name: string) => headers[name] ?? null }, json: async () => body, clone: () => response };
	return response;
};
const setup = (
	options: {
		rooms?: SearchIndexRoom[];
		messagesPerRoom?: number;
		random?: () => number;
		defaultPause?: boolean;
		defaultBackoff?: boolean;
	} = {},
) => {
	const rooms = options.rooms ?? [
		{ rid: 'old', lastActivityAt: NOW - 100 },
		{ rid: 'recent', lastActivityAt: NOW - 1 },
	];
	const server = createSyncMessagesServerMock({ startAt: NOW });
	for (const { rid } of rooms) {
		for (let i = 0; i < (options.messagesPerRoom ?? 5); i++) server.addHistory(`${rid}-m${i}`, rid, NOW - 100 + i);
	}
	const backend = createMemorySearchIndexBackend();
	const writer = createSearchIndexWriter({ getBackend: () => backend });
	const missingKeys = new Set<string>();
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
	const crawler = createSearchIndexCrawler({
		backend,
		syncMessages,
		decryptMessage: async (message) => {
			if (missingKeys.has(message.rid)) return message;
			const decrypted = { ...message, e2e: 'done' } as IMessage;
			writer.index(decrypted);
			return decrypted;
		},
		writer,
		now: server.now,
		pageSize: 2,
	});
	const onError = jest.fn();
	const scheduler = createSearchIndexScheduler({
		backend,
		crawler,
		getRooms: () => rooms,
		...(!options.defaultPause && { pauseMs: PAUSE_MS }),
		...(!options.defaultBackoff && { backoffBaseMs: 1000, backoffMaxMs: 60_000 }),
		random: options.random ?? (() => 0.5),
		refreshMs: 10_000,
		onError,
	});
	active.add(scheduler);
	return {
		rooms,
		server,
		backend,
		crawler,
		writer,
		missingKeys,
		failures,
		requests,
		syncMessages,
		scheduler,
		onError,
		maxInFlight: () => maxInFlight,
		gaps: () => requests.slice(1).map(({ at }, i) => at - requests[i].at),
	};
};

describe('createSearchIndexScheduler', () => {
	beforeEach(() => jest.useFakeTimers({ now: NOW }));
	afterEach(async () => {
		const stopping = [...active].map((scheduler) => scheduler.stop());
		await jest.advanceTimersByTimeAsync(REQUEST_MS);
		await Promise.all(stopping);
		active.clear();
		jest.useRealTimers();
	});

	it('starts no work until start and defaults to a 12-second pause and 10–600-second retry steps', async () => {
		const { scheduler, requests, gaps } = setup({ defaultPause: true });
		expect(DEFAULT_PAUSE_MS).toBe(12_000);
		expect(DEFAULT_BACKOFF_BASE_MS).toBe(10_000);
		expect(DEFAULT_BACKOFF_MAX_MS).toBe(600_000);
		await jest.advanceTimersByTimeAsync(1000);
		expect(requests).toEqual([]);
		scheduler.start();
		await jest.advanceTimersByTimeAsync(2 * (REQUEST_MS + 12_000));
		expect(requests).toHaveLength(3);
		expect(gaps()).toEqual([REQUEST_MS + 12_000, REQUEST_MS + 12_000]);
	});

	it('serializes pages with pauses and starts with the most active room', async () => {
		const { scheduler, requests, gaps, maxInFlight } = setup();
		scheduler.start();
		await jest.advanceTimersByTimeAsync(8000);
		expect(requests[0].params.roomId).toBe('recent');
		expect(requests[1].params.roomId).toBe('old');
		expect(maxInFlight()).toBe(1);
		expect(gaps().every((gap) => gap === REQUEST_MS + PAUSE_MS)).toBe(true);
	});

	it('catches up saved rooms before starting any history backfill', async () => {
		const { scheduler, requests, backend } = setup();
		await backend.setRoomState('old', { lastUpdate: NOW - 200, backfillDone: false });
		scheduler.start();
		await jest.advanceTimersByTimeAsync(4 * (REQUEST_MS + PAUSE_MS));
		expect(requests.slice(0, 4).map(({ params }) => [params.roomId, params.type, !!params.next])).toEqual([
			['old', 'UPDATED', true],
			['old', 'UPDATED', true],
			['old', 'UPDATED', true],
			['old', 'DELETED', true],
		]);
		expect(requests[4].params.previous).toBeDefined();
	});

	it('indexes every message and catches up after backfill using a cursor on every request', async () => {
		const { scheduler, backend, requests, server } = setup();
		scheduler.start();
		await jest.advanceTimersByTimeAsync(30_000);
		expect(backend.documents.size).toBe(10);
		for (const rid of ['old', 'recent']) {
			expect(new Map([...backend.documents].filter(([, doc]) => doc.rid === rid).map(([id, doc]) => [id, doc.updatedAt]))).toEqual(
				server.liveVersions(rid),
			);
		}
		expect(requests.every(({ params }) => !!params.next !== !!params.previous)).toBe(true);
		expect(scheduler.getProgress()).toMatchObject({ status: 'done', roomsDone: 2, indexed: 10 });
	});

	it('waits for an active request on stop and sends nothing afterward', async () => {
		const { scheduler, requests } = setup();
		scheduler.start();
		await jest.advanceTimersByTimeAsync(0);
		let stopped = false;
		const stopping = scheduler.stop().then(() => {
			stopped = true;
		});
		await Promise.resolve();
		expect(stopped).toBe(false);
		await jest.advanceTimersByTimeAsync(REQUEST_MS);
		await stopping;
		await jest.advanceTimersByTimeAsync(60_000);
		expect(requests).toHaveLength(1);
		expect(scheduler.getProgress().status).toBe('stopped');
	});

	it('honors Retry-After seconds before a conflicting reset header and retries the same page', async () => {
		const { scheduler, failures, requests } = setup();
		failures.push(httpError(429, { 'Retry-After': '30', 'X-RateLimit-Reset': `${NOW + 60_000}` }));
		scheduler.start();
		await jest.advanceTimersByTimeAsync(REQUEST_MS + 30_000 - 1);
		expect(requests).toHaveLength(1);
		expect(scheduler.getProgress().status).toBe('backing-off');
		await jest.advanceTimersByTimeAsync(1);
		expect(requests).toHaveLength(2);
		expect(requests[1].params).toEqual(requests[0].params);
	});

	it('honors a server retry delay longer than the local maximum', async () => {
		const { scheduler, failures, requests } = setup({ defaultBackoff: true });
		failures.push(httpError(503, { 'Retry-After': '1200' }));
		scheduler.start();
		await jest.advanceTimersByTimeAsync(REQUEST_MS + 1_200_000 - 1);
		expect(requests).toHaveLength(1);
		await jest.advanceTimersByTimeAsync(1);
		expect(requests).toHaveLength(2);
	});

	it('honors Retry-After HTTP dates', async () => {
		const { scheduler, failures, requests } = setup();
		failures.push(httpError(503, { 'Retry-After': new Date(NOW + 20_000).toUTCString() }));
		scheduler.start();
		await jest.advanceTimersByTimeAsync(19_999);
		expect(requests).toHaveLength(1);
		await jest.advanceTimersByTimeAsync(1);
		expect(requests).toHaveLength(2);
	});

	it('uses X-RateLimit-Reset when Retry-After is absent or invalid', async () => {
		const { scheduler, failures, requests } = setup();
		failures.push(httpError(429, { 'Retry-After': 'invalid', 'X-RateLimit-Reset': `${NOW + REQUEST_MS + 40_000}` }));
		scheduler.start();
		await jest.advanceTimersByTimeAsync(REQUEST_MS + 39_999);
		expect(requests).toHaveLength(1);
		await jest.advanceTimersByTimeAsync(1);
		expect(requests).toHaveLength(2);
	});

	it('doubles retry steps to 600 seconds by default', async () => {
		const { scheduler, failures, gaps } = setup({ defaultBackoff: true, random: () => 1 });
		failures.push(...Array.from({ length: 8 }, () => httpError(500)));
		scheduler.start();
		await jest.advanceTimersByTimeAsync(35 * 60_000);
		expect(gaps().slice(0, 8)).toEqual(
			[10_000, 20_000, 40_000, 80_000, 160_000, 320_000, 600_000, 600_000].map((delay) => delay + REQUEST_MS),
		);
	});

	it('adds jitter and resets the exponential step after a successful page', async () => {
		const { scheduler, failures, gaps } = setup({ random: () => 0.25 });
		failures.push(httpError(500), httpError(502), httpError(503), undefined, httpError(500));
		scheduler.start();
		await jest.advanceTimersByTimeAsync(20_000);
		expect(gaps().slice(0, 5)).toEqual([625, 1250, 2500, PAUSE_MS, 625].map((delay) => REQUEST_MS + delay));
	});

	it('spreads retry requests between clients', async () => {
		const low = setup({ random: () => 0 });
		const high = setup({ random: () => 0.999 });
		low.failures.push(httpError(500));
		high.failures.push(httpError(500));
		low.scheduler.start();
		high.scheduler.start();
		await jest.advanceTimersByTimeAsync(2000);
		expect(low.gaps()[0]).toBe(REQUEST_MS + 500);
		expect(high.gaps()[0]).toBeGreaterThan(REQUEST_MS + 990);
	});

	it.each([httpError(403), httpError(400, {}, { errorType: 'error-not-allowed' }), { error: 'error-not-allowed' }])(
		'removes rooms after an access error %j',
		async (error) => {
			const { scheduler, backend, failures, requests } = setup();
			await backend.upsert([
				{ id: 'secret', rid: 'recent', uid: 'u', username: '', ts: NOW, updatedAt: NOW, kind: 'text', body: 'secret' },
			]);
			failures.push(error);
			scheduler.start();
			await jest.advanceTimersByTimeAsync(10_000);
			expect(backend.documents.has('secret')).toBe(false);
			expect(requests.filter(({ params }) => params.roomId === 'recent')).toHaveLength(1);
			expect(requests.some(({ params }) => params.roomId === 'old')).toBe(true);
		},
	);

	it('skips other HTTP errors and bounds statusless failures to three attempts', async () => {
		const badRequest = setup();
		badRequest.failures.push(httpError(400));
		badRequest.scheduler.start();
		const network = setup();
		network.failures.push(new Error('offline'), new Error('offline'), new Error('offline'));
		network.scheduler.start();
		await jest.advanceTimersByTimeAsync(10_000);
		expect(badRequest.onError).toHaveBeenCalledTimes(1);
		expect(badRequest.scheduler.getProgress().roomsSkipped).toBe(1);
		expect(network.requests.filter(({ params }) => params.roomId === 'recent')).toHaveLength(3);
		expect(network.onError).toHaveBeenCalledTimes(1);
	});

	it('removes a room only after its active page finishes and suppresses queued work', async () => {
		const { scheduler, backend, requests } = setup();
		const removed = jest.spyOn(backend, 'removeRoom');
		scheduler.start();
		await jest.advanceTimersByTimeAsync(0);
		const removing = scheduler.removeRoom('recent');
		expect(removed).not.toHaveBeenCalled();
		await jest.advanceTimersByTimeAsync(REQUEST_MS);
		await removing;
		expect(removed).toHaveBeenCalledWith('recent');
		expect([...backend.documents.values()].some(({ rid }) => rid === 'recent')).toBe(false);
		await jest.advanceTimersByTimeAsync(10_000);
		expect(requests.filter(({ params }) => params.roomId === 'recent')).toHaveLength(1);
	});

	it('retries skipped rooms after stop and restart', async () => {
		const { scheduler, requests, failures } = setup();
		failures.push(httpError(404));
		scheduler.start();
		await jest.advanceTimersByTimeAsync(REQUEST_MS);
		await scheduler.stop();
		scheduler.start();
		await jest.advanceTimersByTimeAsync(REQUEST_MS);
		expect(requests.filter(({ params }) => params.roomId === 'recent')).toHaveLength(2);
	});

	it('retries pending messages after a room key arrives without a server request', async () => {
		const { scheduler, missingKeys, requests, backend } = setup({ rooms: [{ rid: 'r', lastActivityAt: NOW }], messagesPerRoom: 1 });
		missingKeys.add('r');
		scheduler.start();
		await jest.advanceTimersByTimeAsync(15_000);
		expect(scheduler.getProgress().pendingDecrypt).toBe(1);
		const count = requests.length;
		missingKeys.clear();
		scheduler.retryPendingDecrypt('r');
		await jest.advanceTimersByTimeAsync(0);
		expect(requests).toHaveLength(count);
		expect(backend.documents.has('r-m0')).toBe(true);
		expect(scheduler.getProgress().pendingDecrypt).toBe(0);
	});

	it('defers keyless rooms while other rooms have work and rereads their checkpoint after key arrival', async () => {
		const { scheduler, missingKeys, requests } = setup();
		missingKeys.add('recent');
		scheduler.start();
		await jest.advanceTimersByTimeAsync(REQUEST_MS + PAUSE_MS + REQUEST_MS);
		expect(requests.map(({ params }) => params.roomId)).toEqual(['recent', 'old']);
		missingKeys.clear();
		scheduler.retryPendingDecrypt('recent');
		await jest.advanceTimersByTimeAsync(PAUSE_MS + REQUEST_MS);
		expect(requests[2].params).toEqual(requests[0].params);
	});

	it('eventually finishes keyless history with pending messages instead of blocking forever', async () => {
		const { scheduler, missingKeys, backend } = setup({ rooms: [{ rid: 'r', lastActivityAt: NOW }], messagesPerRoom: 5 });
		missingKeys.add('r');
		scheduler.start();
		await jest.advanceTimersByTimeAsync(20_000);
		expect(scheduler.getProgress()).toMatchObject({ status: 'done', roomsDone: 1, pendingDecrypt: 5 });
		expect(backend.documents.size).toBe(0);
	});

	it('refreshes changed and newly joined rooms but sends nothing for unchanged rooms', async () => {
		const { scheduler, requests, rooms, server, backend } = setup({ rooms: [{ rid: 'r', lastActivityAt: NOW }], messagesPerRoom: 1 });
		scheduler.start();
		await jest.advanceTimersByTimeAsync(5000);
		const idleCount = requests.length;
		await jest.advanceTimersByTimeAsync(10_000);
		expect(requests).toHaveLength(idleCount);
		server.send('new', 'r');
		rooms[0].lastActivityAt++;
		rooms.push({ rid: 'joined', lastActivityAt: NOW + 1 });
		server.addHistory('joined-m', 'joined', NOW - 1);
		await jest.advanceTimersByTimeAsync(15_000);
		expect(backend.documents.has('new')).toBe(true);
		expect(backend.documents.has('joined-m')).toBe(true);
	});

	it('allows a room to rejoin after removal and absence from the room list', async () => {
		const { scheduler, rooms, server, backend } = setup({ rooms: [{ rid: 'r', lastActivityAt: NOW }], messagesPerRoom: 1 });
		scheduler.start();
		await jest.advanceTimersByTimeAsync(5000);
		rooms.splice(0);
		await scheduler.removeRoom('r');
		rooms.push({ rid: 'r', lastActivityAt: NOW + 1 });
		server.send('rejoined', 'r');
		await jest.advanceTimersByTimeAsync(15_000);
		expect(backend.documents.has('rejoined')).toBe(true);
	});

	it('catches up only requested rooms and ignores requests after removal', async () => {
		const { scheduler, requests } = setup();
		scheduler.start();
		await jest.advanceTimersByTimeAsync(15_000);
		const initial = requests.length;
		scheduler.requestCatchUp(['old']);
		await jest.advanceTimersByTimeAsync(3000);
		expect(requests.slice(initial).map(({ params }) => params.roomId)).toEqual(['old', 'old']);
		await scheduler.removeRoom('old');
		const afterRemoval = requests.length;
		scheduler.requestCatchUp(['old']);
		await jest.advanceTimersByTimeAsync(3000);
		expect(requests).toHaveLength(afterRemoval);
	});

	it.each(['UPDATED', 'DELETED'] as const)('preserves catch-up requests received during the active %s page', async (phase) => {
		const { scheduler, server, backend, requests } = setup({ rooms: [{ rid: 'r', lastActivityAt: NOW }], messagesPerRoom: 0 });
		await backend.setRoomState('r', { lastUpdate: NOW - 1, backfillDone: true });
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const sync = server.syncMessages;
		let held = false;
		jest.spyOn(server, 'syncMessages').mockImplementation(async (params) => {
			const response = await sync(params);
			if (params.type === phase && !held) {
				held = true;
				await gate;
			}
			return response;
		});
		scheduler.start();
		await jest.advanceTimersByTimeAsync(phase === 'UPDATED' ? REQUEST_MS : PAUSE_MS + 2 * REQUEST_MS);
		try {
			expect(held).toBe(true);
			server.send('late', 'r');
			scheduler.requestCatchUp(['r']);
		} finally {
			release();
		}
		await jest.advanceTimersByTimeAsync(4 * (PAUSE_MS + REQUEST_MS));

		expect(backend.documents.has('late')).toBe(true);
		expect(requests.filter(({ params }) => params.type === 'UPDATED')).toHaveLength(2);
	});

	it.each([false, true])('does not start another room key retry after stop when the active retry rejects=%p', async (rejects) => {
		const { scheduler, crawler, writer, backend } = setup({
			rooms: [
				{ rid: 'A', lastActivityAt: NOW },
				{ rid: 'B', lastActivityAt: NOW },
			],
			messagesPerRoom: 0,
		});
		let release!: () => void;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const retry = jest.spyOn(crawler, 'retryPendingDecrypt').mockImplementation(async (rid) => {
			if (rid === 'A') {
				await gate;
				if (rejects) throw new Error('active retry failed');
			}
			writer.index({
				_id: rid,
				rid,
				t: 'e2e',
				e2e: 'done',
				msg: 'decrypted',
				u: { _id: 'u' },
				ts: new Date(NOW),
				_updatedAt: new Date(NOW),
			} as IMessage);
			await writer.flush();
			return { indexed: 1 };
		});
		scheduler.retryPendingDecrypt('A');
		scheduler.retryPendingDecrypt('B');
		scheduler.start();
		await jest.advanceTimersByTimeAsync(0);
		const stopping = scheduler.stop();
		release();
		await stopping;

		expect(retry.mock.calls.map(([rid]) => rid)).toEqual(['A']);
		expect(backend.documents.has('B')).toBe(false);
		expect(scheduler.getProgress().status).toBe('stopped');
	});

	it('publishes progress and counts live pending messages without starting requests', async () => {
		const { scheduler, crawler, requests } = setup();
		const listener = jest.fn();
		const unsubscribe = scheduler.subscribe(listener);
		scheduler.addPendingDecrypt({ _id: 'pending', rid: 'recent' } as IMessage);
		expect(crawler.getPendingDecrypt('recent')).toHaveLength(1);
		expect(scheduler.getProgress()).toMatchObject({ status: 'stopped', pendingDecrypt: 1 });
		expect(listener).toHaveBeenCalledTimes(1);
		unsubscribe();
		scheduler.addPendingDecrypt({ _id: 'pending2', rid: 'recent' } as IMessage);
		expect(listener).toHaveBeenCalledTimes(1);
		expect(requests).toEqual([]);
	});
});

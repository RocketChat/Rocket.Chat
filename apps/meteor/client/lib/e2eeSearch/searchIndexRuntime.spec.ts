import type { IMessage } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';
import { createSearchIndexRuntime, createSyncMessagesFetcher, toSearchIndexRooms } from './searchIndexRuntime';
import type { IdleSignal, SearchIndexScheduler } from './searchIndexScheduler';
import { createSyncMessagesServerMock } from '../../../tests/mocks/client/syncMessagesServerMock';

const NOW = Date.parse('2026-10-26T12:00:00Z');
const YEAR = 365 * 24 * 60 * 60 * 1000;

const createSessionStub = (initial?: ISearchIndexBackend) => {
	let active = initial;
	const listeners = new Set<() => void>();
	return {
		getActiveBackend: () => active,
		subscribe(listener: () => void) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		set(next: ISearchIndexBackend | undefined) {
			active = next;
			listeners.forEach((listener) => listener());
		},
	};
};

const idleAlways: IdleSignal = { isIdle: () => true, subscribe: () => () => undefined };

const createSchedulerStub = (): jest.Mocked<SearchIndexScheduler> => ({
	start: jest.fn(),
	stop: jest.fn(),
	requestCatchUp: jest.fn(),
	retryPendingDecrypt: jest.fn(),
	removeRoom: jest.fn(),
	getProgress: jest.fn(),
	subscribe: jest.fn(),
});

const stubRuntime = (initial?: ISearchIndexBackend) => {
	const session = createSessionStub(initial);
	const schedulers: { backend: ISearchIndexBackend; scheduler: jest.Mocked<SearchIndexScheduler> }[] = [];
	const runtime = createSearchIndexRuntime({
		session,
		writer: { remove: async () => undefined, flush: async () => undefined },
		syncMessages: jest.fn(),
		decryptMessage: async (message) => message,
		getRooms: () => [],
		idle: idleAlways,
		createScheduler: (backend) => {
			const scheduler = createSchedulerStub();
			schedulers.push({ backend, scheduler });
			return scheduler;
		},
	});
	return { session, schedulers, runtime };
};

const backendA = { name: 'A' } as unknown as ISearchIndexBackend;
const backendB = { name: 'B' } as unknown as ISearchIndexBackend;

describe('createSearchIndexRuntime', () => {
	it('starts a scheduler for the index that the session opens', () => {
		const { session, schedulers } = stubRuntime();
		expect(schedulers).toHaveLength(0);

		session.set(backendA);

		expect(schedulers).toHaveLength(1);
		expect(schedulers[0].backend).toBe(backendA);
		expect(schedulers[0].scheduler.start).toHaveBeenCalledTimes(1);
	});

	it('stops the scheduler when the session closes the index (logout)', () => {
		const { session, schedulers, runtime } = stubRuntime(backendA);

		session.set(undefined);

		expect(schedulers[0].scheduler.stop).toHaveBeenCalledTimes(1);
		expect(runtime.getScheduler()).toBeUndefined();
	});

	it('gives a new login a new scheduler and stops the old one', () => {
		const { session, schedulers } = stubRuntime(backendA);

		session.set(backendB);

		expect(schedulers).toHaveLength(2);
		expect(schedulers[0].scheduler.stop).toHaveBeenCalledTimes(1);
		expect(schedulers[1].backend).toBe(backendB);
		expect(schedulers[1].scheduler.start).toHaveBeenCalledTimes(1);
	});

	it('catches up every room after a reconnect, and retries pending messages when a room key arrives', () => {
		const { schedulers, runtime } = stubRuntime(backendA);

		runtime.onReconnect();
		runtime.onRoomKeyReady('r1');

		expect(schedulers[0].scheduler.requestCatchUp).toHaveBeenCalledTimes(1);
		expect(schedulers[0].scheduler.retryPendingDecrypt).toHaveBeenCalledWith('r1');
	});

	it('backfills a one-year-old message into the index with the real crawler and scheduler', async () => {
		jest.useFakeTimers({ now: NOW });
		try {
			const server = createSyncMessagesServerMock({ startAt: NOW });
			server.addHistory('old', 'r1', NOW - YEAR);
			for (let i = 0; i < 5; i++) server.addHistory(`m${i}`, 'r1', NOW - 1000 * (i + 1));

			const backend = createFakeSearchIndexBackend();
			await backend.open({ userId: 'u1' });
			const session = createSessionStub();
			const queued: IMessage[] = [];

			const runtime = createSearchIndexRuntime({
				session,
				writer: {
					remove: async () => undefined,
					flush: async () => {
						await backend.upsert(
							queued.splice(0).map((message) => ({
								id: message._id,
								rid: message.rid,
								uid: message.u._id,
								username: message.u.username,
								ts: new Date(message.ts).getTime(),
								updatedAt: new Date(message._updatedAt).getTime(),
								kind: 'text' as const,
								body: `plain ${message._id}`,
							})),
						);
					},
				},
				syncMessages: (params) => server.syncMessages(params),
				decryptMessage: async (message) => {
					const decrypted = { ...message, e2e: 'done' } as IMessage;
					queued.push(decrypted);
					return decrypted;
				},
				getRooms: () => [{ rid: 'r1', lastActivityAt: NOW }],
				idle: idleAlways,
			});

			session.set(backend);
			await jest.advanceTimersByTimeAsync(5 * 60_000);

			expect(await backend.getRoomState('r1')).toMatchObject({ backfillDone: true });
			expect((await backend.search({ text: 'plain old' })).map((hit) => hit.id)).toContain('old');
			runtime.dispose();
		} finally {
			jest.useRealTimers();
		}
	});
});

describe('createSyncMessagesFetcher', () => {
	const credentials = { 'X-User-Id': 'u1', 'X-Auth-Token': 't1' };

	/** A `fetch` Response (jsdom has no `Response` class). */
	const fakeResponse = (status: number, body: unknown, headers: Record<string, string> = {}) =>
		({
			ok: status >= 200 && status < 300,
			status,
			headers: { get: (name: string) => headers[name] ?? null },
			json: async () => body,
		}) as unknown as Response;

	it('rejects with the Response, so the scheduler sees the status and the rate-limit headers', async () => {
		const response = fakeResponse(429, { success: false }, { 'X-RateLimit-Reset': '123' });
		const fetchSyncMessages = createSyncMessagesFetcher({
			baseUrl: 'https://chat.example',
			getCredentials: () => credentials,
			fetch: async () => response,
		});

		const error = await fetchSyncMessages({ roomId: 'r1', type: 'UPDATED', count: 10, previous: '5' }).catch((e) => e);

		expect(error).toBe(response);
		expect(error.status).toBe(429);
		expect(error.headers.get('X-RateLimit-Reset')).toBe('123');
	});

	it('sends the cursor and the credentials, and maps the dates of the messages', async () => {
		const fetchMock = jest.fn(async (_url: string, _init?: RequestInit) =>
			fakeResponse(200, {
				success: true,
				result: {
					updated: [{ _id: 'm1', rid: 'r1', msg: 'x', ts: '2025-10-26T12:00:00.000Z', _updatedAt: '2025-10-26T12:00:00.000Z', u: {} }],
					deleted: [],
					cursor: { next: '1', previous: null },
				},
			}),
		);
		const fetchSyncMessages = createSyncMessagesFetcher({
			baseUrl: 'https://chat.example',
			getCredentials: () => credentials,
			fetch: fetchMock as unknown as typeof fetch,
		});

		const page = await fetchSyncMessages({ roomId: 'r1', type: 'UPDATED', count: 10, previous: '5' });

		const [url, init] = fetchMock.mock.calls[0];
		const sent = new URL(url);
		expect(sent.pathname).toBe('/api/v1/chat.syncMessages');
		expect(Object.fromEntries(sent.searchParams)).toEqual({ roomId: 'r1', type: 'UPDATED', count: '10', previous: '5' });
		expect(init?.headers).toMatchObject(credentials);
		expect(page.updated[0].ts).toBeInstanceOf(Date);
		expect(page.updated[0]._updatedAt).toBeInstanceOf(Date);
		expect(page.cursor).toEqual({ next: '1', previous: null });
	});
});

describe('toSearchIndexRooms', () => {
	it('keeps only encrypted rooms, with the time of their last message', () => {
		expect(
			toSearchIndexRooms([
				{ rid: 'enc', encrypted: true, lm: new Date(2000) },
				{ rid: 'plain', encrypted: false, lm: new Date(3000) },
				{ rid: 'enc-no-lm', encrypted: true, lastMessage: { ts: '1970-01-01T00:00:01.000Z' } },
			]),
		).toEqual([
			{ rid: 'enc', lastActivityAt: 2000 },
			{ rid: 'enc-no-lm', lastActivityAt: 1000 },
		]);
	});
});

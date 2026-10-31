import type { IMessage } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import {
	backfillMonthsToMaxAgeMs,
	createSearchIndexRuntime,
	createSyncMessagesFetcher,
	REINDEX_AFTER_MS,
	searchIndexTuningFromSettings,
	toSearchIndexRooms,
} from './searchIndexRuntime';
import type { SearchIndexTuning } from './searchIndexRuntime';
import type { SearchIndexScheduler } from './searchIndexScheduler';
import { createMemorySearchIndexBackend as createFakeSearchIndexBackend } from '../../../tests/mocks/client/memorySearchIndexBackend';
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

const createSchedulerStub = (): jest.Mocked<SearchIndexScheduler> => ({
	start: jest.fn(),
	stop: jest.fn(async () => undefined),
	requestCatchUp: jest.fn(),
	retryPendingDecrypt: jest.fn(),
	addPendingDecrypt: jest.fn(),
	removeRoom: jest.fn(async (_rid: string): Promise<void> => undefined),
	getProgress: jest.fn(),
	subscribe: jest.fn((_listener: () => void) => jest.fn()),
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
	it('starts a scheduler for the index that the session opens', async () => {
		const { session, schedulers, runtime } = stubRuntime();
		expect(schedulers).toHaveLength(0);

		session.set(backendA);
		await runtime.whenSettled();
		expect(schedulers).toHaveLength(1);
		expect(schedulers[0].backend).not.toBe(backendA);
		expect(schedulers[0].backend.open).toBeDefined();
		expect(schedulers[0].scheduler.start).toHaveBeenCalledTimes(1);
	});

	it('stops the scheduler when the session closes the index (logout)', async () => {
		const { session, schedulers, runtime } = stubRuntime(backendA);
		await runtime.whenSettled();
		session.set(undefined);

		expect(schedulers[0].scheduler.stop).toHaveBeenCalledTimes(1);
		expect(runtime.getScheduler()).toBeUndefined();
	});

	it('gives a new login a new scheduler and stops the old one', async () => {
		const { session, schedulers, runtime } = stubRuntime(backendA);
		await runtime.whenSettled();
		session.set(backendB);
		await runtime.whenSettled();

		expect(schedulers).toHaveLength(2);
		expect(schedulers[0].scheduler.stop).toHaveBeenCalledTimes(1);
		expect(schedulers[1].backend).not.toBe(schedulers[0].backend);
		expect(schedulers[1].scheduler.start).toHaveBeenCalledTimes(1);
	});

	it('reports the indexing progress of the open index, and tells the subscribers when it changes', async () => {
		const { session, schedulers, runtime } = stubRuntime();
		const listener = jest.fn();
		runtime.subscribe(listener);
		expect(runtime.getProgress()).toBeUndefined();

		session.set(backendA);
		await runtime.whenSettled();
		const { scheduler } = schedulers[0];
		const progress = { status: 'indexing', rooms: 40, roomsDone: 12, roomsSkipped: 0, indexed: 300, pendingDecrypt: 0 } as const;
		scheduler.getProgress.mockReturnValue(progress);
		const [[onSchedulerChange]] = scheduler.subscribe.mock.calls;
		listener.mockClear();
		onSchedulerChange();

		expect(listener).toHaveBeenCalledTimes(1);
		expect(runtime.getProgress()).toBe(progress);

		listener.mockClear();
		session.set(undefined);

		expect(listener).toHaveBeenCalled();
		expect(runtime.getProgress()).toBeUndefined();
		expect(scheduler.subscribe.mock.results[0].value).toHaveBeenCalledTimes(1);

		session.set(createFakeSearchIndexBackend());
		await runtime.whenSettled();
		await runtime.wipe();

		expect(runtime.getProgress()).toBeUndefined();
		expect(schedulers[1].scheduler.subscribe.mock.results[0].value).toHaveBeenCalledTimes(1);
	});

	it('catches up every room after a reconnect, and retries pending messages when a room key arrives', async () => {
		const { schedulers, runtime } = stubRuntime(backendA);
		await runtime.whenSettled();

		runtime.onReconnect();
		runtime.onRoomKeyReady('r1');

		expect(schedulers[0].scheduler.requestCatchUp).toHaveBeenCalledTimes(1);
		expect(schedulers[0].scheduler.retryPendingDecrypt).toHaveBeenCalledWith('r1');
	});

	it('keeps a live message that failed to decrypt for the retry of its room', async () => {
		const { schedulers, runtime } = stubRuntime(backendA);
		await runtime.whenSettled();
		const message = { _id: 'm1', rid: 'r1', t: 'e2e', e2e: 'pending', msg: 'ciphertext' } as IMessage;

		runtime.onDecryptFailed(message);

		expect(schedulers[0].scheduler.addPendingDecrypt).toHaveBeenCalledWith(message);
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
			});

			session.set(backend);
			await jest.advanceTimersByTimeAsync(5 * 60_000);

			expect(await backend.getRoomState('r1')).toMatchObject({ backfillDone: true });
			expect(backend.documents.get('old')?.body).toBe('plain old');
			runtime.dispose();
		} finally {
			jest.useRealTimers();
		}
	});
});

describe('createSearchIndexRuntime after the server dropped old deletion records', () => {
	const DAY = 24 * 60 * 60 * 1000;

	const setup = async (syncedAt: number | undefined, { failRemove = false, checkpointOnlyRoom = false } = {}) => {
		const backend = createFakeSearchIndexBackend();
		await backend.open({ userId: 'u1' });
		await backend.upsert([
			{ id: 'm1', rid: 'r1', uid: 'u2', username: 'bob', ts: NOW - DAY, updatedAt: NOW - DAY, kind: 'text', body: 'deleted long ago' },
		]);
		await backend.setRoomState('r1', { lastUpdate: NOW - 40 * DAY, backfillDone: true });
		if (checkpointOnlyRoom) await backend.setRoomState('checkpoint-only', { lastUpdate: NOW - 40 * DAY, backfillDone: true });
		if (failRemove) jest.spyOn(backend, 'removeRoom').mockRejectedValue(new Error('disk full'));

		const saved: number[] = [];
		const syncTime = { read: () => saved.at(-1) ?? syncedAt, write: (at: number) => saved.push(at) };
		const session = createSessionStub();
		const schedulers: jest.Mocked<SearchIndexScheduler>[] = [];
		const onError = jest.fn();
		const roomsAtStart: string[][] = [];
		const runtime = createSearchIndexRuntime({
			session,
			writer: { remove: async () => undefined, flush: async () => undefined },
			syncMessages: jest.fn(),
			decryptMessage: async (message) => message,
			getRooms: () => [],
			syncTime,
			now: () => NOW,
			onError,
			createScheduler: () => {
				const scheduler = createSchedulerStub();
				scheduler.getProgress.mockReturnValue({
					status: 'indexing',
					rooms: 1,
					roomsDone: 0,
					roomsSkipped: 0,
					indexed: 0,
					pendingDecrypt: 0,
				});
				scheduler.start.mockImplementation(() => {
					void backend.listRooms().then((rids) => roomsAtStart.push(rids));
				});
				schedulers.push(scheduler);
				return scheduler;
			},
		});
		session.set(backend);
		await runtime.whenSettled();

		const reportDone = ({ roomsSkipped = 0 } = {}) => {
			schedulers[0].getProgress.mockReturnValue({
				status: 'done',
				rooms: 1,
				roomsDone: 1 - roomsSkipped,
				roomsSkipped,
				indexed: 0,
				pendingDecrypt: 0,
			});
			for (const [listener] of schedulers[0].subscribe.mock.calls) listener();
		};
		return { backend, session, runtime, scheduler: schedulers[0], saved, roomsAtStart, reportDone, onError };
	};

	it('empties every room before the crawler starts when the last full catch-up is older than the deletion records', async () => {
		const { backend, scheduler, roomsAtStart } = await setup(NOW - REINDEX_AFTER_MS - DAY);

		expect(scheduler.start).toHaveBeenCalledTimes(1);
		expect(roomsAtStart).toEqual([[]]);
		expect(await backend.getRoomState('r1')).toBeUndefined();
		expect([...backend.documents.values()]).toEqual([]);
	});

	it('empties every room of an index with no known catch-up time, including checkpoint-only rooms', async () => {
		const { backend, scheduler, roomsAtStart } = await setup(undefined, { checkpointOnlyRoom: true });

		expect(scheduler.start).toHaveBeenCalledTimes(1);
		expect(roomsAtStart).toEqual([[]]);
		expect(await backend.getRoomState('checkpoint-only')).toBeUndefined();
		expect(await backend.listRooms()).toEqual([]);
	});

	it('empties every room when the last catch-up time is in the future, saved with a clock that was ahead', async () => {
		const { backend } = await setup(NOW + DAY);

		expect(await backend.listRooms()).toEqual([]);
	});

	it('keeps the rooms after a recent catch-up', async () => {
		const { backend, scheduler } = await setup(NOW - DAY);

		expect(scheduler.start).toHaveBeenCalledTimes(1);
		expect(await backend.listRooms()).toEqual(['r1']);
	});

	it('saves the start time of the catch-up when the crawler has nothing left to do', async () => {
		const { saved, reportDone } = await setup(NOW - DAY);
		expect(saved).toEqual([]);

		reportDone();
		reportDone();

		expect(saved).toEqual([NOW]);
	});

	it('saves no time when a room was skipped after an error, as that room was not caught up', async () => {
		const { saved, reportDone } = await setup(NOW - DAY);

		reportDone({ roomsSkipped: 1 });

		expect(saved).toEqual([]);
	});

	it('saves no time when the rooms could not be emptied, so the next open tries again', async () => {
		const { backend, session, scheduler, saved, reportDone, onError, runtime } = await setup(undefined, { failRemove: true });

		expect(onError).toHaveBeenCalled();
		expect(scheduler.start).toHaveBeenCalledTimes(1);
		expect(backend.removeRoom).toHaveBeenCalledTimes(1);
		runtime.onReconnect();
		reportDone();

		expect(saved).toEqual([]);

		session.set(undefined);
		session.set(backend);
		await runtime.whenSettled();

		expect(backend.removeRoom).toHaveBeenCalledTimes(2);
		expect(backend.removeRoom).toHaveBeenLastCalledWith('r1');
	});
});

describe('createSearchIndexRuntime with the admin depth limit', () => {
	const MONTH = YEAR / 12;

	const backfill = async (getMaxAgeMs: (() => number | undefined) | undefined) => {
		jest.useFakeTimers({ now: NOW });
		try {
			const server = createSyncMessagesServerMock({ startAt: NOW });
			server.addHistory('old', 'r1', NOW - YEAR);
			server.addHistory('recent', 'r1', NOW - 2 * MONTH);
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
				getMaxAgeMs,
			});

			session.set(backend);
			await jest.advanceTimersByTimeAsync(5 * 60_000);
			const found = async (id: string) => backend.documents.has(id);
			const result = { old: await found('old'), recent: await found('recent'), m0: await found('m0') };
			runtime.dispose();
			return result;
		} finally {
			jest.useRealTimers();
		}
	};

	it('does not index messages older than the depth that the admin set', async () => {
		expect(await backfill(() => 6 * MONTH)).toEqual({ old: false, recent: true, m0: true });
	});

	it('indexes the whole history when no depth is set', async () => {
		expect(await backfill(undefined)).toEqual({ old: true, recent: true, m0: true });
	});

	it('indexes only new messages with a depth of 0 months', async () => {
		expect(await backfill(() => 0)).toEqual({ old: false, recent: false, m0: false });
	});
});

describe('createSearchIndexRuntime with the admin tuning', () => {
	const crawl = async (getTuning: (() => SearchIndexTuning) | undefined) => {
		jest.useFakeTimers({ now: NOW });
		try {
			const server = createSyncMessagesServerMock({ startAt: NOW });
			for (let i = 0; i < 300; i++) server.addHistory(`m${i}`, 'r1', NOW - 1000 * (i + 1));

			const backend = createFakeSearchIndexBackend();
			await backend.open({ userId: 'u1' });
			const session = createSessionStub();
			const requests: { at: number; count: number }[] = [];
			// The first request fails with a server error, as `fetch` reports it: the `Response`.
			let failure: unknown = { status: 503, headers: { get: () => null } };

			const runtime = createSearchIndexRuntime({
				session,
				writer: { remove: async () => undefined, flush: async () => undefined },
				syncMessages: async (params) => {
					requests.push({ at: Date.now(), count: params.count });
					if (failure) {
						const error = failure;
						failure = undefined;
						throw error;
					}
					return server.syncMessages(params);
				},
				decryptMessage: async (message) => ({ ...message, e2e: 'done' }) as IMessage,
				getRooms: () => [{ rid: 'r1', lastActivityAt: NOW }],
				getTuning,
			});

			session.set(backend);
			await jest.advanceTimersByTimeAsync(60_000);
			runtime.dispose();
			return {
				counts: requests.map(({ count }) => count),
				gaps: requests.slice(1).map(({ at }, i) => at - requests[i].at),
				backfillDone: (await backend.getRoomState('r1'))?.backfillDone,
			};
		} finally {
			jest.useRealTimers();
		}
	};

	it('uses the default pause, page size, back-off and no message limit without tuning', async () => {
		const { counts, gaps, backfillDone } = await crawl(undefined);

		// A failed page, the 300 messages of backfill in pages of 100 and an empty last page, then the catch-up: no message
		// limit stops the backfill.
		expect(counts).toEqual([100, 100, 100, 100, 100, 100]);
		expect(backfillDone).toBe(true);
		// The first request fails: the back-off starts between 5 and 10 seconds. Then the pause is 12 seconds.
		expect(gaps[0]).toBeGreaterThanOrEqual(5000);
		expect(gaps[0]).toBeLessThanOrEqual(10_000);
		expect(gaps[1]).toBe(12_000);
	});

	it('uses the pause, page size, back-off and message limit of the tuning', async () => {
		const { counts, gaps, backfillDone } = await crawl(() => ({
			pauseMs: 1000,
			pageSize: 20,
			maxBackfillMessagesPerRoom: 50,
			backoffBaseMs: 2000,
			backoffMaxMs: 2000,
		}));

		// A failed page, 50 messages of backfill in pages of 20, then the catch-up (updates, deletes) with full pages.
		expect(counts).toEqual([20, 20, 20, 10, 20, 20]);
		expect(gaps[0]).toBeGreaterThanOrEqual(1000);
		expect(gaps[0]).toBeLessThanOrEqual(2000);
		expect(gaps.slice(1)).toEqual([1000, 1000, 1000, 1000]);
		expect(backfillDone).toBe(true);
	});
});

describe('runtime session and index-loss isolation', () => {
	const deferred = () => {
		let resolve!: () => void;
		const promise = new Promise<void>((done) => {
			resolve = done;
		});
		return { promise, resolve };
	};
	it('does not prune a room rejoined while the persisted room list loads', async () => {
		const raw = createFakeSearchIndexBackend();
		await raw.upsert([{ id: 'kept', rid: 'r', uid: 'u', username: 'u', ts: 1, updatedAt: 1, kind: 'text', body: 'retained' }]);
		const listed = deferred();
		const release = deferred();
		jest.spyOn(raw, 'listRooms').mockImplementationOnce(async () => {
			listed.resolve();
			await release.promise;
			return ['r'];
		});
		let subscribed = new Set<string>();
		const scheduler = createSchedulerStub();
		const runtime = createSearchIndexRuntime({
			session: createSessionStub(raw),
			writer: { remove: async () => undefined, flush: async () => undefined },
			syncMessages: jest.fn(),
			decryptMessage: async (message) => message,
			getRooms: () => [...subscribed].map((rid) => ({ rid, lastActivityAt: NOW })),
			getSubscribedRids: () => subscribed,
			createScheduler: () => scheduler,
		});
		await listed.promise;
		subscribed = new Set(['r']);
		release.resolve();
		await runtime.whenSettled();
		expect(scheduler.removeRoom).not.toHaveBeenCalled();
		expect(await raw.stats()).toMatchObject({ docs: 1 });
		runtime.dispose();
		await runtime.whenSettled();
	});

	it('waits for the previous stop and gives a reused backend a distinct revocable run handle', async () => {
		const raw = createFakeSearchIndexBackend();
		const { session, runtime, schedulers } = stubRuntime(raw);
		await runtime.whenSettled();
		const stopped = deferred();
		schedulers[0].scheduler.stop.mockReturnValue(stopped.promise);
		const oldHandle = schedulers[0].backend;
		session.set(undefined);
		session.set(raw);
		await Promise.resolve();
		expect(schedulers).toHaveLength(1);
		await expect(oldHandle.setRoomState('r', { backfillDone: true })).rejects.toThrow('session has ended');
		stopped.resolve();
		await runtime.whenSettled();
		expect(schedulers).toHaveLength(2);
		expect(schedulers[1].backend).not.toBe(oldHandle);
		expect(schedulers[1].scheduler.start).toHaveBeenCalledTimes(1);
		runtime.dispose();
		await runtime.whenSettled();
	});
	it('resets checkpoints and scheduler memory after loss, and ignores old-session events', async () => {
		const raw = createFakeSearchIndexBackend();
		await raw.upsert([{ id: 'm', rid: 'r', uid: 'u', username: 'u', ts: 1, updatedAt: 1, kind: 'text', body: 'plain' }]);
		await raw.setRoomState('r', { lastUpdate: 123, backfillCursor: 'old', backfillDone: true });
		const callbacks: ((event: { type: 'lost' | 'changed' }) => void)[] = [];
		const unsubscribe = jest.fn();
		raw.onIndexEvent = (listener) => {
			callbacks.push(listener);
			return unsubscribe;
		};
		const { session, runtime, schedulers } = stubRuntime(raw);
		await runtime.whenSettled();
		const stopped = deferred();
		schedulers[0].scheduler.stop.mockReturnValue(stopped.promise);
		callbacks[0]({ type: 'changed' });
		expect(schedulers).toHaveLength(1);
		callbacks[0]({ type: 'lost' });
		expect(runtime.getScheduler()).toBeUndefined();
		await Promise.resolve();
		expect(schedulers).toHaveLength(1);
		stopped.resolve();
		await runtime.whenSettled();
		expect(await raw.getRoomState('r')).toEqual({ backfillDone: false });
		expect(schedulers).toHaveLength(2);
		await expect(schedulers[0].backend.setRoomState('r', { backfillDone: true })).rejects.toThrow('session has ended');
		session.set(createFakeSearchIndexBackend());
		await runtime.whenSettled();
		const count = schedulers.length;
		callbacks[0]({ type: 'lost' });
		await runtime.whenSettled();
		expect(schedulers).toHaveLength(count);
		expect(unsubscribe).toHaveBeenCalledTimes(1);
		runtime.dispose();
		await runtime.whenSettled();
	});
	it('does not restart after checkpoint reset fails', async () => {
		const raw = createFakeSearchIndexBackend();
		await raw.upsert([{ id: 'm', rid: 'r', uid: 'u', username: 'u', ts: 1, updatedAt: 1, kind: 'text', body: 'plain' }]);
		let lost!: (event: { type: 'lost' }) => void;
		raw.onIndexEvent = (listener) => {
			lost = listener;
			return () => undefined;
		};
		const { runtime, schedulers } = stubRuntime(raw);
		await runtime.whenSettled();
		jest.spyOn(raw, 'setRoomState').mockRejectedValue(new Error('storage unavailable'));
		lost({ type: 'lost' });
		await runtime.whenSettled();
		expect(schedulers).toHaveLength(1);
		expect(runtime.getScheduler()).toBeUndefined();
		runtime.dispose();
		await runtime.whenSettled();
	});
	it('does not save sync time from a retired scheduler callback', async () => {
		const raw = createFakeSearchIndexBackend();
		const session = createSessionStub(raw);
		const schedulers: jest.Mocked<SearchIndexScheduler>[] = [];
		const write = jest.fn();
		const runtime = createSearchIndexRuntime({
			session,
			writer: { remove: async () => undefined, flush: async () => undefined },
			syncMessages: jest.fn(),
			decryptMessage: async (message) => message,
			getRooms: () => [],
			syncTime: { read: () => NOW, write },
			now: () => NOW,
			createScheduler: () => {
				const scheduler = createSchedulerStub();
				schedulers.push(scheduler);
				return scheduler;
			},
		});
		await runtime.whenSettled();
		const oldCallback = schedulers[0].subscribe.mock.calls[0][0];
		session.set(createFakeSearchIndexBackend());
		await runtime.whenSettled();
		schedulers[0].getProgress.mockReturnValue({ status: 'done', rooms: 0, roomsDone: 0, roomsSkipped: 0, indexed: 0, pendingDecrypt: 0 });
		oldCallback();
		expect(write).not.toHaveBeenCalled();
		runtime.dispose();
		await runtime.whenSettled();
	});
	it('does not remove a room from a replacement session after writer flush', async () => {
		const a = createFakeSearchIndexBackend();
		const b = createFakeSearchIndexBackend();
		const session = createSessionStub(a);
		const flushed = deferred();
		const schedulers: jest.Mocked<SearchIndexScheduler>[] = [];
		const runtime = createSearchIndexRuntime({
			session,
			writer: { remove: async () => undefined, flush: () => flushed.promise },
			syncMessages: jest.fn(),
			decryptMessage: async (message) => message,
			getRooms: () => [],
			createScheduler: () => {
				const scheduler = createSchedulerStub();
				schedulers.push(scheduler);
				return scheduler;
			},
		});
		await runtime.whenSettled();
		const removal = runtime.onRoomRemoved('r');
		await Promise.resolve();
		session.set(b);
		flushed.resolve();
		await removal;
		await runtime.whenSettled();
		expect(schedulers[0].removeRoom).not.toHaveBeenCalled();
		expect(schedulers[1].removeRoom).not.toHaveBeenCalled();
		await runtime.onRoomRemoved('r');
		expect(schedulers[1].removeRoom).toHaveBeenCalledWith('r');
		runtime.dispose();
		await runtime.whenSettled();
	});
	it('does not decrypt or flush an old response after the session changes', async () => {
		jest.useFakeTimers({ now: NOW });
		try {
			const a = createFakeSearchIndexBackend();
			const b = createFakeSearchIndexBackend();
			const session = createSessionStub(a);
			const requested = deferred();
			let reply!: (page: { updated: IMessage[]; deleted: [] }) => void;
			const syncMessages = jest.fn(() => {
				requested.resolve();
				return new Promise<{ updated: IMessage[]; deleted: [] }>((resolve) => {
					reply = resolve;
				});
			});
			const decryptMessage = jest.fn(async (message: IMessage) => message);
			const flush = jest.fn(async () => undefined);
			const runtime = createSearchIndexRuntime({
				session,
				writer: { remove: async () => undefined, flush },
				syncMessages,
				decryptMessage,
				getRooms: () => [{ rid: 'r', lastActivityAt: NOW }],
			});
			await runtime.whenSettled();
			await requested.promise;
			session.set(b);
			reply({
				updated: [
					{
						_id: 'old',
						rid: 'r',
						t: 'e2e',
						e2e: 'pending',
						msg: 'ciphertext',
						ts: new Date(NOW),
						_updatedAt: new Date(NOW),
						u: { _id: 'u', username: 'u' },
					} as IMessage,
				],
				deleted: [],
			});
			await runtime.whenSettled();
			expect(decryptMessage).not.toHaveBeenCalled();
			expect(flush).not.toHaveBeenCalled();
			expect(await a.getRoomState('r')).toBeUndefined();
			expect(await b.getRoomState('r')).toBeUndefined();
			runtime.dispose();
			reply({ updated: [], deleted: [] });
			await runtime.whenSettled();
		} finally {
			jest.useRealTimers();
		}
	});

	it('backfills from a fresh checkpoint after loss with the real crawler and scheduler', async () => {
		jest.useFakeTimers({ now: NOW });
		try {
			const raw = createFakeSearchIndexBackend();
			await raw.setRoomState('r', { lastUpdate: NOW - 1000, backfillCursor: 'stale', backfillDone: true });
			let lost!: (event: { type: 'lost' }) => void;
			raw.onIndexEvent = (listener) => {
				lost = listener;
				return () => undefined;
			};
			const calls: { type: string; next?: string; previous?: string }[] = [];
			const runtime = createSearchIndexRuntime({
				session: createSessionStub(raw),
				writer: { remove: async () => undefined, flush: async () => undefined },
				syncMessages: async (params) => {
					calls.push(params);
					return { updated: [], deleted: [] };
				},
				decryptMessage: async (message) => message,
				getRooms: () => [{ rid: 'r', lastActivityAt: NOW }],
				getTuning: () => ({ pauseMs: 1 }),
			});
			await runtime.whenSettled();
			await jest.advanceTimersByTimeAsync(5);
			const firstRunCount = calls.length;
			const recoveredAt = Date.now();
			lost({ type: 'lost' });
			await runtime.whenSettled();
			await jest.advanceTimersByTimeAsync(5);
			const restarted = calls.slice(firstRunCount);
			expect(restarted[0]).toMatchObject({ type: 'UPDATED', previous: `${recoveredAt}_` });
			expect(restarted[0].next).toBeUndefined();
			expect(await raw.getRoomState('r')).toMatchObject({ backfillDone: true });
			runtime.dispose();
			await runtime.whenSettled();
		} finally {
			jest.useRealTimers();
		}
	});

	it('does not let old subscription readiness block a replacement session', async () => {
		const a = createFakeSearchIndexBackend();
		const b = createFakeSearchIndexBackend();
		const session = createSessionStub(a);
		const ready = deferred();
		const schedulers: jest.Mocked<SearchIndexScheduler>[] = [];
		const runtime = createSearchIndexRuntime({
			session,
			writer: { remove: async () => undefined, flush: async () => undefined },
			syncMessages: jest.fn(),
			decryptMessage: async (message) => message,
			getRooms: () => [],
			getSubscribedRids: () => new Set(),
			whenRoomsReady: () => (session.getActiveBackend() === a ? ready.promise : Promise.resolve()),
			createScheduler: () => {
				const scheduler = createSchedulerStub();
				schedulers.push(scheduler);
				return scheduler;
			},
		});
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		session.set(b);
		await runtime.whenSettled();
		expect(schedulers.at(-1)!.start).toHaveBeenCalledTimes(1);
		runtime.dispose();
		await runtime.whenSettled();
	});
	it('uses the session-owned wipe and does not close its backend on runtime disposal', async () => {
		const raw = createFakeSearchIndexBackend();
		raw.close = jest.fn(async () => undefined);
		const baseSession = createSessionStub(raw);
		const wipeClosed = jest.fn(async () => {
			baseSession.set(undefined);
			await raw.wipe();
			return true;
		});
		const runtime = createSearchIndexRuntime({
			session: { ...baseSession, wipeClosed },
			writer: { remove: async () => undefined, flush: async () => undefined },
			syncMessages: jest.fn(),
			decryptMessage: async (message) => message,
			getRooms: () => [],
			createScheduler: createSchedulerStub,
		});
		await runtime.whenSettled();
		await expect(runtime.wipe()).resolves.toBe(true);
		expect(wipeClosed).toHaveBeenCalledTimes(1);
		runtime.dispose();
		await runtime.whenSettled();
		expect(raw.close).not.toHaveBeenCalled();
	});

	it('prunes left rooms only after subscriptions are ready', async () => {
		const raw = createFakeSearchIndexBackend();
		await raw.upsert([{ id: 'm', rid: 'left', uid: 'u', username: 'u', ts: 1, updatedAt: 1, kind: 'text', body: 'plain' }]);
		const ready = deferred();
		const scheduler = createSchedulerStub();
		const runtime = createSearchIndexRuntime({
			session: createSessionStub(raw),
			writer: { remove: async () => undefined, flush: async () => undefined },
			syncMessages: jest.fn(),
			decryptMessage: async (message) => message,
			getRooms: () => [],
			getSubscribedRids: () => new Set(),
			whenRoomsReady: () => ready.promise,
			createScheduler: () => scheduler,
		});
		await Promise.resolve();
		await Promise.resolve();
		await Promise.resolve();
		expect(scheduler.removeRoom).not.toHaveBeenCalled();
		ready.resolve();
		await runtime.whenSettled();
		expect(scheduler.removeRoom).toHaveBeenCalledWith('left');
		runtime.dispose();
		await runtime.whenSettled();
	});
});

describe('searchIndexTuningFromSettings', () => {
	const tuningOf = (values: Record<string, unknown>) => searchIndexTuningFromSettings((id) => values[id]);

	it('gives the defaults when the server sends no setting', () => {
		expect(tuningOf({})).toEqual({
			pauseMs: 12_000,
			pageSize: 100,
			maxBackfillMessagesPerRoom: undefined,
			backoffBaseMs: 10_000,
			backoffMaxMs: 600_000,
		});
	});

	it('uses the values of the settings', () => {
		expect(
			tuningOf({
				E2E_Local_Search_Backfill_Pause: 3,
				E2E_Local_Search_Backfill_Page_Size: 50,
				E2E_Local_Search_Backfill_Max_Messages_Per_Room: 2000,
				E2E_Local_Search_Backoff_Min: 5,
				E2E_Local_Search_Backoff_Max: 120,
			}),
		).toEqual({ pauseMs: 3000, pageSize: 50, maxBackfillMessagesPerRoom: 2000, backoffBaseMs: 5000, backoffMaxMs: 120_000 });
	});

	it('clamps each value to its safe range', () => {
		expect(
			tuningOf({
				E2E_Local_Search_Backfill_Pause: 0,
				E2E_Local_Search_Backfill_Page_Size: 5000,
				E2E_Local_Search_Backfill_Max_Messages_Per_Room: 0,
				E2E_Local_Search_Backoff_Min: -4,
				E2E_Local_Search_Backoff_Max: 0,
			}),
		).toEqual({ pauseMs: 1000, pageSize: 100, maxBackfillMessagesPerRoom: undefined, backoffBaseMs: 1000, backoffMaxMs: 1000 });

		expect(
			tuningOf({
				E2E_Local_Search_Backfill_Pause: 0.2,
				E2E_Local_Search_Backfill_Page_Size: 1,
				E2E_Local_Search_Backfill_Max_Messages_Per_Room: -5,
				E2E_Local_Search_Backoff_Min: 30,
				E2E_Local_Search_Backoff_Max: 20,
			}),
		).toEqual({ pauseMs: 1000, pageSize: 10, maxBackfillMessagesPerRoom: undefined, backoffBaseMs: 30_000, backoffMaxMs: 30_000 });
	});

	it('gives the default for a value that is not a number', () => {
		expect(
			tuningOf({
				E2E_Local_Search_Backfill_Pause: '1',
				E2E_Local_Search_Backfill_Page_Size: Number.NaN,
				E2E_Local_Search_Backoff_Min: null,
				E2E_Local_Search_Backoff_Max: Number.POSITIVE_INFINITY,
			}),
		).toMatchObject({ pauseMs: 12_000, pageSize: 100, backoffBaseMs: 10_000, backoffMaxMs: 600_000 });
	});
});

describe('backfillMonthsToMaxAgeMs', () => {
	it('turns months into milliseconds, and 0, negative or invalid values into 0 (no backfill)', () => {
		expect(backfillMonthsToMaxAgeMs(12)).toBe(YEAR + 6 * 60 * 60 * 1000);
		expect(backfillMonthsToMaxAgeMs(0)).toBe(0);
		expect(backfillMonthsToMaxAgeMs(-3)).toBe(0);
		expect(backfillMonthsToMaxAgeMs(Number.NaN)).toBe(0);
		expect(backfillMonthsToMaxAgeMs(undefined)).toBe(0);
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

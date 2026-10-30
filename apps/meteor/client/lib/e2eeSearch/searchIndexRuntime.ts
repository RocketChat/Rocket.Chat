import type { IMessage, Serialized } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexCrawler, DEFAULT_PAGE_SIZE } from './searchIndexCrawler';
import type { SearchIndexCrawler, SyncMessagesPage, SyncMessagesParams } from './searchIndexCrawler';
import { createSearchIndexScheduler, DEFAULT_BACKOFF_BASE_MS, DEFAULT_BACKOFF_MAX_MS, DEFAULT_PAUSE_MS } from './searchIndexScheduler';
import type { SearchIndexProgress, SearchIndexRoom, SearchIndexScheduler } from './searchIndexScheduler';
import { createSearchIndexSessionBackend } from './searchIndexSessionBackend';
import type { SearchIndexWriter } from './searchIndexWriter';
import { mapMessageFromApi } from '../utils/mapMessageFromApi';

type Credentials = { 'X-User-Id': string; 'X-Auth-Token': string };

type SyncMessagesFetcherOptions = {
	/** The server URL without the trailing slash. */
	baseUrl: string;
	getCredentials: () => Credentials | undefined;
	fetch?: typeof fetch;
};

type SyncMessagesBody = {
	result: {
		updated: Serialized<IMessage>[];
		deleted: { _id: string; _deletedAt: string }[];
		cursor?: { next: string | null; previous: string | null };
	};
};

/** Preserve the HTTP response on failure, including retry headers. */
export const createSyncMessagesFetcher =
	({ baseUrl, getCredentials, fetch: fetchFn = (...args) => fetch(...args) }: SyncMessagesFetcherOptions) =>
	async (params: SyncMessagesParams): Promise<SyncMessagesPage> => {
		const query = new URLSearchParams();
		for (const [key, value] of Object.entries(params)) {
			if (value !== undefined) query.set(key, String(value));
		}

		const response = await fetchFn(`${baseUrl}/api/v1/chat.syncMessages?${query}`, {
			method: 'GET',
			headers: { ...getCredentials() },
		});
		// oxlint-disable-next-line typescript/only-throw-error
		if (!response.ok) throw response;

		const { result } = (await response.json()) as SyncMessagesBody;
		return {
			updated: result.updated.map((message) => mapMessageFromApi(message)),
			deleted: result.deleted,
			...(result.cursor && { cursor: result.cursor }),
		};
	};

type RoomLike = { rid: string; encrypted?: boolean; lm?: Date | string; lastMessage?: { ts?: Date | string }; ts?: Date | string };

const timeOf = (value: Date | string | undefined): number => (value === undefined ? 0 : new Date(value).getTime() || 0);

export const toSearchIndexRooms = (subscriptions: Iterable<RoomLike>): SearchIndexRoom[] =>
	[...subscriptions]
		.filter((sub) => sub.encrypted === true)
		.map((sub) => ({ rid: sub.rid, lastActivityAt: timeOf(sub.lm ?? sub.lastMessage?.ts ?? sub.ts) }));

const AVERAGE_MONTH_MS = (365.25 / 12) * 24 * 60 * 60 * 1000;

/** The backfill depth for the admin setting in months. 0, a negative or an invalid value gives 0: no backfill. */
export const backfillMonthsToMaxAgeMs = (months: number | undefined): number =>
	typeof months === 'number' && Number.isFinite(months) && months > 0 ? months * AVERAGE_MONTH_MS : 0;

export type SearchIndexTuning = {
	/** The wait between two requests. */
	pauseMs?: number;
	/** Messages per `chat.syncMessages` page. */
	pageSize?: number;
	/** The backfill of a room stops after this many messages. `undefined` sets no limit. */
	maxBackfillMessagesPerRoom?: number;
	/** The first wait after a rate limit or a server error. */
	backoffBaseMs?: number;
	/** The longest wait after rate limits or server errors. */
	backoffMaxMs?: number;
};

const MIN_PAUSE_SECONDS = 1;
const MIN_BACKOFF_SECONDS = 1;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
// Browser timers cannot represent delays above a signed 32-bit integer.
const MAX_TIMER_SECONDS = Math.floor((2 ** 31 - 1) / 1000);

const toTimerMs = (seconds: number, minSeconds: number): number => Math.min(MAX_TIMER_SECONDS, Math.max(minSeconds, seconds)) * 1000;

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/**
 * The crawler tuning for the admin settings, each value clamped to a safe range. A missing or invalid value (an older
 * server does not send the setting) gives the default.
 */
export const searchIndexTuningFromSettings = (get: (id: string) => unknown): SearchIndexTuning => {
	const pause = get('E2E_Local_Search_Backfill_Pause');
	const pageSize = get('E2E_Local_Search_Backfill_Page_Size');
	const maxPerRoom = get('E2E_Local_Search_Backfill_Max_Messages_Per_Room');
	const backoffMin = get('E2E_Local_Search_Backoff_Min');
	const backoffMax = get('E2E_Local_Search_Backoff_Max');

	const backoffBaseMs = isFiniteNumber(backoffMin) ? toTimerMs(backoffMin, MIN_BACKOFF_SECONDS) : DEFAULT_BACKOFF_BASE_MS;
	return {
		pauseMs: isFiniteNumber(pause) ? toTimerMs(pause, MIN_PAUSE_SECONDS) : DEFAULT_PAUSE_MS,
		pageSize: isFiniteNumber(pageSize) ? Math.min(MAX_PAGE_SIZE, Math.max(MIN_PAGE_SIZE, Math.round(pageSize))) : DEFAULT_PAGE_SIZE,
		maxBackfillMessagesPerRoom: isFiniteNumber(maxPerRoom) && maxPerRoom >= 1 ? Math.floor(maxPerRoom) : undefined,
		backoffBaseMs,
		backoffMaxMs: Math.max(backoffBaseMs, isFiniteNumber(backoffMax) ? toTimerMs(backoffMax, 0) : DEFAULT_BACKOFF_MAX_MS),
	};
};

export type SearchIndexSyncTime = { read(): number | undefined; write(at: number): void };

export const DELETION_RECORDS_KEPT_MS = 30 * 24 * 60 * 60 * 1000;
export const REINDEX_AFTER_MS = DELETION_RECORDS_KEPT_MS - 5 * 24 * 60 * 60 * 1000;

type SearchIndexRuntimeOptions = {
	session: {
		getActiveBackend(): ISearchIndexBackend | undefined;
		subscribe(listener: () => void): () => void;
		wipeClosed?(beforeWipe?: () => Promise<void>): Promise<boolean>;
	};
	writer: Pick<SearchIndexWriter, 'remove' | 'flush'>;
	syncMessages: (params: SyncMessagesParams) => Promise<SyncMessagesPage>;
	/** Queue decrypted messages under their original session ownership before resolving. */
	decryptMessage: (message: IMessage) => Promise<IMessage>;
	getRooms: () => SearchIndexRoom[];
	/** Include encrypted and unencrypted subscriptions. */
	getSubscribedRids?: () => ReadonlySet<string>;
	/** Resolves when the subscription list is loaded, so an empty list at startup does not remove every room. */
	whenRoomsReady?: () => Promise<void>;
	/** The depth limit of the backfill, read each time the index opens. `undefined` indexes the whole history. */
	getMaxAgeMs?: () => number | undefined;
	/** The pacing and the limits of the crawler, read each time the index opens. A missing value gives the default. */
	getTuning?: () => SearchIndexTuning;
	onError?: (error: unknown) => void;
	/** Store the latest complete catch-up time for the active user. */
	syncTime?: SearchIndexSyncTime;
	now?: () => number;
	/** Builds the crawler and its scheduler for an open index. */
	createScheduler?: (backend: ISearchIndexBackend) => SearchIndexScheduler;
};

export type SearchIndexRuntime = {
	/** The scheduler of the open index, or `undefined` while no index is open. */
	getScheduler(): SearchIndexScheduler | undefined;
	/** The indexing progress of the open index, or `undefined` while no index is open. */
	getProgress(): SearchIndexProgress | undefined;
	/** Calls the listener each time `getProgress` changes. Returns the function that removes it. */
	subscribe(listener: () => void): () => void;
	/** Catches up every room, after the connection to the server came back. */
	onReconnect(): void;
	/** Catches up the room before the next backfill page, so a search in it finds its edits and misses its deletes. */
	requestRoomCatchUp(rid: string): void;
	/** Indexes the messages that waited for the room key, after the key arrived. */
	onRoomKeyReady(rid: string): void;
	/** Keeps a live message that failed to decrypt (room key missing), so `onRoomKeyReady` indexes it. Pass the encrypted message. */
	onDecryptFailed(message: IMessage): void;
	/** Removes the rows of a room whose subscription was removed (the user left the room or was removed from it). */
	onRoomRemoved(rid: string): Promise<void>;
	/** Resolves when the removal of the left rooms after the last open is done. */
	whenSettled(): Promise<void>;
	/** Stop indexing and explicitly delete the active index, or the session's closed index. */
	wipe(): Promise<boolean>;
	dispose(): void;
};

/** Run indexing under one session at a time and restart without old progress after index loss. */
export const createSearchIndexRuntime = ({
	session,
	writer,
	syncMessages,
	decryptMessage,
	getRooms,
	getSubscribedRids,
	whenRoomsReady = () => Promise.resolve(),
	getMaxAgeMs = () => undefined,
	getTuning = () => ({}),
	onError = () => undefined,
	syncTime,
	now = () => Date.now(),
	createScheduler,
}: SearchIndexRuntimeOptions): SearchIndexRuntime => {
	let backend: ISearchIndexBackend | undefined;
	let scheduler: SearchIndexScheduler | undefined;
	let revokeRun: (() => void) | undefined;
	let unsubscribeScheduler: (() => void) | undefined;
	let unsubscribeIndex: (() => void) | undefined;
	let generation = 0;
	let sessionEpoch = 0;
	let cancelReadiness: (() => void) | undefined;
	let disposed = false;
	let suspended = false;
	let transition: Promise<void> = Promise.resolve();
	let catchUpStartedAt: number | undefined;
	let recordsSync = false;
	const listeners = new Set<() => void>();
	const notify = () => {
		for (const listener of [...listeners]) listener();
	};
	const enqueue = (run: () => Promise<void>) => {
		transition = transition.then(run, run).catch(onError);
		return transition;
	};
	const isCurrent = (opened: ISearchIndexBackend, current: number) =>
		!disposed && !suspended && generation === current && backend === opened && session.getActiveBackend() === opened;
	const retire = () => {
		cancelReadiness?.();
		cancelReadiness = undefined;
		revokeRun?.();
		revokeRun = undefined;
		unsubscribeScheduler?.();
		unsubscribeScheduler = undefined;
		const stopped = scheduler?.stop();
		scheduler = undefined;
		catchUpStartedAt = undefined;
		recordsSync = false;
		notify();
		return stopped;
	};
	const prepare = async (opened: ISearchIndexBackend, current: number, reset: boolean) => {
		if (!isCurrent(opened, current)) return;
		const handle = createSearchIndexSessionBackend(opened);
		revokeRun = handle.revoke;
		const owned = handle.backend;
		const assertCurrent = () => {
			if (!isCurrent(opened, current)) throw new Error('The E2EE search runtime session has ended');
		};
		const guarded = async <T>(call: () => Promise<T>) => {
			assertCurrent();
			const result = await call();
			assertCurrent();
			return result;
		};
		let recordSync = Boolean(syncTime);
		try {
			if (reset) {
				await guarded(() => writer.flush({ throwOnError: true }));
				const rooms = new Set([...(await owned.listRooms()), ...getRooms().map(({ rid }) => rid)]);
				for (const rid of rooms) await owned.setRoomState(rid, { backfillDone: false });
			} else if (syncTime) {
				const syncedAt = syncTime.read();
				const age = syncedAt === undefined ? undefined : now() - syncedAt;
				if (age === undefined || age < 0 || age > REINDEX_AFTER_MS) {
					for (const rid of await owned.listRooms()) await owned.removeRoom(rid);
				}
			}
		} catch (error) {
			if (!isCurrent(opened, current)) return;
			onError(error);
			if (reset) return;
			recordSync = false;
		}
		if (!isCurrent(opened, current)) return;
		const { pauseMs, pageSize, maxBackfillMessagesPerRoom, backoffBaseMs, backoffMaxMs } = getTuning();
		const crawler: SearchIndexCrawler | undefined = createScheduler
			? undefined
			: createSearchIndexCrawler({
					backend: owned,
					syncMessages: (params) => guarded(() => syncMessages(params)),
					decryptMessage: (message) => guarded(() => decryptMessage(message)),
					writer: {
						remove: (ids, options) => guarded(() => writer.remove(ids, options)),
						flush: (options) => guarded(() => writer.flush(options)),
					},
					maxAgeMs: getMaxAgeMs(),
					pageSize,
					maxBackfillMessagesPerRoom,
				});
		const created = createScheduler
			? createScheduler(owned)
			: createSearchIndexScheduler({
					crawler: crawler!,
					backend: owned,
					getRooms,
					pauseMs,
					backoffBaseMs,
					backoffMaxMs,
					onError: (error) => {
						if (isCurrent(opened, current)) onError(error);
					},
				});
		scheduler = created;
		recordsSync = recordSync;
		if (recordSync) catchUpStartedAt = now();
		unsubscribeScheduler = created.subscribe(() => {
			if (!isCurrent(opened, current) || scheduler !== created) return;
			const { status, roomsSkipped } = created.getProgress();
			if (catchUpStartedAt !== undefined && status === 'done' && roomsSkipped === 0) {
				syncTime?.write(catchUpStartedAt);
				catchUpStartedAt = undefined;
			}
			notify();
		});
		created.start();
		notify();
		if (!getSubscribedRids) return;
		const cancelled = new Promise<void>((resolve) => {
			cancelReadiness = resolve;
		});
		await Promise.race([whenRoomsReady(), cancelled]);
		cancelReadiness = undefined;
		if (!isCurrent(opened, current)) return;
		for (const rid of await owned.listRooms()) {
			if (!isCurrent(opened, current)) return;
			if (!getSubscribedRids().has(rid)) await created.removeRoom(rid);
		}
	};
	const restart = (reset: boolean) => {
		const opened = backend;
		const current = ++generation;
		const stopped = retire();
		void enqueue(async () => {
			await stopped;
			if (opened) await prepare(opened, current, reset);
		});
	};
	const sync = () => {
		const next = session.getActiveBackend();
		if (next === backend || disposed) return;
		unsubscribeIndex?.();
		unsubscribeIndex = undefined;
		backend = next;
		const epoch = ++sessionEpoch;
		suspended = false;
		restart(false);
		if (next?.onIndexEvent) {
			unsubscribeIndex = next.onIndexEvent((event) => {
				if (event.type === 'lost' && sessionEpoch === epoch && backend === next && !disposed && !suspended) restart(true);
			});
		}
	};
	const unsubscribe = session.subscribe(sync);
	sync();
	return {
		getScheduler: () => scheduler,
		getProgress: () => scheduler?.getProgress(),
		subscribe(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		whenSettled: async () => {
			let pending: Promise<void>;
			do {
				pending = transition;
				await pending;
			} while (pending !== transition);
		},
		onReconnect() {
			if (!scheduler) return;
			if (recordsSync && catchUpStartedAt === undefined) catchUpStartedAt = now();
			scheduler.requestCatchUp();
		},
		requestRoomCatchUp: (rid) => scheduler?.requestCatchUp([rid]),
		onRoomKeyReady: (rid) => scheduler?.retryPendingDecrypt(rid),
		onDecryptFailed: (message) => scheduler?.addPendingDecrypt(message),
		async onRoomRemoved(rid) {
			const opened = backend;
			const current = generation;
			if (!opened) return;
			await transition;
			if (!isCurrent(opened, current)) return;
			try {
				await writer.flush({ throwOnError: true });
				if (isCurrent(opened, current)) await (scheduler ? scheduler.removeRoom(rid) : opened.removeRoom(rid));
			} catch (error) {
				if (isCurrent(opened, current)) onError(error);
			}
		},
		async wipe() {
			const opened = backend;
			if (!opened) return (await session.wipeClosed?.()) ?? false;
			suspended = true;
			const current = ++generation;
			unsubscribeIndex?.();
			unsubscribeIndex = undefined;
			const stopped = retire();
			let wiped = false;
			await enqueue(async () => {
				await stopped;
				if (disposed || current !== generation || session.getActiveBackend() !== opened) return;
				await writer.flush({ throwOnError: true });
				if (disposed || current !== generation || session.getActiveBackend() !== opened) return;
				if (session.wipeClosed) wiped = await session.wipeClosed();
				else {
					await opened.wipe();
					wiped = true;
				}
			});
			return wiped;
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			generation++;
			unsubscribe();
			unsubscribeIndex?.();
			unsubscribeIndex = undefined;
			const stopped = retire();
			backend = undefined;
			void enqueue(async () => {
				await stopped;
			});
		},
	};
};

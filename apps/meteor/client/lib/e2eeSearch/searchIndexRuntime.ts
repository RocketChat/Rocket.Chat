import type { IMessage, Serialized } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexCrawler } from './searchIndexCrawler';
import type { SearchIndexCrawler, SyncMessagesPage, SyncMessagesParams } from './searchIndexCrawler';
import { createSearchIndexScheduler } from './searchIndexScheduler';
import type { SearchIndexProgress, SearchIndexRoom, SearchIndexScheduler } from './searchIndexScheduler';
import type { SearchIndexSession } from './searchIndexSession';
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

/**
 * Calls `chat.syncMessages` for the crawler. It does not use `APIClient`, because its middleware replaces an HTTP error
 * with the JSON body: the scheduler needs the status and the rate-limit headers of the `Response` to back off or to
 * remove a room. A failed call rejects with that `Response`.
 */
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
		// The scheduler reads the status and the headers of the Response, as the REST client rejects with it.
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

/** The encrypted rooms of the user, with the time of their last message, for the crawler. */
export const toSearchIndexRooms = (subscriptions: Iterable<RoomLike>): SearchIndexRoom[] =>
	[...subscriptions]
		.filter((sub) => sub.encrypted === true)
		.map((sub) => ({ rid: sub.rid, lastActivityAt: timeOf(sub.lm ?? sub.lastMessage?.ts ?? sub.ts) }));

const AVERAGE_MONTH_MS = (365.25 / 12) * 24 * 60 * 60 * 1000;

/** The backfill depth for the admin setting in months. 0, a negative or an invalid value gives 0: no backfill. */
export const backfillMonthsToMaxAgeMs = (months: number | undefined): number =>
	typeof months === 'number' && Number.isFinite(months) && months > 0 ? months * AVERAGE_MONTH_MS : 0;

type SearchIndexRuntimeOptions = {
	session: Pick<SearchIndexSession, 'getActiveBackend' | 'subscribe'> & Partial<Pick<SearchIndexSession, 'wipeClosed'>>;
	writer: Pick<SearchIndexWriter, 'remove' | 'flush'>;
	syncMessages: (params: SyncMessagesParams) => Promise<SyncMessagesPage>;
	/** The client's E2E decrypt path, which also queues the decrypted message for the writer. */
	decryptMessage: (message: IMessage) => Promise<IMessage>;
	getRooms: () => SearchIndexRoom[];
	/**
	 * The rooms of every subscription of the user, encrypted or not. When the index opens, the rows of the other rooms are
	 * removed: the user left them while the index was closed.
	 */
	getSubscribedRids?: () => ReadonlySet<string>;
	/** Resolves when the subscription list is loaded, so an empty list at startup does not remove every room. */
	whenRoomsReady?: () => Promise<void>;
	/** The depth limit of the backfill, read each time the index opens. `undefined` indexes the whole history. */
	getMaxAgeMs?: () => number | undefined;
	onError?: (error: unknown) => void;
	/** Builds the crawler and its scheduler for an open index. Specs replace it. */
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
	/** Indexes the messages that waited for the room key, after the key arrived. */
	onRoomKeyReady(rid: string): void;
	/** Keeps a live message that failed to decrypt (room key missing), so `onRoomKeyReady` indexes it. Pass the encrypted message. */
	onDecryptFailed(message: IMessage): void;
	/** Removes the rows of a room whose subscription was removed (the user left the room or was removed from it). */
	onRoomRemoved(rid: string): Promise<void>;
	/** Resolves when the removal of the left rooms after the last open is done. Specs use it. */
	whenSettled(): Promise<void>;
	/**
	 * Empties the open index, after the user reset the own E2E key: the old messages are not readable with the new key,
	 * and the index must not keep them. The crawler stops until the next login. While E2EE is locked no index is open,
	 * and the index of the logged-in user is deleted closed. Resolves `false` when nothing was wiped.
	 */
	wipe(): Promise<boolean>;
	dispose(): void;
};

/**
 * Runs the search index crawler while the index is open: it starts a scheduler when the session opens the index for a
 * user, and stops it when the session closes the index (logout, E2EE stopped). A new login gets a new scheduler, so
 * nothing from the last user reaches the next index.
 */
export const createSearchIndexRuntime = ({
	session,
	writer,
	syncMessages,
	decryptMessage,
	getRooms,
	getSubscribedRids,
	whenRoomsReady = () => Promise.resolve(),
	getMaxAgeMs = () => undefined,
	onError = () => undefined,
	createScheduler,
}: SearchIndexRuntimeOptions): SearchIndexRuntime => {
	const buildScheduler =
		createScheduler ??
		((backend: ISearchIndexBackend) => {
			const crawler: SearchIndexCrawler = createSearchIndexCrawler({
				backend,
				syncMessages,
				decryptMessage,
				writer,
				maxAgeMs: getMaxAgeMs(),
			});
			return createSearchIndexScheduler({ crawler, backend, getRooms, onError });
		});

	let backend: ISearchIndexBackend | undefined;
	let scheduler: SearchIndexScheduler | undefined;
	let pruning: Promise<void> = Promise.resolve();
	let unsubscribeScheduler: (() => void) | undefined;
	const listeners = new Set<() => void>();

	const notify = () => {
		for (const listener of [...listeners]) listener();
	};

	const setScheduler = (next: SearchIndexScheduler | undefined) => {
		unsubscribeScheduler?.();
		unsubscribeScheduler = undefined;
		scheduler = next;
		if (next) unsubscribeScheduler = next.subscribe(notify);
		notify();
	};

	// Removes the rows of the rooms that the user left while the index was closed: no removal event reached it then.
	const pruneLeftRooms = async (opened: ISearchIndexBackend) => {
		if (!getSubscribedRids) return;

		await whenRoomsReady();
		if (backend !== opened) return;

		const subscribed = getSubscribedRids();
		const left = (await opened.listRooms()).filter((rid) => !subscribed.has(rid));
		for (const rid of left) {
			if (backend !== opened) return;
			await (scheduler ? scheduler.removeRoom(rid) : opened.removeRoom(rid));
		}
	};

	const sync = () => {
		const next = session.getActiveBackend();
		if (next === backend) return;

		scheduler?.stop();
		setScheduler(undefined);
		backend = next;
		if (!next) return;

		const created = buildScheduler(next);
		setScheduler(created);
		created.start();
		pruning = pruneLeftRooms(next).catch(onError);
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
		whenSettled: () => pruning,
		onReconnect: () => scheduler?.requestCatchUp(),
		onRoomKeyReady: (rid) => scheduler?.retryPendingDecrypt(rid),
		onDecryptFailed: (message) => scheduler?.addPendingDecrypt(message),
		async onRoomRemoved(rid) {
			const current = backend;
			if (!current) return;

			// Sends the queued documents first, so the remove also takes the ones of this room.
			await writer.flush();
			if (scheduler) {
				await scheduler.removeRoom(rid);
				return;
			}
			try {
				await current.removeRoom(rid);
			} catch (error) {
				onError(error);
			}
		},
		async wipe() {
			const current = backend;
			if (!current) return (await session.wipeClosed?.()) ?? false;

			const stopping = scheduler?.stop();
			setScheduler(undefined);
			await stopping;
			// Sends the queued documents first, so the wipe also takes them.
			await writer.flush();
			await current.wipe();
			return true;
		},
		dispose() {
			unsubscribe();
			scheduler?.stop();
			setScheduler(undefined);
			backend = undefined;
		},
	};
};

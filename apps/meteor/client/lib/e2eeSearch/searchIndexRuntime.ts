import type { IMessage, Serialized } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexCrawler } from './searchIndexCrawler';
import type { SearchIndexCrawler, SyncMessagesPage, SyncMessagesParams } from './searchIndexCrawler';
import { createSearchIndexScheduler } from './searchIndexScheduler';
import type { IdleSignal, SearchIndexRoom, SearchIndexScheduler } from './searchIndexScheduler';
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

type SearchIndexRuntimeOptions = {
	session: Pick<SearchIndexSession, 'getActiveBackend' | 'subscribe'>;
	writer: Pick<SearchIndexWriter, 'remove' | 'flush'>;
	syncMessages: (params: SyncMessagesParams) => Promise<SyncMessagesPage>;
	/** The client's E2E decrypt path, which also queues the decrypted message for the writer. */
	decryptMessage: (message: IMessage) => Promise<IMessage>;
	getRooms: () => SearchIndexRoom[];
	idle: IdleSignal;
	/** The depth limit of the backfill. */
	maxAgeMs?: number;
	onError?: (error: unknown) => void;
	/** Builds the crawler and its scheduler for an open index. Specs replace it. */
	createScheduler?: (backend: ISearchIndexBackend) => SearchIndexScheduler;
};

export type SearchIndexRuntime = {
	/** The scheduler of the open index, or `undefined` while no index is open. */
	getScheduler(): SearchIndexScheduler | undefined;
	/** Catches up every room, after the connection to the server came back. */
	onReconnect(): void;
	/** Indexes the messages that waited for the room key, after the key arrived. */
	onRoomKeyReady(rid: string): void;
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
	idle,
	maxAgeMs,
	onError = () => undefined,
	createScheduler,
}: SearchIndexRuntimeOptions): SearchIndexRuntime => {
	const buildScheduler =
		createScheduler ??
		((backend: ISearchIndexBackend) => {
			const crawler: SearchIndexCrawler = createSearchIndexCrawler({ backend, syncMessages, decryptMessage, writer, maxAgeMs });
			return createSearchIndexScheduler({ crawler, backend, getRooms, idle, onError });
		});

	let backend: ISearchIndexBackend | undefined;
	let scheduler: SearchIndexScheduler | undefined;

	const sync = () => {
		const next = session.getActiveBackend();
		if (next === backend) return;

		scheduler?.stop();
		scheduler = undefined;
		backend = next;
		if (!next) return;

		scheduler = buildScheduler(next);
		scheduler.start();
	};

	const unsubscribe = session.subscribe(sync);
	sync();

	return {
		getScheduler: () => scheduler,
		onReconnect: () => scheduler?.requestCatchUp(),
		onRoomKeyReady: (rid) => scheduler?.retryPendingDecrypt(rid),
		dispose() {
			unsubscribe();
			scheduler?.stop();
			scheduler = undefined;
			backend = undefined;
		},
	};
};

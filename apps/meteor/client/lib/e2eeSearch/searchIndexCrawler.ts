import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import type { SearchIndexWriter } from './searchIndexWriter';
import { isDecryptFailed } from './toSearchDoc';

/**
 * The `chat.syncMessages` query params that the crawler sends: always one paging cursor, because a call without one has
 * no page-size limit on the server.
 */
export type SyncMessagesParams = { roomId: string; type: 'UPDATED' | 'DELETED'; count: number } & (
	{ next: string; previous?: never } | { previous: string; next?: never }
);

/** A `chat.syncMessages` result, with the messages already mapped from the API shape (dates as `Date`). */
export type SyncMessagesPage = {
	updated: IMessage[];
	deleted: { _id: string; _deletedAt: string | Date }[];
	cursor?: { next: string | null; previous: string | null };
};

type SearchIndexCrawlerOptions = {
	backend: Pick<ISearchIndexBackend, 'getRoomState' | 'setRoomState'>;
	syncMessages: (params: SyncMessagesParams) => Promise<SyncMessagesPage>;
	/** The client's E2E decrypt path. It also queues the decrypted message for the search index writer. */
	decryptMessage: (message: IMessage) => Promise<IMessage>;
	writer: Pick<SearchIndexWriter, 'remove' | 'flush'>;
	now?: () => number;
	/** Messages per backfill or catch-up page. */
	pageSize?: number;
	/** The depth limit: the backfill indexes no message sent before it, and stops at the first page that reaches it. */
	maxAgeMs?: number;
	/**
	 * The backfill of a room stops after this many messages inside the depth limit. `undefined` sets no limit. The count
	 * lives in memory: after a restart, the backfill counts again from its saved cursor. The catch-up has no limit.
	 */
	maxBackfillMessagesPerRoom?: number;
	/** The most messages that the crawler keeps pending (across rooms). A new one past the limit drops the oldest. */
	maxPending?: number;
};

const DEFAULT_MAX_PENDING = 5000;

/** Messages per `chat.syncMessages` page when no page size is set. */
export const DEFAULT_PAGE_SIZE = 100;

export type SearchIndexCrawler = {
	/** Indexes the next older page of the room and saves the cursor, so a restart continues from there. */
	backfillRoomPage(rid: string): Promise<{ done: boolean; indexed: number }>;
	/**
	 * Applies the next page of the changes since the room's `lastUpdate`: indexes new and edited messages, then removes
	 * deleted ones. `lastUpdate` moves only after the last page, so an interrupted catch-up starts again from it. The
	 * millisecond of `lastUpdate` is read again, so a message written in it after the last read is not skipped. Its messages
	 * are indexed again (the upsert by `_id` changes nothing) and `indexed` does not count them.
	 */
	catchUpRoomPage(rid: string): Promise<{ done: boolean; indexed: number; removed: number }>;
	/** Decrypts the pending messages of the room again, after its room key arrived. */
	retryPendingDecrypt(rid: string): Promise<{ indexed: number }>;
	/**
	 * Keeps a message that the live client could not decrypt (room key missing) pending in its room, so the retry after the
	 * key arrives indexes it. Pass the encrypted message, not the result of the failed decrypt.
	 */
	addPendingDecrypt(message: IMessage): void;
	/** The messages of the room that the crawler could not decrypt (room key missing), to retry when the key arrives. */
	getPendingDecrypt(rid: string): IMessage[];
	/** Drops what the crawler holds in memory for the room, after the room left the index. */
	forgetRoom(rid: string): void;
};

type CatchUp = { type: 'UPDATED' | 'DELETED'; from: number; cursor: string; newestUpdate: number };

/*
 * `chat.syncMessages` cursors. A server with compound cursors reads `<ms>_<_id>` as a position: it orders the messages of
 * one millisecond by `_id`, so a page boundary inside that millisecond skips nothing, and it returns compound cursors for
 * the next pages. An older server reads only the leading number (`parseInt`), so it sees `<ms>` and works as before.
 * The crawler sends a compound cursor only to start paging from a time. After that, it sends back the server's cursor.
 */
const COMPOUND_CURSOR_SEPARATOR = '_';

/** A `previous` cursor before the messages of `ms`: no `_id` sorts before the empty one. */
const previousCursorAt = (ms: number | string): string => `${ms}${COMPOUND_CURSOR_SEPARATOR}`;

/**
 * A `next` cursor at the start of `ms`: the messages of `ms` are read again. The catch-up starts here, because a message
 * can be written in the millisecond of `lastUpdate` after the read that set it. An older server reads `<ms>` and starts
 * after the millisecond, as before.
 */
const nextCursorFrom = (ms: number): string => `${ms}${COMPOUND_CURSOR_SEPARATOR}`;

/** A saved backfill cursor from before compound cursors is a bare `<ms>` (or a number). `<ms>_` excludes the same messages. */
const toCompoundPreviousCursor = (cursor: string | number): string => {
	const saved = `${cursor}`;
	return saved.includes(COMPOUND_CURSOR_SEPARATOR) ? saved : previousCursorAt(saved);
};

const updatedAtOf = (message: IMessage): number => new Date(message._updatedAt).getTime();

/**
 * Indexes the history of encrypted rooms that the client did not see live, page by page, like the Seshat crawler. The
 * room state (`lastUpdate`, `backfillCursor`, `backfillDone`) lives in the index, so the work survives a restart. The
 * state is saved only after the page is decrypted and flushed: an interrupted page is fetched again, never skipped.
 */
export const createSearchIndexCrawler = ({
	backend,
	syncMessages,
	decryptMessage,
	writer,
	now = Date.now,
	pageSize = DEFAULT_PAGE_SIZE,
	maxAgeMs,
	maxBackfillMessagesPerRoom,
	maxPending = DEFAULT_MAX_PENDING,
}: SearchIndexCrawlerOptions): SearchIndexCrawler => {
	// One map for all rooms: its insertion order is the age order that the cap drops from.
	const pendingDecrypt = new Map<string, IMessage>();
	const catchUps = new Map<string, CatchUp>();
	/** The messages that the backfill of each room fetched inside the depth limit since this crawler was made. */
	const backfilled = new Map<string, number>();

	const keepPending = (message: IMessage) => {
		pendingDecrypt.set(message._id, message);
		for (const oldest of pendingDecrypt.keys()) {
			if (pendingDecrypt.size <= maxPending) break;
			pendingDecrypt.delete(oldest);
		}
	};

	const pendingOf = (rid: string): IMessage[] => [...pendingDecrypt.values()].filter((message) => message.rid === rid);

	const oldestSendTimeAt = (time: number): number | undefined => (maxAgeMs === undefined ? undefined : time - maxAgeMs);

	const isInDepth = (message: IMessage, oldestSendTime: number | undefined) =>
		oldestSendTime === undefined || new Date(message.ts).getTime() >= oldestSendTime;

	/** Decrypts the messages, so the client indexes them, and returns how many of them were indexed and `counts` accepts. */
	const decryptAll = async (messages: IMessage[], counts: (message: IMessage) => boolean = () => true): Promise<number> => {
		let indexed = 0;
		for (const message of messages) {
			const decrypted = await decryptMessage(message);
			if (!isE2EEMessage(decrypted)) continue;

			if (decrypted.e2e !== 'done' || isDecryptFailed(decrypted)) {
				keepPending(message);
				continue;
			}
			pendingDecrypt.delete(message._id);
			if (counts(message)) indexed++;
		}
		await writer.flush();
		return indexed;
	};

	return {
		async backfillRoomPage(rid) {
			const state: E2EESearchRoomState = (await backend.getRoomState(rid)) ?? { backfillDone: false };
			if (state.backfillDone) return { done: true, indexed: 0 };

			const startedAt = now();
			const counted = backfilled.get(rid) ?? 0;
			const page = await syncMessages({
				roomId: rid,
				type: 'UPDATED',
				count: maxBackfillMessagesPerRoom === undefined ? pageSize : Math.max(1, Math.min(pageSize, maxBackfillMessagesPerRoom - counted)),
				previous: state.backfillCursor === undefined ? previousCursorAt(startedAt) : toCompoundPreviousCursor(state.backfillCursor),
			});

			const oldestSendTime = oldestSendTimeAt(startedAt);
			const inDepth = page.updated.filter((message) => isInDepth(message, oldestSendTime));
			const indexed = await decryptAll(inDepth);
			backfilled.set(rid, counted + inDepth.length);
			const reachedLimit = maxBackfillMessagesPerRoom !== undefined && counted + inDepth.length >= maxBackfillMessagesPerRoom;

			const updatedAts = page.updated.map(updatedAtOf);
			const oldest = updatedAts.length ? Math.min(...updatedAts) : undefined;
			const cursor = page.cursor?.previous ?? undefined;
			// A message is never sent after its last update, so no older page holds a message inside the depth limit.
			const reachedDepth = oldestSendTime !== undefined && oldest !== undefined && oldest < oldestSendTime;
			const done = !cursor || page.updated.length === 0 || reachedDepth || reachedLimit;

			// An empty room starts its catch-up at 0, not at the client clock, which can be ahead of the server's.
			const lastUpdate = state.lastUpdate ?? (updatedAts.length ? Math.max(...updatedAts) : 0);

			await backend.setRoomState(rid, {
				lastUpdate,
				...(!done && { backfillCursor: cursor }),
				backfillDone: done,
			});

			return { done, indexed };
		},

		async catchUpRoomPage(rid) {
			const state = await backend.getRoomState(rid);
			if (state?.lastUpdate === undefined) return { done: true, indexed: 0, removed: 0 };

			const catchUp: CatchUp = catchUps.get(rid) ?? {
				type: 'UPDATED',
				from: state.lastUpdate,
				cursor: nextCursorFrom(state.lastUpdate),
				newestUpdate: state.lastUpdate,
			};
			const page = await syncMessages({ roomId: rid, type: catchUp.type, count: pageSize, next: catchUp.cursor });

			let indexed = 0;
			let { newestUpdate } = catchUp;
			const deletedIds = page.deleted.map(({ _id }) => _id);
			if (catchUp.type === 'UPDATED') {
				const oldestSendTime = oldestSendTimeAt(now());
				const outOfDepth = page.updated.filter((message) => !isInDepth(message, oldestSendTime)).map(({ _id }) => _id);
				if (outOfDepth.length) {
					// Sent before the depth limit: not indexed, and an older version of it leaves the index, so its old text is not found.
					await writer.remove(outOfDepth, { deleted: false });
					for (const id of outOfDepth) pendingDecrypt.delete(id);
				}
				// The messages of the `from` millisecond were indexed by the read that set `lastUpdate`, so they are not new.
				const isNew = (message: IMessage) => updatedAtOf(message) !== catchUp.from;
				indexed = await decryptAll(
					page.updated.filter((message) => isInDepth(message, oldestSendTime)),
					isNew,
				);
				newestUpdate = Math.max(newestUpdate, ...page.updated.map(updatedAtOf));
			} else if (deletedIds.length) {
				await writer.remove(deletedIds);
				for (const id of deletedIds) pendingDecrypt.delete(id);
			}
			const result = { indexed, removed: catchUp.type === 'DELETED' ? deletedIds.length : 0 };

			const next = page.cursor?.next;
			if (next) {
				catchUps.set(rid, { ...catchUp, cursor: next, newestUpdate });
				return { done: false, ...result };
			}
			if (catchUp.type === 'UPDATED') {
				catchUps.set(rid, { ...catchUp, type: 'DELETED', cursor: nextCursorFrom(catchUp.from), newestUpdate });
				return { done: false, ...result };
			}

			// The deletes are read after the updates, so a delete can be newer than an update that landed between the two reads.
			// A lastUpdate that counted the deletes would skip that update.
			catchUps.delete(rid);
			const latest = (await backend.getRoomState(rid)) ?? state;
			await backend.setRoomState(rid, { ...latest, lastUpdate: newestUpdate });
			return { done: true, ...result };
		},

		async retryPendingDecrypt(rid) {
			const pending = pendingOf(rid);
			if (!pending.length) return { indexed: 0 };
			return { indexed: await decryptAll(pending) };
		},

		addPendingDecrypt(message) {
			keepPending(message);
		},

		getPendingDecrypt(rid) {
			return pendingOf(rid);
		},

		forgetRoom(rid) {
			for (const message of pendingOf(rid)) pendingDecrypt.delete(message._id);
			catchUps.delete(rid);
			backfilled.delete(rid);
		},
	};
};

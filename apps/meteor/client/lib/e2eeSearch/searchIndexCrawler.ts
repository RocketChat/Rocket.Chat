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
	/** The most messages that the crawler keeps pending (across rooms). A new one past the limit drops the oldest. */
	maxPending?: number;
};

const DEFAULT_MAX_PENDING = 5000;

export type SearchIndexCrawler = {
	/** Indexes the next older page of the room and saves the cursor, so a restart continues from there. */
	backfillRoomPage(rid: string): Promise<{ done: boolean; indexed: number }>;
	/**
	 * Applies the next page of the changes since the room's `lastUpdate`: indexes new and edited messages, then removes
	 * deleted ones. `lastUpdate` moves only after the last page, so an interrupted catch-up starts again from it.
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
	pageSize = 100,
	maxAgeMs,
	maxPending = DEFAULT_MAX_PENDING,
}: SearchIndexCrawlerOptions): SearchIndexCrawler => {
	// One map for all rooms: its insertion order is the age order that the cap drops from.
	const pendingDecrypt = new Map<string, IMessage>();
	const catchUps = new Map<string, CatchUp>();

	const keepPending = (message: IMessage) => {
		pendingDecrypt.set(message._id, message);
		for (const oldest of pendingDecrypt.keys()) {
			if (pendingDecrypt.size <= maxPending) break;
			pendingDecrypt.delete(oldest);
		}
	};

	const pendingOf = (rid: string): IMessage[] => [...pendingDecrypt.values()].filter((message) => message.rid === rid);

	const decryptAll = async (messages: IMessage[]): Promise<number> => {
		let indexed = 0;
		for (const message of messages) {
			const decrypted = await decryptMessage(message);
			if (!isE2EEMessage(decrypted)) continue;

			if (decrypted.e2e !== 'done' || isDecryptFailed(decrypted)) {
				keepPending(message);
				continue;
			}
			pendingDecrypt.delete(message._id);
			indexed++;
		}
		await writer.flush();
		return indexed;
	};

	return {
		async backfillRoomPage(rid) {
			const state: E2EESearchRoomState = (await backend.getRoomState(rid)) ?? { backfillDone: false };
			if (state.backfillDone) return { done: true, indexed: 0 };

			const startedAt = now();
			const page = await syncMessages({
				roomId: rid,
				type: 'UPDATED',
				count: pageSize,
				previous: state.backfillCursor ?? `${startedAt}`,
			});

			const oldestSendTime = maxAgeMs === undefined ? undefined : startedAt - maxAgeMs;
			const inDepth =
				oldestSendTime === undefined ? page.updated : page.updated.filter((message) => new Date(message.ts).getTime() >= oldestSendTime);
			const indexed = await decryptAll(inDepth);

			const updatedAts = page.updated.map(updatedAtOf);
			const oldest = updatedAts.length ? Math.min(...updatedAts) : undefined;
			const cursor = page.cursor?.previous ?? undefined;
			// A message is never sent after its last update, so no older page holds a message inside the depth limit.
			const reachedDepth = oldestSendTime !== undefined && oldest !== undefined && oldest < oldestSendTime;
			const done = !cursor || page.updated.length === 0 || reachedDepth;

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
				cursor: `${state.lastUpdate}`,
				newestUpdate: state.lastUpdate,
			};
			const page = await syncMessages({ roomId: rid, type: catchUp.type, count: pageSize, next: catchUp.cursor });

			let indexed = 0;
			let { newestUpdate } = catchUp;
			const deletedIds = page.deleted.map(({ _id }) => _id);
			if (catchUp.type === 'UPDATED') {
				indexed = await decryptAll(page.updated);
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
				catchUps.set(rid, { ...catchUp, type: 'DELETED', cursor: `${catchUp.from}`, newestUpdate });
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
		},
	};
};

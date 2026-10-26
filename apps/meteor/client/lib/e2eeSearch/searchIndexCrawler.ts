import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import type { SearchIndexWriter } from './searchIndexWriter';

/** The `chat.syncMessages` query params that the crawler sends: a catch-up (`lastUpdate`) or a backfill page (`previous`). */
export type SyncMessagesParams = { roomId: string; lastUpdate?: string; type?: 'UPDATED'; count?: number; previous?: string };

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
	/** Messages per backfill page. */
	pageSize?: number;
	/** The depth limit: the backfill stops at the first page that reaches a message older than this. */
	maxAgeMs?: number;
};

export type SearchIndexCrawler = {
	/** Indexes the next older page of the room and saves the cursor, so a restart continues from there. */
	backfillRoomPage(rid: string): Promise<{ done: boolean; indexed: number }>;
	/** Applies the changes since the room's `lastUpdate`: removes deleted messages and indexes new and edited ones. */
	catchUpRoom(rid: string): Promise<{ indexed: number; removed: number }>;
	/** The messages of the room that the crawler could not decrypt (room key missing), to retry when the key arrives. */
	getPendingDecrypt(rid: string): IMessage[];
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
	pageSize = 100,
	maxAgeMs,
}: SearchIndexCrawlerOptions): SearchIndexCrawler => {
	const pendingDecrypt = new Map<string, Map<string, IMessage>>();

	const decryptAll = async (rid: string, messages: IMessage[]): Promise<number> => {
		let indexed = 0;
		for (const message of messages) {
			const decrypted = await decryptMessage(message);
			if (!isE2EEMessage(decrypted)) continue;

			const pending = pendingDecrypt.get(rid);
			if (decrypted.e2e !== 'done') {
				if (pending) pending.set(message._id, message);
				else pendingDecrypt.set(rid, new Map([[message._id, message]]));
				continue;
			}
			pending?.delete(message._id);
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

			const indexed = await decryptAll(rid, page.updated);

			const updatedAts = page.updated.map(updatedAtOf);
			const oldest = updatedAts.length ? Math.min(...updatedAts) : undefined;
			const cursor = page.cursor?.previous ?? undefined;
			const reachedDepth = maxAgeMs !== undefined && oldest !== undefined && oldest < now() - maxAgeMs;
			const done = !cursor || page.updated.length === 0 || reachedDepth;

			const lastUpdate = state.lastUpdate ?? (updatedAts.length ? Math.max(...updatedAts) : startedAt);

			await backend.setRoomState(rid, {
				lastUpdate,
				...(!done && { backfillCursor: cursor }),
				backfillDone: done,
			});

			return { done, indexed };
		},

		async catchUpRoom(rid) {
			const state = await backend.getRoomState(rid);
			if (state?.lastUpdate === undefined) return { indexed: 0, removed: 0 };

			const page = await syncMessages({ roomId: rid, lastUpdate: new Date(state.lastUpdate).toISOString() });

			const deletedIds = page.deleted.map(({ _id }) => _id);
			if (deletedIds.length) {
				await writer.remove(deletedIds);
				const pending = pendingDecrypt.get(rid);
				for (const id of deletedIds) pending?.delete(id);
			}

			const indexed = await decryptAll(rid, page.updated);

			const lastUpdate = Math.max(
				state.lastUpdate,
				...page.updated.map(updatedAtOf),
				...page.deleted.map(({ _deletedAt }) => new Date(_deletedAt).getTime()),
			);
			await backend.setRoomState(rid, { ...state, lastUpdate });

			return { indexed, removed: deletedIds.length };
		},

		getPendingDecrypt(rid) {
			return [...(pendingDecrypt.get(rid)?.values() ?? [])];
		},
	};
};

import { isE2EEMessage } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import type { SearchIndexWriter } from './searchIndexWriter';
import { isDecryptFailed, isDeletionPlaceholder } from './toSearchDoc';

export type SyncMessagesParams = { roomId: string; type: 'UPDATED' | 'DELETED'; count: number } & (
	{ next: string; previous?: never } | { previous: string; next?: never }
);

export type SyncMessagesPage = {
	updated: IMessage[];
	deleted: { _id: string; _deletedAt: string | Date }[];
	cursor?: { next: string | null; previous: string | null };
};

type SearchIndexCrawlerOptions = {
	backend: Pick<ISearchIndexBackend, 'getRoomState' | 'setRoomState'>;
	syncMessages: (params: SyncMessagesParams) => Promise<SyncMessagesPage>;
	/** Queue successful decryptions for the writer before this promise resolves. */
	decryptMessage: (message: IMessage) => Promise<IMessage>;
	writer: Pick<SearchIndexWriter, 'remove' | 'flush'>;
	now?: () => number;
	pageSize?: number;
	maxAgeMs?: number;
	/** Limit each room's backfill for this crawler instance. Catch-up has no message limit. */
	maxBackfillMessagesPerRoom?: number;
	maxPending?: number;
};

const DEFAULT_MAX_PENDING = 5000;
export const DEFAULT_PAGE_SIZE = 100;

type PageOptions = { waitForKey?: boolean };

export type SearchIndexCrawler = {
	backfillRoomPage(rid: string, options?: PageOptions): Promise<{ done: boolean; indexed: number; waitingForKey?: true }>;
	catchUpRoomPage(rid: string, options?: PageOptions): Promise<{ done: boolean; indexed: number; removed: number; waitingForKey?: true }>;
	retryPendingDecrypt(rid: string): Promise<{ indexed: number }>;
	/** Keep the encrypted original, not a failed decryption result. */
	addPendingDecrypt(message: IMessage): void;
	getPendingDecrypt(rid: string): IMessage[];
	forgetRoom(rid: string): void;
};

type CatchUp = { type: 'UPDATED' | 'DELETED'; from: number; cursor: string; newestUpdate: number };

const COMPOUND_CURSOR_SEPARATOR = '_';
const previousCursorAt = (ms: number | string): string => `${ms}${COMPOUND_CURSOR_SEPARATOR}`;
const nextCursorFrom = (ms: number): string => `${ms}${COMPOUND_CURSOR_SEPARATOR}`;
const toCompoundPreviousCursor = (cursor: string | number): string => {
	const saved = `${cursor}`;
	return saved.includes(COMPOUND_CURSOR_SEPARATOR) ? saved : previousCursorAt(saved);
};
const updatedAtOf = (message: IMessage): number => new Date(message._updatedAt).getTime();

/** Save progress only after document writes succeed. Keep a failed page available for retry. */
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
	const pendingDecrypt = new Map<string, IMessage>();
	const catchUps = new Map<string, CatchUp>();
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

	const decryptAll = async (
		messages: IMessage[],
		counts: (message: IMessage) => boolean = () => true,
	): Promise<{ indexed: number; noneDecrypted: boolean }> => {
		let indexed = 0;
		let encrypted = 0;
		let failed = 0;
		const decryptedMessages: IMessage[] = [];
		for (const message of messages) {
			const decrypted = await decryptMessage(message);
			if (!isE2EEMessage(decrypted)) continue;
			encrypted++;
			if (decrypted.e2e !== 'done' || isDecryptFailed(decrypted)) {
				failed++;
				keepPending(message);
				continue;
			}
			decryptedMessages.push(message);
			if (counts(message)) indexed++;
		}
		await writer.flush({ throwOnError: true });
		for (const message of decryptedMessages) {
			const pending = pendingDecrypt.get(message._id);
			if (pending && !(updatedAtOf(pending) > updatedAtOf(message))) pendingDecrypt.delete(message._id);
		}
		return { indexed, noneDecrypted: encrypted > 0 && failed === encrypted };
	};

	const removeDeletionPlaceholders = async (messages: IMessage[]): Promise<number> => {
		const ids = messages.filter(isDeletionPlaceholder).map(({ _id }) => _id);
		if (!ids.length) return 0;
		await writer.remove(ids, { throwOnError: true });
		for (const id of ids) pendingDecrypt.delete(id);
		return ids.length;
	};

	return {
		async backfillRoomPage(rid, { waitForKey = false } = {}) {
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

			await removeDeletionPlaceholders(page.updated);
			const oldestSendTime = oldestSendTimeAt(startedAt);
			const inDepth = page.updated.filter((message) => isInDepth(message, oldestSendTime));
			const { indexed, noneDecrypted } = await decryptAll(inDepth.filter((message) => !isDeletionPlaceholder(message)));
			if (waitForKey && noneDecrypted) return { done: false, indexed, waitingForKey: true };
			const reachedLimit = maxBackfillMessagesPerRoom !== undefined && counted + inDepth.length >= maxBackfillMessagesPerRoom;
			const updatedAts = page.updated.map(updatedAtOf);
			const oldest = updatedAts.length ? Math.min(...updatedAts) : undefined;
			const cursor = page.cursor?.previous ?? undefined;
			const reachedDepth = oldestSendTime !== undefined && oldest !== undefined && oldest < oldestSendTime;
			const done = !cursor || page.updated.length === 0 || reachedDepth || reachedLimit;
			const lastUpdate = state.lastUpdate ?? (updatedAts.length ? Math.max(...updatedAts) : 0);

			await backend.setRoomState(rid, {
				lastUpdate,
				...(!done && { backfillCursor: cursor }),
				backfillDone: done,
			});
			backfilled.set(rid, counted + inDepth.length);
			return { done, indexed };
		},

		async catchUpRoomPage(rid, { waitForKey = false } = {}) {
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
			let removed = 0;
			let { newestUpdate } = catchUp;
			const deletedIds = page.deleted.map(({ _id }) => _id);
			if (catchUp.type === 'UPDATED') {
				removed = await removeDeletionPlaceholders(page.updated);
				const oldestSendTime = oldestSendTimeAt(now());
				const outOfDepth = page.updated
					.filter((message) => !isDeletionPlaceholder(message) && !isInDepth(message, oldestSendTime))
					.map(({ _id }) => _id);
				if (outOfDepth.length) {
					await writer.remove(outOfDepth, { deleted: false, throwOnError: true });
					for (const id of outOfDepth) pendingDecrypt.delete(id);
				}
				const isNew = (message: IMessage) => updatedAtOf(message) !== catchUp.from;
				const decrypted = await decryptAll(
					page.updated.filter((message) => !isDeletionPlaceholder(message) && isInDepth(message, oldestSendTime)),
					isNew,
				);
				if (waitForKey && decrypted.noneDecrypted) return { done: false, indexed: decrypted.indexed, removed, waitingForKey: true };
				indexed = decrypted.indexed;
				newestUpdate = Math.max(newestUpdate, ...page.updated.map(updatedAtOf));
			} else if (deletedIds.length) {
				await writer.remove(deletedIds, { throwOnError: true });
				for (const id of deletedIds) pendingDecrypt.delete(id);
				removed = deletedIds.length;
			}

			const result = { indexed, removed };
			const next = page.cursor?.next;
			if (next) {
				catchUps.set(rid, { ...catchUp, cursor: next, newestUpdate });
				return { done: false, ...result };
			}
			if (catchUp.type === 'UPDATED') {
				catchUps.set(rid, { ...catchUp, type: 'DELETED', cursor: nextCursorFrom(catchUp.from), newestUpdate });
				return { done: false, ...result };
			}

			catchUps.delete(rid);
			const latest = (await backend.getRoomState(rid)) ?? state;
			await backend.setRoomState(rid, { ...latest, lastUpdate: newestUpdate });
			return { done: true, ...result };
		},

		async retryPendingDecrypt(rid) {
			const pending = pendingOf(rid);
			if (!pending.length) return { indexed: 0 };
			return { indexed: (await decryptAll(pending)).indexed };
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

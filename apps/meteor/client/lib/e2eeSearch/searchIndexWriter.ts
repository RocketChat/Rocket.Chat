import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchDoc, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { toSearchDoc } from './toSearchDoc';

/** The most documents that the desktop index accepts in one `upsert` call (`MAX_BATCH_SIZE` in the desktop `validate.ts`). */
const MAX_DOCS_PER_CALL = 500;

/** The most body characters that the desktop index accepts in one `upsert` call (`MAX_BATCH_BODY_LENGTH`). */
const MAX_BODY_LENGTH_PER_CALL = 2 * 1024 * 1024;

/** How many deleted message ids the writer remembers, so a decrypt that ends after the delete does not index the message again. */
const MAX_DELETED_IDS = 5000;

type SearchIndexWriterOptions = {
	/** The backend of the open index, or `undefined` when no index is open (before E2EE unlock, after a logout). */
	getBackend: () => ISearchIndexBackend | undefined;
	/** How long the writer collects documents before it sends them in one call. */
	delayMs?: number;
	onError?: (error: unknown) => void;
};

export type SearchIndexWriter = {
	/** Queues the search document of a decrypted E2EE message. Other messages are ignored. */
	index(message: IMessage): void;
	/**
	 * Removes messages from the index and from the queue. The remove runs after the calls that are in flight. A deleted
	 * message (the default) is never indexed again. Use `{ deleted: false }` when the message stays and only its document
	 * must go (for example, its files were pruned and it is not loaded to index again).
	 */
	remove(ids: string[], options?: { deleted?: boolean }): Promise<void>;
	/** Sends the queued documents now. */
	flush(): Promise<void>;
	dispose(): void;
};

const toCalls = (docs: E2EESearchDoc[]): E2EESearchDoc[][] => {
	const calls: E2EESearchDoc[][] = [];
	let current: E2EESearchDoc[] = [];
	let bodyLength = 0;

	for (const doc of docs) {
		if (current.length === MAX_DOCS_PER_CALL || bodyLength + doc.body.length > MAX_BODY_LENGTH_PER_CALL) {
			calls.push(current);
			current = [];
			bodyLength = 0;
		}
		current.push(doc);
		bodyLength += doc.body.length;
	}

	if (current.length) calls.push(current);
	return calls;
};

/**
 * Collects the search documents of decrypted messages and sends them to the open local index in batches. The queue
 * belongs to the index that was open when it started: when that index closes (logout) or another user's index opens,
 * the queued documents are dropped, so one user's words never reach another user's index.
 */
export const createSearchIndexWriter = ({
	getBackend,
	delayMs = 500,
	onError = () => undefined,
}: SearchIndexWriterOptions): SearchIndexWriter => {
	let queue = new Map<string, E2EESearchDoc>();
	let queueBackend: ISearchIndexBackend | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let deletedIds = new Set<string>();
	/** Upserts and removes run one after the other, so a remove never lands before an upsert of the same message. */
	let calls: Promise<void> = Promise.resolve();

	const enqueue = (call: () => Promise<void>): Promise<void> => {
		calls = calls.then(call, call);
		return calls;
	};

	const rememberDeleted = (ids: string[]) => {
		for (const id of ids) {
			deletedIds.delete(id);
			deletedIds.add(id);
		}
		if (deletedIds.size > MAX_DELETED_IDS) {
			deletedIds = new Set([...deletedIds].slice(-MAX_DELETED_IDS));
		}
	};

	const clearTimer = () => {
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
	};

	const flush = () => {
		clearTimer();
		const backend = queueBackend;
		const docs = [...queue.values()];
		queue = new Map();
		queueBackend = undefined;

		if (!backend || docs.length === 0) return calls;

		return enqueue(async () => {
			for (const call of toCalls(docs)) {
				if (getBackend() !== backend) return;
				try {
					await backend.upsert(call);
				} catch (error) {
					onError(error);
				}
			}
		});
	};

	const remove = (ids: string[], { deleted = true }: { deleted?: boolean } = {}) => {
		if (deleted) rememberDeleted(ids);

		const backend = getBackend();
		if (!backend || ids.length === 0) return calls;

		if (queueBackend === backend) {
			ids.forEach((id) => queue.delete(id));
		}

		return enqueue(async () => {
			for (let start = 0; start < ids.length; start += MAX_DOCS_PER_CALL) {
				if (getBackend() !== backend) return;
				try {
					await backend.remove(ids.slice(start, start + MAX_DOCS_PER_CALL));
				} catch (error) {
					onError(error);
				}
			}
		});
	};

	return {
		index(message) {
			const backend = getBackend();
			if (!backend) return;

			const doc = toSearchDoc(message);
			if (!doc || deletedIds.has(doc.id)) return;

			if (queueBackend !== backend) {
				queue = new Map();
				queueBackend = backend;
			}

			queue.delete(doc.id);
			queue.set(doc.id, doc);

			if (timer === undefined) {
				timer = setTimeout(() => void flush(), delayMs);
			}
		},
		flush,
		remove,
		dispose() {
			clearTimer();
			queue = new Map();
			queueBackend = undefined;
			deletedIds = new Set();
		},
	};
};

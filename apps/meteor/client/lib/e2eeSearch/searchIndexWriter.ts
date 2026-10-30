import type { IMessage } from '@rocket.chat/core-typings';
import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';
import type { E2EESearchDoc, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { cutSearchDocBody, isDecryptFailed, isDeletionPlaceholder, toSearchDoc } from './toSearchDoc';

type SearchIndexWriterOptions = {
	/** Return a distinct backend object for each open session, or undefined when access is unavailable. */
	getBackend: () => ISearchIndexBackend | undefined;
	delayMs?: number;
	onError?: (error: unknown) => void;
	onWarn?: (message: string) => void;
	isRoomSubscribed?: (rid: string) => boolean;
};

export type SearchIndexWriter = {
	index(message: IMessage): void;
	/** Capture ownership before an asynchronous decrypt starts. */
	bindToOpenIndex(): (message: IMessage) => void;
	/** Use `deleted: false` when only the document, not the message, must be removed. */
	remove(ids: string[], options?: { deleted?: boolean; throwOnError?: boolean }): Promise<void>;
	/** With throwOnError, report the active backend's first unreported mutation failure. */
	flush(options?: { throwOnError?: boolean }): Promise<void>;
	subscribe(listener: () => void): () => void;
	getVersion(): number;
	dispose(): void;
};

const isDecryptedE2EEMessage = (message: IMessage): boolean => message.t === 'e2e' && message.e2e === 'done' && !isDecryptFailed(message);

const toCalls = (docs: E2EESearchDoc[]): E2EESearchDoc[][] => {
	const calls: E2EESearchDoc[][] = [];
	let current: E2EESearchDoc[] = [];
	let bodyLength = 0;

	for (const doc of docs) {
		if (
			current.length === E2EE_SEARCH_LIMITS.maxBatchDocuments ||
			bodyLength + doc.body.length > E2EE_SEARCH_LIMITS.maxBatchBodyCodeUnits
		) {
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

/** Batch mutations without transferring queued work to another open backend. */
export const createSearchIndexWriter = ({
	getBackend,
	delayMs = 500,
	onError = () => undefined,
	onWarn = () => undefined,
	isRoomSubscribed = () => true,
}: SearchIndexWriterOptions): SearchIndexWriter => {
	let queue = new Map<string, E2EESearchDoc>();
	let queueBackend: ISearchIndexBackend | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;
	let deletedIds = new WeakMap<ISearchIndexBackend, Set<string>>();
	let calls: Promise<void> = Promise.resolve();
	let version = 0;
	let disposed = false;
	let unreportedFailure: { error: unknown; backend: ISearchIndexBackend } | undefined;
	const listeners = new Set<() => void>();

	const isActive = (backend: ISearchIndexBackend) => !disposed && getBackend() === backend;
	const isDeleted = (backend: ISearchIndexBackend, id: string) => deletedIds.get(backend)?.has(id) === true;

	const changed = () => {
		version++;
		for (const listener of [...listeners]) listener();
	};

	const enqueue = (call: () => Promise<void>): Promise<void> => {
		calls = calls.then(call, call);
		return calls;
	};

	const clearTimer = () => {
		if (timer !== undefined) clearTimeout(timer);
		timer = undefined;
	};

	const upsert = async (backend: ISearchIndexBackend, docs: E2EESearchDoc[]): Promise<void> => {
		if (!isActive(backend)) return;
		docs = docs.filter((doc) => !isDeleted(backend, doc.id) && isRoomSubscribed(doc.rid));
		if (docs.length === 0) return;
		try {
			await backend.upsert(docs);
		} catch {
			if (!isActive(backend)) return;

			if (docs.length > 1) {
				onWarn(`The index rejected ${docs.length} documents. Retry each half.`);
				const half = Math.ceil(docs.length / 2);
				await upsert(backend, docs.slice(0, half));
				await upsert(backend, docs.slice(half));
				return;
			}

			const [doc] = docs;
			if (isDeleted(backend, doc.id) || !isRoomSubscribed(doc.rid)) return;
			const body = cutSearchDocBody(doc.body, Math.floor(doc.body.length / 2));
			onWarn(`The index rejected document ${doc.id}. Retry with ${body.length} body code units instead of ${doc.body.length}.`);
			try {
				await backend.upsert([{ ...doc, body }]);
			} catch (retryError) {
				if (!isActive(backend)) return;
				onWarn(`The index rejected document ${doc.id} again. The document is not indexed.`);
				if (unreportedFailure?.backend !== backend) unreportedFailure = { error: retryError, backend };
				onError(retryError);
			}
		}
	};

	const flush = ({ throwOnError = false }: { throwOnError?: boolean } = {}) => {
		clearTimer();
		const activeBackend = getBackend();
		const backend = queueBackend;
		const docs = [...queue.values()];
		queue = new Map();
		queueBackend = undefined;

		const flushing =
			!backend || docs.length === 0
				? calls
				: enqueue(async () => {
						for (const call of toCalls(docs)) {
							await upsert(backend, call);
						}
						if (isActive(backend)) changed();
					});
		if (!throwOnError) return flushing;
		return flushing.then(() => {
			const failure = unreportedFailure;
			unreportedFailure = undefined;
			if (failure && failure.backend === activeBackend && isActive(failure.backend)) throw failure.error;
		});
	};

	const remove = (ids: string[], { deleted = true, throwOnError = false }: { deleted?: boolean; throwOnError?: boolean } = {}) => {
		const backend = getBackend();
		if (!backend || !isActive(backend) || ids.length === 0) return calls;
		ids = [...ids];

		if (deleted) {
			const tombstones = deletedIds.get(backend) ?? new Set<string>();
			ids.forEach((id) => tombstones.add(id));
			deletedIds.set(backend, tombstones);
		}
		if (queueBackend === backend) {
			ids.forEach((id) => queue.delete(id));
		}

		let failure: { error: unknown } | undefined;
		const removing = enqueue(async () => {
			for (let start = 0; start < ids.length; start += E2EE_SEARCH_LIMITS.maxBatchDocuments) {
				if (!isActive(backend)) return;
				try {
					await backend.remove(ids.slice(start, start + E2EE_SEARCH_LIMITS.maxBatchDocuments));
				} catch (error) {
					if (!isActive(backend)) return;
					failure ??= { error };
					if (!throwOnError && unreportedFailure?.backend !== backend) unreportedFailure = { error, backend };
					onError(error);
				}
			}
			if (isActive(backend)) changed();
		});
		if (!throwOnError) return removing;
		return removing.then(() => {
			if (failure && isActive(backend)) throw failure.error;
		});
	};

	const index = (message: IMessage, backend: ISearchIndexBackend | undefined) => {
		if (!backend || !isActive(backend)) return;

		if (isDeletionPlaceholder(message)) {
			if (message._id && !isDeleted(backend, message._id)) void remove([message._id]);
			return;
		}

		const doc = toSearchDoc(message);
		if (!doc) {
			if (message._id && isDecryptedE2EEMessage(message)) void remove([message._id], { deleted: false });
			return;
		}
		if (isDeleted(backend, doc.id) || !isRoomSubscribed(doc.rid)) return;

		if (queueBackend !== backend) {
			queue = new Map();
			queueBackend = backend;
		}
		queue.delete(doc.id);
		queue.set(doc.id, doc);

		if (timer === undefined) {
			timer = setTimeout(() => void flush(), delayMs);
		}
	};

	return {
		index: (message) => index(message, getBackend()),
		bindToOpenIndex() {
			const backend = getBackend();
			return (message) => index(message, backend);
		},
		flush,
		remove,
		subscribe(listener) {
			if (!disposed) listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		getVersion: () => version,
		dispose() {
			disposed = true;
			clearTimer();
			queue = new Map();
			queueBackend = undefined;
			deletedIds = new WeakMap();
			unreportedFailure = undefined;
			listeners.clear();
		},
	};
};

import { create } from 'zustand';

export interface IDocumentMapStore<T extends { _id: string }> {
	readonly records: ReadonlyMap<T['_id'], T>;
	/**
	 * Checks if a document with the given _id exists in the store.
	 *
	 * @param _id - The _id of the document to check.
	 * @returns true if the document exists, false otherwise.
	 */
	has(_id: T['_id']): boolean;
	/**
	 * Retrieves a document by its _id.
	 *
	 * @param _id - The _id of the document to retrieve.
	 * @returns The document if found, or undefined if not found.
	 */
	get(_id: T['_id']): T | undefined;
	/**
	 * Checks if any document in the store satisfies the given predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @returns true if at least one document matches the predicate, false otherwise.
	 */
	some(predicate: (record: T) => boolean): boolean;
	/**
	 * Finds a document that satisfies the given predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @returns The first document that matches the predicate, or undefined if no document matches.
	 */
	find<U extends T>(predicate: (record: T) => record is U): U | undefined;
	/**
	 * Finds a document that satisfies the given predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @returns The first document that matches the predicate, or undefined if no document matches.
	 */
	find(predicate: (record: T) => boolean): T | undefined;
	/**
	 * Finds the first document that satisfies the given predicate, using a comparator to determine the best match.
	 *
	 * Usually the "best" document is the first of a ordered set, but it can be any criteria defined by the comparator.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @param comparator - A function that compares two documents and returns a negative number if the first is better, zero if they are equal, or a positive number if the second is better.
	 * @returns The best matching document according to the predicate and comparator, or undefined if no document matches.
	 */
	findFirst<U extends T>(predicate: (record: T) => record is U, comparator: (a: T, b: T) => number): U | undefined;
	/**
	 * Finds the first document that satisfies the given predicate, using a comparator to determine the best match.
	 *
	 * Usually the "best" document is the first of a ordered set, but it can be any criteria defined by the comparator.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @param comparator - A function that compares two documents and returns a negative number if the first is better, zero if they are equal, or a positive number if the second is better.
	 * @returns The best matching document according to the predicate and comparator, or undefined if no document matches.
	 */
	findFirst(predicate: (record: T) => boolean, comparator: (a: T, b: T) => number): T | undefined;
	/**
	 * Filters documents in the store based on a predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @returns An array of documents that match the predicate.
	 */
	filter<U extends T>(predicate: (record: T) => record is U): U[];
	/**
	 * Filters documents in the store based on a predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @returns An array of documents that match the predicate.
	 */
	filter(predicate: (record: T) => boolean): T[];
	/**
	 * Creates an index of documents by a specified key.
	 *
	 * @param key - The key to index the documents by.
	 * @returns A Map where the keys are the values of the specified key in the documents, and the values are the documents themselves.
	 */
	indexBy<TKey extends keyof T>(key: TKey): ReadonlyMap<T[TKey], T>;
	/**
	 * Replaces all documents in the store with the provided records.
	 *
	 * @param records - An array of documents to replace the current records in the store.
	 */
	replaceAll(records: T[]): void;
	/**
	 * Stores a single document in the store.
	 *
	 * @param doc - The document to store.
	 */
	store(doc: T): void;
	/**
	 * Stores multiple documents in the store.
	 *
	 * @param docs - An iterable of documents to store.
	 */
	storeMany(docs: Iterable<T>): void;
	/**
	 * Deletes a document from the store by its _id.
	 *
	 * @param _id - The _id of the document to delete.
	 */
	delete(_id: T['_id']): void;
	/**
	 * Updates documents in the store that match a predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @param modifier - A function that takes a document and returns the modified document.
	 * @returns void
	 */
	update<U extends T>(predicate: (record: T) => record is U, modifier: (record: U) => U): void;
	/**
	 * Updates documents in the store that match a predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @param modifier - A function that takes a document and returns the modified document.
	 * @returns void
	 */
	update(predicate: (record: T) => boolean, modifier: (record: T) => T): void;
	/**
	 * Asynchronously updates documents in the store that match a predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @param modifier - A function that takes a document and returns a Promise that resolves to the modified document.
	 * @returns void
	 */
	updateAsync<U extends T>(predicate: (record: T) => record is U, modifier: (record: U) => Promise<U>): Promise<void>;
	/**
	 * Asynchronously updates documents in the store that match a predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 * @param modifier - A function that takes a document and returns a Promise that resolves to the modified document.
	 * @returns void
	 */
	updateAsync(predicate: (record: T) => boolean, modifier: (record: T) => Promise<T>): Promise<void>;
	/**
	 * Removes documents from the store that match a predicate.
	 *
	 * @param predicate - A function that takes a document and returns true if it matches the condition.
	 */
	remove(predicate: (record: T) => boolean): void;
	count(predicate: (record: T) => boolean): number;
}

/**
 * Factory function to create a Zustand store that holds a map of documents.
 *
 * @param options - Optional callbacks to handle invalidation of documents.
 * @returns the Zustand store with methods to manage the document map.
 */
export const createDocumentMapStore = <T extends { _id: string }>({
	onInvalidate,
	onInvalidateAll,
}: {
	/**
	 * Callback invoked when a document is stored, updated or deleted.
	 *
	 * This is useful to recompute Minimongo queries that depend on the changed documents.
	 * @deprecated prefer subscribing to the store
	 */
	onInvalidate?: (...docs: T[]) => void;
	/**
	 * Callback invoked when all documents are replaced in the store.
	 *
	 * This is useful to recompute Minimongo queries that depend on the changed documents.
	 * @deprecated prefer subscribing to the store
	 */
	onInvalidateAll?: () => void;
} = {}) =>
	create<IDocumentMapStore<T>>()((set, get) => ({
		records: new Map(),
		has: (id: T['_id']) => get().records.has(id),
		get: (id: T['_id']) => get().records.get(id),
		some: (predicate: (record: T) => boolean) => {
			for (const record of get().records.values()) {
				if (predicate(record)) return true;
			}
			return false;
		},
		find: (predicate: (record: T) => boolean) => {
			for (const record of get().records.values()) {
				if (predicate(record)) return record;
			}
			return undefined;
		},
		findFirst: (predicate: (record: T) => boolean, comparator: (a: T, b: T) => number) => {
			let best: T | undefined;
			for (const record of get().records.values()) {
				if (!predicate(record)) continue;
				if (best === undefined || comparator(record, best) < 0) {
					best = record;
				}
			}
			return best;
		},
		filter: (predicate: (record: T) => boolean) => {
			const results: T[] = [];
			for (const record of get().records.values()) {
				if (predicate(record)) {
					results.push(record);
				}
			}
			return results;
		},
		indexBy: <TKey extends keyof T>(key: TKey) => {
			const index = new Map<T[TKey], T>();

			for (const record of get().records.values()) {
				const keyValue = record[key];
				index.set(keyValue, record);
			}

			return index;
		},
		replaceAll: (records: T[]) => {
			set({ records: new Map(records.map((record) => [record._id, record])) });
			onInvalidateAll?.();
		},
		store: (doc) => {
			set((state) => ({ records: new Map(state.records).set(doc._id, doc) }));
			onInvalidate?.(doc);
		},
		storeMany: (docs) => {
			set((state) => {
				const records = new Map(state.records);

				for (const doc of docs) {
					records.set(doc._id, doc);
				}

				return { records };
			});
			onInvalidate?.(...docs);
		},
		delete: (_id) => {
			const affected: T[] = [];
			set((state) => {
				const records = new Map(state.records);
				if (onInvalidate) affected.push(state.records.get(_id)!);
				records.delete(_id);
				return { records };
			});
			onInvalidate?.(...affected);
		},
		update: (predicate: (record: T) => boolean, modifier: (record: T) => T) => {
			const affected: T[] = [];

			set((state) => {
				const records = new Map<T['_id'], T>();
				for (const record of state.records.values()) {
					if (predicate(record)) {
						if (onInvalidate) affected.push(record);
						records.set(record._id, modifier(record));
					} else {
						records.set(record._id, record);
					}
				}

				return { records };
			});
			onInvalidate?.(...affected);
		},
		updateAsync: async (predicate: (record: T) => boolean, modifier: (record: T) => Promise<T>) => {
			const affected: T[] = [];

			const records = new Map<T['_id'], T>();

			for await (const record of get().records.values()) {
				if (predicate(record)) {
					if (onInvalidate) affected.push(record);
					records.set(record._id, await modifier(record));
				} else {
					records.set(record._id, record);
				}
			}

			set({ records });
			onInvalidate?.(...affected);
		},
		remove: (predicate: (record: T) => boolean) => {
			const affected: T[] = [];

			set((state) => {
				const records = new Map<T['_id'], T>();
				for (const record of state.records.values()) {
					if (predicate(record)) {
						if (onInvalidate) affected.push(record);
						continue;
					}
					records.set(record._id, record);
				}

				return { records };
			});
			onInvalidate?.(...affected);
		},
		count: (predicate: (record: T) => boolean) => {
			let results = 0;
			for (const record of get().records.values()) {
				if (predicate(record)) {
					results += 1;
				}
			}
			return results;
		},
	}));

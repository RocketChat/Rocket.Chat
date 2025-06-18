import { create } from 'zustand';

export interface IDocumentMapStore<T extends { _id: string }> {
	readonly records: ReadonlyMap<T['_id'], T>;
	has(_id: T['_id']): boolean;
	get(_id: T['_id']): T | undefined;
	some(predicate: (record: T) => boolean): boolean;
	find<U extends T>(predicate: (record: T) => record is U): U | undefined;
	find(predicate: (record: T) => boolean): T | undefined;
	findFirst<U extends T>(predicate: (record: T) => record is U, comparator: (a: T, b: T) => number): U | undefined;
	findFirst(predicate: (record: T) => boolean, comparator: (a: T, b: T) => number): T | undefined;
	filter<U extends T>(predicate: (record: T) => record is U): U[];
	filter(predicate: (record: T) => boolean): T[];
	indexBy<TKey extends keyof T>(key: TKey): Map<T[TKey], T>;
	replaceAll(records: T[]): void;
	store(doc: T): void;
	storeMany(docs: Iterable<T>): void;
	delete(_id: T['_id']): void;
	update<U extends T>(predicate: (record: T) => record is U, modifier: (record: U) => U): void;
	update(predicate: (record: T) => boolean, modifier: (record: T) => T): void;
	updateAsync<U extends T>(predicate: (record: T) => record is U, modifier: (record: U) => Promise<U>): Promise<void>;
	updateAsync(predicate: (record: T) => boolean, modifier: (record: T) => Promise<T>): Promise<void>;
	remove(predicate: (record: T) => boolean): void;
}

export const createDocumentMapStore = <T extends { _id: string }>({
	onInvalidate,
	onInvalidateAll,
}: { onInvalidate?: (...docs: T[]) => void; onInvalidateAll?: () => void } = {}) =>
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
	}));

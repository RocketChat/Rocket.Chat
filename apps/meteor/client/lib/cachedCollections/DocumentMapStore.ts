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

export const createDocumentMapStore = <T extends { _id: string }>({ onMutate }: { onMutate?: () => void } = {}) =>
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
		replaceAll: (records: T[]) => {
			set({ records: new Map(records.map((record) => [record._id, record])) });
			onMutate?.();
		},
		store: (doc) => {
			set((state) => ({ records: new Map(state.records).set(doc._id, doc) }));
			onMutate?.();
		},
		storeMany: (docs) => {
			set((state) => {
				const records = new Map(state.records);

				for (const doc of docs) {
					records.set(doc._id, doc);
				}

				return { records };
			});
			onMutate?.();
		},
		delete: (_id) => {
			set((state) => {
				const records = new Map(state.records);
				records.delete(_id);
				return { records };
			});
			onMutate?.();
		},
		update: (predicate: (record: T) => boolean, modifier: (record: T) => T) => {
			set((state) => {
				const records = new Map<T['_id'], T>();
				for (const record of state.records.values()) {
					records.set(record._id, predicate(record) ? modifier(record) : record);
				}

				return { records };
			});
			onMutate?.();
		},
		updateAsync: async (predicate: (record: T) => boolean, modifier: (record: T) => Promise<T>) => {
			const records = new Map<T['_id'], T>();

			for await (const record of get().records.values()) {
				records.set(record._id, predicate(record) ? await modifier(record) : record);
			}

			set({ records });
			onMutate?.();
		},
		remove: (predicate: (record: T) => boolean) => {
			set((state) => {
				const records = new Map<T['_id'], T>();
				for (const record of state.records.values()) {
					if (predicate(record)) continue;
					records.set(record._id, record);
				}

				return { records };
			});
			onMutate?.();
		},
	}));

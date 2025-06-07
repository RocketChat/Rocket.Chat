import { create } from 'zustand';

export interface IDocumentMapStore<T extends { _id: string }> {
	readonly records: readonly T[];
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
		records: [],
		has: (id: T['_id']) => get().records.some((record) => record._id === id),
		get: (id: T['_id']) => get().records.find((record) => record._id === id),
		some: (predicate: (record: T) => boolean) => get().records.some(predicate),
		find: (predicate: (record: T) => boolean) => get().records.find(predicate),
		findFirst: (predicate: (record: T) => boolean, comparator: (a: T, b: T) => number) =>
			get().records.filter(predicate).sort(comparator)[0], // TODO: optimize this
		filter: (predicate: (record: T) => boolean) => get().records.filter(predicate),
		replaceAll: (records: T[]) => {
			set({ records: records.map<T>(Object.freeze) });
			onMutate?.();
		},
		store: (doc) => {
			set((state) => {
				const records = [...state.records];
				const index = records.findIndex((r) => r._id === doc._id);
				if (index !== -1) {
					records[index] = Object.freeze(doc);
				} else {
					records.push(Object.freeze(doc));
				}
				return { records };
			});
			onMutate?.();
		},
		storeMany: (docs) => {
			const records = [...get().records];

			for (const doc of docs) {
				const index = records.findIndex((r) => r._id === doc._id);
				if (index !== -1) {
					records[index] = Object.freeze(doc);
				} else {
					records.push(Object.freeze(doc));
				}
			}
			set({ records });
			onMutate?.();
		},
		delete: (_id) => {
			set((state) => {
				const records = state.records.filter((r) => r._id !== _id);
				return { records };
			});
			onMutate?.();
		},
		update: (predicate: (record: T) => boolean, modifier: (record: T) => T) => {
			set({
				records: get().records.map((record) => (predicate(record) ? modifier(record) : record)),
			});
			onMutate?.();
		},
		updateAsync: async (predicate: (record: T) => boolean, modifier: (record: T) => Promise<T>) => {
			set({
				records: await Promise.all(get().records.map((record) => (predicate(record) ? modifier(record) : record))),
			});
			onMutate?.();
		},
		remove: (predicate: (record: T) => boolean) => {
			set((state) => {
				const records = state.records.filter((record) => !predicate(record));
				return { records };
			});
			onMutate?.();
		},
	}));

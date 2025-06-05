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

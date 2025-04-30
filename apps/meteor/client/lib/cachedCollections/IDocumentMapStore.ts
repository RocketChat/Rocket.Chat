export interface IDocumentMapStore<T extends { _id: string }> {
	readonly records: readonly T[];
	has(_id: T['_id']): boolean;
	get(_id: T['_id']): T | undefined;
	find<U extends T>(predicate: (record: T) => record is U): U | undefined;
	find(predicate: (record: T) => boolean): T | undefined;
	filter<U extends T>(predicate: (record: T) => record is U): U[];
	filter(predicate: (record: T) => boolean): T[];
	replaceAll(records: T[]): void;
}

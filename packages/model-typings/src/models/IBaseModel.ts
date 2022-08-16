import type {
	BulkWriteOptions,
	ChangeStream,
	Collection,
	DeleteOptions,
	DeleteResult,
	Document,
	Filter,
	FindCursor,
	FindOneAndUpdateOptions,
	FindOptions,
	InsertManyResult,
	InsertOneOptions,
	InsertOneResult,
	ModifyResult,
	ObjectId,
	UpdateFilter,
	UpdateOptions,
	UpdateResult,
	WithId,
} from 'mongodb';
import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';

type EnhancedOmit<T, K> = string | number extends keyof T
	? T // T has indexed type e.g. { _id: string; [k: string]: any; } or it is "any"
	: T extends any
	? Pick<T, Exclude<keyof T, K>> // discriminated unions
	: never;

type ExtractIdType<TSchema> = TSchema extends { _id: infer U } // user has defined a type for _id
	? Record<string, unknown> extends U
		? Exclude<U, Record<string, unknown>>
		: unknown extends U
		? ObjectId
		: U
	: ObjectId;

export type DefaultFields<Base> = Record<keyof Base, 1> | Record<keyof Base, 0> | void;
export type ResultFields<Base, Defaults> = Defaults extends void
	? Base
	: Defaults[keyof Defaults] extends 1
	? Pick<Defaults, keyof Defaults>
	: Omit<Defaults, keyof Defaults>;

export type ModelOptionalId<T> = EnhancedOmit<T, '_id'> & { _id?: ExtractIdType<T> };
export type InsertionModel<T> = EnhancedOmit<ModelOptionalId<T>, '_updatedAt'> & {
	_updatedAt?: Date;
};

export type FindPaginated<C> = {
	cursor: C;
	totalCount: Promise<number>;
};

export interface IBaseModel<T, C extends DefaultFields<T> = undefined> {
	col: Collection<T>;

	getCollectionName(): string;

	findOneAndUpdate(query: Filter<T>, update: UpdateFilter<T> | T, options?: FindOneAndUpdateOptions): Promise<ModifyResult<T>>;

	findOneById(_id: string, options?: FindOptions<T> | undefined): Promise<T | null>;
	findOneById<P = T>(_id: string, options?: FindOptions<P>): Promise<P | null>;
	findOneById(_id: string, options?: any): Promise<T | null>;

	findOne(query?: Filter<T> | string, options?: undefined): Promise<T | null>;
	findOne<P = T>(query: Filter<T> | string, options: FindOptions<P extends T ? T : P>): Promise<P | null>;
	findOne<P>(query: Filter<T> | string, options?: any): Promise<WithId<T> | WithId<P> | null>;

	// findUsersInRoles(): void {
	// 	throw new Error('[overwrite-function] You must overwrite this function in the extended classes');
	// }

	find(query?: Filter<T>): FindCursor<ResultFields<T, C>>;
	find<P = T>(query: Filter<T>, options: FindOptions<P extends T ? T : P>): FindCursor<P>;
	find<P>(query: Filter<T> | undefined, options?: FindOptions<P extends T ? T : P>): FindCursor<WithId<P>> | FindCursor<WithId<T>>;

	findPaginated<P = T>(query: Filter<T>, options?: FindOptions<P extends T ? T : P>): FindPaginated<FindCursor<WithId<P>>>;
	findPaginated(query: Filter<T>, options?: any): FindPaginated<FindCursor<WithId<T>>>;

	update(
		filter: Filter<T>,
		update: UpdateFilter<T> | Partial<T>,
		options?: UpdateOptions & { multi?: true },
	): Promise<UpdateResult | Document>;

	updateOne(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions): Promise<UpdateResult>;

	updateMany(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions): Promise<Document | UpdateResult>;

	insertMany(docs: InsertionModel<T>[], options?: BulkWriteOptions): Promise<InsertManyResult<T>>;

	insertOne(doc: InsertionModel<T>, options?: InsertOneOptions): Promise<InsertOneResult<T>>;

	removeById(_id: string): Promise<DeleteResult>;

	deleteOne(filter: Filter<T>, options?: DeleteOptions & { bypassDocumentValidation?: boolean }): Promise<DeleteResult>;

	deleteMany(filter: Filter<T>, options?: DeleteOptions): Promise<DeleteResult>;

	// Trash
	trashFind<P extends RocketChatRecordDeleted<T>>(
		query: Filter<RocketChatRecordDeleted<T>>,
		options?: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): FindCursor<WithId<RocketChatRecordDeleted<T>>> | undefined;

	trashFindOneById(_id: string): Promise<RocketChatRecordDeleted<T> | null>;

	trashFindOneById<P>(
		_id: string,
		options: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Promise<P | null>;

	trashFindOneById<P extends RocketChatRecordDeleted<T>>(
		_id: string,
		options?: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Promise<WithId<RocketChatRecordDeleted<P> | RocketChatRecordDeleted<T>> | null>;

	trashFindDeletedAfter(deletedAt: Date): FindCursor<WithId<RocketChatRecordDeleted<T>>>;

	trashFindDeletedAfter<P = RocketChatRecordDeleted<T>>(
		deletedAt: Date,
		query?: Filter<RocketChatRecordDeleted<T>>,
		options?: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): FindCursor<WithId<RocketChatRecordDeleted<T>>>;

	trashFindPaginatedDeletedAfter<P = RocketChatRecordDeleted<T>>(
		deletedAt: Date,
		query?: Filter<RocketChatRecordDeleted<T>>,
		options?: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): FindPaginated<FindCursor<WithId<RocketChatRecordDeleted<T>>>>;

	watch(pipeline?: object[]): ChangeStream<T>;
}

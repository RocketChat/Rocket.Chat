import type {
	BulkWriteOptions,
	ChangeStream,
	Collection,
	DeleteOptions,
	DeleteResult,
	Document,
	EnhancedOmit,
	Filter,
	FindCursor,
	FindOneAndUpdateOptions,
	FindOptions,
	InsertManyResult,
	InsertOneOptions,
	InsertOneResult,
	ModifyResult,
	OptionalId,
	UpdateFilter,
	UpdateOptions,
	UpdateResult,
	WithId,
} from 'mongodb';
import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';

export type DefaultFields<Base> = Record<keyof Base, 1> | Record<keyof Base, 0> | void;
export type ResultFields<Base, Defaults> = Defaults extends void
	? Base
	: Defaults[keyof Defaults] extends 1
	? Pick<Defaults, keyof Defaults>
	: Omit<Defaults, keyof Defaults>;

export type InsertionModel<T> = EnhancedOmit<OptionalId<T>, '_updatedAt'> & {
	_updatedAt?: Date;
};

export type FindPaginated<C> = {
	cursor: C;
	totalCount: Promise<number>;
};

export interface IBaseModel<
	T extends { _id: string },
	C extends DefaultFields<T> = undefined,
	TDeleted extends RocketChatRecordDeleted<T> = RocketChatRecordDeleted<T>,
> {
	col: Collection<T>;

	getCollectionName(): string;

	findOneAndUpdate(query: Filter<T>, update: UpdateFilter<T> | T, options?: FindOneAndUpdateOptions): Promise<ModifyResult<T>>;

	findOneById(_id: T['_id'], options?: FindOptions<T> | undefined): Promise<T | null>;
	findOneById<P = T>(_id: T['_id'], options?: FindOptions<P>): Promise<P | null>;
	findOneById(_id: T['_id'], options?: any): Promise<T | null>;

	findOne(query?: Filter<T> | T['_id'], options?: undefined): Promise<T | null>;
	findOne<P = T>(query: Filter<T> | T['_id'], options: FindOptions<P extends T ? T : P>): Promise<P | null>;
	findOne<P>(query: Filter<T> | T['_id'], options?: any): Promise<WithId<T> | WithId<P> | null>;

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

	removeById(_id: T['_id']): Promise<DeleteResult>;

	deleteOne(filter: Filter<T>, options?: DeleteOptions & { bypassDocumentValidation?: boolean }): Promise<DeleteResult>;

	deleteMany(filter: Filter<T>, options?: DeleteOptions): Promise<DeleteResult>;

	// Trash
	trashFind<P extends TDeleted>(
		query: Filter<TDeleted>,
		options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindCursor<WithId<TDeleted>> | undefined;

	trashFindOneById(_id: TDeleted['_id']): Promise<TDeleted | null>;

	trashFindOneById<P>(_id: TDeleted['_id'], options: FindOptions<P extends TDeleted ? TDeleted : P>): Promise<P | null>;

	trashFindOneById<P extends TDeleted>(
		_id: TDeleted['_id'],
		options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): Promise<WithId<RocketChatRecordDeleted<P> | TDeleted> | null>;

	trashFindDeletedAfter(deletedAt: Date): FindCursor<WithId<TDeleted>>;

	trashFindDeletedAfter<P = TDeleted>(
		deletedAt: Date,
		query?: Filter<TDeleted>,
		options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindCursor<WithId<TDeleted>>;

	trashFindPaginatedDeletedAfter<P = TDeleted>(
		deletedAt: Date,
		query?: Filter<TDeleted>,
		options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindPaginated<FindCursor<WithId<TDeleted>>>;

	watch(pipeline?: object[]): ChangeStream<T>;
}

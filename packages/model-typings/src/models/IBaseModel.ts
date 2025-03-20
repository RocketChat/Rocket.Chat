import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type {
	BulkWriteOptions,
	ChangeStream,
	ClientSession,
	Collection,
	DeleteOptions,
	DeleteResult,
	Document,
	EnhancedOmit,
	Filter,
	FindCursor,
	FindOneAndDeleteOptions,
	FindOneAndUpdateOptions,
	FindOptions,
	InsertManyResult,
	InsertOneOptions,
	InsertOneResult,
	OptionalId,
	UpdateFilter,
	UpdateOptions,
	UpdateResult,
	WithId,
} from 'mongodb';

import type { Updater } from '../updater';

export type DefaultFields<Base> = Partial<Record<keyof Base, 1>> | Partial<Record<keyof Base, 0>> | void;
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

	createIndexes(): Promise<string[] | void>;

	getCollectionName(): string;
	getUpdater(): Updater<T>;
	updateFromUpdater(query: Filter<T>, updater: Updater<T>, options?: UpdateOptions): Promise<UpdateResult>;

	findOneAndDelete(filter: Filter<T>, options?: FindOneAndDeleteOptions): Promise<null | WithId<T>>;
	findOneAndUpdate(query: Filter<T>, update: UpdateFilter<T> | T, options?: FindOneAndUpdateOptions): Promise<null | WithId<T>>;

	findOneById(_id: T['_id'], options?: FindOptions<T> | undefined): Promise<T | null>;
	findOneById<P extends Document = T>(_id: T['_id'], options?: FindOptions<P>): Promise<P | null>;
	findOneById(_id: T['_id'], options?: any): Promise<T | null>;

	findOne(query?: Filter<T> | T['_id'], options?: undefined): Promise<T | null>;
	findOne<P extends Document = T>(query: Filter<T> | T['_id'], options: FindOptions<P extends T ? T : P>): Promise<P | null>;
	findOne<P>(query: Filter<T> | T['_id'], options?: any): Promise<WithId<T> | WithId<P> | null>;

	find(query?: Filter<T>): FindCursor<ResultFields<T, C>>;
	find<P extends Document = T>(query: Filter<T>, options: FindOptions<P extends T ? T : P>): FindCursor<P>;
	find<P extends Document>(
		query: Filter<T> | undefined,
		options?: FindOptions<P extends T ? T : P>,
	): FindCursor<WithId<P>> | FindCursor<WithId<T>>;

	findPaginated<P extends Document = T>(query: Filter<T>, options?: FindOptions<P extends T ? T : P>): FindPaginated<FindCursor<WithId<P>>>;
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

	removeById(_id: T['_id'], options?: { session?: ClientSession }): Promise<DeleteResult>;

	removeByIds(ids: T['_id'][]): Promise<DeleteResult>;

	deleteOne(filter: Filter<T>, options?: DeleteOptions & { bypassDocumentValidation?: boolean }): Promise<DeleteResult>;

	deleteMany(filter: Filter<T>, options?: DeleteOptions & { onTrash?: (record: ResultFields<T, C>) => void }): Promise<DeleteResult>;

	// Trash
	trashFind<P extends TDeleted>(
		query: Filter<TDeleted>,
		options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindCursor<WithId<TDeleted>> | undefined;

	trashFindOneById(_id: TDeleted['_id']): Promise<TDeleted | null>;

	trashFindOneById<P extends Document>(_id: TDeleted['_id'], options: FindOptions<P extends TDeleted ? TDeleted : P>): Promise<P | null>;

	trashFindOneById<P extends TDeleted>(
		_id: TDeleted['_id'],
		options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): Promise<WithId<RocketChatRecordDeleted<P> | TDeleted> | null>;

	trashFindDeletedAfter(deletedAt: Date): FindCursor<WithId<TDeleted>>;

	trashFindDeletedAfter<P extends Document = TDeleted>(
		deletedAt: Date,
		query?: Filter<TDeleted>,
		options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindCursor<WithId<TDeleted>>;

	trashFindPaginatedDeletedAfter<P extends Document = TDeleted>(
		deletedAt: Date,
		query?: Filter<TDeleted>,
		options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindPaginated<FindCursor<WithId<TDeleted>>>;

	watch(pipeline?: object[]): ChangeStream<T>;
	countDocuments(query: Filter<T>): Promise<number>;
	estimatedDocumentCount(): Promise<number>;
}

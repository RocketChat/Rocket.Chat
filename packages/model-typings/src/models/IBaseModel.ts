import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type {
	BulkWriteOptions,
	ChangeStream,
	ClientSession,
	Collection,
	CountDocumentsOptions,
	DeleteOptions,
	DeleteResult,
	Document,
	EnhancedOmit,
	Filter,
	FindCursor,
	FindOneAndDeleteOptions,
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

import type {
	ApplyProjection,
	DocumentWithDriverProjection,
	DocumentWithProjection,
	FindOneAndUpdateOptionsWithProjection,
	FindOptionsWithProjection,
	ProjectionSpec,
} from '../types/DocumentWithProjection';
import type { Updater } from '../updater';

export type DefaultFields<Base> = Partial<Record<keyof Base, 1>> | Partial<Record<keyof Base, 0>> | void;
export type ResultFields<Base, Defaults> = Defaults extends void | undefined
	? Base
	: Defaults extends ProjectionSpec
		? ApplyProjection<Base, Defaults>
		: Base;

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

	/**
	 * No projection narrowing: whether the model archives to a trash collection is a runtime detail
	 * (a constructor argument), and the trash path has to read the whole document to archive it, so
	 * it returns every field regardless of the projection. Narrowing here would claim a filtering
	 * that only happens for models without a trash collection.
	 */
	findOneAndDelete(filter: Filter<T>, options?: FindOneAndDeleteOptions): Promise<WithId<T> | null>;
	findOneAndDeleteById(_id: T['_id'], options?: FindOneAndDeleteOptions): Promise<WithId<T> | null>;
	findOneAndUpdate<P extends Document = T, O extends FindOneAndUpdateOptionsWithProjection = FindOneAndUpdateOptionsWithProjection>(
		query: Filter<T>,
		update: UpdateFilter<T> | T,
		options?: O,
	): Promise<DocumentWithDriverProjection<P, O> | null>;

	findOneById(_id: T['_id'], options?: undefined): Promise<ResultFields<T, C> | null>;
	findOneById<P extends Document = T, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		_id: T['_id'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;

	findOne(query?: Filter<T> | T['_id'], options?: undefined): Promise<ResultFields<T, C> | null>;
	findOne<P extends Document = T, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		query: Filter<T> | T['_id'],
		options?: O,
	): Promise<DocumentWithProjection<P, O> | null>;

	find(query?: Filter<T>): FindCursor<ResultFields<T, C>>;
	find<P extends Document = T, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		query: Filter<T> | undefined,
		options?: O,
	): FindCursor<DocumentWithProjection<P, O>>;

	findPaginated(query?: Filter<T>): FindPaginated<FindCursor<ResultFields<T, C>>>;
	findPaginated<P extends Document = T, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		query: Filter<T> | undefined,
		options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<P, O>>>;

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
	countDocuments(query: Filter<T>, options?: CountDocumentsOptions): Promise<number>;
	estimatedDocumentCount(): Promise<number>;
}

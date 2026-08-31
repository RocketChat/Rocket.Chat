import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type {
	DefaultFields,
	DocumentWithProjection,
	FindOptionsWithProjection,
	FindPaginated,
	IBaseModel,
	InsertionModel,
	DocumentWithDriverProjection,
	FindOneAndUpdateOptionsWithProjection,
} from '@rocket.chat/model-typings';
import type {
	BulkWriteOptions,
	ChangeStream,
	Collection,
	DeleteOptions,
	DeleteResult,
	Document,
	Filter,
	FindCursor,
	FindOptions,
	InsertManyResult,
	InsertOneOptions,
	InsertOneResult,
	UpdateFilter,
	UpdateOptions,
	UpdateResult,
	WithId,
} from 'mongodb';

import { getCollectionName, UpdaterImpl } from '../index';
import type { Updater } from '../updater';

export class BaseDummy<
	T extends { _id: string },
	C extends DefaultFields<T> = undefined,
	TDeleted extends RocketChatRecordDeleted<T> = RocketChatRecordDeleted<T>,
> implements IBaseModel<T, C, TDeleted>
{
	public readonly col: Collection<T>;

	private collectionName: string;

	constructor(protected name: string) {
		this.collectionName = getCollectionName(name);
		this.col = undefined as any;
	}

	public async createIndexes(): Promise<string[] | void> {
		// nothing to do
	}

	public getUpdater(): Updater<T> {
		return new UpdaterImpl<T>();
	}

	public updateFromUpdater(query: Filter<T>, updater: Updater<T>): Promise<UpdateResult> {
		return this.updateOne(query, updater);
	}

	getCollectionName(): string {
		return this.collectionName;
	}

	async findOneAndDelete(): Promise<WithId<T> | null> {
		return null;
	}

	async findOneAndDeleteById(_id: T['_id']): Promise<WithId<T> | null> {
		return null;
	}

	async findOneAndUpdate<
		P extends Document = T,
		O extends FindOneAndUpdateOptionsWithProjection = FindOneAndUpdateOptionsWithProjection,
	>(): Promise<DocumentWithDriverProjection<P, O> | null> {
		return null;
	}

	async findOneById<P extends Document = T, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		_id: T['_id'],
		_options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		return null;
	}

	async findOne<P extends Document = T, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		_query?: Filter<T> | T['_id'],
		_options?: O,
	): Promise<DocumentWithProjection<P, O> | null> {
		return null;
	}

	find<P extends Document = T, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		_query?: Filter<T>,
		_options?: O,
	): FindCursor<DocumentWithProjection<P, O>> {
		return undefined as any;
	}

	findPaginated<P extends Document = T, O extends FindOptionsWithProjection<P> = FindOptionsWithProjection<P>>(
		_query?: Filter<T>,
		_options?: O,
	): FindPaginated<FindCursor<DocumentWithProjection<P, O>>> {
		return {
			cursor: undefined as any,
			totalCount: Promise.resolve(0),
		};
	}

	async update(
		filter: Filter<T>,
		update: UpdateFilter<T> | Partial<T>,
		options?: UpdateOptions & { multi?: true },
	): Promise<UpdateResult | Document> {
		return this.updateOne(filter, update, options);
	}

	async updateOne(_filter: Filter<T>, _update: UpdateFilter<T> | Partial<T>, _options?: UpdateOptions): Promise<UpdateResult> {
		return {
			acknowledged: true,
			matchedCount: 0,
			modifiedCount: 0,
			upsertedCount: 0,
			upsertedId: '' as any,
		};
	}

	async updateMany(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions): Promise<Document | UpdateResult> {
		return this.updateOne(filter, update, options);
	}

	async insertMany(_docs: InsertionModel<T>[], _options?: BulkWriteOptions): Promise<InsertManyResult<T>> {
		return {
			acknowledged: true,
			insertedCount: 0,
			insertedIds: {},
		};
	}

	async insertOne(_doc: InsertionModel<T>, _options?: InsertOneOptions): Promise<InsertOneResult<T>> {
		return {
			acknowledged: true,
			insertedId: '' as any,
		};
	}

	async removeById(_id: T['_id']): Promise<DeleteResult> {
		return {
			acknowledged: true,
			deletedCount: 0,
		};
	}

	async removeByIds(_ids: T['_id'][]): Promise<DeleteResult> {
		return {
			acknowledged: true,
			deletedCount: 0,
		};
	}

	async deleteOne(filter: Filter<T>, options?: DeleteOptions & { bypassDocumentValidation?: boolean }): Promise<DeleteResult> {
		return this.deleteMany(filter, options);
	}

	async deleteMany(_filter: Filter<T>, _options?: DeleteOptions): Promise<DeleteResult> {
		return {
			acknowledged: true,
			deletedCount: 0,
		};
	}

	// Trash
	trashFind<P extends TDeleted>(
		_query: Filter<TDeleted>,
		_options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindCursor<WithId<TDeleted>> | undefined {
		return undefined;
	}

	trashFindOneById(_id: TDeleted['_id']): Promise<TDeleted | null>;

	trashFindOneById<P extends Document>(_id: TDeleted['_id'], options: FindOptions<P extends TDeleted ? TDeleted : P>): Promise<P | null>;

	async trashFindOneById<P extends TDeleted>(
		_id: TDeleted['_id'],
		_options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): Promise<WithId<RocketChatRecordDeleted<P> | TDeleted> | null> {
		return null;
	}

	trashFindDeletedAfter(deletedAt: Date): FindCursor<WithId<TDeleted>>;

	trashFindDeletedAfter<P extends Document = TDeleted>(
		_deletedAt: Date,
		_query?: Filter<TDeleted>,
		_options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindCursor<WithId<TDeleted>> {
		return undefined as any;
	}

	trashFindPaginatedDeletedAfter<P extends Document = TDeleted>(
		_deletedAt: Date,
		_query?: Filter<TDeleted>,
		_options?: FindOptions<P extends TDeleted ? TDeleted : P>,
	): FindPaginated<FindCursor<WithId<TDeleted>>> {
		return {
			cursor: undefined as any,
			totalCount: Promise.resolve(0),
		};
	}

	watch(_pipeline?: object[]): ChangeStream<T> {
		return undefined as any;
	}

	async countDocuments(): Promise<number> {
		return 0;
	}

	async estimatedDocumentCount(): Promise<number> {
		return 0;
	}
}

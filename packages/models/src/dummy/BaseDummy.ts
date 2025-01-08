import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { DefaultFields, FindPaginated, IBaseModel, InsertionModel, ResultFields } from '@rocket.chat/model-typings';
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

	async findOneAndUpdate(): Promise<WithId<T> | null> {
		return null;
	}

	findOneById(_id: T['_id'], options?: FindOptions<T> | undefined): Promise<T | null>;

	findOneById<P extends Document = T>(_id: T['_id'], options?: FindOptions<P>): Promise<P | null>;

	async findOneById(_id: T['_id'], _options?: any): Promise<T | null> {
		return null;
	}

	findOne(query?: Filter<T> | T['_id'], options?: undefined): Promise<T | null>;

	findOne<P extends Document = T>(query: Filter<T> | T['_id'], options: FindOptions<P extends T ? T : P>): Promise<P | null>;

	async findOne<P>(_query: Filter<T> | T['_id'], _options?: any): Promise<WithId<T> | WithId<P> | null> {
		return null;
	}

	find(query?: Filter<T>): FindCursor<ResultFields<T, C>>;

	find<P extends Document = T>(query: Filter<T>, options: FindOptions<P extends T ? T : P>): FindCursor<P>;

	find<P extends Document>(
		_query: Filter<T> | undefined,
		_options?: FindOptions<P extends T ? T : P>,
	): FindCursor<WithId<P>> | FindCursor<WithId<T>> {
		return undefined as any;
	}

	findPaginated<P extends Document = T>(query: Filter<T>, options?: FindOptions<P extends T ? T : P>): FindPaginated<FindCursor<WithId<P>>>;

	findPaginated(_query: Filter<T>, _options?: any): FindPaginated<FindCursor<WithId<T>>> {
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
		return undefined as any;
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

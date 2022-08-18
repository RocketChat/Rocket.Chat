import type {
	BulkWriteOptions,
	ChangeStream,
	Collection,
	CollectionOptions,
	Db,
	Filter,
	FindOneAndUpdateOptions,
	IndexDescription,
	InsertOneOptions,
	ModifyResult,
	OptionalUnlessRequiredId,
	UpdateFilter,
	WithId,
	UpdateOptions,
	Document,
	FindOptions,
	FindCursor,
	UpdateResult,
	InsertManyResult,
	InsertOneResult,
	DeleteResult,
	DeleteOptions,
} from 'mongodb';
import { ObjectId } from 'mongodb';
import type { IRocketChatRecord, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IBaseModel, DefaultFields, ResultFields, FindPaginated, InsertionModel } from '@rocket.chat/model-typings';
import { getCollectionName } from '@rocket.chat/models';

import { setUpdatedAt } from '../../../app/models/server/lib/setUpdatedAt';

const warnFields =
	process.env.NODE_ENV !== 'production' || process.env.SHOW_WARNINGS === 'true'
		? (...rest: any): void => {
				console.warn(...rest, new Error().stack);
		  }
		: new Function();

type ModelOptions = {
	preventSetUpdatedAt?: boolean;
	collectionNameResolver?: (name: string) => string;
	collection?: CollectionOptions;
};

export abstract class BaseRaw<T, C extends DefaultFields<T> = undefined> implements IBaseModel<T, C> {
	public readonly defaultFields: C;

	public readonly col: Collection<T>;

	private preventSetUpdatedAt: boolean;

	/**
	 * Collection name to store data.
	 */
	private collectionName: string;

	/**
	 * @param db MongoDB instance
	 * @param name Name of the model without any prefix. Used by trash records to set the `__collection__` field.
	 * @param trash Trash collection instance
	 * @param options Model options
	 */
	constructor(private db: Db, protected name: string, protected trash?: Collection<RocketChatRecordDeleted<T>>, options?: ModelOptions) {
		this.collectionName = options?.collectionNameResolver ? options.collectionNameResolver(name) : getCollectionName(name);

		this.col = this.db.collection(this.collectionName, options?.collection || {});

		const indexes = this.modelIndexes();
		if (indexes?.length) {
			this.col.createIndexes(indexes).catch((e) => {
				console.warn(`Some indexes for collection '${this.collectionName}' could not be created:\n\t${e.message}`);
			});
		}

		this.preventSetUpdatedAt = options?.preventSetUpdatedAt ?? false;
	}

	protected modelIndexes(): IndexDescription[] | void {
		// noop
	}

	getCollectionName(): string {
		return this.collectionName;
	}

	private doNotMixInclusionAndExclusionFields(options: FindOptions<T> = {}): FindOptions<T> {
		const optionsDef = this.ensureDefaultFields(options);
		if (optionsDef?.projection === undefined) {
			return optionsDef;
		}

		const projection: Record<string, any> = optionsDef?.projection;
		const keys = Object.keys(projection);
		const removeKeys = keys.filter((key) => projection[key] === 0);
		if (keys.length > removeKeys.length) {
			removeKeys.forEach((key) => delete projection[key]);
		}

		return {
			...optionsDef,
			projection,
		};
	}

	private ensureDefaultFields<P>(options: FindOptions<P>): FindOptions<P>;

	private ensureDefaultFields<P>(options?: any): FindOptions<P> | undefined | FindOptions<T> {
		if (options?.fields) {
			warnFields("Using 'fields' in models is deprecated.", options);
		}

		if (this.defaultFields === undefined) {
			return options;
		}

		const { fields: deprecatedFields, projection, ...rest } = options || {};

		const fields = { ...deprecatedFields, ...projection };

		return {
			projection: this.defaultFields,
			...(fields && Object.values(fields).length && { projection: fields }),
			...rest,
		};
	}

	public findOneAndUpdate(query: Filter<T>, update: UpdateFilter<T> | T, options?: FindOneAndUpdateOptions): Promise<ModifyResult<T>> {
		return this.col.findOneAndUpdate(query, update, options || {});
	}

	async findOneById(_id: string, options?: FindOptions<T> | undefined): Promise<T | null>;

	async findOneById<P = T>(_id: string, options?: FindOptions<P>): Promise<P | null>;

	async findOneById(_id: string, options?: any): Promise<T | null> {
		const query = { _id } as unknown as Filter<T>;
		if (options) {
			return this.findOne(query, options);
		}
		return this.findOne(query);
	}

	async findOne(query?: Filter<T> | string, options?: undefined): Promise<T | null>;

	async findOne<P = T>(query: Filter<T> | string, options: FindOptions<P extends T ? T : P>): Promise<P | null>;

	async findOne<P>(query: Filter<T> | string = {}, options?: any): Promise<WithId<T> | WithId<P> | null> {
		const q = typeof query === 'string' ? ({ _id: query } as unknown as Filter<T>) : query;

		const optionsDef = this.doNotMixInclusionAndExclusionFields(options);
		if (optionsDef) {
			return this.col.findOne(q, optionsDef);
		}
		return this.col.findOne(q);
	}

	// findUsersInRoles(): void {
	// 	throw new Error('[overwrite-function] You must overwrite this function in the extended classes');
	// }

	find(query?: Filter<T>): FindCursor<ResultFields<T, C>>;

	find<P = T>(query: Filter<T>, options: FindOptions<P extends T ? T : P>): FindCursor<P>;

	find<P>(query: Filter<T> | undefined = {}, options?: FindOptions<P extends T ? T : P>): FindCursor<WithId<P>> | FindCursor<WithId<T>> {
		const optionsDef = this.doNotMixInclusionAndExclusionFields(options);
		return this.col.find(query, optionsDef);
	}

	findPaginated<P = T>(query: Filter<T>, options?: FindOptions<P extends T ? T : P>): FindPaginated<FindCursor<WithId<P>>>;

	findPaginated(query: Filter<T> | undefined = {}, options?: any): FindPaginated<FindCursor<WithId<T>>> {
		const optionsDef = this.doNotMixInclusionAndExclusionFields(options);

		const cursor = optionsDef ? this.col.find(query, optionsDef) : this.col.find(query);
		const totalCount = this.col.countDocuments(query);

		return {
			cursor,
			totalCount,
		};
	}

	/**
	 * @deprecated use updateOne or updateAny instead
	 */
	update(
		filter: Filter<T>,
		update: UpdateFilter<T> | Partial<T>,
		options?: UpdateOptions & { multi?: true },
	): Promise<UpdateResult | Document> {
		const operation = options?.multi ? 'updateMany' : 'updateOne';

		return this[operation](filter, update, options);
	}

	updateOne(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions): Promise<UpdateResult> {
		this.setUpdatedAt(update);
		if (options) {
			return this.col.updateOne(filter, update, options);
		}
		return this.col.updateOne(filter, update);
	}

	updateMany(filter: Filter<T>, update: UpdateFilter<T> | Partial<T>, options?: UpdateOptions): Promise<Document | UpdateResult> {
		this.setUpdatedAt(update);
		if (options) {
			return this.col.updateMany(filter, update, options);
		}
		return this.col.updateMany(filter, update);
	}

	insertMany(docs: InsertionModel<T>[], options?: BulkWriteOptions): Promise<InsertManyResult<T>> {
		docs = docs.map((doc) => {
			if (!doc._id || typeof doc._id !== 'string') {
				const oid = new ObjectId();
				return { _id: oid.toHexString(), ...doc };
			}
			this.setUpdatedAt(doc);
			return doc;
		});

		// TODO reavaluate following type casting
		return this.col.insertMany(docs as unknown as Array<OptionalUnlessRequiredId<T>>, options || {});
	}

	insertOne(doc: InsertionModel<T>, options?: InsertOneOptions): Promise<InsertOneResult<T>> {
		if (!doc._id || typeof doc._id !== 'string') {
			const oid = new ObjectId();
			doc = { _id: oid.toHexString(), ...doc };
		}

		this.setUpdatedAt(doc);

		// TODO reavaluate following type casting
		return this.col.insertOne(doc as unknown as OptionalUnlessRequiredId<T>, options || {});
	}

	removeById(_id: string): Promise<DeleteResult> {
		return this.deleteOne({ _id } as unknown as Filter<T>);
	}

	async deleteOne(filter: Filter<T>, options?: DeleteOptions & { bypassDocumentValidation?: boolean }): Promise<DeleteResult> {
		if (!this.trash) {
			if (options) {
				return this.col.deleteOne(filter, options);
			}
			return this.col.deleteOne(filter);
		}

		const doc = (await this.findOne(filter)) as unknown as (IRocketChatRecord & T) | undefined;

		if (doc) {
			const { _id, ...record } = doc;

			const trash = {
				...record,
				_deletedAt: new Date(),
				__collection__: this.name,
			} as RocketChatRecordDeleted<T>;

			// since the operation is not atomic, we need to make sure that the record is not already deleted/inserted
			await this.trash?.updateOne(
				{ _id } as Filter<RocketChatRecordDeleted<T>>,
				{ $set: trash },
				{
					upsert: true,
				},
			);
		}

		if (options) {
			return this.col.deleteOne(filter, options);
		}
		return this.col.deleteOne(filter);
	}

	async deleteMany(filter: Filter<T>, options?: DeleteOptions): Promise<DeleteResult> {
		if (!this.trash) {
			if (options) {
				return this.col.deleteMany(filter, options);
			}
			return this.col.deleteMany(filter);
		}

		const cursor = this.find(filter);

		const ids: string[] = [];
		for await (const doc of cursor) {
			const { _id, ...record } = doc as unknown as IRocketChatRecord & T;

			const trash = {
				...record,
				_deletedAt: new Date(),
				__collection__: this.name,
			} as RocketChatRecordDeleted<T>;

			ids.push(_id);

			// since the operation is not atomic, we need to make sure that the record is not already deleted/inserted
			await this.trash?.updateOne(
				{ _id } as Filter<RocketChatRecordDeleted<T>>,
				{ $set: trash },
				{
					upsert: true,
				},
			);
		}

		if (options) {
			return this.col.deleteMany({ _id: { $in: ids } } as unknown as Filter<T>, options);
		}
		return this.col.deleteMany({ _id: { $in: ids } } as unknown as Filter<T>);
	}

	// Trash
	trashFind<P extends RocketChatRecordDeleted<T>>(
		query: Filter<RocketChatRecordDeleted<T>>,
		options?: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): FindCursor<WithId<RocketChatRecordDeleted<T>>> | undefined {
		if (!this.trash) {
			return undefined;
		}
		const { trash } = this;

		if (options) {
			return trash.find(
				{
					__collection__: this.name,
					...query,
				},
				options,
			);
		}
		return trash.find({
			__collection__: this.name,
			...query,
		});
	}

	trashFindOneById(_id: string): Promise<RocketChatRecordDeleted<T> | null>;

	trashFindOneById<P>(
		_id: string,
		options: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Promise<P | null>;

	async trashFindOneById<P extends RocketChatRecordDeleted<T>>(
		_id: string,
		options?: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Promise<WithId<RocketChatRecordDeleted<P> | RocketChatRecordDeleted<T>> | null> {
		const query = {
			_id,
			__collection__: this.name,
		} as Filter<RocketChatRecordDeleted<T>>;

		if (!this.trash) {
			return null;
		}

		if (options) {
			return this.trash.findOne(query, options);
		}
		return this.trash.findOne(query);
	}

	private setUpdatedAt(record: UpdateFilter<T> | InsertionModel<T>): void {
		if (this.preventSetUpdatedAt) {
			return;
		}
		setUpdatedAt(record);
	}

	trashFindDeletedAfter(deletedAt: Date): FindCursor<WithId<RocketChatRecordDeleted<T>>>;

	trashFindDeletedAfter<P = RocketChatRecordDeleted<T>>(
		deletedAt: Date,
		query?: Filter<RocketChatRecordDeleted<T>>,
		options?: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): FindCursor<WithId<RocketChatRecordDeleted<T>>> {
		const q = {
			__collection__: this.name,
			_deletedAt: {
				$gt: deletedAt,
			},
			...query,
		} as Filter<RocketChatRecordDeleted<T>>;

		if (!this.trash) {
			throw new Error('Trash is not enabled for this collection');
		}

		if (options) {
			return this.trash.find(q, options);
		}
		return this.trash.find(q);
	}

	trashFindPaginatedDeletedAfter<P = RocketChatRecordDeleted<T>>(
		deletedAt: Date,
		query?: Filter<RocketChatRecordDeleted<T>>,
		options?: FindOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): FindPaginated<FindCursor<WithId<RocketChatRecordDeleted<T>>>> {
		const q = {
			__collection__: this.name,
			_deletedAt: {
				$gt: deletedAt,
			},
			...query,
		} as Filter<RocketChatRecordDeleted<T>>;

		if (!this.trash) {
			throw new Error('Trash is not enabled for this collection');
		}

		const cursor = options ? this.trash.find(q, options) : this.trash.find(q);
		const totalCount = this.trash.countDocuments(q);

		return {
			cursor,
			totalCount,
		};
	}

	watch(pipeline?: object[]): ChangeStream<T> {
		return this.col.watch(pipeline);
	}
}

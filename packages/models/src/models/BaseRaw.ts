import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { IBaseModel, DefaultFields, ResultFields, FindPaginated, InsertionModel } from '@rocket.chat/model-typings';
import { traceInstanceMethods } from '@rocket.chat/tracing';
import { ObjectId } from 'mongodb';
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
	FindOneAndDeleteOptions,
	CountDocumentsOptions,
	ClientSession,
} from 'mongodb';

import { getCollectionName, UpdaterImpl } from '..';
import type { Updater } from '../updater';
import { setUpdatedAt } from './setUpdatedAt';

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

export abstract class BaseRaw<
	T extends { _id: string },
	C extends DefaultFields<T> = undefined,
	TDeleted extends RocketChatRecordDeleted<T> = RocketChatRecordDeleted<T>,
> implements IBaseModel<T, C, TDeleted>
{
	protected defaultFields: C | undefined;
	public readonly col: Collection<T>;
	private preventSetUpdatedAt: boolean;
	private collectionName: string;

	constructor(
		private db: Db,
		protected name: string,
		protected trash?: Collection<TDeleted>,
		options?: ModelOptions,
	) {
		this.collectionName = options?.collectionNameResolver ? options.collectionNameResolver(name) : getCollectionName(name);
		this.col = this.db.collection(this.collectionName, options?.collection || {});
		void this.createIndexes();
		this.preventSetUpdatedAt = options?.preventSetUpdatedAt ?? false;
		return traceInstanceMethods(this);
	}

	private pendingIndexes: Promise<void> | undefined;

	public async createIndexes() {
		const indexes = this.modelIndexes();
		if (indexes?.length) {
			if (this.pendingIndexes) {
				await this.pendingIndexes;
			}
			this.pendingIndexes = this.col.createIndexes(indexes).catch((e) => {
				console.warn(`Some indexes for collection '${this.collectionName}' could not be created:\n\t${e.message}`);
			}) as unknown as Promise<void>;
			void this.pendingIndexes.finally(() => {
				this.pendingIndexes = undefined;
			});
			return this.pendingIndexes;
		}
	}

	protected modelIndexes(): IndexDescription[] | undefined {
		return undefined;
	}

	getCollectionName(): string {
		return this.collectionName;
	}

	public getUpdater(): Updater<T> {
		return new UpdaterImpl<T>();
	}

	public updateFromUpdater(query: Filter<T>, updater: Updater<T>, options: UpdateOptions = {}): Promise<UpdateResult> {
		const updateFilter = updater.getUpdateFilter();
		return this.updateOne(query, updateFilter, options).catch((e) => {
			console.warn(e, updateFilter);
			return Promise.reject(e);
		});
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

	private ensureDefaultFields<P extends Document>(options: FindOptions<P>): FindOptions<P>;
	private ensureDefaultFields<P extends Document>(
		options?: FindOptions<P> & { fields?: FindOptions<P>['projection'] },
	): FindOptions<P> | FindOptions<T> | undefined {
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

	public findOneAndUpdate(query: Filter<T>, update: UpdateFilter<T> | T, options?: FindOneAndUpdateOptions): Promise<WithId<T> | null> {
		this.setUpdatedAt(update);
		if (options?.upsert && !('_id' in update || (update.$set && '_id' in update.$set)) && !('_id' in query)) {
			update.$setOnInsert = { ...(update.$setOnInsert || {}), _id: new ObjectId().toHexString() } as Partial<T> & { _id: string };
		}
		return this.col.findOneAndUpdate(query, update, options || {});
	}

	async findOneById(_id: T['_id'], options?: FindOptions<T>): Promise<T | null>;
	async findOneById<P extends Document = T>(_id: T['_id'], options?: FindOptions<P>): Promise<P | null>;
	async findOneById(_id: T['_id'], options?: any): Promise<T | null> {
		const query: Filter<T> = { _id } as Filter<T>;
		return options ? this.findOne(query, options) : this.findOne(query);
	}

	async findOne<P extends Document = T>(query: Filter<T> | T['_id'] = {}, options?: any): Promise<WithId<T> | WithId<P> | null> {
		const q: Filter<T> = typeof query === 'string' ? ({ _id: query } as Filter<T>) : query;
		const optionsDef = this.doNotMixInclusionAndExclusionFields(options);
		return optionsDef ? this.col.findOne(q, optionsDef) : this.col.findOne(q);
	}

	/* ===================== FIXED METHOD ===================== */

	async findOneAndDelete(filter: Filter<T>, options?: FindOneAndDeleteOptions): Promise<WithId<T> | null> {
		if (!this.trash) {
			return this.col.findOneAndDelete(filter, options || {});
		}

		const doc = await this.col.findOne(filter);
		if (!doc) {
			return null;
		}

		const { _id, ...record } = doc;
		const trash: TDeleted = {
			...record,
			_deletedAt: new Date(),
			__collection__: this.name,
		} as unknown as TDeleted;

		await this.trash.updateOne({ _id } as Filter<TDeleted>, { $set: trash } as UpdateFilter<TDeleted>, {
			upsert: true,
		});

		try {
			await this.col.deleteOne({ _id } as Filter<T>);
		} catch (originalError) {
			try {
				const rollbackResult = await this.trash.deleteOne({ _id } as Filter<TDeleted>);

				if (!rollbackResult || rollbackResult.deletedCount !== 1) {
					console.error('BaseRaw.findOneAndDelete: Rollback failed – orphaned trash record', {
						collection: this.name,
						_id,
						rollbackResult,
						originalError,
					});
				}
			} catch (rollbackError) {
				console.error('BaseRaw.findOneAndDelete: Rollback threw exception', {
					collection: this.name,
					_id,
					rollbackError,
					originalError,
				});
			}

			throw originalError;
		}

		return doc as WithId<T>;
	}

	/* ======================================================== */

	private setUpdatedAt(record: UpdateFilter<T> | InsertionModel<T>): void {
		if (!this.preventSetUpdatedAt) {
			setUpdatedAt(record);
		}
	}

	watch(pipeline?: object[]): ChangeStream<T> {
		return this.col.watch(pipeline);
	}

	countDocuments(query: Filter<T>, options?: CountDocumentsOptions): Promise<number> {
		return options ? this.col.countDocuments(query, options) : this.col.countDocuments(query);
	}

	estimatedDocumentCount(): Promise<number> {
		return this.col.estimatedDocumentCount();
	}
}

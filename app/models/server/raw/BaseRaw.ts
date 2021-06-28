import {
	Collection,
	CollectionInsertOneOptions,
	Cursor,
	DeleteWriteOpResultObject,
	FilterQuery,
	FindOneOptions,
	InsertOneWriteOpResult,
	InsertWriteOpResult,
	ObjectID,
	ObjectId,
	OptionalId,
	UpdateManyOptions,
	UpdateOneOptions,
	UpdateQuery,
	UpdateWriteOpResult,
	WithId,
	WriteOpResult,
} from 'mongodb';

import { setUpdatedAt } from '../lib/setUpdatedAt';

// [extracted from @types/mongo] TypeScript Omit (Exclude to be specific) does not work for objects with an "any" indexed type, and breaks discriminated unions
type EnhancedOmit<T, K> = string | number extends keyof T
	? T // T has indexed type e.g. { _id: string; [k: string]: any; } or it is "any"
	: T extends any
		? Pick<T, Exclude<keyof T, K>> // discriminated unions
		: never;

// [extracted from @types/mongo]
type ExtractIdType<TSchema> = TSchema extends { _id: infer U } // user has defined a type for _id
	? {} extends U
		? Exclude<U, {}>
		: unknown extends U
			? ObjectId
			: U
	: ObjectId;

type ModelOptionalId<T> = EnhancedOmit<T, '_id'> & { _id?: ExtractIdType<T> };
// InsertionModel forces both _id and _updatedAt to be optional, regardless of how they are declared in T
export type InsertionModel<T> = EnhancedOmit<ModelOptionalId<T>, '_updatedAt'> & { _updatedAt?: Date };

interface ITrash {
	__collection__: string;
}

export interface IBaseRaw<T> {
	col: Collection<T>;
}

const baseName = 'rocketchat_';

export class BaseRaw<T> implements IBaseRaw<T> {
	public defaultFields?: Record<string, 1 | 0>;

	protected name: string;

	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		this.name = this.col.collectionName.replace(baseName, '');
	}

	_ensureDefaultFields<T>(options: FindOneOptions<T>): FindOneOptions<T> {
		if (!this.defaultFields) {
			return options;
		}

		if (!options) {
			return { projection: this.defaultFields };
		}

		// TODO: change all places using "fields" for raw models and remove the additional condition here
		if ((options.projection != null && Object.keys(options.projection).length > 0)
		|| (options.fields != null && Object.keys(options.fields).length > 0)) {
			return options;
		}

		return {
			...options,
			projection: this.defaultFields,
		};
	}

	async findOneById(_id: string, options: FindOneOptions<T> = {}): Promise<T | undefined> {
		return this.findOne({ _id }, options);
	}

	async findOne(query = {}, options: FindOneOptions<T> = {}): Promise<T | undefined> {
		const optionsDef = this._ensureDefaultFields<T>(options);

		if (typeof query === 'string') {
			return this.findOneById(query, options);
		}

		return await this.col.findOne<T>(query, optionsDef) ?? undefined;
	}

	findUsersInRoles(): void {
		throw new Error('[overwrite-function] You must overwrite this function in the extended classes');
	}

	find(query = {}, options: FindOneOptions<T> = {}): Cursor<T> {
		const optionsDef = this._ensureDefaultFields(options);
		return this.col.find(query, optionsDef);
	}

	update(filter: FilterQuery<T>, update: UpdateQuery<T> | Partial<T>, options?: UpdateOneOptions & { multi?: boolean }): Promise<WriteOpResult> {
		setUpdatedAt(update);
		return this.col.update(filter, update, options);
	}

	updateOne(filter: FilterQuery<T>, update: UpdateQuery<T> | Partial<T>, options?: UpdateOneOptions & { multi?: boolean }): Promise<UpdateWriteOpResult> {
		setUpdatedAt(update);
		return this.col.updateOne(filter, update, options);
	}

	updateMany(filter: FilterQuery<T>, update: UpdateQuery<T> | Partial<T>, options?: UpdateManyOptions): Promise<UpdateWriteOpResult> {
		setUpdatedAt(update);
		return this.col.updateMany(filter, update, options);
	}

	insertMany(docs: Array<InsertionModel<T>>, options?: CollectionInsertOneOptions): Promise<InsertWriteOpResult<WithId<T>>> {
		docs = docs.map((doc) => {
			if (!doc._id || typeof doc._id !== 'string') {
				const oid = new ObjectID();
				return { _id: oid.toHexString(), ...doc };
			}
			setUpdatedAt(doc);
			return doc;
		});

		// TODO reavaluate following type casting
		return this.col.insertMany(docs as unknown as Array<OptionalId<T>>, options);
	}

	insertOne(doc: InsertionModel<T>, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult<WithId<T>>> {
		if (!doc._id || typeof doc._id !== 'string') {
			const oid = new ObjectID();
			doc = { _id: oid.toHexString(), ...doc };
		}

		setUpdatedAt(doc);

		// TODO reavaluate following type casting
		return this.col.insertOne(doc as unknown as OptionalId<T>, options);
	}

	removeById(_id: string): Promise<DeleteWriteOpResultObject> {
		const query: object = { _id };
		return this.col.deleteOne(query);
	}

	// Trash
	trashFind(query: FilterQuery<T & ITrash>, options: FindOneOptions<T>): Cursor<T> | undefined {
		return this.trash?.find<T>({
			__collection__: this.name,
			...query,
		}, options);
	}

	async trashFindOneById(_id: string, options: FindOneOptions<T> = {}): Promise<T | undefined> {
		const query: object = {
			_id,
			__collection__: this.name,
		};

		return await this.trash?.findOne<T>(query, options) ?? undefined;
	}
}

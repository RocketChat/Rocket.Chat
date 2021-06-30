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
	WithoutProjection,
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

export interface IBaseRaw<T> {
	col: Collection<T>;
}

const baseName = 'rocketchat_';
const isWithoutProjection = <T>(props: T): props is WithoutProjection<T> => !('projection' in props) && !('fields' in props);

type DefaultFields<Base> = Record<keyof Base, 1> | Record<keyof Base, 0> | void;
type ResultFields<Base, Defaults> = Defaults extends void ? Base : Defaults[keyof Defaults] extends 1 ? Pick<Defaults, keyof Defaults> : Omit<Defaults, keyof Defaults>;

const warnFields = process.env.NODE_ENV !== 'production'
	? (...rest: any): void => { console.warn(...rest, new Error().stack); }
	: new Function();

export class BaseRaw<T, C extends DefaultFields<T> = undefined> implements IBaseRaw<T> {
	public readonly defaultFields: C;

	protected name: string;

	constructor(
		public readonly col: Collection<T>,
		public readonly trash?: Collection<T>,
	) {
		this.name = this.col.collectionName.replace(baseName, '');
	}

	private ensureDefaultFields(options?: undefined): C extends void ? undefined : WithoutProjection<FindOneOptions<T>>;

	private ensureDefaultFields(options: WithoutProjection<FindOneOptions<T>>): WithoutProjection<FindOneOptions<T>>;

	private ensureDefaultFields<P>(options: FindOneOptions<P>): FindOneOptions<P>;

	private ensureDefaultFields<P>(options?: any): FindOneOptions<P> | undefined | WithoutProjection<FindOneOptions<T>> {
		if (this.defaultFields === undefined) {
			return options;
		}

		const { fields, ...rest } = options || {};

		if (fields) {
			warnFields('Using \'fields\' in models is deprecated.', options);
		}

		return {
			projection: this.defaultFields,
			...fields && { projection: fields },
			...rest,
		};
	}

	async findOneById(_id: string, options?: WithoutProjection<FindOneOptions<T>> | undefined): Promise<T | null>;

	async findOneById<P>(_id: string, options: FindOneOptions<P extends T ? T : P>): Promise<P | null>;

	async findOneById<P>(_id: string, options?: any): Promise<T | P | null> {
		const query = { _id } as FilterQuery<T>;
		const optionsDef = this.ensureDefaultFields(options);
		return this.col.findOne(query, optionsDef);
	}

	async findOne(query?: FilterQuery<T> | string, options?: undefined): Promise<T | null>;

	async findOne(query: FilterQuery<T> | string, options: WithoutProjection<FindOneOptions<T>>): Promise<T | null>;

	async findOne<P>(query: FilterQuery<T> | string, options: FindOneOptions<P extends T ? T : P>): Promise<P | null>;

	async findOne<P>(query: FilterQuery<T> | string = {}, options?: any): Promise<T | P | null> {
		const q = typeof query === 'string' ? { _id: query } as FilterQuery<T> : query;

		const optionsDef = this.ensureDefaultFields(options);
		return this.col.findOne(q, optionsDef);
	}

	findUsersInRoles(): void {
		throw new Error('[overwrite-function] You must overwrite this function in the extended classes');
	}

	find(query?: FilterQuery<T>): Cursor<ResultFields<T, C>>;

	find(query: FilterQuery<T>, options: WithoutProjection<FindOneOptions<T>>): Cursor<ResultFields<T, C>>;

	find<P>(query: FilterQuery<T>, options: FindOneOptions<P extends T ? T : P>): Cursor<P>;

	find<P>(query: FilterQuery<T> | undefined = {}, options?: any): Cursor<P> | Cursor<T> {
		const optionsDef = this.ensureDefaultFields(options);
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
	trashFind<P>(query: FilterQuery<T>, options: FindOneOptions<P extends T ? T : P>): Cursor<P> | undefined {
		if (!this.trash) {
			return undefined;
		}
		const { trash } = this;

		return trash.find({
			__collection__: this.name,
			...query,
		}, options);
	}


	trashFindOneById(_id: string): Promise<T | null>;

	trashFindOneById(_id: string, options: WithoutProjection<FindOneOptions<T>>): Promise<T | null>;

	trashFindOneById<P>(_id: string, options: FindOneOptions<P extends T ? T : P>): Promise<P | null>;

	async trashFindOneById<P extends T>(_id: string, options?: undefined | WithoutProjection<FindOneOptions<T>> | FindOneOptions<P extends T ? T : P>): Promise<T | P | null> {
		const query = {
			_id,
			__collection__: this.name,
		} as FilterQuery<T>;

		if (!this.trash) {
			return null;
		}
		const { trash } = this;

		if (options === undefined) {
			return trash.findOne(query);
		}
		if (isWithoutProjection(options)) {
			return trash.findOne(query, options);
		}
		return trash.findOne(query, options);
	}
}

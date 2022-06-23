import type {
	ChangeStream,
	Collection,
	CollectionInsertOneOptions,
	CommonOptions,
	Cursor,
	DeleteWriteOpResultObject,
	FilterQuery,
	FindAndModifyWriteOpResultObject,
	FindOneAndUpdateOption,
	FindOneOptions,
	InsertOneWriteOpResult,
	InsertWriteOpResult,
	ObjectId,
	UpdateManyOptions,
	UpdateOneOptions,
	UpdateQuery,
	UpdateWriteOpResult,
	WithId,
	WithoutProjection,
	WriteOpResult,
} from 'mongodb';
import type { RocketChatRecordDeleted } from '@rocket.chat/core-typings';

type EnhancedOmit<T, K> = string | number extends keyof T
	? T // T has indexed type e.g. { _id: string; [k: string]: any; } or it is "any"
	: T extends any
	? Pick<T, Exclude<keyof T, K>> // discriminated unions
	: never;

type ExtractIdType<TSchema> = TSchema extends { _id: infer U } // user has defined a type for _id
	? {} extends U
		? Exclude<U, {}>
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

export interface IBaseModel<T, C extends DefaultFields<T> = undefined> {
	col: Collection<T>;

	findOneAndUpdate(
		query: FilterQuery<T>,
		update: UpdateQuery<T> | T,
		options?: FindOneAndUpdateOption<T>,
	): Promise<FindAndModifyWriteOpResultObject<T>>;
	findOneById(_id: string, options?: WithoutProjection<FindOneOptions<T>> | undefined): Promise<T | null>;
	findOneById<P>(_id: string, options: FindOneOptions<P extends T ? T : P>): Promise<P | null>;
	findOneById<P>(_id: string, options?: any): Promise<T | P | null>;
	findOne(query?: FilterQuery<T> | string, options?: undefined): Promise<T | null>;
	findOne(query: FilterQuery<T> | string, options: WithoutProjection<FindOneOptions<T>>): Promise<T | null>;
	findOne<P>(query: FilterQuery<T> | string, options?: any): Promise<T | P | null>;
	find(query?: FilterQuery<T>): Cursor<ResultFields<T, C>>;
	find(query: FilterQuery<T>, options: WithoutProjection<FindOneOptions<T>>): Cursor<ResultFields<T, C>>;
	find<P = T>(query: FilterQuery<T>, options: FindOneOptions<P extends T ? T : P>): Cursor<P>;
	update(
		filter: FilterQuery<T>,
		update: UpdateQuery<T> | Partial<T>,
		options?: UpdateOneOptions & { multi?: boolean },
	): Promise<WriteOpResult>;
	updateOne(
		filter: FilterQuery<T>,
		update: UpdateQuery<T> | Partial<T>,
		options?: UpdateOneOptions & { multi?: boolean },
	): Promise<UpdateWriteOpResult>;
	updateMany(filter: FilterQuery<T>, update: UpdateQuery<T> | Partial<T>, options?: UpdateManyOptions): Promise<UpdateWriteOpResult>;
	insertMany(docs: Array<InsertionModel<T>>, options?: CollectionInsertOneOptions): Promise<InsertWriteOpResult<WithId<T>>>;
	insertOne(doc: InsertionModel<T>, options?: CollectionInsertOneOptions): Promise<InsertOneWriteOpResult<WithId<T>>>;
	removeById(_id: string): Promise<DeleteWriteOpResultObject>;
	deleteOne(filter: FilterQuery<T>, options?: CommonOptions & { bypassDocumentValidation?: boolean }): Promise<DeleteWriteOpResultObject>;
	deleteMany(filter: FilterQuery<T>, options?: CommonOptions): Promise<DeleteWriteOpResultObject>;
	trashFind<P extends RocketChatRecordDeleted<T>>(
		query: FilterQuery<RocketChatRecordDeleted<T>>,
		options: FindOneOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Cursor<RocketChatRecordDeleted<T>> | undefined;
	trashFindOneById(_id: string): Promise<RocketChatRecordDeleted<T> | null>;
	trashFindOneById(
		_id: string,
		options: WithoutProjection<RocketChatRecordDeleted<T>>,
	): Promise<RocketChatRecordDeleted<RocketChatRecordDeleted<T>> | null>;
	trashFindOneById<P>(
		_id: string,
		options: FindOneOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Promise<P | null>;
	trashFindOneById<P extends RocketChatRecordDeleted<T>>(
		_id: string,
		options?:
			| undefined
			| WithoutProjection<RocketChatRecordDeleted<T>>
			| FindOneOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Promise<RocketChatRecordDeleted<P> | null>;
	trashFindDeletedAfter(deletedAt: Date): Cursor<RocketChatRecordDeleted<T>>;
	trashFindDeletedAfter(
		deletedAt: Date,
		query: FilterQuery<RocketChatRecordDeleted<T>>,
		options: WithoutProjection<RocketChatRecordDeleted<T>>,
	): Cursor<RocketChatRecordDeleted<T>>;
	trashFindDeletedAfter<P = RocketChatRecordDeleted<T>>(
		deletedAt: Date,
		query: FilterQuery<P>,
		options: FindOneOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Cursor<RocketChatRecordDeleted<P>>;

	trashFindDeletedAfter<P = RocketChatRecordDeleted<T>>(
		deletedAt: Date,
		query?: FilterQuery<RocketChatRecordDeleted<T>>,
		options?:
			| WithoutProjection<RocketChatRecordDeleted<T>>
			| FindOneOptions<P extends RocketChatRecordDeleted<T> ? RocketChatRecordDeleted<T> : P>,
	): Cursor<RocketChatRecordDeleted<T>>;

	watch(pipeline?: object[]): ChangeStream<T>;
}

import type { Collection, Filter, WithId } from 'mongodb';
import mapKeys from 'map-keys-deep-lodash';

import type { IDependencyContainerReader } from '../../dependency-injection';
import { DBRepository } from '../definition';
import type { DBEntity, DBIncludeFields, DBReadItemsParams, IDBBasicWriter } from '../definition';
import type { IMongoDBInteractor } from './definition';

const flipMappingObject = (data: Record<string, string>): Record<string, string> => Object.fromEntries(
	Object
		.entries(data)
		.map(([key, value]) => [value, key])
);

export abstract class MongoDBBaseRepository<T extends DBEntity>
	extends DBRepository<IMongoDBInteractor>
	implements IDBBasicWriter {
	protected collection: Collection;

	public constructor(collectionName: string, dbAdapter: IMongoDBInteractor, dependencyContainerReader: IDependencyContainerReader) {
		super(collectionName, dbAdapter, dependencyContainerReader);
		this.collection = this.dbAdapter.collection(collectionName);
	}

	public abstract fieldsMapping(): Record<string, string>;

	protected convertFromDB<TProjection>(record: WithId<T>): TProjection {
		const mapping = this.fieldsMapping();
		const availableKeys = Object.keys(mapping);

		return mapKeys(record, (_: any, key: string) => {
			if (availableKeys.includes(key)) {
				return mapping[key];
			}

			return key;
		});
	}

	protected convertToDB<TProjection extends Record<string, any>>(projection: TProjection): T {
		const mapping = flipMappingObject(this.fieldsMapping());
		const availableKeys = Object.keys(mapping);

		return mapKeys(projection, (_: any, key: string) => {
			if (availableKeys.includes(key)) {
				return mapping[key];
			}

			return key;
		});
	}

	public async insertOne<TInsert>(item: TInsert): Promise<void> {
		await this.collection.insertOne(item as any);
	}

	public async insertMany<TInsert>(items: TInsert[]): Promise<void> {
		await this.collection.insertMany(items as any[]);
	}

	public async updateOneById<TUpdate>(_id: string, item: TUpdate): Promise<void> {
		await this.collection.updateOne({ _id }, item as any); // TODO: fix type
	}

	public async deleteOneById(_id: string): Promise<void> {
		await this.collection.deleteOne({ _id });
	}

	public async findOneById<TReturn>(id: string, options?: DBIncludeFields): Promise<TReturn | null> {
		return this.collection.findOne({ _id: id } as Filter<T>, { projection: options?.fields }) as unknown as TReturn;
	}

	public async findAll<TReturn>(options?: DBReadItemsParams): Promise<TReturn[]> {
		return this.collection.find({}, {
			skip: options?.offset,
			limit: options?.count,
			sort: options?.sort,
			projection: options?.fields,
		},) as unknown as TReturn[];
	}

	public async countAllDocuments(): Promise<number> {
		return this.collection.countDocuments();
	}
}

import { type IDBBasicReader, type IDBConnectionReaderFactory, type DBEntity, type DBReadItemsParams, DBIncludeFields, DBBasicReader } from '../definition';
import type { IMongoDBReaderInteractor, ReadOnlyCollection } from './definition';
import { IDependencyContainerReader } from '../../dependency-injection';

export abstract class MongoDBBaseReader extends DBBasicReader<IMongoDBReaderInteractor> {

}

class MongoDBConnectionBasicReader implements IDBBasicReader {
	constructor(protected collection: ReadOnlyCollection<DBEntity>) { }

	public async findOneById<TReturn>(id: string, options?: DBIncludeFields): Promise<TReturn | null> {
		return this.collection.findOne({ _id: id } as any, { projection: options?.fields }) as unknown as TReturn;
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

export class MongoDBConnectionReaderFactory implements IDBConnectionReaderFactory {
	// TODO: fix this type, it must be generic
	constructor(protected dbAdapter: IMongoDBReaderInteractor, protected dependencyContainerReader: IDependencyContainerReader) { }

	public createBasicReaderForEntity(entity: new (...args: any[]) => DBEntity): IDBBasicReader {
		const collection = this.dbAdapter.collection((entity as unknown as typeof DBEntity).getStorageName());

		return new MongoDBConnectionBasicReader(collection as any);
	}
}

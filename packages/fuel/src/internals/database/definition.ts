import type { IDependencyContainerReader } from '../dependency-injection';
import type { IMongoDBInteractor, IMongoDBReaderInteractor } from './mongodb/definition';

export type DBPaginationParams = {
	count?: number;
	offset?: number;
};

export type DBSortParams = {
	sort?: {
		[key: string]: 'asc' | 'desc';
	};
};

export type DBIncludeFields = {
	fields?: {
		[key: string]: boolean;
	};
};

export type DBReadItemsParams = DBPaginationParams & DBSortParams & DBIncludeFields;

export interface IDBBasicReader {
	findOneById<TReturn>(id: string, options?: DBReadItemsParams): Promise<TReturn | undefined | null>;
	findAll<TReturn>(options?: DBReadItemsParams): Promise<TReturn[]>;
	countAllDocuments(): Promise<number>;
}

export interface IDBBasicWriter extends IDBBasicReader {
	insertOne<TInsert>(item: TInsert): Promise<void>;
	insertMany<TInsert>(items: TInsert[]): Promise<void>;
	updateOneById<TUpdate>(id: string, item: TUpdate): Promise<void>;
	deleteOneById(id: string): Promise<void>;
}

export interface IDBConnectionReaderFactory {
	createBasicReaderForEntity(entity: new (...args: any[]) => DBEntity): IDBBasicReader;
}

export abstract class DBRepository<TDBAdapter> {
	public constructor(protected storageName: string, protected dbAdapter: TDBAdapter, protected dependencyContainerReader: IDependencyContainerReader) { }

	public static collectionName(): string {
		throw new Error('collectionName not implemented');
	}
}

// TODO: fix this type, it must be generic
export abstract class DBBasicReader<TDBAdapter extends IMongoDBReaderInteractor> {
	public constructor(protected storageName: string, protected dbAdapter: TDBAdapter, protected dependencyContainerReader: IDependencyContainerReader) { }

	public static collectionName(): string {
		throw new Error('collectionName not implemented');
	}
}

export abstract class DBEntity {
	public abstract _id: string;

	public static getStorageName(): string {
		throw new Error('DBEntity getStorageName() not implemented');
	}
}

export type DBCredentials = {
	database: string;
	user: string;
	password: string;
	databaseHost: string;
	databasePort: string;
};

export type DBUrlCredentials = {
	url: string;
	database: string;
};

export interface IDBDriver {
	connectWithURL(params: DBUrlCredentials): Promise<void>;

	connectWithCredentials(params: DBCredentials): Promise<void>;

	getConnection<T>(): T;

	getIDBInteractor(): IMongoDBInteractor; // TODO: do not tie with mongodb

	getIDBReaderInteractor(): IMongoDBReaderInteractor; // TODO: do not tie with mongodb
}

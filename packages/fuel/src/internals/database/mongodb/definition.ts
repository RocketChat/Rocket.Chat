import type { Collection, CollectionOptions, Db, Document } from 'mongodb';

export type ReadOnlyCollection<TSchema extends Document> = {
	aggregate: InstanceType<typeof Collection<TSchema>>['aggregate']; // TODO: Fix this types because they are not returning the cursor, we resolve the cursor.toArray() inside the driver
	collectionName: InstanceType<typeof Collection<TSchema>>['collectionName'];
	count: InstanceType<typeof Collection<TSchema>>['count'];
	countDocuments: InstanceType<typeof Collection<TSchema>>['countDocuments'];
	distinct: InstanceType<typeof Collection<TSchema>>['distinct'];
	estimatedDocumentCount: InstanceType<typeof Collection<TSchema>>['estimatedDocumentCount'];
	find: InstanceType<typeof Collection<TSchema>>['find']; // TODO: Fix this types because they are not returning the cursor, we resolve the cursor.toArray() inside the driver
	findOne: InstanceType<typeof Collection<TSchema>>['findOne'];
	hint: InstanceType<typeof Collection<TSchema>>['hint'];
	indexExists: InstanceType<typeof Collection<TSchema>>['indexExists'];
	listIndexes: InstanceType<typeof Collection<TSchema>>['listIndexes'];
	indexInformation: InstanceType<typeof Collection<TSchema>>['indexInformation'];
	indexes: InstanceType<typeof Collection<TSchema>>['indexes'];
	watch: InstanceType<typeof Collection<TSchema>>['watch'];
	stats: InstanceType<typeof Collection<TSchema>>['stats'];
};

export interface IMongoDBReaderInteractor {
	aggregate: InstanceType<typeof Db>['aggregate']; // TODO: Fix this types because they are not returning the cursor, we resolve the cursor.toArray() inside the driver
	collection<TSchema extends Document>(name: string, options?: CollectionOptions): ReadOnlyCollection<TSchema>;
	watch: InstanceType<typeof Db>['watch'];
	listCollections: InstanceType<typeof Db>['listCollections']; // TODO: Fix this types because they are not returning the cursor, we resolve the cursor.toArray() inside the driver
	stats: InstanceType<typeof Db>['stats'];
	readConcern: InstanceType<typeof Db>['readConcern'];
	readPreference: InstanceType<typeof Db>['readPreference'];
	secondaryOk: InstanceType<typeof Db>['secondaryOk'];
}

export interface IMongoDBInteractor extends IMongoDBReaderInteractor {
	createCollection: InstanceType<typeof Db>['createCollection'];
	collection<TSchema extends Document>(name: string, options?: CollectionOptions): InstanceType<typeof Collection<TSchema>>; // TODO: Fix this types because they are not returning the cursor, we resolve the cursor.toArray() inside the driver
	createIndex: InstanceType<typeof Db>['createIndex'];
	dropCollection: InstanceType<typeof Db>['dropCollection'];
	profilingLevel: InstanceType<typeof Db>['profilingLevel'];
	writeConcern: InstanceType<typeof Db>['writeConcern'];
}

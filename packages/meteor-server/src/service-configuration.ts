import type { Collection, Document, Filter, FindOptions, UpdateFilter } from 'mongodb';

import { MongoInternals } from './mongo.ts';

/**
 * Server-side ServiceConfiguration backed directly by the raw driver over the
 * same collection Meteor's accounts uses. Only the Mongo.Collection surface
 * Rocket.Chat calls is provided.
 */

const COLLECTION_NAME = 'meteor_accounts_loginServiceConfiguration';

const collection = (): Collection<Document> => MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection(COLLECTION_NAME);

const configurations = {
	async findOneAsync(selector: Filter<Document> = {}, options?: FindOptions): Promise<Document | null> {
		return collection().findOne(selector, options);
	},

	find(selector: Filter<Document> = {}, options?: FindOptions) {
		const cursor = collection().find(selector, options);
		return {
			fetchAsync: () => cursor.toArray(),
			forEachAsync: (callback: (doc: Document) => void | Promise<void>) => cursor.forEach((doc) => void callback(doc)),
			countAsync: () => collection().countDocuments(selector),
			[Symbol.asyncIterator]: () => cursor[Symbol.asyncIterator](),
		};
	},

	async upsertAsync(selector: Filter<Document>, modifier: UpdateFilter<Document>): Promise<{ numberAffected: number }> {
		const result = await collection().updateOne(selector, modifier, { upsert: true });
		return { numberAffected: result.modifiedCount + result.upsertedCount };
	},

	async updateAsync(selector: Filter<Document>, modifier: UpdateFilter<Document>): Promise<number> {
		const result = await collection().updateMany(selector, modifier);
		return result.modifiedCount;
	},

	async insertAsync(doc: Document): Promise<string> {
		const result = await collection().insertOne(doc);
		return String(result.insertedId);
	},

	async removeAsync(selector: Filter<Document>): Promise<number> {
		const result = await collection().deleteMany(selector);
		return result.deletedCount;
	},
};

export const ServiceConfiguration = {
	configurations,
};

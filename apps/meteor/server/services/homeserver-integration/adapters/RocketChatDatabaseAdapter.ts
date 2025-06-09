import { injectable } from 'tsyringe';
import { MongoInternals } from 'meteor/mongo';
import type { Db, Collection } from 'mongodb';

/**
 * Adapter to provide homeserver with database access
 * Uses Rocket.Chat's MongoDB connection
 */
@injectable()
export class RocketChatDatabaseAdapter {
	private db: Db;
	private readonly MATRIX_COLLECTION_PREFIX = 'rocketchat_matrix_';

	constructor() {
		// Get Rocket.Chat's MongoDB database
		this.db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
	}

	/**
	 * Get a collection for Matrix data
	 * Prefixed to avoid conflicts with Rocket.Chat collections
	 */
	getCollection<T = any>(name: string): Collection<T> {
		return this.db.collection<T>(`${this.MATRIX_COLLECTION_PREFIX}${name}`);
	}

	/**
	 * Specific collections used by homeserver
	 */
	get events() {
		return this.getCollection('events');
	}

	get rooms() {
		return this.getCollection('rooms');
	}

	get transactions() {
		return this.getCollection('transactions');
	}

	get keys() {
		return this.getCollection('keys');
	}

	get servers() {
		return this.getCollection('servers');
	}
}
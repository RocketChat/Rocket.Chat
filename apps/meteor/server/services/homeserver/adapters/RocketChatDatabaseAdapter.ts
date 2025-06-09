import { injectable, singleton } from 'tsyringe';
import { Rooms, Users, Messages } from '@rocket.chat/models';
import type { Collection } from 'mongodb';

/**
 * Adapter to provide homeserver services access to Rocket.Chat's database
 * This allows the homeserver module to store Matrix federation data
 * alongside Rocket.Chat data
 */
@injectable()
@singleton()
export class RocketChatDatabaseAdapter {
	// Prefix for Matrix-specific collections to avoid conflicts
	private readonly MATRIX_COLLECTION_PREFIX = 'matrix_';

	/**
	 * Get a MongoDB collection for Matrix data
	 * Creates collections with 'matrix_' prefix to keep them separate
	 */
	async getCollection(name: string): Promise<Collection> {
		const db = await this.getDatabase();
		return db.collection(`${this.MATRIX_COLLECTION_PREFIX}${name}`);
	}

	/**
	 * Get the MongoDB database instance from Rocket.Chat
	 */
	private async getDatabase() {
		// Access Rocket.Chat's MongoDB connection
		// This would use the same connection as Rocket.Chat
		const roomsCollection = await Rooms.col;
		return roomsCollection.database;
	}

	/**
	 * Matrix-specific collections
	 */
	async getEventsCollection(): Promise<Collection> {
		return this.getCollection('events');
	}

	async getRoomsCollection(): Promise<Collection> {
		return this.getCollection('rooms');
	}

	async getTransactionsCollection(): Promise<Collection> {
		return this.getCollection('transactions');
	}

	async getFederatedUsersCollection(): Promise<Collection> {
		return this.getCollection('federated_users');
	}

	/**
	 * Bridge methods to sync data between Rocket.Chat and Matrix
	 */
	async linkRocketChatRoomToMatrix(rcRoomId: string, matrixRoomId: string): Promise<void> {
		await Rooms.setFederationId(rcRoomId, matrixRoomId);
	}

	async linkRocketChatUserToMatrix(rcUserId: string, matrixUserId: string): Promise<void> {
		await Users.setFederationId(rcUserId, matrixUserId);
	}

	async getRocketChatRoomByMatrixId(matrixRoomId: string): Promise<any> {
		return Rooms.findOneByFederationId(matrixRoomId);
	}

	async getRocketChatUserByMatrixId(matrixUserId: string): Promise<any> {
		return Users.findOneByFederationId(matrixUserId);
	}
}

/**
 * Adapter for homeserver repositories to use Rocket.Chat's database
 */
@injectable()
export class DatabaseConnectionAdapter {
	constructor(private dbAdapter: RocketChatDatabaseAdapter) {}

	async connect(): Promise<void> {
		// No-op: Rocket.Chat already manages the connection
	}

	async disconnect(): Promise<void> {
		// No-op: Rocket.Chat manages the connection
	}

	async getDb(): Promise<any> {
		// Return a proxy object that homeserver repositories can use
		return {
			collection: (name: string) => this.dbAdapter.getCollection(name),
		};
	}
}
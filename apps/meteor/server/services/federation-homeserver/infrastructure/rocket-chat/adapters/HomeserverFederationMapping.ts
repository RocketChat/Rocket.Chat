import type { Db } from 'mongodb';

export interface IHomeserverFederationMapping {
	_id?: string;
	type: 'room' | 'user' | 'message';
	internalId: string; // Rocket.Chat ID
	externalId: string; // Homeserver ID
	homeserverDomain: string;
	_createdAt?: Date;
	_updatedAt?: Date;
}

// Collection to store all federation ID mappings
export class HomeserverFederationMappingCollection {
	private collectionName = 'rocketchat_homeserver_federation_mappings';

	async createIndex(db: Db): Promise<void> {
		const collection = db.collection(this.collectionName);
		
		// Create compound indexes for efficient lookups
		await collection.createIndex({ type: 1, internalId: 1 }, { unique: true });
		await collection.createIndex({ type: 1, externalId: 1 }, { unique: true });
		await collection.createIndex({ homeserverDomain: 1 });
	}

	async createOrUpdate(mapping: IHomeserverFederationMapping, db: Db): Promise<void> {
		const collection = db.collection<IHomeserverFederationMapping>(this.collectionName);
		
		await collection.updateOne(
			{ type: mapping.type, internalId: mapping.internalId },
			{
				$set: {
					...mapping,
					_updatedAt: new Date(),
				},
				$setOnInsert: {
					_createdAt: new Date(),
				},
			},
			{ upsert: true },
		);
	}

	async findByInternalId(type: 'room' | 'user' | 'message', internalId: string, db: Db): Promise<IHomeserverFederationMapping | null> {
		const collection = db.collection<IHomeserverFederationMapping>(this.collectionName);
		return collection.findOne({ type, internalId });
	}

	async findByExternalId(type: 'room' | 'user' | 'message', externalId: string, db: Db): Promise<IHomeserverFederationMapping | null> {
		const collection = db.collection<IHomeserverFederationMapping>(this.collectionName);
		return collection.findOne({ type, externalId });
	}

	async removeByInternalId(type: 'room' | 'user' | 'message', internalId: string, db: Db): Promise<void> {
		const collection = db.collection<IHomeserverFederationMapping>(this.collectionName);
		await collection.deleteOne({ type, internalId });
	}
}

export const HomeserverFederationMapping = new HomeserverFederationMappingCollection();
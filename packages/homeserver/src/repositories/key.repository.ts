import { injectable } from "tsyringe";
import { Collection } from "mongodb";
import { DatabaseConnectionService } from "../services/database-connection.service";

type Key = {
	origin: string;
	key_id: string;
	public_key: string;
	valid_until: Date;
};

@injectable()
export class KeyRepository {
	private collection: Collection<Key> | null = null;

	constructor(private readonly dbConnection: DatabaseConnectionService) {
		this.getCollection();
	}

	private async getCollection(): Promise<Collection<Key>> {
		const db = await this.dbConnection.getDb();
		this.collection = db.collection<Key>('keys');
		return this.collection;
	}

	async getValidPublicKeyFromLocal(
		origin: string,
		keyId: string,
	): Promise<string | undefined> {
		const collection = await this.getCollection();
		const key = await collection.findOne({
			origin,
			key_id: keyId,
			valid_until: { $gt: new Date() },
		});

		return key?.public_key;
	}

	async storePublicKey(
		origin: string,
		keyId: string,
		publicKey: string,
		validUntil?: Date,
	): Promise<void> {
		const collection = await this.getCollection();
		await collection.updateOne(
			{ origin, key_id: keyId },
			{
				$set: {
					origin,
					key_id: keyId,
					public_key: publicKey,
					valid_until: validUntil || new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours validity
					updated_at: new Date(),
				},
			},
			{ upsert: true },
		);
	}
}

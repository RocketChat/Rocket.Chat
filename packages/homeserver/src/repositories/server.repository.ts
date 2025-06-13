import { injectable } from "tsyringe";
import { Collection } from "mongodb";
import { DatabaseConnectionService } from "../services/database-connection.service";

type Server = {
	name: string;
	keys: {
		[key: string]: {
			key: string;
			validUntil: number;
		};
	};
};

@injectable()
export class ServerRepository {
	private collection: Collection<Server> | null = null;

	constructor(private readonly dbConnection: DatabaseConnectionService) {
		this.getCollection();
	}

	private async getCollection(): Promise<Collection<Server>> {
		const db = await this.dbConnection.getDb();
		this.collection = db.collection<Server>('servers');
		return this.collection;
	}

	async getValidPublicKeyFromLocal(
		origin: string,
		key: string,
	): Promise<string | undefined> {
		const collection = await this.getCollection();
		const server = await collection.findOne({ name: origin });
		return server?.keys?.[key]?.key;
	}

	async storePublicKey(
		origin: string,
		key: string,
		value: string,
		validUntil: number,
	): Promise<void> {
		const collection = await this.getCollection();
		await collection.findOneAndUpdate(
			{ name: origin },
			{
				$set: {
					[`keys.${key}`]: {
						key: value,
						validUntil,
					},
				},
			},
			{ upsert: true },
		);
	}
}

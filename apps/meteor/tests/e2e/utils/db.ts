import { UsersSessionsRaw, UsersRaw } from '@rocket.chat/models';
import { MongoClient } from 'mongodb';

import { URL_MONGODB } from '../config/constants';

export class DatabaseClient {
	client: MongoClient;

	users: UsersRaw;

	usersSessions: UsersSessionsRaw;

	private constructor(client: MongoClient) {
		this.client = client;
		this.users = new UsersRaw(client.db());
		this.usersSessions = new UsersSessionsRaw(client.db());
	}

	static async connect(): Promise<DatabaseClient> {
		return new DatabaseClient(await MongoClient.connect(URL_MONGODB));
	}

	async close(): Promise<void> {
		await this.client.close();
	}
}

import { MongoClient, Collection } from 'mongodb';

type MongoHelperConfig = {
	uri: null | string;
	client: null | MongoClient;
	connect(uri: string): Promise<void>;
	disconnect(): Promise<void>;
	getCollection(name: string): Promise<Collection>;
};

export const MongoHelper: MongoHelperConfig = {
	uri: null,
	client: null,
	async connect(uri: string) {
		this.uri = uri;
		this.client = await MongoClient.connect(uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
	},
	async disconnect() {
		if (this.client) {
			this.client.close();
			this.client = null;
		}
	},
	async getCollection(name: string) {
		if (this.client) {
			if (!this.client.isConnected() && this.uri) {
				await this.connect(this.uri);
			}
			return this.client.db().collection(name);
		}
		return {} as Collection;
	},
};

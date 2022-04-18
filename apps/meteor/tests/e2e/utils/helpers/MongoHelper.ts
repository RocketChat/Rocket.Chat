import { MongoClient, Collection } from 'mongodb';

export const MongoHelper = {
	uri: null as unknown as string,
	client: null as unknown as MongoClient,
	async connect(uri: string): Promise<void> {
		this.uri = uri;
		this.client = await MongoClient.connect(uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
	},
	async disconnect(): Promise<void> {
		this.client.close();
		this.client = null;
	},
	async getCollection(name: string): Promise<Collection> {
		if (!this.client?.isConnected()) {
			await this.connect(this.uri);
		}
		return this.client.db().collection(name);
	},
	map(collection: any): any {
		const { _id, ...collectionWithoutId } = collection;
		return Object.assign({}, collectionWithoutId, { id: _id });
	},
};

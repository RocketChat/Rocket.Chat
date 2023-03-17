import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { AppMetadataStorage } from '@rocket.chat/apps-engine/server/storage';
import type { IAppsModel } from '@rocket.chat/model-typings';

export class AppRealStorage extends AppMetadataStorage {
	constructor(private db: IAppsModel) {
		super('mongodb');
		console.log('what is appsmodel', db);
	}

	public async create(item: IAppStorageItem): Promise<IAppStorageItem> {
		item.createdAt = new Date();
		item.updatedAt = new Date();

		const doc = await this.db.findOne({ $or: [{ id: item.id }, { 'info.nameSlug': item.info.nameSlug }] });

		if (doc) {
			throw new Error('App already exists.');
		}

		const { insertedId } = await this.db.insertOne(item);
		item._id = insertedId;

		return item;
	}

	public retrieveOne(id: string): Promise<IAppStorageItem> {
		return this.db.findOne({ $or: [{ _id: id }, { id }] });
	}

	public async retrieveAll(): Promise<Map<string, IAppStorageItem>> {
		const docs = await this.db.find({}).toArray();

		const items = new Map();

		docs.forEach((i: IAppStorageItem) => items.set(i.id, i));

		return items;
	}

	public async update(item: IAppStorageItem): Promise<IAppStorageItem> {
		await this.db.updateOne({ id: item.id }, item);
		return this.retrieveOne(item.id);
	}

	public async remove(id: string): Promise<{ success: boolean }> {
		this.db.removeById(id);
		return { success: true };
	}
}

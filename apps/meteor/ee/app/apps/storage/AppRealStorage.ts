import type { IAppStorageItem } from '@rocket.chat/core-typings';
import { AppMetadataStorage } from '@rocket.chat/apps-engine/server/storage';
import type { IAppsModel } from '@rocket.chat/model-typings';

export class AppRealStorage extends AppMetadataStorage {
	constructor(private db: IAppsModel) {
		super('mongodb');
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

	public async retrieveOne(id: string): Promise<IAppStorageItem | null> {
		return this.db.findOne({ $or: [{ _id: id }, { id }] });
	}

	public async retrieveAll(): Promise<Map<string, IAppStorageItem>> {
		const docs = await this.db.find({}).toArray();

		const items = new Map();

		docs.forEach((i) => items.set(i.id, i));

		return items;
	}

	public async update(item: IAppStorageItem): Promise<IAppStorageItem> {
		await this.db.updateOne({ id: item.id }, { $set: item });

		const updatedItem = await this.retrieveOne(item.id);

		if (!updatedItem) {
			throw new Error(`Could not find stored app ${item.id}`);
		}

		return updatedItem;
	}

	public async remove(id: string): Promise<{ success: boolean }> {
		await this.db.removeById(id);

		return { success: true };
	}
}

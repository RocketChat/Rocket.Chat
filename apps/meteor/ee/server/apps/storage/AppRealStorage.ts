import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { AppMetadataStorage } from '@rocket.chat/apps-engine/server/storage';
import type { Apps } from '@rocket.chat/models';

export class AppRealStorage extends AppMetadataStorage {
	constructor(private db: typeof Apps) {
		super('mongodb');
	}

	public async create(item: IAppStorageItem): Promise<IAppStorageItem> {
		item.createdAt = new Date();
		item.updatedAt = new Date();

		let doc;

		try {
			doc = await this.db.findOne({ $or: [{ id: item.id }, { 'info.nameSlug': item.info.nameSlug }] });
		} catch (e) {
			throw e;
		}

		if (doc) {
			new Error('App already exists.');
		}

		try {
			const id = (await this.db.insertOne(item)).insertedId as unknown as string;
			item._id = id;

			return item;
		} catch (e) {
			throw e;
		}
	}

	public async retrieveOne(id: string): Promise<IAppStorageItem> {
		let doc;

		try {
			doc = await this.db.findOne({ $or: [{ _id: id }, { id }] });
		} catch (e) {
			throw e;
		}

		return doc;
	}

	public async retrieveAll(): Promise<Map<string, IAppStorageItem>> {
		let docs: Array<IAppStorageItem>;

		try {
			docs = await this.db.find({}).toArray();
		} catch (e) {
			throw e;
		}

		const items = new Map();

		docs.forEach((i) => items.set(i.id, i));

		return items;
	}

	public async update(item: IAppStorageItem): Promise<IAppStorageItem> {
		try {
			await this.db.updateOne({ id: item.id }, { $set: item });
			return this.retrieveOne(item.id);
		} catch (e) {
			throw e;
		}
	}

	public async remove(id: string): Promise<{ success: boolean }> {
		try {
			await this.db.deleteOne({ id });
			return { success: true };
		} catch (e) {
			throw e;
		}
	}
}

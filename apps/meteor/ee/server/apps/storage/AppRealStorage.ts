import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { AppMetadataStorage } from '@rocket.chat/apps-engine/server/storage';
import type { Apps } from '@rocket.chat/models';
import { removeEmpty } from '@rocket.chat/tools';
import type { UpdateFilter } from 'mongodb';

export class AppRealStorage extends AppMetadataStorage {
	constructor(private db: typeof Apps) {
		super('mongodb');
	}

	public async create(item: IAppStorageItem): Promise<IAppStorageItem> {
		item.createdAt = new Date();
		item.updatedAt = new Date();

		const doc = await this.db.findOne({ $or: [{ id: item.id }, { 'info.nameSlug': item.info.nameSlug }] });

		if (doc) {
			throw new Error('App already exists.');
		}

		const nonEmptyItem = removeEmpty(item);
		const id = (await this.db.insertOne(nonEmptyItem)).insertedId as unknown as string;
		nonEmptyItem._id = id;

		return nonEmptyItem;
	}

	public async retrieveOne(id: string): Promise<IAppStorageItem> {
		return this.db.findOne({ $or: [{ _id: id }, { id }] });
	}

	public async retrieveAll(): Promise<Map<string, IAppStorageItem>> {
		const docs = await this.db.find({}).toArray();
		const items = new Map();

		docs.forEach((i) => items.set(i.id, i));

		return items;
	}

	public async retrieveAllPrivate(): Promise<Map<string, IAppStorageItem>> {
		const docs = await this.db.find({ installationSource: 'private' }).toArray();
		const items = new Map();

		docs.forEach((i) => items.set(i.id, i));

		return items;
	}

	public async update(item: IAppStorageItem): Promise<IAppStorageItem> {
		const updateQuery: UpdateFilter<IAppStorageItem> = {
			$set: item,
		};

		// Note: This is really important, since we currently store the permissionsGranted as null if none are present
		//       in the App's manifest. So, if there was a permissionGranted and it was removed, we must see the app as having
		//       no permissionsGranted at all (which means default permissions). So we must actively unset the field.
		if (!item.permissionsGranted) {
			updateQuery.$unset = { permissionsGranted: 1 };
		}

		return this.db.findOneAndUpdate({ id: item.id, _id: item._id }, updateQuery, { returnDocument: 'after' });
	}

	public async remove(id: string): Promise<{ success: boolean }> {
		await this.db.deleteOne({ id });
		return { success: true };
	}
}

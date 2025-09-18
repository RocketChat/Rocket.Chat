import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import type { ISetting } from '@rocket.chat/apps-engine/definition/settings';
import type { IMarketplaceInfo } from '@rocket.chat/apps-engine/server/marketplace';
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

	public async remove(id: string): Promise<{ success: boolean }> {
		await this.db.deleteOne({ id });
		return { success: true };
	}

	public async updatePartialAndReturnDocument(item: IAppStorageItem, { unsetPermissionsGranted = false } = {}): Promise<IAppStorageItem> {
		console.log('updatePartialAndReturnDocument', item, unsetPermissionsGranted);

		const updateQuery: UpdateFilter<IAppStorageItem> = {
			$set: item,
		};

		if (unsetPermissionsGranted) {
			delete item.permissionsGranted;
			updateQuery.$unset = { permissionsGranted: 1 };
		}

		return this.db.findOneAndUpdate({ _id: item._id }, updateQuery, { returnDocument: 'after' });
	}

	public async updateStatus(_id: string, status: AppStatus): Promise<boolean> {
		console.log('updateStatus', _id, status);

		const result = await this.db.updateOne({ _id }, { $set: { status } });
		return result.modifiedCount > 0;
	}

	public async updateSetting(_id: string, setting: ISetting): Promise<boolean> {
		console.log('updateSetting', _id, setting);

		const result = await this.db.updateOne({ _id }, { $set: { [`settings.${setting.id}`]: setting } });

		return result.modifiedCount > 0;
	}

	public async updateAppInfo(_id: string, info: IAppInfo): Promise<boolean> {
		console.log('updateAppInfo', _id, info);

		const result = await this.db.updateOne({ _id }, { $set: { info } });
		return result.modifiedCount > 0;
	}

	public async updateMarketplaceInfo(_id: string, marketplaceInfo: IMarketplaceInfo[]): Promise<boolean> {
		console.log('updateMarketplaceInfo', _id, marketplaceInfo);

		const result = await this.db.updateOne({ _id }, { $set: { marketplaceInfo } });
		return result.modifiedCount > 0;
	}
}

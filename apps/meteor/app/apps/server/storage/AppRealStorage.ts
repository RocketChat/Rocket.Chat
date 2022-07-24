import { AppMetadataStorage, IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import { AppsModel } from '../../../models/server/models/apps-model';

export class AppRealStorage extends AppMetadataStorage {
	constructor(private db: AppsModel) {
		super('mongodb');
	}

	public create(item: IAppStorageItem): Promise<IAppStorageItem> {
		return new Promise((resolve, reject) => {
			item.createdAt = new Date();
			item.updatedAt = new Date();

			let doc;

			try {
				doc = this.db.findOne({ $or: [{ id: item.id }, { 'info.nameSlug': item.info.nameSlug }] });
			} catch (e) {
				return reject(e);
			}

			if (doc) {
				return reject(new Error('App already exists.'));
			}

			try {
				const id = this.db.insert(item);
				item._id = id;

				resolve(item);
			} catch (e) {
				reject(e);
			}
		});
	}

	public retrieveOne(id: string): Promise<IAppStorageItem> {
		return new Promise((resolve, reject) => {
			let doc;

			try {
				doc = this.db.findOne({ $or: [{ _id: id }, { id }] });
			} catch (e) {
				return reject(e);
			}

			resolve(doc);
		});
	}

	public retrieveAll(): Promise<Map<string, IAppStorageItem>> {
		return new Promise((resolve, reject) => {
			let docs: Array<IAppStorageItem>;

			try {
				docs = this.db.find({}).fetch();
			} catch (e) {
				return reject(e);
			}

			const items = new Map();

			docs.forEach((i) => items.set(i.id, i));

			resolve(items);
		});
	}

	public update(item: IAppStorageItem): Promise<IAppStorageItem> {
		return new Promise<string>((resolve, reject) => {
			try {
				this.db.update({ id: item.id }, item);
				resolve(item.id);
			} catch (e) {
				return reject(e);
			}
		}).then(this.retrieveOne.bind(this));
	}

	public remove(id: string): Promise<{ success: boolean }> {
		return new Promise((resolve, reject) => {
			try {
				this.db.remove({ id });
			} catch (e) {
				return reject(e);
			}

			resolve({ success: true });
		});
	}
}

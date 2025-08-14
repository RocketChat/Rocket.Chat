import type { IAppStorageItem } from '../../../src/server/storage';
import { AppMetadataStorage } from '../../../src/server/storage';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/consistent-type-imports
const Datastore = require('@seald-io/nedb') as typeof import('@seald-io/nedb').default;

export class TestsAppStorage extends AppMetadataStorage {
	private db: InstanceType<typeof Datastore>;

	constructor() {
		super('nedb');
		this.db = new Datastore({ filename: 'tests/test-data/dbs/apps.nedb', autoload: true });
		this.db.ensureIndex({ fieldName: 'id', unique: true });
	}

	public create(item: IAppStorageItem): Promise<IAppStorageItem> {
		return new Promise((resolve, reject) => {
			item.createdAt = new Date();
			item.updatedAt = new Date();

			this.db.findOne({ $or: [{ id: item.id }, { 'info.nameSlug': item.info.nameSlug }] }, (err, doc: IAppStorageItem) => {
				if (err) {
					reject(err);
				} else if (doc) {
					reject(new Error('App already exists.'));
				} else {
					this.db.insert(item, (err2, doc2: IAppStorageItem) => {
						if (err2) {
							reject(err2);
						} else {
							resolve(doc2);
						}
					});
				}
			});
		});
	}

	public retrieveOne(id: string): Promise<IAppStorageItem> {
		return new Promise((resolve, reject) => {
			this.db.findOne({ id }, (err, doc: IAppStorageItem) => {
				if (err) {
					reject(err);
				} else if (doc) {
					resolve(doc);
				} else {
					reject(new Error(`No App found by the id: ${id}`));
				}
			});
		});
	}

	public retrieveAll(): Promise<Map<string, IAppStorageItem>> {
		return new Promise((resolve, reject) => {
			this.db.find({}, (err: Error, docs: Array<IAppStorageItem>) => {
				if (err) {
					reject(err);
				} else {
					const items = new Map<string, IAppStorageItem>();

					docs.forEach((i) => items.set(i.id, i));

					resolve(items);
				}
			});
		});
	}

	public retrieveAllPrivate(): Promise<Map<string, IAppStorageItem>> {
		return new Promise((resolve, reject) => {
			this.db.find({ installationSource: 'private' }, (err: Error, docs: Array<IAppStorageItem>) => {
				if (err) {
					reject(err);
				} else {
					const items = new Map<string, IAppStorageItem>();

					docs.forEach((i) => items.set(i.id, i));

					resolve(items);
				}
			});
		});
	}

	public update(item: IAppStorageItem): Promise<IAppStorageItem> {
		return new Promise((resolve, reject) => {
			this.db.update({ id: item.id }, item, {}, (err, _numOfUpdated: number) => {
				if (err) {
					reject(err);
				} else {
					this.retrieveOne(item.id)
						.then((updated: IAppStorageItem) => resolve(updated))
						.catch((err2: Error) => reject(err2));
				}
			});
		});
	}

	public remove(id: string): Promise<{ success: boolean }> {
		return new Promise((resolve, reject) => {
			this.db.remove({ id }, (err) => {
				if (err) {
					reject(err);
				} else {
					resolve({ success: true });
				}
			});
		});
	}
}

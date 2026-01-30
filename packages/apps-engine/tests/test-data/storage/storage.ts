import type { AppStatus } from '../../../src/definition/AppStatus';
import type { IAppInfo } from '../../../src/definition/metadata';
import type { ISetting } from '../../../src/definition/settings';
import type { IMarketplaceInfo } from '../../../src/server/marketplace';
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

	public updatePartialAndReturnDocument(
		item: Partial<IAppStorageItem>,
		options?: { unsetPermissionsGranted?: boolean },
	): Promise<IAppStorageItem> {
		throw new Error('Method not implemented.');
	}

	public updateStatus(_id: string, status: AppStatus): Promise<boolean> {
		throw new Error('Method not implemented.');
	}

	public updateSetting(_id: string, setting: ISetting): Promise<boolean> {
		throw new Error('Method not implemented.');
	}

	public updateAppInfo(_id: string, info: IAppInfo): Promise<boolean> {
		throw new Error('Method not implemented.');
	}

	public updateMarketplaceInfo(_id: string, marketplaceInfo: IMarketplaceInfo[]): Promise<boolean> {
		throw new Error('Method not implemented.');
	}
}

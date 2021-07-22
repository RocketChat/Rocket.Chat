import { AppSourceStorage, IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

import { AppFileSystemSourceStorage } from './AppFileSystemSourceStorage';
import { AppGridFSSourceStorage } from './AppGridFSSourceStorage';

export class ConfigurableAppSourceStorage extends AppSourceStorage {
	private filesystem: AppFileSystemSourceStorage;

	private gridfs: AppGridFSSourceStorage;

	private storage: AppSourceStorage;

	constructor(storageType: string, filesystemStoragePath?: string) {
		super();

		this.filesystem = new AppFileSystemSourceStorage();
		this.gridfs = new AppGridFSSourceStorage();

		this.setStorage(storageType, filesystemStoragePath);
	}

	public setStorage(type: string, filesystemStoragePath?: string): void {
		switch (type) {
			case 'filesystem':
				this.filesystem.setPath(filesystemStoragePath as string);
				this.storage = this.filesystem;
				break;
			case 'gridfs':
				this.storage = this.gridfs;
				break;
		}
	}

	public async store(item: IAppStorageItem, zip: Buffer): Promise<string> {
		try {
			return this.storage.store(item, zip);
		} catch (err) {
			console.log('wth', err);
			throw err;
		}
	}

	public async fetch(item: IAppStorageItem): Promise<Buffer> {
		return this.storage.fetch(item);
	}

	public async update(item: IAppStorageItem, zip: Buffer): Promise<string> {
		return this.storage.update(item, zip);
	}

	public async remove(item: IAppStorageItem): Promise<void> {
		return this.storage.remove(item);
	}
}

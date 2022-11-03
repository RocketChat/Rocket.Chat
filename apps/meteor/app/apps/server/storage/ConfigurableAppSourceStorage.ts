import type { IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';
import { AppSourceStorage } from '@rocket.chat/apps-engine/server/storage';

import { AppFileSystemSourceStorage } from './AppFileSystemSourceStorage';
import { AppGridFSSourceStorage } from './AppGridFSSourceStorage';

export class ConfigurableAppSourceStorage extends AppSourceStorage {
	private filesystem: AppFileSystemSourceStorage;

	private gridfs: AppGridFSSourceStorage;

	private storage: AppSourceStorage;

	constructor(readonly storageType: string, filesystemStoragePath: string) {
		super();

		this.filesystem = new AppFileSystemSourceStorage();
		this.gridfs = new AppGridFSSourceStorage();

		this.setStorage(storageType);
		this.setFileSystemStoragePath(filesystemStoragePath);
	}

	public setStorage(type: string): void {
		switch (type) {
			case 'filesystem':
				this.storage = this.filesystem;
				break;
			case 'gridfs':
				this.storage = this.gridfs;
				break;
		}
	}

	public setFileSystemStoragePath(path: string): void {
		this.filesystem.setPath(path);
	}

	public async store(item: IAppStorageItem, zip: Buffer): Promise<string> {
		return this.storage.store(item, zip);
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

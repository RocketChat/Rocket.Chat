import { AppSourceStorage } from '@rocket.chat/apps-engine/server/storage';

import { AppFileSystemSourceStorage } from './AppFileSystemSourceStorage';
import { AppGridFSSourceStorage } from './AppGridFSSourceStorage';

export class AppSourceStorageCreator {
	public setSourceStorage(type: string, storagePath?: string): AppSourceStorage {
		let storage: AppSourceStorage;
		switch (type) {
			case 'FileSystem':
				storage = this.createFilesystemSourceStorageInstance(storagePath);
				break;
			case 'GridFS':
				storage = this.createGridfsSourceStorageInstance();
				break;
			default:
				throw new Error(`Invalid App Source Storage type: ${ type }`);
		}

		return storage;
	}

	private createGridfsSourceStorageInstance(): AppSourceStorage {
		return new AppGridFSSourceStorage();
	}

	private createFilesystemSourceStorageInstance(storagePath?: string): AppSourceStorage {
		return new AppFileSystemSourceStorage(storagePath);
	}
}

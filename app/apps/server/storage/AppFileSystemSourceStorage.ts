import { promises as fs } from 'fs';

import { AppSourceStorage, IAppStorageItem } from '@rocket.chat/apps-engine/server/storage';

export class AppFileSystemSourceStorage extends AppSourceStorage {
	constructor(private storagePath: string) {
		super();
	}

	public async store(item: IAppStorageItem, zip: Buffer): Promise<boolean> {
		await fs.writeFile(`${ this.storagePath + item.id }.zip`, zip);

		return true;
	}

	public async fetch(item: IAppStorageItem): Promise<Buffer> {
		return fs.readFile(`${ this.storagePath + item.id }.zip`);
	}

	public async update(id: string, zip: Buffer): Promise<boolean> {
		await fs.writeFile(`${ this.storagePath + id }.zip`, zip);
		return true;
	}

	public async remove(item: IAppStorageItem): Promise<boolean> {
		fs.unlink(`${ this.storagePath + item.id }.zip`);
		return true;
	}
}
